import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { FileText, Plus, Search, Filter, Download, Trash2, Printer, Mail, MoreVertical, Eye, Loader2, Phone, Pencil, Send, CreditCard, MoreHorizontal, Copy, History, Banknote, Smartphone, ChevronDown, Car, Coffee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase, serviceSupabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { StatusBadge, getInvoiceEffectiveStatus } from "@/components/StatusBadge";
import { InvoicePreview } from "@/components/InvoicePreview";
import { InvoiceTemplate } from "@/components/InvoiceTemplate";
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { formatInvoiceWhatsAppMessage, formatDownpaymentWhatsAppMessage, normalizeWhatsAppNumber, openWhatsAppChat, shortenUrl, createShortReceiptLink } from "@/utils/whatsappTemplates";
import { extractVehicleDetails, extractPaymentDetails } from "@/components/AutoInvoiceTemplate";
import { googleDriveAPI } from "@/utils/googleDriveAPI";
import { SuccessModal } from "@/components/SuccessModal";
import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import { generateInvoicePDFBlob, generateInvoiceHTML } from "@/utils/invoicePDF";
import { adjustStock } from "@/utils/inventory";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { InvoiceFilters } from './invoices/components/InvoiceFilters';
import { InvoiceCardItem } from './invoices/components/InvoiceCardItem';
import { MarkPaidDialog } from './invoices/modals/MarkPaidDialog';
import { PaidDeleteModal } from './invoices/modals/PaidDeleteModal';
import { WhatsAppPreviewModal } from './invoices/modals/WhatsAppPreviewModal';
import { EmailConfirmationModal } from './invoices/modals/EmailConfirmationModal';
import { getPaymentMethodLabel } from './invoices/utils/paymentUtils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInvoices } from "@/hooks/useInvoices";
import { subscribeKitchenSync } from "@/services/kitchenService";
import { useUserType } from "@/hooks/useUserType";

import { StaffHeaderBadge } from "@/components/StaffHeaderBadge";
import { useQueryClient } from "@tanstack/react-query";
import { DataTablePagination } from "@/components/DataTablePagination";
import {
  fetchFullInvoiceData,
  formatCompanyData,
  formatInvoiceData,
  formatClientData
} from "@/utils/invoice-service";
import { Invoice, InvoiceItem, Client, UserSettings, ClientData, CompanyData, ItemData, InvoiceTemplateId } from "@/types/invoice";

const InvoicesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || "";
  const initialInvoiceId = searchParams.get('id') || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("all");
  const [nextServiceFilter, setNextServiceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { isAutomobile, isCafe } = useUserType();


  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, nextServiceFilter]);

  const typeParam = searchParams.get('type');

  // Immediately redirect legacy downpayment link to dedicated page
  useEffect(() => {
    if (typeParam === 'downpayment') {
      navigate('/downpayment-invoices', { replace: true });
    }
  }, [typeParam, navigate]);

  const { data, isLoading: queryLoading, isPending, isFetching: searchLoading, refetch: refetchInvoices } = useInvoices({
    page: currentPage,
    pageSize,
    searchTerm: debouncedSearch,
    statusFilter,
    typeFilter: 'sales'
  });

  const invoices = data?.invoices || [];

  const isDownpaymentInvoice = useCallback((inv: Invoice) => {
    return Boolean(
      inv.invoice_number?.startsWith('DP-') ||
      inv.invoice_number?.startsWith('DP') ||
      inv.invoice_number?.startsWith('BK-') ||
      inv.invoice_number?.startsWith('BK') ||
      inv.notes?.includes('"is_downpayment":true')
    );
  }, []);

  const resolveTemplateForInvoice = useCallback((inv: Invoice, userSettings?: any): InvoiceTemplateId => {
    if (isDownpaymentInvoice(inv)) {
      const rawTpl = (userSettings as any)?.downpayment_template || localStorage.getItem('downpayment_template');
      return (rawTpl && String(rawTpl).startsWith('auto_')) ? (rawTpl as InvoiceTemplateId) : 'auto_classic';
    }
    const salesTpl = userSettings?.invoice_template && !userSettings.invoice_template.startsWith('auto_')
      ? (userSettings.invoice_template as InvoiceTemplateId)
      : (isCafe ? 'thermal' : 'corporate');
    return salesTpl;
  }, [isDownpaymentInvoice, isCafe]);

  const displayInvoices = useMemo(() => {
    let filtered = invoices.filter(inv => !isDownpaymentInvoice(inv));

    if (nextServiceFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      filtered = filtered.filter(inv => {
        if (!inv.notes) return false;
        const match = inv.notes.match(/Next\s*(?:Service)?\s*Date:\s*([^\n|]+)/i);
        if (!match) return false;
        const raw = match[1].trim();
        // Support DD/MM/YYYY or YYYY-MM-DD
        let nsDate: Date | null = null;
        if (/\d{2}\/\d{2}\/\d{4}/.test(raw)) {
          const [d, m, y] = raw.split('/');
          nsDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        } else if (/\d{4}-\d{2}-\d{2}/.test(raw)) {
          nsDate = new Date(raw);
        }
        if (!nsDate || isNaN(nsDate.getTime())) return false;
        nsDate.setHours(0, 0, 0, 0);
        if (nextServiceFilter === 'overdue') return nsDate < today;
        if (nextServiceFilter === 'this_week') return nsDate >= today && nsDate <= endOfWeek;
        if (nextServiceFilter === 'this_month') return nsDate >= today && nsDate <= endOfMonth;
        return true;
      });
    }

    return filtered;
  }, [invoices, isDownpaymentInvoice, nextServiceFilter]);

  const totalCount = data?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const loading = queryLoading || isPending || (searchLoading && invoices.length === 0);

  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [emailConfirmationOpen, setEmailConfirmationOpen] = useState(false);
  const [invoiceToSend, setInvoiceToSend] = useState<Invoice | null>(null);
  const [uploadingWhatsApp, setUploadingWhatsApp] = useState<string | null>(null);
  const [sharingSMS, setSharingSMS] = useState<string | null>(null);
  const [sharedInvoices, setSharedInvoices] = useState<Record<string, { whatsapp?: boolean; email?: boolean; sms?: boolean }>>(() => {
    try {
      const saved = localStorage.getItem('invoice_shared_status') || localStorage.getItem('escrow_shared_invoices');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persist shared status to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('invoice_shared_status', JSON.stringify(sharedInvoices));
      localStorage.setItem('escrow_shared_invoices', JSON.stringify(sharedInvoices));
    } catch { }
  }, [sharedInvoices]);
  const [whatsappConfirmationOpen, setWhatsappConfirmationOpen] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappPdfUrl, setWhatsappPdfUrl] = useState("");
  const [whatsappInvoiceId, setWhatsappInvoiceId] = useState("");
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [whatsappProvider, setWhatsappProvider] = useState<string | null>(null);
  const [statusConfirmationOpen, setStatusConfirmationOpen] = useState(false);
  const [statusToConfirm, setStatusToConfirm] = useState<{ id: string, status: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [smsConfirmationOpen, setSmsConfirmationOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
  const [smsPhone, setSmsPhone] = useState("");
  const [smsInvoiceId, setSmsInvoiceId] = useState("");
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [paidDeleteModalOpen, setPaidDeleteModalOpen] = useState(false);
  const [paidVerificationChecked, setPaidVerificationChecked] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [invoiceToDelete, setInvoiceToDelete] = useState<{ id: string, invoiceNumber: string, status: string } | null>(null);
  const [downloadingPDFId, setDownloadingPDFId] = useState<string | null>(null);
  const uploadingRef = useRef(false);
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [invoiceToMarkPaid, setInvoiceToMarkPaid] = useState<Invoice | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const { user, effectiveUserId, companyProfile, profile, ownerName, isStaff, staffName } = useAuth();
  const targetUserId = effectiveUserId || user?.id;
  const { toast } = useToast();
  const { currencySymbol, formatAmount } = useCurrency();

  useEffect(() => {
    if (!targetUserId) return;
    const fetchWhatsAppProvider = async () => {
      try {
        const clientToUse = serviceSupabase || supabase;
        const { data } = await (clientToUse as any)
          .from('user_settings')
          .select('whatsapp_provider')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (data?.whatsapp_provider) {
          setWhatsappProvider(data.whatsapp_provider);
        } else {
          setWhatsappProvider('personal');
        }
      } catch {
        setWhatsappProvider('personal');
      }
    };
    fetchWhatsAppProvider();
  }, [targetUserId]);

  // Realtime listener for Kitchen order events (cancel/complete/update)
  useEffect(() => {
    const unsubscribe = subscribeKitchenSync((payload: any) => {
      const invId = payload?.invoiceId;
      if (invId) {
        queryClient.setQueriesData({ queryKey: ['invoices'] }, (old: any) => {
          if (!old || !old.invoices) return old;
          return {
            ...old,
            invoices: old.invoices.filter((inv: any) => inv.id !== invId),
            totalCount: Math.max(0, (old.totalCount || 1) - 1)
          };
        });
      }
      refetchInvoices();
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    });

    // Also listen to direct Supabase changes on invoices table
    const invoiceChannel = supabase
      .channel(`invoices_realtime_${targetUserId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices'
        },
        (payload: any) => {
          if (payload.eventType === 'DELETE' && payload.old?.id) {
            queryClient.setQueriesData({ queryKey: ['invoices'] }, (old: any) => {
              if (!old || !old.invoices) return old;
              return {
                ...old,
                invoices: old.invoices.filter((inv: any) => inv.id !== payload.old.id),
                totalCount: Math.max(0, (old.totalCount || 1) - 1)
              };
            });
          }
          refetchInvoices();
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .subscribe();

    return () => {
      unsubscribe();
      try { supabase.removeChannel(invoiceChannel); } catch {}
    };
  }, [targetUserId, refetchInvoices, queryClient]);

  const getCreatorTag = (terms?: string | null) => {
    if (terms && terms.startsWith('Created by:')) {
      const n = terms.replace('Created by:', '').trim();
      if (n && n.toLowerCase() !== 'company' && n.toLowerCase() !== 'company owner') {
        return `Created by: ${n}`;
      }
    }
    const fallback = ownerName || profile?.company_name || companyProfile?.company_name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Owner';
    return `Created by: ${fallback}`;
  };

  // Helper to mark invoice as shared both in local state and database (syncing across staff & main id)
  const markInvoiceShared = useCallback(async (invoiceId: string, channel: 'whatsapp' | 'email' | 'sms', invoiceNumber?: string) => {
    // 1. Immediately update local state & localStorage
    setSharedInvoices(prev => {
      const updated = {
        ...prev,
        [invoiceId]: { ...(prev[invoiceId] || {}), [channel]: true }
      };
      try {
        localStorage.setItem('invoice_shared_status', JSON.stringify(updated));
      } catch { }
      return updated;
    });

    // 2. Persist to database notifications for real-time cross-user sync
    if (targetUserId) {
      try {
        const clientToUse = serviceSupabase || supabase;
        const senderLabel = staffName ? `Staff (${staffName})` : (isStaff ? 'Staff' : 'Owner');
        await (clientToUse as any).from('notifications').insert({
          user_id: targetUserId,
          title: `Invoice Sent via ${channel === 'whatsapp' ? 'WhatsApp' : channel.toUpperCase()}`,
          message: `Invoice #${invoiceNumber || 'INV'} shared on ${channel === 'whatsapp' ? 'WhatsApp' : channel} by ${senderLabel}`,
          type: `${channel}_shared`,
          action_url: invoiceId,
          read: true
        });
      } catch (err) {
        console.warn(`Could not sync ${channel} share status to database:`, err);
      }
    }
  }, [targetUserId, staffName, isStaff]);

  // Sync shared status from database across devices and accounts (staff <-> main id) in real-time
  useEffect(() => {
    if (!targetUserId) return;

    let isMounted = true;
    const clientToUse = serviceSupabase || supabase;

    const fetchSharedHistory = async () => {
      try {
        const { data, error } = await (clientToUse as any)
          .from('notifications')
          .select('action_url, type')
          .eq('user_id', targetUserId)
          .in('type', ['whatsapp_shared', 'email_shared', 'sms_shared']);

        if (!error && data && isMounted) {
          const rows = data as Array<{ action_url?: string; type?: string }>;
          setSharedInvoices(prev => {
            const merged = { ...prev };
            for (const item of rows) {
              if (item.action_url) {
                const invId = item.action_url;
                if (!merged[invId]) merged[invId] = {};
                if (item.type === 'whatsapp_shared') merged[invId].whatsapp = true;
                if (item.type === 'email_shared') merged[invId].email = true;
                if (item.type === 'sms_shared') merged[invId].sms = true;
              }
            }
            try {
              localStorage.setItem('invoice_shared_status', JSON.stringify(merged));
            } catch { }
            return merged;
          });
        }
      } catch (err) {
        console.warn('Could not fetch invoice shared history:', err);
      }
    };

    fetchSharedHistory();

    const channel = supabase
      .channel(`invoice-shares-${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${targetUserId}`
        },
        (payload) => {
          const row = payload.new as { action_url?: string; type?: string };
          if (row?.action_url && (row.type === 'whatsapp_shared' || row.type === 'email_shared' || row.type === 'sms_shared')) {
            setSharedInvoices(prev => {
              const updated = {
                ...prev,
                [row.action_url!]: {
                  ...(prev[row.action_url!] || {}),
                  ...(row.type === 'whatsapp_shared' ? { whatsapp: true } : {}),
                  ...(row.type === 'email_shared' ? { email: true } : {}),
                  ...(row.type === 'sms_shared' ? { sms: true } : {})
                }
              };
              try {
                localStorage.setItem('invoice_shared_status', JSON.stringify(updated));
              } catch { }
              return updated;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `user_id=eq.${targetUserId}`
        },
        () => {
          if (isMounted) {
            void refetchInvoices();
            void queryClient.invalidateQueries({ queryKey: ['invoices'] });
            window.dispatchEvent(new CustomEvent('kitchen_orders_updated'));
          }
        }
      )
      .on(
        'broadcast',
        { event: 'kitchen_order_updated' },
        () => {
          if (isMounted) {
            void refetchInvoices();
            void queryClient.invalidateQueries({ queryKey: ['invoices'] });
            window.dispatchEvent(new CustomEvent('kitchen_orders_updated'));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [targetUserId]);

  // Handle specific invoice navigation from global search
  useEffect(() => {
    const findInvoicePage = async () => {
      if (initialInvoiceId && targetUserId) {
        try {
          const clientToUse = serviceSupabase || supabase;
          const { data } = await clientToUse
            .from('invoices')
            .select('id')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });

          if (data) {
            const invoices = data as unknown as { id: string }[];
            const index = invoices.findIndex(inv => inv.id === initialInvoiceId);
            if (index !== -1) {
              const page = Math.ceil((index + 1) / pageSize);
              setCurrentPage(page);
            }
          }
        } catch (err) {
          console.error("Error finding invoice page:", err);
        }
      }
    };

    if (user) {
      findInvoicePage();
      // Pre-authenticate Google Drive to reduce first-action latency
      (googleDriveAPI as unknown as { ensureAuthenticated: () => Promise<boolean> }).ensureAuthenticated().catch(() => { });
    }
  }, [initialInvoiceId, user, pageSize]);

  const location = useLocation();

  const downloadInvoicePDF = useCallback(async (invoice: Invoice) => {
    try {
      setDownloadingPDFId(invoice.id);

      // 1. Parallel fetch all required data using centralized service
      const {
        invoice: freshInvoiceData,
        items,
        client: clientData,
        settings,
        profile: freshProfile
      } = await fetchFullInvoiceData(invoice.id, targetUserId || "");

      // 2. Prepare data for utility using formatters
      const invoiceData = formatInvoiceData(freshInvoiceData, (settings as any)?.default_terms, (settings as any)?.default_payment_terms);
      const clientDataForUtils = formatClientData(clientData);
      const companyDataForUtils = formatCompanyData(freshProfile || companyProfile || profile, user?.email || "");

      const formattedItems = items.map((item: any) => ({
        description: item.description,
        product_name: item.product_name || item.products?.name || item.product?.name || item.name || '',
        name: item.name || item.product_name || item.products?.name || item.product?.name || '',
        quantity: item.quantity,
        rate: item.rate,
        tax_rate: item.tax_rate,
        discount: item.discount || 0,
        amount: item.amount,
        hsn_code: item.hsn_code || item.products?.hsn_code || item.product?.hsn_code || '',
        product: item.product || item.products
      }));

      const template: InvoiceTemplateId = resolveTemplateForInvoice(invoice, settings);

      // 3. Generate and download PDF
      const blob = await generateInvoicePDFBlob(
        invoiceData,
        clientDataForUtils,
        formattedItems,
        companyDataForUtils,
        template,
        currencySymbol
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Invoice PDF downloaded successfully."
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download PDF. Please try again."
      });
    } finally {
      setDownloadingPDFId(null);
    }
  }, [user, toast]);

  const handleMarkAsPaid = async (invoice: Invoice, paymentMethod: string | null) => {
    if (isSubmittingPayment) return;
    setIsSubmittingPayment(true);
    try {
      const clientToUse = serviceSupabase || supabase;

      // 1. Update invoice status to paid
      const { error: invError } = await clientToUse
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoice.id);

      if (invError) throw invError;

      // 2. Insert or update payment record in payments table
      const creatorName = isStaff
        ? (staffName || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Staff Member')
        : (companyProfile?.company_name || 'Company Owner');

      const isPending = !paymentMethod || paymentMethod === 'pending';
      const actualMethod = isPending ? 'pending' : paymentMethod;
      const methodLabel = getPaymentMethodLabel(paymentMethod);
      const paymentNotes = isPending
        ? `Marked as paid (Mode of payment is pended) • Created by: ${creatorName}`
        : `Marked as paid via ${methodLabel} • Created by: ${creatorName}`;

      // Check if a payment record already exists for this invoice to prevent duplicate entries
      const { data: existingPayment } = await clientToUse
        .from('payments')
        .select('id')
        .eq('invoice_id', invoice.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingPayment) {
        // Update existing payment rather than creating duplicate
        const { error: updatePayError } = await clientToUse
          .from('payments')
          .update({
            amount: Number(invoice.total_amount || 0),
            payment_method: actualMethod,
            notes: paymentNotes
          })
          .eq('id', (existingPayment as unknown as { id: string }).id);

        if (updatePayError) {
          console.error('Payment record update error:', updatePayError);
        }
      } else {
        const { error: payError } = await clientToUse
          .from('payments')
          .insert([{
            invoice_id: invoice.id,
            purchase_invoice_id: null,
            amount: Number(invoice.total_amount || 0),
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: actualMethod,
            reference_number: '',
            notes: paymentNotes,
            user_id: invoice.user_id || targetUserId || user?.id
          }]);

        if (payError) {
          console.error('Payment record insertion error:', payError);
          throw payError;
        }
      }

      // Create notification for status update
      await clientToUse.from('notifications').insert({
        user_id: user?.id,
        title: isPending ? 'Mode of payment is pended' : 'Invoice Paid',
        message: isPending
          ? `Invoice #${invoice.invoice_number} marked as Paid. Mode of payment is pended.`
          : `Invoice #${invoice.invoice_number} marked as Paid via ${methodLabel}. Payment recorded.`,
        type: isPending ? 'warning' : 'info'
      });

      if (isPending) {
        toast({
          title: "Mode of payment is pended ⚠️",
          description: `Invoice #${invoice.invoice_number} marked as paid. Payment recorded with pending mode — you can set the method in Payments.`
        });
      } else {
        toast({
          title: "Marked as Paid! ✅",
          description: `Invoice #${invoice.invoice_number} settled via ${methodLabel}. Payment recorded in Payments.`
        });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'pending-for-payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark invoice as paid."
      });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const updateInvoiceStatus = async (id: string, status: string) => {
    try {
      const clientToUse = serviceSupabase || supabase;
      const { error } = await clientToUse
        .from('invoices')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Invoice status updated to ${status}.`
      });

      // Create notification for status update
      const invoice = (invoices as unknown as Invoice[]).find(inv => inv.id === id);
      if (invoice) {
        const clientToUse = serviceSupabase || supabase;
        await clientToUse.from('notifications').insert({
          user_id: user?.id,
          title: 'Status Updated',
          message: `Invoice #${invoice.invoice_number} status changed to ${status}.`,
          type: 'info'
        });
      }

      // Invalidate query to refresh data
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update invoice status."
      });
    }
  };

  const handlePreviewInvoice = useCallback((invoice: Invoice) => {
    setPreviewInvoice(invoice);
    setPreviewOpen(true);
  }, []);

  const sendInvoiceEmail = useCallback(async (invoice: Invoice) => {
    if (!invoice.clients?.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Client email is required to send invoice."
      });
      return;
    }

    try {
      // Show loading toast immediately
      toast({
        title: "Preparing Email",
        description: "Generating invoice PDF and authenticating with Google Drive..."
      });

      // Fetch all required data in parallel using consolidated service
      const {
        invoice: freshInvoiceData,
        items,
        client: clientFullData,
        settings,
        profile: freshProfile
      } = await fetchFullInvoiceData(invoice.id, targetUserId || "");

      const invoiceData = formatInvoiceData(freshInvoiceData, (settings as any)?.default_terms, (settings as any)?.default_payment_terms);
      const clientDataForUtils = formatClientData(clientFullData);
      const companyDataForUtils = formatCompanyData(freshProfile || companyProfile || profile, user?.email || "");

      const formattedItems = items.map((item: any) => ({
        description: item.description,
        product_name: item.product_name || item.products?.name || item.product?.name || item.name || '',
        name: item.name || item.product_name || item.products?.name || item.product?.name || '',
        quantity: item.quantity,
        rate: item.rate,
        tax_rate: item.tax_rate,
        discount: item.discount || 0,
        amount: item.amount,
        hsn_code: item.hsn_code || item.products?.hsn_code || item.product?.hsn_code || '',
        product: item.product || item.products
      }));

      const template: InvoiceTemplateId = resolveTemplateForInvoice(invoice, settings);

      // 1. Generate PDF Blob and Email HTML in parallel
      const [pdfBlob, emailHTML] = await Promise.all([
        generateInvoicePDFBlob(
          invoiceData,
          clientDataForUtils,
          formattedItems,
          companyDataForUtils,
          template,
          currencySymbol
        ),
        generateInvoiceHTML(
          invoiceData,
          clientDataForUtils,
          formattedItems,
          companyDataForUtils,
          template,
          currencySymbol
        )
      ]);

      // 3. Google Drive Upload
      const hasValidToken = await googleDriveAPI.ensureAuthenticated();
      if (!hasValidToken) {
        toast({
          title: "Connecting to Google Drive...",
          description: "Please complete authentication to send the email with a PDF link."
        });
        const authenticated = await googleDriveAPI.authenticate();
        if (!authenticated) throw new Error('Could not authenticate with Google Drive.');
      }

      const fileName = `invoice-${invoice.invoice_number}.pdf`;
      const driveFile = await googleDriveAPI.uploadPDF(pdfBlob, fileName);
      if (!driveFile) throw new Error('Failed to upload PDF to Google Drive.');

      // 4. Update email HTML with professional wrapper and Drive link
      const emailWrapper = `
        <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">${companyDataForUtils.company_name}</h1>
              <p style="color: #e0e7ff; margin: 8px 0 0; font-size: 14px;">Invoice ${invoice.invoice_number}</p>
            </div>
            <div style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">Hello <strong>${clientDataForUtils.name}</strong>,</p>
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #475569;">We have generated a new invoice for you. Please find the details below and download your PDF copy using the link.</p>
              
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom: 8px; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Total Amount</td>
                  </tr>
                  <tr>
                    <td style="font-size: 28px; font-weight: 800; color: #1e293b;">${currencySymbol}${invoice.total_amount.toFixed(2)}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${driveFile.webContentLink}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.39);">📥 Download Invoice PDF</a>
              </div>

              <p style="margin: 0 0 10px; font-size: 14px; color: #94a3b8; text-align: center;">If you have any questions, feel free to reply to this email.</p>
            </div>
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; ${new Date().getFullYear()} ${companyDataForUtils.company_name}. All rights reserved.</p>
            </div>
          </div>
        </div>
      `;

      const emailHTMLWithLink = emailWrapper;

      // 5. Send email via Edge Function
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId: invoice.id,
          clientEmail: invoice.clients?.email || '',
          clientName: clientDataForUtils.name,
          invoiceNumber: invoice.invoice_number,
          htmlContent: emailHTMLWithLink,
          senderEmail: isStaff ? undefined : (user?.email || undefined),
          senderName: companyDataForUtils.company_name || undefined
        }
      });

      if (emailError) throw emailError;

      toast({
        title: "Email Sent Successfully",
        description: "Invoice email sent successfully! Check your inbox."
      });

      markInvoiceShared(invoice.id, 'email', invoice.invoice_number);

    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        variant: "destructive",
        title: "Email Send Failed",
        description: (error as Error)?.message || 'Failed to send email. Please try again.'
      });
    }
  }, [user, toast]);

  const sendInvoiceSMS = async (invoice: Invoice) => {
    // Prevent double execution
    if (sharingSMS === invoice.id) return;

    setSharingSMS(invoice.id);
    setSmsInvoiceId(invoice.id);

    // Set initial phone for the dialog (Client's phone)
    if (invoice.clients?.phone) {
      const rawPhone = invoice.clients.phone || '';
      const digitsOnly = rawPhone.replace(/[^\d]/g, '');
      const phoneWithCC = digitsOnly.startsWith('91') ? digitsOnly : `91${digitsOnly}`;
      setSmsPhone(phoneWithCC);
    }

    // Open dialog immediately for eager UI
    setSmsMessage("Generating your invoice PDF, please wait...");
    setSmsConfirmationOpen(true);

    try {
      // Fetch all required data in parallel using consolidated service
      const {
        invoice: freshInvoiceData,
        items,
        client: clientFullData,
        settings,
        profile: freshProfile
      } = await fetchFullInvoiceData(invoice.id, targetUserId || "");

      // Verify Google Drive Token
      const hasValidToken = await googleDriveAPI.ensureAuthenticated();
      if (!hasValidToken) await googleDriveAPI.authenticate();

      // Prepare PDF data
      const invoiceData = formatInvoiceData(freshInvoiceData, (settings as any)?.default_terms, (settings as any)?.default_payment_terms);
      const clientDataForUtils = formatClientData(clientFullData);
      const companyDataForUtils = formatCompanyData(freshProfile || companyProfile || profile, user?.email || "");

      const formattedItems = items.map((item: any) => ({
        description: item.description,
        product_name: item.product_name || item.products?.name || item.product?.name || item.name || '',
        name: item.name || item.product_name || item.products?.name || item.product?.name || '',
        quantity: item.quantity,
        rate: item.rate,
        tax_rate: item.tax_rate,
        discount: item.discount || 0,
        amount: item.amount,
        hsn_code: item.hsn_code || item.products?.hsn_code || item.product?.hsn_code || '',
        product: item.product || item.products
      }));

      const template: InvoiceTemplateId = resolveTemplateForInvoice(invoice, settings);

      const blob = await generateInvoicePDFBlob(
        invoiceData,
        clientDataForUtils,
        formattedItems,
        companyDataForUtils,
        template,
        currencySymbol
      );

      const fileName = `invoice-${freshInvoiceData.invoice_number}.pdf`;
      const driveFile = await googleDriveAPI.uploadPDF(blob, fileName);

      if (driveFile) {
        const message = `Hello ${clientFullData.name},\n\nYour invoice ${freshInvoiceData.invoice_number} (${currencySymbol}${freshInvoiceData.total_amount.toFixed(2)}) is ready!\n\n📄 Download PDF: ${driveFile.webContentLink}\n\nThank you!`;
        setSmsMessage(message);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error preparing SMS:', error);
      setSmsMessage(`Hello ${invoice.clients?.name}, your invoice ${invoice.invoice_number} for ${currencySymbol}${invoice.total_amount.toFixed(2)} is ready. Thank you!`);
    } finally {
      setSharingSMS(null);
    }
  };

  const handleSendWhatsApp = async () => {
    try {
      setSendingWhatsApp(true);

      // Use pre-fetched settings to prevent browser pop-up blocker, default to personal
      const currentProvider = whatsappProvider || 'personal';

      if (currentProvider === 'personal') {
        console.log('User is configured for Personal WhatsApp, opening direct chat...');
        const waUrl = openWhatsAppChat(whatsappPhone, whatsappMessage);

        // Mark as sent locally
        const clientToUse = serviceSupabase || supabase;
        const { data: invData } = await (clientToUse as any)
          .from('invoices')
          .select('status')
          .eq('id', whatsappInvoiceId)
          .maybeSingle();
        if (invData && invData.status === 'draft') {
          await updateInvoiceStatus(whatsappInvoiceId, 'sent');
        }

        await markInvoiceShared(whatsappInvoiceId, 'whatsapp');

        toast({
          title: "WhatsApp Opened! 📱",
          description: "Opening personal WhatsApp link to send invoice."
        });

        setWhatsappConfirmationOpen(false);
        return;
      }

      // Attempt to send via official WhatsApp Cloud API first
      console.log('Attempting to send WhatsApp via Cloud API Edge Function...');
      const { data, error } = await supabase.functions.invoke('send-invoice-whatsapp', {
        body: {
          invoiceId: whatsappInvoiceId,
          recipientPhone: whatsappPhone,
          message: whatsappMessage,
          mediaUrl: whatsappPdfUrl,
          companyName: companyProfile?.company_name || profile?.company_name || ownerName,
          clientName: invoiceToSend?.clients?.name,
          invoiceType: 'sales'
        }
      });

      if (error) throw error;

      // Mark as sent locally
      const clientToUse = serviceSupabase || supabase;
      const { data: invData } = await (clientToUse as any)
        .from('invoices')
        .select('status')
        .eq('id', whatsappInvoiceId)
        .maybeSingle();
      if (invData && invData.status === 'draft') {
        await updateInvoiceStatus(whatsappInvoiceId, 'sent');
      }

      await markInvoiceShared(whatsappInvoiceId, 'whatsapp');

      toast({
        title: "WhatsApp Message Sent",
        description: "Invoice sent successfully via WhatsApp."
      });

      setWhatsappConfirmationOpen(false);
    } catch (error: any) {
      console.warn('WhatsApp Cloud API/Personal fallback failed:', error);

      const waUrl = openWhatsAppChat(whatsappPhone, whatsappMessage);

      // Mark as sent locally (assuming they will send it in the opened chat)
      const clientToUse = serviceSupabase || supabase;
      const { data: invData } = await (clientToUse as any)
        .from('invoices')
        .select('status')
        .eq('id', whatsappInvoiceId)
        .maybeSingle();
      if (invData && invData.status === 'draft') {
        await updateInvoiceStatus(whatsappInvoiceId, 'sent');
      }

      await markInvoiceShared(whatsappInvoiceId, 'whatsapp');

      toast({
        title: "WhatsApp Opened 📱",
        description: "Opened in WhatsApp to send invoice.",
        action: (
          <ToastAction altText="Open WhatsApp" onClick={() => window.open(waUrl, '_blank')}>
            Open Chat
          </ToastAction>
        ),
      });

      setWhatsappConfirmationOpen(false);
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const ensureInvoicePdfUrl = async (invoice: Invoice): Promise<string> => {
    const targetUid = effectiveUserId || user?.id;
    const cleanFileName = `invoice-${invoice.invoice_number}.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_');
    const supabaseFileName = `${targetUid}/invoices/${invoice.id}/${cleanFileName}`;
    const storageClient = serviceSupabase || supabase;

    // Generate fresh invoice PDF blob and upload with upsert: true
    try {
      const pdfTask = async () => {
        const {
          invoice: freshInvoiceData,
          items,
          client: clientFullData,
          settings,
          profile: freshProfile
        } = await fetchFullInvoiceData(invoice.id, targetUid || "");

        const invoiceData = formatInvoiceData(freshInvoiceData, (settings as any)?.default_terms, (settings as any)?.default_payment_terms);
        const clientDataForUtils = formatClientData(clientFullData);
        const companyDataForUtils = formatCompanyData(freshProfile || profile, user?.email || "");

        const itemsData = items.map((item: any) => ({
          description: item.description,
          product_name: item.product_name || item.products?.name || item.product?.name || item.name || '',
          name: item.name || item.product_name || item.products?.name || item.product?.name || '',
          quantity: item.quantity,
          rate: item.rate,
          tax_rate: item.tax_rate,
          discount: item.discount || 0,
          amount: item.amount,
          hsn_code: item.hsn_code || item.products?.hsn_code || item.product?.hsn_code || '',
          product: item.product || item.products
        }));

        const template: InvoiceTemplateId = resolveTemplateForInvoice(invoice, settings);

        const blob = await generateInvoicePDFBlob(
          invoiceData,
          clientDataForUtils as ClientData,
          itemsData as ItemData[],
          companyDataForUtils as CompanyData,
          template,
          currencySymbol
        );

        const { error: uploadError } = await storageClient.storage
          .from('company-assets')
          .upload(supabaseFileName, blob, { upsert: true, contentType: 'application/pdf' });

        if (!uploadError) {
          const { data } = storageClient.storage
            .from('company-assets')
            .getPublicUrl(supabaseFileName);
          if (data?.publicUrl) return `${data.publicUrl}?t=${Date.now()}`;
        } else {
          console.warn('PDF upload error during invoice share:', uploadError);
        }
        return '';
      };

      const pdfTimeout = new Promise<string>((resolve) =>
        setTimeout(() => {
          console.warn('PDF generation timed out (5.5s), falling back to online bill link');
          resolve('');
        }, 5500)
      );

      const generatedUrl = await Promise.race([pdfTask(), pdfTimeout]);
      if (generatedUrl) return generatedUrl;
    } catch (err) {
      console.warn('PDF upload error during invoice share:', err);
    }

    try {
      const { data } = storageClient.storage
        .from('company-assets')
        .getPublicUrl(supabaseFileName);
      if (data?.publicUrl) return `${data.publicUrl}?t=${Date.now()}`;
    } catch { }

    return '';
  };

  const formatWhatsAppMessageForInvoice = (
    inv: Invoice | any,
    clientName?: string,
    companyName?: string,
    pdfUrl?: string,
    bankDetails?: any,
    itemsList?: any[],
    companyPhone?: string,
    companyEmail?: string
  ) => {
    if (isDownpaymentInvoice(inv)) {
      const vehicle = extractVehicleDetails(inv);
      const paymentDetails = extractPaymentDetails(inv);
      return formatDownpaymentWhatsAppMessage({
        invoiceNumber: inv.invoice_number,
        clientName: clientName || inv.clients?.name,
        companyName: companyName || ownerName,
        totalAmount: Number(inv.total_amount || 0),
        currencySymbol,
        issueDate: safelyToLocaleDate(inv.issue_date),
        status: inv.status,
        pdfUrl: pdfUrl || undefined,
        vehicleModel: vehicle.model,
        vehicleRegNo: vehicle.regNo || vehicle.vehicleNo,
        vehicleChassis: vehicle.chassisNo,
        financer: vehicle.financer,
        paymentDetails: paymentDetails ? {
          type: paymentDetails.type,
          amountReceived: paymentDetails.amountReceived,
          balancePending: paymentDetails.balancePending,
          paymentMethod: paymentDetails.paymentMethod
        } : undefined,
        companyPhone,
        companyEmail
      });
    }

    const regularVehicle = extractVehicleDetails(inv);
    return formatInvoiceWhatsAppMessage({
      invoiceNumber: inv.invoice_number,
      clientName: clientName || inv.clients?.name,
      companyName: companyName || ownerName,
      totalAmount: Number(inv.total_amount || 0),
      currencySymbol,
      issueDate: safelyToLocaleDate(inv.issue_date),
      dueDate: inv.due_date ? safelyToLocaleDate(inv.due_date) : undefined,
      status: inv.status,
      pdfUrl: pdfUrl || undefined,
      items: itemsList,
      bankDetails,
      companyPhone,
      companyEmail,
      vehicleNo: regularVehicle.vehicleNo || regularVehicle.regNo || undefined,
      vehicleModel: regularVehicle.model || undefined
    });
  };

  const uploadToGoogleDrive = async (invoice: Invoice) => {
    if (uploadingRef.current || uploadingWhatsApp === invoice.id) return;

    const rawPhone = invoice.clients?.phone || '';
    const phoneWithCC = normalizeWhatsAppNumber(rawPhone);
    if (!phoneWithCC) {
      toast({
        variant: "destructive",
        title: "Phone Number Missing",
        description: "Customer does not have a valid mobile number for WhatsApp."
      });
      return;
    }

    if (sharedInvoices[invoice.id]?.whatsapp) {
      toast({
        title: "Already Sent ⚠️",
        description: "This WhatsApp message has already been sent once.",
      });
    }

    const isMeta = whatsappProvider === 'meta';

    setUploadingWhatsApp(invoice.id);
    uploadingRef.current = true;
    toast({
      title: isMeta ? "Sending via WhatsApp API ⚡" : "Preparing WhatsApp...",
      description: isMeta ? `Connecting to ESCROW WhatsApp Gateway for invoice #${invoice.invoice_number}...` : `Preparing invoice #${invoice.invoice_number}...`
    });

    try {
      // 1. Resolve user settings for whatsapp_provider (default to personal)
      let provider = whatsappProvider || 'personal';
      try {
        const clientToUse = serviceSupabase || supabase;
        const { data: settings } = await clientToUse
          .from('user_settings')
          .select('whatsapp_provider')
          .eq('user_id', effectiveUserId || user?.id)
          .maybeSingle();
        if ((settings as any)?.whatsapp_provider) {
          provider = (settings as any).whatsapp_provider;
        }
      } catch (e) {
        // fallback
      }

      const cleanCode = (invoice.invoice_number || '').trim().replace(/^#+/, '');
      let baseUrl = 'https://bill.escrowbms.in';
      if (typeof window !== 'undefined' && window.location?.origin) {
        const origin = window.location.origin;
        if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
          baseUrl = origin.replace('www.bill.escrowbms.in', 'bill.escrowbms.in');
        }
      }
      const publicReceiptUrl = invoice.id ? `${baseUrl}/v/${invoice.id}` : `${baseUrl}/v/${encodeURIComponent(cleanCode)}`;

      // Trigger background PDF generation and storage upload immediately so link always opens the exact bill
      ensureInvoicePdfUrl(invoice).catch((pdfErr) => console.warn('Background invoice PDF sync notice:', pdfErr));

      // 2. Personal WhatsApp Mode: Open instantly within active user gesture!
      // This completely eliminates mobile popup/navigation blocker issues.
      if (provider === 'personal') {
        const message = formatWhatsAppMessageForInvoice(
          invoice,
          invoice.clients?.name,
          companyProfile?.company_name || profile?.company_name || ownerName,
          publicReceiptUrl,
          {
            bankName: companyProfile?.bank_name || profile?.bank_name,
            accountNumber: companyProfile?.account_number || profile?.account_number,
            ifscCode: companyProfile?.ifsc_code || profile?.ifsc_code,
            accountHolder: companyProfile?.account_holder_name || profile?.account_holder_name,
            upiId: (companyProfile as any)?.upi_id || (profile as any)?.upi_id,
          },
          undefined,
          companyProfile?.phone || profile?.phone,
          companyProfile?.email || profile?.email || user?.email
        );

        // Auto-copy text with real emojis to clipboard as instant backup safely
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(message).catch(() => {});
        }

        // Open WhatsApp immediately while user gesture is active!
        const waUrl = openWhatsAppChat(phoneWithCC, message);

        if (invoice.status === 'draft') {
          updateInvoiceStatus(invoice.id, 'sent').catch(() => {});
        }

        await markInvoiceShared(invoice.id, 'whatsapp', invoice.invoice_number);

        toast({
          title: "WhatsApp Opened! 📱",
          description: `Direct WhatsApp chat opened for invoice #${invoice.invoice_number}.`,
          action: (
            <ToastAction altText="Open WhatsApp" onClick={() => window.open(waUrl, '_blank')}>
              Open Chat
            </ToastAction>
          )
        });

        return;
      }

      // 3. Meta WhatsApp Cloud API Mode: Rapid Instant Dispatch
      toast({
        title: "Sending via WhatsApp API ⚡",
        description: `Delivering Invoice #${invoice.invoice_number} to ${invoice.clients?.name || 'customer'}...`,
        duration: 3500
      });

      let invoiceItems: { description?: string; quantity?: number; amount?: number }[] = [];
      try {
        const clientToUse = serviceSupabase || supabase;
        const { data: itms } = await (clientToUse as any)
          .from('invoice_items')
          .select('description, quantity, amount')
          .eq('invoice_id', invoice.id)
          .order('created_at', { ascending: true })
          .limit(10);
        if (itms) invoiceItems = itms as { description?: string; quantity?: number; amount?: number }[];
      } catch (e) { }

      const message = formatWhatsAppMessageForInvoice(
        invoice,
        invoice.clients?.name,
        companyProfile?.company_name || profile?.company_name || ownerName,
        publicReceiptUrl,
        {
          bankName: companyProfile?.bank_name || profile?.bank_name,
          accountNumber: companyProfile?.account_number || profile?.account_number,
          ifscCode: companyProfile?.ifsc_code || profile?.ifsc_code,
          accountHolder: companyProfile?.account_holder_name || profile?.account_holder_name,
          upiId: (companyProfile as any)?.upi_id || (profile as any)?.upi_id,
        },
        invoiceItems,
        companyProfile?.phone || profile?.phone,
        companyProfile?.email || profile?.email || user?.email
      );

      // Auto-copy text with real emojis to clipboard as instant backup safely
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(message).catch(() => {});
      }

      // 4. Meta WhatsApp Cloud API Mode with 15s Gateway Timeout Protection
      try {
        const clientForFunction = serviceSupabase || supabase;
        const invokePromise = clientForFunction.functions.invoke('send-invoice-whatsapp', {
          body: {
            invoiceId: invoice.id,
            recipientPhone: phoneWithCC,
            message,
            mediaUrl: publicReceiptUrl,
            companyName: companyProfile?.company_name || profile?.company_name || ownerName,
            clientName: invoice.clients?.name,
            invoiceType: 'sales'
          }
        });

        const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
          setTimeout(() => reject(new Error('WhatsApp gateway response timed out (15s)')), 15000)
        );

        const { data: cloudApiData, error: cloudApiError } = await Promise.race([invokePromise, timeoutPromise]);

        if (cloudApiError) throw cloudApiError;
        if (cloudApiData && cloudApiData.error) {
          throw new Error(cloudApiData.error);
        }

        try {
          if (invoice.status === 'draft') {
            await updateInvoiceStatus(invoice.id, 'sent');
          }
          await markInvoiceShared(invoice.id, 'whatsapp', invoice.invoice_number);
        } catch (postErr) {
          console.warn('Post-send state sync notice:', postErr);
        }

        toast({
          title: "WhatsApp Message Sent ✅",
          description: `Invoice #${invoice.invoice_number} sent successfully via Meta WhatsApp Gateway.`,
          duration: 5000
        });
      } catch (apiErr: any) {
        console.error('Meta WhatsApp API failed:', apiErr);
        const errMsg = apiErr?.message || (typeof apiErr === 'string' ? apiErr : 'Meta WhatsApp delivery failed. Please check WhatsApp settings.');
        toast({
          variant: "destructive",
          title: "Meta WhatsApp Failed ❌",
          description: errMsg,
          duration: 7000
        });
      }
    } catch (err: any) {
      console.error('Error sharing invoice on WhatsApp:', err);
      toast({
        variant: "destructive",
        title: "Sharing Failed",
        description: "Failed to send invoice via WhatsApp. Please try again."
      });
    } finally {
      setUploadingWhatsApp(null);
      uploadingRef.current = false;
    }
  };


  const deleteInvoice = (invoiceId: string, invoiceNumber: string, status: string) => {
    setInvoiceToDelete({ id: invoiceId, invoiceNumber, status });
    setPaidVerificationChecked(false);
    setDeleteConfirmText("");
    if (status === 'paid') {
      setPaidDeleteModalOpen(true);
    } else {
      setDeleteConfirmationOpen(true);
    }
  };

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return;

    try {
      const clientToUse = serviceSupabase || supabase;

      // Delete any payment records if any exist
      await clientToUse
        .from('payments')
        .delete()
        .eq('invoice_id', invoiceToDelete.id);

      // First fetch items to restore stock
      const { data: items, error: fetchError } = await clientToUse
        .from('invoice_items')
        .select('product_id, quantity')
        .eq('invoice_id', invoiceToDelete.id);

      if (fetchError) throw fetchError;

      // Restore stock for each item if it has a product_id
      if (items && items.length > 0) {
        const invoiceItems = items as unknown as { product_id: string | null; quantity: number }[];
        for (const item of invoiceItems) {
          if (item.product_id && item.quantity > 0) {
            await adjustStock(item.product_id, item.quantity);
          }
        }
      }

      // Then delete related invoice items
      const { error: itemsError } = await clientToUse
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceToDelete.id);

      if (itemsError) throw itemsError;

      // Then delete the invoice
      const { error: invoiceError } = await clientToUse
        .from('invoices')
        .delete()
        .eq('id', invoiceToDelete.id);

      if (invoiceError) throw invoiceError;

      const deletedId = invoiceToDelete.id;
      queryClient.setQueriesData({ queryKey: ['invoices'] }, (old: any) => {
        if (!old || !old.invoices) return old;
        return {
          ...old,
          invoices: old.invoices.filter((inv: any) => inv.id !== deletedId),
          totalCount: Math.max(0, (old.totalCount || 1) - 1)
        };
      });

      setShowSuccess(true);
      void refetchInvoices();
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Refresh product stock in UI
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete invoice."
      });
    } finally {
      setDeleteConfirmationOpen(false);
      setInvoiceToDelete(null);
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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl md:text-3xl font-bold text-foreground">
              {isAutomobile ? "Sales & Services" : "Sales Invoices"}
            </h1>
            <StaffHeaderBadge />
          </div>
          <p className="text-xs md:text-base text-slate-600 dark:text-slate-400 font-medium mt-1">
            {isAutomobile ? "Create and manage your vehicle sales & service invoices" : "Create and manage your sales invoices"}
          </p>
        </div>
        <Button
          variant="default"
          size="lg"
          onClick={() => navigate('/create-invoice')}
          className={cn("w-full sm:w-auto h-11", isCafe && "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold shadow-md shadow-amber-600/20")}
        >
          {isCafe ? (
            <>
              <Coffee className="w-4 h-4 mr-2" />
              <span className="text-sm md:text-base">
                Cafe POS Billing
              </span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              <span className="text-sm md:text-base">
                Create Invoice
              </span>
            </>
          )}
        </Button>
      </div>

      <InvoiceFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchLoading={searchLoading}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        isAutomobile={isAutomobile}
        isCafe={isCafe}
        nextServiceFilter={nextServiceFilter}
        setNextServiceFilter={setNextServiceFilter}
      />

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4 md:p-6 rounded-xl border-border bg-card shadow-sm">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-6 w-24 ml-auto" />
                  <Skeleton className="h-3 w-12 ml-auto" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
            </Card>
          ))}
        </div>
      ) : displayInvoices.length === 0 ? (
        <Card className="p-4 md:p-6 md:p-8 text-center bg-card dark:bg-card">
          <FileText className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg md:text-xl font-semibold text-foreground mb-2">No Invoices Found</h2>
          <p className="text-sm md:text-base text-muted-foreground mb-4">
            {totalCount === 0 ? "Create your first invoice to start billing your clients." : "No invoices match your search criteria."}
          </p>
          {totalCount === 0 && (
            <Button
              variant="default"
              onClick={() => navigate('/create-invoice')}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Invoice
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {displayInvoices.map((invoice) => (
            <InvoiceCardItem
              key={invoice.id}
              invoice={invoice}
              isDownpaymentInvoice={isDownpaymentInvoice}
              getCreatorTag={getCreatorTag}
              formatAmount={formatAmount}
              handlePreviewInvoice={handlePreviewInvoice}
              downloadInvoicePDF={downloadInvoicePDF}
              uploadToGoogleDrive={uploadToGoogleDrive}
              sendInvoiceSMS={sendInvoiceSMS}
              setEmailConfirmationOpen={setEmailConfirmationOpen}
              setInvoiceToSend={setInvoiceToSend}
              setInvoiceToMarkPaid={setInvoiceToMarkPaid}
              setSelectedPaymentMethod={setSelectedPaymentMethod}
              setMarkPaidDialogOpen={setMarkPaidDialogOpen}
              deleteInvoice={deleteInvoice}
              downloadingPDFId={downloadingPDFId}
              uploadingWhatsApp={uploadingWhatsApp}
              sharedInvoices={sharedInvoices}
              navigate={navigate}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <DataTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        entityName="invoices"
        isLoading={loading}
      />

      {previewInvoice && (
        <InvoicePreview
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          invoice={previewInvoice}
        />
      )}

      <EmailConfirmationModal
        open={emailConfirmationOpen}
        onOpenChange={setEmailConfirmationOpen}
        invoiceToSend={invoiceToSend}
        onSendEmail={sendInvoiceEmail}
      />

      <WhatsAppPreviewModal
        open={whatsappConfirmationOpen}
        onOpenChange={setWhatsappConfirmationOpen}
        whatsappInvoiceId={whatsappInvoiceId}
        sharedInvoices={sharedInvoices}
        whatsappMessage={whatsappMessage}
        setWhatsappMessage={setWhatsappMessage}
        uploadingWhatsApp={uploadingWhatsApp}
        sendingWhatsApp={sendingWhatsApp}
        handleSendWhatsApp={handleSendWhatsApp}
      />

      {/* Mark as Paid Selection Popup Dialog */}
      <MarkPaidDialog
        open={markPaidDialogOpen}
        onOpenChange={setMarkPaidDialogOpen}
        invoice={invoiceToMarkPaid}
        selectedPaymentMethod={selectedPaymentMethod}
        setSelectedPaymentMethod={setSelectedPaymentMethod}
        formatAmount={formatAmount}
        handleMarkAsPaid={handleMarkAsPaid}
        isSubmittingPayment={isSubmittingPayment}
      />

      {/* Simple Delete Confirmation for Non-Paid Invoices */}
      <DeleteConfirmation
        isOpen={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
        onConfirm={confirmDeleteInvoice}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice #${invoiceToDelete?.invoiceNumber || ''}? This action cannot be undone and will restore item stock.`}
      />

      {/* Delete Modal for PAID Invoices - Single Tick & Type Confirmation */}
      <PaidDeleteModal
        open={paidDeleteModalOpen}
        onOpenChange={setPaidDeleteModalOpen}
        invoiceToDelete={invoiceToDelete}
        paidVerificationChecked={paidVerificationChecked}
        setPaidVerificationChecked={setPaidVerificationChecked}
        deleteConfirmText={deleteConfirmText}
        setDeleteConfirmText={setDeleteConfirmText}
        onConfirmDelete={confirmDeleteInvoice}
        onClose={() => {
          setInvoiceToDelete(null);
          setPaidVerificationChecked(false);
          setDeleteConfirmText("");
        }}
      />

      <SuccessModal
        isOpen={showSuccess}
        onOpenChange={setShowSuccess}
        title="Invoice Deleted"
        message="The invoice has been permanently removed from your records."
      />
    </div>
  );
};

export default InvoicesPage;
