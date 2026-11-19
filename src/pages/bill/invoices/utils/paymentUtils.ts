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

