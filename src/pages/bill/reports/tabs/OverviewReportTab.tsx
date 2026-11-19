import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FileSpreadsheet,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Calendar,
  Receipt
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import {
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Area
} from "recharts";

export interface OverviewReportStats {
  totalRevenue: number;
  netProfit: number;
  pendingAmount: number;
  totalExpenses: number;
  [key: string]: any;
}

export interface OverviewReportTabProps {
  exportOverviewExcel: () => void;
  exportOverviewPDF: (isPrint: boolean) => void;
  formatAmount: (amount: number) => string;
  stats: OverviewReportStats;
  revenueGrowth: number;
  monthlyData: any[];
  chartConfig: any;
  currencySymbol: string;
}

export const OverviewReportTab: React.FC<OverviewReportTabProps> = ({
  exportOverviewExcel,
  exportOverviewPDF,
  formatAmount,
  stats,
  revenueGrowth,
  monthlyData,
  chartConfig,
  currencySymbol
}) => {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Export Buttons */}
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={exportOverviewExcel}
          className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
          aria-label="Download overview report as Excel"
        >
          <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
          Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportOverviewPDF(false)}
          className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
          aria-label="Download overview report as PDF"
        >
          <Download className="w-4 h-4 mr-1.5 text-rose-600" />
          PDF
        </Button>
        <Button
          size="sm"
          onClick={() => exportOverviewPDF(true)}
          className="font-semibold text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
        >
          <Printer className="w-4 h-4 mr-1.5" />
          Print
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="p-4 md:p-6 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/5 cursor-default overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs md:text-sm font-semibold uppercase tracking-wider">Total Revenue</p>
              <p className="text-xl sm:text-2xl font-black text-foreground whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight py-0.5 mt-1">
                {formatAmount(stats.totalRevenue)}
              </p>
              <div className="flex items-center mt-2">
                {revenueGrowth >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1 shrink-0" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 mr-1 shrink-0" />
                )}
                <span className={`text-xs font-bold ${revenueGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {Math.abs(revenueGrowth).toFixed(1)}% vs last period
                </span>
              </div>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 hover:border-blue-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/5 cursor-default overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs md:text-sm font-semibold uppercase tracking-wider">Net Profit</p>
              <p className="text-xl sm:text-2xl font-black text-foreground whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight py-0.5 mt-1">
                {formatAmount(stats.netProfit)}
              </p>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-2">
                {stats.totalRevenue > 0 ? `${((stats.netProfit / stats.totalRevenue) * 100).toFixed(1)}% margin` : 'Net earnings'}
              </p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/5 cursor-default overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs md:text-sm font-semibold uppercase tracking-wider">Outstanding</p>
              <p className="text-xl sm:text-2xl font-black text-foreground whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight py-0.5 mt-1">
                {formatAmount(stats.pendingAmount)}
              </p>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-2">
                Pending receivables
              </p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0 flex items-center justify-center">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/20 hover:border-rose-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-rose-500/5 cursor-default overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs md:text-sm font-semibold uppercase tracking-wider">Expenses</p>
              <p className="text-xl sm:text-2xl font-black text-foreground whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight py-0.5 mt-1">
                {formatAmount(stats.totalExpenses)}
              </p>
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-2">
                Operational outflow
              </p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shrink-0 flex items-center justify-center">
              <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 md:p-6 bg-card dark:bg-card mt-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Revenue & Profit Analysis</h3>
        {monthlyData && monthlyData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px] md:h-[400px]">
            <AreaChart data={monthlyData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${currencySymbol}${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `${currencySymbol}${Number(value).toLocaleString('en-IN')}`}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                fillOpacity={0.1}
                fill="var(--color-revenue)"
                name="Total Revenue"
                dot={{ r: 3, fill: "var(--color-revenue)", strokeWidth: 1, stroke: "#fff" }}
                activeDot={{ r: 5, strokeWidth: 1, stroke: '#fff' }}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="var(--color-profit)"
                strokeWidth={2}
                fillOpacity={0.1}
                fill="var(--color-profit)"
                name="Net Profit"
                dot={{ r: 3, fill: "var(--color-profit)", strokeWidth: 1, stroke: "#fff" }}
                activeDot={{ r: 5, strokeWidth: 1, stroke: '#fff' }}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No data available for the selected period
          </div>
        )}
      </Card>
    </div>
  );
};

