import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTablePagination } from '@/components/DataTablePagination';
import { FileSpreadsheet, Download, Printer, Search, Eye } from 'lucide-react';

interface BillingSummary {
  paid: number;
  paidPct: number;
  pending: number;
  pendingPct: number;
  overdue: number;
  overduePct: number;
  total: number;
}

export interface InvoicesReportTabProps {
  exportInvoicesExcel: () => void;
  exportInvoicesPDF: (isPrint?: boolean) => void;
  invoiceSearchTerm: string;
  setInvoiceSearchTerm: (value: string) => void;
  currencySymbol: string;
  billingSummary: BillingSummary;
  invoicesList: any[];
  selectedInvoiceStatus: string;
  setSelectedInvoiceStatus: (status: string) => void;
  paginatedInvoicesList: any[];
  filteredInvoicesList: any[];
  salesReportPage: number;
  salesReportPageSize: number;
  setSalesReportPage: (page: number) => void;
  setSalesReportPageSize: (size: number) => void;
  safelyToLocaleDate: (dateStr?: string | null) => string;
  handleViewInvoice: (id: string) => void;
  handleDownloadInvoice: (id: string, invoiceNumber: string) => void;
}

export const InvoicesReportTab: React.FC<InvoicesReportTabProps> = ({
  exportInvoicesExcel,
  exportInvoicesPDF,
  invoiceSearchTerm,
  setInvoiceSearchTerm,
  currencySymbol,
  billingSummary,
  invoicesList,
  selectedInvoiceStatus,
  setSelectedInvoiceStatus,
  paginatedInvoicesList,
  filteredInvoicesList,
  salesReportPage,
  salesReportPageSize,
  setSalesReportPage,
  setSalesReportPageSize,
  safelyToLocaleDate,
  handleViewInvoice,
  handleDownloadInvoice,
}) => {
  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={exportInvoicesExcel}
          className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
        >
          <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
          Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportInvoicesPDF(false)}
          className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
        >
          <Download className="w-4 h-4 mr-1.5 text-rose-600" />
          PDF
        </Button>
        <Button
          size="sm"
          onClick={() => exportInvoicesPDF(true)}
          className="font-semibold text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
        >
          <Printer className="w-4 h-4 mr-1.5" />
          Print
        </Button>
      </div>

      <Card className="p-4 sm:p-6 bg-card dark:bg-card overflow-hidden shadow-sm">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-foreground">Invoice History</h3>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={invoiceSearchTerm}
                onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                placeholder="Search invoice #, client, status..."
                className="pl-9 h-10 bg-background"
              />
            </div>
          </div>

          {/* Billing Summary Bar */}
          <div className="space-y-2 bg-muted/30 p-4 rounded-xl border border-border/50">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs justify-between font-medium">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Paid: {currencySymbol}{billingSummary.paid.toLocaleString('en-IN')} ({billingSummary.paidPct.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Pending: {currencySymbol}{billingSummary.pending.toLocaleString('en-IN')} ({billingSummary.pendingPct.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Overdue: {currencySymbol}{billingSummary.overdue.toLocaleString('en-IN')} ({billingSummary.overduePct.toFixed(1)}%)</span>
              </div>
              <div className="text-muted-foreground ml-auto">
                Total: {currencySymbol}{billingSummary.total.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex shadow-inner">
              <div style={{ width: `${billingSummary.paidPct}%` }} className="bg-emerald-500 h-full transition-all duration-500" title="Paid" />
              <div style={{ width: `${billingSummary.pendingPct}%` }} className="bg-amber-500 h-full transition-all duration-500" title="Pending" />
              <div style={{ width: `${billingSummary.overduePct}%` }} className="bg-rose-500 h-full transition-all duration-500" title="Overdue" />
            </div>
          </div>

          {/* Status Pill Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Invoices', count: invoicesList.length },
              { value: 'paid', label: 'Paid', count: invoicesList.filter(i => i.status === 'paid').length },
              { value: 'pending', label: 'Pending', count: invoicesList.filter(i => ['draft', 'sent', 'viewed'].includes(i.status)).length },
              { value: 'overdue', label: 'Overdue', count: invoicesList.filter(i => i.status === 'overdue').length }
            ].map((pill) => {
              const isActive = selectedInvoiceStatus === pill.value;
              return (
                <button
                  key={pill.value}
                  onClick={() => setSelectedInvoiceStatus(pill.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background hover:bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {pill.label} <span className="ml-1 opacity-70 font-normal">({pill.count})</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Invoice #</th>
                <th className="py-2 font-medium">Client</th>
                <th className="py-2 font-medium text-right">Amount</th>
                <th className="py-2 font-medium text-center">Status</th>
                <th className="py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoicesList.length > 0 ? (
                paginatedInvoicesList.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3">{safelyToLocaleDate(invoice.created_at)}</td>
                    <td className="py-3 font-medium">{invoice.invoice_number}</td>
                    <td className="py-3">{invoice.client_name}</td>
                    <td className="py-3 text-right">{currencySymbol}{invoice.total_amount.toLocaleString()}</td>
                    <td className="py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                        ${invoice.status === 'paid' ? 'bg-success-light text-success' :
                          invoice.status === 'overdue' ? 'bg-danger-light text-danger' :
                            'bg-warning-light text-warning'}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleViewInvoice(invoice.id)}
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleDownloadInvoice(invoice.id, invoice.invoice_number)}
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <DataTablePagination
          currentPage={salesReportPage}
          totalPages={Math.max(1, Math.ceil(filteredInvoicesList.length / salesReportPageSize))}
          totalCount={filteredInvoicesList.length}
          pageSize={salesReportPageSize}
          onPageChange={setSalesReportPage}
          onPageSizeChange={setSalesReportPageSize}
          entityName="invoices"
        />
      </Card>
    </div>
  );
};
