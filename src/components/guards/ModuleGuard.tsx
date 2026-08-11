import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import type { ModuleKey } from '@/lib/constants';
import { MODULE_MAP } from '@/lib/constants';
import { Lock, Loader2, Sparkles, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModuleGuardProps {
  moduleKey: ModuleKey;
  children: React.ReactNode;
}

export function ModuleGuard({ moduleKey, children }: ModuleGuardProps) {
  const { hasModule, loading } = useSubscription();
  const moduleInfo = MODULE_MAP[moduleKey];
  const ModuleIcon = moduleInfo?.icon || Lock;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Verifying Module Access Permissions...</p>
      </div>
    );
  }

  if (!hasModule(moduleKey)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-8">
        <div className="relative w-full max-w-xl">
          {/* Ambient background glow */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl p-6 md:p-10 text-center overflow-hidden">
            {/* Top Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider mb-6">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Access Permission Required</span>
            </div>

            {/* Lock Icon + Module Icon Display */}
            <div className="relative mx-auto w-24 h-24 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-850 rotate-6 shadow-md" />
              <div className="relative w-full h-full rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 flex items-center justify-center shadow-lg">
                <ModuleIcon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Title & Description */}
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
              {moduleInfo?.name || 'Module'} Access Locked
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed max-w-md mx-auto mb-6">
              Your subscription plan or account permissions do not grant access to the <span className="font-bold text-slate-900 dark:text-white">{moduleInfo?.name || moduleKey}</span> workspace module.
            </p>

            {/* Feature Unlock Highlights */}
            <div className="mb-8 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-left">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">What this module includes:</p>
              <div className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{moduleInfo?.description || 'Full operational feature access'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Automated real-time reporting & data export</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Unlimited records & multi-user collaboration</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/pricing"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Upgrade Plan Access</span>
              </Link>
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
