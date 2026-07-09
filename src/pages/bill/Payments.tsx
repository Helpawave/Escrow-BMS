import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, CreditCard, Receipt, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePayments, usePendingPaymentInvoices } from "@/hooks/usePayments";
import { Payment } from "@/types/invoice";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { SuccessModal } from '@/components/SuccessModal';
import { DeleteConfirmation } from '@/components/DeleteConfirmation';

interface PendingInvoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  clients: {
    name: string;
  };
  remaining_amount?: number;
}

const PaymentsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const ITEMS_PER_PAGE = 50;

  const { data: paymentsData, isLoading: loading, isFetching: searchLoading } = usePayments({
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
    searchTerm: debouncedSearch
  });
  const { data: invoicesData = [] } = usePendingPaymentInvoices();
  const invoices = invoicesData as unknown as PendingInvoice[];
  
  const payments = paymentsData?.payments || [];
  const totalPages = paymentsData ? Math.ceil(paymentsData.totalCount / ITEMS_PER_PAGE) : 1;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    invoice_id: '',
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
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

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];
    if (!formData.invoice_id) errors.push("Please select an invoice.");
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
        const { error } = await supabase
          .from('payments')
          .insert([{ ...formData, user_id: user?.id }]);

        if (error) throw error;

        // Update invoice status to paid if full payment (with ₹1 tolerance for rounding)
        const selectedInvoice = invoices.find(inv => inv.id === formData.invoice_id);
        if (selectedInvoice && Math.abs((selectedInvoice.remaining_amount ?? selectedInvoice.total_amount) - formData.amount) < 1) {
          await supabase
            .from('invoices')
            .update({ status: 'paid' })
            .eq('id', formData.invoice_id);
        }

        setSuccessInfo({
          title: "Payment Recorded",
          message: "The payment has been successfully logged and the invoice status updated."
        });
        setShowSuccess(true);
      }

      resetForm();
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDialogOpen(false);
    } catch (error: unknown) {
      console.error('Error saving payment:', error);
      
      const err = error as { message?: string };
      const errorMessage = err?.message || "An unexpected error occurred.";

      toast({
        variant: "destructive",
        title: "Save Failed",
        description: (
          <div className="mt-2 text-sm">
            <p className="font-semibold text-destructive">{errorMessage}</p>
            <div className="mt-2 p-2 bg-destructive/5 rounded border border-destructive/10 text-[10px]">
              <p className="font-bold uppercase tracking-widest opacity-70 mb-1">Troubleshooting:</p>
              <ul className="list-disc list-inside space-y-0.5 opacity-90">
                <li>Invoice ID: {formData.invoice_id || "N/A"}</li>
                <li>Amount: {formData.amount || "0"}</li>
                <li>Method: {formData.payment_method || "N/A"}</li>
                <li>Session: {user?.id ? "Active" : "Expired"}</li>
              </ul>
            </div>
          </div>
        )
      });
    }
  };

  const handleEdit = (payment: Payment) => {
    setFormData({
      invoice_id: payment.invoice_id,
      amount: payment.amount,
      payment_date: payment.payment_date,
      payment_method: payment.payment_method,
      reference_number: payment.reference_number,
      notes: payment.notes
    });
    setEditingId(payment.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
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

  const resetForm = () => {
    setFormData({
      invoice_id: '',
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'bank_transfer',
      reference_number: '',
      notes: ''
    });
    setEditingId(null);
  };

  const getTotalPayments = () => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

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
          <p className="text-muted-foreground mt-1 text-sm">Track and manage payment records</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="lg" className="w-full sm:w-auto h-11 shadow-sm hover:shadow-md transition-all active:scale-95" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background max-h-[90vh] flex flex-col">
            <DialogHeader className="p-4 md:p-8 pb-4 shrink-0">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Receipt className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                {editingId ? 'Edit Payment Record' : 'Record New Payment'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                {editingId ? 'Modify the details of this payment transaction below.' : 'Log a new payment transaction into your financial records.'}
              </DialogDescription>
            </DialogHeader>

            <DialogDescription className="sr-only">
              Form to record or edit payment details for an invoice.
            </DialogDescription>

            {/* Form Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
              <form id="payment-form" onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">Select Invoice <span className="text-rose-500">*</span></Label>
                      <Select value={formData.invoice_id} onValueChange={(value) => {
                        const selectedInvoice = invoices.find(inv => inv.id === value);
                        setFormData({
                          ...formData,
                          invoice_id: value,
                          amount: selectedInvoice?.remaining_amount || 0
                        });
                      }}>
                        <SelectTrigger className="h-11 border-border/60 focus:ring-primary font-medium bg-muted/20 rounded-lg">
                          <SelectValue placeholder={invoices.length === 0 ? "No pending invoices" : "Select an invoice"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg shadow-xl">
                          {invoices.length === 0 ? (
                            <div className="px-2 py-4 text-center text-xs text-muted-foreground italic">
                              No pending invoices found
                            </div>
                          ) : (
                            invoices.map((invoice) => (
                              <SelectItem key={invoice.id} value={invoice.id} className="cursor-pointer py-2.5">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-bold text-sm">{invoice.invoice_number}</span>
                                  <span className="text-[9px] text-muted-foreground font-bold">{invoice.clients?.name} • Due: ₹{invoice.remaining_amount?.toLocaleString()}</span>
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
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Method</Label>
                        <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                          <SelectTrigger className="h-11 border-border/60 font-medium bg-muted/20 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="upi">UPI / GPay</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
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
                        placeholder="e.g. TXN12345678"
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
                        className="min-h-[100px] border-border/60 font-medium bg-muted/20 rounded-lg p-3 resize-none"
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
                className="flex-1 h-11 font-bold rounded-xl border-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="payment-form"
                className="flex-1 h-11 font-black rounded-xl shadow-lg shadow-primary/20 bg-primary hover:opacity-90 text-primary-foreground uppercase tracking-widest transition-all active:scale-[0.98]"
              >
                {editingId ? 'Update' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search payments by invoice, client, reference..."
            className="pl-9 pr-10 h-11 bg-background border-border/50 rounded-xl"
          />
          {searchTerm.trim() && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {searchLoading && (
          <div className="flex items-center justify-center h-11 px-4 rounded-md border border-border bg-muted/20 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Searching...
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="p-4 md:p-6 bg-card dark:bg-card border-2 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-1">Total Paid</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">₹{getTotalPayments().toLocaleString()}</p>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 opacity-40">
              <CreditCard className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-emerald-600/60 mt-2">Verified Settlements</p>
        </Card>

        <Card className="p-4 md:p-6 bg-card dark:bg-card border-2 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-1">Total Records</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">{payments.length}</p>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 opacity-40">
              <Receipt className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-blue-600/60 mt-2">Payment Transactions</p>
        </Card>

        <Card className="p-4 md:p-6 bg-card dark:bg-card border-2 rounded-2xl hidden sm:block">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-1">Unpaid Invoices</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">{invoices.length}</p>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 opacity-40">
              <CreditCard className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-amber-600/60 mt-2">Awaiting Settlement</p>
        </Card>
      </div>

      {payments.length === 0 ? (
        <Card className="p-4 md:p-8 text-center bg-card dark:bg-card">
          <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Payments Recorded</h3>
          <p className="text-muted-foreground mb-4">
            Start recording payments to track your cash flow and invoice settlements.
          </p>
          <Button variant="hero" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Record Your First Payment
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden bg-card dark:bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Payment Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Invoice</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Client</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Method</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Reference</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-muted/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">
                        {safelyToLocaleDate(payment.payment_date)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{payment.invoices?.invoice_number}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{payment.invoices?.clients?.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-bold text-success">₹{payment.amount.toFixed(2)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs dark:bg-slate-800 dark:text-slate-300">
                        {payment.payment_method.replace('_', ' ').toUpperCase()}
                      </Badge>
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
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(payment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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
        description="Are you sure you want to remove this payment entry? This will affect the invoice balance and cannot be undone."
      />
    </div>
  );
};

export default PaymentsPage;
