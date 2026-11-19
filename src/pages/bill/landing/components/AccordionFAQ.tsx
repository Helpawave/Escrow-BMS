import React, { useState } from "react";
import { CheckCircle, FileText, Shield, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const AccordionFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "Do I need to know accounting to use EscrowBill?",
      a: "Not at all. EscrowBill is built specifically for business owners, not chartered accountants. We do not use complex financial terms or debit/credit math. If you can use WhatsApp, you can manage your invoicing, payments, and stock records here in minutes.",
      icon: <Users className="w-5 h-5 text-blue-600" />
    },
    {
      q: "Is there really a free trial? Are there any hidden conditions?",
      a: "Yes, we offer a 7-day fully functional free trial. We do not ask for credit card details, and there are no automatic renewal setups or hidden integration fees. Test it for your business, and only upgrade if you find value.",
      icon: <CheckCircle className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
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
              <span className="text-xs text-slate-600 dark:text-slate-400 select-none">{isOpen ? "▲" : "▼"}</span>
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
