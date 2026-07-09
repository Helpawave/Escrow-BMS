import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { ModuleGrid } from '@/components/modules/ModuleGrid';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { 
  Zap, 
  TrendingUp, 
  Clock, 
  Users, 
  Receipt, 
  Wallet, 
  CheckSquare, 
  Building2, 
  CalendarDays,
  FileText,
  Plus,
  ArrowRight,
  TrendingDown,
  Percent,
  Dot
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalSales: number;
  unpaidAmount: number;
  invoiceCount: number;
  employeeCount: number;
  pendingLeaves: number;
  leadsCount: number;
  pendingTasksCount: number;
  ledgerBalance: number;
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
  
  const showBilling = hasModule('billing');
  const showLedger = hasModule('ledger');
  const showPayroll = hasModule('payroll');
  const showCRM = hasModule('crm');
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    unpaidAmount: 0,
    invoiceCount: 0,
    employeeCount: 0,
    pendingLeaves: 0,
    leadsCount: 0,
    pendingTasksCount: 0,
    ledgerBalance: 0
  });
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setLoadingStats(true);

        let totalSales = 0;
        let unpaidAmount = 0;
        let invoiceCount = 0;
        let employeeCount = 0;
        let pendingLeaves = 0;
        let leadsCount = 0;
        let pendingTasksCount = 0;
        let ledgerBalance = 0;

        // 1. Fetch Invoices summary
        if (showBilling) {
          const { data: invoicesData } = await supabase
            .from('invoices')
            .select('status, total_amount')
            .eq('user_id', user.id);

          totalSales = invoicesData?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;
          unpaidAmount = invoicesData
            ?.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
            ?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;
          invoiceCount = invoicesData?.length || 0;

          // Fetch recent 5 invoices
          const { data: recentInvs } = await supabase
            .from('invoices')
            .select('id, invoice_number, total_amount, status, issue_date, client_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (recentInvs && recentInvs.length > 0) {
            const clientIds = recentInvs.map(i => i.client_id);
            const { data: clientsData } = await supabase
              .from('clients')
              .select('id, name')
              .in('id', clientIds);

            const clientMap = Object.fromEntries((clientsData || []).map(c => [c.id, c.name]));
            const formattedInvoices: RecentInvoice[] = recentInvs.map(inv => ({
              id: inv.id,
              invoice_number: inv.invoice_number,
              total_amount: Number(inv.total_amount),
              status: inv.status,
              issue_date: inv.issue_date,
              client_name: clientMap[inv.client_id] || 'Unknown Client'
            }));
            setRecentInvoices(formattedInvoices);
          } else {
            setRecentInvoices([]);
          }
        }

        // 2. Fetch Payroll summary
        if (showPayroll) {
          const { count: empCount } = await supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'active');

          const { count: pendLeaves } = await supabase
            .from('leaves')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'pending');

          employeeCount = empCount || 0;
          pendingLeaves = pendLeaves || 0;
        }

        // 3. Fetch CRM metrics
        if (showCRM) {
          const { count: lCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          const { count: pendTasksCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .neq('status', 'done');

          leadsCount = lCount || 0;
          pendingTasksCount = pendTasksCount || 0;

          // Fetch recent 5 pending tasks
          const { data: tasksData } = await supabase
            .from('tasks')
            .select('id, title, status, priority, due_date')
            .eq('user_id', user.id)
            .neq('status', 'done')
            .order('created_at', { ascending: false })
            .limit(5);
          
          if (tasksData) {
            setRecentTasks(tasksData as RecentTask[]);
          } else {
            setRecentTasks([]);
          }
        }

        // 4. Fetch Ledger Accounts balance
        if (showLedger) {
          const { data: accountsData } = await supabase
            .from('accounts')
            .select('balance')
            .eq('user_id', user.id);
          ledgerBalance = accountsData?.reduce((sum, acc) => sum + Number(acc.balance || 0), 0) || 0;
        }

        setStats({
          totalSales,
          unpaidAmount,
          invoiceCount,
          employeeCount,
          pendingLeaves,
          leadsCount,
          pendingTasksCount,
          ledgerBalance
        });

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, [user, showBilling, showLedger, showPayroll, showCRM]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-100 dark:border-emerald-900/30">Paid</span>;
      case 'overdue':
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-md border border-rose-100 dark:border-rose-900/30">Overdue</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-md border border-amber-100 dark:border-amber-900/30">{status}</span>;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const activeStatsCount = [showBilling, showLedger, showPayroll, showCRM].filter(Boolean).length;

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in pb-12">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs text-brand-600 dark:text-brand-400 font-bold uppercase tracking-widest mb-1">{greeting()} 👋</p>
            <h2 className="text-3xl font-heading font-black text-slate-900 dark:text-white tracking-tight">
              {profile?.full_name ? `${t('welcomeBack')}, ${profile.full_name.split(' ')[0]}!` : t('welcomeSub')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm flex items-center gap-1.5 font-medium">
              <Building2 className="w-4 h-4 text-slate-400" />
              {profile?.company_name ? (
                <span className="font-bold text-slate-800 dark:text-slate-200">{profile.company_name}</span>
              ) : (
                <span>No Company Profile</span>
              )}
              <Dot className="text-slate-300 dark:text-slate-700" />
              <span>Workspace Administrator</span>
            </p>
          </div>
          <div className="flex gap-2">
            {showBilling && (
              <button
                onClick={() => navigate('/billing/create-invoice')}
                className="h-10 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs uppercase tracking-wider px-5 shadow-sm hover:shadow transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> New Invoice
              </button>
            )}
            <button
              onClick={() => navigate('/settings')}
              className="h-10 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider px-5 shadow-xs transition-all"
            >
              Settings
            </button>
          </div>
        </div>

        {/* Business Metrics Grid */}
        {activeStatsCount > 0 && (
          <div className={cn(
            "grid grid-cols-1 gap-5",
            activeStatsCount === 3 
              ? "sm:grid-cols-3" 
              : activeStatsCount === 2 
              ? "sm:grid-cols-2" 
              : activeStatsCount === 1 
              ? "sm:grid-cols-1" 
              : "sm:grid-cols-2 lg:grid-cols-4"
          )}>
            {/* Sales Card */}
            {showBilling && (
              <div className="card p-6 flex flex-col justify-between relative overflow-hidden group hover:border-brand-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Billing Sales</span>
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400">
                    <Receipt className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
                    {loadingStats ? '...' : formatCurrency(stats.totalSales)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{stats.invoiceCount} Total Invoices</span>
                  </p>
                </div>
              </div>
            )}

            {/* Ledger Accounts Card */}
            {showLedger && (
              <div className="card p-6 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Ledger Cash & Bank</span>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
                    {loadingStats ? '...' : formatCurrency(stats.ledgerBalance)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>Account Balance summary</span>
                  </p>
                </div>
              </div>
            )}

            {/* Payroll active employees */}
            {showPayroll && (
              <div className="card p-6 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Active Employees</span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
                    {loadingStats ? '...' : stats.employeeCount}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{stats.pendingLeaves} Pending Leaves</span>
                  </p>
                </div>
              </div>
            )}

            {/* CRM Leads & Tasks */}
            {showCRM && (
              <div className="card p-6 flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">CRM Contacts & Tasks</span>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
                    {loadingStats ? '...' : stats.leadsCount}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>{stats.pendingTasksCount} Pending Tasks</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dashboard Split View */}
        {(showBilling || showCRM) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recent Invoices (Billing) */}
            {showBilling && (
              <div className={cn("card p-6 flex flex-col justify-between", showCRM ? "lg:col-span-7" : "lg:col-span-12")}>
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Billing Activity</h3>
                      <p className="text-xs text-slate-400 font-medium">Last 5 invoices issued by your business</p>
                    </div>
                    <button
                      onClick={() => navigate('/billing/invoices')}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                    >
                      View All Invoices <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {loadingStats ? (
                    <div className="space-y-3 py-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : recentInvoices.length === 0 ? (
                    <div className="text-center py-10">
                      <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No invoices issued yet</p>
                      <p className="text-xs text-slate-400 mt-1">Create your first invoice to see sales reports here.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {recentInvoices.map((inv) => (
                        <div key={inv.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{inv.invoice_number}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <span>{inv.client_name}</span>
                              <Dot className="text-slate-300" />
                              <span>{inv.issue_date}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                              {formatCurrency(inv.total_amount)}
                            </span>
                            {getStatusBadge(inv.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CRM Pending Tasks */}
            {showCRM && (
              <div className={cn("card p-6 flex flex-col justify-between", showBilling ? "lg:col-span-5" : "lg:col-span-12")}>
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Pending CRM Tasks</h3>
                      <p className="text-xs text-slate-400 font-medium">Keep track of sales actions & follow-ups</p>
                    </div>
                    <button
                      onClick={() => navigate('/crm/tasks')}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                    >
                      Task Board <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {loadingStats ? (
                    <div className="space-y-3 py-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : recentTasks.length === 0 ? (
                    <div className="text-center py-10">
                      <CheckSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All tasks completed!</p>
                      <p className="text-xs text-slate-400 mt-1">Add tasks inside CRM to see them here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentTasks.map((task) => (
                        <div 
                          key={task.id} 
                          className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center justify-between"
                        >
                          <div className="space-y-0.5 max-w-[70%]">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{task.title}</p>
                            {task.due_date && (
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                                <span>Due: {task.due_date}</span>
                              </p>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${
                            task.priority === 'high' 
                              ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100/50' 
                              : task.priority === 'medium'
                              ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100/50'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modules Navigation */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-heading font-black text-slate-800 dark:text-slate-100">{t('yourModules')}</h3>
              <p className="text-xs text-slate-400 font-medium">Quick links to launch your business applications</p>
            </div>
            {activeModules.length < 6 && (
              <a href="/pricing" className="text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline">
                {t('unlockMore')}
              </a>
            )}
          </div>
          <ModuleGrid />
        </div>
      </div>
    </AppLayout>
  );
}
