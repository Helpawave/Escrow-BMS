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
  Clock,
  Car,
  Loader2
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
import { useUserType } from "@/hooks/useUserType";
import { PaymentActiveTab, DownpaymentSubTab, PaymentCategoryFilter } from './payments/types';
import {
  PaymentNavigation,
  PaymentSyncBanner,
  PaymentFilters,
  PaymentStatsGrid,
  PaymentCardItem,
  PaymentTable,
  VehicleLedgerView,
} from './payments/components';

const PaymentsPage = () => {
  const { isAutomobile } = useUserType();
  const { currencySymbol, formatAmount } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Route & Tab state: Sales vs Downpayment vs Purchase payments
  const isPurchasePath = location.pathname.includes('purchase-payments') || searchParams.get('type') === 'purchase';
  const isDownpaymentParam = searchParams.get('type') === 'downpayment' && isAutomobile;
  const [localTab, setLocalTab] = useState<'sales' | 'downpayment' | 'purchase'>(
    isPurchasePath ? 'purchase' : isDownpaymentParam ? 'downpayment' : 'sales'
  );
  const activeTab: 'sales' | 'downpayment' | 'purchase' = isPurchasePath ? 'purchase' : (localTab === 'downpayment' && !isAutomobile ? 'sales' : localTab);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const initialSearch = searchParams.get('search') || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [categoryFilter, setCategoryFilter] = useState<'all' | 'downpayment' | 'regular'>(
    isDownpaymentParam ? 'downpayment' : 'regular'
  );
  const [downpaymentSubTab, setDownpaymentSubTab] = useState<'all' | 'advance' | 'partial' | 'ledger'>('all');

  useEffect(() => {
    if (isPurchasePath) {
      setLocalTab('purchase');
    } else if (isDownpaymentParam && isAutomobile) {
      setLocalTab('downpayment');
      setCategoryFilter('downpayment');
    } else {
      setLocalTab('sales');
      setCategoryFilter('regular');
    }
  }, [isPurchasePath, isDownpaymentParam, isAutomobile]);

  const { data: paymentsData, isLoading: loading, isFetching: searchLoading } = usePayments({
    page: currentPage,
    pageSize,
    searchTerm: debouncedSearch,
    methodFilter,
    dateFilter,
    startDate,
    endDate,
    typeFilter: activeTab === 'purchase' ? 'purchase' : 'sales',
    categoryFilter: activeTab === 'downpayment' ? 'downpayment' : (activeTab === 'sales' ? 'regular' : categoryFilter)
  });

  const { data: invoicesData = [] } = usePendingPaymentInvoices();
  const invoices = invoicesData as unknown as PendingInvoiceItem[];

  const payments = paymentsData?.payments || [];
  const totalPages = paymentsData ? Math.max(1, Math.ceil(paymentsData.totalCount / pageSize)) : 1;
  const queryClient = useQueryClient();

  // Downpayment sub-tab filtering & calculations
  const downpaymentPayments = useMemo(() => {
    return payments.filter(p => Boolean(p.is_downpayment || p.display_number?.startsWith('DP-')));
  }, [payments]);

  const advancePaymentsCount = useMemo(() => {
    return downpaymentPayments.filter(p => p.downpayment_breakdown?.sequence === 1 || p.downpayment_type === 'downpayment').length;
  }, [downpaymentPayments]);

  const partialPaymentsCount = useMemo(() => {
    return downpaymentPayments.filter(p => (p.downpayment_breakdown?.sequence ?? 0) > 1 || p.downpayment_type === 'partial').length;
  }, [downpaymentPayments]);

  const displayedPayments = useMemo(() => {
    if (activeTab === 'downpayment') {
      if (downpaymentSubTab === 'advance') {
        return downpaymentPayments.filter(p => p.downpayment_breakdown?.sequence === 1 || p.downpayment_type === 'downpayment');
      }
      if (downpaymentSubTab === 'partial') {
        return downpaymentPayments.filter(p => (p.downpayment_breakdown?.sequence ?? 0) > 1 || p.downpayment_type === 'partial');
      }
      return downpaymentPayments;
    }
    if (activeTab === 'sales') {
      // Exclude downpayments strictly from sales view
      return payments.filter(p => !(p.is_downpayment || p.display_number?.startsWith('DP-')));
    }
    return payments;
  }, [activeTab, downpaymentSubTab, downpaymentPayments, payments]);

  // Vehicle Split Ledger items grouped by invoice
  const vehicleLedgerItems = useMemo(() => {
    const groupMap: Record<string, {
      invoiceId: string;
      invoiceNumber: string;
      partyName: string;
      totalAmount: number;
      status: string;
      notes?: string;
      payments: Payment[];
    }> = {};

    invoices.forEach(inv => {
      const isDP = Boolean(inv.is_downpayment || inv.invoice_number?.startsWith('DP-'));
      if (isDP) {
        groupMap[inv.id] = {
          invoiceId: inv.id,
          invoiceNumber: inv.invoice_number,
          partyName: inv.party_name || inv.clients?.name || 'Customer',
          totalAmount: Number(inv.total_amount || 0),
          status: inv.status,
          notes: inv.notes,
          payments: []
        };
      }
    });

    downpaymentPayments.forEach(p => {
      if (p.invoice_id) {
        if (!groupMap[p.invoice_id]) {
          groupMap[p.invoice_id] = {
            invoiceId: p.invoice_id,
            invoiceNumber: p.display_number || p.invoices?.invoice_number || 'N/A',
            partyName: p.party_name || p.invoices?.clients?.name || 'Customer',
            totalAmount: Number(p.invoices?.total_amount || 0),
            status: p.invoices?.status || 'sent',
            notes: p.invoices?.notes,
            payments: []
          };
        }
        if (!groupMap[p.invoice_id].payments.some(existing => existing.id === p.id)) {
          groupMap[p.invoice_id].payments.push(p);
        }
      }
    });

    return Object.values(groupMap).map(item => {
      const sortedPayments = [...item.payments].sort((a, b) =>
        new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
      );
      const firstPayment = sortedPayments[0];
      const secondPayment = sortedPayments[1];
      const totalPaid = sortedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const totalVehiclePrice = Math.max(item.totalAmount, totalPaid);
      const remainingBalance = Math.max(0, totalVehiclePrice - totalPaid);

      return {
        ...item,
        payments: sortedPayments,
        firstPayment,
        secondPayment,
        firstAmount: firstPayment ? Number(firstPayment.amount || 0) : 0,
        secondAmount: secondPayment ? Number(secondPayment.amount || 0) : 0,
        totalPaid,
        totalVehiclePrice,
        remainingBalance,
        isFullySettled: remainingBalance <= 0 && totalPaid > 0,
      };
    });
  }, [invoices, downpaymentPayments]);

  const unrecordedPaidInvoices = useMemo(() => {
    // Cross-check with existing payments already present in state
    const existingPaymentInvoiceIds = new Set(
      payments.map(p => p.invoice_id).filter(Boolean)
    );
    return invoices.filter(inv => 
      inv.status === 'paid' && 
      !inv.has_payment_record && 
      !existingPaymentInvoiceIds.has(inv.id) && 
      (inv.total_paid || 0) <= 0 &&
      inv.type === 'sales'
    );
  }, [invoices, payments]);

  const [isSyncingUnrecorded, setIsSyncingUnrecorded] = useState(false);

  const handleSyncUnrecorded = async () => {
    if (unrecordedPaidInvoices.length === 0 || isSyncingUnrecorded) return;
    setIsSyncingUnrecorded(true);
    try {
      const clientToUse = serviceSupabase || supabase;
      const todayStr = new Date().toISOString().split('T')[0];

      const recordsToInsert = unrecordedPaidInvoices.map(inv => ({
        invoice_id: inv.id,
        purchase_invoice_id: null,
        amount: Number(inv.total_amount || 0),
        payment_date: todayStr,
        payment_method: inv.payment_method || 'cash',
        reference_number: '',
        notes: `Payment recorded for #${inv.invoice_number}`,
        user_id: targetUserId || user?.id
      }));

      const { error } = await clientToUse.from('payments').insert(recordsToInsert);
      if (error) throw error;

      toast({
        title: "Payments Synced Successfully! ✅",
        description: `Created payment records for ${unrecordedPaidInvoices.length} paid invoice(s).`
      });

      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'pending-for-payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (err: any) {
      console.error('Error syncing unrecorded payments:', err);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: err?.message || "Failed to sync payment records."
      });
    } finally {
      setIsSyncingUnrecorded(false);
    }
  };

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

  const handleTabChange = (tab: 'sales' | 'downpayment' | 'purchase') => {
    if (tab === 'purchase') {
      navigate('/purchase-payments');
    } else if (tab === 'downpayment') {
      setLocalTab('downpayment');
      setCategoryFilter('downpayment');
      navigate('/payments?type=downpayment');
    } else {
      setLocalTab('sales');
      setCategoryFilter('regular');
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

  const getPaymentTypeBadge = (payment: any) => {
    const type = payment.downpayment_type;
    const seq = payment.downpayment_breakdown?.sequence;
    if (type === 'full') {
      return (
        <Badge
          variant="outline"
          className="text-[8px] px-1.5 py-0.5 font-bold uppercase bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400"
        >
          Full Payment
        </Badge>
      );
    }
    if (type === 'downpayment' || seq === 1) {
      return (
        <Badge
          variant="outline"
          className="text-[8px] px-1.5 py-0.5 font-bold uppercase bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 flex items-center gap-1"
        >
          <Car className="w-2.5 h-2.5" />
          1st: Downpayment Advance
        </Badge>
      );
    }
    if (type === 'partial' || seq === 2 || (seq && seq > 1)) {
      return (
        <Badge
          variant="outline"
          className="text-[8px] px-1.5 py-0.5 font-bold uppercase bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 flex items-center gap-1"
        >
          <CreditCard className="w-2.5 h-2.5" />
          {seq && seq > 1 ? `${seq}nd: Partial / Balance` : 'Partial Payment'}
        </Badge>
      );
    }
    if (type === 'finance') {
      return (
        <Badge
          variant="outline"
          className="text-[8px] px-1.5 py-0.5 font-bold uppercase bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-400"
        >
          Loan Disbursed
        </Badge>
      );
    }
    return null;
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

  const handleRecordPaymentForInvoice = (invoiceId: string, suggestedAmount?: number) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;
    const isDP = Boolean(inv.is_downpayment || inv.invoice_number?.startsWith('DP-'));
    const priorPaid = Number(inv.total_paid || 0);
    const totalAmount = Number(inv.total_amount || 0);
    const amt = suggestedAmount !== undefined ? suggestedAmount : (inv.remaining_amount > 0 ? inv.remaining_amount : totalAmount);

    let defaultNote = '';
    if (isDP) {
      if (priorPaid > 0) {
        defaultNote = `2nd Payment (Partial/Balance: ${currencySymbol}${amt}) • Initial Downpayment was ${currencySymbol}${priorPaid} • Total Vehicle Price: ${currencySymbol}${totalAmount}`;
      } else {
        defaultNote = `1st Payment (Downpayment Advance: ${currencySymbol}${amt}) • Total Vehicle Price: ${currencySymbol}${totalAmount}`;
      }
    } else {
      defaultNote = `Full payment for Invoice #${inv.invoice_number}`;
    }

    setEditingSalesData({
      invoice_id: inv.id,
      invoice_number: inv.invoice_number,
      party_name: inv.party_name,
      amount: amt,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: inv.payment_method || 'cash',
      reference_number: '',
      notes: defaultNote
    });
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

        // Recalculate invoice status and metadata after editing payment
        const affectedInvoiceId = data.invoice_id || (payments.find(p => p.id === editingId)?.invoice_id);
        if (affectedInvoiceId) {
          const { data: rawRemaining } = await clientToUse
            .from('payments')
            .select('amount')
            .eq('invoice_id', affectedInvoiceId);

          const totalPaid = ((rawRemaining as unknown as { amount: number }[]) || [])
            .reduce((sum, p) => sum + Number(p.amount || 0), 0);

          const { data: rawInv } = await clientToUse
            .from('invoices')
            .select('id, total_amount, status, invoice_number, notes')
            .eq('id', affectedInvoiceId)
            .maybeSingle();

          const invRecord = rawInv as unknown as { id: string; total_amount: number; status: string; invoice_number?: string; notes?: string } | null;
          if (invRecord) {
            const invoiceTotal = Number(invRecord.total_amount ?? 0);
            const isDP = Boolean(
              invRecord.invoice_number?.startsWith('DP-') ||
              invRecord.invoice_number?.startsWith('DP') ||
              invRecord.notes?.includes('"is_downpayment":true')
            );

            let newStatus = invRecord.status;
            if (totalPaid >= invoiceTotal && invoiceTotal > 0) {
              newStatus = 'paid';
            } else if (totalPaid > 0) {
              newStatus = 'sent';
            } else {
              newStatus = 'pending';
            }

            const updates: Record<string, any> = { status: newStatus };
            if (isDP && invRecord.notes) {
              let metaObj: any = {};
              const metaMatch = invRecord.notes.match(/\[META:(.*?)\]/);
              if (metaMatch) {
                try { metaObj = JSON.parse(metaMatch[1]); } catch {}
              }
              if (totalPaid === 0) {
                if (metaObj.payment) delete metaObj.payment;
              } else {
                metaObj.payment = {
                  ...(metaObj.payment || {}),
                  type: totalPaid >= invoiceTotal ? 'full' : 'partial',
                  total_amount: invoiceTotal,
                  amount_received: totalPaid,
                  balance_pending: Math.max(0, invoiceTotal - totalPaid),
                };
              }
              const cleanBase = invRecord.notes.replace(/\[META:.*?\]/g, '').trim();
              updates.notes = Object.keys(metaObj).length > 0 
                ? `${cleanBase}\n[META:${JSON.stringify(metaObj)}]`.trim() 
                : cleanBase;
            }

            await clientToUse
              .from('invoices')
              .update(updates)
              .eq('id', affectedInvoiceId);
          }
        }

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
        const isDP = Boolean(selectedInvoice?.is_downpayment || invNumber.startsWith('DP-'));
        const prevPaid = Number(selectedInvoice?.total_paid || 0);
        const payAmount = Number(data.amount) || 0;
        const totalAmount = Number(selectedInvoice?.total_amount || 0);

        let pTypeTag = '';
        let splitNoteTag = '';
        if (data.payment_type === 'full') {
          pTypeTag = '[Payment Type: Full Payment]';
        } else if (data.payment_type === 'downpayment' || (!prevPaid && isDP)) {
          pTypeTag = '[Payment Type: Downpayment Advance]';
          splitNoteTag = `🚗 Downpayment Split: 1st Payment (Downpayment Advance: ${currencySymbol}${payAmount}) • Total Vehicle Price: ${currencySymbol}${totalAmount}`;
        } else if (data.payment_type === 'partial' || (prevPaid > 0 && isDP)) {
          pTypeTag = '[Payment Type: Partial Payment]';
          splitNoteTag = `💳 Downpayment Split: 2nd Payment (Partial/Balance: ${currencySymbol}${payAmount}) • Initial Downpayment was: ${currencySymbol}${prevPaid} • Total Vehicle Price: ${currencySymbol}${totalAmount}`;
        }

        const baseNote = data.notes || (isDP ? `Downpayment receipt #${invNumber} payment` : `Sales Invoice #${invNumber} payment`);
        const paymentNotes = `${baseNote} ${splitNoteTag ? `• ${splitNoteTag}` : ''} ${pTypeTag} • Created by: ${creatorName}`.trim();

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

        // Update sales invoice status and metadata if downpayment
        const newPaid = prevPaid + payAmount;
        const isFullyCleared = newPaid >= totalAmount;

        if (selectedInvoice) {
          const newStatus = isFullyCleared ? 'paid' : (isDP ? 'sent' : 'paid');
          const updates: Record<string, any> = { status: newStatus };

          if (isDP && selectedInvoice.notes) {
            let metaObj: any = {};
            const metaMatch = selectedInvoice.notes.match(/\[META:(.*?)\]/);
            if (metaMatch) {
              try { metaObj = JSON.parse(metaMatch[1]); } catch {}
            }
            metaObj.payment = {
              ...(metaObj.payment || {}),
              type: isFullyCleared ? 'full' : (data.payment_type || 'partial'),
              total_amount: totalAmount,
              amount_received: newPaid,
              balance_pending: Math.max(0, totalAmount - newPaid),
              date: data.payment_date,
              payment_method: data.payment_method,
              reference: data.reference_number || undefined
            };
            const cleanBase = selectedInvoice.notes.replace(/\[META:.*?\]/g, '').trim();
            updates.notes = `${cleanBase}\n[META:${JSON.stringify(metaObj)}]`.trim();
          }

          await clientToUse
            .from('invoices')
            .update(updates)
            .eq('id', data.invoice_id);
        }

        setSuccessInfo({
          title: isDP ? "Downpayment Payment Recorded" : "Sales Payment Recorded",
          message: isDP
            ? `Payment of ${formatAmount(Number(data.amount))} recorded for Downpayment #${invNumber}.`
            : `Payment from customer has been recorded for Invoice #${invNumber}.`
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

      let isDownpaymentReceipt = false;
      let remainingTotal = 0;
      let invoiceTotal = 0;

      // 3. Revert sales invoice status and downpayment metadata if payment is deleted
      if (targetInvoiceId) {
        // First: check remaining payments for this invoice (after deletion)
        const { data: rawRemaining } = await clientToUse
          .from('payments')
          .select('amount')
          .eq('invoice_id', targetInvoiceId);

        remainingTotal = ((rawRemaining as unknown as { amount: number }[]) || [])
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        // Fetch invoice to compare totals and current status
        const { data: rawInv } = await clientToUse
          .from('invoices')
          .select('id, total_amount, status, invoice_number, notes')
          .eq('id', targetInvoiceId)
          .maybeSingle();

        let invRecord = rawInv as unknown as { id: string; total_amount: number; status: string; invoice_number?: string; notes?: string } | null;
        let dbClientForInvoice = clientToUse;

        if (!invRecord) {
          const { data: rawFallbackInv } = await supabase
            .from('invoices')
            .select('id, total_amount, status, invoice_number, notes')
            .eq('id', targetInvoiceId)
            .maybeSingle();

          if (rawFallbackInv) {
            invRecord = rawFallbackInv as unknown as { id: string; total_amount: number; status: string; invoice_number?: string; notes?: string };
            dbClientForInvoice = supabase;
          }
        }

        if (invRecord) {
          invoiceTotal = Number(invRecord.total_amount ?? 0);
          const isDP = Boolean(
            invRecord.invoice_number?.startsWith('DP-') ||
            invRecord.invoice_number?.startsWith('DP') ||
            invRecord.notes?.includes('"is_downpayment":true')
          );
          isDownpaymentReceipt = isDP;

          // Determine status based on remaining payments
          let newStatus = invRecord.status;
          if (remainingTotal >= invoiceTotal && invoiceTotal > 0) {
            newStatus = 'paid';
          } else if (remainingTotal > 0) {
            newStatus = 'sent'; // Partial payment active
          } else {
            newStatus = 'pending'; // 0 payments remaining -> fully pending
          }

          const invoiceUpdates: Record<string, any> = { status: newStatus };

          // If Downpayment invoice, synchronize metadata in notes
          if (isDP && invRecord.notes) {
            let metaObj: any = {};
            const metaMatch = invRecord.notes.match(/\[META:(.*?)\]/);
            if (metaMatch) {
              try { metaObj = JSON.parse(metaMatch[1]); } catch {}
            }

            if (remainingTotal === 0) {
              // No payments left: remove payment metadata so invoice reverts to fresh booking
              if (metaObj.payment) {
                delete metaObj.payment;
              }
            } else {
              // Recalculate remaining balance and amount received
              metaObj.payment = {
                ...(metaObj.payment || {}),
                type: remainingTotal >= invoiceTotal ? 'full' : 'partial',
                total_amount: invoiceTotal,
                amount_received: remainingTotal,
                balance_pending: Math.max(0, invoiceTotal - remainingTotal),
              };
              if (metaObj.payment.finance && remainingTotal < invoiceTotal) {
                metaObj.payment.finance.disbursed = false;
              }
            }

            const cleanBase = invRecord.notes.replace(/\[META:.*?\]/g, '').trim();
            invoiceUpdates.notes = Object.keys(metaObj).length > 0 
              ? `${cleanBase}\n[META:${JSON.stringify(metaObj)}]`.trim() 
              : cleanBase;
          }

          await dbClientForInvoice
            .from('invoices')
            .update(invoiceUpdates)
            .eq('id', targetInvoiceId);
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

      const statusLabel = isDownpaymentReceipt
        ? (remainingTotal >= invoiceTotal && invoiceTotal > 0 ? 'Paid' : (remainingTotal > 0 ? 'Partial' : 'Pending'))
        : (remainingTotal > 0 ? 'Sent' : 'Pending');

      setSuccessInfo({
        title: "Payment Deleted",
        message: isDownpaymentReceipt
          ? `The payment record has been removed. Downpayment status has been updated to '${statusLabel}' and remaining balance recalculated.`
          : `The payment record has been removed. The invoice status has been reverted to '${statusLabel}' and 'Mark as Paid' is now available again.`
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
      <PaymentNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isAutomobile={isAutomobile}
        pendingSalesCount={paymentsData?.stats?.pendingSalesCount ?? 0}
        pendingDownpaymentCount={paymentsData?.stats?.pendingDownpaymentCount ?? 0}
        pendingPurchaseCount={paymentsData?.stats?.pendingPurchaseCount ?? 0}
        onOpenSalesModal={handleOpenSalesModal}
        onOpenPurchaseModal={handleOpenPurchaseModal}
      />

      <PaymentSyncBanner
        unrecordedPaidInvoices={unrecordedPaidInvoices}
        isSyncingUnrecorded={isSyncingUnrecorded}
        onSyncUnrecorded={handleSyncUnrecorded}
      />

      <PaymentFilters
        activeTab={activeTab}
        downpaymentSubTab={downpaymentSubTab}
        onDownpaymentSubTabChange={setDownpaymentSubTab}
        downpaymentPaymentsCount={downpaymentPayments.length}
        advancePaymentsCount={advancePaymentsCount}
        partialPaymentsCount={partialPaymentsCount}
        vehicleLedgerCount={vehicleLedgerItems.length}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        methodFilter={methodFilter}
        onMethodFilterChange={setMethodFilter}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        searchLoading={searchLoading}
      />

      <PaymentStatsGrid
        activeTab={activeTab}
        stats={paymentsData?.stats}
        methodFilter={methodFilter}
        onMethodFilterChange={setMethodFilter}
        dateFilterLabel={dateFilterLabel}
      />

      {/* Main Content: Vehicle Split Ledger View OR Flat Payments Table */}
      {activeTab === 'downpayment' && downpaymentSubTab === 'ledger' ? (
        <VehicleLedgerView
          vehicleLedgerItems={vehicleLedgerItems}
          onRecordPaymentForInvoice={handleRecordPaymentForInvoice}
        />
      ) : displayedPayments.length === 0 ? (
        <Card className="p-6 md:p-12 text-center bg-card dark:bg-card border border-border/70 rounded-2xl shadow-sm">
          {activeTab === 'downpayment' ? (
            <Car className="w-14 h-14 text-amber-500/40 mx-auto mb-3" />
          ) : activeTab === 'sales' ? (
            <CreditCard className="w-14 h-14 text-emerald-500/40 mx-auto mb-3" />
          ) : (
            <ShoppingCart className="w-14 h-14 text-purple-500/40 mx-auto mb-3" />
          )}
          <h3 className="text-lg font-bold text-foreground mb-1">
            {activeTab === 'downpayment'
              ? (downpaymentSubTab === 'advance'
                  ? "No 1st Payment Downpayment Advances Found"
                  : downpaymentSubTab === 'partial'
                  ? "No 2nd Payment Partial / Balance Payments Found"
                  : "No Downpayment Payments Found")
              : activeTab === 'sales'
              ? "No Sales Payments Found"
              : "No Purchase Payments Found"}
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm mb-5 max-w-md mx-auto">
            {activeTab === 'downpayment'
              ? (downpaymentSubTab === 'advance'
                  ? "No initial downpayment advance records match your criteria."
                  : downpaymentSubTab === 'partial'
                  ? "No partial / balance installment payments match your criteria."
                  : "No vehicle downpayment payments recorded yet matching your criteria.")
              : activeTab === 'sales'
              ? "No customer payments recorded yet for sales invoices matching your criteria."
              : "No vendor payments recorded yet for purchase bills matching your criteria."}
          </p>
          <Button
            variant="default"
            onClick={() => {
              if (activeTab === 'purchase') {
                handleOpenPurchaseModal();
              } else {
                handleOpenSalesModal();
              }
            }}
            className={cn(
              "font-bold text-xs h-10 px-5",
              activeTab === 'purchase'
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : activeTab === 'downpayment'
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
          >
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'downpayment'
              ? "Record Downpayment Payment"
              : activeTab === 'sales'
              ? "Record Sales Payment"
              : "Record Purchase Payment"}
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Mobile Card Layout (md:hidden) */}
          <div className="md:hidden space-y-3">
            {displayedPayments.map((payment) => (
              <PaymentCardItem
                key={payment.id}
                payment={payment}
                onUpdatePaymentMethod={handleUpdatePaymentMethod}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Desktop Table View (hidden md:block) */}
          <PaymentTable
            payments={displayedPayments}
            activeTab={activeTab}
            onUpdatePaymentMethod={handleUpdatePaymentMethod}
            onEdit={handleEdit}
            onDelete={handleDelete}
            getCreatorTag={getCreatorTag}
          />
        </div>
      )}

      {/* Pagination Controls */}
      {!(activeTab === 'downpayment' && downpaymentSubTab === 'ledger') && (
        <DataTablePagination
          currentPage={currentPage}
          totalPages={activeTab === 'downpayment' ? Math.max(1, Math.ceil(displayedPayments.length / pageSize)) : totalPages}
          totalCount={activeTab === 'downpayment' ? displayedPayments.length : (paymentsData?.totalCount || 0)}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          entityName={activeTab === 'downpayment' ? 'downpayment payments' : activeTab === 'sales' ? 'sales payments' : 'purchase payments'}
          isLoading={loading}
        />
      )}

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
        targetCategory={activeTab === 'downpayment' ? 'downpayment' : 'sales'}
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
