import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  CreditCard,
  Banknote,
  Building2,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { PaymentMethodData, PaymentTimelineItem, PaymentStats } from '../types';

export interface PaymentsReportTabProps {
  exportPaymentsExcel: () => void;
  exportPaymentsPDF: (isPrint?: boolean) => void;
  currencySymbol: string;
  paymentStats: PaymentStats;
  paymentTimeline: PaymentTimelineItem[];
  paymentMethodDistribution: PaymentMethodData[];
  paymentSearchTerm: string;
  setPaymentSearchTerm: (value: string) => void;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (method: string) => void;
  paymentsList: any[];
  filteredPaymentsList: any[];
  safelyToLocaleDate: (dateStr?: string | null) => string;
}

export const PaymentsReportTab: React.FC<PaymentsReportTabProps> = ({
  exportPaymentsExcel,
  exportPaymentsPDF,
  currencySymbol,
  paymentStats,
  paymentTimeline,
  paymentMethodDistribution,
  paymentSearchTerm,
  setPaymentSearchTerm,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  paymentsList,
  filteredPaymentsList,
  safelyToLocaleDate,
}) => {
  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={exportPaymentsExcel}
          className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
        >
          <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
          Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportPaymentsPDF(false)}
          className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
        >
          <Download className="w-4 h-4 mr-1.5 text-rose-600" />
          PDF
        </Button>
        <Button
          size="sm"
          onClick={() => exportPaymentsPDF(true)}
          className="font-semibold text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
        >
          <Printer className="w-4 h-4 mr-1.5" />
          Print
        </Button>
      </div>

      {/* Payment Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 cursor-default">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Collections</p>
              <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                {currencySymbol}{paymentStats.totalCollected.toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {paymentStats.totalCount ?? paymentStats.totalTransactions ?? 0} transactions received
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent border border-cyan-500/20 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/5 cursor-default">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-xl text-cyan-600 dark:text-cyan-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">UPI / Digital</p>
              <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                {currencySymbol}{(paymentStats.upiCollected ?? paymentStats.upiTotal ?? 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {paymentStats.totalCollected > 0
                  ? (((paymentStats.upiCollected ?? paymentStats.upiTotal ?? 0) / paymentStats.totalCollected) * 100).toFixed(1)
                  : 0}% of collections
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5 cursor-default">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Cash Collections</p>
              <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                {currencySymbol}{(paymentStats.cashCollected ?? paymentStats.cashTotal ?? 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {paymentStats.totalCollected > 0
                  ? (((paymentStats.cashCollected ?? paymentStats.cashTotal ?? 0) / paymentStats.totalCollected) * 100).toFixed(1)
                  : 0}% of collections
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 cursor-default">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Bank & Others</p>
              <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                {currencySymbol}{(paymentStats.bankCollected ?? paymentStats.bankTransferTotal ?? 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Avg ticket: {currencySymbol}{Math.round(paymentStats.averageReceipt ?? paymentStats.averagePayment ?? 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Visual Charts: Timeline & Payment Method Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2 bg-card dark:bg-card shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Daily Collections Inflow</h3>
              <p className="text-xs text-muted-foreground">Cash & digital collections received over selected dates</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Realized Inflow</span>
            </div>
          </div>

          {paymentTimeline.length > 0 ? (
            <ChartContainer
              config={{
                amount: {
                  label: "Collected Amount",
                  color: "hsl(var(--primary))",
                }
              }}
              className="h-[280px] w-full"
            >
              <AreaChart data={paymentTimeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${currencySymbol}${value.toLocaleString('en-IN')}`}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as PaymentTimelineItem;
                      return (
                        <div className="rounded-lg border bg-background/95 backdrop-blur-sm p-2.5 shadow-md">
                          <p className="text-xs font-medium text-muted-foreground">{data.date}</p>
                          <p className="text-sm font-bold text-foreground mt-1">
                            {currencySymbol}{(data.amount ?? data.total ?? 0).toLocaleString('en-IN')}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {data.count} payment{data.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--color-amount)"
                  strokeWidth={2.5}
                  fillOpacity={0.15}
                  fill="var(--color-amount)"
                  dot={{ r: 3, fill: "var(--color-amount)", strokeWidth: 1, stroke: "#fff" }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
              No payment data in this date range
            </div>
          )}
        </Card>

        <Card className="p-5 bg-card dark:bg-card shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Collection Methods</h3>
            <p className="text-xs text-muted-foreground mb-3">Breakdown by payment mode</p>
            {paymentMethodDistribution.length > 0 ? (
              <div className="h-[200px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodDistribution}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {paymentMethodDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload as PaymentMethodData;
                          const percentage = paymentStats.totalCollected > 0
                            ? (((item.amount ?? item.value) / paymentStats.totalCollected) * 100).toFixed(1)
                            : 0;
                          return (
                            <div className="rounded-lg border bg-background/95 backdrop-blur-sm p-2.5 shadow-md">
                              <p className="text-xs font-semibold" style={{ color: item.color }}>{item.name}</p>
                              <p className="text-sm font-bold mt-0.5">{currencySymbol}{(item.amount ?? item.value).toLocaleString('en-IN')}</p>
                              <p className="text-[11px] text-muted-foreground">{item.count} txns ({percentage}%)</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No transactions recorded
              </div>
            )}
          </div>

          {/* Legend with percentages */}
          <div className="space-y-1.5 pt-2 border-t border-border/50">
            {paymentMethodDistribution.map((m) => {
              const itemVal = m.amount ?? m.value ?? 0;
              const pct = paymentStats.totalCollected > 0
                ? ((itemVal / paymentStats.totalCollected) * 100).toFixed(1)
                : '0';
              return (
                <div key={m.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                    <span className="text-muted-foreground truncate max-w-[120px]">{m.name}</span>
                  </div>
                  <div className="font-semibold text-foreground">
                    {currencySymbol}{itemVal.toLocaleString('en-IN')} <span className="text-[10px] text-muted-foreground font-normal">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Payments Ledger Table */}
      <Card className="p-4 sm:p-6 bg-card dark:bg-card overflow-hidden shadow-sm">
        <div className="flex flex-col gap-4 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Payments Ledger</h3>
              <p className="text-xs text-muted-foreground">Complete record of collections across invoices & bills</p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={paymentSearchTerm}
                onChange={(e) => setPaymentSearchTerm(e.target.value)}
                placeholder="Search client, invoice #, ref #..."
                className="pl-9 h-10 bg-background"
              />
            </div>
          </div>

          {/* Payment Method Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Methods', count: paymentsList.length },
              { value: 'upi', label: 'UPI / Online', count: paymentsList.filter(p => {
                const m = (p.payment_method || '').toLowerCase();
                return m.includes('upi') || m.includes('online') || m.includes('qr');
              }).length },
              { value: 'cash', label: 'Cash', count: paymentsList.filter(p => (p.payment_method || '').toLowerCase() === 'cash').length },
              { value: 'bank_transfer', label: 'Bank Transfer', count: paymentsList.filter(p => {
                const m = (p.payment_method || '').toLowerCase();
                return m.includes('bank') || m.includes('neft') || m.includes('rtgs') || m.includes('transfer') || m.includes('netbanking');
              }).length },
              { value: 'cheque', label: 'Cheque', count: paymentsList.filter(p => {
                const m = (p.payment_method || '').toLowerCase();
                return m.includes('cheque') || m.includes('check');
              }).length },
              { value: 'card', label: 'Card', count: paymentsList.filter(p => (p.payment_method || '').toLowerCase().includes('card')).length },
            ].map((pill) => {
              const isActive = selectedPaymentMethod === pill.value;
              return (
                <button
                  key={pill.value}
                  onClick={() => setSelectedPaymentMethod(pill.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${isActive
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
                <th className="py-2.5 font-medium">Date</th>
                <th className="py-2.5 font-medium">Party Name</th>
                <th className="py-2.5 font-medium">Invoice #</th>
                <th className="py-2.5 font-medium">Type</th>
                <th className="py-2.5 font-medium">Method</th>
                <th className="py-2.5 font-medium">Reference #</th>
                <th className="py-2.5 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredPaymentsList.length > 0 ? (
                filteredPaymentsList.map((payment) => {
                  const methodKey = (payment.payment_method || 'other').toLowerCase();
                  const isUPI = methodKey.includes('upi') || methodKey.includes('online');
                  const isCash = methodKey === 'cash';
                  const isBank = methodKey.includes('bank') || methodKey.includes('neft') || methodKey.includes('rtgs');

                  return (
                    <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 font-medium text-foreground">
                        {safelyToLocaleDate(payment.payment_date || payment.created_at)}
                      </td>
                      <td className="py-3">
                        <span className="font-medium text-foreground">{payment.party_name}</span>
                      </td>
                      <td className="py-3">
                        <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                          {payment.invoice_number}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${payment.type === 'purchase'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : payment.type === 'downpayment'
                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}>
                          {payment.type === 'purchase' ? 'Vendor Payout' : payment.type === 'downpayment' ? 'Downpayment Inflow' : 'Client Inflow'}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${isUPI
                          ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                          : isCash
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : isBank
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                          }`}>
                          {isUPI && <CreditCard className="w-3 h-3" />}
                          {isCash && <Banknote className="w-3 h-3" />}
                          {isBank && <Building2 className="w-3 h-3" />}
                          {payment.payment_method || 'Unspecified'}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-xs text-muted-foreground">
                        {payment.reference_number || '—'}
                      </td>
                      <td className="py-3 text-right font-bold text-foreground">
                        {currencySymbol}{payment.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">
                    <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>No payments found matching your filter criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
