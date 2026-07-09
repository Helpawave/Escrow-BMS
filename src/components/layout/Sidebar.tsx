import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { MODULES, type ModuleKey } from '@/lib/constants';
import { cn } from '@/lib/utils';
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
  Lock,
  LogOut,
  Grid,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isSuperAdmin, signOut } = useAuth();
  const { hasModule } = useSubscription();
  const { t } = useLanguage();

  // Find active module by matching route path
  const activeModule = MODULES.find(
    (m) => location.pathname === m.route || location.pathname.startsWith(m.route + '/')
  );

  const isAdmin = profile?.role === 'admin';
  const navItems = [
    {
      label: t('dashboard'),
      route: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      locked: false,
    },
    ...MODULES.filter((m) => hasModule(m.key)).map((m) => ({
      label: t(m.key),
      route: m.route,
      icon: <m.icon className="w-5 h-5" />,
      locked: false,
      color: m.iconBg,
    })),
    ...(isSuperAdmin
      ? [{
          label: 'Superadmin Panel',
          route: '/admin',
          icon: <ShieldCheck className="w-5 h-5 text-amber-500" />,
          locked: false,
        }]
      : isAdmin
      ? [{
          label: 'Workspace Admin',
          route: '/workspace-admin',
          icon: <UserCog className="w-5 h-5 text-amber-500" />,
          locked: false,
        }]
      : []
    ),
    {
      label: t('settings'),
      route: '/settings',
      icon: <Settings className="w-5 h-5" />,
      locked: false,
    },
  ];

  const isActive = (route: string) => {
    if (route === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname === route || location.pathname.startsWith(route + '/');
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Dynamic Theme Styling for active link
  const activeThemeClass = activeModule
    ? activeModule.key === 'payroll' ? 'bg-violet-50 dark:bg-violet-550/10 text-violet-700 dark:text-violet-400'
      : activeModule.key === 'ledger' ? 'bg-blue-50 dark:bg-blue-550/10 text-blue-700 dark:text-blue-400'
      : activeModule.key === 'billing' ? 'bg-emerald-50 dark:bg-emerald-550/10 text-emerald-700 dark:text-emerald-400'
      : activeModule.key === 'hisab' ? 'bg-amber-50 dark:bg-amber-550/10 text-amber-700 dark:text-amber-400'
      : activeModule.key === 'inventory' ? 'bg-rose-50 dark:bg-rose-550/10 text-rose-700 dark:text-rose-400'
      : 'bg-indigo-50 dark:bg-indigo-550/10 text-indigo-700 dark:text-indigo-400'
    : 'bg-indigo-50 dark:bg-indigo-550/10 text-indigo-750 dark:text-indigo-400';

  const activeIconClass = activeModule
    ? activeModule.key === 'payroll' ? 'text-violet-600 dark:text-violet-400'
      : activeModule.key === 'ledger' ? 'text-blue-600 dark:text-blue-400'
      : activeModule.key === 'billing' ? 'text-emerald-600 dark:text-emerald-400'
      : activeModule.key === 'hisab' ? 'text-amber-600 dark:text-amber-400'
      : activeModule.key === 'inventory' ? 'text-rose-600 dark:text-rose-400'
      : 'text-indigo-650 dark:text-indigo-400'
    : 'text-indigo-600 dark:text-indigo-400';

  return (
    <aside
      className={cn(
        'h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 z-50',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Product Logo / Branding */}
      <div className={cn(
        'h-16 flex items-center border-b border-slate-200 dark:border-slate-800 overflow-hidden',
        collapsed ? 'px-4 justify-center' : 'px-5 gap-3'
      )}>
        <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
          {activeModule ? (
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", activeModule.iconBg)}>
              <activeModule.icon className="w-5 h-5" />
            </div>
          ) : (
            <img src="/logo.png" alt="Escrow BMS" className="w-8 h-8 object-contain" />
          )}
        </div>
        {!collapsed && (
          <div>
            <span className="font-heading font-black text-slate-900 dark:text-white text-lg leading-none">
              {activeModule ? (activeModule.key === 'payroll' ? 'Escoroll' : 'Escrow') : 'Escrow'}
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
          return (
            <Link
              key={item.route}
              to={item.locked ? '/pricing' : item.route}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                active
                  ? activeThemeClass
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200',
                item.locked && 'opacity-70'
              )}
            >
              <span className={cn(
                'flex-shrink-0 transition-colors',
                active ? activeIconClass : ''
              )}>
                {item.icon}
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.locked && (
                    <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 flex-shrink-0" />
                  )}
                </>
              )}
              {collapsed && item.locked && (
                <Lock className="absolute -top-0.5 -right-0.5 w-3 h-3 text-slate-400 bg-white dark:bg-slate-900 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Toggle */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-2">
        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center py-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* User profile */}
        <div className={cn(
          'flex items-center gap-3 rounded-xl p-2',
          collapsed ? 'justify-center' : ''
        )}>
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
  );
}
