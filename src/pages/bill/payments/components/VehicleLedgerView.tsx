import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { VehicleLedgerItem } from '../types';
import { getMethodLabel } from '../utils/paymentUtils';
import { Car, CheckCircle2, CreditCard, Plus } from "lucide-react";

interface VehicleLedgerViewProps {
  vehicleLedgerItems: VehicleLedgerItem[];
  onRecordPaymentForInvoice: (invoiceId: string, remainingBalance: number) => void;
}

export const VehicleLedgerView: React.FC<VehicleLedgerViewProps> = ({
  vehicleLedgerItems,
  onRecordPaymentForInvoice,
}) => {
  const { formatAmount } = useCurrency();

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Vehicle Booking & Downpayment Split Ledger</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Consolidated ledger showing 1st Downpayment Token/Advance vs 2nd Partial/Balance Payment for each vehicle sale.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 font-black">
            {vehicleLedgerItems.length} Vehicles
          </span>
        </div>
      </div>

      {vehicleLedgerItems.length === 0 ? (
        <Card className="p-8 text-center bg-card border border-border/70 rounded-2xl">
          <Car className="w-12 h-12 text-amber-500/40 mx-auto mb-2" />
          <h3 className="text-base font-bold text-foreground">No Downpayment Vehicles Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            No vehicle downpayment receipts or invoices match the current filters.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3.5">
          {vehicleLedgerItems.map((item) => (
            <Card
              key={item.invoiceId}
              className="p-4 sm:p-5 bg-card border border-border/80 rounded-2xl shadow-sm hover:border-amber-400/50 transition-all space-y-4"
            >
              {/* Header: Invoice #, Customer, Vehicle Total, Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-black text-foreground">{item.invoiceNumber}</span>
                      {item.isFullySettled ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                          ✓ 100% Fully Settled
                        </Badge>
                      ) : item.firstPayment ? (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-bold">
                          ⚠️ Advance Paid • 2nd Partial Due
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 text-[10px] font-bold">
                          Pending Advance
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Buyer: <strong className="text-foreground">{item.partyName}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                  <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Total Vehicle Price</span>
                  <span className="text-lg sm:text-xl font-black text-foreground">
                    {formatAmount(item.totalVehiclePrice)}
                  </span>
                </div>
              </div>

              {/* Split Comparison Cards: 1st Payment (Advance) vs 2nd Payment (Partial) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Box 1: 1st Payment (Downpayment Advance) */}
                <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-950 dark:text-amber-200">
                    <span className="flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      1st Payment: Downpayment Advance
                    </span>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold bg-amber-100 text-amber-900 border-amber-300">
                      Advance Token
                    </Badge>
                  </div>

                  {item.firstPayment ? (
                    <div className="space-y-1">
                      <div className="text-lg font-black text-amber-900 dark:text-amber-200">
                        {formatAmount(item.firstAmount)}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium">
                        <span>Paid: {safelyToLocaleDate(item.firstPayment.payment_date)}</span>
                        <span>•</span>
                        <span>Mode: {getMethodLabel(item.firstPayment.payment_method)}</span>
                        {item.firstPayment.reference_number && (
                          <>
                            <span>•</span>
                            <span className="font-mono">Ref: {item.firstPayment.reference_number}</span>
                          </>
                        )}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 pt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Advance Received Successfully
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-xs text-muted-foreground italic">
                      No advance payment recorded yet.
                    </div>
                  )}
                </div>

                {/* Box 2: 2nd Payment (Partial / Balance) */}
                <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-950 dark:text-blue-200">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      2nd Payment: Partial / Balance
                    </span>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold bg-blue-100 text-blue-900 border-blue-300">
                      Balance Settle
                    </Badge>
                  </div>

                  {item.secondPayment ? (
                    <div className="space-y-1">
                      <div className="text-lg font-black text-blue-900 dark:text-blue-200">
                        {formatAmount(item.secondAmount)}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium">
                        <span>Paid: {safelyToLocaleDate(item.secondPayment.payment_date)}</span>
                        <span>•</span>
                        <span>Mode: {getMethodLabel(item.secondPayment.payment_method)}</span>
                        {item.secondPayment.reference_number && (
                          <>
                            <span>•</span>
                            <span className="font-mono">Ref: {item.secondPayment.reference_number}</span>
                          </>
                        )}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 pt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Partial / Balance Cleared
                      </div>
                    </div>
                  ) : item.remainingBalance > 0 ? (
                    <div className="space-y-1.5">
                      <div className="text-lg font-black text-rose-600 dark:text-rose-400">
                        {formatAmount(item.remainingBalance)} Due
                      </div>
                      <p className="text-[11px] text-muted-foreground font-medium">
                        Remaining balance awaiting settlement from customer.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => onRecordPaymentForInvoice(item.invoiceId, item.remainingBalance)}
                        className="h-7 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Record 2nd Partial Payment
                      </Button>
                    </div>
                  ) : (
                    <div className="py-2 text-xs text-muted-foreground italic">
                      All settled under full payment.
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Summary: Total Paid, Balance Due, Direct Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-muted-foreground">
                    Total Paid: <strong className="text-foreground">{formatAmount(item.totalPaid)}</strong>
                  </span>
                  <span>•</span>
                  <span className="text-muted-foreground">
                    Remaining Due:{" "}
                    <strong className={item.remainingBalance > 0 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                      {formatAmount(item.remainingBalance)}
                    </strong>
                  </span>
                  <span>•</span>
                  <span className="text-muted-foreground">
                    Payments Count: <strong className="text-foreground">{item.payments.length}</strong>
                  </span>
                </div>

                {item.remainingBalance > 0 && (
                  <Button
                    size="sm"
                    onClick={() => onRecordPaymentForInvoice(item.invoiceId, item.remainingBalance)}
                    className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white self-end sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Record 2nd Partial Payment ({formatAmount(item.remainingBalance)})
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
