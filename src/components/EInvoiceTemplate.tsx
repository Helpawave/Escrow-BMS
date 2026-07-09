import React from 'react';
import { format } from 'date-fns';
import QRCode from 'react-qr-code';

interface EInvoiceItem {
  description: string;
  hsn_code: string;
  quantity: number;
  unit: string;
  rate: number;
  tax_rate: number;
  amount: number;
}

interface Client {
  name: string;
  email: string;
  gstin: string;
  address: string;
  state: string;
  postal_code: string;
  hide_contact_details?: boolean;
}

interface Profile {
  company_name: string;
  business_address: string;
  gstin: string;
  phone: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  signature_url?: string | null;
  logo_url?: string;
}

interface EInvoiceData {
  invoice_type: string;
  invoice_number: string;
  invoice_date: string;
  place_of_supply: string;
  reverse_charge: string;
  notes?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  irn?: string;
  ack_no?: string;
  ack_date?: string;
}

interface EInvoiceTemplateProps {
  invoice: EInvoiceData;
  client: Client;
  items: EInvoiceItem[];
  profile: Profile;
}

export const EInvoiceTemplate: React.FC<EInvoiceTemplateProps> = ({
  invoice,
  client,
  items,
  profile,
}) => {
  return (
    <div className="invoice-template bg-white text-black max-w-4xl mx-auto p-4 border border-black font-sans" style={{ minHeight: '297mm', width: '210mm', fontSize: '11px', lineHeight: '1.4' }}>
      {/* Top Header */}
      <div className="flex border-b border-black pb-2 mb-4">
        <div className="w-[15%] flex items-center justify-center p-2">
          {profile.logo_url ? (
             <img src={profile.logo_url} alt="Logo" className="max-w-full max-h-16 object-contain" />
          ) : (
             <div className="w-16 h-16 bg-slate-100 flex items-center justify-center border border-slate-200 text-2xl font-bold text-slate-400">LOGO</div>
          )}
        </div>
        <div className="w-[70%] text-center px-4">
          <h1 className="text-xl font-bold uppercase">{profile.company_name}</h1>
          <p className="text-sm whitespace-pre-wrap">{profile.business_address}</p>
          <p className="font-bold mt-1">GSTIN: {profile.gstin} | Phone: {profile.phone}</p>
        </div>
        <div className="w-[15%] flex flex-col items-center justify-center p-1 border border-black rounded-lg bg-white shadow-sm">
           <div className="w-20 h-20 flex items-center justify-center relative">
              {/* Actual QR Code */}
              <QRCode 
                value={invoice.irn || `INV:${invoice.invoice_number}|DT:${invoice.invoice_date}|GST:${profile.gstin}|AMT:${invoice.total_amount}`}
                size={70}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
           </div>
           <span className="text-[6px] font-bold text-black uppercase mt-1 tracking-tighter">Digital Auth</span>
        </div>
      </div>

      {/* E-Invoice Title and IRN */}
      <div className="text-center bg-slate-100 border-y border-black py-1 mb-4">
        <h2 className="text-lg font-bold uppercase tracking-widest">{invoice.invoice_type}</h2>
      </div>

      <div className="grid grid-cols-2 gap-0 border border-black mb-4">
        <div className="p-2 border-r border-black">
           <table className="w-full text-[10px]">
              <tbody>
                 <tr><td className="font-bold w-32">IRN:</td><td className="font-mono break-all text-[9px]">{invoice.irn || '359659f8c6... (Not Generated)'}</td></tr>
                 <tr><td className="font-bold">Ack No:</td><td>{invoice.ack_no || '-'}</td></tr>
                 <tr><td className="font-bold">Ack Date:</td><td>{invoice.ack_date || format(new Date(invoice.invoice_date), 'dd/MM/yyyy')}</td></tr>
              </tbody>
           </table>
        </div>
        <div className="p-2">
           <table className="w-full text-[10px]">
              <tbody>
                 <tr><td className="font-bold w-32">Invoice No:</td><td className="font-bold">{invoice.invoice_number}</td></tr>
                 <tr><td className="font-bold">Invoice Date:</td><td>{format(new Date(invoice.invoice_date), 'dd/MM/yyyy')}</td></tr>
                 <tr><td className="font-bold">Reverse Charge:</td><td>{invoice.reverse_charge}</td></tr>
              </tbody>
           </table>
        </div>
      </div>

      {/* Bill To and Ship To */}
      <div className="grid grid-cols-2 gap-0 border border-black mb-4">
         <div className="p-3 border-r border-black min-h-[120px]">
            <h3 className="font-bold uppercase border-b border-black pb-1 mb-2 bg-slate-50 -mx-3 px-3">Details of Receiver | Billed to:</h3>
            <p className="font-bold text-sm">{client.name}</p>
            {!client.hide_contact_details && (
              <>
                <p className="mt-1 leading-relaxed text-slate-700">{client.address}</p>
                <p className="mt-1 text-xs">{client.state} - {client.postal_code}</p>
                <p className="font-bold mt-2 font-mono text-xs text-blue-800">GSTIN/UIN: {client.gstin}</p>
              </>
            )}
         </div>
         <div className="p-3 min-h-[120px]">
            <h3 className="font-bold uppercase border-b border-black pb-1 mb-2 bg-slate-50 -mx-3 px-3">Details of Consignee | Shipped to:</h3>
            <p className="font-bold text-sm">{client.name}</p>
            {!client.hide_contact_details && (
              <>
                <p className="mt-1 leading-relaxed text-slate-700">{client.address}</p>
                <p className="mt-1 text-xs">{client.state} - {client.postal_code}</p>
                <p className="font-bold mt-2 font-mono text-xs">PAN: {client.gstin.substring(2, 12)}</p>
              </>
            )}
         </div>
      </div>

      {/* Items Table */}
      <div className="border border-black mb-4 overflow-hidden">
        <table className="w-full border-collapse border-b border-black" style={{ tableLayout: 'fixed' }}>
           <thead>
              <tr className="bg-slate-50 text-[9px] font-bold text-center">
                 <th className="border-r border-black p-1 w-8">Sl.</th>
                 <th className="border-r border-black p-1">Description of Goods</th>
                 <th className="border-r border-black p-1 w-16">HSN/SAC</th>
                 <th className="border-r border-black p-1 w-10">Qty</th>
                 <th className="border-r border-black p-1 w-12">Unit</th>
                 <th className="border-r border-black p-1 w-16">Rate</th>
                 <th className="border-r border-black p-1 w-20">Taxable Val.</th>
                 <th className="border-r border-black p-1 w-32">GST Breakdown</th>
                 <th className="p-1 w-24">Amount</th>
              </tr>
           </thead>
           <tbody>
              {items.map((item, idx) => (
                 <tr key={idx} className="text-center text-[10px] avoid-break">
                    <td className="border-r border-black p-1">{idx + 1}</td>
                    <td className="border-r border-black p-1 text-left font-bold">{item.description}</td>
                    <td className="border-r border-black p-1 font-mono">{item.hsn_code}</td>
                    <td className="border-r border-black p-1">{item.quantity}</td>
                    <td className="border-r border-black p-1 uppercase">{item.unit}</td>
                    <td className="border-r border-black p-1">₹{item.rate.toFixed(2)}</td>
                    <td className="border-r border-black p-1">₹{item.amount.toFixed(2)}</td>
                    <td className="border-r border-black p-1">
                       <div className="flex flex-col text-[8px] leading-tight text-slate-600">
                          <span className="flex justify-between w-full"><span>CGST({item.tax_rate/2}%):</span> <span>₹{(item.amount * (item.tax_rate/2) / 100).toFixed(2)}</span></span>
                          <span className="flex justify-between w-full"><span>SGST({item.tax_rate/2}%):</span> <span>₹{(item.amount * (item.tax_rate/2) / 100).toFixed(2)}</span></span>
                       </div>
                    </td>
                    <td className="p-1 font-bold text-right">₹{(item.amount * (1 + item.tax_rate/100)).toFixed(2)}</td>
                 </tr>
              ))}
              {/* Fill remaining space to maintain standard length */}
              {[...Array(Math.max(0, 10 - items.length))].map((_, i) => (
                 <tr key={`pad-${i}`} className="h-6">
                    <td className="border-r border-black"></td><td className="border-r border-black"></td>
                    <td className="border-r border-black"></td><td className="border-r border-black"></td>
                    <td className="border-r border-black"></td><td className="border-r border-black"></td>
                    <td className="border-r border-black"></td><td className="border-r border-black"></td>
                    <td></td>
                 </tr>
              ))}
           </tbody>
        </table>
        
        {/* Total Summary Row */}
        <div className="flex bg-slate-50 font-bold text-xs avoid-break">
           <div className="flex-1 p-2 text-right uppercase border-r border-black">Gross Total</div>
           <div className="w-20 p-2 text-center border-r border-black">₹{invoice.subtotal.toFixed(2)}</div>
           <div className="w-32 p-2 text-center border-r border-black text-[9px] font-normal leading-tight">GST: ₹{invoice.tax_amount.toFixed(2)}</div>
           <div className="w-24 p-2 text-right">₹{invoice.total_amount.toFixed(2)}</div>
        </div>
      </div>

      {/* Bank & Signatures */}
      <div className="grid grid-cols-2 gap-0 border border-black mb-4 min-h-[140px] avoid-break">
         <div className="p-3 border-r border-black flex flex-col justify-between">
            <div>
               <h4 className="text-[9px] font-bold uppercase underline mb-2">Electronic Bank Settlement:</h4>
               <div className="text-[10px] space-y-1">
                  <div className="flex justify-between w-56"><span>Bank Account Name:</span> <span className="font-bold">{profile.account_holder_name || profile.company_name}</span></div>
                  <div className="flex justify-between w-56"><span>Bank/Branch Name:</span> <span>{profile.bank_name || 'N/A'}</span></div>
                  <div className="flex justify-between w-56"><span>Bank Account No:</span> <span className="font-bold tracking-widest">{profile.account_number || 'N/A'}</span></div>
                  <div className="flex justify-between w-56"><span>IFSC/RTGS Code:</span> <span className="font-bold uppercase">{profile.ifsc_code || 'N/A'}</span></div>
               </div>
            </div>
            <div className="text-[8px] italic text-slate-500 mt-4">
               Terms: {invoice.notes || '1. Goods once sold will not be taken back. 2. Any disputes subject to local jurisdiction.'}
            </div>
         </div>
         <div className="p-3 flex flex-col justify-between">
            <div>
               <h4 className="text-[10px] font-bold uppercase mb-1">Total (in words):</h4>
               <p className="text-[11px] font-bold italic text-slate-800 uppercase leading-snug">Rupees {invoice.total_amount.toLocaleString('en-IN')} Only</p>
            </div>
            <div className="border-t border-black pt-2 flex justify-between items-end mt-4">
               <div className="text-center w-24">
                  <div className="h-10"></div>
                  <p className="text-[8px] font-bold border-t border-slate-300 pt-1 uppercase">Customer Sign</p>
               </div>
               <div className="text-center">
                  <p className="text-[9px] font-bold mb-1">For {profile.company_name}</p>
                  <div className="h-16 w-40 relative flex items-center justify-center overflow-hidden">
                     {profile.signature_url ? (
                        <img src={profile.signature_url} alt="Official Seal" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                     ) : (
                        <div className="text-[10px] font-black opacity-20 transform -rotate-12 border-2 border-slate-900 px-4 py-1 italic tracking-widest">AUTHORIZED</div>
                     )}
                  </div>
                  <p className="text-[9px] font-black uppercase text-slate-900">Authorized Signatory</p>
               </div>
            </div>
         </div>
      </div>

      <div className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-[0.4em] py-2 border-t border-slate-100">
         Computer Generated Invoice • Authenticated via Invoice Registration Portal
      </div>
    </div>
  );
};
