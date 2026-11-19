import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  MoreHorizontal,
  Car,
  Printer,
  History,
  CheckCircle2,
  Coins,
  Landmark,
  Clock,
  ArrowRight,
  Wallet,
} from 'lucide-react';
import { extractVehicleDetails, extractPaymentDetails } from '@/components/AutoInvoiceTemplate';
import { getPaymentMethodLabel } from '../utils/downpaymentUtils';
import { DownpaymentCardItemProps } from '../types';

export const DownpaymentCardItem: React.FC<DownpaymentCardItemProps> = ({
  invoice,
  formatAmount,
  getCreatorTag,
  handlePreviewInvoice,
  handleDownloadPDF,
  handleShareWhatsApp,
  handleShareEmail,
  handleShareSMS,
  handlePrint,
  handleOpenMarkPaid,
  handleViewHistory,
  deleteInvoice,
  downloadingPDFId,
  uploadingWhatsApp,
  navigate,
}) => {
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
                        {(vehicle.vehicleNo || vehicle.regNo) && (
                          <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 text-[10px] font-mono font-bold py-0 px-1.5 flex items-center gap-1">
                            🔖 {vehicle.vehicleNo || vehicle.regNo}
                          </Badge>
                        )}
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
                  {(vehicle.vehicleNo || vehicle.regNo || vehicle.chassisNo || vehicle.totalKm || vehicle.serviceType || vehicle.nextServiceKm || vehicle.color || vehicle.financer) && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-muted/40 rounded-lg text-[11px] text-muted-foreground">
                      {(vehicle.vehicleNo || vehicle.regNo) && (
                        <span>
                          <strong>{((vehicle.vehicleNo || vehicle.regNo || '').toUpperCase().startsWith('BK')) ? 'Booking:' : 'Veh No:'}</strong>{' '}
                          <span className="font-mono font-bold text-foreground">{vehicle.vehicleNo || vehicle.regNo}</span>
                        </span>
                      )}
                      {vehicle.totalKm && <span>• <strong>KM:</strong> {vehicle.totalKm} KM</span>}
                      {vehicle.serviceType && <span>• <strong>Service:</strong> {vehicle.serviceType}</span>}
                      {(vehicle.nextServiceKm || vehicle.nextServiceDate) && (
                        <span>• <strong>Next Service:</strong> {vehicle.nextServiceKm ? `${vehicle.nextServiceKm} KM` : ''}{vehicle.nextServiceKm && vehicle.nextServiceDate ? ' / ' : ''}{vehicle.nextServiceDate || ''}</span>
                      )}
                      {vehicle.chassisNo && <span>• <strong>VIN:</strong> {vehicle.chassisNo}</span>}
                      {vehicle.color && <span>• <strong>Color:</strong> {vehicle.color}</span>}
                      {vehicle.financer && <span>• <strong>Financer:</strong> {vehicle.financer}</span>}
                    </div>
                  )}

                  {/* Payment Details Pill if Paid, Partial or Finance */}
                  {paymentDetails && (
                    <div className="p-2 bg-muted/30 rounded-lg text-xs space-y-0.5 border border-border/50">
                      {paymentDetails.type === 'full' && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                            Paid in Full via {getPaymentMethodLabel(paymentDetails.paymentMethod)}
                          </span>
                          {paymentDetails.date && (
                            <span className="text-muted-foreground text-[10px] font-medium">
                              {safelyToLocaleDate(paymentDetails.date)}
                            </span>
                          )}
                        </div>
                      )}
                      {paymentDetails.type === 'partial' && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-blue-700 dark:text-blue-300 font-semibold">Token Paid: {formatAmount(paymentDetails.amountReceived)}{paymentDetails.date ? ` (${safelyToLocaleDate(paymentDetails.date)})` : ''}</span>
                          <span className="text-rose-600 dark:text-rose-400 font-bold">Balance: {formatAmount(paymentDetails.balancePending)}</span>
                        </div>
                      )}
                      {paymentDetails.type === 'finance' && paymentDetails.finance && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-indigo-700 dark:text-indigo-300 font-semibold">Margin DP: {formatAmount(paymentDetails.finance.downpayment)}{paymentDetails.date ? ` (${safelyToLocaleDate(paymentDetails.date)})` : ''}</span>
                          <span className="text-foreground font-medium">Loan: {formatAmount(paymentDetails.finance.financedAmount)} ({paymentDetails.finance.financer})</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-3 border-t space-y-2">
                    {invoice.status !== 'paid' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-full font-semibold text-emerald-700 hover:bg-emerald-50 border-emerald-300/80"
                          onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(invoice); }}
                          disabled={uploadingWhatsApp === invoice.id}
                        >
                          {uploadingWhatsApp === invoice.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1.5 text-emerald-600" />
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
                            handleOpenMarkPaid(invoice);
                          }}
                        >
                          <CreditCard className="w-4 h-4 mr-1.5 text-emerald-600" />
                          <span>
                            {paymentDetails?.type === 'finance' && !paymentDetails?.finance?.disbursed
                              ? 'Disburse'
                              : paymentDetails?.type === 'partial'
                              ? 'Settle Due'
                              : 'Record Pay'}
                          </span>
                        </Button>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-4 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-full"
                        onClick={(e) => { e.stopPropagation(); handlePreviewInvoice(invoice); }}
                        title="Preview Receipt"
                        aria-label="Preview Receipt"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-full"
                        onClick={(e) => { e.stopPropagation(); handleDownloadPDF(invoice); }}
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
                          className="h-9 w-full text-emerald-600"
                          onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(invoice); }}
                          title="Share to WhatsApp"
                          aria-label="Share to WhatsApp"
                          disabled={uploadingWhatsApp === invoice.id}
                        >
                          {uploadingWhatsApp === invoice.id
                            ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                            : <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-500">
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
                            navigate(`/invoices/${invoice.id}/edit?type=downpayment`);
                          }}
                          title="Edit Receipt"
                          aria-label="Edit Receipt"
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
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => handlePrint(invoice)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Receipt
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewHistory(invoice)} className="text-blue-600 font-medium">
                            <History className="mr-2 h-4 w-4 text-blue-600" />
                            Payment Ledger
                          </DropdownMenuItem>
                          {invoice.clients?.email && (
                            <DropdownMenuItem onClick={() => handleShareEmail(invoice)}>
                              <Mail className="mr-2 h-4 w-4" />
                              Email to Client
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleShareSMS(invoice)}>
                            <Phone className="mr-2 h-4 w-4" />
                            Send via SMS
                          </DropdownMenuItem>
                          {invoice.status !== 'paid' && (
                            <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}/edit?type=downpayment`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Receipt
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => deleteInvoice(invoice.id, invoice.invoice_number, invoice.status)}
                            className="text-destructive font-medium cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {invoice.status === 'paid' ? 'Delete Paid Receipt ⚠️' : 'Delete Receipt'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Desktop View */}
                <div className="hidden md:flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base lg:text-lg font-bold text-foreground">{invoice.invoice_number}</h3>
                      {(vehicle.vehicleNo || vehicle.regNo) && (
                        <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 text-xs font-mono font-bold flex items-center gap-1">
                          🔖 {vehicle.vehicleNo || vehicle.regNo}
                        </Badge>
                      )}
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
                    {(vehicle.model || vehicle.vehicleNo || vehicle.regNo) && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                        {vehicle.model && (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold rounded-md border border-amber-500/20">
                            🚗 {vehicle.model}
                          </span>
                        )}
                        {(vehicle.vehicleNo || vehicle.regNo) && (
                          <span className="px-2 py-0.5 bg-muted text-foreground font-mono font-bold rounded-md text-[11px] border border-border/60">
                            {((vehicle.vehicleNo || vehicle.regNo || '').toUpperCase().startsWith('BK')) ? 'Booking: ' : 'Reg: '}
                            {vehicle.vehicleNo || vehicle.regNo}
                          </span>
                        )}
                        {vehicle.totalKm && (
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-md font-mono text-[11px]">
                            {vehicle.totalKm} KM
                          </span>
                        )}
                        {vehicle.serviceType && (
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold rounded-md text-[11px]">
                            🛠 {vehicle.serviceType}
                          </span>
                        )}
                        {(vehicle.nextServiceKm || vehicle.nextServiceDate) && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold rounded-md text-[11px]">
                            Next: {vehicle.nextServiceKm ? `${vehicle.nextServiceKm} KM` : ''}{vehicle.nextServiceKm && vehicle.nextServiceDate ? ' / ' : ''}{vehicle.nextServiceDate || ''}
                          </span>
                        )}
                        {vehicle.chassisNo && (
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-md font-mono text-[11px]">
                            VIN: {vehicle.chassisNo}
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

                    {/* Payment Settlement Badges (Full, Partial or Financed) */}
                    {paymentDetails && (
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs">
                        {paymentDetails.type === 'full' && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold rounded-md border border-emerald-500/20 text-[11px]">
                            ✅ Paid in Full{paymentDetails.date ? ` on ${safelyToLocaleDate(paymentDetails.date)}` : ''} via {getPaymentMethodLabel(paymentDetails.paymentMethod)}{paymentDetails.reference ? ` (${paymentDetails.reference})` : ''}
                          </span>
                        )}
                        {paymentDetails.type === 'partial' && (
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold rounded-md border border-blue-500/20 text-[11px]">
                            💰 Paid: {formatAmount(paymentDetails.amountReceived)}{paymentDetails.date ? ` on ${safelyToLocaleDate(paymentDetails.date)}` : ''} • Pending Due: {formatAmount(paymentDetails.balancePending)}
                          </span>
                        )}
                        {paymentDetails.type === 'finance' && paymentDetails.finance && (
                          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold rounded-md border border-indigo-500/20 text-[11px]">
                            🏦 Margin DP: {formatAmount(paymentDetails.finance.downpayment)}{paymentDetails.date ? ` on ${safelyToLocaleDate(paymentDetails.date)}` : ''} | Loan: {formatAmount(paymentDetails.finance.financedAmount)} ({paymentDetails.finance.financer}) • {paymentDetails.finance.disbursed ? 'Loan Disbursed' : 'Disbursal In-Process'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right side Amount + Actions */}
                  <div className="flex items-center gap-2 lg:gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-base lg:text-lg font-bold">{formatAmount(invoice.total_amount)}</p>
                      <p className="text-xs lg:text-sm text-muted-foreground uppercase">{invoice.currency}</p>
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

                    <div className="flex items-center gap-1.5">
                      {/* WhatsApp */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareWhatsApp(invoice)}
                        title="Send PDF via WhatsApp"
                        className="flex items-center gap-1 h-8 lg:h-9 px-2 lg:px-3 font-semibold text-emerald-700 hover:bg-emerald-50 border-emerald-300/80"
                        disabled={uploadingWhatsApp === invoice.id}
                      >
                        {uploadingWhatsApp === invoice.id
                          ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                          : <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-600">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>}
                        <span className="hidden sm:inline">WhatsApp</span>
                      </Button>

                      {/* Record Payment / Settle or Ledger */}
                      {invoice.status !== 'paid' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          title="Record Payment / Settle"
                          onClick={() => handleOpenMarkPaid(invoice)}
                          className="h-8 lg:h-9 px-2 lg:px-3 font-semibold bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800 transition-all active:scale-95"
                        >
                          <CreditCard className="w-4 h-4 lg:mr-1 text-emerald-600" />
                          <span className="hidden sm:inline">
                            {paymentDetails?.type === 'finance' && !paymentDetails?.finance?.disbursed
                              ? 'Disburse'
                              : paymentDetails?.type === 'partial'
                              ? `Settle (${formatAmount(paymentDetails.balancePending)})`
                              : 'Record Payment'}
                          </span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewHistory(invoice)}
                          title="View Payment Ledger"
                          className="h-8 lg:h-9 px-2 lg:px-3 font-semibold text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800 hover:bg-blue-50"
                        >
                          <History className="w-4 h-4 lg:mr-1" />
                          <span className="hidden sm:inline">Ledger</span>
                        </Button>
                      )}

                      {/* Quick Preview on wider screens */}
                      <Button variant="ghost" size="sm" onClick={() => handlePreviewInvoice(invoice)} title="Preview Receipt" className="hidden xl:inline-flex h-8 lg:h-9 w-8 lg:w-9 p-0">
                        <Eye className="w-4 h-4" />
                      </Button>

                      {/* Quick Download on wider screens */}
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(invoice)} disabled={downloadingPDFId === invoice.id} title="Download PDF" className="hidden xl:inline-flex h-8 lg:h-9 w-8 lg:w-9 p-0">
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
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => handlePreviewInvoice(invoice)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview Receipt
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)} disabled={downloadingPDFId === invoice.id}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrint(invoice)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Receipt
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewHistory(invoice)} className="text-blue-600 font-medium">
                            <History className="mr-2 h-4 w-4 text-blue-600" />
                            Payment Ledger
                          </DropdownMenuItem>
                          {invoice.clients?.email && (
                            <DropdownMenuItem onClick={() => handleShareEmail(invoice)}>
                              <Mail className="mr-2 h-4 w-4" />
                              Email to Client
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleShareSMS(invoice)}>
                            <Phone className="mr-2 h-4 w-4" />
                            Send via SMS
                          </DropdownMenuItem>
                          {invoice.status !== 'paid' && (
                            <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}/edit?type=downpayment`)}>
                              <Pencil className="mr-2 h-4 w-4 text-amber-600" />
                              Edit Receipt
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => deleteInvoice(invoice.id, invoice.invoice_number, invoice.status)}
                            className="text-destructive font-medium cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {invoice.status === 'paid' ? 'Delete Paid Receipt ⚠️' : 'Delete Receipt'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </Card>
  );
};

