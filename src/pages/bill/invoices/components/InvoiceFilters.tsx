import React from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { InvoiceFiltersProps } from '../types';

export const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  searchLoading,
  statusFilter,
  setStatusFilter,
  isAutomobile,
  isCafe,
  nextServiceFilter,
  setNextServiceFilter,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={isCafe ? "Search by order number or customer name/phone..." : "Search by invoice number or client name..."}
          className="pl-10 h-11 bg-background border-border/50 rounded-xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="w-full sm:w-56">
        <select
          aria-label="Filter invoices by status"
          className="w-full h-11 rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {isCafe ? (
            <>
              <option value="all">📋 All Orders & Bills</option>
              <option value="paid">🟢 Paid Orders</option>
              <option value="draft">🟡 Unpaid / Counter Drafts</option>
              <option value="kitchen_preparing">👨‍🍳 Kitchen Preparing</option>
              <option value="kitchen_complete">🍽️ Kitchen Ready / Served</option>
              <option value="cancelled">❌ Cancelled Orders</option>
            </>
          ) : (
            <>
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </>
          )}
        </select>
      </div>
      {isAutomobile && (
        <div className="w-full sm:w-52">
          <select
            aria-label="Filter invoices by service date"
            className="w-full h-11 rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={nextServiceFilter}
            onChange={(e) => setNextServiceFilter(e.target.value)}
          >
            <option value="all">🛠 All Service Dates</option>
            <option value="overdue">⚠️ Service Overdue</option>
            <option value="this_week">📅 Due This Week</option>
            <option value="this_month">📆 Due This Month</option>
          </select>
        </div>
      )}
    </div>
  );
};

