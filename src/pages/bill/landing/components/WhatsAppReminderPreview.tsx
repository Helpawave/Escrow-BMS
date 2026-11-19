import React from "react";

export const WhatsAppReminderPreview: React.FC = () => {
  return (
    <div className="relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl overflow-hidden max-w-md mx-auto text-left">
      {/* WhatsApp Header */}
      <div className="bg-[#075E54] px-4 py-3 text-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-800 flex items-center justify-center font-black text-xs text-white">
            EB
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs text-white">EscrowBill Invoicing</span>
              <span className="text-[11px] text-emerald-300 font-bold">✓</span>
            </div>
            <span className="text-[10px] text-emerald-100 font-normal">Official WhatsApp Business</span>
          </div>
        </div>
        <span className="text-[10px] text-emerald-200">10:45 AM</span>
      </div>

      {/* Chat Area with Background */}
      <div className="p-4 bg-[#EFEAE2] dark:bg-[#0B141A] space-y-3 min-h-[380px] flex flex-col justify-center">
        {/* Date bubble */}
        <div className="text-center">
          <span className="px-3 py-1 rounded-md bg-white/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[10px] font-medium shadow-xs">
            Today
          </span>
        </div>

        {/* Message Bubble */}
        <div className="bg-white dark:bg-[#1F2C34] text-slate-900 dark:text-slate-100 rounded-xl rounded-tl-none p-3.5 shadow-sm max-w-[95%] space-y-2.5 border border-slate-200/40 dark:border-slate-700/40">
          <div className="text-xs leading-relaxed space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">Namaste Ramesh Ji,</p>
            <p className="text-slate-600 dark:text-slate-300">
              Your GST Invoice <span className="font-bold text-slate-900 dark:text-white">#INV-2026-089</span> for <span className="font-bold text-emerald-700 dark:text-emerald-400">₹15,000</span> from <span className="font-semibold">Sharma & Sons</span> is ready.
            </p>
          </div>

          {/* Attached Invoice PDF Card */}
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-[#111B21] border border-slate-200/80 dark:border-slate-700">
            <div className="w-8 h-8 rounded bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 flex items-center justify-center font-bold text-[10px] shrink-0">
              PDF
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Tax-Invoice-INV-2026-089.pdf</p>
              <p className="text-[10px] text-slate-600 dark:text-slate-400">142 KB • 100% Tax Compliant</p>
            </div>
          </div>

          {/* Direct Payment Action Button */}
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="w-full py-2 text-center text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center gap-1.5 cursor-pointer">
              <span>💳 Pay via UPI QR / Netbanking</span>
            </div>
          </div>

          {/* Timestamp and delivery double check */}
          <div className="flex items-center justify-end gap-1 text-[10px] text-slate-800 dark:text-slate-200 font-semibold">
            <span>10:45 AM</span>
            <span className="text-[#53BDEB] font-bold">✓✓</span>
          </div>
        </div>

        {/* Live Seen Notification Toast */}
        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-md flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Client viewed bill • Paid ₹15,000 via PhonePe
          </span>
        </div>
      </div>
    </div>
  );
};
