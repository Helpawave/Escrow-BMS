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
    <div className="w-full min-w-0 flex flex-col space-y-4">
      {/* Chart Filter Selector */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trend Visualizer</span>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
          {(['all', 'sales', 'revenue', 'expense'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-bold capitalize transition-all cursor-pointer",
                activeView === view 
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" 
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area Container */}
      <div className="w-full min-w-0 h-[240px]">
        <ResponsiveContainer width="99%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="rgba(148, 163, 184, 0.15)" 
            />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
              dy={5}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
              tickFormatter={(value) => `${currencySymbol}${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            {(activeView === 'all' || activeView === 'sales') && (
              <Line 
                type="monotone" 
                dataKey="sales" 
                name="Sales (Invoiced)"
                stroke="#6366f1" 
                strokeWidth={3}
                dot={{ r: 3, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#6366f1', fill: '#fff' }}
              />
            )}
            {(activeView === 'all' || activeView === 'revenue') && (
              <Line 
                type="monotone" 
                dataKey="revenue" 
                name="Revenue (Paid)"
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#10b981', fill: '#fff' }}
              />
            )}
            {(activeView === 'all' || activeView === 'expense') && (
              <Line 
                type="monotone" 
                dataKey="expense" 
                name="Expenses"
                stroke="#f43f5e" 
                strokeWidth={3}
                dot={{ r: 3, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#f43f5e', fill: '#fff' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
