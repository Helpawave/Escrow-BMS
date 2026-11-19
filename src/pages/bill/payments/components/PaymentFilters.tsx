import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PaymentActiveTab, DownpaymentSubTab } from '../types';
import { Car, CheckCircle2, CreditCard, Search, X } from "lucide-react";

interface PaymentFiltersProps {
  activeTab: PaymentActiveTab;
  downpaymentSubTab: DownpaymentSubTab;
  onDownpaymentSubTabChange: (tab: DownpaymentSubTab) => void;
  downpaymentPaymentsCount: number;
  advancePaymentsCount: number;
  partialPaymentsCount: number;
  vehicleLedgerCount: number;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  methodFilter: string;
  onMethodFilterChange: (method: string) => void;
  dateFilter: string;
  onDateFilterChange: (filter: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  searchLoading: boolean;
}

export const PaymentFilters: React.FC<PaymentFiltersProps> = ({
  activeTab,
  downpaymentSubTab,
  onDownpaymentSubTabChange,
  downpaymentPaymentsCount,
  advancePaymentsCount,
  partialPaymentsCount,
  vehicleLedgerCount,
  searchTerm,
  onSearchTermChange,
  methodFilter,
  onMethodFilterChange,
  dateFilter,
  onDateFilterChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  searchLoading,
}) => {
  return (
    <div className="space-y-4">
      {/* Downpayments Dedicated Sub-Tabs Bar: All vs 1st Advances vs 2nd Partial/Balance vs Vehicle Ledger */}
      {activeTab === 'downpayment' && (
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-muted/40 border border-border/60 overflow-x-auto shadow-sm">
          <button
            type="button"
            onClick={() => onDownpaymentSubTabChange('all')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
              downpaymentSubTab === 'all'
                ? "bg-background text-foreground shadow-sm border border-border/80"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Car className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>All Downpayment Records</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-black">
              {downpaymentPaymentsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onDownpaymentSubTabChange('advance')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
              downpaymentSubTab === 'advance'
                ? "bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Car className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>🚗 1st Payment (Downpayment Advances)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 font-black">
              {advancePaymentsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onDownpaymentSubTabChange('partial')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
              downpaymentSubTab === 'partial'
                ? "bg-blue-500/15 text-blue-950 dark:text-blue-200 border border-blue-300 dark:border-blue-700 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>💳 2nd Payment (Partial / Balances)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-200 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200 font-black">
              {partialPaymentsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onDownpaymentSubTabChange('ledger')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
              downpaymentSubTab === 'ledger'
                ? "bg-emerald-500/15 text-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>📊 Vehicle Split & Ledger</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 font-black">
              {vehicleLedgerCount}
            </span>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              placeholder={activeTab === 'purchase'
                ? "Search purchase payments by bill #, vendor, reference..."
                : activeTab === 'downpayment'
                  ? "Search downpayment receipts by receipt #, client, reference..."
                  : "Search sales payments by invoice #, client, reference..."}
              className="pl-9 pr-10 h-11 bg-background border-border/50 rounded-xl"
            />
            {searchTerm.trim() && (
              <button
                type="button"
                onClick={() => onSearchTermChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="w-full md:w-44">
            <select
              className="w-full h-11 rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              value={methodFilter}
              onChange={(e) => onMethodFilterChange(e.target.value)}
            >
              <option value="all">All Methods</option>
              <option value="pending">⚠️ Pending Mode Only</option>
              <option value="cash">Cash Only</option>
              <option value="upi">UPI / GPay</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="w-full md:w-44">
            <select
              className="w-full h-11 rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
        </div>

        {dateFilter === 'custom' && (
          <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-muted/20 border border-border/50 rounded-xl animate-in fade-in duration-200">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label className="text-xs font-bold text-muted-foreground whitespace-nowrap">From:</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="h-9 text-xs rounded-lg bg-background border-border/60"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label className="text-xs font-bold text-muted-foreground whitespace-nowrap">To:</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="h-9 text-xs rounded-lg bg-background border-border/60"
              />
            </div>
            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { onStartDateChange(""); onEndDateChange(""); }}
                className="text-xs h-8 text-muted-foreground hover:text-foreground"
              >
                Clear Dates
              </Button>
            )}
          </div>
        )}

        {searchLoading && (
          <div className="flex items-center justify-center h-9 px-4 rounded-md border border-border bg-muted/20 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Searching...
          </div>
        )}
      </div>
    </div>
  );
};

