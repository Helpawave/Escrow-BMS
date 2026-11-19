import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import { PendingInvoiceItem } from "@/hooks/usePayments";

interface PaymentSyncBannerProps {
  unrecordedPaidInvoices: PendingInvoiceItem[];
  isSyncingUnrecorded: boolean;
  onSyncUnrecorded: () => Promise<void> | void;
}

export const PaymentSyncBanner: React.FC<PaymentSyncBannerProps> = ({
  unrecordedPaidInvoices,
  isSyncingUnrecorded,
  onSyncUnrecorded,
}) => {
  if (unrecordedPaidInvoices.length === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 shadow-sm animate-in fade-in">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <div className="text-xs sm:text-sm">
          <span className="font-bold">Missing Payment Record Detected: </span>
          <span>
            {unrecordedPaidInvoices.length} invoice(s) marked as Paid ({unrecordedPaidInvoices.map(i => `#${i.invoice_number}`).slice(0, 3).join(', ')}{unrecordedPaidInvoices.length > 3 ? '...' : ''}) have no entry in the Payments ledger.
          </span>
        </div>
      </div>
      <Button
        size="sm"
        onClick={onSyncUnrecorded}
        disabled={isSyncingUnrecorded}
        className="shrink-0 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-9 text-xs shadow-md shadow-amber-600/20 active:scale-95 transition-all"
      >
        {isSyncingUnrecorded ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing...
          </span>
        ) : (
          `Sync ${unrecordedPaidInvoices.length} Missing Payment${unrecordedPaidInvoices.length > 1 ? 's' : ''}`
        )}
      </Button>
    </div>
  );
};

