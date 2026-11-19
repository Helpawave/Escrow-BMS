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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, Banknote, Smartphone, AlertTriangle, Loader2 } from 'lucide-react';
import { MarkPaidDialogProps } from '../types';
import { getPaymentMethodLabel } from '../utils/paymentUtils';

export const MarkPaidDialog: React.FC<MarkPaidDialogProps> = ({
  open,
  onOpenChange,
  invoice,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  formatAmount,
  handleMarkAsPaid,
  isSubmittingPayment,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background">
        <DialogHeader className="p-6 pb-4 bg-muted/10 border-b border-border/50">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
            <CreditCard className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-black text-foreground">
            Mark Invoice as Paid
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Invoice #{invoice?.invoice_number} • Amount: {formatAmount(Number(invoice?.total_amount || 0))}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Select Payment Method (Optional)
            </Label>
            {selectedPaymentMethod && (
              <button
                type="button"
                onClick={() => setSelectedPaymentMethod(null)}
                className="text-[11px] font-bold text-amber-600 hover:underline"
              >
                Clear Selection
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={selectedPaymentMethod === 'cash'}
              aria-label="Payment method Cash"
              onClick={() => setSelectedPaymentMethod(prev => prev === 'cash' ? null : 'cash')}
              className={`p-4 rounded-xl border-2 text-left flex flex-col gap-2 transition-all cursor-pointer active:scale-95 ${
                selectedPaymentMethod === 'cash'
                  ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-border/60 hover:border-border text-muted-foreground hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <Banknote className={`w-5 h-5 ${selectedPaymentMethod === 'cash' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                {selectedPaymentMethod === 'cash' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                )}
              </div>
              <div>
                <p className="font-black text-sm text-foreground">Cash</p>
                <p className="text-[10px] opacity-70">Physical Cash Payment</p>
              </div>
            </button>

            <button
              type="button"
              aria-pressed={selectedPaymentMethod === 'upi'}
              aria-label="Payment method UPI"
              onClick={() => setSelectedPaymentMethod(prev => prev === 'upi' ? null : 'upi')}
              className={`p-4 rounded-xl border-2 text-left flex flex-col gap-2 transition-all cursor-pointer active:scale-95 ${
                selectedPaymentMethod === 'upi'
                  ? 'border-violet-600 bg-violet-50/70 dark:bg-violet-950/40 text-violet-900 dark:text-violet-100 shadow-md ring-2 ring-violet-500/20'
                  : 'border-border/60 hover:border-border text-muted-foreground hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <Smartphone className={`w-5 h-5 ${selectedPaymentMethod === 'upi' ? 'text-violet-600' : 'text-muted-foreground'}`} />
                {selectedPaymentMethod === 'upi' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-600"></span>
                )}
              </div>
              <div>
                <p className="font-black text-sm text-foreground">UPI / Online</p>
                <p className="text-[10px] opacity-70">GPay, PhonePe, QR</p>
              </div>
            </button>
          </div>

          <div className="space-y-1.5 pt-1">
            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Or Other Payment Method
            </Label>
            <Select
              value={
                selectedPaymentMethod && selectedPaymentMethod !== 'cash' && selectedPaymentMethod !== 'upi'
                  ? selectedPaymentMethod
                  : ""
              }
              onValueChange={(val) => {
                if (val === 'none') {
                  setSelectedPaymentMethod(null);
                } else {
                  setSelectedPaymentMethod(val);
                }
              }}
            >
              <SelectTrigger aria-label="Choose other payment method" className="w-full h-11 bg-muted/20 border-border/70 rounded-xl text-sm font-medium focus:ring-emerald-500">
                <SelectValue placeholder="Choose other payment method..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border shadow-xl z-50">
                <SelectItem value="none" className="cursor-pointer py-2 text-muted-foreground italic font-medium">
                  -- None (Mode is Pended) --
                </SelectItem>
                <SelectItem value="bank_transfer" className="cursor-pointer py-2 font-medium">
                  🏦 Bank Transfer (NEFT / RTGS / IMPS)
                </SelectItem>
                <SelectItem value="cheque" className="cursor-pointer py-2 font-medium">
                  📜 Cheque
                </SelectItem>
                <SelectItem value="credit_card" className="cursor-pointer py-2 font-medium">
                  💳 Credit Card
                </SelectItem>
                <SelectItem value="debit_card" className="cursor-pointer py-2 font-medium">
                  💳 Debit Card
                </SelectItem>
                <SelectItem value="net_banking" className="cursor-pointer py-2 font-medium">
                  🌐 Net Banking
                </SelectItem>
                <SelectItem value="other" className="cursor-pointer py-2 font-medium">
                  📦 Other Method
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!selectedPaymentMethod && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>No mode selected. Invoice will be settled with <strong>Pending Payment Mode</strong> (you can set it in Payments anytime).</span>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-muted/5 border-t border-border/50 flex flex-row gap-3 shrink-0 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-24 sm:w-28 h-11 font-bold rounded-xl shrink-0"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSubmittingPayment}
            onClick={async () => {
              if (invoice && !isSubmittingPayment) {
                await handleMarkAsPaid(invoice, selectedPaymentMethod);
                onOpenChange(false);
              }
            }}
            className="flex-1 h-11 font-bold text-xs sm:text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 px-3 whitespace-nowrap overflow-hidden text-ellipsis disabled:opacity-50"
          >
            {isSubmittingPayment ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Recording...
              </span>
            ) : selectedPaymentMethod 
              ? `Confirm (${getPaymentMethodLabel(selectedPaymentMethod)})` 
              : 'Confirm (Mode is Pended)'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

