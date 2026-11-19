import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { FileSpreadsheet, Download, Printer } from 'lucide-react';
import { MonthlyData } from '../types';

export interface FinancialReportTabProps {
  exportFinancialExcel: () => void;
  exportFinancialPDF: (isPrint?: boolean) => void;
  monthlyData: MonthlyData[];
  chartConfig: any;
  currencySymbol: string;
}

export const FinancialReportTab: React.FC<FinancialReportTabProps> = ({
  exportFinancialExcel,
  exportFinancialPDF,
  monthlyData,
  chartConfig,
  currencySymbol,
}) => {
  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={exportFinancialExcel}
          className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
        >
          <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
          Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportFinancialPDF(false)}
          className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
        >
          <Download className="w-4 h-4 mr-1.5 text-rose-600" />
          PDF
        </Button>
        <Button
          size="sm"
          onClick={() => exportFinancialPDF(true)}
          className="font-semibold text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
        >
          <Printer className="w-4 h-4 mr-1.5" />
          Print
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Expenses Chart */}
        <Card className="p-4 sm:p-6 bg-card dark:bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Revenue, Expenses & Profit Trend</h3>
          {monthlyData && monthlyData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] md:h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradient-revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="gradient-expenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-expenses)" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="var(--color-expenses)" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
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
                        formatter={(value) => {
                          return `${currencySymbol}${Number(value).toLocaleString('en-IN')}`;
                        }}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="revenue"
                    fill="url(#gradient-revenue)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                    name="revenue"
                  />
                  <Bar
                    dataKey="expenses"
                    fill="url(#gradient-expenses)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                    name="expenses"
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="var(--color-profit)"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 1, fill: "var(--color-profit)", stroke: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 1, stroke: "#fff" }}
                    name="profit"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available for the selected period
            </div>
          )}
        </Card>

        {/* Monthly Breakdown */}
        <Card className="p-4 sm:p-6 bg-card dark:bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Financial Summary</h3>
          {monthlyData && monthlyData.length > 0 ? (
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {monthlyData.slice(-6).map((month) => (
                <div key={month.month} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{month.month}</span>
                    <span className={`text-sm px-2 py-1 rounded ${month.profit >= 0 ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                      {month.profit >= 0 ? 'Profit' : 'Loss'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Revenue</div>
                      <div className="font-medium text-success">{currencySymbol}{month.revenue.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Expenses</div>
                      <div className="font-medium text-danger">{currencySymbol}{month.expenses.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Net Profit</div>
                      <div className={`font-medium ${month.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                        {currencySymbol}{month.profit.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Invoices</div>
                      <div className="font-medium">{month.invoices}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No monthly data available
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

