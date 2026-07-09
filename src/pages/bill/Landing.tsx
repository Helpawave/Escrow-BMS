import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FileText,
  Users,
  CreditCard,
  BarChart3,
  Zap,
  Shield,
  Globe,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Star,
  Menu,
  X,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2,
  TrendingUp,
  Settings,
  Layers,
  HelpCircle,
  Calculator,
  Home
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

import { SEO } from "@/components/SEO";

// ==========================================
// 1. Live Mini-Invoice Calculator Component
// ==========================================
const LiveInvoiceDemo = () => {
  const [items, setItems] = useState([
    { id: 1, name: "Consulting Services", qty: 2, rate: 2500 },
    { id: 2, name: "Premium Widget Model-B", qty: 1, rate: 8400 }
  ]);
  const [gstRate, setGstRate] = useState(18); // 18% standard
  const [notification, setNotification] = useState<string | null>(null);

  const applyTemplate = (type: "agency" | "retail" | "freelance") => {
    if (type === "agency") {
      setItems([
        { id: 1, name: "Monthly Retainer Services", qty: 1, rate: 45000 },
        { id: 2, name: "SEO Optimization Package", qty: 1, rate: 12000 }
      ]);
    } else if (type === "retail") {
      setItems([
        { id: 1, name: "Premium Basmati Rice 5kg", qty: 10, rate: 850 },
        { id: 2, name: "Organic Refined Mustard Oil 1L", qty: 5, rate: 195 },
        { id: 3, name: "Pure Dairy Ghee 1L", qty: 2, rate: 680 }
      ]);
    } else {
      setItems([
        { id: 1, name: "React Frontend Dev Milestone", qty: 1, rate: 65000 },
        { id: 2, name: "AWS Cloud Setup & Deployment", qty: 1, rate: 18000 }
      ]);
    }
    showNotification("✔ Template loaded successfully!");
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const addItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    setItems([...items, { id: newId, name: "Custom Item / Product", qty: 1, rate: 1500 }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: number, field: "qty" | "rate" | "name", value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const subtotal = items.reduce((acc, curr) => acc + (curr.qty * curr.rate), 0);
  const gstAmount = subtotal * (gstRate / 100);
  const total = subtotal + gstAmount;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden text-slate-800 dark:text-slate-100">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Interactive Calculator</span>
          <h4 className="text-lg font-black text-slate-900 dark:text-white">GST Invoice Preview</h4>
        </div>
        <select 
          value={gstRate}
          onChange={(e) => setGstRate(Number(e.target.value))}
          className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-blue-500"
        >
          <option value={5}>GST 5% (Textiles/Food)</option>
          <option value={12}>GST 12% (Goods/Services)</option>
          <option value={18}>GST 18% (Standard Services)</option>
          <option value={28}>GST 28% (Luxury Goods)</option>
        </select>
      </div>

      {/* Quick Templates Row */}
      <div className="mb-4">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Select Template:</p>
        <div className="flex flex-wrap gap-1.5">
          <button 
            onClick={() => applyTemplate("agency")}
            className="text-[10px] font-black px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-750 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-650 transition-all border border-slate-200/50 dark:border-slate-800"
          >
            🏢 Agency
          </button>
          <button 
            onClick={() => applyTemplate("retail")}
            className="text-[10px] font-black px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-750 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-650 transition-all border border-slate-200/50 dark:border-slate-800"
          >
            🛒 Grocery Shop
          </button>
          <button 
            onClick={() => applyTemplate("freelance")}
            className="text-[10px] font-black px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-750 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-650 transition-all border border-slate-200/50 dark:border-slate-800"
          >
            💻 Dev Service
          </button>
        </div>
      </div>

      {/* Invoice Form */}
      <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 animate-fade-in">
            <div className="flex-1 min-w-0 w-full">
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateItem(item.id, "name", e.target.value)}
                className="w-full text-xs font-bold bg-transparent border-0 p-0 focus:ring-0 text-slate-900 dark:text-white truncate"
                placeholder="Item name"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                <button 
                  onClick={() => updateItem(item.id, "qty", Math.max(1, item.qty - 1))}
                  className="px-2 py-1 text-xs hover:bg-slate-100 dark:hover:bg-slate-850 font-bold"
                >
                  -
                </button>
                <span className="px-3 text-xs font-bold">{item.qty}</span>
                <button 
                  onClick={() => updateItem(item.id, "qty", item.qty + 1)}
                  className="px-2 py-1 text-xs hover:bg-slate-100 dark:hover:bg-slate-850 font-bold"
                >
                  +
                </button>
              </div>

              <div className="flex items-center gap-1.5 min-w-[90px]">
                <span className="text-xs text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  value={item.rate}
                  onChange={(e) => updateItem(item.id, "rate", Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs font-bold bg-transparent border-0 p-0 focus:ring-0 text-slate-900 dark:text-white text-right"
                  placeholder="Rate"
                />
              </div>

              <button 
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/40 p-1.5 rounded-lg transition-colors"
                title="Remove Item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={addItem}
        className="mt-3 flex items-center justify-center gap-2 w-full border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 py-2.5 rounded-xl text-xs font-bold transition-all text-slate-500 dark:text-slate-400 hover:bg-blue-50/20"
      >
        <Plus className="w-4 h-4" /> Add Line Item
      </button>

      {/* Invoice Totals Calculator */}
      <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>CGST ({gstRate / 2}%)</span>
          <span>₹{(gstAmount / 2).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>SGST ({gstRate / 2}%)</span>
          <span>₹{(gstAmount / 2).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-850">
          <span>Total GST Amount</span>
          <span className="text-blue-600 dark:text-blue-400">₹{total.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Action Row */}
      <div className="mt-5 pt-4 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between gap-3">
        <button
          onClick={() => showNotification("✔ Mock PDF generated successfully and ready to print!")}
          className="flex-1 text-[10px] font-black py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-blue-600 dark:hover:bg-blue-700 transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
        >
          🖨 Print Invoice
        </button>
        <button
          onClick={() => showNotification("✔ Payment link shared successfully via simulated WhatsApp notifier!")}
          className="flex-1 text-[10px] font-black py-2.5 px-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
        >
          💬 Share Reminders
        </button>
      </div>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="absolute bottom-4 left-4 right-4 bg-slate-950 text-white border border-white/10 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-2xl justify-center z-30"
          >
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// 2. Interactive Finance Chart Component
// ==========================================
const InteractiveFinanceChart = () => {
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
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden text-slate-800 dark:text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Real-time Analytics</span>
          <h4 className="text-lg font-black text-slate-900 dark:text-white">{data[metric].label}</h4>
        </div>
        <div className="flex gap-1.5 p-1 bg-slate-150 dark:bg-slate-950 rounded-xl w-full sm:w-auto border border-slate-200/50 dark:border-slate-855">
          {(["revenue", "receivables", "gst"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setMetric(item)}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-black rounded-lg transition-all capitalize whitespace-nowrap ${
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
            
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 mt-3.5">
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
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Recent Activity Logs</p>
        <div className="space-y-2">
          {metric === "revenue" && (
            <>
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-2.5 rounded-xl border border-slate-150/40 dark:border-slate-850 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Received ₹24,500 from Surat Textiles Co.</span>
                <span className="text-[9px] text-slate-400">03 Apr</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-2.5 rounded-xl border border-slate-150/40 dark:border-slate-850 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Invoice paid ₹48,000 by Verma Garments</span>
                <span className="text-[9px] text-slate-400">12 Apr</span>
              </div>
            </>
          )}
          {metric === "receivables" && (
            <>
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-2.5 rounded-xl border border-slate-150/40 dark:border-slate-850 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Due Tomorrow: ₹15,000 from Ramesh (Ganesh Traders)</span>
                <span className="text-[8px] text-rose-600 dark:text-rose-400 uppercase font-black tracking-wider bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-900/30">Pending</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-2.5 rounded-xl border border-slate-150/40 dark:border-slate-850 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>Overdue 12 days: ₹9,500 from Arvind Kumar</span>
                <span className="text-[8px] text-red-650 dark:text-red-400 uppercase font-black tracking-wider bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/30">Overdue</span>
              </div>
            </>
          )}
          {metric === "gst" && (
            <>
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-2.5 rounded-xl border border-slate-150/40 dark:border-slate-850 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>CGST (9%) Collected: ₹36,000 | SGST (9%) Collected: ₹36,000</span>
                <span className="text-[9px] text-slate-400">Apr Log</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-2.5 rounded-xl border border-slate-150/40 dark:border-slate-850 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>CGST (9%) Collected: ₹30,600 | SGST (9%) Collected: ₹30,600</span>
                <span className="text-[9px] text-slate-400">Mar Log</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};




// ==========================================
// 3. Official WhatsApp Business Showcase Component
// ==========================================
const WhatsAppShowcase = () => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden text-slate-800 dark:text-slate-100">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-green-600"></div>
      
      <div className="mb-6">
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Verified Communication</span>
        <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1">Official WhatsApp vs Standard SMS</h4>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Side: Standard SMS/Spam WA */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 opacity-75">
          <p className="text-xs font-black text-red-500 flex items-center gap-1.5 mb-3">
            ⚠️ Standard SMS / Unofficial Sender
          </p>
          <div className="bg-slate-200 dark:bg-slate-900 rounded-xl p-3 text-[11px] text-slate-650 dark:text-slate-400 font-medium space-y-2 border border-slate-300 dark:border-slate-800">
            <div className="flex justify-between text-[9px] text-slate-400 font-bold">
              <span>Sender: +91 98765 XXXXX</span>
              <span>10:15 AM</span>
            </div>
            <p className="leading-relaxed">
              Dear Customer, bill INV-109 for Rs. 15,000 from Sharma and Sons is due. Pay immediately. Link: random-unverified-url.com/pay
            </p>
          </div>
          <ul className="text-[10px] text-slate-500 dark:text-slate-400 mt-4 space-y-1.5 font-bold">
            <li className="flex items-center gap-1.5 text-red-500">✗ No Branding / Trust Factor</li>
            <li className="flex items-center gap-1.5 text-red-500">✗ High Spam Filtering Risk</li>
            <li className="flex items-center gap-1.5 text-red-500">✗ No Clickable Buttons / Interactive actions</li>
          </ul>
        </div>

        {/* Right Side: Official Verified WhatsApp */}
        <div className="p-4 rounded-2xl bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/30 relative">
          <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
            Recommended
          </div>
          <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-3">
            <CheckCircle className="w-4 h-4 text-emerald-500" /> Official Business API (Meta)
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
            <div className="p-2.5 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-contain">
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
            <li className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><CheckCircle className="w-3.5 h-3.5" /> Custom Branding & Verified Green Tick badge</li>
            <li className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><CheckCircle className="w-3.5 h-3.5" /> High 98% Read Rates & Immediate Response</li>
            <li className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><CheckCircle className="w-3.5 h-3.5" /> Interactive Buttons for Instant PDF Download or UPI Pay</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. Invoice Template Gallery Component
// ==========================================
const InvoiceTemplateGallery = () => {
  const [activeTab, setActiveTab] = useState<"standard" | "modern" | "corporate" | "thermal">("modern");

  const templates = {
    standard: {
      name: "Tally GST Classic",
      desc: "Traditional, government-style tax invoice preferred by CA practitioners and heavy industries.",
      headerBg: "bg-slate-100 dark:bg-slate-900 border-b-2 border-slate-800 dark:border-slate-200",
      accentText: "text-slate-800 dark:text-slate-200",
      layoutClass: "font-mono text-[9px]",
      showHeader: true,
      borderClass: "border-slate-800 dark:border-slate-600"
    },
    modern: {
      name: "Sleek Modern Blue",
      desc: "Vibrant accent colors, professional typography, perfect for tech, agencies, and retail brands.",
      headerBg: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white",
      accentText: "text-blue-600 dark:text-blue-400",
      layoutClass: "font-sans text-[9px]",
      showHeader: true,
      borderClass: "border-blue-100 dark:border-blue-900/50"
    },
    corporate: {
      name: "Elegant Charcoal",
      desc: "Dark grey headers, clean geometric margins, structured signature blocks, built for consulting groups.",
      headerBg: "bg-slate-800 text-white dark:bg-slate-700",
      accentText: "text-slate-700 dark:text-slate-300",
      layoutClass: "font-sans text-[9px]",
      showHeader: true,
      borderClass: "border-slate-200 dark:border-slate-750"
    },
    thermal: {
      name: "58mm Retail Receipt",
      desc: "Compact billing style optimized for fast thermal printing in grocery shops and supermarkets.",
      headerBg: "bg-transparent border-b border-dashed border-slate-400",
      accentText: "text-black dark:text-white",
      layoutClass: "font-mono text-[8px] max-w-[280px] mx-auto",
      showHeader: false,
      borderClass: "border-dashed border-slate-300 dark:border-slate-700"
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden text-slate-800 dark:text-slate-100">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Visual Styles</span>
          <h4 className="text-lg font-black text-slate-900 dark:text-white">Choose Your Invoice Template</h4>
        </div>
        <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850">
          {(["standard", "modern", "corporate", "thermal"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all capitalize ${
                activeTab === tab
                  ? "bg-slate-900 dark:bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-semibold">
        {templates[activeTab].desc}
      </p>

      {/* Invoice Render Preview Box */}
      <div className={`bg-white text-slate-800 p-6 rounded-2xl border ${templates[activeTab].borderClass} shadow-inner min-h-[300px] flex flex-col justify-between ${templates[activeTab].layoutClass}`}>
        {/* Invoice Header */}
        <div>
          <div className={`p-4 rounded-xl flex justify-between items-center mb-4 ${templates[activeTab].headerBg}`}>
            <div>
              <h5 className="font-black text-xs uppercase tracking-wider">TAX INVOICE</h5>
              <p className="opacity-80">Sharma & Sons Pvt. Ltd.</p>
              <p className="opacity-80 text-[8px]">GSTIN: 24AADCS9081J1ZP</p>
            </div>
            <div className="text-right">
              <p className="font-bold">INV-2026-089</p>
              <p className="opacity-85">Date: 03 Jun 2026</p>
            </div>
          </div>

          {/* Client Details */}
          <div className="flex justify-between mb-4 border-b pb-2 border-slate-100">
            <div>
              <p className="text-slate-400 font-bold uppercase text-[7px]">Billed To:</p>
              <p className="font-black">Ganesh Traders</p>
              <p className="text-slate-500">Noida, Uttar Pradesh, India</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 font-bold uppercase text-[7px]">Payment Mode:</p>
              <p className="font-bold text-emerald-600">UPI QR / Netbanking</p>
            </div>
          </div>

          {/* Table Items */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[7px] uppercase font-bold">
                <th className="py-1">Item Description</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Rate</th>
                <th className="py-1 text-right">Tax (GST)</th>
                <th className="py-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-1.5 font-bold">Premium Basmati Rice 5kg</td>
                <td className="py-1.5 text-center">10</td>
                <td className="py-1.5 text-right">₹850</td>
                <td className="py-1.5 text-right">5%</td>
                <td className="py-1.5 text-right">₹8,925</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1.5 font-bold">Organic Refined Mustard Oil 1L</td>
                <td className="py-1.5 text-center">5</td>
                <td className="py-1.5 text-right">₹195</td>
                <td className="py-1.5 text-right">12%</td>
                <td className="py-1.5 text-right">₹1,092</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col items-end gap-1.5">
          <div className="w-48 space-y-1">
            <div className="flex justify-between text-slate-500 text-[8px] font-bold">
              <span>Subtotal:</span>
              <span>₹9,475</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[8px] font-bold">
              <span>GST Total Collected:</span>
              <span>₹542</span>
            </div>
            <div className="flex justify-between text-slate-900 text-xs font-black pt-1.5 border-t border-slate-100">
              <span>Grand Total:</span>
              <span className={templates[activeTab].accentText}>₹10,017</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. Industry-wise Solutions Switcher Component
// ==========================================
interface IndustrySolutionsProps {
  activeTab: "retail" | "wholesale" | "services";
  setActiveTab: (tab: "retail" | "wholesale" | "services") => void;
}

const IndustrySolutions = ({ activeTab, setActiveTab }: IndustrySolutionsProps) => {

  const data = {
    retail: {
      title: "Grocery Shops & Retail Supermarkets",
      desc: "Get your customers billed in seconds with superfast checkouts, custom print receipt layouts, and instant inventory updates.",
      features: [
        { title: "Fast POS Invoicing", detail: "Generate compact 58mm/80mm thermal bills or full A4/A5 receipts in under 10 seconds." },
        { title: "Barcode Scanner Support", detail: "Connect any USB or Bluetooth barcode scanner to add products to invoices automatically." },
        { title: "Low Stock Real-time Alerts", detail: "Never run out of essential stocks. Receive alert prompts when inventory limits hit red." }
      ],
      icon: "🛒",
      badge: "Retail & Checkout ready",
      color: "from-blue-600 to-cyan-500"
    },
    wholesale: {
      title: "Wholesalers, Garments & Bulk Traders",
      desc: "Manage multiple buyer ledgers, tracks credit logs (Udhaar accounts), and log bulk purchase invoices easily in one dashboard.",
      features: [
        { title: "Bulk Product Excel Import", detail: "Import thousands of inventory items, HSN codes, and custom tax brackets in one click." },
        { title: "Customer Credit Accounts (Ledger)", detail: "Keep chronological logs of outstanding balances, payments, and print statements for clients." },
        { title: "CA-Friendly Reports", detail: "Export complete invoice ledger sheets directly to Excel format for quick GSTR filings." }
      ],
      icon: "📦",
      badge: "B2B & Credit Ledgers",
      color: "from-purple-600 to-indigo-500"
    },
    services: {
      title: "Agencies, Consultants & Freelancers",
      desc: "Perfect for milestone project billing, custom tax consulting, retainer invoices, and sharing professional payment links on WhatsApp.",
      features: [
        { title: "Milestone-based Payments", detail: "Create structured invoices based on project milestones (e.g. 50% Advance, 50% Dev Complete)." },
        { title: "Instant UPI QR Codes", detail: "Embed GPay, PhonePe, and Paytm payment links directly onto invoices to speed up settlements." },
        { title: "Professional Multi-Currency", detail: "Create export invoices in USD, EUR, or GBP, automatically adjusting for domestic tax logs." }
      ],
      icon: "💻",
      badge: "Agencies & Creators",
      color: "from-emerald-600 to-teal-500"
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden text-slate-800 dark:text-slate-100">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500"></div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Solutions For You</span>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Tailored for Your Business Model</h4>
        </div>
        <div className="flex gap-1.5 p-1 bg-slate-150 dark:bg-slate-950 rounded-xl border border-slate-250/50 dark:border-slate-855 w-full lg:w-auto">
          {(["retail", "wholesale", "services"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 lg:flex-none px-4 py-2 text-xs font-black rounded-lg transition-all capitalize whitespace-nowrap cursor-pointer ${
                activeTab === tab
                  ? "bg-slate-900 dark:bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {tab === "retail" ? "🛒 Retail & Shops" : tab === "wholesale" ? "📦 Wholesale" : "💻 Services/Freelancers"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-950/30 px-3 py-1 rounded-full text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            {data[activeTab].badge}
          </div>
          <h5 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
            {data[activeTab].title}
          </h5>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            {data[activeTab].desc}
          </p>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            {data[activeTab].features.map((feat, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 hover:border-purple-500/25 transition-all">
                <h6 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  {feat.title}
                </h6>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {feat.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 relative flex justify-center">
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-[2.5rem] blur-2xl opacity-15"></div>
          
          <div className="relative w-full max-w-[280px] aspect-square rounded-[2rem] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center p-6 text-center space-y-4">
            <span className="text-6xl select-none">{data[activeTab].icon}</span>
            <div className="space-y-1">
              <p className="font-black text-sm text-slate-900 dark:text-white">EscrowBill {activeTab.toUpperCase()} Mode</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Optimized Setup</p>
            </div>
            <div className={`h-1.5 w-24 rounded-full bg-gradient-to-r ${data[activeTab].color}`}></div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium px-4">
              All settings are auto-tuned dynamically once you select your business type during onboarding.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. Free Built-in GST Calculator Component
// ==========================================
const FreeGstCalculator = () => {
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
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden text-slate-800 dark:text-slate-100">
      {/* Visual background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Free Business Tool</span>
          <h4 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mt-1">Instant GST Tax Calculator</h4>
        </div>
        <button
          onClick={() => {
            setAmount(10000);
            setGstRate(18);
            setIsInclusive(false);
            setIsInterState(false);
          }}
          className="text-[10px] font-black text-slate-400 hover:text-primary transition-colors cursor-pointer uppercase border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950"
        >
          Reset Tool
        </button>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Input Controls */}
        <div className="md:col-span-7 space-y-5">
          {/* Amount input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Base Amount (₹)</label>
              <span className="text-[9px] text-slate-400 font-bold">Type or select preset</span>
            </div>
            <div className="relative mb-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">₹</span>
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
                className="text-[9px] font-black px-2.5 py-1 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 rounded-lg hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* GST Rate select */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">GST Rate (%)</label>
              <select
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Supply Type</label>
              <div className="flex bg-slate-150 dark:bg-slate-955 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850 h-[46px] items-center">
                <button
                  onClick={() => setIsInterState(false)}
                  className={`flex-1 text-[9px] font-black py-2 rounded-lg transition-all cursor-pointer ${
                    !isInterState
                      ? "bg-slate-900 dark:bg-slate-800 text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  Intra-State (CGST+SGST)
                </button>
                <button
                  onClick={() => setIsInterState(true)}
                  className={`flex-1 text-[9px] font-black py-2 rounded-lg transition-all cursor-pointer ${
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">GST Inclusive or Exclusive?</label>
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
        <div className="md:col-span-5 space-y-5">
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-850 space-y-4 font-semibold text-xs text-slate-650 dark:text-slate-3.5 bg-gradient-to-b from-slate-50 to-slate-100/60 dark:from-slate-950 dark:to-slate-950/60 shadow-lg">
            <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-2 border-b border-slate-200/50 dark:border-slate-900">Summary Sheet</h5>
            
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
              <span className="text-emerald-600 dark:text-emerald-400">₹{calculations.totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Visual Split Graph Segment */}
          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
              <span>Base ({basePercent.toFixed(1)}%)</span>
              <span>Tax ({taxPercent.toFixed(1)}%)</span>
            </div>
            <div className="w-full h-3.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
              <div 
                style={{ width: `${basePercent}%` }} 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out" 
                title={`Base: ${basePercent.toFixed(1)}%`}
              />
              <div 
                style={{ width: `${taxPercent}%` }} 
                className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500 ease-out" 
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
            <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Tax Transparency Hub: Exclusive vs Inclusive Comparison
            </h5>
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
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Option A: GST Exclusive (Tax Extra)</span>
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
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-850/60 text-[9px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
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
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Option B: GST Inclusive (Tax Included)</span>
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
                <div className="flex justify-between text-emerald-600 dark:text-emerald-450">
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
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-850/60 text-[9px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
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


// ==========================================
// 7. Expandable FAQ Accordion Component
// ==========================================
const AccordionFAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "Do I need to know accounting to use EscrowBill?",
      a: "Not at all. EscrowBill is built specifically for business owners, not chartered accountants. We do not use complex financial terms or debit/credit math. If you can use WhatsApp, you can manage your invoicing, payments, and stock records here in minutes.",
      icon: <Users className="w-5 h-5 text-blue-600" />
    },
    {
      q: "Is there really a free trial? Are there any hidden conditions?",
      a: "Yes, we offer a 30-day fully functional free trial. We do not ask for credit card details, and there are no automatic renewal setups or hidden integration fees. Test it for your business, and only upgrade if you find value.",
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />
    },
    {
      q: "What happens if my phone or laptop gets damaged? Will I lose my records?",
      a: "No, your data is 100% secure. Everything is encrypted and automatically backed up to our secure cloud servers every hour. If your device breaks or is lost, simply log in from any other phone or computer to resume billing instantly.",
      icon: <Shield className="w-5 h-5 text-amber-600" />
    },
    {
      q: "Can I export reports for my CA or accountant?",
      a: "Yes. You can export clean, accountant-friendly Excel worksheets of all your invoices, sales logs, purchase records, and business expenses in one click. This makes tax filing and GSTR compliance extremely straightforward.",
      icon: <FileText className="w-5 h-5 text-purple-650" />
    }
  ];



  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className="bg-background border border-slate-200/60 dark:border-slate-800/80 rounded-2xl overflow-hidden hover:shadow-md transition-all">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between p-5 text-left font-black text-sm text-slate-900 dark:text-white cursor-pointer select-none border-0 bg-transparent"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0">
                  {faq.icon}
                </div>
                <span>{faq.q}</span>
              </div>
              <span className="text-xs text-slate-400 select-none">{isOpen ? "▲" : "▼"}</span>
            </button>
            
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="border-t border-slate-100 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-950/20"
                >
                  <p className="p-5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

const Landing = () => {
  const [solutionsTab, setSolutionsTab] = useState<"retail" | "wholesale" | "services">("retail");

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: <FileText className="w-6 h-6 text-blue-500" aria-hidden="true" />,
      title: "Smart Invoicing",
      description: "Create professional GST-compliant invoices in seconds. Auto-save, templates, and multi-currency support included.",
      className: "md:col-span-2 bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-950"
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" aria-hidden="true" />,
      title: "Auto-Reminders",
      description: "Set it and forget it. Automated email, SMS, and WhatsApp alerts for due bills.",
      className: "md:col-span-1 bg-yellow-50/30 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-950"
    },
    {
      icon: <CreditCard className="w-6 h-6 text-green-500" aria-hidden="true" />,
      title: "Instant Payments",
      description: "Accept UPI, Cards, and Netbanking. Payments reconcile automatically in your ledgers.",
      className: "md:col-span-1 bg-green-50/30 dark:bg-green-900/10 border-green-100 dark:border-green-950"
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-purple-500" aria-hidden="true" />,
      title: "Financial Insights",
      description: "Real-time analytics dashboard to track tax liabilities, sales trends, and outstanding collections.",
      className: "md:col-span-2 bg-purple-50/30 dark:bg-purple-900/10 border-purple-100 dark:border-purple-950"
    }
  ];

  const pricingPlans = [
    {
      name: "Monthly",
      price: "₹349",
      period: "/month",
      description: "Ideal for freelancers, small retail shops & creators",
      features: [
        "Unlimited invoices & clients",
        "GST tax rates & automated calculations",
        "WhatsApp & SMS payment reminders",
        "Product inventory tracking",
        "Expense & purchase logging",
        "Printable tax invoices (Standard templates)"
      ],
      popular: false
    },
    {
      name: "Yearly",
      price: "₹3,499",
      period: "/year",
      description: "Best for wholesalers, distributors & growing businesses",
      features: [
        "Everything in the Monthly plan",
        "Premium white-labeled invoices (Hide EscrowBill branding)",
        "CA-ready financial reports (Excel exports)",
        "Advanced low-stock email alerts",
        "Custom business signatures & T&C presets",
        "Direct human phone & WhatsApp support"
      ],
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 overflow-x-hidden pb-28 md:pb-0">
      <SEO 
        title="Simple GST Invoicing & Inventory Software for Small Businesses" 
        description="GST billing, stock tracking, and payment reminders built specifically for Indian traders, wholesalers, and small businesses. Create professional invoices in 10 seconds and get paid 3x faster with ESCROWBILL."
        keywords="escrow billing india, gst invoicing software, simple billing app india, automated payment reminders, professional invoice templates, small business inventory"
      />
      
      {/* Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-350 ${
          isScrolled ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm py-2" : "bg-transparent py-3"
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 shrink-0">
            <img
              src="/assets/images/e9085822-5bea-4642-b19e-dcfcde6248f7.png"
              alt="ESCROWBILL Logo"
              className="w-10 h-10 object-contain hover:rotate-12 transition-transform duration-300"
            />
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-blue-400 dark:to-purple-400">
              ESCROWBILL
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <nav className="flex items-center space-x-8">
              {/* Features Menu with Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setActiveDropdown("features")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors py-2 flex items-center gap-1">
                  Features
                  <span className="text-[10px] text-slate-400">▼</span>
                </button>
                
                <AnimatePresence>
                  {activeDropdown === "features" && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 mt-1 w-[480px] bg-background border border-border shadow-2xl rounded-2xl p-6 grid grid-cols-2 gap-4"
                    >
                      <a href="#features" className="flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-900 p-2 rounded-xl transition-all cursor-pointer">
                        <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-foreground">GST Invoicing</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Compliant templates & HSN tracking</p>
                        </div>
                      </a>
                      <a href="#reminders" className="flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-900 p-2 rounded-xl transition-all cursor-pointer">
                        <Zap className="w-5 h-5 text-yellow-500 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-foreground">Auto Reminders</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">SMS, WhatsApp & email notifications</p>
                        </div>
                      </a>
                      <a href="#payments" className="flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-900 p-2 rounded-xl transition-all cursor-pointer">
                        <CreditCard className="w-5 h-5 text-green-500 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-foreground">Secure Payments</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Automated reconciliation via UPI</p>
                        </div>
                      </a>
                      <a href="#analytics" className="flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-900 p-2 rounded-xl transition-all cursor-pointer">
                        <BarChart3 className="w-5 h-5 text-purple-500 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-foreground">Reports & Ledgers</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Tax calculations & CA-ready reports</p>
                        </div>
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Solutions Menu with Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setActiveDropdown("solutions")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors py-2 flex items-center gap-1">
                  Solutions
                  <span className="text-[10px] text-slate-400">▼</span>
                </button>
                
                <AnimatePresence>
                  {activeDropdown === "solutions" && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 mt-1 w-[400px] bg-background border border-border shadow-2xl rounded-2xl p-6 grid grid-cols-2 gap-4"
                    >
                      <button 
                        onClick={() => {
                          setSolutionsTab("retail");
                          document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' });
                          setActiveDropdown(null);
                        }}
                        className="text-left w-full block hover:bg-slate-50 dark:hover:bg-slate-900 p-2 rounded-xl transition-all cursor-pointer bg-transparent border-0 focus:outline-none"
                      >
                        <p className="text-xs font-bold text-foreground">Retail & Shops</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Quick barcode billing & checkout</p>
                      </button>
                      <button 
                        onClick={() => {
                          setSolutionsTab("wholesale");
                          document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' });
                          setActiveDropdown(null);
                        }}
                        className="text-left w-full block hover:bg-slate-50 dark:hover:bg-slate-900 p-2 rounded-xl transition-all cursor-pointer bg-transparent border-0 focus:outline-none"
                      >
                        <p className="text-xs font-bold text-foreground">Wholesalers</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Bulk catalog ledgers & credit logs</p>
                      </button>
                      <button 
                        onClick={() => {
                          setSolutionsTab("services");
                          document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' });
                          setActiveDropdown(null);
                        }}
                        className="text-left w-full block hover:bg-slate-50 dark:hover:bg-slate-900 p-2 rounded-xl transition-all cursor-pointer bg-transparent border-0 focus:outline-none"
                      >
                        <p className="text-xs font-bold text-foreground">Agencies</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Retainers & task milestone bills</p>
                      </button>
                      <button 
                        onClick={() => {
                          setSolutionsTab("wholesale");
                          document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' });
                          setActiveDropdown(null);
                        }}
                        className="text-left w-full block hover:bg-slate-50 dark:hover:bg-slate-900 p-2 rounded-xl transition-all cursor-pointer bg-transparent border-0 focus:outline-none"
                      >
                        <p className="text-xs font-bold text-foreground">Distributors</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Manage purchase orders & inventory</p>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <a href="#pricing" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors relative group">
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </a>
              <a href="#faq" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors relative group">
                FAQ
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </a>
            </nav>
            <div className="flex items-center space-x-4 border-l border-border pl-8">
              <ThemeToggle />
              {user ? (
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-full px-8 h-11 font-bold" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" className="font-bold" asChild>
                    <Link to="/auth">Sign In</Link>
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 rounded-full px-8 h-11 font-black" asChild>
                    <Link to="/auth?view=signup">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-4 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-background/99 backdrop-blur-3xl border-b border-border shadow-2xl overflow-hidden"
            >
              <nav className="flex flex-col p-4 md:p-6 space-y-4">
                <a href="#features" className="text-lg font-bold hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#pricing" className="text-lg font-bold hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
                <a href="#faq" className="text-lg font-bold hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
                <div className="pt-4 border-t border-border flex flex-col space-y-4">
                  {user ? (
                    <Button className="w-full h-12 rounded-xl bg-primary shadow-lg shadow-primary/20 font-bold" asChild>
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>Go to Dashboard</Link>
                    </Button>
                  ) : (
                    <>
                      <Link to="/auth?view=login" className="text-center font-bold py-2 hover:bg-muted rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                      <Button className="w-full h-12 rounded-xl font-black bg-primary shadow-lg shadow-primary/20" asChild>
                        <Link to="/auth?view=signup" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-12 md:pb-20 px-6 relative">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent rounded-full blur-[120px] opacity-70 animate-pulse-glow" />
        <div className="absolute -bottom-40 -left-40 -z-10 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] opacity-50" />

        <div className="container mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 max-w-3xl">
              <div className="inline-flex items-center space-x-2 bg-blue-500/10 dark:bg-blue-400/10 backdrop-blur-md px-4.5 py-2 rounded-full border border-blue-500/20 mb-8">
                <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-ping"></span>
                <span className="text-[10px] sm:text-xs font-black text-blue-600 dark:text-blue-400 tracking-widest uppercase">
                  100% Tax Compliant & Made for Indian Business Owners
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.1] text-slate-900 dark:text-white">
                GST billing software that{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:to-emerald-400">
                  isn't a headache.
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-slate-650 dark:text-slate-400 mb-10 leading-relaxed max-w-2xl font-medium">
                Dhandhe ka hisab-kitab, ab bina kisi sir-dard ke. Create beautiful GST-compliant bills in under 10 seconds, send automatic payment reminders on WhatsApp, and manage stock levels in real-time. Built specifically for Indian traders, wholesalers, and service business owners.
              </p>


              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-auto">
                  <Button size="lg" className="h-14 px-8 text-base rounded-full bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 font-black w-full" asChild>
                    <Link to="/auth?view=signup">
                      Create Your First Invoice Free
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                </div>
                <div className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full border-2 font-bold w-full" asChild>
                    <a href="#how-it-works">See How It Works</a>
                  </Button>
                </div>
              </div>

              {/* Compliance Trust Badges */}
              <div className="mt-12 pt-8 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center gap-x-8 gap-y-4 text-xs font-black text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>GST & Invoice-Ready</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Bank-Grade 256-bit Encryption</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Automatic Hourly Backups</span>
                </div>
              </div>
            </div>

            {/* Desktop Dashboard Preview with Browser Frame */}
            <div className="lg:col-span-5 relative">
              <div className="relative z-10 animate-fade-in opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                  
                  {/* Browser Mockup Frame */}
                  <div className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="bg-slate-200 dark:bg-slate-900 px-4 py-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-850">
                      <div className="w-3 h-3 rounded-full bg-rose-450"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-4 truncate">app.escrowbill.in/dashboard</span>
                    </div>
                    <img
                      src="/premium-hero.png"
                      alt="ESCROWBILL Real-time Financial Dashboard for Business Tracking"
                      className="w-full aspect-video object-cover transform transition-transform duration-500 hover:scale-[1.01]"
                    />

                  </div>
                </div>

                {/* Floating Elements - Replaced basic bubbles with styled visual stats cards */}
                <div className="hidden xl:flex absolute -right-6 top-10 glass-panel p-4 rounded-2xl animate-float shadow-2xl border border-white/20 bg-white/90 dark:bg-black/80 backdrop-blur-md" style={{ animationDelay: '1.5s' }}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Payment Reconciled</p>
                      <p className="text-xs font-black text-foreground">₹24,500 via UPI</p>
                      <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Surat Textile Market</p>
                    </div>
                  </div>
                </div>

                <div className="hidden xl:flex absolute -left-6 bottom-16 glass-panel p-4 rounded-2xl animate-float shadow-2xl border border-white/20 bg-white/90 dark:bg-black/80 backdrop-blur-md" style={{ animationDelay: '2.8s' }}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">E-Way Bill Generated</p>
                      <p className="text-xs font-black text-foreground">INV-2026-1089</p>
                      <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold mt-0.5">Sharma & Sons (Noida)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Client Logo Cloud Section (Greyscale, clean) */}
      <section className="py-8 bg-slate-50 dark:bg-slate-900/10 border-t border-b border-slate-200/50 dark:border-slate-800/40">
        <div className="container mx-auto px-6">
          <p className="text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
            Trusted by over 5,000 grocery shops, wholesalers, garment dealers, and service businesses across India
          </p>
          <div className="flex flex-wrap items-center justify-around gap-6 opacity-60 dark:opacity-40">
            <div className="flex items-center gap-2 font-black text-slate-500 text-sm tracking-widest"><Layers className="w-4 h-4" /> DISTRIBUTORS</div>
            <div className="flex items-center gap-2 font-black text-slate-500 text-sm tracking-widest"><Settings className="w-4 h-4" /> MANUFACTURERS</div>
            <div className="flex items-center gap-2 font-black text-slate-500 text-sm tracking-widest"><CreditCard className="w-4 h-4" /> RETAILERS</div>
            <div className="flex items-center gap-2 font-black text-slate-500 text-sm tracking-widest"><Globe className="w-4 h-4" /> EXPORTERS</div>
            <div className="flex items-center gap-2 font-black text-slate-500 text-sm tracking-widest"><Users className="w-4 h-4" /> SERVICES & AGENCIES</div>
          </div>
        </div>
      </section>

      {/* Feature 1: Smart Invoicing (With Live Calculator Widget) */}
      <section id="features" className="py-16 md:py-24 px-6 border-t border-slate-200/50 dark:border-slate-800/40">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 order-2 lg:order-1 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[2.5rem] blur-2xl opacity-15"></div>
              <LiveInvoiceDemo />
            </div>
            
            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3.5 py-1.5 rounded-full text-xs font-bold mb-6">
                <FileText className="w-4 h-4" />
                <span>GST-Compliant Invoicing</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                Billing that's fast, legal, and looks professional
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 font-medium leading-relaxed">
                You don't need to do any manual math or worry about tax rules. Just choose your customer, pick your items, and let the software calculate the correct CGST, SGST, or IGST automatically. Your invoices look clean and print perfectly every time.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Custom Invoice Styles</h4>
                    <p className="text-xs text-slate-500 mt-1">Add your own business logo, customized colors, and signatures to build customer trust.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Instant UPI QR Code</h4>
                    <p className="text-xs text-slate-500 mt-1">Put your UPI QR code directly on the bill so customers scan and pay instantly via PhonePe, GPay, or Paytm.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Built for Exports</h4>
                    <p className="text-xs text-slate-500 mt-1">Easily create invoices in USD, EUR, or other currencies with automatic tax adjustments for export logs.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">E-way Bills & e-Invoicing</h4>
                    <p className="text-xs text-slate-500 mt-1">Enter transporter logistics easily and export the correct formats directly for the government GST portal.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Templates Showcase Gallery */}
        <div className="container mx-auto mt-16 max-w-5xl px-2 sm:px-6">
          <InvoiceTemplateGallery />
        </div>
      </section>


      {/* Feature 2: Automated Reminders (Using the original image, WhatsApp/Email notification stack) */}
      <section id="reminders" className="py-16 md:py-24 px-6 bg-slate-50/50 dark:bg-slate-900/10 border-t border-slate-200/50 dark:border-slate-800/40">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center space-x-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-bold mb-6">
                <Zap className="w-4 h-4" />
                <span>Intelligent Reminders</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                Polite WhatsApp and SMS reminders (so you don't have to chase clients)
              </h2>
              <p className="text-lg text-slate-650 dark:text-slate-400 mb-8 font-medium leading-relaxed">
                Chasing unpaid bills is awkward and takes up too much time. EscrowBill sends friendly, automatic reminders on WhatsApp or SMS with a direct payment link, helping you recover cash without manual calls.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-350">Set friendly reminders before, on, or after the due date automatically.</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-350">Send direct WhatsApp invoice links with one click from your mobile or laptop.</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-350">Get notified the exact moment your client views the invoice, so you know they received it.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="absolute -inset-4 bg-gradient-to-l from-yellow-400 to-orange-500 rounded-3xl blur-2xl opacity-20"></div>
              
              <div className="relative bg-background border border-border rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center min-h-[450px] space-y-6 overflow-hidden">
                <img
                  src="/premium-payment.png"
                  alt="Secure Payment Illustration"
                  className="absolute -right-20 -top-20 w-80 h-80 opacity-20 blur-sm -z-10 group-hover:scale-110 transition-transform duration-700"
                />
                <img
                  src="/premium-payment.png"
                  alt="Secure Payment"
                  className="w-40 h-40 object-contain mb-4 animate-float"
                />

                {/* Mock Notification - WhatsApp */}
                <div className="w-full max-w-sm bg-[#E5DDD5] rounded-xl overflow-hidden shadow-lg border border-slate-200/50 dark:border-slate-800/40 transform hover:-translate-y-1 transition-transform duration-300">
                  <div className="bg-[#075E54] px-4 py-2 flex items-center justify-between text-white">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                      <span className="font-bold text-xs">EscrowBill Notifier</span>
                    </div>
                    <span className="text-[10px] opacity-70">12:30 PM</span>
                  </div>
                  <div className="p-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]">
                    <div className="bg-white text-slate-850 p-3 rounded-lg rounded-tl-none shadow-sm max-w-[85%]">
                      <p className="text-xs">Hi Ramesh, your bill <span className="font-bold">INV-2026-089</span> for <span className="font-bold">₹15,000</span> from Sharma & Sons is due tomorrow. Pay securely via UPI: <span className="text-blue-500 underline text-[10px]">bill.escrowbms.in/pay</span></p>
                      <div className="text-[9px] text-gray-400 text-right mt-1 flex justify-end gap-1">12:30 PM <span className="text-[#34B7F1]">✓✓</span></div>
                    </div>
                  </div>
                </div>

                {/* Mock Notification - Email */}
                <div className="w-full max-w-sm bg-background rounded-xl p-4 shadow-lg border-l-4 border-blue-500 flex items-start space-x-4 opacity-95 hover:opacity-100 transition-opacity border border-slate-250/20">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full"><FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
                  <div className="flex-1">
                    <p className="font-bold text-xs text-slate-900 dark:text-white">Invoice Viewed</p>
                    <p className="text-[11px] text-muted-foreground">Ganesh Traders viewed Invoice INV-2026-089</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground">2m ago</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* WhatsApp Cloud API Showcase */}
        <div className="container mx-auto mt-16 max-w-5xl px-2 sm:px-6">
          <WhatsAppShowcase />
        </div>
      </section>


      {/* Feature 3: Financial Analytics (With Stateful Live Chart Widget) */}
      <section id="analytics" className="py-16 md:py-24 px-6 border-t border-slate-200/50 dark:border-slate-800/40">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 order-2 lg:order-1 relative">
              <div className="absolute -inset-4 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-[2.5rem] blur-2xl opacity-15"></div>
              <InteractiveFinanceChart />
            </div>

            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="inline-flex items-center space-x-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3.5 py-1.5 rounded-full text-xs font-bold mb-6">
                <BarChart3 className="w-4 h-4" />
                <span>Financial Analytics</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                See how much you're making, without complex spreadsheets
              </h2>
              <p className="text-lg text-slate-650 dark:text-slate-400 mb-8 font-medium leading-relaxed">
                No more waiting till the end of the month to check your profits. Get a simple, real-time dashboard showing your active revenue, who owes you money (Udhaar), and how much GST you've collected. Export everything for your accountant in a click.
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 hover:border-indigo-500/30 transition-all">
                  <TrendingUp className="w-6 h-6 text-indigo-500 mb-3" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Clear Udhaar & Sales Ledgers</h4>
                  <p className="text-xs text-slate-500 mt-1">Real-time lists of who owes you, automatic aging reports, and total invoice earnings.</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 hover:border-indigo-500/30 transition-all">
                  <Shield className="w-6 h-6 text-emerald-500 mb-3" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Track Every Expense</h4>
                  <p className="text-xs text-slate-500 mt-1">Log business expenses, fuel, rentals, and packaging bills. Auto-group them for easy tax write-offs.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 px-6 bg-slate-50 dark:bg-slate-900/10 border-t border-slate-200/50 dark:border-slate-800/40">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
              Get set up in less than 5 minutes
            </h2>
            <p className="text-lg text-slate-650 dark:text-slate-400 font-medium">
              You don't need any special training or accounting classes. It's built to be self-explanatory.
            </p>
          </div>

          <div className="relative">
            {/* Connector Line (Desktop Only) */}
            <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 
              bg-gradient-to-r from-blue-200 via-purple-200 via-emerald-200 to-green-200 
              dark:from-blue-900 dark:via-purple-900 dark:via-emerald-900 dark:to-green-900 -z-10">
            </div>

            {/* Vertical Connector Line (Mobile Only) */}
            <div className="md:hidden absolute left-1/2 top-10 bottom-10 w-0.5 bg-slate-200 dark:bg-slate-800 -translate-x-1/2 -z-10"></div>

            {/* Step Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 sm:gap-8 px-2">
              {[
                {
                  step: "01",
                  title: "Create Free Account",
                  desc: "Sign up in 30 seconds. No credit card details, no pressure.",
                  icon: <Users className="w-6 h-6 text-blue-600" />,
                  color: "bg-blue-100 dark:bg-blue-900/30",
                  borderColor: "border-blue-200 dark:border-blue-800"
                },
                {
                  step: "02",
                  title: "Add Your Products",
                  desc: "Import your product list via Excel or add items directly.",
                  icon: <FileText className="w-6 h-6 text-purple-600" />,
                  color: "bg-purple-100 dark:bg-purple-900/30",
                  borderColor: "border-purple-200 dark:border-purple-800"
                },
                {
                  step: "03",
                  title: "Send Invoices",
                  desc: "Generate professional bills and share them directly on WhatsApp.",
                  icon: <BarChart3 className="w-6 h-6 text-emerald-600" />,
                  color: "bg-emerald-100 dark:bg-emerald-900/30",
                  borderColor: "border-emerald-200 dark:border-emerald-800"
                },
                {
                  step: "04",
                  title: "Get Paid Instantly",
                  desc: "Customers scan your invoice QR code and pay straight to your bank.",
                  icon: <CreditCard className="w-6 h-6 text-green-600" />,
                  color: "bg-green-100 dark:bg-green-900/30",
                  borderColor: "border-green-200 dark:border-green-800"
                }
              ].map((item, idx) => (
                <div key={idx} className="relative flex flex-col items-center text-center group">
                  <div className={`w-20 h-20 rounded-2xl ${item.color} 
                    flex items-center justify-center 
                    mb-6 shadow-lg border ${item.borderColor} 
                    group-hover:scale-110 
                    transition-transform duration-300 
                    relative z-10`}
                  >
                    {item.icon}
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full 
                      bg-background border border-border 
                      flex items-center justify-center 
                      text-xs font-black shadow-sm">
                      {item.step}
                    </div>
                  </div>

                  <h3 className="text-lg font-black mb-3 text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm px-1">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Inventory Catalog Highlight Sections */}
      <section id="payments" className="py-16 md:py-24 px-6 bg-slate-50 dark:bg-slate-900/10 border-t border-slate-200/50 dark:border-slate-800/40">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-1.5 rounded-full text-xs font-bold mb-6 uppercase tracking-widest">
              <BarChart3 className="w-4 h-4" />
              <span>Complete Business Suite</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
              Everything you need to manage your business daily
            </h2>
            <p className="text-lg text-slate-650 dark:text-slate-400 font-medium">
              Avoid double entry. Keep your stock, invoices, purchases, and expenses in one single place.
            </p>
          </div>

          {/* Cards with Swipe / Grid Layout */}
          <div className="flex md:grid md:grid-cols-3 gap-6 md:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory scroll-smooth px-1 pb-4 scrollbar-none">
            {/* Card 1 */}
            <div className="group flex flex-col min-w-[290px] sm:min-w-[320px] md:min-w-0 snap-center bg-background border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-md">
              <div className="relative rounded-2xl overflow-hidden mb-6 aspect-video">
                <img
                  src="/Product.png"
                  alt="Products & Services Catalog"
                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Catalog & Stock Control</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                Maintain product records, import list via Excel sheets, auto-calculate tax brackets, and monitor low-stock levels in real time.
              </p>
              <ul className="space-y-2 mt-auto">
                <li className="flex items-center space-x-2 text-xs font-bold"><CheckCircle className="w-4 h-4 text-emerald-500" /><span>Low-Stock Alerts</span></li>
                <li className="flex items-center space-x-2 text-xs font-bold"><CheckCircle className="w-4 h-4 text-emerald-500" /><span>Bulk Spreadsheet Import</span></li>
              </ul>
            </div>

            {/* Card 2 */}
            <div className="group flex flex-col min-w-[290px] sm:min-w-[320px] md:min-w-0 snap-center bg-background border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-md">
              <div className="relative rounded-2xl overflow-hidden mb-6 aspect-video">
                <img
                  src="/Payment.png"
                  alt="Payment Records"
                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Instant Reconciled Payments</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                Accept UPI payments from QR codes, Credit Cards, or Bank Transfers. Settlements reconcile automatically on invoices.
              </p>
              <ul className="space-y-2 mt-auto">
                <li className="flex items-center space-x-2 text-xs font-bold"><CheckCircle className="w-4 h-4 text-emerald-500" /><span>Direct Bank Settlement</span></li>
                <li className="flex items-center space-x-2 text-xs font-bold"><CheckCircle className="w-4 h-4 text-emerald-500" /><span>UPI QR Auto-Reconciliation</span></li>
              </ul>
            </div>

            {/* Card 3 */}
            <div className="group flex flex-col min-w-[290px] sm:min-w-[320px] md:min-w-0 snap-center bg-background border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-md">
              <div className="relative rounded-2xl overflow-hidden mb-6 aspect-video">
                <img
                  src="/Expenses.png"
                  alt="Expense Tracker"
                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Cost & Expense Audits</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                Log business payments, categorize operational costs, and calculate tax write-offs for easy CA compliance.
              </p>
              <ul className="space-y-2 mt-auto">
                <li className="flex items-center space-x-2 text-xs font-bold"><CheckCircle className="w-4 h-4 text-emerald-500" /><span>Tax write-off classifications</span></li>
                <li className="flex items-center space-x-2 text-xs font-bold"><CheckCircle className="w-4 h-4 text-emerald-500" /><span>CA-compliant exports</span></li>
              </ul>
            </div>
          </div>
          
          {/* Swipe Indicator */}
          <div className="flex md:hidden items-center justify-center gap-2 mt-6 text-muted-foreground animate-pulse">
            <ArrowRight className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Swipe for more sections</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Industry Solutions Switcher */}
        <div id="solutions" className="container mx-auto mt-16 max-w-5xl px-2 sm:px-6">
          <IndustrySolutions activeTab={solutionsTab} setActiveTab={setSolutionsTab} />
        </div>
      </section>


      {/* Creator's Note Section */}
      <section className="py-16 md:py-24 px-6 bg-slate-50/50 dark:bg-slate-900/5 border-t border-slate-200/50 dark:border-slate-800/40 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[500px] h-[500px] bg-amber-500/5 dark:bg-amber-400/5 rounded-full blur-[80px] opacity-70" />
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white dark:bg-slate-950 border border-amber-500/10 dark:border-amber-950/20 rounded-[2.5rem] p-8 md:p-12 shadow-xl relative">
            <div className="absolute top-0 right-10 -translate-y-1/2 bg-amber-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-md uppercase tracking-wider">
              A Note From The Founders
            </div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-inner">
                <Users className="w-10 h-10" />
              </div>
              
              <div className="flex-1 space-y-4">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                  Why we built EscrowBill
                </h3>
                <div className="text-sm text-slate-650 dark:text-slate-400 leading-relaxed space-y-3 font-medium">
                  <p>
                    Hi there,
                  </p>
                  <p>
                    We built EscrowBill because we saw our family members and local business friends spend their precious weekends doing manual tax math, writing bills on paper notebooks, and chasing clients for payments. It was stressful, slow, and full of errors.
                  </p>
                  <p>
                    We wanted to make software that is so simple that anyone—whether a retailer, wholesaler, or freelancer—can use it without feeling overwhelmed. We are a small team based in Surat, and we care deeply about your business.
                  </p>
                  <p>
                    We don't believe in robotic customer support. If you ever have a question or get stuck, you can call us or message us directly on WhatsApp. We'll answer.
                  </p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 pt-2">
                    Thanks for giving us a try!
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white italic">
                    — The EscrowBill Team
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section (Authentic Business focus) */}
      <section className="py-16 md:py-24 px-6 border-t border-slate-200/50 dark:border-slate-800/40">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
              Highly Rated by Business Owners Like You
            </h2>
            <p className="text-lg text-slate-650 dark:text-slate-400 font-medium">
              See how Indian SMEs recover dues faster and stay tax compliant with EscrowBill.
            </p>
          </div>

          <div className="flex md:grid md:grid-cols-3 gap-6 md:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory scroll-smooth px-1 scrollbar-none">
            {[
              {
                text: "Before EscrowBill, I had to call my clients 3 or 4 times just to ask for my own money. Now, I just click 'Share on WhatsApp' and the system sends a polite reminder with a UPI payment link. Most payments clear within an hour!",
                author: "Ashish Singh",
                role: "Wholesaler at Whole-Collection, Surat",
                initial: "AS"
              },
              {
                text: "I’m not a tech person, and other accounting tools were too complicated for my shop. EscrowBill let me upload my logo and start printing GST invoices in 5 minutes. My accountant is happy, my customers are happy.",
                author: "Rahul Verma",
                role: "Owner at Verma Digital Services, Noida",
                initial: "RV"
              },
              {
                text: "We use it for our agency milestones. It handles tax calculations automatically, and the invoice looks very professional on WhatsApp and email. Highly recommended for freelancers and boutique agencies.",
                author: "Abhishek Pandey",
                role: "Co-Founder at ArbitalX, Bangalore",
                initial: "AP"
              }
            ].map((review, i) => (
              <Card key={i} className="min-w-[290px] sm:min-w-[320px] md:min-w-0 snap-center p-6 bg-background border border-slate-200/60 dark:border-slate-800/80 rounded-3xl flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex text-yellow-500 mb-5 space-x-1">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-650 dark:text-slate-400 text-xs sm:text-sm italic leading-relaxed mb-6">
                    "{review.text}"
                  </p>
                </div>
                <div className="flex items-center space-x-3.5 pt-4 border-t border-slate-100 dark:border-slate-850">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs">
                    {review.initial}
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-900 dark:text-white">{review.author}</p>
                    <p className="text-[10px] text-muted-foreground font-bold">{review.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 px-6 bg-slate-50 dark:bg-slate-900/10 border-t border-slate-200/50 dark:border-slate-800/40">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6">
              Simple, Transperent Pricing
            </h2>
            <p className="text-lg text-slate-650 dark:text-slate-400 font-medium">
              Start with a 30-day free trial. No credit card required. Cancel anytime.
            </p>
          </div>

          <div className="flex md:grid md:grid-cols-2 max-w-4xl mx-auto gap-6 md:gap-10 overflow-x-auto md:overflow-visible snap-x snap-mandatory scroll-smooth px-1 scrollbar-none">
            {pricingPlans.map((plan, index) => {
              const isYearly = plan.name === "Yearly";
              return (
                <div
                  key={index}
                  className={`min-w-[290px] sm:min-w-[320px] md:min-w-0 snap-center group relative rounded-[2.5rem] p-6 sm:p-8 bg-background border-2 transition-all duration-500 hover:border-primary hover:shadow-2xl hover:shadow-primary/10 hover:scale-[1.02] ${
                    isYearly ? "border-primary/80 shadow-md md:scale-105" : "border-border/60"
                  }`}
                >
                  {isYearly && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full shadow-md uppercase tracking-wider">
                      Best Value - Save 17%
                    </div>
                  )}

                  <div className="mb-6 mt-4">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{plan.name} Plan</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline mb-6">
                    <span className="text-4xl sm:text-5xl font-black tracking-tight text-primary">{plan.price}</span>
                    <span className="text-slate-400 font-bold text-xs ml-2">{plan.period}</span>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 mb-6" />

                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-slate-650 dark:text-slate-300 text-xs sm:text-sm font-bold">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mr-3 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={isYearly ? "default" : "outline"}
                    className="w-full h-12 rounded-xl font-black text-sm transition-all"
                    asChild
                  >
                    <Link to={`/auth?plan=${plan.period.replace("/", "")}&view=signup`}>
                      Get Started Free
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* GST Calculator Section */}
      <section id="calculator" className="py-16 md:py-24 px-6 bg-slate-50 dark:bg-slate-900/10 border-t border-slate-200/50 dark:border-slate-800/40">
        <div className="container mx-auto max-w-4xl px-2 sm:px-6">
          <FreeGstCalculator />
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-24 px-6 border-t border-slate-200/50 dark:border-slate-800/40">
        <div className="container mx-auto max-w-4xl px-2 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-650 dark:text-slate-400 font-medium">
              We want to make things simple. If you have any other questions, call or message us directly.
            </p>
          </div>

          <AccordionFAQ />
        </div>
      </section>

      {/* CTA Section */}

      <section className="py-16 md:py-24 px-4 md:px-6 border-t border-slate-200/50 dark:border-slate-800/40">
        <div className="container mx-auto">
          <div className="rounded-[2.5rem] bg-slate-950 p-6 md:p-16 text-center text-white relative overflow-hidden shadow-2xl border border-white/10 group">
            <div
              className="absolute inset-0 z-0 transition-transform duration-1000 group-hover:scale-110"
              style={{
                backgroundImage: 'url("/cta-bg.png")',

                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.8
              }}
            />
            <div className="absolute inset-0 bg-black/40 z-0" />

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black mb-6 relative z-10">Ready to simplify your business billing?</h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-200/90 mb-10 max-w-xl mx-auto relative z-10 font-bold px-2">
              Join over 5,000 Indian business owners who save hours every week. Try it completely free for 30 days.
            </p>
            <div className="relative z-10 flex flex-col items-center justify-center gap-4">
              <Button size="lg" variant="secondary" className="h-14 px-8 text-base rounded-full text-blue-600 bg-white hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 font-black" asChild>
                <Link to="/auth?view=signup">Get Started for Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 pt-16 pb-8 px-6 border-t border-slate-900 relative overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 mb-12 text-center md:text-left">
            {/* Brand Column */}
            <div className="col-span-2 lg:col-span-1 space-y-4 flex flex-col items-center md:items-start">
              <Link to="/" className="flex items-center space-x-3 group">
                <img
                  src="/assets/images/e9085822-5bea-4642-b19e-dcfcde6248f7.png"
                  alt="ESCROWBILL Logo"
                  className="w-10 h-10 object-contain"
                />
                <span className="text-xl font-black text-white tracking-tight">ESCROWBILL</span>
              </Link>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs font-medium text-center md:text-left">
                A simple, reliable billing and stock management app built to help Indian small businesses get paid faster.
              </p>
              <div className="flex justify-center md:justify-start space-x-2">
                <a 
                  href="#" 
                  aria-label="Twitter" 
                  className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center hover:text-white border border-slate-800 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a 
                  href="#" 
                  aria-label="LinkedIn" 
                  className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center hover:text-white border border-slate-800 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a 
                  href="https://www.instagram.com/escrowbms/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="Instagram" 
                  className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center hover:text-white hover:border-pink-500 border border-slate-800 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div className="flex flex-col items-center md:items-start">
              <h4 className="text-white font-black mb-4 text-sm flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                Product
              </h4>
              <ul className="space-y-2.5 text-xs font-bold">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#faq" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="flex flex-col items-center md:items-start">
              <h4 className="text-white font-black mb-4 text-sm flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />
                Company
              </h4>
              <ul className="space-y-2.5 text-xs font-bold">
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms & Conditions</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="col-span-2 lg:col-span-1 flex flex-col items-center md:items-start">
              <h4 className="text-white font-black mb-4 text-sm flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2" />
                Get in Touch
              </h4>
              <ul className="space-y-3.5 text-xs font-bold text-center md:text-left flex flex-col items-center md:items-start">
                <li className="flex items-center gap-2.5"><Mail className="w-4 h-4 text-primary shrink-0" /> <span>support@escrowbms.com</span></li>
                <li className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-blue-500 shrink-0" /> <span>+91 93280 28207</span></li>
                <li className="flex items-center gap-2.5"><MapPin className="w-4 h-4 text-purple-500 shrink-0" /> <span>Surat, Gujarat, India</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center text-xs font-bold text-slate-500 gap-4">
            <p>&copy; 2026 ESCROWBILL. All rights reserved.</p>
            <div className="flex items-center space-x-2 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
              <span className="text-slate-400 font-bold">Managed by</span>
              <a href="https://ash-techsolutions.com/" className="text-primary hover:text-blue-400 font-black transition-colors">
                ASH-TECH SOLUTIONS
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* App-Style Floating Glass Dock for Mobile */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-full py-2 px-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)] flex items-center justify-between gap-1">
          {/* Home */}
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex-1 flex flex-col items-center justify-center text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary focus:outline-none cursor-pointer"
          >
            <Home className="w-4.5 h-4.5 transition-transform hover:scale-110" />
            <span className="text-[7px] font-black mt-0.5 uppercase tracking-wider">Home</span>
          </button>
          
          {/* Features */}
          <button 
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex-1 flex flex-col items-center justify-center text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary focus:outline-none cursor-pointer"
          >
            <FileText className="w-4.5 h-4.5 transition-transform hover:scale-110" />
            <span className="text-[7px] font-black mt-0.5 uppercase tracking-wider">Features</span>
          </button>
          
          {/* Calculator */}
          <button 
            onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex-1 flex flex-col items-center justify-center text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary focus:outline-none cursor-pointer"
          >
            <Calculator className="w-4.5 h-4.5 transition-transform hover:scale-110" />
            <span className="text-[7px] font-black mt-0.5 uppercase tracking-wider">GST Calc</span>
          </button>

          {/* Pricing */}
          <button 
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex-1 flex flex-col items-center justify-center text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary focus:outline-none cursor-pointer"
          >
            <CreditCard className="w-4.5 h-4.5 transition-transform hover:scale-110" />
            <span className="text-[7px] font-black mt-0.5 uppercase tracking-wider">Pricing</span>
          </button>

          {/* FAQ */}
          <button 
            onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex-1 flex flex-col items-center justify-center text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary focus:outline-none cursor-pointer"
          >
            <HelpCircle className="w-4.5 h-4.5 transition-transform hover:scale-110" />
            <span className="text-[7px] font-black mt-0.5 uppercase tracking-wider">FAQs</span>
          </button>

          {/* Get Started / Dashboard CTA Button inside Dock */}
          <Link 
            to={user ? "/dashboard" : "/auth?view=signup"}
            className="flex-1 flex items-center justify-center bg-primary hover:bg-primary/95 text-white rounded-full py-2 px-1 shadow-md shadow-primary/20 shrink-0 select-none cursor-pointer hover:scale-105 transition-transform"
            title={user ? "Dashboard" : "Get Started"}
          >
            <ArrowRight className="w-4.5 h-4.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
