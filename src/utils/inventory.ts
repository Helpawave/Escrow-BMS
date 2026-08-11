import { supabase } from "@/integrations/supabase/client";

export interface StockItemMutation {
  product_id: string;
  quantity: number;
}

/**
 * Atomic Invoice-Level Batch Stock Adjuster.
 * Executes ALL product stock updates for an invoice in ONE PostgreSQL transaction block.
 * Fails closed if any single item fails.
 * 
 * @param items List of products and quantities to mutate
 * @param movementType Category ('SALE', 'PURCHASE', 'SALE_CANCEL', 'PURCHASE_CANCEL', etc.)
 * @param referenceId Reference ID (e.g. invoice_id)
 * @param operationId Unique operation ID generated per user submission (reused on retries)
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

  if (user) {
    const { data, error } = await supabase.rpc('process_invoice_stock_batch_mutation', {
      p_user_id: user.id,
      p_items: validItems,
      p_movement_type: movementType,
      p_reference_type: 'INVOICE',
      p_reference_id: referenceId,
      p_reason: `Batch stock adjustment: ${movementType}`,
      p_operation_id: operationId
    });

    if (!error) {
      if (data?.success) return;
      throw new Error(`Batch stock mutation failed: ${data?.error || 'Unknown error'}`);
    }

    const isRpcNotFound = error.code === '42883' || error.code === 'PGRST202' || error.message?.includes('function');

    if (!isRpcNotFound) {
      console.error("[FAIL-CLOSED] Batch stock mutation RPC execution error:", error);
      throw new Error(`Batch stock adjustment failed: ${error.message}`);
    }

    console.warn("[PRE-MIGRATION DEV FALLBACK] process_invoice_stock_batch_mutation RPC not installed yet. Executing sequential fallback.");
  }

  // Pre-migration compatibility fallback
  for (const item of validItems) {
    const itemKey = `${operationId}:${item.product_id}:${movementType}`;
    await adjustStock(item.product_id, item.quantity, movementType, referenceId, itemKey);
  }
}

/**
 * Single-product stock adjuster for direct manual adjustments.
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

  if (user) {
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

    if (!error) {
      if (data?.success) return;
      throw new Error(`Stock mutation failed: ${data?.error || 'Unknown error'}`);
    }

    const isRpcNotFound = error.code === '42883' || error.code === 'PGRST202' || error.message?.includes('function');

    if (!isRpcNotFound) {
      console.error("[FAIL-CLOSED] Stock mutation RPC execution error:", error);
      throw new Error(`Stock adjustment failed: ${error.message}`);
    }

    console.warn("[PRE-MIGRATION DEV FALLBACK] Stock mutation RPC not installed on database yet. Executing pre-migration fallback.");
  }

  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('opening_stock, current_stock')
    .eq('id', productId)
    .single();

  if (fetchError) throw fetchError;
  if (!product) return;

  const rawOpening = parseFloat((product as unknown as { opening_stock?: string }).opening_stock || '0') || 0;
  const currentVal = (product as unknown as { current_stock?: number }).current_stock ?? rawOpening;

  let delta = quantity;
  const absQty = Math.abs(quantity);
  const uType = movementType.toUpperCase();

  if (['SALE', 'PURCHASE_CANCEL', 'OUT'].includes(uType)) {
    delta = -absQty;
  } else if (['PURCHASE', 'SALE_CANCEL', 'IN'].includes(uType)) {
    delta = absQty;
  }

  const newVal = currentVal + delta;

  const { error: updateError } = await supabase
    .from('products')
    .update({
      current_stock: newVal
    } as any)
    .eq('id', productId);

  if (updateError) throw updateError;
}
