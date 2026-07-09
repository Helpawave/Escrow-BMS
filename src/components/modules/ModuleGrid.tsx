import React from 'react';
import { Link } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MODULES, type ModuleDefinition } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';

function ModuleCard({ module }: { module: ModuleDefinition }) {
  const { hasModule } = useSubscription();
  const { t } = useLanguage();
  const unlocked = hasModule(module.key);
  const Icon = module.icon;

  return (
    <div
      className={cn(
        'card relative overflow-hidden flex flex-col gap-4 p-6 transition-all duration-300 group',
        unlocked
          ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer'
          : 'opacity-80 cursor-default'
      )}
    >
      {/* Gradient accent bar */}
      <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', module.color)} />

      {/* Badge */}
      {module.badge && unlocked && (
        <span className="absolute top-4 right-4 badge badge-blue text-[10px]">
          <Sparkles className="w-2.5 h-2.5" />
          {module.badge}
        </span>
      )}

      {/* Lock badge */}
      {!unlocked && (
        <span className="absolute top-4 right-4 badge bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px]">
          <Lock className="w-2.5 h-2.5" />
          {t('locked')}
        </span>
      )}

      {/* Icon */}
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0', module.iconBg)}>
        <Icon className="w-6 h-6" />
      </div>

      {/* Info */}
      <div className="flex-1">
        <h3 className="font-heading font-bold text-slate-800 dark:text-slate-100 text-base mb-1">{t(module.key)}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t(`${module.key}Desc`)}</p>
      </div>

      {/* Action */}
      <div>
        {unlocked ? (
          <Link
            to={module.route}
            className={cn(
              'inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200',
              `bg-gradient-to-r ${module.color} text-white shadow-sm hover:shadow-md active:scale-95`
            )}
          >
            {t('openModule')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
            {t('upgradeToUnlock')}
          </Link>
        )}
      </div>
    </div>
  );
}

export function ModuleGrid() {
  const { hasModule } = useSubscription();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {MODULES.filter((module) => hasModule(module.key)).map((module) => (
        <ModuleCard key={module.key} module={module} />
      ))}
    </div>
  );
}
