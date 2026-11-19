import React, { useState } from "react";
import { Shield } from "lucide-react";

export const FreeGstCalculator: React.FC = () => {
  const [amount, setAmount] = useState<number>(10000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [isInclusive, setIsInclusive] = useState<boolean>(false);
  const [isInterState, setIsInterState] = useState<boolean>(false); // intra vs inter state

  const quickPresets = [1000, 5000, 10000, 50000];

  const calculations = (() => {
    const base = amount || 0;
    
    // Calculate inclusive values
    const incBasePrice = base / (1 + gstRate / 100);
    const incTotalGst = base - incBasePrice;
    
    // Calculate exclusive values
    const excBasePrice = base;
    const excTotalGst = base * (gstRate / 100);

    if (isInclusive) {
      const splitGst = incTotalGst / 2;
      return {
        basePrice: incBasePrice,
        cgst: splitGst,
        sgst: splitGst,
        igst: incTotalGst,
        totalGst: incTotalGst,
        totalAmount: base,
        compareBasePrice: excBasePrice,
        compareTotalGst: excTotalGst,
        compareTotalAmount: base + excTotalGst,
        compareType: "Exclusive"
      };
    } else {
      const splitGst = excTotalGst / 2;
      return {
        basePrice: excBasePrice,
        cgst: splitGst,
        sgst: splitGst,
        igst: excTotalGst,
        totalGst: excTotalGst,
        totalAmount: base + excTotalGst,
        compareBasePrice: incBasePrice,
        compareTotalGst: incTotalGst,
        compareTotalAmount: base,
        compareType: "Inclusive"
      };
    }
  })();

  const basePercent = calculations.totalAmount ? (calculations.basePrice / calculations.totalAmount) * 100 : 100;
  const taxPercent = 100 - basePercent;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden text-slate-800 dark:text-slate-100">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Free Business Tool</span>
          <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white mt-1">Instant GST Tax Calculator</p>
        </div>
        <button
          onClick={() => {
            setAmount(10000);
            setGstRate(18);
            setIsInclusive(false);
            setIsInterState(false);
          }}
          className="text-[10px] font-black text-slate-600 dark:text-slate-400 hover:text-primary transition-colors cursor-pointer uppercase border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950"
        >
          Reset Tool
        </button>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Input Controls */}
        <div className="md:col-span-7 space-y-5 min-w-0">
          {/* Amount input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Base Amount (₹)</label>
              <span className="text-[9px] text-slate-800 dark:text-slate-200 font-bold">Type or select preset</span>
            </div>
            <div className="relative mb-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-600 dark:text-slate-400 text-sm">₹</span>
              <input
                type="number"
                value={amount || ""}
                onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                placeholder="Enter amount (e.g. 10000)"
              />
            </div>
            {/* Presets row */}
            <div className="flex gap-1.5 flex-wrap">
              {quickPresets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(amount + preset)}
                  className="text-[9px] font-black px-2.5 py-1 bg-slate-105 dark:bg-slate-800/60 text-slate-650 dark:text-slate-350 rounded-lg hover:bg-blue-500 hover:text-white dark:hover:bg-blue-650 hover:-translate-y-0.5 transition-all cursor-pointer border border-transparent hover:border-blue-400"
                >
                  +₹{preset.toLocaleString("en-IN")}
                </button>
              ))}
              <button
                onClick={() => setAmount(0)}
                className="text-[9px] font-black px-2.5 py-1 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 rounded-lg hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* GST Rate select */}
            <div>
              <label htmlFor="landing-calc-gst-rate" className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">GST Rate (%)</label>
              <select
                id="landing-calc-gst-rate"
                aria-label="GST Rate Percentage"
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer shadow-sm"
              >
                <option value={5}>5% (Food / Textiles)</option>
                <option value={12}>12% (Goods / Services)</option>
                <option value={18}>18% (Standard Rate)</option>
                <option value={28}>28% (Luxury Goods)</option>
              </select>
            </div>

            {/* GST Split toggle */}
            <div>
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Supply Type</label>
              <div className="flex bg-slate-150 dark:bg-slate-955 p-1 rounded-xl border border-slate-200/50 dark:border-slate-855 h-[46px] items-center">
                <button
                  onClick={() => setIsInterState(false)}
                  className={`flex-1 text-[9px] font-black py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap px-1 ${
                    !isInterState
                      ? "bg-slate-900 dark:bg-slate-800 text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  Intra-State (CGST+SGST)
                </button>
                <button
                  onClick={() => setIsInterState(true)}
                  className={`flex-1 text-[9px] font-black py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap px-1 ${
                    isInterState
                      ? "bg-slate-900 dark:bg-slate-800 text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  Inter-State (IGST)
                </button>
              </div>
            </div>
          </div>

          {/* Inclusive vs Exclusive toggle */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">GST Inclusive or Exclusive?</label>
            </div>
            <div className="flex bg-slate-150 dark:bg-slate-955 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850 h-[46px] items-center">
              <button
                onClick={() => setIsInclusive(false)}
                className={`flex-1 text-[10px] font-black py-2 rounded-lg transition-all cursor-pointer ${
                  !isInclusive
                    ? "bg-slate-900 dark:bg-slate-800 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Exclusive (Tax Extra)
              </button>
              <button
                onClick={() => setIsInclusive(true)}
                className={`flex-1 text-[10px] font-black py-2 rounded-lg transition-all cursor-pointer ${
                  isInclusive
                    ? "bg-slate-900 dark:bg-slate-800 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Inclusive (Tax Included)
              </button>
            </div>

            {/* Explanation box */}
            <div className="mt-3 p-3.5 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100/40 dark:border-blue-900/20 rounded-xl text-[10px] text-slate-650 dark:text-slate-450 font-semibold leading-relaxed">
              {!isInclusive ? (
                <p>
                  💡 <strong>Exclusive (Tax Extra):</strong> Tax is calculated directly on top of your base price. 
                  Customer pays: <strong>₹{amount.toLocaleString("en-IN")} (Price)</strong> + <strong>₹{calculations.totalGst.toLocaleString("en-IN", { maximumFractionDigits: 2 })} ({gstRate}% GST)</strong> = <strong>₹{calculations.totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })} Total</strong>.
                </p>
              ) : (
                <p>
                  💡 <strong>Inclusive (Tax Included):</strong> The tax is already merged inside the total price. 
                  Base Price is extracted as: <strong>₹{calculations.basePrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>, and the tax portion is <strong>₹{calculations.totalGst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>. Total remains <strong>₹{amount.toLocaleString("en-IN")}</strong>.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Outputs Panel */}
        <div className="md:col-span-5 space-y-5 min-w-0">
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-850 space-y-4 font-semibold text-xs text-slate-650 dark:text-slate-3.5 bg-gradient-to-b from-slate-50 to-slate-100/60 dark:from-slate-950 dark:to-slate-950/60 shadow-lg">
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-200/50 dark:border-slate-900">Summary Sheet</p>
            
            <div className="flex justify-between">
              <span>Base Price (Net):</span>
              <span className="font-bold text-slate-900 dark:text-white">₹{calculations.basePrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            </div>

            {!isInterState ? (
              <>
                <div className="flex justify-between text-slate-500">
                  <span>CGST ({gstRate / 2}%):</span>
                  <span>₹{calculations.cgst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>SGST ({gstRate / 2}%):</span>
                  <span>₹{calculations.sgst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-slate-500">
                <span>IGST ({gstRate}%):</span>
                <span>₹{calculations.igst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="flex justify-between pt-3 border-t border-slate-200/60 dark:border-slate-800/80">
              <span>Total Tax (GST):</span>
              <span className="font-black text-blue-600 dark:text-blue-400">₹{calculations.totalGst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between pt-3.5 border-t border-slate-200/60 dark:border-slate-800/80 font-black text-sm text-slate-900 dark:text-white">
              <span>Grand Total:</span>
              <span className="text-emerald-700 dark:text-emerald-400">₹{calculations.totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Visual Split Graph Segment */}
          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-black uppercase text-slate-600 dark:text-slate-400">
              <span>Base ({basePercent.toFixed(1)}%)</span>
              <span>Tax ({taxPercent.toFixed(1)}%)</span>
            </div>
            <div className="w-full h-3.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
              <div 
                style={{ width: `${basePercent}%` }} 
                className="h-full bg-blue-600 transition-all duration-500 ease-out" 
                title={`Base: ${basePercent.toFixed(1)}%`}
              />
              <div 
                style={{ width: `${taxPercent}%` }} 
                className="h-full bg-emerald-500 transition-all duration-500 ease-out" 
                title={`Tax: ${taxPercent.toFixed(1)}%`}
              />
            </div>
          </div>
        </div>

        {/* Transparency & Side-by-Side Comparison Hub */}
        <div className="col-span-full mt-6 pt-6 border-t border-slate-150 dark:border-slate-800/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Shield className="w-4 h-4" />
            </div>
            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Tax Transparency Hub: Exclusive vs Inclusive Comparison
            </p>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-450 font-semibold mb-4 leading-relaxed">
            For the same target amount of <strong className="text-slate-800 dark:text-slate-200">₹{(amount || 0).toLocaleString("en-IN")}</strong>, see why the GST calculations differ. 
            Exclusive GST adds tax extra on top of your amount, while Inclusive GST assumes tax is already integrated inside the amount.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Exclusive Card */}
            <div className={`p-4 rounded-2xl border transition-all duration-300 ${
              !isInclusive 
                ? 'bg-blue-500/[0.02] dark:bg-blue-500/[0.01] border-blue-500/30 dark:border-blue-500/20 ring-1 ring-blue-500/10' 
                : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-850'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Option A: GST Exclusive (Tax Extra)</span>
                {!isInclusive && (
                  <span className="text-[8px] font-black bg-blue-600 dark:bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Active Mode
                  </span>
                )}
              </div>
              <div className="space-y-2 text-[11px] font-semibold text-slate-650 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Base Price (Net):</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{(amount || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-blue-600 dark:text-blue-400">
                  <span>+ GST Amount ({gstRate}%):</span>
                  <span className="font-bold">₹{((amount || 0) * (gstRate / 100)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/80 font-black text-xs text-slate-900 dark:text-white">
                  <span>Grand Total (Customer Pays):</span>
                  <span>₹{((amount || 0) + (amount || 0) * (gstRate / 100)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-850/60 text-[9px] text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                <p className="font-bold text-slate-500 dark:text-slate-450 mb-1">💡 Why is the tax higher here?</p>
                <p>
                  Because the tax rate ({gstRate}%) is applied to the full <strong>₹{(amount || 0).toLocaleString("en-IN")}</strong>. 
                  Formula: <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded font-mono text-[8px]">Tax = Base × {gstRate / 100}</code>.
                </p>
              </div>
            </div>

            {/* Inclusive Card */}
            <div className={`p-4 rounded-2xl border transition-all duration-300 ${
              isInclusive 
                ? 'bg-blue-500/[0.02] dark:bg-blue-500/[0.01] border-blue-500/30 dark:border-blue-500/20 ring-1 ring-blue-500/10' 
                : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-850'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Option B: GST Inclusive (Tax Included)</span>
                {isInclusive && (
                  <span className="text-[8px] font-black bg-blue-600 dark:bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Active Mode
                  </span>
                )}
              </div>
              <div className="space-y-2 text-[11px] font-semibold text-slate-650 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Base Price (Extracted):</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{((amount || 0) / (1 + gstRate / 100)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 dark:text-emerald-450">
                  <span>+ GST Portion ({gstRate}%):</span>
                  <span className="font-bold">
                    ₹{((amount || 0) - (amount || 0) / (1 + gstRate / 100)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/80 font-black text-xs text-slate-900 dark:text-white">
                  <span>Grand Total (Customer Pays):</span>
                  <span>₹{(amount || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-850/60 text-[9px] text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                <p className="font-bold text-slate-500 dark:text-slate-450 mb-1">💡 Why is the tax lower here?</p>
                <p>
                  Because we assume the total is already <strong>₹{(amount || 0).toLocaleString("en-IN")}</strong>. The actual taxable value is reduced to <strong>₹{((amount || 0) / (1 + gstRate / 100)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>, and tax is calculated on this smaller base.
                  Formula: <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded font-mono text-[8px]">Base = Total ÷ (1 + {gstRate / 100})</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
