import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AuthGuard } from '@/components/guards/AuthGuard';
import type { ModuleKey } from '@/lib/constants';
import { Lock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModuleGuardProps {
  moduleKey: ModuleKey;
  children: React.ReactNode;
}

export function ModuleGuard({ moduleKey, children }: ModuleGuardProps) {
  const { hasModule, loading } = useSubscription();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!hasModule(moduleKey)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-slate-400 dark:text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Module Locked</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">
          Aapne yeh module subscribe nahi kiya hai. Pricing page pe jaake plan upgrade karo.
        </p>
        <div className="flex gap-3">
          <Link to="/pricing" className="btn-primary">
            Upgrade Plan
          </Link>
          <Link to="/dashboard" className="btn-secondary">
            Dashboard Pe Jaao
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <>{children}</>
    </AuthGuard>
  );
}
