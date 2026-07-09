import { useState, useEffect } from "react";
import { StatCard } from "./StatCard";
import { InvoiceTable } from "./InvoiceTable";
import {
  FileText,
  DollarSign,
  Users,
  TrendingUp,
  Receipt,
  TrendingDown,
  Plus,
  Calendar,
  IndianRupee,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";

import { DashboardCharts } from "./DashboardCharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangeFilter } from "@/hooks/useDashboardStats";

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<string>("current_month");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Compute the effective filter to pass to the hook
  const effectiveRange: DateRangeFilter =
    dateRange === 'custom'
      ? (customFrom && customTo ? { from: customFrom, to: customTo } : 'current_month')
      : dateRange === 'all' ? 'all'
      : dateRange === 'current_month' ? 'current_month'
      : parseInt(dateRange);

  const { 
    data: stats,
    isLoading: loading,
    error 
  } = useDashboardStats(effectiveRange);

  const {
    totalRevenue = 0,
    totalSalesAll = 0,
    totalInvoices = 0,
    activeClients = 0,
    totalProducts = 0,
    outstanding = 0,
    totalExpenses = 0,
    totalPurchase = 0,
    netProfit = 0,
    totalPurchaseCost = 0,
    chartData = [],
    trends = { sales: 0, purchase: 0, revenue: 0, expense: 0 }
  } = stats || {};

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('company_name, logo_url')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const handleCreateInvoice = () => navigate('/create-invoice');
  const handleViewAllInvoices = () => navigate('/invoices');

  if (error) {
    console.error('Error fetching dashboard stats:', error);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeProfile = profile as any;

  const { currencySymbol } = useCurrency();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {safeProfile?.logo_url ? (
            <div className="w-14 h-14 bg-white dark:bg-slate-900 border border-border/50 rounded-2xl overflow-hidden shadow-xl flex items-center justify-center p-2">
              <img src={safeProfile.logo_url} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
              <Plus className="w-6 h-6 rotate-45" />
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Hello, {safeProfile?.company_name || 'Business'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Overview of your business performance
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Select
            value={dateRange}
            onValueChange={(val) => {
              setDateRange(val);
              setShowCustomPicker(val === 'custom');
            }}
          >
            <SelectTrigger className="flex-1 sm:flex-none w-full sm:w-[180px] rounded-2xl border-border/50 gap-2 h-12 px-4 sm:px-6 text-xs font-black uppercase tracking-widest bg-white dark:bg-slate-900 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <SelectValue placeholder="Select range" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border/50 shadow-xl p-1">
              <SelectItem value="current_month" className="rounded-xl font-bold py-3">Current Month</SelectItem>
              <SelectItem value="7" className="rounded-xl font-bold py-3">Last 7 Days</SelectItem>
              <SelectItem value="30" className="rounded-xl font-bold py-3">Last 30 Days</SelectItem>
              <SelectItem value="90" className="rounded-xl font-bold py-3">Last 90 Days</SelectItem>
              <SelectItem value="365" className="rounded-xl font-bold py-3">Last 365 Days</SelectItem>
              <SelectItem value="all" className="rounded-xl font-bold py-3">All Time</SelectItem>
              <SelectItem value="custom" className="rounded-xl font-bold py-3">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom date range picker */}
          {showCustomPicker && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-12 px-3 rounded-2xl border border-border/50 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-xs font-black text-slate-400">→</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-12 px-3 rounded-2xl border border-border/50 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}
          <Button onClick={handleCreateInvoice} className="flex-1 sm:flex-none rounded-2xl gap-2 h-12 px-4 sm:px-8 text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary/25 hover:scale-105 transition-all active:scale-95">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Invoice</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Total Sales"
          value={`${currencySymbol}${(totalSalesAll || 0).toLocaleString()}`}
          trend={trends?.sales}
          change="Lifetime sales value"
          changeType={(trends?.sales || 0) >= 0 ? "positive" : "negative"}
          icon={<IndianRupee className="w-5 h-5 lg:w-6 lg:h-6" />}
        />
        <StatCard
          title="Total Collected"
          value={`${currencySymbol}${(totalRevenue || 0).toLocaleString()}`}
          trend={trends?.revenue}
          change="Payments received"
          changeType="positive"
          icon={<IndianRupee className="w-5 h-5 lg:w-6 lg:h-6" />}
        />
        <StatCard
          title="Outstanding"
          value={`${currencySymbol}${(outstanding || 0).toLocaleString()}`}
          change="Pending collection"
          changeType="negative"
          icon={<IndianRupee className="w-5 h-5 lg:w-6 lg:h-6" />}
        />
        <StatCard
          title="Net Profit"
          value={`${currencySymbol}${(netProfit || 0).toLocaleString()}`}
          trend={trends?.revenue}
          change={netProfit >= 0 ? "Profitable period" : "Review spending"}
          changeType={netProfit >= 0 ? "positive" : "negative"}
          icon={<TrendingUp className="w-5 h-5 lg:w-6 lg:h-6" />}
        />
        <StatCard
          title="Total Invoices"
          value={(totalInvoices || 0).toString()}
          change="Invoices generated"
          changeType="neutral"
          icon={<FileText className="w-5 h-5 lg:w-6 lg:h-6" />}
        />
        <StatCard
          title="Total Purchase"
          value={`${currencySymbol}${(totalPurchase || 0).toLocaleString()}`}
          change="Lifetime procurement"
          changeType="negative"
          icon={<ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6" />}
        />
        <StatCard
          title="Total Products"
          value={(totalProducts || 0).toString()}
          change="Inventory items"
          changeType="neutral"
          icon={<ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6" />}
        />
        <StatCard
          title="Total Expenses"
          value={`${currencySymbol}${(totalExpenses || 0).toLocaleString()}`}
          trend={trends?.expense}
          change="Operational costs"
          changeType="negative"
          icon={<TrendingDown className="w-5 h-5 lg:w-6 lg:h-6" />}
        />
      </div>

      {/* Charts Section */}
      <DashboardCharts 
        chartData={chartData || []} 
        totalRevenue={totalRevenue || 0}
        totalExpenses={totalExpenses || 0}
        totalPurchaseCost={totalPurchaseCost || 0}
        netProfit={netProfit || 0}
      />

      {/* Tables Section */}
      <Card className="p-0 bg-white dark:bg-slate-900 border border-border/50 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <div className="p-4 sm:p-6 md:p-8 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <Receipt className="w-6 h-6 text-indigo-500" />
              Recent Transactions
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Latest billing activities</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleViewAllInvoices} className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-xl px-4 h-10">
            View All
          </Button>
        </div>
        <div className="p-4">
          <InvoiceTable limit={5} />
        </div>
      </Card>
    </div>
  );
}
