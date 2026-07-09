import { Database } from "@/integrations/supabase/types";

export type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  gstin?: string | null;
  user_id?: string;
  created_at?: string;
  hide_contact_details?: boolean | null;
};

export type Product = {
  id: string;
  name: string;
  description?: string | null;
  rate?: number;
  price?: number | string;
  purchase_price?: number | string;
  discount?: number | string;
  tax_rate?: number;
  user_id?: string;
  created_at?: string;
  opening_stock?: string | number;
  type?: string;
  unit?: string;
  category?: string | null;
  sku?: string | null;
  hsn_code?: string | null;
};

export type Vendor = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  gstin?: string | null;
  user_id?: string;
  created_at?: string;
};

export interface InvoiceItem {
  id?: string;
  product_id?: string;
  description: string;
  quantity: number;
  rate: number;
  discount: number;
  tax_rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  vendor_id?: string;
  issue_date: string;
  due_date: string;
  notes: string;
  terms: string;
  status: string;
  currency: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  discount_amount?: number;
  hide_company_details?: boolean;
  hide_contact_details?: boolean;
  clients?: Client;
  items?: InvoiceItem[];
  settings?: { invoice_template?: string };
}

export interface UserSettings {
  id: string;
  user_id: string;
  hide_company_details?: boolean;
  invoice_template?: string;
  tax_registration_number?: string;
  business_name?: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  currency?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingAmount: number;
  overdueAmount: number;
  totalClients: number;
  totalExpenses: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  netProfit: number;
  averageInvoiceValue: number;
}

export interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  vendor_id: string;
  issue_date: string;
  due_date?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  currency: string;
  notes?: string;
  terms?: string;
}

export interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  payment_method: string;
  is_billable: boolean;
  client_id: string;
  tax_amount: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string;
  notes: string;
  invoices: {
    invoice_number: string;
    status: string;
    clients: {
      name: string;
    };
  };
}

export interface InvoiceData {
  invoice_number: string;
  issue_date: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  due_date?: string | null;
  notes?: string | null;
  terms?: string | null;
}

export interface ClientData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  gstin: string;
  hide_contact_details?: boolean;
}

export interface CompanyData {
  company_name: string;
  email: string;
  phone: string;
  mobile: string;
  business_address: string;
  gstin: string;
  logo_url: string;
  website: string;
  signature_url: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  account_type?: string;
  hide_company_details?: boolean;
}

export interface ItemData {
  description: string;
  quantity: number;
  rate: number;
  tax_rate: number;
  discount: number;
  amount: number;
  product?: {
    opening_stock?: string | number;
    type?: string;
    unit?: string;
  };
}
