import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const LiveInvoiceDemo: React.FC = () => {
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
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Interactive Calculator</span>
          <p className="text-lg font-black text-slate-900 dark:text-white">GST Invoice Preview</p>
        </div>
        <select 
          value={gstRate}
          aria-label="Select GST Rate"
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
        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Select Template:</p>
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
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => updateItem(item.id, "qty", Math.max(1, item.qty - 1))}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sm hover:bg-slate-100 dark:hover:bg-slate-850 font-bold"
                >
                  -
                </button>
                <span className="px-2 text-xs font-bold">{item.qty}</span>
                <button 
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => updateItem(item.id, "qty", item.qty + 1)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sm hover:bg-slate-100 dark:hover:bg-slate-850 font-bold"
                >
                  +
                </button>
              </div>

              <div className="flex items-center gap-1.5 min-w-[90px]">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  value={item.rate}
                  onChange={(e) => updateItem(item.id, "rate", Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs font-bold bg-transparent border-0 p-0 focus:ring-0 text-slate-900 dark:text-white text-right"
                  placeholder="Rate"
                />
              </div>

              <button 
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-red-800 dark:text-red-300 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/40 p-1.5 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Remove Item"
                aria-label="Remove Item"
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
          <span>Grand Total (incl. GST)</span>
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
          className="flex-1 text-[10px] font-black py-2.5 px-3 rounded-xl bg-emerald-700 text-white hover:bg-emerald-700 transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
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
