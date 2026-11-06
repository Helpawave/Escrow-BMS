import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  Download,
  Printer,
  FileText,
  ShieldCheck,
  CreditCard,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Building2,
  Receipt
} from "lucide-react";
import * as XLSX from 'xlsx';
import { CountryTaxConfig } from '@/data/taxCountries';
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { useToast } from "@/hooks/use-toast";

interface VatReturnReportProps {
  businessCountry: CountryTaxConfig;
  companyProfile: any;
  profile: any;
  currencySymbol: string;
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  gstSummaryStats: {
    totalOutputTax: number;
    totalOutputTaxable: number;
    totalInputTax: number;
    totalInputTaxable: number;
    netCashPayable: number;
    totalInvoicesIssued: number;
    totalB2BInvoices: number;
    totalB2CInvoices: number;
    outputIGST: number;
    outputCGST: number;
    outputSGST: number;
    inputIGST: number;
    inputCGST: number;
    inputSGST: number;
  };
  gstr1B2BList: any[];
  gstr1B2CSList: any[];
  gstr2bList: any[];
  taxRates: number[];
}

export const VatReturnReport: React.FC<VatReturnReportProps> = ({
  businessCountry,
  companyProfile,
  profile,
  currencySymbol,
  dateRange,
  startDate,
  endDate,
  gstSummaryStats,
  gstr1B2BList,
  gstr1B2CSList,
  gstr2bList,
  taxRates,
}) => {
  const { toast } = useToast();
  const [vatSubTab, setVatSubTab] = useState<'summary' | 'output' | 'input' | 'rates'>('summary');
  const [outputSearch, setOutputSearch] = useState('');
  const [inputSearch, setInputSearch] = useState('');

  const compName = companyProfile?.company_name || profile?.company_name || 'My Business';
  const compTaxId = companyProfile?.gstin || profile?.gstin || 'Not Configured';
  const periodLabel = startDate && endDate
    ? `${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`
    : dateRange.replace('_', ' ').toUpperCase();

  const outputVatDue = gstSummaryStats.totalOutputTax;
  const inputVatReclaimed = gstSummaryStats.totalInputTax;
  const netVatPayable = outputVatDue - inputVatReclaimed;
  const isRefundDue = netVatPayable < 0;

  // Filtered lists
  const filteredOutputList = useMemo(() => {
    const q = outputSearch.trim().toLowerCase();
    const list = [...gstr1B2BList];
    if (!q) return list;
    return list.filter(item => 
      (item.customerName || '').toLowerCase().includes(q) ||
      (item.invoiceNumber || '').toLowerCase().includes(q) ||
      (item.gstin || '').toLowerCase().includes(q)
    );
  }, [gstr1B2BList, outputSearch]);

  const filteredInputList = useMemo(() => {
    const q = inputSearch.trim().toLowerCase();
    const list = [...gstr2bList];
    if (!q) return list;
    return list.filter(item => 
      (item.vendorName || '').toLowerCase().includes(q) ||
      (item.invoiceNumber || '').toLowerCase().includes(q) ||
      (item.vendorGstin || '').toLowerCase().includes(q)
    );
  }, [gstr2bList, inputSearch]);

  // Export multi-sheet VAT Excel
  const exportVATExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: 9-Box VAT Return Statement
      const boxRows = [
        [`${businessCountry.countryName.toUpperCase()} - VAT RETURN STATEMENT (${businessCountry.taxName})`],
        [`Taxpayer Legal / Trade Name: ${compName}`],
        [`${businessCountry.taxIdLabel}: ${compTaxId}`],
        [`Standard Rate: ${businessCountry.standardTaxRate}% | Currency: ${currencySymbol} (${businessCountry.currencyCode})`],
        [`Period: ${periodLabel}`],
        [`Generated on: ${safelyToLocaleDate(new Date())}`],
        [],
        ['Box', 'Description', `Amount (${currencySymbol})`, 'Classification'],
        ['Box 1', 'VAT due in this period on sales and other outputs', outputVatDue, 'Output VAT'],
        ['Box 2', 'VAT due in this period on acquisitions / reverse-charge', 0, 'Reverse Charge VAT'],
        ['Box 3', 'Total VAT due (sum of Box 1 and Box 2)', outputVatDue, 'Total Output VAT'],
        ['Box 4', 'VAT reclaimed in this period on purchases and other inputs', inputVatReclaimed, 'Allowable Input VAT'],
        ['Box 5', 'Net VAT to pay to tax authorities or reclaim (Box 3 - Box 4)', netVatPayable, isRefundDue ? 'Net Refund Claim' : 'Net Tax Payable'],
        ['Box 6', 'Total value of sales and all other outputs excluding any VAT', gstSummaryStats.totalOutputTaxable, 'Net Sales Turnover'],
        ['Box 7', 'Total value of purchases and all other inputs excluding any VAT', gstSummaryStats.totalInputTaxable, 'Net Purchases & Expenses'],
        ['Box 8', 'Total value of supplies to other countries / zero-rated exports', 0, 'Exports & Zero-Rated'],
        ['Box 9', 'Total value of acquisitions from other countries', 0, 'Imports & Acquisitions'],
      ];
      const boxSheet = XLSX.utils.aoa_to_sheet(boxRows);
      boxSheet['!cols'] = [{ wch: 10 }, { wch: 65 }, { wch: 22 }, { wch: 22 }];
      XLSX.utils.book_append_sheet(workbook, boxSheet, 'VAT Return (9-Box)');

      // Sheet 2: Output VAT Ledger (Sales)
      const outRows = [
        [`OUTPUT VAT SCHEDULE - ${compName}`],
        [`${businessCountry.taxIdLabel}: ${compTaxId} | Period: ${periodLabel}`],
        [],
        ['Invoice #', 'Date', 'Customer Name', `Customer ${businessCountry.taxIdLabel}`, `Net Taxable (${currencySymbol})`, 'VAT Rate %', `VAT Amount (${currencySymbol})`, `Total Gross (${currencySymbol})`],
        ...gstr1B2BList.map(item => [
          item.invoiceNumber,
          safelyToLocaleDate(item.invoiceDate),
          item.customerName,
          item.gstin || 'B2C / Not Provided',
          item.taxableValue,
          `${item.taxRate}%`,
          item.integratedTax + item.centralTax + item.stateTax,
          item.invoiceValue
        ]),
        ...gstr1B2CSList.map(item => [
          'B2C / Retail',
          '-',
          'Retail Customer',
          'Unregistered Consumer',
          item.taxableValue,
          `${item.taxRate}%`,
          item.integratedTax + item.centralTax + item.stateTax,
          item.taxableValue + item.integratedTax + item.centralTax + item.stateTax
        ])
      ];
      const outSheet = XLSX.utils.aoa_to_sheet(outRows);
      outSheet['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 28 }, { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(workbook, outSheet, 'Output VAT Sales');

      // Sheet 3: Input VAT Ledger (Purchases)
      const inRows = [
        [`INPUT VAT SCHEDULE - ${compName}`],
        [`${businessCountry.taxIdLabel}: ${compTaxId} | Period: ${periodLabel}`],
        [],
        ['Bill / Ref #', 'Date', 'Supplier Name', `Supplier ${businessCountry.taxIdLabel}`, `Net Taxable (${currencySymbol})`, `Input VAT (${currencySymbol})`, `Total Gross (${currencySymbol})`],
        ...gstr2bList.map(item => [
          item.invoiceNumber,
          safelyToLocaleDate(item.invoiceDate),
          item.vendorName,
          item.vendorGstin || 'Not Provided',
          item.taxableValue,
          item.integratedTax + item.centralTax + item.stateTax,
          item.invoiceValue
        ])
      ];
      const inSheet = XLSX.utils.aoa_to_sheet(inRows);
      inSheet['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 28 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(workbook, inSheet, 'Input VAT Purchases');

      const fileName = `VAT_Return_${businessCountry.countryCode}_${compName.replace(/\s+/g, '_')}_${dateRange}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast({
        title: "VAT Return Exported",
        description: `Downloaded ${fileName} with official 9-Box summary and schedules.`,
      });
    } catch (err) {
      console.error('VAT export error:', err);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not generate VAT spreadsheet.",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{businessCountry.flag}</span>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              {businessCountry.countryName} VAT Return & Compliance
            </h2>
            <Badge className="bg-indigo-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full ml-1">
              {businessCountry.taxName} • {businessCountry.standardTaxRate}%
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Official periodic Value Added Tax return statement (9-Box standard layout)
          </p>
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <span className="text-[11px] font-semibold bg-muted px-2.5 py-0.5 rounded-md text-foreground">
              {businessCountry.taxIdLabel}: <span className="font-mono font-bold text-primary">{compTaxId}</span>
            </span>
            <span className="text-[11px] font-semibold bg-muted px-2.5 py-0.5 rounded-md text-muted-foreground">
              Currency: <span className="text-foreground font-bold">{businessCountry.currencyCode} ({currencySymbol})</span>
            </span>
            <span className="text-[11px] font-semibold bg-muted px-2.5 py-0.5 rounded-md text-muted-foreground">
              Period: <span className="text-foreground font-bold">{periodLabel}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exportVATExcel}
            className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
            title="Export multi-sheet Excel with 9-Box VAT return and ledgers"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
            Excel (VAT Return)
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="font-semibold text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print Return
          </Button>
        </div>
      </div>

      {/* 4 Top Executive Stat Cards (VAT Model) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Box 1 - Output VAT */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-border/70 shadow-sm bg-gradient-to-br from-card to-blue-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Box 1: Output VAT</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black tabular-nums text-foreground">
            {currencySymbol} {outputVatDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Net Taxable Sales: <span className="font-semibold text-foreground">{currencySymbol} {gstSummaryStats.totalOutputTaxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>VAT on Sales & Outputs</span>
            <span className="font-bold text-blue-600">Box 1</span>
          </div>
        </Card>

        {/* Card 2: Box 4 - Input VAT Reclaimable */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-border/70 shadow-sm bg-gradient-to-br from-card to-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Box 4: Input VAT Reclaim</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            {currencySymbol} {inputVatReclaimed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Net Purchases: <span className="font-semibold text-foreground">{currencySymbol} {gstSummaryStats.totalInputTaxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>Reclaim on Purchases</span>
            <span className="font-bold text-emerald-600">Box 4</span>
          </div>
        </Card>

        {/* Card 3: Box 5 - Net VAT Payable / (Refund) */}
        <Card className={`p-4 sm:p-5 rounded-2xl border border-border/70 shadow-sm ${
          isRefundDue 
            ? 'bg-gradient-to-br from-card to-teal-500/10' 
            : 'bg-gradient-to-br from-card to-purple-500/5'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {isRefundDue ? 'Box 5: Net VAT Refund Due' : 'Box 5: Net VAT Payable'}
            </span>
            <span className={`p-2 rounded-xl ${isRefundDue ? 'bg-teal-500/10 text-teal-600' : 'bg-purple-500/10 text-purple-600'}`}>
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className={`mt-3 text-2xl font-black tabular-nums ${isRefundDue ? 'text-teal-600 dark:text-teal-400' : 'text-purple-600 dark:text-purple-400'}`}>
            {currencySymbol} {Math.abs(netVatPayable).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {isRefundDue ? (
              <span className="text-teal-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Reclaim from Tax Authorities
              </span>
            ) : (
              <span>Due to Tax Authorities</span>
            )}
          </div>
          <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>Box 3 minus Box 4</span>
            <span className="font-bold text-purple-600">Box 5</span>
          </div>
        </Card>

        {/* Card 4: Documents & Turnover */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-border/70 shadow-sm bg-gradient-to-br from-card to-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Box 6: Total Net Sales</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black tabular-nums text-foreground">
            {currencySymbol} {gstSummaryStats.totalOutputTaxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Invoices Issued: <span className="font-bold text-foreground">{gstSummaryStats.totalInvoicesIssued}</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>B2B: {gstSummaryStats.totalB2BInvoices} | B2C: {gstSummaryStats.totalB2CInvoices}</span>
            <span className="font-bold text-amber-600">Box 6</span>
          </div>
        </Card>
      </div>

      {/* Sub-Tab Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-border/60">
        {[
          { id: 'summary', label: '9-Box VAT Return Form', badge: 'Standard Layout', desc: 'HMRC / FTA / GCC Format' },
          { id: 'output', label: 'Output VAT Schedule', badge: `${gstr1B2BList.length + gstr1B2CSList.length} sales`, desc: 'Sales Invoices' },
          { id: 'input', label: 'Input VAT Schedule', badge: `${gstr2bList.length} bills`, desc: 'Purchases & Expenses' },
          { id: 'rates', label: 'VAT Rates Breakdown', badge: `${taxRates.length} bands`, desc: 'Standard & Reduced' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setVatSubTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              vatSubTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
              vatSubTab === tab.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-muted-foreground'
            }`}>
              {tab.badge}
            </span>
          </button>
        ))}
      </div>

      {/* Sub-View Content */}

      {/* 1. Standard 9-Box VAT Return Form */}
      {vatSubTab === 'summary' && (
        <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                Standard 9-Box VAT Return Statement
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Official filing boxes compliant with UK HMRC, UAE Federal Tax Authority (FTA), and international VAT jurisdictions
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              Period: {periodLabel}
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/70 bg-muted/30 text-muted-foreground font-semibold">
                  <th className="py-3 px-4 text-left w-20">Box #</th>
                  <th className="py-3 px-4 text-left">Description / Particulars</th>
                  <th className="py-3 px-4 text-left w-48">Classification</th>
                  <th className="py-3 px-4 text-right w-44">Amount ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr className="hover:bg-muted/20">
                  <td className="py-3 px-4 font-mono font-bold text-primary">Box 1</td>
                  <td className="py-3 px-4 font-medium text-foreground">
                    VAT due in this period on sales and other outputs
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">Output Tax (Sales)</td>
                  <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-foreground">
                    {currencySymbol} {outputVatDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="hover:bg-muted/20">
                  <td className="py-3 px-4 font-mono font-bold text-primary">Box 2</td>
                  <td className="py-3 px-4 font-medium text-foreground">
                    VAT due in this period on acquisitions / reverse-charge transactions
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">Acquisitions / Reverse Charge</td>
                  <td className="py-3 px-4 text-right font-mono font-medium tabular-nums text-muted-foreground">
                    {currencySymbol} 0.00
                  </td>
                </tr>
                <tr className="bg-blue-50/40 dark:bg-blue-950/20 font-bold border-t border-b border-blue-200 dark:border-blue-900/50">
                  <td className="py-3 px-4 font-mono text-blue-700 dark:text-blue-400">Box 3</td>
                  <td className="py-3 px-4 text-blue-900 dark:text-blue-300">
                    Total VAT due (sum of Box 1 and Box 2)
                  </td>
                  <td className="py-3 px-4 text-blue-700 dark:text-blue-400">Total Output Liability</td>
                  <td className="py-3 px-4 text-right font-mono text-blue-700 dark:text-blue-400 tabular-nums">
                    {currencySymbol} {outputVatDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="hover:bg-muted/20">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600">Box 4</td>
                  <td className="py-3 px-4 font-medium text-foreground">
                    VAT reclaimed in this period on purchases and other inputs (including acquisitions)
                  </td>
                  <td className="py-3 px-4 text-emerald-600">Allowable Input VAT</td>
                  <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-emerald-600">
                    {currencySymbol} {inputVatReclaimed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className={`font-black text-sm border-t-2 border-b-2 ${
                  isRefundDue 
                    ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300 border-teal-300' 
                    : 'bg-purple-50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-300 border-purple-300'
                }`}>
                  <td className="py-3.5 px-4 font-mono">Box 5</td>
                  <td className="py-3.5 px-4">
                    {isRefundDue 
                      ? 'Net VAT to be reclaimed from tax authorities (Box 4 minus Box 3)' 
                      : 'Net VAT to be paid to tax authorities (Box 3 minus Box 4)'}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge className={isRefundDue ? 'bg-teal-600 text-white' : 'bg-purple-600 text-white'}>
                      {isRefundDue ? 'REFUND DUE' : 'NET PAYABLE'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-base">
                    {currencySymbol} {Math.abs(netVatPayable).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="hover:bg-muted/20">
                  <td className="py-3 px-4 font-mono font-bold text-muted-foreground">Box 6</td>
                  <td className="py-3 px-4 font-medium text-foreground">
                    Total value of sales and all other outputs excluding any VAT
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">Net Sales Turnover</td>
                  <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-foreground">
                    {currencySymbol} {gstSummaryStats.totalOutputTaxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="hover:bg-muted/20">
                  <td className="py-3 px-4 font-mono font-bold text-muted-foreground">Box 7</td>
                  <td className="py-3 px-4 font-medium text-foreground">
                    Total value of purchases and all other inputs excluding any VAT
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">Net Purchases / Expenses</td>
                  <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-foreground">
                    {currencySymbol} {gstSummaryStats.totalInputTaxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="hover:bg-muted/20">
                  <td className="py-3 px-4 font-mono font-bold text-muted-foreground">Box 8</td>
                  <td className="py-3 px-4 font-medium text-foreground">
                    Total value of all supplies of goods and related services to other countries / zero-rated exports
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">Zero-Rated Exports</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-muted-foreground">
                    {currencySymbol} 0.00
                  </td>
                </tr>
                <tr className="hover:bg-muted/20">
                  <td className="py-3 px-4 font-mono font-bold text-muted-foreground">Box 9</td>
                  <td className="py-3 px-4 font-medium text-foreground">
                    Total value of all acquisitions of goods and related services from other countries
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">Imports & Acquisitions</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-muted-foreground">
                    {currencySymbol} 0.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 2. Output VAT Schedule */}
      {vatSubTab === 'output' && (
        <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                Output VAT Schedule (Sales Invoices)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Itemized breakdown of VAT charged on customer invoices during the period
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search invoice or customer..."
                value={outputSearch}
                onChange={(e) => setOutputSearch(e.target.value)}
                className="pl-8 h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/70 bg-muted/30 text-muted-foreground font-semibold">
                  <th className="py-3 px-4 text-left">Invoice #</th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Customer Name</th>
                  <th className="py-3 px-4 text-left">{businessCountry.taxIdLabel}</th>
                  <th className="py-3 px-4 text-right">Taxable Value ({currencySymbol})</th>
                  <th className="py-3 px-4 text-center">VAT Rate</th>
                  <th className="py-3 px-4 text-right">VAT Amount ({currencySymbol})</th>
                  <th className="py-3 px-4 text-right">Total Gross ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredOutputList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No sales invoices recorded in this period.
                    </td>
                  </tr>
                ) : (
                  filteredOutputList.map((item, idx) => {
                    const vatAmount = item.integratedTax + item.centralTax + item.stateTax;
                    return (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="py-3 px-4 font-mono font-bold text-primary">{item.invoiceNumber}</td>
                        <td className="py-3 px-4 text-muted-foreground">{safelyToLocaleDate(item.invoiceDate)}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">{item.customerName}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{item.gstin || 'B2C / Consumer'}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          {currencySymbol} {item.taxableValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {item.taxRate}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-blue-600 tabular-nums">
                          {currencySymbol} {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-foreground tabular-nums">
                          {currencySymbol} {item.invoiceValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredOutputList.length > 0 && (
                <tfoot>
                  <tr className="bg-muted/40 font-bold border-t border-border">
                    <td colSpan={4} className="py-3 px-4 text-foreground uppercase tracking-wider text-[11px]">
                      Total Output VAT (Box 1)
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {currencySymbol} {filteredOutputList.reduce((acc, i) => acc + (i.taxableValue || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td></td>
                    <td className="py-3 px-4 text-right font-mono text-blue-600 tabular-nums">
                      {currencySymbol} {filteredOutputList.reduce((acc, i) => acc + (i.integratedTax + i.centralTax + i.stateTax || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-foreground tabular-nums">
                      {currencySymbol} {filteredOutputList.reduce((acc, i) => acc + (i.invoiceValue || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      )}

      {/* 3. Input VAT Schedule */}
      {vatSubTab === 'input' && (
        <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Input VAT Schedule (Purchases & Expenses)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Detailed ledger of input tax reclaimed on business supplier invoices and expenses
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vendor or bill..."
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
                className="pl-8 h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/70 bg-muted/30 text-muted-foreground font-semibold">
                  <th className="py-3 px-4 text-left">Bill / Ref #</th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Supplier Name</th>
                  <th className="py-3 px-4 text-left">Supplier {businessCountry.taxIdLabel}</th>
                  <th className="py-3 px-4 text-right">Taxable Purchases ({currencySymbol})</th>
                  <th className="py-3 px-4 text-right">Input VAT Reclaimed ({currencySymbol})</th>
                  <th className="py-3 px-4 text-right">Total Gross ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredInputList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No purchase bills or business expenses recorded in this period.
                    </td>
                  </tr>
                ) : (
                  filteredInputList.map((item, idx) => {
                    const vatAmount = item.integratedTax + item.centralTax + item.stateTax;
                    return (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600">{item.invoiceNumber}</td>
                        <td className="py-3 px-4 text-muted-foreground">{safelyToLocaleDate(item.invoiceDate)}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">{item.vendorName}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{item.vendorGstin || 'Not Provided'}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          {currencySymbol} {item.taxableValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 tabular-nums">
                          {currencySymbol} {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-foreground tabular-nums">
                          {currencySymbol} {item.invoiceValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredInputList.length > 0 && (
                <tfoot>
                  <tr className="bg-muted/40 font-bold border-t border-border">
                    <td colSpan={4} className="py-3 px-4 text-foreground uppercase tracking-wider text-[11px]">
                      Total Input VAT Reclaim (Box 4)
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {currencySymbol} {filteredInputList.reduce((acc, i) => acc + (i.taxableValue || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 tabular-nums">
                      {currencySymbol} {filteredInputList.reduce((acc, i) => acc + (i.integratedTax + i.centralTax + i.stateTax || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-foreground tabular-nums">
                      {currencySymbol} {filteredInputList.reduce((acc, i) => acc + (i.invoiceValue || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      )}

      {/* 4. VAT Rates Breakdown */}
      {vatSubTab === 'rates' && (
        <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border/60 bg-muted/20">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              VAT Rates Breakdown & Tax Bands
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Turnover and VAT distribution across standard, reduced, and zero rate bands for {businessCountry.countryName}
            </p>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Standard Rate Band */}
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase text-indigo-700 dark:text-indigo-400">
                  Standard Rate ({businessCountry.standardTaxRate}%)
                </span>
                <Badge className="bg-indigo-600 text-white font-mono text-[10px]">Active</Badge>
              </div>
              <div className="text-xl font-black text-foreground">
                {currencySymbol} {outputVatDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Net Taxable: {currencySymbol} {gstSummaryStats.totalOutputTaxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Zero-Rated / Exempt */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase text-muted-foreground">
                  Zero-Rated (0%) & Exempt
                </span>
                <Badge variant="outline" className="font-mono text-[10px]">0%</Badge>
              </div>
              <div className="text-xl font-black text-foreground">
                {currencySymbol} 0.00
              </div>
              <p className="text-xs text-muted-foreground">
                Supplies to overseas buyers or exempt goods
              </p>
            </div>

            {/* Net Effective VAT Rate */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase text-emerald-700 dark:text-emerald-400">
                  Net Tax Position
                </span>
                <Badge className={isRefundDue ? "bg-teal-600 text-white" : "bg-emerald-600 text-white"}>
                  {isRefundDue ? 'Reclaimable' : 'Payable'}
                </Badge>
              </div>
              <div className="text-xl font-black text-foreground">
                {currencySymbol} {Math.abs(netVatPayable).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Net obligation after offsetting {currencySymbol} {inputVatReclaimed.toFixed(2)} input tax
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

