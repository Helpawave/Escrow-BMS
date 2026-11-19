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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Clock,
  Loader2,
  Coins,
  Landmark,
  ArrowRight,
} from 'lucide-react';
import { extractVehicleDetails, extractPaymentDetails } from '@/components/AutoInvoiceTemplate';
import { getPaymentMethodLabel } from '../utils/downpaymentUtils';
import { DownpaymentSettlementDialogProps } from '../types';

export const DownpaymentSettlementDialog: React.FC<DownpaymentSettlementDialogProps> = ({
  open,
  onOpenChange,
  invoiceToMarkPaid,
  formatAmount,
  currencySymbol,
  alreadyPaidAmount,
  remainingBalanceAmount,
  balanceSettleType,
  setBalanceSettleType,
  installmentAmount,
  setInstallmentAmount,
  paymentType,
  setPaymentType,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  paymentDate,
  setPaymentDate,
  transactionRef,
  setTransactionRef,
  partialAmount,
  setPartialAmount,
  balanceDueDate,
  setBalanceDueDate,
  downpaymentAmount,
  setDownpaymentAmount,
  financierName,
  setFinancierName,
  customFinancier,
  setCustomFinancier,
  financedAmount,
  setFinancedAmount,
  financeStatus,
  setFinanceStatus,
  loanAccountNo,
  setLoanAccountNo,
  isSubmittingPayment,
  handleMarkAsPaid,
}) => {
  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {invoiceToMarkPaid && (() => {
            const vehicle = extractVehicleDetails({ notes: invoiceToMarkPaid.notes });
            const total = Number(invoiceToMarkPaid.total_amount || 0);
            const pAmt = Number(partialAmount) || 0;
            const pBalance = Math.max(0, total - pAmt);
            const dp = Number(downpaymentAmount) || 0;
            const loan = Number(financedAmount) || Math.max(0, total - dp);
            const isSettlingExistingBalance = alreadyPaidAmount > 0 && remainingBalanceAmount > 0;
            const existingPayment = extractPaymentDetails(invoiceToMarkPaid);
            const isFinanced = existingPayment?.type === 'finance' || Boolean(existingPayment?.finance);
            const isDisbursed = Boolean(existingPayment?.finance?.disbursed);

            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold">
                        {isSettlingExistingBalance ? "Settle Remaining Balance" : "Record Payment / Downpayment Settlement"}
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        Receipt #{invoiceToMarkPaid.invoice_number} • Total Booking: {formatAmount(total)}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 py-2 text-sm">
                  {isSettlingExistingBalance ? (
                    /* ========================================================= */
                    /* BALANCE SETTLEMENT VIEW (Multi-tier installments)        */
                    /* ========================================================= */
                    <>
                      {/* Visual Outstanding Balance Strip */}
                      <div className="p-4 bg-muted/60 border border-border/60 rounded-xl space-y-3">
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <div>
                            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Customer</span>
                            <span className="font-bold text-foreground text-sm">{invoiceToMarkPaid.clients?.name || 'Walk-in Customer'}</span>
                          </div>
                          {vehicle.model && (
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Booked Vehicle</span>
                              <span className="font-bold text-foreground text-xs">🚗 {vehicle.model}</span>
                            </div>
                          )}
                          <div className="text-right">
                            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Total Booking</span>
                            <span className="text-base font-black text-foreground">{formatAmount(total)}</span>
                          </div>
                        </div>

                        {/* Progress Tracker Bar */}
                        <div className="space-y-1.5 pt-1 border-t border-border/40">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Received: {formatAmount(alreadyPaidAmount)} ({Math.min(100, Math.round((alreadyPaidAmount / (total || 1)) * 100))}%)
                            </span>
                            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Due Balance: {formatAmount(remainingBalanceAmount)}
                            </span>
                          </div>
                          <Progress value={Math.min(100, Math.round((alreadyPaidAmount / (total || 1)) * 100))} className="h-2" />
                        </div>
                      </div>

                      {/* Balance Settlement Options */}
                      <div>
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                          Choose Settlement Action
                        </Label>
                        <div className={`grid gap-2.5 ${isFinanced && !isDisbursed ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                          {/* Option 1: Disburse Loan (if Financed) */}
                          {isFinanced && !isDisbursed && (
                            <button
                              type="button"
                              onClick={() => setBalanceSettleType('finance_disburse')}
                              className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                                balanceSettleType === 'finance_disburse'
                                  ? 'border-indigo-600 bg-indigo-500/10 text-indigo-950 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                                  : 'border-border hover:bg-muted/50 text-foreground'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <Landmark className={`w-4 h-4 ${balanceSettleType === 'finance_disburse' ? 'text-indigo-600' : 'text-muted-foreground'}`} />
                                <Badge variant="outline" className="text-[9px] font-bold uppercase text-indigo-600">Disbursal</Badge>
                              </div>
                              <p className="font-bold text-xs">Bank Disbursal</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Loan received from {existingPayment?.finance?.financer || vehicle.financer || 'Bank'}</p>
                            </button>
                          )}

                          {/* Option 2: Full Balance Clearance */}
                          <button
                            type="button"
                            onClick={() => setBalanceSettleType('balance_full')}
                            className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                              balanceSettleType === 'balance_full'
                                ? 'border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                                : 'border-border hover:bg-muted/50 text-foreground'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <CheckCircle2 className={`w-4 h-4 ${balanceSettleType === 'balance_full' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                              <Badge variant="outline" className="text-[9px] font-bold uppercase text-emerald-600">Status: Paid</Badge>
                            </div>
                            <p className="font-bold text-xs">Clear Full Balance</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Clear {formatAmount(remainingBalanceAmount)} in full</p>
                          </button>

                          {/* Option 3: Another Partial Installment */}
                          <button
                            type="button"
                            onClick={() => {
                              setBalanceSettleType('balance_partial');
                              if (!installmentAmount || Number(installmentAmount) >= remainingBalanceAmount) {
                                setInstallmentAmount(String(Math.round(remainingBalanceAmount * 0.5) || remainingBalanceAmount));
                              }
                            }}
                            className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                              balanceSettleType === 'balance_partial'
                                ? 'border-blue-600 bg-blue-500/10 text-blue-950 dark:text-blue-300 ring-2 ring-blue-500/20'
                                : 'border-border hover:bg-muted/50 text-foreground'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <Coins className={`w-4 h-4 ${balanceSettleType === 'balance_partial' ? 'text-blue-600' : 'text-muted-foreground'}`} />
                              <Badge variant="outline" className="text-[9px] font-bold uppercase text-blue-600">Part Payment</Badge>
                            </div>
                            <p className="font-bold text-xs">Part Payment</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Pay part of remaining balance</p>
                          </button>
                        </div>
                      </div>

                      {/* Sub-form A: Bank Disbursal Fields */}
                      {balanceSettleType === 'finance_disburse' && (
                        <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground font-medium">Financed Loan Amount:</span>
                            <span className="font-extrabold text-base text-indigo-700 dark:text-indigo-400">{formatAmount(remainingBalanceAmount)}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold">Financier / Bank</Label>
                              <Select value={financierName} onValueChange={setFinancierName}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Bank" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="HDFC Bank">HDFC Bank</SelectItem>
                                  <SelectItem value="State Bank of India (SBI)">State Bank of India (SBI)</SelectItem>
                                  <SelectItem value="ICICI Bank">ICICI Bank</SelectItem>
                                  <SelectItem value="Kotak Mahindra Prime">Kotak Mahindra Prime</SelectItem>
                                  <SelectItem value="Axis Bank">Axis Bank</SelectItem>
                                  <SelectItem value="Bajaj Auto Finance">Bajaj Auto Finance</SelectItem>
                                  <SelectItem value="Cholamandalam (Chola)">Cholamandalam (Chola)</SelectItem>
                                  <SelectItem value="Tata Capital">Tata Capital</SelectItem>
                                  <SelectItem value="IndusInd Bank">IndusInd Bank</SelectItem>
                                  <SelectItem value="Mahindra Finance">Mahindra Finance</SelectItem>
                                  <SelectItem value="other">Other / Custom</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {financierName === 'other' ? (
                              <div className="space-y-1">
                                <Label className="text-xs font-semibold">Custom Financier Name</Label>
                                <Input
                                  placeholder="Enter bank name"
                                  value={customFinancier}
                                  onChange={(e) => setCustomFinancier(e.target.value)}
                                />
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <Label className="text-xs font-semibold">Loan App / Account No (Optional)</Label>
                                <Input
                                  placeholder="e.g. LN-8291048"
                                  value={loanAccountNo}
                                  onChange={(e) => setLoanAccountNo(e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sub-form B: Full Balance Clearance Alert */}
                      {balanceSettleType === 'balance_full' && (
                        <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground font-medium">Remaining Amount to Clear:</span>
                            <span className="font-extrabold text-base text-emerald-700 dark:text-emerald-400">{formatAmount(remainingBalanceAmount)}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Receiving full remaining balance will bring pending dues to <strong className="text-emerald-600">₹0</strong> and update status to <strong className="text-emerald-600">PAID</strong>.
                          </p>
                        </div>
                      )}

                      {/* Sub-form C: Part Payment Form */}
                      {balanceSettleType === 'balance_partial' && (
                        <div className="p-3.5 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-3">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs font-semibold">Part Payment Amount ({currencySymbol})</Label>
                              <span className="text-[11px] text-muted-foreground">Remaining Balance: {formatAmount(remainingBalanceAmount)}</span>
                            </div>
                            <Input
                              type="number"
                              placeholder="Enter part payment amount"
                              value={installmentAmount}
                              onChange={(e) => setInstallmentAmount(e.target.value)}
                              className="font-bold text-base"
                            />
                          </div>

                          {/* Quick percentage chips of remaining balance */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-muted-foreground">Quick set:</span>
                            {[0.25, 0.5, 0.75, 1.0].map((pct) => {
                              const amt = Math.round(remainingBalanceAmount * pct);
                              return (
                                <button
                                  key={pct}
                                  type="button"
                                  onClick={() => setInstallmentAmount(String(amt))}
                                  className="px-2 py-0.5 bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary rounded text-[10px] font-semibold transition-colors"
                                >
                                  {pct === 1.0 ? '100% Full' : `${pct * 100}%`} ({formatAmount(amt)})
                                </button>
                              );
                            })}
                          </div>

                          {/* Dynamic Calculation breakdown */}
                          {(() => {
                            const instAmt = Number(installmentAmount) || 0;
                            const newRemaining = Math.max(0, remainingBalanceAmount - instAmt);
                            const isComplete = newRemaining === 0 && instAmt > 0;

                            return (
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
                                <div>
                                  <span className="text-muted-foreground block text-[10px]">Paying Now:</span>
                                  <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{formatAmount(instAmt)}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-muted-foreground block text-[10px]">New Remaining Balance:</span>
                                  <span className={`text-sm font-black ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {formatAmount(newRemaining)} {isComplete ? '(100% Cleared)' : ''}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          <div className="space-y-1 pt-1">
                            <Label className="text-xs font-semibold">Next Balance Due Date (Optional)</Label>
                            <Input
                              type="date"
                              value={balanceDueDate}
                              onChange={(e) => setBalanceDueDate(e.target.value)}
                              className="text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* ========================================================= */
                    /* FRESH INVOICE VIEW (No prior payments recorded)           */
                    /* ========================================================= */
                    <>
                      {/* Vehicle & Customer Summary Strip */}
                      <div className="p-3 bg-muted/60 rounded-xl flex flex-wrap justify-between items-center gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Customer</span>
                          <span className="font-bold text-foreground text-sm">{invoiceToMarkPaid.clients?.name || 'Walk-in Customer'}</span>
                        </div>
                        {vehicle.model && (
                          <div className="text-center sm:text-left">
                            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Booked Vehicle</span>
                            <span className="font-bold text-foreground">🚗 {vehicle.model}</span>
                          </div>
                        )}
                        <div className="text-right">
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Invoice Total</span>
                          <span className="text-base font-black text-foreground">{formatAmount(total)}</span>
                        </div>
                      </div>

                      {/* Settlement Type Selector: 3 Cards */}
                      <div>
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                          Select Settlement Mode
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* Full Payment Card */}
                          <button
                            type="button"
                            onClick={() => setPaymentType('full')}
                            className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                              paymentType === 'full'
                                ? 'border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                                : 'border-border hover:bg-muted/50 text-foreground'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <CheckCircle2 className={`w-4 h-4 ${paymentType === 'full' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                              <Badge variant="outline" className="text-[9px] font-bold uppercase">Status: Paid</Badge>
                            </div>
                            <p className="font-bold text-xs">Full Payment</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">100% amount received now</p>
                          </button>

                          {/* Partial Advance Card */}
                          <button
                            type="button"
                            onClick={() => setPaymentType('partial')}
                            className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                              paymentType === 'partial'
                                ? 'border-blue-600 bg-blue-500/10 text-blue-950 dark:text-blue-300 ring-2 ring-blue-500/20'
                                : 'border-border hover:bg-muted/50 text-foreground'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <Coins className={`w-4 h-4 ${paymentType === 'partial' ? 'text-blue-600' : 'text-muted-foreground'}`} />
                              <Badge variant="outline" className="text-[9px] font-bold uppercase">Status: Partial</Badge>
                            </div>
                            <p className="font-bold text-xs">Partial / Token</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Token paid, balance pending</p>
                          </button>

                          {/* Downpayment + Finance Card */}
                          <button
                            type="button"
                            onClick={() => setPaymentType('finance')}
                            className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                              paymentType === 'finance'
                                ? 'border-indigo-600 bg-indigo-500/10 text-indigo-950 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                                : 'border-border hover:bg-muted/50 text-foreground'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <Landmark className={`w-4 h-4 ${paymentType === 'finance' ? 'text-indigo-600' : 'text-muted-foreground'}`} />
                              <Badge variant="outline" className="text-[9px] font-bold uppercase">Auto Finance</Badge>
                            </div>
                            <p className="font-bold text-xs">Downpayment + Loan</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Margin money + bank finance</p>
                          </button>
                        </div>
                      </div>

                      {/* 1. FULL PAYMENT FIELDS */}
                      {paymentType === 'full' && (
                        <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Amount to Clear:</span>
                            <span className="font-extrabold text-base text-emerald-700 dark:text-emerald-400">{formatAmount(total)}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Marking as full payment will clear the receipt balance and set the status to <strong className="text-emerald-600">PAID</strong>.
                          </p>
                        </div>
                      )}

                      {/* 2. PARTIAL PAYMENT FIELDS */}
                      {paymentType === 'partial' && (
                        <div className="p-3.5 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-3">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs font-semibold">Amount Received Now ({currencySymbol})</Label>
                              <span className="text-[11px] text-muted-foreground">Total Booking: {formatAmount(total)}</span>
                            </div>
                            <Input
                              type="number"
                              placeholder="Enter amount paid"
                              value={partialAmount}
                              onChange={(e) => setPartialAmount(e.target.value)}
                              className="font-bold text-base"
                            />
                          </div>

                          {/* Quick Percentage Chips */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-muted-foreground">Quick set:</span>
                            {[0.2, 0.3, 0.5, 0.75].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => setPartialAmount(String(Math.round(total * pct)))}
                                className="px-2 py-0.5 bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary rounded text-[10px] font-semibold transition-colors"
                              >
                                {pct * 100}% ({formatAmount(Math.round(total * pct))})
                              </button>
                            ))}
                          </div>

                          {/* Dynamic Balance Calculation Banner */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
                            <div>
                              <span className="text-muted-foreground block text-[10px]">Received Now:</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{formatAmount(pAmt)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-muted-foreground block text-[10px]">Remaining Balance:</span>
                              <span className="font-black text-rose-600 dark:text-rose-400 text-sm">{formatAmount(pBalance)}</span>
                            </div>
                          </div>

                          <div className="space-y-1 pt-1">
                            <Label className="text-xs font-semibold">Balance Due Date (Optional)</Label>
                            <Input
                              type="date"
                              value={balanceDueDate}
                              onChange={(e) => setBalanceDueDate(e.target.value)}
                              className="text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {/* 3. DOWNPAYMENT + FINANCE FIELDS */}
                      {paymentType === 'finance' && (
                        <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold">Customer Downpayment ({currencySymbol})</Label>
                              <Input
                                type="number"
                                placeholder="e.g. 50000"
                                value={downpaymentAmount}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDownpaymentAmount(val);
                                  setFinancedAmount(String(Math.max(0, total - (Number(val) || 0))));
                                }}
                                className="font-bold"
                              />
                              <span className="text-[10px] text-muted-foreground">Paid upfront by customer</span>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs font-semibold">Financed / Loan Amount ({currencySymbol})</Label>
                              <Input
                                type="number"
                                placeholder="e.g. 450000"
                                value={financedAmount}
                                onChange={(e) => setFinancedAmount(e.target.value)}
                                className="font-bold"
                              />
                              <span className="text-[10px] text-muted-foreground">Funded by bank / NBFC</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold">Financier / Bank</Label>
                              <Select value={financierName} onValueChange={setFinancierName}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Bank" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="HDFC Bank">HDFC Bank</SelectItem>
                                  <SelectItem value="State Bank of India (SBI)">State Bank of India (SBI)</SelectItem>
                                  <SelectItem value="ICICI Bank">ICICI Bank</SelectItem>
                                  <SelectItem value="Kotak Mahindra Prime">Kotak Mahindra Prime</SelectItem>
                                  <SelectItem value="Axis Bank">Axis Bank</SelectItem>
                                  <SelectItem value="Bajaj Auto Finance">Bajaj Auto Finance</SelectItem>
                                  <SelectItem value="Cholamandalam (Chola)">Cholamandalam (Chola)</SelectItem>
                                  <SelectItem value="Tata Capital">Tata Capital</SelectItem>
                                  <SelectItem value="IndusInd Bank">IndusInd Bank</SelectItem>
                                  <SelectItem value="Mahindra Finance">Mahindra Finance</SelectItem>
                                  <SelectItem value="other">Other / Custom</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {financierName === 'other' ? (
                              <div className="space-y-1">
                                <Label className="text-xs font-semibold">Enter Financier Name</Label>
                                <Input
                                  placeholder="Bank / Financier Name"
                                  value={customFinancier}
                                  onChange={(e) => setCustomFinancier(e.target.value)}
                                />
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <Label className="text-xs font-semibold">Loan App / Account No (Optional)</Label>
                                <Input
                                  placeholder="e.g. LN-8291048"
                                  value={loanAccountNo}
                                  onChange={(e) => setLoanAccountNo(e.target.value)}
                                />
                              </div>
                            )}
                          </div>

                          {/* Disbursal State Radio Switch */}
                          <div className="pt-2 border-t border-border/50">
                            <Label className="text-xs font-semibold block mb-1.5">Bank Loan Disbursal Status</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setFinanceStatus('disbursed')}
                                className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                                  financeStatus === 'disbursed'
                                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 font-bold'
                                    : 'border-border hover:bg-muted text-muted-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span>Loan Disbursed & Received</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-normal block mt-0.5">
                                  Status updates to <strong>PAID</strong> (100% Cleared)
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setFinanceStatus('pending')}
                                className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                                  financeStatus === 'pending'
                                    ? 'border-amber-600 bg-amber-500/10 text-amber-950 dark:text-amber-300 font-bold'
                                    : 'border-border hover:bg-muted text-muted-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                                  <span>Sanctioned / Pending Disbursal</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-normal block mt-0.5">
                                  Status updates to <strong>PARTIAL</strong> (DP cleared)
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* COMMON PAYMENT DETAILS (Method, Ref, Date) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        {isSettlingExistingBalance && balanceSettleType === 'finance_disburse'
                          ? "Disbursal Channel"
                          : paymentType === 'finance' && !isSettlingExistingBalance
                          ? "Downpayment Mode"
                          : "Payment Method"}
                      </Label>
                      <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="upi">UPI / Online Transfer</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</SelectItem>
                          <SelectItem value="cheque">Cheque / Demand Draft</SelectItem>
                          <SelectItem value="card">Debit / Credit Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Payment Date</Label>
                      <Input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Transaction / Reference Number (Optional)</Label>
                    <Input
                      placeholder="e.g. UPI txn ID, Cheque number, Bank UTR..."
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
                  <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmittingPayment}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleMarkAsPaid}
                    disabled={isSubmittingPayment}
                    className={`font-semibold text-white ${
                      isSettlingExistingBalance
                        ? balanceSettleType === 'balance_partial'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : balanceSettleType === 'finance_disburse'
                          ? 'bg-indigo-600 hover:bg-indigo-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                        : paymentType === 'partial'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : paymentType === 'finance' && financeStatus === 'pending'
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {isSubmittingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving Payment...
                      </>
                    ) : isSettlingExistingBalance ? (
                      balanceSettleType === 'finance_disburse' ? (
                        `Confirm Loan Disbursal (${currencySymbol}${formatAmount(remainingBalanceAmount)}) & Mark Paid`
                      ) : balanceSettleType === 'balance_partial' ? (
                        `Record Part Payment (${currencySymbol}${installmentAmount || 0})`
                      ) : (
                        `Clear Balance (${currencySymbol}${formatAmount(remainingBalanceAmount)}) & Mark Paid`
                      )
                    ) : paymentType === 'partial' ? (
                      `Record Partial Payment (${currencySymbol}${partialAmount})`
                    ) : paymentType === 'finance' ? (
                      financeStatus === 'disbursed' ? "Confirm Disbursed & Mark Paid" : "Record DP & Set Finance In-Process"
                    ) : (
                      "Confirm Full Payment (Mark Paid)"
                    )}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

  );
};
