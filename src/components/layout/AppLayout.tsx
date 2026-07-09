import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useLocation, Link } from 'react-router-dom';
import { MODULES, MODULE_MENUS } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ShieldAlert, Sparkles, Building2, User, Phone, DollarSign, Loader2 } from 'lucide-react';
import { SubscriptionModal } from '@/components/SubscriptionModal';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
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

  useEffect(() => {
    const activeModule = MODULES.find(
      (m) => location.pathname === m.route || location.pathname.startsWith(m.route + '/')
    );
    if (activeModule) {
      localStorage.setItem('last_active_app', activeModule.key);
    }
  }, [location.pathname]);

  const isActiveSubRoute = (route: string) => {
    if (route === '/payroll' || route === '/ledger' || route === '/billing' || route === '/calculation' || route === '/inventory' || route === '/crm') {
      return location.pathname === route;
    }
    return location.pathname === route || location.pathname.startsWith(route + '/');
  };

  const renderModuleSubNav = () => {
    const activeModule = MODULES.find(
      (m) => location.pathname === m.route || location.pathname.startsWith(m.route + '/')
    );

    if (!activeModule || activeModule.key === 'crm') {
      return null;
    }

    const subMenu = MODULE_MENUS[activeModule.key] || [];
    if (subMenu.length === 0) return null;

    const activeTextClass = 
      activeModule.key === 'payroll' ? 'text-violet-650 bg-white dark:bg-slate-800 shadow-sm' :
      activeModule.key === 'ledger' ? 'text-blue-650 bg-white dark:bg-slate-800 shadow-sm' :
      activeModule.key === 'billing' ? 'text-emerald-650 bg-white dark:bg-slate-800 shadow-sm' :
      activeModule.key === 'hisab' ? 'text-amber-650 bg-white dark:bg-slate-800 shadow-sm' :
      activeModule.key === 'inventory' ? 'text-rose-650 bg-white dark:bg-slate-800 shadow-sm' :
      'text-indigo-650 bg-white dark:bg-slate-800 shadow-sm';

    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 gap-4 animate-fade-in">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          {subMenu.map((item) => {
            const active = isActiveSubRoute(item.route);
            return (
              <Link
                key={item.route}
                to={item.route}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer",
                  active
                    ? activeTextClass
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250"
                )}
              >
                <item.icon className="w-4 h-4" />
                {t(item.labelKey)}
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
      // 1. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          company_name: companyName.trim(),
          phone: phone.trim()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Upsert user_settings table
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          default_currency: currency
        }, { onConflict: 'user_id' });

      if (settingsError) {
        console.warn('Could not save user_settings (maybe table not created yet):', settingsError.message);
      }

      toast.success('Business profile completed successfully!');
      await refreshProfile();
    } catch (err: any) {
      console.error('Error completing profile:', err);
      toast.error(err.message || 'Failed to save profile. Please make sure database tables are updated.');
    } finally {
      setSaving(false);
    }
  };

  // Determine if profile details are missing (after loading completes)
  const isProfileIncomplete = user && !authLoading && profile && (
    !profile?.full_name?.trim() || 
    !profile?.company_name?.trim() || 
    !profile?.phone?.trim()
  );

  const shouldBlockWorkspace = isSubscribed === false && !authLoading && !isProfileIncomplete;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content */}
      <div className={cn("flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300", shouldBlockWorkspace && "blur-[1.5px] pointer-events-none grayscale-[0.2]")}>
        <Topbar onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {renderModuleSubNav()}
            {children}
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
