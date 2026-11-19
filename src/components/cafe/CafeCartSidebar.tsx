import React from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShoppingBag } from "lucide-react";
import { Client, InvoiceItem } from '@/types/invoice';
import { CafeCustomerBar } from './CafeCustomerBar';
import { CafeCartItemRow } from './CafeCartItemRow';
import { CafePaymentSelector } from './CafePaymentSelector';

interface CafeCartSidebarProps {
  localPhone: string;
  localName: string;
  onPhoneChange: (val: string) => void;
  onNameChange: (val: string) => void;
  matchedClient?: Client;
  activeCartItems: { item: InvoiceItem; originalIndex: number }[];
  currencySymbol: string;
  onIncrementItem: (index: number) => void;
  onDecrementItem: (index: number) => void;
  onRemoveItem: (index: number) => void;
  onResetOrder?: () => void;
  kitchenNotes: string;
  onKitchenNotesChange: (val: string) => void;
  totals: { subtotal: number; discountAmount: number; taxAmount: number; total: number };
  selectedPaymentMethod: string;
  onPaymentSelect: (mode: string) => void;
  saving: boolean;
  onSubmit: (e?: React.FormEvent) => Promise<void>;
}

export const CafeCartSidebar: React.FC<CafeCartSidebarProps> = ({
  localPhone,
  localName,
  onPhoneChange,
  onNameChange,
  matchedClient,
  activeCartItems,
  currencySymbol,
  onIncrementItem,
  onDecrementItem,
  onRemoveItem,
  onResetOrder,
  kitchenNotes,
  onKitchenNotesChange,
  totals,
  selectedPaymentMethod,
  onPaymentSelect,
  saving,
  onSubmit
}) => {
  const cleanPhone = (localPhone || '').replace(/\D/g, '').slice(-10);
  const isPhoneValid = cleanPhone.length === 10;
  const isNameValid = (localName || '').trim().length > 0 && (localName || '').trim().toLowerCase() !== 'walk-in guest';
  const hasCartItems = activeCartItems.length > 0 && totals.total > 0;
  const canCheckout = hasCartItems && isPhoneValid && isNameValid;

  return (
    <Card className="rounded-2xl bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden">
      {/* Customer Bar */}
      <CafeCustomerBar
        localPhone={localPhone}
        localName={localName}
        onPhoneChange={onPhoneChange}
        onNameChange={onNameChange}
        matchedClient={matchedClient}
        activeCartCount={activeCartItems.length}
        onResetOrder={onResetOrder}
      />

      {/* Cart Items List */}
      <div className="p-4 space-y-3 min-h-[180px] max-h-[340px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
        {activeCartItems.length === 0 ? (
          <div className="py-10 text-center space-y-2 text-slate-400">
            <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 animate-bounce" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Cart is empty</p>
            <p className="text-[11px] text-muted-foreground">Tap any coffee or dish on the left to add to bill</p>
          </div>
        ) : (
          activeCartItems.map(({ item, originalIndex }) => (
            <CafeCartItemRow
              key={originalIndex}
              item={item}
              originalIndex={originalIndex}
              currencySymbol={currencySymbol}
              onIncrement={onIncrementItem}
              onDecrement={onDecrementItem}
              onRemove={onRemoveItem}
            />
          ))
        )}
      </div>

      {/* Special Kitchen Notes */}
      <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border-t border-slate-200 dark:border-slate-800">
        <Input
          placeholder="Kitchen notes (e.g. Less spicy, extra cheese, parcel)..."
          value={kitchenNotes}
          onChange={(e) => onKitchenNotesChange(e.target.value)}
          className="h-8 text-xs bg-white dark:bg-slate-900 border-amber-200/80 dark:border-amber-900/60 font-medium rounded-lg"
        />
      </div>

      {/* BILL SUMMARY & TOTALS */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
          <span>Subtotal ({activeCartItems.length} items)</span>
          <span className="font-mono font-bold">{currencySymbol} {totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
          <span>GST / Tax</span>
          <span className="font-mono font-bold">{currencySymbol} {totals.taxAmount.toFixed(2)}</span>
        </div>
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <span className="text-sm font-black text-slate-900 dark:text-slate-100">Total Payable</span>
          <span className="text-lg font-black font-mono text-amber-600 dark:text-amber-400">
            {currencySymbol} {totals.total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* PAYMENT METHOD & CHECKOUT */}
      <CafePaymentSelector
        selectedPaymentMethod={selectedPaymentMethod}
        onPaymentSelect={onPaymentSelect}
        saving={saving}
        canCheckout={canCheckout}
        onSubmit={onSubmit}
        hasCartItems={hasCartItems}
        isPhoneValid={isPhoneValid}
        isNameValid={isNameValid}
      />
    </Card>
  );
};
