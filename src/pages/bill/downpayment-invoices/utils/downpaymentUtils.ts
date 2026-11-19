export const getPaymentMethodLabel = (method: string | null | undefined): string => {
  switch (method) {
    case 'cash': return 'Cash';
    case 'upi': return 'UPI / Online';
    case 'bank_transfer': return 'Bank Transfer';
    case 'cheque': return 'Cheque';
    case 'card': return 'Debit / Credit Card';
    default: return method ? method.toUpperCase() : 'Cash';
  }
};

