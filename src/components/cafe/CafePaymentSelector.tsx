import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Banknote, CreditCard, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface CafePaymentSelectorProps {
  selectedPaymentMethod: string;
  onPaymentSelect: (mode: string) => void;
  saving: boolean;
  canCheckout: boolean;
  onSubmit: (e?: React.FormEvent) => Promise<void>;
  hasCartItems?: boolean;
  isPhoneValid?: boolean;
  isNameValid?: boolean;
}

export const CafePaymentSelector: React.FC<CafePaymentSelectorProps> = ({
  selectedPaymentMethod,
  onPaymentSelect,
  saving,
  canCheckout,
  onSubmit,
  hasCartItems = false,
  isPhoneValid = true,
  isNameValid = true
}) => {
  const paymentModes = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'upi', label: 'UPI / QR', icon: QrCode },
    { id: 'card', label: 'Card', icon: CreditCard }
  ];

  const getRequirementNotice = () => {
    if (!hasCartItems) return null;
    if (!isPhoneValid && !isNameValid) {
      return "⚠️ 10-Digit Mobile Number & Customer Name are compulsory to complete bill.";
    }
    if (!isPhoneValid) {
      return "⚠️ Valid 10-digit Mobile Number is required to complete bill.";
    }
    if (!isNameValid) {
      return "⚠️ Customer Name is required to complete bill.";
    }
    return null;
  };

  const notice = getRequirementNotice();

  return (
    <div className="p-4 pt-2 space-y-2">
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
        Payment Mode:
      </span>
      <div className="grid grid-cols-3 gap-2">
        {paymentModes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedPaymentMethod === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onPaymentSelect(mode.id)}
              className={cn(
                "h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer",
                isSelected
                  ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20 font-black scale-102"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-400"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Requirement Notice if cart has items but compulsory customer details missing */}
      {notice && (
        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-[11px] font-bold text-amber-800 dark:text-amber-300 leading-tight">
          {notice}
        </div>
      )}

      {/* BIG SUBMIT / CHECKOUT BUTTON */}
      <Button
        type="button"
        disabled={saving || !canCheckout}
        onClick={onSubmit}
        className="w-full h-12 rounded-xl text-sm font-black bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-600/25 transition-all mt-2 cursor-pointer flex items-center justify-center gap-2"
      >
        {saving ? (
          <span>Generating Bill &amp; Sending to Kitchen...</span>
        ) : (
          <>
            <span>Complete Bill &amp; Send to Kitchen</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </div>
  );
};
