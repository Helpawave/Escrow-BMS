import React from 'react';
import { Input } from "@/components/ui/input";
import { Phone, UserCheck, AlertCircle } from "lucide-react";
import { Client } from '@/types/invoice';

interface CafeCustomerBarProps {
  localPhone: string;
  localName: string;
  onPhoneChange: (val: string) => void;
  onNameChange: (val: string) => void;
  matchedClient?: Client;
  activeCartCount: number;
  onResetOrder?: () => void;
}

export const CafeCustomerBar: React.FC<CafeCustomerBarProps> = ({
  localPhone,
  localName,
  onPhoneChange,
  onNameChange,
  matchedClient,
  activeCartCount,
  onResetOrder
}) => {
  const cleanPhone = (localPhone || '').replace(/\D/g, '').slice(-10);
  const isPhoneValid = cleanPhone.length === 10;
  const isNameValid = (localName || '').trim().length > 0 && (localName || '').trim().toLowerCase() !== 'walk-in guest';
  const isReady = isPhoneValid && isNameValid;

  return (
    <div className="p-4 sm:p-4.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 space-y-3.5">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Phone className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Customer Details <span className="text-rose-500 font-black">*</span></span>
        </span>
        
        <div className="flex items-center gap-2">
          {onResetOrder && activeCartCount > 0 && (
            <button
              type="button"
              onClick={onResetOrder}
              className="text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer px-1.5 py-0.5 rounded"
              title="Clear cart items and reset order"
            >
              Clear Cart
            </button>
          )}
          {matchedClient ? (
            <span className="text-xs font-bold px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1.5 shadow-xs">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Existing: {matchedClient.name}</span>
            </span>
          ) : isReady ? (
            <span className="text-xs font-bold px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1.5 shadow-xs">
              ✓ Ready for Bill
            </span>
          ) : (
            <span className="text-xs font-bold px-2.5 sm:px-3 py-1 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1.5 shadow-xs">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Required (Phone &amp; Name)</span>
            </span>
          )}
        </div>
      </div>

      {/* Mobile Number & Name Inputs (Large, touch-friendly POS style) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
        {/* 10-digit mobile */}
        <div className="sm:col-span-6 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm sm:text-base font-black text-slate-500 dark:text-slate-400 font-mono select-none">
            +91
          </span>
          <Input
            type="tel"
            maxLength={14}
            placeholder="Mobile (10 Digits) *"
            value={localPhone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              const clean = digits.length > 10 ? digits.slice(-10) : digits;
              onPhoneChange(clean);
            }}
            className={`pl-13 sm:pl-14 pr-9 h-11 sm:h-12 font-mono font-bold text-sm sm:text-base bg-white dark:bg-slate-900 rounded-xl transition-all shadow-xs ${
              isPhoneValid
                ? 'border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                : localPhone.length > 0
                ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
            }`}
          />
          {localPhone && (
            <button
              type="button"
              onClick={() => onPhoneChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors cursor-pointer"
              title="Clear phone"
            >
              ✕
            </button>
          )}
        </div>

        {/* Customer Name */}
        <div className="sm:col-span-6 relative">
          <Input
            placeholder="Customer Name *"
            value={localName}
            onChange={(e) => onNameChange(e.target.value)}
            className={`px-3.5 h-11 sm:h-12 text-sm sm:text-base font-bold bg-white dark:bg-slate-900 rounded-xl transition-all shadow-xs ${
              isNameValid
                ? 'border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                : (localPhone.length === 10 && !isNameValid)
                ? 'border-amber-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20'
                : 'border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
