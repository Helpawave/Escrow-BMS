import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Mail, FileText } from "lucide-react";
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
import { supabase, serviceSupabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { InvoiceTemplate } from "./InvoiceTemplate";
import { StatusBadge } from "./StatusBadge";
import { generateInvoicePDFBlob, generateInvoiceHTML } from '@/utils/invoicePDF';
import { ResponsiveInvoiceWrapper } from './ResponsiveInvoiceWrapper';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  tax_rate: number;
  discount: number;
  amount: number;
  product?: {
    opening_stock?: string | number;
    type?: string;
    unit?: string;
  };
}

interface Client {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  gstin?: string;
  hide_contact_details?: boolean;
}

interface CompanyProfile {
  company_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  business_address?: string;
  gstin?: string;
  logo_url?: string;
  website?: string;
  signature_url?: string;
  upi_qr_url?: string;
  upi_id?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  account_type?: string;
  hide_company_details?: boolean;
}

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date?: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  notes?: string;
  terms?: string;
  discount_amount?: number;
  clients?: Client;
  hide_company_details?: boolean;
  hide_contact_details?: boolean;
}

interface InvoicePreviewProps {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
}

const isGenericPaymentDue = (terms?: string | null) => {
  if (!terms || !terms.trim()) return true;
  const t = terms.trim().toLowerCase();
  return (
    t === 'payment due within 30 days' ||
    t === 'payment due on receipt.' ||
    t === 'payment due on receipt' ||
    t === 'payment due as per terms' ||
    t === 'standard corporate terms apply.' ||
    t === 'standard payment terms apply.' ||
    t === 'payment is due within the stipulated time frame.'
  );
};

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  open,
  onClose
}) => {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [company, setCompany] = useState<CompanyProfile>({});
  const [template, setTemplate] = useState('corporate');
  const [defaultTerms, setDefaultTerms] = useState<string>('');
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState<string>('30');
  const [loading, setLoading] = useState(true);
  const [emailConfirmationOpen, setEmailConfirmationOpen] = useState(false);
  const [fullInvoice, setFullInvoice] = useState<Invoice | null>(null);

  const { user, effectiveUserId, isStaff, companyProfile, profile } = useAuth();
  const { toast } = useToast();

  const fetchInvoiceData = useCallback(async () => {
    if (!invoice || !user) return;

    setLoading(true);
    try {
      const clientToUse = serviceSupabase || supabase;

      // Fetch full invoice details to ensure all fields (subtotal, notes, terms, etc.) are populated
      const { data: invoiceData, error: invoiceError } = await clientToUse
        .from('invoices')
        .select('*, clients(*)')
        .eq('id', invoice.id)
        .maybeSingle();

      if (invoiceError) {
        console.warn('Could not fetch full invoice with relation, falling back to prop invoice:', invoiceError);
      }
      
      const resolvedInvoice = (invoiceData as unknown as Invoice) || invoice;
      setFullInvoice(resolvedInvoice);

      // Fetch invoice items
      const { data: itemsData, error: itemsError } = await clientToUse
        .from('invoice_items')
        .select(`
          *,
          products (
            id,
            name,
            description,
            hsn_code,
            opening_stock,
            type,
            unit
          )
        `)
        .eq('invoice_id', invoice.id);

      if (itemsError) {
        console.warn('Could not fetch invoice items with products relation:', itemsError);
      }

      // Fetch company profile & settings using owner's ID
      const targetOwnerId = (resolvedInvoice as any)?.user_id || (isStaff && effectiveUserId ? effectiveUserId : user.id);

      const { data: profileData } = await (clientToUse as any)
        .from('profiles')
        .select('*')
        .or(`user_id.eq.${targetOwnerId},id.eq.${targetOwnerId}`)
        .maybeSingle();

      // Fetch user settings for template and default terms
      const { data: rawSettingsData, error: settingsError } = await (clientToUse as any)
        .from('user_settings')
        .select('*')
        .eq('user_id', targetOwnerId)
        .maybeSingle();

      const settingsData = rawSettingsData as {
        invoice_template?: string;
        hide_company_details?: boolean;
        default_terms?: string;
        default_payment_terms?: string;
      } | null;

      if (settingsError) console.warn('Could not fetch user settings, using default template');

      const isDownpayment = Boolean(
        resolvedInvoice?.notes?.includes('is_downpayment') ||
        resolvedInvoice?.notes?.includes('Vehicle:') ||
        resolvedInvoice?.invoice_number?.startsWith('DP-') ||
        resolvedInvoice?.notes?.toLowerCase().includes('downpayment') ||
        resolvedInvoice?.notes?.toLowerCase().includes('vehicle booking') ||
        resolvedInvoice?.notes?.toLowerCase().includes('booking advance')
      );

      const savedDownpaymentTemplate = (settingsData as any)?.downpayment_template || localStorage.getItem('downpayment_template') || 'auto_dealership';
      const savedSalesTemplate = settingsData?.invoice_template && !settingsData.invoice_template.startsWith('auto_')
        ? settingsData.invoice_template
        : 'corporate';

      if (isDownpayment) {
        setTemplate(savedDownpaymentTemplate);
      } else {
        setTemplate(savedSalesTemplate);
      }

      if (settingsData) {
        if (settingsData.default_terms !== undefined) setDefaultTerms(settingsData.default_terms || '');
        if (settingsData.default_payment_terms) setDefaultPaymentTerms(settingsData.default_payment_terms);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itemsRaw = (itemsData as unknown as any[]) || [];
      setItems(itemsRaw.map(item => ({
        description: item.description || '',
        product_name: item.products?.name || item.product_name || item.name || '',
        name: item.products?.name || item.product_name || item.name || '',
        quantity: item.quantity,
        rate: item.rate,
        tax_rate: item.tax_rate,
        discount: item.discount || 0,
        amount: item.amount,
        hsn_code: item.hsn_code || item.products?.hsn_code || '',
        product: item.products ? {
          name: item.products.name,
          opening_stock: item.products.opening_stock,
          type: item.products.type,
          unit: item.products.unit,
          hsn_code: item.products.hsn_code
        } : undefined
      })) || []);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prof = (profileData as unknown as any) || (companyProfile as any) || (profile as any) || {};
      const storedLogo = typeof window !== 'undefined' ? (localStorage.getItem('escrow_company_logo_url') || '') : '';
      const storedSign = typeof window !== 'undefined' ? (localStorage.getItem('escrow_company_signature_url') || '') : '';
      setCompany({
        company_name: prof?.company_name || (companyProfile as any)?.company_name || (profile as any)?.company_name || '',
        email: prof?.email || (companyProfile as any)?.email || (profile as any)?.email || user?.email || '',
        phone: prof?.phone || (companyProfile as any)?.phone || (profile as any)?.phone || '',
        mobile: prof?.mobile || (companyProfile as any)?.mobile || (profile as any)?.mobile || '',
        business_address: prof?.business_address || (companyProfile as any)?.business_address || (profile as any)?.business_address || '',
        gstin: prof?.gstin || (companyProfile as any)?.gstin || (profile as any)?.gstin || '',
        logo_url: prof?.logo_url || (companyProfile as any)?.logo_url || (profile as any)?.logo_url || storedLogo || '',
        website: prof?.website || (companyProfile as any)?.website || (profile as any)?.website || '',
        signature_url: prof?.signature_url || (companyProfile as any)?.signature_url || (profile as any)?.signature_url || storedSign || '',
        upi_qr_url: prof?.upi_qr_url || '',
        upi_id: prof?.upi_id || '',
        bank_name: prof?.bank_name || '',
        account_number: prof?.account_number || '',
        ifsc_code: prof?.ifsc_code || '',
        account_holder_name: prof?.account_holder_name || '',
        account_type: prof?.account_type || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hide_company_details: (settingsData as any)?.hide_company_details ?? false
      });
    } catch (error) {
      console.warn('Error in fetchInvoiceData, using fallback props:', error);
      setFullInvoice(invoice);
    } finally {
      setLoading(false);
    }
  }, [invoice, user, effectiveUserId, isStaff, companyProfile, profile]);

  useEffect(() => {
    if (invoice && open) {
      fetchInvoiceData();
    }
  }, [invoice, open, fetchInvoiceData]);

  const generatePDFBlob = async () => {
    if (!invoice || !user) throw new Error("Missing data");

    const invToUse = fullInvoice || invoice;
    const isGeneric = isGenericPaymentDue(invToUse?.terms);
    const paymentDaysMatch = (defaultPaymentTerms || '').match(/\d+/);
    const paymentDays = paymentDaysMatch ? parseInt(paymentDaysMatch[0], 10) : 30;

    const effectiveTerms = invToUse?.terms && invToUse.terms.trim() && !isGeneric
      ? invToUse.terms.trim()
      : (defaultTerms && defaultTerms.trim() 
          ? defaultTerms.trim() 
          : (paymentDays === 0 ? 'Payment due on receipt' : `Payment due within ${paymentDays} days`));

    let effectiveDueDate = invToUse?.due_date;
    if (isGeneric && invToUse?.issue_date && invToUse?.status !== 'paid' && paymentDays) {
      const nextDue = new Date(new Date(invToUse.issue_date).getTime() + paymentDays * 24 * 60 * 60 * 1000);
      effectiveDueDate = nextDue.toISOString().split('T')[0];
    }

    return await generateInvoicePDFBlob(
      {
        invoice_number: invToUse.invoice_number,
        issue_date: invToUse.issue_date,
        due_date: effectiveDueDate,
        status: invToUse.status,
        subtotal: invToUse.subtotal || 0,
        discount_amount: invToUse.discount_amount || 0,
        tax_amount: invToUse.tax_amount || 0,
        total_amount: invToUse.total_amount,
        currency: invToUse.currency,
        notes: invToUse.notes,
        terms: effectiveTerms
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      {
        name: invToUse.clients?.name || 'N/A',
        email: invToUse.clients?.email || '',
        phone: invToUse.clients?.phone || '',
        address: invToUse.clients?.address || '',
        city: invToUse.clients?.city || '',
        state: invToUse.clients?.state || '',
        postal_code: invToUse.clients?.postal_code || '',
        country: invToUse.clients?.country || '',
        gstin: invToUse.clients?.gstin || '',
        hide_contact_details: invToUse.clients?.hide_contact_details ?? false
      },
      items,
      company as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      template as any // eslint-disable-line @typescript-eslint/no-explicit-any
    );
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await generatePDFBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice?.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download PDF. Please try again."
      });
    }
  };

  const handleSendEmail = async () => {
    if (!invoice || !invoice.clients?.email) return;

    try {
      const pdfBlob = await generatePDFBlob();
      
      const formattedItems = items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        tax_rate: item.tax_rate,
        discount: item.discount,
        amount: item.amount,
        product: item.product
      }));

      const emailHTML = await generateInvoiceHTML(
        {
          invoice_number: invoice.invoice_number,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          status: invoice.status,
          subtotal: invoice.subtotal || 0,
          discount_amount: invoice.discount_amount || 0,
          tax_amount: invoice.tax_amount || 0,
          total_amount: invoice.total_amount,
          currency: invoice.currency,
          notes: invoice.notes,
          terms: invoice.terms
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        {
          name: invoice.clients?.name || 'N/A',
          email: invoice.clients?.email || '',
          phone: invoice.clients?.phone || '',
          address: invoice.clients?.address || '',
          city: invoice.clients?.city || '',
          state: invoice.clients?.state || '',
          postal_code: invoice.clients?.postal_code || '',
          country: invoice.clients?.country || '',
          gstin: invoice.clients?.gstin || '',
          hide_contact_details: invoice.clients?.hide_contact_details ?? false
        },
        formattedItems,
        company as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        template as any // eslint-disable-line @typescript-eslint/no-explicit-any
      );

      const { error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId: invoice.id,
          clientEmail: invoice.clients.email,
          clientName: invoice.clients.name,
          invoiceNumber: invoice.invoice_number,
          htmlContent: emailHTML,
          senderEmail: user?.email,
          senderName: company.company_name
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice email sent successfully."
      });
      setEmailConfirmationOpen(false);
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send email. Please try again."
      });
    }
  };

    if (!invoice) return null;

  const invToUse = fullInvoice || invoice;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl w-full max-h-[92vh] p-0 bg-white dark:bg-slate-950 border border-border shadow-2xl flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 rounded-t-lg shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <span>Invoice Preview - {invToUse.invoice_number}</span>
                <StatusBadge status={invToUse.status} dueDate={invToUse.due_date} />
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Review and manage invoice details before sending to client
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3 pr-8 sm:pr-10">
              {invToUse.clients?.email && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEmailConfirmationOpen(true)}
                  disabled={loading}
                  className="bg-white dark:bg-slate-900 border-slate-200 hover:bg-slate-50 font-semibold"
                >
                  <Mail className="w-4 h-4 mr-2 text-primary" />
                  Email
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={loading}
                className="font-semibold shadow-sm hover:shadow-md transition-all px-6"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100/40 dark:bg-slate-950/40 flex justify-center">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="w-full max-w-[820px]">
              <ResponsiveInvoiceWrapper maxWidth={template === 'thermal' ? 380 : template === 'auto_compact' ? 440 : 800}>
                <div className="shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 rounded-sm mb-6">
                  {(() => {
                    const isGeneric = isGenericPaymentDue(invToUse?.terms);
                    const paymentDaysMatch = (defaultPaymentTerms || '').match(/\d+/);
                    const paymentDays = paymentDaysMatch ? parseInt(paymentDaysMatch[0], 10) : 30;

                    const effectiveTerms = invToUse?.terms && invToUse.terms.trim() && !isGeneric
                      ? invToUse.terms.trim()
                      : (defaultTerms && defaultTerms.trim() 
                          ? defaultTerms.trim() 
                          : (paymentDays === 0 ? 'Payment due on receipt' : `Payment due within ${paymentDays} days`));

                    let effectiveDueDate = invToUse?.due_date;
                    if (isGeneric && invToUse?.issue_date && invToUse?.status !== 'paid' && paymentDays) {
                      const nextDue = new Date(new Date(invToUse.issue_date).getTime() + paymentDays * 24 * 60 * 60 * 1000);
                      effectiveDueDate = nextDue.toISOString().split('T')[0];
                    }

                    return (
                      <InvoiceTemplate
                        invoice={{
                          invoice_number: invToUse.invoice_number,
                          issue_date: invToUse.issue_date,
                          due_date: effectiveDueDate,
                          status: invToUse.status,
                          subtotal: invToUse.subtotal || 0,
                          discount_amount: invToUse.discount_amount || 0,
                          tax_amount: invToUse.tax_amount || 0,
                          total_amount: invToUse.total_amount,
                          currency: invToUse.currency,
                          notes: invToUse.notes,
                          terms: effectiveTerms
                        }}
                        client={invToUse.clients || { name: 'Customer', email: '' }}
                        items={items}
                        company={company as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                        template={template as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                      />
                    );
                  })()}
                </div>
              </ResponsiveInvoiceWrapper>
            </div>
          )}
        </div>

        <AlertDialog open={emailConfirmationOpen} onOpenChange={setEmailConfirmationOpen}>
          <AlertDialogContent className="rounded-xl border border-border shadow-2xl bg-white dark:bg-slate-900">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Send Invoice Email?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                This will send a professional PDF invoice to <strong>{invToUse.clients?.email}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-6">
              <AlertDialogCancel className="rounded-md font-semibold">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSendEmail} className="rounded-md font-semibold bg-primary hover:opacity-90">
                Send Email
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};
