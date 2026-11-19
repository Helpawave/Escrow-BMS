import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useNavigate } from "react-router-dom";
import { PaymentActiveTab } from '../types';
import { getMethodLabel } from '../utils/paymentUtils';
import {
  AlertCircle,
  Banknote,
  Car,
  Clock,
  CreditCard,
  FileCheck,
  Filter,
  Landmark,
  Receipt,
  ShoppingCart,
  Smartphone,
  X,
} from "lucide-react";

interface PaymentStatsGridProps {
  activeTab: PaymentActiveTab;
  stats: any;
  methodFilter: string;
  onMethodFilterChange: (method: string) => void;
  dateFilterLabel: string;
}

export const PaymentStatsGrid: React.FC<PaymentStatsGridProps> = ({
  activeTab,
  stats,
  methodFilter,
  onMethodFilterChange,
  dateFilterLabel,
}) => {
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();

  const isSales = activeTab === 'sales';
  const isDownpayment = activeTab === 'downpayment';

  const totalAmount = isSales
    ? (stats?.salesTotal ?? 0)
    : isDownpayment
    ? (stats?.downpaymentTotal ?? 0)
    : (stats?.purchaseTotal ?? 0);

  const totalCount = isSales
    ? (stats?.salesRecords ?? 0)
    : isDownpayment
    ? (stats?.downpaymentRecords ?? 0)
    : (stats?.purchaseRecords ?? 0);

  const pendingCount = isSales
    ? (stats?.pendingSalesCount ?? 0)
    : isDownpayment
    ? (stats?.pendingDownpaymentCount ?? 0)
    : (stats?.pendingPurchaseCount ?? 0);

  const cashAmount = isSales
    ? (stats?.salesCash ?? 0)
    : isDownpayment
    ? (stats?.downpaymentCash ?? 0)
    : (stats?.purchaseCash ?? 0);

  const cashCount = isSales
    ? (stats?.salesCashCount ?? 0)
    : isDownpayment
    ? (stats?.downpaymentCashCount ?? 0)
    : (stats?.purchaseCashCount ?? 0);

  const upiAmount = isSales
    ? (stats?.salesUpi ?? 0)
    : isDownpayment
    ? (stats?.downpaymentUpi ?? 0)
    : (stats?.purchaseUpi ?? 0);

  const upiCount = isSales
    ? (stats?.salesUpiCount ?? 0)
    : isDownpayment
    ? (stats?.downpaymentUpiCount ?? 0)
    : (stats?.purchaseUpiCount ?? 0);

  const bankAmount = isSales
    ? (stats?.salesBankTransfer ?? 0)
    : isDownpayment
    ? (stats?.downpaymentBankTransfer ?? 0)
    : (stats?.purchaseBankTransfer ?? 0);

  const bankCount = isSales
    ? (stats?.salesBankTransferCount ?? 0)
    : isDownpayment
    ? (stats?.downpaymentBankTransferCount ?? 0)
    : (stats?.purchaseBankTransferCount ?? 0);

  const chequeAmount = isSales
    ? (stats?.salesCheque ?? 0)
    : isDownpayment
    ? (stats?.downpaymentCheque ?? 0)
    : (stats?.purchaseCheque ?? 0);

  const chequeCount = isSales
    ? (stats?.salesChequeCount ?? 0)
    : isDownpayment
    ? (stats?.downpaymentChequeCount ?? 0)
    : (stats?.purchaseChequeCount ?? 0);

  const cardAmount = isSales
    ? (stats?.salesCard ?? 0)
    : isDownpayment
    ? (stats?.downpaymentCard ?? 0)
    : (stats?.purchaseCard ?? 0);

  const cardCount = isSales
    ? (stats?.salesCardCount ?? 0)
    : isDownpayment
    ? (stats?.downpaymentCardCount ?? 0)
    : (stats?.purchaseCardCount ?? 0);

  const otherAmount = isSales
    ? (stats?.salesOther ?? 0)
    : isDownpayment
    ? (stats?.downpaymentOther ?? 0)
    : (stats?.purchaseOther ?? 0);

  const otherCount = isSales
    ? (stats?.salesOtherCount ?? 0)
    : isDownpayment
    ? (stats?.downpaymentOtherCount ?? 0)
    : (stats?.purchaseOtherCount ?? 0);

  return (
    <div className="space-y-3.5">
      {/* Unified Stats Grid */}
      <div className={cn(
        "grid gap-2.5 sm:gap-3",
        methodFilter === 'all'
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
          : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
      )}>
        {/* 1. Total Received / Total Paid */}
        <Card
          onClick={() => onMethodFilterChange('all')}
          className="p-3 sm:p-4 bg-card dark:bg-card border border-border/70 dark:border-border/60 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all cursor-pointer select-none hover:border-primary/40 hover:bg-muted/30"
        >
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/80 leading-tight truncate flex-1" title={isSales ? "Total Received" : isDownpayment ? "Downpayment Advances" : "Total Paid"}>
              {isSales ? "Total Received" : isDownpayment ? "Downpayment Advances" : "Total Paid"}
            </span>
            <div className={cn(
              "w-7 h-7 sm:w-8 sm:h-8 rounded-xl shrink-0 flex items-center justify-center",
              isSales ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : isDownpayment ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
            )}>
              {isSales ? <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : isDownpayment ? <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </div>
          </div>
          <div className="my-auto py-0.5 w-full overflow-hidden">
            <p className="text-base sm:text-xl lg:text-2xl font-black text-foreground tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
              {formatAmount(Math.round(totalAmount), { decimals: 0 })}
            </p>
          </div>
          <div className="flex items-center justify-between text-[10px] font-semibold mt-1.5 pt-1.5 border-t border-border/40 gap-1 truncate">
            <span className={cn(
              isSales ? "text-emerald-600/90 dark:text-emerald-400/90" : isDownpayment ? "text-amber-600/90 dark:text-amber-400/90" : "text-purple-600/90 dark:text-purple-400/90",
              "truncate"
            )}>
              {isSales ? "Customer Collections" : isDownpayment ? "Vehicle Downpayments" : "Vendor Outflow"}
            </span>
            <span className="text-muted-foreground/70 font-normal">({dateFilterLabel})</span>
          </div>
        </Card>

        {/* 2. Total Records */}
        <Card className="p-3 sm:p-4 bg-card dark:bg-card border border-border/70 dark:border-border/60 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/80 leading-tight truncate flex-1" title="Total Entries">
              Total Records
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-auto py-0.5 w-full overflow-hidden">
            <p className="text-base sm:text-xl lg:text-2xl font-black text-foreground tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
              {totalCount.toLocaleString('en-IN')}
            </p>
          </div>
          <p className="text-[10px] font-semibold text-blue-600/90 dark:text-blue-400/90 mt-1.5 pt-1.5 border-t border-border/40 truncate">
            {isSales ? "Sales Receipts" : isDownpayment ? "Downpayment Entries" : "Payment Entries"}
          </p>
        </Card>

        {/* 3. Pending Invoices / Pending Downpayments / Pending Bills */}
        <Card 
          onClick={() => navigate(isSales ? '/invoices?status=pending' : isDownpayment ? '/downpayment-invoices?status=pending' : '/purchase-invoices?status=pending')}
          className="p-3 sm:p-4 bg-card dark:bg-card border border-border/70 dark:border-border/60 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all cursor-pointer select-none hover:border-amber-500/40 hover:bg-amber-50/10 dark:hover:bg-amber-950/10"
        >
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/80 leading-tight truncate flex-1" title={isSales ? "Pending Invoices" : isDownpayment ? "Pending Downpayments" : "Pending Bills"}>
              {isSales ? "Pending Invoices" : isDownpayment ? "Pending Downpayments" : "Pending Bills"}
            </span>
            <div className={cn(
              "w-7 h-7 sm:w-8 sm:h-8 rounded-xl shrink-0 flex items-center justify-center",
              isSales ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : isDownpayment ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
            )}>
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-auto py-0.5 w-full overflow-hidden">
            <p className="text-base sm:text-xl lg:text-2xl font-black text-foreground tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
              {pendingCount.toLocaleString('en-IN')}
            </p>
          </div>
          <p className={cn(
            "text-[10px] font-semibold mt-1.5 pt-1.5 border-t border-border/40 truncate",
            isSales ? "text-amber-600/90 dark:text-amber-400/90" : isDownpayment ? "text-amber-600/90 dark:text-amber-400/90" : "text-orange-600/90 dark:text-orange-400/90"
          )}>
            {isSales ? "Invoices Pending" : isDownpayment ? "Vehicles Pending" : "Bills Pending"}
          </p>
        </Card>

        {/* 4 & 5. Payment Method Cards */}
        {methodFilter === 'all' ? (
          <>
            {/* Default: Cash Card */}
            <Card
              onClick={() => onMethodFilterChange('cash')}
              className="p-3 sm:p-4 bg-card dark:bg-card border border-emerald-500/20 dark:border-emerald-900/40 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20"
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 leading-tight truncate flex-1" title={isSales ? "Cash Received" : "Cash Disbursed"}>
                  {isSales ? "Cash Received" : "Cash Disbursed"}
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center justify-center">
                  <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="my-auto py-0.5 w-full overflow-hidden">
                <p className="text-base sm:text-xl lg:text-2xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
                  {formatAmount(Math.round(cashAmount), { decimals: 0 })}
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-600/90 dark:text-emerald-400/90 mt-1.5 pt-1.5 border-t border-border/40 gap-1 truncate">
                <span className="truncate">{cashCount} {isSales ? 'Inflow' : 'Disbursed'}</span>
                <span className="text-[9px] text-muted-foreground/70 font-normal">Cash</span>
              </div>
            </Card>

            {/* Default: UPI Card */}
            <Card
              onClick={() => onMethodFilterChange('upi')}
              className="p-3 sm:p-4 bg-card dark:bg-card border border-violet-500/20 dark:border-violet-900/40 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all cursor-pointer hover:border-violet-500/50 hover:bg-violet-50/20 dark:hover:bg-violet-950/20"
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 leading-tight truncate flex-1" title={isSales ? "UPI Received" : "Digital Disbursed"}>
                  {isSales ? "UPI Received" : "Digital Disbursed"}
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0 flex items-center justify-center">
                  <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="my-auto py-0.5 w-full overflow-hidden">
                <p className="text-base sm:text-xl lg:text-2xl font-black text-violet-700 dark:text-violet-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
                  {formatAmount(Math.round(upiAmount), { decimals: 0 })}
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] font-semibold text-violet-600/90 dark:text-violet-400/90 mt-1.5 pt-1.5 border-t border-border/40 gap-1 truncate">
                <span className="truncate">{upiCount} Collections</span>
                <span className="text-[9px] text-muted-foreground/70 font-normal">GPay / QR</span>
              </div>
            </Card>
          </>
        ) : methodFilter === 'cash' ? (
          /* Selected Filter: Cash */
          <Card
            onClick={() => onMethodFilterChange('all')}
            className="p-3 sm:p-4 bg-card dark:bg-card border border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all cursor-pointer select-none"
            title="Click to clear filter"
          >
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 leading-tight truncate flex-1" title={isSales ? "Cash Received" : "Cash Paid"}>
                💵 {isSales ? "Cash Received" : "Cash Paid"}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center justify-center">
                <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="my-auto py-0.5 w-full overflow-hidden">
              <p className="text-base sm:text-xl lg:text-2xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
                {formatAmount(Math.round(cashAmount), { decimals: 0 })}
              </p>
            </div>
            <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-600/90 dark:text-emerald-400/90 mt-1.5 pt-1.5 border-t border-border/40 gap-1 truncate">
              <span className="truncate">{cashCount} {isSales ? 'Cash Inflow' : 'Cash Outflow'}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-600/15 text-emerald-600 dark:text-emerald-400">Filtered</span>
            </div>
          </Card>
        ) : methodFilter === 'upi' ? (
          /* Selected Filter: UPI */
          <Card
            onClick={() => onMethodFilterChange('all')}
            className="p-3 sm:p-4 bg-card dark:bg-card border border-violet-500 ring-2 ring-violet-500/25 bg-violet-50/70 dark:bg-violet-950/40 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all cursor-pointer select-none"
            title="Click to clear filter"
          >
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 leading-tight truncate flex-1" title={isSales ? "UPI Received" : "UPI Paid"}>
                📱 {isSales ? "UPI Received" : "UPI Paid"}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-violet-500/20 text-violet-600 dark:text-violet-400 shrink-0 flex items-center justify-center">
                <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="my-auto py-0.5 w-full overflow-hidden">
              <p className="text-base sm:text-xl lg:text-2xl font-black text-violet-700 dark:text-violet-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
                {formatAmount(Math.round(upiAmount), { decimals: 0 })}
              </p>
            </div>
            <div className="flex items-center justify-between text-[10px] font-semibold text-violet-600/90 dark:text-violet-400/90 mt-1.5 pt-1.5 border-t border-border/40 gap-1 truncate">
              <span className="truncate">{upiCount} Collections • QR & UPI</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-violet-600/15 text-violet-600 dark:text-violet-400">Filtered</span>
            </div>
          </Card>
        ) : methodFilter === 'bank_transfer' ? (
          /* Selected Filter: Bank Transfer */
          <Card
            onClick={() => onMethodFilterChange('all')}
            className="p-3 sm:p-4 bg-card dark:bg-card border border-sky-500 ring-2 ring-sky-500/25 bg-sky-50/70 dark:bg-sky-950/40 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all cursor-pointer select-none"
            title="Click to clear filter"
          >
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 leading-tight truncate flex-1" title={isSales ? "Bank Transfer Received" : "Bank Transfer Paid"}>
                🏛️ {isSales ? "Bank Transfer Received" : "Bank Transfer Paid"}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 shrink-0 flex items-center justify-center">
                <Landmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="my-auto py-0.5 w-full overflow-hidden">
              <p className="text-base sm:text-xl lg:text-2xl font-black text-sky-700 dark:text-sky-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
                {formatAmount(Math.round(bankAmount), { decimals: 0 })}
              </p>
            </div>
            <div className="flex items-center justify-between text-[10px] font-semibold text-sky-600/90 dark:text-sky-400/90 mt-1.5 pt-1.5 border-t border-border/40 gap-1 truncate">
              <span className="truncate">{bankCount} Entries • NEFT / RTGS / IMPS</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-600/15 text-sky-600 dark:text-sky-400">Filtered</span>
            </div>
          </Card>
        ) : methodFilter === 'cheque' ? (
          /* Selected Filter: Cheque */
          <Card
            onClick={() => onMethodFilterChange('all')}
            className="p-3 sm:p-4 bg-card dark:bg-card border border-amber-500 ring-2 ring-amber-500/25 bg-amber-50/70 dark:bg-amber-950/40 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all cursor-pointer select-none"
            title="Click to clear filter"
          >
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 leading-tight truncate flex-1" title={isSales ? "Cheque Received" : "Cheque Paid"}>
                📑 {isSales ? "Cheque Received" : "Cheque Paid"}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 flex items-center justify-center">
                <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="my-auto py-0.5 w-full overflow-hidden">
              <p className="text-base sm:text-xl lg:text-2xl font-black text-amber-700 dark:text-amber-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
                {formatAmount(Math.round(chequeAmount), { decimals: 0 })}
              </p>
            </div>
            <div className="flex items-center justify-between text-[10px] font-semibold text-amber-600/90 dark:text-amber-400/90 mt-1.5 pt-1.5 border-t border-border/40 gap-1 truncate">
              <span className="truncate">{chequeCount} Entries • Cheques & DD</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-600/15 text-amber-600 dark:text-amber-400">Filtered</span>
            </div>
          </Card>
        ) : (methodFilter === 'credit_card' || methodFilter === 'debit_card' || methodFilter === 'card') ? (
          /* Selected Filter: Cards */
          <Card
            onClick={() => onMethodFilterChange('all')}
            className="p-3 sm:p-4 bg-card dark:bg-card border border-rose-500 ring-2 ring-rose-500/25 bg-rose-50/70 dark:bg-rose-950/40 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all cursor-pointer select-none"
            title="Click to clear filter"
          >
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 leading-tight truncate flex-1" title={isSales ? "Cards Received" : "Cards Paid"}>
                💳 {isSales ? "Cards Received" : "Cards Paid"}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0 flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="my-auto py-0.5 w-full overflow-hidden">
              <p className="text-base sm:text-xl lg:text-2xl font-black text-rose-700 dark:text-rose-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
                {formatAmount(Math.round(cardAmount), { decimals: 0 })}
              </p>
            </div>
            <div className="flex items-center justify-between text-[10px] font-semibold text-rose-600/90 dark:text-rose-400/90 mt-1.5 pt-1.5 border-t border-border/40 gap-1 truncate">
              <span className="truncate">{cardCount} Entries • Credit & Debit</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-600/15 text-rose-600 dark:text-rose-400">Filtered</span>
            </div>
          </Card>
        ) : (
          /* Selected Filter: Other / Pending */
          <Card
            onClick={() => onMethodFilterChange('all')}
            className="p-3 sm:p-4 bg-card dark:bg-card border border-slate-500 ring-2 ring-slate-500/25 bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all cursor-pointer select-none"
            title="Click to clear filter"
          >
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 leading-tight truncate flex-1" title={isSales ? "Other / Pending Received" : "Other / Pending Paid"}>
                ⚠️ {methodFilter === 'pending' ? 'Pending Mode' : 'Other Methods'}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-500/20 text-slate-600 dark:text-slate-400 shrink-0 flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="my-auto py-0.5 w-full overflow-hidden">
              <p className="text-base sm:text-xl lg:text-2xl font-black text-slate-700 dark:text-slate-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
                {formatAmount(Math.round(otherAmount), { decimals: 0 })}
              </p>
            </div>
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600/90 dark:text-slate-400/90 mt-1.5 pt-1.5 border-t border-border/40 gap-1 truncate">
              <span className="truncate">{otherCount} Entries • Unclassified Modes</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-600/15 text-slate-600 dark:text-slate-400">Filtered</span>
            </div>
          </Card>
        )}
      </div>

      {/* Interactive Active Filter Summary Banner */}
      {methodFilter !== 'all' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-foreground animate-in fade-in duration-200">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary text-primary-foreground font-bold text-[11px]">
              <Filter className="w-3 h-3" />
              <span>Active Filter: {getMethodLabel(methodFilter)}</span>
            </div>
            <span className="text-muted-foreground">
              Matching {isSales ? 'customer collections' : 'vendor disbursements'} for <strong>{dateFilterLabel}</strong>:
            </span>
            <span className="font-extrabold text-foreground text-sm">
              {formatAmount(Math.round(isSales ? (stats?.selectedMethodSalesTotal ?? 0) : (stats?.selectedMethodPurchaseTotal ?? 0)), { decimals: 0 })}
            </span>
            <span className="text-muted-foreground text-[11px]">
              ({isSales ? (stats?.selectedMethodSalesCount ?? 0) : (stats?.selectedMethodPurchaseCount ?? 0)} records found)
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMethodFilterChange('all')}
            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-background/80 self-end sm:self-auto shrink-0"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Clear Filter
          </Button>
        </div>
      )}
    </div>
  );
};
