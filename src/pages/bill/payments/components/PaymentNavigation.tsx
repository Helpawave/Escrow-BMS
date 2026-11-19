import React from 'react';
import { Button } from "@/components/ui/button";
import { StaffHeaderBadge } from "@/components/StaffHeaderBadge";
import { cn } from "@/lib/utils";
import { PaymentActiveTab } from '../types';
import { ArrowDownLeft, ArrowUpRight, Car, Plus } from "lucide-react";

interface PaymentNavigationProps {
  activeTab: PaymentActiveTab;
  onTabChange: (tab: PaymentActiveTab) => void;
  isAutomobile: boolean;
  pendingSalesCount: number;
  pendingDownpaymentCount: number;
  pendingPurchaseCount: number;
  onOpenSalesModal: () => void;
  onOpenPurchaseModal: () => void;
}

export const PaymentNavigation: React.FC<PaymentNavigationProps> = ({
  activeTab,
  onTabChange,
  isAutomobile,
  pendingSalesCount,
  pendingDownpaymentCount,
  pendingPurchaseCount,
  onOpenSalesModal,
  onOpenPurchaseModal,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Segmented Navigation Tabs: Sales vs Downpayment vs Purchase Payments */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3 flex-wrap">
        <button
          onClick={() => onTabChange('sales')}
          className={cn(
            "flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all",
            activeTab === 'sales'
              ? "bg-emerald-50 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Sales Payments (Received)</span>
          <span className={cn(
            "text-[10px] font-black px-2 py-0.5 rounded-full",
            activeTab === 'sales'
              ? "bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200"
              : "bg-muted text-muted-foreground"
          )}>
            {pendingSalesCount.toLocaleString('en-IN')} Pending
          </span>
        </button>

        {isAutomobile && (
          <button
            onClick={() => onTabChange('downpayment')}
            className={cn(
              "flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all",
              activeTab === 'downpayment'
                ? "bg-amber-50 text-amber-900 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Car className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Downpayments & Advances</span>
            <span className={cn(
              "text-[10px] font-black px-2 py-0.5 rounded-full",
              activeTab === 'downpayment'
                ? "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200"
                : "bg-muted text-muted-foreground"
            )}>
              {pendingDownpaymentCount.toLocaleString('en-IN')} Pending
            </span>
          </button>
        )}

        <button
          onClick={() => onTabChange('purchase')}
          className={cn(
            "flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all",
            activeTab === 'purchase'
              ? "bg-purple-50 text-purple-900 border border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-700 shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <ArrowUpRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Purchase Payments (Paid)</span>
          <span className={cn(
            "text-[10px] font-black px-2 py-0.5 rounded-full",
            activeTab === 'purchase'
              ? "bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200"
              : "bg-muted text-muted-foreground"
          )}>
            {pendingPurchaseCount.toLocaleString('en-IN')} Pending
          </span>
        </button>
      </div>

      {/* Header and Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {activeTab === 'downpayment'
                ? 'Downpayment & Vehicle Advance Payments'
                : activeTab === 'sales'
                ? 'Sales Payments'
                : 'Purchase Payments'}
            </h1>
            <StaffHeaderBadge />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {activeTab === 'downpayment'
              ? 'Track vehicle booking advances, token receipts, and downpayment settlements'
              : activeTab === 'sales'
              ? 'Track customer payment receipts and sales invoice settlements'
              : 'Track vendor payment outflow and purchase bill settlements'}
          </p>
        </div>

        {activeTab === 'purchase' ? (
          <Button
            variant="default"
            size="lg"
            className="w-full sm:w-auto h-11 shadow-sm hover:shadow-md transition-all active:scale-95 bg-purple-600 hover:bg-purple-700 text-white font-bold"
            onClick={() => onOpenPurchaseModal()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Record Purchase Payment
          </Button>
        ) : (
          <Button
            variant="default"
            size="lg"
            className={cn(
              "w-full sm:w-auto h-11 shadow-sm hover:shadow-md transition-all active:scale-95 text-white font-bold",
              activeTab === 'downpayment' ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
            )}
            onClick={() => onOpenSalesModal()}
          >
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'downpayment' ? 'Record Downpayment Payment' : 'Record Sales Payment'}
          </Button>
        )}
      </div>
    </div>
  );
};

