import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/StatusBadge';
import { safelyToLocaleDate } from '@/utils/dateUtils';
import {
  Eye,
  Download,
  Loader2,
  Pencil,
  Trash2,
  Mail,
  Phone,
  CreditCard,
  MoreVertical,
  MoreHorizontal,
  Car,
  ChefHat,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Invoice } from '@/types/invoice';
import { InvoiceSharedStatus } from '../types';
import { useUserType } from '@/hooks/useUserType';
import { kitchenService, KitchenOrder } from '@/services/kitchenService';

export interface InvoiceCardItemProps {
  invoice: Invoice;
  isDownpaymentInvoice: (inv: Invoice) => boolean;
  getCreatorTag: (terms?: string | null) => string;
  formatAmount: (amount: number) => string;
  handlePreviewInvoice: (invoice: Invoice) => void;
  downloadInvoicePDF: (invoice: Invoice) => void;
  uploadToGoogleDrive: (invoice: Invoice) => void;
  sendInvoiceSMS: (invoice: Invoice) => void;
  setEmailConfirmationOpen: (open: boolean) => void;
  setInvoiceToSend: (invoice: Invoice) => void;
  setInvoiceToMarkPaid: (invoice: Invoice) => void;
  setSelectedPaymentMethod: (method: string | null) => void;
  setMarkPaidDialogOpen: (open: boolean) => void;
  deleteInvoice: (invoiceId: string, invoiceNumber: string, status: string) => void;
  downloadingPDFId: string | null;
  uploadingWhatsApp: string | null;
  sharedInvoices: InvoiceSharedStatus;
  navigate: (path: string) => void;
}

export const InvoiceCardItem: React.FC<InvoiceCardItemProps> = ({
  invoice,
  isDownpaymentInvoice,
  getCreatorTag,
  formatAmount,
  handlePreviewInvoice,
  downloadInvoicePDF,
  uploadToGoogleDrive,
  sendInvoiceSMS,
  setEmailConfirmationOpen,
  setInvoiceToSend,
  setInvoiceToMarkPaid,
  setSelectedPaymentMethod,
  setMarkPaidDialogOpen,
  deleteInvoice,
  downloadingPDFId,
  uploadingWhatsApp,
  sharedInvoices,
  navigate,
}) => {
  const { isCafe } = useUserType();
  const isEffectiveCafe = isCafe || (invoice.notes || '').includes('[Order:');

  const [kitchenOrder, setKitchenOrder] = useState<KitchenOrder | undefined>(() => {
    return isEffectiveCafe ? kitchenService.getOrderByInvoice(invoice.invoice_number) : undefined;
  });

  useEffect(() => {
    if (!isEffectiveCafe) return;
    const updateOrder = () => {
      setKitchenOrder(kitchenService.getOrderByInvoice(invoice.invoice_number));
    };
    updateOrder();
    window.addEventListener('kitchen_orders_updated', updateOrder);
    window.addEventListener('storage', updateOrder);
    return () => {
      window.removeEventListener('kitchen_orders_updated', updateOrder);
      window.removeEventListener('storage', updateOrder);
    };
  }, [isEffectiveCafe, invoice.invoice_number]);

  const renderKitchenStatusBadge = () => {
    if (!isEffectiveCafe) return null;

    // Database invoice notes are the primary source of truth across all devices
    let status: 'active' | 'completed' | 'cancelled' = 'active';
    if (invoice.notes?.includes('[KDS:complete]')) {
      status = 'completed';
    } else if (invoice.notes?.includes('[KDS:cancelled]') || invoice.status === 'cancelled') {
      status = 'cancelled';
    } else if (kitchenOrder?.status) {
      status = kitchenOrder.status;
    }

    if (status === 'completed') {
      return (
        <Badge
          variant="outline"
          className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0"
          title="Kitchen Status: Completed"
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span>Complete</span>
        </Badge>
      );
    }

    if (status === 'cancelled') {
      return (
        <Badge
          variant="outline"
          className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0"
          title="Kitchen Status: Cancelled"
        >
          <XCircle className="w-3 h-3 text-rose-500" />
          <span>Cancelled</span>
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0 animate-in fade-in"
        title="Kitchen Status: In Progress"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
        <span>In Progress</span>
      </Badge>
    );
  };

  return (
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
                        {renderKitchenStatusBadge()}
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{invoice.clients?.name || 'Walk-in Customer'}</p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                        {getCreatorTag(invoice.payment_terms)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{safelyToLocaleDate(invoice.issue_date)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatAmount(invoice.total_amount)}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">{invoice.currency}</p>
                    </div>
                  </div>
                </div>

                {/* Mobile Actions */}
                <div className="pt-3 border-t space-y-2">
                    {invoice.status !== 'paid' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-9 w-full font-semibold ${sharedInvoices[invoice.id]?.whatsapp ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'text-emerald-700 hover:bg-emerald-50'}`}
                          onClick={(e) => { e.stopPropagation(); uploadToGoogleDrive(invoice); }}
                          disabled={uploadingWhatsApp === invoice.id}
                        >
                          {uploadingWhatsApp === invoice.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                          ) : (
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1.5 text-emerald-600">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                          )}
                          <span>WhatsApp</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-full font-semibold bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInvoiceToMarkPaid(invoice);
                            setSelectedPaymentMethod(null);
                            setMarkPaidDialogOpen(true);
                          }}
                        >
                          <CreditCard className="w-4 h-4 mr-1.5 text-emerald-600" />
                          <span>Mark Paid</span>
                        </Button>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-4 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-full"
                        onClick={(e) => { e.stopPropagation(); handlePreviewInvoice(invoice); }}
                        title="Preview Invoice"
                        aria-label="Preview Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-full"
                        onClick={(e) => { e.stopPropagation(); downloadInvoicePDF(invoice); }}
                        title="Download PDF"
                        aria-label="Download PDF"
                        disabled={downloadingPDFId === invoice.id}
                      >
                        {downloadingPDFId === invoice.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Download className="w-4 h-4" />}
                      </Button>
                      {invoice.status === 'paid' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-9 w-full ${sharedInvoices[invoice.id]?.whatsapp ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : ''}`}
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
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-full text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(isDownpaymentInvoice(invoice) ? `/invoices/${invoice.id}/edit?type=downpayment` : `/invoices/${invoice.id}/edit`);
                          }}
                          title="Edit Invoice"
                          aria-label="Edit Invoice"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-full"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`More actions for invoice ${invoice.invoice_number}`}
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
                          {invoice.status !== 'paid' && (
                            <DropdownMenuItem onClick={() => navigate(isDownpaymentInvoice(invoice) ? `/invoices/${invoice.id}/edit?type=downpayment` : `/invoices/${invoice.id}/edit`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Invoice
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

              {/* Desktop & Tablet Layout */}
              <div className="hidden md:flex items-center justify-between gap-3 min-w-0">
                {/* Left: Invoice info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base lg:text-lg font-bold truncate">{invoice.invoice_number}</h2>
                      {isDownpaymentInvoice(invoice) && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold py-0 px-1.5 flex items-center gap-1 shrink-0">
                          <Car className="w-3 h-3" /> Downpayment
                        </Badge>
                      )}
                      <StatusBadge status={invoice.status} dueDate={invoice.due_date} />
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate font-semibold">
                      {invoice.clients?.name || 'Walk-in Customer'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5 flex-wrap">
                      <span>{safelyToLocaleDate(invoice.issue_date)}</span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                        {getCreatorTag(invoice.payment_terms)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount + Actions */}
                <div className="flex items-center gap-2 lg:gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-base lg:text-lg font-bold text-foreground">{formatAmount(invoice.total_amount)}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">{invoice.currency}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* WhatsApp */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => uploadToGoogleDrive(invoice)}
                      title="Send PDF via WhatsApp"
                      aria-label={`Send invoice ${invoice.invoice_number} via WhatsApp`}
                      className={`flex items-center gap-1 h-8 lg:h-9 px-2 lg:px-3 font-semibold ${sharedInvoices[invoice.id]?.whatsapp ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 'text-emerald-700 hover:bg-emerald-50'}`}
                      disabled={uploadingWhatsApp === invoice.id}
                    >
                      {uploadingWhatsApp === invoice.id
                        ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                        : <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-600">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>}
                      <span className="hidden sm:inline">WhatsApp</span>
                    </Button>

                    {/* Real-time Kitchen Order Status Badge for Cafe next to WhatsApp */}
                    {renderKitchenStatusBadge()}

                    {/* Mark as Paid */}
                    {invoice.status !== 'paid' && (
                      <Button
                        variant="outline"
                        size="sm"
                        title="Mark as Paid"
                        aria-label={`Mark invoice ${invoice.invoice_number} as paid`}
                        onClick={() => {
                          setInvoiceToMarkPaid(invoice);
                          setSelectedPaymentMethod(null);
                          setMarkPaidDialogOpen(true);
                        }}
                        className="h-8 lg:h-9 px-2 lg:px-3 font-semibold bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800 transition-all active:scale-95"
                      >
                        <CreditCard className="w-4 h-4 lg:mr-1 text-emerald-600" />
                        <span className="hidden sm:inline">Mark as Paid</span>
                      </Button>
                    )}

                    {/* Quick Preview on wider screens */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreviewInvoice(invoice)}
                      title="Preview Invoice"
                      aria-label={`Preview invoice ${invoice.invoice_number}`}
                      className="hidden xl:inline-flex h-8 lg:h-9 w-8 lg:w-9 p-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    {/* Quick Download on wider screens */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadInvoicePDF(invoice)}
                      title="Download PDF"
                      aria-label={`Download PDF for invoice ${invoice.invoice_number}`}
                      disabled={downloadingPDFId === invoice.id}
                      className="hidden xl:inline-flex h-8 lg:h-9 w-8 lg:w-9 p-0"
                    >
                      {downloadingPDFId === invoice.id
                        ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        : <Download className="w-4 h-4" />}
                    </Button>

                    {/* Dropdown Menu for all extra actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 lg:h-9 w-8 lg:w-9 p-0"
                          onClick={(e) => e.stopPropagation()}
                          title="More actions"
                          aria-label={`More actions for invoice ${invoice.invoice_number}`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => handlePreviewInvoice(invoice)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadInvoicePDF(invoice)} disabled={downloadingPDFId === invoice.id}>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        {invoice.clients?.email && (
                          <DropdownMenuItem onClick={() => { setInvoiceToSend(invoice); setEmailConfirmationOpen(true); }}>
                            <Mail className={`mr-2 h-4 w-4 ${sharedInvoices[invoice.id]?.email ? 'text-emerald-600' : ''}`} />
                            Email to Client {sharedInvoices[invoice.id]?.email && "✓"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => sendInvoiceSMS(invoice)}>
                          <Phone className={`mr-2 h-4 w-4 ${sharedInvoices[invoice.id]?.sms ? 'text-emerald-600' : ''}`} />
                          Send via SMS {sharedInvoices[invoice.id]?.sms && "✓"}
                        </DropdownMenuItem>
                        {invoice.status !== 'paid' && (
                          <DropdownMenuItem onClick={() => navigate(isDownpaymentInvoice(invoice) ? `/invoices/${invoice.id}/edit?type=downpayment` : `/invoices/${invoice.id}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4 text-amber-600" />
                            Edit Invoice
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
            </Card>
  );
};
