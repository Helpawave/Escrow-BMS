import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StaffHeaderBadge } from '@/components/StaffHeaderBadge';
import { supabase, serviceSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useNavigate } from 'react-router-dom';
import { safelyToLocaleDate } from '@/utils/dateUtils';
import {
  formatPurchaseBillWhatsAppMessage,
  formatPurchaseBillEmail,
  normalizeWhatsAppNumber,
  openWhatsAppChat,
  shortenUrl,
  createShortReceiptLink
} from '@/utils/whatsappTemplates';
import { generatePurchaseBillPDFBlob } from '@/utils/invoicePDF';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PurchaseInvoiceDialog } from '@/components/PurchaseInvoiceDialog';
import { PurchasePreviewDialog } from '@/components/PurchasePreviewDialog';
import { SuccessModal } from '@/components/SuccessModal';
import { DeleteConfirmation } from '@/components/DeleteConfirmation';
import { adjustStock } from '@/utils/inventory';
import { DataTablePagination } from '@/components/DataTablePagination';
import {
  PurchaseInvoice,
  SharedInvoiceStatus,
  getPaymentMethodLabel
} from './purchase-invoices/types';
import {
  MarkPaidDialog,
  SMSPreviewDialog,
  EmailPreviewDialog
} from './purchase-invoices/modals';
import {
  PurchaseFilters,
  PurchaseCardItem
} from './purchase-invoices/components';
const PurchaseInvoicesPage = () => {
  const { user, effectiveUserId, companyProfile, profile, ownerName, isStaff, staffName } = useAuth();
  const targetUserId = effectiveUserId || user?.id;
  const { toast } = useToast();
  const { currencySymbol, formatAmount } = useCurrency();

  const getCreatorTag = (notesText?: string | null) => {
    if (notesText && notesText.includes('Created by:')) {
      const extracted = notesText.slice(notesText.indexOf('Created by:')).split('•')[0].trim();
      const n = extracted.replace('Created by:', '').trim();
      if (n && n.toLowerCase() !== 'company' && n.toLowerCase() !== 'company owner') {
        return `Created by: ${n}`;
      }
    }
    const fallback = ownerName || profile?.company_name || companyProfile?.company_name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Owner';
    return `Created by: ${fallback}`;
  };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialog & Modal states
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  // WhatsApp & SMS Dialog States (Matches Invoices.tsx)
  const [whatsappConfirmationOpen, setWhatsappConfirmationOpen] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappInvoiceId, setWhatsappInvoiceId] = useState("");
  const [whatsappProvider, setWhatsappProvider] = useState<string | null>(null);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  const [smsConfirmationOpen, setSmsConfirmationOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
  const [smsPhone, setSmsPhone] = useState("");
  const [smsInvoiceId, setSmsInvoiceId] = useState("");

  const [emailConfirmationOpen, setEmailConfirmationOpen] = useState(false);
  const [emailInvoice, setEmailInvoice] = useState<PurchaseInvoice | null>(null);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: '', message: '' });
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [billToMarkPaid, setBillToMarkPaid] = useState<PurchaseInvoice | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Shared state tracking
  const [sharedInvoices, setSharedInvoices] = useState<Record<string, { whatsapp?: boolean; email?: boolean; sms?: boolean }>>(() => {
    const saved = localStorage.getItem('purchase_bill_shared_status');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('purchase_bill_shared_status', JSON.stringify(sharedInvoices));
  }, [sharedInvoices]);

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

  const { data: invoices = [], isLoading: loading, isFetching: searchLoading } = useQuery({
    queryKey: ['purchase_invoices', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const clientToUse = serviceSupabase || supabase;
      const { data, error } = await clientToUse
        .from('purchase_invoices')
        .select('*, vendors(name, email, phone)')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rawBills = (data as unknown as PurchaseInvoice[]) || [];
      return [...rawBills].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        const numA = parseInt((a.invoice_number || '').replace(/\D/g, '') || '0', 10);
        const numB = parseInt((b.invoice_number || '').replace(/\D/g, '') || '0', 10);
        return numB - numA;
      });
    },
    enabled: !!targetUserId
  });

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    let list = invoices;
    
    if (statusFilter !== "all") {
      if (statusFilter === "overdue") {
        list = list.filter(inv => {
          if (inv.status === 'paid') return false;
          if (inv.status === 'overdue') return true;
          if (inv.due_date) {
            const d = new Date(inv.due_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            d.setHours(0, 0, 0, 0);
            return d < today;
          }
          return false;
        });
      } else {
        list = list.filter(inv => inv.status?.toLowerCase() === statusFilter.toLowerCase());
      }
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      list = list.filter(inv => 
        inv.invoice_number?.toLowerCase().includes(q) ||
        (inv.vendors?.name || '').toLowerCase().includes(q) ||
        inv.total_amount?.toString().includes(q)
      );
    }

    return list;
  }, [invoices, debouncedSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const paginatedInvoices = useMemo(() => {
    const from = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(from, from + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  const handleMarkAsPaid = async (inv: PurchaseInvoice, paymentMethod: string | null) => {
    if (isSubmittingPayment) return;
    setIsSubmittingPayment(true);
    try {
      const clientToUse = serviceSupabase || supabase;
      
      // 1. Update purchase bill status to paid
      const { error: billError } = await clientToUse
        .from('purchase_invoices')
        .update({ status: 'paid' })
        .eq('id', inv.id);

      if (billError) throw billError;

      // 2. Insert or update payment in payments table
      const creatorName = isStaff
        ? (staffName || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Staff Member')
        : (companyProfile?.company_name || 'Company Owner');

      const isPending = !paymentMethod || paymentMethod === 'pending';
      const actualMethod = isPending ? 'pending' : paymentMethod;
      const methodLabel = getPaymentMethodLabel(paymentMethod);
      const paymentNotes = isPending
        ? `Purchase Bill #${inv.invoice_number} paid (Mode of payment is pended) • Created by: ${creatorName}`
        : `Purchase Bill #${inv.invoice_number} paid via ${methodLabel} • Created by: ${creatorName}`;

      // Check if a payment record already exists for this purchase bill
      const { data: existingPayment } = await clientToUse
        .from('payments')
        .select('id')
        .eq('purchase_invoice_id', inv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingPayment) {
        // Update existing record rather than creating a duplicate
        const { error: updatePayError } = await clientToUse
          .from('payments')
          .update({
            amount: Number(inv.total_amount || 0),
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
            purchase_invoice_id: inv.id,
            invoice_id: null,
            amount: Number(inv.total_amount || 0),
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: actualMethod,
            reference_number: '',
            notes: paymentNotes,
            user_id: inv.user_id || targetUserId || user?.id
          }]);

        if (payError) {
          console.error('Payment record insertion error:', payError);
          throw payError;
        }
      }

      if (isPending) {
        toast({
          title: "Mode of payment is pended ⚠️",
          description: `Purchase Bill #${inv.invoice_number} marked as paid. Payment recorded with pending mode — you can set the method in Payments.`
        });
      } else {
        toast({
          title: "Bill Marked as Paid! ✅",
          description: `Purchase Bill #${inv.invoice_number} settled via ${methodLabel}. Payment recorded in Payments.`
        });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'pending-for-payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (error) {
      console.error('Error marking purchase bill as paid:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark bill as paid."
      });
    } finally {
      setIsSubmittingPayment(false);
    }
  };



  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      const clientToUse = serviceSupabase || supabase;

      // 1. Revert stock for all items in this purchase bill before deleting
      const { data: items } = await clientToUse
        .from('purchase_invoice_items')
        .select('product_id, quantity')
        .eq('invoice_id', deleteTargetId);

      if (items && items.length > 0) {
        for (const item of (items as unknown as { product_id: string | null; quantity: number }[])) {
          if (item.product_id && item.quantity > 0) {
            await adjustStock(item.product_id, -item.quantity);
          }
        }
      }

      // 2. Delete linked payment records
      await clientToUse
        .from('payments')
        .delete()
        .eq('purchase_invoice_id', deleteTargetId);

      // 3. Delete purchase invoice items
      await clientToUse
        .from('purchase_invoice_items')
        .delete()
        .eq('invoice_id', deleteTargetId);

      // 4. Delete purchase invoice
      const { error } = await clientToUse
        .from('purchase_invoices')
        .delete()
        .eq('id', deleteTargetId);

      if (error) throw error;
      
      setSuccessInfo({
        title: "Purchase Bill Deleted",
        message: "The purchase bill record has been permanently removed."
      });
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete purchase bill." });
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    }
  };

  const ensurePurchaseBillPdfUrl = async (inv: PurchaseInvoice): Promise<string> => {
    const storageClient = serviceSupabase || supabase;
    const cleanFileName = `purchase-bill-${inv.invoice_number}.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_');
    const supabaseFileName = `${targetUserId || user?.id}/purchase-invoices/${inv.id}/${cleanFileName}`;

    console.log('[PurchasePDF] Starting generation for:', inv.invoice_number, '| template:', localStorage.getItem('purchase_bill_template') || 'classic-blue');

    try {
      const clientToUse = serviceSupabase || supabase;
      const { data: itemsRaw, error: itemsErr } = await (clientToUse as any)
        .from('purchase_invoice_items')
        .select('*, product:products(*)')
        .eq('invoice_id', inv.id);

      if (itemsErr) console.error('[PurchasePDF] Items fetch error:', itemsErr);

      const items: any[] = (itemsRaw || []).map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        tax_rate: item.tax_rate || 0,
        discount: item.discount || 0,
        amount: item.amount,
        product: item.product ? {
          opening_stock: item.product.opening_stock,
          type: item.product.type,
          unit: item.product.unit
        } : undefined
      }));

      console.log('[PurchasePDF] Items count:', items.length);

      const vendor = inv.vendors || { name: 'Vendor' };
      const company = (companyProfile || profile || {}) as any;
      let savedTemplate = (localStorage.getItem('purchase_bill_template') as any) || 'classic-blue';

      try {
        const { data: tplSetting } = await (supabase as any)
          .from('system_settings')
          .select('value')
          .eq('key', `purchase_bill_template_${targetUserId || user?.id}`)
          .maybeSingle();
        if (tplSetting?.value) {
          let val = tplSetting.value;
          if (typeof val === 'string') {
            try { val = JSON.parse(val); } catch {}
          }
          if (val) savedTemplate = val;
        }
      } catch {}

      console.log('[PurchasePDF] Generating blob with template:', savedTemplate);

      const blob = await generatePurchaseBillPDFBlob(
        {
          invoice_number: inv.invoice_number || 'N/A',
          issue_date: inv.issue_date,
          due_date: inv.due_date,
          status: inv.status || 'pending',
          subtotal: inv.subtotal || Number(inv.total_amount || 0),
          tax_amount: inv.tax_amount || 0,
          discount_amount: inv.discount_amount || 0,
          total_amount: Number(inv.total_amount || 0),
          currency: inv.currency || 'INR',
          notes: inv.notes || '',
          terms: inv.terms || ''
        },
        vendor as any,
        items,
        company,
        savedTemplate,
        currencySymbol
      );

      console.log('[PurchasePDF] Blob generated, size:', blob.size, '| uploading to:', supabaseFileName);

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(supabaseFileName, blob, { upsert: true, contentType: 'application/pdf' });

      if (uploadError) {
        console.error('[PurchasePDF] Upload FAILED:', uploadError);
        if (serviceSupabase) {
          await serviceSupabase.storage
            .from('company-assets')
            .upload(supabaseFileName, blob, { upsert: true, contentType: 'application/pdf' });
        }
      }

      const { data } = supabase.storage
        .from('company-assets')
        .getPublicUrl(supabaseFileName);

      console.log('[PurchasePDF] Upload SUCCESS. Public URL:', data?.publicUrl);
      if (data?.publicUrl) return `${data.publicUrl}?t=${Date.now()}`;
    } catch (err) {
      console.error('[PurchasePDF] CRITICAL ERROR during PDF generation:', err);
    }

    // Return empty — don't return a broken URL that gives 404
    return '';
  };


  // WhatsApp Flow: Direct open for personal WhatsApp, background send with notifications for Cloud API
  const openWhatsAppModal = async (inv: PurchaseInvoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (sendingWhatsApp) return;

    if (sharedInvoices[inv.id]?.whatsapp) {
      toast({
        title: "Already Sent ⚠️",
        description: "This WhatsApp message has already been sent once.",
      });
    }

    const isMeta = whatsappProvider === 'meta';

    setSendingWhatsApp(true);
    toast({
      title: isMeta ? "Sending via WhatsApp API ⚡" : "Preparing WhatsApp...",
      description: isMeta ? `Connecting to ESCROW WhatsApp Gateway for purchase bill #${inv.invoice_number}...` : `Preparing PDF for purchase bill #${inv.invoice_number}...`
    });

    try {
      const phoneWithCC = normalizeWhatsAppNumber(inv.vendors?.phone);
      const vendorName = inv.vendors?.name || 'Vendor';
      const currency = inv.currency === 'USD' ? '$' : (inv.currency === 'EUR' ? '€' : (inv.currency === 'GBP' ? '£' : currencySymbol));

      let provider = whatsappProvider || 'personal';
      try {
        const clientToUse = serviceSupabase || supabase;
        const { data: settings } = await clientToUse
          .from('user_settings')
          .select('whatsapp_provider')
          .eq('user_id', targetUserId)
          .maybeSingle();
        if ((settings as any)?.whatsapp_provider) {
          provider = (settings as any).whatsapp_provider;
        }
      } catch (e) {
        // fallback
      }

      const cleanCode = (inv.invoice_number || '').trim().replace(/^#+/, '');
      let baseUrl = 'https://bill.escrowbms.in';
      if (typeof window !== 'undefined' && window.location?.origin) {
        const origin = window.location.origin;
        if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
          baseUrl = origin.replace('www.bill.escrowbms.in', 'bill.escrowbms.in');
        }
      }
      const publicReceiptUrl = `${baseUrl}/v/${encodeURIComponent(cleanCode)}`;

      // 1. Personal WhatsApp Mode: Direct Instant Open without waiting for slow client-side PDF generation
      if (provider === 'personal') {
        const text = formatPurchaseBillWhatsAppMessage({
          invoiceNumber: inv.invoice_number,
          vendorName: vendorName,
          companyName: companyProfile?.company_name || profile?.company_name || ownerName,
          totalAmount: Number(inv.total_amount || 0),
          currencySymbol: currency,
          issueDate: safelyToLocaleDate(inv.issue_date),
          status: inv.status,
          pdfUrl: publicReceiptUrl,
        });

        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).catch(() => {});
        }

        const waUrl = openWhatsAppChat(phoneWithCC, text);
        setSharedInvoices(prev => ({
          ...prev,
          [inv.id]: { ...(prev[inv.id] || {}), whatsapp: true }
        }));
        toast({
          title: "WhatsApp Opened! 📱",
          description: `Direct WhatsApp chat opened for purchase bill #${inv.invoice_number}.`,
          action: (
            <ToastAction altText="Open WhatsApp" onClick={() => window.open(waUrl, '_blank')}>
              Open Chat
            </ToastAction>
          )
        });

        // Background PDF sync so direct link and public viewer have the uploaded PDF cached
        ensurePurchaseBillPdfUrl(inv).then(async (directPdfUrl) => {
          if (directPdfUrl) {
            await createShortReceiptLink(inv.invoice_number, directPdfUrl, supabase, inv.id);
          }
        }).catch(err => console.warn('Background purchase bill PDF sync:', err));

        return;
      }

      // 2. Official WhatsApp Mode: Step 1 - Generate PDF
      toast({
        title: "Sending via WhatsApp API ⚡",
        description: `Step 1/2: Preparing official PDF for purchase bill #${inv.invoice_number}...`,
        duration: 3000
      });

      const directPdfUrl = await ensurePurchaseBillPdfUrl(inv);
      const cleanPdfUrl = directPdfUrl 
        ? await createShortReceiptLink(inv.invoice_number, directPdfUrl, supabase, inv.id)
        : directPdfUrl;

      toast({
        title: "Sending via WhatsApp API ⚡",
        description: `Step 2/2: Delivering to ${vendorName} via ESCROW Gateway...`,
        duration: 4000
      });

      const text = formatPurchaseBillWhatsAppMessage({
        invoiceNumber: inv.invoice_number,
        vendorName: vendorName,
        companyName: companyProfile?.company_name || profile?.company_name || ownerName,
        totalAmount: Number(inv.total_amount || 0),
        currencySymbol: currency,
        issueDate: safelyToLocaleDate(inv.issue_date),
        status: inv.status,
        pdfUrl: cleanPdfUrl || publicReceiptUrl,
      });

      // 2. Official WhatsApp Mode: Run in background with notifications
      try {
        const clientForFunction = serviceSupabase || supabase;
        const { error } = await clientForFunction.functions.invoke('send-invoice-whatsapp', {
          body: {
            invoiceId: inv.id,
            recipientPhone: phoneWithCC,
            message: text,
            mediaUrl: directPdfUrl || undefined,
            companyName: companyProfile?.company_name || profile?.company_name || ownerName,
            clientName: vendorName,
            invoiceType: 'purchase'
          }
        });

        if (error) throw error;

        setSharedInvoices(prev => ({
          ...prev,
          [inv.id]: { ...(prev[inv.id] || {}), whatsapp: true }
        }));

        toast({
          title: "WhatsApp Message Sent ✅",
          description: `Purchase bill #${inv.invoice_number} sent via Meta WhatsApp Gateway.`
        });
      } catch (error: any) {
        console.error('Meta WhatsApp API failed:', error);
        const errMsg = error?.message || (typeof error === 'string' ? error : 'Meta WhatsApp delivery failed. Please check WhatsApp settings.');
        toast({
          variant: "destructive",
          title: "Meta WhatsApp Failed ❌",
          description: errMsg,
          duration: 7000
        });
      }
    } catch (err: any) {
      console.error('Error sharing purchase bill on WhatsApp:', err);
    } finally {
      setSendingWhatsApp(false);
    }
  };

  // SMS Flow with preview modal (Matches Invoices.tsx)
  const openSMSModal = (inv: PurchaseInvoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const vendorName = inv.vendors?.name || 'Vendor';
    const text = `Purchase Bill ${inv.invoice_number} for ${vendorName}: Amount INR ${inv.total_amount}. Status: ${inv.status}`;
    setSmsMessage(text);
    setSmsPhone(inv.vendors?.phone ? inv.vendors.phone.replace(/\D/g, '') : '');
    setSmsInvoiceId(inv.id);
    setSmsConfirmationOpen(true);
  };

  const executeSMSSend = () => {
    window.open(`sms:${smsPhone}?body=${encodeURIComponent(smsMessage)}`, '_blank');
    setSharedInvoices(prev => ({
      ...prev,
      [smsInvoiceId]: { ...(prev[smsInvoiceId] || {}), sms: true }
    }));
    setSmsConfirmationOpen(false);
  };

  // Email Flow (Matches Invoices.tsx)
  const openEmailModal = (inv: PurchaseInvoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEmailInvoice(inv);
    setEmailConfirmationOpen(true);
  };

  const executeEmailSend = async () => {
    if (!emailInvoice) return;
    const email = emailInvoice.vendors?.email || '';
    const vendorName = emailInvoice.vendors?.name || 'Vendor';
    const compName = companyProfile?.company_name || profile?.company_name || ownerName || 'Our Business';
    const currency = emailInvoice.currency === 'USD' ? '$' : (emailInvoice.currency === 'EUR' ? '€' : (emailInvoice.currency === 'GBP' ? '£' : currencySymbol));

    toast({
      title: "Preparing Email...",
      description: "Generating PDF link for email..."
    });

    const directPdfUrl = await ensurePurchaseBillPdfUrl(emailInvoice);

    const { subject, body } = formatPurchaseBillEmail({
      invoiceNumber: emailInvoice.invoice_number,
      vendorName,
      companyName: compName,
      totalAmount: Number(emailInvoice.total_amount || 0),
      currencySymbol: currency,
      issueDate: safelyToLocaleDate(emailInvoice.issue_date),
      status: emailInvoice.status,
      pdfUrl: directPdfUrl || undefined,
    });

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');

    setSharedInvoices(prev => ({
      ...prev,
      [emailInvoice.id]: { ...(prev[emailInvoice.id] || {}), email: true }
    }));
    setEmailConfirmationOpen(false);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl md:text-3xl font-bold text-foreground">Purchase Bills</h1>
            <StaffHeaderBadge />
          </div>
          <p className="text-xs md:text-base text-muted-foreground mt-1">Manage procurement expenses and vendor bills</p>
        </div>
        <Button
          variant="default"
          size="lg"
          onClick={() => navigate('/create-invoice?type=purchase')}
          className="w-full sm:w-auto h-11 shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span className="text-sm md:text-base">Create Purchase Bill</span>
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <PurchaseFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchLoading={searchLoading}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Cards List Layout */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 md:p-6 rounded-xl border-border bg-card shadow-sm">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="h-6 w-24 ml-auto" />
                  <Skeleton className="h-4 w-16 ml-auto" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : paginatedInvoices.length === 0 ? (
        <Card className="p-4 md:p-6 md:p-8 text-center bg-card dark:bg-card">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-base md:text-lg font-bold text-foreground/80">No purchase bills found</p>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search criteria or filter options.'
              : 'Record purchase bills to keep track of expenses and vendor accounts.'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/create-invoice?type=purchase')}
              className="mt-4 font-bold border-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Purchase Bill
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {paginatedInvoices.map((inv) => (
            <PurchaseCardItem
              key={inv.id}
              invoice={inv}
              onPreview={(item) => {
                setPreviewInvoiceId(item.id);
                setIsPreviewDialogOpen(true);
              }}
              onPrint={(item) => {
                setPreviewInvoiceId(item.id);
                setIsPreviewDialogOpen(true);
              }}
              onWhatsApp={openWhatsAppModal}
              onEmail={openEmailModal}
              onSMS={openSMSModal}
              onEdit={(item) => {
                setEditingInvoiceId(item.id);
                setIsEditDialogOpen(true);
              }}
              onMarkPaid={(item) => {
                setBillToMarkPaid(item);
                setSelectedPaymentMethod(null);
                setMarkPaidDialogOpen(true);
              }}
              onDelete={(id) => {
                setDeleteTargetId(id);
                setShowDeleteConfirm(true);
              }}
              sharedStatus={sharedInvoices[inv.id]}
              formatAmount={formatAmount}
              getCreatorTag={getCreatorTag}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <DataTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={filteredInvoices.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        entityName="purchase bills"
        isLoading={loading}
      />

      {/* SMS Preview Dialog */}
      <SMSPreviewDialog
        open={smsConfirmationOpen}
        onOpenChange={setSmsConfirmationOpen}
        smsMessage={smsMessage}
        setSmsMessage={setSmsMessage}
        onConfirmSend={executeSMSSend}
      />

      {/* Email Preview Dialog */}
      <EmailPreviewDialog
        open={emailConfirmationOpen}
        onOpenChange={setEmailConfirmationOpen}
        emailInvoice={emailInvoice}
        onConfirmSend={executeEmailSend}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteConfirm}
        title="Delete Purchase Bill"
        description="Are you sure you want to delete this purchase bill record? This action cannot be undone."
      />

      {/* Mark as Paid Selection Popup Dialog */}
      <MarkPaidDialog
        open={markPaidDialogOpen}
        onOpenChange={setMarkPaidDialogOpen}
        billToMarkPaid={billToMarkPaid}
        selectedPaymentMethod={selectedPaymentMethod}
        setSelectedPaymentMethod={setSelectedPaymentMethod}
        isSubmittingPayment={isSubmittingPayment}
        onConfirm={handleMarkAsPaid}
        formatAmount={formatAmount}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onOpenChange={setShowSuccess}
        title={successInfo.title}
        message={successInfo.message}
      />

      {/* Purchase Bill Preview Modal */}
      <PurchasePreviewDialog
        invoiceId={previewInvoiceId}
        isOpen={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
      />

      {/* Purchase Bill Edit Modal */}
      <PurchaseInvoiceDialog
        invoiceId={editingInvoiceId}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }}
      />
    </div>
  );
};

export default PurchaseInvoicesPage;
