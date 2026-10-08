import React from 'react';
import { safelyFormatDate } from '@/utils/dateUtils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Car, Shield, CheckCircle2, Phone, Mail, MapPin, Building, QrCode, CreditCard, Sparkles, AlertCircle } from 'lucide-react';
import QRCode from 'react-qr-code';

export type AutoTemplateId = 'auto_dealership' | 'auto_modern' | 'auto_classic' | 'auto_executive' | 'auto_compact';

export interface VehicleDetailsData {
  model?: string;
  chassisNo?: string;
  engineNo?: string;
  color?: string;
  regNo?: string;
  financer?: string;
  deliveryDate?: string;
}

export interface AutoInvoiceTemplateProps {
  template?: AutoTemplateId;
  invoice: any;
  client: any;
  items?: any[];
  company: any;
  currencySymbol?: string;
}

export function extractVehicleDetails(invoice: any): VehicleDetailsData {
  if (invoice?.vehicle_details && typeof invoice.vehicle_details === 'object') {
    return invoice.vehicle_details;
  }
  // Try parsing from structured metadata in notes
  if (invoice?.notes && typeof invoice.notes === 'string') {
    const metaMatch = invoice.notes.match(/\[META:(.*?)\]/);
    if (metaMatch) {
      try {
        const parsed = JSON.parse(metaMatch[1]);
        if (parsed.vehicle) return parsed.vehicle;
      } catch {}
    }
    // Regex fallback
    const model = invoice.notes.match(/Model:\s*([^\n|]+)/i)?.[1]?.trim();
    const chassisNo = invoice.notes.match(/Chassis(?:\s*No)?:\s*([^\n|]+)/i)?.[1]?.trim();
    const engineNo = invoice.notes.match(/Engine(?:\s*No)?:\s*([^\n|]+)/i)?.[1]?.trim();
    const color = invoice.notes.match(/Color:\s*([^\n|]+)/i)?.[1]?.trim();
    const regNo = invoice.notes.match(/(?:Reg|Booking)(?:\s*No)?:\s*([^\n|]+)/i)?.[1]?.trim();
    const financer = invoice.notes.match(/Financer:\s*([^\n|]+)/i)?.[1]?.trim();
    if (model || chassisNo || engineNo || color || regNo || financer) {
      return { model, chassisNo, engineNo, color, regNo, financer };
    }
  }
  // Fallback realistic placeholder ONLY for sample preview mode (e.g. settings showcase)
  if (!invoice || !invoice.invoice_number || invoice.invoice_number.includes('DP-2026-0042')) {
    return {
      model: 'Swift ZXI+ Dual Tone (Petrol MT)',
      chassisNo: 'MA3EWB1S00J129841',
      engineNo: 'K12MN8273615',
      color: 'Pearl Arctic White / Midnight Black',
      regNo: 'DL-04-TC-2026',
      financer: 'Self Finance / Cash'
    };
  }

  return {
    model: '',
    chassisNo: '',
    engineNo: '',
    color: '',
    regNo: '',
    financer: ''
  };
}

export interface VehiclePaymentDetails {
  type: 'full' | 'partial' | 'finance';
  totalAmount: number;
  amountReceived: number;
  balancePending: number;
  paymentMethod: string;
  reference?: string;
  date?: string;
  finance?: {
    downpayment: number;
    financedAmount: number;
    financer: string;
    disbursed: boolean;
    loanAccount?: string;
  };
}

export function extractPaymentDetails(invoice: any): VehiclePaymentDetails | null {
  if (!invoice) return null;
  if (invoice.notes && typeof invoice.notes === 'string') {
    const metaMatch = invoice.notes.match(/\[META:(.*?)\]/);
    if (metaMatch) {
      try {
        const parsed = JSON.parse(metaMatch[1]);
        if (parsed.payment) {
          return {
            type: parsed.payment.type || 'full',
            totalAmount: Number(parsed.payment.total_amount || invoice.total_amount || 0),
            amountReceived: Number(parsed.payment.amount_received || 0),
            balancePending: Number(parsed.payment.balance_pending || 0),
            paymentMethod: parsed.payment.payment_method || 'cash',
            reference: parsed.payment.reference,
            date: parsed.payment.date,
            finance: parsed.payment.finance ? {
              downpayment: Number(parsed.payment.finance.downpayment || 0),
              financedAmount: Number(parsed.payment.finance.financed_amount || 0),
              financer: parsed.payment.finance.financer || '',
              disbursed: Boolean(parsed.payment.finance.disbursed),
              loanAccount: parsed.payment.finance.loan_account || ''
            } : undefined
          };
        }
      } catch {}
    }
  }
  return null;
}

export const AutoInvoiceTemplate: React.FC<AutoInvoiceTemplateProps> = ({
  template = 'auto_dealership',
  invoice,
  client,
  items = [],
  company,
  currencySymbol: propCurrencySymbol
}) => {
  let contextCurrencySymbol = '₹';
  try {
    const context = useCurrency();
    contextCurrencySymbol = context.currencySymbol;
  } catch {}
  const currencySymbol = propCurrencySymbol || contextCurrencySymbol;

  const vehicle = extractVehicleDetails(invoice);
  const paymentDetails = extractPaymentDetails(invoice);
  const totalAmount = Number(invoice.total_amount || 0);
  const downpaymentAmount = Number(invoice.discount_amount || invoice.subtotal || totalAmount);
  
  const isPaid = invoice.status === 'paid';
  const isDraft = invoice.status === 'draft';
  const isPartial = paymentDetails?.type === 'partial' || 
                    (paymentDetails?.type === 'finance' && !paymentDetails.finance?.disbursed) ||
                    (invoice.status !== 'paid' && invoice.status !== 'draft' && Boolean(paymentDetails?.amountReceived));
  const isPending = !isPaid && !isDraft && !isPartial;

  // Scannable UPI Payment URI
  const upiPayUri = React.useMemo(() => {
    const payeeName = company.account_holder_name || company.company_name || 'Automobile Dealership';
    const upiId = company.upi_id || (company.phone ? `${company.phone.replace(/[^0-9]/g, '').slice(-10)}@upi` : '');
    if (!upiId) return `https://escrow-bill.web.app/invoices?verify=${encodeURIComponent(invoice.invoice_number)}&amt=${totalAmount.toFixed(2)}`;
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Booking ${invoice.invoice_number}`)}`;
  }, [company, invoice.invoice_number, totalAmount]);

  // Clean notes excluding meta tags
  const cleanNotes = React.useMemo(() => {
    if (!invoice?.notes) return '';
    return invoice.notes.replace(/\[META:.*?\]/g, '').replace(/--- VEHICLE BOOKING DETAILS ---[\s\S]*?(?=\n\n|$)/g, '').trim();
  }, [invoice?.notes]);

  const effectiveLogoUrl = company?.logo_url || company?.logo || company?.company_logo || (typeof window !== 'undefined' ? (localStorage.getItem('escrow_company_logo_url') || '') : '') || '';
  const effectiveSignatureUrl = company?.signature_url || company?.signature || company?.signature_image || (typeof window !== 'undefined' ? (localStorage.getItem('escrow_company_signature_url') || '') : '') || '';

  // =========================================================================
  // 1. SHOWROOM DEALERSHIP SLIP (auto_dealership)
  // =========================================================================
  if (template === 'auto_dealership') {
    return (
      <div className="invoice-template bg-white text-slate-900 p-6 sm:p-8 max-w-4xl mx-auto border-2 border-slate-900 shadow-lg font-sans">
        {/* Dealership Top Banner */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {effectiveLogoUrl ? (
                <img
                  src={effectiveLogoUrl}
                  alt={company.company_name || 'Logo'}
                  className="max-h-14 max-w-[150px] object-contain rounded-md"
                />
              ) : (
                <span className="p-1.5 bg-red-600 text-white rounded-lg">
                  <Car className="w-5 h-5" />
                </span>
              )}
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                {company.company_name || 'AUTHORIZED AUTOMOBILE DEALERSHIP'}
              </h1>
            </div>
            <p className="text-xs text-slate-600 max-w-md">
              {[company.business_address, company.city, company.state, company.pincode].filter(Boolean).join(', ')}
            </p>
            <div className="flex flex-wrap gap-x-4 text-[11px] font-semibold text-slate-700 pt-0.5">
              {company.phone && <span>Tel: {company.phone}</span>}
              {company.email && <span>Email: {company.email}</span>}
              {company.gstin && <span className="font-mono font-bold text-red-700">GSTIN: {company.gstin}</span>}
            </div>
          </div>

          <div className="text-left sm:text-right bg-slate-100 p-3 rounded-lg border border-slate-300 w-full sm:w-auto">
            <div className="inline-block bg-red-600 text-white font-black text-[10px] uppercase tracking-widest px-2.5 py-1 rounded">
              Vehicle Booking Advance Slip
            </div>
            <p className="text-xs font-mono font-bold mt-1.5">Slip No: <span className="text-red-700 font-extrabold">{invoice.invoice_number}</span></p>
            <p className="text-[11px] text-slate-600">Booking Date: {safelyFormatDate(invoice.issue_date, 'dd MMM yyyy')}</p>
            <p className="text-[11px] font-bold text-slate-800">Status: <span className="uppercase text-emerald-700">{invoice.status || 'Active'}</span></p>
          </div>
        </div>

        {/* Customer Information Grid */}
        <div className="my-4 p-3.5 bg-slate-50 border border-slate-300 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block">Customer / Allottee Details</span>
            <p className="font-bold text-sm text-slate-900">{client.name || 'Valued Customer'}</p>
            <p className="text-slate-600">{[client.address, client.city, client.state, client.postal_code].filter(Boolean).join(', ')}</p>
            <p className="text-slate-700 font-semibold mt-0.5">{client.phone && `Mobile: ${client.phone}`} {client.email && `| Email: ${client.email}`}</p>
          </div>
          <div className="sm:text-right sm:border-l sm:border-slate-200 sm:pl-4">
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block">Financing / Hypothecation</span>
            <p className="font-bold text-slate-800">{vehicle.financer || 'Cash / Self Finance'}</p>
            {client.gstin && <p className="font-mono text-slate-600 text-[11px]">Customer GSTIN: {client.gstin}</p>}
          </div>
        </div>

        {/* Vehicle Specifications Box */}
        <div className="border-2 border-red-700/80 rounded-lg overflow-hidden my-4">
          <div className="bg-red-700 text-white px-3 py-1.5 flex items-center justify-between text-xs font-black uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Car className="w-4 h-4" /> Vehicle Allotment & Booking Specifications
            </span>
            <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded">FORM 21 COMPLIANT</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 divide-x divide-y divide-slate-300 bg-white text-xs">
            <div className="p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Model & Variant</span>
              <span className="font-extrabold text-slate-900 text-sm">{vehicle.model || 'Standard Variant'}</span>
            </div>
            <div className="p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Color / Shade</span>
              <span className="font-bold text-slate-900">{vehicle.color || 'Standard Factory Shade'}</span>
            </div>
            <div className="p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Booking / Reg No.</span>
              <span className="font-mono font-bold text-slate-900">{vehicle.regNo || 'PENDING ALLOTMENT'}</span>
            </div>
            <div className="p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Chassis / VIN Number</span>
              <span className="font-mono font-extrabold text-slate-900">{vehicle.chassisNo || 'CH-TO-BE-ALLOCATED'}</span>
            </div>
            <div className="p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Engine Number</span>
              <span className="font-mono font-extrabold text-slate-900">{vehicle.engineNo || 'ENG-TO-BE-ALLOCATED'}</span>
            </div>
            <div className="p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Hypothecated To</span>
              <span className="font-bold text-slate-900">{vehicle.financer || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Financial Downpayment / Advance Breakdown Table */}
        <div className="border border-slate-300 rounded-lg overflow-hidden my-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-300 font-black text-slate-700 uppercase text-[10px]">
              <tr>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3 text-center">HSN / SAC</th>
                <th className="py-2 px-3 text-right">Estimated Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-2.5 px-3">
                  <p className="font-bold text-slate-900">Vehicle Booking Advance / Token Downpayment</p>
                  <p className="text-[11px] text-slate-500">Non-refundable token deposit towards allotment of {vehicle.model}</p>
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-[11px]">8703</td>
                <td className="py-2.5 px-3 text-right font-bold text-sm">{currencySymbol}{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
          <div className="bg-slate-50 border-t-2 border-slate-900 p-3 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-800">Payment Status: </span>
              {isPaid ? (
                <span className="font-black text-emerald-700 uppercase bg-emerald-100/90 px-2.5 py-0.5 rounded border border-emerald-300">
                  Received in Full with Thanks
                </span>
              ) : isPartial ? (
                <span className="font-black text-blue-700 uppercase bg-blue-100/90 px-2.5 py-0.5 rounded border border-blue-300">
                  Partial Payment Received ({currencySymbol}{paymentDetails?.amountReceived ? paymentDetails.amountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''} Received)
                </span>
              ) : isDraft ? (
                <span className="font-bold text-slate-700 uppercase bg-slate-200 px-2.5 py-0.5 rounded border border-slate-300">
                  Draft / Booking Quotation (Payment Pending)
                </span>
              ) : (
                <span className="font-bold text-amber-700 uppercase bg-amber-100/90 px-2.5 py-0.5 rounded border border-amber-300">
                  Payment Pending
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-600 uppercase">
                {isPaid ? "Total Advance Received: " : isPartial ? "Total Advance Payable: " : isDraft ? "Estimated Deposit: " : "Advance Payable: "}
              </span>
              <span className="text-lg font-black text-slate-900 ml-2">{currencySymbol}{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          {paymentDetails && (
            <div className="bg-amber-50/70 border-t border-slate-200 px-3 py-2 text-[11px] flex flex-wrap justify-between items-center gap-2">
              {paymentDetails.type === 'partial' && (
                <>
                  <span className="text-blue-900 font-semibold">
                    Token Received: <strong className="font-black">{currencySymbol}{paymentDetails.amountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> via {paymentDetails.paymentMethod.toUpperCase()}
                  </span>
                  <span className="text-rose-700 font-bold">
                    Balance Due: {currencySymbol}{paymentDetails.balancePending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </>
              )}
              {paymentDetails.type === 'finance' && paymentDetails.finance && (
                <>
                  <span className="text-indigo-950 font-semibold">
                    Downpayment: <strong className="font-black">{currencySymbol}{paymentDetails.finance.downpayment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> | Loan: <strong className="font-black">{currencySymbol}{paymentDetails.finance.financedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> ({paymentDetails.finance.financer})
                  </span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${paymentDetails.finance.disbursed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {paymentDetails.finance.disbursed ? 'Loan Disbursed' : 'Disbursal In-Process'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Terms & Dual Signature Grid */}
        <div className="mt-6 pt-4 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1 text-[10px] text-slate-600">
            <p className="font-bold text-slate-800 uppercase">Booking Terms & Conditions:</p>
            <p>1. The vehicle allotment is subject to availability and price ruling at the time of delivery.</p>
            <p>2. Final registration will be executed only upon receipt of complete on-road payment.</p>
            {cleanNotes && <p className="font-medium text-slate-700 pt-1">Note: {cleanNotes}</p>}
          </div>

          <div className="flex justify-between items-end sm:justify-end sm:gap-12 pt-6 sm:pt-0">
            <div className="text-center">
              <div className="w-32 border-b border-slate-400 mb-1"></div>
              <p className="text-[10px] font-bold text-slate-600 uppercase">Customer Signature</p>
            </div>
            <div className="text-center flex flex-col items-center">
              {effectiveSignatureUrl ? (
                <img
                  src={effectiveSignatureUrl}
                  alt="Authorized Signatory"
                  className="h-12 max-h-12 object-contain mix-blend-multiply mb-1"
                />
              ) : (
                <div className="h-10"></div>
              )}
              <div className="w-36 border-b border-slate-900 mb-1"></div>
              <p className="text-[10px] font-black text-slate-900 uppercase">Authorized Dealer Signatory</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. MODERN DRIVE BOOKING VOUCHER (auto_modern)
  // =========================================================================
  if (template === 'auto_modern') {
    return (
      <div className="invoice-template bg-white text-slate-900 p-6 sm:p-8 max-w-4xl mx-auto rounded-2xl shadow-xl border border-slate-200 font-sans">
        {/* Header with Dark Modern Drive Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-6 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            {effectiveLogoUrl ? (
              <img
                src={effectiveLogoUrl}
                alt="Logo"
                className="max-h-14 max-w-[140px] object-contain rounded bg-white/10 p-1"
              />
            ) : null}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-widest">
                <Car className="w-4 h-4" /> Automotive Booking Receipt
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">{company.company_name || 'ELITE MOTORS'}</h1>
              <p className="text-xs text-slate-300">{company.city || 'Gurugram'}, {company.state || 'Haryana'} • Tel: {company.phone || '+91 9876543210'}</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/20 text-right">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">Voucher No</span>
            <span className="text-lg font-mono font-black text-white">{invoice.invoice_number}</span>
            <span className="text-[10px] text-slate-300 block mt-0.5">{safelyFormatDate(invoice.issue_date, 'dd MMM yyyy')}</span>
          </div>
        </div>

        {/* Vehicle Highlights Hero Card */}
        <div className="my-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-900 tracking-wider block">Allocated Vehicle</span>
            <span className="text-base font-black text-slate-900">{vehicle.model || 'Model TBD'}</span>
            <span className="text-xs text-slate-600 block mt-0.5">Color: {vehicle.color || 'Standard'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-900 tracking-wider block">Chassis / VIN</span>
            <span className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-1 rounded border border-amber-200 inline-block mt-0.5">
              {vehicle.chassisNo || 'PENDING ALLOTMENT'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-900 tracking-wider block">Hypothecation</span>
            <span className="text-xs font-bold text-slate-800 block mt-0.5">{vehicle.financer || 'Direct Payment'}</span>
          </div>
        </div>

        {/* Customer & Payment Split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs my-4">
          <div className="p-4 rounded-xl border border-slate-200 space-y-1">
            <p className="font-black text-slate-800 uppercase text-[10px] tracking-wider">Customer Particulars</p>
            <p className="font-bold text-sm text-slate-900">{client.name || 'Customer'}</p>
            <p className="text-slate-600">{client.phone} • {client.email}</p>
            <p className="text-slate-500">{client.address}</p>
          </div>
          <div className={`p-4 rounded-xl border-2 flex flex-col justify-between ${
            isPaid ? "border-emerald-500/30 bg-emerald-50/50" :
            isPartial ? "border-blue-500/30 bg-blue-50/50" :
            isDraft ? "border-slate-300 bg-slate-50" :
            "border-amber-500/30 bg-amber-50/50"
          }`}>
            <div className="flex justify-between items-center">
              <span className="font-black uppercase text-[10px] tracking-wider text-slate-800">
                {isPaid ? "Advance Paid" : isPartial ? "Partial Advance" : isDraft ? "Advance Estimate" : "Advance Due"}
              </span>
              <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                isPaid ? "bg-emerald-600 text-white" :
                isPartial ? "bg-blue-600 text-white" :
                isDraft ? "bg-slate-500 text-white" :
                "bg-amber-500 text-white"
              }`}>
                {isPaid ? "CONFIRMED / PAID" : isPartial ? "PARTIAL PAYMENT" : isDraft ? "DRAFT QUOTE" : "PAYMENT PENDING"}
              </span>
            </div>
            <div className="text-right mt-2">
              <span className={`text-2xl font-black ${
                isPaid ? "text-emerald-800" : isPartial ? "text-blue-800" : isDraft ? "text-slate-800" : "text-amber-800"
              }`}>
                {currencySymbol}{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                {isPaid
                  ? `Payment mode: ${paymentDetails?.paymentMethod ? paymentDetails.paymentMethod.toUpperCase() : 'Cash / Bank Transfer'} (Cleared)`
                  : isPartial
                  ? `Received: ${currencySymbol}${paymentDetails?.amountReceived?.toLocaleString('en-IN')} • Due: ${currencySymbol}${paymentDetails?.balancePending?.toLocaleString('en-IN')}`
                  : paymentDetails?.finance
                  ? `DP: ${currencySymbol}${paymentDetails.finance.downpayment.toLocaleString('en-IN')} • Loan: ${paymentDetails.finance.financer} (${currencySymbol}${paymentDetails.finance.financedAmount.toLocaleString('en-IN')})`
                  : isDraft
                  ? "Quotation estimate • Advance not yet received"
                  : "Awaiting payment confirmation"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <p>© {company.company_name || 'Dealership'} • Computer Generated Downpayment Slip</p>
          <div className="flex flex-col items-end">
            {effectiveSignatureUrl && (
              <img src={effectiveSignatureUrl} alt="Signature" className="h-10 max-h-10 object-contain mix-blend-multiply mb-1" />
            )}
            <div className="text-right font-bold text-slate-800">
              Authorized Signature: _______________________
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. CLASSIC RTO & VEHICLE FORM (auto_classic)
  // =========================================================================
  if (template === 'auto_classic') {
    return (
      <div className="invoice-template bg-white text-slate-900 p-6 sm:p-8 max-w-4xl mx-auto border-2 border-slate-900 font-serif">
        <div className="text-center pb-3 border-b-2 border-slate-900">
          {effectiveLogoUrl && (
            <img src={effectiveLogoUrl} alt="Logo" className="max-h-14 max-w-[140px] mx-auto object-contain mb-1" />
          )}
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-slate-900">{company.company_name || 'AUTOMOTIVE AGENCY'}</h1>
          <p className="text-xs italic">{company.business_address || 'Main Road Showroom'}, {company.city || 'New Delhi'}</p>
          <p className="text-xs font-mono font-bold mt-1">VEHICLE BOOKING ORDER & ADVANCE RECEIPT</p>
        </div>

        <div className="grid grid-cols-2 border-b-2 border-slate-900 text-xs py-2">
          <div><strong>Receipt No:</strong> {invoice.invoice_number}</div>
          <div className="text-right"><strong>Date:</strong> {safelyFormatDate(invoice.issue_date, 'dd/MM/yyyy')}</div>
        </div>

        <div className="border-b-2 border-slate-900 text-xs py-3 space-y-1">
          <p><strong>Received from Shri/M/s:</strong> <span className="underline font-bold">{client.name || 'N/A'}</span></p>
          <p><strong>Address:</strong> {client.address || 'Local Customer'}</p>
          <p><strong>Mobile No:</strong> {client.phone || 'N/A'}</p>
        </div>

        {/* Boxed Grid for Specifications */}
        <div className="my-3 border-2 border-slate-900 text-xs">
          <div className="bg-slate-200 font-bold p-1 text-center border-b-2 border-slate-900 uppercase">
            Particulars of Booked Vehicle
          </div>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="p-2 border-r border-slate-900 font-bold w-1/3">Make & Model</td>
                <td className="p-2 font-mono font-bold">{vehicle.model}</td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="p-2 border-r border-slate-900 font-bold">Chassis Number</td>
                <td className="p-2 font-mono font-bold">{vehicle.chassisNo}</td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="p-2 border-r border-slate-900 font-bold">Engine Number</td>
                <td className="p-2 font-mono font-bold">{vehicle.engineNo}</td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="p-2 border-r border-slate-900 font-bold">Color / Finish</td>
                <td className="p-2">{vehicle.color}</td>
              </tr>
              <tr>
                <td className="p-2 border-r border-slate-900 font-bold">Financer / Bank</td>
                <td className="p-2 font-bold">{vehicle.financer || 'Nil'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border-2 border-slate-900 p-3 bg-slate-50 flex justify-between items-center text-sm font-bold my-4">
          <span>
            {isPaid ? "Booking Amount Received (Paid):" :
             isPartial ? `Partial Advance Deposited (${currencySymbol}${paymentDetails?.amountReceived?.toLocaleString('en-IN') || 0} of ${currencySymbol}${totalAmount.toLocaleString('en-IN')}):` :
             isDraft ? "Estimated Booking Advance (Draft):" :
             "Booking Amount Payable (Pending):"}
          </span>
          <span className="text-base font-black">{currencySymbol}{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="pt-10 flex justify-between items-end text-xs font-bold">
          <div>Customer Signature</div>
          <div className="text-right flex flex-col items-end">
            {effectiveSignatureUrl && (
              <img src={effectiveSignatureUrl} alt="Sign" className="h-10 max-h-10 object-contain mix-blend-multiply mb-1" />
            )}
            <div>For {company.company_name || 'Dealer'}<br /><span className="text-[10px] font-normal">(Authorized Signatory)</span></div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. EXECUTIVE LUXURY AUTO RECEIPT (auto_executive)
  // =========================================================================
  if (template === 'auto_executive') {
    return (
      <div className="invoice-template bg-white text-slate-900 p-6 sm:p-8 max-w-4xl mx-auto border border-blue-900/40 rounded-xl shadow-xl font-sans">
        <div className="border-b-4 border-blue-900 pb-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {effectiveLogoUrl && (
              <img src={effectiveLogoUrl} alt="Logo" className="max-h-14 max-w-[140px] object-contain rounded" />
            )}
            <div>
              <span className="text-xs font-black uppercase text-blue-900 tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> Executive Vehicle Confirmation
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-1">{company.company_name || 'PREMIUM AUTOMOBILES'}</h1>
              <p className="text-xs text-slate-600">{company.business_address} • GSTIN: {company.gstin || '07AAAAA0000A1Z5'}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold bg-blue-900 text-white px-3 py-1 rounded-md">
              REF: {invoice.invoice_number}
            </span>
            <p className="text-xs text-slate-500 mt-1">{safelyFormatDate(invoice.issue_date, 'dd MMMM yyyy')}</p>
          </div>
        </div>

        {/* Executive Vehicle Allotment Section */}
        <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 mb-2">Vehicle Allotment Profile</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Model</span>
              <span className="font-bold text-slate-900">{vehicle.model}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Color</span>
              <span className="font-bold text-slate-900">{vehicle.color}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Chassis / VIN</span>
              <span className="font-mono font-bold text-slate-900">{vehicle.chassisNo}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Hypothecation</span>
              <span className="font-bold text-slate-900">{vehicle.financer || 'Direct'}</span>
            </div>
          </div>
        </div>

        {/* Payment Summary Table */}
        <table className="w-full text-xs my-4 border-collapse">
          <thead>
            <tr className="bg-blue-900 text-white font-bold text-left">
              <th className="p-2.5 rounded-l">Item Description</th>
              <th className="p-2.5 text-right rounded-r">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900">Vehicle Booking Advance Deposit</p>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    isPaid ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                    isPartial ? "bg-blue-100 text-blue-800 border border-blue-300" :
                    isDraft ? "bg-slate-100 text-slate-700 border border-slate-300" :
                    "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}>
                    {isPaid ? "Received in Full" : isPartial ? "Partially Paid" : isDraft ? "Draft Quote" : "Payment Pending"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Credited towards final vehicle invoice upon delivery</p>
                {paymentDetails?.finance && (
                  <p className="text-[10px] text-blue-900 font-semibold mt-1">
                    Finance: {paymentDetails.finance.financer} ({currencySymbol}{paymentDetails.finance.financedAmount.toLocaleString('en-IN')}) • DP: {currencySymbol}{paymentDetails.finance.downpayment.toLocaleString('en-IN')} • {paymentDetails.finance.disbursed ? 'Cleared' : 'Disbursal Pending'}
                  </p>
                )}
              </td>
              <td className="p-3 text-right font-black text-sm text-slate-900">
                {currencySymbol}{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* QR Code & Signatures */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white border border-slate-300 rounded shadow-xs">
              <QRCode value={upiPayUri} size={64} />
            </div>
            <div className="text-[11px] text-slate-600">
              <p className="font-bold text-slate-800">Instant UPI Payment</p>
              <p>Scan to verify booking deposit</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            {effectiveSignatureUrl && (
              <img src={effectiveSignatureUrl} alt="Signature" className="h-10 max-h-10 object-contain mix-blend-multiply mb-1" />
            )}
            <p className="font-bold text-slate-800">Executive Signature</p>
            <p className="text-[10px] text-slate-500">Authorized Dealer Stamp</p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5. COMPACT TOKEN COUNTER SLIP (auto_compact)
  // =========================================================================
  return (
    <div className="invoice-template bg-white text-slate-900 p-5 max-w-md mx-auto border-2 border-dashed border-slate-400 font-mono text-xs shadow-md">
      <div className="text-center pb-2 border-b border-dashed border-slate-400 space-y-0.5">
        {effectiveLogoUrl && (
          <img src={effectiveLogoUrl} alt="Logo" className="max-h-10 max-w-[100px] mx-auto object-contain mb-1" />
        )}
        <h2 className="font-black text-sm uppercase">{company.company_name || 'AUTO BOOKING DESK'}</h2>
        <p className="text-[10px] text-slate-600">TOKEN ADVANCE RECEIPT</p>
        <p className="text-[11px] font-bold text-slate-900">SLIP #{invoice.invoice_number}</p>
        <p className="text-[10px]">{safelyFormatDate(invoice.issue_date, 'dd/MM/yyyy HH:mm')}</p>
      </div>

      <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-slate-400">
        <div className="flex justify-between">
          <span className="text-slate-600">Client:</span>
          <span className="font-bold">{client.name || 'Customer'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Mobile:</span>
          <span>{client.phone || '-'}</span>
        </div>
      </div>

      <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-slate-400">
        <div className="flex justify-between">
          <span className="text-slate-600">Vehicle:</span>
          <span className="font-bold">{vehicle.model}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Color:</span>
          <span>{vehicle.color}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">VIN/Chassis:</span>
          <span className="font-bold">{vehicle.chassisNo}</span>
        </div>
      </div>

      <div className="py-2.5 flex justify-between items-center text-sm font-black border-b-2 border-slate-900">
        <span>{isPaid ? "ADVANCE PAID:" : isPartial ? "PARTIAL ADVANCE:" : isDraft ? "ADVANCE ESTIMATE:" : "ADVANCE DUE:"}</span>
        <span>{currencySymbol}{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>

      <div className="py-1 text-center font-bold text-[10px] uppercase tracking-wider text-slate-700 border-b border-dashed border-slate-400">
        STATUS: {isPaid ? "PAID IN FULL" : isPartial ? `PARTIAL (${currencySymbol}${paymentDetails?.amountReceived?.toLocaleString('en-IN')} PAID)` : isDraft ? "DRAFT QUOTE" : "PAYMENT PENDING"}
      </div>

      <div className="pt-2 text-[9px] text-center text-slate-500">
        Thank you for booking with us. Subject to dealership terms.
      </div>
    </div>
  );
};
