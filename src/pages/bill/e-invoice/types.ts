export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface InvoiceItemRaw {
  description?: string;
  name?: string;
  hsn_code?: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  price?: number;
  tax_rate?: number;
  products?: {
    unit?: string;
    hsn_code?: string;
  };
}

export interface PartialInvoice {
  id: string;
  invoice_number: string;
  client_id: string;
  total_amount: number;
  issue_date: string;
  invoice_items?: InvoiceItemRaw[];
}

export interface Client {
  id: string;
  name: string;
  email: string;
  gstin: string;
  address: string;
  state: string;
  postal_code: string;
  hide_contact_details?: boolean;
}

export interface EInvoiceItem {
  id: string;
  product_id?: string;
  description: string;
  hsn_code: string;
  quantity: number;
  unit: string;
  rate: number;
  tax_rate: number;
  amount: number;
}

export interface EWayBillItem {
  id: string;
  product_id?: string;
  product_name: string;
  hsn_code: string;
  quantity: number;
  unit: string;
  value: number;
}

export interface Profile {
  user_id: string;
  company_name: string;
  email?: string;
  phone: string;
  mobile: string;
  business_address: string;
  gstin: string;
  logo_url?: string;
  website?: string;
  signature_url?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  account_type?: string;
}

export interface EInvoiceHistoryItem {
  id: string;
  client_id: string;
  invoice_type: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  status: string;
  place_of_supply: string;
  reverse_charge: string;
  notes?: string;
  subtotal: number;
  tax_amount: number;
  items: EInvoiceItem[];
  template?: InvoiceTemplateType;
  irn?: string;
  ack_no?: string;
  ack_date?: string;
}

export interface EWayBillHistoryItem {
  id: string;
  client_id: string;
  document_type: string;
  document_number: string;
  document_date: string;
  total_value: number;
  status: string;
  transport_mode: string;
  vehicle_number?: string;
  distance?: string;
  transporter_name?: string;
  from_gstin?: string;
  to_gstin?: string;
  from_address?: string;
  to_address?: string;
  transaction_type: string;
  items: EWayBillItem[];
  template?: InvoiceTemplateType;
  eway_bill_no?: string;
  valid_until?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  tax_rate: number;
  opening_stock: string;
  unit: string;
  category?: string;
  purchase_price?: number;
  discount?: number;
  hsn_code?: string;
}

export const UNIT_OPTIONS = [
  { label: "Numbers (NOS)", value: "NOS" },
  { label: "Pieces (PCS)", value: "PCS" },
  { label: "Kilograms (KGS)", value: "KGS" },
  { label: "Litres (LTR)", value: "LTR" },
  { label: "Meters (MTR)", value: "MTR" },
  { label: "Box (BOX)", value: "BOX" },
  { label: "Service", value: "SERVICE" },
  { label: "Others (OTH)", value: "OTH" },
];

export const TEMPLATE_OPTIONS = [
  { label: "Official GST", value: "official" },
  { label: "Professional", value: "professional" },
  { label: "Elegant", value: "elegant" },
  { label: "Minimal", value: "minimal" },
  { label: "Modern", value: "modern" },
  { label: "Corporate", value: "corporate" },
] as const;

export interface NewProductFormData {
  name: string;
  type?: 'product' | 'service';
  category: string;
  sales_price: string;
  price_with_tax: boolean;
  tax_rate: string;
  unit: string;
  opening_stock: string;
  description: string;
  purchase_price: string;
  sku: string;
  discount: string;
  hsn_code: string;
  barcode?: string;
  alternative_unit?: string;
  as_of_date?: string;
  low_stock_warning?: boolean;
}

export type InvoiceTemplateType = typeof TEMPLATE_OPTIONS[number]['value'];

export interface EInvoiceFormData {
  client_id: string;
  invoice_type: string;
  invoice_number: string;
  invoice_date: string;
  place_of_supply: string;
  reverse_charge: string;
  notes: string;
  template: InvoiceTemplateType;
  irn: string;
  ack_no: string;
  ack_date: string;
}

export interface EWayBillFormData {
  client_id: string;
  document_type: string;
  document_number: string;
  document_date: string;
  from_gstin: string;
  to_gstin: string;
  transaction_type: string;
  sub_supply_type: string;
  from_address: string;
  to_address: string;
  from_state: string;
  to_state: string;
  from_pincode: string;
  to_pincode: string;
  vehicle_number: string;
  transport_mode: string;
  distance: string;
  transporter_name: string;
  transporter_id: string;
  template: InvoiceTemplateType;
  eway_bill_no: string;
  valid_until: string;
  irn: string;
  ack_no: string;
  ack_date: string;
}

export const mapProductUnitToInvoiceUnit = (unit: string | undefined): string => {
  if (!unit) return "NOS";
  const u = unit.toLowerCase();
  if (u === "pcs" || u === "pieces") return "PCS";
  if (u === "kg" || u === "kilogram" || u === "kgs") return "KGS";
  if (u === "ltr" || u === "litre" || u === "litres") return "LTR";
  if (u === "mtr" || u === "meter" || u === "meters") return "MTR";
  if (u === "box") return "BOX";
  if (u === "service") return "SERVICE";
  return "NOS";
};
