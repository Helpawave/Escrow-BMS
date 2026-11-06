import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Footer from '@/components/Footer';
import PublicNavbar from '@/components/PublicNavbar';
import { WhatsAppChatWidget } from '@/components/WhatsAppChatWidget';
import {
  ArrowRight, Check, Menu, X, ChevronDown, BarChart3, Users,
  FileText, BookOpen, Package, Calculator, TrendingUp, Shield,
  Clock, Star, ChevronRight, Zap, Globe, CheckCircle, Phone,
  Bell, Sparkles, ArrowUpRight, Lock, Receipt, PieChart, Sun, Moon,
  QrCode, Share2, Send, CreditCard, DollarSign, Building2, ShoppingBag,
  HelpCircle, UserCheck, Smartphone, Laptop, AlertCircle, RefreshCw,
  Sliders, Layers, CheckCheck, Landmark, Barcode, Eye, FileSpreadsheet,
  Headphones, Play, Award, CheckCircle2
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
function useCounter(target: number, duration = 1600, active = false) {
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
  }, [target, duration, active]);
  return count;
}

function StatCounterItem({
  value,
  prefix = '',
  suffix = '',
  label,
  sublabel
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  sublabel: string;
}) {
  const { ref, inView } = useInView(0.3);
  const count = useCounter(value, 1600, inView);

  return (
    <div ref={ref} className="p-4 sm:p-6 text-center group">
      <div className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-display transition-transform duration-300 group-hover:scale-105">
        {prefix}{count.toLocaleString('en-IN')}{suffix}
      </div>
      <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 mt-2">
        {label}
      </div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
        {sublabel}
      </div>
    </div>
  );
}

/* ─── FadeUp Wrapper ─────────────────────────────────────────────────── */
function FadeUp({
  children,
  delay = 0,
  className = ''
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)'
      }}
    >
      {children}
    </div>
  );
}

/* ─── Static Data ────────────────────────────────────────────────────── */
const CORE_SERVICES = [
  {
    id: 'billing',
    badge: 'Core Engine',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    title: 'GST Invoicing & Billing',
    desc: 'Generate 100% compliant B2B/B2C tax invoices, delivery challans, and quotations in 60s with instant WhatsApp sharing & UPI QR code.',
    icon: Receipt,
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    features: [
      'B2B / B2C Tax Invoices & Quotations',
      'Dynamic UPI QR Code for instant payments',
      'Thermal (2"/3") & Full A4/A5 Print Layouts',
      'Custom discount rules & multi-tax rates'
    ],
    link: '/billing/invoices'
  },
  {
    id: 'einvoice',
    badge: 'Govt Compliant',
    badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    title: 'E-Invoice & E-Way Bill',
    desc: 'Direct NIC government portal compliance. Generate IRN numbers, signed QR codes, and E-Way Bills in 1-click without double entry.',
    icon: QrCode,
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    features: [
      'Direct NIC E-Invoice IRN & QR generation',
      'Automated E-Way Bill generation on dispatch',
      'Part-A and Part-B vehicle number updates',
      'Government schema valid JSON/PDF exports'
    ],
    link: '/billing/e-invoice'
  },
  {
    id: 'ledger',
    badge: 'Automated',
    badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    title: 'Party Khata & Ledgers',
    desc: 'Automated double-entry accounting. Invoices and payments instantly post to customer & vendor running khata with zero manual data entry.',
    icon: BookOpen,
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    features: [
      'Real-time customer & vendor running ledgers',
      'Debit/Credit auto-posting upon invoice creation',
      '1-Click WhatsApp ledger statement dispatch',
      'Contra entries (Bank to Cash / Bank to Bank)'
    ],
    link: '/ledger'
  },
  {
    id: 'inventory',
    badge: 'Multi-Godown',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    title: 'Inventory & Barcodes',
    desc: 'Live stock quantities across multi-warehouses. Auto-deduction on dispatch, barcode generator, camera scanning, and low stock warnings.',
    icon: Package,
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    features: [
      'Multi-warehouse real-time stock balance',
      'Built-in Barcode label generator & camera scanner',
      'Batch number & manufacturer expiry tracking',
      'Low-stock automated alerts & reorder reminders'
    ],
    link: '/inventory/products'
  },
  {
    id: 'payroll',
    badge: 'HR Compliance',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    title: 'Staff Payroll & Attendance',
    desc: 'Track daily attendance, calculate monthly wages with allowances and PF/ESI deductions, and dispatch salary slips directly on WhatsApp.',
    icon: Users,
    iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    features: [
      'Staff attendance tracking & leave management',
      'Automated salary computation with deductions',
      '1-Click WhatsApp digital payslip delivery',
      'Role-based granular staff permission control'
    ],
    link: '/payroll/payroll'
  },
  {
    id: 'hisab',
    badge: 'Cash Register',
    badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    title: 'Daily Hisab & Cashbook',
    desc: 'End-of-day counter closing tool. Enter physical note counts (₹500, ₹200, ₹100) to instantly detect discrepancies between cash in drawer and billing.',
    icon: Calculator,
    iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    features: [
      'Physical currency note denomination calculator',
      'Daily cash drawer in & out reconciliation',
      'Petty cash voucher & expense tracking',
      'Daily closing summary export & WhatsApp backup'
    ],
    link: '/calculation'
  },
  {
    id: 'crm',
    badge: 'Sales Growth',
    badgeColor: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    title: 'CRM & Client Pipeline',
    desc: 'Track customer inquiries, follow-up calls, and conversion stages. Turn approved quotations into tax invoices with a single click.',
    icon: UserCheck,
    iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    features: [
      'Visual deal stage pipeline & client directory',
      '1-Click Quotation to Tax Invoice conversion',
      'Client interaction notes & task reminders',
      'Customer payment credit limits & overdue alerts'
    ],
    link: '/crm'
  },
  {
    id: 'reports',
    badge: 'CA & Audit',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    title: 'CA Reports & Tax Audit',
    desc: 'Export structured GSTR-1, GSTR-3B summaries, Balance Sheet, Profit & Loss reports, and Party Ageing sheets ready for tax filing.',
    icon: FileSpreadsheet,
    iconBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    features: [
      'GSTR-1 & GSTR-3B monthly tax summary tables',
      'Real-time Profit & Loss statement and Balance Sheet',
      'Party Ageing analysis (0-30, 31-60, 60+ days overdue)',
      '1-Click Tally XML & Microsoft Excel export'
    ],
    link: '/billing/reports'
  }
];

const INDUSTRIES = [
  {
    id: 'wholesale',
    name: 'Wholesale & Traders',
    icon: Building2,
    badge: 'High-Volume Billing',
    tagline: 'Manage 10,000+ line items, tiered party pricing, and instant GST invoices in 60 seconds.',
    points: [
      'Custom party-wise discount rates and credit days',
      'Automated Khata debit/credit ledger posting on billing',
      'Multi-warehouse stock deduction upon dispatch',
      'Bulk WhatsApp payment reminders with UPI QR links'
    ]
  },
  {
    id: 'retail',
    name: 'Retail & Supermarkets',
    icon: ShoppingBag,
    badge: 'Fast POS Checkout',
    tagline: 'High-speed counter billing with barcode scanning, instant thermal print, and daily cash drawer calculation.',
    points: [
      'Direct barcode generator & thermal receipt printing (2" & 3")',
      'Daily Hisab cashbook closing with zero drawer mismatches',
      'Low-stock automated alerts for fast-moving FMCG items',
      'Customer phone number lookup & digital bill sharing'
    ]
  },
  {
    id: 'textile',
    name: 'Textile & Garments',
    icon: Package,
    badge: 'Surat & Ludhiana Standard',
    tagline: 'Purpose-built for textile traders with meter/yard conversions, design lot tracking, and broker commission ledger.',
    points: [
      'Piece, Than, Meter & Lot-wise inventory categorization',
      'Agent/Broker commission automated ledger calculation',
      'Delivery challan to Tax Invoice one-click conversion',
      'Party ledger aging report with overdue payment alerts'
    ]
  },
  {
    id: 'pharma',
    name: 'Pharma & Medical',
    icon: Shield,
    badge: 'Batch & Expiry Ready',
    tagline: 'Track medicine batches, manufacturer expiry dates, and regulatory GST compliance effortlessly.',
    points: [
      'Batch number, manufacturing & expiry date tracking',
      'Expired stock quarantine and supplier return ledgers',
      'Automatic HSN & GST rate lookup for pharmaceuticals',
      'E-Invoice IRN generation with government signed QR code'
    ]
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing & Fab',
    icon: TrendingUp,
    badge: 'Raw Material to Finished Goods',
    tagline: 'Complete production inventory tracking, vendor purchase orders, and job-work delivery challans.',
    points: [
      'Raw material consumption & finished goods stock balance sync',
      'Purchase bill registration with automatic vendor credit ledger',
      'Debit note & Credit note management with GST adjustment',
      'Multi-staff role access for factory, store, and accounts'
    ]
  },
  {
    id: 'services',
    name: 'Agencies & Services',
    icon: Users,
    badge: 'Recurring & Retainer Billing',
    tagline: 'Professional service invoices, price quotations, client project tracking, and automated staff payroll.',
    points: [
      'Price Quotations to Tax Invoices with 1 click',
      'Integrated CRM for client follow-ups and deals pipeline',
      'Monthly staff salary calculation and payslip generation',
      'Instant payment links powered by UPI and Razorpay'
    ]
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
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeMockTab, setActiveMockTab] = useState<'billing' | 'ledger' | 'inventory' | 'payroll'>('billing');
  const [activeIndustry, setActiveIndustry] = useState('wholesale');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Live GST Calculator Interactive State
  const [calcAmount, setCalcAmount] = useState<number>(50000);
  const [calcRate, setCalcRate] = useState<number>(18);
  const [calcType, setCalcType] = useState<'intra' | 'inter'>('intra');

  // Live ROI Calculator State
  const [roiInvoices, setRoiInvoices] = useState<number>(250);
  const [roiTeam, setRoiTeam] = useState<number>(4);

  const [showAnnouncement, setShowAnnouncement] = useState(() => {
    return sessionStorage.getItem('dismiss_landing_announcement') !== 'true';
  });

  const handleDismissAnnouncement = () => {
    setShowAnnouncement(false);
    sessionStorage.setItem('dismiss_landing_announcement', 'true');
  };

  // Calculated values for Live Tools
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0D14] text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      
      {/* ─── Top Announcement Banner ─────────────────────────────────── */}
      {showAnnouncement && (
        <div className="bg-[#0B0F17] text-slate-300 text-xs py-2 px-4 border-b border-slate-800 flex items-center justify-between font-medium">
          <div className="flex-1 text-center flex items-center justify-center gap-2">
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
              LIVE
            </span>
            <span>E-Invoicing, Quotations &amp; Multi-Warehouse Godown Tracking is now available!</span>
            <Link to="/pricing" className="text-emerald-400 hover:text-emerald-300 font-bold underline ml-1">
              View Plans →
            </Link>
          </div>
          <button
            onClick={handleDismissAnnouncement}
            className="text-slate-500 hover:text-white transition-colors p-1"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── Modern Public Navbar ─────────────────────────────────────── */}
      <PublicNavbar />

      {/* ─── HERO SECTION: EXPANSIVE ERP CONSOLE ──────────────────────── */}
      <section className="relative pt-12 pb-20 lg:pt-16 lg:pb-28 overflow-hidden">
        
        {/* Subtle Architectural Dot Mesh Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-25 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px]" />

        {/* Ambient Top Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-blue-500/10 via-emerald-500/5 to-transparent blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Direct Punchy Value Proposition */}
            <div className="lg:col-span-6 space-y-6 text-left">
              
              {/* Operational Status Pill */}
              <FadeUp delay={40}>
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs font-semibold shadow-2xs max-w-full truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Next-Gen Connected Business Management</span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% GSTN Ready</span>
                </div>
              </FadeUp>

              {/* Main Headline */}
              <FadeUp delay={80}>
                <h1 className="text-3xl sm:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.14]">
                  Run Billing, Khata, Inventory &amp; Payroll{' '}
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 bg-clip-text text-transparent">
                    in One Unified ERP.
                  </span>
                </h1>
              </FadeUp>

              {/* Subtitle */}
              <FadeUp delay={120}>
                <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-xl">
                  Replace four disconnected desktop software tools. When you create an invoice in Escrow BMS, your customer ledger auto-posts, warehouse stock deducts, and GSTR-1 entries update instantly.
                </p>
              </FadeUp>

              {/* Action Buttons */}
              <FadeUp delay={160}>
                <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-1">
                  <button
                    onClick={handleAuthAction}
                    className="w-full sm:w-auto h-12 px-7 text-sm font-bold rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Start Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <a
                    href="#services"
                    className="w-full sm:w-auto h-12 px-6 rounded-full font-semibold text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>View All Services</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </a>
                </div>
              </FadeUp>

              {/* Trust Strip */}
              <FadeUp delay={200}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200/60 dark:border-slate-800/80">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Zero Setup Fees</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> No Credit Card</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Tally &amp; Excel Import</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Multi-Staff Roles</span>
                </div>
              </FadeUp>
            </div>

            {/* Right Column: Live Interactive ERP Console Mockup */}
            <div className="lg:col-span-6">
              <FadeUp delay={240}>
                <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E131F] shadow-xl overflow-hidden">
                  
                  {/* Console Header Bar */}
                  <div className="bg-slate-100 dark:bg-slate-950 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      </div>
                      <div className="ml-2 px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-emerald-500" />
                        <span>app.escrowbms.com/live</span>
                      </div>
                    </div>

                    {/* Interactive Tab Switcher */}
                    <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-900 p-1 rounded-xl">
                      <button
                        onClick={() => setActiveMockTab('billing')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          activeMockTab === 'billing'
                            ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        🧾 Invoices
                      </button>
                      <button
                        onClick={() => setActiveMockTab('ledger')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          activeMockTab === 'ledger'
                            ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        📖 Khata
                      </button>
                      <button
                        onClick={() => setActiveMockTab('inventory')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          activeMockTab === 'inventory'
                            ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        📦 Stock
                      </button>
                      <button
                        onClick={() => setActiveMockTab('payroll')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          activeMockTab === 'payroll'
                            ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        👥 Payroll
                      </button>
                    </div>
                  </div>

                  {/* Console Body */}
                  <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-[#0A0D14]/80">
                    
                    {/* TAB 1: LIVE INVOICE PREVIEW */}
                    {activeMockTab === 'billing' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Monthly Sales</div>
                            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">₹8,42,300</div>
                            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> +18.4%
                            </div>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Receivables</div>
                            <div className="text-xl font-black text-amber-500 mt-0.5">₹1,94,500</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">4 parties due</div>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">GSTR-1 Tax</div>
                            <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">₹1,28,450</div>
                            <div className="text-[10px] font-bold text-emerald-500 mt-0.5">✓ Reconciled</div>
                          </div>
                        </div>

                        {/* Real Invoice Preview Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-2xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  TAX INVOICE
                                </span>
                                <span className="text-xs font-mono font-bold text-slate-500">INV-2026-0842</span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">Radhe Krishna Enterprises · Surat</h4>
                              <p className="text-[11px] text-slate-500">GSTIN: 24AAACR4829K1Z4</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 rounded-lg text-[11px] font-bold">
                                Paid via UPI
                              </span>
                              <span className="px-2.5 py-1 bg-[#25D366] text-white rounded-lg text-[11px] font-bold flex items-center gap-1">
                                <Share2 className="w-3 h-3" /> WhatsApp
                              </span>
                            </div>
                          </div>

                          <div className="overflow-x-auto text-xs">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="text-slate-400 uppercase text-[10px] border-b border-slate-100 dark:border-slate-800">
                                  <th className="pb-1.5">Item</th>
                                  <th className="pb-1.5">Qty</th>
                                  <th className="pb-1.5">Rate</th>
                                  <th className="pb-1.5">GST</th>
                                  <th className="pb-1.5 text-right">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                <tr>
                                  <td className="py-2 font-bold text-slate-800 dark:text-slate-200">Cotton Printed Fabric</td>
                                  <td className="py-2 text-slate-500">250 Mtr</td>
                                  <td className="py-2">₹140</td>
                                  <td className="py-2"><span className="text-blue-600 font-bold">5%</span></td>
                                  <td className="py-2 text-right font-bold text-slate-900 dark:text-white">₹36,750</td>
                                </tr>
                                <tr>
                                  <td className="py-2 font-bold text-slate-800 dark:text-slate-200">Embroidery Lace Border</td>
                                  <td className="py-2 text-slate-500">60 Pcs</td>
                                  <td className="py-2">₹180</td>
                                  <td className="py-2"><span className="text-purple-600 font-bold">12%</span></td>
                                  <td className="py-2 text-right font-bold text-slate-900 dark:text-white">₹12,096</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                            <span className="text-slate-400">Total Tax: ₹3,046 (CGST + SGST)</span>
                            <div className="text-sm font-black text-slate-900 dark:text-white">
                              Grand Total: <span className="text-blue-600 dark:text-blue-400 font-black">₹48,846</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: LIVE PARTY KHATA PREVIEW */}
                    {activeMockTab === 'ledger' && (
                      <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                          <div className="flex flex-col sm:flex-row justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-400">Ledger Statement</span>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Mehta Garments &amp; Sons · Surat</h4>
                              <p className="text-xs text-slate-500">Current Balance: <span className="font-bold text-amber-500">₹1,45,200 Dr</span></p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg">
                                Settle Balance
                              </span>
                            </div>
                          </div>

                          <div className="overflow-x-auto text-xs mt-3">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="text-slate-400 uppercase text-[10px] border-b">
                                  <th className="pb-2">Date</th>
                                  <th className="pb-2">Voucher</th>
                                  <th className="pb-2 text-right">Debit (₹)</th>
                                  <th className="pb-2 text-right">Credit (₹)</th>
                                  <th className="pb-2 text-right">Balance</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                                <tr>
                                  <td className="py-2 text-slate-500">28 Aug</td>
                                  <td className="py-2 font-bold">INV-0798 (Goods Sold)</td>
                                  <td className="py-2 text-right font-bold text-slate-900 dark:text-white">₹1,95,200</td>
                                  <td className="py-2 text-right text-slate-400">-</td>
                                  <td className="py-2 text-right font-bold text-amber-500">₹1,95,200 Dr</td>
                                </tr>
                                <tr>
                                  <td className="py-2 text-slate-500">01 Sep</td>
                                  <td className="py-2 font-bold">NEFT Bank Transfer</td>
                                  <td className="py-2 text-right text-slate-400">-</td>
                                  <td className="py-2 text-right font-bold text-emerald-500">₹50,000</td>
                                  <td className="py-2 text-right font-bold text-amber-500">₹1,45,200 Dr</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: LIVE STOCK PREVIEW */}
                    {activeMockTab === 'inventory' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Total SKUs</div>
                            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">1,248</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">2 Warehouses</div>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Low Stock</div>
                            <div className="text-xl font-black text-red-500 mt-0.5">3 Items</div>
                            <div className="text-[10px] text-red-500 font-bold mt-0.5">Reorder Alert</div>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Stock Value</div>
                            <div className="text-xl font-black text-emerald-500 mt-0.5">₹42.1 L</div>
                            <div className="text-[10px] text-emerald-500 font-bold mt-0.5">FIFO Valuation</div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold">Fast-Moving Items</span>
                            <span className="text-[10px] text-slate-400">Barcode Scanner Active</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
                              <div>
                                <div className="font-bold">Rayon Fabric Dye Grade A</div>
                                <div className="text-[10px] text-slate-400">SKU: RAY-0941 · Godown 1</div>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                420 Mtr in Stock
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
                              <div>
                                <div className="font-bold">Polyester Sewing Thread 500m</div>
                                <div className="text-[10px] text-slate-400">SKU: THR-500 · Godown 2</div>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                                Only 12 Pcs (Low)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 4: LIVE PAYROLL PREVIEW */}
                    {activeMockTab === 'payroll' && (
                      <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Staff Payroll · 14 Employees</h4>
                              <p className="text-[11px] text-slate-500">Month: Current Period</p>
                            </div>
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg text-xs font-bold">
                              ✓ 1-Click WhatsApp Delivery
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-3">
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg">
                              <div className="text-slate-400 text-[10px] font-bold">Gross Salary</div>
                              <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">₹3,48,000</div>
                            </div>
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg">
                              <div className="text-slate-400 text-[10px] font-bold">PF / Deductions</div>
                              <div className="text-sm font-black text-red-500 mt-0.5">₹38,280</div>
                            </div>
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg">
                              <div className="text-slate-400 text-[10px] font-bold">Attendance</div>
                              <div className="text-sm font-black text-emerald-500 mt-0.5">96.4%</div>
                            </div>
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg">
                              <div className="text-slate-400 text-[10px] font-bold">Net Payout</div>
                              <div className="text-sm font-black text-blue-600 dark:text-blue-400 mt-0.5">₹3,09,720</div>
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
      <section className="bg-white dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <StatCounterItem value={120} prefix="₹" suffix="Cr+" label="Transactions Handled" sublabel="Across 28 Indian States" />
            <StatCounterItem value={50000} suffix="+" label="Invoices Generated" sublabel="100% Tax Compliant" />
            <StatCounterItem value={60} suffix=" Sec" label="Average Invoicing Time" sublabel="3x Faster Collection" />
            <StatCounterItem value={99.99} suffix="%" label="Cloud Uptime SLA" sublabel="Zero Data Loss Guarantee" />
          </div>
        </div>
      </section>

      {/* ─── ALL SERVICES & CAPABILITIES BENTO SHOWCASE ────────────────── */}
      <section id="services" className="py-20 lg:py-28 bg-slate-100/50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              <Layers className="w-3.5 h-3.5" /> Complete Service Suite
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
              Every Service Built In. Zero Hidden Add-ons.
            </h2>
            <p className="mt-3.5 text-base sm:text-lg text-slate-600 dark:text-slate-300">
              A comprehensive ERP suite engineered for Indian businesses — from first quotation to year-end balance sheet.
            </p>
          </div>

          {/* 8-Card Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CORE_SERVICES.map((srv, idx) => {
              const Icon = srv.icon;
              return (
                <FadeUp key={srv.id} delay={idx * 40}>
                  <div className="h-full p-6 rounded-2xl bg-white dark:bg-[#0E131F] border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-300 shadow-2xs hover:shadow-lg flex flex-col justify-between group">
                    <div>
                      {/* Top Row: Icon + Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${srv.iconBg} transition-transform group-hover:scale-105`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${srv.badgeColor}`}>
                          {srv.badge}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {srv.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                        {srv.desc}
                      </p>

                      {/* Feature Checklist */}
                      <ul className="space-y-2 text-[11px] font-medium text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/80 pt-3.5">
                        {srv.features.map((feat, fidx) => (
                          <li key={fidx} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Bottom Link */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                      <Link
                        to={user ? srv.link : "/auth"}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group-hover:translate-x-1 transition-transform"
                      >
                        <span>Learn More</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </FadeUp>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─── HOW IT WORKS (Connected 4-Step Flow) ────────────────────── */}
      <section id="workflow" className="py-20 lg:py-28 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Zero Double Entry
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
              One Action. Four Automatic Updates.
            </h2>
            <p className="mt-3.5 text-base sm:text-lg text-slate-600 dark:text-slate-300">
              See what happens automatically behind the scenes every time you create an invoice in Escrow BMS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm mb-4 shadow-md shadow-blue-500/20">
                1
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">Create Invoice</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Scan product barcode, select party, and apply standard GST rates (CGST/SGST/IGST). Takes under 60 seconds.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm mb-4 shadow-md shadow-emerald-500/20">
                2
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">Khata Auto-Posts</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Customer debit balance automatically updates. Payment link with dynamic UPI QR is sent directly on WhatsApp.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center text-sm mb-4 shadow-md shadow-purple-500/20">
                3
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">Stock Deducts</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Selected godown stock count drops in real-time. If stock drops below safe threshold, reorder alerts trigger.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white font-black flex items-center justify-center text-sm mb-4 shadow-md shadow-amber-500/20">
                4
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">GSTR-1 Ready</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                HSN summaries and tax breakdowns populate your monthly tax sheets automatically. Ready for your CA in 1 click.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ─── INDUSTRY WORKFLOWS SWITCHER ─────────────────────────────── */}
      <section id="industries" className="py-20 lg:py-28 bg-slate-100/50 dark:bg-slate-950/70 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
              Tailored For Your Trade
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
              Pre-Configured For Your Specific Industry
            </h2>
            <p className="mt-3.5 text-base sm:text-lg text-slate-600 dark:text-slate-300">
              Whether you sell by the meter, batch, carton, or kilogram — Escrow BMS matches your exact commercial workflow.
            </p>
          </div>

          {/* Industry Tab Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {INDUSTRIES.map((ind) => {
              const Icon = ind.icon;
              return (
                <button
                  key={ind.id}
                  onClick={() => setActiveIndustry(ind.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeIndustry === ind.id
                      ? 'bg-[#1a73e8] text-white shadow-md shadow-blue-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{ind.name}</span>
                </button>
              );
            })}
          </div>

          {/* Industry Content Card */}
          <div className="max-w-4xl mx-auto bg-white dark:bg-[#0E131F] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {currentInd.badge}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {currentInd.name}
                </h3>
              </div>
              <button
                onClick={handleAuthAction}
                className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#1a73e8] text-white hover:bg-[#1557b0] transition-colors cursor-pointer"
              >
                Launch {currentInd.name} Setup →
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed my-6 font-medium">
              {currentInd.tagline}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {currentInd.points.map((pt, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ─── LIVE INTERACTIVE GST & ROI CALCULATOR TOOLS ──────────────── */}
      <section id="tools" className="py-20 lg:py-28 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
              Interactive Tools
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
              Test Drive Our Financial Calculators
            </h2>
            <p className="mt-3.5 text-base sm:text-lg text-slate-600 dark:text-slate-300">
              Calculate exact CGST/SGST breakdowns and estimate how many hours and rupees your business saves every month.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Tool 1: Live GST Tax Calculator */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 dark:bg-[#0E131F] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">Live GST Tax Calculator</h3>
                    <p className="text-[11px] text-slate-500">CGST, SGST &amp; IGST Breakdown</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">Taxable Amount (₹)</label>
                    <input
                      type="number"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">GST Tax Rate</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[5, 12, 18, 28].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setCalcRate(rate)}
                          className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            calcRate === rate
                              ? 'bg-[#1a73e8] text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">Transaction Region</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCalcType('intra')}
                        className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          calcType === 'intra'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        Intra-State (CGST + SGST)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalcType('inter')}
                        className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          calcType === 'inter'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        Inter-State (IGST)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  {calcType === 'intra' ? (
                    <>
                      <div className="flex justify-between text-slate-500">
                        <span>CGST ({calcRate / 2}%):</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">₹{cgstAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>SGST ({calcRate / 2}%):</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">₹{sgstAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-500">
                      <span>IGST ({calcRate}%):</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">₹{igstAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t text-sm font-black text-slate-900 dark:text-white">
                    <span>Grand Total:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-mono">₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tool 2: Monthly Time & Money Saved Estimator */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 dark:bg-[#0E131F] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">Business ROI Estimator</h3>
                    <p className="text-[11px] text-slate-500">Hours and Lakhs Saved with Escrow BMS</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400 uppercase text-[11px]">Monthly Invoices Created</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{roiInvoices} Invoices</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={2000}
                      step={50}
                      value={roiInvoices}
                      onChange={(e) => setRoiInvoices(Number(e.target.value))}
                      className="w-full accent-[#1a73e8]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400 uppercase text-[11px]">Total Staff &amp; Accountants</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{roiTeam} Members</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={25}
                      step={1}
                      value={roiTeam}
                      onChange={(e) => setRoiTeam(Number(e.target.value))}
                      className="w-full accent-[#1a73e8]"
                    />
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3 text-center">
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Hours Saved / Month</div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                      {hoursSavedPerMonth} hrs
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Eliminates manual re-entry</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Est. Annual Value</div>
                    <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-1 font-mono">
                      ₹{(moneySavedPerYear / 100000).toFixed(1)} Lakhs
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Productivity &amp; Faster Khata</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={handleAuthAction}
                  className="w-full py-3 rounded-full text-xs font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  Start Saving Time with Escrow BMS →
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── CUSTOMER TESTIMONIALS ──────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-slate-100/50 dark:bg-slate-950/70 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Trusted Across India
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
              Loved by MSME Owners &amp; Chartered Accountants
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white dark:bg-[#0E131F] border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal mb-5 italic">
                    "{t.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{t.name}</h4>
                    <p className="text-[11px] text-slate-500">{t.role}, {t.company}</p>
                    <p className="text-[10px] text-slate-400">{t.city}</p>
                  </div>
                  <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {t.metric}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── FAQS ACCORDION ─────────────────────────────────────────── */}
      <section id="faq" className="py-20 lg:py-28 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
              Clear Answers
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-950/40"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 pt-1 sm:px-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 font-medium">
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
      <section className="py-20 bg-[#0B0F17] text-white text-center relative overflow-hidden border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
            Get Started in 60 Seconds
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mt-4 tracking-tight">
            Ready to Simplify Your Entire Business?
          </h2>
          <p className="mt-3.5 text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Join growing traders, manufacturers, and retailers across India managing invoices, khata, and payroll in one clean platform.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleAuthAction}
              className="w-full sm:w-auto h-12 px-8 rounded-full font-bold text-sm bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
            >
              Start 14-Day Free Trial →
            </button>
            <Link
              to="/pricing"
              className="w-full sm:w-auto h-12 px-6 rounded-full font-semibold text-sm text-slate-300 border border-slate-700 hover:text-white hover:border-slate-500 transition-colors flex items-center justify-center"
            >
              View Transparent Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ─── ENTERPRISE FOOTER ───────────────────────────────────────── */}
      <Footer />

      {/* ─── FLOATING WHATSAPP CHAT WIDGET ──────────────────────────── */}
      <WhatsAppChatWidget />

    </div>
  );
}
