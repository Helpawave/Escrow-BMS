import React, { useState, useEffect } from "react";
import { ArrowDownLeft, X, Loader2, Car, CheckCircle2 } from "lucide-react";
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
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

export interface PaymentFormData {
  invoice_id: string;
  amount: number | string;
  payment_date: string;
  payment_method: string;
  reference_number: string;
  notes: string;
  invoice_number?: string;
  party_name?: string;
  payment_type?: 'full' | 'downpayment' | 'partial' | 'finance';
}

interface RecordSalesPaymentModalProps {
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
    payment_type?: 'full' | 'downpayment' | 'partial' | 'finance';
  } | null;
  targetCategory?: 'sales' | 'downpayment' | 'all';
}

export function RecordSalesPaymentModal({
  open,
  onOpenChange,
  invoices,
  onSubmit,
  initialData,
  targetCategory = 'all',
}: RecordSalesPaymentModalProps) {
  const { currencySymbol, formatAmount } = useCurrency();
  const [formData, setFormData] = useState<PaymentFormData>({
    invoice_id: "",
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
    reference_number: "",
    notes: "",
    payment_type: "full",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        const rawDate = String(initialData.payment_date || "");
        const cleanDate = rawDate
          ? (rawDate.includes("T") ? rawDate.split("T")[0] : rawDate.split(" ")[0])
          : new Date().toISOString().split("T")[0];

        // Deduce payment type from notes or initialData
        let pType: 'full' | 'downpayment' | 'partial' | 'finance' = initialData.payment_type || 'full';
        const lowerNote = (initialData.notes || '').toLowerCase();
        if (lowerNote.includes('downpayment') || lowerNote.includes('booking advance')) {
          pType = 'downpayment';
        } else if (lowerNote.includes('partial')) {
          pType = 'partial';
        } else if (lowerNote.includes('loan') || lowerNote.includes('finance')) {
          pType = 'finance';
        }

        setFormData({
          invoice_id: initialData.invoice_id || "",
          amount: initialData.amount ? String(initialData.amount) : "",
          payment_date: cleanDate,
          payment_method: initialData.payment_method || "cash",
          reference_number: initialData.reference_number || "",
          notes: initialData.notes || "",
          invoice_number: initialData.invoice_number || "",
          party_name: initialData.party_name || "",
          payment_type: pType,
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
          payment_type: "full",
        });
      }
    }
  }, [open, initialData]);

  const isInvoiceDownpayment = (inv: PendingInvoiceItem) => {
    return Boolean(
      inv.is_downpayment ||
      inv.invoice_number?.startsWith("DP-") ||
      inv.invoice_number?.startsWith("DP") ||
      inv.notes?.includes('"is_downpayment":true')
    );
  };

  // Filter for Sales Invoices vs Downpayment Invoices based on targetCategory
  const availableSalesInvoices = invoices.filter((inv) => {
    if (inv.type !== "sales") return false;
    if (inv.id === formData.invoice_id) return true;

    const isDP = isInvoiceDownpayment(inv);

    // If strictly in sales mode, never show downpayment invoices
    if (targetCategory === 'sales' && isDP) return false;
    // If strictly in downpayment mode, never show regular sales invoices
    if (targetCategory === 'downpayment' && !isDP) return false;

    if (isDP) {
      return inv.remaining_amount > 0 || !inv.has_payment_record;
    }

    const st = String(inv.status || "").toLowerCase().trim();
    return (st === "paid" && !inv.has_payment_record) || inv.remaining_amount > 0;
  });

  const selectedInvoice = invoices.find((inv) => inv.id === formData.invoice_id);
  const isDownpaymentInvoice = Boolean(
    targetCategory === 'downpayment' ||
    (selectedInvoice && isInvoiceDownpayment(selectedInvoice))
  );

  const handleSelectInvoice = (invoiceId: string) => {
    const selected = invoices.find((inv) => inv.id === invoiceId);
    if (!selected) return;

    const isDP = Boolean(selected.is_downpayment || selected.invoice_number?.startsWith("DP-"));
    const hasPriorPayments = Number(selected.total_paid || 0) > 0;
    const defaultType: 'full' | 'downpayment' | 'partial' = isDP
      ? (hasPriorPayments ? 'partial' : 'downpayment')
      : 'full';
    const suggestedAmount = selected.remaining_amount > 0
      ? selected.remaining_amount
      : Number(selected.total_amount || 0);

    const totalVehiclePrice = Number(selected.total_amount || 0);
    const priorPaid = Number(selected.total_paid || 0);

    let defaultNote = '';
    if (isDP) {
      if (hasPriorPayments) {
        defaultNote = `2nd Payment (Partial/Balance: ${currencySymbol}${suggestedAmount}) • Initial Downpayment was ${currencySymbol}${priorPaid} • Total Vehicle Price: ${currencySymbol}${totalVehiclePrice}`;
      } else {
        defaultNote = `1st Payment (Downpayment Advance: ${currencySymbol}${suggestedAmount}) • Total Vehicle Price: ${currencySymbol}${totalVehiclePrice}`;
      }
    } else {
      defaultNote = `Full payment for Invoice #${selected.invoice_number}`;
    }

    setFormData({
      ...formData,
      invoice_id: invoiceId,
      amount: String(suggestedAmount),
      payment_method: selected.payment_method || formData.payment_method || "cash",
      payment_type: defaultType,
      notes: defaultNote,
    });
  };

  const handleTypeChange = (type: 'full' | 'downpayment' | 'partial') => {
    if (!selectedInvoice) {
      setFormData({ ...formData, payment_type: type });
      return;
    }

    let newAmt = formData.amount;
    let newNote = formData.notes;
    const remaining = selectedInvoice.remaining_amount > 0 ? selectedInvoice.remaining_amount : Number(selectedInvoice.total_amount || 0);
    const totalVehiclePrice = Number(selectedInvoice.total_amount || 0);
    const priorPaid = Number(selectedInvoice.total_paid || 0);

    if (type === 'full') {
      newAmt = String(remaining);
      newNote = `Full payment for #${selectedInvoice.invoice_number}`;
    } else if (type === 'downpayment') {
      newNote = isDownpaymentInvoice
        ? `1st Payment (Downpayment Advance: ${currencySymbol}${newAmt}) • Total Vehicle Price: ${currencySymbol}${totalVehiclePrice}`
        : `Advance payment for #${selectedInvoice.invoice_number}`;
    } else if (type === 'partial') {
      newNote = isDownpaymentInvoice
        ? `2nd Payment (Partial/Balance: ${currencySymbol}${newAmt}) • Initial Downpayment was ${currencySymbol}${priorPaid} • Total Vehicle Price: ${currencySymbol}${totalVehiclePrice}`
        : `Partial payment (${currencySymbol}${newAmt}) for Invoice #${selectedInvoice.invoice_number}`;
    }

    setFormData({
      ...formData,
      payment_type: type,
      amount: newAmt,
      notes: newNote,
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const cleanDate = (formData.payment_date || "").trim() || new Date().toISOString().split("T")[0];
      await onSubmit(
        {
          ...formData,
          payment_date: cleanDate,
          amount: Number(formData.amount) || 0,
        },
        initialData?.id || null
      );
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
            <div className={cn(
              "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center",
              targetCategory === 'downpayment'
                ? "bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
            )}>
              {targetCategory === 'downpayment' ? <Car className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold tracking-tight text-foreground truncate">
                {initialData?.id
                  ? (targetCategory === 'downpayment' ? "Edit Downpayment Payment" : "Edit Sales Payment")
                  : (targetCategory === 'downpayment' ? "Record Downpayment Payment" : "Record Sales Payment")}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground truncate">
                {initialData?.id
                  ? "Update the recorded payment details below."
                  : (targetCategory === 'downpayment'
                      ? "Record customer advance or balance payment for a vehicle booking."
                      : "Record payment receipt from customer for a regular sales invoice.")}
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
          <form id="sales-payment-form" onSubmit={handleFormSubmit} className="space-y-3.5">
            {/* 1. Select Sales Invoice or Linked Invoice in Edit Mode */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  {targetCategory === 'downpayment' ? 'Vehicle Downpayment Invoice' : 'Sales Invoice'} {initialData?.id ? "(Linked)" : <span className="text-rose-500">*</span>}
                </Label>
                {!initialData?.id && (
                  <span className="text-[10px] text-muted-foreground/80 font-normal">
                    {targetCategory === 'downpayment' ? 'Pending Downpayment Records' : 'Pending & Unrecorded Invoices'}
                  </span>
                )}
              </div>

              {initialData?.id ? (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/40 border border-border/70 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">
                      {initialData.invoice_number || selectedInvoice?.invoice_number || "Invoice Linked"}
                    </span>
                    <Badge variant="outline" className={cn(
                      "text-[9px] px-1.5 py-0 font-bold uppercase",
                      targetCategory === 'downpayment'
                        ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                    )}>
                      {targetCategory === 'downpayment' ? 'Downpayment' : 'Sales'}
                    </Badge>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground truncate max-w-[200px]">
                    {initialData.party_name || selectedInvoice?.party_name || "Customer"}
                  </span>
                </div>
              ) : (
                <Select
                  value={formData.invoice_id}
                  onValueChange={handleSelectInvoice}
                >
                  <SelectTrigger className="h-9.5 border-border/60 focus:ring-primary font-medium bg-muted/20 rounded-lg text-xs">
                    <SelectValue
                      placeholder={
                        availableSalesInvoices.length === 0
                          ? (targetCategory === 'downpayment' ? "No pending downpayment invoices found" : "No pending sales invoices available")
                          : (targetCategory === 'downpayment' ? "Select vehicle downpayment invoice..." : "Select sales invoice...")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg shadow-xl max-h-64">
                    {availableSalesInvoices.length === 0 ? (
                      <div className="px-3 py-3 text-center text-xs text-muted-foreground italic">
                        {targetCategory === 'downpayment'
                          ? "No pending vehicle downpayment invoices found."
                          : "No pending regular sales invoices found."}
                      </div>
                    ) : (
                      availableSalesInvoices.map((invoice) => {
                        const isDP = invoice.is_downpayment || invoice.invoice_number?.startsWith("DP-");
                        return (
                          <SelectItem key={invoice.id} value={invoice.id} className="cursor-pointer py-2">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs sm:text-sm">{invoice.invoice_number}</span>
                                  {isDP ? (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] px-1 py-0 uppercase font-bold bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 flex items-center gap-0.5"
                                    >
                                      <Car className="w-2.5 h-2.5" />
                                      Downpayment
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] px-1 py-0 uppercase font-semibold bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400"
                                    >
                                      Invoice
                                    </Badge>
                                  )}
                                </div>
                                <span className={cn(
                                  "text-[9px] px-1.5 py-0.2 rounded font-bold uppercase",
                                  invoice.status === 'paid'
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                                    : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                                )}>
                                  {invoice.status.toUpperCase()}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground font-medium truncate">
                                {invoice.party_name} • Total: {formatAmount(Number(invoice.total_amount || 0))}
                                {invoice.remaining_amount > 0 && ` • Due: ${formatAmount(invoice.remaining_amount)}`}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              )}

              {/* Selected Invoice Quick Summary & Downpayment Split Info */}
              {!initialData?.id && selectedInvoice && (
                <div className="space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-[11px]">
                    <span className="text-muted-foreground truncate">
                      Customer: <strong className="text-foreground">{selectedInvoice.party_name}</strong>
                    </span>
                    <div className="flex items-center gap-2 font-bold shrink-0 ml-2">
                      <span className="text-muted-foreground">Total: {formatAmount(Number(selectedInvoice.total_amount || 0))}</span>
                      {selectedInvoice.remaining_amount > 0 && (
                        <span className="text-amber-600 dark:text-amber-400">• Bal: {formatAmount(selectedInvoice.remaining_amount)}</span>
                      )}
                    </div>
                  </div>

                  {isDownpaymentInvoice && (
                    <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-950 dark:text-amber-200">
                        <span className="flex items-center gap-1.5">
                          <Car className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          Vehicle Downpayment Split
                        </span>
                        <span>Total Price: {formatAmount(Number(selectedInvoice.total_amount || 0))}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded-lg bg-background/90 border border-border/50">
                          <div className="text-muted-foreground text-[10px] font-medium">1st Payment (Downpayment)</div>
                          <div className="font-bold text-foreground mt-0.5">
                            {Number(selectedInvoice.total_paid || 0) > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400">✓ Paid: {formatAmount(selectedInvoice.total_paid)}</span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400">Advance To Be Paid</span>
                            )}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-background/90 border border-border/50">
                          <div className="text-muted-foreground text-[10px] font-medium">2nd Payment (Partial / Balance)</div>
                          <div className="font-bold text-foreground mt-0.5">
                            {selectedInvoice.remaining_amount > 0 ? (
                              <span className="text-blue-600 dark:text-blue-400">Due: {formatAmount(selectedInvoice.remaining_amount)}</span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400">✓ Settled</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-[11px] text-amber-900 dark:text-amber-300 font-semibold bg-amber-100/70 dark:bg-amber-900/50 p-2 rounded-lg leading-relaxed">
                        {Number(selectedInvoice.total_paid || 0) > 0 ? (
                          <span>🚗 <strong>2nd Installment:</strong> Initial Downpayment of {formatAmount(selectedInvoice.total_paid)} was already paid. Recording 2nd payment (Partial / Balance) now.</span>
                        ) : (
                          <span>🚗 <strong>1st Installment:</strong> Recording initial downpayment booking advance for this vehicle.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Payment Type / Nature (Full, Downpayment Advance, Partial) */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Payment Nature / Category</span>
                <span className="text-[10px] text-muted-foreground/70 normal-case font-normal">
                  {formData.payment_type === 'full'
                    ? '100% Cleared / Paid in Full'
                    : formData.payment_type === 'downpayment'
                    ? (isDownpaymentInvoice ? 'Vehicle Booking Advance / Token' : 'Advance Payment')
                    : 'Partial Payment'}
                </span>
              </Label>
              {isDownpaymentInvoice ? (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('downpayment')}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer",
                      formData.payment_type === 'downpayment'
                        ? "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 font-bold shadow-sm"
                        : "border-border/60 hover:bg-muted/40 text-muted-foreground text-xs font-medium"
                    )}
                  >
                    <span className="text-xs font-bold flex items-center gap-1">
                      <Car className="w-3 h-3 text-amber-600 dark:text-amber-400" /> 1st: Advance
                    </span>
                    <span className="text-[10px] opacity-75">Booking Token</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('partial')}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer",
                      formData.payment_type === 'partial'
                        ? "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300 font-bold shadow-sm"
                        : "border-border/60 hover:bg-muted/40 text-muted-foreground text-xs font-medium"
                    )}
                  >
                    <span className="text-xs font-bold">2nd: Partial</span>
                    <span className="text-[10px] opacity-75">Balance Clearing</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('full')}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer",
                      formData.payment_type === 'full'
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold shadow-sm"
                        : "border-border/60 hover:bg-muted/40 text-muted-foreground text-xs font-medium"
                    )}
                  >
                    <span className="text-xs font-bold">Full Settlement</span>
                    <span className="text-[10px] opacity-75">100% Cleared</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('full')}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer",
                      formData.payment_type === 'full'
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold shadow-sm"
                        : "border-border/60 hover:bg-muted/40 text-muted-foreground text-xs font-medium"
                    )}
                  >
                    <span className="text-xs font-bold">Full Payment</span>
                    <span className="text-[10px] opacity-75">100% Cleared</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('partial')}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer",
                      formData.payment_type === 'partial'
                        ? "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300 font-bold shadow-sm"
                        : "border-border/60 hover:bg-muted/40 text-muted-foreground text-xs font-medium"
                    )}
                  >
                    <span className="text-xs font-bold">Partial Payment</span>
                    <span className="text-[10px] opacity-75">Part Payment</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Amount Received & Payment Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  Amount Received ({currencySymbol}) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="sales-amount"
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
                  id="sales-payment-date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  required
                  className="h-9.5 border-border/60 font-medium bg-muted/20 rounded-lg focus:ring-primary text-xs"
                />
              </div>
            </div>

            {/* 4. Payment Mode & Reference / Txn ID */}
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
                  id="sales-reference-number"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  placeholder="e.g. UPI Ref / UTR / Cheque #"
                  className="h-9.5 border-border/60 font-medium bg-muted/20 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* 5. Internal Notes & Receipts Description */}
            <div className="space-y-1">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Payment Description / Notes
              </Label>
              <Textarea
                id="sales-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={isDownpaymentInvoice ? "e.g. Booking advance received for vehicle, remaining balance on delivery..." : "e.g. Payment received via bank transfer / UPI, order ref..."}
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
            form="sales-payment-form"
            size="sm"
            disabled={submitting}
            className="h-9 px-5 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : initialData?.id ? (
              "Update Payment"
            ) : (
              "Record Payment"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
