export const getPaymentMethodLabel = (method: string | null | undefined): string => {
  switch (method) {
    case 'cash':
      return 'Cash';
    case 'upi':
      return 'UPI / Online';
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'cheque':
      return 'Cheque';
    case 'credit_card':
      return 'Credit Card';
    case 'debit_card':
      return 'Debit Card';
    case 'net_banking':
      return 'Net Banking';
    case 'other':
      return 'Other Method';
    case 'pending':
      return 'Pending';
    default:
      return method ? method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Pending';
  }
};

export interface PurchaseInvoice {
  id: string;
  user_id?: string;
  invoice_number: string;
  vendor_id: string;
  vendors: { 
    name: string;
    email?: string;
    phone?: string;
  };
  total_amount: number;
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  issue_date: string;
  due_date?: string;
  status: string;
  currency: string;
  notes?: string;
  terms?: string;
  created_at?: string;
}

export type SharedInvoiceStatus = Record<string, { whatsapp?: boolean; email?: boolean; sms?: boolean }>;

