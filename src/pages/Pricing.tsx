import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { MODULES } from '@/lib/constants';
import { Zap, ArrowRight, CheckCircle2, Star, Shield, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';


export default function Pricing() {
  const { language, setLanguage, t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Navbar */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 flex items-center justify-center">
            <img src="/logo.png" alt="Escrow BMS" className="w-8 h-8 object-contain" />
          </div>
          <span className="font-heading font-black text-slate-900 dark:text-white text-lg">Escrow BMS</span>
        </Link>
        
        <div className="flex items-center gap-3">
          {/* Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-bold shadow-sm active:scale-95"
              title="Choose language / ભાષા / भाषा"
            >
              🌐 {language === 'en' ? 'English' : language === 'hi' ? 'हिंदी' : 'ગુજરાતી'}
            </button>
            
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1 z-50">
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
                        "w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
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
          
          <Link to="/auth" className="btn-primary text-sm px-4 py-2">{t('shuruKaro')}</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="badge badge-blue mb-4">💰 {t('pricing')}</span>
          <h1 className="text-4xl font-heading font-black text-slate-900 dark:text-white mb-4">
            {t('pricingTitle')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            {t('pricingSub')}
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'card p-8 relative flex flex-col',
                plan.highlight && 'border-brand-500 shadow-xl shadow-brand-500/10 scale-105'
              )}
            >
              {plan.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-600 text-white text-xs font-bold rounded-full shadow-sm">
                  {plan.badge}
                </span>
              )}

              <div className="mb-6">
                <h3 className="font-heading font-bold text-slate-900 dark:text-white text-xl mb-1">{plan.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{plan.description}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-heading font-black text-slate-900 dark:text-white">{plan.price}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm mb-1">{plan.period}</span>
                </div>
              </div>

              {/* Included modules */}
              <div className="flex-1 mb-8 space-y-2.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">{t('includedModules')}</p>
                {MODULES.map((m) => {
                  const included = plan.modules.includes(m.key);
                  return (
                    <div key={m.key} className={cn('flex items-center gap-2.5 text-sm', !included && 'opacity-40')}>
                      <CheckCircle2 className={cn('w-4 h-4 flex-shrink-0', included ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600')} />
                      <span className={included ? 'text-slate-700 dark:text-slate-200 font-medium' : 'text-slate-400 dark:text-slate-500'}>{t(m.key)}</span>
                    </div>
                  );
                })}
              </div>

              <Link
                to={`/auth?plan=${plan.key}`}
                className={cn(
                  'w-full text-center py-3 rounded-xl font-semibold text-sm transition-all duration-200',
                  plan.highlight
                    ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow-md'
                    : 'btn-secondary'
                )}
              >
                {t('shuruKaro')} <ArrowRight className="inline w-4 h-4 ml-1" />
              </Link>
            </div>
          ))}
        </div>

        {/* Features row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {pricingFeatures.map((f) => (
            <div key={f.title} className="card p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-0.5">{f.title}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
