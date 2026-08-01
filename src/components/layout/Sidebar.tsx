import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { MODULES, type ModuleKey } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { preloadPage } from '@/lib/preloader';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  DollarSign,
  Clock,
  Calendar,
  FileText,
  TrendingUp,
  Settings,
  BookOpen,
  ArrowLeftRight,
  PlusCircle,
  ClipboardList,
  History,
  Sliders,
  User,
  Receipt,
  FilePlus,
  ShoppingBag,
  Truck,
  CreditCard,
  Wallet,
  Package,
  Zap,
  Calculator,
  QrCode,
  UserCog,
  KanbanSquare,
  Contact,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  Lock,
  LogOut,
  Grid,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { hasModule } = useSubscription();
  const { t, language } = useLanguage();

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const activeModule = MODULES.find(
    (m) => location.pathname === m.route || location.pathname.startsWith(m.route + '/')
  );

  // Billing Module States
  const [billingOpen, setBillingOpen] = React.useState(() => location.pathname.startsWith('/billing'));
  const [invoicesGroupOpen, setInvoicesGroupOpen] = React.useState(() => 
    location.pathname === '/billing' ||
    location.pathname.startsWith('/billing/create-invoice') || 
    location.pathname.startsWith('/billing/invoices') || 
    location.pathname.startsWith('/billing/purchase-invoices') || 
    location.pathname.startsWith('/billing/e-invoice')
  );
  const [paymentsGroupOpen, setPaymentsGroupOpen] = React.useState(() => 
    location.pathname.startsWith('/billing/payments') || 
    location.pathname.startsWith('/billing/expenses')
  );
  const [productsGroupOpen, setProductsGroupOpen] = React.useState(() => 
    location.pathname.startsWith('/billing/products')
  );

  // Ledger Module States
  const [ledgerOpen, setLedgerOpen] = React.useState(() => location.pathname.startsWith('/ledger'));
  const [ledgerPartiesGroupOpen, setLedgerPartiesGroupOpen] = React.useState(() => 
    location.pathname === '/ledger' ||
    location.pathname.startsWith('/ledger/create/party')
  );
  const [ledgerVouchersGroupOpen, setLedgerVouchersGroupOpen] = React.useState(() => 
    location.pathname.startsWith('/ledger/transfer')
  );
  const [ledgerReportsGroupOpen, setLedgerReportsGroupOpen] = React.useState(() => 
    location.pathname.startsWith('/ledger/reports/balance-sheet') ||
    location.pathname.startsWith('/ledger/reports/profit-loss')
  );

  // Payroll Module States
  const [payrollOpen, setPayrollOpen] = React.useState(() => location.pathname.startsWith('/payroll'));
  const [payrollStaffGroupOpen, setPayrollStaffGroupOpen] = React.useState(() => 
    location.pathname.startsWith('/payroll/employees') ||
    location.pathname.startsWith('/payroll/payroll') ||
    location.pathname.startsWith('/payroll/payslips')
  );
  const [payrollTimeGroupOpen, setPayrollTimeGroupOpen] = React.useState(() => 
    location.pathname.startsWith('/payroll/attendance') ||
    location.pathname.startsWith('/payroll/leave')
  );

  // Inventory Module States
  const [inventoryOpen, setInventoryOpen] = React.useState(() => location.pathname.startsWith('/inventory'));
  const [inventoryStockGroupOpen, setInventoryStockGroupOpen] = React.useState(() => 
    location.pathname.startsWith('/inventory/products') ||
    location.pathname.startsWith('/inventory/history')
  );
  const [inventoryOpsGroupOpen, setInventoryOpsGroupOpen] = React.useState(() => 
    location.pathname.startsWith('/inventory/scan')
  );

  // CRM Module States
  const [crmOpen, setCrmOpen] = React.useState(() => location.pathname.startsWith('/crm'));
  const [crmLeadsGroupOpen, setCrmLeadsGroupOpen] = React.useState(() => 
    location.pathname.startsWith('/crm/leads') ||
    location.pathname.startsWith('/crm/contacts')
  );
  const [crmTasksGroupOpen, setCrmTasksGroupOpen] = React.useState(() => 
    location.pathname.startsWith('/crm/tasks')
  );

  // Hisab Module States
  const [hisabOpen, setHisabOpen] = React.useState(() => location.pathname.startsWith('/calculation'));
  const [hisabLogsGroupOpen, setHisabLogsGroupOpen] = React.useState(() => 
    location.pathname.startsWith('/calculation')
  );

  // Users & Members Parent Accordion State
  const [usersAndMembersOpen, setUsersAndMembersOpen] = React.useState(() => 
    location.pathname.startsWith('/users') || location.pathname.startsWith('/members')
  );

  React.useEffect(() => {
    if (location.pathname.startsWith('/billing')) setBillingOpen(true);
    if (location.pathname.startsWith('/ledger')) setLedgerOpen(true);
    if (location.pathname.startsWith('/payroll')) setPayrollOpen(true);
    if (location.pathname.startsWith('/inventory')) setInventoryOpen(true);
    if (location.pathname.startsWith('/crm')) setCrmOpen(true);
    if (location.pathname.startsWith('/calculation')) setHisabOpen(true);
    if (location.pathname.startsWith('/users') || location.pathname.startsWith('/members')) setUsersAndMembersOpen(true);
  }, [location.pathname]);

  const navItems = [
    {
      label: t('dashboard'),
      route: '/dashboard',
      icon: <LayoutDashboard className="w-4.5 h-4.5" />,
      hasChevron: false,
      key: 'dashboard'
    },
    ...MODULES.filter((m) => hasModule(m.key)).map((m) => ({
      label: t(m.key),
      route: m.route,
      icon: <m.icon className="w-4.5 h-4.5" />,
      hasChevron: true,
      key: m.key
    })),
    {
      label: 'Users & Members',
      route: '/members',
      icon: <Users className="w-4.5 h-4.5" />,
      hasChevron: true,
      key: 'users-members'
    },
    {
      label: t('settings'),
      route: '/settings',
      icon: <Settings className="w-4.5 h-4.5" />,
      hasChevron: true,
      key: 'settings'
    },
  ];

  const isActive = (route: string) => {
    if (route === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname === route || location.pathname.startsWith(route + '/');
  };

  const isExactOrChild = (route: string) => {
    return location.pathname === route;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 z-50',
          'fixed inset-y-0 left-0 md:static md:translate-x-0',
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0',
          collapsed ? 'w-[72px]' : 'w-[260px]'
        )}
      >
      {/* Branding */}
      <div className={cn(
        'h-16 flex items-center border-b border-slate-200 dark:border-slate-800 overflow-hidden',
        collapsed ? 'px-4 justify-center' : 'px-5 gap-3'
      )}>
        <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
          <img src="/logo.png" alt="Escrow BMS" className="w-8 h-8 object-contain" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-heading font-black text-slate-900 dark:text-white text-lg leading-none">
              Escrow
            </span>
            <span className="block text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
              {activeModule ? t(activeModule.key) : 'BMS Suite'}
            </span>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const active = isActive(item.route);

          // 1. BILLING EXPANDABLE ACCORDION
          if (item.key === 'billing') {
            const isBillingActive = location.pathname.startsWith('/billing');
            return (
              <div key="billing-accordion" className="space-y-1">
                <button
                  onClick={() => collapsed ? navigate('/billing/invoices') : setBillingOpen(!billingOpen)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group relative text-left cursor-pointer',
                    isBillingActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  <span className={cn('flex-shrink-0 transition-colors', isBillingActive ? 'text-white' : 'text-slate-500 dark:text-slate-400')}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {billingOpen ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
                    </>
                  )}
                </button>

                {!collapsed && billingOpen && (
                  <div className="pl-3 pr-1 py-1.5 space-y-3 border-l-2 border-emerald-500/20 dark:border-emerald-500/10 ml-4 animate-fade-in">
                    {/* Invoices */}
                    <div className="space-y-1">
                      <button
                        onClick={() => setInvoicesGroupOpen(!invoicesGroupOpen)}
                        className="w-full flex items-center justify-between px-2 py-1 text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider hover:bg-emerald-50/50 rounded-md cursor-pointer transition-colors text-left"
                      >
                        <span>Invoices</span>
                        {invoicesGroupOpen ? <ChevronDown className="w-3 h-3 text-emerald-500" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                      </button>
                      {invoicesGroupOpen && (
                        <div className="space-y-0.5 mt-1 pl-2 border-l border-emerald-200/50 dark:border-emerald-800/30 ml-2 animate-fade-in">
                          <Link to="/billing/create-invoice" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/billing/create-invoice') ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <FilePlus className="w-3.5 h-3.5 text-emerald-500" /><span>Create Invoice</span>
                          </Link>
                          <Link to="/billing/invoices" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/billing/invoices') ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <Receipt className="w-3.5 h-3.5 text-indigo-500" /><span>Sales Invoices</span>
                          </Link>
                          <Link to="/billing/purchase-invoices" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/billing/purchase-invoices') ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <ShoppingBag className="w-3.5 h-3.5 text-blue-500" /><span>Purchase Invoices</span>
                          </Link>
                          <Link to="/billing/e-invoice" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/billing/e-invoice') ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <Zap className="w-3.5 h-3.5 text-amber-500" /><span>E-Invoicing</span>
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Payments & Expenses */}
                    <div className="space-y-1">
                      <button
                        onClick={() => setPaymentsGroupOpen(!paymentsGroupOpen)}
                        className="w-full flex items-center justify-between px-2 py-1 text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider hover:bg-emerald-50/50 rounded-md cursor-pointer transition-colors text-left"
                      >
                        <span>Payments & Expenses</span>
                        {paymentsGroupOpen ? <ChevronDown className="w-3 h-3 text-emerald-500" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                      </button>
                      {paymentsGroupOpen && (
                        <div className="space-y-0.5 mt-1 pl-2 border-l border-emerald-200/50 dark:border-emerald-800/30 ml-2 animate-fade-in">
                          <Link to="/billing/payments" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/billing/payments') ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <CreditCard className="w-3.5 h-3.5 text-teal-500" /><span>Payments</span>
                          </Link>
                          <Link to="/billing/expenses" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/billing/expenses') ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <Wallet className="w-3.5 h-3.5 text-rose-500" /><span>Expenses</span>
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Products */}
                    <div className="space-y-1">
                      <button
                        onClick={() => setProductsGroupOpen(!productsGroupOpen)}
                        className="w-full flex items-center justify-between px-2 py-1 text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider hover:bg-emerald-50/50 rounded-md cursor-pointer transition-colors text-left"
                      >
                        <span>Products & Items</span>
                        {productsGroupOpen ? <ChevronDown className="w-3 h-3 text-emerald-500" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                      </button>
                      {productsGroupOpen && (
                        <div className="space-y-0.5 mt-1 pl-2 border-l border-emerald-200/50 dark:border-emerald-800/30 ml-2 animate-fade-in">
                          <Link to="/billing/products" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/billing/products') ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <Package className="w-3.5 h-3.5 text-purple-500" /><span>Products</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // 2. LEDGER EXPANDABLE ACCORDION
          if (item.key === 'ledger') {
            const isLedgerActive = location.pathname.startsWith('/ledger');
            return (
              <div key="ledger-accordion" className="space-y-1">
                <button
                  onClick={() => collapsed ? navigate('/ledger') : setLedgerOpen(!ledgerOpen)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group relative text-left cursor-pointer',
                    isLedgerActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  <span className={cn('flex-shrink-0 transition-colors', isLedgerActive ? 'text-white' : 'text-slate-500 dark:text-slate-400')}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {ledgerOpen ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
                    </>
                  )}
                </button>

                {!collapsed && ledgerOpen && (
                  <div className="pl-3 pr-1 py-1.5 space-y-3 border-l-2 border-blue-500/20 dark:border-blue-500/10 ml-4 animate-fade-in">
                    {/* Party Ledgers */}
                    <div className="space-y-1">
                      <button
                        onClick={() => setLedgerPartiesGroupOpen(!ledgerPartiesGroupOpen)}
                        className="w-full flex items-center justify-between px-2 py-1 text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider hover:bg-blue-50/50 rounded-md cursor-pointer transition-colors text-left"
                      >
                        <span>Party Ledgers</span>
                        {ledgerPartiesGroupOpen ? <ChevronDown className="w-3 h-3 text-blue-500" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                      </button>
                      {ledgerPartiesGroupOpen && (
                        <div className="space-y-0.5 mt-1 pl-2 border-l border-blue-200/50 dark:border-blue-800/30 ml-2 animate-fade-in">
                          <Link to="/ledger" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/ledger') ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <Users className="w-3.5 h-3.5 text-blue-500" /><span>Party Ledger</span>
                          </Link>
                          <Link to="/ledger/create/party" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/ledger/create/party') ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <PlusCircle className="w-3.5 h-3.5 text-emerald-500" /><span>Add New Party</span>
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Vouchers & Entries */}
                    <div className="space-y-1">
                      <button
                        onClick={() => setLedgerVouchersGroupOpen(!ledgerVouchersGroupOpen)}
                        className="w-full flex items-center justify-between px-2 py-1 text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider hover:bg-blue-50/50 rounded-md cursor-pointer transition-colors text-left"
                      >
                        <span>Vouchers & Entries</span>
                        {ledgerVouchersGroupOpen ? <ChevronDown className="w-3 h-3 text-blue-500" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                      </button>
                      {ledgerVouchersGroupOpen && (
                        <div className="space-y-0.5 mt-1 pl-2 border-l border-blue-200/50 dark:border-blue-800/30 ml-2 animate-fade-in">
                          <Link to="/ledger/transfer" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/ledger/transfer') ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <ArrowLeftRight className="w-3.5 h-3.5 text-teal-500" /><span>Transfer Entry</span>
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Financial Books */}
                    <div className="space-y-1">
                      <button
                        onClick={() => setLedgerReportsGroupOpen(!ledgerReportsGroupOpen)}
                        className="w-full flex items-center justify-between px-2 py-1 text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider hover:bg-blue-50/50 rounded-md cursor-pointer transition-colors text-left"
                      >
                        <span>Financial Books</span>
                        {ledgerReportsGroupOpen ? <ChevronDown className="w-3 h-3 text-blue-500" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                      </button>
                      {ledgerReportsGroupOpen && (
                        <div className="space-y-0.5 mt-1 pl-2 border-l border-blue-200/50 dark:border-blue-800/30 ml-2 animate-fade-in">
                          <Link to="/ledger/reports/balance-sheet" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/ledger/reports/balance-sheet') ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <FileText className="w-3.5 h-3.5 text-indigo-500" /><span>Balance Sheet</span>
                          </Link>
                          <Link to="/ledger/reports/profit-loss" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/ledger/reports/profit-loss') ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /><span>Profit & Loss</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // 3. PAYROLL EXPANDABLE ACCORDION
          if (item.key === 'payroll') {
            const isPayrollActive = location.pathname.startsWith('/payroll');
            return (
              <div key="payroll-accordion" className="space-y-1">
                <button
                  onClick={() => collapsed ? navigate('/payroll/employees') : setPayrollOpen(!payrollOpen)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group relative text-left cursor-pointer',
                    isPayrollActive
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  <span className={cn('flex-shrink-0 transition-colors', isPayrollActive ? 'text-white' : 'text-slate-500 dark:text-slate-400')}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {payrollOpen ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
                    </>
                  )}
                </button>

                {!collapsed && payrollOpen && (
                  <div className="pl-3 pr-1 py-1.5 space-y-3 border-l-2 border-violet-500/20 dark:border-violet-500/10 ml-4 animate-fade-in">
                    {/* Staff & Salary */}
                    <div className="space-y-1">
                      <button
                        onClick={() => setPayrollStaffGroupOpen(!payrollStaffGroupOpen)}
                        className="w-full flex items-center justify-between px-2 py-1 text-[9px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-wider hover:bg-violet-50/50 rounded-md cursor-pointer transition-colors text-left"
                      >
                        <span>Staff & Salary</span>
                        {payrollStaffGroupOpen ? <ChevronDown className="w-3 h-3 text-violet-500" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                      </button>
                      {payrollStaffGroupOpen && (
                        <div className="space-y-0.5 mt-1 pl-2 border-l border-violet-200/50 dark:border-violet-800/30 ml-2 animate-fade-in">
                          <Link to="/payroll/employees" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/payroll/employees') ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <Users className="w-3.5 h-3.5 text-violet-500" /><span>Staff Directory</span>
                          </Link>
                          <Link to="/payroll/payroll" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/payroll/payroll') ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500" /><span>Salary Structure</span>
                          </Link>
                          <Link to="/payroll/payslips" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/payroll/payslips') ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <FileText className="w-3.5 h-3.5 text-blue-500" /><span>Payslips</span>
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Time & Attendance */}
                    <div className="space-y-1">
                      <button
                        onClick={() => setPayrollTimeGroupOpen(!payrollTimeGroupOpen)}
                        className="w-full flex items-center justify-between px-2 py-1 text-[9px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-wider hover:bg-violet-50/50 rounded-md cursor-pointer transition-colors text-left"
                      >
                        <span>Time & Attendance</span>
                        {payrollTimeGroupOpen ? <ChevronDown className="w-3 h-3 text-violet-500" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                      </button>
                      {payrollTimeGroupOpen && (
                        <div className="space-y-0.5 mt-1 pl-2 border-l border-violet-200/50 dark:border-violet-800/30 ml-2 animate-fade-in">
                          <Link to="/payroll/attendance" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/payroll/attendance') ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <Clock className="w-3.5 h-3.5 text-amber-500" /><span>Attendance Log</span>
                          </Link>
                          <Link to="/payroll/leave" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/payroll/leave') ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <Calendar className="w-3.5 h-3.5 text-rose-500" /><span>Leave Requests</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // 4. INVENTORY EXPANDABLE ACCORDION
          if (item.key === 'inventory') {
            const isInventoryActive = location.pathname.startsWith('/inventory');
            return (
              <div key="inventory-accordion" className="space-y-1">
                <button
                  onClick={() => collapsed ? navigate('/inventory/products') : setInventoryOpen(!inventoryOpen)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group relative text-left cursor-pointer',
                    isInventoryActive
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  <span className={cn('flex-shrink-0 transition-colors', isInventoryActive ? 'text-white' : 'text-slate-500 dark:text-slate-400')}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {inventoryOpen ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
                    </>
                  )}
                </button>

                {!collapsed && inventoryOpen && (
                  <div className="pl-3 pr-1 py-1.5 space-y-3 border-l-2 border-rose-500/20 dark:border-rose-500/10 ml-4 animate-fade-in">
                    {/* Stock & Products */}
                    <div className="space-y-1">
                      <button
                        onClick={() => setInventoryStockGroupOpen(!inventoryStockGroupOpen)}
                        className="w-full flex items-center justify-between px-2 py-1 text-[9px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider hover:bg-rose-50/50 rounded-md cursor-pointer transition-colors text-left"
                      >
                        <span>Stock Catalog</span>
                        {inventoryStockGroupOpen ? <ChevronDown className="w-3 h-3 text-rose-500" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                      </button>
                      {inventoryStockGroupOpen && (
                        <div className="space-y-0.5 mt-1 pl-2 border-l border-rose-200/50 dark:border-rose-800/30 ml-2 animate-fade-in">
                          <Link to="/inventory/products" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/inventory/products') ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <Package className="w-3.5 h-3.5 text-rose-500" /><span>Stock Products</span>
                          </Link>
                          <Link to="/inventory/history" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/inventory/history') ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <History className="w-3.5 h-3.5 text-indigo-500" /><span>Stock History</span>
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Barcode & Operations */}
                    <div className="space-y-1">
                      <button
                        onClick={() => setInventoryOpsGroupOpen(!inventoryOpsGroupOpen)}
                        className="w-full flex items-center justify-between px-2 py-1 text-[9px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider hover:bg-rose-50/50 rounded-md cursor-pointer transition-colors text-left"
                      >
                        <span>Operations</span>
                        {inventoryOpsGroupOpen ? <ChevronDown className="w-3 h-3 text-rose-500" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                      </button>
                      {inventoryOpsGroupOpen && (
                        <div className="space-y-0.5 mt-1 pl-2 border-l border-rose-200/50 dark:border-rose-800/30 ml-2 animate-fade-in">
                          <Link to="/inventory/scan" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/inventory/scan') ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <QrCode className="w-3.5 h-3.5 text-emerald-500" /><span>Barcode Scanner</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // 5. CRM EXPANDABLE ACCORDION
          if (item.key === 'crm') {
            const isCrmActive = location.pathname.startsWith('/crm');
            return (
              <div key="crm-accordion" className="space-y-1">
                <button
                  onClick={() => collapsed ? navigate('/crm/tasks') : setCrmOpen(!crmOpen)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group relative text-left cursor-pointer',
                    isCrmActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  <span className={cn('flex-shrink-0 transition-colors', isCrmActive ? 'text-white' : 'text-slate-500 dark:text-slate-400')}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {crmOpen ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
                    </>
                  )}
                </button>

                {!collapsed && crmOpen && (
                  <div className="pl-3 pr-1 py-1.5 space-y-3 border-l-2 border-indigo-500/20 dark:border-indigo-500/10 ml-4 animate-fade-in">
                    {/* Tasks & Board */}
                    <div className="space-y-1">
                      <button
                        onClick={() => setCrmTasksGroupOpen(!crmTasksGroupOpen)}
                        className="w-full flex items-center justify-between px-2 py-1 text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider hover:bg-indigo-50/50 rounded-md cursor-pointer transition-colors text-left"
                      >
                        <span>Task Board</span>
                        {crmTasksGroupOpen ? <ChevronDown className="w-3 h-3 text-indigo-500" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                      </button>
                      {crmTasksGroupOpen && (
                        <div className="space-y-0.5 mt-1 pl-2 border-l border-indigo-200/50 dark:border-indigo-800/30 ml-2 animate-fade-in">
                          <Link to="/crm/tasks" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/crm/tasks') ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <KanbanSquare className="w-3.5 h-3.5 text-indigo-500" /><span>Action Board</span>
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Leads & Contacts */}
                    <div className="space-y-1">
                      <button
                        onClick={() => setCrmLeadsGroupOpen(!crmLeadsGroupOpen)}
                        className="w-full flex items-center justify-between px-2 py-1 text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider hover:bg-indigo-50/50 rounded-md cursor-pointer transition-colors text-left"
                      >
                        <span>Leads & Contacts</span>
                        {crmLeadsGroupOpen ? <ChevronDown className="w-3 h-3 text-indigo-500" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                      </button>
                      {crmLeadsGroupOpen && (
                        <div className="space-y-0.5 mt-1 pl-2 border-l border-indigo-200/50 dark:border-indigo-800/30 ml-2 animate-fade-in">
                          <Link to="/crm/leads" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/crm/leads') ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <Users className="w-3.5 h-3.5 text-emerald-500" /><span>Leads Directory</span>
                          </Link>
                          <Link to="/crm/contacts" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/crm/contacts') ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <Contact className="w-3.5 h-3.5 text-blue-500" /><span>Contacts</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // 6. HISAB EXPANDABLE ACCORDION
          if (item.key === 'hisab') {
            const isHisabActive = location.pathname.startsWith('/calculation');
            return (
              <div key="hisab-accordion" className="space-y-1">
                <button
                  onClick={() => collapsed ? navigate('/calculation/history') : setHisabOpen(!hisabOpen)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group relative text-left cursor-pointer',
                    isHisabActive
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  <span className={cn('flex-shrink-0 transition-colors', isHisabActive ? 'text-white' : 'text-slate-500 dark:text-slate-400')}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {hisabOpen ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
                    </>
                  )}
                </button>

                {!collapsed && hisabOpen && (
                  <div className="pl-3 pr-1 py-1.5 space-y-3 border-l-2 border-amber-500/20 dark:border-amber-500/10 ml-4 animate-fade-in">
                    <div className="space-y-1">
                      <button
                        onClick={() => setHisabLogsGroupOpen(!hisabLogsGroupOpen)}
                        className="w-full flex items-center justify-between px-2 py-1 text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider hover:bg-amber-50/50 rounded-md cursor-pointer transition-colors text-left"
                      >
                        <span>Daily Calculation Log</span>
                        {hisabLogsGroupOpen ? <ChevronDown className="w-3 h-3 text-amber-500" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                      </button>
                      {hisabLogsGroupOpen && (
                        <div className="space-y-0.5 mt-1 pl-2 border-l border-amber-200/50 dark:border-amber-800/30 ml-2 animate-fade-in">
                          <Link to="/calculation/history" className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors', isExactOrChild('/calculation/history') ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
                            <History className="w-3.5 h-3.5 text-amber-500" /><span>Calculation History</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // 7. USERS & MEMBERS PARENT EXPANDABLE ACCORDION
          if (item.key === 'users-members') {
            const isUsersMembersActive = location.pathname.startsWith('/users') || location.pathname.startsWith('/members');
            return (
              <div key="users-members-accordion" className="space-y-1">
                <button
                  onClick={() => collapsed ? navigate('/members') : setUsersAndMembersOpen(!usersAndMembersOpen)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group relative text-left cursor-pointer',
                    isUsersMembersActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  <span className={cn('flex-shrink-0 transition-colors', isUsersMembersActive ? 'text-white' : 'text-slate-500 dark:text-slate-400')}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {usersAndMembersOpen ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
                    </>
                  )}
                </button>

                {!collapsed && usersAndMembersOpen && (
                  <div className="pl-3 pr-1 py-1.5 space-y-1 border-l-2 border-purple-500/20 dark:border-purple-500/10 ml-4 animate-fade-in">
                    {/* Sub Section 1: Users */}
                    <Link
                      to="/users"
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors',
                        isExactOrChild('/users')
                          ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      )}
                    >
                      <Users className="w-3.5 h-3.5 text-purple-500" />
                      <span>Users</span>
                    </Link>

                    {/* Sub Section 2: Members */}
                    <Link
                      to="/members"
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors',
                        isExactOrChild('/members')
                          ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      )}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Members</span>
                    </Link>
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.route}
              to={item.route}
              onMouseEnter={() => preloadPage(item.route)}
              onTouchStart={() => preloadPage(item.route)}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group relative',
                active
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <span className={cn(
                'flex-shrink-0 transition-colors',
                active ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
              )}>
                {item.icon}
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.hasChevron && (
                    <ChevronRight className={cn(
                      "w-3.5 h-3.5 flex-shrink-0 transition-transform",
                      active ? "text-white/80" : "text-slate-400 dark:text-slate-600"
                    )} />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Toggle */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center py-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={cn('flex items-center gap-3 rounded-xl p-2', collapsed ? 'justify-center' : '')}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-indigo-650 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{profile?.full_name || 'User'}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{profile?.company_name || ''}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  </>
  );
}
