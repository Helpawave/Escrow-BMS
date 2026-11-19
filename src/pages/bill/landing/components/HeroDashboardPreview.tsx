import React from "react";
import { CheckCircle } from "lucide-react";

export const HeroDashboardPreview: React.FC = () => {
  return (
    <div className="relative mx-auto max-w-lg lg:max-w-none">
      {/* Floating Action Card 1: Top-Right (Instant UPI Payment Inflow) */}
      <div className="absolute -top-5 right-0 sm:-right-5 sm:-top-6 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 dark:border-emerald-500/40 rounded-2xl p-2.5 sm:p-3.5 shadow-[0_14px_35px_rgba(16,185,129,0.18)] dark:shadow-[0_14px_35px_rgba(0,0,0,0.5)] flex items-center gap-2.5 sm:gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-black text-sm shrink-0">
          ₹
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-slate-900 dark:text-white">Payment Received</span>
            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded-md">
              Instant UPI
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            ₹18,500 from <strong className="text-slate-700 dark:text-slate-300 font-semibold">Surat Silk Mills</strong>
          </p>
        </div>
      </div>

      {/* Floating Action Card 2: Bottom-Left (WhatsApp 1-Click Invoice Delivery) */}
      <div className="absolute -bottom-5 -left-2 sm:-left-5 z-20 hidden sm:flex bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 dark:border-blue-500/40 rounded-2xl p-3 sm:p-3.5 shadow-[0_14px_35px_rgba(37,99,235,0.18)] dark:shadow-[0_14px_35px_rgba(0,0,0,0.5)] items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm shrink-0">
          💬
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-slate-900 dark:text-white">Bill Sent on WhatsApp</span>
            <span className="text-[9px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 px-1.5 py-0.2 rounded-md">
              With UPI QR
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            INV-2026-142 • Seen by customer (Paid in 3m)
          </p>
        </div>
      </div>

      {/* Main SaaS Window Container */}
      <div className="relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.18)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] ring-1 ring-slate-900/5 dark:ring-white/10 overflow-hidden text-left">
        {/* Top Window Chrome */}
        <div className="bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 ml-3 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              app.escrowbill.in/dashboard
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-650 dark:text-slate-400 bg-white dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 font-medium">
            <span className="font-semibold text-slate-700 dark:text-slate-300">FY 2026-27</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
              GST Portal Linked
            </span>
          </div>
        </div>

        {/* Dashboard Body */}
        <div className="p-4 sm:p-5 space-y-4 sm:space-y-4.5">
          {/* Business Header in App */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Sharma Textiles & Trading</p>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Verified GST
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">GSTIN: 24AADCS9081J1ZP • Surat, Gujarat</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs flex items-center gap-1 cursor-default">
                <span>+</span> New Tax Invoice
              </span>
            </div>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="p-2 sm:p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[8px] sm:text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate block">Total Sales</span>
              <div className="text-xs sm:text-base md:text-lg font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1">₹18,42,500</div>
              <span className="text-[8px] sm:text-[9px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5 truncate">
                ↑ 14.8% <span className="text-slate-600 dark:text-slate-400 font-normal hidden sm:inline">this month</span>
              </span>
            </div>

            <div className="p-2 sm:p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[8px] sm:text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate block">GST Collected</span>
              <div className="text-xs sm:text-base md:text-lg font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1">₹2,84,300</div>
              <span className="text-[8px] sm:text-[9px] text-blue-600 dark:text-blue-400 font-medium mt-0.5 truncate block">
                18% CGST+SGST
              </span>
            </div>

            <div className="p-2 sm:p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[8px] sm:text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate block">Pending</span>
              <div className="text-xs sm:text-base md:text-lg font-black text-amber-700 dark:text-amber-400 mt-0.5 sm:mt-1">₹3,15,400</div>
              <span className="text-[8px] sm:text-[9px] text-amber-700 dark:text-amber-500 font-medium mt-0.5 truncate block">
                3 overdue
              </span>
            </div>
          </div>

          {/* Live Invoices Mini Table */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-50/90 dark:bg-slate-900/90 px-3 py-2 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Recent Invoices & Settlements</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Live Feed
              </span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              <div className="p-2.5 sm:p-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Ganesh Textiles (Noida)</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">INV-2026-142 • 28 HSN items</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">₹84,500</p>
                  <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Paid via UPI QR
                  </span>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    🚚
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Surat Silk Mills Pvt Ltd</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">INV-2026-141 • E-Way Bill Ready</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">₹1,26,000</p>
                  <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    E-Way Generated
                  </span>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                    ⏳
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Apex Retail Stores (Delhi)</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">INV-2026-140 • Due in 2 days</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">₹42,800</p>
                  <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    Reminder Sent
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Strip */}
          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              Thermal 58mm & A4 Print
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              UPI QR Auto-Reconciliation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
