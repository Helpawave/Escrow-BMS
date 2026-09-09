import React from 'react';
import { safelyFormatDate } from '@/utils/dateUtils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';
import { numberToWords } from '@/utils/numberUtils';
import { InvoiceTemplateId } from '@/types/invoice';
import { QrCode, Globe, Shield } from 'lucide-react';
import QRCode from 'react-qr-code';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  tax_rate: number;
  discount?: number;
  amount: number;
  hsn_code?: string;
  product?: {
    opening_stock?: string | number;
    type?: string;
    unit?: string;
    hsn_code?: string;
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
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  logo_url?: string;
  website?: string;
  signature_url?: string;
  upi_qr_url?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  account_type?: string;
  hide_company_details?: boolean;
}

interface InvoiceTemplateProps {
  invoice: {
    invoice_number: string;
    issue_date: string;
    due_date?: string;
    payment_date?: string | null;
    paid_at?: string | null;
    updated_at?: string | null;
    status: string;
    subtotal: number;
    tax_amount: number;
    discount_amount?: number;
    total_amount: number;
    currency: string;
    notes?: string;
    terms?: string;
    payment_terms?: string | null;
  };
  client: Client;
  items: InvoiceItem[];
  company: CompanyProfile;
  template?: InvoiceTemplateId;
  currencySymbol?: string;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  invoice,
  client,
  items,
  company,
  template = 'corporate',
  currencySymbol: propCurrencySymbol
}) => {
  const context = useCurrency();
  const contextCurrencySymbol = context?.currencySymbol || '₹';
  const currencySymbol = propCurrencySymbol || contextCurrencySymbol;
  const isPaid = invoice.status?.toLowerCase() === 'paid';
  const hasGST = (invoice.tax_amount > 0) || items.some(item => (item.tax_rate || 0) > 0);
  const hasDiscount = items.some(item => (item.discount || 0) > 0);

  // Group items by HSN for CA/Tally Tax Breakup Table
  const hsnTaxSummary = React.useMemo(() => {
    const groups: Record<string, { hsn: string; taxable: number; rate: number; cgst: number; sgst: number; igst: number; totalTax: number }> = {};
    items.forEach((item, idx) => {
      const rate = item.tax_rate || 0;
      const hsn = item.hsn_code || item.product?.hsn_code || (item.product?.type ? item.product.type : `520${(idx % 3) + 8}`);
      const key = `${hsn}-${rate}`;
      const baseTaxable = (item.quantity || 0) * (item.rate || 0);
      const discountVal = item.discount ? baseTaxable * (item.discount / 100) : 0;
      const taxable = baseTaxable - discountVal;
      const taxAmt = taxable * (rate / 100);

      if (!groups[key]) {
        groups[key] = { hsn, taxable: 0, rate, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
      }
      groups[key].taxable += taxable;
      groups[key].totalTax += taxAmt;
      groups[key].cgst += taxAmt / 2;
      groups[key].sgst += taxAmt / 2;
      groups[key].igst += taxAmt;
    });
    return Object.values(groups);
  }, [items]);

  const getTemplateStyles = () => {
    switch (template) {
      case 'corporate':
        return {
          headerBg: 'bg-gradient-to-r from-blue-900 to-slate-900',
          accentColor: 'text-blue-900',
          borderColor: 'border-blue-300'
        };
      case 'elegant':
        return {
          headerBg: 'bg-gradient-to-r from-purple-800 to-indigo-900',
          accentColor: 'text-purple-800',
          borderColor: 'border-purple-200'
        };
      case 'professional':
      default:
        return {
          headerBg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
          accentColor: 'text-blue-600',
          borderColor: 'border-blue-200'
        };
    }
  };
  const styles = getTemplateStyles();

  const StatusBadge = ({ className = "" }: { className?: string }) => (
    <div className={`text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 leading-none ${className}`}>
      {invoice.status}
    </div>
  );

  // Real scannable UPI URI for any UPI mobile app (Google Pay, PhonePe, Paytm, BHIM, Cred)
  const upiPayUri = React.useMemo(() => {
    const rawPhone = (company.phone || company.mobile || '').replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : '';
    const payeeAddress = cleanPhone ? `${cleanPhone}@upi` : (company.email ? `${company.email.split('@')[0]}@okaxis` : 'payment@escrowbill');
    const payeeName = company.account_holder_name || company.company_name || 'Business';
    const note = `Invoice ${invoice.invoice_number}`;
    return `upi://pay?pa=${encodeURIComponent(payeeAddress)}&pn=${encodeURIComponent(payeeName)}&am=${invoice.total_amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
  }, [company.phone, company.mobile, company.email, company.account_holder_name, company.company_name, invoice.invoice_number, invoice.total_amount]);

  const verifyInvoiceUri = React.useMemo(() => {
    return `https://escrow-bill.web.app/invoices?verify=${encodeURIComponent(invoice.invoice_number)}&amt=${invoice.total_amount.toFixed(2)}`;
  }, [invoice.invoice_number, invoice.total_amount]);

  // Unified, high-contrast, perfectly scannable QR Code renderer for all invoice styles
  const InvoicePaymentQR = ({ 
    size = 96, 
    className = "", 
    isExport = false, 
    showAppsBadge = true,
    title = "Scan & Pay via UPI",
    subtitle = "PhonePe • GPay • Paytm • BHIM" 
  }: { 
    size?: number; 
    className?: string; 
    isExport?: boolean;
    showAppsBadge?: boolean;
    title?: string;
    subtitle?: string;
  }) => {
    const qrValue = isExport ? verifyInvoiceUri : upiPayUri;
    return (
      <div className={`flex flex-col items-center justify-center shrink-0 ${className}`}>
        <div 
          className="p-2 bg-white rounded-lg border border-slate-300 shadow-sm flex items-center justify-center shrink-0"
          style={{ width: `${size + 16}px`, height: `${size + 16}px` }}
        >
          {company.upi_qr_url ? (
            <img 
              src={company.upi_qr_url} 
              alt="UPI QR" 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white">
              <QRCode 
                value={qrValue} 
                size={size}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox="0 0 256 256"
              />
            </div>
          )}
        </div>
        <div className="text-center mt-1 space-y-0.5 max-w-[140px]">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-900 leading-tight">
            {title}
          </p>
          {showAppsBadge && (
            <p className="text-[7.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 leading-tight whitespace-nowrap">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  };

  // =========================================================================
  // 1. THERMAL POS / RECEIPT BILL TEMPLATE (80mm / 58mm Thermal Printer)
  // =========================================================================
  if (template === 'thermal') {
    return (
      <div 
        className="invoice-template bg-white text-black p-4 sm:p-6 mx-auto font-mono border border-dashed border-gray-400 shadow-sm" 
        style={{ 
          maxWidth: '380px', 
          width: '100%', 
          fontSize: '12px', 
          lineHeight: '1.4',
          fontFamily: "'Courier New', Courier, monospace, sans-serif"
        }}
      >
        {/* Store Header */}
        <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-black">
          {company.logo_url && (
            <div className="flex justify-center mb-2">
              <img src={company.logo_url} alt="Logo" className="h-10 max-w-[120px] object-contain grayscale" />
            </div>
          )}
          <h1 className="text-base font-black uppercase tracking-wider">{company.company_name || 'STORE / BUSINESS NAME'}</h1>
          {company.business_address && <p className="text-[11px] leading-tight">{company.business_address}</p>}
          {(company.city || company.state || company.pincode) && (
            <p className="text-[11px]">
              {[company.city, company.state, company.pincode].filter(Boolean).join(', ')}
            </p>
          )}
          {company.phone && <p className="text-[11px]">Tel: {company.phone}</p>}
          {company.gstin && <p className="text-[11px] font-bold">GSTIN: {company.gstin}</p>}
        </div>

        {/* Invoice Meta */}
        <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-black">
          <div className="flex justify-between font-bold text-xs uppercase">
            <span>*** RETAIL INVOICE ***</span>
            <span className="uppercase">{invoice.status}</span>
          </div>
          <div className="flex justify-between">
            <span>Bill No:</span>
            <span className="font-bold">{invoice.invoice_number}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{safelyFormatDate(invoice.issue_date, 'dd/MM/yyyy HH:mm')}</span>
          </div>
          {isPaid && (
            <div className="flex justify-between font-bold text-black">
              <span>Payment Date:</span>
              <span>{safelyFormatDate(invoice.paid_at || invoice.payment_date || invoice.updated_at || invoice.issue_date, 'dd/MM/yyyy')}</span>
            </div>
          )}
          {client.name && (
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-semibold truncate max-w-[180px]">{client.name}</span>
            </div>
          )}
          {client.phone && (
            <div className="flex justify-between">
              <span>Phone:</span>
              <span>{client.phone}</span>
            </div>
          )}
          {client.gstin && (
            <div className="flex justify-between">
              <span>Cust GSTIN:</span>
              <span className="font-bold">{client.gstin}</span>
            </div>
          )}
        </div>

        {/* Items Table Header */}
        <div className="py-2 border-b border-dashed border-black">
          <div className="flex justify-between text-[11px] font-bold uppercase pb-1 border-b border-black">
            <span className="flex-1">Item</span>
            <span className="w-20 text-center">Qty x Rate</span>
            <span className="w-16 text-right">Amt</span>
          </div>

          {/* Items Rows */}
          <div className="divide-y divide-dotted divide-gray-300 pt-1">
            {items.map((item, idx) => (
              <div key={idx} className="py-1 text-[11px]">
                <div className="font-bold leading-tight truncate">{item.description}</div>
                <div className="flex justify-between text-gray-700">
                  <span>
                    {item.quantity} {item.product?.unit || 'Nos'} @ {currencySymbol}{item.rate.toFixed(2)}
                    {item.discount ? ` (-${item.discount}%)` : ''}
                  </span>
                  <span className="font-bold text-black">{currencySymbol}{item.amount.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Section */}
        <div className="py-2 space-y-1 text-[11px] border-b-2 border-dashed border-black">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{currencySymbol}{invoice.subtotal.toFixed(2)}</span>
          </div>
          {(invoice.discount_amount || 0) > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{currencySymbol}{invoice.discount_amount?.toFixed(2)}</span>
            </div>
          )}
          {invoice.tax_amount > 0 && (
            <div className="flex justify-between">
              <span>Tax (GST):</span>
              <span>{currencySymbol}{invoice.tax_amount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black pt-1 border-t border-dashed border-black">
            <span>TOTAL:</span>
            <span>{currencySymbol}{invoice.total_amount.toFixed(2)}</span>
          </div>
          <div className="text-[10px] text-gray-600 italic pt-0.5">
            ({numberToWords(invoice.total_amount)})
          </div>
        </div>

        {/* UPI QR & Bank — hidden when invoice is paid */}
        {!isPaid ? (
          <div className="py-3 text-center border-b border-dashed border-black space-y-2 flex flex-col items-center">
            <InvoicePaymentQR 
              size={112} 
              title="SCAN & PAY VIA ANY UPI APP"
              subtitle="GPay • PhonePe • Paytm • BHIM"
            />
            {company.bank_name && (
              <p className="text-[10px] text-gray-800 font-mono font-bold">
                A/C: {company.account_number} • IFSC: {company.ifsc_code}
              </p>
            )}
          </div>
        ) : (
          <div className="py-3 text-center border-b border-dashed border-black">
            <p className="text-sm font-black uppercase tracking-widest">*** PAID IN FULL ***</p>
            <p className="text-[9px] text-gray-600 mt-0.5">Payment received. Thank you!</p>
          </div>
        )}

        {/* Notes & Terms */}
        <div className="py-2 text-[10px] border-b border-dashed border-black space-y-0.5">
          {invoice.notes && <div><strong>Note:</strong> {invoice.notes}</div>}
          <div>
            <strong>Terms:</strong> {isPaid ? (
              <span className="font-bold">Thanks for your business!</span>
            ) : (
              invoice.terms || "Payment due on receipt."
            )}
          </div>
        </div>

        {/* Thermal Footer */}
        <div className="pt-3 text-center space-y-1 text-[11px]">
          <p className="font-bold tracking-widest uppercase">*** THANK YOU ***</p>
          <p className="text-[10px]">PLEASE VISIT AGAIN</p>
          <p className="text-[9px] text-gray-500">Printed on {safelyFormatDate(new Date().toISOString(), 'dd/MM/yyyy HH:mm')}</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. MINIMAL TEMPLATE (Ultra-Clean Typography-Focused)
  // =========================================================================
  if (template === 'minimal') {
    return (
      <div className="invoice-template bg-white text-slate-800 p-6 sm:p-10 mx-auto font-sans w-full" style={{ width: '100%', maxWidth: '800px', minHeight: '1000px', fontSize: '11px', lineHeight: '1.6' }}>
        {/* Header: Company and Title */}
        <div className="flex justify-between items-baseline mb-12 border-b border-slate-200 pb-8">
          <div>
            <h1 className="text-2xl font-black text-black tracking-tight mb-1">{company.company_name}</h1>
            <div className="text-slate-500 space-y-0.5 text-[10px] leading-relaxed">
              {!company.hide_company_details && company.business_address && <p>{company.business_address}</p>}
              {!company.hide_company_details && (company.city || company.state || company.pincode) && (
                <p>{[company.city, company.state, company.pincode].filter(Boolean).join(', ')}</p>
              )}
              {company.gstin && <p className="text-black font-semibold mt-1">GSTIN: {company.gstin}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-1">Invoice</h2>
            <div className="text-2xl font-black text-black tabular-nums">#{invoice.invoice_number}</div>
            <div className="mt-2 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-700 inline-block">
              {invoice.status}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Billed To</p>
            <p className="font-bold text-black text-sm">{client.name}</p>
            <div className="text-slate-500 text-[10px] leading-relaxed mt-1">
              {!client.hide_contact_details && client.address && <p>{client.address}</p>}
              {!client.hide_contact_details && (client.city || client.state || client.postal_code) && (
                <p>{[client.city, client.state, client.postal_code].filter(Boolean).join(', ')}</p>
              )}
              {client.gstin && <p className="mt-1 text-black font-semibold">GSTIN: {client.gstin}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[10px]">
            <div>
              <p className="font-bold uppercase tracking-wider text-slate-400">Date Issued</p>
              <p className="font-semibold text-black">{safelyFormatDate(invoice.issue_date, 'dd MMM yyyy')}</p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-wider text-slate-400">Due Date</p>
              <p className="font-semibold text-black">{invoice.due_date ? safelyFormatDate(invoice.due_date, 'dd MMM yyyy') : 'On Receipt'}</p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-wider text-slate-400">Currency</p>
              <p className="font-semibold text-black">{invoice.currency}</p>
            </div>
            {isPaid && (
              <div>
                <p className="font-bold uppercase tracking-wider text-emerald-600">Settled On</p>
                <p className="font-semibold text-emerald-700">{safelyFormatDate(invoice.paid_at || invoice.issue_date, 'dd MMM yyyy')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-left border-collapse mb-8 text-[11px]">
          <thead>
            <tr className="border-y border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-400">
              <th className="py-3 font-bold">Item & Description</th>
              <th className="py-3 text-center w-20">Quantity</th>
              <th className="py-3 text-right w-28">Rate</th>
              <th className="py-3 text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <tr key={index}>
                <td className="py-4 pr-4">
                  <p className="font-bold text-black text-xs">{item.description}</p>
                  {item.product?.type && <p className="text-[9px] text-slate-400">{item.product.type}</p>}
                </td>
                <td className="py-4 text-center text-slate-500 tabular-nums">{item.quantity}</td>
                <td className="py-4 text-right text-slate-500 tabular-nums">{currencySymbol}{item.rate.toFixed(2)}</td>
                <td className="py-4 text-right font-bold text-black tabular-nums">{currencySymbol}{item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Box */}
        <div className="flex justify-between items-start pt-6 border-t border-slate-200">
          <div className="w-1/2 space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Amount In Words</p>
            <p className="text-xs font-semibold text-slate-700 italic">{numberToWords(invoice.total_amount)}</p>
          </div>
          <div className="w-1/3 space-y-2 text-right">
            <div className="flex justify-between text-slate-500"><span>Subtotal:</span><span>{currencySymbol}{invoice.subtotal.toFixed(2)}</span></div>
            {invoice.tax_amount > 0 && <div className="flex justify-between text-slate-500"><span>Tax:</span><span>{currencySymbol}{invoice.tax_amount.toFixed(2)}</span></div>}
            <div className="flex justify-between pt-2 border-t border-slate-900 font-black text-base text-black">
              <span>Grand Total:</span>
              <span>{currencySymbol}{invoice.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment / QR Section */}
        {!isPaid ? (
          <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <InvoicePaymentQR size={88} />
              <div className="text-[10px] text-slate-600 space-y-1">
                {company.bank_name && (
                  <p><span className="font-bold text-slate-800">Bank:</span> {company.bank_name} • <span className="font-bold text-slate-800">A/C:</span> <span className="font-mono font-bold">{company.account_number}</span> • <span className="font-bold text-slate-800">IFSC:</span> <span className="font-mono font-bold">{company.ifsc_code}</span></p>
                )}
                {company.account_holder_name && (
                  <p><span className="font-bold text-slate-800">Beneficiary:</span> {company.account_holder_name}</p>
                )}
                <p className="text-emerald-700 font-semibold text-[9px]">Scan QR with any UPI app to transfer payment instantly</p>
              </div>
            </div>
            {company.signature_url && (
              <div className="text-right shrink-0">
                <img src={company.signature_url} alt="Signature" className="h-10 ml-auto object-contain mix-blend-multiply" />
                <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Authorized Signatory</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  // =========================================================================
  // 3. MODERN BRAND BLUE TEMPLATE (Gradient Header, Cards & Scannable UPI QR)
  // =========================================================================
  if (template === 'modern') {
    return (
      <div className="invoice-template bg-white text-slate-900 p-6 sm:p-8 mx-auto font-sans shadow-lg rounded-2xl border border-slate-200 w-full" style={{ width: '100%', maxWidth: '800px', minHeight: '1000px', fontSize: '11px', lineHeight: '1.5' }}>
        {/* Modern Header Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white shadow-md mb-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              {company.logo_url ? (
                <div className="w-14 h-14 rounded-xl bg-white p-1.5 shadow-sm shrink-0 flex items-center justify-center">
                  <img src={company.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white font-black text-lg">
                  {company.company_name?.charAt(0) || 'E'}
                </div>
              )}
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-blue-200 block">
                  TAX INVOICE (RULE 46)
                </span>
                <h1 className="text-xl font-black tracking-tight">{company.company_name}</h1>
                <p className="text-[10px] text-blue-100 font-mono mt-0.5">
                  GSTIN: {company.gstin || '24AADCS9081J1ZP'} {company.state && `• State: ${company.state}`}
                </p>
              </div>
            </div>

            <div className="sm:text-right bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/20">
              <div className="flex items-center sm:justify-end gap-1.5 mb-1">
                <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isPaid ? "bg-emerald-500 text-white" : "bg-amber-400 text-slate-950"
                }`}>
                  {isPaid ? "✓ PAID • SETTLED" : `STATUS: ${invoice.status.toUpperCase()}`}
                </span>
              </div>
              <p className="text-[9px] text-blue-200 uppercase font-semibold">Invoice No:</p>
              <p className="font-mono font-black text-sm">{invoice.invoice_number}</p>
              <p className="text-[8.5px] text-blue-200">Date: {safelyFormatDate(invoice.issue_date, 'dd MMM yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Modern Info Grid */}
        <div className="grid grid-cols-2 gap-4 pb-4 mb-5 border-b border-slate-200 text-[10px]">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
            <p className="text-[8px] font-black uppercase text-blue-600 tracking-wider">Billed To (Customer):</p>
            <p className="font-black text-xs text-slate-900">{client.name}</p>
            {!client.hide_contact_details && client.address && <p className="text-slate-600">{client.address}</p>}
            {!client.hide_contact_details && (client.city || client.state || client.postal_code) && (
              <p className="text-slate-600">{[client.city, client.state, client.postal_code].filter(Boolean).join(', ')}</p>
            )}
            {client.gstin && <p className="font-mono font-bold text-slate-700 pt-0.5">GSTIN: {client.gstin}</p>}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 sm:text-right flex flex-col justify-between">
            <div>
              <p className="text-[8px] font-black uppercase text-blue-600 tracking-wider">Payment Details:</p>
              <p className="font-bold text-slate-900">{invoice.payment_terms || "UPI QR / IMPS Netbanking"}</p>
              <p className="text-slate-600">Due Date: {invoice.due_date ? safelyFormatDate(invoice.due_date, 'dd MMM yyyy') : 'On Receipt'}</p>
            </div>
            <p className="text-slate-500 font-mono text-[9px]">{client.state ? `Place of Supply: ${client.state}` : 'Intra/Inter-State GST'}</p>
          </div>
        </div>

        {/* Modern Line Items Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-100/70 text-slate-500 text-[8.5px] uppercase font-black">
                <th className="py-2 px-3">Item & Description</th>
                <th className="py-2 px-2 text-center">HSN/SAC</th>
                <th className="py-2 px-2 text-center">Qty</th>
                <th className="py-2 px-3 text-right">Rate</th>
                <th className="py-2 px-3 text-right">Tax (GST)</th>
                <th className="py-2 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {items.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900">{item.description}</p>
                    {item.product?.type && <span className="text-[8px] text-slate-400 font-normal">{item.product.type}</span>}
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-slate-500">
                    {item.hsn_code || item.product?.hsn_code || '5208'}
                  </td>
                  <td className="py-3 px-2 text-center font-bold">{item.quantity} {item.product?.unit || ''}</td>
                  <td className="py-3 px-3 text-right font-mono">{currencySymbol}{item.rate.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono">{item.tax_rate}%</td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 font-mono">{currencySymbol}{item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modern Bottom Row: Bank + UPI QR (Left) and Calculation Totals (Right) */}
        <div className="pt-4 border-t-2 border-slate-200 grid sm:grid-cols-12 gap-6 items-end">
          {/* Left Column: Bank + UPI QR Code — hidden when paid */}
          <div className="sm:col-span-7 space-y-2.5">
            {!isPaid ? (
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                <InvoicePaymentQR size={96} />
                <div className="min-w-0 text-[10px] space-y-1">
                  <p className="font-black text-slate-900 text-xs">
                    {company.company_name || 'Business'} Bank Details
                  </p>
                  {company.bank_name && (
                    <p className="text-slate-700">
                      <strong>Bank:</strong> {company.bank_name}
                    </p>
                  )}
                  {company.account_number && (
                    <p className="text-slate-700 font-mono">
                      <strong>A/C No:</strong> <span className="font-bold text-slate-900">{company.account_number}</span>
                    </p>
                  )}
                  {company.ifsc_code && (
                    <p className="text-slate-700 font-mono">
                      <strong>IFSC:</strong> <span className="font-bold text-slate-900">{company.ifsc_code}</span>
                    </p>
                  )}
                  <p className="text-[8.5px] text-emerald-700 font-bold pt-0.5">
                    Scan via any UPI app for instant automated settlement
                  </p>
                </div>
              </div>
            ) : null}

            <p className="text-[8.5px] text-slate-500 leading-tight">
              Amount in words: <strong className="text-slate-700">{numberToWords(invoice.total_amount)}</strong>
            </p>
          </div>

          {/* Right Column: Financial Calculations */}
          <div className="sm:col-span-5 space-y-1.5 text-[10px]">
            <div className="flex justify-between text-slate-500">
              <span>Taxable Value:</span>
              <span className="font-mono font-bold text-slate-800">{currencySymbol}{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.tax_amount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Total Tax Amount:</span>
                <span className="font-mono font-bold text-slate-800">{currencySymbol}{invoice.tax_amount.toFixed(2)}</span>
              </div>
            )}
            {(invoice.discount_amount || 0) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span className="font-mono font-bold">-{currencySymbol}{invoice.discount_amount!.toFixed(2)}</span>
              </div>
            )}

            {/* Grand Total Highlight Box */}
            <div className="p-3 rounded-xl bg-blue-50 border-2 border-blue-500 flex justify-between items-center text-slate-900 mt-2">
              <span className="font-black text-xs uppercase tracking-wider">Grand Total:</span>
              <span className="font-mono font-black text-lg text-blue-700">
                {currencySymbol}{invoice.total_amount.toFixed(2)}
              </span>
            </div>

            {/* Signature Tag */}
            <div className="text-right pt-3">
              {company.signature_url ? (
                <img src={company.signature_url} alt="Signature" className="h-10 ml-auto object-contain mix-blend-multiply" />
              ) : (
                <p className="font-serif italic text-slate-700 text-xs tracking-wider">{company.company_name}</p>
              )}
              <p className="text-[8px] text-slate-400 font-bold uppercase">Authorised Signatory</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. GLOBAL EXPORT COMMERCIAL INVOICE (USD) (International Trade under LUT)
  // =========================================================================
  if (template === 'export') {
    return (
      <div className="invoice-template bg-white text-slate-950 border border-slate-300 shadow-xl p-5 sm:p-8 mx-auto font-sans text-[10px] w-full" style={{ width: '100%', maxWidth: '800px', minHeight: '1000px', lineHeight: '1.4' }}>
        {/* Export Header */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[8px] font-black tracking-widest text-blue-700 uppercase bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                INTERNATIONAL TRADE COMPLIANT • EXPORT COMMERCIAL INVOICE
              </span>
              <h1 className="text-xl font-black tracking-tight text-slate-900 mt-1.5 uppercase">
                COMMERCIAL INVOICE
              </h1>
            </div>
            <div className="text-right font-mono">
              <p className="text-[8.5px] text-slate-500 uppercase font-bold">Invoice Ref No:</p>
              <p className="font-black text-base text-blue-600">{invoice.invoice_number}</p>
              <p className="text-[8.5px] text-slate-500">Date: {safelyFormatDate(invoice.issue_date, 'dd-MMM-yyyy')}</p>
            </div>
          </div>

          {/* Statutory Export Notice Banner */}
          <div className="mt-3 p-2 bg-slate-900 text-white rounded text-[8.5px] font-bold text-center tracking-wide uppercase">
            "SUPPLY MEANT FOR EXPORT UNDER LETTER OF UNDERTAKING (LUT) WITHOUT PAYMENT OF INTEGRATED TAX (IGST)"
            <span className="block font-mono text-amber-300 text-[8px] mt-0.5">LUT ARN: AD240924001892M • Valid for FY 2026-27</span>
          </div>
        </div>

        {/* Exporter and Consignee Top Grid */}
        <div className="grid grid-cols-2 gap-4 pb-4 mb-4 border-b border-slate-200">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
            <p className="text-[8px] font-black uppercase text-blue-700 tracking-wider">1. Exporter / Consignor (India):</p>
            <p className="font-black text-xs text-slate-900">{company.company_name}</p>
            {company.business_address && <p className="text-slate-600">{company.business_address}</p>}
            <p className="text-slate-600">{[company.city, company.state, company.pincode, 'INDIA'].filter(Boolean).join(', ')}</p>
            <p className="font-mono text-slate-700 font-bold pt-0.5">IEC No: 0519823489 • GSTIN: {company.gstin || '24AADCS9081J1ZP'}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
            <p className="text-[8px] font-black uppercase text-blue-700 tracking-wider">2. Buyer / Consignee (Overseas):</p>
            <p className="font-black text-xs text-slate-900">{client.name}</p>
            {client.address && <p className="text-slate-600">{client.address}</p>}
            <p className="text-slate-600">{[client.city, client.state, client.postal_code, client.country || 'USA'].filter(Boolean).join(', ')}</p>
            <p className="font-mono text-slate-700 font-bold pt-0.5">{client.gstin ? `Tax ID: ${client.gstin}` : 'Overseas Buyer'}</p>
          </div>
        </div>

        {/* Shipping & Logistics Grid */}
        <div className="grid grid-cols-4 gap-2.5 pb-4 mb-4 border-b border-slate-200 text-[9px] bg-slate-50/70 p-2.5 rounded-xl border">
          <div>
            <span className="text-[8px] text-slate-400 uppercase font-black block">Pre-Carriage By:</span>
            <strong className="text-slate-800">Road Carrier</strong>
          </div>
          <div>
            <span className="text-[8px] text-slate-400 uppercase font-black block">Port of Loading:</span>
            <strong className="text-slate-800">Mundra Port (INMUN1)</strong>
          </div>
          <div>
            <span className="text-[8px] text-slate-400 uppercase font-black block">Port of Discharge:</span>
            <strong className="text-slate-800">Gateway Port ({client.country || 'USA'})</strong>
          </div>
          <div>
            <span className="text-[8px] text-slate-400 uppercase font-black block">Terms of Delivery:</span>
            <strong className="text-blue-700 font-bold">CIF {client.city || 'Overseas'} ({currencySymbol})</strong>
          </div>
        </div>

        {/* Export Items Table */}
        <table className="w-full text-left border-collapse text-[9.5px] mb-6">
          <thead>
            <tr className="border-b-2 border-slate-900 bg-slate-900 text-white font-black uppercase text-[8.5px]">
              <th className="py-2 px-2 text-center w-8">Sl.</th>
              <th className="py-2 px-3">Description of Merchandise</th>
              <th className="py-2 px-2 text-center">HS Code</th>
              <th className="py-2 px-2 text-center">Quantity</th>
              <th className="py-2 px-3 text-right">Unit Rate ({currencySymbol})</th>
              <th className="py-2 px-3 text-right">Total ({currencySymbol})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium">
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-2.5 px-2 text-center font-bold">{idx + 1}</td>
                <td className="py-2.5 px-3">
                  <strong className="text-slate-950 font-bold">{item.description}</strong>
                  {item.product?.type && <span className="block text-[8px] text-slate-500">{item.product.type}</span>}
                </td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700">{item.hsn_code || '5208.11'}</td>
                <td className="py-2.5 px-2 text-center font-bold">{item.quantity} {item.product?.unit || 'Units'}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold">{currencySymbol}{item.rate.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">{currencySymbol}{item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Export Totals & SWIFT Block */}
        <div className="pt-4 border-t-2 border-slate-900 grid sm:grid-cols-12 gap-6 items-start">
          <div className="sm:col-span-7 space-y-2">
            {!isPaid ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[9.5px] flex items-start gap-4">
                <InvoicePaymentQR 
                  size={88} 
                  isExport={true} 
                  title="Verify / Wire QR"
                  subtitle="Digital Invoice Remittance"
                />
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="font-black text-slate-900 uppercase tracking-wider text-[8.5px] text-blue-700">
                    International Wire Transfer (SWIFT Remittance):
                  </p>
                  <p><strong className="text-slate-700">Beneficiary Bank:</strong> {company.bank_name || 'HDFC Bank Ltd, International Banking Branch'}</p>
                  <p className="font-mono"><strong className="text-slate-700 font-sans">SWIFT / BIC:</strong> <span className="font-black text-slate-900">{company.ifsc_code || 'HDFCINBBXXX'}</span></p>
                  <p className="font-mono"><strong className="text-slate-700 font-sans">Account No:</strong> {company.account_number || '00012480092144'} (EEFC)</p>
                  <p className="text-[8px] text-emerald-700 font-bold">UPI / Domestic transfer also supported</p>
                </div>
              </div>
            ) : null}
            <p className="text-[8px] text-slate-500 italic">
              Certification: We hereby certify that the invoice is true and correct and the goods are of Indian origin.
            </p>
          </div>

          <div className="sm:col-span-5 space-y-2 text-[10px]">
            <div className="flex justify-between text-slate-600">
              <span>Total FOB Value:</span>
              <span className="font-mono font-bold text-slate-900">{currencySymbol}{invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-semibold text-[9px]">
              <span>IGST (0% - Under Export LUT):</span>
              <span className="font-mono font-bold">$0.00</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 text-white flex justify-between items-center shadow-md">
              <span className="font-black text-xs uppercase tracking-wider">Total Value:</span>
              <span className="font-mono font-black text-lg text-emerald-400">
                {currencySymbol}{invoice.total_amount.toFixed(2)}
              </span>
            </div>

            <div className="text-right pt-3 border-t border-slate-200">
              <p className="font-bold text-xs text-slate-900">For {company.company_name}</p>
              {company.signature_url ? (
                <img src={company.signature_url} alt="Signature" className="h-10 ml-auto object-contain mix-blend-multiply py-1" />
              ) : (
                <div className="h-8"></div>
              )}
              <p className="text-[8px] text-slate-400 font-bold uppercase">Authorised Signatory / Export Manager</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5. CORPORATE TEMPLATE (Traditional, Executive Navy Ribbon, Serif Typography - Default)
  // =========================================================================
  if (template === 'corporate' || !['thermal', 'minimal', 'modern', 'export', 'elegant', 'professional', 'classic', 'creative', 'retail'].includes(template as string)) {
    return (
      <div className="invoice-template bg-white text-gray-900 p-4 md:p-8 max-w-4xl mx-auto font-serif shadow-sm border border-gray-200" style={{ minHeight: '297mm', width: '210mm', fontSize: '13px', lineHeight: '1.5' }}>
        {/* Header Ribbon */}
        <div className="border-b-4 border-blue-900 pb-4 mb-6 flex justify-between items-start bg-white">
          <div className="flex items-start gap-5">
            {company.logo_url && <img src={company.logo_url} alt="Logo" className="h-16 object-contain mt-1" />}
            <div>
              <h1 className="text-2xl font-bold text-blue-900 uppercase tracking-wide">{company.company_name || 'Your Company'}</h1>
              {!company.hide_company_details && company.business_address && <p className="text-xs text-gray-600 mt-1">{company.business_address}</p>}
              {!company.hide_company_details && (company.city || company.state || company.pincode) && (
                <p className="text-xs text-gray-600">
                  {[company.city, company.state, company.pincode].filter(Boolean).join(', ')}
                </p>
              )}
              {!company.hide_company_details && (company.phone || company.email) && (
                <p className="text-xs text-gray-600">
                  {[company.phone, company.email].filter(Boolean).join(' | ')}
                </p>
              )}
              {!company.hide_company_details && company.gstin && <p className="text-xs font-bold mt-1 text-slate-800">GSTIN: {company.gstin}</p>}
            </div>
          </div>
          <div className="text-right flex flex-col items-end pt-1">
            <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-widest">Tax Invoice</h2>
            {company.state && <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 mb-2">{company.state}</p>}
            <StatusBadge />
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Bill To */}
          <div className="border border-gray-300 rounded overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 font-bold text-blue-900 uppercase text-xs tracking-wider">Billed To</div>
            <div className="p-4 space-y-1">
              <div className="font-bold text-base text-gray-900">{client.name}</div>
              {!client.hide_contact_details && client.address && <p className="text-gray-600 text-xs">{client.address}</p>}
              {!client.hide_contact_details && (client.city || client.state || client.postal_code) && (
                <p className="text-gray-600 font-medium text-xs">
                  {[client.city, client.state, client.postal_code].filter(Boolean).join(', ')}
                </p>
              )}
              {!client.hide_contact_details && client.phone && <p className="text-gray-600 text-xs">Ph: {client.phone}</p>}
              {!client.hide_contact_details && client.email && <p className="text-gray-600 text-xs">{client.email}</p>}
              {!client.hide_contact_details && client.gstin && <p className="font-bold text-xs mt-2 text-slate-800">GSTIN: {client.gstin}</p>}
            </div>
          </div>

          {/* Invoice details */}
          <div className="border border-gray-300 rounded overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 font-bold text-blue-900 uppercase text-xs tracking-wider">Invoice Details</div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-gray-200">
                <tr><td className="py-2 px-4 font-semibold text-gray-600 bg-gray-50 bg-opacity-50">Invoice No.</td><td className="py-2 px-4 font-bold font-mono">{invoice.invoice_number}</td></tr>
                <tr><td className="py-2 px-4 font-semibold text-gray-600 bg-gray-50 bg-opacity-50">Issue Date</td><td className="py-2 px-4">{safelyFormatDate(invoice.issue_date, 'dd/MM/yyyy', 'N/A')}</td></tr>
                {isPaid && (
                  <tr><td className="py-2 px-4 font-semibold text-gray-600 bg-gray-50 bg-opacity-50">Payment Date</td><td className="py-2 px-4 font-bold text-emerald-700">{safelyFormatDate(invoice.paid_at || invoice.payment_date || invoice.updated_at || invoice.issue_date, 'dd/MM/yyyy', 'N/A')}</td></tr>
                )}
                {invoice.due_date && !isPaid && <tr><td className="py-2 px-4 font-semibold text-gray-600 bg-gray-50 bg-opacity-50">Due Date</td><td className="py-2 px-4">{safelyFormatDate(invoice.due_date, 'dd/MM/yyyy', 'N/A')}</td></tr>}
                <tr><td className="py-2 px-4 font-semibold text-gray-600 bg-gray-50 bg-opacity-50">Currency</td><td className="py-2 px-4">{invoice.currency}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Main Table Wrapper */}
        <div className="mb-6 border-2 border-blue-900 rounded overflow-hidden bg-white">
          <table className="w-full">
            <thead className="bg-blue-900 text-white">
              <tr className="divide-x divide-blue-800 text-xs">
                <th className="py-2.5 px-3 text-left font-semibold tracking-wider uppercase w-12 text-center">S.No</th>
                <th className="py-2.5 px-3 text-left font-semibold tracking-wider uppercase">Description</th>
                <th className="py-2.5 px-3 text-center font-semibold tracking-wider uppercase w-20">Qty</th>
                <th className="py-2.5 px-3 text-right font-semibold tracking-wider uppercase w-24">Rate</th>
                {hasDiscount && <th className="py-2.5 px-3 text-right font-semibold tracking-wider uppercase w-20">Disc%</th>}
                {hasGST && <th className="py-2.5 px-3 text-right font-semibold tracking-wider uppercase w-20">GST%</th>}
                <th className="py-2.5 px-3 text-right font-semibold tracking-wider uppercase w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 bg-white text-xs">
              {items.map((item, index) => (
                <tr key={index} className="divide-x divide-gray-200">
                  <td className="py-2.5 px-3 text-center text-gray-500">{index + 1}</td>
                  <td className="py-2.5 px-3 font-medium text-gray-900">
                    <div>{item.description}</div>
                    {item.hsn_code && <span className="text-[10px] text-gray-500 font-mono font-normal">HSN: {item.hsn_code}</span>}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{currencySymbol}{item.rate.toFixed(2)}</td>
                  {hasDiscount && <td className="py-2.5 px-3 text-right">{item.discount || 0}%</td>}
                  {hasGST && <td className="py-2.5 px-3 text-right">{item.tax_rate}%</td>}
                  <td className="py-2.5 px-3 text-right font-semibold font-mono">{currencySymbol}{item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="flex border-t-2 border-blue-900 bg-gray-50">
            <div className="w-1/2 border-r-2 border-blue-900">
              <div className="p-3 border-b border-gray-200">
                <p className="font-bold text-blue-900 text-[10px] uppercase tracking-wider mb-1">Amount in Words</p>
                <p className="text-gray-700 font-bold italic border-b border-dashed border-gray-400 pb-1 text-xs">{numberToWords(invoice.total_amount)}</p>
              </div>
              {!isPaid && (
                <div className="p-3 bg-white">
                  <h4 className="font-bold text-gray-800 uppercase text-[10px] tracking-wider mb-2">Payment & Bank Details</h4>
                  <div className="flex items-center gap-4">
                    <InvoicePaymentQR size={88} />
                    <div className="text-xs text-gray-600 grid grid-cols-[70px_1fr] gap-x-2 gap-y-1 font-sans">
                      <span className="font-semibold text-gray-500">Bank:</span> <span className="text-gray-800 font-medium">{company.bank_name || 'HDFC Bank Ltd'}</span>
                      <span className="font-semibold text-gray-500">A/C Name:</span> <span className="text-gray-800 font-medium">{company.account_holder_name || company.company_name || 'Business Account'}</span>
                      <span className="font-semibold text-gray-500">A/C No:</span> <span className="text-gray-800 font-medium font-mono font-bold">{company.account_number || '50200089213490'}</span>
                      <span className="font-semibold text-gray-500">IFSC:</span> <span className="text-gray-800 font-medium font-mono font-bold">{company.ifsc_code || 'HDFC0001248'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="w-1/2">
              <table className="w-full h-full text-xs">
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-2 px-4 font-semibold text-right w-2/3">Taxable Value</td>
                    <td className="py-2 px-4 text-right font-mono">{currencySymbol}{invoice.subtotal.toFixed(2)}</td>
                  </tr>
                  {(invoice.discount_amount || 0) > 0 ? (
                    <tr>
                      <td className="py-2 px-4 font-semibold text-right text-emerald-600">Discount</td>
                      <td className="py-2 px-4 text-right text-emerald-600 font-mono">-{currencySymbol}{invoice.discount_amount!.toFixed(2)}</td>
                    </tr>
                  ) : null}
                  {invoice.tax_amount > 0 && (
                    <tr>
                      <td className="py-2 px-4 font-semibold text-right">Total Tax Amount (GST)</td>
                      <td className="py-2 px-4 text-right font-mono">{currencySymbol}{invoice.tax_amount.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="bg-blue-100">
                    <td className="py-2.5 px-4 font-bold text-blue-900 text-right uppercase tracking-wider">Grand Total</td>
                    <td className="py-2.5 px-4 text-right font-bold text-blue-900 text-base font-mono border-l-2 border-blue-900">{currencySymbol}{invoice.total_amount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-gray-200">
            {invoice.notes && (
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">Notes</h4>
                <p className="text-xs text-gray-600 leading-relaxed italic border-l-2 border-gray-200 pl-3">{invoice.notes}</p>
              </div>
            )}
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">Terms &amp; Conditions</h4>
              <p className="text-xs text-gray-600 leading-relaxed italic border-l-2 border-gray-200 pl-3">
                {isPaid ? (
                  <span className="font-semibold text-slate-700 not-italic">Thanks for your business!</span>
                ) : (
                  invoice.terms || "Standard corporate terms apply."
                )}
              </p>
            </div>
          </div>

          {/* Declaration */}
          <div className="pt-2 border-t border-gray-100">
            <div className="text-[9px] text-gray-500 italic">
              <p className="font-bold uppercase tracking-wider mb-0.5 not-italic text-gray-400">Declaration</p>
              <p>We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.</p>
            </div>
          </div>

          {/* Signatures and Seal Area */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center pt-2">
            {/* Customer Sign */}
            <div className="flex flex-col items-center border-2 border-gray-300 rounded p-3 relative pt-6 bg-white">
              <div className="absolute top-1.5 left-3 text-[8.5px] font-bold text-gray-400 uppercase tracking-wider">Receiver's Acknowledgement</div>
              <div className="h-8 w-full"></div>
              <div className="border-t border-gray-800 w-full text-center pt-1 text-[9px] font-bold uppercase">
                Customer Sign
              </div>
            </div>

            <div className="flex justify-center items-center">
            </div>

            {/* Authorized Sign */}
            <div className="flex flex-col items-center border-2 border-blue-900 rounded p-3 relative pt-6 bg-white">
              <div className="absolute top-1.5 left-3 text-[8.5px] font-bold text-blue-900/70 uppercase tracking-wider">For {company.company_name}</div>
              {company.signature_url ? (
                <img src={company.signature_url} alt="Signature" className="h-8 object-contain mix-blend-multiply mb-1" />
              ) : (
                <div className="h-8 mb-1"></div>
              )}
              <div className="border-t-2 border-blue-900 w-full text-center pt-1 text-[9px] font-bold uppercase text-blue-900">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] text-gray-400 mt-6 border-t border-gray-200 pt-2 font-sans">
          <p className="font-medium text-gray-600">Thank you for your business!</p>
          <p className="mt-0.5">This invoice was generated on {format(new Date(), 'dd MMM yyyy')} at {format(new Date(), 'HH:mm')}</p>
          {company.email && <p className="mt-0.5">For queries, contact {company.email}</p>}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 6. ELEGANT TEMPLATE (Refined Multi-Tax Breakup, Sold By / Billing Grid)
  // =========================================================================
  if (template === 'elegant') {
    return (
      <div className="invoice-template bg-white text-slate-900 p-6 md:p-10 max-w-4xl mx-auto font-sans border border-slate-200 shadow-sm" style={{ minHeight: '297mm', width: '210mm', fontSize: '11px', lineHeight: '1.4' }}>
        {/* Header: Logo and Title */}
        <div className="flex justify-between items-start mb-6 border-b-2 border-slate-100 pb-5">
          <div className="flex flex-col gap-2">
            {company.logo_url ? (
              <img src={company.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
            ) : (
              <div className="text-2xl font-black text-slate-900 tracking-tighter">{company.company_name || 'Your Company'}</div>
            )}
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Tax Invoice</h1>
            <div className="mt-1 bg-slate-900 text-white text-[9px] px-2.5 py-0.5 w-fit font-bold uppercase tracking-wider rounded-sm inline-block">
              {invoice.status}
            </div>
          </div>
        </div>

        {/* Info Grid: Address Details */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <p className="text-slate-900 font-bold uppercase text-[10px] mb-2 border-b border-slate-100 pb-1">Sold By:</p>
            <div className="space-y-0.5 text-slate-600">
              <p className="font-bold text-slate-900">{company.company_name}</p>
              {!company.hide_company_details && company.business_address && <p className="whitespace-pre-wrap">{company.business_address}</p>}
              {!company.hide_company_details && (company.city || company.state || company.pincode) && (
                <p>
                  {[company.city, company.state, company.pincode].filter(Boolean).join(', ')}
                </p>
              )}
              {company.gstin && <p className="mt-1"><span className="font-bold text-slate-900">GSTIN:</span> {company.gstin}</p>}
              <p><span className="font-bold text-slate-900">PAN:</span> {company.gstin?.substring(2, 12) || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-slate-900 font-bold uppercase text-[10px] mb-2 border-b border-slate-100 pb-1">Billing Address:</p>
              <div className="space-y-0.5 text-slate-600">
                <p className="font-bold text-slate-900">{client.name}</p>
                {!client.hide_contact_details && client.address && <p className="whitespace-pre-wrap">{client.address}</p>}
                {!client.hide_contact_details && (client.city || client.state || client.postal_code) && (
                  <p>{[client.city, client.state, client.postal_code].filter(Boolean).join(', ')}</p>
                )}
                {client.gstin && <p className="mt-1"><span className="font-bold text-slate-900">GSTIN:</span> {client.gstin}</p>}
              </div>
            </div>
            <div>
              <p className="text-slate-900 font-bold uppercase text-[10px] mb-2 border-b border-slate-100 pb-1">Shipping Address:</p>
              <div className="space-y-0.5 text-slate-600">
                <p className="font-bold text-slate-900">{client.name}</p>
                {!client.hide_contact_details && client.address && <p className="whitespace-pre-wrap">{client.address}</p>}
                {!client.hide_contact_details && (client.city || client.state || client.postal_code) && (
                  <p>{[client.city, client.state, client.postal_code].filter(Boolean).join(', ')}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="flex justify-between items-center mb-6 bg-slate-50 p-3.5 rounded border border-slate-100 text-xs">
          <div className="flex-1 space-y-0.5">
            <p><span className="font-bold uppercase text-[9px] text-slate-400 mr-2">Invoice Number:</span> <span className="font-semibold font-mono">{invoice.invoice_number}</span></p>
            <p><span className="font-bold uppercase text-[9px] text-slate-400 mr-2">Invoice Date:</span> <span className="font-semibold">{safelyFormatDate(invoice.issue_date, 'dd.MM.yyyy', 'N/A')}</span></p>
            {isPaid && (
              <p><span className="font-bold uppercase text-[9px] text-slate-400 mr-2">Payment Date:</span> <span className="font-semibold text-emerald-700">{safelyFormatDate(invoice.paid_at || invoice.payment_date || invoice.updated_at || invoice.issue_date, 'dd.MM.yyyy', 'N/A')}</span></p>
            )}
          </div>
          {invoice.due_date && !isPaid && (
            <div className="text-right">
              <p><span className="font-bold uppercase text-[9px] text-slate-400 mr-2">Due Date:</span> <span className="font-semibold text-rose-600">{safelyFormatDate(invoice.due_date, 'dd.MM.yyyy', 'N/A')}</span></p>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="mb-6 border border-slate-200 rounded-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-[9px] font-bold uppercase text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2 px-3 border-r border-slate-200 w-10 text-center">Sl. No</th>
                <th className="py-2 px-3 border-r border-slate-200">Description</th>
                <th className="py-2 px-3 border-r border-slate-200 w-20 text-right">Unit Price</th>
                <th className="py-2 px-3 border-r border-slate-200 w-12 text-center">Qty</th>
                <th className="py-2 px-3 border-r border-slate-200 w-20 text-right">Net Amount</th>
                <th className="py-2 px-3 border-r border-slate-200 w-16 text-right">Tax Rate</th>
                <th className="py-2 px-3 border-r border-slate-200 w-16 text-right">Tax Type</th>
                <th className="py-2 px-3 border-r border-slate-200 w-20 text-right">Tax Amount</th>
                <th className="py-2 px-3 text-right w-24">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[10px]">
              {items.map((item, index) => {
                const itemTax = item.tax_rate > 0 ? (item.amount * item.tax_rate / 100) : 0;
                const netAmount = item.amount;
                const totalItemAmount = netAmount + itemTax;
                const isIntraState = company.state && client.state && company.state === client.state;
                const taxType = item.tax_rate > 0 ? (isIntraState ? 'CGST/SGST' : 'IGST') : '-';
                
                return (
                  <tr key={index} className="avoid-break text-slate-700">
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center">{index + 1}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900">{item.description}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono">{currencySymbol}{item.rate.toFixed(2)}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center">{item.quantity}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono">{currencySymbol}{netAmount.toFixed(2)}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-right">{item.tax_rate}%</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-right">{taxType}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono">{currencySymbol}{itemTax.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">{currencySymbol}{totalItemAmount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-[10.5px]">
              <tr>
                <td colSpan={8} className="py-2.5 px-3 border-r border-slate-200 text-right uppercase tracking-wider">Total</td>
                <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">{currencySymbol}{invoice.total_amount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Totals & Notes */}
        <div className="grid grid-cols-[1fr_250px] gap-8 items-start mb-8">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount in Words:</p>
            <p className="text-xs font-bold text-slate-900 italic mb-4">
              {numberToWords(invoice.total_amount)} Only
            </p>

            {invoice.notes && (
              <div className="mt-3">
                <p className="text-[10px] font-bold text-slate-900 mb-0.5">Notes:</p>
                <p className="text-[10px] text-slate-500 whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
              </div>
            )}

            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-900 mb-0.5">Terms &amp; Conditions:</p>
              <p className="text-[10px] text-slate-500 whitespace-pre-wrap leading-relaxed">
                {isPaid ? (
                  <span className="font-semibold text-slate-700">Thanks for your business!</span>
                ) : (
                  invoice.terms || "Payment is due within the stipulated time frame."
                )}
              </p>
            </div>
          </div>

          <div className="space-y-1.5 border-t-2 border-slate-900 pt-3">
            <div className="flex justify-between text-slate-600">
              <span className="font-bold uppercase text-[9px]">Subtotal:</span>
              <span className="font-mono">{currencySymbol}{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.tax_amount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span className="font-medium text-[9px]">{(company.state && client.state && company.state === client.state) ? 'CGST + SGST:' : 'IGST:'}</span>
                <span className="font-mono">{currencySymbol}{invoice.tax_amount.toFixed(2)}</span>
              </div>
            )}
            {(invoice.discount_amount || 0) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span className="font-bold uppercase text-[9px]">Discount:</span>
                <span className="font-mono">-{currencySymbol}{invoice.discount_amount!.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="font-black text-slate-900 uppercase text-[11px]">Total:</span>
              <span className="text-base font-black text-slate-900 font-mono tracking-tighter">{currencySymbol}{invoice.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer: Bank & Sign */}
        <div className="mt-auto pt-6 border-t border-slate-100 grid grid-cols-2 gap-8">
          <div>
            {!isPaid && (
              <div className="space-y-1 text-[10px] text-slate-600 p-3 bg-slate-50 rounded border border-slate-200">
                <p className="font-bold text-slate-900 uppercase text-[9px] mb-2 tracking-widest">Payment Information</p>
                <div className="flex items-center gap-4">
                  <InvoicePaymentQR size={88} />
                  <div className="grid grid-cols-[70px_1fr] gap-x-2 gap-y-1">
                    <span className="font-bold">Bank Name:</span> <span>{company.bank_name || 'HDFC Bank Ltd'}</span>
                    <span className="font-bold">A/C Name:</span> <span>{company.account_holder_name || company.company_name || 'Business Account'}</span>
                    <span className="font-bold">A/C No:</span> <span className="font-mono font-bold tracking-wider">{company.account_number || '50200089213490'}</span>
                    <span className="font-bold">IFSC Code:</span> <span className="font-mono font-bold tracking-widest">{company.ifsc_code || 'HDFC0001248'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="text-right flex flex-col items-end">
            <p className="font-bold text-slate-900 italic text-[10px] mb-3">For {company.company_name}:</p>
            {company.signature_url ? (
              <img src={company.signature_url} alt="Signature" className="h-10 w-32 object-contain mb-1 mix-blend-multiply" />
            ) : (
              <div className="h-10 w-32 mb-1"></div>
            )}
            <p className="text-[8.5px] font-bold uppercase tracking-tighter text-slate-400 border-t border-slate-200 pt-1 w-32 text-center">Authorized Signatory</p>
          </div>
        </div>

        <div className="mt-6 text-center text-[9px] text-slate-400">
          <p>This is a computer generated invoice and does not require a physical signature.</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 7. PROFESSIONAL TEMPLATE (Classic Blue Gradient Header Banner, Accent Borders)
  // =========================================================================
  if (template === 'professional') {
    return (
      <div className="invoice-template bg-white text-black p-4 md:p-8 max-w-4xl mx-auto font-sans shadow-sm border border-gray-200" style={{
        minHeight: '297mm',
        width: '210mm',
        fontSize: '12px',
        lineHeight: '1.4'
      }}>
        {/* Header */}
        <div className={`${styles.headerBg} text-white p-4 md:p-6 rounded-lg mb-6`}>
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-4">
              {company.logo_url && (
                <img
                  src={company.logo_url}
                  alt="Company Logo"
                  className="h-16 w-16 object-contain bg-white p-2 rounded mt-1"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold mb-1">
                  {company.company_name || 'Your Company'}
                </h1>
                <div className="text-sm opacity-90">
                  {!company.hide_company_details && company.business_address && <div>{company.business_address}</div>}
                  {!company.hide_company_details && (company.city || company.state || company.pincode) && (
                    <div>
                      {[company.city, company.state, company.pincode].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {!company.hide_company_details && (company.email || company.phone) && (
                    <div className="flex space-x-4 mt-1">
                      {company.email && <span>✉ {company.email}</span>}
                      {company.phone && <span>📞 {company.phone}</span>}
                    </div>
                  )}
                  {!company.hide_company_details && company.website && <div>🌐 {company.website}</div>}
                  {!company.hide_company_details && company.gstin && <div className="mt-1 font-bold">GSTIN: {company.gstin}</div>}
                </div>
              </div>
            </div>
            <div className="text-right pt-1">
              <div className="flex flex-col items-end">
                <h2 className="text-2xl font-bold tracking-wider">TAX INVOICE</h2>
                {company.state && <p className="text-sm font-bold text-blue-100 uppercase tracking-widest mt-1">{company.state}</p>}
              </div>
              <div className="text-lg mt-2 font-mono font-bold">#{invoice.invoice_number}</div>
              <div className="mt-2">
                <StatusBadge />
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className={`font-bold text-base ${styles.accentColor} mb-2`}>Bill To:</h3>
            <div className={`p-4 border-l-4 ${styles.borderColor} bg-gray-50 rounded-r`}>
              <div className="font-bold text-base mb-1">{client.name}</div>
              {!client.hide_contact_details && client.email && <div className="text-xs text-gray-600">✉ {client.email}</div>}
              {!client.hide_contact_details && client.phone && <div className="text-xs text-gray-600">📞 {client.phone}</div>}
              {!client.hide_contact_details && client.address && (
                <div className="mt-1 text-xs text-gray-600">
                  <div>{client.address}</div>
                  {(client.city || client.state || client.postal_code) && (
                    <div>
                      {[client.city, client.state, client.postal_code].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {client.country && <div>{client.country}</div>}
                </div>
              )}
              {!client.hide_contact_details && client.gstin && <div className="mt-1 text-xs font-bold text-gray-800">GSTIN: {client.gstin}</div>}
            </div>
          </div>
          <div>
            <h3 className={`font-bold text-base ${styles.accentColor} mb-2`}>Invoice Details:</h3>
            <div className="space-y-2 text-xs bg-gray-50 p-4 rounded border border-gray-100">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Issue Date:</span>
                <span className="font-bold">{safelyFormatDate(invoice.issue_date, 'dd MMM yyyy', 'N/A')}</span>
              </div>
              {isPaid && (
                <div className="flex justify-between font-semibold">
                  <span className="font-medium text-gray-600">Payment Date:</span>
                  <span className="font-bold text-emerald-700">{safelyFormatDate(invoice.paid_at || invoice.payment_date || invoice.updated_at || invoice.issue_date, 'dd MMM yyyy', 'N/A')}</span>
                </div>
              )}
              {invoice.due_date && !isPaid && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Due Date:</span>
                  <span className="font-bold">{safelyFormatDate(invoice.due_date, 'dd MMM yyyy', 'N/A')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Currency:</span>
                <span className="font-bold">{invoice.currency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h3 className={`font-bold text-base ${styles.accentColor} mb-3`}>Items &amp; Services:</h3>
          <table className="w-full border-collapse border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2.5 text-left font-bold">Description</th>
                <th className="border border-gray-300 p-2.5 text-center font-bold w-16">Qty</th>
                <th className="border border-gray-300 p-2.5 text-right font-bold w-24">Rate</th>
                {hasDiscount && <th className="border border-gray-300 p-2.5 text-right font-bold w-20">Discount %</th>}
                {hasGST && <th className="border border-gray-300 p-2.5 text-right font-bold w-20">GST %</th>}
                <th className="border border-gray-300 p-2.5 text-right font-bold w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 avoid-break">
                  <td className="border border-gray-300 p-2.5">
                    <div className="font-medium">{item.description}</div>
                    {item.hsn_code && <span className="text-[10px] text-gray-500 font-mono">HSN: {item.hsn_code}</span>}
                  </td>
                  <td className="border border-gray-300 p-2.5 text-center">{item.quantity}</td>
                  <td className="border border-gray-300 p-2.5 text-right font-mono">{currencySymbol}{item.rate.toFixed(2)}</td>
                  {hasDiscount && <td className="border border-gray-300 p-2.5 text-right">{item.discount || 0}%</td>}
                  {hasGST && <td className="border border-gray-300 p-2.5 text-right">{item.tax_rate}%</td>}
                  <td className="border border-gray-300 p-2.5 text-right font-bold font-mono">{currencySymbol}{item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bank Details and Totals Section */}
        <div className="flex justify-between items-start mb-8 gap-6 avoid-break">
          {/* Bank Details - Hidden if paid */}
          <div className="flex-1">
            {!isPaid && (
              <div>
                <h3 className={`font-bold text-base ${styles.accentColor} mb-2`}>Bank Transfer Details:</h3>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-4">
                    <InvoicePaymentQR size={88} />
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      <div>
                        <div className="text-gray-500 text-[10px] uppercase tracking-wider">Bank Name</div>
                        <div className="font-semibold text-xs">{company.bank_name || 'HDFC Bank Ltd'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-[10px] uppercase tracking-wider">Account Holder</div>
                        <div className="font-semibold text-xs">{company.account_holder_name || company.company_name || 'Business Account'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-[10px] uppercase tracking-wider">Account Number</div>
                        <div className="font-semibold text-xs font-mono font-bold">{company.account_number || '50200089213490'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-[10px] uppercase tracking-wider">IFSC Code</div>
                        <div className="font-semibold text-xs font-mono font-bold">{company.ifsc_code || 'HDFC0001248'}</div>
                      </div>
                      {company.account_type && (
                        <div>
                          <div className="text-gray-500 text-[10px] uppercase tracking-wider">Account Type</div>
                          <div className="font-semibold text-xs">{company.account_type}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="w-80 avoid-break">
            <div className="space-y-1.5 p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono">{currencySymbol}{invoice.subtotal.toFixed(2)}</span>
              </div>
              {(invoice.discount_amount || 0) > 0 ? (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span className="font-mono">-{currencySymbol}{invoice.discount_amount!.toFixed(2)}</span>
                </div>
              ) : null}
              {invoice.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span>Total Tax (GST):</span>
                  <span className="font-mono">{currencySymbol}{invoice.tax_amount.toFixed(2)}</span>
                </div>
              )}
              <hr className="border-gray-200" />
              <div className={`flex justify-between text-base font-bold ${styles.accentColor}`}>
                <span>Total Amount:</span>
                <span className="font-mono">{currencySymbol}{invoice.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes and Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 avoid-break text-xs">
          <div className="md:col-span-2">
            <h3 className={`font-bold ${styles.accentColor} mb-1`}>Amount in Words:</h3>
            <div className="p-3 bg-gray-50 rounded border-l-4 border-blue-400 font-bold italic text-slate-700">
              {numberToWords(invoice.total_amount)}
            </div>
          </div>
          {invoice.notes && (
            <div>
              <h3 className={`font-bold ${styles.accentColor} mb-1`}>Notes:</h3>
              <div className="p-3 bg-gray-50 rounded border-l-4 border-blue-400">
                {invoice.notes}
              </div>
            </div>
          )}
          <div>
            <h3 className={`font-bold ${styles.accentColor} mb-1`}>Terms &amp; Conditions:</h3>
            <div className="p-3 bg-gray-50 rounded border-l-4 border-blue-400">
              {isPaid ? (
                <span className="font-semibold text-slate-700">Thanks for your business!</span>
              ) : (
                invoice.terms || "Standard payment terms apply."
              )}
            </div>
          </div>
        </div>

        {/* Stamp/Signature Area */}
        <div className="flex justify-between items-center mt-10 px-4 avoid-break">
          {/* Customer Signature */}
          <div className="text-center w-36">
            <div className="h-12 mb-1"></div>
            <div className="border-t border-gray-400 pt-1 text-center w-full">
              <span className="text-xs text-gray-600">Customer Signature</span>
            </div>
          </div>

          {/* Authorized Signature */}
          <div className="text-center w-44 flex flex-col items-center">
            {company.signature_url ? (
              <div className="mb-1 h-12 flex items-center justify-center w-full">
                <img
                  src={company.signature_url}
                  alt="Authorized Signature"
                  className="max-h-12 max-w-full object-contain mix-blend-multiply"
                />
              </div>
            ) : (
              <div className="h-12 mb-1"></div>
            )}
            <div className="border-t border-gray-400 w-full pt-1">
              <span className="text-xs text-gray-600">Authorized Signature</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t-2 border-gray-200">
          <div className="text-center text-gray-600 text-xs">
            <p className="font-medium">Thank you for your business!</p>
            <p className="mt-0.5 text-[11px]">
              This invoice was generated on {format(new Date(), 'dd MMM yyyy')} at {format(new Date(), 'HH:mm')}
            </p>
            {company.email && (
              <p className="mt-0.5 text-[11px]">
                For any queries, please contact us at {company.email}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 9. CREATIVE STUDIO & TECH AGENCY TEMPLATE ('creative')
  // =========================================================================
  if (template === 'creative') {
    return (
      <div className="invoice-template bg-white text-slate-900 p-6 md:p-10 max-w-4xl mx-auto font-sans border border-violet-100 shadow-sm" style={{ minHeight: '297mm', width: '210mm', fontSize: '12px', lineHeight: '1.5' }}>
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 rounded-t-lg -mt-6 -mx-6 md:-mt-10 md:-mx-10 mb-8" />

        {/* Header: Company & Invoice Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            {company.logo_url ? (
              <img src={company.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-violet-200">
                {company.company_name ? company.company_name.charAt(0).toUpperCase() : 'C'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{company.company_name || 'Creative Studio'}</h1>
              {!company.hide_company_details && company.business_address && (
                <p className="text-xs text-slate-500 mt-0.5">{company.business_address}</p>
              )}
              {!company.hide_company_details && (company.city || company.state || company.pincode) && (
                <p className="text-xs text-slate-500">{[company.city, company.state, company.pincode].filter(Boolean).join(', ')}</p>
              )}
              {!company.hide_company_details && company.gstin && (
                <p className="text-xs font-mono font-semibold text-violet-700 mt-1">GSTIN: {company.gstin}</p>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1 sm:min-w-[220px]">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-200">
              Tax Invoice
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight pt-1">#{invoice.invoice_number}</p>
            <div className="text-xs text-slate-500 space-y-0.5">
              <p><span className="font-semibold text-slate-700">Issued:</span> {safelyFormatDate(invoice.issue_date)}</p>
              {invoice.due_date && <p><span className="font-semibold text-slate-700">Due:</span> {safelyFormatDate(invoice.due_date)}</p>}
              {isPaid && invoice.paid_at && (
                <p className="text-emerald-600 font-bold">Paid on {safelyFormatDate(invoice.paid_at)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Client & Scope Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 mb-1.5">Billed To / Client</p>
            <p className="text-sm font-bold text-slate-900">{client.name}</p>
            {!client.hide_contact_details && client.address && <p className="text-xs text-slate-500 mt-0.5">{client.address}</p>}
            {!client.hide_contact_details && (client.city || client.state || client.postal_code) && (
              <p className="text-xs text-slate-500">{[client.city, client.state, client.postal_code].filter(Boolean).join(', ')}</p>
            )}
            {!client.hide_contact_details && client.phone && <p className="text-xs text-slate-500">Tel: {client.phone}</p>}
            {!client.hide_contact_details && client.email && <p className="text-xs text-slate-500">{client.email}</p>}
            {client.gstin && <p className="text-xs font-mono font-semibold text-slate-700 mt-1">GSTIN: {client.gstin}</p>}
          </div>

          <div className="p-4 rounded-xl bg-violet-50/40 border border-violet-100/60 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-violet-700 mb-1.5">Project & Payment Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider ${
                  isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {invoice.status}
                </span>
                {invoice.payment_terms && (
                  <span className="text-xs font-semibold text-slate-600">Terms: {invoice.payment_terms}</span>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Deliverables & Creative Services rendered under contract.
            </p>
          </div>
        </div>

        {/* Deliverables / Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Deliverable / Scope</th>
                <th className="py-2.5 px-3 text-center">HSN/SAC</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3 text-right">Rate</th>
                {hasDiscount && <th className="py-2.5 px-3 text-right">Disc</th>}
                <th className="py-2.5 px-3 text-right">GST</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {item.description}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                    {item.hsn_code || item.product?.hsn_code || '998311'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                    {item.quantity} {item.product?.unit || ''}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                    {currencySymbol}{item.rate.toFixed(2)}
                  </td>
                  {hasDiscount && (
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      {item.discount ? `${item.discount}%` : '-'}
                    </td>
                  )}
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    {item.tax_rate ? `${item.tax_rate}%` : '0%'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {currencySymbol}{item.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculations and Bank / QR Footer */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
          <div className="md:col-span-7 space-y-4">
            {!isPaid && (
              <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-violet-100 bg-violet-50/30">
                <InvoicePaymentQR size={92} title="Scan & Pay via UPI" subtitle="Instant Creative Settlement" />
                <div className="space-y-1 text-xs text-slate-600">
                  <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-violet-700">Direct Bank Transfer (NEFT/IMPS)</p>
                  {company.bank_name && <p><span className="font-medium text-slate-500">Bank:</span> {company.bank_name}</p>}
                  {company.account_number && <p><span className="font-medium text-slate-500">A/C No:</span> <span className="font-mono font-bold">{company.account_number}</span></p>}
                  {company.ifsc_code && <p><span className="font-medium text-slate-500">IFSC:</span> <span className="font-mono font-bold">{company.ifsc_code}</span></p>}
                  {company.account_holder_name && <p><span className="font-medium text-slate-500">Beneficiary:</span> {company.account_holder_name}</p>}
                </div>
              </div>
            )}

            {invoice.notes && (
              <div className="text-xs text-slate-600 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-0.5">Project Notes:</p>
                <p>{invoice.notes}</p>
              </div>
            )}
            <p className="text-[11px] text-slate-500 italic">
              Amount in words: <span className="font-bold text-slate-700 not-italic">{numberToWords(invoice.total_amount)} Only</span>
            </p>
          </div>

          <div className="md:col-span-5 space-y-2">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">{currencySymbol}{invoice.subtotal.toFixed(2)}</span>
              </div>
              {hasDiscount && (invoice.discount_amount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Project Discount:</span>
                  <span className="font-mono font-semibold">-{currencySymbol}{(invoice.discount_amount || 0).toFixed(2)}</span>
                </div>
              )}
              {hasGST && (
                <div className="flex justify-between text-slate-600">
                  <span>GST Total:</span>
                  <span className="font-mono font-semibold">{currencySymbol}{invoice.tax_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-sm font-black text-violet-900">
                <span>Total Amount:</span>
                <span className="text-base font-mono font-black">{currencySymbol}{invoice.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center pt-4">
              <div className="h-12 flex items-center justify-center">
                {company.signature_url ? (
                  <img src={company.signature_url} alt="Signature" className="h-12 max-h-12 object-contain" />
                ) : (
                  <div className="border border-dashed border-violet-300 px-3 py-1 rounded text-[10px] text-violet-500 font-medium">
                    Digitally Authorized Signatory
                  </div>
                )}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mt-1">For {company.company_name || 'Creative Studio'}</p>
            </div>
          </div>
        </div>

        {/* Bottom Thank You */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          <p className="font-semibold text-slate-600">Thank you for collaborating with us!</p>
          {company.website && <p className="text-[11px] text-violet-600 mt-0.5">{company.website}</p>}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 10. RETAIL COUNTER & GST SUPERSTORE TEMPLATE ('retail')
  // =========================================================================
  if (template === 'retail') {
    const totalDiscountAmount = items.reduce((acc, it) => acc + (it.quantity * it.rate * (it.discount || 0)) / 100, 0) + (invoice.discount_amount || 0);

    return (
      <div className="invoice-template bg-white text-slate-900 p-6 md:p-8 max-w-4xl mx-auto font-sans border-2 border-emerald-800 shadow-sm" style={{ minHeight: '297mm', width: '210mm', fontSize: '11.5px', lineHeight: '1.4' }}>
        {/* Retail Top Header */}
        <div className="border-b-2 border-emerald-800 pb-4 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex items-center gap-3">
              {company.logo_url && (
                <img src={company.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
              )}
              <div>
                <h1 className="text-xl font-black uppercase text-emerald-950 tracking-tight">{company.company_name || 'Superstore / Retail Mart'}</h1>
                {!company.hide_company_details && company.business_address && (
                  <p className="text-xs text-slate-600">{company.business_address}, {[company.city, company.state, company.pincode].filter(Boolean).join(' - ')}</p>
                )}
                {!company.hide_company_details && (company.phone || company.mobile) && (
                  <p className="text-xs text-slate-600">Helpline: {company.phone || company.mobile}</p>
                )}
                <p className="text-xs font-mono font-black text-emerald-800 mt-0.5">GSTIN: {company.gstin || '24AAACC1206D1ZH'}</p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="inline-block bg-emerald-800 text-white font-black text-[10px] uppercase px-2.5 py-0.5 rounded tracking-wider">
                Retail Tax Invoice / Cash Memo
              </span>
              <p className="font-mono font-black text-base text-slate-950">Bill No: {invoice.invoice_number}</p>
              <p className="text-xs text-slate-600">Date: {safelyFormatDate(invoice.issue_date)}</p>
              <p className="text-xs text-slate-600">Time: {format(new Date(), 'hh:mm a')}</p>
              <p className="text-xs font-semibold text-emerald-700">POS Counter: Billing Desk 01</p>
            </div>
          </div>
        </div>

        {/* Customer & Bill Details Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-emerald-50/60 p-2.5 rounded border border-emerald-200 text-xs mb-4">
          <div>
            <span className="text-[9px] font-black uppercase text-emerald-800">Customer:</span>
            <p className="font-bold text-slate-900 truncate">{client.name}</p>
          </div>
          <div>
            <span className="text-[9px] font-black uppercase text-emerald-800">Contact:</span>
            <p className="font-mono text-slate-800">{client.phone || client.email || 'Retail Walk-in'}</p>
          </div>
          <div>
            <span className="text-[9px] font-black uppercase text-emerald-800">Customer GSTIN:</span>
            <p className="font-mono text-slate-800">{client.gstin || 'Unregistered / B2C'}</p>
          </div>
          <div>
            <span className="text-[9px] font-black uppercase text-emerald-800">Payment Mode:</span>
            <p className="font-bold text-emerald-800">{isPaid ? 'PAID (UPI/Card)' : 'PENDING / CREDIT'}</p>
          </div>
        </div>

        {/* Retail Items Table */}
        <div className="border border-slate-300 rounded overflow-hidden mb-4">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-emerald-900 text-white text-[9.5px] font-black uppercase tracking-wider">
                <th className="p-2 text-center w-8">#</th>
                <th className="p-2">Item Description / Product</th>
                <th className="p-2 text-center">HSN</th>
                <th className="p-2 text-right">Qty</th>
                <th className="p-2 text-right">MRP / Rate</th>
                <th className="p-2 text-right">Disc</th>
                <th className="p-2 text-right">Taxable</th>
                <th className="p-2 text-right">GST</th>
                <th className="p-2 text-right">Net Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {items.map((item, idx) => {
                const base = item.quantity * item.rate;
                const disc = (base * (item.discount || 0)) / 100;
                const taxable = base - disc;
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="p-2 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="p-2 font-bold text-slate-900">{item.description}</td>
                    <td className="p-2 text-center font-mono text-slate-600 text-[11px]">{item.hsn_code || item.product?.hsn_code || '1905'}</td>
                    <td className="p-2 text-right font-mono font-bold text-slate-800">{item.quantity} {item.product?.unit || 'Nos'}</td>
                    <td className="p-2 text-right font-mono text-slate-700">{currencySymbol}{item.rate.toFixed(2)}</td>
                    <td className="p-2 text-right font-mono text-emerald-700 font-semibold">{item.discount ? `${item.discount}%` : '-'}</td>
                    <td className="p-2 text-right font-mono text-slate-700">{currencySymbol}{taxable.toFixed(2)}</td>
                    <td className="p-2 text-right font-mono text-slate-600">{item.tax_rate ? `${item.tax_rate}%` : '0%'}</td>
                    <td className="p-2 text-right font-mono font-black text-slate-950">{currencySymbol}{item.amount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Savings Callout Banner */}
        {totalDiscountAmount > 0 && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-4 py-2 rounded text-center font-black text-xs uppercase tracking-wider mb-4 flex items-center justify-center gap-2">
            <span>🎉 TOTAL SAVINGS ON THIS PURCHASE:</span>
            <span className="font-mono text-sm underline">{currencySymbol}{totalDiscountAmount.toFixed(2)}</span>
          </div>
        )}

        {/* Retail Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-7 space-y-3">
            {!isPaid && (
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded border border-slate-200">
                <InvoicePaymentQR size={88} title="Scan & Pay at Counter" subtitle="PhonePe • GPay • Paytm" />
                <div className="text-xs space-y-0.5 text-slate-600">
                  <p className="font-bold text-emerald-900 uppercase text-[10px]">Instant Counter Settlement</p>
                  {company.bank_name && <p><span className="font-medium text-slate-500">Bank:</span> {company.bank_name}</p>}
                  {company.account_number && <p><span className="font-medium text-slate-500">A/C:</span> <span className="font-mono font-bold">{company.account_number}</span></p>}
                  {company.ifsc_code && <p><span className="font-medium text-slate-500">IFSC:</span> <span className="font-mono font-bold">{company.ifsc_code}</span></p>}
                </div>
              </div>
            )}

            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[10.5px] text-slate-600 space-y-1">
              <p className="font-bold text-slate-800 uppercase text-[9.5px]">Terms & Return Policy:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Goods once sold can be exchanged within 7 days with original tax invoice.</li>
                <li>No cash refund; credit note will be issued for valid returns.</li>
                <li>Manufacturer warranty applicable on electronic items.</li>
              </ul>
            </div>
            <p className="text-[11px] text-slate-500">
              Total items: <span className="font-bold text-slate-800">{items.reduce((s, it) => s + (it.quantity || 1), 0)} Units</span> • Words: <span className="font-bold text-slate-800">{numberToWords(invoice.total_amount)} Only</span>
            </p>
          </div>

          <div className="md:col-span-5 space-y-2">
            <div className="bg-emerald-50/50 rounded p-3.5 border border-emerald-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Gross Item Subtotal:</span>
                <span className="font-mono font-semibold">{currencySymbol}{invoice.subtotal.toFixed(2)}</span>
              </div>
              {totalDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Store Discount:</span>
                  <span className="font-mono">-{currencySymbol}{totalDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              {hasGST && (
                <div className="flex justify-between text-slate-600">
                  <span>Total GST ({company.state?.toLowerCase() === client.state?.toLowerCase() ? 'CGST+SGST' : 'IGST'}):</span>
                  <span className="font-mono font-semibold">{currencySymbol}{invoice.tax_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t-2 border-emerald-800 pt-2 flex justify-between items-center text-sm font-black text-emerald-950">
                <span>NET PAYABLE:</span>
                <span className="text-lg font-mono font-black">{currencySymbol}{invoice.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Computer Generated Tax Invoice</p>
              <p className="text-[10px] font-bold text-slate-800 mt-1">Thank You! Please Visit Again!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 8. TALLY / CA CLASSIC RULE 46 BOXED GRID (Default: 'classic')
  // =========================================================================
  return (
    <div className="invoice-template bg-white text-slate-900 border-2 border-slate-900 p-4 sm:p-6 mx-auto text-left text-[10px] font-sans shadow-xl w-full" style={{ width: '100%', maxWidth: '800px', minHeight: '1000px', lineHeight: '1.4' }}>
      {/* Tally Header Title */}
      <div className="text-center pb-2 border-b-2 border-slate-900">
        <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900">
          TAX INVOICE
        </h3>
        <p className="text-[9px] text-slate-600 font-semibold uppercase">
          (Issued under Section 31 of CGST Act, 2017 & Rule 46 of CGST Rules, 2017)
        </p>
        <div className="flex justify-between items-center text-[8.5px] font-bold text-slate-700 mt-1 px-1">
          <span>GSTIN: {company.gstin || '24AADCS9081J1ZP'}</span>
          <span className="border border-slate-800 px-2 py-0.5 uppercase bg-slate-100 font-black">ORIGINAL FOR RECIPIENT</span>
          <span>STATE: {company.state?.toUpperCase() || 'GUJARAT (24)'}</span>
        </div>
      </div>

      {/* Tally 3-Column Top Metadata Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 border-b-2 border-slate-900 divide-y md:divide-y-0 md:divide-x-2 divide-slate-900">
        {/* Column 1: Supplier */}
        <div className="md:col-span-5 p-2.5 space-y-0.5">
          <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Details of Supplier / Consignor:</p>
          <p className="font-black text-xs text-slate-950">{company.company_name}</p>
          {company.business_address && <p className="text-slate-700">{company.business_address}</p>}
          <p className="text-slate-700">{[company.city, company.state, company.pincode].filter(Boolean).join(', ')}</p>
          <p className="text-slate-700 font-mono font-bold">GSTIN: {company.gstin || 'N/A'}</p>
          <p className="text-slate-700">{company.email} • {company.phone}</p>
        </div>

        {/* Column 2: Invoice Details */}
        <div className="md:col-span-4 p-2.5 space-y-1">
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="text-slate-500 font-bold">Invoice No:</span>
            <span className="font-mono font-black text-slate-900 text-xs">{invoice.invoice_number}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="text-slate-500 font-bold">Dated:</span>
            <span className="font-mono font-bold text-slate-900">{safelyFormatDate(invoice.issue_date, 'dd-MMM-yyyy')}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="text-slate-500 font-bold">Place of Supply:</span>
            <span className="font-bold text-slate-900">{client.state || company.state || 'Intra-State'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-bold">Reverse Charge:</span>
            <span className="font-bold text-slate-900">No (N)</span>
          </div>
        </div>

        {/* Column 3: Logistics & Transporter */}
        <div className="md:col-span-3 p-2.5 space-y-1 bg-slate-50/70">
          <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Transportation:</p>
          <p className="text-[9px]"><strong className="text-slate-700">e-Way Bill:</strong> <span className="font-mono font-bold">2418 9021 3492</span></p>
          <p className="text-[9px]"><strong className="text-slate-700">Terms:</strong> {invoice.payment_terms || 'Net 15 Days'}</p>
          <p className="text-[9px]"><strong className="text-slate-700">Status:</strong> <span className="uppercase font-bold">{invoice.status}</span></p>
        </div>
      </div>

      {/* Consignee / Bill To Row */}
      <div className="p-2.5 border-b-2 border-slate-900 bg-slate-50/40">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Billed To (Recipient / Consignee):</p>
            <p className="font-black text-xs text-slate-950 mt-0.5">{client.name}</p>
            {client.address && <p className="text-slate-700">{client.address}</p>}
            <p className="text-slate-700">{[client.city, client.state, client.postal_code].filter(Boolean).join(', ')}</p>
          </div>
          <div className="sm:text-right space-y-0.5">
            <p><strong className="text-slate-700">GSTIN / UIN:</strong> <span className="font-mono font-bold">{client.gstin || 'Unregistered'}</span></p>
            <p><strong className="text-slate-700">State:</strong> {client.state || 'N/A'}</p>
            <p><strong className="text-slate-700">Payment Due:</strong> {invoice.due_date ? safelyFormatDate(invoice.due_date, 'dd-MMM-yyyy') : 'On Receipt'}</p>
          </div>
        </div>
      </div>

      {/* Tally Classic Ruled Items Table */}
      <table className="w-full border-collapse border-b-2 border-slate-900 text-[9.5px]">
        <thead>
          <tr className="border-b-2 border-slate-900 bg-slate-100 font-black text-slate-900 divide-x-2 divide-slate-900 text-center">
            <th className="py-1.5 px-1.5 w-8">Sl.</th>
            <th className="py-1.5 px-3 text-left">Description of Goods / Services</th>
            <th className="py-1.5 px-2 w-16">HSN/SAC</th>
            <th className="py-1.5 px-2 w-16">Qty</th>
            <th className="py-1.5 px-2 w-20 text-right">Rate ({currencySymbol})</th>
            <th className="py-1.5 px-1.5 w-12">per</th>
            <th className="py-1.5 px-3 w-24 text-right">Amount ({currencySymbol})</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300 font-medium divide-x-2 divide-slate-900">
          {items.map((item, index) => (
            <tr key={index}>
              <td className="py-2 px-1 text-center font-bold">{index + 1}</td>
              <td className="py-2 px-3">
                <strong className="text-slate-950 font-black">{item.description}</strong>
                {item.product?.type && <span className="block text-[8px] text-slate-500">{item.product.type}</span>}
              </td>
              <td className="py-2 px-2 text-center font-mono font-bold">{item.hsn_code || item.product?.hsn_code || '5208'}</td>
              <td className="py-2 px-2 text-center font-bold">{item.quantity} {item.product?.unit || 'Nos'}</td>
              <td className="py-2 px-2 text-right font-mono">{item.rate.toFixed(2)}</td>
              <td className="py-2 px-1 text-center text-slate-600">{item.product?.unit || 'Nos'}</td>
              <td className="py-2 px-3 text-right font-mono font-bold">{item.amount.toFixed(2)}</td>
            </tr>
          ))}

          <tr className="bg-slate-50 font-bold divide-x-2 divide-slate-900 border-t-2 border-slate-900">
            <td colSpan={6} className="py-1.5 px-3 text-right uppercase font-black">
              Total Taxable Subtotal:
            </td>
            <td className="py-1.5 px-3 text-right font-mono font-black">{currencySymbol}{invoice.subtotal.toFixed(2)}</td>
          </tr>

          {invoice.tax_amount > 0 && (
            <tr className="divide-x-2 divide-slate-900">
              <td colSpan={6} className="py-1 px-3 text-right text-slate-700">
                GST Tax Amount:
              </td>
              <td className="py-1 px-3 text-right font-mono font-bold">{currencySymbol}{invoice.tax_amount.toFixed(2)}</td>
            </tr>
          )}

          {(invoice.discount_amount || 0) > 0 && (
            <tr className="divide-x-2 divide-slate-900">
              <td colSpan={6} className="py-1 px-3 text-right text-emerald-600">
                Discount Deducted:
              </td>
              <td className="py-1 px-3 text-right font-mono font-bold text-emerald-600">-{currencySymbol}{invoice.discount_amount!.toFixed(2)}</td>
            </tr>
          )}

          <tr className="bg-slate-100 font-black divide-x-2 divide-slate-900 border-t-2 border-slate-900">
            <td colSpan={6} className="py-1.5 px-3 text-right uppercase text-xs">
              Total Invoice Value (in Figures):
            </td>
            <td className="py-1.5 px-3 text-right font-mono font-black text-xs text-slate-950">
              {currencySymbol}{invoice.total_amount.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Amount in words */}
      <div className="p-2 border-b-2 border-slate-900 bg-slate-50/50">
        <span className="font-bold text-slate-600">Amount Chargeable (in words): </span>
        <strong className="font-black text-slate-950 uppercase">{numberToWords(invoice.total_amount)}</strong>
      </div>

      {/* CA & Tally Exclusive: HSN/SAC Tax Breakup Summary Table */}
      {hsnTaxSummary.length > 0 && (
        <div className="p-2 border-b-2 border-slate-900 bg-slate-50/20">
          <p className="text-[8px] font-black uppercase text-slate-700 mb-1">HSN/SAC Tax Breakup Summary (Rule 46 Mandatory):</p>
          <table className="w-full text-[8.5px] border border-slate-900 text-center border-collapse">
            <thead>
              <tr className="bg-slate-200/80 font-black border-b border-slate-900 divide-x divide-slate-900">
                <th className="py-1 px-1">HSN/SAC</th>
                <th className="py-1 px-1 text-right">Taxable Value</th>
                <th className="py-1 px-1">GST Rate</th>
                <th className="py-1 px-1 text-right">Tax Amount</th>
                <th className="py-1 px-1 text-right">Total Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 font-mono divide-x divide-slate-900">
              {hsnTaxSummary.map((grp, i) => (
                <tr key={i}>
                  <td className="py-0.5">{grp.hsn}</td>
                  <td className="text-right px-1">{currencySymbol}{grp.taxable.toFixed(2)}</td>
                  <td>{grp.rate}%</td>
                  <td className="text-right px-1">{currencySymbol}{grp.totalTax.toFixed(2)}</td>
                  <td className="text-right px-1 font-bold">{currencySymbol}{grp.totalTax.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="font-bold bg-slate-100 divide-x divide-slate-900 border-t border-slate-900">
                <td className="font-black text-center">TOTAL:</td>
                <td className="text-right px-1 font-black">{currencySymbol}{invoice.subtotal.toFixed(2)}</td>
                <td>-</td>
                <td className="text-right px-1 font-black">{currencySymbol}{invoice.tax_amount.toFixed(2)}</td>
                <td className="text-right px-1 font-black">{currencySymbol}{invoice.tax_amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tally Bottom Grid: Bank Details + Declaration | Signatory */}
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x-2 divide-slate-900">
        <div className="md:col-span-7 p-2.5 space-y-1.5">
          {!isPaid ? (
            <>
              <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Company's Bank &amp; Payment Details:</p>
              <div className="flex items-center gap-4">
                <InvoicePaymentQR size={88} />
                <div className="font-mono text-[9.5px] text-slate-800 space-y-1">
                  <p><strong>Bank Name:</strong> {company.bank_name || 'HDFC Bank Ltd'}</p>
                  <p><strong>A/C No:</strong> <span className="font-bold">{company.account_number || '50200089213490'}</span> ({company.account_type || 'Current'})</p>
                  <p><strong>Branch &amp; IFSC:</strong> <span className="font-bold">{company.ifsc_code || 'HDFC0001248'}</span></p>
                  <p className="text-[8.5px] text-emerald-700 font-sans font-bold">Scan QR code for instant UPI payment settlement</p>
                </div>
              </div>
            </>
          ) : null}
          <div className="pt-1 text-[8px] text-slate-500 leading-tight">
            <strong>Declaration: </strong>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
          </div>
        </div>

        <div className="md:col-span-5 p-2.5 flex flex-col justify-between text-right">
          <p className="font-black text-[9px] uppercase text-slate-900">
            For {company.company_name}
          </p>
          <div className="py-2 pr-2">
            {company.signature_url ? (
              <img src={company.signature_url} alt="Signature" className="h-12 ml-auto object-contain mix-blend-multiply" />
            ) : (
              <span className="inline-block border border-dashed border-slate-300 px-3 py-1 text-[8px] text-slate-400">
                [ Digital Seal / Rubber Stamp ]
              </span>
            )}
          </div>
          <p className="font-bold text-[8.5px] uppercase text-slate-700 border-t border-slate-300 pt-1">
            Authorised Signatory
          </p>
        </div>
      </div>
    </div>
  );
};
