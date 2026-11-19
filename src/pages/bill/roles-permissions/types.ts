export interface StaffMember {
  id: string;
  company_owner_id: string;
  user_id?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  permissions: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
  temp_password?: string;
}

export interface PermissionDefinition {
  id: string;
  label: string;
  description: string;
  autoOnly?: boolean;
  cafeOnly?: boolean;
  hideForCafe?: boolean;
}

export const AVAILABLE_PERMISSIONS: PermissionDefinition[] = [
  { id: 'invoices', label: 'Sales Invoices', description: 'Create, view, and manage client tax invoices' },
  { id: 'downpayment-invoices', label: 'Downpayment Invoices', description: 'Create and manage vehicle booking advances & downpayment receipts', autoOnly: true },
  { id: 'purchase-invoices', label: 'Purchase Bills', description: 'Record and track vendor purchase bills' },
  { id: 'clients', label: 'Client Directory', description: 'Manage client accounts and billing records' },
  { id: 'vendors', label: 'Vendor Directory', description: 'Manage supplier and vendor relationships' },
  { id: 'products', label: 'Inventory & Catalog', description: 'Maintain product rates, stock, and HSN codes' },
  { id: 'payments', label: 'Payments & Receipts', description: 'Log incoming and outgoing payment transactions' },
  { id: 'expenses', label: 'Company Expenses', description: 'Track business expenses and categories' },
  { id: 'einvoice', label: 'E-Way & E-Invoice', description: 'Generate GST compliant e-invoices and waybills', hideForCafe: true },
  { id: 'kitchen', label: 'Kitchen Display (KDS)', description: 'View live kitchen tickets, manage preparation queue and order status', cafeOnly: true },
];

export const ROLE_PRESETS: Record<string, { name: string; permissions: string[] }> = {
  Accountant: {
    name: 'Accountant',
    permissions: ['invoices', 'purchase-invoices', 'payments', 'expenses', 'einvoice']
  },
  'Sales Executive': {
    name: 'Sales Executive',
    permissions: ['invoices', 'clients', 'products']
  },
  'Inventory Manager': {
    name: 'Inventory Manager',
    permissions: ['purchase-invoices', 'vendors', 'products']
  },
  'Billing Operator': {
    name: 'Billing Operator',
    permissions: ['invoices', 'clients', 'payments']
  },
  'Kitchen Chef': {
    name: 'Kitchen Chef',
    permissions: ['kitchen']
  },
  Custom: {
    name: 'Custom',
    permissions: []
  }
};

export const LOCAL_STORAGE_STAFF_KEY = 'escrow_company_staff_backup';

export interface CreatedCredentials {
  name: string;
  email: string;
  userId?: string | null;
  password?: string;
  role: string;
  loginUrl: string;
  phone?: string;
}

