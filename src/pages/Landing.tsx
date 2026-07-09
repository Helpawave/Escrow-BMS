import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  ArrowRight, Check, Menu, X, ChevronDown, BarChart3, Users,
  FileText, BookOpen, Package, Calculator, TrendingUp, Shield,
  Clock, Star, ChevronRight, Zap, Globe, CheckCircle, Phone,
  Bell, Sparkles, ArrowUpRight, Lock, Receipt, PieChart, Sun, Moon
} from 'lucide-react';

/* ─── Hooks ──────────────────────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCounter(target: number, duration = 2000, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let s = 0; const step = target / (duration / 16);
    const id = setInterval(() => { s += step; if (s >= target) { setCount(target); clearInterval(id); } else setCount(Math.floor(s)); }, 16);
    return () => clearInterval(id);
  }, [active, target, duration]);
  return count;
}

/* ─── FadeUp ─────────────────────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={className} style={{ transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`, opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(32px)' }}>
      {children}
    </div>
  );
}

/* ─── AnimCounter ────────────────────────────────────────────────────── */
function AnimCounter({ value, prefix = '', suffix = '', label }: { value: number; prefix?: string; suffix?: string; label: string }) {
  const { ref, inView } = useInView();
  const c = useCounter(value, 2000, inView);
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl xl:text-5xl font-black text-white tracking-tight">{prefix}{c.toLocaleString('en-IN')}{suffix}</div>
      <div className="text-sm text-blue-200 mt-1.5 font-medium">{label}</div>
    </div>
  );
}

/* ─── Data ───────────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  { name: 'Ravi Kapoor', role: 'Textile Merchant', loc: 'Surat, Gujarat', text: 'We replaced 3 different apps with Escrow BMS. Everything from billing to payroll in one place. My team saves 2 hours every single day.', rating: 5, initials: 'RK', grad: 'from-blue-600 to-blue-800' },
  { name: 'Priya Singh', role: 'Chartered Accountant', loc: 'Delhi', text: "The ledger module is incredibly accurate. My clients' books are always current. I recommend it to every business owner I work with.", rating: 5, initials: 'PS', grad: 'from-violet-600 to-violet-800' },
  { name: 'Mohammed Asif', role: 'Garment Exporter', loc: 'Ludhiana, Punjab', text: 'Inventory tracking was our biggest pain point. Now stock alerts are automatic, purchase orders are one-click. Absolute game changer.', rating: 5, initials: 'MA', grad: 'from-emerald-600 to-emerald-800' },
];

const PLANS = [
  { key: 'free', name: '14-Day Trial', price: 0, period: '14 days', desc: 'Full access. No card needed.', all: true, badge: null, highlight: false },
  { key: 'starter', name: 'Starter', price: 999, period: '/mo', desc: 'For small businesses.', modules: ['Billing', 'Hisab'], badge: null, highlight: false },
  { key: 'growth', name: 'Growth', price: 2499, period: '/mo', desc: 'For growing businesses.', modules: ['Billing', 'Hisab', 'Ledger', 'Inventory'], badge: 'Most Popular', highlight: true },
  { key: 'enterprise', name: 'Enterprise', price: 4999, period: '/mo', desc: 'Full suite, large teams.', all: true, badge: null, highlight: false },
];
const ALL_MODS = ['Billing & Invoices', 'Daily Calculation', 'Account Ledger', 'Inventory', 'Payroll', 'CRM'];

export default function Landing() {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const go = () => navigate(user ? '/dashboard' : '/auth');

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-300 antialiased font-sans overflow-x-hidden ${isDark ? 'bg-[#05080f] text-white' : 'bg-white text-gray-900'}`}>

      {/* ═══ NAV ═══════════════════════════════════════════════════════ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled 
          ? isDark 
            ? 'bg-[#05080f]/95 backdrop-blur-xl border-b border-white/10 shadow-sm shadow-black/20' 
            : 'bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-sm' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm shadow-blue-300/40">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className={`font-black text-lg tracking-tight transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Escrow<span className="text-blue-700">BMS</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[['Features', '#features'], ['Solutions', '#solutions'], ['Pricing', '#pricing'], ['Reviews', '#testimonials']].map(([l, h]) => (
              <a key={h} href={h} className={`text-sm font-medium transition-colors relative group ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                {l}<span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-blue-700 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-xl transition-all active:scale-95 ${isDark ? 'text-amber-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'}`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Language */}
            <div className="relative">
              <button onClick={() => setLangOpen(!langOpen)} className={`flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}>
                <Globe className="w-3.5 h-3.5" />{language === 'hi' ? 'HI' : language === 'gu' ? 'GU' : 'EN'}<ChevronDown className="w-3 h-3" />
              </button>
              {langOpen && (<>
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <div className={`absolute right-0 top-full mt-1.5 w-32 border rounded-xl shadow-2xl py-1.5 z-50 ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-200'}`}>
                  {[{ c: 'en', l: 'English' }, { c: 'hi', l: 'हिंदी' }, { c: 'gu', l: 'ગુજરાતી' }].map(x => (
                    <button key={x.c} onClick={() => { setLanguage(x.c as any); setLangOpen(false); }} className={`w-full text-left px-3.5 py-2 text-sm font-medium ${language === x.c ? 'text-blue-700 bg-blue-50' : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'}`}>{x.l}</button>
                  ))}
                </div>
              </>)}
            </div>
            {user ? (
              <Link to="/dashboard" className="flex items-center gap-1.5 bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-800 transition-all hover:shadow-lg hover:shadow-blue-200 active:scale-95">Dashboard <ArrowRight className="w-4 h-4" /></Link>
            ) : (<>
              <Link to="/auth" className={`text-sm font-semibold px-3 py-2 transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}>Log in</Link>
              <button onClick={go} className="relative bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl overflow-hidden group hover:bg-blue-800 transition-all hover:shadow-xl hover:shadow-blue-200/60 active:scale-95">
                <span className="relative z-10">Start Free Trial</span>
              </button>
            </>)}
          </div>
          <button className={`md:hidden p-2 ${isDark ? 'text-gray-400' : 'text-gray-650'}`} onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className={`md:hidden border-t px-6 py-5 flex flex-col gap-4 ${isDark ? 'bg-gray-950/98 border-white/5' : 'bg-white/98 border-gray-100'}`}>
            {[['Features', '#features'], ['Pricing', '#pricing'], ['Reviews', '#testimonials']].map(([l, h]) => (
              <a key={h} href={h} onClick={() => setMobileOpen(false)} className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{l}</a>
            ))}
            <div className="flex items-center justify-between pt-2">
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Theme:</span>
              <button onClick={toggleTheme} className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border ${isDark ? 'text-amber-400 border-white/10 bg-white/5' : 'text-gray-650 border-gray-200 bg-gray-50'}`}>
                {isDark ? <><Sun className="w-3.5 h-3.5" /> Light</> : <><Moon className="w-3.5 h-3.5" /> Dark</>}
              </button>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-white/5">
              <button onClick={go} className="w-full bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm">
                {user ? 'Open Dashboard' : 'Start Free — 14 Days'}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═══════════════════════════════════════════════════════ */}
      <section className={`relative min-h-screen flex items-center pt-16 overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#05080f]' : 'bg-slate-50'}`}>
        {/* Animated background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute top-0 left-0 w-[800px] h-[800px] rounded-full blur-[120px] animate-pulse transition-colors duration-300 ${isDark ? 'bg-blue-700/10' : 'bg-blue-200/40'}`} style={{ animationDuration: '6s' }} />
          <div className={`absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[100px] animate-pulse transition-colors duration-300 ${isDark ? 'bg-violet-700/10' : 'bg-violet-200/35'}`} style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-3xl animate-pulse transition-colors duration-300 ${isDark ? 'bg-blue-500/5' : 'bg-blue-100/30'}`} style={{ animationDuration: '5s', animationDelay: '1s' }} />
          {/* Grid lines */}
          <div className="absolute inset-0" style={{ 
            backgroundImage: isDark 
              ? 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)' 
              : 'linear-gradient(rgba(0,0,0,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.02) 1px,transparent 1px)', 
            backgroundSize: '80px 80px' 
          }} />
          {/* Glow line at top */}
          <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent ${isDark ? 'via-blue-500/50' : 'via-blue-200/80'}`} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-16 items-center">

            {/* Left */}
            <div>
              <a href="#features" className={`inline-flex items-center gap-2 border text-xs font-semibold px-4 py-2 rounded-full mb-8 transition-colors cursor-pointer ${
                isDark 
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/15' 
                  : 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100'
              }`}>
                <Sparkles className="w-3.5 h-3.5" />
                All-in-one Business Suite for India
                <ArrowUpRight className="w-3 h-3" />
              </a>

              <h1 className={`font-black leading-[1.03] tracking-tighter mb-7 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`} style={{ fontSize: 'clamp(3rem, 6vw, 5.5rem)' }}>
                The smarter way
                <br />
                <span style={{ background: isDark ? 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #60a5fa 100%)' : 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 50%, #1d4ed8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200%', animation: 'shimmer 4s ease infinite' }}>
                  to run business.
                </span>
              </h1>

              <p className={`text-[1.125rem] leading-relaxed mb-10 max-w-[480px] transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Payroll. Billing. Inventory. CRM. Ledger. Daily Calculation.
                <br />One platform. Zero complexity. Built for India.
              </p>

              <div className="flex flex-wrap gap-3 mb-12">
                <button onClick={go} className="group relative inline-flex items-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-7 py-4 rounded-xl transition-all duration-200 hover:shadow-2xl hover:shadow-blue-500/30 active:scale-[0.97] text-[0.9375rem]">
                  Start Free — 14 Days
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <Link to="/auth" className={`inline-flex items-center gap-2.5 border font-semibold px-7 py-4 rounded-xl transition-all text-[0.9375rem] ${
                  isDark 
                    ? 'border-white/10 bg-white/5 text-gray-300 hover:text-white hover:border-white/20 hover:bg-white/8' 
                    : 'border-gray-300 bg-white text-gray-750 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-550/5'
                }`}>
                  Book a Demo <Phone className="w-4 h-4" />
                </Link>
              </div>

              <div className="flex items-center gap-6 mb-10">
                <div className="flex -space-x-2.5">
                  {['RK', 'PS', 'MA', 'VT', 'AK'].map((i, idx) => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 transition-colors duration-300 ${isDark ? 'border-[#05080f]' : 'border-slate-50'}`}
                      style={{ background: ['#2563eb', '#7c3aed', '#059669', '#d97706', '#e11d48'][idx] }}>
                      {i}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}</div>
                  <p className={`text-xs font-medium transition-colors duration-300 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Trusted by <span className={isDark ? 'text-gray-300' : 'text-gray-900 font-semibold'}>500+</span> users across India
                  </p>
                </div>
              </div>

              <p className={`text-xs transition-colors duration-300 ${isDark ? 'text-gray-750' : 'text-gray-400'}`}>No credit card required · Cancel anytime · Free onboarding support</p>
            </div>

            {/* Right — Glassmorphism dashboard */}
            <div className="hidden lg:block relative">
              <div className={`absolute -inset-4 rounded-3xl blur-2xl transition-colors duration-300 ${isDark ? 'bg-blue-600/15' : 'bg-blue-200/25'}`} />
              <div className={`relative border rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm transition-all duration-300 ${
                isDark ? 'bg-[#0d1220]/90 border-white/10' : 'bg-white border-gray-200'
              }`}>
                {/* Chrome bar */}
                <div className={`flex items-center gap-2 px-4 py-3 border-b transition-colors duration-300 ${
                  isDark ? 'border-white/5 bg-white/[0.03]' : 'border-gray-200 bg-gray-550/5'
                }`}>
                  <div className="flex gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-red-500/70' : 'bg-red-450/80'}`} />
                    <div className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-amber-500/70' : 'bg-amber-450/80'}`} />
                    <div className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-emerald-500/70' : 'bg-emerald-450/80'}`} />
                  </div>
                  <div className={`mx-auto flex items-center gap-2 border rounded-md px-3 py-1 text-[10px] font-mono transition-colors duration-300 ${
                    isDark ? 'bg-white/5 border-white/10 text-gray-500' : 'bg-white border-gray-200 text-gray-650'
                  }`}>
                    <Lock className="w-2.5 h-2.5 text-emerald-500" />escrowbms.in/dashboard
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className={`text-[10px] font-semibold transition-colors duration-300 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Live</span>
                  </div>
                </div>

                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 transition-colors duration-300 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Dashboard</p>
                      <p className={`text-sm font-black transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>Ravi Enterprises</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[9px] mb-0.5 transition-colors duration-300 ${isDark ? 'text-gray-600' : 'text-gray-450'}`}>July 2025</p>
                      <p className={`text-sm font-black transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>₹4.2L <span className="text-emerald-500 text-xs font-bold">+12%</span></p>
                    </div>
                  </div>

                  {/* KPI cards */}
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    {[
                      { l: 'Revenue', v: '₹4.2L', ch: '+12%', color: isDark ? 'text-emerald-400' : 'text-emerald-700', bg: isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200' },
                      { l: 'Pending', v: '₹48K', ch: '3 bills', color: isDark ? 'text-amber-400' : 'text-amber-700', bg: isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200' },
                      { l: 'Expenses', v: '₹1.1L', ch: '-5%', color: isDark ? 'text-blue-400' : 'text-blue-700', bg: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200' },
                    ].map(k => (
                      <div key={k.l} className={`${k.bg} border rounded-xl p-3 transition-colors duration-300`}>
                        <p className={`text-[8px] uppercase tracking-wider mb-1.5 transition-colors duration-300 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{k.l}</p>
                        <p className={`text-sm font-black ${k.color}`}>{k.v}</p>
                        <p className={`text-[8px] mt-0.5 transition-colors duration-300 ${isDark ? 'text-gray-600' : 'text-gray-450'}`}>{k.ch}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart */}
                  <div className={`border rounded-xl p-4 mb-4 transition-colors duration-300 ${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-gray-200'}`}>
                    <div className="flex justify-between mb-3">
                      <p className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Revenue (6 months)</p>
                      <span className="text-[9px] text-blue-500 font-semibold">▲ 28% overall</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-14">
                      {[28, 50, 41, 65, 53, 85].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
                          <div className={`w-full rounded-sm transition-all ${
                            isDark 
                              ? i === 5 ? 'bg-blue-500' : 'bg-blue-500/20'
                              : i === 5 ? 'bg-blue-600' : 'bg-blue-100'
                          }`} style={{ height: `${h}%` }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex mt-1.5">{['J', 'F', 'M', 'A', 'M', 'J'].map(m => <span key={m} className={`text-[8px] flex-1 text-center transition-colors duration-300 ${isDark ? 'text-gray-700' : 'text-gray-450'}`}>{m}</span>)}</div>
                  </div>

                  {/* Transactions */}
                  <div className="space-y-0">
                    <p className={`text-[9px] font-bold uppercase tracking-widest mb-2.5 transition-colors duration-300 ${isDark ? 'text-gray-600' : 'text-gray-450'}`}>Recent</p>
                    {[
                      { n: 'Mehta Fabrics', a: '+₹28,500', t: 'Invoice Paid' },
                      { n: 'Office Rent — Jul', a: '-₹15,000', t: 'Expense' },
                      { n: 'Kumar & Sons', a: '+₹12,300', t: 'Invoice Paid' },
                    ].map((t, i) => (
                      <div key={i} className={`flex justify-between items-center py-2.5 border-b last:border-0 transition-colors duration-300 ${isDark ? 'border-white/[0.04]' : 'border-gray-150'}`}>
                        <div>
                          <p className={`text-[11px] font-semibold transition-colors duration-300 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{t.n}</p>
                          <p className={`text-[9px] transition-colors duration-300 ${isDark ? 'text-gray-600' : 'text-gray-450'}`}>{t.t}</p>
                        </div>
                        <span className={`text-[11px] font-black ${t.a[0] === '+' ? 'text-emerald-500' : 'text-red-500'}`}>{t.a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating notifications */}
              <div className="absolute -left-10 top-1/4 animate-[float_3s_ease-in-out_infinite]">
                <div className={`border rounded-2xl shadow-2xl px-3.5 py-2.5 transition-colors duration-300 ${isDark ? 'bg-[#0d1220] border-white/10' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-violet-500/20 border border-violet-500/30 rounded-lg flex items-center justify-center"><Users className="w-3.5 h-3.5 text-violet-400" /></div>
                    <div>
                      <p className={`text-[10px] font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-850'}`}>Payroll Done</p>
                      <p className={`text-[9px] transition-colors duration-300 ${isDark ? 'text-gray-500' : 'text-gray-450'}`}>12 slips sent ✓</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-10 top-2/5 animate-[float_4s_ease-in-out_infinite_0.5s]">
                <div className={`border rounded-2xl shadow-2xl px-3.5 py-2.5 transition-colors duration-300 ${isDark ? 'bg-[#0d1220] border-white/10' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center"><Package className="w-3.5 h-3.5 text-emerald-400" /></div>
                    <div>
                      <p className={`text-[10px] font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-850'}`}>All stocked</p>
                      <p className={`text-[9px] transition-colors duration-300 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>234 SKUs ✓</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-5 right-1/4 animate-[float_3.5s_ease-in-out_infinite_1s]">
                <div className={`border rounded-2xl shadow-2xl px-3.5 py-2 transition-colors duration-300 ${isDark ? 'bg-[#0d1220] border-white/10' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-2"><Bell className="w-3 h-3 text-amber-450" /><p className={`text-[9px] font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Invoice paid! ₹28,500</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE ════════════════════════════════════════════════════ */}
      <div className="relative bg-blue-700 py-4 overflow-hidden border-y border-blue-600">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-blue-700 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-blue-700 to-transparent z-10 pointer-events-none" />
        <div style={{ display: 'flex', gap: '3rem', animation: 'marquee 22s linear infinite', width: 'max-content' }}>
          {[...Array(4)].flatMap(() =>
            ['Textile Traders', 'CA Firms', 'Retail POS Shops', 'Manufacturers', 'Wholesalers', 'IT Services', 'Garment Exporters', 'Distributors', 'Builders & Contractors', 'Agencies']
          ).map((b, i) => (
            <span key={i} className="inline-flex items-center gap-2.5 text-blue-100 text-sm font-bold flex-shrink-0 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />{b}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ ANIMATED STATS ═════════════════════════════════════════════ */}
      <section className="py-20 bg-blue-700">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
          <AnimCounter value={500} suffix="+" label="Active users" />
          <AnimCounter value={5} prefix="₹" suffix=" Lakh+" label="Revenue processed" />
          <AnimCounter value={10000} suffix="+" label="Invoices generated" />
          <AnimCounter value={6} label="Powerful modules" />
        </div>
      </section>

      {/* ═══ BENTO GRID FEATURES ════════════════════════════════════════ */}
      <section id="features" className={`py-24 px-6 transition-colors duration-300 ${isDark ? 'bg-[#05080f] border-b border-white/5' : 'bg-white border-b border-gray-150'}`}>
        <div className="max-w-7xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-blue-700 text-sm font-black uppercase tracking-widest mb-3">Features</p>
            <h2 className={`text-4xl lg:text-5xl font-black tracking-tight mb-4 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>Everything your business needs.</h2>
            <p className={`text-lg max-w-xl mx-auto transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Six powerful modules. One unified platform. Built for how Indian businesses actually work.</p>
          </FadeUp>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Big card — Billing */}
            <FadeUp className="md:col-span-2" delay={0}>
              <div className={`group rounded-3xl p-8 h-full min-h-[260px] relative overflow-hidden transition-all duration-300 border ${
                isDark 
                  ? 'bg-gradient-to-br from-blue-900 to-[#0c1328] border-white/5 text-white hover:shadow-2xl hover:shadow-blue-300/20' 
                  : 'bg-gradient-to-br from-blue-50/50 to-white border-blue-150 text-blue-900 hover:shadow-xl hover:shadow-blue-100'
              }`}>
                <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-blue-500/5 rounded-full" />
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-blue-500/5 rounded-full" />
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${isDark ? 'bg-white/10' : 'bg-blue-100'}`}>
                  <FileText className={`w-6 h-6 ${isDark ? 'text-white' : 'text-blue-700'}`} />
                </div>
                <h3 className={`text-2xl font-black mb-3 ${isDark ? 'text-white' : 'text-blue-900'}`}>Billing & GST Invoices</h3>
                <p className={`text-sm leading-relaxed max-w-md ${isDark ? 'text-blue-200' : 'text-blue-750'}`}>Create GST-ready invoices, auto-calculate CGST/SGST/IGST, share via WhatsApp PDF, and track payments — all in one screen.</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {['Auto GST', 'WhatsApp Share', 'Payment Tracking', 'Client Reports'].map(t => (
                    <span key={t} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${isDark ? 'bg-white/10 text-blue-100' : 'bg-blue-100/50 text-blue-800'}`}>{t}</span>
                  ))}
                </div>
              </div>
            </FadeUp>

            {/* Payroll */}
            <FadeUp delay={80}>
              <div className={`group rounded-3xl p-7 h-full min-h-[260px] relative overflow-hidden transition-all duration-300 border ${
                isDark 
                  ? 'bg-gradient-to-br from-violet-900 to-[#1b152d] border-white/5 text-white hover:shadow-2xl hover:shadow-violet-300/20' 
                  : 'bg-gradient-to-br from-violet-50/50 to-white border-violet-150 text-violet-900 hover:shadow-xl hover:shadow-violet-100'
              }`}>
                <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-violet-500/5 rounded-full" />
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-5 ${isDark ? 'bg-white/10' : 'bg-violet-100'}`}>
                  <Users className={`w-5.5 h-5.5 ${isDark ? 'text-white' : 'text-violet-700'}`} />
                </div>
                <h3 className={`text-xl font-black mb-2.5 ${isDark ? 'text-white' : 'text-violet-900'}`}>Payroll</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-violet-200' : 'text-violet-750'}`}>Salary slips, PF/ESI, attendance, leave management — all automated.</p>
                <div className="mt-5 space-y-1.5">
                  {['Auto salary slips', 'PF/ESI compliance', 'Leave management'].map(t => (
                    <div key={t} className={`flex items-center gap-2 text-xs ${isDark ? 'text-violet-200' : 'text-violet-750'}`}>
                      <Check className={`w-3.5 h-3.5 ${isDark ? 'text-violet-300' : 'text-violet-600'}`} />{t}
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>

            {/* Ledger */}
            <FadeUp delay={120}>
              <div className={`group rounded-3xl p-7 h-full min-h-[240px] relative overflow-hidden transition-all duration-300 border ${
                isDark 
                  ? 'bg-gradient-to-br from-emerald-900 to-[#0e2118] border-white/5 text-white hover:shadow-2xl hover:shadow-emerald-300/20' 
                  : 'bg-gradient-to-br from-emerald-50/50 to-white border-emerald-150 text-emerald-900 hover:shadow-xl hover:shadow-emerald-100'
              }`}>
                <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-emerald-500/5 rounded-full" />
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-5 ${isDark ? 'bg-white/10' : 'bg-emerald-100'}`}>
                  <BookOpen className={`w-5.5 h-5.5 ${isDark ? 'text-white' : 'text-emerald-700'}`} />
                </div>
                <h3 className={`text-xl font-black mb-2.5 ${isDark ? 'text-white' : 'text-emerald-900'}`}>Account Ledger</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-emerald-200' : 'text-emerald-750'}`}>Party ledgers, P&L statements, bank reconciliation — zero complexity.</p>
              </div>
            </FadeUp>

            {/* Inventory */}
            <FadeUp delay={160}>
              <div className={`group rounded-3xl p-7 h-full min-h-[240px] relative overflow-hidden transition-all duration-300 border ${
                isDark 
                  ? 'bg-gradient-to-br from-amber-600 to-[#2c200c] border-white/5 text-white hover:shadow-2xl hover:shadow-amber-300/20' 
                  : 'bg-gradient-to-br from-amber-50/50 to-white border-amber-200 text-amber-900 hover:shadow-xl hover:shadow-amber-100'
              }`}>
                <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-amber-500/5 rounded-full" />
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-5 ${isDark ? 'bg-white/10' : 'bg-amber-100'}`}>
                  <Package className={`w-5.5 h-5.5 ${isDark ? 'text-white' : 'text-amber-700'}`} />
                </div>
                <h3 className={`text-xl font-black mb-2.5 ${isDark ? 'text-white' : 'text-amber-900'}`}>Inventory</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-amber-200' : 'text-amber-750'}`}>Barcode scanning, stock alerts, purchase orders. Never run out.</p>
              </div>
            </FadeUp>

            {/* CRM + Hisab — stacked */}
            <FadeUp delay={200} className="md:col-span-1 flex flex-col gap-4">
              <div className={`group rounded-3xl p-7 flex-1 relative overflow-hidden transition-all duration-300 border ${
                isDark 
                  ? 'bg-gradient-to-br from-rose-900 to-[#271017] border-white/5 text-white hover:shadow-2xl hover:shadow-rose-300/20' 
                  : 'bg-gradient-to-br from-rose-50/50 to-white border-rose-150 text-rose-900 hover:shadow-xl hover:shadow-rose-100'
              }`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-white/10' : 'bg-rose-100'}`}>
                  <TrendingUp className={`w-5 h-5 ${isDark ? 'text-white' : 'text-rose-700'}`} />
                </div>
                <h3 className={`text-lg font-black mb-2 ${isDark ? 'text-white' : 'text-rose-900'}`}>CRM</h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-rose-250' : 'text-rose-750'}`}>Leads, follow-ups, pipeline, sales reports.</p>
              </div>
              <div className={`group rounded-3xl p-7 flex-1 relative overflow-hidden transition-all duration-300 border ${
                isDark 
                  ? 'bg-gradient-to-br from-teal-900 to-[#0c2420] border-white/5 text-white hover:shadow-2xl hover:shadow-teal-300/20' 
                  : 'bg-gradient-to-br from-teal-50/50 to-white border-teal-150 text-teal-900 hover:shadow-xl hover:shadow-teal-100'
              }`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-white/10' : 'bg-teal-100'}`}>
                  <Calculator className={`w-5 h-5 ${isDark ? 'text-white' : 'text-teal-700'}`} />
                </div>
                <h3 className={`text-lg font-black mb-2 ${isDark ? 'text-white' : 'text-teal-900'}`}>Daily Hisab</h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-teal-200' : 'text-teal-750'}`}>Cash in/out, party khata, daily summaries.</p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ═══ ALTERNATING SECTIONS ═══════════════════════════════════════ */}
      <section id="solutions" className={`py-24 px-6 transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-slate-50 border-b border-gray-205'}`}>
        <div className="max-w-7xl mx-auto space-y-28">

          {/* Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeUp>
              <span className={`inline-block border text-xs font-bold px-3 py-1.5 rounded-full mb-6 ${
                isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-700'
              }`}>Billing & Compliance</span>
              <h2 className={`text-4xl lg:text-5xl font-black tracking-tight mb-6 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>GST billing that just works.</h2>
              <p className={`text-lg leading-relaxed mb-8 transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-650'}`}>No more manual GST calculations. No Excel sheets. Escrow BMS auto-applies CGST, SGST, and IGST — and generates a print-ready or WhatsApp-ready invoice in seconds.</p>
              <div className="space-y-4">
                {[['Auto CGST/SGST/IGST', 'Based on party state, always accurate'],['E-invoice & E-way bill ready', 'Stay compliant with GST portal'], ['Recurring invoices', 'Set it once, runs automatically']].map(([t, d]) => (
                  <div key={t} className="flex gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5"><Check className="w-3 h-3 text-white" /></div>
                    <div><p className={`font-semibold text-sm transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-850'}`}>{t}</p><p className={`text-sm transition-colors duration-300 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{d}</p></div>
                  </div>
                ))}
              </div>
            </FadeUp>

            <FadeUp delay={150}>
              <div className={`transition-all duration-300 border rounded-2xl overflow-hidden shadow-2xl ${isDark ? 'bg-[#0d1220] border-white/10' : 'bg-white border-gray-200'}`}>
                <div className={`flex items-center gap-2 px-4 py-3 border-b ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'}`}>
                  <Receipt className="w-4 h-4 text-blue-400" />
                  <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>New Invoice · INV-2025-089</span>
                  <span className="ml-auto text-[10px] bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full font-bold">Paid</span>
                </div>
                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className={`rounded-lg p-2.5 ${isDark ? 'bg-white/5' : 'bg-gray-100/50'}`}>
                      <p className={`mb-0.5 text-[9px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Party</p>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Mehta Fabrics</p>
                    </div>
                    <div className={`rounded-lg p-2.5 ${isDark ? 'bg-white/5' : 'bg-gray-100/50'}`}>
                      <p className={`mb-0.5 text-[9px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>State</p>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Gujarat</p>
                    </div>
                    <div className={`border rounded-lg p-2.5 ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                      <p className={`mb-0.5 text-[9px] ${isDark ? 'text-blue-500' : 'text-blue-500'}`}>GST Type</p>
                      <p className="text-blue-500 font-bold">IGST 18%</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    {[['Fabric (5m × ₹600)', '₹3,000'],['Stitching charges', '₹500']].map(([d, a]) => (
                      <div key={d} className={`flex justify-between text-xs border-b pb-2 ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                        <span className={`${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{d}</span>
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-850'}`}>{a}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs text-gray-500 pb-1"><span>IGST @ 18%</span><span>₹630</span></div>
                    <div className="flex justify-between text-sm font-black pt-1">
                      <span className={isDark ? 'text-white' : 'text-gray-900'}>Total</span>
                      <span className="text-emerald-500">₹4,130</span>
                    </div>
                  </div>
                  <button className={`w-full text-xs font-bold py-2.5 rounded-xl transition-colors border ${
                    isDark 
                      ? 'bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30' 
                      : 'bg-blue-50 border-blue-100 text-blue-750 hover:bg-blue-100'
                  }`}>Share via WhatsApp PDF →</button>
                </div>
              </div>
            </FadeUp>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeUp delay={100} className="order-2 lg:order-1">
              <div className={`transition-all duration-300 border rounded-2xl overflow-hidden shadow-2xl ${isDark ? 'bg-[#0d1220] border-white/10' : 'bg-white border-gray-200'}`}>
                <div className={`flex items-center gap-2 px-4 py-3 border-b ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'}`}>
                  <PieChart className="w-4 h-4 text-violet-400" />
                  <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Payroll — June 2025</span>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    {[['Total Payout', '₹3.8L', isDark ? 'text-white' : 'text-gray-900'],['PF + ESI', '₹42K', 'text-violet-500'],['Slips Sent', '12/12', 'text-emerald-500']].map(([l,v,c]) => (
                      <div key={l} className={`rounded-xl p-3 text-center ${isDark ? 'bg-white/5' : 'bg-gray-100/50'}`}>
                        <p className={`text-sm font-black ${c}`}>{v}</p>
                        <p className={`text-[9px] mt-0.5 ${isDark ? 'text-gray-650' : 'text-gray-400'}`}>{l}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[['Ravi Kumar', 'Manager', '₹45,000'],['Sita Devi', 'Accountant', '₹30,000'],['Manoj Sharma', 'Sales', '₹25,000']].map(([n,r,s]) => (
                      <div key={n} className={`flex items-center gap-3 py-2 border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                        <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0"><span className="text-[9px] text-violet-400 font-bold">{n[0]}</span></div>
                        <div className="flex-1">
                          <p className={`text-[11px] font-semibold transition-colors duration-300 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{n}</p>
                          <p className={`text-[9px] transition-colors duration-300 ${isDark ? 'text-gray-605' : 'text-gray-400'}`}>{r}</p>
                        </div>
                        <span className={`text-[11px] font-black transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>{s}</span>
                        <span className="text-[9px] bg-emerald-500/15 text-emerald-500 px-1.5 py-0.5 rounded font-bold">Paid</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeUp>

            <FadeUp className="order-1 lg:order-2">
              <span className={`inline-block border text-xs font-bold px-3 py-1.5 rounded-full mb-6 ${
                isDark ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'bg-violet-50 border-violet-100 text-violet-700'
              }`}>Payroll & HR</span>
              <h2 className={`text-4xl lg:text-5xl font-black tracking-tight mb-6 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>Payroll that runs itself.</h2>
              <p className={`text-lg leading-relaxed mb-8 transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-650'}`}>From salary slips to PF/ESI compliance — automate every step of your payroll process. Your team gets paid on time, every time.</p>
              <div className="space-y-4">
                {[['Auto salary calculation', 'With deductions, bonuses, and overtime'],['PF/ESI auto-compute', 'Stay compliant, always'], ['One-click salary slips', 'PDF slips for every employee']].map(([t, d]) => (
                  <div key={t} className="flex gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5"><Check className="w-3 h-3 text-white" /></div>
                    <div><p className={`font-semibold text-sm transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-850'}`}>{t}</p><p className={`text-sm transition-colors duration-300 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{d}</p></div>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ═══ HIGHLIGHTED QUOTE ══════════════════════════════════════════ */}
      <section className={`py-20 px-6 border-y transition-colors duration-300 ${isDark ? 'bg-[#05080f] border-white/5' : 'bg-white border-gray-200'}`}>
        <FadeUp className="max-w-4xl mx-auto text-center">
          <div className={`text-5xl font-black mb-6 ${isDark ? 'text-blue-900/30' : 'text-blue-200'}`}>"</div>
          <p className={`text-2xl lg:text-3xl font-black leading-tight mb-8 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Escrow BMS is the only tool I use now.
            <span className={isDark ? 'text-blue-400' : 'text-blue-755'}> Billing, payroll, inventory — everything in one place.</span> I can't imagine going back.
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-black text-sm">RK</div>
            <div className="text-left">
              <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Ravi Kapoor</p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-450'}`}>Textile Merchant, Surat</p>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ═══ HOW IT WORKS ══════════════════════════════════════════════ */}
      <section id="solutions" className={`py-24 px-6 transition-colors duration-300 border-b ${isDark ? 'bg-[#05080f] border-white/5' : 'bg-slate-50 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-blue-700 text-sm font-bold uppercase tracking-widest mb-3">How It Works</p>
            <h2 className={`text-4xl lg:text-5xl font-black tracking-tight mb-4 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Up and running in minutes
            </h2>
            <p className={`text-lg max-w-lg mx-auto transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No lengthy onboarding. Just sign up and go.</p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className={`hidden md:block absolute top-10 left-1/4 right-1/4 h-px transition-colors duration-300 ${isDark ? 'bg-gradient-to-r from-blue-600/50 via-blue-600/20 to-blue-600/50' : 'bg-gradient-to-r from-blue-300/60 via-blue-200/20 to-blue-300/60'}`} />
            {[
              { step: '01', title: 'Create account', desc: 'Sign up with email. Add company name, GST, basic details. Under 2 minutes.' },
              { step: '02', title: 'Activate modules', desc: 'Choose what you need — Billing, Payroll, Inventory, and more. Add as you grow.' },
              { step: '03', title: 'Start working', desc: 'Create your first invoice, add employees, or record stock. Dashboard goes live instantly.' },
            ].map((s, i) => (
              <FadeUp key={i} delay={i * 150}>
                <div className={`relative border rounded-2xl p-8 hover:border-blue-500/40 hover:shadow-2xl transition-all duration-300 group ${
                  isDark ? 'bg-[#0d1220] border-white/10 hover:shadow-blue-500/10' : 'bg-white border-gray-200 hover:shadow-blue-100'
                }`}>
                  <div className={`text-6xl font-black mb-4 leading-none transition-colors duration-300 ${isDark ? 'text-white/5 group-hover:text-blue-600/20' : 'text-gray-100 group-hover:text-blue-100'}`}>{s.step}</div>
                  <h3 className={`font-bold text-xl mb-3 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.title}</h3>
                  <p className={`text-sm leading-relaxed transition-colors duration-300 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{s.desc}</p>
                  {i < 2 && (
                    <div className="absolute top-1/2 -right-3 -translate-y-1/2 hidden md:block z-10">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <ChevronRight className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY CHOOSE US ══════════════════════════════════════════════ */}
      <section className={`py-24 px-6 border-y transition-colors duration-300 ${isDark ? 'bg-gray-950 border-white/5' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto">
          <FadeUp className="text-center mb-14">
            <p className="text-blue-700 text-sm font-black uppercase tracking-widest mb-3">Why Escrow BMS</p>
            <h2 className={`text-4xl lg:text-5xl font-black tracking-tight mb-4 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>Built for India. Not just adapted.</h2>
            <p className={`text-lg max-w-xl mx-auto transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-550'}`}>Most ERPs were built for Western markets. Escrow BMS was built from the ground up for Indian compliance, Indian languages, and Indian workflows.</p>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Shield, t: 'GST-first', d: 'CGST, SGST, IGST auto-applied on every invoice. E-invoice ready.', from: 'from-blue-50', border: 'border-blue-100', ic: 'bg-blue-100 text-blue-700' },
              { icon: Globe, t: 'Hindi & Gujarati', d: 'Full UI in English, Hindi, or Gujarati — switch anytime.', from: 'from-violet-50', border: 'border-violet-100', ic: 'bg-violet-100 text-violet-700' },
              { icon: Lock, t: 'Data Privacy', d: 'Your data is yours. Powered by Supabase with bank-grade security.', from: 'from-emerald-50', border: 'border-emerald-100', ic: 'bg-emerald-100 text-emerald-700' },
              { icon: Clock, t: '2-Minute Setup', d: 'No training, no IT team. Sign up and start working immediately.', from: 'from-amber-50', border: 'border-amber-100', ic: 'bg-amber-100 text-amber-700' },
            ].map((f, i) => (
              <FadeUp key={f.t} delay={i * 80}>
                <div className={`bg-gradient-to-br border rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 h-full ${
                  isDark ? 'from-[#0e1628] to-[#0c1220] border-white/5' : f.from + ' to-white border-' + f.border.split('-')[1]
                }`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${isDark ? 'bg-white/5 text-blue-400' : f.ic}`}><f.icon className="w-5 h-5" /></div>
                  <h4 className={`font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{f.t}</h4>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{f.d}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ════════════════════════════════════════════════════ */}
      <section id="pricing" className={`py-24 px-6 transition-colors duration-300 ${isDark ? 'bg-[#05080f]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <FadeUp className="text-center mb-14">
            <p className="text-blue-700 text-sm font-black uppercase tracking-widest mb-3">Pricing</p>
            <h2 className={`text-4xl lg:text-5xl font-black tracking-tight mb-4 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>Simple. Transparent. Fair.</h2>
            <p className={`text-lg max-w-lg mx-auto transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-550'}`}>Start free for 14 days. Upgrade only if you love it. No contracts.</p>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {PLANS.map((plan, i) => (
              <FadeUp key={plan.key} delay={i * 70}>
                <div className={`relative flex flex-col rounded-2xl h-full transition-all duration-300 ${
                  plan.highlight 
                    ? 'bg-blue-700 shadow-2xl shadow-blue-300/25 border-0' 
                    : isDark 
                      ? 'bg-[#0d1220] border border-white/10 hover:border-blue-500/40 hover:shadow-2xl hover:-translate-y-1.5' 
                      : 'bg-white border border-gray-200 hover:border-blue-200 hover:shadow-2xl hover:-translate-y-1.5'
                }`}>
                  {plan.badge && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-xs font-black px-4 py-1.5 rounded-full shadow-lg">{plan.badge}</span>}
                  <div className="p-7 flex flex-col flex-1">
                    <div className="mb-7">
                      <h3 className={`font-black text-xl mb-1.5 ${plan.highlight ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                      <p className={`text-xs mb-5 ${plan.highlight ? 'text-blue-200' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>{plan.desc}</p>
                      <div className="flex items-end gap-1">
                        <span className={`text-5xl font-black tracking-tight ${plan.highlight ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}`}>
                          {plan.price === 0 ? '₹0' : `₹${plan.price.toLocaleString('en-IN')}`}
                        </span>
                        <span className={`text-sm mb-2 ${plan.highlight ? 'text-blue-200' : isDark ? 'text-gray-550' : 'text-gray-450'}`}>{plan.period}</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 mb-7">
                      {ALL_MODS.map((mod, mi) => {
                        const inc = (plan as any).all || ((plan as any).modules || []).some((m: string) => mod.toLowerCase().includes(m.toLowerCase()));
                        return (
                          <div key={mod} className={`flex items-center gap-2.5 text-sm ${!inc ? 'opacity-25' : ''}`}>
                            <Check className={`w-4 h-4 flex-shrink-0 ${inc ? plan.highlight ? 'text-blue-300' : 'text-blue-700' : 'text-gray-300'}`} />
                            <span className={plan.highlight ? 'text-blue-100' : isDark ? 'text-gray-300' : 'text-gray-700'}>{mod}</span>
                          </div>
                        );
                      })}
                    </div>
                    <Link to={`/auth?plan=${plan.key}`} className={`w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                      plan.highlight 
                        ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-lg' 
                        : isDark 
                          ? 'bg-white/10 text-white hover:bg-white/20' 
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}>
                      {plan.key === 'free' ? 'Start Free Trial' : plan.key === 'enterprise' ? 'Contact Sales' : 'Get Started'}
                    </Link>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
          <FadeUp className="text-center mt-8"><p className="text-xs text-gray-400">All plans include free onboarding support · Prices exclusive of GST · Cancel anytime</p></FadeUp>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══════════════════════════════════════════════ */}
      <section id="testimonials" className={`py-24 px-6 transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-slate-50 border-b border-gray-200'}`}>
        <div className="max-w-7xl mx-auto">
          <FadeUp className="text-center mb-14">
            <p className="text-blue-700 text-sm font-black uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className={`text-4xl lg:text-5xl font-black tracking-tight mb-4 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>Loved by businesses across India.</h2>
            <p className={`text-lg max-w-lg mx-auto transition-colors duration-300 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Real owners. Real results.</p>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <FadeUp key={t.name} delay={i * 100}>
                <div className={`border rounded-2xl p-8 h-full flex flex-col hover:-translate-y-1.5 transition-all duration-300 ${
                  isDark ? 'bg-[#0d1220] border-white/10 hover:border-white/20 hover:shadow-2xl' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xl'
                }`}>
                  <div className="flex gap-1 mb-5">{[...Array(t.rating)].map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}</div>
                  <p className={`text-sm leading-relaxed mb-7 flex-1 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>"{t.text}"</p>
                  <div className={`flex items-center gap-3 pt-5 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.grad} flex items-center justify-center text-white text-sm font-black flex-shrink-0`}>{t.initials}</div>
                    <div>
                      <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.name}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-550' : 'text-gray-500'}`}>{t.role} · {t.loc}</p>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ══════════════════════════════════════════════════ */}
      <section className={`relative py-32 px-6 overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#05080f]' : 'bg-blue-700'}`}>
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full blur-3xl ${isDark ? 'bg-blue-600/15' : 'bg-blue-800/20'}`} />
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize: '80px 80px' }} />
        </div>
        <FadeUp className="relative max-w-4xl mx-auto text-center">
          <div className={`inline-flex items-center gap-2 border text-xs font-bold px-4 py-2 rounded-full mb-10 ${
            isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-600 border-blue-500 text-white'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />500+ users already on board
          </div>
          <h2 className="font-black text-white tracking-tight mb-7" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: 1.05 }}>
            Ready to simplify<br />
            <span style={{ background: isDark ? 'linear-gradient(135deg, #60a5fa, #a78bfa)' : 'linear-gradient(135deg, #ffffff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>your business?</span>
          </h2>
          <p className={`text-lg mb-12 max-w-xl mx-auto ${isDark ? 'text-gray-500' : 'text-blue-100'}`}>Join Indian businesses managing billing, payroll, inventory and more — all from one platform.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate(user ? '/dashboard' : '/auth')} className={`group inline-flex items-center gap-2.5 font-black px-8 py-4.5 rounded-xl transition-all active:scale-[0.97] text-base ${
              isDark ? 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-2xl hover:shadow-blue-500/30' : 'bg-white hover:bg-blue-50 text-blue-700 shadow-xl'
            }`}>
              Start Free — 14 Days <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link to="/auth" className={`inline-flex items-center gap-2.5 border font-semibold px-8 py-4.5 rounded-xl transition-all text-base ${
              isDark ? 'border-white/10 bg-white/5 text-gray-300 hover:text-white hover:border-white/20' : 'border-blue-500 bg-blue-800 text-white hover:bg-blue-900'
            }`}>
              Book a Demo <Phone className="w-4 h-4" />
            </Link>
          </div>
          <p className={`text-xs mt-8 ${isDark ? 'text-gray-700' : 'text-blue-200'}`}>No credit card · Cancel anytime · Free onboarding support included</p>
        </FadeUp>
      </section>

      {/* ═══ FOOTER ═════════════════════════════════════════════════════ */}
      <footer className="bg-gray-950 border-t border-white/5 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
                <span className="font-black text-white text-xl">EscrowBMS</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-5 max-w-[260px]">All-in-one business management suite built specifically for Indian SMBs.</p>
              <p className="text-xs text-gray-700">support@escrowbms.in</p>
            </div>
            {[
              { t: 'Product', ls: ['Billing & Invoices', 'Payroll', 'Account Ledger', 'Inventory', 'CRM', 'Daily Calculation'] },
              { t: 'Company', ls: ['About Us', 'Blog', 'Careers', 'Contact'] },
              { t: 'Legal', ls: ['Privacy Policy', 'Terms of Service', 'Refund Policy', 'Security'] },
            ].map(c => (
              <div key={c.t}>
                <h4 className="text-white font-bold text-sm mb-5">{c.t}</h4>
                <ul className="space-y-3">{c.ls.map(l => <li key={l}><a href="#" className="text-sm text-gray-600 hover:text-gray-300 transition-colors">{l}</a></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-700">© {new Date().getFullYear()} Escrow BMS. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/admin" className="text-xs text-gray-700 hover:text-gray-400 transition-colors">Admin Portal</Link>
              <span className="text-gray-800">·</span>
              <span className="text-xs text-gray-700">Made with ❤️ for India</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shimmer { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
      `}</style>
    </div>
  );
}
