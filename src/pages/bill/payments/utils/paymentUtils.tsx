import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Car, CreditCard } from "lucide-react";

export const getMethodLabel = (method: string): string => {
  switch (method) {
    case 'cash': return 'Cash';
    case 'upi': return 'UPI / GPay';
    case 'bank_transfer': return 'Bank Transfer';
    case 'cheque': return 'Cheque';
    case 'credit_card': return 'Credit Card';
    case 'debit_card': return 'Debit Card';
    case 'pending': return 'Pending Mode';
    case 'other': return 'Other';
    default: return method;
  }
};

export const getPaymentTypeBadge = (payment: any) => {
  const type = payment?.downpayment_type;
  const seq = payment?.downpayment_breakdown?.sequence;
  if (type === 'full') {
    return (
      <Badge
        variant="outline"
        className="text-[8px] px-1.5 py-0.5 font-bold uppercase bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400"
      >
        Full Payment
      </Badge>
    );
  }
  if (type === 'downpayment' || seq === 1) {
    return (
      <Badge
        variant="outline"
        className="text-[8px] px-1.5 py-0.5 font-bold uppercase bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 flex items-center gap-1"
      >
        <Car className="w-2.5 h-2.5" />
        1st: Downpayment Advance
      </Badge>
    );
  }
  if (type === 'partial' || seq === 2 || (seq && seq > 1)) {
    return (
      <Badge
        variant="outline"
        className="text-[8px] px-1.5 py-0.5 font-bold uppercase bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 flex items-center gap-1"
      >
        <CreditCard className="w-2.5 h-2.5" />
        {seq && seq > 1 ? `${seq}${seq % 100 >= 11 && seq % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[seq % 10] || 'th'}: Partial / Balance` : 'Partial Payment'}
      </Badge>
    );
  }
  if (type === 'finance') {
    return (
      <Badge
        variant="outline"
        className="text-[8px] px-1.5 py-0.5 font-bold uppercase bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-400"
      >
        Loan Disbursed
      </Badge>
    );
  }
  return null;
};

