import React from "react";
import { CheckCircle } from "lucide-react";

export const WhatsAppShowcase: React.FC = () => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden text-slate-800 dark:text-slate-100">
      <div className="mb-6">
        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Verified Communication</span>
        <p className="text-lg font-black text-slate-900 dark:text-white mt-1">Official WhatsApp vs Standard SMS</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Side: Standard SMS/Spam WA */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900">
          <p className="text-xs font-black text-red-800 dark:text-red-300 flex items-center gap-1.5 mb-3">
            ⚠️ Standard SMS / Unofficial Sender
          </p>
          <div className="bg-slate-200 dark:bg-slate-900 rounded-xl p-3 text-[11px] text-slate-650 dark:text-slate-400 font-medium space-y-2 border border-slate-300 dark:border-slate-800">
            <div className="flex justify-between text-[9px] text-slate-800 dark:text-slate-200 font-bold">
              <span>Sender: +91 98765 XXXXX</span>
              <span>10:15 AM</span>
            </div>
            <p className="leading-relaxed">
              Dear Customer, bill INV-109 for Rs. 15,000 from Sharma and Sons is due. Pay immediately. Link: random-unverified-url.com/pay
            </p>
          </div>
          <ul className="text-[10px] text-slate-500 dark:text-slate-400 mt-4 space-y-1.5 font-bold">
            <li className="flex items-center gap-1.5 text-red-800 dark:text-red-300">✗ No Branding / Trust Factor</li>
            <li className="flex items-center gap-1.5 text-red-800 dark:text-red-300">✗ High Spam Filtering Risk</li>
            <li className="flex items-center gap-1.5 text-red-800 dark:text-red-300">✗ No Clickable Buttons / Interactive actions</li>
          </ul>
        </div>

        {/* Right Side: Official Verified WhatsApp */}
        <div className="p-4 rounded-2xl bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/30 relative">
          <div className="absolute top-3 right-3 bg-emerald-800 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
            Recommended
          </div>
          <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-3">
            <CheckCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> Official Business API (Meta)
          </p>
          <div className="bg-[#E5DDD5] rounded-xl overflow-hidden shadow-md border border-slate-250 dark:border-slate-800 text-slate-850">
            <div className="bg-[#075E54] px-3 py-1.5 flex items-center justify-between text-white text-[10px]">
              <div className="flex items-center space-x-1.5">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 text-[8px] font-black font-sans shrink-0">EB</div>
                <span className="font-bold flex items-center gap-0.5">
                  Sharma & Sons 
                  <span className="text-sky-400 text-[8px]">✓</span>
                </span>
              </div>
              <span className="opacity-70 text-[8px]">10:15 AM</span>
            </div>
            <div className="p-2.5 bg-[url('/wa-bg.webp')] bg-repeat bg-contain">
              <div className="bg-white p-2.5 rounded-lg rounded-tl-none shadow-sm text-[10px] space-y-1.5">
                <p className="font-bold text-[#075E54]">📄 Invoice Ready</p>
                <p>Hello Ramesh, your invoice <strong>INV-2026-089</strong> for <strong>₹15,000</strong> is ready. Please view invoice & pay securely using the button below. Thank you!</p>
                <div className="border-t border-slate-100 pt-1.5 flex flex-col gap-1">
                  <div className="bg-slate-50 border border-slate-100 hover:bg-slate-100 text-[#075E54] font-bold py-1 text-center rounded text-[9px] cursor-pointer flex items-center justify-center gap-1">
                    💳 Pay Instantly (UPI)
                  </div>
                  <div className="bg-slate-50 border border-slate-100 hover:bg-slate-100 text-[#075E54] font-bold py-1 text-center rounded text-[9px] cursor-pointer flex items-center justify-center gap-1">
                    📄 Download PDF Invoice
                  </div>
                </div>
              </div>
            </div>
          </div>
          <ul className="text-[10px] text-slate-650 dark:text-slate-350 mt-4 space-y-1.5 font-bold">
            <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400"><CheckCircle className="w-3.5 h-3.5" /> Custom Branding & Verified Green Tick badge</li>
            <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400"><CheckCircle className="w-3.5 h-3.5" /> High 98% Read Rates & Immediate Response</li>
            <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400"><CheckCircle className="w-3.5 h-3.5" /> Interactive Buttons for Instant PDF Download or UPI Pay</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
