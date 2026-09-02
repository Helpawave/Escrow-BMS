import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/types/invoice";

/**
 * Calculates the total amount for a single invoice item including discount and tax.
 */
export const calculateItemAmount = (quantity: number, rate: number, discount: number, taxRate: number) => {
  const subtotal = quantity * rate;
  const discountAmount = (subtotal * discount) / 100;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = (afterDiscount * taxRate) / 100;
  return afterDiscount + taxAmount;
};

/**
 * Generates a new unique invoice or quotation number.
 */
export const generateInvoiceNumber = async (prefix: string = 'INV') => {
  const { data: latestInvoice, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .ilike('invoice_number', `${prefix}-%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching latest ${prefix}:`, error);
    return `${prefix}-${Date.now().toString().slice(-6)}`;
  }

  const typedInvoice = (latestInvoice as unknown) as Pick<Invoice, 'invoice_number'> | null;

  if (!typedInvoice || !typedInvoice.invoice_number) {
    return `${prefix}-001`;
  }

  const parts = typedInvoice.invoice_number.split('-');
  const lastNumberStr = parts[parts.length - 1];
  const lastNumber = parseInt(lastNumberStr, 10);

  if (isNaN(lastNumber)) {
    return `${prefix}-${Date.now().toString().slice(-6)}`;
  }

  const nextNumber = lastNumber + 1;
  return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
};
