import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { MODULES, type ModuleKey } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Grid, ChevronDown, Lock, Check } from 'lucide-react';

interface ProductSwitcherProps {
  align?: 'start' | 'end' | 'center';
  showActiveLabel?: boolean;
}

export function ProductSwitcher({ align = 'start', showActiveLabel = true }: ProductSwitcherProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { hasModule } = useSubscription();

  // Find active module by matching route path
  const activeModule = MODULES.find(
    (m) => location.pathname === m.route || location.pathname.startsWith(m.route + '/')
  );

  const handleProductSelect = (route: string, locked: boolean) => {
    if (locked) {
      navigate('/pricing');
    } else {
      navigate(route);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200",
            "hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200",
            "border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm",
            "text-xs font-semibold shadow-sm active:scale-98 select-none text-left w-full cursor-pointer"
          )}
        >
          <div className="flex-1 flex items-center gap-2">
            {activeModule ? (
              <>
                <div className={cn("p-1.5 rounded-lg flex-shrink-0", activeModule.iconBg)}>
                  <activeModule.icon className="w-4.5 h-4.5" />
                </div>
                {showActiveLabel && (
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                      {activeModule.key === 'payroll' ? 'Escoroll' : 'Escrow'} {t(activeModule.key)}
                    </span>
                    <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-medium tracking-wider uppercase mt-0.5">
                      {t(`${activeModule.key}Subtitle`)}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                  <Grid className="w-4.5 h-4.5" />
                </div>
                {showActiveLabel && (
                  <div className="flex flex-col">
                    <span className="font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                      Escrow BMS
                    </span>
                    <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-medium tracking-wider uppercase mt-0.5">
                      {t('bmsSubtitle')}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        className="w-[320px] p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 shadow-2xl rounded-2xl animate-in fade-in-50 zoom-in-95 z-[9999]"
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-slate-450 dark:text-slate-500 flex flex-col gap-0.5">
          <span>{t('productSwitcher')}</span>
          <span className="text-[10px] font-normal text-slate-400">{t('productSwitcherDesc')}</span>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="my-1.5 bg-slate-100 dark:bg-slate-800" />
        
        <div className="grid grid-cols-1 gap-1 max-h-[380px] overflow-y-auto scrollbar-hide py-1">
          {MODULES.map((item) => {
            const unlocked = hasModule(item.key);
            const isActive = activeModule?.key === item.key;
            
            return (
              <DropdownMenuItem
                key={item.key}
                onClick={() => handleProductSelect(item.route, !unlocked)}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer outline-none relative group",
                  isActive
                    ? "bg-indigo-50/60 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-medium"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-350"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105",
                  item.iconBg
                )}>
                  <item.icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {item.key === 'payroll' ? 'Escoroll' : 'Escrow'} {t(item.key)}
                    </span>
                    {!unlocked && (
                      <Lock className="w-3 h-3 text-slate-400 dark:text-slate-600" />
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-400 dark:text-slate-500 truncate mt-0.5 leading-normal">
                    {t(`${item.key}Desc`)}
                  </p>
                </div>

                {isActive && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-650 dark:text-indigo-400">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator className="my-1.5 bg-slate-100 dark:bg-slate-800" />

        <DropdownMenuItem
          onClick={() => navigate('/dashboard')}
          className={cn(
            "flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-center text-xs font-bold font-heading cursor-pointer",
            "text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-500/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors border-0"
          )}
        >
          <Grid className="w-3.5 h-3.5" />
          {t('backToHub')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
