import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { useToast } from "@/hooks/use-toast";
import { InvoicePreview } from "./InvoicePreview";
import { generateInvoicePDFBlob } from "@/utils/invoicePDF";

type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "overdue";

interface Invoice {
  id: string;
  invoice_number: string;
  clients: {
    name: string;
    email?: string;
    phone?: string;
  };
  total_amount: number;
  status: string;
  due_date?: string;
  issue_date: string;
  currency: string;
  subtotal: number;
  tax_amount: number;
  discount_amount?: number;
  notes?: string;
  terms?: string;
}

interface InvoiceTableProps {
  limit?: number;
}

export function InvoiceTable({ limit = 5 }: InvoiceTableProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchRecentInvoices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          total_amount,
          status,
          issue_date,
          due_date,
          currency,
          subtotal,
          tax_amount,
          discount_amount,
          notes,
          terms,
          clients (
            *
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setInvoices((data as unknown as Invoice[]) || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (user) {
      fetchRecentInvoices();
    }
  }, [user, fetchRecentInvoices]);

  const handleDownload = async (invoice: Invoice) => {
    try {
      setDownloadingId(invoice.id);
      
      const [itemsRes, profileRes, settingsRes] = await Promise.all([
        supabase.from('invoice_items').select('*, products(*)').eq('invoice_id', invoice.id),
        supabase.from('profiles').select('*').eq('user_id', user?.id).single(),
        supabase.from('user_settings').select('invoice_template, hide_company_details').eq('user_id', user?.id).single()
      ]);

      const itemsData = (itemsRes.data as unknown as Record<string, unknown>[]) || [];
      const profileData = (profileRes.data as unknown as Record<string, unknown>) || {};
      const settingsData = (settingsRes.data as unknown as Record<string, unknown>) || {};
      
      const formattedItems = itemsData.map((item: Record<string, unknown>) => ({
        description: item.description as string,
        quantity: item.quantity as number,
        rate: item.rate as number,
        tax_rate: item.tax_rate as number,
        discount: (item.discount as number) || 0,
        amount: item.amount as number,
        product: item.products
      }));

      const template = (['professional', 'elegant', 'minimal', 'modern', 'corporate'].includes(settingsData?.invoice_template as string)
        ? settingsData.invoice_template
        : 'corporate') as 'professional' | 'elegant' | 'minimal' | 'modern' | 'corporate';

      const blob = await generateInvoicePDFBlob(
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
        },
        {
          name: invoice.clients?.name || 'N/A',
          email: invoice.clients?.email || '',
          phone: invoice.clients?.phone || '',
          ...(invoice.clients as Record<string, unknown>)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        formattedItems,
        {
          company_name: profileData.company_name || '',
          email: user?.email || '',
          ...profileData,
          hide_company_details: settingsData?.hide_company_details
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        template
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Success", description: "Invoice PDF downloaded successfully." });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to download PDF." });
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No invoices found. Create your first invoice to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-xl shadow-black/5">
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-border/40">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="p-4 active:bg-muted/50 transition-colors flex items-center justify-between group cursor-pointer"
              onClick={() => { setPreviewInvoice(invoice); setPreviewOpen(true); }}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-foreground">{invoice.invoice_number}</span>
                  <StatusBadge status={invoice.status as InvoiceStatus} />
                </div>
                <p className="text-xs text-muted-foreground font-medium">{invoice.clients?.name || 'Unknown Client'}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{safelyToLocaleDate(invoice.issue_date)}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <span className="font-black text-foreground text-lg">
                  {invoice.currency === 'USD' ? '$' : (invoice.currency === 'EUR' ? '€' : (invoice.currency === 'GBP' ? '£' : '₹'))}
                  {invoice.total_amount.toFixed(2)}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/30">
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Invoice</TableHead>
                <TableHead className="font-semibold">Client</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Issue Date</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-colors group">
                  <TableCell className="font-bold">{invoice.invoice_number}</TableCell>
                  <TableCell className="font-medium">{invoice.clients?.name || 'Unknown Client'}</TableCell>
                  <TableCell className="font-black">
                    {invoice.currency === 'USD' ? '$' : (invoice.currency === 'EUR' ? '€' : (invoice.currency === 'GBP' ? '£' : '₹'))}
                    {invoice.total_amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={invoice.status as InvoiceStatus} />
                  </TableCell>
                  <TableCell className="text-muted-foreground font-medium">
                    {safelyToLocaleDate(invoice.issue_date)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl backdrop-blur-xl bg-background/95">
                        <DropdownMenuItem onClick={() => { setPreviewInvoice(invoice); setPreviewOpen(true); }} className="rounded-lg font-bold cursor-pointer">
                          <Eye className="mr-2 h-4 w-4 text-indigo-500" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(invoice)} disabled={downloadingId === invoice.id} className="rounded-lg font-bold cursor-pointer">
                          <Download className="mr-2 h-4 w-4 text-emerald-500" />
                          {downloadingId === invoice.id ? "Downloading..." : "Download"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <InvoicePreview
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        invoice={previewInvoice as any}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
