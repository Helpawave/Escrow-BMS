import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AppLayout } from '@/components/layout/AppLayout';
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
  CheckSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/PageTransition';

type PeriodFilter = 'month' | '3m' | '6m' | 'fy' | 'ytd' | 'custom';
type DashboardTab = 'overview' | 'sales' | 'purchases' | 'tax' | 'cost_centers';

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
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { hasModule } = useSubscription();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Period Filter State
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('ytd');
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  // Wizard Accordion State
  const [wizardOpen, setWizardOpen] = useState(true);
  const [wizardDismissed, setWizardDismissed] = useState(false);

  const showBilling = hasModule('billing');
  const showLedger = hasModule('ledger');
  const showPayroll = hasModule('payroll');
  const showCRM = hasModule('crm');

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
    pendingTasksCount: 0
  });

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
        return `Custom • Select custom date range`;
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
          empCountRes,
          pendLeavesRes,
          leadsCountRes,
          pendTasksCountRes,
          expensesRes
        ] = await Promise.all([
          showBilling ? supabase.from('invoices').select('status, total_amount, issue_date').eq('user_id', user.id) : Promise.resolve({ data: [] as any[] }),
          showPayroll ? supabase.from('employees').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active') : Promise.resolve({ count: 0 }),
          showPayroll ? supabase.from('leaves').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'pending') : Promise.resolve({ count: 0 }),
          showCRM ? supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', user.id) : Promise.resolve({ count: 0 }),
          showCRM ? supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).neq('status', 'done') : Promise.resolve({ count: 0 }),
          supabase.from('expenses').select('amount, created_at').eq('user_id', user.id)
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
        });

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, [user, showBilling, showLedger, showPayroll, showCRM]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const wizardSteps = [
    { title: 'Seed your chart of accounts', completed: true },
    { title: 'Set up GST', completed: false },
    { title: 'Add your first customer', completed: false },
    { title: 'Add your first item', completed: false },
    { title: 'Raise your first invoice', completed: false },
    { title: 'Connect a bank account', completed: false },
  ];

  return (
    <AppLayout>
      <PageTransition className="space-y-6 pb-16">

        {/* Dashboard Title & Date Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h2 className="text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
              Dashboard
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              {getPeriodSubtitle()}
            </p>
          </div>

          {/* Date Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
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
        </div>

        {/* Onboarding Wizard Accordion ("Getting started - 1 of 6 done") */}
        {!wizardDismissed && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setWizardOpen(!wizardOpen)}
                className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200 hover:text-indigo-600 transition-colors"
              >
                {wizardOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>Getting started - 1 of 6 done</span>
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

        {/* Dashboard Tabs & View Full Reports Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'sales', label: 'Sales' },
              { key: 'purchases', label: 'Purchases' },
              { key: 'tax', label: 'Tax' },
              { key: 'cost_centers', label: 'Cost Centers' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as DashboardTab)}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap",
                  activeTab === tab.key
                    ? "bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white"
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

        {/* Overview Metric Cards Grid (Row 1) */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Revenue Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Revenue</span>
                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm">
                    ₹
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
                    {loadingStats ? '...' : formatCurrency(stats.totalSales)}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1 font-semibold">
                    <span>-- vs prev period</span>
                  </p>
                </div>
              </div>

              {/* Expenses Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-amber-300 dark:hover:border-amber-800 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Expenses</span>
                  <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
                    {loadingStats ? '...' : formatCurrency(stats.totalExpenses)}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1 font-semibold">
                    <span>-- vs prev period</span>
                  </p>
                </div>
              </div>

              {/* Receivables Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Receivables</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
                    {loadingStats ? '...' : formatCurrency(stats.unpaidAmount)}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate font-semibold">
                    <span>As of 29 Jul 2026 • Overdue 90+: ₹0</span>
                  </p>
                </div>
              </div>

              {/* Net Cash Movement Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-teal-300 dark:hover:border-teal-800 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Net cash movement</span>
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
            </div>

            {/* Financial Analytics Grid (Row 2) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              
              {/* Net Profit Monthly Visualizer (8 cols) */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Net profit</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Monthly • income less expenses</p>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
                      {formatCurrency(stats.totalSales - stats.totalExpenses)}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                      -- vs prev period
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

              {/* Receivables vs Payables Aging (4 cols) */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    Receivables vs payables aging
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    As of 29 Jul 2026
                  </p>

                  {/* Legend buckets */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> 0-30: ₹0</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> 31-60: ₹0</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 61-90: ₹0</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> 90+: ₹0</span>
                  </div>

                  {/* Empty state / aging bars visualization */}
                  <div className="my-8 py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                    <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No overdue bills or invoices</p>
                    <p className="text-[10px] text-slate-400 mt-1">Aging balances will appear here when invoices are generated.</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Current Outstanding</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(stats.unpaidAmount)}</span>
                </div>
              </div>

            </div>
          </>
        )}

        {/* Tab content placeholder for non-overview tabs */}
        {activeTab !== 'overview' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 capitalize">{activeTab} Details & Reports</h3>
            <p className="text-xs text-slate-400 mt-1">Detailed {activeTab} analytics breakdown is active for period: {selectedPeriod.toUpperCase()}</p>
            <button 
              onClick={() => setActiveTab('overview')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
            >
              Back to Overview
            </button>
          </div>
        )}

        {/* Bottom Keyboard Hotkey & Help Hint Bar */}
        <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-[10px] text-slate-700 dark:text-slate-300">F2</kbd>
            <span>Focus period / date</span>
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
