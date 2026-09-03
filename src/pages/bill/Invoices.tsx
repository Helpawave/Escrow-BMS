import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
} from "@/components/ui/dropdown-menu";
import { FileText, Plus, Search, Filter, Download, Trash2, Printer, Mail, MoreVertical, Eye, Loader2, Phone, Pencil, Send, CreditCard, MoreHorizontal, Copy, History, BookOpen, Banknote, Smartphone, ArrowRightCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { InvoicePreview } from "@/components/InvoicePreview";
import { InvoiceTemplate } from "@/components/InvoiceTemplate";
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { googleDriveAPI } from "@/utils/googleDriveAPI";
import { SuccessModal } from "@/components/SuccessModal";
import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { generateInvoicePDFBlob, generateInvoiceHTML } from "@/utils/invoicePDF";
import { adjustStock, adjustStockBatch } from "@/utils/inventory";
import { generateInvoiceNumber } from "@/utils/invoice-helpers";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInvoices } from "@/hooks/useInvoices";
import { useQueryClient } from "@tanstack/react-query";
import {
  fetchFullInvoiceData,
  formatCompanyData,
  formatInvoiceData,
  formatClientData
} from "@/utils/invoice-service";
import { Invoice, InvoiceItem, Client, UserSettings, ClientData, CompanyData, ItemData } from "@/types/invoice";

interface InvoicesPageProps {
  isQuotationMode?: boolean;
}

const InvoicesPage = ({ isQuotationMode: propQuotationMode }: InvoicesPageProps = {}) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const isQuotationTab = propQuotationMode ?? location.pathname.includes('/quotations');

  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || "";
  const initialInvoiceId = searchParams.get('id') || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(isQuotationTab ? "quotation" : "sales_only");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    setStatusFilter(isQuotationTab ? "quotation" : "sales_only");
  }, [isQuotationTab]);

  const { data, isLoading: loading, isFetching: searchLoading } = useInvoices({
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
    searchTerm: debouncedSearch,
    statusFilter
  });

  const invoices = data?.invoices || [];
  const totalCount = data?.totalCount || 0;

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
  const [whatsappPdfUrl, setWhatsappPdfUrl] = useState("");
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [whatsappProvider, setWhatsappProvider] = useState<string | null>(null);
  const [whatsappResendOpen, setWhatsappResendOpen] = useState(false);
  const [resendInvoiceData, setResendInvoiceData] = useState<Invoice | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappInvoiceId, setWhatsappInvoiceId] = useState("");
  const [statusConfirmationOpen, setStatusConfirmationOpen] = useState(false);
  const [statusToConfirm, setStatusToConfirm] = useState<{ id: string, status: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [smsConfirmationOpen, setSmsConfirmationOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
  const [smsPhone, setSmsPhone] = useState("");
  const [smsInvoiceId, setSmsInvoiceId] = useState("");
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<{ id: string, invoiceNumber: string, status: string } | null>(null);
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [invoiceToMarkPaid, setInvoiceToMarkPaid] = useState<Invoice | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'upi' | null>('cash');
  const [downloadingPDFId, setDownloadingPDFId] = useState<string | null>(null);
  const uploadingRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();

  // Handle specific invoice navigation from global search
  useEffect(() => {
    const findInvoicePage = async () => {
      if (initialInvoiceId && user) {
        try {
          const { data } = await supabase
            .from('invoices')
            .select('id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (data) {
            const invoices = data as unknown as { id: string }[];
            const index = invoices.findIndex(inv => inv.id === initialInvoiceId);
            if (index !== -1) {
              const page = Math.ceil((index + 1) / ITEMS_PER_PAGE);
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
  }, [initialInvoiceId, user]);

  const totalPages = useMemo(() =>
    Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE)),
    [totalCount]
  );

  const navigate = useNavigate();

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
      } = await fetchFullInvoiceData(invoice.id, user?.id || "");

      // 2. Prepare data for utility using formatters
      const invoiceData = formatInvoiceData(freshInvoiceData);
      const clientDataForUtils = formatClientData(clientData);
      const companyDataForUtils = formatCompanyData(profile, user?.email || "");

      const formattedItems = items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        tax_rate: item.tax_rate,
        discount: item.discount || 0,
        amount: item.amount,
        product: item.products
      }));

      const template = (['professional', 'elegant', 'minimal', 'modern', 'corporate'] as readonly string[]).includes(
        settings?.invoice_template || ''
      ) ? settings?.invoice_template as 'professional' | 'elegant' | 'minimal' | 'modern' | 'corporate' : 'professional';

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

  const updateInvoiceStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
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
        await supabase.from('notifications').insert({
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

  const handleMarkAsPaid = async (invoice: Invoice, paymentMethod: 'cash' | 'upi' | 'pending' | null) => {
    try {
      if (!user?.id) throw new Error("User not authenticated");

      // 1. Update invoice status to paid
      const { error: invError } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoice.id);

      if (invError) throw invError;

      // 2. Insert into payments table
      const creatorName = profile?.company_name || user?.user_metadata?.full_name || 'Owner';
      const isPending = !paymentMethod || paymentMethod === 'pending';
      const actualMethod = isPending ? 'pending' : paymentMethod;
      const paymentNotes = isPending
        ? `Marked as paid (Mode of payment is pended) • Created by: ${creatorName}`
        : `Marked as paid via ${paymentMethod === 'upi' ? 'UPI' : 'Cash'} • Created by: ${creatorName}`;

      const { error: payError } = await supabase
        .from('payments')
        .insert([{
          invoice_id: invoice.id,
          amount: Number(invoice.total_amount || 0),
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: actualMethod,
          reference_number: '',
          notes: paymentNotes,
          user_id: user.id
        }]);

      if (payError) {
        console.warn('Payment record insertion warning:', payError);
      }

      // Create notification for status update
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: isPending ? 'Mode of payment is pended' : 'Invoice Paid',
        message: isPending 
          ? `Invoice #${invoice.invoice_number} marked as Paid. Mode of payment is pended.`
          : `Invoice #${invoice.invoice_number} marked as Paid via ${paymentMethod === 'upi' ? 'UPI' : 'Cash'}.`,
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
          description: `Invoice #${invoice.invoice_number} settled via ${paymentMethod === 'upi' ? 'UPI' : 'Cash'}.`
        });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
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
      } = await fetchFullInvoiceData(invoice.id, user?.id || "");

      const invoiceData = formatInvoiceData(freshInvoiceData);
      const clientDataForUtils = formatClientData(clientFullData);
      const companyDataForUtils = formatCompanyData(profile, user?.email || "");

      const formattedItems = items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        tax_rate: item.tax_rate,
        discount: item.discount || 0,
        amount: item.amount
      }));

      const template = (settings?.invoice_template as 'professional' | 'elegant' | 'minimal' | 'modern' | 'corporate') || 'professional';

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

      setSharedInvoices(prev => ({
        ...prev,
        [invoice.id]: { ...prev[invoice.id], email: true }
      }));

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
      } = await fetchFullInvoiceData(invoice.id, user?.id || "");

      // Verify Google Drive Token
      const hasValidToken = await googleDriveAPI.ensureAuthenticated();
      if (!hasValidToken) await googleDriveAPI.authenticate();

      // Prepare PDF data
      const invoiceData = formatInvoiceData(freshInvoiceData);
      const clientDataForUtils = formatClientData(clientFullData);
      const companyDataForUtils = formatCompanyData(profile, user?.email || "");

      const formattedItems = items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        tax_rate: item.tax_rate,
        discount: item.discount || 0,
        amount: item.amount
      }));

      const template = (settings?.invoice_template as 'professional' | 'elegant' | 'minimal' | 'modern' | 'corporate') || 'professional';

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

  const performSendWhatsApp = async (
    invoiceId: string,
    phone: string,
    message: string,
    pdfUrl: string
  ) => {
    try {
      // Check if user is configured for personal WhatsApp delivery method
      const { data: settings } = await (supabase as any)
        .from('user_settings')
        .select('whatsapp_provider')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (settings?.whatsapp_provider === 'personal') {
        console.log('User is configured for Personal WhatsApp, opening wa.me link...');
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');

        // Mark as sent locally
        const { data: invData } = await (supabase as any)
          .from('invoices')
          .select('status')
          .eq('id', invoiceId)
          .maybeSingle();
        if (invData && invData.status === 'draft') {
          await updateInvoiceStatus(invoiceId, 'sent');
        }

        setSharedInvoices(prev => {
          const updated = {
            ...prev,
            [invoiceId]: { ...prev[invoiceId], whatsapp: true }
          };
          localStorage.setItem('invoice_shared_status', JSON.stringify(updated));
          return updated;
        });

        toast({
          title: "WhatsApp Opened! 📱",
          description: "Opening personal WhatsApp link to send invoice."
        });
        return;
      }

      // Attempt to send via official WhatsApp Cloud API first
      console.log('Attempting to send WhatsApp via Cloud API Edge Function...');
      const { data, error } = await supabase.functions.invoke('send-invoice-whatsapp', {
        body: {
          invoiceId,
          recipientPhone: phone,
          message,
          mediaUrl: pdfUrl
        }
      });

      if (error) throw error;

      // Mark as sent locally
      const { data: invData } = await (supabase as any)
        .from('invoices')
        .select('status')
        .eq('id', invoiceId)
        .maybeSingle();
      if (invData && invData.status === 'draft') {
        await updateInvoiceStatus(invoiceId, 'sent');
      }

      setSharedInvoices(prev => {
        const updated = {
          ...prev,
          [invoiceId]: { ...prev[invoiceId], whatsapp: true }
        };
        localStorage.setItem('invoice_shared_status', JSON.stringify(updated));
        return updated;
      });

      toast({
        title: "WhatsApp Message Sent! 🚀",
        description: "Invoice sent successfully via WhatsApp Cloud API."
      });
    } catch (error) {
      console.log('Cloud API not configured, opening WhatsApp Web link directly...', error);
      const formattedPhone = phone.replace(/[^\d]/g, '');
      const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');

      setSharedInvoices(prev => {
        const updated = {
          ...prev,
          [invoiceId]: { ...prev[invoiceId], whatsapp: true }
        };
        localStorage.setItem('invoice_shared_status', JSON.stringify(updated));
        return updated;
      });

      toast({
        title: "WhatsApp Opened! 📱",
        description: "Opening WhatsApp to send your pre-formatted invoice."
      });
    }
  };

  const startWhatsAppGenerationAndSend = async (invoice: Invoice) => {
    if (uploadingRef.current || uploadingWhatsApp === invoice.id) return;

    uploadingRef.current = true;
    setUploadingWhatsApp(invoice.id);
    setWhatsappInvoiceId(invoice.id);

    let phone = "";
    if (invoice.clients?.phone) {
      const rawPhone = invoice.clients.phone || '';
      const digitsOnly = rawPhone.replace(/[^\d]/g, '');
      phone = digitsOnly.startsWith('91') ? digitsOnly : `91${digitsOnly}`;
      setWhatsappPhone(phone);
    }

    setWhatsappMessage("Generating your invoice PDF, please wait...");
    setWhatsappConfirmationOpen(true);

    try {
      // Fetch all required data in parallel using consolidated service
      const {
        invoice: freshInvoiceData,
        items,
        client: clientFullData,
        settings,
        profile
      } = await fetchFullInvoiceData(invoice.id, user?.id || "");

      const invoiceData = formatInvoiceData(freshInvoiceData);
      const clientDataForUtils = formatClientData(clientFullData);
      const companyDataForUtils = formatCompanyData(profile, user?.email || "");

      const itemsData = items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        tax_rate: item.tax_rate,
        discount: item.discount || 0,
        amount: item.amount
      }));

      const template = (settings?.invoice_template as 'professional' | 'elegant' | 'minimal' | 'modern' | 'corporate') || 'professional';

      const hasValidToken = await googleDriveAPI.ensureAuthenticated();
      if (!hasValidToken) await googleDriveAPI.authenticate();

      const blob = await generateInvoicePDFBlob(
        invoiceData,
        clientDataForUtils as ClientData,
        itemsData as ItemData[],
        companyDataForUtils as CompanyData,
        template,
        currencySymbol
      );

      const fileName = `invoice-${freshInvoiceData.invoice_number}.pdf`;
      const driveFile = await googleDriveAPI.uploadPDF(blob, fileName);

      let directPdfUrl = driveFile?.webContentLink || "";
      if (driveFile) {
        try {
          const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
          const supabaseFileName = `${user?.id}/invoices/${invoice.id}/${cleanFileName}`;

          const { error: uploadError } = await supabase.storage
            .from('company-assets')
            .upload(supabaseFileName, blob, { upsert: true, contentType: 'application/pdf' });

          if (!uploadError) {
            const { data } = supabase.storage
              .from('company-assets')
              .getPublicUrl(supabaseFileName);
            if (data?.publicUrl) {
              directPdfUrl = data.publicUrl;
            }
          }
        } catch (storageErr) {
          console.error('Error during Supabase Storage upload:', storageErr);
        }
      }

      const message = `Hello ${clientFullData.name},\n\n` +
        `Your invoice ${freshInvoiceData.invoice_number} is ready!\n` +
        `Amount: ${currencySymbol}${freshInvoiceData.total_amount.toFixed(2)}\n\n` +
        (directPdfUrl ? `📄 Download PDF: ${directPdfUrl}\n\n` : '') +
        `*Thanks for business with ${companyDataForUtils.company_name}. We appreciate your trust!*`;

      setWhatsappMessage(message);
      setWhatsappPdfUrl(directPdfUrl);
    } catch (error) {
      console.error('Error uploading/sending to WhatsApp:', error);
      const fallbackMessage = `Hello ${invoice.clients?.name || 'Customer'},\n\nYour invoice ${invoice.invoice_number} is ready!\nAmount: ${currencySymbol}${invoice.total_amount.toFixed(2)}\n\nThank you for your business!`;
      setWhatsappMessage(fallbackMessage);
    } finally {
      setUploadingWhatsApp(null);
      uploadingRef.current = false;
    }
  };

  const handleWhatsAppClick = (invoice: Invoice) => {
    if (sharedInvoices[invoice.id]?.whatsapp) {
      setResendInvoiceData(invoice);
      setWhatsappResendOpen(true);
    } else {
      startWhatsAppGenerationAndSend(invoice);
    }
  };


  const deleteInvoice = (invoiceId: string, invoiceNumber: string, status: string) => {
    setInvoiceToDelete({ id: invoiceId, invoiceNumber, status });
    setDeleteConfirmationOpen(true);
  };

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return;

    try {
      // First fetch items to restore stock
      const { data: items, error: fetchError } = await supabase
        .from('invoice_items')
        .select('product_id, quantity')
        .eq('invoice_id', invoiceToDelete.id);

      if (fetchError) throw fetchError;

      // Restore stock for each item atomically if it has a product_id
      if (items && items.length > 0) {
        const deleteOpId = crypto.randomUUID();
        const validItems = (items as unknown as { product_id: string | null; quantity: number }[])
          .filter(i => i.product_id && i.quantity > 0)
          .map(i => ({ product_id: i.product_id!, quantity: i.quantity }));

        if (validItems.length > 0) {
          await adjustStockBatch(validItems, 'SALE_CANCEL', invoiceToDelete.id, `${deleteOpId}:DELETE`);
        }
      }

      // Then delete related invoice items
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceToDelete.id);

      if (itemsError) throw itemsError;

      // Then delete the invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceToDelete.id);

      if (invoiceError) throw invoiceError;

      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
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
        description: err.message || "Failed to delete.",
      });
    }
  };

  const handleConvertToInvoice = async (quotation: Invoice) => {
    try {
      setConvertingQuotationId(quotation.id);
      const { data: items, error: fetchError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', quotation.id);

      if (fetchError) throw fetchError;

      const newInvNumber = await generateInvoiceNumber('INV');

      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          invoice_number: newInvNumber,
          status: 'draft',
          issue_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', quotation.id);

      if (updateError) throw updateError;

      if (items && items.length > 0) {
        const opId = crypto.randomUUID();
        const validItems = (items as unknown as { product_id: string | null; quantity: number }[])
          .filter(i => i.product_id && i.quantity > 0)
          .map(i => ({ product_id: i.product_id!, quantity: i.quantity }));

        if (validItems.length > 0) {
          await adjustStockBatch(validItems, 'SALE', quotation.id, `${opId}:CONVERT`);
        }
      }

      toast({
        title: "Converted to Tax Invoice!",
        description: `Quotation ${quotation.invoice_number} is now Tax Invoice ${newInvNumber}. Stock has been updated.`
      });

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (err) {
      console.error("Error converting quotation:", err);
      toast({
        variant: "destructive",
        title: "Conversion Failed",
        description: "Could not convert quotation to invoice."
      });
    } finally {
      setConvertingQuotationId(null);
    }
  };

  const getPageTitle = () => {
    if (isQuotationTab) return 'Quotations & Estimates';
    if (isLedgerTab) return 'Ledger Settlement Bills';
    return 'Sales Invoices';
  };

  const getPageSubtitle = () => {
    if (isQuotationTab) return 'Manage price quotes and estimates for your clients';
    if (isLedgerTab) return 'Manage official settlement bills generated from Account Ledger party remaining balances';
    return 'Manage customer sales invoices, receivables and payments';
  };

  const getCreateButtonLabel = () => {
    if (isQuotationTab) return 'Create Quotation';
    if (isLedgerTab) return 'Create Ledger Bill';
    return 'Create Sales Invoice';
  };

  const getCreateRoute = () => {
    if (isQuotationTab) return '/billing/create-invoice?type=quotation';
    if (isLedgerTab) return '/billing/create-invoice?type=ledger';
    return '/billing/create-invoice';
  };

  const getSearchPlaceholder = () => {
    if (isQuotationTab) return 'Search quotations by number, client name, email or phone...';
    if (isLedgerTab) return 'Search ledger bills by number, party name, email or phone...';
    return 'Search invoices by number, client name, email or phone...';
  };

  const getEmptyStateTitle = () => {
    if (isQuotationTab) return 'No Quotations Found';
    if (isLedgerTab) return 'No Ledger Bills Found';
    return 'No Sales Invoices Found';
  };

  const getEmptyStateDescription = () => {
    if (totalCount === 0) {
      if (isQuotationTab) return 'Start creating price quotes and estimates for your clients.';
      if (isLedgerTab) return 'Generate official settlement bills directly from party remaining balances in Account Ledger.';
      return 'Start issuing GST and tax invoices to your clients.';
    }
    if (isQuotationTab) return 'No quotations match your search criteria.';
    if (isLedgerTab) return 'No ledger bills match your search criteria.';
    return 'No invoices match your search criteria.';
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
          <h1 className="text-xl md:text-3xl font-bold text-foreground">
            {getPageTitle()}
          </h1>
          <p className="text-xs md:text-base text-muted-foreground mt-1">
            {getPageSubtitle()}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Button
            variant="default"
            size="lg"
            onClick={() => navigate(getCreateRoute())}
            className={cn(
              "w-full sm:w-auto h-11 text-white font-bold",
              isQuotationTab 
                ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700" 
                : (isLedgerTab 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                    : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700")
            )}
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="text-sm md:text-base">{getCreateButtonLabel()}</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={getSearchPlaceholder()}
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
        <div className="w-full sm:w-56">
          <select
            className="w-full h-11 rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {isQuotationTab ? (
              <>
                <option value="quotation">All Quotations</option>
              </>
            ) : isLedgerTab ? (
              <>
                <option value="ledger">All Ledger Bills</option>
                <option value="ledger_draft">Draft Bills</option>
                <option value="ledger_sent">Sent Bills</option>
                <option value="ledger_paid">Paid Bills</option>
              </>
            ) : (
              <>
                <option value="sales_only">All Statuses</option>
                <option value="draft">Draft Invoices</option>
                <option value="sent">Sent Invoices</option>
                <option value="paid">Paid Invoices</option>
              </>
            )}
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
      ) : invoices.length === 0 ? (
        <Card className="p-4 md:p-6 md:p-8 text-center bg-card dark:bg-card">
          <FileText className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
            {getEmptyStateTitle()}
          </h3>
          <p className="text-sm md:text-base text-muted-foreground mb-4">
            {getEmptyStateDescription()}
          </p>
          {totalCount === 0 && (
            <Button
              variant="default"
              onClick={() => navigate(getCreateRoute())}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              {getCreateButtonLabel()}
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="p-4 md:p-6 rounded-md border-border bg-card shadow-sm">
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-4">
                <div
                  className="space-y-4"
                  onClick={() => handlePreviewInvoice(invoice)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{invoice.invoice_number}</span>
                        <StatusBadge status={invoice.status as "sent" | "paid" | "draft"} />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">{invoice.clients?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {safelyToLocaleDate(invoice.issue_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{currencySymbol}{invoice.total_amount.toFixed(2)}</p>
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
                      className={`h-10 w-full ${(sharedInvoices[invoice.id]?.whatsapp && invoice.status !== 'draft') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleWhatsAppClick(invoice); }}
                      title="Share to WhatsApp"
                      aria-label="Share to WhatsApp"
                      disabled={uploadingWhatsApp === invoice.id}
                    >
                      {uploadingWhatsApp === invoice.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <svg viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${(sharedInvoices[invoice.id]?.whatsapp && invoice.status !== 'draft') ? 'text-emerald-700' : 'text-emerald-500'}`}>
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
                        {invoice.status === 'quotation' && (
                          <DropdownMenuItem
                            onClick={() => handleConvertToInvoice(invoice)}
                            className="text-amber-600 font-bold"
                          >
                            <Sparkles className="mr-2 h-4 w-4 text-amber-600" />
                            Convert to Tax Invoice
                          </DropdownMenuItem>
                        )}
                        {invoice.status !== 'paid' && invoice.status !== 'quotation' ? (
                          <>
                            <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setInvoiceToMarkPaid(invoice);
                                setSelectedPaymentMethod('cash');
                                setMarkPaidDialogOpen(true);
                              }}
                            >
                              <CreditCard className="mr-2 h-4 w-4 text-emerald-600" />
                              Mark as Paid
                            </DropdownMenuItem>
                          </>
                        ) : invoice.status === 'quotation' ? (
                          <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Quotation
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            disabled
                            className="text-emerald-600 font-medium disabled:opacity-100"
                          >
                            <CreditCard className="mr-2 h-4 w-4 text-emerald-600" />
                            Paid
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => deleteInvoice(invoice.id, invoice.invoice_number, invoice.status)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete {invoice.status === 'quotation' ? 'Quotation' : 'Invoice'}
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
                    <h3 className="text-base lg:text-lg font-semibold truncate">{invoice.invoice_number}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {invoice.clients?.name}
                    </p>
                  </div>
                  <StatusBadge status={invoice.status as "sent" | "paid" | "draft"} />
                </div>

                {/* Right: Amount + Actions */}
                <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-base lg:text-lg font-bold">{currencySymbol}{invoice.total_amount.toFixed(2)}</p>
                    <p className="text-xs lg:text-sm text-muted-foreground">{invoice.currency}</p>
                  </div>

                  <div className="flex items-center gap-1 lg:gap-2">
                    {/* Convert to Tax Invoice for Quotations */}
                    {invoice.status === 'quotation' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConvertToInvoice(invoice)}
                        disabled={convertingQuotationId === invoice.id}
                        className="h-8 lg:h-9 px-2.5 text-xs font-bold bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 cursor-pointer"
                        title="Convert this Quotation into a Tax Invoice"
                      >
                        {convertingQuotationId === invoice.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-600" />
                        )}
                        <span>Convert to Invoice</span>
                      </Button>
                    )}

                    {/* Communication utilities (Email, SMS, WhatsApp) */}
                    {invoice.clients?.email && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setInvoiceToSend(invoice); setEmailConfirmationOpen(true); }}
                        title="Send via Email"
                        className={`h-8 lg:h-9 px-2 text-xs font-semibold ${sharedInvoices[invoice.id]?.email ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        <Mail className="w-4 h-4 lg:mr-1" />
                        <span className="hidden lg:inline">Email</span>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => sendInvoiceSMS(invoice)}
                      title="Send SMS"
                      className={`h-8 lg:h-9 px-2 text-xs font-semibold ${sharedInvoices[invoice.id]?.sms ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      <Phone className="w-4 h-4 lg:mr-1" />
                      <span className="hidden lg:inline">SMS</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleWhatsAppClick(invoice)}
                      title="Send PDF via WhatsApp"
                      className={`h-8 lg:h-9 px-2 text-xs font-semibold ${sharedInvoices[invoice.id]?.whatsapp ? 'text-emerald-700 bg-emerald-50' : 'text-emerald-600 hover:text-emerald-700'}`}
                      disabled={uploadingWhatsApp === invoice.id}
                    >
                      {uploadingWhatsApp === invoice.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 lg:mr-1">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>}
                      <span className="hidden lg:inline">WhatsApp</span>
                    </Button>

                    {/* Secondary: Mark as Paid (Only for actual invoices) */}
                    {invoice.status !== 'paid' && invoice.status !== 'quotation' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInvoiceToMarkPaid(invoice);
                          setSelectedPaymentMethod('cash');
                          setMarkPaidDialogOpen(true);
                        }}
                        title="Mark as Paid"
                        className="h-8 lg:h-9 px-2 lg:px-3 text-xs font-semibold text-emerald-700 bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5 lg:mr-1" />
                        <span className="hidden lg:inline">Mark Paid</span>
                      </Button>
                    )}

                    {/* Secondary: Download PDF */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadInvoicePDF(invoice)}
                      title="Download PDF"
                      disabled={downloadingPDFId === invoice.id}
                      className="h-8 lg:h-9 px-2 lg:px-3 text-xs font-semibold"
                    >
                      {downloadingPDFId === invoice.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Download className="w-3.5 h-3.5 lg:mr-1" />}
                      <span className="hidden lg:inline">PDF</span>
                    </Button>

                    {/* Primary: Preview */}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handlePreviewInvoice(invoice)}
                      title="Preview Invoice"
                      className="h-8 lg:h-9 px-3 text-xs font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5 lg:mr-1" />
                      <span className="hidden lg:inline">View</span>
                    </Button>

                    {/* Utility Edit & Destructive Delete */}
                    {invoice.status !== 'paid' && (
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/invoices/${invoice.id}/edit`)} title="Edit Invoice" className="h-8 lg:h-9 w-8 lg:w-9 p-0 text-slate-500 hover:text-amber-600 hover:bg-amber-50">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" onClick={() => deleteInvoice(invoice.id, invoice.invoice_number, invoice.status)} title="Delete Invoice" className="h-8 lg:h-9 w-8 lg:w-9 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
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

      <AlertDialog open={whatsappResendOpen} onOpenChange={setWhatsappResendOpen}>
        <AlertDialogContent className="max-w-md rounded-2xl border-none shadow-2xl bg-background p-0 overflow-hidden">
          <AlertDialogHeader className="p-4 md:p-8 pb-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tight">WhatsApp Sent Already</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium pt-2">
              This invoice has already been sent once. Do you want to send it again?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5">
            <AlertDialogCancel className="flex-1 h-11 font-bold rounded-xl border-2 m-0 hover:bg-muted/50 transition-all">
              No
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (resendInvoiceData) {
                  startWhatsAppGenerationAndSend(resendInvoiceData);
                }
              }}
              className="flex-1 h-11 font-bold rounded-xl shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white transition-all animate-in fade-in"
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={smsConfirmationOpen} onOpenChange={setSmsConfirmationOpen}>
        <AlertDialogContent className="max-w-md rounded-2xl border-none shadow-2xl bg-background p-0 overflow-hidden">
          <AlertDialogHeader className="p-4 md:p-8 pb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-primary" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tight">Preview SMS Message</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium pt-2">
              Edit the message below before sending via SMS to your client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-8 py-4">
            <Textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              className="min-h-[120px] rounded-xl border-2 focus-visible:ring-primary/20 bg-muted/30 font-medium"
            />
          </div>
          <AlertDialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5">
            <AlertDialogCancel className="flex-1 h-11 font-bold rounded-xl border-2 m-0 hover:bg-muted/50 transition-all">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const smsUrl = `sms:${smsPhone}?body=${encodeURIComponent(smsMessage)}`;
                window.location.href = smsUrl;
                toast({
                  title: "SMS App Opened",
                  description: "The default SMS app has been triggered."
                });
                setSharedInvoices(prev => ({
                  ...prev,
                  [smsInvoiceId]: { ...prev[smsInvoiceId], sms: true }
                }));
              }}
              className="flex-1 h-11 font-black rounded-xl shadow-lg shadow-primary/20 bg-primary hover:opacity-90 transition-all"
            >
              Send SMS
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
              Invoice #{invoiceToMarkPaid?.invoice_number} • Amount: {currencySymbol}{Number(invoiceToMarkPaid?.total_amount || 0).toFixed(2)}
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
                  className="text-[11px] font-bold text-amber-600 hover:underline cursor-pointer"
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
              className="flex-1 h-11 font-bold rounded-xl cursor-pointer"
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
              className="flex-1 h-11 font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              {selectedPaymentMethod ? `OK (Confirm ${selectedPaymentMethod.toUpperCase()})` : 'OK (Mode is Pended)'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
        onConfirm={confirmDeleteInvoice}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice #${invoiceToDelete?.invoiceNumber || ''}? This action cannot be undone and will restore item stock.`}
      />

      <SuccessModal
        isOpen={showSuccess}
        onOpenChange={setShowSuccess}
        title="Invoice Deleted"
        message="The invoice has been permanently removed from your records."
      />

      {/* WhatsApp Confirmation & Preview Dialog */}
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
              Review and edit the phone & message below. Clicking <strong>Open WhatsApp</strong> will open WhatsApp with this message pre-filled.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 flex flex-col gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">Recipient Phone Number</Label>
              <Input
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="e.g. 919876543210"
                className="bg-white dark:bg-slate-800 font-bold"
              />
            </div>

            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg p-3 shadow-sm relative mb-2">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">Message Content</Label>
              <div className="relative">
                <Textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="min-h-[140px] border border-slate-200 dark:border-slate-700 resize-none p-2 text-sm leading-relaxed text-gray-800 dark:text-gray-200 bg-transparent rounded-lg"
                  disabled={uploadingWhatsApp !== null}
                />
                {uploadingWhatsApp !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-800/60 rounded-lg">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                      <p className="text-xs font-bold text-emerald-600 animate-pulse">Preparing PDF Link...</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-[10px] text-gray-400 text-right mt-1 flex items-center justify-end gap-1">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                <span className="text-[#34B7F1]">✓✓</span>
              </div>
            </div>
          </div>

          <AlertDialogFooter className="p-4 bg-muted/5 flex flex-row gap-3 items-center justify-end border-t">
            <AlertDialogCancel className="m-0 h-11 px-6 font-bold rounded-xl border-2 hover:bg-muted/50 transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={uploadingWhatsApp !== null || sendingWhatsApp}
              onClick={async (e) => {
                e.preventDefault();
                setSendingWhatsApp(true);
                await performSendWhatsApp(whatsappInvoiceId, whatsappPhone, whatsappMessage, whatsappPdfUrl);
                setSendingWhatsApp(false);
                setWhatsappConfirmationOpen(false);
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
    </div>
  );
};

export default InvoicesPage;
