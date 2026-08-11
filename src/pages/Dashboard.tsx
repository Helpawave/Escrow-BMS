import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ModuleGrid } from '@/components/modules/ModuleGrid';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { DashboardCharts } from '@/components/DashboardCharts';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Building2, 
  ChevronUp,
  ChevronDown,
  X,
  CheckCircle2,
  Circle,
  ArrowRight,
  HelpCircle,
  Receipt,
  Users,
  CheckSquare,
  Package,
  Calculator,
  Plus,
  Dot,
  FileText,
  Clock,
  BookOpen,
  ArrowLeftRight,
  KanbanSquare,
  ShieldCheck,
  CreditCard,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/PageTransition';

type PeriodFilter = 'all' | 'month' | '3m' | '6m' | 'fy' | 'ytd' | 'custom';

interface DashboardStats {
  totalSales: number;
  unpaidAmount: number;
  invoiceCount: number;
  totalExpenses: number;
  netCash: number;
  employeeCount: number;
  pendingLeaves: number;
  leadsCount: number;
  pendingTasksCount: number;
  ledgerBalance: number;
  inventoryItemCount: number;
  lowStockCount: number;
  accountCount: number;
  hisabCount: number;
}

interface RecentInvoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  issue_date: string;
  client_name?: string;
}

interface RecentTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string;
}

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const { activeModules, hasModule, loading: subscriptionLoading } = useSubscription();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Active module checks
  const showBilling = hasModule('billing');
  const showLedger = hasModule('ledger');
  const showPayroll = hasModule('payroll');
  const showCRM = hasModule('crm');
  const showInventory = hasModule('inventory');
  const showHisab = hasModule('hisab');

  // Period Filter State (defaults to 'all' for complete initial data overview)
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().substring(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().substring(0, 10);
  });

  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    unpaidAmount: 0,
    invoiceCount: 0,
    totalExpenses: 0,
    netCash: 0,
    employeeCount: 0,
    pendingLeaves: 0,
    leadsCount: 0,
    pendingTasksCount: 0,
    ledgerBalance: 0,
    inventoryItemCount: 0,
    lowStockCount: 0,
    accountCount: 0,
    hisabCount: 0,
  });

  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  // Calculate Date Subtitle String based on selected period filter
  const getPeriodSubtitle = () => {
    const today = new Date();
    const formatD = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    
    switch (selectedPeriod) {
      case 'all':
        return 'All Time Overview • Lifetime Business Performance';
      case 'month': {
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return `This Month • ${formatD(firstOfMonth)} → ${formatD(today)}`;
      }
      case '3m': {
        const d3m = new Date();
        d3m.setMonth(d3m.getMonth() - 3);
        return `Last 3 Months • ${formatD(d3m)} → ${formatD(today)}`;
      }
      case '6m': {
        const d6m = new Date();
        d6m.setMonth(d6m.getMonth() - 6);
        return `Last 6 Months • ${formatD(d6m)} → ${formatD(today)}`;
      }
      case 'fy': {
        const fyStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
        const fyStart = new Date(fyStartYear, 3, 1);
        const fyEnd = new Date(fyStartYear + 1, 2, 31);
        return `Financial Year • ${formatD(fyStart)} → ${formatD(fyEnd)}`;
      }
      case 'ytd': {
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        return `Year To Date • ${formatD(startOfYear)} → ${formatD(today)}`;
      }
      case 'custom': {
        if (!customStartDate || !customEndDate) return 'Custom Date Range';
        const s = new Date(customStartDate);
        const e = new Date(customEndDate);
        return `Custom Range • ${formatD(s)} → ${formatD(e)}`;
      }
      default:
        return `Period Overview`;
    }
  };

  useEffect(() => {
    if (!user || authLoading || subscriptionLoading) return;

    let isMounted = true;

    const safeQuery = async <T = any>(queryFn: () => PromiseLike<any> | Promise<any>, fallback: any): Promise<T> => {
      try {
        const result = await queryFn();
        return (result || fallback) as T;
      } catch (e) {
        console.warn('Dashboard query fallback:', e);
        return fallback as T;
      }
    };

    const fetchDashboardData = async () => {
      try {
        if (isMounted) setLoadingStats(true);

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          last6Months.push({
            monthName: months[d.getMonth()],
            yearMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            sales: 0,
            revenue: 0,
            expense: 0,
          });
        }

        const { start: dateStart, end: dateEnd } = (() => {
          const today = new Date();
          let start: Date;
          let end: Date = new Date();

          switch (selectedPeriod) {
            case 'month':
              start = new Date(today.getFullYear(), today.getMonth(), 1);
              break;
            case '3m':
              start = new Date();
              start.setMonth(start.getMonth() - 3);
              start.setDate(1);
              break;
            case '6m':
              start = new Date();
              start.setMonth(start.getMonth() - 6);
              start.setDate(1);
              break;
            case 'fy': {
              const fyStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
              start = new Date(fyStartYear, 3, 1);
              end = new Date(fyStartYear + 1, 2, 31, 23, 59, 59);
              break;
            }
            case 'ytd':
              start = new Date(today.getFullYear(), 0, 1);
              break;
            case 'custom':
              start = customStartDate ? new Date(customStartDate) : new Date(2020, 0, 1);
              end = customEndDate ? new Date(`${customEndDate}T23:59:59`) : new Date();
              break;
            default:
              start = new Date(2000, 0, 1);
          }
          return { start, end };
        })();

        const [
          invoicesRes,
          clientsRes,
          empCountRes,
          pendLeavesRes,
          leadsCountRes,
          tasksDataRes,
          accountsRes,
          expensesRes,
          productsRes,
          hisabRes
        ] = await Promise.all([
          showBilling ? safeQuery(async () => await supabase.from('invoices').select('id, invoice_number, total_amount, status, issue_date, created_at, client_id').eq('user_id', user.id).order('created_at', { ascending: false }), { data: [] as any[] }) : Promise.resolve({ data: [] as any[] }),
          showBilling ? safeQuery(async () => await supabase.from('clients').select('id, name').eq('user_id', user.id), { data: [] as any[] }) : Promise.resolve({ data: [] as any[] }),
          showPayroll ? safeQuery(async () => await supabase.from('employees').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'), { count: 0 }) : Promise.resolve({ count: 0 }),
          showPayroll ? safeQuery(async () => await supabase.from('leaves').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'pending'), { count: 0 }) : Promise.resolve({ count: 0 }),
          showCRM ? safeQuery(async () => await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', user.id), { count: 0 }) : Promise.resolve({ count: 0 }),
          showCRM ? safeQuery(async () => await supabase.from('tasks').select('id, title, status, priority, due_date', { count: 'exact' }).eq('user_id', user.id).neq('status', 'done').order('created_at', { ascending: false }).limit(5), { data: [] as any[], count: 0 }) : Promise.resolve({ data: [] as any[], count: 0 }),
          showLedger ? safeQuery(async () => await supabase.from('accounts').select('id, balance').eq('user_id', user.id), { data: [] as any[] }) : Promise.resolve({ data: [] as any[] }),
          safeQuery(async () => await supabase.from('expenses').select('amount, created_at').eq('user_id', user.id), { data: [] as any[] }),
          showInventory ? safeQuery(async () => await supabase.from('products').select('id, opening_stock').eq('user_id', user.id), { data: [] as any[] }) : Promise.resolve({ data: [] as any[] }),
          showHisab ? safeQuery(async () => await supabase.from('calculations').select('*', { count: 'exact', head: true }).eq('user_id', user.id), { count: 0 }) : Promise.resolve({ count: 0 })
        ]);

        if (!isMounted) return;

        const clientsMap = new Map((clientsRes.data || []).map((c: any) => [c.id, c.name]));
        const rawInvoices = invoicesRes.data || [];

        const invoicesData = rawInvoices.filter((inv: any) => {
          if (selectedPeriod === 'all') return true;
          const dateStr = inv.issue_date || inv.created_at;
          if (!dateStr) return true;
          const invDate = new Date(dateStr);
          return invDate >= dateStart && invDate <= dateEnd;
        });

        let totalSales = 0;
        let unpaidAmount = 0;
        let invoiceCount = 0;

        if (showBilling && invoicesData.length > 0) {
          totalSales = invoicesData.reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0);
          unpaidAmount = invoicesData
            .filter((inv: any) => inv.status !== 'paid' && inv.status !== 'cancelled')
            .reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0);
          invoiceCount = invoicesData.length;

          invoicesData.forEach((inv: any) => {
            const dateStr = inv.issue_date || inv.created_at;
            if (dateStr) {
              const ym = dateStr.substring(0, 7);
              const mData = last6Months.find(m => m.yearMonth === ym);
              if (mData) {
                const amt = Number(inv.total_amount || 0);
                mData.sales += amt;
                if (inv.status === 'paid') {
                  mData.revenue += amt;
                }
              }
            }
          });
        }

        if (showBilling && rawInvoices.length > 0 && isMounted) {
          setRecentInvoices(rawInvoices.slice(0, 5).map((inv: any) => ({
            id: inv.id,
            invoice_number: inv.invoice_number || 'INV',
            total_amount: Number(inv.total_amount || 0),
            status: inv.status,
            issue_date: inv.issue_date || inv.created_at,
            client_name: clientsMap.get(inv.client_id) || 'Client'
          })));
        }

        if (showCRM && tasksDataRes.data && isMounted) {
          setRecentTasks(tasksDataRes.data as RecentTask[]);
        }

        let totalExpenses = 0;
        const rawExps = expensesRes.data || [];
        const exps = rawExps.filter((exp: any) => {
          if (selectedPeriod === 'all') return true;
          if (!exp.created_at) return true;
          const expDate = new Date(exp.created_at);
          return expDate >= dateStart && expDate <= dateEnd;
        });

        exps.forEach((exp: any) => {
          const amt = Number(exp.amount || 0);
          totalExpenses += amt;
          const dateStr = exp.created_at;
          if (dateStr) {
            const ym = dateStr.substring(0, 7);
            const mData = last6Months.find(m => m.yearMonth === ym);
            if (mData) {
              mData.expense += amt;
            }
          }
        });

        const accountsData = accountsRes.data || [];
        const ledgerBalance = accountsData.reduce((sum: number, acc: any) => sum + Number(acc.balance || 0), 0);
        const accountCount = accountsData.length;
        const hisabCount = (hisabRes as any)?.count || 0;

        const prods = productsRes.data || [];
        const inventoryItemCount = prods.length;
        const lowStockCount = prods.filter((p: any) => Number(p.current_stock ?? p.opening_stock ?? 0) <= 5).length;

        const netCash = totalSales - totalExpenses;

        if (isMounted) {
          setChartData(last6Months.map(m => ({
            name: m.monthName,
            sales: m.sales,
            revenue: m.revenue,
            expense: m.expense,
          })));

          setStats({
            totalSales,
            unpaidAmount,
            invoiceCount,
            totalExpenses,
            netCash,
            employeeCount: empCountRes.count || 0,
            pendingLeaves: pendLeavesRes.count || 0,
            leadsCount: leadsCountRes.count || 0,
            pendingTasksCount: (tasksDataRes as any).count || 0,
            ledgerBalance,
            inventoryItemCount,
            lowStockCount,
            accountCount,
            hisabCount,
          });
        }

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, subscriptionLoading, activeModules, selectedPeriod, customStartDate, customEndDate]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };






  return (
    <PageTransition className="space-y-6 pb-16">

        {/* Dashboard Title & Date Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
              Dashboard
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{getPeriodSubtitle()}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Pill Period Filters (Khaata Omniworks Style) */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <button
                onClick={() => setSelectedPeriod('all')}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  selectedPeriod === 'all'
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                All Time
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  selectedPeriod === 'month'
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                This month
              </button>
              <button
                onClick={() => setSelectedPeriod('3m')}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  selectedPeriod === '3m'
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                Last 3M
              </button>
              <button
                onClick={() => setSelectedPeriod('6m')}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  selectedPeriod === '6m'
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                Last 6M
              </button>
              <button
                onClick={() => setSelectedPeriod('fy')}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  selectedPeriod === 'fy'
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                This FY
              </button>
              <button
                onClick={() => setSelectedPeriod('ytd')}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  selectedPeriod === 'ytd'
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                YTD
              </button>
              <button
                onClick={() => setSelectedPeriod('custom')}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  selectedPeriod === 'custom'
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                Custom
              </button>
            </div>

            {/* Quick Action Button */}
            {showBilling && (
              <button
                onClick={() => navigate('/billing/create-invoice')}
                className="hidden md:flex h-9 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-4 shadow-xs transition-all items-center gap-1.5 cursor-pointer ml-1"
              >
                <Plus className="w-4 h-4" /> New Invoice
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Range Picker Toolbar */}
        {selectedPeriod === 'custom' && (
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 max-w-lg">
            <CustomDatePicker
              label="From (Start Date)"
              value={customStartDate}
              onChange={(val) => setCustomStartDate(val)}
            />
            <CustomDatePicker
              label="To (End Date)"
              value={customEndDate}
              onChange={(val) => setCustomEndDate(val)}
            />
          </div>
        )}

        {/* Getting Started Onboarding Checklist Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              <span>Getting started — 2 of 6 completed</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="line-through text-slate-400">Configure business GST & profile</span>
            </div>
            <div className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onClick={() => navigate('/billing/products')}>
              <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
              <span>Add your first product item</span>
            </div>
            <div className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onClick={() => navigate('/ledger/create/party')}>
              <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
              <span>Add your first party / client</span>
            </div>
            <div className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onClick={() => navigate('/billing/create-invoice')}>
              <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
              <span>Raise your first sales invoice</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="line-through text-slate-400">Provision workspace access</span>
            </div>
            <div className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onClick={() => navigate('/payroll/employees')}>
              <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
              <span>Add staff & salary details</span>
            </div>
          </div>
        </div>



        {/* View Full Reports Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Business Performance Overview
          </h2>
          <button
            onClick={() => navigate('/reports')}
            className="text-xs font-bold text-[#5644E6] dark:text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <span>View Full Business Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Overview Dashboard Content */}
        <div className="space-y-6">
            {/* Primary Financial & Operational Metric Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Billing Sales Card (Primary Financial) */}
              {showBilling && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Sales</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight data-mono">
                      {loadingStats ? '...' : formatCurrency(stats.totalSales)}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      <span>{stats.invoiceCount} Invoices Raised</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Ledger Cash & Bank Card (Primary Financial) */}
              {showLedger && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cash & Bank Balance</span>
                    <Wallet className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight data-mono">
                      {loadingStats ? '...' : formatCurrency(stats.ledgerBalance)}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      <span>Accounts Summary Balance</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Net Cash Movement (Primary Financial) */}
              {(showHisab || showBilling) && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Cash Flow</span>
                    <Building2 className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-black font-heading text-teal-600 dark:text-teal-400 tracking-tight data-mono">
                      {loadingStats ? '...' : formatCurrency(stats.netCash)}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium truncate">
                      <span>In {formatCurrency(stats.totalSales)} • Out {formatCurrency(stats.totalExpenses)}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Secondary Operational Summary Card (Staff, CRM, Stock) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Operations Overview</span>
                  <Package className="w-4 h-4 text-slate-400" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100 dark:border-slate-800">
                  {showPayroll && (
                    <div>
                      <p className="text-base font-bold text-slate-900 dark:text-white data-mono">{loadingStats ? '...' : stats.employeeCount}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">Staff</p>
                    </div>
                  )}
                  {showInventory && (
                    <div>
                      <p className="text-base font-bold text-slate-900 dark:text-white data-mono">{loadingStats ? '...' : stats.inventoryItemCount}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">Stock</p>
                    </div>
                  )}
                  {showCRM && (
                    <div>
                      <p className="text-base font-bold text-slate-900 dark:text-white data-mono">{loadingStats ? '...' : stats.leadsCount}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">Leads</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Financial Analytics Grid (Row 2) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              
              {/* Net Profit Monthly Visualizer (8 cols) */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Net Profit Trends</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Monthly revenue vs expenses</p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
                      {formatCurrency(stats.totalSales - stats.totalExpenses)}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-semibold justify-end">
                      <span>Revenue <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(stats.totalSales)}</strong></span>
                      <span>Expenses <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(stats.totalExpenses)}</strong></span>
                    </div>
                  </div>
                </div>

                {!loadingStats && (
                  <DashboardCharts 
                    chartData={chartData}
                    totalRevenue={stats.totalSales}
                    totalExpenses={stats.totalExpenses}
                    totalPurchaseCost={stats.totalExpenses}
                    netProfit={stats.totalSales - stats.totalExpenses}
                  />
                )}
              </div>

              {/* Recent Billing / Tasks Activity Split (4 cols) */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    Recent Activity
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Latest invoices and sales follow-ups
                  </p>

                  {showBilling && recentInvoices.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {recentInvoices.map((inv) => (
                        <div key={inv.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{inv.invoice_number}</p>
                            <p className="text-[10px] text-slate-400">{inv.client_name}</p>
                          </div>
                          <span className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(inv.total_amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="my-8 py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                      <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No recent activity</p>
                      <p className="text-[10px] text-slate-400 mt-1">Actions in your active modules will appear here.</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Current Outstanding</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(stats.unpaidAmount)}</span>
                </div>
              </div>

            </div>
        </div>

      </PageTransition>
  );
}
