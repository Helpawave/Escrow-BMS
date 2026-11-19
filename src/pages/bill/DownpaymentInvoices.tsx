import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText, Plus, Search, Download, Trash2, Printer,
  Eye, Loader2, Phone, Pencil, Send, CreditCard, MoreHorizontal,
  Smartphone, Car, CheckCircle2, Coins, Landmark, History, Clock, ArrowRight, Wallet, Mail
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase, serviceSupabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { InvoicePreview } from "@/components/InvoicePreview";
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import { generateInvoicePDFBlob, generateInvoiceHTML } from "@/utils/invoicePDF";
import { adjustStock } from "@/utils/inventory";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffHeaderBadge } from "@/components/StaffHeaderBadge";
import { DataTablePagination } from "@/components/DataTablePagination";
import { extractVehicleDetails, extractPaymentDetails } from "@/components/AutoInvoiceTemplate";
import { useInvoices } from "@/hooks/useInvoices";
import { useUserType } from "@/hooks/useUserType";
import { useQueryClient } from "@tanstack/react-query";
import { ToastAction } from "@/components/ui/toast";
import { Invoice } from "@/types/invoice";
import {
  fetchFullInvoiceData,
  formatCompanyData,
  formatInvoiceData,
  formatClientData
} from "@/utils/invoice-service";
import {
  formatDownpaymentWhatsAppMessage,
  formatDownpaymentEmail,
  normalizeWhatsAppNumber,
  openWhatsAppChat,
  shortenUrl,
  createShortReceiptLink
} from "@/utils/whatsappTemplates";

import { DownpaymentFilters } from './downpayment-invoices/components/DownpaymentFilters';
import { DownpaymentCardItem } from './downpayment-invoices/components/DownpaymentCardItem';
import { DownpaymentSettlementDialog } from './downpayment-invoices/modals/DownpaymentSettlementDialog';
import { DownpaymentHistoryDialog } from './downpayment-invoices/modals/DownpaymentHistoryDialog';
import { getPaymentMethodLabel } from './downpayment-invoices/utils/downpaymentUtils';

export default function DownpaymentInvoices() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, effectiveUserId, companyProfile, profile, ownerName, isStaff, staffName } = useAuth();
  const { isAutomobile, userTypeLoading } = useUserType();

  useEffect(() => {
    if (!userTypeLoading && !isAutomobile) {
      navigate('/invoices', { replace: true });
    }
  }, [isAutomobile, userTypeLoading, navigate]);

  const targetUserId = effectiveUserId || user?.id;
  const { toast } = useToast();
  const { currencySymbol, formatAmount } = useCurrency();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<{ id: string; invoiceNumber: string; status: string } | null>(null);
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [invoiceToMarkPaid, setInvoiceToMarkPaid] = useState<Invoice | null>(null);
  const [paymentType, setPaymentType] = useState<'full' | 'partial' | 'finance'>('full');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cash');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [partialAmount, setPartialAmount] = useState<string>('');
  const [balanceDueDate, setBalanceDueDate] = useState<string>('');
  const [downpaymentAmount, setDownpaymentAmount] = useState<string>('');
  const [financierName, setFinancierName] = useState<string>('HDFC Bank');
  const [customFinancier, setCustomFinancier] = useState<string>('');
  const [financedAmount, setFinancedAmount] = useState<string>('');
  const [financeStatus, setFinanceStatus] = useState<'disbursed' | 'pending'>('disbursed');
  const [loanAccountNo, setLoanAccountNo] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);
  const [downloadingPDFId, setDownloadingPDFId] = useState<string | null>(null);
  const [uploadingWhatsApp, setUploadingWhatsApp] = useState<string | null>(null);
  const [whatsappProvider, setWhatsappProvider] = useState<string | null>(null);

  // Advanced Ledger & Settlement states
  const [alreadyPaidAmount, setAlreadyPaidAmount] = useState<number>(0);
  const [remainingBalanceAmount, setRemainingBalanceAmount] = useState<number>(0);
  const [balanceSettleType, setBalanceSettleType] = useState<'balance_full' | 'balance_partial' | 'finance_disburse'>('balance_full');
  const [installmentAmount, setInstallmentAmount] = useState<string>('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState<boolean>(false);
  const [historyInvoice, setHistoryInvoice] = useState<Invoice | null>(null);
  const [historyPayments, setHistoryPayments] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    const targetUid = effectiveUserId || user?.id;
    if (!targetUid) return;
    const fetchWhatsAppProvider = async () => {
      try {
        const clientToUse = serviceSupabase || supabase;
        const { data: settingsData } = await (clientToUse as any)
          .from('user_settings')
          .select('whatsapp_provider')
          .eq('user_id', targetUid)
          .maybeSingle();

        if (settingsData?.whatsapp_provider) {
          setWhatsappProvider(settingsData.whatsapp_provider);
        } else {
          setWhatsappProvider('personal');
        }
      } catch {
        setWhatsappProvider('personal');
      }
    };
    fetchWhatsAppProvider();
  }, [effectiveUserId, user?.id]);

  const { data, isLoading: queryLoading, isPending, isFetching: searchLoading } = useInvoices({
    page: currentPage,
    pageSize,
    searchTerm: debouncedSearch,
    statusFilter,
    typeFilter: 'downpayment'
  });

  const isDownpaymentInvoice = useCallback((inv: Invoice) => {
    return Boolean(
      inv.invoice_number?.startsWith('DP-') ||
      inv.invoice_number?.startsWith('DP') ||
      inv.notes?.includes('"is_downpayment":true')
    );
  }, []);

  const invoices = useMemo(() => {
    const raw = data?.invoices || [];
    return raw.filter(isDownpaymentInvoice);
  }, [data?.invoices, isDownpaymentInvoice]);

  const totalCount = data?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const loading = queryLoading || isPending || (searchLoading && invoices.length === 0);

  const getCreatorTag = (terms?: string | null) => {
    if (terms && terms.startsWith('Created by:')) {
      const n = terms.replace('Created by:', '').trim();
      if (n && n.toLowerCase() !== 'company' && n.toLowerCase() !== 'company owner') {
        return `Created by: ${n}`;
      }
    }
    const fallback = ownerName || profile?.company_name || companyProfile?.company_name || user?.user_metadata?.full_name || 'Owner';
    return `Created by: ${fallback}`;
  };

  const handlePreviewInvoice = (invoice: Invoice) => {
    setPreviewInvoice(invoice);
    setPreviewOpen(true);
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      setDownloadingPDFId(invoice.id);
      const {
        invoice: freshInvoiceData,
        items,
        client: clientData,
        settings,
        profile: userProf
      } = await fetchFullInvoiceData(invoice.id, targetUserId || "");

      const invoiceData = formatInvoiceData(freshInvoiceData, (settings as any)?.default_terms, (settings as any)?.default_payment_terms);
      const clientDataForUtils = formatClientData(clientData);
      const companyDataForUtils = formatCompanyData(userProf || companyProfile || profile, user?.email || "");

      const formattedItems = (items as any[]).map((item: any) => ({
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

      let chosenTemplate = 'auto_classic';
      try {
        const targetUid = targetUserId || user?.id;
        const { data: tplSetting } = await (supabase as any)
          .from('system_settings')
          .select('value')
          .eq('key', `downpayment_template_${targetUid}`)
          .maybeSingle();
        if (tplSetting?.value) {
          let val = tplSetting.value;
          if (typeof val === 'string') {
            try { val = JSON.parse(val); } catch {}
          }
          if (val && String(val).startsWith('auto_')) chosenTemplate = val;
        } else {
          const rawTpl = localStorage.getItem('downpayment_template') || (settings as any)?.downpayment_template;
          if (rawTpl && String(rawTpl).startsWith('auto_')) chosenTemplate = rawTpl;
        }
      } catch {
        const rawTpl = localStorage.getItem('downpayment_template') || (settings as any)?.downpayment_template;
        if (rawTpl && String(rawTpl).startsWith('auto_')) chosenTemplate = rawTpl;
      }

      const blob = await generateInvoicePDFBlob(
        invoiceData,
        clientDataForUtils,
        formattedItems,
        companyDataForUtils,
        chosenTemplate as any,
        currencySymbol
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Downpayment-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `Downpayment receipt #${invoice.invoice_number} downloaded.`
      });
    } catch (err) {
      console.error("PDF download error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF. Please try again."
      });
    } finally {
      setDownloadingPDFId(null);
    }
  };

  const handlePrint = async (invoice: Invoice) => {
    try {
      const {
        invoice: freshInvoiceData,
        items,
        client: clientData,
        settings,
        profile: userProf
      } = await fetchFullInvoiceData(invoice.id, targetUserId || "");

      const invoiceData = formatInvoiceData(freshInvoiceData, (settings as any)?.default_terms, (settings as any)?.default_payment_terms);
      const clientDataForUtils = formatClientData(clientData);
      const companyDataForUtils = formatCompanyData(userProf || companyProfile || profile, user?.email || "");

      const formattedItems = (items as any[]).map((item: any) => ({
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

      let chosenTemplate = 'auto_classic';
      try {
        const targetUid = targetUserId || user?.id;
        const { data: tplSetting } = await (supabase as any)
          .from('system_settings')
          .select('value')
          .eq('key', `downpayment_template_${targetUid}`)
          .maybeSingle();
        if (tplSetting?.value) {
          let val = tplSetting.value;
          if (typeof val === 'string') {
            try { val = JSON.parse(val); } catch {}
          }
          if (val && String(val).startsWith('auto_')) chosenTemplate = val;
        } else {
          const rawTpl = localStorage.getItem('downpayment_template') || (settings as any)?.downpayment_template;
          if (rawTpl && String(rawTpl).startsWith('auto_')) chosenTemplate = rawTpl;
        }
      } catch {
        const rawTpl = localStorage.getItem('downpayment_template') || (settings as any)?.downpayment_template;
        if (rawTpl && String(rawTpl).startsWith('auto_')) chosenTemplate = rawTpl;
      }

      const html = await generateInvoiceHTML(
        invoiceData,
        clientDataForUtils,
        formattedItems,
        companyDataForUtils,
        chosenTemplate as any,
        currencySymbol
      );

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (err) {
      console.error("Print error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to print downpayment receipt."
      });
    }
  };

  const ensureDownpaymentPdfUrl = async (invoice: Invoice): Promise<string> => {
    const targetUid = effectiveUserId || user?.id;
    const cleanFileName = `downpayment-${invoice.invoice_number}.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_');
    const supabaseFileName = `${targetUid}/invoices/${invoice.id}/${cleanFileName}`;
    const storageClient = serviceSupabase || supabase;

    // Generate fresh downpayment receipt PDF blob and upload with safety timeout
    try {
      const pdfTask = async () => {
        const {
          invoice: freshInvoiceData,
          items,
          client: clientData,
          settings,
          profile: userProf
        } = await fetchFullInvoiceData(invoice.id, targetUid || "");

        const invoiceData = formatInvoiceData(freshInvoiceData, (settings as any)?.default_terms, (settings as any)?.default_payment_terms);
        const clientDataForUtils = formatClientData(clientData);
        const companyDataForUtils = formatCompanyData(userProf || companyProfile || profile, user?.email || "");

        const formattedItems = (items as any[]).map((item: any) => ({
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

        let chosenTemplate = 'auto_classic';
        try {
          const { data: tplSetting } = await (supabase as any)
            .from('system_settings')
            .select('value')
            .eq('key', `downpayment_template_${targetUid}`)
            .maybeSingle();
          if (tplSetting?.value) {
            let val = tplSetting.value;
            if (typeof val === 'string') {
              try { val = JSON.parse(val); } catch {}
            }
            if (val && String(val).startsWith('auto_')) chosenTemplate = val;
          } else {
            const rawTpl = localStorage.getItem('downpayment_template') || (settings as any)?.downpayment_template;
            if (rawTpl && String(rawTpl).startsWith('auto_')) chosenTemplate = rawTpl;
          }
        } catch {
          const rawTpl = localStorage.getItem('downpayment_template') || (settings as any)?.downpayment_template;
          if (rawTpl && String(rawTpl).startsWith('auto_')) chosenTemplate = rawTpl;
        }

        const blob = await generateInvoicePDFBlob(
          invoiceData,
          clientDataForUtils,
          formattedItems,
          companyDataForUtils,
          chosenTemplate as any,
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
          console.warn('PDF upload error during downpayment share:', uploadError);
        }
        return '';
      };

      const pdfTimeout = new Promise<string>((resolve) =>
        setTimeout(() => {
          console.warn('Downpayment PDF generation timed out (5.5s), falling back to online receipt link');
          resolve('');
        }, 5500)
      );

      const generatedUrl = await Promise.race([pdfTask(), pdfTimeout]);
      if (generatedUrl) return generatedUrl;
    } catch (err) {
      console.warn('PDF generation/upload error during downpayment share:', err);
    }

    // Fallback publicUrl with cache buster
    try {
      const { data } = storageClient.storage
        .from('company-assets')
        .getPublicUrl(supabaseFileName);
      if (data?.publicUrl) return `${data.publicUrl}?t=${Date.now()}`;
    } catch {}

    return '';
  };

  const handleShareWhatsApp = async (invoice: Invoice) => {
    if (uploadingWhatsApp === invoice.id) return;

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

    const isMeta = whatsappProvider === 'meta';

    setUploadingWhatsApp(invoice.id);
    toast({
      title: isMeta ? "Sending via WhatsApp API ⚡" : "Preparing WhatsApp...",
      description: isMeta ? `Connecting to ESCROW WhatsApp Gateway for downpayment #${invoice.invoice_number}...` : `Preparing downpayment receipt #${invoice.invoice_number}...`
    });

    try {
      // 1. Resolve user settings for whatsapp_provider (default to personal)
      let provider = whatsappProvider || 'personal';
      try {
        const clientToUse = serviceSupabase || supabase;
        const targetUid = effectiveUserId || user?.id;
        const { data: settingsData } = await (clientToUse as any)
          .from('user_settings')
          .select('whatsapp_provider')
          .eq('user_id', targetUid)
          .maybeSingle();
        if (settingsData?.whatsapp_provider) {
          provider = settingsData.whatsapp_provider;
        }
      } catch (e) {
        console.warn('Could not fetch whatsapp_provider setting, using personal fallback:', e);
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

      const compName = companyProfile?.company_name || profile?.company_name || ownerName || 'Our Business';
      const clientName = invoice.clients?.name || 'Customer';
      const vehicle = extractVehicleDetails({ notes: invoice.notes });

      // 2. Personal WhatsApp Mode: Open instantly without waiting for slow client-side PDF rendering!
      if (provider === 'personal') {
        const message = formatDownpaymentWhatsAppMessage({
          invoiceNumber: invoice.invoice_number,
          clientName: clientName,
          companyName: compName,
          totalAmount: Number(invoice.total_amount || 0),
          currencySymbol,
          issueDate: safelyToLocaleDate(invoice.issue_date),
          status: invoice.status,
          pdfUrl: publicReceiptUrl,
          vehicleModel: vehicle.model,
          vehicleRegNo: vehicle.vehicleNo || vehicle.regNo,
          vehicleChassis: vehicle.chassisNo,
          financer: vehicle.financer,
          companyPhone: companyProfile?.phone || profile?.phone,
          companyEmail: companyProfile?.email || profile?.email || user?.email
        });

        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(message).catch(() => {});
        }

        const waUrl = openWhatsAppChat(phoneWithCC, message);

        toast({
          title: "WhatsApp Opened! 📱",
          description: `Personal WhatsApp opened for downpayment receipt #${invoice.invoice_number}.`,
          action: (
            <ToastAction altText="Open WhatsApp" onClick={() => window.open(waUrl, '_blank')}>
              Open Chat
            </ToastAction>
          )
        });

        return;
      }

      // 3. Meta Cloud API mode: Rapid Instant Dispatch
      toast({
        title: "Sending via WhatsApp API ⚡",
        description: `Delivering downpayment receipt #${invoice.invoice_number} to ${clientName}...`,
        duration: 3500
      });

      const message = formatDownpaymentWhatsAppMessage({
        invoiceNumber: invoice.invoice_number,
        clientName: clientName,
        companyName: compName,
        totalAmount: Number(invoice.total_amount || 0),
        currencySymbol,
        issueDate: safelyToLocaleDate(invoice.issue_date),
        status: invoice.status,
        pdfUrl: publicReceiptUrl,
        vehicleModel: vehicle.model,
        vehicleRegNo: vehicle.vehicleNo || vehicle.regNo,
        vehicleChassis: vehicle.chassisNo,
        financer: vehicle.financer,
        companyPhone: companyProfile?.phone || profile?.phone,
        companyEmail: companyProfile?.email || profile?.email || user?.email
      });

      // Auto-copy text with real emojis to clipboard as instant backup safely
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(message).catch(() => {});
      }

      // 4. Meta Cloud API mode with 15s Timeout Protection
      try {
        const clientForFunction = serviceSupabase || supabase;
        const invokePromise = clientForFunction.functions.invoke('send-invoice-whatsapp', {
          body: {
            invoiceId: invoice.id,
            recipientPhone: phoneWithCC,
            message,
            mediaUrl: publicReceiptUrl,
            companyName: compName,
            clientName: clientName,
            invoiceType: 'downpayment'
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

        toast({
          title: "WhatsApp Message Sent ✅",
          description: `Downpayment receipt #${invoice.invoice_number} sent via Meta WhatsApp Gateway.`
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
      console.error('Error sharing downpayment on WhatsApp:', err);
      toast({
        variant: "destructive",
        title: "Sharing Failed",
        description: "Failed to send downpayment receipt. Please try again."
      });
    } finally {
      setUploadingWhatsApp(null);
    }
  };

  const handleShareSMS = (invoice: Invoice) => {
    const phone = invoice.clients?.phone?.replace(/\D/g, '') || '';
    const vehicle = extractVehicleDetails({ notes: invoice.notes });
    const vehicleText = vehicle.model ? ` for ${vehicle.model}` : '';
    const text = encodeURIComponent(
      `Vehicle Booking Downpayment #${invoice.invoice_number}${vehicleText}. Amount: ${currencySymbol}${invoice.total_amount}. Thank you!`
    );
    window.open(`sms:${phone}?body=${text}`, '_blank');
  };

  const handleShareEmail = async (invoice: Invoice) => {
    if (!invoice.clients?.email) {
      toast({
        variant: "destructive",
        title: "Email Missing",
        description: "Customer does not have an email address."
      });
      return;
    }

    toast({
      title: "Preparing Email...",
      description: "Generating PDF link for downpayment receipt..."
    });

    const directPdfUrl = await ensureDownpaymentPdfUrl(invoice);
    const cleanPdfUrl = directPdfUrl 
      ? await createShortReceiptLink(invoice.invoice_number, directPdfUrl, supabase, invoice.id)
      : directPdfUrl;

    const clientName = invoice.clients?.name || 'Customer';
    const compName = companyProfile?.company_name || profile?.company_name || ownerName || 'Our Business';

    const { subject, body } = formatDownpaymentEmail({
      invoiceNumber: invoice.invoice_number,
      clientName: clientName,
      companyName: compName,
      totalAmount: Number(invoice.total_amount || 0),
      currencySymbol,
      issueDate: safelyToLocaleDate(invoice.issue_date),
      status: invoice.status,
      pdfUrl: cleanPdfUrl || undefined,
      companyPhone: companyProfile?.phone || profile?.phone,
      companyEmail: companyProfile?.email || profile?.email || user?.email
    });

    const mailtoUrl = `mailto:${invoice.clients.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };
  const handleViewHistory = async (invoice: Invoice) => {
    setHistoryInvoice(invoice);
    setIsLoadingHistory(true);
    setHistoryDialogOpen(true);
    try {
      const clientToUse = serviceSupabase || supabase;
      const { data } = await (clientToUse as any)
        .from('payments')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('payment_date', { ascending: true });
      setHistoryPayments(data || []);
    } catch (err) {
      console.error("Error loading payment history:", err);
      setHistoryPayments([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDeleteHistoryPayment = async (paymentId: string) => {
    if (!historyInvoice) return;
    try {
      setDeletingPaymentId(paymentId);
      const clientToUse = serviceSupabase || supabase;

      // 1. Delete payment
      const { error: delErr } = await (clientToUse as any)
        .from('payments')
        .delete()
        .eq('id', paymentId);
      if (delErr) throw delErr;

      // 2. Fetch remaining payments for this invoice
      const { data: remainingPayments } = await (clientToUse as any)
        .from('payments')
        .select('*')
        .eq('invoice_id', historyInvoice.id)
        .order('payment_date', { ascending: true });

      const remainingList = remainingPayments || [];
      const remainingTotal = remainingList.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      const totalAmount = Number(historyInvoice.total_amount || 0);

      // 3. Determine new invoice status & metadata
      let newStatus = historyInvoice.status;
      if (remainingTotal >= totalAmount && totalAmount > 0) {
        newStatus = 'paid';
      } else if (remainingTotal > 0) {
        newStatus = 'sent';
      } else {
        newStatus = 'pending';
      }

      let existingMeta: any = {};
      const metaMatch = (historyInvoice.notes || '').match(/\[META:(.*?)\]/);
      if (metaMatch) {
        try { existingMeta = JSON.parse(metaMatch[1]); } catch {}
      }

      if (remainingTotal === 0) {
        if (existingMeta.payment) delete existingMeta.payment;
      } else {
        existingMeta.payment = {
          ...(existingMeta.payment || {}),
          type: remainingTotal >= totalAmount ? 'full' : 'partial',
          total_amount: totalAmount,
          amount_received: remainingTotal,
          balance_pending: Math.max(0, totalAmount - remainingTotal),
        };
        if (existingMeta.payment.finance && remainingTotal < totalAmount) {
          existingMeta.payment.finance.disbursed = false;
        }
      }

      const cleanBase = (historyInvoice.notes || '').replace(/\[META:.*?\]/g, '').trim();
      const updatedNotes = Object.keys(existingMeta).length > 0
        ? `${cleanBase}\n[META:${JSON.stringify(existingMeta)}]`.trim()
        : cleanBase;

      // 4. Update invoice in database
      const { error: invErr } = await (clientToUse as any)
        .from('invoices')
        .update({
          status: newStatus,
          notes: updatedNotes
        })
        .eq('id', historyInvoice.id);

      if (invErr) throw invErr;

      // 5. Update local state
      setHistoryPayments(remainingList);
      setHistoryInvoice({
        ...historyInvoice,
        status: newStatus,
        notes: updatedNotes
      });

      toast({
        title: "Payment Deleted",
        description: `Payment record removed. Invoice status updated to '${newStatus === 'paid' ? 'Paid' : (remainingTotal > 0 ? 'Partial' : 'Pending')}'.`
      });

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (err: any) {
      console.error("Error deleting history payment:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.message || "Failed to delete payment record."
      });
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const handleOpenMarkPaid = async (invoice: Invoice) => {
    setInvoiceToMarkPaid(invoice);
    const vehicle = extractVehicleDetails({ notes: invoice.notes });
    const existingPayment = extractPaymentDetails(invoice);
    const total = Number(invoice.total_amount || 0);

    const clientToUse = serviceSupabase || supabase;
    let paymentsSum = 0;
    try {
      const { data: dbPayments } = await (clientToUse as any)
        .from('payments')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('payment_date', { ascending: true });
      if (dbPayments && dbPayments.length > 0) {
        paymentsSum = dbPayments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      }
    } catch (e) {
      console.warn("Could not fetch payments:", e);
    }

    const effectivePaid = paymentsSum > 0 ? paymentsSum : Number(existingPayment?.amountReceived || 0);
    const effectiveRemaining = Math.max(0, total - effectivePaid);

    setAlreadyPaidAmount(effectivePaid);
    setRemainingBalanceAmount(effectiveRemaining);

    setSelectedPaymentMethod('cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setTransactionRef('');

    const isFinanced = existingPayment?.type === 'finance' || Boolean(existingPayment?.finance);
    const isDisbursed = Boolean(existingPayment?.finance?.disbursed);

    if (effectivePaid > 0 && effectiveRemaining > 0) {
      // In Balance Settlement Mode
      if (isFinanced && !isDisbursed) {
        setBalanceSettleType('finance_disburse');
        setSelectedPaymentMethod('bank_transfer');
        setFinancierName(existingPayment?.finance?.financer || vehicle.financer || 'HDFC Bank');
        setLoanAccountNo(existingPayment?.finance?.loanAccount || '');
      } else {
        setBalanceSettleType('balance_full');
      }
      setInstallmentAmount(String(effectiveRemaining));
      setBalanceDueDate('');
    } else {
      // Fresh Invoice Mode
      setPaymentType('full');
      setPartialAmount(String(Math.round(total * 0.3) || 25000));
      const defaultDp = Math.round(total * 0.2) || 50000;
      setDownpaymentAmount(String(defaultDp));
      setFinancedAmount(String(Math.max(0, total - defaultDp)));
      setFinancierName(vehicle.financer || 'HDFC Bank');
      setCustomFinancier('');
      setFinanceStatus('disbursed');
      setLoanAccountNo('');
    }
    setMarkPaidDialogOpen(true);
  };

  const handleMarkAsPaid = async () => {
    if (!invoiceToMarkPaid) return;
    setIsSubmittingPayment(true);
    try {
      const clientToUse = serviceSupabase || supabase;
      const todayStr = paymentDate || new Date().toISOString().split('T')[0];
      const methodToUse = selectedPaymentMethod || 'cash';
      const effectiveFinancier = financierName === 'other' ? (customFinancier || 'Financier') : financierName;

      const creatorName = isStaff
        ? (staffName || user?.user_metadata?.full_name || 'Staff Member')
        : (companyProfile?.company_name || 'Company Owner');

      const existingNotes = invoiceToMarkPaid.notes || '';
      const existingVehicle = extractVehicleDetails({ notes: existingNotes });
      let existingMeta: any = {};
      const metaMatch = existingNotes.match(/\[META:(.*?)\]/);
      if (metaMatch) {
        try {
          existingMeta = JSON.parse(metaMatch[1]);
        } catch {}
      }

      let newStatus: string = 'paid';
      const paymentRecordsToInsert: any[] = [];
      let summaryToast = '';

      const isSettlingExistingBalance = alreadyPaidAmount > 0 && remainingBalanceAmount > 0;

      if (isSettlingExistingBalance) {
        // =========================================================================
        // CASE A: INVOICE WAS ALREADY PARTIAL / FINANCED — SETTLING REMAINING BALANCE
        // =========================================================================
        if (balanceSettleType === 'balance_full') {
          // Paying 100% of remaining balance
          const amountToClear = remainingBalanceAmount;
          newStatus = 'paid';

          const metaObj = {
            ...existingMeta,
            vehicle: existingVehicle,
            payment: {
              type: 'full',
              total_amount: invoiceToMarkPaid.total_amount,
              amount_received: invoiceToMarkPaid.total_amount,
              balance_pending: 0,
              payment_method: methodToUse,
              reference: transactionRef,
              date: todayStr
            }
          };

          const cleanBase = existingNotes.replace(/\[META:.*?\]/g, '').trim();
          const updatedNotes = `${cleanBase}\n[META:${JSON.stringify(metaObj)}]`.trim();

          const { error: invoiceError } = await (clientToUse as any)
            .from('invoices')
            .update({
              status: 'paid',
              notes: updatedNotes
            })
            .eq('id', invoiceToMarkPaid.id);

          if (invoiceError) throw invoiceError;

          paymentRecordsToInsert.push({
            amount: amountToClear,
            payment_date: todayStr,
            payment_method: methodToUse,
            invoice_id: invoiceToMarkPaid.id,
            user_id: invoiceToMarkPaid.user_id || targetUserId || user?.id,
            reference_number: transactionRef || null,
            notes: `Final balance settlement of ${currencySymbol}${amountToClear} for #${invoiceToMarkPaid.invoice_number} via ${getPaymentMethodLabel(methodToUse)}${transactionRef ? ` (Ref: ${transactionRef})` : ''} • Recorded by: ${creatorName}`
          });

          summaryToast = `Remaining balance of ${currencySymbol}${amountToClear} cleared! Receipt #${invoiceToMarkPaid.invoice_number} marked as Paid in Full.`;

        } else if (balanceSettleType === 'finance_disburse') {
          // Confirming Bank Loan Disbursal
          const loanAmt = remainingBalanceAmount;
          newStatus = 'paid';

          const updatedVehicle = {
            ...existingVehicle,
            financer: effectiveFinancier
          };

          const metaObj = {
            ...existingMeta,
            vehicle: updatedVehicle,
            payment: {
              type: 'finance',
              total_amount: invoiceToMarkPaid.total_amount,
              amount_received: invoiceToMarkPaid.total_amount,
              balance_pending: 0,
              payment_method: methodToUse,
              date: todayStr,
              finance: {
                ...(existingMeta?.payment?.finance || {}),
                downpayment: alreadyPaidAmount,
                financed_amount: loanAmt,
                financer: effectiveFinancier,
                disbursed: true,
                loan_account: loanAccountNo || '',
                disbursal_date: todayStr
              }
            }
          };

          const cleanBase = existingNotes.replace(/\[META:.*?\]/g, '').trim();
          const updatedNotes = `${cleanBase}\n[META:${JSON.stringify(metaObj)}]`.trim();

          const { error: invoiceError } = await (clientToUse as any)
            .from('invoices')
            .update({
              status: 'paid',
              notes: updatedNotes
            })
            .eq('id', invoiceToMarkPaid.id);

          if (invoiceError) throw invoiceError;

          paymentRecordsToInsert.push({
            amount: loanAmt,
            payment_date: todayStr,
            payment_method: methodToUse || 'bank_transfer',
            invoice_id: invoiceToMarkPaid.id,
            user_id: invoiceToMarkPaid.user_id || targetUserId || user?.id,
            reference_number: loanAccountNo || transactionRef || null,
            notes: `Vehicle loan of ${currencySymbol}${loanAmt} disbursed by ${effectiveFinancier} for #${invoiceToMarkPaid.invoice_number}${loanAccountNo ? ` (Loan A/C: ${loanAccountNo})` : ''} • Recorded by: ${creatorName}`
          });

          summaryToast = `Loan of ${currencySymbol}${loanAmt} from ${effectiveFinancier} recorded as Disbursed. Receipt #${invoiceToMarkPaid.invoice_number} is now Paid in Full.`;

        } else if (balanceSettleType === 'balance_partial') {
          // Paying another installment towards the remaining balance
          const thisInstallment = Number(installmentAmount) || 0;
          if (thisInstallment <= 0) {
            throw new Error("Please enter a valid installment amount greater than 0.");
          }
          if (thisInstallment > remainingBalanceAmount) {
            throw new Error(`Installment amount cannot exceed the remaining balance of ${currencySymbol}${remainingBalanceAmount}.`);
          }

          const newTotalReceived = alreadyPaidAmount + thisInstallment;
          const newBalPending = Math.max(0, invoiceToMarkPaid.total_amount - newTotalReceived);
          newStatus = newBalPending === 0 ? 'paid' : 'sent';

          const metaObj = {
            ...existingMeta,
            vehicle: existingVehicle,
            payment: {
              type: newBalPending === 0 ? 'full' : 'partial',
              total_amount: invoiceToMarkPaid.total_amount,
              amount_received: newTotalReceived,
              balance_pending: newBalPending,
              payment_method: methodToUse,
              reference: transactionRef,
              date: todayStr,
              balance_due_date: balanceDueDate || null
            }
          };

          const cleanBase = existingNotes.replace(/\[META:.*?\]/g, '').trim();
          const updatedNotes = `${cleanBase}\n[META:${JSON.stringify(metaObj)}]`.trim();

          const { error: invoiceError } = await (clientToUse as any)
            .from('invoices')
            .update({
              status: newStatus,
              due_date: balanceDueDate || invoiceToMarkPaid.due_date,
              notes: updatedNotes
            })
            .eq('id', invoiceToMarkPaid.id);

          if (invoiceError) throw invoiceError;

          paymentRecordsToInsert.push({
            amount: thisInstallment,
            payment_date: todayStr,
            payment_method: methodToUse,
            invoice_id: invoiceToMarkPaid.id,
            user_id: invoiceToMarkPaid.user_id || targetUserId || user?.id,
            reference_number: transactionRef || null,
            notes: `Part payment of ${currencySymbol}${thisInstallment} received for #${invoiceToMarkPaid.invoice_number}. Total paid: ${currencySymbol}${newTotalReceived}, Balance due: ${currencySymbol}${newBalPending}${transactionRef ? ` (Ref: ${transactionRef})` : ''} • Recorded by: ${creatorName}`
          });

          summaryToast = newBalPending === 0
            ? `Final payment of ${currencySymbol}${thisInstallment} received! Receipt #${invoiceToMarkPaid.invoice_number} marked as Paid in Full.`
            : `Part payment of ${currencySymbol}${thisInstallment} recorded. Total received: ${currencySymbol}${newTotalReceived} (Remaining: ${currencySymbol}${newBalPending}).`;
        }

      } else {
        // =========================================================================
        // CASE B: FRESH INVOICE (No previous payments recorded yet)
        // =========================================================================
        if (paymentType === 'full') {
          newStatus = 'paid';
          const metaObj = {
            ...existingMeta,
            vehicle: existingVehicle,
            payment: {
              type: 'full',
              total_amount: invoiceToMarkPaid.total_amount,
              amount_received: invoiceToMarkPaid.total_amount,
              balance_pending: 0,
              payment_method: methodToUse,
              reference: transactionRef,
              date: todayStr
            }
          };

          const cleanBase = existingNotes.replace(/\[META:.*?\]/g, '').trim();
          const updatedNotes = `${cleanBase}\n[META:${JSON.stringify(metaObj)}]`.trim();

          const { error: invoiceError } = await (clientToUse as any)
            .from('invoices')
            .update({
              status: 'paid',
              notes: updatedNotes
            })
            .eq('id', invoiceToMarkPaid.id);

          if (invoiceError) throw invoiceError;

          paymentRecordsToInsert.push({
            amount: invoiceToMarkPaid.total_amount,
            payment_date: todayStr,
            payment_method: methodToUse,
            invoice_id: invoiceToMarkPaid.id,
            user_id: invoiceToMarkPaid.user_id || targetUserId || user?.id,
            reference_number: transactionRef || null,
            notes: `Full payment for downpayment receipt #${invoiceToMarkPaid.invoice_number} via ${getPaymentMethodLabel(methodToUse)}${transactionRef ? ` (Ref: ${transactionRef})` : ''} • Recorded by: ${creatorName}`
          });

          summaryToast = `Downpayment receipt #${invoiceToMarkPaid.invoice_number} marked as Paid in Full (${currencySymbol}${invoiceToMarkPaid.total_amount}).`;

        } else if (paymentType === 'partial') {
          const amtReceived = Number(partialAmount) || 0;
          if (amtReceived <= 0) {
            throw new Error("Please enter a valid partial amount greater than 0.");
          }
          const balPending = Math.max(0, invoiceToMarkPaid.total_amount - amtReceived);
          newStatus = balPending === 0 ? 'paid' : 'sent';

          const metaObj = {
            ...existingMeta,
            vehicle: existingVehicle,
            payment: {
              type: balPending === 0 ? 'full' : 'partial',
              total_amount: invoiceToMarkPaid.total_amount,
              amount_received: amtReceived,
              balance_pending: balPending,
              payment_method: methodToUse,
              reference: transactionRef,
              date: todayStr,
              balance_due_date: balanceDueDate || null
            }
          };

          const cleanBase = existingNotes.replace(/\[META:.*?\]/g, '').trim();
          const updatedNotes = `${cleanBase}\n[META:${JSON.stringify(metaObj)}]`.trim();

          const { error: invoiceError } = await (clientToUse as any)
            .from('invoices')
            .update({
              status: newStatus,
              due_date: balanceDueDate || invoiceToMarkPaid.due_date,
              notes: updatedNotes
            })
            .eq('id', invoiceToMarkPaid.id);

          if (invoiceError) throw invoiceError;

          paymentRecordsToInsert.push({
            amount: amtReceived,
            payment_date: todayStr,
            payment_method: methodToUse,
            invoice_id: invoiceToMarkPaid.id,
            user_id: invoiceToMarkPaid.user_id || targetUserId || user?.id,
            reference_number: transactionRef || null,
            notes: `Partial payment of ${currencySymbol}${amtReceived} received for downpayment #${invoiceToMarkPaid.invoice_number}. Balance due: ${currencySymbol}${balPending}${transactionRef ? ` (Ref: ${transactionRef})` : ''} • Recorded by: ${creatorName}`
          });

          summaryToast = balPending === 0
            ? `Receipt #${invoiceToMarkPaid.invoice_number} marked as Paid in Full.`
            : `Partial payment of ${currencySymbol}${amtReceived} recorded. Status updated to Partial (Balance: ${currencySymbol}${balPending}).`;

        } else if (paymentType === 'finance') {
          const dpAmt = Number(downpaymentAmount) || 0;
          const loanAmt = Number(financedAmount) || Math.max(0, invoiceToMarkPaid.total_amount - dpAmt);
          const isDisbursed = financeStatus === 'disbursed';

          newStatus = isDisbursed ? 'paid' : 'sent';

          const updatedVehicle = {
            ...existingVehicle,
            financer: effectiveFinancier
          };

          const metaObj = {
            ...existingMeta,
            vehicle: updatedVehicle,
            payment: {
              type: 'finance',
              total_amount: invoiceToMarkPaid.total_amount,
              amount_received: isDisbursed ? invoiceToMarkPaid.total_amount : dpAmt,
              balance_pending: isDisbursed ? 0 : loanAmt,
              payment_method: methodToUse,
              date: todayStr,
              finance: {
                downpayment: dpAmt,
                financed_amount: loanAmt,
                financer: effectiveFinancier,
                disbursed: isDisbursed,
                loan_account: loanAccountNo || '',
                disbursal_date: isDisbursed ? todayStr : undefined
              }
            }
          };

          const cleanBase = existingNotes.replace(/\[META:.*?\]/g, '').trim();
          const updatedNotes = `${cleanBase}\n[META:${JSON.stringify(metaObj)}]`.trim();

          const { error: invoiceError } = await (clientToUse as any)
            .from('invoices')
            .update({
              status: newStatus,
              notes: updatedNotes
            })
            .eq('id', invoiceToMarkPaid.id);

          if (invoiceError) throw invoiceError;

          if (dpAmt > 0) {
            paymentRecordsToInsert.push({
              amount: dpAmt,
              payment_date: todayStr,
              payment_method: methodToUse,
              invoice_id: invoiceToMarkPaid.id,
              user_id: invoiceToMarkPaid.user_id || targetUserId || user?.id,
              reference_number: transactionRef || null,
              notes: `Customer Downpayment/Margin money of ${currencySymbol}${dpAmt} for #${invoiceToMarkPaid.invoice_number} via ${getPaymentMethodLabel(methodToUse)}${transactionRef ? ` (Ref: ${transactionRef})` : ''} • Recorded by: ${creatorName}`
            });
          }

          if (isDisbursed && loanAmt > 0) {
            paymentRecordsToInsert.push({
              amount: loanAmt,
              payment_date: todayStr,
              payment_method: 'bank_transfer',
              invoice_id: invoiceToMarkPaid.id,
              user_id: invoiceToMarkPaid.user_id || targetUserId || user?.id,
              reference_number: loanAccountNo || null,
              notes: `Vehicle loan disbursed by ${effectiveFinancier} for #${invoiceToMarkPaid.invoice_number}${loanAccountNo ? ` (Loan A/C: ${loanAccountNo})` : ''}`
            });
          }

          summaryToast = isDisbursed
            ? `Downpayment + Financed balance received! Status marked as Paid (Financier: ${effectiveFinancier}).`
            : `Downpayment of ${currencySymbol}${dpAmt} received. Status updated to Partial (Finance pending with ${effectiveFinancier}).`;
        }
      }

      if (paymentRecordsToInsert.length > 0) {
        // Clean up previous payments for this invoice to prevent duplicate stacking
        await (clientToUse as any)
          .from('payments')
          .delete()
          .eq('invoice_id', invoiceToMarkPaid.id);

        const { error: payError } = await (clientToUse as any).from('payments').insert(paymentRecordsToInsert);
        if (payError) throw payError;
      }

      toast({
        title: "Payment Recorded Successfully",
        description: summaryToast
      });

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setMarkPaidDialogOpen(false);
      setInvoiceToMarkPaid(null);
    } catch (err: any) {
      console.error("Error marking paid:", err);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: err?.message || "Failed to update payment status."
      });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const deleteInvoice = (id: string, invoiceNumber: string, status: string) => {
    setInvoiceToDelete({ id, invoiceNumber, status });
    setDeleteConfirmationOpen(true);
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      const clientToUse = serviceSupabase || supabase;
      const { data: items } = await (clientToUse as any)
        .from('invoice_items')
        .select('product_id, quantity')
        .eq('invoice_id', invoiceToDelete.id);

      if (items && (items as any[]).length > 0) {
        for (const item of (items as any[])) {
          if (item.product_id && item.quantity > 0) {
            await adjustStock(item.product_id, item.quantity);
          }
        }
      }

      await (clientToUse as any)
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceToDelete.id);

      const { error } = await (clientToUse as any)
        .from('invoices')
        .delete()
        .eq('id', invoiceToDelete.id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: `Downpayment receipt #${invoiceToDelete.invoiceNumber} deleted.`
      });

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (err) {
      console.error("Error deleting downpayment invoice:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete downpayment receipt."
      });
    } finally {
      setDeleteConfirmationOpen(false);
      setInvoiceToDelete(null);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl md:text-3xl font-extrabold text-foreground flex items-center gap-2">
              <Car className="w-6 h-6 md:w-8 md:h-8 text-amber-500" />
              Downpayment Invoices
            </h1>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold text-xs">
              Automobile Dealership
            </Badge>
            <StaffHeaderBadge />
          </div>
          <p className="text-xs md:text-base text-muted-foreground mt-1">
            Vehicle booking advances, token receipts, and downpayment records
          </p>
        </div>
        <Button
          variant="default"
          size="lg"
          onClick={() => navigate('/create-downpayment')}
          className="w-full sm:w-auto h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span className="text-sm md:text-base">Create Downpayment Invoice</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <DownpaymentFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Invoices List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 md:p-6 rounded-xl border-border bg-card">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 rounded" />
                  <Skeleton className="h-4 w-48 rounded" />
                </div>
                <Skeleton className="h-6 w-24 rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <Card className="p-8 md:p-12 text-center bg-card dark:bg-card border-dashed rounded-2xl">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">No Downpayment Invoices Found</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-md mx-auto">
            {totalCount === 0
              ? "Create vehicle booking advance receipts with vehicle number, chassis, and financer details."
              : "No downpayment receipts match your search criteria."}
          </p>
          {totalCount === 0 && (
            <Button
              variant="default"
              onClick={() => navigate('/create-downpayment')}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-11 px-6 shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Downpayment Receipt
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {invoices.map((invoice) => (
            <DownpaymentCardItem
              key={invoice.id}
              invoice={invoice}
              formatAmount={formatAmount}
              getCreatorTag={getCreatorTag}
              handlePreviewInvoice={handlePreviewInvoice}
              handleDownloadPDF={handleDownloadPDF}
              handleShareWhatsApp={handleShareWhatsApp}
              handleShareEmail={handleShareEmail}
              handleShareSMS={handleShareSMS}
              handlePrint={handlePrint}
              handleOpenMarkPaid={handleOpenMarkPaid}
              handleViewHistory={handleViewHistory}
              deleteInvoice={deleteInvoice}
              downloadingPDFId={downloadingPDFId}
              uploadingWhatsApp={uploadingWhatsApp}
              navigate={navigate}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <DataTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        entityName="downpayment invoices"
        isLoading={loading}
      />

      {/* Preview Dialog */}
      {previewInvoice && (
        <InvoicePreview
          invoice={previewInvoice}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmation
        isOpen={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
        onConfirm={confirmDelete}
        title="Delete Downpayment Receipt"
        description={`Are you sure you want to delete downpayment receipt #${invoiceToDelete?.invoiceNumber}? This action cannot be undone.`}
      />

      {/* Enhanced Downpayment Settlement Modal */}
      {/* Enhanced Downpayment Settlement Modal */}
      <DownpaymentSettlementDialog
        open={markPaidDialogOpen}
        onOpenChange={setMarkPaidDialogOpen}
        invoiceToMarkPaid={invoiceToMarkPaid}
        formatAmount={formatAmount}
        currencySymbol={currencySymbol}
        alreadyPaidAmount={alreadyPaidAmount}
        remainingBalanceAmount={remainingBalanceAmount}
        balanceSettleType={balanceSettleType}
        setBalanceSettleType={setBalanceSettleType}
        installmentAmount={installmentAmount}
        setInstallmentAmount={setInstallmentAmount}
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        selectedPaymentMethod={selectedPaymentMethod}
        setSelectedPaymentMethod={setSelectedPaymentMethod}
        paymentDate={paymentDate}
        setPaymentDate={setPaymentDate}
        transactionRef={transactionRef}
        setTransactionRef={setTransactionRef}
        partialAmount={partialAmount}
        setPartialAmount={setPartialAmount}
        balanceDueDate={balanceDueDate}
        setBalanceDueDate={setBalanceDueDate}
        downpaymentAmount={downpaymentAmount}
        setDownpaymentAmount={setDownpaymentAmount}
        financierName={financierName}
        setFinancierName={setFinancierName}
        customFinancier={customFinancier}
        setCustomFinancier={setCustomFinancier}
        financedAmount={financedAmount}
        setFinancedAmount={setFinancedAmount}
        financeStatus={financeStatus}
        setFinanceStatus={setFinanceStatus}
        loanAccountNo={loanAccountNo}
        setLoanAccountNo={setLoanAccountNo}
        isSubmittingPayment={isSubmittingPayment}
        handleMarkAsPaid={handleMarkAsPaid}
      />

      {/* Payment History / Ledger Modal */}
      {/* Payment History / Ledger Modal */}
      <DownpaymentHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        historyInvoice={historyInvoice}
        historyPayments={historyPayments}
        isLoadingHistory={isLoadingHistory}
        deletingPaymentId={deletingPaymentId}
        formatAmount={formatAmount}
        handleDeleteHistoryPayment={handleDeleteHistoryPayment}
        handleOpenMarkPaid={handleOpenMarkPaid}
      />
    </div>
  );
}
