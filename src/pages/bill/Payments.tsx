import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
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
import {
  Plus,
  Edit,
  Trash2,
  CreditCard,
  Receipt,
  Search,
  X,
  CheckCircle2,
  Banknote,
  Smartphone,
  ChevronDown,
  AlertCircle,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingCart,
  Building2,
  Landmark,
  Wallet,
  Filter,
  FileCheck,
  Clock
} from "lucide-react";
import { supabase, serviceSupabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePayments, usePendingPaymentInvoices, PendingInvoiceItem } from "@/hooks/usePayments";
import { Payment } from "@/types/invoice";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { SuccessModal } from '@/components/SuccessModal';
import { DeleteConfirmation } from '@/components/DeleteConfirmation';
import { StaffHeaderBadge } from "@/components/StaffHeaderBadge";
import { cn } from "@/lib/utils";
import { RecordSalesPaymentModal, PaymentFormData } from "@/components/payments/RecordSalesPaymentModal";
import { RecordPurchasePaymentModal } from "@/components/payments/RecordPurchasePaymentModal";
import { DataTablePagination } from "@/components/DataTablePagination";
import { useCurrency } from "@/contexts/CurrencyContext";

const PaymentsPage = () => {
  const { currencySymbol, formatAmount } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Route & Tab state: Sales vs Purchase payments
  const isPurchasePath = location.pathname.includes('purchase-payments') || searchParams.get('type') === 'purchase';
  const activeTab: 'sales' | 'purchase' = isPurchasePath ? 'purchase' : 'sales';

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const initialSearch = searchParams.get('search') || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: paymentsData, isLoading: loading, isFetching: searchLoading } = usePayments({
    page: currentPage,
    pageSize,
    searchTerm: debouncedSearch,
    methodFilter,
    dateFilter,
    startDate,
    endDate,
    typeFilter: activeTab
  });

  const { data: invoicesData = [] } = usePendingPaymentInvoices();
  const invoices = invoicesData as unknown as PendingInvoiceItem[];

  const payments = paymentsData?.payments || [];
  const totalPages = paymentsData ? Math.max(1, Math.ceil(paymentsData.totalCount / pageSize)) : 1;
  const queryClient = useQueryClient();

  // Separate, dedicated modal states for Sales and Purchase
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [editingSalesData, setEditingSalesData] = useState<{
    id?: string;
    invoice_id: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference_number: string;
    notes: string;
    invoice_number?: string;
    party_name?: string;
  } | null>(null);
  const [editingPurchaseData, setEditingPurchaseData] = useState<{
    id?: string;
    invoice_id: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference_number: string;
    notes: string;
    invoice_number?: string;
    party_name?: string;
  } | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  // Custom Modal States
  const [showSuccess, setShowSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: '', message: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { user, effectiveUserId, isStaff, companyProfile, profile, staffName, ownerName } = useAuth();
  const targetUserId = effectiveUserId || user?.id;
  const { toast } = useToast();

  const handleTabChange = (tab: 'sales' | 'purchase') => {
    if (tab === 'purchase') {
      navigate('/purchase-payments');
    } else {
      navigate('/payments');
    }
  };

  const getCreatorTag = (notesText?: string | null) => {
    if (notesText && notesText.includes('Created by:')) {
      const match = notesText.match(/Created by: [^•\n]+/);
      const extracted = match ? match[0] : notesText;
      const n = extracted.replace('Created by:', '').trim();
      if (n && n.toLowerCase() !== 'company' && n.toLowerCase() !== 'company owner') {
        return `Created by: ${n}`;
      }
    }
    const fallback = ownerName || profile?.company_name || companyProfile?.company_name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Owner';
    return `Created by: ${fallback}`;
  };

  const dateFilterLabel = useMemo(() => {
    switch (dateFilter) {
      case 'today': return 'Today';
      case 'this_week': return 'This Week';
      case 'this_month': return 'This Month';
      case 'last_month': return 'Last Month';
      case 'custom': return startDate && endDate ? `${startDate} to ${endDate}` : 'Custom Period';
      default: return 'All Time';
    }
  }, [dateFilter, startDate, endDate]);

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'upi': return 'UPI / GPay';
      case 'bank_transfer': return 'Bank Transfer';
      case 'cheque': return 'Cheque';
      case 'credit_card': return 'Credit Card';
      case 'debit_card': return 'Debit Card';
      case 'pending': return 'Pending Mode';
      case 'other': return 'Other';
      default: return method;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, debouncedSearch, methodFilter, dateFilter, startDate, endDate]);

  const handleOpenSalesModal = (payment?: Payment) => {
    if (payment) {
      const p = payment as unknown as { display_number?: string; party_name?: string };
      const displayNumber = p.display_number || payment.invoices?.invoice_number || '';
      const partyName = p.party_name || payment.invoices?.clients?.name || '';
      const rawDate = String(payment.payment_date || '');
      const cleanDate = rawDate
        ? (rawDate.includes('T') ? rawDate.split('T')[0] : rawDate.split(' ')[0])
        : new Date().toISOString().split('T')[0];

      setEditingSalesData({
        id: payment.id,
        invoice_id: payment.invoice_id || '',
        invoice_number: displayNumber,
        party_name: partyName,
        amount: Number(payment.amount || 0),
        payment_date: cleanDate,
        payment_method: payment.payment_method || 'cash',
        reference_number: payment.reference_number || '',
        notes: payment.notes || ''
      });
    } else {
      setEditingSalesData(null);
    }
    setSalesModalOpen(true);
  };

  const handleOpenPurchaseModal = (payment?: Payment) => {
    if (payment) {
      const p = payment as unknown as { display_number?: string; party_name?: string };
      const displayNumber = p.display_number || payment.invoices?.invoice_number || '';
      const partyName = p.party_name || payment.invoices?.clients?.name || '';
      const rawDate = String(payment.payment_date || '');
      const cleanDate = rawDate
        ? (rawDate.includes('T') ? rawDate.split('T')[0] : rawDate.split(' ')[0])
        : new Date().toISOString().split('T')[0];

      setEditingPurchaseData({
        id: payment.id,
        invoice_id: payment.purchase_invoice_id || payment.invoice_id || '',
        invoice_number: displayNumber,
        party_name: partyName,
        amount: Number(payment.amount || 0),
        payment_date: cleanDate,
        payment_method: payment.payment_method || 'cash',
        reference_number: payment.reference_number || '',
        notes: payment.notes || ''
      });
    } else {
      setEditingPurchaseData(null);
    }
    setPurchaseModalOpen(true);
  };

  const handleSaveSalesPayment = async (data: PaymentFormData, editingId: string | null) => {
    try {
      const clientToUse = serviceSupabase || supabase;

      if (editingId) {
        const rawDate = String(data.payment_date || '');
        const cleanDate = rawDate
          ? (rawDate.includes('T') ? rawDate.split('T')[0] : rawDate.split(' ')[0])
          : new Date().toISOString().split('T')[0];

        const updatePayload: Record<string, unknown> = {
          amount: Number(data.amount) || 0,
          payment_date: cleanDate,
          payment_method: data.payment_method || 'cash',
          reference_number: data.reference_number || '',
          notes: data.notes || '',
        };

        if (data.invoice_id && data.invoice_id.trim() !== '') {
          updatePayload.invoice_id = data.invoice_id;
        }

        const { error } = await clientToUse
          .from('payments')
          .update(updatePayload)
          .eq('id', editingId);

        if (error) throw error;
        setSuccessInfo({
          title: "Sales Payment Updated",
          message: "The customer payment record has been successfully modified."
        });
        setShowSuccess(true);
      } else {
        const creatorName = isStaff
          ? (staffName || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Staff Member')
          : (companyProfile?.company_name || 'Company Owner');
        
        const selectedInvoice = invoices.find(inv => inv.id === data.invoice_id);
        const invNumber = selectedInvoice?.invoice_number || '';
        const baseNote = data.notes || `Sales Invoice #${invNumber} payment`;
        const paymentNotes = `${baseNote} • Created by: ${creatorName}`;

        const insertPayload = {
          amount: data.amount,
          payment_date: data.payment_date,
          payment_method: data.payment_method,
          reference_number: data.reference_number,
          notes: paymentNotes,
          user_id: targetUserId,
          invoice_id: data.invoice_id,
          purchase_invoice_id: null,
        };

        const { error } = await clientToUse
          .from('payments')
          .insert([insertPayload]);

        if (error) throw error;

        // Update sales invoice status to paid if not already paid
        if (selectedInvoice && selectedInvoice.status !== 'paid') {
          await clientToUse
            .from('invoices')
            .update({ status: 'paid' })
            .eq('id', data.invoice_id);
        }

        setSuccessInfo({
          title: "Sales Payment Recorded",
          message: `Payment from customer has been recorded for Invoice #${invNumber}.`
        });
        setShowSuccess(true);
      }

      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'pending-for-payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSalesModalOpen(false);
    } catch (error: unknown) {
      console.error('Error saving sales payment:', error);
      const err = error as { message?: string };
      const errorMessage = err?.message || "An unexpected error occurred.";

      toast({
        variant: "destructive",
        title: "Save Failed",
        description: errorMessage
      });
      throw error;
    }
  };

  const handleSavePurchasePayment = async (data: PaymentFormData, editingId: string | null) => {
    try {
      const clientToUse = serviceSupabase || supabase;

      if (editingId) {
        const rawDate = String(data.payment_date || '');
        const cleanDate = rawDate
          ? (rawDate.includes('T') ? rawDate.split('T')[0] : rawDate.split(' ')[0])
          : new Date().toISOString().split('T')[0];

        const updatePayload: Record<string, unknown> = {
          amount: Number(data.amount) || 0,
          payment_date: cleanDate,
          payment_method: data.payment_method || 'cash',
          reference_number: data.reference_number || '',
          notes: data.notes || '',
        };

        if (data.invoice_id && data.invoice_id.trim() !== '') {
          updatePayload.purchase_invoice_id = data.invoice_id;
        }

        const { error } = await clientToUse
          .from('payments')
          .update(updatePayload)
          .eq('id', editingId);

        if (error) throw error;
        setSuccessInfo({
          title: "Purchase Payment Updated",
          message: "The vendor payment record has been successfully modified."
        });
        setShowSuccess(true);
      } else {
        const creatorName = isStaff
          ? (staffName || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Staff Member')
          : (companyProfile?.company_name || 'Company Owner');
        
        const selectedInvoice = invoices.find(inv => inv.id === data.invoice_id);
        const invNumber = selectedInvoice?.invoice_number || '';
        const baseNote = data.notes || `Purchase Bill #${invNumber} payment`;
        const paymentNotes = `${baseNote} • Created by: ${creatorName}`;

        const insertPayload = {
          amount: data.amount,
          payment_date: data.payment_date,
          payment_method: data.payment_method,
          reference_number: data.reference_number,
          notes: paymentNotes,
          user_id: targetUserId,
          invoice_id: null,
          purchase_invoice_id: data.invoice_id,
        };

        const { error } = await clientToUse
          .from('payments')
          .insert([insertPayload]);

        if (error) throw error;

        // Update purchase bill status to paid if not already paid
        if (selectedInvoice && selectedInvoice.status !== 'paid') {
          await clientToUse
            .from('purchase_invoices')
            .update({ status: 'paid' })
            .eq('id', data.invoice_id);
        }

        setSuccessInfo({
          title: "Purchase Payment Recorded",
          message: `Payment to vendor has been recorded for Bill #${invNumber}.`
        });
        setShowSuccess(true);
      }

      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'pending-for-payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setPurchaseModalOpen(false);
    } catch (error: unknown) {
      console.error('Error saving purchase payment:', error);
      const err = error as { message?: string };
      const errorMessage = err?.message || "An unexpected error occurred.";

      toast({
        variant: "destructive",
        title: "Save Failed",
        description: errorMessage
      });
      throw error;
    }
  };

  const handleEdit = (payment: Payment) => {
    const isPurchase = payment.invoice_type === 'purchase' || !!payment.purchase_invoice_id;
    if (isPurchase) {
      handleOpenPurchaseModal(payment);
    } else {
      handleOpenSalesModal(payment);
    }
  };

  const handleDelete = (id: string) => {
    setPaymentToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;
    try {
      const clientToUse = serviceSupabase || supabase;

      // 1. Fetch payment details before deletion to find associated invoice or purchase bill
      const { data: rawPaymentRecord } = await clientToUse
        .from('payments')
        .select('id, invoice_id, purchase_invoice_id, amount')
        .eq('id', paymentToDelete)
        .maybeSingle();

      const paymentRecord = rawPaymentRecord as unknown as {
        id: string;
        invoice_id?: string | null;
        purchase_invoice_id?: string | null;
        amount?: number | null;
      } | null;

      const localPayment = payments.find(p => p.id === paymentToDelete);
      const targetInvoiceId = paymentRecord?.invoice_id || localPayment?.invoice_id;
      const targetPurchaseId = paymentRecord?.purchase_invoice_id || localPayment?.purchase_invoice_id;

      // 2. Delete the payment
      const { error } = await clientToUse
        .from('payments')
        .delete()
        .eq('id', paymentToDelete);

      if (error) throw error;

      // 3. Revert sales invoice status to 'pending' if no full payment remains
      if (targetInvoiceId) {
        // First: check remaining payments for this invoice (after deletion)
        const { data: rawRemaining } = await clientToUse
          .from('payments')
          .select('amount')
          .eq('invoice_id', targetInvoiceId);

        const remainingTotal = ((rawRemaining as unknown as { amount: number }[]) || [])
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        // Fetch invoice to compare totals and current status
        const { data: rawInv } = await clientToUse
          .from('invoices')
          .select('id, total_amount, status')
          .eq('id', targetInvoiceId)
          .maybeSingle();

        const invRecord = rawInv as unknown as { id: string; total_amount: number; status: string } | null;

        if (invRecord) {
          // Revert if remaining payments don't fully cover the invoice amount
          const invoiceTotal = Number(invRecord.total_amount ?? 0);
          if (remainingTotal < invoiceTotal || remainingTotal === 0) {
            await clientToUse
              .from('invoices')
              .update({ status: 'sent' })
              .eq('id', targetInvoiceId);
          }
        } else {
          // Invoice not found via primary client — try anon supabase as fallback
          const { data: rawFallbackInv } = await supabase
            .from('invoices')
            .select('id, total_amount, status')
            .eq('id', targetInvoiceId)
            .maybeSingle();

          const fallbackInv = rawFallbackInv as unknown as { id: string; total_amount: number; status: string } | null;

          if (fallbackInv) {
            const invoiceTotal = Number(fallbackInv.total_amount ?? 0);
            if (remainingTotal < invoiceTotal || remainingTotal === 0) {
              await supabase
                .from('invoices')
                .update({ status: 'sent' })
                .eq('id', targetInvoiceId);
            }
          } else {
            // Check if targetInvoiceId belongs to a purchase bill (legacy fallback)
            const { data: rawPinv } = await clientToUse
              .from('purchase_invoices')
              .select('id, total_amount')
              .eq('id', targetInvoiceId)
              .maybeSingle();

            const pinvRecord = rawPinv as unknown as { id: string; total_amount: number } | null;

            if (pinvRecord) {
              const { data: rawPRemaining } = await clientToUse
                .from('payments')
                .select('amount')
                .or(`purchase_invoice_id.eq.${targetInvoiceId},invoice_id.eq.${targetInvoiceId}`);

              const purchaseTotal = ((rawPRemaining as unknown as { amount: number }[]) || [])
                .reduce((sum, p) => sum + Number(p.amount || 0), 0);

              if (purchaseTotal < Number(pinvRecord.total_amount ?? 0) || purchaseTotal === 0) {
                await clientToUse
                  .from('purchase_invoices')
                  .update({ status: 'pending' })
                  .eq('id', targetInvoiceId);
              }
            }
          }
        }
      }

      // 4. Revert purchase bill status to 'pending' if no full payment remains
      if (targetPurchaseId) {
        const { data: rawPinv } = await clientToUse
          .from('purchase_invoices')
          .select('id, total_amount')
          .eq('id', targetPurchaseId)
          .maybeSingle();

        const pinvRecord = rawPinv as unknown as { id: string; total_amount: number } | null;

        if (pinvRecord) {
          const { data: rawRemainingPurchase } = await clientToUse
            .from('payments')
            .select('id, amount')
            .or(`purchase_invoice_id.eq.${targetPurchaseId},invoice_id.eq.${targetPurchaseId}`);

          const remainingPurchasePayments = (rawRemainingPurchase as unknown as { id: string; amount: number }[]) || [];
          const totalPaid = remainingPurchasePayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

          if (totalPaid < Number(pinvRecord.total_amount || 0)) {
            await clientToUse
              .from('purchase_invoices')
              .update({ status: 'pending' })
              .eq('id', targetPurchaseId);
          }
        }
      }

      setSuccessInfo({
        title: "Payment Deleted",
        message: "The payment record has been removed. The invoice status has been reverted to 'Sent' and 'Mark as Paid' is now available again."
      });
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'pending-for-payments'] });
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
      const clientToUse = serviceSupabase || supabase;
      const { error } = await clientToUse
        .from('payments')
        .update({ payment_method: newMethod })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Payment Method Updated",
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


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Segmented Navigation Tabs: Sales vs Purchase Payments */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <button
          onClick={() => handleTabChange('sales')}
          className={cn(
            "flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all",
            activeTab === 'sales'
              ? "bg-emerald-50 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Sales Payments (Received)</span>
          <span className={cn(
            "text-[10px] font-black px-2 py-0.5 rounded-full",
            activeTab === 'sales'
              ? "bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200"
              : "bg-muted text-muted-foreground"
          )}>
            {(paymentsData?.stats?.salesRecords ?? 0).toLocaleString('en-IN')}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('purchase')}
          className={cn(
            "flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all",
            activeTab === 'purchase'
              ? "bg-purple-50 text-purple-900 border border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-700 shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <ArrowUpRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Purchase Payments (Paid)</span>
          <span className={cn(
            "text-[10px] font-black px-2 py-0.5 rounded-full",
            activeTab === 'purchase'
              ? "bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200"
              : "bg-muted text-muted-foreground"
          )}>
            {(paymentsData?.stats?.purchaseRecords ?? 0).toLocaleString('en-IN')}
          </span>
        </button>
      </div>

      {/* Header and Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {activeTab === 'sales' ? 'Sales Payments' : 'Purchase Payments'}
            </h1>
            <StaffHeaderBadge />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {activeTab === 'sales'
              ? 'Track customer payment receipts and sales invoice settlements'
              : 'Track vendor payment outflow and purchase bill settlements'}
          </p>
        </div>

        {activeTab === 'sales' ? (
          <Button
            variant="default"
            size="lg"
            className="w-full sm:w-auto h-11 shadow-sm hover:shadow-md transition-all active:scale-95 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            onClick={() => handleOpenSalesModal()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Record Sales Payment
          </Button>
        ) : (
          <Button
            variant="default"
            size="lg"
            className="w-full sm:w-auto h-11 shadow-sm hover:shadow-md transition-all active:scale-95 bg-purple-600 hover:bg-purple-700 text-white font-bold"
            onClick={() => handleOpenPurchaseModal()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Record Purchase Payment
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'sales'
                ? "Search sales payments by invoice #, client, reference..."
                : "Search purchase payments by bill #, vendor, reference..."}
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
                className="text-xs h-8 text-muted-foreground hover:text-foreground"
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

      {/* Summary Stats Cards Tailored to Sales vs Purchase & Synchronized with Active Filters */}
      {(() => {
        const stats = paymentsData?.stats as any;
        const isSales = activeTab === 'sales';

        const totalAmount = isSales ? (stats?.salesTotal ?? 0) : (stats?.purchaseTotal ?? 0);
        const totalCount = isSales ? (stats?.salesRecords ?? 0) : (stats?.purchaseRecords ?? 0);
        const pendingCount = isSales ? (stats?.pendingSalesCount ?? 0) : (stats?.pendingPurchaseCount ?? 0);

        const cashAmount = isSales ? (stats?.salesCash ?? 0) : (stats?.purchaseCash ?? 0);
        const cashCount = isSales ? (stats?.salesCashCount ?? 0) : (stats?.purchaseCashCount ?? 0);

        const upiAmount = isSales ? (stats?.salesUpi ?? 0) : (stats?.purchaseUpi ?? 0);
        const upiCount = isSales ? (stats?.salesUpiCount ?? 0) : (stats?.purchaseUpiCount ?? 0);

        const bankAmount = isSales ? (stats?.salesBankTransfer ?? 0) : (stats?.purchaseBankTransfer ?? 0);
        const bankCount = isSales ? (stats?.salesBankTransferCount ?? 0) : (stats?.purchaseBankTransferCount ?? 0);

        const chequeAmount = isSales ? (stats?.salesCheque ?? 0) : (stats?.purchaseCheque ?? 0);
        const chequeCount = isSales ? (stats?.salesChequeCount ?? 0) : (stats?.purchaseChequeCount ?? 0);

        const cardAmount = isSales ? (stats?.salesCard ?? 0) : (stats?.purchaseCard ?? 0);
        const cardCount = isSales ? (stats?.salesCardCount ?? 0) : (stats?.purchaseCardCount ?? 0);

        const otherAmount = isSales ? (stats?.salesOther ?? 0) : (stats?.purchaseOther ?? 0);
        const otherCount = isSales ? (stats?.salesOtherCount ?? 0) : (stats?.purchaseOtherCount ?? 0);

        return (
          <div className="space-y-3.5">
            {/* Unified Stats Grid: When "all", shows original 5 cards (Total, Records, Settled, Cash, UPI). When filtered, shows only the selected method's stat card (4 cards total). */}
            <div className={cn(
              "grid gap-2.5 sm:gap-3",
              methodFilter === 'all'
                ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
                : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
            )}>
              {/* 1. Total Received / Total Paid */}
              <Card
                onClick={() => setMethodFilter('all')}
                className="p-3 sm:p-4 bg-card dark:bg-card border border-border/70 dark:border-border/60 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all cursor-pointer select-none hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/80 leading-tight truncate flex-1" title={isSales ? "Total Received" : "Total Paid"}>
                    {isSales ? "Total Received" : "Total Paid"}
                  </span>
                  <div className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-xl shrink-0 flex items-center justify-center",
                    isSales ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  )}>
                    {isSales ? <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </div>
                </div>
                <div className="my-auto py-0.5 w-full overflow-hidden">
                  <p className="text-base sm:text-xl lg:text-2xl font-black text-foreground tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
                    {formatAmount(Math.round(totalAmount), { decimals: 0 })}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[10px] font-semibold mt-1.5 pt-1.5 border-t border-border/40 gap-1 truncate">
                  <span className={cn(isSales ? "text-emerald-600/90 dark:text-emerald-400/90" : "text-purple-600/90 dark:text-purple-400/90", "truncate")}>
                    {isSales ? "Customer Collections" : "Vendor Outflow"}
                  </span>
                  <span className="text-muted-foreground/70 font-normal">({dateFilterLabel})</span>
                </div>
              </Card>

              {/* 2. Total Records */}
              <Card className="p-3 sm:p-4 bg-card dark:bg-card border border-border/70 dark:border-border/60 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/80 leading-tight truncate flex-1" title="Total Entries">
                    Total Records
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 flex items-center justify-center">
                    <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="my-auto py-0.5 w-full overflow-hidden">
                  <p className="text-base sm:text-xl lg:text-2xl font-black text-foreground tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
                    {totalCount.toLocaleString('en-IN')}
                  </p>
                </div>
                <p className="text-[10px] font-semibold text-blue-600/90 dark:text-blue-400/90 mt-1.5 pt-1.5 border-t border-border/40 truncate">
                  {isSales ? "Receipt Entries" : "Payment Entries"}
                </p>
              </Card>

              {/* 3. Pending Invoices / Pending Bills */}
              <Card 
                onClick={() => navigate(isSales ? '/invoices?status=pending' : '/purchase-invoices?status=pending')}
                className="p-3 sm:p-4 bg-card dark:bg-card border border-border/70 dark:border-border/60 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all cursor-pointer select-none hover:border-amber-500/40 hover:bg-amber-50/10 dark:hover:bg-amber-950/10"
              >
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/80 leading-tight truncate flex-1" title={isSales ? "Pending Invoices" : "Pending Bills"}>
                    {isSales ? "Pending Invoices" : "Pending Bills"}
                  </span>
                  <div className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-xl shrink-0 flex items-center justify-center",
                    isSales ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  )}>
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="my-auto py-0.5 w-full overflow-hidden">
                  <p className="text-base sm:text-xl lg:text-2xl font-black text-foreground tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
                    {pendingCount.toLocaleString('en-IN')}
                  </p>
                </div>
                <p className={cn(
                  "text-[10px] font-semibold mt-1.5 pt-1.5 border-t border-border/40 truncate",
                  isSales ? "text-amber-600/90 dark:text-amber-400/90" : "text-orange-600/90 dark:text-orange-400/90"
                )}>
                  {isSales ? "Invoices Pending" : "Bills Pending"}
                </p>
              </Card>

              {/* 4 & 5. Payment Method Cards */}
              {methodFilter === 'all' ? (
                <>
                  {/* Default: 💵 Cash Card */}
                  <Card
                    onClick={() => setMethodFilter('cash')}
                    className="p-3 sm:p-4 bg-card dark:bg-card border border-emerald-500/20 dark:border-emerald-900/40 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20"
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 leading-tight truncate flex-1" title={isSales ? "Cash Received" : "Cash Disbursed"}>
                        {isSales ? "Cash Received" : "Cash Disbursed"}
                      </span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center justify-center">
                        <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    <div className="my-auto py-0.5 w-full overflow-hidden">
                      <p className="text-base sm:text-xl lg:text-2xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
                        {formatAmount(Math.round(cashAmount), { decimals: 0 })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-600/90 dark:text-emerald-400/90 mt-1.5 pt-1.5 border-t border-border/40 gap-1 truncate">
                      <span className="truncate">{cashCount} {isSales ? 'Inflow' : 'Disbursed'}</span>
                      <span className="text-[9px] text-muted-foreground/70 font-normal">Cash</span>
                    </div>
                  </Card>

                  {/* Default: 📱 UPI Card */}
                  <Card
                    onClick={() => setMethodFilter('upi')}
                    className="p-3 sm:p-4 bg-card dark:bg-card border border-violet-500/20 dark:border-violet-900/40 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all cursor-pointer hover:border-violet-500/50 hover:bg-violet-50/20 dark:hover:bg-violet-950/20"
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 leading-tight truncate flex-1" title={isSales ? "UPI Received" : "Digital Disbursed"}>
                        {isSales ? "UPI Received" : "Digital Disbursed"}
                      </span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0 flex items-center justify-center">
                        <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    <div className="my-auto py-0.5 w-full overflow-hidden">
                      <p className="text-base sm:text-xl lg:text-2xl font-black text-violet-700 dark:text-violet-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
                        {formatAmount(Math.round(upiAmount), { decimals: 0 })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-semibold text-violet-600/90 dark:text-violet-400/90 mt-1.5 pt-1.5 border-t border-border/40 gap-1 truncate">
                      <span className="truncate">{upiCount} Collections</span>
                      <span className="text-[9px] text-muted-foreground/70 font-normal">GPay / QR</span>
                    </div>
                  </Card>
                </>
              ) : methodFilter === 'cash' ? (
                /* Selected Filter: 💵 Cash */
                <Card
                  onClick={() => setMethodFilter('all')}
                  className="p-3 sm:p-4 bg-card dark:bg-card border border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all cursor-pointer select-none"
                  title="Click to clear filter"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 leading-tight truncate flex-1" title={isSales ? "Cash Received" : "Cash Paid"}>
                      💵 {isSales ? "Cash Received" : "Cash Paid"}
                    </span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center justify-center">
                      <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <div className="my-auto py-0.5 w-full overflow-hidden">
                    <p className="text-base sm:text-xl lg:text-2xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
                      {formatAmount(Math.round(cashAmount), { decimals: 0 })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-600/90 dark:text-emerald-400/90 mt-1.5 pt-1.5 border-t border-border/40 gap-1 truncate">
                    <span className="truncate">{cashCount} {isSales ? 'Cash Inflow' : 'Cash Outflow'}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-600/15 text-emerald-600 dark:text-emerald-400">Filtered</span>
                  </div>
                </Card>
              ) : methodFilter === 'upi' ? (
                /* Selected Filter: 📱 UPI */
                <Card
                  onClick={() => setMethodFilter('all')}
                  className="p-3 sm:p-4 bg-card dark:bg-card border border-violet-500 ring-2 ring-violet-500/25 bg-violet-50/70 dark:bg-violet-950/40 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all cursor-pointer select-none"
                  title="Click to clear filter"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 leading-tight truncate flex-1" title={isSales ? "UPI Received" : "UPI Paid"}>
                      📱 {isSales ? "UPI Received" : "UPI Paid"}
                    </span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-violet-500/20 text-violet-600 dark:text-violet-400 shrink-0 flex items-center justify-center">
                      <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <div className="my-auto py-0.5 w-full overflow-hidden">
                    <p className="text-base sm:text-xl lg:text-2xl font-black text-violet-700 dark:text-violet-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
                      {formatAmount(Math.round(upiAmount), { decimals: 0 })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-semibold text-violet-600/90 dark:text-violet-400/90 mt-1.5 pt-1.5 border-t border-border/40 gap-1 truncate">
                    <span className="truncate">{upiCount} Collections • QR & UPI</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-violet-600/15 text-violet-600 dark:text-violet-400">Filtered</span>
                  </div>
                </Card>
              ) : methodFilter === 'bank_transfer' ? (
                /* Selected Filter: 🏛️ Bank Transfer */
                <Card
                  onClick={() => setMethodFilter('all')}
                  className="p-3 sm:p-4 bg-card dark:bg-card border border-sky-500 ring-2 ring-sky-500/25 bg-sky-50/70 dark:bg-sky-950/40 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all cursor-pointer select-none"
                  title="Click to clear filter"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 leading-tight truncate flex-1" title={isSales ? "Bank Transfer Received" : "Bank Transfer Paid"}>
                      🏛️ {isSales ? "Bank Transfer Received" : "Bank Transfer Paid"}
                    </span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 shrink-0 flex items-center justify-center">
                      <Landmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <div className="my-auto py-0.5 w-full overflow-hidden">
                    <p className="text-base sm:text-xl lg:text-2xl font-black text-sky-700 dark:text-sky-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
                      {formatAmount(Math.round(bankAmount), { decimals: 0 })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-semibold text-sky-600/90 dark:text-sky-400/90 mt-1.5 pt-1.5 border-t border-border/40 gap-1 truncate">
                    <span className="truncate">{bankCount} Entries • NEFT / RTGS / IMPS</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-600/15 text-sky-600 dark:text-sky-400">Filtered</span>
                  </div>
                </Card>
              ) : methodFilter === 'cheque' ? (
                /* Selected Filter: 📑 Cheque */
                <Card
                  onClick={() => setMethodFilter('all')}
                  className="p-3 sm:p-4 bg-card dark:bg-card border border-amber-500 ring-2 ring-amber-500/25 bg-amber-50/70 dark:bg-amber-950/40 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all cursor-pointer select-none"
                  title="Click to clear filter"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 leading-tight truncate flex-1" title={isSales ? "Cheque Received" : "Cheque Paid"}>
                      📑 {isSales ? "Cheque Received" : "Cheque Paid"}
                    </span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 flex items-center justify-center">
                      <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <div className="my-auto py-0.5 w-full overflow-hidden">
                    <p className="text-base sm:text-xl lg:text-2xl font-black text-amber-700 dark:text-amber-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
                      {formatAmount(Math.round(chequeAmount), { decimals: 0 })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-semibold text-amber-600/90 dark:text-amber-400/90 mt-1.5 pt-1.5 border-t border-border/40 gap-1 truncate">
                    <span className="truncate">{chequeCount} Entries • Cheques & DD</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-600/15 text-amber-600 dark:text-amber-400">Filtered</span>
                  </div>
                </Card>
              ) : (methodFilter === 'credit_card' || methodFilter === 'debit_card' || methodFilter === 'card') ? (
                /* Selected Filter: 💳 Cards (Credit & Debit) */
                <Card
                  onClick={() => setMethodFilter('all')}
                  className="p-3 sm:p-4 bg-card dark:bg-card border border-rose-500 ring-2 ring-rose-500/25 bg-rose-50/70 dark:bg-rose-950/40 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all cursor-pointer select-none"
                  title="Click to clear filter"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 leading-tight truncate flex-1" title={isSales ? "Cards Received" : "Cards Paid"}>
                      💳 {isSales ? "Cards Received" : "Cards Paid"}
                    </span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0 flex items-center justify-center">
                      <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <div className="my-auto py-0.5 w-full overflow-hidden">
                    <p className="text-base sm:text-xl lg:text-2xl font-black text-rose-700 dark:text-rose-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
                      {formatAmount(Math.round(cardAmount), { decimals: 0 })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-semibold text-rose-600/90 dark:text-rose-400/90 mt-1.5 pt-1.5 border-t border-border/40 gap-1 truncate">
                    <span className="truncate">{cardCount} Entries • Credit & Debit</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-600/15 text-rose-600 dark:text-rose-400">Filtered</span>
                  </div>
                </Card>
              ) : (
                /* Selected Filter: ⚠️ Other / Pending */
                <Card
                  onClick={() => setMethodFilter('all')}
                  className="p-3 sm:p-4 bg-card dark:bg-card border border-slate-500 ring-2 ring-slate-500/25 bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all cursor-pointer select-none"
                  title="Click to clear filter"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 leading-tight truncate flex-1" title={isSales ? "Other / Pending Received" : "Other / Pending Paid"}>
                      ⚠️ {methodFilter === 'pending' ? 'Pending Mode' : 'Other Methods'}
                    </span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-500/20 text-slate-600 dark:text-slate-400 shrink-0 flex items-center justify-center">
                      <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <div className="my-auto py-0.5 w-full overflow-hidden">
                    <p className="text-base sm:text-xl lg:text-2xl font-black text-slate-700 dark:text-slate-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight">
                      {formatAmount(Math.round(otherAmount), { decimals: 0 })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600/90 dark:text-slate-400/90 mt-1.5 pt-1.5 border-t border-border/40 gap-1 truncate">
                    <span className="truncate">{otherCount} Entries • Unclassified Modes</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-600/15 text-slate-600 dark:text-slate-400">Filtered</span>
                  </div>
                </Card>
              )}
            </div>

            {/* Interactive Active Filter Summary Banner */}
            {methodFilter !== 'all' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-foreground animate-in fade-in duration-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary text-primary-foreground font-bold text-[11px]">
                    <Filter className="w-3 h-3" />
                    <span>Active Filter: {getMethodLabel(methodFilter)}</span>
                  </div>
                  <span className="text-muted-foreground">
                    Matching {isSales ? 'customer collections' : 'vendor disbursements'} for <strong>{dateFilterLabel}</strong>:
                  </span>
                  <span className="font-extrabold text-foreground text-sm">
                    {formatAmount(Math.round(isSales ? (stats?.selectedMethodSalesTotal ?? 0) : (stats?.selectedMethodPurchaseTotal ?? 0)), { decimals: 0 })}
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    ({isSales ? (stats?.selectedMethodSalesCount ?? 0) : (stats?.selectedMethodPurchaseCount ?? 0)} records found)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMethodFilter('all')}
                  className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-background/80 self-end sm:self-auto shrink-0"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Clear Filter
                </Button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Main Table or Empty State */}
      {payments.length === 0 ? (
        <Card className="p-6 md:p-12 text-center bg-card dark:bg-card border border-border/70 rounded-2xl shadow-sm">
          {activeTab === 'sales' ? (
            <CreditCard className="w-14 h-14 text-emerald-500/40 mx-auto mb-3" />
          ) : (
            <ShoppingCart className="w-14 h-14 text-purple-500/40 mx-auto mb-3" />
          )}
          <h3 className="text-lg font-bold text-foreground mb-1">
            {activeTab === 'sales' ? "No Sales Payments Found" : "No Purchase Payments Found"}
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm mb-5 max-w-md mx-auto">
            {activeTab === 'sales'
              ? "No customer payments recorded yet for sales invoices matching your criteria."
              : "No vendor payments recorded yet for purchase bills matching your criteria."}
          </p>
          <Button
            variant="default"
            onClick={() => {
              if (activeTab === 'sales') {
                handleOpenSalesModal();
              } else {
                handleOpenPurchaseModal();
              }
            }}
            className={cn(
              "font-bold text-xs h-10 px-5",
              activeTab === 'purchase' ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
          >
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'sales' ? "Record Sales Payment" : "Record Purchase Payment"}
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Mobile Card Layout (md:hidden) */}
          <div className="md:hidden space-y-3">
            {payments.map((payment) => {
              const invoiceType = (payment as unknown as { invoice_type?: string }).invoice_type;
              const partyName = (payment as unknown as { party_name?: string }).party_name || payment.invoices?.clients?.name || 'Unknown';
              const displayNumber = (payment as unknown as { display_number?: string }).display_number || payment.invoices?.invoice_number || 'N/A';

              return (
                <Card key={payment.id} className="p-4 bg-card dark:bg-card border border-border/80 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-foreground">{displayNumber}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[8px] px-1.5 py-0.5 font-semibold uppercase",
                            invoiceType === 'purchase'
                              ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                          )}
                        >
                          {invoiceType === 'purchase' ? 'Purchase' : 'Sales'}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold text-foreground mt-1">{partyName}</p>
                      <p className="text-xs text-muted-foreground">{safelyToLocaleDate(payment.payment_date)}</p>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-base font-black",
                        invoiceType === 'purchase' ? "text-purple-600 dark:text-purple-400" : "text-emerald-600 dark:text-emerald-400"
                      )}>
                        {formatAmount(Math.round(Number(payment.amount || 0)), { decimals: 0 })}
                      </div>
                      {payment.reference_number && (
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Ref: {payment.reference_number}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <div className="flex items-center gap-1.5">
                      {payment.payment_method === 'pending' || !payment.payment_method ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase border border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            >
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>Select Method</span>
                              <ChevronDown className="w-3 h-3 opacity-70 ml-0.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48 p-1.5 rounded-2xl shadow-xl border border-border/80 z-50">
                            <DropdownMenuItem onClick={() => handleUpdatePaymentMethod(payment.id, 'cash')}>
                              <Banknote className="w-4 h-4 mr-2 text-emerald-600" /> Cash
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdatePaymentMethod(payment.id, 'upi')}>
                              <Smartphone className="w-4 h-4 mr-2 text-violet-600" /> UPI / Online
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdatePaymentMethod(payment.id, 'bank_transfer')}>
                              <CreditCard className="w-4 h-4 mr-2 text-blue-600" /> Bank Transfer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdatePaymentMethod(payment.id, 'cheque')}>
                              <FileText className="w-4 h-4 mr-2 text-amber-600" /> Cheque
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdatePaymentMethod(payment.id, 'credit_card')}>
                              <CreditCard className="w-4 h-4 mr-2 text-rose-600" /> Credit Card
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdatePaymentMethod(payment.id, 'debit_card')}>
                              <CreditCard className="w-4 h-4 mr-2 text-indigo-600" /> Debit Card
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase font-bold px-2 py-0.5",
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
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(payment)}
                        className="h-8 px-2.5 text-xs font-semibold"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(payment.id)}
                        className="h-8 px-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Desktop Table View (hidden md:block) */}
          <Card className="hidden md:block overflow-hidden bg-card dark:bg-card border border-border/80 rounded-2xl shadow-sm">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {activeTab === 'sales' ? 'Sales Invoice #' : 'Purchase Bill #'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {activeTab === 'sales' ? 'Customer Name' : 'Vendor Name'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {activeTab === 'sales' ? 'Amount Received' : 'Amount Paid'}
                  </th>
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
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
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
                        <div className={cn(
                          "text-sm font-bold",
                          invoiceType === 'purchase' ? "text-purple-600 dark:text-purple-400" : "text-emerald-600 dark:text-emerald-400"
                        )}>
                          {formatAmount(Math.round(Number(payment.amount || 0)), { decimals: 0 })}
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
                            className="h-8 w-8 p-0"
                            title="Edit Payment"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(payment.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
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
      </div>
    )}

      {/* Pagination Controls */}
      <DataTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={paymentsData?.totalCount || 0}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        entityName={activeTab === 'sales' ? 'sales payments' : 'purchase payments'}
        isLoading={loading}
      />

      <SuccessModal
        isOpen={showSuccess}
        onOpenChange={setShowSuccess}
        title={successInfo.title}
        message={successInfo.message}
      />

      <RecordSalesPaymentModal
        open={salesModalOpen}
        onOpenChange={setSalesModalOpen}
        invoices={invoices}
        onSubmit={handleSaveSalesPayment}
        initialData={editingSalesData}
      />

      <RecordPurchasePaymentModal
        open={purchaseModalOpen}
        onOpenChange={setPurchaseModalOpen}
        invoices={invoices}
        onSubmit={handleSavePurchasePayment}
        initialData={editingPurchaseData}
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
