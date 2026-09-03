import { supabase } from "@/integrations/supabase/client";

export interface StockItemMutation {
  product_id: string;
  quantity: number;
}

// Memory cache to avoid repeated 404 network roundtrips for uninstalled RPCs
let rpcBatchSupported: boolean | null = null;
let rpcSingleSupported: boolean | null = null;

/**
 * Fast & resilient Invoice-Level Batch Stock Adjuster.
 * Checks RPC once; if not installed, falls back directly to fast parallel product updates.
 */
export async function adjustStockBatch(
  items: StockItemMutation[],
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE' | 'PURCHASE' | 'SALE_CANCEL' | 'PURCHASE_CANCEL',
  referenceId: string,
  operationId: string
) {
  const validItems = items.filter(i => i.product_id && i.quantity > 0);
  if (validItems.length === 0) return;

  const { data: { user } } = await supabase.auth.getUser();

  if (user && rpcBatchSupported !== false) {
    try {
      const { data, error } = await supabase.rpc('process_invoice_stock_batch_mutation', {
        p_user_id: user.id,
        p_items: validItems,
        p_movement_type: movementType,
        p_reference_type: 'INVOICE',
        p_reference_id: referenceId,
        p_reason: `Batch stock adjustment: ${movementType}`,
        p_operation_id: operationId
      });

      if (!error && data?.success) {
        rpcBatchSupported = true;
        return;
      }

      if (error && (error.code === '42883' || error.code === 'PGRST202' || error.message?.includes('function'))) {
        rpcBatchSupported = false;
      }
    } catch {
      rpcBatchSupported = false;
    }
  }

  // Fast direct stock mutation without waiting on non-existent RPCs
  await Promise.all(
    validItems.map(item => {
      const itemKey = `${operationId}:${item.product_id}:${movementType}`;
      return adjustStock(item.product_id, item.quantity, movementType, referenceId, itemKey);
    })
  );
}

/**
 * Single-product stock adjuster with fast column fallback.
 */
export async function adjustStock(
  productId: string,
  quantity: number,
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE' | 'PURCHASE' | 'SALE_CANCEL' | 'PURCHASE_CANCEL' = 'ADJUSTMENT',
  referenceId?: string,
  idempotencyKey?: string
) {
  if (!productId || quantity === 0) return;

  const { data: { user } } = await supabase.auth.getUser();

  if (user && rpcSingleSupported !== false) {
    try {
      const key = idempotencyKey || `stock-${user.id}-${productId}-${movementType}-${referenceId || 'manual'}-${quantity}`;
      const { data, error } = await supabase.rpc('process_invoice_stock_mutation', {
        p_user_id: user.id,
        p_product_id: productId,
        p_quantity: quantity,
        p_movement_type: movementType,
        p_reference_type: 'INVOICE',
        p_reference_id: referenceId ?? null,
        p_reason: `Stock adjustment: ${movementType}`,
        p_idempotency_key: key
      });

      if (!error && data?.success) {
        rpcSingleSupported = true;
        return;
      }

      if (error && (error.code === '42883' || error.code === 'PGRST202' || error.message?.includes('function'))) {
        rpcSingleSupported = false;
      }
    } catch {
      rpcSingleSupported = false;
    }
  }

  // Direct database update on products table using existing opening_stock column
  try {
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, opening_stock')
      .eq('id', productId)
      .maybeSingle();

    if (fetchError || !product) return;

    const currentVal = parseFloat(String((product as any).opening_stock || '0')) || 0;
    let delta = quantity;
    const absQty = Math.abs(quantity);
    const uType = movementType.toUpperCase();

    if (['SALE', 'PURCHASE_CANCEL', 'OUT'].includes(uType)) {
      delta = -absQty;
    } else if (['PURCHASE', 'SALE_CANCEL', 'IN'].includes(uType)) {
      delta = absQty;
    }

    const newVal = Math.max(0, currentVal + delta);

    await supabase
      .from('products')
      .update({
        opening_stock: newVal
      })
      .eq('id', productId);
  } catch (err) {
    console.warn("Direct product stock update warning:", err);
  }
}
