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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { InvoiceTemplate } from "./InvoiceTemplate";
import { generateInvoicePDFBlob, generateInvoiceHTML, InvoiceData } from '@/utils/invoicePDF';
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
  email?: string | null;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  gstin?: string;
  hide_contact_details?: boolean | null;
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

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  open,
  onClose
}) => {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [company, setCompany] = useState<CompanyProfile>({});
  const [template, setTemplate] = useState('corporate');
  const [loading, setLoading] = useState(true);
  const [emailConfirmationOpen, setEmailConfirmationOpen] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInvoiceData = useCallback(async () => {
    if (!invoice || !user) return;

    setLoading(true);
    try {
      // Fetch invoice items
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select(`
          *,
          products (
            opening_stock,
            type,
            unit
          )
        `)
        .eq('invoice_id', invoice.id);

      if (itemsError) throw itemsError;

      // Fetch company profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch user settings for template
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('invoice_template, hide_company_details')
        .eq('user_id', user.id)
        .single();

      if (settingsError) console.warn('Could not fetch user settings, using default template');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itemsRaw = (itemsData as unknown as any[]) || [];
      setItems(itemsRaw.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        tax_rate: item.tax_rate,
        discount: item.discount || 0,
        amount: item.amount,
        product: item.products ? {
          opening_stock: item.products.opening_stock,
          type: item.products.type,
          unit: item.products.unit
        } : undefined
      })) || []);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prof = (profileData as unknown as any) || {};
      setCompany({
        company_name: prof?.company_name || '',
        email: user?.email || '',
        phone: prof?.phone || '',
        mobile: prof?.mobile || '',
        business_address: prof?.business_address || '',
        gstin: prof?.gstin || '',
        logo_url: prof?.logo_url || '',
        website: prof?.website || '',
        signature_url: prof?.signature_url || '',
        bank_name: prof?.bank_name || '',
        account_number: prof?.account_number || '',
        ifsc_code: prof?.ifsc_code || '',
        account_holder_name: prof?.account_holder_name || '',
        account_type: prof?.account_type || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hide_company_details: (settingsData as any)?.hide_company_details ?? false
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setTemplate((settingsData as any)?.invoice_template || 'corporate');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching invoice data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load invoice data: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  }, [invoice, user, toast]);

  useEffect(() => {
    if (invoice && open) {
      fetchInvoiceData();
    }
  }, [invoice, open, fetchInvoiceData]);

  const generatePDFBlob = async () => {
    if (!invoice || !user) throw new Error("Missing data");

    return await generateInvoicePDFBlob(
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95vw] w-full max-h-[96vh] overflow-y-auto p-0 bg-white dark:bg-slate-950 border-none shadow-2xl flex flex-col">
        <DialogHeader className="sticky top-0 z-10 w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 rounded-t-lg shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                Invoice Preview - {invoice.invoice_number}
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Review and manage invoice details before sending to client
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3 sm:pr-8">
              {invoice.clients?.email && (
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
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 px-4"
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div 
              id="invoice-preview-content" 
              className="flex-1 bg-slate-100/30 dark:bg-slate-950/30 p-0 sm:p-4 md:p-6 min-h-[600px] transition-colors overflow-y-auto flex flex-col items-center"
            >
              <ResponsiveInvoiceWrapper>
                <div className="shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 rounded-sm overflow-hidden h-fit mb-10">
                  <InvoiceTemplate
                    invoice={{
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
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    client={company.hide_company_details ? { ...invoice.clients || {}, address: '', email: '', phone: '', name: (invoice.clients as any)?.name || 'N/A' } as any : (invoice.clients || {} as any)}
                    items={items}
                    company={company as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                    template={template as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                  />
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
                This will send a professional PDF invoice to <strong>{invoice.clients?.email}</strong>.
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
