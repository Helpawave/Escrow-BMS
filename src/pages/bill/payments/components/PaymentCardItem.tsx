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

interface PaymentCardItemProps {
  payment: any;
  onUpdatePaymentMethod: (paymentId: string, method: string) => void;
  onEdit: (payment: any) => void;
  onDelete: (paymentId: string) => void;
}

export const PaymentCardItem: React.FC<PaymentCardItemProps> = ({
  payment,
  onUpdatePaymentMethod,
  onEdit,
  onDelete,
}) => {
  const { formatAmount } = useCurrency();

  const invoiceType = (payment as unknown as { invoice_type?: string }).invoice_type;
  const partyName = (payment as unknown as { party_name?: string }).party_name || payment.invoices?.clients?.name || 'Unknown';
  const displayNumber = (payment as unknown as { display_number?: string }).display_number || payment.invoices?.invoice_number || 'N/A';
  const isDownpayment = Boolean((payment as unknown as { is_downpayment?: boolean }).is_downpayment || displayNumber.startsWith('DP-'));

  return (
    <Card className="p-4 bg-card dark:bg-card border border-border/80 rounded-2xl shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-foreground">{displayNumber}</span>
            {isDownpayment ? (
              <Badge
                variant="outline"
                className="text-[8px] px-1.5 py-0.5 font-bold uppercase bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 flex items-center gap-1"
              >
                <Car className="w-2.5 h-2.5" />
                Downpayment
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className={cn(
                  "text-[8px] px-1.5 py-0.5 font-semibold uppercase",
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
          <p className="text-sm font-semibold text-foreground mt-1">{partyName}</p>
          <p className="text-xs text-muted-foreground">{safelyToLocaleDate(payment.payment_date)}</p>
        </div>
        <div className="text-right">
          <div className={cn(
            "text-base font-black",
            invoiceType === 'purchase' ? "text-purple-600 dark:text-purple-400" : "text-emerald-600 dark:text-emerald-400"
          )}>
            {formatAmount(Math.round(Number(payment.amount || 0)), { decimals: 0 })}
          </div>
          {payment.reference_number && (
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Ref: {payment.reference_number}</p>
          )}
        </div>
      </div>

      {/* Rich Downpayment Split Breakdown Chip */}
      {payment.downpayment_breakdown && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-800/40 space-y-1 text-xs">
          <div className="flex items-center justify-between font-bold text-amber-950 dark:text-amber-200">
            <span className="flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              {payment.downpayment_breakdown.installment_label}
            </span>
            <span className="text-[11px] font-black">
              Vehicle: {formatAmount(payment.downpayment_breakdown.total_vehicle_amount)}
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground flex flex-col gap-0.5 pt-0.5">
            <div className="flex items-center justify-between">
              <span>🚗 Initial Downpayment:</span>
              <strong className="text-foreground">{formatAmount(payment.downpayment_breakdown.downpayment_amount)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>💳 2nd Partial / Balance:</span>
              <strong className="text-foreground">
                {payment.downpayment_breakdown.partial_amount > 0
                  ? formatAmount(payment.downpayment_breakdown.partial_amount)
                  : `${formatAmount(payment.downpayment_breakdown.remaining_balance)} Due`}
              </strong>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-amber-200/50 dark:border-amber-800/30">
              <span>Settlement Status:</span>
              {payment.downpayment_breakdown.remaining_balance > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  ⚠️ Pending Due: {formatAmount(payment.downpayment_breakdown.remaining_balance)}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 100% Fully Settled
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <div className="flex items-center gap-1.5">
          {payment.payment_method === 'pending' || !payment.payment_method ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase border border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                >
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span>Select Method</span>
                  <ChevronDown className="w-3 h-3 opacity-70 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 p-1.5 rounded-2xl shadow-xl border border-border/80 z-50">
                <DropdownMenuItem onClick={() => onUpdatePaymentMethod(payment.id, 'cash')}>
                  <Banknote className="w-4 h-4 mr-2 text-emerald-600" /> Cash
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdatePaymentMethod(payment.id, 'upi')}>
                  <Smartphone className="w-4 h-4 mr-2 text-violet-600" /> UPI / Online
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdatePaymentMethod(payment.id, 'bank_transfer')}>
                  <CreditCard className="w-4 h-4 mr-2 text-blue-600" /> Bank Transfer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdatePaymentMethod(payment.id, 'cheque')}>
                  <FileText className="w-4 h-4 mr-2 text-amber-600" /> Cheque
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdatePaymentMethod(payment.id, 'credit_card')}>
                  <CreditCard className="w-4 h-4 mr-2 text-rose-600" /> Credit Card
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdatePaymentMethod(payment.id, 'debit_card')}>
                  <CreditCard className="w-4 h-4 mr-2 text-indigo-600" /> Debit Card
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] uppercase font-bold px-2 py-0.5",
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
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(payment)}
            className="h-8 px-2.5 text-xs font-semibold"
          >
            <Edit className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(payment.id)}
            className="h-8 px-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
          </Button>
        </div>
      </div>
    </Card>
  );
};
