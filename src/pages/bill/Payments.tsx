import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Plus, Edit, Trash2, CreditCard, Receipt, Search, X, CheckCircle2, Banknote, Smartphone, ChevronDown, AlertCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePayments, usePendingPaymentInvoices, PendingInvoiceItem } from "@/hooks/usePayments";
import { Payment } from "@/types/invoice";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { SuccessModal } from '@/components/SuccessModal';
import { DeleteConfirmation } from '@/components/DeleteConfirmation';
import { cn } from "@/lib/utils";

const PaymentsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const ITEMS_PER_PAGE = 50;

  const { data: paymentsData, isLoading: loading, isFetching: searchLoading } = usePayments({
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
    searchTerm: debouncedSearch,
    methodFilter,
    dateFilter,
    startDate,
    endDate
  });
  const { data: invoicesData = [] } = usePendingPaymentInvoices();
  const invoices = invoicesData as unknown as PendingInvoiceItem[];

  const payments = paymentsData?.payments || [];
  const totalPages = paymentsData ? Math.max(1, Math.ceil(paymentsData.totalCount / ITEMS_PER_PAGE)) : 1;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    invoice_id: '',
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference_number: '',
    notes: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  // Custom Modal States
  const [showSuccess, setShowSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: '', message: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { user, profile } = useAuth();
  const targetUserId = user?.id;
  const { toast } = useToast();

  const getCreatorTag = (notesText?: string | null) => {
    if (notesText && notesText.includes('Created by:')) {
      const match = notesText.match(/Created by: [^•\n]+/);
      const extracted = match ? match[0] : notesText;
      const n = extracted.replace('Created by:', '').trim();
      if (n && n.toLowerCase() !== 'company' && n.toLowerCase() !== 'company owner') {
        return `Created by: ${n}`;
      }
    }
    const fallback = profile?.company_name || (user?.user_metadata?.full_name as string) || 'Owner';
    return `Created by: ${fallback}`;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, methodFilter, dateFilter, startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];
    if (!formData.invoice_id) errors.push("Please select an invoice or purchase bill.");
    if (!formData.amount || formData.amount <= 0) {
      errors.push("Please enter a payment amount greater than zero.");
    }
    if (!formData.payment_date) errors.push("Payment date is required.");

    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Validation Failed",
        description: (
          <ul className="list-disc list-inside text-xs mt-1">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        )
      });
      return;
    }

    try {
      if (!targetUserId) throw new Error("Please log in to record payment.");

      if (editingId) {
        const { error } = await supabase
          .from('payments')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        setSuccessInfo({
          title: "Payment Updated",
          message: "The payment record has been successfully modified."
        });
        setShowSuccess(true);
      } else {
        const creatorName = profile?.company_name || user?.user_metadata?.full_name || 'Owner';
        const paymentNotes = formData.notes ? `${formData.notes} • Created by: ${creatorName}` : `Created by: ${creatorName}`;

        const { error } = await supabase
          .from('payments')
          .insert([{ ...formData, notes: paymentNotes, user_id: targetUserId }]);

        if (error) throw error;

        // Update invoice / bill status to paid
        const selectedInvoice = invoices.find(inv => inv.id === formData.invoice_id);
        if (selectedInvoice && selectedInvoice.status !== 'paid') {
          const targetTable = selectedInvoice.type === 'purchase' ? 'purchase_invoices' : 'invoices';
          await supabase
            .from(targetTable)
            .update({ status: 'paid' })
            .eq('id', formData.invoice_id);
        }

        setSuccessInfo({
          title: "Payment Recorded",
          message: "The payment has been successfully logged and status updated."
        });
        setShowSuccess(true);
      }

      resetForm();
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDialogOpen(false);
    } catch (error: unknown) {
      console.error('Error saving payment:', error);
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: err?.message || "An unexpected error occurred."
      });
    }
  };

  const handleEdit = (payment: Payment) => {
    setFormData({
      invoice_id: payment.invoice_id,
      amount: payment.amount,
      payment_date: payment.payment_date,
      payment_method: payment.payment_method || 'cash',
      reference_number: payment.reference_number || '',
      notes: payment.notes || ''
    });
    setEditingId(payment.id);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setPaymentToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentToDelete);

      if (error) throw error;

      setSuccessInfo({
        title: "Payment Deleted",
        message: "The payment record has been permanently removed."
      });
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete payment."
      });
    } finally {
      setShowDeleteConfirm(false);
      setPaymentToDelete(null);
    }
  };

  const handleUpdatePaymentMethod = async (paymentId: string, newMethod: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ payment_method: newMethod })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Method Updated! ✅",
        description: `Payment method set to ${newMethod.replace('_', ' ').toUpperCase()}.`
      });

      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (err) {
      console.error('Error updating payment method:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update payment method."
      });
    }
  };

  const resetForm = () => {
    setFormData({
      invoice_id: '',
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      reference_number: '',
      notes: ''
    });
    setEditingId(null);
  };

  // Filter invoices for dropdown: ONLY show paid sales invoices & purchase bills, and exclude those already recorded (unless editing)
  const availableInvoices = invoices.filter(
    inv => inv.status === 'paid' && (!inv.has_payment_record || inv.id === formData.invoice_id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track and manage sales & purchase payment records</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="lg" className="w-full sm:w-auto h-11 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background max-h-[90vh] flex flex-col">
            <DialogHeader className="p-4 md:p-8 pb-4 shrink-0">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Receipt className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                {editingId ? 'Edit Payment Record' : 'Record New Payment'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                {editingId ? 'Modify the details of this payment transaction below.' : 'Log a payment transaction for sales invoice or purchase bill.'}
              </DialogDescription>
            </DialogHeader>

            {/* Form Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
              <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        Select Sales Invoice / Purchase Bill <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        value={formData.invoice_id}
                        onValueChange={(value) => {
                          const selectedInvoice = invoices.find(inv => inv.id === value);
                          setFormData({
                            ...formData,
                            invoice_id: value,
                            amount: Number(selectedInvoice?.total_amount || selectedInvoice?.remaining_amount || 0),
                            payment_method: selectedInvoice?.payment_method || formData.payment_method || 'cash'
                          });
                        }}
                      >
                        <SelectTrigger className="h-11 border-border/60 focus:ring-primary font-medium bg-muted/20 rounded-lg">
                          <SelectValue placeholder={availableInvoices.length === 0 ? "No pending invoices available" : "Select invoice or purchase bill"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg shadow-xl max-h-72">
                          {availableInvoices.length === 0 ? (
                            <div className="px-3 py-4 text-center text-xs text-muted-foreground italic">
                              No unrecorded invoices or purchase bills found. All current entries already have payments logged.
                            </div>
                          ) : (
                            availableInvoices.map((invoice) => (
                              <SelectItem key={invoice.id} value={invoice.id} className="cursor-pointer py-2.5">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-sm">{invoice.invoice_number}</span>
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "text-[9px] px-1 py-0 uppercase font-semibold",
                                          invoice.type === 'purchase'
                                            ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400"
                                            : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400"
                                        )}
                                      >
                                        {invoice.type === 'purchase' ? 'Purchase Bill' : 'Sales Invoice'}
                                      </Badge>
                                    </div>
                                    <span className={cn(
                                      "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                                      invoice.status === 'paid'
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                                        : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                                    )}>
                                      {invoice.status === 'paid' ? 'Paid' : 'Unsettled'}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    {invoice.party_name} • ₹{Number(invoice.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    {invoice.payment_method && ` • Mode: ${invoice.payment_method.toUpperCase()}`}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">Amount (₹) <span className="text-rose-500">*</span></Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                        required
                        className="h-11 border-border/60 font-bold text-base bg-muted/20 rounded-lg focus:ring-primary shadow-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">Payment Date <span className="text-rose-500">*</span></Label>
                        <Input
                          id="payment_date"
                          type="date"
                          value={formData.payment_date}
                          onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                          required
                          className="h-11 border-border/60 font-medium bg-muted/20 rounded-lg focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Payment Mode</Label>
                        <Select
                          value={formData.payment_method}
                          onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                        >
                          <SelectTrigger className="h-11 border-border/60 font-medium bg-muted/20 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="upi">UPI / GPay</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                            <SelectItem value="debit_card">Debit Card</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Reference / Txn ID</Label>
                      <Input
                        id="reference_number"
                        value={formData.reference_number}
                        onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                        placeholder="e.g. UPI Ref / TXN12345678"
                        className="h-11 border-border/60 font-medium bg-muted/20 rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Internal Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Optional notes for your records..."
                        className="min-h-[90px] border-border/60 font-medium bg-muted/20 rounded-lg p-3 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Action Footer */}
            <DialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5 shrink-0 sm:flex-row sm:space-x-0">
              <Button
                variant="outline"
                type="button"
                onClick={() => setDialogOpen(false)}
                className="flex-1 h-11 font-bold rounded-xl border-2 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="payment-form"
                className="flex-1 h-11 font-black rounded-xl shadow-lg shadow-primary/20 bg-primary hover:opacity-90 text-primary-foreground uppercase tracking-widest transition-all active:scale-[0.98] cursor-pointer"
              >
                {editingId ? 'Update' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search payments by invoice, client, vendor, reference..."
              className="pl-9 pr-10 h-11 bg-background border-border/50 rounded-xl"
            />
            {searchTerm.trim() && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="w-full md:w-44">
            <select
              className="w-full h-11 rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="all">All Methods</option>
              <option value="pending">⚠️ Pending Mode Only</option>
              <option value="cash">Cash Only</option>
              <option value="upi">UPI / GPay</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="w-full md:w-44">
            <select
              className="w-full h-11 rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
        </div>

        {dateFilter === 'custom' && (
          <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-muted/20 border border-border/50 rounded-xl animate-in fade-in duration-200">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label className="text-xs font-bold text-muted-foreground whitespace-nowrap">From:</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs rounded-lg bg-background border-border/60"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label className="text-xs font-bold text-muted-foreground whitespace-nowrap">To:</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs rounded-lg bg-background border-border/60"
              />
            </div>
            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setStartDate(""); setEndDate(""); }}
                className="text-xs h-8 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Clear Dates
              </Button>
            )}
          </div>
        )}

        {searchLoading && (
          <div className="flex items-center justify-center h-9 px-4 rounded-md border border-border bg-muted/20 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Searching...
          </div>
        )}
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        <Card className="p-4 md:p-5 bg-card dark:bg-card border-2 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-1">Total Paid</p>
          <div className="flex items-center justify-between">
            <p className="text-xl lg:text-2xl font-black text-foreground tracking-tight">
              ₹{(paymentsData?.stats?.overallTotal ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 opacity-60">
              <CreditCard className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-emerald-600/70 mt-2">Verified Settlements</p>
        </Card>

        <Card className="p-4 md:p-5 bg-card dark:bg-card border-2 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-1">Total Records</p>
          <div className="flex items-center justify-between">
            <p className="text-xl lg:text-2xl font-black text-foreground tracking-tight">
              {paymentsData?.stats?.totalRecords ?? payments.length}
            </p>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 opacity-60">
              <Receipt className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-blue-600/70 mt-2">Payment Transactions</p>
        </Card>

        <Card className="p-4 md:p-5 bg-card dark:bg-card border-2 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-1">Paid Invoices</p>
          <div className="flex items-center justify-between">
            <p className="text-xl lg:text-2xl font-black text-foreground tracking-tight">
              {invoices.filter(inv => inv.status === 'paid').length}
            </p>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 opacity-80">
              <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-emerald-600/80 mt-2">Marked as Settled</p>
        </Card>

        <Card className="p-4 md:p-5 bg-card dark:bg-card border-2 rounded-2xl border-emerald-200/50 dark:border-emerald-900/30">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Cash Collected</p>
          <div className="flex items-center justify-between">
            <p className="text-xl lg:text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
              ₹{(paymentsData?.stats?.overallCash ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Banknote className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-emerald-600/70 mt-2">Cash Payments</p>
        </Card>

        <Card className="p-4 md:p-5 bg-card dark:bg-card border-2 rounded-2xl border-violet-200/50 dark:border-violet-900/30">
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-1">UPI Collected</p>
          <div className="flex items-center justify-between">
            <p className="text-xl lg:text-2xl font-black text-violet-700 dark:text-violet-400 tracking-tight">
              ₹{(paymentsData?.stats?.overallUpi ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600">
              <Smartphone className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-violet-600/70 mt-2">UPI / GPay Transfers</p>
        </Card>
      </div>

      {payments.length === 0 ? (
        <Card className="p-4 md:p-8 text-center bg-card dark:bg-card">
          <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Payments Found</h3>
          <p className="text-muted-foreground mb-4">
            {paymentsData?.totalCount === 0 ? "Start recording payments to track your cash flow and invoice settlements." : "No payment records match your current filters."}
          </p>
          {paymentsData?.totalCount === 0 && (
            <Button variant="default" onClick={() => setDialogOpen(true)} className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2" />
              Record Your First Payment
            </Button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden bg-card dark:bg-card border-border/80 rounded-2xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoice / Bill</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Client / Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Reference</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((payment) => {
                  const invoiceType = (payment as unknown as { invoice_type?: string }).invoice_type;
                  const partyName = (payment as unknown as { party_name?: string }).party_name || payment.invoices?.clients?.name || 'Unknown';
                  const displayNumber = (payment as unknown as { display_number?: string }).display_number || payment.invoices?.invoice_number || 'N/A';

                  return (
                    <tr key={payment.id} className="hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">
                          {safelyToLocaleDate(payment.payment_date)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-foreground">{displayNumber}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[8px] px-1 py-0 font-semibold uppercase",
                              invoiceType === 'purchase'
                                ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400"
                                : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400"
                            )}
                          >
                            {invoiceType === 'purchase' ? 'Purchase' : 'Sales'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{partyName}</div>
                        <div className="text-[10px] text-muted-foreground/60 font-normal mt-0.5">
                          {getCreatorTag(payment.notes)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{Number(payment.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {payment.payment_method === 'pending' || !payment.payment_method ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all border border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700 shadow-sm cursor-pointer active:scale-95 animate-pulse"
                                title="Click to select payment method"
                              >
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>Select Method</span>
                                <ChevronDown className="w-3.5 h-3.5 opacity-70 ml-0.5 text-amber-700" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 p-1.5 rounded-2xl shadow-xl border border-border/80 z-50">
                              <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                Select Payment Method
                              </div>
                              <DropdownMenuItem
                                onClick={() => handleUpdatePaymentMethod(payment.id, 'cash')}
                                className="cursor-pointer font-bold text-xs py-2 hover:bg-emerald-50 text-emerald-900 dark:text-emerald-100 rounded-lg flex items-center gap-2"
                              >
                                <Banknote className="w-4 h-4 text-emerald-600" />
                                <span>Cash</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdatePaymentMethod(payment.id, 'upi')}
                                className="cursor-pointer font-bold text-xs py-2 hover:bg-violet-50 text-violet-900 dark:text-violet-100 rounded-lg flex items-center gap-2"
                              >
                                <Smartphone className="w-4 h-4 text-violet-600" />
                                <span>UPI / Online</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdatePaymentMethod(payment.id, 'bank_transfer')}
                                className="cursor-pointer font-bold text-xs py-2 hover:bg-blue-50 text-blue-900 dark:text-blue-100 rounded-lg flex items-center gap-2"
                              >
                                <CreditCard className="w-4 h-4 text-blue-600" />
                                <span>Bank Transfer</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdatePaymentMethod(payment.id, 'cheque')}
                                className="cursor-pointer font-bold text-xs py-2 hover:bg-amber-50 text-amber-900 dark:text-amber-100 rounded-lg flex items-center gap-2"
                              >
                                <FileText className="w-4 h-4 text-amber-600" />
                                <span>Cheque</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdatePaymentMethod(payment.id, 'credit_card')}
                                className="cursor-pointer font-bold text-xs py-2 hover:bg-rose-50 text-rose-900 dark:text-rose-100 rounded-lg flex items-center gap-2"
                              >
                                <CreditCard className="w-4 h-4 text-rose-600" />
                                <span>Credit Card</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdatePaymentMethod(payment.id, 'debit_card')}
                                className="cursor-pointer font-bold text-xs py-2 hover:bg-indigo-50 text-indigo-900 dark:text-indigo-100 rounded-lg flex items-center gap-2"
                              >
                                <CreditCard className="w-4 h-4 text-indigo-600" />
                                <span>Debit Card</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs uppercase font-bold",
                              payment.payment_method === 'cash' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400" :
                                payment.payment_method === 'upi' ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400" :
                                  payment.payment_method === 'bank_transfer' ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400" :
                                    payment.payment_method === 'cheque' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400" :
                                      payment.payment_method === 'credit_card' ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400" :
                                        payment.payment_method === 'debit_card' ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400" :
                                          "dark:bg-slate-800 dark:text-slate-300"
                            )}
                          >
                            {payment.payment_method.replace('_', ' ').toUpperCase()}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-muted-foreground">
                          {payment.reference_number || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(payment)}
                            className="h-8 w-8 p-0 cursor-pointer"
                            title="Edit Payment"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(payment.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            title="Delete Payment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="cursor-pointer"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="cursor-pointer"
          >
            Next
          </Button>
        </div>
      )}

      <SuccessModal
        isOpen={showSuccess}
        onOpenChange={setShowSuccess}
        title={successInfo.title}
        message={successInfo.message}
      />

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmDelete}
        title="Delete Payment Record?"
        description="Are you sure you want to remove this payment entry? This will affect your payment logs and cannot be undone."
      />
    </div>
  );
};

export default PaymentsPage;
