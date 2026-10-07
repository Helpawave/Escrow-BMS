import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Download, Trash2, Mail, MoreVertical, Eye, Loader2, CreditCard, Receipt, Calendar, ArrowRight, ArrowLeft, MoreHorizontal, X, Pencil, Wallet, CheckCircle2, ShieldCheck, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase, serviceSupabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useExpenses } from "@/hooks/useExpenses";
import { useQueryClient } from "@tanstack/react-query";
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Expense } from "@/types/invoice";
import { SuccessModal } from "@/components/SuccessModal";
import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import { Badge } from "@/components/ui/badge";
import { StaffHeaderBadge } from "@/components/StaffHeaderBadge";
import { DataTablePagination } from "@/components/DataTablePagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Client {
  id: string;
  name: string;
}

const ExpensesPage = () => {
  const { currencySymbol, formatAmount } = useCurrency();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || "";
  const initialExpenseId = searchParams.get('id') || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: expensesData, isLoading: loading, isFetching: searchLoading } = useExpenses({
    page: currentPage,
    pageSize: pageSize,
    searchTerm: debouncedSearch,
  });

  const expenses = expensesData?.expenses || [];
  const totalPages = expensesData ? Math.max(1, Math.ceil(expensesData.totalCount / pageSize)) : 1;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '' as string | number,
    category: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    is_billable: false,
    client_id: '',
    tax_amount: '' as string | number
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: '', message: '' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const { user, effectiveUserId } = useAuth();
  const targetUserId = effectiveUserId || user?.id;
  const { toast } = useToast();

  const categories = [
    'Office Supplies', 'Travel', 'Meals & Entertainment', 'Equipment',
    'Software & Subscriptions', 'Marketing', 'Legal & Professional',
    'Utilities', 'Rent', 'Insurance', 'Training', 'Other'
  ];

  const fetchClients = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const clientToUse = serviceSupabase || supabase;
      const { data, error } = await clientToUse
        .from('clients')
        .select('id, name')
        .eq('user_id', targetUserId)
        .order('name');
      if (error) throw error;
      setClients((data as unknown as Client[]) || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  }, [targetUserId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Handle specific expense navigation from global search
  useEffect(() => {
    const findExpensePage = async () => {
      if (initialExpenseId && targetUserId) {
        try {
          const clientToUse = serviceSupabase || supabase;
          const { data } = await clientToUse
            .from('expenses')
            .select('id')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });

          if (data) {
            const expensesData = (data as unknown) as { id: string }[];
            const index = expensesData.findIndex(e => e.id === initialExpenseId);
            if (index !== -1) {
              const page = Math.ceil((index + 1) / pageSize);
              setCurrentPage(page);
            }
          }
        } catch (err) {
          console.error("Error finding expense page:", err);
        }
      }
    };

    if (targetUserId) {
      findExpensePage();
    }
  }, [initialExpenseId, targetUserId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user, fetchClients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];
    if (!formData.title.trim()) errors.push("Expense title is required.");
    if (!formData.amount || Number(formData.amount) <= 0) {
      errors.push("Please enter an amount greater than zero.");
    }
    if (!formData.category) errors.push("Please select a category.");
    if (!formData.expense_date) errors.push("Expense date is required.");

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
      const clientToUse = serviceSupabase || supabase;

      const payload = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        amount: Number(formData.amount),
        category: formData.category,
        expense_date: formData.expense_date,
        payment_method: formData.payment_method,
        is_billable: Boolean(formData.is_billable),
        client_id: (formData.is_billable && formData.client_id?.trim()) ? formData.client_id.trim() : null,
        tax_amount: Number(formData.tax_amount || 0)
      };

      if (editingId) {
        const { error } = await clientToUse
          .from('expenses')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        setSuccessInfo({
          title: 'Expense Updated',
          message: 'Your expense record has been successfully adjusted.'
        });
      } else {
        const { error } = await clientToUse
          .from('expenses')
          .insert([{ ...payload, user_id: targetUserId }]);

        if (error) throw error;
        setSuccessInfo({
          title: 'Expense Recorded',
          message: 'New expense has been safely logged into your financial records.'
        });
      }

      resetForm();
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDialogOpen(false);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error saving expense:', error);
      
      const errorMessage = (error as Error)?.message || "An unexpected error occurred.";

      toast({
        variant: "destructive",
        title: "Save Failed",
        description: (
          <div className="mt-2 text-sm text-destructive-foreground">
            <p className="font-semibold text-white">{errorMessage}</p>
            <div className="mt-2 p-2 bg-white/10 rounded border border-white/20 text-[10px]">
              <p className="font-bold uppercase tracking-widest opacity-80 mb-1 text-white">Troubleshooting:</p>
              <ul className="list-disc list-inside space-y-0.5 text-white/90">
                <li>Title: {formData.title || "N/A"}</li>
                <li>Amount: {formData.amount || "0"}</li>
                <li>Category: {formData.category || "N/A"}</li>
                <li>Session: {user?.id ? "Active" : "Expired"}</li>
              </ul>
            </div>
          </div>
        )
      });
    }
  };

  const handleEdit = (expense: Expense) => {
    setFormData({
      title: expense.title,
      description: expense.description || '',
      amount: expense.amount ? String(expense.amount) : '',
      category: expense.category,
      expense_date: expense.expense_date,
      payment_method: expense.payment_method,
      is_billable: expense.is_billable,
      client_id: expense.client_id || '',
      tax_amount: (expense.tax_amount && expense.tax_amount > 0) ? String(expense.tax_amount) : ''
    });
    setEditingId(expense.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setIdToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;
    try {
      const clientToUse = serviceSupabase || supabase;
      const { error } = await clientToUse
        .from('expenses')
        .delete()
        .eq('id', idToDelete);

      if (error) throw error;

      setShowDeleteConfirm(false);
      setSuccessInfo({
        title: 'Expense Deleted',
        message: 'The expense record has been permanently removed.'
      });
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete expense."
      });
    } finally {
      setIdToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      amount: '',
      category: '',
      expense_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      is_billable: false,
      client_id: '',
      tax_amount: ''
    });
    setEditingId(null);
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getBillableExpenses = () => {
    return expenses.filter(exp => exp.is_billable).reduce((sum, expense) => sum + expense.amount, 0);
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
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Expenses</h1>
            <StaffHeaderBadge />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">Track and manage business expenses</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="lg" onClick={resetForm} className="w-full sm:w-auto h-11 shadow-sm hover:shadow-md transition-all active:scale-95">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background max-h-[90vh] flex flex-col">
            <DialogHeader className="p-4 md:p-8 pb-4 shrink-0">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Receipt className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                {editingId ? 'Edit Expense Record' : 'Record New Expense'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                {editingId ? 'Modify the details of this expense below.' : 'Log a new business expense into your financial records.'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
              <DialogDescription className="sr-only">
                Form to record or update expense details.
              </DialogDescription>
              <form id="expense-modal-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">Title <span className="text-rose-500">*</span></Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="e.g. Office Supplies"
                      className="h-11 border-border/60 focus:ring-primary font-medium bg-muted/20 rounded-lg"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">Category <span className="text-rose-500">*</span></Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger id="category" className="h-11 border-border/60 focus:ring-primary font-medium bg-muted/20 rounded-lg">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg shadow-xl">
                          {categories.map((category) => (
                            <SelectItem key={category} value={category} className="cursor-pointer py-2">
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense_date" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">Date <span className="text-rose-500">*</span></Label>
                      <Input
                        id="expense_date"
                        type="date"
                        value={formData.expense_date}
                        onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                        required
                        className="h-11 border-border/60 font-medium bg-muted/20 rounded-lg focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">Amount ({currencySymbol}) <span className="text-rose-500">*</span></Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                        min="0.01"
                        className="h-11 border-border/60 font-bold text-base bg-muted/20 rounded-lg focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax_amount" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tax ({currencySymbol})</Label>
                      <Input
                        id="tax_amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.tax_amount}
                        onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                        className="h-11 border-border/60 font-medium bg-muted/20 rounded-lg focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="payment_method" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Payment Method</Label>
                      <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                        <SelectTrigger className="h-11 border-border/60 font-medium bg-muted/20 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg shadow-xl">
                          <SelectItem value="cash" className="cursor-pointer py-2">Cash</SelectItem>
                          <SelectItem value="bank_transfer" className="cursor-pointer py-2">Bank Transfer</SelectItem>
                          <SelectItem value="credit_card" className="cursor-pointer py-2">Credit Card</SelectItem>
                          <SelectItem value="debit_card" className="cursor-pointer py-2">Debit Card</SelectItem>
                          <SelectItem value="upi" className="cursor-pointer py-2">UPI</SelectItem>
                          <SelectItem value="cheque" className="cursor-pointer py-2">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <Checkbox
                        id="is_billable"
                        className="w-5 h-5"
                        checked={formData.is_billable}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_billable: checked as boolean })}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="is_billable" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Billable To Client</Label>
                      </div>
                    </div>
                  </div>

                  {formData.is_billable && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="client_id" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">Select Client <span className="text-rose-500">*</span></Label>
                      <Select 
                        value={formData.client_id} 
                        onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                      >
                        <SelectTrigger id="client_id" className="h-11 border-border/60 focus:ring-primary font-medium bg-muted/20 rounded-lg">
                          <SelectValue placeholder="Which client is this for?" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg shadow-xl">
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id} className="cursor-pointer py-2">
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description / Notes</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Additional details..."
                      className="min-h-[80px] border-border/60 font-medium bg-muted/20 rounded-lg p-3 resize-none focus:ring-primary"
                    />
                  </div>
                </div>
              </form>
            </div>


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
                form="expense-modal-form"
                className="flex-1 h-11 font-black rounded-xl shadow-lg shadow-primary/20 bg-primary hover:opacity-90 text-primary-foreground uppercase tracking-widest transition-all active:scale-[0.98]"
              >
                {editingId ? 'Update' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmDelete}
        title="Delete Expense Record?"
        description="Are you sure you want to remove this expense? This action will permanently affect your financial reporting for this month."
      />

      <SuccessModal
        isOpen={showSuccess}
        onOpenChange={setShowSuccess}
        title={successInfo.title}
        message={successInfo.message}
      />

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-6">
        <Card className="p-3 sm:p-4 md:p-5 bg-card dark:bg-card border border-border/70 dark:border-border/60 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/80 leading-tight truncate flex-1" title="Total Expenses">
              Total Expenses
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-auto py-0.5 w-full overflow-hidden">
            <p className="text-base sm:text-xl lg:text-2xl font-black text-foreground tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
              {formatAmount(getTotalExpenses())}
            </p>
          </div>
          <p className="text-[10px] font-semibold text-emerald-600/90 dark:text-emerald-400/90 mt-1.5 pt-1.5 border-t border-border/40 truncate">
            Verified Outflow
          </p>
        </Card>

        <Card className="p-3 sm:p-4 md:p-5 bg-card dark:bg-card border border-border/70 dark:border-border/60 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/80 leading-tight truncate flex-1" title="Billable">
              Billable
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-auto py-0.5 w-full overflow-hidden">
            <p className="text-base sm:text-xl lg:text-2xl font-black text-foreground tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
              {formatAmount(getBillableExpenses())}
            </p>
          </div>
          <p className="text-[10px] font-semibold text-blue-600/90 dark:text-blue-400/90 mt-1.5 pt-1.5 border-t border-border/40 truncate">
            Recoverable Costs
          </p>
        </Card>

        <Card className="p-3 sm:p-4 md:p-5 bg-card dark:bg-card border border-border/70 dark:border-border/60 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/80 leading-tight truncate flex-1" title="Total Records">
              Total Records
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-auto py-0.5 w-full overflow-hidden">
            <p className="text-base sm:text-xl lg:text-2xl font-black text-foreground tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
              {expenses.length.toLocaleString('en-IN')}
            </p>
          </div>
          <p className="text-[10px] font-semibold text-amber-600/90 dark:text-amber-400/90 mt-1.5 pt-1.5 border-t border-border/40 truncate">
            Logged Entries
          </p>
        </Card>

        <Card className="p-3 sm:p-4 md:p-5 bg-card dark:bg-card border border-border/70 dark:border-border/60 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/80 leading-tight truncate flex-1" title="This Month">
              This Month
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-auto py-0.5 w-full overflow-hidden">
            <p className="text-base sm:text-xl lg:text-2xl font-black text-foreground tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
              {expenses.filter(exp =>
                new Date(exp.expense_date).getMonth() === new Date().getMonth() &&
                new Date(exp.expense_date).getFullYear() === new Date().getFullYear()
              ).length.toLocaleString('en-IN')}
            </p>
          </div>
          <p className="text-[10px] font-semibold text-indigo-600/90 dark:text-indigo-400/90 mt-1.5 pt-1.5 border-t border-border/40 truncate">
            Current Period
          </p>
        </Card>
      </div>

      {expenses.length === 0 ? (
        <Card className="p-6 md:p-12 text-center bg-card border border-border rounded-xl shadow-sm">
          <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-bold text-foreground mb-2">No Expenses Found</h3>
          <p className="text-muted-foreground mb-6 max-w-xs mx-auto text-sm">
            Start tracking your business spending by logging your first expense.
          </p>
          <Button variant="default" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Log Your First Expense
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Search Input */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search expenses..."
              className="pl-10 h-11 rounded-xl bg-background border-border/50 focus:border-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Desktop Table View */}
            <Card className="hidden md:block overflow-hidden bg-card border border-border rounded-xl shadow-sm p-0">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-border/20">
                    <tr>
                      <th className="px-6 py-5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Date</th>
                      <th className="px-6 py-5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Title</th>
                      <th className="px-6 py-5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Category</th>
                      <th className="px-6 py-5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Amount</th>
                      <th className="px-6 py-5 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all duration-300">
                        <td className="px-6 py-5">
                          <div className="text-xs font-bold text-muted-foreground">
                            {safelyToLocaleDate(expense.expense_date)}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-bold text-foreground tracking-tight">{expense.title}</div>
                          {expense.description && (
                            <div className="text-[10px] text-slate-500 font-bold mt-0.5 line-clamp-1 opacity-70 italic">{expense.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <Badge variant="outline" className="text-[9px] font-bold uppercase bg-muted text-muted-foreground border-border rounded-md px-2 py-0.5">
                            {expense.category}
                          </Badge>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="text-sm font-bold text-foreground">{formatAmount(expense.amount)}</div>
                          {expense.tax_amount > 0 && (
                            <div className="text-[10px] text-red-500 font-bold tracking-tighter italic">Tax Inclusive: {formatAmount(expense.tax_amount)}</div>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              onClick={() => handleEdit(expense)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                              onClick={() => handleDelete(expense.id)}
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

            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-4">
              {expenses.map((expense) => (
                <Card
                  key={expense.id}
                  className="bg-card border border-border rounded-lg shadow-sm p-4 relative"
                >

                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {safelyToLocaleDate(expense.expense_date)}
                      </div>
                      <h3 className="text-xl font-bold text-foreground tracking-tight leading-tight truncate pr-4">{expense.title}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-bold text-foreground">{formatAmount(expense.amount)}</div>
                      <Badge variant="secondary" className="mt-1 text-[9px] font-bold uppercase bg-muted text-muted-foreground border-none">
                        {expense.category}
                      </Badge>
                    </div>
                  </div>

                  {expense.description && (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50 mb-4 line-clamp-2 italic leading-relaxed">
                      {expense.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between border-t border-border/10 pt-4 relative z-10">
                    <div className="flex flex-col gap-1">
                      {expense.is_billable && (
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span className="text-[10px] font-bold text-emerald-600 tracking-wider">BILLABLE</span>
                        </div>
                      )}
                      {expense.payment_method && (
                        <div className="flex items-center gap-1.5 opacity-80">
                          <Wallet className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{expense.payment_method.replace('_', ' ')}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        onClick={() => handleEdit(expense)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="mt-8">
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={expensesData?.totalCount || 0}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          entityName="expenses"
          isLoading={loading}
        />
      </div>
    </div>
  );
};

export default ExpensesPage;
