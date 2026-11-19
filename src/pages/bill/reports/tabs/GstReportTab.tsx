import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileSpreadsheet,
  Download,
  Printer,
  FileText,
  ShieldCheck,
  IndianRupee,
  CheckCircle2,
  Layers,
  FileCode,
  Search,
} from 'lucide-react';
import {
  GSTR1B2BItem,
  GSTR1B2CSItem,
  GSTR1DocSummary,
  GSTR2BITCItem,
  GSTR1HSNItem,
  GSTR3BTable31,
  GSTR3BTable4,
  GSTR3BTable61,
  CMP08Item,
  GSTR9AnnualItem,
  GST_STATE_CODES,
} from '../types';

export interface GstSummaryStats {
  totalOutputTax: number;
  totalOutputTaxable: number;
  outputIGST: number;
  outputCGST: number;
  outputSGST: number;
  totalInputTax: number;
  totalInputTaxable: number;
  netCashPayable: number;
  totalInvoicesIssued: number;
  totalB2BInvoices: number;
  totalB2CInvoices: number;
}

export interface GstReportTabProps {
  companyProfile?: any;
  profile?: any;
  exportAllGSTExcel: () => void;
  exportGSTR1JSON: () => void;
  exportGSTPDF: (isPrint?: boolean) => void;
  gstSummaryStats: GstSummaryStats;
  gstSubTab: 'gstr1' | 'gstr2b' | 'gstr3b' | 'cmp08' | 'gstr9' | 'hsn';
  setGstSubTab: (tab: 'gstr1' | 'gstr2b' | 'gstr3b' | 'cmp08' | 'gstr9' | 'hsn') => void;
  gstr1B2BList: GSTR1B2BItem[];
  gstr1B2CLList: any[];
  gstr1B2CSList: GSTR1B2CSItem[];
  gstr1DocSummary: GSTR1DocSummary[];
  gstr2bList: GSTR2BITCItem[];
  gstr1HSNList: GSTR1HSNItem[];
  gstr3bTable31: GSTR3BTable31[];
  gstr3bTable4: GSTR3BTable4[];
  gstr3bTable61: GSTR3BTable61[];
  cmp08Data: CMP08Item[];
  gstr9Data: GSTR9AnnualItem[];
  gstr1Section: 'b2b' | 'b2cl' | 'b2cs' | 'docs';
  setGstr1Section: (section: 'b2b' | 'b2cl' | 'b2cs' | 'docs') => void;
  exportIndividualGSTR1Excel: () => void;
  exportIndividualGSTR2BExcel: () => void;
  exportIndividualGSTR2BPDF: () => void;
  exportIndividualGSTR3BExcel: () => void;
  exportIndividualGSTR3BPDF: () => void;
  exportIndividualCMP08Excel: () => void;
  exportIndividualGSTR9Excel: () => void;
  exportIndividualGSTR9PDF: () => void;
  gstSearchTerm: string;
  setGstSearchTerm: (value: string) => void;
  debouncedGstSearch: string;
  currencySymbol: string;
  safelyToLocaleDate: (dateStr?: string | null) => string;
}

export const GstReportTab: React.FC<GstReportTabProps> = ({
  companyProfile,
  profile,
  exportAllGSTExcel,
  exportGSTR1JSON,
  exportGSTPDF,
  gstSummaryStats,
  gstSubTab,
  setGstSubTab,
  gstr1B2BList,
  gstr1B2CLList,
  gstr1B2CSList,
  gstr1DocSummary,
  gstr2bList,
  gstr1HSNList,
  gstr3bTable31,
  gstr3bTable4,
  gstr3bTable61,
  cmp08Data,
  gstr9Data,
  gstr1Section,
  setGstr1Section,
  exportIndividualGSTR1Excel,
  exportIndividualGSTR2BExcel,
  exportIndividualGSTR2BPDF,
  exportIndividualGSTR3BExcel,
  exportIndividualGSTR3BPDF,
  exportIndividualCMP08Excel,
  exportIndividualGSTR9Excel,
  exportIndividualGSTR9PDF,
  gstSearchTerm,
  setGstSearchTerm,
  debouncedGstSearch,
  currencySymbol,
  safelyToLocaleDate,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-lg sm:text-xl font-bold text-foreground">GST Returns</h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            GSTR-1, GSTR-2B, GSTR-3B, CMP-08, and GSTR-9 summaries
          </p>
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <span className="text-[11px] font-semibold bg-muted px-2.5 py-0.5 rounded-md text-foreground">
              GSTIN: <span className="font-mono font-bold text-primary">{companyProfile?.gstin || profile?.gstin || 'Not Configured'}</span>
            </span>
            <span className="text-[11px] font-semibold bg-muted px-2.5 py-0.5 rounded-md text-muted-foreground">
              State: <span className="text-foreground font-bold">{GST_STATE_CODES[(companyProfile?.gstin || profile?.gstin || '').slice(0, 2)] || 'Default (24-Gujarat)'}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exportAllGSTExcel}
            className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
            title="Export multi-sheet Excel with all GST returns"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
            Excel (All Returns)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportGSTR1JSON}
            className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
            title="Download JSON file formatted for upload on gst.gov.in"
          >
            <Download className="w-4 h-4 mr-1.5 text-blue-600" />
            Govt GSTR-1 JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportGSTPDF(false)}
            className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
            title="Download formatted GST compliance PDF report"
          >
            <Download className="w-4 h-4 mr-1.5 text-rose-600" />
            GST PDF
          </Button>
          <Button
            size="sm"
            onClick={() => exportGSTPDF(true)}
            className="font-semibold text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print
          </Button>
        </div>
      </div>

      {/* 4 Top Executive Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Output Tax Liability */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-border/70 shadow-sm bg-gradient-to-br from-card to-blue-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gross Output Tax</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black tabular-nums text-foreground">
            {currencySymbol} {gstSummaryStats.totalOutputTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Taxable: <span className="font-semibold text-foreground">{currencySymbol} {gstSummaryStats.totalOutputTaxable.toLocaleString('en-IN')}</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>IGST: {currencySymbol}{gstSummaryStats.outputIGST.toLocaleString('en-IN')}</span>
            <span>CGST+SGST: {currencySymbol}{(gstSummaryStats.outputCGST + gstSummaryStats.outputSGST).toLocaleString('en-IN')}</span>
          </div>
        </Card>

        {/* Card 2: Eligible Input Tax Credit (GSTR-2B) */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-border/70 shadow-sm bg-gradient-to-br from-card to-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Eligible ITC (GSTR-2B)</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            {currencySymbol} {gstSummaryStats.totalInputTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Inward Purchases: <span className="font-semibold text-foreground">{currencySymbol} {gstSummaryStats.totalInputTaxable.toLocaleString('en-IN')}</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>Available for Offset</span>
            <span className="font-bold text-emerald-600">Table 4 ITC</span>
          </div>
        </Card>

        {/* Card 3: Net Cash Tax Payable */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-border/70 shadow-sm bg-gradient-to-br from-card to-purple-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Net Cash Tax Payable</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black tabular-nums text-foreground">
            {currencySymbol} {gstSummaryStats.netCashPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {gstSummaryStats.netCashPayable === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Fully Covered by Inward ITC
              </span>
            ) : (
              <span>To be paid in cash via Challan (Table 6.1)</span>
            )}
          </div>
          <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>Output - Input ITC Offset</span>
            <span className="font-bold text-purple-600">GSTR-3B</span>
          </div>
        </Card>

        {/* Card 4: Documents & Invoices Summary */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-border/70 shadow-sm bg-gradient-to-br from-card to-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoices &amp; Returns</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black tabular-nums text-foreground">
            {gstSummaryStats.totalInvoicesIssued} <span className="text-sm font-semibold text-muted-foreground">Issued</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            B2B (Registered): <span className="font-bold text-foreground">{gstSummaryStats.totalB2BInvoices}</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>B2C Retail: {gstSummaryStats.totalB2CInvoices}</span>
            <span className="font-bold text-amber-600">Table 13 Docs</span>
          </div>
        </Card>
      </div>

      {/* Sub-Tab Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-border/60">
        {[
          { id: 'gstr1', label: 'GSTR-1 / 1A', badge: `${gstr1B2BList.length + gstr1B2CSList.length} rows`, desc: 'Outward Supplies' },
          { id: 'gstr2b', label: 'GSTR-2B / 2A', badge: `${gstr2bList.length} bills`, desc: 'Inward ITC Ledger' },
          { id: 'gstr3b', label: 'GSTR-3B', badge: 'Net Liability', desc: 'Monthly Summary' },
          { id: 'cmp08', label: 'CMP-08 / GSTR-4', badge: 'Composition', desc: 'Scheme Return' },
          { id: 'gstr9', label: 'GSTR-9 / 9C', badge: 'Annual', desc: 'Reconciliation' },
          { id: 'hsn', label: 'HSN / SAC Summary', badge: `${gstr1HSNList.length} codes`, desc: 'Item Classification' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setGstSubTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              gstSubTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
              gstSubTab === tab.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-muted-foreground'
            }`}>
              {tab.badge}
            </span>
          </button>
        ))}
      </div>

      {/* Sub-View Content */}
      {/* 1. GSTR-1 View */}
      {gstSubTab === 'gstr1' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-xl border border-border/60">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: 'b2b', label: `4A, 4B - B2B Invoices (${gstr1B2BList.length})` },
                { id: 'b2cl', label: `5A, 5B - B2CL Large (${gstr1B2CLList.length})` },
                { id: 'b2cs', label: `7 - B2CS Small (${gstr1B2CSList.length})` },
                { id: 'docs', label: `13 - Documents Issued (${gstr1DocSummary.length})` },
              ].map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setGstr1Section(sec.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    gstr1Section === sec.id
                      ? 'bg-card text-foreground shadow-sm border border-border/80'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={exportIndividualGSTR1Excel}
                className="h-8 text-xs font-bold gap-1.5 border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export GSTR-1 Excel (.xlsx)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={exportGSTR1JSON}
                className="h-8 text-xs font-bold gap-1.5 border-primary/40 hover:bg-primary/10 text-primary"
              >
                <FileCode className="w-3.5 h-3.5" />
                Govt JSON
              </Button>
              <div className="relative w-full sm:w-52">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search GSTIN, invoice, client..."
                  value={gstSearchTerm}
                  onChange={e => setGstSearchTerm(e.target.value)}
                  className="h-8 pl-8 text-xs rounded-lg bg-background"
                />
              </div>
            </div>
          </div>

          {/* Table for B2B */}
          {gstr1Section === 'b2b' && (
            <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border/60 flex items-center justify-between bg-muted/20">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Table 4A, 4B, 6B, 6C - B2B Invoices to Registered Dealers</h3>
                  <p className="text-xs text-muted-foreground">Supplies to recipients possessing a valid 15-character GSTIN</p>
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                  Total Taxable: {currencySymbol}{gstr1B2BList.reduce((s, i) => s + i.taxableValue, 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
                    <tr>
                      <th className="px-4 py-3">Recipient GSTIN</th>
                      <th className="px-4 py-3">Receiver Name</th>
                      <th className="px-4 py-3">Invoice #</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Place of Supply</th>
                      <th className="px-4 py-3 text-right">Invoice Value</th>
                      <th className="px-4 py-3 text-center">Rate</th>
                      <th className="px-4 py-3 text-right">Taxable Value</th>
                      <th className="px-4 py-3 text-right">IGST</th>
                      <th className="px-4 py-3 text-right">CGST</th>
                      <th className="px-4 py-3 text-right">SGST</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {gstr1B2BList
                      .filter(i => {
                        const q = debouncedGstSearch.toLowerCase();
                        if (!q) return true;
                        return (
                          i.gstin.toLowerCase().includes(q) ||
                          i.clientName.toLowerCase().includes(q) ||
                          i.invoiceNumber.toLowerCase().includes(q)
                        );
                      })
                      .map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-foreground">{item.gstin}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{item.clientName}</td>
                          <td className="px-4 py-3 font-semibold text-primary">{item.invoiceNumber}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{safelyToLocaleDate(item.invoiceDate)}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{item.placeOfSupply}</td>
                          <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">{currencySymbol}{item.invoiceValue.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-center font-semibold">{item.taxRate}%</td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{item.taxableValue.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{item.integratedTax.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{item.centralTax.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{item.stateTax.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    {gstr1B2BList.length === 0 && (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-muted-foreground">
                          No B2B invoices found in this tax period. Clients with a 15-character GSTIN will automatically appear here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Table for B2CL */}
          {gstr1Section === 'b2cl' && (
            <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border/60 flex items-center justify-between bg-muted/20">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Table 5A, 5B - B2C Large Invoices (Inter-State &gt; ₹2,50,000)</h3>
                  <p className="text-xs text-muted-foreground">Inter-state supplies made to unregistered consumers with invoice value exceeding ₹2.5 Lakhs</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
                    <tr>
                      <th className="px-4 py-3">Invoice #</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Place of Supply</th>
                      <th className="px-4 py-3 text-right">Invoice Value</th>
                      <th className="px-4 py-3 text-center">Tax Rate</th>
                      <th className="px-4 py-3 text-right">Taxable Value</th>
                      <th className="px-4 py-3 text-right">Integrated Tax (IGST)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {gstr1B2CLList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-primary">{item.invoiceNumber}</td>
                        <td className="px-4 py-3 text-muted-foreground">{safelyToLocaleDate(item.invoiceDate)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.placeOfSupply}</td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">{currencySymbol}{item.invoiceValue.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-center font-semibold">{item.taxRate}%</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{item.taxableValue.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">{currencySymbol}{item.integratedTax.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {gstr1B2CLList.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No B2CL large inter-state supplies exceeding ₹2,50,000 in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Table for B2CS */}
          {gstr1Section === 'b2cs' && (
            <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border/60 flex items-center justify-between bg-muted/20">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Table 7 - B2C Small Supplies (Net of Credit/Debit Notes)</h3>
                  <p className="text-xs text-muted-foreground">Consolidated supplies to unregistered consumers (intra-state and inter-state ≤ ₹2.5 Lakhs) grouped by Place of Supply &amp; Rate</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Place of Supply</th>
                      <th className="px-4 py-3 text-center">Tax Rate</th>
                      <th className="px-4 py-3 text-right">Taxable Value</th>
                      <th className="px-4 py-3 text-right">Integrated Tax</th>
                      <th className="px-4 py-3 text-right">Central Tax</th>
                      <th className="px-4 py-3 text-right">State / UT Tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {gstr1B2CSList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-primary">OE (Other)</td>
                        <td className="px-4 py-3 text-foreground font-medium">{item.placeOfSupply}</td>
                        <td className="px-4 py-3 text-center font-bold">{item.taxRate}%</td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">{currencySymbol}{item.taxableValue.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{item.integratedTax.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{item.centralTax.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{item.stateTax.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {gstr1B2CSList.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No B2C small retail supplies in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Table for Documents Issued */}
          {gstr1Section === 'docs' && (
            <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border/60 flex items-center justify-between bg-muted/20">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Table 13 - Documents Issued during the Tax Period</h3>
                  <p className="text-xs text-muted-foreground">Summary of serial number ranges and cancellation status for statutory audit</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
                    <tr>
                      <th className="px-4 py-3">Nature of Document</th>
                      <th className="px-4 py-3 font-mono">From Serial No.</th>
                      <th className="px-4 py-3 font-mono">To Serial No.</th>
                      <th className="px-4 py-3 text-right">Total Number</th>
                      <th className="px-4 py-3 text-right">Cancelled</th>
                      <th className="px-4 py-3 text-right">Net Issued</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {gstr1DocSummary.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">{item.docType}</td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">{item.fromSerial}</td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">{item.toSerial}</td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">{item.totalCount}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-rose-500 font-semibold">{item.cancelledCount}</td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-emerald-600">{item.netIssued}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 2. GSTR-2B / 2A Inward ITC View */}
      {gstSubTab === 'gstr2b' && (
        <div className="space-y-4">
          <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
              <div>
                <h3 className="text-sm font-bold text-foreground">GSTR-2B Auto-drafted ITC Statement (Inward Supplies)</h3>
                <p className="text-xs text-muted-foreground">Input Tax Credit available from purchases &amp; expenses to offset output tax liability</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                  Total ITC: {currencySymbol}{gstSummaryStats.totalInputTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportIndividualGSTR2BExcel}
                  className="h-8 text-xs font-bold gap-1.5 border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Download Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportIndividualGSTR2BPDF}
                  className="h-8 text-xs font-bold gap-1.5 border-rose-500/40 hover:bg-rose-500/10 text-rose-700 dark:text-rose-400"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </Button>
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Filter vendor, bill #..."
                    value={gstSearchTerm}
                    onChange={e => setGstSearchTerm(e.target.value)}
                    className="h-8 pl-8 text-xs rounded-lg bg-background"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
                  <tr>
                    <th className="px-4 py-3">Vendor GSTIN</th>
                    <th className="px-4 py-3">Legal / Trade Name</th>
                    <th className="px-4 py-3">Bill / Inv #</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Invoice Value</th>
                    <th className="px-4 py-3 text-right">Taxable Value</th>
                    <th className="px-4 py-3 text-right">IGST</th>
                    <th className="px-4 py-3 text-right">CGST</th>
                    <th className="px-4 py-3 text-right">SGST</th>
                    <th className="px-4 py-3 text-center">ITC Eligibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {gstr2bList
                    .filter(i => {
                      const q = debouncedGstSearch.toLowerCase();
                      if (!q) return true;
                      return (
                        i.vendorGstin.toLowerCase().includes(q) ||
                        i.vendorName.toLowerCase().includes(q) ||
                        i.invoiceNumber.toLowerCase().includes(q)
                      );
                    })
                    .map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-foreground">{item.vendorGstin}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{item.vendorName}</td>
                        <td className="px-4 py-3 font-semibold text-primary">{item.invoiceNumber}</td>
                        <td className="px-4 py-3 text-muted-foreground">{safelyToLocaleDate(item.invoiceDate)}</td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">{currencySymbol}{item.invoiceValue.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{item.taxableValue.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{item.integratedTax.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{item.centralTax.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{item.stateTax.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Eligible (All other ITC)
                          </span>
                        </td>
                      </tr>
                    ))}
                  {gstr2bList.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted-foreground">
                        No inward purchase bills recorded in this period. Purchase invoices created from registered vendors will populate here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 3. GSTR-3B View */}
      {gstSubTab === 'gstr3b' && (
        <div className="space-y-6">
          {/* Table 3.1 Outward supplies */}
          <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Table 3.1 - Details of Outward Supplies &amp; Inward Supplies liable to Reverse Charge</h3>
                <p className="text-xs text-muted-foreground">Self-assessed monthly gross liability across tax heads</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportIndividualGSTR3BExcel}
                  className="h-8 text-xs font-bold gap-1.5 border-purple-500/40 hover:bg-purple-500/10 text-purple-700 dark:text-purple-400"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Download GSTR-3B Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportIndividualGSTR3BPDF}
                  className="h-8 text-xs font-bold gap-1.5 border-rose-500/40 hover:bg-rose-500/10 text-rose-700 dark:text-rose-400"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download GSTR-3B PDF
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
                  <tr>
                    <th className="px-4 py-3">Nature of Supplies</th>
                    <th className="px-4 py-3 text-right">Total Taxable Value</th>
                    <th className="px-4 py-3 text-right">Integrated Tax (IGST)</th>
                    <th className="px-4 py-3 text-right">Central Tax (CGST)</th>
                    <th className="px-4 py-3 text-right">State / UT Tax (SGST)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {gstr3bTable31.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{row.description}</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">{currencySymbol}{row.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{row.integratedTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{row.centralTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{row.stateTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Table 4 Eligible ITC */}
          <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border/60 bg-muted/20">
              <h3 className="text-sm font-bold text-foreground">Table 4 - Eligible Input Tax Credit (ITC)</h3>
              <p className="text-xs text-muted-foreground">ITC availed from registered purchases &amp; inward bills</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
                  <tr>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3 text-right">Integrated Tax (IGST)</th>
                    <th className="px-4 py-3 text-right">Central Tax (CGST)</th>
                    <th className="px-4 py-3 text-right">State / UT Tax (SGST)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {gstr3bTable4.map((row, idx) => (
                    <tr key={idx} className={row.description.includes('Net ITC') ? "bg-emerald-500/5 font-bold" : "hover:bg-muted/40 transition-colors"}>
                      <td className="px-4 py-3 text-foreground">{row.description}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{currencySymbol}{row.integratedTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{currencySymbol}{row.centralTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{currencySymbol}{row.stateTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Table 6.1 Payment of Tax (Net Cash Liability Settlement) */}
          <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Table 6.1 - Payment of Tax &amp; Net Cash Settlement</h3>
                <p className="text-xs text-muted-foreground">Automatic set-off of output liability against available ITC ledger</p>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                Net Cash Due: {currencySymbol}{gstSummaryStats.netCashPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
                  <tr>
                    <th className="px-4 py-3">Tax Head</th>
                    <th className="px-4 py-3 text-right">Total Tax Payable</th>
                    <th className="px-4 py-3 text-right">Paid Through ITC</th>
                    <th className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">Tax Paid in Cash (Challan)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {gstr3bTable61.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{row.taxType}</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">{currencySymbol}{row.totalTaxPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-600">{currencySymbol}{row.itcPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right font-black tabular-nums text-rose-600 dark:text-rose-400">{currencySymbol}{row.taxPaidCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 4. CMP-08 Composition Scheme View */}
      {gstSubTab === 'cmp08' && (
        <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Form GST CMP-08 (Quarterly Statement for Composition Scheme)</h3>
              <p className="text-xs text-muted-foreground">Applicable for taxpayers registered under Section 10 Composition Levy (1% flat rate for manufacturers/traders)</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={exportIndividualCMP08Excel}
              className="h-8 text-xs font-bold gap-1.5 border-amber-500/40 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Download CMP-08 Excel
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
                <tr>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Value (₹)</th>
                  <th className="px-4 py-3 text-right">Central Tax (0.5%)</th>
                  <th className="px-4 py-3 text-right">State / UT Tax (0.5%)</th>
                  <th className="px-4 py-3 text-right">Total Tax Payable (1%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {cmp08Data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{row.description}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">{currencySymbol}{row.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{row.centralTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{row.stateTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">{currencySymbol}{(row.centralTax + row.stateTax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 5. GSTR-9 / 9C Annual Return View */}
      {gstSubTab === 'gstr9' && (
        <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">GSTR-9 Annual Return &amp; GSTR-9C Reconciliation Statement</h3>
              <p className="text-xs text-muted-foreground">Consolidated annual figures across supplies, ITC, taxes paid, and financial book reconciliation</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={exportIndividualGSTR9Excel}
                className="h-8 text-xs font-bold gap-1.5 border-indigo-500/40 hover:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Download GSTR-9 Excel
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={exportIndividualGSTR9PDF}
                className="h-8 text-xs font-bold gap-1.5 border-rose-500/40 hover:bg-rose-500/10 text-rose-700 dark:text-rose-400"
              >
                <Download className="w-3.5 h-3.5" />
                Download GSTR-9 PDF
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
                <tr>
                  <th className="px-4 py-3">Table #</th>
                  <th className="px-4 py-3">Nature of Supplies / Description</th>
                  <th className="px-4 py-3 text-right">Taxable Value</th>
                  <th className="px-4 py-3 text-right">Integrated Tax</th>
                  <th className="px-4 py-3 text-right">Central Tax</th>
                  <th className="px-4 py-3 text-right">State / UT Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {gstr9Data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-primary">{row.tableNumber}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{row.description}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">{currencySymbol}{row.taxableValue.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{row.integratedTax.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{row.centralTax.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{row.stateTax.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 6. HSN / SAC Summary View */}
      {gstSubTab === 'hsn' && (
        <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
            <div>
              <h3 className="text-sm font-bold text-foreground">Table 12 - HSN / SAC Summary of Outward Supplies</h3>
              <p className="text-xs text-muted-foreground">Mandatory Harmonized System of Nomenclature (HSN) and Service Accounting Code (SAC) breakdown</p>
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search HSN code, name..."
                value={gstSearchTerm}
                onChange={e => setGstSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs rounded-lg bg-background"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
                <tr>
                  <th className="px-4 py-3 font-mono">HSN / SAC</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-center">UQC</th>
                  <th className="px-4 py-3 text-right">Total Qty</th>
                  <th className="px-4 py-3 text-right">Total Value</th>
                  <th className="px-4 py-3 text-right">Taxable Value</th>
                  <th className="px-4 py-3 text-right">Integrated Tax</th>
                  <th className="px-4 py-3 text-right">Central Tax</th>
                  <th className="px-4 py-3 text-right">State / UT Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {gstr1HSNList
                  .filter(i => {
                    const q = debouncedGstSearch.toLowerCase();
                    if (!q) return true;
                    return (
                      i.hsnCode.toLowerCase().includes(q) ||
                      i.description.toLowerCase().includes(q)
                    );
                  })
                  .map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-primary">{item.hsnCode}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{item.description}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground font-semibold">{item.uqc}</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">{item.totalQuantity}</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">{currencySymbol}{item.totalValue.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{item.taxableValue.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{item.integratedTax.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{item.centralTax.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{currencySymbol}{item.stateTax.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                {gstr1HSNList.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      No HSN coded items found in current period invoices.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

