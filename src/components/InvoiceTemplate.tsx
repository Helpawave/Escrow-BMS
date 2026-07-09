import React from 'react';
import { safelyFormatDate } from '@/utils/dateUtils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';
import { numberToWords } from '@/utils/numberUtils';

interface InvoiceItem {
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
  hide_company_details?: boolean;
}

interface InvoiceTemplateProps {
  invoice: {
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
  };
  client: Client;
  items: InvoiceItem[];
  company: CompanyProfile;
  template?: 'professional' | 'elegant' | 'minimal' | 'modern' | 'corporate';
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
  let contextCurrencySymbol = '₹';
  try {
    const context = useCurrency();
    contextCurrencySymbol = context.currencySymbol;
  } catch (e) {
    // Ignore error if used outside of provider
  }
  const currencySymbol = propCurrencySymbol || contextCurrencySymbol;
  const getTemplateStyles = () => {
    switch (template) {
      case 'elegant':
        return {
          headerBg: 'bg-gradient-to-r from-purple-600 to-blue-600',
          accentColor: 'text-purple-600',
          borderColor: 'border-purple-200'
        };
      case 'minimal':
        return {
          headerBg: 'bg-gray-800',
          accentColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
      case 'modern':
        return {
          headerBg: 'bg-gradient-to-r from-green-500 to-teal-600',
          accentColor: 'text-green-600',
          borderColor: 'border-green-200'
        };
      case 'corporate':
        return {
          headerBg: 'bg-gradient-to-r from-blue-800 to-indigo-800',
          accentColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        };
      default: // professional
        return {
          headerBg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
          accentColor: 'text-blue-600',
          borderColor: 'border-blue-200'
        };
    }
  };

  const styles = getTemplateStyles();
  const hasGST = (invoice.tax_amount > 0) || items.some(item => (item.tax_rate || 0) > 0);
  const hasDiscount = items.some(item => (item.discount || 0) > 0);

  const StatusBadge = ({ className = "" }) => (
    <div className={`text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 leading-none ${className}`}>
      {invoice.status}
    </div>
  );

  // --- ELEGANT TEMPLATE (Amazon-Style E-commerce Layout) ---
  if (template === 'elegant') {

    return (
      <div className="invoice-template bg-white text-slate-900 p-6 md:p-12 max-w-4xl mx-auto font-sans border border-slate-200 shadow-sm" style={{ minHeight: '297mm', width: '210mm', fontSize: '11px', lineHeight: '1.4' }}>
        {/* Header: Logo and Title */}
        <div className="flex justify-between items-start mb-8 border-b-2 border-slate-100 pb-6">
          <div className="flex flex-col gap-3">
            {company.logo_url ? (
              <img src={company.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
            ) : (
              <div className="text-2xl font-black text-slate-900 tracking-tighter">{company.company_name}</div>
            )}
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Tax Invoice</h1>
            <div className={`mt-2 bg-slate-900 text-white text-[9px] px-2 py-0.5 w-fit font-bold uppercase tracking-wider rounded-sm inline-block`}>
              {invoice.status}
            </div>
          </div>
        </div>

        {/* Info Grid: Address Details */}
        <div className="grid grid-cols-2 gap-12 mb-10">
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

          <div className="grid grid-cols-1 gap-6">
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
        <div className="flex justify-between items-center mb-8 bg-slate-50 p-4 rounded border border-slate-100">
          <div className="flex-1 space-y-1">
            <p><span className="font-bold uppercase text-[9px] text-slate-400 mr-2">Invoice Number:</span> <span className="font-semibold">{invoice.invoice_number}</span></p>
            <p><span className="font-bold uppercase text-[9px] text-slate-400 mr-2">Invoice Date:</span> <span className="font-semibold">{safelyFormatDate(invoice.issue_date, 'dd.MM.yyyy', 'N/A')}</span></p>
          </div>
          {invoice.due_date && invoice.status !== 'paid' && (
            <div className="text-right">
              <p><span className="font-bold uppercase text-[9px] text-slate-400 mr-2">Due Date:</span> <span className="font-semibold text-rose-600">{safelyFormatDate(invoice.due_date, 'dd.MM.yyyy', 'N/A')}</span></p>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="mb-8 border border-slate-200 rounded-sm overflow-hidden">
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
                    <td className="py-3 px-3 border-r border-slate-200 text-center">{index + 1}</td>
                    <td className="py-3 px-3 border-r border-slate-200 font-bold text-slate-900">{item.description}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-right font-mono">{currencySymbol}{item.rate.toFixed(2)}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-center">{item.quantity}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-right font-mono">{currencySymbol}{netAmount.toFixed(2)}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-right">{item.tax_rate}%</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-right">{taxType}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-right font-mono">{currencySymbol}{itemTax.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-bold font-mono text-slate-900">{currencySymbol}{totalItemAmount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-[11px]">
              <tr>
                <td colSpan={8} className="py-3 px-3 border-r border-slate-200 text-right uppercase tracking-wider">Total</td>
                <td className="py-3 px-3 text-right font-mono font-black text-slate-900">{currencySymbol}{invoice.total_amount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Totals & Notes */}
        <div className="grid grid-cols-[1fr_250px] gap-12 items-start mb-12">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount in Words:</p>
            <p className="text-xs font-bold text-slate-900 italic mb-6">
              {numberToWords(invoice.total_amount)} Only
            </p>

            {invoice.terms && (
              <div className="mt-4">
                <p className="text-[10px] font-bold text-slate-900 mb-1">Terms:</p>
                <p className="text-[10px] text-slate-500 whitespace-pre-wrap leading-relaxed">{invoice.terms}</p>
              </div>
            )}
          </div>

          <div className="space-y-2 border-t-2 border-slate-900 pt-4">
            <div className="flex justify-between text-slate-600">
              <span className="font-bold uppercase text-[9px]">Subtotal:</span>
              <span className="font-mono">{currencySymbol}{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.tax_amount > 0 && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium text-[9px]">{(company.state && client.state && company.state === client.state) ? 'CGST + SGST:' : 'IGST:'}</span>
                  <span className="font-mono">{currencySymbol}{invoice.tax_amount.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="font-black text-slate-900 uppercase text-[11px]">Total:</span>
              <span className="text-lg font-black text-slate-900 font-mono tracking-tighter">{currencySymbol}{invoice.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer: Bank & Sign */}
        <div className="mt-auto pt-8 border-t border-slate-100 grid grid-cols-2 gap-12">
          <div>
            {company.bank_name && (
              <div className="space-y-1 text-[10px] text-slate-600 p-4 bg-slate-50 rounded border border-slate-100">
                <p className="font-bold text-slate-900 uppercase text-[9px] mb-2 tracking-widest">Payment Information</p>
                <div className="grid grid-cols-[80px_1fr] gap-x-2">
                  <span className="font-bold">Bank Name:</span> <span>{company.bank_name}</span>
                  <span className="font-bold">A/C Name:</span> <span>{company.account_holder_name}</span>
                  <span className="font-bold">A/C No:</span> <span className="font-mono font-bold tracking-wider">{company.account_number}</span>
                  <span className="font-bold">IFSC Code:</span> <span className="font-mono font-bold tracking-widest">{company.ifsc_code}</span>
                </div>
              </div>
            )}
          </div>
          <div className="text-right flex flex-col items-end">
             <p className="font-bold text-slate-900 italic text-[10px] mb-4">For {company.company_name}:</p>
             {company.signature_url ? (
               <img src={company.signature_url} alt="Signature" className="h-12 w-32 object-contain mb-2 mix-blend-multiply" />
             ) : (
               <div className="h-12 w-32 mb-2"></div>
             )}
             <p className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 border-t border-slate-200 pt-1 w-32 text-center">Authorized Signatory</p>
          </div>
        </div>

        <div className="mt-8 text-center text-[9px] text-slate-400">
          <p>This is a computer generated invoice and does not require a physical signature.</p>
        </div>
      </div>
    );
  }

  // --- MINIMAL TEMPLATE (Ultra-Clean Typography-Focused) ---
  if (template === 'minimal') {
    return (
      <div className="invoice-template bg-white text-slate-800 p-16 max-w-4xl mx-auto font-sans shadow-none" style={{ minHeight: '297mm', width: '210mm', fontSize: '11px', lineHeight: '1.6' }}>
        
        {/* Header: Company and Title */}
        <div className="flex justify-between items-baseline mb-16 px-2">
          <div>
            <h1 className="text-2xl font-bold text-black tracking-tight mb-2">{company.company_name}</h1>
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
            <div className="text-xl font-bold text-black tabular-nums">#{invoice.invoice_number}</div>
            <div className={`mt-2 text-[9px] font-bold uppercase tracking-widest text-slate-500`}>
              {invoice.status}
            </div>
          </div>
        </div>

        {/* Info Grid: Client and Metadata */}
        <div className="grid grid-cols-2 gap-20 mb-16 px-2">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">Billed To</p>
            <div className="space-y-1">
              <p className="font-bold text-black text-xs">{client.name}</p>
              <div className="text-slate-500 text-[10px] leading-relaxed">
                {!client.hide_contact_details && client.address && <p>{client.address}</p>}
                {!client.hide_contact_details && (client.city || client.state || client.postal_code) && (
                  <p>{[client.city, client.state, client.postal_code].filter(Boolean).join(', ')}</p>
                )}
                {client.gstin && <p className="mt-1 text-black font-medium">GSTIN: {client.gstin}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Issued</p>
              <p className="font-semibold text-black text-[10px]">{safelyFormatDate(invoice.issue_date, 'dd MMM yyyy', 'N/A')}</p>
            </div>
            {invoice.due_date && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Due Date</p>
                <p className="font-semibold text-black text-[10px]">{safelyFormatDate(invoice.due_date, 'dd MMM yyyy', 'N/A')}</p>
              </div>
            )}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Invoice Number</p>
              <p className="font-semibold text-black text-[10px]">{invoice.invoice_number}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Currency</p>
              <p className="font-semibold text-black text-[10px]">{invoice.currency}</p>
            </div>
          </div>
        </div>

        {/* Items Table: Subtle and spacing-focused */}
        <div className="mb-0 px-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                <th className="py-4 font-bold">Item</th>
                <th className="py-4 text-center w-20">Quantity</th>
                <th className="py-4 text-right w-28">Price</th>
                <th className="py-4 text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => (
                <tr key={index} className="avoid-break group">
                  <td className="py-6 pr-4">
                    <p className="font-bold text-black text-xs mb-0.5">{item.description}</p>
                    {item.product?.type && <p className="text-[9px] text-slate-400 uppercase tracking-tighter">{item.product.type}</p>}
                  </td>
                  <td className="py-6 text-center text-slate-500 tabular-nums">{item.quantity}</td>
                  <td className="py-6 text-right text-slate-500 tabular-nums">{currencySymbol}{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-6 text-right font-bold text-black tabular-nums">{currencySymbol}{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Row 1: Amount in Words (Full width at the top of footer) */}
        <div className="mb-10 px-2 pb-6 border-b border-slate-100">
           <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Amount in Words</p>
           <p className="text-xs font-bold text-black italic">{numberToWords(invoice.total_amount)}</p>
        </div>

        {/* Summary Row 2: Bank Details and Totals (HORIZONTALLY EQUAL) */}
        <div className="grid grid-cols-2 gap-12 px-2 mb-16 items-start">
          {/* Left: Bank Details */}
          <div>
            {company.bank_name && (
              <div className="space-y-1 text-[9px] text-slate-500 leading-relaxed p-5 bg-slate-50/50 rounded-sm border border-slate-100/50 h-full">
                <p className="font-black text-black uppercase tracking-widest mb-3 text-[8px]">Payment Details</p>
                <div className="space-y-2">
                  <p><span className="font-bold text-black uppercase text-[7px] w-16 inline-block tracking-tighter">Bank:</span> {company.bank_name}</p>
                  <p><span className="font-bold text-black uppercase text-[7px] w-16 inline-block tracking-tighter">A/C Name:</span> {company.account_holder_name}</p>
                  <p><span className="font-bold text-black uppercase text-[7px] w-16 inline-block tracking-tighter">A/C No:</span> <span className="font-bold text-black tracking-widest text-[9px]">{company.account_number}</span></p>
                  <p><span className="font-bold text-black uppercase text-[7px] w-16 inline-block tracking-tighter">IFSC Code:</span> <span className="font-bold text-black tracking-widest text-[9px]">{company.ifsc_code}</span></p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Totals Section */}
          <div className="space-y-3 font-medium bg-white p-2">
             <div className="flex justify-between text-[10px]">
              <span className="text-slate-400 font-bold uppercase tracking-widest">Subtotal</span>
              <span className="text-black tabular-nums font-bold">{currencySymbol}{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {invoice.tax_amount > 0 && (
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400 font-bold uppercase tracking-widest">Tax Amount (GST)</span>
                <span className="text-black tabular-nums font-bold">{currencySymbol}{invoice.tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {(invoice.discount_amount || 0) > 0 && (
              <div className="flex justify-between text-[10px] text-emerald-600">
                <span className="font-bold uppercase tracking-widest text-emerald-600/60 font-bold">Discount</span>
                <span className="tabular-nums font-bold">-{currencySymbol}{invoice.discount_amount!.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="mt-4 pt-5 border-t border-black">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-black">Total (In INR)</span>
                <span className="text-xl font-black text-black tabular-nums tracking-tighter">{currencySymbol}{invoice.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes and Terms: Side-by-side */}
        <div className="grid grid-cols-2 gap-12 px-2 mb-20 pb-4 border-b border-slate-50">
          <div>
            {invoice.notes && (
              <>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Notes</p>
                <p className="text-[10px] text-slate-500 leading-relaxed italic">{invoice.notes}</p>
              </>
            )}
          </div>
          <div>
            {invoice.terms && (
              <>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Terms & Conditions</p>
                <p className="text-[10px] text-slate-500 leading-relaxed italic whitespace-pre-wrap">{invoice.terms}</p>
              </>
            )}
          </div>
        </div>

        {/* Final Signatures Footer */}
        <div className="mt-auto px-2 pt-16 flex justify-between items-end">
          {/* Customer Side */}
          <div className="w-56 text-center">
            <div className="h-16 mb-2 flex items-center justify-center border-b border-dotted border-slate-200">
              <p className="text-[8px] text-slate-300 italic">Customer Signature & Seal</p>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Receiver Confirmation</p>
          </div>

          {/* Company Side */}
          <div className="w-56 text-center">
            {company.signature_url ? (
              <div className="h-16 mb-2 relative flex items-center justify-center">
                <img src={company.signature_url} alt="Signature" className="h-14 object-contain mix-blend-multiply" />
              </div>
            ) : (
              <div className="h-16 mb-2"></div>
            )}
            <div className="border-t border-black pt-2">
              <p className="text-[11px] font-bold text-black uppercase tracking-widest leading-tight">{company.company_name}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    );
  }





  // --- MODERN TEMPLATE (Tech/SaaS layout with cards and bold contrasts) ---
  if (template === 'modern') {
    return (
      <div className="invoice-template bg-slate-50 text-slate-800 p-4 md:p-8 max-w-4xl mx-auto" style={{ minHeight: '297mm', width: '210mm', fontSize: '13px', lineHeight: '1.5' }}>

        {/* Header Block */}
        <div className="bg-white rounded-3xl p-4 md:p-6 mb-8 shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-6">
              {company.logo_url ? (
                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center p-2 border border-slate-100 mt-1">
                  <img src={company.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl mt-1">
                  {company.company_name?.charAt(0) || 'C'}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{company.company_name}</h1>
                <p className="text-slate-500 mt-1">{company.email} • {company.phone}</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2 uppercase">
                TAX INVOICE
              </div>
              {company.state && <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{company.state}</p>}
              <div className="mb-4">
                <StatusBadge />
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="text-slate-400 font-medium text-xs">NO.</div>
                <div className="font-semibold">{invoice.invoice_number}</div>
                <div className="text-slate-400 font-medium text-xs">ISSUED</div>
                <div className="font-semibold">{safelyFormatDate(invoice.issue_date, 'dd MMM yyyy', 'N/A')}</div>
                {invoice.due_date && invoice.status?.toLowerCase() !== 'paid' && (
                  <>
                    <div className="text-slate-400 font-medium">Due:</div>
                    <div className="font-semibold">{safelyFormatDate(invoice.due_date, 'dd MMM yyyy', 'N/A')}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm">
            <h3 className="text-emerald-500 font-bold uppercase text-xs tracking-widest mb-4">Invoice To</h3>
            <div className="font-bold text-lg text-slate-900 mb-1">{client.name}</div>
            <div className="text-slate-500 text-sm">
              {!client.hide_contact_details && client.email && <p>{client.email}</p>}
              {!client.hide_contact_details && client.phone && <p>{client.phone}</p>}
              {!client.hide_contact_details && client.address && <p>{client.address}</p>}
              {!client.hide_contact_details && (client.city || client.state || client.postal_code) && (
                <p>{[client.city, client.state, client.postal_code].filter(Boolean).join(', ')}</p>
              )}
              {!client.hide_contact_details && client.gstin && <p className="mt-2 font-mono text-xs bg-slate-100 inline-block px-2 py-1 rounded">GSTIN: {client.gstin}</p>}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
            <h3 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2">Total Amount Due</h3>
            <div className="text-4xl font-black text-slate-900">{currencySymbol}{invoice.total_amount.toFixed(2)}</div>
          </div>
        </div>

        {/* Items Table Card */}
        <div className="bg-white rounded-3xl p-1 overflow-hidden shadow-sm border border-slate-200 mb-8">
          <table className="w-full">
            <thead className="bg-slate-50 rounded-t-2xl">
              <tr>
                <th className="py-4 px-6 text-left text-slate-500 font-bold text-sm">Description</th>
                <th className="py-4 px-4 text-center text-slate-500 font-bold text-sm rounded-lg min-w-[100px]">Qty</th>
                <th className="py-4 px-4 text-right text-slate-500 font-bold text-sm">Price</th>
                {hasDiscount && <th className="py-4 px-4 text-right text-slate-500 font-bold text-sm">Disc%</th>}
                {hasGST && <th className="py-4 px-4 text-right text-slate-500 font-bold text-sm">GST</th>}
                <th className="py-4 px-6 text-right text-slate-900 font-bold text-sm rounded-tr-2xl">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {items.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-5 px-6 font-medium">{item.description}</td>
                  <td className="py-5 px-4 text-center">
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <span className="bg-slate-100 px-3 py-1 rounded-lg text-slate-600 font-bold">{item.quantity}</span>
                    </div>
                  </td>
                  <td className="py-5 px-4 text-right text-slate-500">{currencySymbol}{item.rate.toFixed(2)}</td>
                  {hasDiscount && <td className="py-5 px-4 text-right text-slate-500">{item.discount || 0}%</td>}
                  {hasGST && <td className="py-5 px-4 text-right text-slate-500">{item.tax_rate}%</td>}
                  <td className="py-5 px-6 text-right font-bold text-slate-900">{currencySymbol}{item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Subtotal Area within table card */}
          <div className="bg-slate-50 p-4 md:p-6 border-t border-slate-100 flex justify-between items-start rounded-b-3xl gap-8">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Amount in Words</p>
              <p className="text-sm font-bold text-slate-900 italic leading-relaxed">{numberToWords(invoice.total_amount)}</p>
              {company.bank_name && (
                <div className="mt-6">
                  <h3 className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-3">Bank Details</h3>
                  <div className="text-slate-600 space-y-1 text-sm bg-white p-4 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-800">{company.bank_name}</p>
                    <p className="text-slate-500">A/C No: <span className="font-semibold text-slate-700">{company.account_number}</span></p>
                    <p className="text-slate-500">{company.account_holder_name} • IFSC: <span className="font-medium text-slate-700">{company.ifsc_code}</span></p>
                  </div>
                </div>
              )}
            </div>
            <div className="w-1/3 space-y-3 shrink-0">
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span className="font-semibold text-slate-700">{currencySymbol}{invoice.subtotal.toFixed(2)}</span></div>
              {(invoice.discount_amount || 0) > 0 ? <div className="flex justify-between text-emerald-500"><span>Discount</span><span className="font-semibold">-{currencySymbol}{invoice.discount_amount!.toFixed(2)}</span></div> : null}
              {invoice.tax_amount > 0 && <div className="flex justify-between text-slate-500"><span>Tax (GST)</span><span className="font-semibold text-slate-700">{currencySymbol}{invoice.tax_amount.toFixed(2)}</span></div>}
              <div className="pt-4 border-t-2 border-slate-200 flex justify-between items-center mt-2">
                <span className="text-base font-bold text-slate-900 tracking-wider uppercase">Total</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight">{currencySymbol}{invoice.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="grid grid-cols-2 gap-8 items-end">
          <div className="col-span-2 mt-8 pt-8 border-t border-slate-200">
            <div className="flex justify-between items-center px-8">
              <div className="text-center w-32">
                <div className="h-16 mb-2"></div>
                <div className="w-full border-t-2 border-slate-300 pt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Sign</div>
              </div>

              <div className="text-center w-40">
                {company.signature_url ? (
                  <img src={company.signature_url} alt="Signature" className="h-16 w-full object-contain mb-2 mix-blend-darken" />
                ) : (
                  <div className="h-16 mb-2"></div>
                )}
                <div className="w-full border-t-2 border-slate-300 pt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authorized Sign</div>
              </div>
            </div>
          </div>
        </div>

        {invoice.terms && (
          <div className="mt-8 pt-6 border-t border-slate-200 text-sm text-slate-500 flex gap-12">
            <div className="flex-1"><strong className="text-slate-700">Terms:</strong> {invoice.terms}</div>
          </div>
        )}
        {/* Thank you footer */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <p className="font-medium text-slate-600">Thank you for your business!</p>
          <p className="mt-1">This invoice was generated on {format(new Date(), 'dd MMM yyyy')} at {format(new Date(), 'HH:mm')}</p>
          {company.email && <p className="mt-1">For queries, contact {company.email}</p>}
        </div>
      </div>
    );
  }

  // --- CORPORATE TEMPLATE (Traditional, Formal, Grid-based) ---
  if (template === 'corporate') {
    return (
      <div className="invoice-template bg-white text-gray-900 p-4 md:p-8 max-w-4xl mx-auto font-serif" style={{ minHeight: '297mm', width: '210mm', fontSize: '14px', lineHeight: '1.5' }}>
        {/* Header Ribbon */}
        <div className="border-b-4 border-blue-900 pb-4 mb-6 flex justify-between items-start bg-white">
          <div className="flex items-start gap-6">
            {company.logo_url && <img src={company.logo_url} alt="Logo" className="h-16 object-contain mt-1" />}
            <div>
              <h1 className="text-2xl font-bold text-blue-900 uppercase tracking-wide">{company.company_name}</h1>
              {!company.hide_company_details && company.business_address && <p className="text-sm text-gray-600 mt-1">{company.business_address}</p>}
              {!company.hide_company_details && (company.city || company.state || company.pincode) && (
                <p className="text-sm text-gray-600">
                  {[company.city, company.state, company.pincode].filter(Boolean).join(', ')}
                </p>
              )}
              {!company.hide_company_details && (company.phone || company.email) && (
                <p className="text-sm text-gray-600">
                  {[company.phone, company.email].filter(Boolean).join(' | ')}
                </p>
              )}
              {!company.hide_company_details && company.gstin && <p className="text-sm font-bold mt-1">GSTIN: {company.gstin}</p>}
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
              <div className="font-bold text-base">{client.name}</div>
              {!client.hide_contact_details && client.address && <p className="text-gray-600">{client.address}</p>}
              {!client.hide_contact_details && (client.city || client.state || client.postal_code) && (
                <p className="text-gray-600 font-medium">
                  {[client.city, client.state, client.postal_code].filter(Boolean).join(', ')}
                </p>
              )}
              {!client.hide_contact_details && client.phone && <p className="text-gray-600">Ph: {client.phone}</p>}
              {!client.hide_contact_details && client.email && <p className="text-gray-600">{client.email}</p>}
              {!client.hide_contact_details && client.gstin && <p className="font-bold mt-2">GSTIN: {client.gstin}</p>}
            </div>
          </div>

          {/* Invoice details */}
          <div className="border border-gray-300 rounded overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 font-bold text-blue-900 uppercase text-xs tracking-wider">Invoice Details</div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-200">
                <tr><td className="py-2 px-4 font-semibold text-gray-600 bg-gray-50 bg-opacity-50">Invoice No.</td><td className="py-2 px-4 font-bold">{invoice.invoice_number}</td></tr>
                <tr><td className="py-2 px-4 font-semibold text-gray-600 bg-gray-50 bg-opacity-50">Issue Date</td><td className="py-2 px-4">{safelyFormatDate(invoice.issue_date, 'dd/MM/yyyy', 'N/A')}</td></tr>
                {invoice.due_date && invoice.status?.toLowerCase() !== 'paid' && <tr><td className="py-2 px-4 font-semibold text-gray-600 bg-gray-50 bg-opacity-50">Due Date</td><td className="py-2 px-4">{safelyFormatDate(invoice.due_date, 'dd/MM/yyyy', 'N/A')}</td></tr>}
                <tr><td className="py-2 px-4 font-semibold text-gray-600 bg-gray-50 bg-opacity-50">Currency</td><td className="py-2 px-4">{invoice.currency}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Main Table Wrapper */}
        <div className="mb-6 border-2 border-blue-900 rounded overflow-hidden bg-white">
          <table className="w-full">
            <thead className="bg-blue-900 text-white">
              <tr className="divide-x divide-blue-800">
                <th className="py-3 px-4 text-left font-semibold text-xs tracking-wider uppercase">S.No</th>
                <th className="py-3 px-4 text-left font-semibold text-xs tracking-wider uppercase text-center w-full min-w-[200px]">Description</th>
                <th className="py-3 px-4 text-center font-semibold text-xs tracking-wider uppercase min-w-[100px]">Qty</th>
                <th className="py-3 px-4 text-right font-semibold text-xs tracking-wider uppercase">Rate</th>
                {hasDiscount && <th className="py-3 px-4 text-right font-semibold text-xs tracking-wider uppercase">Disc%</th>}
                {hasGST && <th className="py-3 px-4 text-right font-semibold text-xs tracking-wider uppercase">GST%</th>}
                <th className="py-3 px-4 text-right font-semibold text-xs tracking-wider uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 bg-white text-sm">
              {items.map((item, index) => (
                <tr key={index} className="divide-x divide-gray-200">
                  <td className="py-3 px-4 text-center text-gray-500">{index + 1}</td>
                  <td className="py-3 px-4 font-medium">{item.description}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex flex-col gap-0.5 items-center justify-center">
                      <span className="font-bold">{item.quantity}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">{currencySymbol}{item.rate.toFixed(2)}</td>
                  {hasDiscount && <td className="py-3 px-4 text-right">{item.discount || 0}%</td>}
                  {hasGST && <td className="py-3 px-4 text-right">{item.tax_rate}%</td>}
                  <td className="py-3 px-4 text-right font-semibold">{currencySymbol}{item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>


          {/* Totals Section */}
          <div className="flex border-t-2 border-blue-900 bg-gray-50">
            <div className="w-1/2 border-r-2 border-blue-900">
              <div className="p-4 border-b border-gray-200">
                <p className="font-bold text-blue-900 text-xs uppercase tracking-wider mb-2">Amount in Words</p>
                <p className="text-gray-700 font-bold italic border-b border-dashed border-gray-400 pb-1">{numberToWords(invoice.total_amount)}</p>
              </div>
              {company.bank_name && (
                <div className="p-4 bg-white">
                  <h4 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-2">Bank Details</h4>
                  <div className="text-sm text-gray-600 grid grid-cols-[80px_1fr] gap-x-2 gap-y-1">
                    <span className="font-semibold text-gray-500">Bank:</span> <span className="text-gray-800 font-medium">{company.bank_name}</span>
                    <span className="font-semibold text-gray-500">A/C Name:</span> <span className="text-gray-800 font-medium">{company.account_holder_name}</span>
                    <span className="font-semibold text-gray-500">A/C No:</span> <span className="text-gray-800 font-medium">{company.account_number}</span>
                    <span className="font-semibold text-gray-500">IFSC:</span> <span className="text-gray-800 font-medium">{company.ifsc_code}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="w-1/2">
              <table className="w-full h-full text-sm">
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-2 px-4 font-semibold text-right w-2/3">Taxable Value</td>
                    <td className="py-2 px-4 text-right">{currencySymbol}{invoice.subtotal.toFixed(2)}</td>
                  </tr>
                  {(invoice.discount_amount || 0) > 0 ? (
                    <tr>
                      <td className="py-2 px-4 font-semibold text-right text-emerald-600">Discount</td>
                      <td className="py-2 px-4 text-right text-emerald-600">-{currencySymbol}{invoice.discount_amount.toFixed(2)}</td>
                    </tr>
                  ) : null}
                  {invoice.tax_amount > 0 && (
                    <tr>
                      <td className="py-2 px-4 font-semibold text-right">Total Tax Amount</td>
                      <td className="py-2 px-4 text-right">{currencySymbol}{invoice.tax_amount.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="bg-blue-100">
                    <td className="py-3 px-4 font-bold text-blue-900 text-right uppercase tracking-wider">Grand Total</td>
                    <td className="py-3 px-4 text-right font-bold text-blue-900 text-lg border-l-2 border-blue-900">{currencySymbol}{invoice.total_amount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="space-y-3">
          {invoice.terms && (
            <div className="grid grid-cols-1 gap-6 pt-4 border-t border-gray-200">
              {invoice.terms && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-widest">Terms &amp; Conditions</h4>
                  <p className="text-sm text-gray-600 leading-relaxed italic border-l-2 border-gray-200 pl-4">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}

          {/* Declaration */}
          <div className="pt-3 border-t border-gray-100">
            <div className="text-[10px] text-gray-500 italic">
              <p className="font-bold uppercase tracking-wider mb-1 not-italic text-gray-400">Declaration</p>
              <p>We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.</p>
            </div>
          </div>

          {/* Signatures and Seal Area */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center pt-2">
            {/* Customer Sign */}
            <div className="flex flex-col items-center border-2 border-gray-300 rounded p-3 relative pt-8 bg-white">
              <div className="absolute top-2 left-4 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Receiver's Acknowledgement</div>
              <div className="h-8 w-full"></div>
              <div className="border-t border-gray-800 w-full text-center pt-1 text-[10px] font-bold uppercase">
                Customer Sign
              </div>
            </div>

            <div className="flex justify-center items-center">
            </div>

            {/* Authorized Sign */}
            <div className="flex flex-col items-center border-2 border-blue-900 rounded p-3 relative pt-8 bg-white">
              <div className="absolute top-2 left-4 text-[9px] font-bold text-blue-900/60 uppercase tracking-wider">For {company.company_name}</div>
              {company.signature_url ? (
                <img src={company.signature_url} alt="Signature" className="h-8 object-contain mix-blend-multiply mb-1" />
              ) : (
                <div className="h-8 mb-1"></div>
              )}
              <div className="border-t-2 border-blue-900 w-full text-center pt-1 text-[10px] font-bold uppercase text-blue-900">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 mt-8 border-t border-gray-200 pt-3">
          <p className="font-medium text-gray-600">Thank you for your business!</p>
          <p className="mt-1">This invoice was generated on {format(new Date(), 'dd MMM yyyy')} at {format(new Date(), 'HH:mm')}</p>
          {company.email && <p className="mt-1">For queries, contact {company.email}</p>}
        </div>
      </div>
    );
  }

  // --- PROFESSIONAL TEMPLATE (Default Fallback - Retaining original layout) ---
  return (
    <div className="invoice-template bg-white text-black p-4 md:p-8 max-w-4xl mx-auto" style={{

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
                    {company.email && <span>📧 {company.email}</span>}
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
              {company.state && <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">{company.state}</p>}
            </div>
            <div className="text-lg mt-2">#{invoice.invoice_number}</div>
            <div className="mt-2">
              <StatusBadge />
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className={`font-bold text-lg ${styles.accentColor} mb-3`}>Bill To:</h3>
          <div className={`p-4 border-l-4 ${styles.borderColor} bg-gray-50`}>
            <div className="font-bold text-base mb-2">{client.name}</div>
            {!client.hide_contact_details && client.email && <div>📧 {client.email}</div>}
            {!client.hide_contact_details && client.phone && <div>📞 {client.phone}</div>}
            {!client.hide_contact_details && client.address && (
              <div className="mt-2">
                <div>{client.address}</div>
                {(client.city || client.state || client.postal_code) && (
                  <div>
                    {[client.city, client.state, client.postal_code].filter(Boolean).join(', ')}
                  </div>
                )}
                {client.country && <div>{client.country}</div>}
              </div>
            )}
            {!client.hide_contact_details && client.gstin && <div className="mt-2">GSTIN: {client.gstin}</div>}
          </div>
        </div>
        <div>
          <h3 className={`font-bold text-lg ${styles.accentColor} mb-3`}>Invoice Details:</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Issue Date:</span>
              <span>{safelyFormatDate(invoice.issue_date, 'dd MMM yyyy', 'N/A')}</span>
            </div>
            {invoice.due_date && invoice.status?.toLowerCase() !== 'paid' && (
              <div className="flex justify-between">
                <span className="font-medium">Due Date:</span>
                <span>{safelyFormatDate(invoice.due_date, 'dd MMM yyyy', 'N/A')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-medium">Currency:</span>
              <span>{invoice.currency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <h3 className={`font-bold text-lg ${styles.accentColor} mb-4`}>Items & Services:</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-3 text-left font-bold">Description</th>
              <th className="border border-gray-300 p-3 text-center font-bold w-20">Qty</th>
              <th className="border border-gray-300 p-3 text-right font-bold w-24">Rate</th>
              {hasDiscount && <th className="border border-gray-300 p-3 text-right font-bold w-20">Discount %</th>}
              {hasGST && <th className="border border-gray-300 p-3 text-right font-bold w-20">GST %</th>}
              <th className="border border-gray-300 p-3 text-right font-bold w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-25 avoid-break">
                <td className="border border-gray-300 p-3">{item.description}</td>
                <td className="border border-gray-300 p-3 text-center">{item.quantity}</td>
                <td className="border border-gray-300 p-3 text-right">{currencySymbol}{item.rate.toFixed(2)}</td>
                {hasDiscount && <td className="border border-gray-300 p-3 text-right">{item.discount || 0}%</td>}
                {hasGST && <td className="border border-gray-300 p-3 text-right">{item.tax_rate}%</td>}
                <td className="border border-gray-300 p-3 text-right font-medium">{currencySymbol}{item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bank Details and Totals Section */}
      <div className="flex justify-between items-start mb-8 gap-8 avoid-break">
        {/* Bank Details - Hidden if paid */}
        <div className="flex-1">
          {company.bank_name && (
            <div>
              <h3 className={`font-bold text-lg ${styles.accentColor} mb-3`}>Bank Transfer Details:</h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <div className="text-gray-600 text-xs uppercase tracking-wider mb-1">Bank Name</div>
                  <div className="font-semibold text-xs">{company.bank_name}</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs uppercase tracking-wider mb-1">Account Holder</div>
                  <div className="font-semibold text-xs">{company.account_holder_name || company.company_name}</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs uppercase tracking-wider mb-1">Account Number</div>
                  <div className="font-semibold text-xs">{company.account_number}</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs uppercase tracking-wider mb-1">IFSC Code</div>
                  <div className="font-semibold text-xs">{company.ifsc_code}</div>
                </div>
                {company.account_type && (
                  <div>
                    <div className="text-gray-600 text-xs uppercase tracking-wider mb-1">Account Type</div>
                    <div className="font-semibold text-xs">{company.account_type}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="w-80 avoid-break">
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{currencySymbol}{invoice.subtotal.toFixed(2)}</span>
            </div>
            {(invoice.discount_amount || 0) > 0 ? (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-{currencySymbol}{invoice.discount_amount.toFixed(2)}</span>
              </div>
            ) : null}
            {invoice.tax_amount > 0 && (
              <div className="flex justify-between">
                <span>Total Tax (GST):</span>
                <span>{currencySymbol}{invoice.tax_amount.toFixed(2)}</span>
              </div>
            )}
            <hr className="border-gray-300" />
            <div className={`flex justify-between text-lg font-bold ${styles.accentColor}`}>
              <span>Total Amount:</span>
              <span>{currencySymbol}{invoice.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes and Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 avoid-break">
        <div className="md:col-span-2">
          <h3 className={`font-bold ${styles.accentColor} mb-2`}>Amount in Words:</h3>
          <div className="p-3 bg-gray-50 rounded border-l-4 border-blue-400 font-bold italic text-slate-700">
            {numberToWords(invoice.total_amount)}
          </div>
        </div>
        {invoice.notes && (
          <div>
            <h3 className={`font-bold ${styles.accentColor} mb-2`}>Notes:</h3>
            <div className="p-3 bg-gray-50 rounded border-l-4 border-blue-400">
              {invoice.notes}
            </div>
          </div>
        )}
        {invoice.terms && (
          <div>
            <h3 className={`font-bold ${styles.accentColor} mb-2`}>Terms &amp; Conditions:</h3>
            <div className="p-3 bg-gray-50 rounded border-l-4 border-blue-400">
              {invoice.terms}
            </div>
          </div>
        )}
      </div>


      {/* Stamp/Signature Area */}
      <div className="flex justify-between items-center mt-12 px-6 avoid-break">
        {/* Customer Signature */}
        <div className="text-center w-40">
          <div className="h-16 mb-2"></div>
          <div className="border-t border-gray-400 pt-2 text-center w-full">
            <span className="text-sm text-gray-600">Customer Signature</span>
          </div>
        </div>

        {/* Authorized Signature */}
        <div className="text-center w-48 flex flex-col items-center">
          {company.signature_url ? (
            <div className="mb-2 h-16 flex items-center justify-center w-full">
              <img
                src={company.signature_url}
                alt="Authorized Signature"
                className="max-h-16 max-w-full object-contain mix-blend-multiply"
              />
            </div>
          ) : (
            <div className="h-16 mb-2"></div>
          )}
          <div className="border-t border-gray-400 w-full pt-2">
            <span className="text-sm text-gray-600">Authorized Signature</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t-2 border-gray-200">
        <div className="text-center text-gray-600">
          <p className="font-medium">Thank you for your business!</p>
          <p className="text-sm mt-1">
            This invoice was generated on {format(new Date(), 'dd MMM yyyy')} at {format(new Date(), 'HH:mm')}
          </p>
          {company.email && (
            <p className="text-sm mt-1">
              For any queries, please contact us at {company.email}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

