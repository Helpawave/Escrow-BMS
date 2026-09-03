import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  ArrowRight, Check, Menu, X, ChevronDown, BarChart3, Users,
  FileText, BookOpen, Package, Calculator, TrendingUp, Shield,
  Clock, Star, ChevronRight, Zap, Globe, CheckCircle, Phone,
  Bell, Sparkles, ArrowUpRight, Lock, Receipt, PieChart, Sun, Moon,
  QrCode, Share2, Send, CreditCard, DollarSign, Building2, ShoppingBag,
  HelpCircle, UserCheck, Smartphone, Laptop, AlertCircle, RefreshCw
} from 'lucide-react';

/* ─── InView Observer Hook ───────────────────────────────────────────── */
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── Animated Number Hook ───────────────────────────────────────────── */
function useCounter(target: number, duration = 1800, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let s = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      s += step;
      if (s >= target) {
        setCount(target);
        clearInterval(id);
      } else {
        setCount(Math.floor(s));
      }
    }, 16);
    return () => clearInterval(id);
  }, [active, target, duration]);
  return count;
}

function StatCounterItem({ value, prefix = '', suffix = '', label, sublabel }: { value: number; prefix?: string; suffix?: string; label: string; sublabel?: string }) {
  const { ref, inView } = useInView();
  const c = useCounter(value, 1800, inView);
  return (
    <div ref={ref} className="text-center p-4">
      <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-display">
        {prefix}{c.toLocaleString('en-IN')}{suffix}
      </div>
      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{label}</div>
      {sublabel && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sublabel}</div>}
    </div>
  );
}

/* ─── FadeUp Wrapper ─────────────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)'
      }}
    >
      {children}
    </div>
  );
}

/* ─── Static Data ────────────────────────────────────────────────────── */
const INDUSTRIES = [
  {
    id: 'wholesale',
    name: 'Wholesale & Traders',
    icon: Building2,
    badge: 'High-Volume Billing',
    tagline: 'Manage 10,000+ line items, tiered party pricing, and instant GST invoices in 60 seconds.',
    points: ['Custom party-wise discount rates', 'Automated Khata debit/credit ledger posting', 'Multi-warehouse stock deduction on dispatch', 'Bulk WhatsApp payment reminders']
  },
  {
    id: 'retail',
    name: 'Retail & Supermarkets',
    icon: ShoppingBag,
    badge: 'Fast POS Checkout',
    tagline: 'High-speed counter billing with barcode scanning, instant thermal print, and daily cash drawer calculation.',
    points: ['Direct barcode generator & thermal receipt printing', 'Daily Hisab cashbook closing with zero mismatches', 'Low-stock automated alerts for fast-moving goods', 'Customer loyalty and phone number billing']
  },
  {
    id: 'textile',
    name: 'Textile & Garments',
    icon: Package,
    badge: 'Surat & Ludhiana Standard',
    tagline: 'Purpose-built for textile traders with meter/yard conversions, design lot tracking, and broker commission ledger.',
    points: ['Piece, Meter & Lot-wise inventory categorization', 'Agent/Broker commission automated ledger calculation', 'Delivery challan to Tax Invoice one-click conversion', 'Party ledger aging report with overdue alerts']
  },
  {
    id: 'pharma',
    name: 'Pharma & Medical',
    icon: Shield,
    badge: 'Batch & Expiry Ready',
    tagline: 'Track medicine batches, manufacturer expiry dates, and regulatory GST compliance effortlessly.',
    points: ['Batch number, manufacturing & expiry tracking', 'Expired stock quarantine and supplier returns', 'Automatic HSN & GST rate lookup for pharmaceuticals', 'E-Invoice IRN generation with QR code printing']
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing & Fab',
    icon: TrendingUp,
    badge: 'Raw Material to Finished Goods',
    tagline: 'Complete production inventory tracking, vendor purchase orders, and job-work delivery challans.',
    points: ['Raw material consumption and finished goods stock sync', 'Purchase bill registration with automatic vendor credit ledger', 'Debit note & Credit note management with GST adjustment', 'Multi-staff role access for factory, store, and accounts']
  },
  {
    id: 'services',
    name: 'Agencies & Services',
    icon: Users,
    badge: 'Recurring & Retainer Billing',
    tagline: 'Professional service invoices, price quotations, client project tracking, and automated staff payroll.',
    points: ['Price Quotations to Tax Invoices with 1 click', 'Integrated CRM for client follow-ups and deals', 'Monthly staff salary calculation and payslip generation', 'Payment links powered by UPI and Razorpay']
  }
];

const TESTIMONIALS = [
  {
    name: 'Rakesh Agarwal',
    role: 'Managing Director',
    company: 'Agarwal Textiles Ltd',
    city: 'Surat, Gujarat',
    quote: 'Hum pehle Tally aur Excel dono use karte the, jismein har roz 2-3 ghante party ledger match karne mein nikal jaate the. Escrow BMS par aane ke baad invoice bante hi party khata aur stock dono realtime update ho jaate hain.',
    metric: 'Saved 3.5 hrs/day',
    rating: 5,
    tag: 'Textile & Wholesale'
  },
  {
    name: 'Vikramjit Singh',
    role: 'Founder & CEO',
    company: 'Apex Pharma Distributors',
    city: 'Ludhiana, Punjab',
    quote: 'Batch and expiry tracking pharmaceutical business mein sabse critical hai. Escrow BMS ka E-Invoicing aur WhatsApp share feature hamare 450+ medical store clients ke payments ko 18 din mein settle karwa raha hai.',
    metric: '2.4x Faster Collections',
    rating: 5,
    tag: 'Pharma Distribution'
  },
  {
    name: 'Priya Sundaram',
    role: 'Chartered Accountant & Financial Advisor',
    company: 'Sundaram & Associates',
    city: 'Chennai / Bengaluru',
    quote: 'As a CA, month-end GSTR reconciliation was our biggest headache with client data. Escrow BMS provides 100% clean, structured books with exact CGST/SGST breakdowns and zero calculation discrepancies.',
    metric: 'Zero GST Notice Risk',
    rating: 5,
    tag: 'Chartered Accounting'
  }
];

const COMPARISON_ROWS = [
  { feature: 'Cloud Access Anywhere (Mobile + PC + Tablet)', escrow: true, tally: false, vyapar: 'Partial (Mobile Sync)', zoho: true },
  { feature: '1-Click WhatsApp Invoice with Embedded UPI QR', escrow: true, tally: false, vyapar: true, zoho: false },
  { feature: 'Integrated Khata Ledger with Realtime Settlement', escrow: true, tally: true, vyapar: false, zoho: false },
  { feature: 'Daily Cash Drawer Calculation (Hisab Log)', escrow: true, tally: false, vyapar: false, zoho: false },
  { feature: 'Staff Payroll, Attendance & Salary Slips', escrow: true, tally: 'Add-on Paid', vyapar: false, zoho: 'Separate Paid App' },
  { feature: 'Multi-User Granular Staff Permissions', escrow: true, tally: 'Expensive Multi-user', vyapar: 'Limited', zoho: true },
  { feature: 'Direct E-Invoicing & IRN Generation', escrow: true, tally: 'Complex Setup', vyapar: 'Premium Plan', zoho: true },
  { feature: 'Automatic Cloud Data Backup (Zero Data Loss)', escrow: true, tally: 'Manual Backup', vyapar: 'Manual Drive Sync', zoho: true }
];

const FAQS = [
  {
    q: 'Kya Escrow BMS se banaye gaye invoices 100% GST compliant hote hain?',
    a: 'Haan, bilkul! Escrow BMS Indian GSTN guidelines ke anusar design kiya gaya hai. Har invoice mein proper HSN/SAC codes, CGST, SGST, IGST tax breakdown, E-Invoice IRN, dynamic UPI QR code aur government compliant format automatically generate hota hai.'
  },
  {
    q: 'Kya hum Tally ya Vyapar se apna purana data Escrow BMS mein la sakte hain?',
    a: 'Haan, humara 1-Click Excel / CSV data import tool aapke saare existing clients, vendors, product master, and opening ledger balances ko 2 minute ke andar import kar deta hai. Saath hi humari onboarding team free assisted migration provide karti hai.'
  },
  {
    q: 'Kya mere staff members ke liye permissions restrict ki ja sakti hain?',
    a: 'Haan! Escrow BMS mein Role-Based Access Control hai. Aap apne sales billing staff ko sirf Invoice banane ka access de sakte hain, warehouse team ko sirf Inventory update karne ka, aur accounts ledger ya profit & loss reports sirf company owner ke liye private rakh sakte hain.'
  },
  {
    q: 'Invoice banate hi party ke WhatsApp par kaise bhejte hain?',
    a: 'Invoice create ya save karte hi aapko "Share on WhatsApp" ka 1-click button milta hai. Yeh customer ke WhatsApp par direct professional PDF invoice aur instant UPI payment link ke sath formal business message bhej deta hai.'
  },
  {
    q: 'Kya iske liye internet ya expensive hardware ki zaroorat hai?',
    a: 'Escrow BMS kisi bhi basic laptop, computer, tablet ya smartphone ke browser par fast chalta hai. Iske liye kisi heavy server ya expensive configuration ki zaroorat nahi hoti.'
  },
  {
    q: 'Kya mera business data safe aur encrypted hai?',
    a: '100% safe hai. Aapka data 256-bit bank-grade SSL encryption ke sath secure cloud servers par store hota hai jismein automatic daily backups enabled hote hain, taaki computer kharab hone par bhi aapka data hamesha surakshit rahe.'
  }
];

export default function Landing() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [activeMockTab, setActiveMockTab] = useState<'billing' | 'ledger' | 'inventory' | 'payroll'>('billing');
  const [activeIndustry, setActiveIndustry] = useState('wholesale');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Live GST Calculator Interactive State
  const [calcAmount, setCalcAmount] = useState<number>(50000);
  const [calcRate, setCalcRate] = useState<number>(18);
  const [calcType, setCalcType] = useState<'intra' | 'inter'>('intra');

  // Live ROI Calculator State
  const [roiInvoices, setRoiInvoices] = useState<number>(250);
  const [roiTeam, setRoiTeam] = useState<number>(4);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const [showAnnouncement, setShowAnnouncement] = useState(() => {
    return sessionStorage.getItem('dismiss_landing_announcement') !== 'true';
  });

  const handleDismissAnnouncement = () => {
    setShowAnnouncement(false);
    sessionStorage.setItem('dismiss_landing_announcement', 'true');
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculated values
  const taxAmount = (calcAmount * calcRate) / 100;
  const totalAmount = calcAmount + taxAmount;
  const cgstAmount = calcType === 'intra' ? taxAmount / 2 : 0;
  const sgstAmount = calcType === 'intra' ? taxAmount / 2 : 0;
  const igstAmount = calcType === 'inter' ? taxAmount : 0;

  const hoursSavedPerMonth = Math.round((roiInvoices * 8) / 60 + roiTeam * 12);
  const moneySavedPerYear = Math.round(hoursSavedPerMonth * 450 * 12);

  const handleAuthAction = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const currentInd = INDUSTRIES.find(i => i.id === activeIndustry) || INDUSTRIES[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      
      {/* ─── Top Announcement Banner with Close Button ───────────────── */}
      {showAnnouncement && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-700 to-blue-800 text-white text-xs py-2 px-4 flex items-center justify-between font-semibold tracking-wide border-b border-indigo-600/30 animate-fade-in relative z-50">
          <div className="flex-1 text-center flex items-center justify-center gap-2">
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">NEW</span>
            <span>E-Invoicing, Quotations & Multi-Staff Role Access is now live in Escrow BMS!</span>
            <button onClick={handleAuthAction} className="underline hover:text-amber-300 font-bold ml-1 hidden sm:inline cursor-pointer">
              Try 14 Days Free →
            </button>
          </div>
          <button
            onClick={handleDismissAnnouncement}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer ml-2 flex items-center justify-center shrink-0"
            title="Close banner"
            aria-label="Close announcement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Sticky Glass Navbar ──────────────────────────────────────── */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shadow-sm border-b border-slate-200/80 dark:border-slate-800/80 py-3' : 'bg-transparent py-4 sm:py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              E
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Escrow<span className="text-indigo-600 dark:text-indigo-400">BMS</span></span>
              <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest -mt-0.5">Connected ERP</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-9 text-sm font-bold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Features</a>
            <a href="#industries" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Industries</a>
            <a href="#workflow" className="hover:text-indigo-600 dark:hover:text-white transition-colors">How It Works</a>
            <a href="#calculator" className="hover:text-indigo-600 dark:hover:text-white transition-colors">GST Tool</a>
            <a href="#comparison" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Compare</a>
            <a href="#pricing" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Pricing</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <Button
                onClick={() => navigate('/dashboard')}
                className="h-11 px-6 rounded-xl font-black text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 cursor-pointer"
              >
                Go to Dashboard →
              </Button>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Button
                  onClick={handleAuthAction}
                  className="h-11 px-6 rounded-xl font-black text-sm bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-xl shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
                >
                  Start Free Trial
                </Button>
              </>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 py-5 space-y-4 shadow-xl">
            <nav className="flex flex-col gap-3 font-semibold text-sm text-slate-700 dark:text-slate-300">
              <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#industries" onClick={() => setMobileMenuOpen(false)}>Industries</a>
              <a href="#workflow" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
              <a href="#calculator" onClick={() => setMobileMenuOpen(false)}>Live GST Calculator</a>
              <a href="#comparison" onClick={() => setMobileMenuOpen(false)}>Compare vs Tally</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing Plans</a>
            </nav>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <Link to="/auth" className="w-full text-center py-2.5 font-bold text-sm text-slate-700 dark:text-slate-200 border rounded-xl">
                Log In
              </Link>
              <Button onClick={handleAuthAction} className="w-full py-2.5 font-bold text-sm bg-indigo-600 text-white rounded-xl">
                Start 14-Day Free Trial
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO SECTION (Expansive 2-Column Next-Gen Layout) ──────── */}
      <section className="relative pt-12 pb-20 lg:pt-18 lg:pb-32 overflow-hidden">
        {/* Ambient Subtle Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-gradient-to-b from-indigo-500/12 via-blue-500/6 to-transparent blur-3xl rounded-full" />
          <div className="absolute top-1/3 -right-20 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* LEFT COLUMN: PUNCHY COPY & CTAS */}
            <div className="lg:col-span-6 space-y-6 text-left">
              
              {/* Trust Pill */}
              <FadeUp delay={50}>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>India’s Most Complete Cloud Accounting Suite</span>
                  <span className="hidden sm:inline text-indigo-400 dark:text-indigo-600">|</span>
                  <span className="hidden sm:inline font-semibold text-slate-600 dark:text-slate-300">Zero Setup Fees</span>
                </div>
              </FadeUp>

              {/* Main Headline */}
              <FadeUp delay={100}>
                <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12] font-display">
                  Create GST Invoices in 60s.<br />
                  <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-500 bg-clip-text text-transparent">
                    Your Ledgers Auto-Post
                  </span> & Settle.
                </h1>
              </FadeUp>

              {/* Sub-headline */}
              <FadeUp delay={150}>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium max-w-xl">
                  Eliminate manual double-entry. Create compliant tax invoices, share instantly on WhatsApp with UPI links, manage multi-warehouse inventory, and calculate staff payroll in one unified platform.
                </p>
              </FadeUp>

              {/* CTAs */}
              <FadeUp delay={200}>
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  <Button
                    onClick={handleAuthAction}
                    className="w-full sm:w-auto h-13 px-8 text-base font-black rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-xl shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Start 14-Day Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <a
                    href="#features"
                    className="w-full sm:w-auto h-13 px-6 rounded-2xl font-bold text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Explore All 6 Modules</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </a>
                </div>
              </FadeUp>

              {/* Trust Checkmarks */}
              <FadeUp delay={250}>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-2">
                  <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> 100% GSTN Compliant</span>
                  <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> No Credit Card Required</span>
                  <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> 1-Click Tally / Excel Import</span>
                  <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> Multi-Staff Role Access</span>
                </div>
              </FadeUp>
            </div>

            {/* RIGHT COLUMN: INTERACTIVE BROWSER WINDOW MOCKUP FRAME */}
            <div className="lg:col-span-6">
              <FadeUp delay={300}>
                <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xl shadow-indigo-900/10 dark:shadow-black/60 overflow-hidden backdrop-blur-xl">
                  
                  {/* Browser Window Header */}
                  <div className="bg-slate-100/90 dark:bg-slate-950 px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                      <div className="ml-2 px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-500" />
                        <span>app.escrowbms.in</span>
                      </div>
                    </div>

                    {/* Mockup Tab Selector */}
                    <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-900 p-1 rounded-xl">
                      <button
                        onClick={() => setActiveMockTab('billing')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${activeMockTab === 'billing' ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                      >
                        🧾 Invoice
                      </button>
                      <button
                        onClick={() => setActiveMockTab('ledger')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${activeMockTab === 'ledger' ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                      >
                        📖 Ledger
                      </button>
                      <button
                        onClick={() => setActiveMockTab('inventory')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${activeMockTab === 'inventory' ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                      >
                        📦 Stock
                      </button>
                      <button
                        onClick={() => setActiveMockTab('payroll')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${activeMockTab === 'payroll' ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                      >
                        👥 Payroll
                      </button>
                    </div>
                  </div>

                  {/* Mockup Tab Body Content */}
                  <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-950/40">
                  
                  {/* TAB 1: GST BILLING PREVIEW */}
                  {activeMockTab === 'billing' && (
                    <div className="space-y-4">
                      {/* Top Metric Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">This Month Sales</div>
                          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹8,42,300</div>
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs last month
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Receivables</div>
                          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">₹1,94,500</div>
                          <div className="text-xs text-slate-500 mt-1">4 parties pending follow-up</div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">GSTR-1 Liability</div>
                          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">₹1,28,450</div>
                          <div className="text-xs font-bold text-emerald-600 mt-1">✓ Reconciled & Ready to file</div>
                        </div>
                      </div>

                      {/* Live Generated Invoice Sample */}
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              TAX INVOICE · GST READY
                            </span>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">INV-2026-0842 · Radhe Krishna Enterprises (Surat)</h4>
                            <p className="text-xs text-slate-500">GSTIN: 24AAACR4829K1Z4 · Issue Date: 03 Sep 2026</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold">
                              ✓ Paid via UPI
                            </span>
                            <button className="px-3 py-1 bg-[#25D366] text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer">
                              <Share2 className="w-3.5 h-3.5" /> Shared on WhatsApp
                            </button>
                          </div>
                        </div>

                        {/* Invoice Table Items */}
                        <div className="overflow-x-auto text-xs font-medium">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                                <th className="pb-2">Item Description</th>
                                <th className="pb-2">HSN</th>
                                <th className="pb-2">Qty</th>
                                <th className="pb-2">Rate</th>
                                <th className="pb-2">GST Rate</th>
                                <th className="pb-2 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                              <tr>
                                <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">Cotton Printed Fabric (L-42)</td>
                                <td className="py-2.5 text-slate-500 font-mono">5208</td>
                                <td className="py-2.5">250 Mtr</td>
                                <td className="py-2.5">₹140</td>
                                <td className="py-2.5"><span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">5% GST</span></td>
                                <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">₹36,750</td>
                              </tr>
                              <tr>
                                <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">Embroidery Lace Border</td>
                                <td className="py-2.5 text-slate-500 font-mono">5808</td>
                                <td className="py-2.5">60 Pcs</td>
                                <td className="py-2.5">₹180</td>
                                <td className="py-2.5"><span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">12% GST</span></td>
                                <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">₹12,096</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Invoice Summary */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                          <div className="w-64 space-y-1 text-xs">
                            <div className="flex justify-between text-slate-500">
                              <span>Taxable Amount:</span>
                              <span>₹45,800.00</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                              <span>CGST + SGST:</span>
                              <span>₹3,046.00</span>
                            </div>
                            <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-1 border-t">
                              <span>Grand Total:</span>
                              <span className="text-indigo-600 dark:text-indigo-400">₹48,846.00</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PARTY LEDGER KHATA */}
                  {activeMockTab === 'ledger' && (
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                        <div className="flex flex-col sm:flex-row justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400">Customer Statement</span>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">Mehta Garments & Sons · Statement of Account</h4>
                            <p className="text-xs text-slate-500">Ledger Group: Sundry Debtors · Balance: <span className="font-bold text-amber-600">₹1,45,200 (Dr)</span></p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg cursor-pointer">
                              + Add Credit/Debit Entry
                            </button>
                            <button className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg cursor-pointer">
                              Settle Balance
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto text-xs mt-3">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="text-slate-400 uppercase text-[10px] border-b">
                                <th className="pb-2">Date</th>
                                <th className="pb-2">Voucher / Remarks</th>
                                <th className="pb-2">Type</th>
                                <th className="pb-2 text-right">Debit (₹)</th>
                                <th className="pb-2 text-right">Credit (₹)</th>
                                <th className="pb-2 text-right">Balance (₹)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                              <tr>
                                <td className="py-2.5 text-slate-500">28 Aug 2026</td>
                                <td className="py-2.5 font-bold">Tax Invoice INV-2026-0798 (Goods Sold)</td>
                                <td className="py-2.5"><span className="text-blue-600 font-bold">Invoice</span></td>
                                <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">₹1,95,200</td>
                                <td className="py-2.5 text-right text-slate-400">-</td>
                                <td className="py-2.5 text-right font-bold text-amber-600">₹1,95,200 Dr</td>
                              </tr>
                              <tr>
                                <td className="py-2.5 text-slate-500">01 Sep 2026</td>
                                <td className="py-2.5 font-bold">Bank Transfer (NEFT Ref: 89410294)</td>
                                <td className="py-2.5"><span className="text-emerald-600 font-bold">Payment</span></td>
                                <td className="py-2.5 text-right text-slate-400">-</td>
                                <td className="py-2.5 text-right font-bold text-emerald-600">₹50,000</td>
                                <td className="py-2.5 text-right font-bold text-amber-600">₹1,45,200 Dr</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: INVENTORY CATALOG */}
                  {activeMockTab === 'inventory' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                          <div className="text-xs text-slate-400 font-bold uppercase">Total SKUs</div>
                          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">1,248</div>
                          <div className="text-xs text-slate-500 mt-0.5">Across 2 Warehouses</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                          <div className="text-xs text-slate-400 font-bold uppercase">Low Stock Alerts</div>
                          <div className="text-2xl font-black text-red-500 mt-1">3 Items</div>
                          <div className="text-xs text-red-500 font-bold mt-0.5">Reorder immediately</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                          <div className="text-xs text-slate-400 font-bold uppercase">Inventory Valuation</div>
                          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">₹42,18,500</div>
                          <div className="text-xs text-emerald-500 font-bold mt-0.5">FIFO Stock Engine</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: STAFF & PAYROLL */}
                  {activeMockTab === 'payroll' && (
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                        <div className="flex justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400">Payroll Calculation</span>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">August 2026 Salary Slips · 12 Employees</h4>
                          </div>
                          <button className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg cursor-pointer">
                            1-Click WhatsApp Payslips
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-3">
                          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                            <div className="text-slate-400 font-bold">Gross Salary</div>
                            <div className="text-base font-black text-slate-900 dark:text-white mt-1">₹3,48,000</div>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                            <div className="text-slate-400 font-bold">PF + ESI Deductions</div>
                            <div className="text-base font-black text-red-500 mt-1">₹38,280</div>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                            <div className="text-slate-400 font-bold">Attendance Average</div>
                            <div className="text-base font-black text-emerald-600 mt-1">96.4%</div>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                            <div className="text-slate-400 font-bold">Net Disbursed</div>
                            <div className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-1">₹3,09,720</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>

      {/* ─── METRIC STAT STRIP ───────────────────────────────────────── */}
      <section className="bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-slate-800">
            <StatCounterItem value={120} prefix="₹" suffix="Cr+" label="Transactions Tracked" sublabel="Across 28 Indian States" />
            <StatCounterItem value={50000} suffix="+" label="Invoices & Bills Created" sublabel="GST & E-Invoice Compliant" />
            <StatCounterItem value={80} suffix="%" label="Faster Invoice Creation" sublabel="Under 60 seconds per bill" />
            <StatCounterItem value={99.99} suffix="%" label="System Reliability" sublabel="Bank-Grade Cloud Uptime" />
          </div>
        </div>
      </section>

      {/* ─── THE REAL COST OF OUTDATED SOFTWARE (Problem Agitation) ─── */}
      <section className="py-20 lg:py-28 bg-slate-100/60 dark:bg-slate-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-3.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider border border-red-200 dark:border-red-900">
              The Cost of Manual Accounting Chaos
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight font-display">
              Indian SMBs lose 8–12 hours weekly and lakhs of rupees to outdated desktop tools.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium">
              Tally files corrupting, WhatsApp payment reminders forgotten, and CA notices due to manual tax mismatches. Escrow BMS is built to solve this exact chaos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FadeUp delay={50}>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-500 flex items-center justify-center mb-6">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Manual Invoicing Wastes Hours</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Typing HSN codes by hand, calculating CGST/SGST on paper, and manual double-entry into separate khata books costs your team 2 entire working days every month.
                </p>
              </div>
            </FadeUp>

            <FadeUp delay={100}>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mb-6">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Tax Errors Trigger GST Notices</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  A wrong tax rate on inter-state billing or a mismatch between GSTR-1 and GSTR-3B leads to heavy department penalties. 63% of SMBs receive avoidable GST notices.
                </p>
              </div>
            </FadeUp>

            <FadeUp delay={150}>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-500 flex items-center justify-center mb-6">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Chasing Overdue Khata Kills Cash Flow</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Invoices sent without instant UPI QR links take an average of 42 days to collect. With automated WhatsApp links, collection drops to 18 days.
                </p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ─── THE 6 CORE MODULES (Exact Escrow BMS Suite) ─────────────── */}
      <section id="features" className="py-20 lg:py-28 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider border border-indigo-200 dark:border-indigo-900">
              The Connected ERP Suite
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight font-display">
              Everything Your Business Needs. Zero Fluff.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium">
              Six tightly integrated modules designed specifically for Indian retail, wholesale, distribution, and manufacturing businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* MODULE 1: GST BILLING & INVOICES */}
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-lg transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    GST & E-Invoice
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">GST Invoicing & Billing</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Create compliant B2B/B2C Tax Invoices, Quotations, Ledger Bills, and Purchase Invoices in 60s. Auto-calculates CGST, SGST, and IGST with instant WhatsApp PDF sharing and UPI QR payments.
                </p>
                <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-800/80 pt-4">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Sales Tax Invoices & Quotations</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 1-Click WhatsApp PDF + UPI QR</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Purchase Invoices & Vendor Expenses</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> E-Invoices & E-Way Bills (IRN Ready)</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 flex justify-between items-center">
                <Link
                  to={user ? "/billing/invoices" : "/auth"}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                >
                  <span>Explore Invoicing</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* MODULE 2: ACCOUNT LEDGER & KHATA */}
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-lg transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    Double-Entry Khata
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Party Ledger & Khatabook</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Automated double-entry customer & vendor ledgers. Every invoice and payment automatically updates running balances with zero manual accounting errors.
                </p>
                <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-800/80 pt-4">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Customer & Vendor Running Khata</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Real-time Balance Sheet & P&L</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Bank & Cash Transfer Contra Entries</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 1-Click Statement WhatsApp Share</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 flex justify-between items-center">
                <Link
                  to={user ? "/ledger" : "/auth"}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                >
                  <span>Explore Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* MODULE 3: DAILY HISAB & CASH CALCULATION */}
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500/50 hover:shadow-lg transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Counter Cashbook
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Daily Hisab & Denominations</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  End-of-day cash drawer closing tool. Enter physical currency counts (₹500, ₹200, ₹100 notes & coins) and instantly match against actual counter sales.
                </p>
                <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-800/80 pt-4">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Currency Note Denomination Counter</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Cash In & Cash Out Drawer Log</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Day-End Discrepancy Reconciliation</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Daily Hisab Summary & Export</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 flex justify-between items-center">
                <Link
                  to={user ? "/calculation" : "/auth"}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                >
                  <span>Explore Daily Hisab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* MODULE 4: INVENTORY & BARCODE SCANNER */}
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-lg transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                    <Package className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Barcode & Stock
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Stock & Inventory Engine</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Know your live stock quantities across products. Generate barcode stickers, scan items using your camera or handheld scanner, and receive low-stock alerts.
                </p>
                <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-800/80 pt-4">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Product Master with HSN & Tax Rates</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Barcode Generator & Camera Scanner</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Automated Low-Stock Warning Badges</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Stock Batch Adjustment History</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 flex justify-between items-center">
                <Link
                  to={user ? "/inventory/products" : "/auth"}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                >
                  <span>Explore Inventory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* MODULE 5: STAFF PAYROLL & ATTENDANCE */}
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 hover:border-purple-500/50 hover:shadow-lg transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    Staff & Salaries
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Payroll & Attendance</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Track employee attendance, manage leaves, calculate monthly salaries with allowances and deductions, and issue professional payslips with 1-click WhatsApp delivery.
                </p>
                <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-800/80 pt-4">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Employee Directory & Documents</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Attendance & Leave Tracking</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Salary Calculation & Deductions</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> PDF Payslip Generator & WhatsApp Delivery</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 flex justify-between items-center">
                <Link
                  to={user ? "/payroll/payroll" : "/auth"}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                >
                  <span>Explore Payroll</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* MODULE 6: CRM & LEAD PIPELINE + STAFF ACCESS */}
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 hover:border-rose-500/50 hover:shadow-lg transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                    CRM & Staff Roles
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">CRM & Multi-Staff Roles</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Track client leads across pipeline stages, manage interaction history, and invite staff members with granular permissions (Billing, Inventory, Accountant, Admin).
                </p>
                <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-800/80 pt-4">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Visual Kanban Lead Pipeline</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Client Contacts & Follow-Up Tasks</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Role-Based Granular Staff Access</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 1-Click WhatsApp Staff Credentials</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 flex justify-between items-center">
                <Link
                  to={user ? "/crm" : "/auth"}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                >
                  <span>Explore CRM & Members</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (3-Step Connected Engine) ──────────────────── */}
      <section id="workflow" className="py-20 lg:py-28 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider border border-indigo-200 dark:border-indigo-900">
              The 1-Click Connected Engine
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight font-display">
              Three simple steps from invoice creation to bank settlement.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium">
              Every action in Escrow BMS triggers automatic background updates across all your books.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                01
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create & Customize</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Select your party, add line items from catalog or barcode scanner. Auto-fills HSN codes, calculates CGST/SGST/IGST, and prepares the official GST invoice in 60s.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                02
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">1-Click WhatsApp & Collect</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Instant branded PDF with dynamic UPI QR code delivered directly to your customer's WhatsApp. Customers can pay via GPay, PhonePe, Paytm, or Net Banking.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                03
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Auto-Post & Settle</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                The moment you invoice, the party ledger is debited, inventory stock is reduced, and GSTR-1 returns are prepared. Month-end close happens in minutes, not days.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LIVE INTERACTIVE GST & ROI CALCULATOR TOOLS ─────────────── */}
      <section id="calculator" className="py-20 lg:py-28 bg-slate-100/70 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider border border-emerald-200 dark:border-emerald-900">
              Interactive Tools
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight font-display">
              Calculate Your GST & Business Time Savings Live
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* TOOL 1: INSTANT GST TAX CALCULATOR */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live GST Calculator</h3>
                  <p className="text-xs text-slate-500">Calculate CGST, SGST, IGST & Total Invoice Amount</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Taxable Bill Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-lg font-black font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Supply Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCalcType('intra')}
                      className={`h-10 text-xs font-bold rounded-xl border cursor-pointer ${calcType === 'intra' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                    >
                      Intra-State (CGST + SGST)
                    </button>
                    <button
                      onClick={() => setCalcType('inter')}
                      className={`h-10 text-xs font-bold rounded-xl border cursor-pointer ${calcType === 'inter' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                    >
                      Inter-State (IGST)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    GST Slab Rate
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 12, 18, 28].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setCalcRate(rate)}
                        className={`h-10 text-xs font-black rounded-xl border cursor-pointer ${calcRate === rate ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculation Breakdown Output */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs font-medium">
                  {calcType === 'intra' ? (
                    <>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>CGST ({calcRate / 2}%):</span>
                        <span className="font-bold text-slate-900 dark:text-white">₹{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>SGST ({calcRate / 2}%):</span>
                        <span className="font-bold text-slate-900 dark:text-white">₹{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>IGST ({calcRate}%):</span>
                      <span className="font-bold text-slate-900 dark:text-white">₹{igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                    <span>Total GST Amount:</span>
                    <span className="text-emerald-600">₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-indigo-600 dark:text-indigo-400 pt-1">
                    <span>Total Invoice Value:</span>
                    <span>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TOOL 2: BUSINESS ROI & TIME SAVINGS SIMULATOR */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">ROI & Time Saved Simulator</h3>
                  <p className="text-xs text-slate-500">Calculate how many hours and ₹ Escrow BMS saves your team</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                    <span>Monthly Invoices & Bills:</span>
                    <span className="text-indigo-600 font-mono text-sm font-black">{roiInvoices} bills</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={1500}
                    step={10}
                    value={roiInvoices}
                    onChange={(e) => setRoiInvoices(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                    <span>Accounting & Billing Team Members:</span>
                    <span className="text-indigo-600 font-mono text-sm font-black">{roiTeam} staff</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={25}
                    step={1}
                    value={roiTeam}
                    onChange={(e) => setRoiTeam(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Savings Outputs */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-center">
                    <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">Hours Saved / Month</div>
                    <div className="text-3xl font-black text-indigo-900 dark:text-indigo-200 mt-1 font-display">
                      {hoursSavedPerMonth} hrs
                    </div>
                    <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">~{Math.round(hoursSavedPerMonth / 8)} full working days</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-center">
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">Est. Annual Value Saved</div>
                    <div className="text-3xl font-black text-emerald-900 dark:text-emerald-200 mt-1 font-display">
                      ₹{(moneySavedPerYear / 1000).toFixed(0)}k+
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">In staff time & CA fees</div>
                  </div>
                </div>

                <Button
                  onClick={handleAuthAction}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-md cursor-pointer"
                >
                  Start Saving Time with Escrow BMS →
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── INDUSTRY WORKFLOWS SWITCHER ─────────────────────────────── */}
      <section id="industries" className="py-20 lg:py-28 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider border border-indigo-200 dark:border-indigo-900">
              Tailored by Sector
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight font-display">
              Customized for Your Exact Industry Workflow
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium">
              From textile merchants in Surat to pharma distributors in Delhi, Escrow BMS adapts to your business needs.
            </p>
          </div>

          {/* Industry Tab Buttons */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 scrollbar-none">
            {INDUSTRIES.map((ind) => {
              const Icon = ind.icon;
              return (
                <button
                  key={ind.id}
                  onClick={() => setActiveIndustry(ind.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer border ${activeIndustry === ind.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{ind.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Industry Card */}
          <div className="mt-8 bg-slate-50 dark:bg-slate-950 p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                {currentInd.badge}
              </span>
              <span className="text-xs font-semibold text-slate-400">Industry-Optimized</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-display mb-3">
              {currentInd.tagline}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              {currentInd.points.map((pt, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <Button onClick={handleAuthAction} className="h-11 px-6 font-bold bg-indigo-600 text-white rounded-xl shadow-md cursor-pointer">
                Get Started for {currentInd.name} →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMPETITOR COMPARISON TABLE (Escrow vs Tally vs Vyapar vs Zoho) ─ */}
      <section id="comparison" className="py-20 lg:py-28 bg-slate-100/60 dark:bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-3.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider border border-purple-200 dark:border-purple-900">
              Clear Comparison
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight font-display">
              Why Indian SMBs Switch to Escrow BMS
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium">
              See how Escrow BMS compares against legacy desktop accounting tools and generic billing apps.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-lg overflow-hidden max-w-5xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4 sm:p-5 font-bold text-slate-600 dark:text-slate-400">Features & Capabilities</th>
                    <th className="p-4 sm:p-5 font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 text-center">
                      ⚡ Escrow BMS
                    </th>
                    <th className="p-4 sm:p-5 font-bold text-slate-500 text-center">Tally Prime</th>
                    <th className="p-4 sm:p-5 font-bold text-slate-500 text-center">Vyapar App</th>
                    <th className="p-4 sm:p-5 font-bold text-slate-500 text-center">Zoho Books</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 sm:p-5 font-semibold text-slate-800 dark:text-slate-200">{row.feature}</td>
                      <td className="p-4 sm:p-5 text-center bg-indigo-50/30 dark:bg-indigo-950/20 font-bold text-emerald-600">
                        {row.escrow === true ? '✓ Full Included' : row.escrow}
                      </td>
                      <td className="p-4 sm:p-5 text-center text-slate-500">
                        {row.tally === true ? '✓ Yes' : row.tally === false ? '✗ No' : row.tally}
                      </td>
                      <td className="p-4 sm:p-5 text-center text-slate-500">
                        {row.vyapar === true ? '✓ Yes' : row.vyapar === false ? '✗ No' : row.vyapar}
                      </td>
                      <td className="p-4 sm:p-5 text-center text-slate-500">
                        {row.zoho === true ? '✓ Yes' : row.zoho === false ? '✗ No' : row.zoho}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INTEGRATED PRICING PLANS SECTION ──────────────────────── */}
      <section id="pricing" className="py-20 lg:py-28 bg-slate-100/70 dark:bg-slate-950/80 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-3.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider border border-indigo-200 dark:border-indigo-900">
              Simple Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight font-display">
              Plans Built for Growing Indian Businesses
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium">
              Start with a 14-day full-access free trial. No credit card required. Cancel anytime.
            </p>

            {/* Monthly / Yearly Switcher */}
            <div className="mt-8 inline-flex items-center gap-3 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  billingCycle === 'yearly'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Annual Billing</span>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                  20% OFF
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            
            {/* TIER 1: STARTER */}
            <div className="rounded-3xl p-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Starter Plan</h3>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Retail & Billing
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Best for retail shops and small distributors needing fast GST billing and daily cash counter hisab.
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">
                    {billingCycle === 'yearly' ? '₹799' : '₹999'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">/ month</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {billingCycle === 'yearly' ? 'Billed ₹9,588 annually' : 'Billed monthly'}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">What's Included:</div>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                    <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> Unlimited GST Tax Invoices</li>
                    <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> 1-Click WhatsApp Invoice & UPI QR</li>
                    <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> Daily Counter Hisab & Denominations</li>
                    <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> Up to 2 Staff / Cashier Users</li>
                    <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> Cloud Automatic Daily Backup</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={handleAuthAction}
                  className="w-full h-12 rounded-xl font-bold text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Start 14-Day Free Trial
                </Button>
              </div>
            </div>

            {/* TIER 2: GROWTH (FEATURED) */}
            <div className="rounded-3xl p-8 bg-gradient-to-b from-indigo-900/10 via-white to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 border-2 border-indigo-600 dark:border-indigo-500 flex flex-col justify-between shadow-xl shadow-indigo-600/10 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                ⭐ Most Popular
              </div>

              <div>
                <div className="flex items-center justify-between mt-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Growth Plan</h3>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    Complete Ledger & Stock
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Complete accounting, party ledger balance statements, and multi-warehouse stock for wholesalers & traders.
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">
                    {billingCycle === 'yearly' ? '₹1,999' : '₹2,499'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">/ month</span>
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                  {billingCycle === 'yearly' ? 'Save ₹6,000 annually (₹23,988/yr)' : 'Billed monthly'}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Everything in Starter, plus:</div>
                  <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium">
                    <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> <strong>Party Ledger Khata</strong> & Running Balance</li>
                    <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> <strong>Multi-Warehouse Stock</strong> & Low Stock Alerts</li>
                    <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> Camera & Hardware <strong>Barcode Scanner</strong></li>
                    <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> Quotations, Proforma & Purchase Bills</li>
                    <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> Up to 10 Staff Roles with Permissions</li>
                    <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> Profit & Loss & 1-Click GSTR-1 JSON Export</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={handleAuthAction}
                  className="w-full h-12 rounded-xl font-black text-sm bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
                >
                  Start 14-Day Free Trial →
                </Button>
              </div>
            </div>

            {/* TIER 3: ENTERPRISE */}
            <div className="rounded-3xl p-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Enterprise Plan</h3>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    All-in-One Cloud ERP
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Full ERP suite for manufacturers and large enterprises needing Staff Payroll, CRM, and unlimited team members.
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">
                    {billingCycle === 'yearly' ? '₹3,999' : '₹4,999'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">/ month</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {billingCycle === 'yearly' ? 'Billed ₹47,988 annually' : 'Billed monthly'}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Everything in Growth, plus:</div>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                    <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> <strong>Staff Attendance & Payroll Calculation</strong></li>
                    <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> 1-Click WhatsApp Salary Slip Delivery</li>
                    <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> <strong>CRM & Visual Kanban Sales Pipeline</strong></li>
                    <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> Unlimited Multi-Staff User Accounts</li>
                    <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> Dedicated Account Manager & 24/7 Phone Support</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={handleAuthAction}
                  className="w-full h-12 rounded-xl font-bold text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Start 14-Day Free Trial
                </Button>
              </div>
            </div>

          </div>

          {/* Trust Guarantees */}
          <div className="mt-12 text-center flex flex-wrap items-center justify-center gap-8 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-indigo-500" /> 100% Bank-Grade Data Encryption</span>
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-500" /> 14-Day Full-Access Free Trial</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> No Credit Card Required</span>
          </div>

        </div>
      </section>

      {/* ─── REAL CUSTOMER TESTIMONIALS ──────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-3.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider border border-amber-200 dark:border-amber-900">
              Customer Stories
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight font-display">
              Trusted by Hundreds of Indian Enterprises
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <FadeUp key={idx} delay={idx * 80}>
                <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between h-full shadow-xs hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400" />
                        ))}
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {t.metric}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      "{t.quote}"
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-bold text-sm flex items-center justify-center">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.role}, {t.company}</div>
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">{t.city}</div>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FREQUENTLY ASKED QUESTIONS (Accordion) ──────────────────── */}
      <section className="py-20 lg:py-28 bg-slate-100/60 dark:bg-slate-950/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider border border-indigo-200 dark:border-indigo-900">
              FAQs
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-4 tracking-tight font-display">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA SECTION ───────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950">
            Instant 14-Day Free Access
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight font-display max-w-3xl mx-auto">
            Ready to Streamline Your Invoicing, Ledgers & Payroll?
          </h2>
          <p className="text-base sm:text-lg text-indigo-200 max-w-xl mx-auto font-medium">
            Join hundreds of forward-thinking Indian businesses. Setup takes less than 60 seconds with zero credit card required.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={handleAuthAction}
              className="h-14 px-10 text-base font-black rounded-2xl bg-white text-indigo-900 hover:bg-slate-100 shadow-xl shadow-black/20 cursor-pointer active:scale-95 transition-transform"
            >
              Start Your Free Trial Now →
            </Button>
            <Link
              to="/pricing"
              className="h-14 px-8 rounded-2xl font-bold text-sm text-white bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors"
            >
              View Transparent Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ─── ENTERPRISE FOOTER ───────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8">
          
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg">
                E
              </div>
              <span className="text-lg font-black tracking-tight text-white">Escrow<span className="text-indigo-400">BMS</span></span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              India's all-in-one connected cloud ERP and GST billing suite. Powering invoicing, khatabook ledger, inventory, and staff payroll for modern enterprises.
            </p>
            <div className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} Escrow BMS Technologies Pvt Ltd. All rights reserved.
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase text-white tracking-wider mb-3">Product Suite</h4>
            <ul className="space-y-2">
              <li><Link to="/billing/invoices" className="hover:text-white">GST Invoicing</Link></li>
              <li><Link to="/billing/quotations" className="hover:text-white">Price Quotations</Link></li>
              <li><Link to="/billing/e-invoice" className="hover:text-white">E-Invoices & IRN</Link></li>
              <li><Link to="/ledger" className="hover:text-white">Account Ledgers</Link></li>
              <li><Link to="/inventory/products" className="hover:text-white">Stock Inventory</Link></li>
              <li><Link to="/payroll/payroll" className="hover:text-white">Staff Payroll</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase text-white tracking-wider mb-3">Industries</h4>
            <ul className="space-y-2">
              <li><a href="#industries" className="hover:text-white">Wholesale & Trade</a></li>
              <li><a href="#industries" className="hover:text-white">Retail & Supermarkets</a></li>
              <li><a href="#industries" className="hover:text-white">Textile & Garments</a></li>
              <li><a href="#industries" className="hover:text-white">Pharma & Healthcare</a></li>
              <li><a href="#industries" className="hover:text-white">Manufacturing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase text-white tracking-wider mb-3">Legal & Trust</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
              <li><Link to="/refund" className="hover:text-white">Refund Policy</Link></li>
              <li><Link to="/pricing" className="hover:text-white">Pricing & Plans</Link></li>
              <li><Link to="/contact" className="hover:text-white">Support Helpdesk</Link></li>
            </ul>
          </div>

        </div>
      </footer>

    </div>
  );
}

function Button({ children, className = '', ...props }: any) {
  return (
    <button
      className={`inline-flex items-center justify-center transition-all ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
