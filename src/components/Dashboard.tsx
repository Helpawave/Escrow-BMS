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
  ArrowDownRight,
  ShoppingBag,
  Building2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useUserType } from "@/hooks/useUserType";

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
  const { user, isStaff, staffPermissions, profile: authProfile, companyProfile, effectiveUserId } = useAuth();
  const { isFoodKitchen } = useUserType();

  useEffect(() => {
    if (isStaff) {
      const permissionPathMap: Record<string, string> = {
        'invoices': '/invoices',
        'purchase-invoices': '/purchase-invoices',
        'clients': '/clients',
        'vendors': '/vendors',
        'products': '/products',
        'payments': '/payments',
        'expenses': '/expenses',
        'einvoice': '/einvoice',
      };
      let target = '/settings';
      for (const perm of (staffPermissions || [])) {
        if (permissionPathMap[perm]) {
          target = permissionPathMap[perm];
          break;
        }
      }
      navigate(target, { replace: true });
    }
  }, [isStaff, staffPermissions, navigate]);

  const [dateRange, setDateRange] = useState<string>("all");
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

  if (isStaff) {
    return null;
  }

  const {
    totalRevenue = 0,
    totalSalesAll = 0,
    totalInvoices = 0,
    activeClients = 0,
    totalProducts = 0,
    totalQuantitySold = 0,
    outstanding = 0,
    totalExpenses = 0,
    totalPurchase = 0,
    netProfit = 0,
    totalPurchaseCost = 0,
    chartData = [],
    trends = { sales: 0, purchase: 0, revenue: 0, expense: 0 }
  } = stats || {};

  const targetUserId = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
  const [logoImageError, setLogoImageError] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('company_name, logo_url')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Dashboard profile query warning:', error);
      }

      const profData = data as any;
      let logoUrl = profData?.logo_url || authProfile?.logo_url || companyProfile?.logo_url || null;

      // Check localStorage backup
      if (!logoUrl && typeof window !== 'undefined') {
        try {
          const cachedLogo = localStorage.getItem('escrow_company_logo_url');
          if (cachedLogo) logoUrl = cachedLogo;
        } catch {}
      }

      // Check storage bucket if still null
      if (!logoUrl) {
        try {
          const { data: files } = await supabase.storage
            .from('company-assets')
            .list(targetUserId);

          const logoFile = files?.find(f => f.name.toLowerCase().startsWith('logo.'));
          if (logoFile) {
            const { data: pubData } = supabase.storage
              .from('company-assets')
              .getPublicUrl(`${targetUserId}/${logoFile.name}`);

            if (pubData?.publicUrl) {
              logoUrl = `${pubData.publicUrl}?t=${Date.now()}`;
              // Auto-sync back to profiles table
              void (supabase as any)
                .from('profiles')
                .update({ logo_url: logoUrl })
                .eq('user_id', targetUserId);
              try {
                localStorage.setItem('escrow_company_logo_url', logoUrl);
              } catch {}
            }
          }
        } catch (e) {
          console.warn('Storage logo check error:', e);
        }
      }

      return {
        company_name: profData?.company_name || authProfile?.company_name || companyProfile?.company_name || 'Business',
        logo_url: logoUrl
      };
    },
    enabled: !!targetUserId,
    initialData: authProfile ? {
      company_name: authProfile.company_name || 'Business',
      logo_url: authProfile.logo_url || companyProfile?.logo_url || (typeof window !== 'undefined' ? localStorage.getItem('escrow_company_logo_url') : null)
    } : undefined
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!targetUserId) return;

    const channel = supabase
      .channel(`profile-updates-${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${targetUserId}`
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [targetUserId, queryClient]);

  const handleCreateInvoice = () => navigate('/create-invoice');
  const handleViewAllInvoices = () => navigate('/invoices');

  if (error) {
    console.error('Error fetching dashboard stats:', error);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeProfile = profile as any;
  const companyDisplayName = safeProfile?.company_name || authProfile?.company_name || companyProfile?.company_name || 'Business';
  const companyInitial = companyDisplayName.trim().charAt(0).toUpperCase() || 'B';
  const effectiveLogoUrl = !logoImageError 
    ? (safeProfile?.logo_url || authProfile?.logo_url || companyProfile?.logo_url || (typeof window !== 'undefined' ? localStorage.getItem('escrow_company_logo_url') : null))
    : null;

  const { currencySymbol, formatAmount, currencyCode } = useCurrency();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {effectiveLogoUrl ? (
            <div 
              onClick={() => navigate('/settings')}
              title="Company Logo • Click to manage in Settings"
              className="w-14 h-14 bg-white dark:bg-slate-900 border border-border/70 rounded-2xl overflow-hidden shadow-md hover:shadow-lg flex items-center justify-center p-1.5 cursor-pointer hover:border-primary/50 transition-all group shrink-0"
            >
              <img 
                src={effectiveLogoUrl} 
                alt={`${companyDisplayName} Logo`} 
                onError={() => setLogoImageError(true)}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
              />
            </div>
          ) : (
            <div 
              onClick={() => navigate('/settings')}
              title="Upload Company Logo in Settings"
              className="w-14 h-14 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 rounded-2xl border border-primary/25 flex items-center justify-center text-primary font-black text-xl shadow-inner hover:scale-105 cursor-pointer transition-all group shrink-0"
            >
              <span className="group-hover:hidden select-none">{companyInitial}</span>
              <Building2 className="w-6 h-6 hidden group-hover:block transition-all animate-in fade-in zoom-in" />
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Hello, {companyDisplayName}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
        <StatCard
          title="Total Sales"
          value={formatAmount(totalSalesAll || 0)}
          trend={trends?.sales}
          change="Lifetime sales value"
          changeType={(trends?.sales || 0) >= 0 ? "positive" : "negative"}
          icon={currencyCode === 'INR' ? <IndianRupee /> : <DollarSign />}
        />
        <StatCard
          title="Total Collected"
          value={formatAmount(totalRevenue || 0)}
          trend={trends?.revenue}
          change="Payments received"
          changeType="positive"
          icon={currencyCode === 'INR' ? <IndianRupee /> : <DollarSign />}
        />
        <StatCard
          title="Outstanding"
          value={formatAmount(outstanding || 0)}
          change="Pending collection"
          changeType="negative"
          icon={currencyCode === 'INR' ? <IndianRupee /> : <DollarSign />}
        />
        <StatCard
          title="Net Profit"
          value={
            netProfit < 0
              ? `-${formatAmount(Math.abs(netProfit || 0))}`
              : formatAmount(netProfit || 0)
          }
          trend={trends?.revenue}
          change={netProfit >= 0 ? "Profitable period" : "Review spending"}
          changeType={netProfit >= 0 ? "positive" : "negative"}
          icon={<TrendingUp />}
        />
        <StatCard
          title="Total Invoices"
          value={(totalInvoices || 0).toLocaleString('en-IN')}
          change="Invoices generated"
          changeType="neutral"
          icon={<FileText />}
        />
        <StatCard
          title="Total Purchase"
          value={formatAmount(totalPurchase || 0)}
          change="Lifetime procurement"
          changeType="negative"
          icon={<ShoppingCart />}
        />
        {(isFoodKitchen ||
          (user?.id === 'dddbc465-7743-42c6-88f0-039a4332711d') || 
          safeProfile?.company_name?.toLowerCase().includes('geeta') || 
          user?.email === 'krishnayadav240225@gmail.com') ? (
          <StatCard
            title="Total Quantity Sold"
            value={(totalQuantitySold || 0).toLocaleString('en-IN')}
            change="Plates / Units sold"
            changeType="positive"
            icon={<ShoppingBag />}
          />
        ) : (
          <StatCard
            title="Total Products"
            value={(totalProducts || 0).toLocaleString('en-IN')}
            change="Inventory items"
            changeType="neutral"
            icon={<ShoppingCart />}
          />
        )}
        <StatCard
          title="Total Expenses"
          value={formatAmount(totalExpenses || 0)}
          trend={trends?.expense}
          change="Operational costs"
          changeType="negative"
          icon={<TrendingDown />}
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
