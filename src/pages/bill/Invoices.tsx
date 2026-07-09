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
import { FileText, Plus, Search, Filter, Download, Trash2, Printer, Mail, MoreVertical, Eye, Loader2, Phone, Pencil, Send, CreditCard, MoreHorizontal, Copy, History } from "lucide-react";
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
import { generateInvoicePDFBlob, generateInvoiceHTML } from "@/utils/invoicePDF";
import { adjustStock } from "@/utils/inventory";
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

const InvoicesPage = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || "";
  const initialInvoiceId = searchParams.get('id') || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

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
  const [paidVerificationChecked, setPaidVerificationChecked] = useState(false);
  const [paidVerificationChecked2, setPaidVerificationChecked2] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
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

  const { user } = useAuth();
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
      console.error('WhatsApp Cloud API failed:', error);
      toast({
        variant: "destructive",
        title: "Send Failed ❌",
        description: "Failed to send WhatsApp message via Cloud API. Please check your credentials."
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

      if (driveFile) {
        // Upload to Supabase Storage to get a direct public URL for WhatsApp media attachment
        let directPdfUrl = driveFile.webContentLink;
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
          } else {
            console.error('Failed to upload PDF to Supabase Storage:', uploadError);
          }
        } catch (storageErr) {
          console.error('Error during Supabase Storage upload:', storageErr);
        }

        const message = `Hello ${clientFullData.name},\n\n` +
          `Your invoice ${freshInvoiceData.invoice_number} is ready!\n` +
          `Amount: ${currencySymbol}${freshInvoiceData.total_amount.toFixed(2)}\n\n` +
          `📄 Download PDF: ${driveFile.webContentLink}\n\n` +
          `*Thanks for business with ${companyDataForUtils.company_name}. We appreciate your trust!*`;

        await performSendWhatsApp(invoice.id, phone, message, directPdfUrl);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading/sending to WhatsApp:', error);
      const fallbackMessage = `Hello ${invoice.clients?.name}, your invoice ${invoice.invoice_number} is ready. Thank you!`;
      await performSendWhatsApp(invoice.id, phone, fallbackMessage, "");
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
    setPaidVerificationChecked(false);
    setPaidVerificationChecked2(false);
    setDeleteConfirmText("");
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
          <h1 className="text-xl md:text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-xs md:text-base text-muted-foreground mt-1">Create and manage your invoices</p>
        </div>
        <Button
          variant="default"
          size="lg"
          onClick={() => navigate('/create-invoice')}
          className="w-full sm:w-auto h-11"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span className="text-sm md:text-base">Create Invoice</span>
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
                        {invoice.status !== 'paid' ? (
                          <>
                            <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => { setStatusToConfirm({ id: invoice.id, status: 'paid' }); setStatusConfirmationOpen(true); }}
                            >
                              <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
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
                        <DropdownMenuItem onClick={() => deleteInvoice(invoice.id, invoice.invoice_number, invoice.status)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Invoice
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
                      onClick={() => handleWhatsAppClick(invoice)}
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
                        onClick={() => { setStatusToConfirm({ id: invoice.id, status: 'paid' }); setStatusConfirmationOpen(true); }}
                        title="Mark as Paid"
                        className="h-8 lg:h-9 px-2 lg:px-3 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                      >
                        <CreditCard className="w-4 h-4 text-emerald-700 lg:mr-1" />
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
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/invoices/${invoice.id}/edit`)} title="Edit Invoice" className="h-8 lg:h-9 w-8 lg:w-9 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Delete */}
                    <Button variant="ghost" size="sm" onClick={() => deleteInvoice(invoice.id, invoice.invoice_number, invoice.status)} title="Delete Invoice" className="h-8 lg:h-9 w-8 lg:w-9 p-0 text-destructive hover:text-destructive">
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

      <AlertDialog open={statusConfirmationOpen} onOpenChange={setStatusConfirmationOpen}>
        <AlertDialogContent className="max-w-md rounded-2xl border-none shadow-2xl bg-background p-0 overflow-hidden">
          <AlertDialogHeader className="p-4 md:p-8 pb-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6 text-emerald-600" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tight">Mark Invoice as Paid?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium pt-2">
              Are you sure you want to mark this invoice as <span className="text-emerald-600 font-black uppercase tracking-wider">PAID</span>? The Edit option will no longer be available after this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5">
            <AlertDialogCancel className="flex-1 h-11 font-bold rounded-xl border-2 m-0 hover:bg-muted/50 transition-all">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => statusToConfirm && updateInvoiceStatus(statusToConfirm.id, statusToConfirm.status)}
              className="flex-1 h-11 font-black rounded-xl shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
            >
              Mark as Paid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
        <AlertDialogContent className="max-w-md rounded-2xl border-none shadow-2xl bg-background p-0 overflow-hidden">
          <AlertDialogHeader className="p-4 md:p-8 pb-4 border-b bg-rose-50/50">
            <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tight text-rose-950">
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-rose-900/70 font-medium pt-2">
              {invoiceToDelete?.status === 'paid' ? (
                "This invoice is marked as PAID. Please verify before permanent deletion."
              ) : (
                <>
                  Are you sure you want to delete invoice <span className="text-rose-950 font-black">#{invoiceToDelete?.invoiceNumber}</span>? This action is irreversible.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="p-4 md:p-6 md:p-8 space-y-6">
            {invoiceToDelete?.status === 'paid' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div
                    className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
                    onClick={() => setPaidVerificationChecked(!paidVerificationChecked)}
                  >
                    <Checkbox
                      id="verify1"
                      checked={paidVerificationChecked}
                      className="rounded-lg border-2"
                    />
                    <Label htmlFor="verify1" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer group-hover:text-foreground">Permanent Deletion Acknowledged</Label>
                  </div>

                  <div
                    className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
                    onClick={() => setPaidVerificationChecked2(!paidVerificationChecked2)}
                  >
                    <Checkbox
                      id="verify2"
                      checked={paidVerificationChecked2}
                      className="rounded-lg border-2"
                    />
                    <Label htmlFor="verify2" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer group-hover:text-foreground">Financial Impact Verified</Label>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 ml-1">Type "DELETE" to confirm</Label>
                    <Input
                      placeholder="Type DELETE"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="h-12 rounded-md bg-muted/50 border-border text-center font-bold tracking-widest focus-visible:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            )}

            <AlertDialogFooter className="sm:justify-center gap-3">
              <AlertDialogCancel className="flex-1 h-12 rounded-md border border-border font-semibold uppercase tracking-wider text-[10px] m-0">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteInvoice}
                disabled={invoiceToDelete?.status === 'paid' && (!paidVerificationChecked || !paidVerificationChecked2 || deleteConfirmText !== 'DELETE')}
                className={`flex-1 h-12 rounded-md font-bold uppercase tracking-wider text-[10px] shadow-sm transition-all
                    ${invoiceToDelete?.status === 'paid'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
              >
                Delete Invoice
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

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
