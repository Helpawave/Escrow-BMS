import React, { useState, useEffect } from "react";
import { ArrowUpRight, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PendingInvoiceItem } from "@/hooks/usePayments";
import { PaymentFormData } from "./RecordSalesPaymentModal";
import { useCurrency } from "@/contexts/CurrencyContext";

interface RecordPurchasePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: PendingInvoiceItem[];
  onSubmit: (formData: PaymentFormData, editingId: string | null) => Promise<void>;
  initialData?: {
    id?: string;
    invoice_id: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference_number: string;
    notes: string;
    invoice_number?: string;
    party_name?: string;
  } | null;
}

export function RecordPurchasePaymentModal({
  open,
  onOpenChange,
  invoices,
  onSubmit,
  initialData,
}: RecordPurchasePaymentModalProps) {
  const { currencySymbol, formatAmount } = useCurrency();
  const [formData, setFormData] = useState<PaymentFormData>({
    invoice_id: "",
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
    reference_number: "",
    notes: "",
    invoice_number: "",
    party_name: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // When modal opens: populate with initialData (edit) or reset to blank (new)
      if (initialData) {
        const rawDate = String(initialData.payment_date || "");
        const cleanDate = rawDate
          ? (rawDate.includes("T") ? rawDate.split("T")[0] : rawDate.split(" ")[0])
          : new Date().toISOString().split("T")[0];

        setFormData({
          invoice_id: initialData.invoice_id || "",
          amount: initialData.amount ? String(initialData.amount) : "",
          payment_date: cleanDate,
          payment_method: initialData.payment_method || "cash",
          reference_number: initialData.reference_number || "",
          notes: initialData.notes || "",
          invoice_number: initialData.invoice_number || "",
          party_name: initialData.party_name || "",
        });
      } else {
        setFormData({
          invoice_id: "",
          amount: "",
          payment_date: new Date().toISOString().split("T")[0],
          payment_method: "cash",
          reference_number: "",
          notes: "",
          invoice_number: "",
          party_name: "",
        });
      }
    }
  }, [open, initialData]);

  // Strictly filter for Purchase Bills (marked paid and unrecorded or currently being edited)
  const availablePurchaseBills = invoices.filter(
    (inv) =>
      String(inv.status || "").toLowerCase().trim() === "paid" &&
      inv.type === "purchase" &&
      (!inv.has_payment_record || inv.id === formData.invoice_id)
  );

  const selectedBill = invoices.find((inv) => inv.id === formData.invoice_id);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const cleanDate = (formData.payment_date || "").trim() || new Date().toISOString().split("T")[0];
      await onSubmit({ ...formData, payment_date: cleanDate, amount: Number(formData.amount) || 0 }, initialData?.id || null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="sm:max-w-[540px] p-0 overflow-hidden rounded-2xl border border-border/80 shadow-2xl bg-card gap-0 flex flex-col"
      >
        <DialogHeader className="px-5 py-3.5 border-b border-border/50 shrink-0 bg-muted/15 flex flex-row items-center justify-between gap-3 space-y-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-purple-500/10 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold tracking-tight text-foreground truncate">
                {initialData?.id ? "Edit Purchase Payment" : "Record Purchase Payment"}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground truncate">
                {initialData?.id
                  ? "Update the recorded purchase payment details below."
                  : "Record payment disbursement to vendor for a purchase bill."}
              </DialogDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-muted/80 flex items-center justify-center transition-colors shrink-0"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </DialogHeader>

        <div className="px-5 py-4 overflow-y-auto max-h-[75vh] custom-scrollbar">
          <form id="purchase-payment-form" onSubmit={handleFormSubmit} className="space-y-3.5">
            {/* 1. Select Purchase Bill or Linked Bill in Edit Mode */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  Purchase Bill {initialData?.id ? "(Linked)" : <span className="text-rose-500">*</span>}
                </Label>
                {!initialData?.id && (
                  <span className="text-[10px] text-muted-foreground/80 font-normal">
                    Only unrecorded paid bills
                  </span>
                )}
              </div>

              {initialData?.id ? (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/40 border border-border/70 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">
                      {initialData.invoice_number || selectedBill?.invoice_number || "Bill Linked"}
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 font-bold uppercase">
                      Purchase
                    </Badge>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground truncate max-w-[200px]">
                    {initialData.party_name || selectedBill?.party_name || "Vendor"}
                  </span>
                </div>
              ) : (
                <Select
                  value={formData.invoice_id}
                  onValueChange={(value) => {
                    const selected = invoices.find((inv) => inv.id === value);
                    setFormData({
                      ...formData,
                      invoice_id: value,
                      amount: Number(selected?.total_amount || selected?.remaining_amount || 0),
                      payment_method: selected?.payment_method || formData.payment_method || "cash",
                    });
                  }}
                >
                  <SelectTrigger className="h-9.5 border-border/60 focus:ring-primary font-medium bg-muted/20 rounded-lg text-xs">
                    <SelectValue
                      placeholder={
                        availablePurchaseBills.length === 0
                          ? "No unrecorded paid purchase bills available"
                          : "Select unrecorded paid purchase bill..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg shadow-xl max-h-64">
                    {availablePurchaseBills.length === 0 ? (
                      <div className="px-3 py-3 text-center text-xs text-muted-foreground italic">
                        No unrecorded paid purchase bills found. Bills that already have payments recorded do not appear here.
                      </div>
                    ) : (
                      availablePurchaseBills.map((invoice) => (
                        <SelectItem key={invoice.id} value={invoice.id} className="cursor-pointer py-2">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs sm:text-sm">{invoice.invoice_number}</span>
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 uppercase font-semibold bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400"
                                >
                                  Bill
                                </Badge>
                              </div>
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                                Paid
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium truncate">
                              {invoice.party_name} • {formatAmount(Number(invoice.total_amount || 0))}
                              {invoice.payment_method && ` • Mode: ${invoice.payment_method.toUpperCase()}`}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}

              {/* Selected Bill Quick Summary */}
              {!initialData?.id && selectedBill && (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 text-[11px] animate-in fade-in duration-150">
                  <span className="text-muted-foreground truncate">
                    Vendor: <strong className="text-foreground">{selectedBill.party_name}</strong>
                  </span>
                  <span className="font-bold text-purple-600 dark:text-purple-400 shrink-0 ml-2">
                    Total: {formatAmount(Number(selectedBill.total_amount || 0))}
                  </span>
                </div>
              )}
            </div>

            {/* 2. Amount Paid & Payment Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  Amount Paid ({currencySymbol}) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="purchase-amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                  className="h-9.5 border-border/60 font-black text-sm bg-muted/20 rounded-lg focus:ring-primary shadow-none"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  Payment Date <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="purchase-payment-date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  required
                  className="h-9.5 border-border/60 font-medium bg-muted/20 rounded-lg focus:ring-primary text-xs"
                />
              </div>
            </div>

            {/* 3. Payment Mode & Reference / Txn ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Payment Mode
                </Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                >
                  <SelectTrigger className="h-9.5 border-border/60 font-medium bg-muted/20 rounded-lg text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="cash">💵 Cash</SelectItem>
                    <SelectItem value="upi">📱 UPI / GPay / QR</SelectItem>
                    <SelectItem value="bank_transfer">🏛️ Bank Transfer</SelectItem>
                    <SelectItem value="cheque">📑 Cheque / DD</SelectItem>
                    <SelectItem value="credit_card">💳 Credit Card</SelectItem>
                    <SelectItem value="debit_card">💳 Debit Card</SelectItem>
                    <SelectItem value="other">⚠️ Other Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Reference / Txn ID
                </Label>
                <Input
                  id="purchase-reference-number"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  placeholder="e.g. UPI Ref / UTR / Cheque #"
                  className="h-9.5 border-border/60 font-medium bg-muted/20 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* 4. Internal Notes */}
            <div className="space-y-1">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Internal Notes
              </Label>
              <Textarea
                id="purchase-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes for vendor disbursements..."
                className="h-14 min-h-[56px] border-border/60 font-medium bg-muted/20 rounded-lg p-2.5 resize-none text-xs"
              />
            </div>
          </form>
        </div>

        {/* Action Footer */}
        <div className="px-5 py-3 border-t border-border/40 bg-muted/20 flex items-center justify-end gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="h-9 px-4 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="purchase-payment-form"
            size="sm"
            disabled={submitting}
            className="h-9 px-5 font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : initialData?.id ? (
              "Update Payment"
            ) : (
              "Record Outflow"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
