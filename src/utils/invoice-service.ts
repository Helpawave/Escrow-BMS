import { supabase, serviceSupabase } from "@/integrations/supabase/client";
import { 
  Invoice, 
  InvoiceItem, 
  Client, 
  UserSettings,
  InvoiceData,
  ClientData,
  CompanyData,
  ItemData
} from "@/types/invoice";

export interface FullInvoiceData {
  invoice: Invoice;
  items: (InvoiceItem & { products?: unknown })[];
  client: Client;
  settings: UserSettings | null;
  profile: unknown;
}

/**
 * Fetches all data related to an invoice in parallel.
 * This includes the invoice details, line items, client details, 
 * user settings, and user profile.
 */
export async function fetchFullInvoiceData(invoiceId: string, userId?: string): Promise<FullInvoiceData> {
  const clientToUse = serviceSupabase || supabase;
  const [invoiceRes, itemsRes] = await Promise.all([
    clientToUse.from('invoices').select('*, clients(*)').eq('id', invoiceId).maybeSingle(),
    clientToUse
      .from('invoice_items')
      .select('*, products(id, name, description, hsn_code, unit, type, opening_stock)')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true })
  ]);

  if (invoiceRes.error) throw invoiceRes.error;
  if (!invoiceRes.data) throw new Error('Invoice not found');
  if (itemsRes.error) throw itemsRes.error;

  const invoiceData = invoiceRes.data as unknown as (Invoice & { clients: Client; user_id?: string });
  const effectiveOwnerId = invoiceData.user_id || userId || '';

  const [settingsRes, profileRes] = await Promise.all([
    effectiveOwnerId ? (clientToUse as any).from('user_settings').select('*').eq('user_id', effectiveOwnerId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    effectiveOwnerId ? (clientToUse as any).from('profiles').select('*').or(`user_id.eq.${effectiveOwnerId},id.eq.${effectiveOwnerId}`).maybeSingle() : Promise.resolve({ data: null, error: null })
  ]);

  const rawItems = (itemsRes.data || []) as any[];
  const formattedItems: InvoiceItem[] = rawItems.map(item => ({
    ...item,
    product_name: item.products?.name || item.product_name || '',
    name: item.products?.name || item.name || item.product_name || '',
    hsn_code: item.hsn_code || item.products?.hsn_code || '',
    product: item.products ? {
      name: item.products.name,
      opening_stock: item.products.opening_stock,
      type: item.products.type,
      unit: item.products.unit,
      hsn_code: item.products.hsn_code,
    } : undefined
  }));

  return {
    invoice: invoiceData as unknown as Invoice,
    items: formattedItems,
    client: invoiceData.clients,
    settings: (settingsRes.data as unknown as UserSettings) || null,
    profile: profileRes.data || null,
  };
}

/**
 * Formats user profile data into a standard CompanyData object for exports.
 */
export function formatCompanyData(profile: unknown, userEmail?: string): CompanyData {
  const p = profile as Record<string, unknown> | null;
  const storedLogo = typeof window !== 'undefined' ? (localStorage.getItem('escrow_company_logo_url') || '') : '';
  const storedSign = typeof window !== 'undefined' ? (localStorage.getItem('escrow_company_signature_url') || '') : '';
  return {
    company_name: (p?.company_name as string) || (p?.full_name as string) || "Company Name",
    email: (p?.email as string) || userEmail || "",
    phone: (p?.phone as string) || "",
    mobile: (p?.mobile as string) || (p?.phone as string) || "",
    business_address: (p?.business_address as string) || (p?.address as string) || "",
    gstin: (p?.gstin as string) || "",
    logo_url: (p?.logo_url as string) || storedLogo || "",
    website: (p?.website as string) || "",
    signature_url: (p?.signature_url as string) || storedSign || "",
    bank_name: (p?.bank_name as string) || "",
    account_number: (p?.account_number as string) || "",
    ifsc_code: (p?.ifsc_code as string) || "",
    account_holder_name: (p?.account_holder_name as string) || "",
    account_type: (p?.account_type as string) || "",
    hide_company_details: (p?.hide_company_details as boolean) ?? false,
    upi_id: (p?.upi_id as string) || "",
    upi_qr_url: (p?.upi_qr_url as string) || "",
  };
}

const isGenericPaymentDue = (terms?: string | null) => {
  if (!terms || !terms.trim()) return true;
  const t = terms.trim().toLowerCase();
  return (
    t === 'payment due within 30 days' ||
    t === 'payment due on receipt.' ||
    t === 'payment due on receipt' ||
    t === 'payment due as per terms' ||
    t === 'standard corporate terms apply.' ||
    t === 'standard payment terms apply.' ||
    t === 'payment is due within the stipulated time frame.'
  );
};

/**
 * Formats invoice data for the PDF utility.
 */
export function formatInvoiceData(
  invoice: Invoice, 
  defaultTerms?: string | null,
  defaultPaymentTerms?: string | null
): InvoiceData {
  const match = (defaultPaymentTerms || '').match(/\d+/);
  const paymentDays = match ? parseInt(match[0], 10) : 30;

  const isGeneric = isGenericPaymentDue(invoice.terms);
  const effectiveTerms = invoice.terms && invoice.terms.trim() && !isGeneric
    ? invoice.terms.trim()
    : (defaultTerms && defaultTerms.trim() 
        ? defaultTerms.trim() 
        : (paymentDays === 0 ? 'Payment due on receipt' : `Payment due within ${paymentDays} days`));

  let effectiveDueDate = invoice.due_date;
  if (isGeneric && invoice.issue_date && invoice.status !== 'paid' && paymentDays) {
    const nextDue = new Date(new Date(invoice.issue_date).getTime() + paymentDays * 24 * 60 * 60 * 1000);
    effectiveDueDate = nextDue.toISOString().split('T')[0];
  }

  return {
    invoice_number: invoice.invoice_number,
    issue_date: invoice.issue_date,
    due_date: effectiveDueDate,
    payment_date: invoice.payment_date,
    paid_at: invoice.paid_at,
    updated_at: (invoice as unknown as Record<string, unknown>).updated_at as string | undefined,
    status: invoice.status,
    subtotal: invoice.subtotal || 0,
    discount_amount: invoice.discount_amount || 0,
    tax_amount: invoice.tax_amount || 0,
    total_amount: invoice.total_amount,
    currency: invoice.currency,
    notes: invoice.notes,
    terms: effectiveTerms,
    payment_terms: invoice.payment_terms
  };
}

/**
 * Formats client data for the PDF utility.
 */
export function formatClientData(client: Client): ClientData {
  return {
    name: client?.name || 'N/A',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    city: client?.city || '',
    state: client?.state || '',
    postal_code: client?.postal_code || '',
    country: client?.country || '',
    gstin: client?.gstin || '',
    hide_contact_details: client?.hide_contact_details ?? false
  };
}
