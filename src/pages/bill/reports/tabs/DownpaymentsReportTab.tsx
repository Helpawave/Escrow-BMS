import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTablePagination } from '@/components/DataTablePagination';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Eye,
  Car,
  Wallet,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';

export interface DownpaymentStats {
  totalValuation: number;
  count: number;
  totalAdvances: number;
  collectionRate: number;
  totalBalanceDue: number;
  paidCount: number;
  partialCount: number;
  pendingCount: number;
}

export interface DownpaymentsReportTabProps {
  exportDownpaymentsExcel: () => void;
  exportDownpaymentsPDF: (isPrint?: boolean) => void;
  currencySymbol: string;
  downpaymentStats: DownpaymentStats;
  downpaymentSearchTerm: string;
  setDownpaymentSearchTerm: (value: string) => void;
  downpaymentsList: any[];
  selectedDownpaymentStatus: string;
  setSelectedDownpaymentStatus: (status: string) => void;
  paginatedDownpaymentsList: any[];
  filteredDownpaymentsList: any[];
  downpaymentReportPage: number;
  downpaymentReportPageSize: number;
  setDownpaymentReportPage: (page: number) => void;
  setDownpaymentReportPageSize: (size: number) => void;
  safelyToLocaleDate: (dateStr?: string | null) => string;
  handleViewInvoice: (id: string) => void;
  handleDownloadInvoice: (id: string, invoiceNumber: string) => void;
}

export const DownpaymentsReportTab: React.FC<DownpaymentsReportTabProps> = ({
  exportDownpaymentsExcel,
  exportDownpaymentsPDF,
  currencySymbol,
  downpaymentStats,
  downpaymentSearchTerm,
  setDownpaymentSearchTerm,
  downpaymentsList,
  selectedDownpaymentStatus,
  setSelectedDownpaymentStatus,
  paginatedDownpaymentsList,
  filteredDownpaymentsList,
  downpaymentReportPage,
  downpaymentReportPageSize,
  setDownpaymentReportPage,
  setDownpaymentReportPageSize,
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
          onClick={exportDownpaymentsExcel}
          className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
        >
          <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
          Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportDownpaymentsPDF(false)}
          className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
        >
          <Download className="w-4 h-4 mr-1.5 text-rose-600" />
          PDF
        </Button>
        <Button
          size="sm"
          onClick={() => exportDownpaymentsPDF(true)}
          className="font-semibold text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
        >
          <Printer className="w-4 h-4 mr-1.5" />
          Print
        </Button>
      </div>

      {/* Downpayment Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5 cursor-default">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Vehicle Valuation</p>
              <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                {currencySymbol}{downpaymentStats.totalValuation.toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {downpaymentStats.count} vehicle bookings
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 cursor-default">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Advances Collected</p>
              <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                {currencySymbol}{downpaymentStats.totalAdvances.toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {downpaymentStats.collectionRate.toFixed(1)}% recovery rate
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/20 hover:border-rose-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/5 cursor-default">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-rose-500/10 dark:bg-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Balance Due</p>
              <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                {currencySymbol}{downpaymentStats.totalBalanceDue.toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Customer &amp; Loan dues
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 cursor-default">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl text-purple-600 dark:text-purple-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Settlement Status</p>
              <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                {downpaymentStats.paidCount} / {downpaymentStats.count}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {downpaymentStats.partialCount} partial • {downpaymentStats.pendingCount} pending
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Vehicle Downpayment &amp; Booking Advances Register</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Detailed record of vehicle booking receipts, advances collected, bank financers, and pending dues
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicle, client, DP#..."
                value={downpaymentSearchTerm}
                onChange={(e) => setDownpaymentSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Status Pill Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Bookings', count: downpaymentsList.length },
              { value: 'paid', label: 'Fully Settled', count: downpaymentStats.paidCount },
              { value: 'partial', label: 'Advance Paid', count: downpaymentStats.partialCount },
              { value: 'pending', label: 'Pending Dues', count: downpaymentStats.pendingCount }
            ].map((pill) => {
              const isActive = selectedDownpaymentStatus === pill.value;
              return (
                <button
                  key={pill.value}
                  onClick={() => setSelectedDownpaymentStatus(pill.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    isActive
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
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
                <th className="py-2.5 font-medium">Date</th>
                <th className="py-2.5 font-medium">Receipt / DP #</th>
                <th className="py-2.5 font-medium">Customer</th>
                <th className="py-2.5 font-medium">Vehicle Details</th>
                <th className="py-2.5 font-medium text-right">Total Price</th>
                <th className="py-2.5 font-medium text-right">Advance Paid</th>
                <th className="py-2.5 font-medium text-right">Balance Due</th>
                <th className="py-2.5 font-medium text-center">Financier</th>
                <th className="py-2.5 font-medium text-center">Status</th>
                <th className="py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDownpaymentsList.length > 0 ? (
                paginatedDownpaymentsList.map((dp) => (
                  <tr key={dp.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3 text-xs">{safelyToLocaleDate(dp.created_at)}</td>
                    <td className="py-3 font-semibold text-amber-600 dark:text-amber-400 text-xs">
                      {dp.invoice_number}
                    </td>
                    <td className="py-3 font-medium text-xs">{dp.client_name}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="font-semibold text-xs text-foreground line-clamp-1">{dp.vehicle_name}</span>
                      </div>
                      {dp.vehicle_vin && (
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">VIN: {dp.vehicle_vin}</div>
                      )}
                    </td>
                    <td className="py-3 text-right font-medium text-xs">
                      {currencySymbol}{dp.total_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 text-right font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      {currencySymbol}{dp.advance_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 text-right font-bold text-xs text-rose-600 dark:text-rose-400">
                      {currencySymbol}{dp.balance_due.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 text-center text-xs text-muted-foreground">
                      {dp.financier || 'Cash / Self'}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold 
                        ${dp.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                          dp.advance_amount > 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                            'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                        {dp.status === 'paid' ? 'SETTLED' : dp.advance_amount > 0 ? 'ADVANCE PAID' : 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                          onClick={() => handleViewInvoice(dp.id)}
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                          onClick={() => handleDownloadInvoice(dp.id, dp.invoice_number)}
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
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    <Car className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="font-semibold text-sm">No downpayment invoices found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vehicle booking advances and downpayment receipts will appear here.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <DataTablePagination
          currentPage={downpaymentReportPage}
          totalPages={Math.max(1, Math.ceil(filteredDownpaymentsList.length / downpaymentReportPageSize))}
          totalCount={filteredDownpaymentsList.length}
          pageSize={downpaymentReportPageSize}
          onPageChange={setDownpaymentReportPage}
          onPageSizeChange={setDownpaymentReportPageSize}
          entityName="downpayment records"
        />
      </Card>
    </div>
  );
};
