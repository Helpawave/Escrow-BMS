import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicOnlyGuard } from '@/components/guards/AuthGuard';
import { 
  Zap, Eye, EyeOff, Mail, Lock, User, Building2, ArrowRight, Loader2,
  Sparkles, CheckCircle2, ShoppingBag, Laptop, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'login' | 'signup' | 'forgot';

const PLAN_DETAILS: Record<string, { name: string; price: string; modules: string[]; desc: string; color: string }> = {
  free: {
    name: "14-Day Free Trial",
    price: "₹0",
    desc: "Try all premium modules for free. No credit card required.",
    modules: ["billing", "hisab", "ledger", "inventory", "payroll", "crm"],
    color: "from-amber-500 to-orange-600"
  },
  starter: {
    name: "Starter Plan",
    price: "₹999/month",
    desc: "Perfect for retail shops and micro-businesses.",
    modules: ["billing", "hisab"],
    color: "from-emerald-500 to-teal-600"
  },
  growth: {
    name: "Growth Plan",
    price: "₹2,499/month",
    desc: "Great for growing traders and distributors.",
    modules: ["billing", "hisab", "ledger", "inventory"],
    color: "from-blue-500 to-cyan-600"
  },
  enterprise: {
    name: "Enterprise Plan",
    price: "₹4,999/month",
    desc: "Complete business management suite for larger teams.",
    modules: ["billing", "hisab", "ledger", "inventory", "payroll", "crm"],
    color: "from-violet-500 to-indigo-650"
  }
};

export default function Auth() {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    companyName: '',
  });

  const queryParams = new URLSearchParams(window.location.search);
  const planParam = queryParams.get('plan') || '';
  const hasPlanSelected = !!planParam && PLAN_DETAILS[planParam];

  // Auto-switch to signup if a plan is in the URL
  useEffect(() => {
    if (planParam) {
      setTab('signup');
    }
  }, [planParam]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signIn(form.email, form.password);
    if (error) {
      setError('Invalid email or password. Please try again.');
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) return setError('Full name is required');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    setError('');
    
    const targetPlan = planParam || 'free';

    const { error } = await signUp(form.email, form.password, form.fullName, form.companyName);
    if (error) {
      setError(error.message || 'Signup failed. Please try again.');
      setLoading(false);
      return;
    }
    // Auto-login after signup
    const { error: loginErr } = await signIn(form.email, form.password);
    if (!loginErr) {
      const { data: userSession } = await supabase.auth.getSession();
      if (userSession?.session?.user) {
        try {
          await supabase
            .from('profiles')
            .update({ plan_type: targetPlan })
            .eq('id', userSession.session.user.id);
        } catch (err) {
          console.warn('Could not update profile plan_type:', err);
        }
      }
      navigate('/dashboard');
    } else {
      setTab('login');
      setError('✅ Account created! Please login.');
    }
    setLoading(false);
  };

  return (
    <PublicOnlyGuard>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans">
        
        {/* HEADER */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 h-16 flex items-center justify-between flex-shrink-0 z-30 shadow-sm">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 flex items-center justify-center">
              <img src="/logo.png" alt="Escrow BMS" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <span className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Escrow</span>
              <span className="font-black text-indigo-600 text-lg tracking-tight"> BMS</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-650 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 transition-colors text-xs font-bold shadow-sm active:scale-95"
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

            <Link to="/" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 transition-colors">
              {t('backToHome')}
            </Link>
          </div>
        </header>

        {/* MAIN BODY: Split Panels */}
        <main className="flex-grow flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 lg:p-8 gap-8 items-center lg:items-stretch justify-center">
          
          {/* Left Panel: Selected Plan Info / Product features showcase */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 rounded-3xl p-10 flex-col justify-between text-white relative overflow-hidden shadow-2xl border border-indigo-500/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_45%)]" />
            
            {hasPlanSelected ? (
              // Selected Plan Showcase Details
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                  🛒 Selected Subscription Plan
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tight">
                    You're subscribing to the <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">{PLAN_DETAILS[planParam].name}</span>
                  </h2>
                  <p className="text-slate-400 text-sm font-medium">
                    {PLAN_DETAILS[planParam].desc}
                  </p>
                </div>

                <div className="flex items-baseline gap-2 pt-2">
                  <span className="text-4xl font-black">{PLAN_DETAILS[planParam].price}</span>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">/ billed monthly</span>
                </div>

                {/* Modules list */}
                <div className="space-y-3 pt-6 border-t border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Allowed Modules in your workspace</p>
                  <div className="grid grid-cols-2 gap-3">
                    {PLAN_DETAILS[planParam].modules.map((m) => (
                      <div key={m} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{t(m)}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              // Default General Platform Showcase
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                  ⚡ Escrow Business Management Suite
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tight leading-tight">
                    Simplify your business operations in one workspace
                  </h2>
                  <p className="text-slate-400 text-sm font-medium">
                    Create invoices, reconcile ledgers, track inventory stock, and run employee payroll seamlessly.
                  </p>
                </div>

                <div className="space-y-3 pt-6 border-t border-white/10">
                  {[
                    { title: t('billing'), desc: t('billingDesc'), icon: "📄" },
                    { title: t('ledger'), desc: t('ledgerDesc'), icon: "💰" },
                    { title: t('payroll'), desc: t('payrollDesc'), icon: "👥" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-3.5 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-xl block">{item.icon}</span>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">{item.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span className="flex items-center gap-1.5"><Laptop className="w-3.5 h-3.5" /> Uptime: 99.9%</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> 100% Encrypted</span>
            </div>
          </div>

          {/* Right Panel: Authentication Form Gated like request callback form */}
          <div className="flex-1 flex flex-col justify-center max-w-md w-full">
            <div className="card p-8 shadow-2xl border border-slate-200/80 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-3xl">
              
              {/* Login / Sign Up Tabs */}
              <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-1 mb-8">
                {(['login', 'signup'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(''); }}
                    className={cn(
                      'flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200',
                      tab === t
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-700'
                        : 'text-slate-450 dark:text-slate-500 hover:text-slate-750 dark:hover:text-slate-350'
                    )}
                  >
                    {t === 'login' ? 'Login' : 'Sign Up'}
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {tab === 'login' ? t('authCardTitleLogin') : tab === 'signup' ? t('authCardTitleSignup') : 'Reset Password'}
                </h1>
                <p className="text-xs text-slate-450 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                  {tab === 'login' ? t('authCardSubLogin') : tab === 'signup' ? t('authCardSubSignup') : 'Enter your email to receive a password reset link.'}
                </p>
              </div>

              {/* Error / success alerts */}
              {error && (
                <div className={cn(
                  'mb-5 px-4 py-3 rounded-2xl text-xs font-bold border',
                  error.startsWith('✅')
                    ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-150/20 dark:border-rose-900/20 text-rose-600 dark:text-rose-400'
                )}>
                  {error}
                </div>
              )}

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  setError('');
                  if (tab === 'forgot') {
                    const { error } = await resetPassword(form.email);
                    if (error) {
                      setError(error.message || 'Failed to send reset email.');
                    } else {
                      setError('✅ Reset email sent! Please check your inbox.');
                    }
                  } else if (tab === 'login') {
                    await handleLogin(e);
                  } else {
                    await handleSignup(e);
                  }
                  setLoading(false);
                }} 
                className="space-y-4"
              >
                {tab === 'signup' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-slate-405" />
                        <input 
                          name="fullName" 
                          type="text" 
                          value={form.fullName} 
                          onChange={handleChange} 
                          placeholder="Your full name" 
                          required 
                          className="w-full h-10 pl-9 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50 text-xs font-semibold rounded-xl focus:outline-none focus:border-indigo-500 transition-colors" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Company Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-405" />
                        <input 
                          name="companyName" 
                          type="text" 
                          value={form.companyName} 
                          onChange={handleChange} 
                          placeholder="Your company (optional)" 
                          className="w-full h-10 pl-9 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50 text-xs font-semibold rounded-xl focus:outline-none focus:border-indigo-500 transition-colors" 
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-405" />
                    <input 
                      name="email" 
                      type="email" 
                      value={form.email} 
                      onChange={handleChange} 
                      placeholder="you@company.com" 
                      required 
                      className="w-full h-10 pl-9 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50 text-xs font-semibold rounded-xl focus:outline-none focus:border-indigo-500 transition-colors" 
                    />
                  </div>
                </div>

                {tab !== 'forgot' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Password *</label>
                      {tab === 'login' && (
                        <button
                          type="button"
                          onClick={() => { setTab('forgot'); setError(''); }}
                          className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-750 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-405" />
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                        required
                        className="w-full h-10 pl-9 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50 text-xs font-semibold rounded-xl focus:outline-none focus:border-indigo-500 transition-colors" 
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 mt-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      {tab === 'login' ? 'Login' : tab === 'signup' ? 'Create Account' : 'Send Reset Link'}
                    </>
                  )}
                </button>

                {tab === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => { setTab('login'); setError(''); }}
                    className="w-full text-center text-[10px] font-black uppercase text-slate-500 hover:text-slate-700 mt-2 block"
                  >
                    Back to Login
                  </button>
                )}

              </form>
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex-shrink-0">
          <div>{t('authFooterCopyright')}</div>
          <div className="flex gap-4">{t('authFooterLinks')}</div>
        </footer>
      </div>
    </PublicOnlyGuard>
  );
}
