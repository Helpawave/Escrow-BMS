import React, { useState } from "react";

export const InteractiveFinanceChart: React.FC = () => {
  const [metric, setMetric] = useState<"revenue" | "receivables" | "gst">("revenue");

  const data = {
    revenue: {
      label: "Monthly Sales Growth (FY 2025-26)",
      values: [
        { label: "Dec", val: 180000, height: "45%" },
        { label: "Jan", val: 240000, height: "60%" },
        { label: "Feb", val: 210000, height: "52%" },
        { label: "Mar", val: 340000, height: "85%" },
        { label: "Apr", val: 400000, height: "100%" }
      ],
      color: "bg-blue-600 shadow-blue-500/25",
      badge: "Sales Invoiced"
    },
    receivables: {
      label: "Outstanding Udhaar (Unpaid Dues)",
      values: [
        { label: "Dec", val: 75000, height: "80%" },
        { label: "Jan", val: 45000, height: "48%" },
        { label: "Feb", val: 95000, height: "100%" },
        { label: "Mar", val: 30000, height: "32%" },
        { label: "Apr", val: 12000, height: "13%" }
      ],
      color: "bg-rose-500 shadow-rose-500/25",
      badge: "Outstanding Udhaar"
    },
    gst: {
      label: "GST Tax Collected Summary",
      values: [
        { label: "Dec", val: 32400, height: "45%" },
        { label: "Jan", val: 43200, height: "60%" },
        { label: "Feb", val: 37800, height: "52%" },
        { label: "Mar", val: 61200, height: "85%" },
        { label: "Apr", val: 72000, height: "100%" }
      ],
      color: "bg-emerald-500 shadow-emerald-500/25",
      badge: "GST Liability"
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden text-slate-800 dark:text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Business Overview</span>
          <p className="text-lg font-black text-slate-900 dark:text-white">{data[metric].label}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-150 dark:bg-slate-950 rounded-xl w-full sm:w-auto border border-slate-200/50 dark:border-slate-855 min-w-0">
          {(["revenue", "receivables", "gst"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setMetric(item)}
              className={`flex-none px-3 py-1.5 text-xs font-black rounded-lg transition-all capitalize whitespace-nowrap ${
                metric === item 
                  ? "bg-slate-900 dark:bg-slate-850 text-white shadow-sm" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {item === "revenue" ? "Sales (Earnings)" : item === "receivables" ? "Udhaar (Unpaid)" : "GST Collected"}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Visualization */}
      <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 border-b border-slate-100 dark:border-slate-850 pb-4 relative z-10 px-2 sm:px-4">
        {data[metric].values.map((bar, i) => (
          <div key={i} className="flex-1 flex flex-col items-center group h-full justify-end relative">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
              ₹{bar.val.toLocaleString("en-IN")}
            </div>
            
            {/* Animated Bar */}
            <div 
              style={{ height: bar.height }} 
              className={`w-full max-w-[48px] rounded-t-xl transition-all duration-500 ease-out hover:scale-105 shadow-lg ${data[metric].color}`}
            ></div>
            
            <span className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 mt-3.5">
              {bar.label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-colors">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Metric Type</p>
          <p className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${metric === "revenue" ? "bg-blue-500" : metric === "receivables" ? "bg-rose-500" : "bg-emerald-500"}`}></span>
            {data[metric].badge}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-colors">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Average / Month</p>
          <p className="text-base font-black text-slate-900 dark:text-white">
            ₹{(data[metric].values.reduce((sum, curr) => sum + curr.val, 0) / 5).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Dynamic Transaction Logs */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3">Recent Activity Logs</p>
        <div className="space-y-2">
          {metric === "revenue" && (
            <>
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-2.5 rounded-xl border border-slate-150/40 dark:border-slate-850 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 min-w-0"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span><span className="truncate">Received ₹24,500 from Surat Textiles Co.</span></span>
                <span className="text-[9px] text-slate-600 dark:text-slate-400 shrink-0 ml-2">03 Apr</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-2.5 rounded-xl border border-slate-150/40 dark:border-slate-850 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 min-w-0"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span><span className="truncate">Invoice paid ₹48,000 by Verma Garments</span></span>
                <span className="text-[9px] text-slate-600 dark:text-slate-400 shrink-0 ml-2">12 Apr</span>
              </div>
            </>
          )}
          {metric === "receivables" && (
            <>
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-2.5 rounded-xl border border-slate-150/40 dark:border-slate-850 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 min-w-0"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span><span className="truncate">Due Tomorrow: ₹15,000 from Ramesh (Ganesh Traders)</span></span>
                <span className="text-[8px] text-rose-600 dark:text-rose-400 uppercase font-black tracking-wider bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-900/30 shrink-0 ml-2">Pending</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-2.5 rounded-xl border border-slate-150/40 dark:border-slate-850 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 min-w-0"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0"></span><span className="truncate">Overdue 12 days: ₹9,500 from Arvind Kumar</span></span>
                <span className="text-[8px] text-red-650 dark:text-red-400 uppercase font-black tracking-wider bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/30 shrink-0 ml-2">Overdue</span>
              </div>
            </>
          )}
          {metric === "gst" && (
            <>
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-2.5 rounded-xl border border-slate-150/40 dark:border-slate-850 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 min-w-0"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span><span className="truncate">CGST (9%) Collected: ₹36,000 | SGST (9%) Collected: ₹36,000</span></span>
                <span className="text-[9px] text-slate-600 dark:text-slate-400 shrink-0 ml-2">Apr Log</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-2.5 rounded-xl border border-slate-150/40 dark:border-slate-850 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 min-w-0"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span><span className="truncate">CGST (9%) Collected: ₹30,600 | SGST (9%) Collected: ₹30,600</span></span>
                <span className="text-[9px] text-slate-600 dark:text-slate-400 shrink-0 ml-2">Mar Log</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
