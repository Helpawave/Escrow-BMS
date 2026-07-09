import { supabase } from "@/integrations/supabase/client";
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
export async function fetchFullInvoiceData(invoiceId: string, userId: string): Promise<FullInvoiceData> {
  const [invoiceRes, itemsRes, settingsRes, profileRes] = await Promise.all([
    supabase.from('invoices').select('*, clients(*)').eq('id', invoiceId).single(),
    supabase.from('invoice_items').select('*').eq('invoice_id', invoiceId).order('created_at', { ascending: true }),
    supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle()
  ]);

  if (invoiceRes.error) throw invoiceRes.error;
  if (!invoiceRes.data) throw new Error('Invoice not found');
  if (itemsRes.error) throw itemsRes.error;

  const invoiceData = invoiceRes.data as unknown as (Invoice & { clients: Client });
  
  return {
    invoice: invoiceData as unknown as Invoice,
    items: (itemsRes.data || []) as unknown as InvoiceItem[],
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
  return {
    company_name: (p?.company_name as string) || (p?.full_name as string) || "Company Name",
    email: (p?.email as string) || userEmail || "",
    phone: (p?.phone as string) || "",
    mobile: (p?.mobile as string) || (p?.phone as string) || "",
    business_address: (p?.business_address as string) || (p?.address as string) || "",
    gstin: (p?.gstin as string) || "",
    logo_url: (p?.logo_url as string) || "",
    website: (p?.website as string) || "",
    signature_url: (p?.signature_url as string) || "",
    bank_name: (p?.bank_name as string) || "",
    account_number: (p?.account_number as string) || "",
    ifsc_code: (p?.ifsc_code as string) || "",
    account_holder_name: (p?.account_holder_name as string) || "",
    account_type: (p?.account_type as string) || "",
    hide_company_details: (p?.hide_company_details as boolean) ?? false
  };
}

/**
 * Formats invoice data for the PDF utility.
 */
export function formatInvoiceData(invoice: Invoice) {
  return {
    invoice_number: invoice.invoice_number,
    issue_date: invoice.issue_date,
    status: invoice.status,
    subtotal: invoice.subtotal || 0,
    discount_amount: invoice.discount_amount || 0,
    tax_amount: invoice.tax_amount || 0,
    total_amount: invoice.total_amount,
    currency: invoice.currency,
    notes: invoice.notes,
    terms: invoice.terms
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
