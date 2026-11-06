import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  ShieldCheck,
  Zap,
  TrendingUp,
  Receipt,
  Wallet,
  Building2,
  CheckCircle2,
  Lock,
  QrCode,
  Share2,
  Users,
  Award,
  Sparkles,
  ArrowUpRight,
  Wifi,
  Check,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Auth3DShowcaseProps {
  currentSlide?: number;
  onSelectSlide?: (idx: number) => void;
}

export const Auth3DShowcase: React.FC<Auth3DShowcaseProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [activePillar, setActivePillar] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -16;
    const rotateY = ((x - centerX) / centerX) * 16;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setRotate({ x: rotateX, y: rotateY });
    setGlare({ x: glareX, y: glareY, opacity: 0.35 });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  const pillars = [
    {
      icon: FileText,
      title: "GST Cloud Billing",
      desc: "1-Click e-invoices, e-way bills & WhatsApp bill sharing with instant UPI QR.",
      badge: "GST 2.0"
    },
    {
      icon: TrendingUp,
      title: "Dual-Entry Ledgers",
      desc: "Real-time party balances, bank reconciliations & automated P&L reports.",
      badge: "Real-Time"
    },
    {
      icon: Lock,
      title: "Escrow Salary Vault",
      desc: "Pre-funded payroll vaults, automated PF/ESI calculations & on-time salary release.",
      badge: "Secured"
    }
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full min-h-[720px] p-8 lg:p-12 xl:p-14 flex flex-col justify-between overflow-hidden bg-[#070b12] text-white select-none"
    >
      {/* ── AMBIENT NEON MESH & GLOW EFFECTS ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep emerald glow orb */}
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-emerald-500/15 blur-[140px]" />
        
        {/* Electric Indigo glow orb */}
        <div className="absolute top-1/3 -right-28 w-[480px] h-[480px] rounded-full bg-indigo-600/15 blur-[130px]" />
        
        {/* Deep cyan bottom accent */}
        <div className="absolute -bottom-32 left-1/4 w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[150px]" />

        {/* High-tech fine dot grid */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle, #38bdf8 1px, transparent 1px)",
            backgroundSize: "28px 28px"
          }}
        />

        {/* Delicate structural grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* ── TOP SECTION: PUNCHY BRAND STATEMENT ── */}
      <div className="relative z-10 max-w-xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-black uppercase tracking-widest shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>ESCROW BMS • NEXT-GEN ENTERPRISE ERP</span>
        </div>

        <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.12] mt-4">
          The Operating System for <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">Modern Business.</span>
        </h1>

        <p className="text-sm xl:text-base text-slate-400 font-normal leading-relaxed mt-3 max-w-lg">
          Unify GST invoicing, automated dual-entry ledgers, and escrow-protected payroll in one bank-grade secure platform.
        </p>
      </div>

      {/* ── CENTERPIECE: 3D HOLOGRAPHIC SMART CARD WITH FLOATING SATELLITE WIDGETS ── */}
      <div
        className="relative z-10 my-4 py-4 flex items-center justify-center"
        style={{ perspective: "1200px" }}
      >
        <div
          style={{
            transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
            transformStyle: "preserve-3d",
            transition: "transform 0.15s cubic-bezier(0.2, 0, 0, 1)"
          }}
          className="relative w-full max-w-md h-[270px] flex items-center justify-center"
        >
          {/* ── 1. THE 3D TITANIUM ESCROW SMART CARD ── */}
          <div
            style={{ transform: "translateZ(10px)" }}
            className="relative w-full h-[230px] rounded-3xl p-6 overflow-hidden shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85)] border border-white/20 bg-gradient-to-br from-slate-900/90 via-[#0a141c]/95 to-[#041d18]/90 backdrop-blur-2xl"
          >
            {/* Real-time Dynamic Glare / Holographic Light Beam */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                opacity: glare.opacity,
                background: `radial-gradient(circle 320px at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.35), transparent 70%)`
              }}
            />

            {/* Subtle Metallic Brushed Texture Lines */}
            <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,#fff,#fff_1px,transparent_1px,transparent_8px)]" />

            {/* Top of Card: Logo + Contactless Chip */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain drop-shadow" />
                <span className="font-sans font-black tracking-tight text-white text-base">
                  ESCROW<span className="text-emerald-400">BMS</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Wifi className="w-5 h-5 text-emerald-400/80 rotate-90" />
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-black uppercase tracking-wider">
                  TITANIUM VAULT
                </span>
              </div>
            </div>

            {/* Center of Card: Gold EMV Chip & Account Identifier */}
            <div className="relative z-10 mt-5 flex items-center justify-between">
              {/* Realistic Gold EMV Chip */}
              <div className="w-11 h-8 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-0.5 shadow-md flex flex-col justify-between overflow-hidden border border-amber-300/60">
                <div className="w-full h-px bg-amber-800/40 my-auto" />
                <div className="flex justify-between h-full w-full">
                  <div className="w-px h-full bg-amber-800/40 mx-auto" />
                  <div className="w-px h-full bg-amber-800/40 mx-auto" />
                </div>
              </div>

              {/* Masked Card / Business Ledger Number */}
              <div className="font-mono text-sm tracking-[0.25em] text-slate-300 font-bold">
                •••• •••• 8942
              </div>
            </div>

            {/* Bottom of Card: Live Available Vault Balance */}
            <div className="relative z-10 mt-6 flex items-end justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Escrow Protected Balance
                </div>
                <div className="text-2xl font-black text-white font-mono tracking-tight mt-0.5">
                  ₹ 24,85,600<span className="text-emerald-400 text-sm">.00</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Status</div>
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>100% Secured</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. FLOATING SATELLITE 3D WIDGET: GST INVOICE NOTIFICATION (Top-Right) ── */}
          <div
            style={{ transform: "translateZ(55px) translate3d(40px, -50px, 0)" }}
            className="absolute z-20 hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-emerald-500/40 shadow-[0_20px_40px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in duration-300"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">Invoice #9482</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                  PAID ✓
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                ₹ 1,74,640.00 • WhatsApp Sent
              </div>
            </div>
          </div>

          {/* ── 3. FLOATING SATELLITE 3D WIDGET: LEDGER RECONCILIATION PULSE (Bottom-Left) ── */}
          <div
            style={{ transform: "translateZ(50px) translate3d(-40px, 60px, 0)" }}
            className="absolute z-20 hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-indigo-500/40 shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">Dual-Entry Reconciled</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                +₹ 3,50,000 NEFT Inflow
              </div>
            </div>
          </div>

          {/* ── 4. FLOATING SATELLITE 3D WIDGET: AUDIT SHIELD (Bottom-Right) ── */}
          <div
            style={{ transform: "translateZ(40px) translate3d(50px, 70px, 0)" }}
            className="absolute z-20 hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[10px] font-bold text-slate-300 shadow-xl"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>ISO Certified • GST Ready</span>
          </div>
        </div>
      </div>

      {/* ── 3 INTERACTIVE PILLARS / SERVICES BELOW THE STAGE ── */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
        {pillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          const isActive = activePillar === idx;
          return (
            <div
              key={pillar.title}
              onClick={() => setActivePillar(idx)}
              className={cn(
                "p-3.5 rounded-2xl transition-all duration-300 cursor-pointer border relative overflow-hidden group",
                isActive
                  ? "bg-white/[0.08] border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                  : "bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-white/20"
              )}
            >
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />
              )}
              <div className="flex items-center justify-between mb-2">
                <div className={cn(
                  "p-2 rounded-xl transition-transform group-hover:scale-110",
                  isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-slate-300"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
                  {pillar.badge}
                </span>
              </div>
              <h3 className="text-xs font-bold text-white tracking-wide mb-1">
                {pillar.title}
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                {pillar.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── BOTTOM STATS STRIP: REAL TRUST & PRESTIGE METRICS ── */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <div>
          <div className="text-white font-black text-sm font-mono">₹ 50Cr+</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Monthly Invoicing</div>
        </div>
        <div className="h-6 w-px bg-white/10" />
        <div>
          <div className="text-white font-black text-sm font-mono">99.99%</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Audit Accuracy</div>
        </div>
        <div className="h-6 w-px bg-white/10" />
        <div>
          <div className="text-white font-black text-sm font-mono">12,000+</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Indian Enterprises</div>
        </div>
      </div>
    </div>
  );
};

export default Auth3DShowcase;
