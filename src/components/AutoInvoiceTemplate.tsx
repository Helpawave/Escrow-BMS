import React from 'react';
import { safelyFormatDate } from '@/utils/dateUtils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Car, Shield, CheckCircle2, Phone, Mail, MapPin, Building, QrCode, CreditCard, Sparkles, AlertCircle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { normalizeUpiId } from '@/utils/upi';

export type AutoTemplateId = 'auto_dealership' | 'auto_modern' | 'auto_classic' | 'auto_executive' | 'auto_compact';

export interface VehicleDetailsData {
  model?: string;
  vehicleNo?: string;
  regNo?: string;
  chassisNo?: string;
  color?: string;
  financer?: string;
  deliveryDate?: string;
  totalKm?: number | string;
  serviceType?: string;
  freeServiceNo?: number | string;
  totalFreeServices?: number;
  nextServiceKm?: number | string;
  nextServiceDate?: string;
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
    const vd = invoice.vehicle_details;
    const currentKm = vd.totalKm || vd.currentKm || '';
    const numericKm = currentKm ? parseInt(String(currentKm).replace(/[^0-9]/g, ''), 10) : NaN;
    const autoNextKm = !isNaN(numericKm) && numericKm > 0 ? String(numericKm + 2500) : '';

    return {
      model: vd.model || '',
      vehicleNo: vd.vehicleNo || vd.regNo || '',
      regNo: vd.regNo || vd.vehicleNo || '',
      chassisNo: vd.chassisNo || '',
      color: vd.color || '',
      totalKm: currentKm,
      serviceType: vd.serviceType || '',
      freeServiceNo: vd.freeServiceNo,
      totalFreeServices: vd.totalFreeServices,
      nextServiceKm: vd.nextServiceKm || autoNextKm,
      nextServiceDate: vd.nextServiceDate || '',
      financer: vd.financer || '',
      deliveryDate: vd.deliveryDate || ''
    };
  }

  // Try parsing from structured metadata in notes
  if (invoice?.notes && typeof invoice.notes === 'string') {
    const metaMatch = invoice.notes.match(/\[META:(.*?)\]/);
    if (metaMatch) {
      try {
        const parsed = JSON.parse(metaMatch[1]);
        if (parsed.vehicle) {
          const v = parsed.vehicle;
          const currentKm = v.totalKm || v.currentKm || '';
          const numericKm = currentKm ? parseInt(String(currentKm).replace(/[^0-9]/g, ''), 10) : NaN;
          const autoNextKm = !isNaN(numericKm) && numericKm > 0 ? String(numericKm + 2500) : '';

          return {
            model: v.model || '',
            vehicleNo: v.vehicleNo || v.regNo || '',
            regNo: v.regNo || v.vehicleNo || '',
            chassisNo: v.chassisNo || '',
            color: v.color || '',
            totalKm: currentKm,
            serviceType: v.serviceType || '',
            freeServiceNo: v.freeServiceNo,
            totalFreeServices: v.totalFreeServices,
            nextServiceKm: v.nextServiceKm || autoNextKm,
            nextServiceDate: v.nextServiceDate || '',
            financer: v.financer || '',
            deliveryDate: v.deliveryDate || ''
          };
        }
      } catch {}
    }

    // Regex fallback for human-readable notes
    const model = invoice.notes.match(/(?:Model|Vehicle):\s*([^\n|]+)/i)?.[1]?.trim() || invoice.notes.match(/Model:\s*([^\n|]+)/i)?.[1]?.trim();
    const vehicleNo = invoice.notes.match(/(?:Vehicle(?:\s*No)?|Vehical(?:\s*No)?|Reg(?:\s*No)?|Plate):\s*([^\n|]+)/i)?.[1]?.trim();
    const chassisNo = invoice.notes.match(/Chassis(?:\s*No)?:\s*([^\n|]+)/i)?.[1]?.trim();
    const color = invoice.notes.match(/Color:\s*([^\n|]+)/i)?.[1]?.trim();
    const totalKm = invoice.notes.match(/(?:Total\s*KM|Current\s*KM|Odometer|KM):\s*([^\n|]+)/i)?.[1]?.trim();
    const serviceType = invoice.notes.match(/(?:Service(?:\s*Type)?|Free\s*Service):\s*([^\n|]+)/i)?.[1]?.trim();
    const nextServiceKm = invoice.notes.match(/Next\s*(?:Service)?\s*KM:\s*([^\n|]+)/i)?.[1]?.trim();
    const nextServiceDate = invoice.notes.match(/Next\s*(?:Service)?\s*Date:\s*([^\n|]+)/i)?.[1]?.trim();
    const financer = invoice.notes.match(/Financer:\s*([^\n|]+)/i)?.[1]?.trim();
    const deliveryDate = invoice.notes.match(/Delivery(?:\s*Date)?:\s*([^\n|]+)/i)?.[1]?.trim();

    if (model || vehicleNo || chassisNo || color || financer || totalKm || serviceType || deliveryDate) {
      const numKm = totalKm ? parseInt(totalKm.replace(/[^0-9]/g, ''), 10) : NaN;
      const autoNextKm = !isNaN(numKm) && numKm > 0 ? String(numKm + 2500) : '';

      return {
        model: model || '',
        vehicleNo: vehicleNo || '',
        regNo: vehicleNo || '',
        chassisNo: chassisNo || '',
        color: color || '',
        totalKm: totalKm || '',
        serviceType: serviceType || '',
        nextServiceKm: nextServiceKm || autoNextKm,
        nextServiceDate: nextServiceDate || '',
        financer: financer || '',
        deliveryDate: deliveryDate || ''
      };
    }
  }

  // Fallback realistic placeholder ONLY for sample preview mode (e.g. settings showcase)
  if (!invoice || !invoice.invoice_number || invoice.invoice_number.includes('DP-2026-0042')) {
    return {
      model: 'Swift ZXI+ Dual Tone (Petrol MT)',
      vehicleNo: 'DL-04-TC-2026',
      regNo: 'DL-04-TC-2026',
      chassisNo: 'MA3EWB1S00J129841',
      color: 'Pearl Arctic White / Midnight Black',
      financer: 'Self Finance / Cash',
      deliveryDate: '25/11/2026'
    };
  }

  return {
    model: '',
    vehicleNo: '',
    regNo: '',
    chassisNo: '',
    color: '',
    financer: '',
    deliveryDate: ''
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
            amountReceived: Number(parsed.payment.amount_received || (parsed.payment.type === 'full' ? invoice.total_amount : 0)),
            balancePending: Number(parsed.payment.balance_pending || 0),
            paymentMethod: parsed.payment.payment_method || 'cash',
            reference: parsed.payment.reference,
            date: parsed.payment.date,
            finance: parsed.payment.finance
          };
        }
      } catch {}
    }
  }

  // Infer based on status
  const tot = Number(invoice.total_amount || 0);
  if (invoice.status === 'paid') {
    return {
      type: 'full',
      totalAmount: tot,
      amountReceived: tot,
      balancePending: 0,
      paymentMethod: 'cash',
      date: invoice.issue_date
    };
  }

  return null;
}

export const AutoInvoiceTemplate: React.FC<AutoInvoiceTemplateProps> = ({
  template = 'auto_classic',
  invoice,
  client = {},
  items = [],
  company = {},
  currencySymbol = '₹'
}) => {
  const vehicle = React.useMemo(() => extractVehicleDetails(invoice), [invoice]);
  const paymentDetails = React.useMemo(() => extractPaymentDetails(invoice), [invoice]);

  const totalAmount = Number(invoice.total_amount || 0);
  const isPaid = invoice.status === 'paid' || (paymentDetails && paymentDetails.balancePending === 0);
  const isPartial = paymentDetails?.type === 'partial' && paymentDetails.balancePending > 0;
  const isDraft = invoice.status === 'draft';
  const hasUpiDetails = Boolean(
    (company.upi_id && company.upi_id.trim()) ||
    (company.upi_qr_url && company.upi_qr_url.trim())
  );
  const validUpi = normalizeUpiId(company.upi_id);
  const showUploadedQR = !isPaid && !validUpi && Boolean(company.upi_qr_url?.trim());
  const isUpiAction = !isPaid && Boolean(validUpi || showUploadedQR);
  const hasUpi = hasUpiDetails;

  const qrTitle = isPaid
    ? 'PAYMENT SETTLED'
    : (isUpiAction ? 'Scan & Pay via UPI' : 'Digital Bill & Payment');
  const qrSubtitle = isPaid
    ? 'Verified Receipt'
    : (isUpiAction ? 'GPay • PhonePe • Paytm' : 'Scan to View & Pay Online');

  // Verified digital bill URL uniquely scoped by UUID (or invoice number)
  const invoiceId = (invoice as any)?.id;
  const invoiceNumber = invoice.invoice_number;
  const verifyInvoiceUri = React.useMemo(() => {
    const rawInv = invoiceId || (invoiceNumber || '').trim().replace(/^#+/, '');
    return `https://bill.escrowbms.in/v/${encodeURIComponent(rawInv)}`;
  }, [invoiceId, invoiceNumber]);

  // Construct real scannable UPI payment URI (always returns verifyInvoiceUri if already paid)
  const upiPayUri = React.useMemo(() => {
    if (isPaid) return verifyInvoiceUri;

    const payeeName = company.account_holder_name || company.company_name || 'Automobile Dealership';
    const rawInv = (invoice.invoice_number || '').trim().replace(/^#+/, '');

    if (validUpi) {
      return `upi://pay?pa=${encodeURIComponent(validUpi)}&pn=${encodeURIComponent(payeeName)}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Invoice ${rawInv}`)}`;
    }

    return verifyInvoiceUri;
  }, [isPaid, verifyInvoiceUri, validUpi, company.account_holder_name, company.company_name, invoice.invoice_number, totalAmount]);

  const renderAutoQR = (size = 82) => {
    if (showUploadedQR && company.upi_qr_url) {
      return (
        <img
          src={company.upi_qr_url}
          alt="UPI QR"
          className="object-contain"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      );
    }
    return (
      <QRCode 
        value={isPaid ? verifyInvoiceUri : upiPayUri} 
        size={size}
        style={{ height: `${size}px`, width: `${size}px`, maxWidth: "100%" }}
        viewBox="0 0 256 256"
      />
    );
  };

  // Clean notes excluding meta tags and auto-generated vehicle booking summary (which is already shown in the table above)
  const cleanNotes = React.useMemo(() => {
    if (!invoice?.notes) return '';
    return invoice.notes
      .replace(/\[META:.*?\]/g, '')
      .replace(/--- VEHICLE BOOKING DETAILS ---[\s\S]*?(?=\n\n|$)/g, '')
      .replace(/(?:Booking\s*\/\s*Reg\s*No|Vehicle\s*Reg\s*No|Reg\s*No)[^|\n]*(?:\|\s*(?:Model|Chassis|VIN|Color|Financer|Delivery)[^|\n]*)+/gi, '')
      .replace(/(?:Booking\s*\/\s*Reg\s*No|Vehicle\s*(?:Reg\s*)?No|Model|Chassis(?:\/VIN)?|Color|Financer|Delivery(?:\s*Date)?):[^\n|]*/gi, '')
      .replace(/\|\s*\|/g, '')
      .replace(/^[|\s\n-]+|[|\s\n-]+$/g, '')
      .trim();
  }, [invoice?.notes]);

  // Determine whether this is a booking number (e.g. BK-0001) or RTO plate
  const vehicleLabel = React.useMemo(() => {
    const num = (vehicle.vehicleNo || vehicle.regNo || '').trim().toUpperCase();
    if (!num || num.startsWith('BK')) return 'Booking Number';
    return 'Vehicle / Booking No';
  }, [vehicle]);

  // =========================================================================
  // 1. SHOWROOM DEALERSHIP SLIP (auto_dealership)
  // =========================================================================
  if (template === 'auto_dealership') {
    return (
      <div className="invoice-template bg-white text-slate-900 p-5 max-w-4xl mx-auto border-2 border-slate-900 shadow-none font-sans">
        {/* Dealership Top Banner */}
        <div className="border-b-2 border-slate-900 pb-3 flex flex-row justify-between items-start gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.company_name || 'Dealership Logo'}
                  className="max-h-12 max-w-[140px] object-contain rounded"
                />
              ) : (
                <span className="p-1.5 bg-red-600 text-white rounded-lg">
                  <Car className="w-5 h-5" />
                </span>
              )}
              <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
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

          <div className="text-right bg-slate-100 p-2.5 rounded-lg border border-slate-300 shrink-0">
            <div className="inline-block bg-red-600 text-white font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded">
              Vehicle Booking Advance Slip
            </div>
            <p className="text-xs font-mono font-bold mt-1">Slip No: <span className="text-red-700 font-extrabold">{invoice.invoice_number}</span></p>
            <p className="text-[11px] text-slate-600">Booking Date: {safelyFormatDate(invoice.issue_date, 'dd MMM yyyy')}</p>
            <p className="text-[11px] font-bold text-slate-800">Status: <span className="uppercase text-emerald-700">{invoice.status || 'Active'}</span></p>
          </div>
        </div>

        {/* Customer Information Grid */}
        <div className="my-3 p-3 bg-slate-50 border border-slate-300 rounded-lg grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block">Customer / Allottee Details</span>
            <p className="font-bold text-sm text-slate-900">{client.name || 'Valued Customer'}</p>
            <p className="text-slate-600">{[client.address, client.city, client.state, client.postal_code].filter(Boolean).join(', ')}</p>
            <p className="text-slate-700 font-semibold mt-0.5">{client.phone && `Mobile: ${client.phone}`} {client.email && `| Email: ${client.email}`}</p>
          </div>
          <div className="text-right border-l border-slate-200 pl-4">
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block">Financing / Hypothecation</span>
            <p className="font-bold text-slate-800">{vehicle.financer || 'Cash / Self Finance'}</p>
            {client.gstin && <p className="font-mono text-slate-600 text-[11px]">Customer GSTIN: {client.gstin}</p>}
          </div>
        </div>

        {/* Vehicle Specifications Box */}
        <div className="border-2 border-red-700/80 rounded-lg overflow-hidden my-3">
          <div className="bg-red-700 text-white px-3 py-1 flex items-center justify-between text-xs font-black uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Car className="w-4 h-4" /> Vehicle Allotment & Booking Specifications
            </span>
            <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded">FORM 21 COMPLIANT</span>
          </div>
          <div className="grid grid-cols-3 gap-0 bg-white text-xs">
            <div className="p-2 border-r border-b border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Model & Variant</span>
              <span className="font-extrabold text-slate-900 text-xs">{vehicle.model || 'Standard Variant'}</span>
            </div>
            <div className="p-2 border-r border-b border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Color / Shade</span>
              <span className="font-bold text-slate-900">{vehicle.color || 'Standard Factory Shade'}</span>
            </div>
            <div className="p-2 border-b border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">{vehicleLabel}</span>
              <span className="font-mono font-bold text-slate-900">{vehicle.vehicleNo || vehicle.regNo || 'PENDING ALLOTMENT'}</span>
            </div>
            <div className="p-2 border-r border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Chassis / VIN Number</span>
              <span className="font-mono font-extrabold text-slate-900">{vehicle.chassisNo || 'CH-TO-BE-ALLOCATED'}</span>
            </div>
            <div className="p-2 border-r border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Expected Delivery</span>
              <span className="font-bold text-slate-900">{vehicle.deliveryDate || 'As per allocation schedule'}</span>
            </div>
            <div className="p-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Hypothecated To</span>
              <span className="font-bold text-slate-900">{vehicle.financer || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Financial Downpayment / Advance Breakdown Table */}
        <div className="border border-slate-300 rounded-lg overflow-hidden my-3">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-300 font-black text-slate-700 uppercase text-[10px]">
              <tr>
                <th className="py-1.5 px-3">Description</th>
                <th className="py-1.5 px-3 text-center">HSN / SAC</th>
                <th className="py-1.5 px-3 text-right">Estimated Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-2 px-3">
                  <p className="font-bold text-slate-900">Vehicle Booking Advance / Token Downpayment</p>
                  <p className="text-[11px] text-slate-500">Non-refundable token deposit towards allotment of {vehicle.model}</p>
                </td>
                <td className="py-2 px-3 text-center font-mono text-[11px]">8703</td>
                <td className="py-2 px-3 text-right font-bold text-sm">{currencySymbol}{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
          <div className="bg-slate-50 border-t-2 border-slate-900 p-2.5 flex flex-row justify-between items-center gap-3">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-800">Payment Status: </span>
              {isPaid ? (
                <span className="font-black text-emerald-700 uppercase bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300">
                  Received in Full with Thanks
                </span>
              ) : isPartial ? (
                <span className="font-black text-blue-700 uppercase bg-blue-100/90 px-2 py-0.5 rounded border border-blue-300">
                  Partial Payment Received ({currencySymbol}{paymentDetails?.amountReceived ? paymentDetails.amountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''} Received)
                </span>
              ) : isDraft ? (
                <span className="font-bold text-slate-700 uppercase bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
                  Draft / Booking Quotation (Payment Pending)
                </span>
              ) : (
                <span className="font-bold text-amber-700 uppercase bg-amber-100/90 px-2 py-0.5 rounded border border-amber-300">
                  Payment Pending
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-600 uppercase">
                {isPaid ? "Total Advance Received: " : isPartial ? "Total Advance Payable: " : isDraft ? "Estimated Deposit: " : "Advance Payable: "}
              </span>
              <span className="text-base font-black text-slate-900 ml-2">{currencySymbol}{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          {paymentDetails && (
            <div className="bg-amber-50/70 border-t border-slate-200 px-3 py-1.5 text-[11px] flex flex-wrap justify-between items-center gap-2">
              {paymentDetails.type === 'full' && (
                <span className="text-emerald-950 font-semibold">
                  Paid in Full: <strong className="font-black">{currencySymbol}{paymentDetails.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> via {paymentDetails.paymentMethod.toUpperCase()}{paymentDetails.date ? ` on ${safelyFormatDate(paymentDetails.date, 'dd/MM/yyyy')}` : ''}{paymentDetails.reference ? ` (Ref: ${paymentDetails.reference})` : ''}
                </span>
              )}
              {paymentDetails.type === 'partial' && (
                <>
                  <span className="text-blue-900 font-semibold">
                    Token Received: <strong className="font-black">{currencySymbol}{paymentDetails.amountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> via {paymentDetails.paymentMethod.toUpperCase()}{paymentDetails.date ? ` on ${safelyFormatDate(paymentDetails.date, 'dd/MM/yyyy')}` : ''}{paymentDetails.reference ? ` (Ref: ${paymentDetails.reference})` : ''}
                  </span>
                  <span className="text-rose-700 font-bold">
                    Balance Due: {currencySymbol}{paymentDetails.balancePending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </>
              )}
              {paymentDetails.type === 'finance' && paymentDetails.finance && (
                <>
                  <span className="text-indigo-950 font-semibold">
                    Downpayment: <strong className="font-black">{currencySymbol}{paymentDetails.finance.downpayment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>{paymentDetails.date ? ` (${safelyFormatDate(paymentDetails.date, 'dd/MM/yyyy')})` : ''} | Loan: <strong className="font-black">{currencySymbol}{paymentDetails.finance.financedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> ({paymentDetails.finance.financer})
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
        <div className="mt-4 pt-3 border-t border-slate-300 grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1 text-[10px] text-slate-600">
            <p className="font-bold text-slate-800 uppercase">Booking Terms & Conditions:</p>
            <p>1. The vehicle allotment is subject to availability and price ruling at the time of delivery.</p>
            <p>2. Final registration will be executed only upon receipt of complete on-road payment.</p>
            {cleanNotes && (
              <p className="font-medium text-slate-700 pt-0.5">Note: {cleanNotes}</p>
            )}

            {/* Scannable UPI QR Code */}
            <div className="pt-2 flex items-center gap-3">
              <div className="p-1.5 bg-white border-2 border-slate-900 rounded-md shadow-xs shrink-0">
                {renderAutoQR(82)}
              </div>
              <div className="text-[10px] text-slate-700 leading-tight space-y-0.5">
                <span className="font-bold text-slate-900 block uppercase">{qrTitle}</span>
                <span className="text-slate-500 block">{qrSubtitle}</span>
                <span className="text-[9px] text-slate-400 font-mono">{hasUpi ? 'Instant Booking Deposit' : 'Official Digital Receipt'}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-6 items-end justify-end">
            <div className="text-center">
              <div className="w-28 border-b border-slate-400 mb-1 h-10"></div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Customer Signature</span>
            </div>
            <div className="text-center flex flex-col items-center">
              {company.signature_url ? (
                <img
                  src={company.signature_url}
                  alt="Authorized Signatory"
                  className="h-9 max-w-[120px] object-contain mix-blend-multiply mb-1"
                />
              ) : (
                <div className="w-32 border-b border-slate-400 mb-1 h-10"></div>
              )}
              <span className="text-[10px] text-slate-800 uppercase font-bold">Authorized Signatory</span>
              <span className="text-[9px] text-slate-500">For {company.company_name || 'Dealership'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. MODERN DRIVE VOUCHER (auto_modern)
  // =========================================================================
  if (template === 'auto_modern') {
    return (
      <div className="invoice-template bg-white text-slate-900 p-5 max-w-4xl mx-auto rounded-2xl shadow-none border border-slate-200 font-sans">
        {/* Header with Dark Modern Drive Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-4 rounded-xl flex flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            {company.logo_url && (
              <div className="p-1 bg-white rounded-lg shadow-none shrink-0">
                <img
                  src={company.logo_url}
                  alt={company.company_name || 'Logo'}
                  className="max-h-11 max-w-[120px] object-contain"
                />
              </div>
            )}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-black uppercase tracking-widest">
                <Car className="w-3.5 h-3.5" /> Automotive Booking Receipt
              </div>
              <h1 className="text-xl font-black text-white tracking-tight">{company.company_name || 'ELITE MOTORS'}</h1>
              <p className="text-xs text-slate-300">
                {[company.business_address, company.city, company.state, company.pincode].filter(Boolean).join(', ')}
                {company.phone ? ` • Tel: ${company.phone}` : ''}
              </p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-lg border border-white/20 text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">Voucher No</span>
            <span className="text-base font-mono font-black text-white">{invoice.invoice_number}</span>
            <span className="text-[10px] text-slate-300 block mt-0.5">{safelyFormatDate(invoice.issue_date, 'dd MMM yyyy')}</span>
          </div>
        </div>

        {/* Vehicle Highlights Hero Card */}
        <div className="my-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 grid grid-cols-4 gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-900 tracking-wider block">Allocated Vehicle</span>
            <span className="text-sm font-black text-slate-900">{vehicle.model || 'Model TBD'}</span>
            <span className="text-xs text-slate-600 block mt-0.5">Color: {vehicle.color || 'Standard'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-900 tracking-wider block">{vehicleLabel}</span>
            <span className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
              {vehicle.vehicleNo || vehicle.regNo || 'PENDING ALLOTMENT'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-900 tracking-wider block">Chassis / VIN</span>
            <span className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
              {vehicle.chassisNo || 'PENDING ALLOTMENT'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-900 tracking-wider block">Hypothecation</span>
            <span className="text-xs font-bold text-slate-800 block mt-0.5">{vehicle.financer || 'Direct Payment'}</span>
          </div>
        </div>

        {/* Customer & Payment Split */}
        <div className="grid grid-cols-2 gap-3 text-xs my-3">
          <div className="p-3 rounded-xl border border-slate-200 space-y-1">
            <p className="font-black text-slate-800 uppercase text-[10px] tracking-wider">Customer Particulars</p>
            <p className="font-bold text-sm text-slate-900">{client.name || 'Customer'}</p>
            <p className="text-slate-600">{client.phone} • {client.email}</p>
            <p className="text-slate-500">{[client.address, client.city, client.state, client.postal_code].filter(Boolean).join(', ') || client.address || 'Local Customer'}</p>
          </div>
          <div className={`p-3 rounded-xl border-2 flex flex-col justify-between ${
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
            <div className="text-right mt-1.5">
              <span className={`text-xl font-black ${
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

        {/* BOOKING TERMS & CONDITIONS */}
        <div className="my-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] space-y-1 text-slate-700">
          <p className="font-bold text-slate-900 uppercase">Booking Terms & Conditions:</p>
          <p>1. The vehicle allotment is subject to availability and price ruling at the time of delivery.</p>
          <p>2. Final registration will be executed only upon receipt of complete on-road payment.</p>
          {cleanNotes && (
            <p className="font-semibold text-slate-800 pt-0.5">Note: {cleanNotes}</p>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white border-2 border-slate-300 rounded-lg shadow-xs shrink-0">
              {renderAutoQR(82)}
            </div>
            <div className="text-[11px] text-slate-700 leading-normal space-y-0.5">
              <span className="font-bold text-slate-900 block">{qrTitle}</span>
              <span className="text-[10px] text-slate-500 block">{hasUpi ? 'Instant verification & settlement' : 'Scan to view & settle online'}</span>
              <span className="text-[9px] text-slate-400 font-mono">{qrSubtitle}</span>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            {company.signature_url ? (
              <img
                src={company.signature_url}
                alt="Authorized Signature"
                className="h-9 max-w-[120px] object-contain mix-blend-multiply mb-1"
              />
            ) : (
              <div className="w-32 border-b border-slate-300 mb-1 h-8"></div>
            )}
            <span className="font-bold text-slate-800">Authorized Signature</span>
            {company.company_name && (
              <span className="text-[10px] text-slate-500 font-medium">For {company.company_name}</span>
            )}
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
      <div className="invoice-template bg-white text-slate-900 p-5 max-w-4xl mx-auto border-2 border-slate-900 font-serif shadow-none">
        <div className="text-center pb-2.5 border-b-2 border-slate-900">
          {company.logo_url && (
            <div className="flex justify-center mb-1.5">
              <img
                src={company.logo_url}
                alt={company.company_name || 'Logo'}
                className="max-h-11 max-w-[130px] object-contain"
              />
            </div>
          )}
          <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">{company.company_name || 'AUTOMOTIVE AGENCY'}</h1>
          <p className="text-xs italic">
            {[company.business_address, company.city, company.state, company.pincode].filter(Boolean).join(', ')}
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 text-[11px] text-slate-700 pt-0.5 font-sans">
            {company.phone && <span>Tel: {company.phone}</span>}
            {company.email && <span>Email: {company.email}</span>}
            {company.gstin && <span className="font-mono font-bold">GSTIN: {company.gstin}</span>}
          </div>
          <p className="text-xs font-mono font-bold mt-1 uppercase tracking-wide">VEHICLE BOOKING ORDER & ADVANCE RECEIPT</p>
        </div>

        <div className="grid grid-cols-2 border-b-2 border-slate-900 text-xs py-1.5">
          <div><strong>Receipt No:</strong> {invoice.invoice_number}</div>
          <div className="text-right"><strong>Date:</strong> {safelyFormatDate(invoice.issue_date, 'dd/MM/yyyy')}</div>
        </div>

        <div className="border-b-2 border-slate-900 text-xs py-2 space-y-0.5">
          <p><strong>Received from Shri/M/s:</strong> <span className="underline font-bold">{client.name || 'N/A'}</span></p>
          <p><strong>Address:</strong> {[client.address, client.city, client.state, client.postal_code].filter(Boolean).join(', ') || client.address || 'Local Customer'}</p>
          <p><strong>Mobile No:</strong> {client.phone || client.mobile || 'N/A'}</p>
        </div>

        {/* Boxed Grid for Specifications */}
        <div className="my-2.5 border-2 border-slate-900 text-xs">
          <div className="bg-slate-200 font-bold p-1 text-center border-b-2 border-slate-900 uppercase text-[11px]">
            Particulars of Booked Vehicle
          </div>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="p-1.5 border-r border-slate-900 font-bold w-1/3">Make & Model</td>
                <td className="p-1.5 font-mono font-bold">{vehicle.model || 'Standard'}</td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="p-1.5 border-r border-slate-900 font-bold">{vehicleLabel}</td>
                <td className="p-1.5 font-mono font-bold">{vehicle.vehicleNo || vehicle.regNo || 'PENDING ALLOTMENT'}</td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="p-1.5 border-r border-slate-900 font-bold">Chassis Number</td>
                <td className="p-1.5 font-mono font-bold">{vehicle.chassisNo || 'CH-TO-BE-ALLOCATED'}</td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="p-1.5 border-r border-slate-900 font-bold">Color / Finish</td>
                <td className="p-1.5">{vehicle.color || 'Standard Factory Finish'}</td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="p-1.5 border-r border-slate-900 font-bold">Financer / Bank</td>
                <td className="p-1.5 font-bold">{vehicle.financer || 'Nil (Self Finance)'}</td>
              </tr>
              <tr>
                <td className="p-1.5 border-r border-slate-900 font-bold">Expected Delivery</td>
                <td className="p-1.5 font-bold">{vehicle.deliveryDate ? safelyFormatDate(vehicle.deliveryDate, 'dd MMM yyyy', vehicle.deliveryDate) : 'As per allocation schedule'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border-2 border-slate-900 p-2.5 bg-slate-50 flex flex-row justify-between items-center text-sm font-bold my-2.5">
          <span>
            {isPaid ? "Booking Amount Received (Paid):" :
             isPartial ? `Partial Advance Deposited (${currencySymbol}${paymentDetails?.amountReceived?.toLocaleString('en-IN') || 0} of ${currencySymbol}${totalAmount.toLocaleString('en-IN')}):` :
             isDraft ? "Estimated Booking Advance (Draft):" :
             "Booking Amount Payable (Pending):"}
          </span>
          <span className="text-base font-black">{currencySymbol}{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>

        {/* BOOKING TERMS & CONDITIONS */}
        <div className="my-2.5 p-2 bg-slate-50 border border-slate-400 rounded text-[10px] space-y-1 text-slate-700 font-sans">
          <p className="font-bold text-slate-900 uppercase">Booking Terms & Conditions:</p>
          <p>1. The vehicle allotment is subject to availability and price ruling at the time of delivery.</p>
          <p>2. Final registration will be executed only upon receipt of complete on-road payment.</p>
          {cleanNotes && (
            <p className="font-semibold text-slate-800 pt-0.5">Note: {cleanNotes}</p>
          )}
        </div>

        <div className="pt-3 border-t-2 border-slate-900 flex flex-row justify-between items-end gap-4 text-xs font-bold">
          <div className="flex items-center gap-3">
            <div className="p-1.5 border-2 border-slate-900 bg-white shrink-0 rounded shadow-xs">
              {renderAutoQR(82)}
            </div>
            <div className="text-[11px] font-sans text-left space-y-0.5">
              <span className="font-bold text-slate-900 block uppercase tracking-wide">{qrTitle}</span>
              <span className="text-slate-600 font-normal block">{qrSubtitle}</span>
              <span className="text-[9px] text-slate-500 font-mono">{hasUpi ? 'GPay • PhonePe • Paytm • UPI' : 'Instant Online Access'}</span>
            </div>
          </div>

          <div className="flex gap-8 items-end justify-end">
            <div className="text-center">
              <div className="w-28 border-b border-slate-900 mb-1 h-8"></div>
              <div>Customer Signature</div>
            </div>
            <div className="text-center flex flex-col items-center">
              {company.signature_url ? (
                <img
                  src={company.signature_url}
                  alt="Authorized Signatory"
                  className="h-9 max-w-[120px] object-contain mix-blend-multiply mb-1"
                />
              ) : (
                <div className="w-32 border-b border-slate-900 mb-1 h-8"></div>
              )}
              <div>For {company.company_name || 'Dealer'}</div>
              <span className="text-[10px] font-normal">(Authorized Signatory)</span>
            </div>
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
      <div className="invoice-template bg-white text-slate-900 p-5 max-w-4xl mx-auto border border-blue-900/40 rounded-xl shadow-none font-sans">
        <div className="border-b-4 border-blue-900 pb-3 flex flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            {company.logo_url && (
              <div className="p-1 bg-white border border-slate-200 rounded-lg shadow-none shrink-0">
                <img
                  src={company.logo_url}
                  alt={company.company_name || 'Logo'}
                  className="max-h-12 max-w-[130px] object-contain rounded"
                />
              </div>
            )}
            <div>
              <span className="text-[11px] font-black uppercase text-blue-900 tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Executive Vehicle Confirmation
              </span>
              <h1 className="text-xl font-black text-slate-900 mt-0.5">{company.company_name || 'PREMIUM AUTOMOBILES'}</h1>
              <p className="text-xs text-slate-600">
                {[company.business_address, company.city, company.state, company.pincode].filter(Boolean).join(', ')}
                {company.gstin ? ` • GSTIN: ${company.gstin}` : ''}
                {company.phone ? ` • Tel: ${company.phone}` : ''}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-mono font-bold bg-blue-900 text-white px-2.5 py-0.5 rounded-md inline-block">
              REF: {invoice.invoice_number}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">{safelyFormatDate(invoice.issue_date, 'dd MMMM yyyy')}</p>
          </div>
        </div>

        {/* Executive Vehicle Allotment Section */}
        <div className="my-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-blue-900 mb-1.5">Vehicle Allotment Profile</h3>
          <div className="grid grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Model</span>
              <span className="font-bold text-slate-900">{vehicle.model || 'Standard'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">{vehicleLabel}</span>
              <span className="font-mono font-bold text-slate-900">{vehicle.vehicleNo || vehicle.regNo || 'PENDING ALLOTMENT'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Chassis / VIN</span>
              <span className="font-mono font-bold text-slate-900">{vehicle.chassisNo || 'CH-TO-BE-ALLOCATED'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Color / Hypothecation</span>
              <span className="font-bold text-slate-900 truncate block">
                {vehicle.color || 'Standard Metallic'} {vehicle.financer ? `• ${vehicle.financer}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Booking Schedule */}
        <div className="my-3 grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider block">Customer Details</span>
            <p className="font-bold text-sm text-slate-900">{client.name || 'Customer'}</p>
            <p className="text-slate-600">{client.phone} {client.email ? `• ${client.email}` : ''}</p>
            <p className="text-slate-500">{[client.address, client.city, client.state, client.postal_code].filter(Boolean).join(', ') || client.address || 'Local Customer'}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider block">Booking & Delivery Schedule</span>
            <p className="text-slate-700"><strong>Expected Delivery:</strong> {vehicle.deliveryDate ? safelyFormatDate(vehicle.deliveryDate, 'dd MMMM yyyy', vehicle.deliveryDate) : 'As per allocation schedule'}</p>
            <p className="text-slate-700"><strong>Hypothecation:</strong> {vehicle.financer || 'Nil (Direct Payment / Self Finance)'}</p>
          </div>
        </div>

        {/* Payment Summary Table */}
        <table className="w-full text-xs my-3 border-collapse">
          <thead>
            <tr className="bg-blue-900 text-white font-bold text-left">
              <th className="p-2 rounded-l">Item Description</th>
              <th className="p-2 text-right rounded-r">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="p-2.5">
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
                  <p className="text-[10px] text-blue-900 font-semibold mt-0.5">
                    Finance: {paymentDetails.finance.financer} ({currencySymbol}{paymentDetails.finance.financedAmount.toLocaleString('en-IN')}) • DP: {currencySymbol}{paymentDetails.finance.downpayment.toLocaleString('en-IN')} • {paymentDetails.finance.disbursed ? 'Cleared' : 'Disbursal Pending'}
                  </p>
                )}
              </td>
              <td className="p-2.5 text-right font-black text-sm text-slate-900">
                {currencySymbol}{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* BOOKING TERMS & CONDITIONS */}
        <div className="my-3 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-[10px] space-y-1 text-slate-700">
          <p className="font-bold text-blue-900 uppercase">Booking Terms & Conditions:</p>
          <p>1. The vehicle allotment is subject to availability and price ruling at the time of delivery.</p>
          <p>2. Final registration will be executed only upon receipt of complete on-road payment.</p>
          {cleanNotes && (
            <p className="font-semibold text-slate-800 pt-0.5">Note: {cleanNotes}</p>
          )}
        </div>

        {/* QR Code & Signatures */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-row justify-between items-center gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white border-2 border-slate-400 rounded-md shadow-xs">
              {renderAutoQR(82)}
            </div>
            <div className="text-[11px] text-slate-600 space-y-0.5">
              <p className="font-bold text-slate-800">{qrTitle}</p>
              <p>{hasUpi ? 'Scan to verify booking deposit' : 'Scan to view & pay online'}</p>
              <p className="text-[9px] text-slate-400 font-mono">{qrSubtitle}</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            {company.signature_url ? (
              <img
                src={company.signature_url}
                alt="Authorized Signatory"
                className="h-10 max-w-[130px] object-contain mix-blend-multiply mb-1"
              />
            ) : (
              <div className="w-32 border-b border-slate-400 mb-1 h-8"></div>
            )}
            <p className="font-bold text-slate-800">Executive Signature</p>
            <p className="text-[10px] text-slate-500">Authorized Dealer Stamp {company.company_name ? `• ${company.company_name}` : ''}</p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5. COMPACT TOKEN COUNTER SLIP (auto_compact)
  // =========================================================================
  return (
    <div className="invoice-template bg-white text-slate-900 p-5 max-w-md mx-auto border-2 border-dashed border-slate-400 font-mono text-xs shadow-none">
      <div className="text-center pb-2 border-b border-dashed border-slate-400 space-y-1">
        {company.logo_url && (
          <div className="flex justify-center mb-1">
            <img
              src={company.logo_url}
              alt={company.company_name || 'Logo'}
              className="max-h-10 max-w-[120px] object-contain"
            />
          </div>
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
          <span className="font-bold">{vehicle.model || 'Standard'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">{vehicleLabel}:</span>
          <span className="font-bold">{vehicle.vehicleNo || vehicle.regNo || 'PENDING'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Color:</span>
          <span>{vehicle.color || 'Standard'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">VIN/Chassis:</span>
          <span className="font-bold">{vehicle.chassisNo || 'PENDING'}</span>
        </div>
      </div>

      <div className="py-2.5 flex justify-between items-center text-sm font-black border-b-2 border-slate-900">
        <span>{isPaid ? "ADVANCE PAID:" : isPartial ? "PARTIAL ADVANCE:" : isDraft ? "ADVANCE ESTIMATE:" : "ADVANCE DUE:"}</span>
        <span>{currencySymbol}{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>

      <div className="py-1 text-center font-bold text-[10px] uppercase tracking-wider text-slate-700 border-b border-dashed border-slate-400">
        STATUS: {isPaid ? "PAID IN FULL" : isPartial ? `PARTIAL (${currencySymbol}${paymentDetails?.amountReceived?.toLocaleString('en-IN')} PAID)` : isDraft ? "DRAFT QUOTE" : "PAYMENT PENDING"}
      </div>

      {/* Scannable Compact UPI QR */}
      <div className="py-2.5 flex flex-col items-center justify-center border-b border-dashed border-slate-400">
        <div className="p-2 bg-white border-2 border-slate-900 rounded shadow-xs mb-1">
          {renderAutoQR(84)}
        </div>
        <p className="text-[10px] text-slate-800 uppercase font-black tracking-wider">{hasUpi ? "Scan to Pay via UPI" : "Scan for Digital Receipt"}</p>
      </div>

      <div className="pt-3 text-center flex flex-col items-center">
        {company.signature_url && (
          <div className="flex flex-col items-center mb-2">
            <img
              src={company.signature_url}
              alt="Authorized Signatory"
              className="h-9 max-w-[120px] object-contain mix-blend-multiply mb-0.5"
            />
            <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Authorized Signatory</span>
          </div>
        )}
        <p className="text-[9px] text-slate-500">
          Thank you for booking with us. Subject to dealership terms.
        </p>
      </div>
    </div>
  );
};
