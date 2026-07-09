import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODULES } from '@/lib/constants';
import { ProductSwitcher } from './ProductSwitcher';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/payroll': 'Payroll',
  '/ledger': 'Account Ledger',
  '/billing': 'Billing & Invoices',
  '/calculation': 'Daily Calculation',
  '/inventory': 'Inventory',
  '/crm': 'CRM',
  '/settings': 'Settings',
  '/pricing': 'Pricing',
};

interface TopbarProps {
  onMenuToggle: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const location = useLocation();
  const { profile } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [dark, setDark] = React.useState(() =>
    document.documentElement.classList.contains('dark')
  );

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setDark((d) => !d);
  };

  const pathKey = location.pathname.split('/')[1] || 'dashboard';
  const activeModule = MODULES.find(
    (m) => location.pathname === m.route || location.pathname.startsWith(m.route + '/')
  );

  const displayTitle = activeModule
    ? `${activeModule.key === 'payroll' ? 'Escoroll' : 'Escrow'} ${t(activeModule.key)}`
    : t(pathKey);

  const isInsideModule = !!activeModule;

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-5 gap-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-black font-heading text-slate-900 dark:text-white flex items-center gap-2">
          {displayTitle}
        </h1>
        {isInsideModule && activeModule && (
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 text-indigo-650 dark:text-indigo-400">
            {t(`${activeModule.key}Subtitle`)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Mobile Product Switcher */}
        <div className="md:hidden">
          <ProductSwitcher align="end" showActiveLabel={false} />
        </div>

        {/* Language switch dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors text-xs font-bold shadow-sm active:scale-95"
            title="Choose language / ભાષા / भाषा"
          >
            🌐 {language === 'en' ? 'English' : language === 'hi' ? 'हिंदी' : 'ગુજરાતી'}
          </button>
          
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-20">
                {[
                  { code: 'en', label: 'English' },
                  { code: 'hi', label: 'हिंदी' },
                  { code: 'gu', label: 'ગુજરાતી' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as any);
                      setDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors",
                      language === lang.code
                        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-500/10"
                        : "text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
          title="Toggle theme"
        >
          {dark ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-indigo-500" />}
        </button>

        {/* Notifications (placeholder) */}
        <button
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-white text-sm font-bold flex items-center justify-center cursor-pointer select-none ml-1">
          {profile?.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? 'U'}
        </div>
      </div>
    </header>
  );
}
