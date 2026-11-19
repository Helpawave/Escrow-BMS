import React from "react";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export type IndustryTab = "retail" | "textile" | "automobile" | "cafe";

export interface IndustrySolutionsProps {
  activeTab: IndustryTab;
  setActiveTab: (tab: IndustryTab) => void;
}

export const IndustrySolutions: React.FC<IndustrySolutionsProps> = ({ activeTab, setActiveTab }) => {
  const data: Record<
    IndustryTab,
    {
      title: string;
      tagline: string;
      desc: string;
      features: { title: string; detail: string }[];
      icon: string;
      badge: string;
      color: string;
      accentBg: string;
      borderAccent: string;
      highlights: string[];
      sampleStats: { label: string; value: string }[];
    }
  > = {
    retail: {
      title: "Retail Stores, Supermarkets & General Trading",
      tagline: "Ultra-fast counter billing, barcode scanning & smart inventory alerts",
      desc: "Designed for grocery shops, electronics stores, FMCG distributors, hardware stores, and retail supermarkets. Handle heavy walk-in footfall with rapid checkouts and instant WhatsApp UPI bills.",
      features: [
        {
          title: "Superfast POS Invoicing",
          detail: "Print compact 58mm/80mm thermal receipts or classic full A4/A5 GST invoices in under 8 seconds."
        },
        {
          title: "USB & Bluetooth Barcode Support",
          detail: "Scan barcodes using any handheld scanner or phone camera for zero-error automatic item additions."
        },
        {
          title: "Real-time Low Stock Alerts",
          detail: "Set automatic reorder thresholds and receive immediate visual cues before inventory hits red."
        },
        {
          title: "Instant WhatsApp UPI QR",
          detail: "Deliver digital invoices directly to customer's WhatsApp with dynamic UPI QR codes for zero-wait payments."
        }
      ],
      icon: "🏪",
      badge: "Retail & General Trading",
      color: "from-blue-600 via-indigo-600 to-cyan-500",
      accentBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      borderAccent: "hover:border-blue-500/40",
      highlights: ["Barcode Support", "Low Stock Alerts", "Thermal & A4 Bills", "WhatsApp UPI QR"],
      sampleStats: [
        { label: "Checkout Time", value: "< 8 sec" },
        { label: "Printer Support", value: "Thermal & A4" },
        { label: "UPI Settlements", value: "Instant" }
      ]
    },
    textile: {
      title: "Textile Mills, Fabric Wholesalers & Garment Hubs",
      tagline: "Specialized for Surat fabric markets, grey goods & garment trading",
      desc: "Engineered specifically for saree wholesalers, fabric manufacturers, dress material traders, yarn brokers, and garment hubs. Easily handle complex units, buyer credit ledgers (Khata), and 1-click e-Way bills.",
      features: [
        {
          title: "Piece, Meter & Thaan Units",
          detail: "Seamless conversion and pricing for fabric rolls, thaans, meters, cut-pieces, and weight-based rate tiers."
        },
        {
          title: "Buyer Credit Ledgers (Khata)",
          detail: "Track outstanding payment dues, broker cuts, dispatch challans, and generate printable PDF account statements."
        },
        {
          title: "1-Click E-Way Bill & E-Invoicing",
          detail: "Instant GST portal synced e-way bills with HSN codes (5407, 5208, 6204) for inter-state parcel dispatches."
        },
        {
          title: "Bulk Design Catalog Excel Import",
          detail: "Import thousands of design numbers, shade codes, and wholesale rate brackets in seconds via Excel."
        }
      ],
      icon: "🧵",
      badge: "Textile & Garment Industry",
      color: "from-purple-600 via-violet-600 to-pink-500",
      accentBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      borderAccent: "hover:border-purple-500/40",
      highlights: ["Meters / Pieces / Thaans", "Buyer Khata Ledger", "Automated E-Way Bills", "Bulk Design Catalogs"],
      sampleStats: [
        { label: "Unit Flexibility", value: "Mtr / Pcs / Thaan" },
        { label: "E-Way Bill Generation", value: "1-Click" },
        { label: "Catalog Scale", value: "10,000+ Items" }
      ]
    },
    automobile: {
      title: "Automobile Dealerships, Garages & Auto Spares",
      tagline: "Vehicle sales, downpayment receipts & workshop service job-cards",
      desc: "Custom-crafted for 2-wheeler and 4-wheeler dealerships, multi-brand car showrooms, bike service centers, garages, and spare part distributors with vehicle registration and downpayment tracking.",
      features: [
        {
          title: "Vehicle Downpayment & Booking Receipts",
          detail: "Issue professional vehicle booking slips with token advance, RTO fees, and hypothecation details."
        },
        {
          title: "Chassis & Engine No. Tracking",
          detail: "Dedicated fields for Vehicle Identification Number (VIN), Chassis No., Engine No., and Model Variant."
        },
        {
          title: "Service Workshop Job-Cards",
          detail: "Separate itemized billing for spare parts and garage labor charges with customized tax rates."
        },
        {
          title: "Insurance & Warranty Records",
          detail: "Print extended warranty details, insurance policy numbers, and delivery date commitments on receipts."
        }
      ],
      icon: "🚗",
      badge: "Automobile & Workshop",
      color: "from-amber-500 via-orange-500 to-red-500",
      accentBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      borderAccent: "hover:border-amber-500/40",
      highlights: ["Chassis & Engine Tracking", "Downpayment Receipts", "Parts & Labor Bifurcation", "RTO & Hypothecation"],
      sampleStats: [
        { label: "Receipt Type", value: "Booking & Downpayment" },
        { label: "Compliance", value: "RTO & Hypothecation" },
        { label: "Workshop Support", value: "Spares + Labor" }
      ]
    },
    cafe: {
      title: "Cafe POS, Restaurants, Bakeries & Cloud Kitchens",
      tagline: "Live Kitchen Display System (KDS), multi-sound chimes & thermal POS",
      desc: "Engineered for coffee shops, cafes, dine-in restaurants, quick-service counters, bakeries, and cloud kitchens. Real-time sync between billing counters and kitchen screens with audible order chimes.",
      features: [
        {
          title: "Live Kitchen Display System (KDS)",
          detail: "Orders created at the billing counter appear instantly on kitchen screens for chef preparation."
        },
        {
          title: "Multi-Tone Kitchen Audio Chimes",
          detail: "Audible alerts (Service Bell, Order Ding, Melody, Digital Beep) announce new tickets in noisy kitchens."
        },
        {
          title: "Table & Token Order Management",
          detail: "Assign orders to Dine-In tables or consecutive Takeaway parcel tokens for seamless order handoff."
        },
        {
          title: "3-Inch Thermal POS Printing",
          detail: "Compact, clear thermal receipts with order items, preparation notes, and dynamic UPI payment QR."
        }
      ],
      icon: "☕",
      badge: "Cafe POS & Restaurants",
      color: "from-emerald-600 via-teal-600 to-cyan-500",
      accentBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      borderAccent: "hover:border-emerald-500/40",
      highlights: ["Live KDS Screen", "Kitchen Audio Chimes", "Table & Token Tracking", "3-Inch Thermal POS"],
      sampleStats: [
        { label: "Kitchen Sync", value: "Real-time" },
        { label: "Audio Alerts", value: "4 Distinct Tones" },
        { label: "Print Format", value: "Thermal 58/80mm" }
      ]
    }
  };

  const tabs: { id: IndustryTab; label: string; icon: string }[] = [
    { id: "retail", label: "Retail & Shops", icon: "🏪" },
    { id: "textile", label: "Textile Industry", icon: "🧵" },
    { id: "automobile", label: "Automobile Industry", icon: "🚗" },
    { id: "cafe", label: "Cafe POS & Restaurant", icon: "☕" }
  ];

  const current = data[activeTab];

  return (
    <div className="w-full bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-xl relative overflow-hidden text-slate-800 dark:text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dedicated User Types</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Tailored For Your Specific Industry
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
            EscrowBill auto-customizes invoice templates, units, and workflows to match your exact business type.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 w-full lg:w-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-900 dark:bg-blue-600 text-white shadow-md shadow-slate-900/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60"
                }`}
              >
                <span className="text-base shrink-0">{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left: Info & Features */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          <div className="space-y-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider ${current.accentBg}`}>
              <span>{current.badge}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {current.title}
            </h3>
            <p className="text-sm sm:text-base font-semibold text-blue-600 dark:text-blue-400">
              {current.tagline}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              {current.desc}
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid sm:grid-cols-2 gap-3.5 pt-1">
            {current.features.map((feat, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 transition-all ${current.borderAccent} shadow-2xs`}
              >
                <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{feat.title}</span>
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {feat.detail}
                </p>
              </div>
            ))}
          </div>

          {/* Quick Specs & CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              {current.sampleStats.map((stat, idx) => (
                <div key={idx} className="space-y-0.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-xs sm:text-sm font-black text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>

            <Link
              to="/auth?view=signup"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-all shadow-sm hover:shadow shrink-0"
            >
              <span>Get Started in {activeTab === "retail" ? "Retail" : activeTab === "textile" ? "Textile" : activeTab === "automobile" ? "Auto" : "Cafe"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: Visual Interactive Card */}
        <div className="lg:col-span-5 relative flex justify-center min-w-0">
          <div className={`absolute -inset-4 bg-gradient-to-r ${current.color} rounded-[3rem] blur-2xl opacity-20 pointer-events-none`} />

          <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 text-center space-y-5">
            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-200/80 dark:border-slate-700 mx-auto flex items-center justify-center text-4xl select-none">
              {current.icon}
            </div>

            <div className="space-y-1">
              <p className="font-black text-base text-slate-900 dark:text-white uppercase tracking-tight">
                EscrowBill {activeTab.toUpperCase()} Mode
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                100% Pre-Configured Workflows
              </p>
            </div>

            <div className={`h-1.5 w-24 mx-auto rounded-full bg-gradient-to-r ${current.color}`} />

            <div className="space-y-2 text-left pt-1">
              {current.highlights.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-200/80 dark:border-slate-800">
              Select your business type during free signup, and your dashboard dynamically loads specialized templates and settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
