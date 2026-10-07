import React from 'react';
import { safelyFormatDate } from '@/utils/dateUtils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { numberToWords } from '@/utils/numberUtils';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Building2, User, Phone, Mail, MapPin, ShieldCheck, FileCheck, PackageCheck, AlertCircle } from 'lucide-react';

export type PurchaseTemplateId = 'classic-blue' | 'commercial-erp' | 'standard' | 'tax-itc' | 'grn';

export interface PurchaseItem {
  description: string;
  name?: string;
  product_name?: string;
  quantity: number;
  rate: number;
  tax_rate: number;
  discount?: number;
  amount: number;
  hsn_code?: string;
  product?: {
    name?: string;
    opening_stock?: string | number;
    type?: string;
    unit?: string;
    hsn_code?: string;
  };
  products?: {
    id?: string;
    name?: string;
    opening_stock?: string | number;
    type?: string;
    unit?: string;
    hsn_code?: string;
  };
}

const getItemDisplayName = (item: PurchaseItem): string => {
  return (
    item.product_name?.trim() ||
    item.product?.name?.trim() ||
    item.products?.name?.trim() ||
    item.name?.trim() ||
    item.description?.trim() ||
    'Item'
  );
};

const getItemDescription = (item: PurchaseItem, maxChars = 100): string | null => {
  const name = getItemDisplayName(item).toLowerCase();
  const rawDesc = (item.description || '').trim();
  if (!rawDesc || rawDesc.toLowerCase() === name) return null;
  if (rawDesc.length > maxChars) {
    return rawDesc.slice(0, maxChars).trim() + '...';
  }
  return rawDesc;
};

const getItemHSN = (item: PurchaseItem): string => {
  return (item.hsn_code || item.product?.hsn_code || item.products?.hsn_code || '').trim() || '-';
};

export interface VendorDetails {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  gstin?: string;
}

export interface CompanyDetails {
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
}

export interface PurchaseInvoiceData {
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

interface PurchaseBillTemplateProps {
  invoice: PurchaseInvoiceData;
  vendor: VendorDetails;
  company: CompanyDetails;
  items: PurchaseItem[];
  template?: PurchaseTemplateId;
  currencySymbol?: string;
}

export const PurchaseBillTemplate: React.FC<PurchaseBillTemplateProps> = ({
  invoice,
  vendor,
  company,
  items,
  template = 'standard',
  currencySymbol: overrideCurrencySymbol,
}) => {
  const { currencySymbol: globalCurrencySymbol } = useCurrency();
  const currencySymbol = overrideCurrencySymbol || (invoice.currency === 'USD' ? '$' : (invoice.currency === 'EUR' ? '€' : (invoice.currency === 'GBP' ? '£' : globalCurrencySymbol || '₹')));

  const subtotal = invoice.subtotal || items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const discountAmount = invoice.discount_amount || 0;
  const taxAmount = invoice.tax_amount || 0;
  const totalAmount = invoice.total_amount || (subtotal - discountAmount + taxAmount);

  // Determine Inter-state vs Intra-state tax split
  const isInterstate = vendor.state && company.state && vendor.state.trim().toLowerCase() !== company.state.trim().toLowerCase();
  const cgstAmount = isInterstate ? 0 : taxAmount / 2;
  const sgstAmount = isInterstate ? 0 : taxAmount / 2;
  const igstAmount = isInterstate ? taxAmount : 0;

  const isPaid = invoice.status === 'paid';

  // --------------------------------------------------------------------------
  // TEMPLATE: CLASSIC CORPORATE PROCUREMENT (Matching Reference Image 1)
  // --------------------------------------------------------------------------
  if (template === 'classic-blue') {
    return (
      <div className="w-full bg-white text-slate-900 p-8 sm:p-12 font-sans max-w-4xl mx-auto border border-slate-300 shadow-sm print:p-0 print:border-none">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div className="text-left space-y-0.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{vendor.name || "[Company / Vendor Name]"}</h2>
            <p className="text-xs text-slate-600">{vendor.address || "[Street Address]"}</p>
            <p className="text-xs text-slate-600">
              {[vendor.city, vendor.state, vendor.postal_code].filter(Boolean).join(", ") || "[City, ST ZIP]"}
            </p>
            {vendor.phone && <p className="text-xs text-slate-600">Phone: {vendor.phone}</p>}
            {vendor.email && <p className="text-xs text-slate-600">Email: {vendor.email}</p>}
            {vendor.gstin && <p className="text-xs font-mono font-semibold text-slate-800">GSTIN / Tax ID: {vendor.gstin}</p>}
          </div>

          <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
            <h1 className="text-3xl sm:text-4xl font-black text-[#335c8d] tracking-wider mb-2">INVOICE</h1>
            <table className="border-collapse border border-slate-700 text-xs w-full sm:w-48 text-center">
              <tbody>
                <tr className="border-b border-slate-700">
                  <td className="bg-slate-100 font-bold py-1 px-2 border-r border-slate-700 w-1/2 uppercase text-[10px] text-slate-700">DATE</td>
                  <td className="py-1 px-2 font-semibold text-slate-900">{safelyFormatDate(invoice.issue_date)}</td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="bg-slate-100 font-bold py-1 px-2 border-r border-slate-700 uppercase text-[10px] text-slate-700">INVOICE #</td>
                  <td className="py-1 px-2 font-mono font-bold text-slate-900">{invoice.invoice_number}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold py-1 px-2 border-r border-slate-700 uppercase text-[10px] text-slate-700">CUSTOMER ID</td>
                  <td className="py-1 px-2 font-mono text-slate-800">{company.gstin ? company.gstin.slice(0, 10) : "CUST-101"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* BILL TO & SHIP TO Blue Banners */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 text-xs">
          <div>
            <div className="bg-[#334f7a] text-white font-bold px-3 py-1 text-xs uppercase tracking-wider mb-1.5">
              BILL TO:
            </div>
            <div className="px-1 text-slate-800 space-y-0.5">
              <p className="font-bold text-sm text-slate-900">{company.company_name || "[Purchaser Company Name]"}</p>
              <p>{company.business_address || "[Street Address]"}</p>
              <p>{[company.city, company.state, company.pincode].filter(Boolean).join(", ") || "[City, ST ZIP]"}</p>
              {(company.phone || company.mobile) && <p>Phone: {company.phone || company.mobile}</p>}
              {company.gstin && <p className="font-mono text-[11px] font-semibold text-slate-700">GSTIN: {company.gstin}</p>}
            </div>
          </div>

          <div>
            <div className="bg-[#334f7a] text-white font-bold px-3 py-1 text-xs uppercase tracking-wider mb-1.5">
              SHIP TO:
            </div>
            <div className="px-1 text-slate-800 space-y-0.5">
              <p className="font-bold text-sm text-slate-900">{company.company_name || "[Company Name]"}</p>
              <p className="text-slate-600 font-medium">Warehouse & Goods Receiving Bay</p>
              <p>{company.business_address || "[Street Address]"}</p>
              <p>{[company.city, company.state, company.pincode].filter(Boolean).join(", ") || "[City, ST ZIP]"}</p>
              {(company.phone || company.mobile) && <p>Phone: {company.phone || company.mobile}</p>}
            </div>
          </div>
        </div>

        {/* Logistics Strip */}
        <div className="mb-6 border border-slate-700 text-xs overflow-x-auto">
          <div className="grid grid-cols-6 min-w-[500px] bg-[#334f7a] text-white font-bold text-[10px] text-center uppercase tracking-wider divide-x divide-slate-600 py-1">
            <div>SALESPERSON</div>
            <div>P.O. #</div>
            <div>SHIP DATE</div>
            <div>SHIP VIA</div>
            <div>F.O.B.</div>
            <div>TERMS</div>
          </div>
          <div className="grid grid-cols-6 min-w-[500px] text-center text-[11px] divide-x divide-slate-400 py-1.5 bg-white font-medium text-slate-800 border-t border-slate-700">
            <div>{vendor.name ? vendor.name.split(' ')[0] : "Direct"}</div>
            <div className="font-mono font-bold">{invoice.invoice_number}</div>
            <div>{safelyFormatDate(invoice.issue_date)}</div>
            <div>Road Cargo</div>
            <div>Destination</div>
            <div>{invoice.due_date ? `Due ${safelyFormatDate(invoice.due_date)}` : "Net 30"}</div>
          </div>
        </div>

        {/* Item Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse border border-slate-700 text-xs">
            <thead>
              <tr className="bg-[#334f7a] text-white text-[11px] uppercase font-bold text-center">
                <th className="border border-slate-700 py-1.5 px-2 w-28">ITEM #</th>
                <th className="border border-slate-700 py-1.5 px-3 text-left">DESCRIPTION</th>
                <th className="border border-slate-700 py-1.5 px-2 w-16">QTY</th>
                <th className="border border-slate-700 py-1.5 px-2 w-28 text-right">UNIT PRICE</th>
                <th className="border border-slate-700 py-1.5 px-3 w-32 text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const name = getItemDisplayName(item);
                const desc = getItemDescription(item, 80);
                const hsn = getItemHSN(item);
                return (
                  <tr key={idx} className="border-b border-slate-300">
                    <td className="border-r border-slate-700 py-2 px-2 text-center font-mono text-slate-600">{hsn}</td>
                    <td className="border-r border-slate-700 py-2 px-3 font-medium text-slate-900">
                      <div className="font-bold">{name}</div>
                      {desc && <div className="text-[10px] text-slate-500 font-normal mt-0.5 line-clamp-2 max-w-xs">{desc}</div>}
                    </td>
                    <td className="border-r border-slate-700 py-2 px-2 text-center font-bold text-slate-900">{item.quantity}</td>
                    <td className="border-r border-slate-700 py-2 px-2 text-right font-mono text-slate-800">
                      {currencySymbol}{item.rate.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {currencySymbol}{item.amount.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {/* Padding empty rows matching the Vertex42 template look */}
              {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-slate-300 h-6">
                  <td className="border-r border-slate-700 text-center text-slate-300 text-[10px]">-</td>
                  <td className="border-r border-slate-700"></td>
                  <td className="border-r border-slate-700"></td>
                  <td className="border-r border-slate-700"></td>
                  <td className="text-center text-slate-300 text-[10px]">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Section: Special Instructions & Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-xs">
          <div className="border border-slate-400">
            <div className="bg-slate-200 text-slate-800 font-bold px-3 py-1.5 text-[11px] border-b border-slate-400">
              Other Comments or Special Instructions
            </div>
            <div className="p-3 text-slate-700 space-y-1.5 text-[11px] leading-relaxed min-h-[90px]">
              <p>1. Total payment due in 30 days or as per agreed purchase terms.</p>
              <p>2. Please include the purchase bill number on all payment remittances.</p>
              <p>3. Goods received in good condition and stock updated in system.</p>
              {invoice.notes && <p className="pt-1 font-semibold text-slate-900">Notes: {invoice.notes}</p>}
            </div>
          </div>

          <div className="border border-slate-700 text-xs ml-auto w-full max-w-xs">
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-slate-400">
                  <td className="py-1.5 px-3 font-bold text-slate-700 uppercase text-[10px]">SUBTOTAL</td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">{currencySymbol}{subtotal.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-400">
                  <td className="py-1.5 px-3 font-bold text-slate-700 uppercase text-[10px]">TAX RATE</td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-700">{subtotal > 0 ? ((taxAmount / subtotal) * 100).toFixed(2) : '0.00'}%</td>
                </tr>
                <tr className="border-b border-slate-400">
                  <td className="py-1.5 px-3 font-bold text-slate-700 uppercase text-[10px]">TAX</td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-700">{currencySymbol}{taxAmount.toFixed(2)}</td>
                </tr>
                {discountAmount > 0 && (
                  <tr className="border-b border-slate-400">
                    <td className="py-1.5 px-3 font-bold text-emerald-700 uppercase text-[10px]">DISCOUNT</td>
                    <td className="py-1.5 px-3 text-right font-mono text-emerald-700">-{currencySymbol}{discountAmount.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="bg-[#b0c4de] text-slate-950 font-black">
                  <td className="py-2 px-3 uppercase text-xs tracking-wider font-extrabold">TOTAL</td>
                  <td className="py-2 px-3 text-right font-mono font-black text-sm">{currencySymbol}{totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs space-y-1 text-slate-600">
          <p className="font-bold text-slate-800">
            Make all checks / remittances payable to <span className="underline font-black">{vendor.name || "[Vendor Company Name]"}</span>
          </p>
          <p className="text-[11px] text-slate-500">
            If you have any questions about this purchase bill, please contact [{vendor.name}, {vendor.phone || vendor.email || "Accounts Office"}]
          </p>
          <p className="font-serif italic font-bold text-[#335c8d] text-base pt-1">
            Thank You For Your Business!
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // TEMPLATE: COMMERCIAL ERP PURCHASE INVOICE (Matching Reference Image 2)
  // --------------------------------------------------------------------------
  if (template === 'commercial-erp') {
    return (
      <div className="w-full bg-white text-slate-900 p-6 sm:p-10 font-sans max-w-4xl mx-auto border-2 border-slate-400 shadow-sm print:p-0 print:border-none">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black italic text-blue-900 tracking-tight">
              {vendor.name || "Supplier Company Name"}
            </h1>
            {/* Yellow Address Box (exact replica of Reference Image 2) */}
            <div className="bg-[#ffff80] border border-slate-400 p-2 text-xs font-serif text-slate-900 mt-2 space-y-0.5 w-64">
              <p>{vendor.address || "Supplier Business Address"}</p>
              <p>{[vendor.city, vendor.state, vendor.postal_code].filter(Boolean).join(", ") || "City, State, ZIP"}</p>
              <p>Tel: {vendor.phone || "+91 00000 00000"}</p>
              <p>Vat / GST Reg No: {vendor.gstin || "URP-NOT-REGISTERED"}</p>
            </div>
          </div>

          <div className="flex flex-col items-end w-full sm:w-auto">
            <div className="border border-slate-700 px-3 py-1 text-xs mb-3 text-right">
              <span className="font-bold text-slate-700 mr-2">Tax Invoice No:</span>
              <span className="font-mono font-bold text-slate-900">{invoice.invoice_number}</span>
            </div>
            {/* Dark Purple / Navy Header Banner */}
            <div className="bg-[#2d224d] text-white font-black text-xl sm:text-2xl px-6 py-2 tracking-widest uppercase text-center w-full sm:w-72 shadow-sm">
              PURCHASE INVOICE
            </div>
          </div>
        </div>

        {/* Customer / Consignee Block and Misc Table */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
          {/* Customer / Purchaser Container */}
          <div className="sm:col-span-2 bg-[#2d224d] text-white p-4 text-xs space-y-1 shadow-sm">
            <div className="bg-[#1e1735] px-2 py-1 font-black uppercase tracking-wider text-[11px] text-amber-300 inline-block mb-1">
              Customer / Consignee
            </div>
            <p className="font-bold text-sm text-white">{company.company_name || "Purchaser Company Name"}</p>
            <p className="text-slate-200">Address: {company.business_address || "Company Office Address"}</p>
            <div className="flex gap-4 text-slate-200">
              <p>City: {company.city || "—"}</p>
              <p>Country / State: {company.state || "India"}</p>
              <p>Code: {company.pincode || "—"}</p>
            </div>
            <p className="text-slate-200 font-mono">Vat Reg / GSTIN: <span className="font-bold text-emerald-300">{company.gstin || "—"}</span></p>
            <p className="text-slate-300 text-[10px]">Vat Import Number: TIN 9988776655</p>
          </div>

          {/* Misc Box */}
          <div className="border border-slate-600 text-xs">
            <div className="bg-slate-200 border-b border-slate-600 px-2 py-1 font-bold text-slate-800 text-center uppercase text-[10px]">
              Misc Details
            </div>
            <div className="p-2 space-y-1 text-slate-800">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Date:</span>
                <span className="font-bold">{safelyFormatDate(invoice.issue_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Order No:</span>
                <span className="font-mono font-bold">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Rep:</span>
                <span>Procurement</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">FOB:</span>
                <span>Destination</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lined Grid Table */}
        <div className="border border-slate-700 mb-4 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-700 text-slate-900 font-bold uppercase text-[11px]">
                <th className="border-r border-slate-700 py-1.5 px-3 w-20 text-center">PCS</th>
                <th className="border-r border-slate-700 py-1.5 px-3 text-left">Description</th>
                <th className="border-r border-slate-700 py-1.5 px-3 w-28 text-right">Unit Price</th>
                <th className="py-1.5 px-3 w-32 text-right">Total Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const name = getItemDisplayName(item);
                const desc = getItemDescription(item, 80);
                const hsn = getItemHSN(item);
                return (
                  <tr key={idx} className="border-b border-slate-300">
                    <td className="border-r border-slate-700 py-2 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                    <td className="border-r border-slate-700 py-2 px-3 font-medium text-slate-900">
                      <div className="font-bold">{name}</div>
                      {desc && <div className="text-[10px] text-slate-500 font-normal mt-0.5 line-clamp-2 max-w-xs">{desc}</div>}
                      {hsn !== '-' && <div className="font-mono text-[10px] text-slate-500 mt-0.5">HSN: {hsn}</div>}
                    </td>
                    <td className="border-r border-slate-700 py-2 px-3 text-right font-mono text-slate-800">
                      {currencySymbol}{item.rate.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {currencySymbol}{item.amount.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {/* Lined empty rows replicating Image 2 layout */}
              {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                <tr key={`erp-empty-${i}`} className="border-b border-slate-200 h-6">
                  <td className="border-r border-slate-700"></td>
                  <td className="border-r border-slate-700"></td>
                  <td className="border-r border-slate-700"></td>
                  <td></td>
                </tr>
              ))}
              {/* Bank Details Strip inside the invoice grid */}
              <tr className="border-t-2 border-slate-700 bg-slate-50">
                <td colSpan={2} className="py-2 px-3 border-r border-slate-700 text-xs font-semibold text-slate-700">
                  <span className="font-black text-blue-900 uppercase underline mr-2">BANK DETAILS:</span>
                  Direct Bank Wire / NEFT / Cheque in favor of <strong className="text-slate-900">{vendor.name}</strong>
                </td>
                <td className="py-2 px-3 border-r border-slate-700 text-right font-bold text-slate-600 uppercase text-[10px]">
                  SubTotal:
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                  {currencySymbol}{subtotal.toFixed(2)}
                </td>
              </tr>
              <tr className="border-t border-slate-300">
                <td colSpan={2} className="border-r border-slate-700"></td>
                <td className="py-1 px-3 border-r border-slate-700 text-right font-bold text-slate-600 uppercase text-[10px]">
                  Shipping / S&H:
                </td>
                <td className="py-1 px-3 text-right font-mono text-slate-700">
                  {currencySymbol}0.00
                </td>
              </tr>
              <tr className="border-t border-slate-300">
                <td colSpan={2} className="border-r border-slate-700"></td>
                <td className="py-1 px-3 border-r border-slate-700 text-right font-bold text-slate-600 uppercase text-[10px]">
                  Tax Rate(s):
                </td>
                <td className="py-1 px-3 text-right font-mono text-slate-700">
                  {currencySymbol}{taxAmount.toFixed(2)}
                </td>
              </tr>
              {/* High Contrast TOTAL Black Bar */}
              <tr className="border-t-2 border-slate-900 bg-black text-white">
                <td colSpan={2} className="py-2 px-3 border-r border-slate-700 font-bold uppercase tracking-wider text-xs">
                  PAYMENT: {isPaid ? "PAID & SETTLED" : "PAYMENT DUE"}
                </td>
                <td className="py-2 px-3 border-r border-slate-700 text-right font-black uppercase text-xs tracking-wider">
                  TOTAL
                </td>
                <td className="py-2 px-3 text-right font-mono font-black text-base">
                  {currencySymbol} {totalAmount.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Verification & Comments */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-3">
          <div className="border border-slate-400 p-2.5 space-y-1">
            <span className="font-bold text-slate-700 uppercase text-[10px] block">Comments & Instructions:</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Inward consignment received in full. Verified with store inward stock ledger.
            </p>
            {invoice.notes && <p className="font-medium text-slate-900">Note: {invoice.notes}</p>}
          </div>

          <div className="border-2 border-dashed border-slate-400 p-2.5 text-center flex flex-col justify-between">
            <span className="font-bold text-slate-500 uppercase text-[10px]">Office Use Only / Stock Verification</span>
            <div className="my-2 border-b border-slate-300"></div>
            <div className="flex justify-between text-[10px] text-slate-600 font-semibold px-2">
              <span>Stock Status: Stocked In</span>
              <span>Authorized Signature</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // TEMPLATE 1: STANDARD PROCUREMENT VOUCHER
  // --------------------------------------------------------------------------
  if (template === 'standard') {
    return (
      <div className="w-full bg-white text-slate-900 p-6 md:p-10 font-sans max-w-4xl mx-auto shadow-sm">
        {/* Top Procurement Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-slate-900 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md">
              PB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Purchase Bill</h1>
                <Badge variant={isPaid ? "default" : "outline"} className={isPaid ? "bg-emerald-600 hover:bg-emerald-600 text-white font-bold" : "text-amber-700 border-amber-400 bg-amber-50 font-bold"}>
                  {isPaid ? "PAID & SETTLED" : "PAYMENT PENDING"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                Official Inward Procurement Voucher • 100% Tax Deductible
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 sm:border-none sm:p-0 sm:bg-transparent">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bill Reference</p>
            <p className="text-xl font-black text-slate-900">{invoice.invoice_number}</p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              Date: <span className="font-bold text-slate-900">{safelyFormatDate(invoice.issue_date)}</span>
            </p>
            {invoice.due_date && (
              <p className="text-xs font-semibold text-slate-600">
                Payment Due: <span className="font-bold text-rose-600">{safelyFormatDate(invoice.due_date)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Parties Grid: Supplier (Vendor) on Left, Purchaser (Our Company) on Right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 p-4 rounded-2xl bg-slate-50/80 border border-slate-200">
          {/* Supplier Info */}
          <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-4">
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
              <Building2 className="w-3.5 h-3.5 text-slate-700" />
              <span>Supplier / Vendor (Billed By)</span>
            </div>
            <p className="text-base font-black text-slate-900">{vendor.name || "Vendor Name"}</p>
            {vendor.address && <p className="text-xs text-slate-600 leading-relaxed">{vendor.address}</p>}
            {(vendor.city || vendor.state || vendor.postal_code) && (
              <p className="text-xs text-slate-600">
                {[vendor.city, vendor.state, vendor.postal_code].filter(Boolean).join(", ")}
              </p>
            )}
            {vendor.gstin && (
              <p className="text-xs font-mono font-bold text-slate-800 pt-0.5">
                GSTIN: <span className="text-indigo-700 font-extrabold">{vendor.gstin}</span>
              </p>
            )}
            {vendor.phone && (
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> {vendor.phone}
              </p>
            )}
            {vendor.email && (
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" /> {vendor.email}
              </p>
            )}
          </div>

          {/* Consignee / Purchaser Info */}
          <div className="space-y-1.5 md:pl-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
              <User className="w-3.5 h-3.5 text-slate-700" />
              <span>Purchaser / Consignee (Received By)</span>
            </div>
            <p className="text-base font-black text-slate-900">{company.company_name || "Our Company"}</p>
            {company.business_address && <p className="text-xs text-slate-600 leading-relaxed">{company.business_address}</p>}
            {(company.city || company.state || company.pincode) && (
              <p className="text-xs text-slate-600">
                {[company.city, company.state, company.pincode].filter(Boolean).join(", ")}
              </p>
            )}
            {company.gstin && (
              <p className="text-xs font-mono font-bold text-slate-800 pt-0.5">
                GSTIN: <span className="text-emerald-700 font-extrabold">{company.gstin}</span>
              </p>
            )}
            {(company.phone || company.mobile) && (
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> {company.phone || company.mobile}
              </p>
            )}
            {company.email && (
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" /> {company.email}
              </p>
            )}
          </div>
        </div>

        {/* Inward Items Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 my-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3">Item Description</th>
                <th className="py-3 px-3 text-center">HSN</th>
                <th className="py-3 px-3 text-center">Qty / Unit</th>
                <th className="py-3 px-3 text-right">Unit Price</th>
                <th className="py-3 px-3 text-center">GST %</th>
                <th className="py-3 px-3 text-right">Tax Amt</th>
                <th className="py-3 px-3 text-right font-black">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => {
                const itemSubtotal = item.quantity * item.rate;
                const itemDiscount = (itemSubtotal * (item.discount || 0)) / 100;
                const itemTax = ((itemSubtotal - itemDiscount) * (item.tax_rate || 0)) / 100;
                return (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div className="font-bold">{getItemDisplayName(item)}</div>
                      {getItemDescription(item, 90) && (
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5 line-clamp-2 max-w-xs">{getItemDescription(item, 90)}</div>
                      )}
                      {item.product?.type && (
                        <span className="text-[10px] text-slate-400 capitalize">{item.product.type}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">{getItemHSN(item)}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      {item.quantity} {item.product?.unit || "pcs"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-800">
                      {currencySymbol}{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-700">
                      {item.tax_rate || 0}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {currencySymbol}{itemTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {currencySymbol}{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financials & Verification Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
          {/* Inward Verification Box & Amount In Words */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-extrabold uppercase text-slate-700 text-[11px]">
                <PackageCheck className="w-4 h-4 text-emerald-600" />
                <span>Goods Inward & Quality Verification</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                All goods/materials listed above have been physically inspected, counted, and added to the inward inventory stock.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 font-semibold text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Inward Date</span>
                  <span>{safelyFormatDate(invoice.issue_date)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Inspection Status</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Approved & Stocked
                  </span>
                </div>
              </div>
            </div>

            {/* Amount in words */}
            <div className="text-xs text-slate-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/50">
              <span className="font-extrabold uppercase tracking-wider text-slate-500 text-[10px] block mb-0.5">Amount in Words</span>
              <p className="font-bold text-slate-900 capitalize italic">
                {numberToWords(Math.round(totalAmount))} Only
              </p>
            </div>

            {invoice.notes && (
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-500 uppercase text-[10px] block">Procurement Notes:</span>
                <p className="mt-0.5 whitespace-pre-line text-slate-800">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Totals Summary */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span>Subtotal (Inward Value):</span>
              <span className="font-mono font-bold text-white">{currencySymbol}{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-emerald-400 font-medium">
                <span>Vendor Discount:</span>
                <span className="font-mono font-bold">-{currencySymbol}{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span>Inward GST (ITC Eligible):</span>
              <span className="font-mono font-bold text-white">{currencySymbol}{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
              <div>
                <p className="text-xs uppercase font-black tracking-wider text-emerald-400">Total Purchase Payable</p>
                <p className="text-[10px] text-slate-400">Tax Included</p>
              </div>
              <p className="text-2xl font-black font-mono text-white">
                {currencySymbol}{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% ITC Claimable
              </span>
              <span>SAC: 998313 / HSN</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
          <div>
            <div className="h-12 border-b border-dashed border-slate-300 mb-2"></div>
            <p className="font-bold text-slate-800">Received & Verified By</p>
            <p className="text-[10px] text-slate-400">Warehouse / Store Manager</p>
          </div>
          <div>
            <div className="h-12 border-b border-dashed border-slate-300 mb-2 flex items-center justify-center">
              {company.signature_url && (
                <img src={company.signature_url} alt="Signature" className="max-h-12 object-contain" />
              )}
            </div>
            <p className="font-bold text-slate-800">Authorized Signatory</p>
            <p className="text-[10px] text-slate-400">{company.company_name}</p>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // TEMPLATE 2: GST INPUT TAX CREDIT (ITC) AUDIT VOUCHER
  // --------------------------------------------------------------------------
  if (template === 'tax-itc') {
    return (
      <div className="w-full bg-white text-slate-900 p-6 md:p-10 font-sans max-w-4xl mx-auto border-2 border-emerald-600 shadow-sm">
        {/* Header with ITC Compliance Header */}
        <div className="bg-emerald-700 text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-9 h-9 text-emerald-200" />
            <div>
              <h1 className="text-xl font-black uppercase tracking-wide">GST Inward Tax Invoice / ITC Voucher</h1>
              <p className="text-xs text-emerald-100 font-medium">Prepared in accordance with Section 16 of CGST Act, 2017</p>
            </div>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-200 block">Voucher No</span>
            <span className="text-base font-mono font-black">{invoice.invoice_number}</span>
          </div>
        </div>

        {/* GSTIN Match Grid */}
        <div className="grid grid-cols-2 gap-4 my-4 p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs">
          <div>
            <span className="font-extrabold uppercase text-[10px] text-emerald-800 block">Supplier GSTIN (Tax Counterparty)</span>
            <p className="font-mono text-base font-black text-slate-900 mt-0.5">{vendor.gstin || "UNREGISTERED VENDOR"}</p>
            <p className="font-bold text-slate-800 mt-1">{vendor.name}</p>
            <p className="text-slate-600">{vendor.address} {vendor.city} {vendor.state}</p>
          </div>
          <div className="border-l border-emerald-200 pl-4">
            <span className="font-extrabold uppercase text-[10px] text-emerald-800 block">Recipient GSTIN (Our ITC Claim Entity)</span>
            <p className="font-mono text-base font-black text-slate-900 mt-0.5">{company.gstin || "NOT PROVIDED"}</p>
            <p className="font-bold text-slate-800 mt-1">{company.company_name}</p>
            <p className="text-slate-600">{company.business_address} {company.city} {company.state}</p>
          </div>
        </div>

        {/* GST Breakdown Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 my-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-800 text-white font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Item / Service</th>
                <th className="py-2.5 px-2 text-center">HSN</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-2 text-right">Taxable Val</th>
                <th className="py-2.5 px-2 text-center">CGST</th>
                <th className="py-2.5 px-2 text-center">SGST</th>
                <th className="py-2.5 px-2 text-center">IGST</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => {
                const itemTaxable = (item.quantity * item.rate) - ((item.quantity * item.rate * (item.discount || 0)) / 100);
                const itemTax = (itemTaxable * (item.tax_rate || 0)) / 100;
                const iCgst = isInterstate ? 0 : itemTax / 2;
                const iSgst = isInterstate ? 0 : itemTax / 2;
                const iIgst = isInterstate ? itemTax : 0;
                return (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-emerald-50/20"}>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <div className="font-bold">{getItemDisplayName(item)}</div>
                      {getItemDescription(item, 90) && (
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5 line-clamp-2 max-w-xs">{getItemDescription(item, 90)}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-600">{getItemHSN(item)}</td>
                    <td className="py-2.5 px-2 text-center font-bold text-slate-900">{item.quantity}</td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                      {currencySymbol}{itemTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                      {isInterstate ? "—" : `${item.tax_rate / 2}% (${currencySymbol}${iCgst.toFixed(2)})`}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                      {isInterstate ? "—" : `${item.tax_rate / 2}% (${currencySymbol}${iSgst.toFixed(2)})`}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                      {isInterstate ? `${item.tax_rate}% (${currencySymbol}${iIgst.toFixed(2)})` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                      {currencySymbol}{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* GST Audit Certification & Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-black text-emerald-900 uppercase text-[11px]">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              <span>Auditor Input Tax Credit Certification</span>
            </div>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              Certified that the tax invoice meets all requirements of Section 31 of CGST Act. The recipient entity has received the goods/services and is entitled to full ITC under Section 16(2).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Total Taxable Amount:</span>
              <span className="font-mono font-bold text-slate-900">{currencySymbol}{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Input Tax Credit (ITC):</span>
              <span className="font-mono font-bold text-emerald-700">+{currencySymbol}{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline font-black text-base text-slate-900">
              <span>Gross Voucher Value:</span>
              <span className="font-mono text-xl">{currencySymbol}{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // TEMPLATE 3: GOODS RECEIPT NOTE (GRN) / WAREHOUSE INWARD
  // --------------------------------------------------------------------------
  return (
    <div className="w-full bg-white text-slate-900 p-6 md:p-10 font-mono max-w-4xl mx-auto border-2 border-slate-800 shadow-sm">
      <div className="border-b-4 border-slate-900 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">GOODS RECEIPT NOTE (GRN)</h1>
          <p className="text-xs text-slate-500 font-bold uppercase">Warehouse Inward & Physical Stock Entry Document</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black">GRN #{invoice.invoice_number}</p>
          <p className="text-xs text-slate-500">INWARD DATE: {safelyFormatDate(invoice.issue_date)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-slate-50 border border-slate-300 text-xs">
        <div>
          <span className="font-black block uppercase text-[10px] text-slate-500">SUPPLIER / CONSIGNOR</span>
          <p className="font-bold text-sm">{vendor.name}</p>
          <p>{vendor.phone || "No phone"}</p>
          <p>GSTIN: {vendor.gstin || "N/A"}</p>
        </div>
        <div className="border-l border-slate-300 pl-3">
          <span className="font-black block uppercase text-[10px] text-slate-500">DELIVERY TO WAREHOUSE</span>
          <p className="font-bold text-sm">{company.company_name}</p>
          <p>{company.business_address || "Main Storage"}</p>
          <p>GSTIN: {company.gstin || "N/A"}</p>
        </div>
      </div>

      <table className="w-full text-left border-collapse border border-slate-800 text-xs my-4">
        <thead>
          <tr className="bg-slate-800 text-white font-bold uppercase text-[10px]">
            <th className="p-2 border border-slate-700">#</th>
            <th className="p-2 border border-slate-700">Item Name / SKU</th>
            <th className="p-2 border border-slate-700 text-center">Billed Qty</th>
            <th className="p-2 border border-slate-700 text-center">Received Qty</th>
            <th className="p-2 border border-slate-700 text-right">Inward Rate</th>
            <th className="p-2 border border-slate-700 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-slate-300">
              <td className="p-2 text-center border-r border-slate-300 font-bold">{idx + 1}</td>
              <td className="p-2 border-r border-slate-300 font-bold">
                <div>{getItemDisplayName(item)}</div>
                {getItemDescription(item, 80) && (
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5 line-clamp-2 max-w-xs">{getItemDescription(item, 80)}</div>
                )}
                {getItemHSN(item) !== '-' && (
                  <div className="text-[9px] font-mono text-slate-400 font-normal mt-0.5">HSN: {getItemHSN(item)}</div>
                )}
              </td>
              <td className="p-2 text-center border-r border-slate-300">{item.quantity} {item.product?.unit || 'pcs'}</td>
              <td className="p-2 text-center border-r border-slate-300 font-bold text-emerald-700">
                ✓ {item.quantity} {item.product?.unit || 'pcs'}
              </td>
              <td className="p-2 text-right border-r border-slate-300">{currencySymbol}{item.rate.toFixed(2)}</td>
              <td className="p-2 text-right font-black">{currencySymbol}{item.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center p-3 bg-slate-100 border border-slate-300 text-xs font-bold">
        <span>TOTAL PROCUREMENT INWARD:</span>
        <span className="text-base font-black font-mono">{currencySymbol}{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-8 pt-4 border-t-2 border-slate-800 text-center text-[10px]">
        <div>
          <div className="h-10 border-b border-slate-400 mb-1"></div>
          <p className="font-bold">Goods Unloaded By</p>
        </div>
        <div>
          <div className="h-10 border-b border-slate-400 mb-1"></div>
          <p className="font-bold">Quantity Verified By</p>
        </div>
        <div>
          <div className="h-10 border-b border-slate-400 mb-1"></div>
          <p className="font-bold">Store Keeper Sign</p>
        </div>
      </div>
    </div>
  );
};
