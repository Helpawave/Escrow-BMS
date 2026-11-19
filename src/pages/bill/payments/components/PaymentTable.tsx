import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { PaymentActiveTab } from '../types';
import { getPaymentTypeBadge } from '../utils/paymentUtils';
import {
  AlertCircle,
  Banknote,
  Car,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Edit,
  FileText,
  Smartphone,
  Trash2,
} from "lucide-react";

interface PaymentTableProps {
  payments: any[];
  activeTab: PaymentActiveTab;
  onUpdatePaymentMethod: (paymentId: string, method: string) => void;
  onEdit: (payment: any) => void;
  onDelete: (paymentId: string) => void;
  getCreatorTag: (notes?: string | null) => string;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({
  payments,
  activeTab,
  onUpdatePaymentMethod,
  onEdit,
  onDelete,
  getCreatorTag,
}) => {
  const { formatAmount } = useCurrency();

  return (
    <Card className="hidden md:block overflow-hidden bg-card dark:bg-card border border-border/80 rounded-2xl shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Date</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {activeTab === 'purchase' ? 'Purchase Bill #' : activeTab === 'downpayment' ? 'Receipt / DP #' : 'Sales Invoice #'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {activeTab === 'purchase' ? 'Vendor Name' : 'Customer Name'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {activeTab === 'purchase' ? 'Amount Paid' : 'Amount Received'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Method</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Reference</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.map((payment) => {
              const invoiceType = (payment as unknown as { invoice_type?: string }).invoice_type;
              const partyName = (payment as unknown as { party_name?: string }).party_name || payment.invoices?.clients?.name || 'Unknown';
              const displayNumber = (payment as unknown as { display_number?: string }).display_number || payment.invoices?.invoice_number || 'N/A';
              const isDownpayment = Boolean((payment as unknown as { is_downpayment?: boolean }).is_downpayment || displayNumber.startsWith('DP-'));

              return (
                <tr key={payment.id} className="hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">
                      {safelyToLocaleDate(payment.payment_date)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-foreground">{displayNumber}</span>
                      {isDownpayment ? (
                        <Badge
                          variant="outline"
                          className="text-[8px] px-1 py-0 font-bold uppercase bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 flex items-center gap-1"
                        >
                          <Car className="w-2.5 h-2.5" />
                          Downpayment
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[8px] px-1 py-0 font-semibold uppercase",
                            invoiceType === 'purchase'
                              ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                          )}
                        >
                          {invoiceType === 'purchase' ? 'Purchase' : 'Sales'}
                        </Badge>
                      )}
                      {getPaymentTypeBadge(payment)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{partyName}</div>
                    <div className="text-[10px] text-muted-foreground/60 font-normal mt-0.5">
                      {getCreatorTag(payment.notes)}
                    </div>
                    {payment.downpayment_breakdown && (
                      <div className="mt-1.5 text-[11px] p-2 rounded-lg bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300/50 dark:border-amber-800/40 text-amber-950 dark:text-amber-200 font-medium">
                        <div className="flex items-center gap-1 font-bold">
                          <Car className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>{payment.downpayment_breakdown.installment_label}:</span>
                          <span className="text-foreground">{formatAmount(Number(payment.amount || 0))}</span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground flex flex-wrap gap-x-1.5 gap-y-0.5">
                          <span>🚗 Initial Downpayment: <strong>{formatAmount(payment.downpayment_breakdown.downpayment_amount)}</strong></span>
                          <span>•</span>
                          <span>
                            💳 2nd Partial: <strong>
                              {payment.downpayment_breakdown.partial_amount > 0
                                ? formatAmount(payment.downpayment_breakdown.partial_amount)
                                : `${formatAmount(payment.downpayment_breakdown.remaining_balance)} due`}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>Total: <strong>{formatAmount(payment.downpayment_breakdown.total_vehicle_amount)}</strong></span>
                          <span>•</span>
                          {payment.downpayment_breakdown.remaining_balance > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">Due: {formatAmount(payment.downpayment_breakdown.remaining_balance)}</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> 100% Cleared
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className={cn(
                      "text-sm font-bold",
                      invoiceType === 'purchase' ? "text-purple-600 dark:text-purple-400" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {formatAmount(Math.round(Number(payment.amount || 0)), { decimals: 0 })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {payment.payment_method === 'pending' || !payment.payment_method ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all border border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700 shadow-sm cursor-pointer active:scale-95 animate-pulse"
                            title="Click to select payment method"
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Select Method</span>
                            <ChevronDown className="w-3.5 h-3.5 opacity-70 ml-0.5 text-amber-700" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 p-1.5 rounded-2xl shadow-xl border border-border/80 z-50">
                          <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            Select Payment Method
                          </div>
                          <DropdownMenuItem
                            onClick={() => onUpdatePaymentMethod(payment.id, 'cash')}
                            className="cursor-pointer font-bold text-xs py-2 hover:bg-emerald-50 text-emerald-900 dark:text-emerald-100 rounded-lg flex items-center gap-2"
                          >
                            <Banknote className="w-4 h-4 text-emerald-600" />
                            <span>Cash</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onUpdatePaymentMethod(payment.id, 'upi')}
                            className="cursor-pointer font-bold text-xs py-2 hover:bg-violet-50 text-violet-900 dark:text-violet-100 rounded-lg flex items-center gap-2"
                          >
                            <Smartphone className="w-4 h-4 text-violet-600" />
                            <span>UPI / Online</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onUpdatePaymentMethod(payment.id, 'bank_transfer')}
                            className="cursor-pointer font-bold text-xs py-2 hover:bg-blue-50 text-blue-900 dark:text-blue-100 rounded-lg flex items-center gap-2"
                          >
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span>Bank Transfer</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onUpdatePaymentMethod(payment.id, 'cheque')}
                            className="cursor-pointer font-bold text-xs py-2 hover:bg-amber-50 text-amber-900 dark:text-amber-100 rounded-lg flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4 text-amber-600" />
                            <span>Cheque</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onUpdatePaymentMethod(payment.id, 'credit_card')}
                            className="cursor-pointer font-bold text-xs py-2 hover:bg-rose-50 text-rose-900 dark:text-rose-100 rounded-lg flex items-center gap-2"
                          >
                            <CreditCard className="w-4 h-4 text-rose-600" />
                            <span>Credit Card</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onUpdatePaymentMethod(payment.id, 'debit_card')}
                            className="cursor-pointer font-bold text-xs py-2 hover:bg-indigo-50 text-indigo-900 dark:text-indigo-100 rounded-lg flex items-center gap-2"
                          >
                            <CreditCard className="w-4 h-4 text-indigo-600" />
                            <span>Debit Card</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs uppercase font-bold",
                          payment.payment_method === 'cash' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400" :
                          payment.payment_method === 'upi' ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400" :
                          payment.payment_method === 'bank_transfer' ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400" :
                          payment.payment_method === 'cheque' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400" :
                          payment.payment_method === 'credit_card' ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400" :
                          payment.payment_method === 'debit_card' ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400" :
                          "dark:bg-slate-800 dark:text-slate-300"
                        )}
                      >
                        {payment.payment_method.replace('_', ' ').toUpperCase()}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-muted-foreground">
                      {payment.reference_number || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(payment)}
                        className="h-8 w-8 p-0"
                        title="Edit Payment"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(payment.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete Payment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
