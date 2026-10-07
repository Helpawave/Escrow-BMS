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
import { FileText, Plus, Search, Filter, Download, Trash2, Printer, Mail, MoreVertical, Eye, Loader2, Phone, Pencil, Send, CreditCard, MoreHorizontal, Copy, History, Banknote, Smartphone, ChevronDown, Car } from "lucide-react";
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
import { formatInvoiceWhatsAppMessage } from "@/utils/whatsappTemplates";
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

const getPaymentMethodLabel = (method: string | null | undefined): string => {
  switch (method) {
    case 'cash':
      return 'Cash';
    case 'upi':
      return 'UPI / Online';
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'cheque':
      return 'Cheque';
    case 'credit_card':
      return 'Credit Card';
    case 'debit_card':
      return 'Debit Card';
    case 'net_banking':
      return 'Net Banking';
    case 'other':
      return 'Other Method';
    case 'pending':
      return 'Pending';
    default:
      return method ? method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Pending';
  }
};
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInvoices } from "@/hooks/useInvoices";
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


export interface InvoicesPageProps {
  isQuotationMode?: boolean;
  isLedgerMode?: boolean;
}

const InvoicesPage = ({ isQuotationMode: propQuotationMode, isLedgerMode: propLedgerMode }: InvoicesPageProps = {}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isQuotationTab = propQuotationMode ?? location.pathname.includes('/quotations');
  const isLedgerTab = propLedgerMode ?? (location.pathname.includes('/ledger-bills') || location.pathname.includes('/ledger-invoices'));
  const initialSearch = searchParams.get('search') || "";
  const initialInvoiceId = searchParams.get('id') || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { isAutomobile } = useUserType();


  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const typeParam = searchParams.get('type');

  // Immediately redirect legacy downpayment link to dedicated page
  useEffect(() => {
    if (typeParam === 'downpayment') {
      navigate('/billing/downpayment-invoices', { replace: true });
    }
  }, [typeParam, navigate]);

  const { data, isLoading: queryLoading, isPending, isFetching: searchLoading } = useInvoices({
    page: currentPage,
    pageSize,
    searchTerm: debouncedSearch,
    statusFilter,
    typeFilter: (isQuotationTab ? 'quotation' : (isLedgerTab ? 'ledger' : 'sales')) as any
  });

  const invoices = data?.invoices || [];

  const isDownpaymentInvoice = useCallback((inv: Invoice) => {
    return (
      Boolean(inv.notes?.includes('is_downpayment')) ||
      Boolean(inv.invoice_number?.startsWith('DP-')) ||
      Boolean(inv.invoice_number?.startsWith('DP')) ||
      Boolean(inv.notes?.toLowerCase().includes('downpayment')) ||
      Boolean(inv.notes?.toLowerCase().includes('down payment')) ||
      Boolean(inv.notes?.toLowerCase().includes('vehicle booking')) ||
      Boolean(inv.notes?.toLowerCase().includes('booking advance')) ||
      Boolean(inv.notes?.toLowerCase().includes('token payment')) ||
      Boolean(inv.notes?.includes('Vehicle:')) ||
      Boolean(inv.terms?.toLowerCase().includes('downpayment')) ||
      Boolean(inv.terms?.toLowerCase().includes('down payment')) ||
      Boolean(inv.payment_terms?.toLowerCase().includes('downpayment')) ||
      Boolean(inv.payment_terms?.toLowerCase().includes('down payment'))
    );
  }, []);

  const resolveTemplateForInvoice = useCallback((inv: Invoice, userSettings?: any): InvoiceTemplateId => {
    const salesTpl = userSettings?.invoice_template && !userSettings.invoice_template.startsWith('auto_')
      ? (userSettings.invoice_template as InvoiceTemplateId)
      : 'corporate';
    return salesTpl;
  }, []);

  const displayInvoices = useMemo(() => {
    return invoices.filter(inv => !isDownpaymentInvoice(inv));
  }, [invoices, isDownpaymentInvoice]);

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
    const saved = localStorage.getItem('invoice_shared_status');
    return saved ? JSON.parse(saved) : {};
  });

  // Persist shared status to localStorage
  useEffect(() => {
    localStorage.setItem('invoice_shared_status', JSON.stringify(sharedInvoices));
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

  const getCreatorTag = (terms?: string | null) => {
    if (terms && terms.startsWith('Created by:')) {
      const n = terms.replace('Created by:', '').trim();
      if (n && n.toLowerCase() !== 'company' && n.toLowerCase() !== 'company owner') {
        return `Created by: ${n}`;
      }
    }
    const fallback = ownerName || profile?.company_name || companyProfile?.company_name || user?.user_metadata?.full_name || (user?.user_metadata as any)?.name || 'Owner';
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
      } catch {}
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
            } catch {}
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
              } catch {}
              return updated;
            });
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
          const clientToUse = (serviceSupabase || supabase) as any;
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

  const downloadInvoicePDF = useCallback(async (invoice: Invoice) => {
    try {
      setDownloadingPDFId(invoice.id);

      // 1. Parallel fetch all required data using centralized service
      const {
        invoice: freshInvoiceData,
        items,
        client: clientData,
        settings,
        profile
      } = await fetchFullInvoiceData(invoice.id, targetUserId || "");

      // 2. Prepare data for utility using formatters
      const invoiceData = formatInvoiceData(freshInvoiceData, (settings as any)?.default_terms, (settings as any)?.default_payment_terms);
      const clientDataForUtils = formatClientData(clientData);
      const companyDataForUtils = formatCompanyData(profile, user?.email || "");

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
    try {
      const clientToUse = (serviceSupabase || supabase) as any;
      
      // 1. Update invoice status to paid
      const { error: invError } = await clientToUse
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoice.id);

      if (invError) throw invError;

      // 2. Insert into payments table
      const creatorName = isStaff
        ? (staffName || user?.user_metadata?.full_name || (user?.user_metadata as any)?.name || 'Staff Member')
        : (companyProfile?.company_name || 'Company Owner');

      const isPending = !paymentMethod || paymentMethod === 'pending';
      const actualMethod = isPending ? 'pending' : paymentMethod;
      const methodLabel = getPaymentMethodLabel(paymentMethod);
      const paymentNotes = isPending
        ? `Marked as paid (Mode of payment is pended) • Created by: ${creatorName}`
        : `Marked as paid via ${methodLabel} • Created by: ${creatorName}`;

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
    }
  };

  const updateInvoiceStatus = async (id: string, status: string) => {
    try {
      const clientToUse = (serviceSupabase || supabase) as any;
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
        profile
      } = await fetchFullInvoiceData(invoice.id, targetUserId || "");

      const invoiceData = formatInvoiceData(freshInvoiceData, (settings as any)?.default_terms, (settings as any)?.default_payment_terms);
      const clientDataForUtils = formatClientData(clientFullData);
      const companyDataForUtils = formatCompanyData(profile, user?.email || "");

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
          senderEmail: user?.email || undefined,
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
        profile
      } = await fetchFullInvoiceData(invoice.id, targetUserId || "");

      // Verify Google Drive Token
      const hasValidToken = await googleDriveAPI.ensureAuthenticated();
      if (!hasValidToken) await googleDriveAPI.authenticate();

      // Prepare PDF data
      const invoiceData = formatInvoiceData(freshInvoiceData, (settings as any)?.default_terms, (settings as any)?.default_payment_terms);
      const clientDataForUtils = formatClientData(clientFullData);
      const companyDataForUtils = formatCompanyData(profile, user?.email || "");

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

      // Use pre-fetched settings to prevent browser pop-up blocker
      const currentProvider = whatsappProvider || 'meta';

      if (currentProvider === 'personal') {
        console.log('User is configured for Personal WhatsApp, opening wa.me link...');
        const waUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;
        
        // Synchronous call in direct click handler (will not be blocked by browser popup blocker)
        const win = window.open(waUrl, '_blank');
        if (!win) {
          throw new Error('POPUP_BLOCKED');
        }

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
          mediaUrl: whatsappPdfUrl
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

      const waUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;

      if (error?.message === 'POPUP_BLOCKED') {
        toast({
          title: "Pop-up Blocked ⚠️",
          description: "Please allow pop-ups for this site, or open the link manually using the button below.",
          action: (
            <ToastAction altText="Open WhatsApp" onClick={() => {
              markInvoiceShared(whatsappInvoiceId, 'whatsapp');
              window.open(waUrl, '_blank');
            }}>
              Open WhatsApp
            </ToastAction>
          ),
        });
        return;
      }

      // Fallback: Open wa.me so the user can send it from their own WhatsApp
      const win = window.open(waUrl, '_blank');

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

      if (!win) {
        toast({
          title: "Pop-up Blocked",
          description: "Click below to open WhatsApp.",
          action: (
            <ToastAction altText="Open WhatsApp" onClick={() => window.open(waUrl, '_blank')}>
              Open WhatsApp
            </ToastAction>
          ),
        });
      } else {
        toast({
          title: "WhatsApp Opened",
          description: "Opened in WhatsApp to send invoice."
        });
      }

      setWhatsappConfirmationOpen(false);
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const uploadToGoogleDrive = async (invoice: Invoice) => {
    if (uploadingRef.current || uploadingWhatsApp === invoice.id) return;

    if (sharedInvoices[invoice.id]?.whatsapp) {
      toast({
        title: "Already Sent ⚠️",
        description: "This WhatsApp message has already been sent once.",
      });
    }

    // Format phone with country code
    const rawPhone = invoice.clients?.phone || '';
    const digitsOnly = rawPhone.replace(/[^\d]/g, '');
    let phoneWithCC = digitsOnly;
    if (rawPhone.trim().startsWith('+')) {
      phoneWithCC = digitsOnly;
    } else if (digitsOnly.length === 10) {
      phoneWithCC = `91${digitsOnly}`;
    }

    // Check user settings for whatsapp_provider
    let provider = 'meta';
    try {
      const clientToUse = (serviceSupabase || supabase) as any;
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

    // 1. Personal WhatsApp Mode: Direct Open without preview modal
    if (provider === 'personal') {
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
      } catch (e) {
        // non-blocking
      }

      // Ensure the PDF actually exists on Supabase Storage so the link never breaks
      let directPdfUrl = '';
      const storageClient = serviceSupabase || supabase;
      const cleanFileName = `invoice-${invoice.invoice_number}.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_');
      const supabaseFileName = `${effectiveUserId || user?.id}/invoices/${invoice.id}/${cleanFileName}`;

      try {
        const { data: existingFiles } = await storageClient.storage
          .from('company-assets')
          .list(`${effectiveUserId || user?.id}/invoices/${invoice.id}`, { search: cleanFileName });

        if (existingFiles && existingFiles.length > 0) {
          const { data } = storageClient.storage
            .from('company-assets')
            .getPublicUrl(supabaseFileName);
          if (data?.publicUrl) directPdfUrl = data.publicUrl;
        }
      } catch {}

      // If PDF file does not exist in storage yet, generate and upload it now
      if (!directPdfUrl) {
        try {
          const {
            invoice: freshInvoiceData,
            items,
            client: clientFullData,
            settings,
            profile: freshProfile
          } = await fetchFullInvoiceData(invoice.id, effectiveUserId || user?.id || "");

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
            if (data?.publicUrl) directPdfUrl = data.publicUrl;
          }
        } catch (uploadErr) {
          console.warn('Auto-generating invoice PDF failed, using public URL fallback:', uploadErr);
        }
      }

      if (!directPdfUrl) {
        try {
          const { data } = storageClient.storage
            .from('company-assets')
            .getPublicUrl(supabaseFileName);
          if (data?.publicUrl) directPdfUrl = data.publicUrl;
        } catch {}
      }

      const personalMsg = formatInvoiceWhatsAppMessage({
        invoiceNumber: invoice.invoice_number,
        clientName: invoice.clients?.name,
        companyName: companyProfile?.company_name || profile?.company_name || ownerName,
        totalAmount: Number(invoice.total_amount || 0),
        currencySymbol: currencySymbol,
        issueDate: safelyToLocaleDate(invoice.issue_date),
        dueDate: invoice.due_date ? safelyToLocaleDate(invoice.due_date) : undefined,
        status: invoice.status,
        pdfUrl: directPdfUrl || undefined,
        items: invoiceItems,
        bankDetails: {
          bankName: (companyProfile as any)?.bank_name || (profile as any)?.bank_name,
          accountNumber: (companyProfile as any)?.account_number || (profile as any)?.account_number,
          ifscCode: (companyProfile as any)?.ifsc_code || (profile as any)?.ifsc_code,
          accountHolder: (companyProfile as any)?.account_holder_name || (profile as any)?.account_holder_name,
        },
        companyPhone: companyProfile?.phone || profile?.phone,
        companyEmail: companyProfile?.email || profile?.email || user?.email,
      });

      // Auto-copy text with real emojis to clipboard as instant backup
      try {
        navigator.clipboard.writeText(personalMsg);
      } catch {}

      const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCC}&text=${encodeURIComponent(personalMsg)}`;
      window.open(waUrl, '_blank');

      if (invoice.status === 'draft') {
        await updateInvoiceStatus(invoice.id, 'sent');
      }

      await markInvoiceShared(invoice.id, 'whatsapp', invoice.invoice_number);

      toast({
        title: "WhatsApp Opened! 📱",
        description: `Direct WhatsApp chat opened for invoice #${invoice.invoice_number}.`
      });
      return;
    }

    // 2. Official WhatsApp Cloud API Mode: Run in background with notifications
    uploadingRef.current = true;
    setUploadingWhatsApp(invoice.id);
    let directPdfUrl = '';
    toast({
      title: "Sending via WhatsApp...",
      description: `Sending invoice #${invoice.invoice_number} via WhatsApp.`
    });

    try {
      const {
        invoice: freshInvoiceData,
        items,
        client: clientFullData,
        settings,
        profile
      } = await fetchFullInvoiceData(invoice.id, effectiveUserId || user?.id || "");

      const invoiceData = formatInvoiceData(freshInvoiceData, (settings as any)?.default_terms, (settings as any)?.default_payment_terms);
      const clientDataForUtils = formatClientData(clientFullData);
      const companyDataForUtils = formatCompanyData(profile, user?.email || "");

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

      const fileName = `invoice-${freshInvoiceData.invoice_number}.pdf`;

      try {
        const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const supabaseFileName = `${effectiveUserId || user?.id}/invoices/${invoice.id}/${cleanFileName}`;
        const storageClient = serviceSupabase || supabase;

        const { error: uploadError } = await storageClient.storage
          .from('company-assets')
          .upload(supabaseFileName, blob, { upsert: true, contentType: 'application/pdf' });

        if (!uploadError) {
          const { data } = storageClient.storage
            .from('company-assets')
            .getPublicUrl(supabaseFileName);
          if (data?.publicUrl) {
            directPdfUrl = data.publicUrl;
          }
        } else {
          console.warn('Upload error during cloud send, trying fallback:', uploadError);
        }
      } catch (storageErr) {
        console.error('Error during Supabase Storage upload:', storageErr);
      }

      const message = formatInvoiceWhatsAppMessage({
        invoiceNumber: freshInvoiceData.invoice_number,
        clientName: clientFullData.name,
        companyName: companyDataForUtils.company_name,
        totalAmount: Number(freshInvoiceData.total_amount || 0),
        currencySymbol: currencySymbol,
        issueDate: safelyToLocaleDate(freshInvoiceData.issue_date),
        dueDate: freshInvoiceData.due_date ? safelyToLocaleDate(freshInvoiceData.due_date) : undefined,
        status: freshInvoiceData.status,
        pdfUrl: directPdfUrl || undefined,
        items: items.map(i => ({ description: i.description, quantity: i.quantity, amount: i.amount })),
        bankDetails: {
          bankName: companyDataForUtils.bank_name,
          accountNumber: companyDataForUtils.account_number,
          ifscCode: companyDataForUtils.ifsc_code,
          accountHolder: companyDataForUtils.account_holder_name,
        },
        companyPhone: companyDataForUtils.phone,
        companyEmail: companyDataForUtils.email,
      });

      const { error: cloudApiError } = await supabase.functions.invoke('send-invoice-whatsapp', {
        body: {
          invoiceId: invoice.id,
          recipientPhone: phoneWithCC,
          message,
          mediaUrl: directPdfUrl,
          companyName: companyDataForUtils.company_name,
          clientName: clientFullData.name
        }
      });

      if (cloudApiError) throw cloudApiError;

      if (freshInvoiceData.status === 'draft') {
        await updateInvoiceStatus(invoice.id, 'sent');
      }

      await markInvoiceShared(invoice.id, 'whatsapp', invoice.invoice_number);

      toast({
        title: "WhatsApp Message Sent",
        description: `Invoice #${invoice.invoice_number} sent successfully.`
      });
    } catch (error: any) {
      console.warn('WhatsApp Cloud API background send failed:', error);
      const fallbackMsg = formatInvoiceWhatsAppMessage({
        invoiceNumber: invoice.invoice_number,
        clientName: invoice.clients?.name,
        companyName: companyProfile?.company_name || profile?.company_name || ownerName,
        totalAmount: Number(invoice.total_amount || 0),
        currencySymbol: currencySymbol,
        issueDate: safelyToLocaleDate(invoice.issue_date),
        dueDate: invoice.due_date ? safelyToLocaleDate(invoice.due_date) : undefined,
        status: invoice.status,
        pdfUrl: directPdfUrl || undefined,
        bankDetails: {
          bankName: (companyProfile as any)?.bank_name || (profile as any)?.bank_name,
          accountNumber: (companyProfile as any)?.account_number || (profile as any)?.account_number,
          ifscCode: (companyProfile as any)?.ifsc_code || (profile as any)?.ifsc_code,
          accountHolder: (companyProfile as any)?.account_holder_name || (profile as any)?.account_holder_name,
        },
        companyPhone: companyProfile?.phone || profile?.phone,
        companyEmail: companyProfile?.email || profile?.email || user?.email,
      });
      try {
        navigator.clipboard.writeText(fallbackMsg);
      } catch {}

      const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCC}&text=${encodeURIComponent(fallbackMsg)}`;
      
      toast({
        title: "WhatsApp Delivery Notice",
        description: "Could not send automatically. Click below to open WhatsApp.",
        action: (
          <ToastAction altText="Open WhatsApp" onClick={() => {
            markInvoiceShared(invoice.id, 'whatsapp', invoice.invoice_number);
            window.open(waUrl, '_blank');
          }}>
            Open WhatsApp
          </ToastAction>
        ),
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
      const clientToUse = (serviceSupabase || supabase) as any;

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

      setShowSuccess(true);
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
          <p className="text-xs md:text-base text-muted-foreground mt-1">
            {isAutomobile ? "Create and manage your vehicle sales & service invoices" : "Create and manage your sales invoices"}
          </p>
        </div>
        <Button
          variant="default"
          size="lg"
          onClick={() => navigate('/create-invoice')}
          className="w-full sm:w-auto h-11"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span className="text-sm md:text-base">
            Create Invoice
          </span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by invoice number or client name..."
            className="pl-10 h-11 bg-background border-border/50 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="w-full sm:w-48">
          <select
            className="w-full h-11 rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

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
          <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">No Invoices Found</h3>
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
            <Card key={invoice.id} className="p-4 md:p-6 rounded-md border-border bg-card shadow-sm">
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-4">
                <div
                  className="space-y-4"
                  onClick={() => handlePreviewInvoice(invoice)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{invoice.invoice_number}</span>
                        {isDownpaymentInvoice(invoice) && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] font-bold py-0 px-1.5 flex items-center gap-1">
                            <Car className="w-3 h-3" /> Downpayment
                          </Badge>
                        )}
                        <StatusBadge status={invoice.status} dueDate={invoice.due_date} />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">{invoice.clients?.name}</p>
                      <p className="text-[10px] text-muted-foreground/60 font-normal">
                        {getCreatorTag(invoice.payment_terms)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{safelyToLocaleDate(invoice.issue_date)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatAmount(invoice.total_amount)}</p>
                      <p className="text-xs text-muted-foreground uppercase">{invoice.currency}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 w-full"
                      onClick={(e) => { e.stopPropagation(); handlePreviewInvoice(invoice); }}
                      title="Preview Invoice"
                      aria-label="Preview Invoice"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 w-full"
                      onClick={(e) => { e.stopPropagation(); downloadInvoicePDF(invoice); }}
                      title="Download PDF"
                      aria-label="Download PDF"
                      disabled={downloadingPDFId === invoice.id}
                    >
                      {downloadingPDFId === invoice.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Download className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-10 w-full ${sharedInvoices[invoice.id]?.whatsapp ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : ''}`}
                      onClick={(e) => { e.stopPropagation(); uploadToGoogleDrive(invoice); }}
                      title="Share to WhatsApp"
                      aria-label="Share to WhatsApp"
                      disabled={uploadingWhatsApp === invoice.id}
                    >
                      {uploadingWhatsApp === invoice.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <svg viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${sharedInvoices[invoice.id]?.whatsapp ? 'text-emerald-700' : 'text-emerald-500'}`}>
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {invoice.clients?.email && (
                          <DropdownMenuItem
                            onClick={() => { setInvoiceToSend(invoice); setEmailConfirmationOpen(true); }}
                            className={sharedInvoices[invoice.id]?.email ? "text-emerald-600 font-medium" : ""}
                          >
                            <Mail className={`mr-2 h-4 w-4 ${sharedInvoices[invoice.id]?.email ? "text-emerald-600" : ""}`} />
                            Email to Client {sharedInvoices[invoice.id]?.email && "✓"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => sendInvoiceSMS(invoice)}
                          className={sharedInvoices[invoice.id]?.sms ? "text-emerald-600 font-medium" : ""}
                        >
                          <Phone className={`mr-2 h-4 w-4 ${sharedInvoices[invoice.id]?.sms ? "text-emerald-600" : ""}`} />
                          Send via SMS {sharedInvoices[invoice.id]?.sms && "✓"}
                        </DropdownMenuItem>
                        {invoice.status !== 'paid' ? (
                          <>
                            <DropdownMenuItem onClick={() => navigate(isDownpaymentInvoice(invoice) ? `/invoices/${invoice.id}/edit?type=downpayment` : `/invoices/${invoice.id}/edit`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setInvoiceToMarkPaid(invoice);
                                setSelectedPaymentMethod(null);
                                setMarkPaidDialogOpen(true);
                              }}
                              className="cursor-pointer font-medium text-emerald-700 dark:text-emerald-400"
                            >
                              <CreditCard className="mr-2 h-4 w-4 text-emerald-600" />
                              Mark as Paid
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem
                            disabled
                            className="text-emerald-600 font-medium disabled:opacity-100"
                          >
                            <CreditCard className="mr-2 h-4 w-4 text-emerald-600" />
                            Paid
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => deleteInvoice(invoice.id, invoice.invoice_number, invoice.status)}
                          className="text-destructive font-medium cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {invoice.status === 'paid' ? 'Delete Paid Invoice ⚠️' : 'Delete Invoice'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between gap-3">
                {/* Left: Invoice info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base lg:text-lg font-semibold truncate">{invoice.invoice_number}</h3>
                      {isDownpaymentInvoice(invoice) && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] font-bold py-0 px-1.5 flex items-center gap-1">
                          <Car className="w-3 h-3" /> Downpayment
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {invoice.clients?.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{safelyToLocaleDate(invoice.issue_date)}</span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {getCreatorTag(invoice.payment_terms)}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={invoice.status} dueDate={invoice.due_date} />
                </div>

                {/* Right: Amount + Actions */}
                <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-base lg:text-lg font-bold">{formatAmount(invoice.total_amount)}</p>
                    <p className="text-xs lg:text-sm text-muted-foreground">{invoice.currency}</p>
                  </div>

                  <div className="flex items-center gap-1 lg:gap-2">
                    {/* Email */}
                    {invoice.clients?.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setInvoiceToSend(invoice); setEmailConfirmationOpen(true); }}
                        title="Send via Email"
                        className={`h-8 lg:h-9 px-2 lg:px-3 ${sharedInvoices[invoice.id]?.email ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800' : ''}`}
                      >
                        <Mail className={`w-4 h-4 lg:mr-1 ${sharedInvoices[invoice.id]?.email ? 'text-emerald-700' : ''}`} />
                        <span className="hidden lg:inline">Email</span>
                      </Button>
                    )}

                    {/* SMS */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendInvoiceSMS(invoice)}
                      title="Send SMS"
                      className={`h-8 lg:h-9 px-2 lg:px-3 ${sharedInvoices[invoice.id]?.sms ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800' : ''}`}
                    >
                      <Phone className={`w-4 h-4 lg:mr-1 ${sharedInvoices[invoice.id]?.sms ? 'text-emerald-700' : ''}`} />
                      <span className="hidden lg:inline">SMS</span>
                    </Button>

                    {/* WhatsApp */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => uploadToGoogleDrive(invoice)}
                      title="Send PDF via WhatsApp"
                      className={`flex items-center gap-1 h-8 lg:h-9 px-2 lg:px-3 ${sharedInvoices[invoice.id]?.whatsapp ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800' : ''}`}
                      disabled={uploadingWhatsApp === invoice.id}
                    >
                      {uploadingWhatsApp === invoice.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <svg viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${sharedInvoices[invoice.id]?.whatsapp ? 'text-emerald-700' : 'text-emerald-500'}`}>
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>}
                      <span className="hidden lg:inline">WhatsApp</span>
                    </Button>

                    {/* Mark as Paid */}
                    {invoice.status !== 'paid' && (
                      <Button
                        variant="outline"
                        size="sm"
                        title="Mark as Paid"
                        onClick={() => {
                          setInvoiceToMarkPaid(invoice);
                          setSelectedPaymentMethod(null);
                          setMarkPaidDialogOpen(true);
                        }}
                        className="h-8 lg:h-9 px-2 lg:px-3 font-semibold bg-emerald-50/60 hover:bg-emerald-100/80 border-emerald-300 text-emerald-800 hover:text-emerald-900 transition-all active:scale-95"
                      >
                        <CreditCard className="w-4 h-4 lg:mr-1 text-emerald-600" />
                        <span className="hidden lg:inline">Mark as Paid</span>
                      </Button>
                    )}

                    {/* Preview */}
                    <Button variant="ghost" size="sm" onClick={() => handlePreviewInvoice(invoice)} title="Preview Invoice" className="h-8 lg:h-9 w-8 lg:w-9 p-0">
                      <Eye className="w-4 h-4" />
                    </Button>

                    {/* Download */}
                    <Button variant="ghost" size="sm" onClick={() => downloadInvoicePDF(invoice)} title="Download PDF" disabled={downloadingPDFId === invoice.id} className="h-8 lg:h-9 w-8 lg:w-9 p-0" aria-label={downloadingPDFId === invoice.id ? 'Generating PDF...' : 'Download PDF'}>
                      {downloadingPDFId === invoice.id
                        ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        : <Download className="w-4 h-4" />}
                    </Button>

                    {/* Edit */}
                    {invoice.status !== 'paid' && (
                      <Button variant="ghost" size="sm" onClick={() => navigate(isDownpaymentInvoice(invoice) ? `/invoices/${invoice.id}/edit?type=downpayment` : `/invoices/${invoice.id}/edit`)} title="Edit Invoice" className="h-8 lg:h-9 w-8 lg:w-9 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteInvoice(invoice.id, invoice.invoice_number, invoice.status)}
                      title={invoice.status === 'paid' ? 'Delete Paid Invoice' : 'Delete Invoice'}
                      className={`h-8 lg:h-9 w-8 lg:w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 ${invoice.status === 'paid' ? 'opacity-60' : ''}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
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

      <AlertDialog open={emailConfirmationOpen} onOpenChange={setEmailConfirmationOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl bg-background p-0 overflow-hidden max-w-md">
          <AlertDialogHeader className="p-4 md:p-8 pb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tight">Send Invoice via Email?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium pt-2">
              Are you sure you want to send this invoice to <span className="text-foreground font-bold">{invoiceToSend?.clients?.email}</span>?
              This action requires Google Drive authentication to attach the PDF link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5">
            <AlertDialogCancel className="flex-1 h-11 font-bold rounded-xl border-2 m-0 hover:bg-muted/50 transition-all">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => invoiceToSend && sendInvoiceEmail(invoiceToSend)}
              className="flex-1 h-11 font-black rounded-xl shadow-lg shadow-primary/20 bg-primary hover:opacity-90 transition-all"
            >
              Send Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={whatsappConfirmationOpen} onOpenChange={setWhatsappConfirmationOpen}>
        <AlertDialogContent className="max-w-lg rounded-2xl border-none shadow-2xl bg-background p-0 overflow-hidden">
          <AlertDialogHeader className="p-4 md:p-8 pb-4 border-b">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-emerald-500">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tight">WhatsApp Preview</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium pt-2">
              Review and edit the message below. Clicking <strong>Open WhatsApp</strong> will open WhatsApp with this message pre-filled — just press Send.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="p-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat flex flex-col gap-3">
            {whatsappInvoiceId && sharedInvoices[whatsappInvoiceId]?.whatsapp && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-3 flex items-start gap-2 max-w-[85%] self-start shadow-sm backdrop-blur-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-semibold">
                  Notice: This WhatsApp message has already been sent once.
                </div>
              </div>
            )}
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-tr-lg rounded-tl-lg rounded-br-lg p-3 shadow-sm relative max-w-[85%] mb-2">
              <div className="relative">
                <Textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="min-h-[150px] border-none focus-visible:ring-0 resize-none p-0 text-sm leading-relaxed text-gray-800 dark:text-gray-200 bg-transparent"
                  disabled={uploadingWhatsApp !== null}
                />
                {uploadingWhatsApp !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                      <p className="text-xs font-bold text-emerald-600 animate-pulse">Preparing PDF...</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-[10px] text-gray-400 text-right mt-1 flex items-center justify-end gap-1">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                <span className="text-[#34B7F1]">✓✓</span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                onClick={() => {
                  navigator.clipboard.writeText(whatsappMessage);
                  toast({
                    title: "Copied!",
                    description: "Message copied to clipboard",
                    duration: 2000,
                  });
                }}
                title="Copy message"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <AlertDialogFooter className="p-4 bg-muted/5 flex flex-row gap-3 items-center justify-end border-t">
            <AlertDialogCancel className="m-0 h-11 px-6 font-bold rounded-xl border-2 hover:bg-muted/50 transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={uploadingWhatsApp !== null || sendingWhatsApp}
              onClick={(e) => {
                e.preventDefault();
                handleSendWhatsApp();
              }}
              className="h-11 px-8 font-black rounded-xl shadow-lg shadow-emerald-500/20 bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {sendingWhatsApp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Open WhatsApp
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as Paid Selection Popup Dialog */}
      <Dialog open={markPaidDialogOpen} onOpenChange={setMarkPaidDialogOpen}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background">
          <DialogHeader className="p-6 pb-4 bg-muted/10 border-b border-border/50">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
              <CreditCard className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-foreground">
              Mark Invoice as Paid
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Invoice #{invoiceToMarkPaid?.invoice_number} • Amount: {formatAmount(Number(invoiceToMarkPaid?.total_amount || 0))}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Select Payment Method (Optional)
              </Label>
              {selectedPaymentMethod && (
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod(null)}
                  className="text-[11px] font-bold text-amber-600 hover:underline"
                >
                  Clear Selection
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedPaymentMethod(prev => prev === 'cash' ? null : 'cash')}
                className={`p-4 rounded-xl border-2 text-left flex flex-col gap-2 transition-all cursor-pointer active:scale-95 ${
                  selectedPaymentMethod === 'cash'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-border/60 hover:border-border text-muted-foreground hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Banknote className={`w-5 h-5 ${selectedPaymentMethod === 'cash' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                  {selectedPaymentMethod === 'cash' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  )}
                </div>
                <div>
                  <p className="font-black text-sm text-foreground">Cash</p>
                  <p className="text-[10px] opacity-70">Physical Cash Payment</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPaymentMethod(prev => prev === 'upi' ? null : 'upi')}
                className={`p-4 rounded-xl border-2 text-left flex flex-col gap-2 transition-all cursor-pointer active:scale-95 ${
                  selectedPaymentMethod === 'upi'
                    ? 'border-violet-600 bg-violet-50/70 dark:bg-violet-950/40 text-violet-900 dark:text-violet-100 shadow-md ring-2 ring-violet-500/20'
                    : 'border-border/60 hover:border-border text-muted-foreground hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Smartphone className={`w-5 h-5 ${selectedPaymentMethod === 'upi' ? 'text-violet-600' : 'text-muted-foreground'}`} />
                  {selectedPaymentMethod === 'upi' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-600"></span>
                  )}
                </div>
                <div>
                  <p className="font-black text-sm text-foreground">UPI / Online</p>
                  <p className="text-[10px] opacity-70">GPay, PhonePe, QR</p>
                </div>
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Or Other Payment Method
              </Label>
              <Select
                value={
                  selectedPaymentMethod && selectedPaymentMethod !== 'cash' && selectedPaymentMethod !== 'upi'
                    ? selectedPaymentMethod
                    : ""
                }
                onValueChange={(val) => {
                  if (val === 'none') {
                    setSelectedPaymentMethod(null);
                  } else {
                    setSelectedPaymentMethod(val);
                  }
                }}
              >
                <SelectTrigger className="w-full h-11 bg-muted/20 border-border/70 rounded-xl text-sm font-medium focus:ring-emerald-500">
                  <SelectValue placeholder="Choose other payment method..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border shadow-xl z-50">
                  <SelectItem value="none" className="cursor-pointer py-2 text-muted-foreground italic font-medium">
                    -- None (Mode is Pended) --
                  </SelectItem>
                  <SelectItem value="bank_transfer" className="cursor-pointer py-2 font-medium">
                    🏦 Bank Transfer (NEFT / RTGS / IMPS)
                  </SelectItem>
                  <SelectItem value="cheque" className="cursor-pointer py-2 font-medium">
                    📜 Cheque
                  </SelectItem>
                  <SelectItem value="credit_card" className="cursor-pointer py-2 font-medium">
                    💳 Credit Card
                  </SelectItem>
                  <SelectItem value="debit_card" className="cursor-pointer py-2 font-medium">
                    💳 Debit Card
                  </SelectItem>
                  <SelectItem value="net_banking" className="cursor-pointer py-2 font-medium">
                    🌐 Net Banking
                  </SelectItem>
                  <SelectItem value="other" className="cursor-pointer py-2 font-medium">
                    📦 Other Method
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!selectedPaymentMethod && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>No mode selected. Invoice will be settled with <strong>Pending Payment Mode</strong> (you can set it in Payments anytime).</span>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 bg-muted/5 border-t border-border/50 flex flex-row gap-3 shrink-0 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMarkPaidDialogOpen(false)}
              className="w-24 sm:w-28 h-11 font-bold rounded-xl shrink-0"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (invoiceToMarkPaid) {
                  await handleMarkAsPaid(invoiceToMarkPaid, selectedPaymentMethod);
                  setMarkPaidDialogOpen(false);
                  setInvoiceToMarkPaid(null);
                }
              }}
              className="flex-1 h-11 font-bold text-xs sm:text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 px-3 whitespace-nowrap overflow-hidden text-ellipsis"
            >
              {selectedPaymentMethod 
                ? `Confirm (${getPaymentMethodLabel(selectedPaymentMethod)})` 
                : 'Confirm (Mode is Pended)'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simple Delete Confirmation for Non-Paid Invoices */}
      <DeleteConfirmation
        isOpen={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
        onConfirm={confirmDeleteInvoice}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice #${invoiceToDelete?.invoiceNumber || ''}? This action cannot be undone and will restore item stock.`}
      />

      {/* Delete Modal for PAID Invoices - Single Tick & Type Confirmation */}
      <Dialog open={paidDeleteModalOpen} onOpenChange={(open) => {
        setPaidDeleteModalOpen(open);
        if (!open) {
          setInvoiceToDelete(null);
          setPaidVerificationChecked(false);
          setDeleteConfirmText("");
        }
      }}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-2xl border border-destructive/20 shadow-2xl bg-background">
          {/* Header */}
          <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent border-b border-destructive/15">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-destructive/15 ring-4 ring-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-bold text-foreground tracking-tight leading-tight">
                  Delete Paid Invoice
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-medium">
                  Invoice <span className="font-bold text-destructive">#{invoiceToDelete?.invoiceNumber}</span>
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 space-y-3.5">
            {/* Warning alert */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
                This invoice is marked as <strong>PAID</strong>. Deleting it will permanently erase linked payment records, restore inventory stock, and update reports.
              </div>
            </div>

            {/* Single Tick Confirmation */}
            <label
              htmlFor="paid-single-check"
              className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-150 select-none ${
                paidVerificationChecked
                  ? 'border-destructive/50 bg-destructive/5 ring-1 ring-destructive/20'
                  : 'border-border/60 hover:border-destructive/30 hover:bg-muted/30 bg-muted/10'
              }`}
            >
              <Checkbox
                id="paid-single-check"
                checked={paidVerificationChecked}
                onCheckedChange={(v) => setPaidVerificationChecked(!!v)}
                className="mt-0.5 shrink-0 border-2 border-destructive/60 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
              />
              <div className="min-w-0">
                <p className="text-xs text-foreground font-semibold leading-relaxed">
                  I understand this will permanently delete the invoice, its payment records, and restore item stock.
                </p>
              </div>
            </label>

            {/* Type Confirmation */}
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="delete-paid-input" className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>
                  Type <span className="font-mono font-black text-destructive bg-destructive/10 px-1.5 py-0.5 rounded text-xs">DELETE</span> to confirm:
                </span>
                {deleteConfirmText.trim().toUpperCase() === 'DELETE' && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">✓ Verified</span>
                )}
              </Label>
              <Input
                id="delete-paid-input"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                spellCheck={false}
                className={`h-9 text-sm font-mono font-bold border-2 transition-all ${
                  deleteConfirmText.trim().toUpperCase() === 'DELETE'
                    ? 'border-destructive/60 bg-destructive/5 text-destructive'
                    : deleteConfirmText.length > 0
                    ? 'border-amber-400/60 bg-amber-50/30 dark:bg-amber-950/20'
                    : 'border-border/60'
                }`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-border/40 bg-muted/10 flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaidDeleteModalOpen(false)}
              className="flex-1 h-9 font-semibold text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setPaidDeleteModalOpen(false);
                confirmDeleteInvoice();
              }}
              disabled={!paidVerificationChecked || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
              className="flex-1 h-9 text-xs font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete Paid Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
