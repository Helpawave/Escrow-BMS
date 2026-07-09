import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, CreditCard } from "lucide-react";
import { Client } from '@/types/invoice';
import { InvoiceFormData } from './InvoiceHeader';

interface InvoiceTotalsProps {
  currencySymbol: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  formData: InvoiceFormData;
  setFormData: (data: InvoiceFormData) => void;
  saving: boolean;
  clients: Client[];
  isEditing: boolean;
  submitLabel: string;
  navigate: (path: string) => void;
  onAddExpense: () => void;
}

export const InvoiceTotals: React.FC<InvoiceTotalsProps> = ({
  currencySymbol,
  subtotal,
  discountAmount,
  taxAmount,
  total,
  formData,
  setFormData,
  saving,
  clients,
  isEditing,
  submitLabel,
  navigate,
  onAddExpense
}) => {
  return (
    <div className="space-y-6">
      {/* Notes/Terms and Totals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 border-t border-border">
        {/* Left Side: Notes & Terms */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes for the invoice"
              className="min-h-[120px] rounded-2xl border-2 focus-visible:ring-primary/20 resize-none bg-muted/5 border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="terms" className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Terms & Conditions</Label>
            <Textarea
              id="terms"
              value={formData.terms || ''}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              placeholder="Payment terms and conditions"
              className="min-h-[120px] rounded-2xl border-2 focus-visible:ring-primary/20 resize-none bg-muted/5 border-slate-200"
            />
          </div>
        </div>

        {/* Right Side: Totals Summary */}
        <div className="lg:col-span-5 flex justify-end">
          <div className="w-full max-w-sm space-y-3 bg-slate-50 dark:bg-slate-900/40 p-4 md:p-6 rounded-2xl border border-border/50">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-bold text-foreground">{currencySymbol} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-rose-600 dark:text-rose-400 font-semibold">
              <span>Discount</span>
              <span>-{currencySymbol} {discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Tax (GST)</span>
                <span className="font-bold text-foreground">{currencySymbol} {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-border font-black text-lg text-primary" aria-live="polite">
              <span>Total</span>
              <span>{currencySymbol} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Billable Expense Button */}
      {formData.client_id && (
        <div className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onAddExpense}
            className="w-full h-11 text-sm font-bold rounded-2xl border-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 transition-all gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Add Billable Expense
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/invoices')}
          className="w-full h-12 text-base font-bold rounded-2xl order-2 sm:order-1 border-slate-200"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="hero"
          disabled={saving || clients.length === 0}
          className="w-full h-12 text-base font-bold rounded-2xl shadow-xl shadow-primary/20 order-1 sm:order-2"
          aria-label={submitLabel}
        >
          {saving ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
            </div>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
