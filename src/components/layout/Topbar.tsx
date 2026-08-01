import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Menu, Bell, Sun, Moon, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODULES } from '@/lib/constants';

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
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [langOpen, setLangOpen] = React.useState(false);
  const [avatarOpen, setAvatarOpen] = React.useState(false);
  const [dark, setDark] = React.useState(() =>
    document.documentElement.classList.contains('dark')
  );

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setDark((d) => !d);
  };

  const activeModule = MODULES.find(
    (m) => location.pathname === m.route || location.pathname.startsWith(m.route + '/')
  );

  const displayTitle = activeModule
    ? `Escrow ${t(activeModule.key)}`
    : t(location.pathname.split('/')[1] || 'dashboard');

  const isInsideModule = !!activeModule;

  const initials =
    profile?.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ??
    (user?.email?.charAt(0).toUpperCase() ?? 'U');

  const displayFirstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Me';

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
      {/* Top Banner (Trial Alert) */}
      <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100/60 dark:border-indigo-900/30 px-4 py-1.5 flex items-center justify-center gap-2 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
        <span>Trial: 14 days left of full access</span>
        <button
          onClick={() => navigate('/pricing')}
          className="font-bold underline hover:text-indigo-900 dark:hover:text-indigo-100 cursor-pointer"
        >
          Upgrade
        </button>
      </div>

      {/* Main Top Header Bar */}
      <div className="h-14 flex items-center justify-between px-5 gap-4">
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

        <div className="flex items-center gap-3">
          {/* Company Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <span className="font-bold truncate max-w-[140px]">
              {profile?.company_name || 'GenZ Collection'}
            </span>
            <span className="px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded text-[9px] font-black tracking-wider uppercase">
              {profile?.role === 'admin' ? 'OWNER' : 'STAFF'}
            </span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Toggle theme"
          >
            {dark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          {/* Language dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors text-xs font-bold shadow-xs active:scale-95"
              title="Choose language"
            >
              🌐 {language === 'en' ? 'EN' : language === 'hi' ? 'HI' : 'GU'}
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-20">
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'hi', label: 'हिंदी' },
                    { code: 'gu', label: 'ગુજરાતી' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code as any); setLangOpen(false); }}
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

          {/* Notifications */}
          <button
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
          </button>

          {/* Avatar + Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setAvatarOpen(!avatarOpen)}
              className="flex items-center gap-1.5 cursor-pointer rounded-xl p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xs font-bold flex items-center justify-center select-none">
                {initials}
              </div>
              <span className="hidden md:inline font-bold text-xs text-slate-700 dark:text-slate-200 truncate max-w-[80px]">{displayFirstName}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 hidden md:block transition-transform", avatarOpen && "rotate-180")} />
            </button>

            {avatarOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAvatarOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {/* User info header */}
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                    <p className="font-black text-sm text-slate-900 dark:text-white truncate">{displayFirstName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => { setAvatarOpen(false); navigate('/my-profile'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </button>
                    <button
                      onClick={() => { setAvatarOpen(false); navigate('/settings'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700 pt-1">
                    <button
                      onClick={() => { setAvatarOpen(false); signOut?.(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

