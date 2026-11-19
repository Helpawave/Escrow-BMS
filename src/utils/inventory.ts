import { supabase, serviceSupabase } from "@/integrations/supabase/client";

/**
 * Adjusts the opening_stock of a product in the database.
 * @param productId The ID of the product
 * @param quantity The amount to change (positive to increment stock, negative to decrement)
 */
export async function adjustStock(productId: string, quantity: number) {
  if (!productId || quantity === 0) return;

  try {
    const clientToUse = serviceSupabase || supabase;
    const { data: product, error: fetchError } = await clientToUse
      .from('products')
      .select('id, opening_stock, type')
      .eq('id', productId)
      .maybeSingle();

    if (fetchError) {
      console.warn(`[adjustStock] Failed to fetch product ${productId}:`, fetchError);
      return;
    }

    if (!product) return;

    // Services do not maintain physical stock
    if ((product as { type?: string }).type === 'service') {
      return;
    }

    const currentStock = parseFloat(String((product as { opening_stock?: string | number }).opening_stock || '0')) || 0;
    const newStock = currentStock + quantity;

    const { error: updateError } = await clientToUse
      .from('products')
      .update({ opening_stock: newStock.toString() })
      .eq('id', productId);

    if (updateError) {
      console.error(`[adjustStock] Failed to update stock for product ${productId}:`, updateError);
    }
  } catch (err) {
    console.warn('[adjustStock] Non-blocking stock adjustment error:', err);
  }
}

/**
 * Formats a product category string with proper first letter capitalization (Title Case).
 * Handles predefined values and custom values cleanly.
 * Example: 'general' -> 'General', 'it' -> 'IT & Software', 'hardware' -> 'Hardware'
 */
export function formatCategory(category?: string | null): string {
  if (!category) return 'General';
  const raw = String(category).trim();
  if (!raw) return 'General';

  const lower = raw.toLowerCase();
  if (lower === 'hot_beverages' || lower === 'hot beverages') return 'Hot Beverages ☕';
  if (lower === 'cold_beverages' || lower === 'cold beverages') return 'Cold Beverages 🥤';
  if (lower === 'snacks' || lower === 'breakfast & snacks') return 'Breakfast & Snacks 🥪';
  if (lower === 'main_course' || lower === 'main course' || lower === 'meals') return 'Main Course 🍝';
  if (lower === 'desserts' || lower === 'desserts & bakery' || lower === 'bakery') return 'Desserts & Bakery 🍰';
  if (lower === 'ingredients' || lower === 'raw materials') return 'Ingredients & Raw Materials 🥛';
  if (lower === 'it' || lower === 'it & software' || lower === 'it services') return 'IT & Software';
  if (lower === 'general' || lower === 'general items') return 'General';
  if (lower === 'hardware' || lower === 'hardware & electronics') return 'Hardware';
  if (lower === 'consulting' || lower === 'consulting & professional services') return 'Consulting';
  if (lower === 'retail' || lower === 'retail & e-commerce') return 'Retail';
  if (lower === 'others' || lower === 'other') return 'Others';

  return raw
    .split(' ')
    .map(word => {
      if (!word) return '';
      if (word.toUpperCase() === 'IT' || word.toUpperCase() === 'GST' || word.toUpperCase() === 'HSN') {
        return word.toUpperCase();
      }
      return word
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('-');
    })
    .join(' ');
}



export const CAFE_PRODUCT_CATEGORIES = [
  { value: 'hot_beverages', label: 'Hot Beverages ☕' },
  { value: 'cold_beverages', label: 'Cold Beverages 🥤' },
  { value: 'snacks', label: 'Breakfast & Snacks 🥪' },
  { value: 'main_course', label: 'Main Course & Meals 🍝' },
  { value: 'desserts', label: 'Desserts & Bakery 🍰' },
  { value: 'ingredients', label: 'Ingredients & Raw Materials 🥛' },
  { value: 'others', label: 'Others 🍽️' },
];

export const CAFE_PRODUCT_UNITS = [
  { value: 'cup', label: 'Cup / Glass (CUP)' },
  { value: 'plate', label: 'Plate / Portion (PLT)' },
  { value: 'pcs', label: 'Piece (PCS)' },
  { value: 'serving', label: 'Serving (SRV)' },
  { value: 'kg', label: 'Kilogram (KG)' },
  { value: 'gm', label: 'Gram (GM)' },
  { value: 'ltr', label: 'Liter (LTR)' },
  { value: 'ml', label: 'Milliliter (ML)' },
  { value: 'bottle', label: 'Bottle / Can (BTL)' },
  { value: 'box', label: 'Box / Pack (BOX)' },
];

export const STANDARD_PRODUCT_CATEGORIES = [
  { value: 'general', label: 'General Items' },
  { value: 'it', label: 'IT & Software' },
  { value: 'hardware', label: 'Hardware & Electronics' },
  { value: 'consulting', label: 'Consulting & Professional Services' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'others', label: 'Others' },
];

export const STANDARD_PRODUCT_UNITS = [
  { value: 'pcs', label: 'Pieces (PCS)' },
  { value: 'box', label: 'Box (BOX)' },
  { value: 'kg', label: 'Kilograms (KG)' },
  { value: 'unit', label: 'Units (UNT)' },
  { value: 'service', label: 'Service' },
  { value: 'hours', label: 'Hours (HRS)' },
];
