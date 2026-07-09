import { supabase } from "@/integrations/supabase/client";

/**
 * Adjusts the opening_stock of a product in the database.
 * @param productId The ID of the product
 * @param quantity The amount to change (can be negative for decrement)
 */
export async function adjustStock(productId: string, quantity: number) {
  if (!productId || quantity === 0) return;

  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('opening_stock')
    .eq('id', productId)
    .single();

  if (fetchError) throw fetchError;
  if (!product) return;

  const currentStock = parseFloat((product as unknown as { opening_stock: string }).opening_stock) || 0;
  const newStock = currentStock + quantity;

  const { error: updateError } = await supabase
    .from('products')
    .update({ opening_stock: newStock.toString() })
    .eq('id', productId);

  if (updateError) throw updateError;
}
