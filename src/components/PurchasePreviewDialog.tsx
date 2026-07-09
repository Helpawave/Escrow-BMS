import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceTemplate } from "./InvoiceTemplate";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define internal interfaces based on InvoiceTemplate's expectations
interface TemplateInvoice {
  invoice_number: string;
  issue_date: string;
  due_date?: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount?: number;
  total_amount: number;
  currency: string;
  notes?: string;
  terms?: string;
}

interface TemplateClient {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  gstin?: string;
}

interface TemplateItem {
  description: string;
  quantity: number;
  rate: number;
  tax_rate: number;
  discount?: number;
  amount: number;
  product?: {
    opening_stock?: string | number;
    type?: string;
    unit?: string;
  };
}

interface CompanyProfile {
  company_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  business_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  logo_url?: string;
  website?: string;
  signature_url?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  account_type?: string;
}

// Interfaces for Supabase raw data to avoid 'any' and handle relationship inference
interface RawVendor {
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  gstin: string | null;
}

interface RawProduct {
  opening_stock: string | number | null;
  type: string | null;
  unit: string | null;
}

interface RawPurchaseInvoice {
  id: string;
  invoice_number: string | null;
  issue_date: string;
  due_date: string | null;
  status: string | null;
  subtotal: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  total_amount: number | null;
  currency: string | null;
  notes: string | null;
  terms: string | null;
  vendors: RawVendor | null;
}

interface RawPurchaseItem {
  description: string;
  quantity: number;
  rate: number;
  tax_rate: number | null;
  discount: number | null;
  amount: number;
  product: RawProduct | null;
}

interface PurchasePreviewDialogProps {
  invoiceId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PurchasePreviewDialog: React.FC<PurchasePreviewDialogProps> = ({
  invoiceId,
  isOpen,
  onOpenChange,
}) => {
  const { user } = useAuth();

  const { data: fullData, isLoading } = useQuery({
    queryKey: ['purchase_invoice_preview', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;

      // Fetch invoice with vendor details
      const { data: invoiceRaw, error: invoiceError } = await supabase
        .from('purchase_invoices')
        .select('*, vendors(*)')
        .eq('id', invoiceId)
        .single();
      if (invoiceError) throw invoiceError;

      // Cast the raw data to handle relationship inference issues
      const invoice = (invoiceRaw as unknown) as RawPurchaseInvoice;

      // Fetch items with product details
      const { data: itemsRaw, error: itemsError } = await supabase
        .from('purchase_invoice_items')
        .select('*, product:products(*) ')
        .eq('invoice_id', invoiceId);
      if (itemsError) throw itemsError;

      const items = (itemsRaw as unknown) as RawPurchaseItem[];

      // Fetch company/user profile
      const { data: companyRaw, error: companyError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (companyError) throw companyError;

      const company = (companyRaw as unknown) as CompanyProfile;
      const vendor = invoice.vendors;

      return {
        invoice: {
          invoice_number: invoice.invoice_number || 'N/A',
          issue_date: invoice.issue_date,
          due_date: invoice.due_date || undefined,
          status: invoice.status || 'pending',
          subtotal: invoice.subtotal || 0,
          tax_amount: invoice.tax_amount || 0,
          discount_amount: invoice.discount_amount || 0,
          total_amount: invoice.total_amount || 0,
          currency: invoice.currency || 'INR',
          notes: invoice.notes || '',
          terms: invoice.terms || '',
        } as TemplateInvoice,
        client: {
          name: vendor?.name || 'Unknown Vendor',
          email: vendor?.email || '',
          phone: vendor?.phone || undefined,
          address: vendor?.address || undefined,
          city: vendor?.city || undefined,
          state: vendor?.state || undefined,
          postal_code: vendor?.postal_code || undefined,
          country: vendor?.country || undefined,
          gstin: vendor?.gstin || undefined,
        } as TemplateClient,
        items: (items || []).map((item) => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          tax_rate: item.tax_rate || 0,
          discount: item.discount || 0,
          amount: item.amount,
          product: item.product ? {
            opening_stock: item.product.opening_stock || undefined,
            type: item.product.type || undefined,
            unit: item.product.unit || undefined
          } : undefined,
        })) as TemplateItem[],
        company: company,
      };
    },
    enabled: !!invoiceId && isOpen,
  });

  const handlePrint = () => {
    const printArea = document.getElementById('purchase-bill-print-area');
    if (!printArea) return;

    const win = window.open('', '', 'height=700,width=1000');
    if (!win) return;

    win.document.write(`<html><head><title>Purchase Bill</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>@media print { body { -webkit-print-color-adjust: exact; } }</style>
    </head><body>`);
    win.document.write(printArea.innerHTML);
    win.document.write('</body></html>');
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); win.close(); }, 700);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full sm:h-[90vh] sm:max-w-5xl p-0 overflow-hidden flex flex-col rounded-none sm:rounded-3xl border-none shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 pr-12 sm:pr-16 bg-white dark:bg-slate-900 border-b shrink-0 flex flex-row items-center justify-between">
          <div className="text-left">
            <DialogTitle className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">
              Bill Preview
            </DialogTitle>
            <DialogDescription className="hidden sm:block text-slate-500 text-sm mt-0.5 font-medium">
              Professional layout for procurement records
            </DialogDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="hero"
              size="sm"
              onClick={handlePrint}
              disabled={isLoading || !fullData}
              className="rounded-xl font-bold h-10 px-4"
            >
              <Printer className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Print / PDF</span>
              <span className="sm:hidden">Print</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-slate-100 dark:bg-slate-800 p-0 sm:p-8">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              <p className="text-slate-500 font-medium animate-pulse">Loading bill details…</p>
            </div>
          ) : fullData ? (
            <ScrollArea className="h-full">
              <div className="p-2 sm:p-0">
                <div
                  id="purchase-bill-print-area"
                  className="bg-white mx-auto shadow-2xl sm:rounded-2xl overflow-hidden origin-top scale-[0.7] sm:scale-100 mb-[-150px] sm:mb-0"
                >
                  <InvoiceTemplate
                    invoice={fullData.invoice}
                    client={fullData.client}
                    items={fullData.items}
                    company={fullData.company}
                    template="corporate"
                  />
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 font-medium">
              Failed to load bill data.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
