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
  Smartphone, Car, CheckCircle2, Coins, Landmark
} from "lucide-react";
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
import { useQueryClient } from "@tanstack/react-query";
import { Invoice } from "@/types/invoice";
import {
  fetchFullInvoiceData,
  formatCompanyData,
  formatInvoiceData,
  formatClientData
} from "@/utils/invoice-service";

const getPaymentMethodLabel = (method: string | null | undefined): string => {
  switch (method) {
    case 'cash': return 'Cash';
    case 'upi': return 'UPI / Online';
    case 'bank_transfer': return 'Bank Transfer';
    case 'cheque': return 'Cheque';
    case 'card': return 'Debit / Credit Card';
    default: return method ? method.toUpperCase() : 'Cash';
  }
};

export default function DownpaymentInvoices() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, effectiveUserId, companyProfile, profile, ownerName, isStaff, staffName } = useAuth();
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const { data, isLoading: queryLoading, isPending, isFetching: searchLoading } = useInvoices({
    page: currentPage,
    pageSize,
    searchTerm: debouncedSearch,
    statusFilter,
    typeFilter: 'downpayment'
  });

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
      const companyDataForUtils = formatCompanyData(userProf, user?.email || "");

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

      const blob = await generateInvoicePDFBlob(
        invoiceData,
        clientDataForUtils,
        formattedItems,
        companyDataForUtils,
        'auto_dealership',
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
      const companyDataForUtils = formatCompanyData(userProf, user?.email || "");

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

      const html = await generateInvoiceHTML(
        invoiceData,
        clientDataForUtils,
        formattedItems,
        companyDataForUtils,
        'auto_dealership',
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

  const handleShareWhatsApp = async (invoice: Invoice) => {
    const rawPhone = invoice.clients?.phone || '';
    const digitsOnly = rawPhone.replace(/\D/g, '');
    let phoneWithCC = digitsOnly;
    if (rawPhone.trim().startsWith('+')) {
      phoneWithCC = digitsOnly;
    } else if (digitsOnly.length === 10) {
      phoneWithCC = `91${digitsOnly}`;
    }

    const vehicle = extractVehicleDetails(invoice);
    const vehicleText = vehicle.model ? `\n🚗 Vehicle: ${vehicle.model}` : '';
    const chassisText = vehicle.chassisNo ? `\n🔢 Chassis/VIN: ${vehicle.chassisNo}` : '';
    const companyName = companyProfile?.company_name || profile?.company_name || ownerName || 'Our Dealership';

    const message = [
      `Hello ${invoice.clients?.name || 'Customer'},`,
      ``,
      `Here is your vehicle booking downpayment receipt from *${companyName}*:`,
      ``,
      `📄 Receipt No: #${invoice.invoice_number}`,
      `💰 Amount: ${currencySymbol}${Number(invoice.total_amount || 0).toLocaleString('en-IN')}`,
      `📌 Status: ${invoice.status.toUpperCase()}`,
      `${vehicleText}${chassisText}`,
      ``,
      `Thank you for booking with us!`,
      `_Powered by ESCROW BILL_`
    ].filter(Boolean).join('\n');

    // Check user settings for whatsapp_provider
    let provider = 'meta';
    try {
      const clientToUse = (serviceSupabase || supabase) as any;
      const ownerId = (invoice as any)?.user_id || targetUserId;
      const { data: settings } = await clientToUse
        .from('user_settings')
        .select('whatsapp_provider')
        .eq('user_id', ownerId)
        .maybeSingle();
      if (settings?.whatsapp_provider) {
        provider = settings.whatsapp_provider;
      }
    } catch (e) {
      // fallback
    }

    // 1. Personal WhatsApp Mode: Direct Open
    if (provider === 'personal') {
      const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCC}&text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
      return;
    }

    // 2. WhatsApp Cloud API / Edge Function Mode
    try {
      toast({
        title: "Sending via WhatsApp API...",
        description: `Delivering downpayment receipt #${invoice.invoice_number} to ${phoneWithCC || 'customer'}...`
      });

      const { error: cloudApiError } = await (serviceSupabase || supabase).functions.invoke('send-invoice-whatsapp', {
        body: {
          invoiceId: invoice.id,
          recipientPhone: phoneWithCC,
          message,
          companyName,
          clientName: invoice.clients?.name || 'Customer'
        }
      });

      if (cloudApiError) throw cloudApiError;

      toast({
        title: "WhatsApp Message Sent ✅",
        description: `Downpayment receipt #${invoice.invoice_number} delivered successfully via WhatsApp API.`
      });
    } catch (apiErr) {
      console.warn('WhatsApp API send failed, opening personal WhatsApp fallback:', apiErr);
      toast({
        title: "WhatsApp Cloud API Notice",
        description: "API delivery could not be completed. Opening WhatsApp directly...",
      });
      const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCC}&text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
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

  const handleOpenMarkPaid = (invoice: Invoice) => {
    setInvoiceToMarkPaid(invoice);
    const vehicle = extractVehicleDetails({ notes: invoice.notes });
    const existingPayment = extractPaymentDetails(invoice);
    const total = Number(invoice.total_amount || 0);

    if (existingPayment) {
      setPaymentType(existingPayment.type);
      setSelectedPaymentMethod(existingPayment.paymentMethod || 'cash');
      setTransactionRef(existingPayment.reference || '');
      setPaymentDate(existingPayment.date || new Date().toISOString().split('T')[0]);
      if (existingPayment.type === 'partial') {
        setPartialAmount(String(existingPayment.amountReceived || Math.round(total * 0.5)));
      } else if (existingPayment.type === 'finance' && existingPayment.finance) {
        setDownpaymentAmount(String(existingPayment.finance.downpayment || Math.round(total * 0.2)));
        setFinancierName(existingPayment.finance.financer || 'HDFC Bank');
        setFinancedAmount(String(existingPayment.finance.financedAmount || (total - (existingPayment.finance.downpayment || 0))));
        setFinanceStatus(existingPayment.finance.disbursed ? 'disbursed' : 'pending');
        setLoanAccountNo(existingPayment.finance.loanAccount || '');
      }
    } else {
      setPaymentType('full');
      setSelectedPaymentMethod('cash');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setTransactionRef('');
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
            payment_date: todayStr,
            notes: updatedNotes
          })
          .eq('id', invoiceToMarkPaid.id);

        if (invoiceError) throw invoiceError;

        paymentRecordsToInsert.push({
          amount: invoiceToMarkPaid.total_amount,
          payment_date: todayStr,
          payment_method: methodToUse,
          invoice_id: invoiceToMarkPaid.id,
          user_id: targetUserId,
          notes: `Full payment for downpayment receipt #${invoiceToMarkPaid.invoice_number} via ${getPaymentMethodLabel(methodToUse)}${transactionRef ? ` (Ref: ${transactionRef})` : ''} • Recorded by: ${creatorName}`
        });

        summaryToast = `Downpayment receipt #${invoiceToMarkPaid.invoice_number} marked as Paid in Full (${currencySymbol}${invoiceToMarkPaid.total_amount}).`;

      } else if (paymentType === 'partial') {
        const amtReceived = Number(partialAmount) || 0;
        const balPending = Math.max(0, invoiceToMarkPaid.total_amount - amtReceived);
        newStatus = 'sent';

        const metaObj = {
          ...existingMeta,
          vehicle: existingVehicle,
          payment: {
            type: 'partial',
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
            status: 'sent',
            payment_date: todayStr,
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
          user_id: targetUserId,
          notes: `Partial payment of ${currencySymbol}${amtReceived} received for downpayment #${invoiceToMarkPaid.invoice_number}. Balance due: ${currencySymbol}${balPending}${transactionRef ? ` (Ref: ${transactionRef})` : ''} • Recorded by: ${creatorName}`
        });

        summaryToast = `Partial payment of ${currencySymbol}${amtReceived} recorded. Status updated to Partial (Balance: ${currencySymbol}${balPending}).`;

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
              loan_account: loanAccountNo || ''
            }
          }
        };

        const cleanBase = existingNotes.replace(/\[META:.*?\]/g, '').trim();
        const updatedNotes = `${cleanBase}\n[META:${JSON.stringify(metaObj)}]`.trim();

        const { error: invoiceError } = await (clientToUse as any)
          .from('invoices')
          .update({
            status: newStatus,
            payment_date: todayStr,
            notes: updatedNotes
          })
          .eq('id', invoiceToMarkPaid.id);

        if (invoiceError) throw invoiceError;

        paymentRecordsToInsert.push({
          amount: dpAmt,
          payment_date: todayStr,
          payment_method: methodToUse,
          invoice_id: invoiceToMarkPaid.id,
          user_id: targetUserId,
          notes: `Customer Downpayment/Margin money of ${currencySymbol}${dpAmt} for #${invoiceToMarkPaid.invoice_number} via ${getPaymentMethodLabel(methodToUse)} • Recorded by: ${creatorName}`
        });

        if (isDisbursed && loanAmt > 0) {
          paymentRecordsToInsert.push({
            amount: loanAmt,
            payment_date: todayStr,
            payment_method: 'bank_transfer',
            invoice_id: invoiceToMarkPaid.id,
            user_id: targetUserId,
            notes: `Vehicle loan disbursed by ${effectiveFinancier} for #${invoiceToMarkPaid.invoice_number}${loanAccountNo ? ` (Loan A/C: ${loanAccountNo})` : ''}`
          });
        }

        summaryToast = isDisbursed
          ? `Downpayment + Financed balance received! Status marked as Paid (Financier: ${effectiveFinancier}).`
          : `Downpayment of ${currencySymbol}${dpAmt} received. Status updated to Partial (Finance pending with ${effectiveFinancier}).`;
      }

      if (paymentRecordsToInsert.length > 0) {
        await (clientToUse as any).from('payments').insert(paymentRecordsToInsert);
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
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by DP number, customer name, vehicle model..."
            className="pl-10 h-11 bg-background border-border/50 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 bg-background border-border/50 rounded-xl">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
              ? "Create vehicle booking advance receipts with chassis, engine, and financer details."
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
          {invoices.map((invoice) => {
            const vehicle = extractVehicleDetails({ notes: invoice.notes });
            const paymentDetails = extractPaymentDetails(invoice);

            return (
              <Card key={invoice.id} className="p-4 md:p-6 rounded-xl border-border bg-card shadow-xs hover:border-amber-500/40 transition-all">
                {/* Mobile View */}
                <div className="md:hidden space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground">{invoice.invoice_number}</span>
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] font-bold py-0 px-1.5 flex items-center gap-1">
                          <Car className="w-3 h-3" /> Advance
                        </Badge>
                        <StatusBadge status={invoice.status} dueDate={invoice.due_date} notes={invoice.notes} />
                      </div>
                      <p className="text-sm font-semibold text-foreground mt-1">{invoice.clients?.name || 'Walk-in Customer'}</p>
                      {vehicle.model && (
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mt-0.5">
                          🚗 {vehicle.model}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {safelyToLocaleDate(invoice.issue_date)} • {getCreatorTag(invoice.payment_terms)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-extrabold text-foreground">{formatAmount(invoice.total_amount)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{invoice.currency}</p>
                      {paymentDetails?.type === 'partial' && (
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                          Paid: {formatAmount(paymentDetails.amountReceived)}
                        </p>
                      )}
                      {paymentDetails?.type === 'finance' && (
                        <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                          DP: {formatAmount(paymentDetails.finance?.downpayment || 0)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Details Pill Box */}
                  {(vehicle.chassisNo || vehicle.engineNo || vehicle.color || vehicle.financer) && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-muted/40 rounded-lg text-[11px] text-muted-foreground">
                      {vehicle.chassisNo && <span><strong>VIN:</strong> {vehicle.chassisNo}</span>}
                      {vehicle.engineNo && <span>• <strong>Eng:</strong> {vehicle.engineNo}</span>}
                      {vehicle.color && <span>• <strong>Color:</strong> {vehicle.color}</span>}
                      {vehicle.financer && <span>• <strong>Financer:</strong> {vehicle.financer}</span>}
                    </div>
                  )}

                  {/* Payment Details Pill if Partial or Finance */}
                  {paymentDetails && (
                    <div className="p-2 bg-muted/30 rounded-lg text-xs space-y-0.5 border border-border/50">
                      {paymentDetails.type === 'partial' && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-blue-700 dark:text-blue-300 font-semibold">Token Paid: {formatAmount(paymentDetails.amountReceived)}</span>
                          <span className="text-rose-600 dark:text-rose-400 font-bold">Balance: {formatAmount(paymentDetails.balancePending)}</span>
                        </div>
                      )}
                      {paymentDetails.type === 'finance' && paymentDetails.finance && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-indigo-700 dark:text-indigo-300 font-semibold">Margin DP: {formatAmount(paymentDetails.finance.downpayment)}</span>
                          <span className="text-foreground font-medium">Loan: {formatAmount(paymentDetails.finance.financedAmount)} ({paymentDetails.finance.financer})</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/50">
                    <Button variant="outline" size="sm" onClick={() => handlePreviewInvoice(invoice)} className="h-9">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleShareWhatsApp(invoice)} className="h-9 text-emerald-600">
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(invoice)} className="h-9">
                      <Download className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePrint(invoice)}>
                          <Printer className="mr-2 h-4 w-4" /> Print
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShareSMS(invoice)}>
                          <Smartphone className="mr-2 h-4 w-4" /> SMS
                        </DropdownMenuItem>
                        {invoice.status !== 'paid' && (
                          <>
                            <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}/edit?type=downpayment`)}>
                              <Pencil className="mr-2 h-4 w-4 text-amber-600" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenMarkPaid(invoice)} className="text-emerald-600 font-semibold">
                              <CreditCard className="mr-2 h-4 w-4" /> Record Payment / Settle
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => deleteInvoice(invoice.id, invoice.invoice_number, invoice.status)} className="text-destructive font-semibold">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Desktop View */}
                <div className="hidden md:flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base lg:text-lg font-bold text-foreground">{invoice.invoice_number}</h3>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold text-xs flex items-center gap-1">
                        <Car className="w-3.5 h-3.5" /> Downpayment
                      </Badge>
                      <StatusBadge status={invoice.status} dueDate={invoice.due_date} notes={invoice.notes} />
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{invoice.clients?.name || 'Walk-in Customer'}</p>
                      {invoice.clients?.phone && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {invoice.clients.phone}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        • {safelyToLocaleDate(invoice.issue_date)}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70">
                        • {getCreatorTag(invoice.payment_terms)}
                      </span>
                    </div>

                    {/* Vehicle Details Badges */}
                    {vehicle.model && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold rounded-md border border-amber-500/20">
                          🚗 {vehicle.model}
                        </span>
                        {vehicle.chassisNo && (
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-md font-mono text-[11px]">
                            VIN: {vehicle.chassisNo}
                          </span>
                        )}
                        {vehicle.engineNo && (
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-md font-mono text-[11px]">
                            Eng: {vehicle.engineNo}
                          </span>
                        )}
                        {vehicle.color && (
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-md text-[11px]">
                            Color: {vehicle.color}
                          </span>
                        )}
                        {vehicle.financer && (
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-md text-[11px]">
                            Financer: {vehicle.financer}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Payment Settlement Badges (Partial or Financed) */}
                    {paymentDetails && (
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs">
                        {paymentDetails.type === 'partial' && (
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold rounded-md border border-blue-500/20 text-[11px]">
                            💰 Paid: {formatAmount(paymentDetails.amountReceived)} • Pending Due: {formatAmount(paymentDetails.balancePending)}
                          </span>
                        )}
                        {paymentDetails.type === 'finance' && paymentDetails.finance && (
                          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold rounded-md border border-indigo-500/20 text-[11px]">
                            🏦 Margin DP: {formatAmount(paymentDetails.finance.downpayment)} | Loan: {formatAmount(paymentDetails.finance.financedAmount)} ({paymentDetails.finance.financer}) • {paymentDetails.finance.disbursed ? 'Loan Disbursed' : 'Disbursal In-Process'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right side Amount + Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right mr-2">
                      <p className="text-base lg:text-lg font-extrabold text-foreground">{formatAmount(invoice.total_amount)}</p>
                      <p className="text-xs text-muted-foreground uppercase">{invoice.currency}</p>
                      {paymentDetails?.type === 'partial' && (
                        <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                          Paid: {formatAmount(paymentDetails.amountReceived)}
                        </p>
                      )}
                      {paymentDetails?.type === 'finance' && (
                        <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                          DP: {formatAmount(paymentDetails.finance?.downpayment || 0)}
                        </p>
                      )}
                    </div>

                    <Button variant="outline" size="sm" onClick={() => handlePreviewInvoice(invoice)} title="Preview Receipt" className="h-9 w-9 p-0">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleShareWhatsApp(invoice)} title="Share WhatsApp" className="h-9 w-9 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(invoice)} disabled={downloadingPDFId === invoice.id} title="Download PDF" className="h-9 w-9 p-0">
                      {downloadingPDFId === invoice.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    </Button>
                    {invoice.status !== 'paid' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/invoices/${invoice.id}/edit?type=downpayment`)} title="Edit Receipt" className="h-9 w-9 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenMarkPaid(invoice)}
                          title="Record Payment / Settle"
                          className="h-9 px-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" /> Settle
                        </Button>
                      </>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePrint(invoice)}>
                          <Printer className="mr-2 h-4 w-4" /> Print
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShareSMS(invoice)}>
                          <Smartphone className="mr-2 h-4 w-4" /> Share SMS
                        </DropdownMenuItem>
                        {invoice.status !== 'paid' && (
                          <DropdownMenuItem onClick={() => handleOpenMarkPaid(invoice)} className="text-emerald-600 font-semibold">
                            <CreditCard className="mr-2 h-4 w-4" /> Record Payment / Settle
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => deleteInvoice(invoice.id, invoice.invoice_number, invoice.status)} className="text-destructive font-semibold">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            );
          })}
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
      <Dialog open={markPaidDialogOpen} onOpenChange={setMarkPaidDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Record Payment / Downpayment Settlement</DialogTitle>
                <DialogDescription className="text-xs">
                  Receipt #{invoiceToMarkPaid?.invoice_number} • Total Booking: {invoiceToMarkPaid ? formatAmount(invoiceToMarkPaid.total_amount) : ''}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {invoiceToMarkPaid && (() => {
            const vehicle = extractVehicleDetails({ notes: invoiceToMarkPaid.notes });
            const total = Number(invoiceToMarkPaid.total_amount || 0);
            const pAmt = Number(partialAmount) || 0;
            const pBalance = Math.max(0, total - pAmt);
            const dp = Number(downpaymentAmount) || 0;
            const loan = Number(financedAmount) || Math.max(0, total - dp);

            return (
              <div className="space-y-4 py-2 text-sm">
                {/* Vehicle & Customer Summary Strip */}
                <div className="p-3 bg-muted/60 rounded-xl flex flex-wrap justify-between items-center gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Customer</span>
                    <span className="font-bold text-foreground text-sm">{invoiceToMarkPaid.clients?.name || 'Walk-in Customer'}</span>
                  </div>
                  {vehicle.model && (
                    <div className="text-center sm:text-left">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Booked Vehicle</span>
                      <span className="font-bold text-foreground">🚗 {vehicle.model}</span>
                    </div>
                  )}
                  <div className="text-right">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Invoice Total</span>
                    <span className="text-base font-black text-foreground">{formatAmount(total)}</span>
                  </div>
                </div>

                {/* Settlement Type Selector: 3 Cards */}
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Select Settlement Mode
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Full Payment Card */}
                    <button
                      type="button"
                      onClick={() => setPaymentType('full')}
                      className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                        paymentType === 'full'
                          ? 'border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                          : 'border-border hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <CheckCircle2 className={`w-4 h-4 ${paymentType === 'full' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                        <Badge variant="outline" className="text-[9px] font-bold uppercase">Status: Paid</Badge>
                      </div>
                      <p className="font-bold text-xs">Full Payment</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">100% amount received now</p>
                    </button>

                    {/* Partial Advance Card */}
                    <button
                      type="button"
                      onClick={() => setPaymentType('partial')}
                      className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                        paymentType === 'partial'
                          ? 'border-blue-600 bg-blue-500/10 text-blue-950 dark:text-blue-300 ring-2 ring-blue-500/20'
                          : 'border-border hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Coins className={`w-4 h-4 ${paymentType === 'partial' ? 'text-blue-600' : 'text-muted-foreground'}`} />
                        <Badge variant="outline" className="text-[9px] font-bold uppercase">Status: Partial</Badge>
                      </div>
                      <p className="font-bold text-xs">Partial / Token</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Token paid, balance pending</p>
                    </button>

                    {/* Downpayment + Finance Card */}
                    <button
                      type="button"
                      onClick={() => setPaymentType('finance')}
                      className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                        paymentType === 'finance'
                          ? 'border-indigo-600 bg-indigo-500/10 text-indigo-950 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                          : 'border-border hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Landmark className={`w-4 h-4 ${paymentType === 'finance' ? 'text-indigo-600' : 'text-muted-foreground'}`} />
                        <Badge variant="outline" className="text-[9px] font-bold uppercase">Auto Finance</Badge>
                      </div>
                      <p className="font-bold text-xs">Downpayment + Loan</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Margin money + bank finance</p>
                    </button>
                  </div>
                </div>

                {/* 1. FULL PAYMENT FIELDS */}
                {paymentType === 'full' && (
                  <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Amount to Clear:</span>
                      <span className="font-extrabold text-base text-emerald-700 dark:text-emerald-400">{formatAmount(total)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Marking as full payment will clear the receipt balance and set the status to <strong className="text-emerald-600">PAID</strong>.
                    </p>
                  </div>
                )}

                {/* 2. PARTIAL PAYMENT FIELDS */}
                {paymentType === 'partial' && (
                  <div className="p-3.5 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-semibold">Amount Received Now ({currencySymbol})</Label>
                        <span className="text-[11px] text-muted-foreground">Total Booking: {formatAmount(total)}</span>
                      </div>
                      <Input
                        type="number"
                        placeholder="Enter amount paid"
                        value={partialAmount}
                        onChange={(e) => setPartialAmount(e.target.value)}
                        className="font-bold text-base"
                      />
                    </div>

                    {/* Quick Percentage Chips */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-muted-foreground">Quick set:</span>
                      {[0.2, 0.3, 0.5, 0.75].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setPartialAmount(String(Math.round(total * pct)))}
                          className="px-2 py-0.5 bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary rounded text-[10px] font-semibold transition-colors"
                        >
                          {pct * 100}% ({formatAmount(Math.round(total * pct))})
                        </button>
                      ))}
                    </div>

                    {/* Dynamic Balance Calculation Banner */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Received Now:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{formatAmount(pAmt)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground block text-[10px]">Remaining Balance:</span>
                        <span className="font-black text-rose-600 dark:text-rose-400 text-sm">{formatAmount(pBalance)}</span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <Label className="text-xs font-semibold">Balance Due Date (Optional)</Label>
                      <Input
                        type="date"
                        value={balanceDueDate}
                        onChange={(e) => setBalanceDueDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* 3. DOWNPAYMENT + FINANCE FIELDS */}
                {paymentType === 'finance' && (
                  <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Customer Downpayment ({currencySymbol})</Label>
                        <Input
                          type="number"
                          placeholder="e.g. 50000"
                          value={downpaymentAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDownpaymentAmount(val);
                            setFinancedAmount(String(Math.max(0, total - (Number(val) || 0))));
                          }}
                          className="font-bold"
                        />
                        <span className="text-[10px] text-muted-foreground">Paid upfront by customer</span>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Financed / Loan Amount ({currencySymbol})</Label>
                        <Input
                          type="number"
                          placeholder="e.g. 450000"
                          value={financedAmount}
                          onChange={(e) => setFinancedAmount(e.target.value)}
                          className="font-bold"
                        />
                        <span className="text-[10px] text-muted-foreground">Funded by bank / NBFC</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Financier / Bank</Label>
                        <Select value={financierName} onValueChange={setFinancierName}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Bank" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HDFC Bank">HDFC Bank</SelectItem>
                            <SelectItem value="State Bank of India (SBI)">State Bank of India (SBI)</SelectItem>
                            <SelectItem value="ICICI Bank">ICICI Bank</SelectItem>
                            <SelectItem value="Kotak Mahindra Prime">Kotak Mahindra Prime</SelectItem>
                            <SelectItem value="Axis Bank">Axis Bank</SelectItem>
                            <SelectItem value="Bajaj Auto Finance">Bajaj Auto Finance</SelectItem>
                            <SelectItem value="Cholamandalam (Chola)">Cholamandalam (Chola)</SelectItem>
                            <SelectItem value="Tata Capital">Tata Capital</SelectItem>
                            <SelectItem value="IndusInd Bank">IndusInd Bank</SelectItem>
                            <SelectItem value="Mahindra Finance">Mahindra Finance</SelectItem>
                            <SelectItem value="other">Other / Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {financierName === 'other' ? (
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Enter Financier Name</Label>
                          <Input
                            placeholder="Bank / Financier Name"
                            value={customFinancier}
                            onChange={(e) => setCustomFinancier(e.target.value)}
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Loan App / Account No (Optional)</Label>
                          <Input
                            placeholder="e.g. LN-8291048"
                            value={loanAccountNo}
                            onChange={(e) => setLoanAccountNo(e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Disbursal State Radio Switch */}
                    <div className="pt-2 border-t border-border/50">
                      <Label className="text-xs font-semibold block mb-1.5">Bank Loan Disbursal Status</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFinanceStatus('disbursed')}
                          className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                            financeStatus === 'disbursed'
                              ? 'border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 font-bold'
                              : 'border-border hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Loan Disbursed & Received</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-normal block mt-0.5">
                            Status updates to <strong>PAID</strong> (100% Cleared)
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFinanceStatus('pending')}
                          className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                            financeStatus === 'pending'
                              ? 'border-amber-600 bg-amber-500/10 text-amber-950 dark:text-amber-300 font-bold'
                              : 'border-border hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>Sanctioned / Pending Disbursal</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-normal block mt-0.5">
                            Status updates to <strong>PARTIAL</strong> (DP cleared)
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* COMMON PAYMENT DETAILS (Method, Ref, Date) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">
                      {paymentType === 'finance' ? "Downpayment Mode" : "Payment Method"}
                    </Label>
                    <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI / Online Transfer</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</SelectItem>
                        <SelectItem value="cheque">Cheque / Demand Draft</SelectItem>
                        <SelectItem value="card">Debit / Credit Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Payment Date</Label>
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Transaction / Reference Number (Optional)</Label>
                  <Input
                    placeholder="e.g. UPI txn ID, Cheque number, Bank UTR..."
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                  />
                </div>
              </div>
            );
          })()}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button variant="outline" onClick={() => setMarkPaidDialogOpen(false)} disabled={isSubmittingPayment}>
              Cancel
            </Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={isSubmittingPayment}
              className={`font-semibold text-white ${
                paymentType === 'partial'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : paymentType === 'finance' && financeStatus === 'pending'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isSubmittingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Payment...
                </>
              ) : paymentType === 'partial' ? (
                `Record Partial Payment (${currencySymbol}${partialAmount})`
              ) : paymentType === 'finance' ? (
                financeStatus === 'disbursed' ? "Confirm Disbursed & Mark Paid" : "Record DP & Set Finance In-Process"
              ) : (
                "Confirm Full Payment (Mark Paid)"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
