import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { MODULES, type ModuleKey } from '@/lib/constants';
import { hasRoleModuleAccess } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { preloadPage } from '@/lib/preloader';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Helper to determine module key from path (Users & Members sub-routes take priority over generic prefixes)
  const getModuleKeyFromPath = (pathname: string): string | null => {
    if (
      pathname.startsWith('/billing/clients') ||
      pathname.startsWith('/billing/vendors') ||
      pathname.startsWith('/payroll/employees') ||
      pathname.startsWith('/users') ||
      pathname.startsWith('/members')
    ) {
      return 'users-members';
    }
    if (pathname.startsWith('/ledger')) return 'ledger';
    if (pathname.startsWith('/billing')) return 'billing';
    if (pathname.startsWith('/inventory')) return 'inventory';
    if (pathname.startsWith('/crm')) return 'crm';
    if (pathname.startsWith('/calculation')) return 'hisab';
    if (pathname.startsWith('/payroll')) return 'payroll';
    if (pathname.startsWith('/teams')) return 'teams';
    if (pathname.startsWith('/reports')) return 'reports';
    if (pathname.startsWith('/settings')) return 'settings';
    return null;
  };

  // Single active expanded module key (auto-closes previous when expanding another)
  const [openModuleKey, setOpenModuleKey] = React.useState<string | null>(() => getModuleKeyFromPath(location.pathname));

  const toggleModuleAccordion = (key: string) => {
    setOpenModuleKey((prev) => (prev === key ? null : key));
  };

  const handleModuleClick = (key: string, defaultRoute: string) => {
    if (collapsed) {
      navigate(defaultRoute);
    } else {
      if (openModuleKey === key) {
        setOpenModuleKey(null);
      } else {
        setOpenModuleKey(key);
        navigate(defaultRoute);
      }
    }
  };

  const ledgerOpen = openModuleKey === 'ledger';
  const billingOpen = openModuleKey === 'billing';
  const inventoryOpen = openModuleKey === 'inventory';
  const usersAndMembersOpen = openModuleKey === 'users-members';

  // Sub-groups inner state for Billing Invoices accordion
  const [invoicesGroupOpen, setInvoicesGroupOpen] = React.useState(() =>
    location.pathname === '/billing' ||
    location.pathname.startsWith('/billing/create-invoice') ||
    location.pathname.startsWith('/billing/invoices') ||
    location.pathname.startsWith('/billing/purchase-invoices') ||
    location.pathname.startsWith('/billing/e-invoice')
  );

  const [paymentsExpensesGroupOpen, setPaymentsExpensesGroupOpen] = React.useState(() =>
    location.pathname.startsWith('/billing/payments') ||
    location.pathname.startsWith('/billing/expenses')
  );

  React.useEffect(() => {
    const key = getModuleKeyFromPath(location.pathname);
    if (key) setOpenModuleKey(key);
  }, [location.pathname]);

  const navItems = [
    {
      label: t('dashboard'),
      route: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      hasChevron: false,
      key: 'dashboard'
    },
    ...MODULES.filter((m) => hasModule(m.key)).map((m) => ({
      label: t(m.key),
      route: m.route,
      icon: <m.icon className="w-4 h-4" />,
      hasChevron: ['ledger', 'billing', 'inventory'].includes(m.key),
      key: m.key
    })),
    {
      label: 'Users & Members',
      route: '/users',
      icon: <UserCog className="w-4 h-4" />,
      hasChevron: true,
      key: 'users-members'
    },
    {
      label: 'Teams',
      route: '/teams',
      icon: <ShieldCheck className="w-4 h-4" />,
      hasChevron: false,
      key: 'teams'
    },
    {
      label: 'Reports',
      route: '/reports',
      icon: <BarChart3 className="w-4 h-4" />,
      hasChevron: false,
      key: 'reports'
    },
    {
      label: 'Settings',
      route: '/settings',
      icon: <Settings className="w-4 h-4" />,
      hasChevron: false,
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
    if (route === '/ledger') {
      return location.pathname === '/ledger' || location.pathname === '/ledger/';
    }
    if (route === '/ledger/transfer') {
      return location.pathname.startsWith('/ledger/transfer');
    }
    if (route === '/inventory/products') {
      return location.pathname === '/inventory' || location.pathname === '/inventory/' || location.pathname.startsWith('/inventory/products') || location.pathname.startsWith('/inventory/add-product') || location.pathname.startsWith('/inventory/edit');
    }
    if (route === '/crm/tasks') {
      return location.pathname === '/crm' || location.pathname === '/crm/' || location.pathname.startsWith('/crm/tasks');
    }
    if (route === '/payroll/payroll') {
      return location.pathname === '/payroll' || location.pathname === '/payroll/' || location.pathname.startsWith('/payroll/payroll') || location.pathname.startsWith('/payroll/salary');
    }
    if (route === '/billing/clients') {
      return location.pathname.startsWith('/billing/clients') || location.pathname.startsWith('/clients') || location.pathname === '/users';
    }
    if (route === '/billing/vendors') {
      return location.pathname.startsWith('/billing/vendors') || location.pathname.startsWith('/vendors');
    }
    if (route === '/payroll/employees') {
      return location.pathname.startsWith('/payroll/employees') || location.pathname.startsWith('/members');
    }
    if (route.includes('?')) {
      const [path, search] = route.split('?');
      return location.pathname === path && location.search.includes(search);
    }
    return location.pathname === route || location.pathname.startsWith(route + '/');
  };

  const accordionVariants = {
    closed: { height: 0, opacity: 0 },
    open: { height: 'auto', opacity: 1 }
  };

  const transitionConfig = { duration: 0.2, ease: [0.25, 1, 0.5, 1] as [number, number, number, number] };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'h-full bg-white dark:bg-[#090D16] text-slate-700 dark:text-slate-300 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col transition-all duration-300 z-50',
          'fixed inset-y-0 left-0 md:static md:translate-x-0',
          mobileOpen ? 'translate-x-0 shadow-2xl shadow-black/80' : '-translate-x-full md:translate-x-0',
          collapsed ? 'w-[72px]' : 'w-[265px]'
        )}
      >
        {/* Branding Header */}
        <div className={cn(
          'h-16 flex items-center border-b border-slate-100 dark:border-slate-800/80 overflow-hidden bg-white dark:bg-[#090D16]',
          collapsed ? 'px-4 justify-center' : 'px-5 gap-3'
        )}>
          <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="Escrow BMS" className="w-8 h-8 object-contain" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-heading font-black text-slate-900 dark:text-white text-lg leading-none tracking-tight">
                Escrow
              </span>
              <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase mt-0.5">
                {activeModule ? t(activeModule.key) : 'BMS Suite'}
              </span>
            </div>
          )}
        </div>

        {/* Nav Items Scroll Area */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto scrollbar-hide bg-white dark:bg-[#090D16]">
          {navItems.map((item) => {
            if (!hasRoleModuleAccess(profile?.role, item.key)) return null;
            const active = isActive(item.route);

            // 1. ACCOUNT LEDGER EXPANDABLE ACCORDION
            if (item.key === 'ledger') {
              const isLedgerActive = location.pathname.startsWith('/ledger') && !location.pathname.startsWith('/ledger/create/party');
              return (
                <div key="ledger-accordion" className="space-y-1">
                  <button
                    onClick={() => handleModuleClick('ledger', '/ledger')}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-200 group relative text-left cursor-pointer',
                      isLedgerActive
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border-l-3 border-indigo-600 dark:border-indigo-500 shadow-2xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <span className={cn('flex-shrink-0 transition-colors', isLedgerActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white')}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        <ChevronDown className={cn("w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 text-slate-400", ledgerOpen && "rotate-180")} />
                      </>
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {!collapsed && ledgerOpen && (
                      <motion.div
                        key="ledger-content"
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={accordionVariants}
                        transition={transitionConfig}
                        className="overflow-hidden pl-4 pr-1 py-1 space-y-1"
                      >
                        <Link to="/ledger" className={cn('flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all', isExactOrChild('/ledger') ? 'bg-[#5644E6] text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60')}>
                          <Users className="w-3.5 h-3.5 flex-shrink-0" /><span>Party Ledger</span>
                        </Link>
                        <Link to="/ledger/reports/balance-sheet" className={cn('flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all', isExactOrChild('/ledger/reports/balance-sheet') ? 'bg-[#5644E6] text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60')}>
                          <FileText className="w-3.5 h-3.5 flex-shrink-0" /><span>Balance Sheet</span>
                        </Link>
                        <Link to="/ledger/reports/parties" className={cn('flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all', isExactOrChild('/ledger/reports/parties') ? 'bg-[#5644E6] text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60')}>
                          <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" /><span>Party Report</span>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            // 2. BILLING EXPANDABLE ACCORDION
            if (item.key === 'billing') {
              const isBillingActive = location.pathname.startsWith('/billing') && !location.pathname.startsWith('/billing/clients') && !location.pathname.startsWith('/billing/vendors');
              return (
                <div key="billing-accordion" className="space-y-1">
                  <button
                    onClick={() => handleModuleClick('billing', '/billing/invoices')}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-200 group relative text-left cursor-pointer',
                      isBillingActive
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border-l-3 border-indigo-600 dark:border-indigo-500 shadow-2xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <span className={cn('flex-shrink-0 transition-colors', isBillingActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white')}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        <ChevronDown className={cn("w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 text-slate-400", billingOpen && "rotate-180")} />
                      </>
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {!collapsed && billingOpen && (
                      <motion.div
                        key="billing-content"
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={accordionVariants}
                        transition={transitionConfig}
                        className="overflow-hidden pl-4 pr-1 py-1 space-y-1"
                      >
                        <Link to="/billing/create-invoice" className={cn('flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all', isExactOrChild('/billing/create-invoice') ? 'bg-[#5644E6] text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60')}>
                          <FilePlus className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" /><span>Create Invoice</span>
                        </Link>

                        {/* Invoices Group (Expandable) */}
                        <div className="space-y-1">
                          <button
                            onClick={() => setInvoicesGroupOpen(!invoicesGroupOpen)}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60 rounded-xl cursor-pointer transition-colors text-left"
                          >
                            <div className="flex items-center gap-2.5">
                              <Receipt className="w-3.5 h-3.5 text-slate-400" />
                              <span>Invoices</span>
                            </div>
                            <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform duration-200", invoicesGroupOpen && "rotate-180")} />
                          </button>
                          <AnimatePresence initial={false}>
                            {invoicesGroupOpen && (
                              <motion.div
                                key="invoices-subgroup"
                                initial="closed"
                                animate="open"
                                exit="closed"
                                variants={accordionVariants}
                                transition={transitionConfig}
                                className="overflow-hidden space-y-1 pl-3 mt-0.5"
                              >
                                <Link to="/billing/invoices" className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all', isExactOrChild('/billing/invoices') ? 'bg-[#5644E6] text-white font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60')}>
                                  <span>Sales Invoice</span>
                                </Link>
                                <Link to="/billing/create-invoice?type=ledger" className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all', location.pathname === '/billing/create-invoice' && location.search.includes('ledger') ? 'bg-[#5644E6] text-white font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60')}>
                                  <span>Ledger Billing</span>
                                </Link>
                                <Link to="/billing/purchase-invoices" className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all', isExactOrChild('/billing/purchase-invoices') ? 'bg-[#5644E6] text-white font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60')}>
                                  <span>Purchase Invoice</span>
                                </Link>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Payments & Expenses Group (Expandable) */}
                        <div className="space-y-1">
                          <button
                            onClick={() => setPaymentsExpensesGroupOpen(!paymentsExpensesGroupOpen)}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60 rounded-xl cursor-pointer transition-colors text-left"
                          >
                            <div className="flex items-center gap-2.5">
                              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                              <span>Payments & Expenses</span>
                            </div>
                            <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform duration-200", paymentsExpensesGroupOpen && "rotate-180")} />
                          </button>
                          <AnimatePresence initial={false}>
                            {paymentsExpensesGroupOpen && (
                              <motion.div
                                key="payments-expenses-subgroup"
                                initial="closed"
                                animate="open"
                                exit="closed"
                                variants={accordionVariants}
                                transition={transitionConfig}
                                className="overflow-hidden space-y-1 pl-3 mt-0.5"
                              >
                                <Link to="/billing/payments" className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all', isExactOrChild('/billing/payments') ? 'bg-[#5644E6] text-white font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60')}>
                                  <span>Payments</span>
                                </Link>
                                <Link to="/billing/expenses" className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all', isExactOrChild('/billing/expenses') ? 'bg-[#5644E6] text-white font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60')}>
                                  <span>Expenses</span>
                                </Link>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <Link to="/billing/e-invoice" className={cn('flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all', isExactOrChild('/billing/e-invoice') ? 'bg-[#5644E6] text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60')}>
                          <Zap className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" /><span>E-Invoicing</span>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            // 3. INVENTORY EXPANDABLE ACCORDION
            if (item.key === 'inventory') {
              const isInventoryActive = location.pathname.startsWith('/inventory');
              return (
                <div key="inventory-accordion" className="space-y-1">
                  <button
                    onClick={() => handleModuleClick('inventory', '/inventory/products')}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-200 group relative text-left cursor-pointer',
                      isInventoryActive
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border-l-3 border-indigo-600 dark:border-indigo-500 shadow-2xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <span className={cn('flex-shrink-0 transition-colors', isInventoryActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white')}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        <ChevronDown className={cn("w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 text-slate-400", inventoryOpen && "rotate-180")} />
                      </>
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {!collapsed && inventoryOpen && (
                      <motion.div
                        key="inventory-content"
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={accordionVariants}
                        transition={transitionConfig}
                        className="overflow-hidden pl-4 pr-1 py-1 space-y-1"
                      >
                        <Link to="/inventory/products" className={cn('flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all', isExactOrChild('/inventory/products') ? 'bg-[#5644E6] text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60')}>
                          <Package className="w-3.5 h-3.5 flex-shrink-0" /><span>Stock Products</span>
                        </Link>
                        <Link to="/inventory/scan" className={cn('flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all', isExactOrChild('/inventory/scan') ? 'bg-[#5644E6] text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60')}>
                          <QrCode className="w-3.5 h-3.5 flex-shrink-0" /><span>Barcode Scanner</span>
                        </Link>
                        <Link to="/inventory/history" className={cn('flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all', isExactOrChild('/inventory/history') ? 'bg-[#5644E6] text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60')}>
                          <History className="w-3.5 h-3.5 flex-shrink-0" /><span>Stock History</span>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }



            // 7. USERS & MEMBERS PARENT EXPANDABLE ACCORDION
            if (item.key === 'users-members') {
              const isUsersMembersActive = location.pathname.startsWith('/users') || location.pathname.startsWith('/billing/clients') || location.pathname.startsWith('/billing/vendors') || location.pathname.startsWith('/payroll/employees') || location.pathname.startsWith('/members');
              return (
                <div key="users-members-accordion" className="space-y-1">
                  <button
                    onClick={() => handleModuleClick('users-members', '/billing/clients')}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-200 group relative text-left cursor-pointer',
                      isUsersMembersActive
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border-l-3 border-indigo-600 dark:border-indigo-500 shadow-2xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <span className={cn('flex-shrink-0 transition-colors', isUsersMembersActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white')}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        <ChevronDown className={cn("w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 text-slate-400", usersAndMembersOpen && "rotate-180")} />
                      </>
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {!collapsed && usersAndMembersOpen && (
                      <motion.div
                        key="users-members-content"
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={accordionVariants}
                        transition={transitionConfig}
                        className="overflow-hidden pl-4 pr-1 py-1 space-y-1"
                      >
                        <Link to="/billing/clients" className={cn('flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all', isExactOrChild('/billing/clients') || isExactOrChild('/users') ? 'bg-[#5644E6] text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60')}>
                          <Users className="w-3.5 h-3.5 flex-shrink-0" /><span>Clients & Parties</span>
                        </Link>
                        <Link to="/billing/vendors" className={cn('flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all', isExactOrChild('/billing/vendors') ? 'bg-[#5644E6] text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60')}>
                          <Truck className="w-3.5 h-3.5 flex-shrink-0" /><span>Vendors</span>
                        </Link>
                        <Link to="/payroll/employees" className={cn('flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all', isExactOrChild('/payroll/employees') ? 'bg-[#5644E6] text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60')}>
                          <UserCog className="w-3.5 h-3.5 flex-shrink-0" /><span>Employees</span>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-200 group relative',
                  active
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border-l-3 border-indigo-600 dark:border-indigo-500 shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <span className={cn(
                  'flex-shrink-0 transition-colors',
                  active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                )}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.hasChevron && (
                      <ChevronRight className={cn(
                        "w-3.5 h-3.5 flex-shrink-0 transition-transform",
                        active ? "text-white/80" : "text-slate-400"
                      )} />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + Toggle Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 p-3.5 space-y-2 bg-white dark:bg-[#090D16]">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <div className={cn('flex items-center gap-3 rounded-2xl p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 shadow-2xs', collapsed ? 'justify-center' : '')}>
            <div className="w-8 h-8 rounded-full bg-[#5644E6] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-xs">
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{profile?.full_name || 'User'}</p>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">{profile?.company_name || ''}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={signOut}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
