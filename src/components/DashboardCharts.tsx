import React, { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from "recharts";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  ChevronDown, 
  Minus, 
  X, 
  LayoutDashboard, 
  Calendar,
  Wallet,
  TrendingUp,
  CreditCard
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ChartDataPoint {
  name: string;
  yearMonth?: string;
  revenue: number;
  sales: number;
  expense: number;
  estimates?: number;
}

interface DashboardChartsProps {
  chartData: ChartDataPoint[];
  totalRevenue: number;
  totalExpenses: number;
  totalPurchaseCost: number;
  netProfit: number;
}

interface TooltipEntry {
  color: string;
  name: string;
  value: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean, payload?: TooltipEntry[], label?: string }) => {
  const { currencySymbol } = useCurrency();
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl ring-1 ring-white/5 animate-in fade-in zoom-in duration-200">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">{label}</p>
        <div className="space-y-2.5">
          {payload.map((entry: TooltipEntry, index: number) => (
            <div key={index} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}80` }} 
                />
                <span className="text-[11px] font-bold text-slate-300 capitalize">{entry.name}</span>
              </div>
              <span className="text-[11px] font-black text-white">{currencySymbol}{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ 
  chartData, 
  totalRevenue, 
  totalExpenses, 
  totalPurchaseCost,
  netProfit 
}) => {
  const [activeView, setActiveView] = useState<'all' | 'sales' | 'revenue' | 'expense'>('all');
  const { currencySymbol } = useCurrency();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left Column: Main Multi-Series Line Chart (2/3 width on xl screens) */}
      <div className="xl:col-span-2">
        <Card className="p-0 bg-white dark:bg-slate-900 border border-border/50 shadow-xl rounded-2xl overflow-hidden h-full flex flex-col">
          <div className="p-4 md:p-6 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Financial Overview</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Sales, Revenue & Expenses</p>
            </div>
            
            <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-border rounded-xl w-fit">
              {(['all', 'sales', 'revenue', 'expense'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setActiveView(view)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-black capitalize transition-all duration-300",
                    activeView === view 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 md:p-6 flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="rgba(148, 163, 184, 0.1)" 
                />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }}
                  tickFormatter={(value) => `${currencySymbol}${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                {(activeView === 'all' || activeView === 'sales') && (
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    name="Sales (Invoiced)"
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#3b82f6', fill: '#fff' }}
                    animationDuration={1500}
                  />
                )}
                {(activeView === 'all' || activeView === 'revenue') && (
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue (Paid)"
                    stroke="#10b981" 
                    strokeWidth={4}
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#10b981', fill: '#fff' }}
                    animationDuration={2000}
                  />
                )}
                {(activeView === 'all' || activeView === 'expense') && (
                  <Line 
                    type="monotone" 
                    dataKey="expense" 
                    name="Expenses"
                    stroke="#f43f5e" 
                    strokeWidth={4}
                    dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#f43f5e', fill: '#fff' }}
                    animationDuration={2500}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      {/* Right Column: Mini Charts & P&L (1/3 width on xl screens) */}
      <div className="flex flex-col gap-6">
        {/* Sales Conversion Summary (Bar Chart) */}
        <Card className="flex-1 p-5 lg:p-6 bg-white dark:bg-slate-900 border border-border/50 shadow-xl rounded-2xl flex flex-col">
          <div className="space-y-1 mb-4">
            <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Conversion</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Estimates vs Actual</p>
          </div>

          <div className="min-h-[160px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barSize={24}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: 'none', 
                    borderRadius: '16px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' 
                  }}
                  itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="rect"
                  wrapperStyle={{ paddingBottom: '20px' }}
                  formatter={(value) => <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{value}</span>}
                />
                <Bar dataKey="sales" name="Sales" fill="#3b82f6" radius={[0, 0, 4, 4]} stackId="a" />
                <Bar dataKey="estimates" name="Estimates" fill="#c7d2fe" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Profit & Loss Section */}
        <Card className="flex-shrink-0 p-5 lg:p-6 bg-white dark:bg-slate-900 border border-border/50 shadow-xl rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Profit & Loss</h3>
            <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
              <LayoutDashboard className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              {/* Revenue Card */}
              <div className="flex-1 w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 group hover:bg-white dark:hover:bg-slate-800 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                    <Wallet className="w-3 h-3" />
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Revenue</span>
                </div>
                <p className="text-lg font-black text-slate-900 dark:text-white">{currencySymbol}{totalRevenue.toLocaleString()}</p>
              </div>

              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                <Minus className="w-3 h-3 rotate-90 sm:rotate-0" />
              </div>

              {/* Expense Card */}
              <div className="flex-1 w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 group hover:bg-white dark:hover:bg-slate-800 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-500">
                    <CreditCard className="w-3 h-3" />
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Purchase Cost</span>
                </div>
                <p className="text-lg font-black text-slate-900 dark:text-white">{currencySymbol}{totalPurchaseCost.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex justify-center -my-3 relative z-10">
              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold ring-4 ring-white dark:ring-slate-900">
                =
              </div>
            </div>

            {/* Profit Card */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border-2 border-emerald-500/20 group hover:border-emerald-500 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">Net Profit</span>
                    <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{currencySymbol}{netProfit.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-600/60 block mb-1">GROWTH</span>
                  <div className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-black">
                    +100%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
