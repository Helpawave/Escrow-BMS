import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  History,
  CreditCard,
  Trash2,
  Loader2,
  Landmark,
  Coins,
  Banknote,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { safelyToLocaleDate } from '@/utils/dateUtils';
import { getPaymentMethodLabel } from '../utils/downpaymentUtils';
import { DownpaymentHistoryDialogProps } from '../types';

export const DownpaymentHistoryDialog: React.FC<DownpaymentHistoryDialogProps> = ({
  open,
  onOpenChange,
  historyInvoice,
  historyPayments,
  isLoadingHistory,
  deletingPaymentId,
  formatAmount,
  handleDeleteHistoryPayment,
  handleOpenMarkPaid,
}) => {
  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
                <History className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Payment History & Ledger</DialogTitle>
                <DialogDescription className="text-xs">
                  Receipt #{historyInvoice?.invoice_number} • Customer: {historyInvoice?.clients?.name || 'Walk-in Customer'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {historyInvoice && (() => {
            const total = Number(historyInvoice.total_amount || 0);
            const totalPaid = historyPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
            const balanceDue = Math.max(0, total - totalPaid);
            const isFullyPaid = historyInvoice.status === 'paid' || balanceDue === 0;

            return (
              <div className="space-y-4 py-2">
                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-xl text-center border border-border/50">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Invoice</span>
                    <span className="text-base font-extrabold text-foreground">{formatAmount(total)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Total Received</span>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{formatAmount(totalPaid)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">Remaining Due</span>
                    <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">{formatAmount(balanceDue)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Payment Progress</span>
                    <span className="font-bold">{Math.min(100, Math.round((totalPaid / (total || 1)) * 100))}%</span>
                  </div>
                  <Progress value={Math.min(100, Math.round((totalPaid / (total || 1)) * 100))} className="h-2" />
                </div>

                {/* Transaction list */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Recorded Transactions ({historyPayments.length})
                  </Label>
                  {isLoadingHistory ? (
                    <div className="py-8 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading transactions...
                    </div>
                  ) : historyPayments.length === 0 ? (
                    <div className="p-6 text-center bg-muted/30 rounded-xl border border-dashed text-xs text-muted-foreground">
                      No transaction records found in payments ledger yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {historyPayments.map((p, idx) => (
                        <div key={p.id || idx} className="p-3 bg-card border border-border/60 rounded-xl flex items-start justify-between gap-3 text-xs">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-foreground text-sm">
                                {formatAmount(p.amount)}
                              </span>
                              <Badge variant="outline" className="text-[10px] capitalize">
                                {getPaymentMethodLabel(p.payment_method)}
                              </Badge>
                              {p.reference_number && (
                                <span className="text-muted-foreground font-mono text-[10px]">
                                  Ref: {p.reference_number}
                                </span>
                              )}
                            </div>
                            {p.notes && (
                              <p className="text-muted-foreground text-[11px] line-clamp-2">
                                {p.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end justify-between">
                            <span className="text-muted-foreground text-[11px] block font-medium">
                              {safelyToLocaleDate(p.payment_date || p.created_at)}
                            </span>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Received
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={deletingPaymentId === p.id}
                                onClick={() => handleDeleteHistoryPayment(p.id)}
                                className="h-6 w-6 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 p-0 ml-1 rounded-md"
                                title="Delete payment record"
                              >
                                {deletingPaymentId === p.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-rose-500" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Settle Remaining action inside History dialog if unpaid */}
                {!isFullyPaid && (
                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => {
                        onOpenChange(false);
                        handleOpenMarkPaid(historyInvoice);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Settle Remaining Balance ({formatAmount(balanceDue)})
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}

          <DialogFooter className="pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
};

