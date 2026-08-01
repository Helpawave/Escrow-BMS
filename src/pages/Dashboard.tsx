import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ModuleGrid } from '@/components/modules/ModuleGrid';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { DashboardCharts } from '@/components/DashboardCharts';
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
  CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/PageTransition';

type PeriodFilter = 'month' | '3m' | '6m' | 'fy' | 'ytd' | 'custom';

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
  const { user, profile } = useAuth();
  const { activeModules, hasModule } = useSubscription();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Active module checks
  const showBilling = hasModule('billing');
  const showLedger = hasModule('ledger');
  const showPayroll = hasModule('payroll');
  const showCRM = hasModule('crm');
  const showInventory = hasModule('inventory');
  const showHisab = hasModule('hisab');

  // Period & Tab Filter State
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('ytd');
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Wizard Accordion State
  const [wizardOpen, setWizardOpen] = useState(true);
  const [wizardDismissed, setWizardDismissed] = useState(false);

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
  });

  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  // Calculate Date Subtitle String based on selected period filter
  const getPeriodSubtitle = () => {
    const today = new Date();
    const formattedToday = `29 Jul ${today.getFullYear()}`;
    switch (selectedPeriod) {
      case 'month':
        return `This month • 01 Jul ${today.getFullYear()} → ${formattedToday}`;
      case '3m':
        return `Last 3M • 01 May ${today.getFullYear()} → ${formattedToday}`;
      case '6m':
        return `Last 6M • 01 Feb ${today.getFullYear()} → ${formattedToday}`;
      case 'fy':
        return `This FY • 01 Apr ${today.getFullYear()} → 31 Mar ${today.getFullYear() + 1}`;
      case 'ytd':
        return `YTD • 01 Jan ${today.getFullYear()} → ${formattedToday}`;
      case 'custom':
        return `Custom Period`;
      default:
        return `YTD • 01 Jan ${today.getFullYear()} → ${formattedToday}`;
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setLoadingStats(true);

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

        const [
          invoicesRes,
          recentInvsRes,
          empCountRes,
          pendLeavesRes,
          leadsCountRes,
          pendTasksCountRes,
          tasksDataRes,
          accountsRes,
          expensesRes,
          productsRes
        ] = await Promise.all([
          showBilling ? supabase.from('invoices').select('status, total_amount, issue_date').eq('user_id', user.id) : Promise.resolve({ data: [] as any[] }),
          showBilling ? supabase.from('invoices').select('id, invoice_number, total_amount, status, issue_date, client_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5) : Promise.resolve({ data: [] as any[] }),
          showPayroll ? supabase.from('employees').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active') : Promise.resolve({ count: 0 }),
          showPayroll ? supabase.from('leaves').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'pending') : Promise.resolve({ count: 0 }),
          showCRM ? supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', user.id) : Promise.resolve({ count: 0 }),
          showCRM ? supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).neq('status', 'done') : Promise.resolve({ count: 0 }),
          showCRM ? supabase.from('tasks').select('id, title, status, priority, due_date').eq('user_id', user.id).neq('status', 'done').order('created_at', { ascending: false }).limit(5) : Promise.resolve({ data: [] as any[] }),
          showLedger ? supabase.from('accounts').select('balance').eq('user_id', user.id) : Promise.resolve({ data: [] as any[] }),
          supabase.from('expenses').select('amount, created_at').eq('user_id', user.id),
          showInventory ? supabase.from('products').select('stock_quantity, min_stock_alert').eq('user_id', user.id) : Promise.resolve({ data: [] as any[] })
        ]);

        let totalSales = 0;
        let unpaidAmount = 0;
        let invoiceCount = 0;
        const invoicesData = invoicesRes.data || [];

        if (showBilling && invoicesData.length > 0) {
          totalSales = invoicesData.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
          unpaidAmount = invoicesData
            .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
            .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
          invoiceCount = invoicesData.length;

          invoicesData.forEach(inv => {
            const dateStr = inv.issue_date;
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

        const recentInvs = recentInvsRes.data || [];
        if (showBilling && recentInvs.length > 0) {
          const clientIds = recentInvs.map(i => i.client_id).filter(Boolean);
          let clientMap: Record<string, string> = {};
          if (clientIds.length > 0) {
            const { data: clientsData } = await supabase
              .from('clients')
              .select('id, name')
              .in('id', clientIds);
            clientMap = Object.fromEntries((clientsData || []).map(c => [c.id, c.name]));
          }

          setRecentInvoices(recentInvs.map(inv => ({
            id: inv.id,
            invoice_number: inv.invoice_number,
            total_amount: Number(inv.total_amount),
            status: inv.status,
            issue_date: inv.issue_date,
            client_name: clientMap[inv.client_id] || 'Client'
          })));
        }

        if (showCRM && tasksDataRes.data) {
          setRecentTasks(tasksDataRes.data as RecentTask[]);
        }

        let totalExpenses = 0;
        const exps = expensesRes.data || [];
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

        const prods = productsRes.data || [];
        const inventoryItemCount = prods.length;
        const lowStockCount = prods.filter((p: any) => Number(p.stock_quantity || 0) <= Number(p.min_stock_alert || 5)).length;

        const netCash = totalSales - totalExpenses;

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
          pendingTasksCount: pendTasksCountRes.count || 0,
          ledgerBalance,
          inventoryItemCount,
          lowStockCount
        });

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, [user, showBilling, showLedger, showPayroll, showCRM, showInventory, showHisab]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Onboarding wizard steps based on active modules
  const wizardSteps = [
    { title: 'Seed your chart of accounts', completed: true, show: showLedger },
    { title: 'Set up GST & raise first invoice', completed: stats.invoiceCount > 0, show: showBilling },
    { title: 'Add active employees', completed: stats.employeeCount > 0, show: showPayroll },
    { title: 'Catalog inventory items', completed: stats.inventoryItemCount > 0, show: showInventory },
    { title: 'Add your sales leads', completed: stats.leadsCount > 0, show: showCRM },
    { title: 'Record daily calculation', completed: false, show: showHisab },
  ].filter(s => s.show);

  const completedWizardCount = wizardSteps.filter(s => s.completed).length;

  // Build dynamic module tabs list
  const availableTabs = [
    { key: 'overview', label: 'Overview' },
    ...(showBilling ? [{ key: 'billing', label: 'Billing & Invoices' }] : []),
    ...(showLedger ? [{ key: 'ledger', label: 'Account Ledger' }] : []),
    ...(showPayroll ? [{ key: 'payroll', label: 'Payroll' }] : []),
    ...(showInventory ? [{ key: 'inventory', label: 'Inventory' }] : []),
    ...(showCRM ? [{ key: 'crm', label: 'CRM' }] : []),
    ...(showHisab ? [{ key: 'hisab', label: 'Daily Hisab' }] : []),
  ];

  return (
    <AppLayout>
      <PageTransition className="space-y-6 pb-16">

        {/* Dashboard Title & Date Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest">
                {profile?.company_name || 'Escrow Workspace'}
              </span>
            </div>
            <h2 className="text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
              Dashboard
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              {getPeriodSubtitle()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Date Filter Pills */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
              {[
                { key: 'month', label: 'This month' },
                { key: '3m', label: 'Last 3M' },
                { key: '6m', label: 'Last 6M' },
                { key: 'fy', label: 'This FY' },
                { key: 'ytd', label: 'YTD' },
                { key: 'custom', label: 'Custom' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setSelectedPeriod(item.key as PeriodFilter)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    selectedPeriod === item.key
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {showBilling && (
              <button
                onClick={() => navigate('/billing/create-invoice')}
                className="hidden md:flex h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-4 shadow-sm transition-all items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> New Invoice
              </button>
            )}
          </div>
        </div>

        {/* Onboarding Wizard Accordion */}
        {!wizardDismissed && wizardSteps.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setWizardOpen(!wizardOpen)}
                className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200 hover:text-indigo-600 transition-colors"
              >
                {wizardOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>Getting started — {completedWizardCount} of {wizardSteps.length} completed</span>
              </button>

              <button
                onClick={() => setWizardDismissed(true)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                title="Dismiss wizard"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {wizardOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                {wizardSteps.map((step, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    {step.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 fill-indigo-100 dark:fill-indigo-950 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 dark:text-slate-700 flex-shrink-0" />
                    )}
                    <span className={cn(
                      "text-xs font-semibold truncate",
                      step.completed ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-300"
                    )}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Active Module Tabs & View Full Reports Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {availableTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap",
                  activeTab === tab.key
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/ledger/reports')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1.5 self-end sm:self-auto"
          >
            <span>View full reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Active Subscribed Modules Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Billing Sales Card */}
              {showBilling && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Billing Sales</span>
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm">
                      ₹
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
                      {loadingStats ? '...' : formatCurrency(stats.totalSales)}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1 font-semibold">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{stats.invoiceCount} Total Invoices</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Ledger Cash & Bank Card */}
              {showLedger && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-blue-300 dark:hover:border-blue-800 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Ledger Cash & Bank</span>
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
                      {loadingStats ? '...' : formatCurrency(stats.ledgerBalance)}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                      <span>Accounts Summary Balance</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Payroll Active Employees Card */}
              {showPayroll && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-violet-300 dark:hover:border-violet-800 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Active Staff</span>
                    <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
                      {loadingStats ? '...' : stats.employeeCount}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1 font-semibold">
                      <span>{stats.pendingLeaves} Pending Leaves</span>
                    </p>
                  </div>
                </div>
              )}

              {/* CRM Contacts & Tasks Card */}
              {showCRM && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-purple-300 dark:hover:border-purple-800 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">CRM Contacts & Tasks</span>
                    <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
                      {loadingStats ? '...' : stats.leadsCount}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                      <span>{stats.pendingTasksCount} Pending Tasks</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Inventory Stock Card */}
              {showInventory && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-800 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Inventory Items</span>
                    <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
                      {loadingStats ? '...' : stats.inventoryItemCount}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                      <span>{stats.lowStockCount} Low Stock Alerts</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Net Cash / Expenses Card */}
              {(showHisab || showBilling) && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-teal-300 dark:hover:border-teal-800 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Net Cash Movement</span>
                    <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black font-heading text-teal-600 dark:text-teal-400 tracking-tight">
                      {loadingStats ? '...' : formatCurrency(stats.netCash)}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate font-semibold">
                      <span>In {formatCurrency(stats.totalSales)} • Out {formatCurrency(stats.totalExpenses)}</span>
                    </p>
                  </div>
                </div>
              )}

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
          </>
        )}

        {/* Dynamic Module Report Tabs (Billing, Ledger, Payroll, Inventory, CRM, Hisab) */}
        {activeTab === 'billing' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Billing & Sales Report Summary</h3>
                <p className="text-xs text-slate-400">Overview of invoices, payment statuses, and sales breakdown for {selectedPeriod.toUpperCase()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/billing/create-invoice')} className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors">
                  + Create Invoice
                </button>
                <button onClick={() => navigate('/billing/invoices')} className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  View All Invoices
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Total Sales Invoiced</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(stats.totalSales)}</p>
                <p className="text-[11px] text-slate-400 mt-1">{stats.invoiceCount} Invoices Issued</p>
              </div>

              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/40">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Unpaid Outstanding</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(stats.unpaidAmount)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Pending Client Collection</p>
              </div>

              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Paid Revenue Realized</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(stats.totalSales - stats.unpaidAmount)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Cleared Payments</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => navigate('/billing/reports')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                Open Comprehensive Billing Reports →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Account Ledger & Financial Books</h3>
                <p className="text-xs text-slate-400">Party ledgers, debit/credit entries, balance sheet & P&L statements</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/ledger')} className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors">
                  Open Party Ledger
                </button>
                <button onClick={() => navigate('/ledger/transfer')} className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  New Transfer Entry
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Cash & Bank Accounts</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(stats.ledgerBalance)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Total Account Balance</p>
              </div>

              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Net Profit & Loss</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(stats.totalSales - stats.totalExpenses)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Operating Profitability</p>
              </div>

              <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/40">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Party Balances</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(stats.unpaidAmount)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Outstanding Party Dues</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button onClick={() => navigate('/ledger/reports/balance-sheet')} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200">
                📄 Balance Sheet Report
              </button>
              <button onClick={() => navigate('/ledger/reports/profit-loss')} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200">
                📈 Profit & Loss Report
              </button>
              <button onClick={() => navigate('/ledger/reports/transactions')} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200">
                📋 Transaction Audit History
              </button>
            </div>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Escrow Payroll & HR Summary</h3>
                <p className="text-xs text-slate-400">Employee salary slips, attendance, PF/ESI compliance and leaves</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/payroll/employees')} className="px-3.5 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 transition-colors">
                  Staff Directory
                </button>
                <button onClick={() => navigate('/payroll/payslips')} className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  Generate Payslips
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-violet-50/50 dark:bg-violet-950/30 rounded-xl border border-violet-100 dark:border-violet-900/40">
                <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Active Employees</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.employeeCount}</p>
                <p className="text-[11px] text-slate-400 mt-1">Full-time & Contract Staff</p>
              </div>

              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/40">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Leaves</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.pendingLeaves}</p>
                <p className="text-[11px] text-slate-400 mt-1">Awaiting Manager Approval</p>
              </div>

              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Payroll Status</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">Verified</p>
                <p className="text-[11px] text-slate-400 mt-1">Escrow Vault Funded</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => navigate('/payroll/reports')} className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
                Open Comprehensive Payroll Reports →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Inventory & Stock Control</h3>
                <p className="text-xs text-slate-400">Stock SKUs, barcode scanner, low stock warnings, purchase orders</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/inventory/scan')} className="px-3.5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors">
                  Barcode Scanner
                </button>
                <button onClick={() => navigate('/inventory/products')} className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  Catalog Products
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-rose-50/50 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900/40">
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Total Products SKUs</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.inventoryItemCount}</p>
                <p className="text-[11px] text-slate-400 mt-1">Cataloged Stock Items</p>
              </div>

              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/40">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Low Stock Warnings</p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.lowStockCount}</p>
                <p className="text-[11px] text-slate-400 mt-1">Requires Re-order</p>
              </div>

              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Live Barcode Sync</p>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">Active</p>
                <p className="text-[11px] text-slate-400 mt-1">Ready for Billing Scan</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => navigate('/inventory/reports')} className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1">
                Open Stock Reports & Valuation →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'crm' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">CRM Sales Pipeline & Task Board</h3>
                <p className="text-xs text-slate-400">Leads management, action task board and conversion analytics</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/crm/tasks')} className="px-3.5 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors">
                  Open Task Board
                </button>
                <button onClick={() => navigate('/crm/leads')} className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  Leads Directory
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/40">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Total Sales Leads</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.leadsCount}</p>
                <p className="text-[11px] text-slate-400 mt-1">In Sales Funnel</p>
              </div>

              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Pending Action Tasks</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.pendingTasksCount}</p>
                <p className="text-[11px] text-slate-400 mt-1">Requires Follow-up</p>
              </div>

              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Conversion Rate</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">High</p>
                <p className="text-[11px] text-slate-400 mt-1">Active Client Pipeline</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => navigate('/crm/analytics')} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
                Open CRM Analytics & Pipeline Reports →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'hisab' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Daily Calculation & Cash Log</h3>
                <p className="text-xs text-slate-400">Daily income & expense tracking, cash closing balance</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/calculation')} className="px-3.5 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors">
                  Daily Calculation
                </button>
                <button onClick={() => navigate('/calculation/history')} className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  Calculation History
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/40">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Net Cash Movement</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(stats.netCash)}</p>
                <p className="text-[11px] text-slate-400 mt-1">In vs Out Balance</p>
              </div>

              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Income Logged</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(stats.totalSales)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Total Collections</p>
              </div>

              <div className="p-4 bg-rose-50/50 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900/40">
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Expenses Out</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(stats.totalExpenses)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Daily Expenses</p>
              </div>
            </div>
          </div>
        )}

        {/* Your Subscribed Business Modules Navigation Grid */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-heading font-black text-slate-900 dark:text-white">Your Business Applications</h3>
              <p className="text-xs text-slate-400 font-medium">Launch your enabled modules</p>
            </div>
            {activeModules.length < 6 && (
              <a href="/pricing" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                + Unlock More Modules
              </a>
            )}
          </div>
          <ModuleGrid />
        </div>

        {/* Bottom Keyboard Hotkey & Help Hint Bar */}
        <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-[10px] text-slate-700 dark:text-slate-300">Ctrl K</kbd>
            <span>Spotlight Search</span>
          </div>

          <button 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help</span>
          </button>
        </div>

      </PageTransition>
    </AppLayout>
  );
}
