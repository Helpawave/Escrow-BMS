import React, { createContext, useContext, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { ModuleKey } from '@/lib/constants';

interface Subscription {
  module_key: ModuleKey;
  is_active: boolean;
  expires_at: string | null;
}

interface SubscriptionContextValue {
  subscriptions: Subscription[];
  loading: boolean;
  hasModule: (key: ModuleKey) => boolean;
  activeModules: ModuleKey[];
  refresh: () => Promise<void>;
}

const ALL_MODULES: ModuleKey[] = ['payroll', 'ledger', 'billing', 'hisab', 'inventory', 'crm'];

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { profile, isSuperAdmin, loading: authLoading, isTrialActive } = useAuth();
  const [loading] = useState(false);

  // Define module lists for each plan
  const planModules = useMemo<Record<string, ModuleKey[]>>(() => ({
    free: ['billing', 'hisab', 'ledger', 'inventory', 'payroll', 'crm'],
    trial: ['billing', 'hisab', 'ledger', 'inventory', 'payroll', 'crm'],
    starter: ['billing', 'hisab'],
    basic: ['billing', 'hisab'],
    growth: ['billing', 'hisab', 'ledger', 'inventory'],
    monthly: ['billing', 'hisab', 'ledger', 'inventory'],
    enterprise: ['billing', 'hisab', 'ledger', 'inventory', 'payroll', 'crm'],
    yearly: ['billing', 'hisab', 'ledger', 'inventory', 'payroll', 'crm'],
    pro: ['billing', 'hisab', 'ledger', 'inventory', 'payroll', 'crm'],
  }), []);

  const activeModules = useMemo<ModuleKey[]>(() => {
    if (isSuperAdmin || profile?.role === 'super_admin') {
      return ALL_MODULES;
    }
    
    // During active trial, grant access to all modules
    if (isTrialActive) {
      return ALL_MODULES;
    }
    
    const plan = (profile?.plan_type || 'free').toLowerCase();
    return planModules[plan] || planModules['starter'];
  }, [profile, isSuperAdmin, planModules, isTrialActive]);

  // Generate subscriptions list for compatibility
  const subscriptions = useMemo<Subscription[]>(() => {
    return ALL_MODULES.map((key) => ({
      module_key: key,
      is_active: activeModules.includes(key),
      expires_at: null,
    }));
  }, [activeModules]);

  const hasModule = (key: ModuleKey): boolean => {
    // Treat daily-hisab route references compatibly
    const normalizedKey = key === 'hisab' ? 'hisab' : key;
    return activeModules.includes(normalizedKey);
  };

  const refresh = async () => {};

  return (
    <SubscriptionContext.Provider value={{ subscriptions, loading: authLoading || loading, hasModule, activeModules, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used inside SubscriptionProvider');
  return ctx;
}
