import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useLocation, useNavigate, Link, Outlet } from 'react-router-dom';
import { MODULES, MODULE_MENUS } from '@/lib/constants';
import { hasRoleModuleAccess, getDefaultRouteForRole, ROLE_LABELS } from '@/lib/permissions';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ShieldAlert, Sparkles, Building2, User, Phone, DollarSign, Loader2, CreditCard, Wallet, ChevronDown } from 'lucide-react';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppLayoutProps {
  children?: React.ReactNode;
  title?: string;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, profile, refreshProfile, isSubscribed, loading: authLoading } = useAuth();

  // Modal form states
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [saving, setSaving] = useState(false);

  // Set initial form values when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setCompanyName(profile.company_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const mainRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeModule = MODULES.find(
      (m) => location.pathname === m.route || location.pathname.startsWith(m.route + '/')
    );
    if (activeModule) {
      localStorage.setItem('last_active_app', activeModule.key);
      if (profile?.role) {
        const isAllowed = hasRoleModuleAccess(profile.role, activeModule.key);
        if (!isAllowed) {
          toast.error(`Access restricted for ${ROLE_LABELS[profile.role] || profile.role} role.`);
          navigate(getDefaultRouteForRole(profile.role), { replace: true });
        }
      }
    }
    // Close mobile drawer on route change
    setMobileOpen(false);

    // Smooth scroll main container to top on page change
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname, profile?.role, navigate]);

  const isActiveSubRoute = (route: string) => {
    if (route === '/payroll' || route === '/ledger' || route === '/billing' || route === '/calculation' || route === '/inventory' || route === '/crm') {
      return location.pathname === route;
    }
    return location.pathname === route || location.pathname.startsWith(route + '/');
  };

  const renderModuleSubNav = () => {
    let activeKey: string | null = null;
    if (location.pathname.startsWith('/ledger')) activeKey = 'ledger';
    else if (location.pathname.startsWith('/billing/clients') || location.pathname.startsWith('/billing/vendors') || location.pathname.startsWith('/users') || location.pathname.startsWith('/members')) activeKey = 'members';
    else if (location.pathname.startsWith('/billing')) activeKey = 'billing';
    else if (location.pathname.startsWith('/inventory')) activeKey = 'inventory';
    else if (location.pathname.startsWith('/crm')) activeKey = 'crm';
    else if (location.pathname.startsWith('/calculation')) activeKey = 'hisab';
    else if (location.pathname.startsWith('/payroll')) activeKey = 'payroll';

    if (!activeKey) return null;

    const subMenu = MODULE_MENUS[activeKey as keyof typeof MODULE_MENUS] || [];
    if (subMenu.length === 0) return null;

    const activeTextClass = 'text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs font-bold';

    return (
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-2 mb-4 gap-3 overflow-x-auto scrollbar-thin">
        <div className="flex flex-wrap items-center gap-1 bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-lg border border-slate-200/70 dark:border-slate-800/70">
          {subMenu.map((item) => {
            if (activeKey === 'billing' && (item.route === '/billing/payments' || item.route === '/billing/expenses')) {
              if (item.route === '/billing/expenses') return null;

              const isPaymentsOrExpensesActive = location.pathname.startsWith('/billing/payments') || location.pathname.startsWith('/billing/expenses');

              return (
                <DropdownMenu key="billing-payments-expenses-dropdown">
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "relative flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer whitespace-nowrap",
                        isPaymentsOrExpensesActive
                          ? activeTextClass
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-slate-800/40"
                      )}
                    >
                      <CreditCard className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                      <span>Payments & Expenses</span>
                      <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44 p-1">
                    <DropdownMenuItem asChild>
                      <Link to="/billing/payments" className="flex items-center gap-2 cursor-pointer text-xs font-medium py-2">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Payments Log</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/billing/expenses" className="flex items-center gap-2 cursor-pointer text-xs font-medium py-2">
                        <Wallet className="w-3.5 h-3.5 text-amber-500" />
                        <span>Business Expenses</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            const isTabActive = (itemRoute: string) => {
              if (itemRoute.includes('?')) {
                const [path, search] = itemRoute.split('?');
                return location.pathname === path && location.search.includes(search);
              }
              if (itemRoute === '/billing/invoices') {
                return location.pathname === '/billing/invoices' || location.pathname === '/billing' || location.pathname === '/billing/';
              }
              if (itemRoute === '/billing/ledger-bills') {
                return location.pathname === '/billing/ledger-bills' || location.pathname.startsWith('/billing/ledger-bills') || location.pathname === '/ledger-bills';
              }
              if (itemRoute === '/billing/quotations') {
                return location.pathname === '/billing/quotations' || location.pathname === '/billing/quotations/';
              }
              if (itemRoute === '/billing/purchase-invoices') {
                return location.pathname === '/billing/purchase-invoices' || location.pathname.startsWith('/billing/purchase-invoices');
              }
              if (itemRoute === '/billing/clients') {
                return location.pathname === '/billing/clients' || location.pathname.startsWith('/billing/clients');
              }
              if (itemRoute === '/billing/vendors') {
                return location.pathname === '/billing/vendors' || location.pathname.startsWith('/billing/vendors');
              }
              if (itemRoute === '/payroll/employees') {
                return location.pathname === '/payroll/employees' || location.pathname.startsWith('/payroll/employees');
              }
              if (itemRoute === '/users/members') {
                return location.pathname.startsWith('/users/members') || location.pathname === '/members' || location.pathname === '/users' || location.pathname.startsWith('/users/add-staff');
              }
              if (itemRoute === '/ledger') {
                return location.pathname === '/ledger' || location.pathname === '/ledger/' || location.pathname === '/ledger/ledger';
              }
              if (itemRoute === '/payroll' || itemRoute === '/payroll/payroll') {
                return location.pathname === '/payroll' || location.pathname === '/payroll/' || location.pathname === '/payroll/payroll';
              }
              if (itemRoute === '/inventory' || itemRoute === '/inventory/products') {
                return location.pathname === '/inventory' || location.pathname === '/inventory/' || location.pathname.startsWith('/inventory/products');
              }
              if (itemRoute === '/crm' || itemRoute === '/crm/tasks') {
                return location.pathname === '/crm' || location.pathname === '/crm/' || location.pathname.startsWith('/crm/tasks');
              }
              if (itemRoute === '/calculation' || itemRoute === '/calculation/history') {
                return location.pathname === '/calculation' || location.pathname === '/calculation/' || location.pathname.startsWith('/calculation/history');
              }
              return location.pathname === itemRoute || (itemRoute.length > 8 && location.pathname.startsWith(itemRoute + '/'));
            };

            const active = isTabActive(item.route);
            const displayLabel = t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.labelKey;
            return (
              <Link
                key={item.route}
                to={item.route}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer whitespace-nowrap",
                  active
                    ? activeTextClass
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-slate-800/40"
                )}
              >
                <item.icon className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                <span>{displayLabel}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!fullName.trim() || !companyName.trim() || !phone.trim()) {
      toast.error('Please fill in all details');
      return;
    }

    setSaving(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          company_name: companyName.trim(),
          phone: phone.trim()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          default_currency: currency
        }, { onConflict: 'user_id' });

      if (settingsError) {
        console.warn('Could not save user_settings:', settingsError.message);
      }

      toast.success('Business profile completed successfully!');
      await refreshProfile();
    } catch (err: any) {
      console.error('Error completing profile:', err);
      toast.error(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const isProfileIncomplete = user && !authLoading && profile && (
    !profile?.full_name?.trim() || 
    !profile?.company_name?.trim() || 
    !profile?.phone?.trim()
  );

  const shouldBlockWorkspace = isSubscribed === false && !authLoading && !isProfileIncomplete;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 w-full max-w-full">
      {/* Sidebar with Desktop Collapse + Mobile Drawer */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <div className={cn("flex-1 flex flex-col min-w-0 w-full overflow-hidden transition-all duration-300", shouldBlockWorkspace && "blur-[1.5px] pointer-events-none grayscale-[0.2]")}>
        <Topbar onMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main ref={mainRef} className="flex-1 overflow-y-auto p-3 sm:p-6 w-full max-w-full overflow-x-hidden scroll-smooth">
          <div className="max-w-7xl mx-auto w-full">
            {renderModuleSubNav()}
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {children || <Outlet />}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Profile Setup Block Modal */}
      {isProfileIncomplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto text-indigo-650 dark:text-indigo-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 font-heading tracking-tight">
                Complete Your Profile
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Please enter your core details to initialize your business suite and get started.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-50 text-xs font-bold rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-50 text-xs font-bold rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Your company name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Contact Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-50 text-xs font-bold rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Your phone number"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Default Currency</label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-50 text-xs font-bold rounded-xl focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full h-11 mt-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save & Set Up Workspace
              </button>
            </form>
          </div>
        </div>
      )}

      {isSubscribed === false && !authLoading && (
        <SubscriptionModal />
      )}
    </div>
  );
}
