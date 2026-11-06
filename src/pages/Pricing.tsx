import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { MODULES } from '@/lib/constants';
import { Zap, ArrowRight, CheckCircle2, Star, Shield, Headphones, Globe, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import Footer from '@/components/Footer';
import PublicNavbar from '@/components/PublicNavbar';
import { WhatsAppChatWidget } from '@/components/WhatsAppChatWidget';

export default function Pricing() {
  const { t } = useLanguage();

  const plans = [
    {
      name: t('planStarterName'),
      price: '₹999',
      period: t('planPeriod'),
      description: t('planStarterDesc'),
      modules: ['billing', 'hisab'],
      key: 'starter',
      highlight: false,
      badge: null,
      color: 'border-slate-200 dark:border-slate-700',
    },
    {
      name: t('planGrowthName'),
      price: '₹2,499',
      period: t('planPeriod'),
      description: t('planGrowthDesc'),
      modules: ['billing', 'hisab', 'ledger', 'inventory'],
      key: 'growth',
      highlight: true,
      badge: t('mostPopular'),
      color: 'border-brand-500',
    },
    {
      name: t('planEnterpriseName'),
      price: '₹4,999',
      period: t('planPeriod'),
      description: t('planEnterpriseDesc'),
      modules: ['billing', 'hisab', 'ledger', 'inventory', 'payroll', 'crm'],
      key: 'enterprise',
      highlight: false,
      badge: null,
      color: 'border-slate-200 dark:border-slate-700',
    },
  ];

  const pricingFeatures = [
    { icon: <Shield className="w-5 h-5 text-brand-600" />, title: t('pSecureTitle'), desc: t('pSecureDesc') },
    { icon: <Star className="w-5 h-5 text-amber-500" />, title: t('pNoLockTitle'), desc: t('pNoLockDesc') },
    { icon: <Headphones className="w-5 h-5 text-emerald-500" />, title: t('pSupportTitle'), desc: t('pSupportDesc') },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      <div>
        {/* Navbar */}
        <PublicNavbar />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-14">
            <span className="badge badge-blue mb-3 sm:mb-4 inline-flex items-center gap-1.5 text-xs">
              <CreditCard className="w-3.5 h-3.5" />
              <span>{t('pricing')}</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 dark:text-white mb-3 sm:mb-4 tracking-tight">
              {t('pricingTitle')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto">
              {t('pricingSub')}
            </p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'card p-6 sm:p-8 relative flex flex-col rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm',
                  plan.highlight && 'border-blue-500 dark:border-blue-500 shadow-xl shadow-blue-500/10 md:scale-105 z-10'
                )}
              >
                {plan.badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#1a73e8] text-white text-xs font-bold rounded-full shadow-md">
                    {plan.badge}
                  </span>
                )}

                <div className="mb-6">
                  <h3 className="font-heading font-bold text-slate-900 dark:text-white text-xl mb-1">{plan.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-4 leading-relaxed">{plan.description}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl sm:text-4xl font-heading font-black text-slate-900 dark:text-white font-mono">{plan.price}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-1">{plan.period}</span>
                  </div>
                </div>

                {/* Included modules */}
                <div className="flex-1 mb-8 space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-5">
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">{t('includedModules')}</p>
                  {MODULES.map((m) => {
                    const included = plan.modules.includes(m.key);
                    return (
                      <div key={m.key} className={cn('flex items-center gap-2.5 text-xs sm:text-sm', !included && 'opacity-35')}>
                        <CheckCircle2 className={cn('w-4 h-4 flex-shrink-0', included ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600')} />
                        <span className={included ? 'text-slate-700 dark:text-slate-200 font-semibold' : 'text-slate-400 dark:text-slate-500'}>{t(m.key)}</span>
                      </div>
                    );
                  })}
                </div>

                <Link
                  to={`/auth?plan=${plan.key}`}
                  className={cn(
                    'w-full text-center py-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.99]',
                    plan.highlight
                      ? 'bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-md shadow-blue-500/25'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                  )}
                >
                  {t('getStartedWith')} {plan.name}
                </Link>
              </div>
            ))}
          </div>

          {/* Pricing features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-6 border-t border-slate-200/80 dark:border-slate-800">
            {pricingFeatures.map((f, i) => (
              <div key={i} className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h4 className="font-heading font-bold text-slate-900 dark:text-white text-sm mb-1">{f.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
      <WhatsAppChatWidget />
    </div>
  );
}
