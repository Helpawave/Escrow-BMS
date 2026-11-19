import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { safelyToLocaleDate } from '@/utils/dateUtils';
import { fmtRs, drawReportHeader, outputPdf } from './pdfCommon';
import {
  GSTR1B2BItem,
  GSTR1B2CSItem,
  GSTR1DocSummary,
  GSTR1HSNItem,
  GSTR2BITCItem,
  GSTR3BTable31,
  GSTR3BTable4,
  GSTR3BTable61,
  CMP08Item,
  GSTR9AnnualItem,
} from '../types';

export interface GstExportContext {
  companyProfile?: any;
  profile?: any;
  startDate?: string;
  endDate?: string;
  dateRange: string;
  gstSummaryStats: {
    totalOutputTax: number;
    totalOutputTaxable: number;
    outputIGST: number;
    outputCGST: number;
    outputSGST: number;
    totalInputTax: number;
    totalInputTaxable: number;
    inputIGST?: number;
    inputCGST?: number;
    inputSGST?: number;
    netCashPayable: number;
    totalInvoicesIssued: number;
    totalB2BInvoices: number;
    totalB2CInvoices: number;
  };
  gstr1B2BList: GSTR1B2BItem[];
  gstr1B2CLList: any[];
  gstr1B2CSList: GSTR1B2CSItem[];
  gstr1HSNList: GSTR1HSNItem[];
  gstr1DocSummary: GSTR1DocSummary[];
  gstr2bList: GSTR2BITCItem[];
  gstr3bTable31: GSTR3BTable31[];
  gstr3bTable4: GSTR3BTable4[];
  gstr3bTable61: GSTR3BTable61[];
  cmp08Data: CMP08Item[];
  gstr9Data: GSTR9AnnualItem[];
}

export const exportAllGSTExcel = (ctx: GstExportContext) => {
  const {
    companyProfile,
    profile,
    startDate,
    endDate,
    dateRange,
    gstSummaryStats,
    gstr1B2BList,
    gstr1B2CLList,
    gstr1B2CSList,
    gstr1HSNList,
    gstr1DocSummary,
    gstr2bList,
    gstr3bTable31,
    gstr3bTable4,
    gstr3bTable61,
    cmp08Data,
    gstr9Data,
  } = ctx;

  try {
    const workbook = XLSX.utils.book_new();
    const compName = companyProfile?.company_name || profile?.company_name || 'My Business';
    const compGstin = companyProfile?.gstin || profile?.gstin || 'N/A';
    const period =
      startDate && endDate
        ? `${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`
        : dateRange.replace('_', ' ').toUpperCase();

    // Sheet 1: GST Overview / Net Tax Summary
    const summaryRows = [
      ['GOVERNMENT OF INDIA - GOODS & SERVICES TAX RETURNS REPORT'],
      [`Taxpayer Legal / Trade Name: ${compName}`],
      [`GSTIN: ${compGstin}`],
      [`Period: ${period}`],
      [`Generated on: ${safelyToLocaleDate(new Date())}`],
      [],
      ['Return Section / Metric', 'Taxable Value (₹)', 'IGST (₹)', 'CGST (₹)', 'SGST (₹)', 'Total Tax (₹)'],
      [
        'Gross Outward Tax Liability (GSTR-1 / GSTR-3B Table 3.1)',
        gstSummaryStats.totalOutputTaxable,
        gstSummaryStats.outputIGST,
        gstSummaryStats.outputCGST,
        gstSummaryStats.outputSGST,
        gstSummaryStats.totalOutputTax,
      ],
      [
        'Eligible Input Tax Credit Available (GSTR-2B / Table 4)',
        gstSummaryStats.totalInputTaxable,
        gstSummaryStats.inputIGST ?? 0,
        gstSummaryStats.inputCGST ?? 0,
        gstSummaryStats.inputSGST ?? 0,
        gstSummaryStats.totalInputTax,
      ],
      [
        'Net Cash Tax Payable (Table 6.1)',
        '-',
        Math.max(0, gstSummaryStats.outputIGST - (gstSummaryStats.inputIGST ?? 0)),
        Math.max(0, gstSummaryStats.outputCGST - (gstSummaryStats.inputCGST ?? 0)),
        Math.max(0, gstSummaryStats.outputSGST - (gstSummaryStats.inputSGST ?? 0)),
        gstSummaryStats.netCashPayable,
      ],
      [],
      ['Document Counts Summary', 'Count'],
      ['Total Invoices Issued', gstSummaryStats.totalInvoicesIssued],
      ['B2B Tax Invoices', gstSummaryStats.totalB2BInvoices],
      ['B2C Supplies (Small & Large)', gstSummaryStats.totalB2CInvoices],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
    summarySheet['!cols'] = [{ wch: 45 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'GST Summary');

    // Sheet 2: GSTR-1 B2B (Table 4A, 4B, 6B, 6C)
    const b2bHeaders = [
      'GSTIN/UIN of Recipient',
      'Receiver Name',
      'Invoice Number',
      'Invoice Date',
      'Invoice Value',
      'Place Of Supply',
      'Reverse Charge',
      'Applicable % of Tax Rate',
      'Invoice Type',
      'E-Commerce GSTIN',
      'Rate',
      'Taxable Value',
      'Integrated Tax',
      'Central Tax',
      'State/UT Tax',
      'Cess',
    ];
    const b2bRows = gstr1B2BList.map((item) => [
      item.gstin,
      item.clientName,
      item.invoiceNumber,
      item.invoiceDate,
      item.invoiceValue,
      item.placeOfSupply,
      item.reverseCharge,
      '',
      'Regular',
      '',
      item.taxRate,
      item.taxableValue,
      item.integratedTax,
      item.centralTax,
      item.stateTax,
      0,
    ]);
    const b2bSheet = XLSX.utils.aoa_to_sheet([b2bHeaders, ...b2bRows]);
    XLSX.utils.book_append_sheet(workbook, b2bSheet, 'b2b');

    // Sheet 3: GSTR-1 B2CL (Large)
    const b2clHeaders = [
      'Invoice Number',
      'Invoice Date',
      'Invoice Value',
      'Place Of Supply',
      'Applicable % of Tax Rate',
      'Rate',
      'Taxable Value',
      'Integrated Tax',
      'Cess',
    ];
    const b2clRows = gstr1B2CLList.map((item) => [
      item.invoiceNumber,
      item.invoiceDate,
      item.invoiceValue,
      item.placeOfSupply,
      '',
      item.taxRate,
      item.taxableValue,
      item.integratedTax,
      0,
    ]);
    const b2clSheet = XLSX.utils.aoa_to_sheet([b2clHeaders, ...b2clRows]);
    XLSX.utils.book_append_sheet(workbook, b2clSheet, 'b2cl');

    // Sheet 4: GSTR-1 B2CS (Small)
    const b2csHeaders = [
      'Type',
      'Place Of Supply',
      'Applicable % of Tax Rate',
      'Rate',
      'Taxable Value',
      'Integrated Tax',
      'Central Tax',
      'State/UT Tax',
      'Cess',
    ];
    const b2csRows = gstr1B2CSList.map((item) => [
      'OE',
      item.placeOfSupply,
      '',
      item.taxRate,
      item.taxableValue,
      item.integratedTax,
      item.centralTax,
      item.stateTax,
      0,
    ]);
    const b2csSheet = XLSX.utils.aoa_to_sheet([b2csHeaders, ...b2csRows]);
    XLSX.utils.book_append_sheet(workbook, b2csSheet, 'b2cs');

    // Sheet 5: GSTR-1 HSN Summary (Table 12)
    const hsnHeaders = [
      'HSN',
      'Description',
      'UQC',
      'Total Quantity',
      'Total Value',
      'Taxable Value',
      'Integrated Tax Amount',
      'Central Tax Amount',
      'State/UT Tax Amount',
      'Cess Amount',
    ];
    const hsnRows = gstr1HSNList.map((item) => [
      item.hsnCode,
      item.description,
      item.uqc,
      item.totalQuantity,
      item.totalValue,
      item.taxableValue,
      item.integratedTax,
      item.centralTax,
      item.stateTax,
      0,
    ]);
    const hsnSheet = XLSX.utils.aoa_to_sheet([hsnHeaders, ...hsnRows]);
    XLSX.utils.book_append_sheet(workbook, hsnSheet, 'hsn');

    // Sheet 6: GSTR-1 Docs Issued (Table 13)
    const docHeaders = [
      'Nature of Document',
      'Sr. No. From',
      'Sr. No. To',
      'Total Number',
      'Cancelled',
      'Net Issued',
    ];
    const docRows = gstr1DocSummary.map((item) => [
      item.docType,
      item.fromSerial,
      item.toSerial,
      item.totalCount,
      item.cancelledCount,
      item.netIssued,
    ]);
    const docSheet = XLSX.utils.aoa_to_sheet([docHeaders, ...docRows]);
    XLSX.utils.book_append_sheet(workbook, docSheet, 'docs');

    // Sheet 7: GSTR-2B Inward ITC
    const itcHeaders = [
      'Vendor GSTIN',
      'Vendor Legal Name',
      'Invoice / Bill #',
      'Invoice Date',
      'Invoice Value',
      'Taxable Value',
      'Integrated Tax',
      'Central Tax',
      'State/UT Tax',
      'ITC Available',
    ];
    const itcRows = gstr2bList.map((item) => [
      item.vendorGstin,
      item.vendorName,
      item.invoiceNumber,
      item.invoiceDate,
      item.invoiceValue,
      item.taxableValue,
      item.integratedTax,
      item.centralTax,
      item.stateTax,
      item.itcAvailable,
    ]);
    const itcSheet = XLSX.utils.aoa_to_sheet([itcHeaders, ...itcRows]);
    XLSX.utils.book_append_sheet(workbook, itcSheet, 'GSTR2B_ITC');

    // Sheet 8: GSTR-3B Return
    const gstr3bHeaders = [
      'Section / Table',
      'Description',
      'Taxable Value',
      'Integrated Tax',
      'Central Tax',
      'State/UT Tax',
    ];
    const gstr3bRows = [
      ...gstr3bTable31.map((row) => [
        'Table 3.1 Outward',
        row.description,
        row.taxableValue,
        row.integratedTax,
        row.centralTax,
        row.stateTax,
      ]),
      ...gstr3bTable4.map((row) => [
        'Table 4 ITC',
        row.description,
        '-',
        row.integratedTax,
        row.centralTax,
        row.stateTax,
      ]),
      ...gstr3bTable61.map((row) => [
        'Table 6.1 Net Tax',
        `${row.taxType} (Paid in Cash: ₹${row.taxPaidCash.toFixed(2)})`,
        '-',
        row.taxType.includes('IGST') ? row.totalTaxPayable : 0,
        row.taxType.includes('CGST') ? row.totalTaxPayable : 0,
        row.taxType.includes('SGST') ? row.totalTaxPayable : 0,
      ]),
    ];
    const gstr3bSheet = XLSX.utils.aoa_to_sheet([gstr3bHeaders, ...gstr3bRows]);
    XLSX.utils.book_append_sheet(workbook, gstr3bSheet, 'GSTR3B');

    // Sheet 9: CMP-08 Composition Scheme
    const cmpHeaders = ['Table', 'Description', 'Value', 'Integrated Tax', 'Central Tax', 'State Tax'];
    const cmpRows = cmp08Data.map((row, idx) => [
      `Item ${idx + 1}`,
      row.description,
      row.value,
      row.integratedTax,
      row.centralTax,
      row.stateTax,
    ]);
    const cmpSheet = XLSX.utils.aoa_to_sheet([cmpHeaders, ...cmpRows]);
    XLSX.utils.book_append_sheet(workbook, cmpSheet, 'CMP-08');

    // Sheet 10: GSTR-9 / 9C Annual
    const gstr9Headers = [
      'Table No',
      'Nature of Supplies / Description',
      'Taxable Value',
      'Integrated Tax',
      'Central Tax',
      'State Tax',
    ];
    const gstr9Rows = gstr9Data.map((row) => [
      row.tableNumber,
      row.description,
      row.taxableValue,
      row.integratedTax,
      row.centralTax,
      row.stateTax,
    ]);
    const gstr9Sheet = XLSX.utils.aoa_to_sheet([gstr9Headers, ...gstr9Rows]);
    XLSX.utils.book_append_sheet(workbook, gstr9Sheet, 'GSTR-9_Annual');

    XLSX.writeFile(workbook, `GST-Returns-${compGstin}-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Complete GST Returns Excel workbook downloaded successfully.');
  } catch (err) {
    console.error('Error exporting GST Excel:', err);
    toast.error('Failed to generate GST Excel.');
  }
};

export const exportIndividualGSTR1Excel = (ctx: GstExportContext) => {
  const {
    companyProfile,
    profile,
    gstr1B2BList,
    gstr1B2CLList,
    gstr1B2CSList,
    gstr1HSNList,
    gstr1DocSummary,
  } = ctx;

  try {
    const compGstin = (companyProfile?.gstin || profile?.gstin || 'URP').trim().toUpperCase();
    const compName = companyProfile?.company_name || profile?.company_name || 'My Company';
    const dateStr = new Date().toISOString().split('T')[0];
    const workbook = XLSX.utils.book_new();

    const summaryRows = [
      ['GSTR-1 OUTWARD SUPPLIES RETURN'],
      [`Taxpayer: ${compName}`],
      [`GSTIN: ${compGstin}`],
      [`Generated: ${safelyToLocaleDate(new Date())}`],
      [],
      ['Metric', 'Value (₹)'],
      ['Total B2B Invoices', gstr1B2BList.length],
      ['B2B Taxable Value', gstr1B2BList.reduce((s, i) => s + i.taxableValue, 0)],
      ['Total B2CL Invoices', gstr1B2CLList.length],
      ['Total B2CS Supplies', gstr1B2CSList.length],
      ['HSN Summary Records', gstr1HSNList.length],
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), 'GSTR1_Overview');

    const b2bHeaders = [
      'GSTIN/UIN of Recipient',
      'Receiver Name',
      'Invoice Number',
      'Invoice Date',
      'Invoice Value',
      'Place Of Supply',
      'Reverse Charge',
      'Rate',
      'Taxable Value',
      'Integrated Tax',
      'Central Tax',
      'State/UT Tax',
      'Cess',
    ];
    const b2bRows = gstr1B2BList.map((item) => [
      item.gstin,
      item.clientName,
      item.invoiceNumber,
      item.invoiceDate,
      item.invoiceValue,
      item.placeOfSupply,
      item.reverseCharge,
      item.taxRate,
      item.taxableValue,
      item.integratedTax,
      item.centralTax,
      item.stateTax,
      0,
    ]);
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([b2bHeaders, ...b2bRows]), 'b2b');

    const b2clHeaders = [
      'Invoice Number',
      'Invoice Date',
      'Invoice Value',
      'Place Of Supply',
      'Rate',
      'Taxable Value',
      'Integrated Tax',
      'Cess',
    ];
    const b2clRows = gstr1B2CLList.map((item) => [
      item.invoiceNumber,
      item.invoiceDate,
      item.invoiceValue,
      item.placeOfSupply,
      item.taxRate,
      item.taxableValue,
      item.integratedTax,
      0,
    ]);
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([b2clHeaders, ...b2clRows]), 'b2cl');

    const b2csHeaders = [
      'Type',
      'Place Of Supply',
      'Rate',
      'Taxable Value',
      'Integrated Tax',
      'Central Tax',
      'State/UT Tax',
      'Cess',
    ];
    const b2csRows = gstr1B2CSList.map((item) => [
      'OE',
      item.placeOfSupply,
      item.taxRate,
      item.taxableValue,
      item.integratedTax,
      item.centralTax,
      item.stateTax,
      0,
    ]);
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([b2csHeaders, ...b2csRows]), 'b2cs');

    const hsnHeaders = [
      'HSN',
      'Description',
      'UQC',
      'Total Quantity',
      'Total Value',
      'Taxable Value',
      'Integrated Tax Amount',
      'Central Tax Amount',
      'State/UT Tax Amount',
      'Cess Amount',
    ];
    const hsnRows = gstr1HSNList.map((item) => [
      item.hsnCode,
      item.description,
      item.uqc,
      item.totalQuantity,
      item.totalValue,
      item.taxableValue,
      item.integratedTax,
      item.centralTax,
      item.stateTax,
      0,
    ]);
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([hsnHeaders, ...hsnRows]), 'hsn');

    const docHeaders = [
      'Nature of Document',
      'Sr. No. From',
      'Sr. No. To',
      'Total Number',
      'Cancelled',
      'Net Issued',
    ];
    const docRows = gstr1DocSummary.map((item) => [
      item.docType,
      item.fromSerial,
      item.toSerial,
      item.totalCount,
      item.cancelledCount,
      item.netIssued,
    ]);
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([docHeaders, ...docRows]), 'docs');

    XLSX.writeFile(workbook, `GSTR-1_${compGstin}_${dateStr}.xlsx`);
    toast.success('Standalone GSTR-1 workbook downloaded.');
  } catch (err) {
    console.error(err);
    toast.error('Failed to export GSTR-1 Excel.');
  }
};

export const exportIndividualGSTR2BExcel = (ctx: GstExportContext) => {
  const { companyProfile, profile, gstr2bList } = ctx;
  try {
    const compGstin = (companyProfile?.gstin || profile?.gstin || 'URP').trim().toUpperCase();
    const dateStr = new Date().toISOString().split('T')[0];
    const workbook = XLSX.utils.book_new();

    const itcHeaders = [
      'Vendor GSTIN',
      'Vendor Legal Name',
      'Invoice / Bill #',
      'Invoice Date',
      'Invoice Value',
      'Taxable Value',
      'Integrated Tax',
      'Central Tax',
      'State/UT Tax',
      'ITC Available',
    ];
    const itcRows = gstr2bList.map((item) => [
      item.vendorGstin,
      item.vendorName,
      item.invoiceNumber,
      item.invoiceDate,
      item.invoiceValue,
      item.taxableValue,
      item.integratedTax,
      item.centralTax,
      item.stateTax,
      item.itcAvailable,
    ]);
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([itcHeaders, ...itcRows]), 'GSTR-2B_Inward_ITC');

    XLSX.writeFile(workbook, `GSTR-2B_ITC_${compGstin}_${dateStr}.xlsx`);
    toast.success('Standalone GSTR-2B Inward ITC report downloaded.');
  } catch (err) {
    toast.error('Failed to export GSTR-2B Excel.');
  }
};

export const exportIndividualGSTR2BPDF = async (ctx: GstExportContext) => {
  const { companyProfile, profile, gstr2bList, gstSummaryStats } = ctx;
  try {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const compName = companyProfile?.company_name || profile?.company_name || 'TAXPAYER';
    const compGstin = companyProfile?.gstin || profile?.gstin || 'GSTIN';
    const dateStr = new Date().toISOString().split('T')[0];

    drawReportHeader(
      doc,
      'GSTR-2B Inward ITC Statement',
      'Auto-drafted Input Tax Credit Statement for Inward Supplies & Purchases',
      `Generated: ${safelyToLocaleDate(new Date())}`,
      pageWidth,
      compName,
      compGstin,
      [16, 185, 129]
    );

    const tableData = gstr2bList.map((item) => [
      item.vendorGstin,
      item.vendorName.slice(0, 22),
      item.invoiceNumber,
      item.invoiceDate,
      fmtRs(item.taxableValue),
      fmtRs(item.integratedTax),
      fmtRs(item.centralTax),
      fmtRs(item.stateTax),
      fmtRs(item.integratedTax + item.centralTax + item.stateTax),
    ]);

    autoTable(doc, {
      head: [
        ['Vendor GSTIN', 'Vendor Name', 'Bill / Inv #', 'Date', 'Taxable Val', 'IGST', 'CGST', 'SGST', 'Total ITC'],
      ],
      body: tableData,
      startY: 45,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      foot: [
        [
          'Total',
          '',
          '',
          '',
          fmtRs(gstSummaryStats.totalInputTaxable),
          fmtRs(gstSummaryStats.inputIGST ?? 0),
          fmtRs(gstSummaryStats.inputCGST ?? 0),
          fmtRs(gstSummaryStats.inputSGST ?? 0),
          fmtRs(gstSummaryStats.totalInputTax),
        ],
      ],
      footStyles: { fillColor: [240, 253, 244], textColor: [22, 101, 52], fontStyle: 'bold', fontSize: 8 },
    });

    doc.save(`GSTR-2B_ITC_${compGstin}_${dateStr}.pdf`);
    toast.success('Standalone GSTR-2B PDF statement exported.');
  } catch (err) {
    toast.error('Failed to export GSTR-2B PDF.');
  }
};

export const exportIndividualGSTR3BExcel = (ctx: GstExportContext) => {
  const { companyProfile, profile, gstr3bTable31, gstr3bTable4, gstr3bTable61 } = ctx;
  try {
    const compGstin = (companyProfile?.gstin || profile?.gstin || 'URP').trim().toUpperCase();
    const dateStr = new Date().toISOString().split('T')[0];
    const workbook = XLSX.utils.book_new();

    const gstr3bHeaders = [
      'Section / Table',
      'Description',
      'Taxable Value',
      'Integrated Tax',
      'Central Tax',
      'State/UT Tax',
    ];
    const gstr3bRows = [
      ...gstr3bTable31.map((row) => [
        'Table 3.1 Outward',
        row.description,
        row.taxableValue,
        row.integratedTax,
        row.centralTax,
        row.stateTax,
      ]),
      ...gstr3bTable4.map((row) => [
        'Table 4 ITC',
        row.description,
        '-',
        row.integratedTax,
        row.centralTax,
        row.stateTax,
      ]),
      ...gstr3bTable61.map((row) => [
        'Table 6.1 Net Tax',
        `${row.taxType} (Cash: ₹${row.taxPaidCash.toFixed(2)})`,
        '-',
        row.taxType.includes('IGST') ? row.totalTaxPayable : 0,
        row.taxType.includes('CGST') ? row.totalTaxPayable : 0,
        row.taxType.includes('SGST') ? row.totalTaxPayable : 0,
      ]),
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([gstr3bHeaders, ...gstr3bRows]), 'GSTR-3B_Return');

    XLSX.writeFile(workbook, `GSTR-3B_${compGstin}_${dateStr}.xlsx`);
    toast.success('Standalone GSTR-3B Return workbook downloaded.');
  } catch (err) {
    toast.error('Failed to export GSTR-3B Excel.');
  }
};

export const exportIndividualGSTR3BPDF = async (ctx: GstExportContext) => {
  const { companyProfile, profile, gstr3bTable31, gstr3bTable61 } = ctx;
  try {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const compName = companyProfile?.company_name || profile?.company_name || 'TAXPAYER';
    const compGstin = companyProfile?.gstin || profile?.gstin || 'GSTIN';
    const dateStr = new Date().toISOString().split('T')[0];

    drawReportHeader(
      doc,
      'Form GSTR-3B Monthly Return',
      'Summary Statement of Outward Supplies, ITC Claimed and Net Tax Payment',
      `Period: ${ctx.startDate ? `${ctx.startDate} to ${ctx.endDate}` : safelyToLocaleDate(new Date())}`,
      pageWidth,
      compName,
      compGstin,
      [147, 51, 234]
    );

    autoTable(doc, {
      head: [['Table 3.1 Outward Supplies', 'Taxable Val', 'IGST', 'CGST', 'SGST']],
      body: gstr3bTable31.map((r) => [
        r.description,
        fmtRs(r.taxableValue),
        fmtRs(r.integratedTax),
        fmtRs(r.centralTax),
        fmtRs(r.stateTax),
      ]),
      startY: 45,
      theme: 'striped',
      headStyles: { fillColor: [147, 51, 234], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 120;
    autoTable(doc, {
      head: [['Table 6.1 Tax Paid in Cash', 'Total Payable', 'Paid via ITC', 'Paid in Cash']],
      body: gstr3bTable61.map((r) => [r.taxType, fmtRs(r.totalTaxPayable), fmtRs(r.itcPaid), fmtRs(r.taxPaidCash)]),
      startY: finalY + 8,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
    });

    doc.save(`GSTR-3B_${compGstin}_${dateStr}.pdf`);
    toast.success('Standalone GSTR-3B Return PDF exported.');
  } catch (err) {
    toast.error('Failed to export GSTR-3B PDF.');
  }
};

export const exportIndividualCMP08Excel = (ctx: GstExportContext) => {
  const { companyProfile, profile, cmp08Data } = ctx;
  try {
    const compGstin = (companyProfile?.gstin || profile?.gstin || 'URP').trim().toUpperCase();
    const dateStr = new Date().toISOString().split('T')[0];
    const workbook = XLSX.utils.book_new();

    const cmpHeaders = [
      'Table',
      'Description',
      'Value (₹)',
      'Integrated Tax',
      'Central Tax (0.5%)',
      'State Tax (0.5%)',
      'Total Tax (1%)',
    ];
    const cmpRows = cmp08Data.map((row, idx) => [
      `Item ${idx + 1}`,
      row.description,
      row.value,
      row.integratedTax,
      row.centralTax,
      row.stateTax,
      row.centralTax + row.stateTax,
    ]);
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([cmpHeaders, ...cmpRows]), 'CMP-08');

    XLSX.writeFile(workbook, `CMP-08_${compGstin}_${dateStr}.xlsx`);
    toast.success('Standalone CMP-08 Composition Scheme report downloaded.');
  } catch (err) {
    toast.error('Failed to export CMP-08 Excel.');
  }
};

export const exportIndividualGSTR9Excel = (ctx: GstExportContext) => {
  const { companyProfile, profile, gstr9Data } = ctx;
  try {
    const compGstin = (companyProfile?.gstin || profile?.gstin || 'URP').trim().toUpperCase();
    const dateStr = new Date().toISOString().split('T')[0];
    const workbook = XLSX.utils.book_new();

    const gstr9Headers = [
      'Table No',
      'Nature of Supplies / Description',
      'Taxable Value',
      'Integrated Tax',
      'Central Tax',
      'State Tax',
    ];
    const gstr9Rows = gstr9Data.map((row) => [
      row.tableNumber,
      row.description,
      row.taxableValue,
      row.integratedTax,
      row.centralTax,
      row.stateTax,
    ]);
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([gstr9Headers, ...gstr9Rows]), 'GSTR-9_Annual');

    XLSX.writeFile(workbook, `GSTR-9_Annual_${compGstin}_${dateStr}.xlsx`);
    toast.success('Standalone GSTR-9/9C Annual Reconciliation report downloaded.');
  } catch (err) {
    toast.error('Failed to export GSTR-9 Excel.');
  }
};

export const exportIndividualGSTR9PDF = async (ctx: GstExportContext) => {
  const { companyProfile, profile, gstr9Data } = ctx;
  try {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const compName = companyProfile?.company_name || profile?.company_name || 'TAXPAYER';
    const compGstin = companyProfile?.gstin || profile?.gstin || 'GSTIN';
    const dateStr = new Date().toISOString().split('T')[0];

    drawReportHeader(
      doc,
      'GSTR-9 & 9C Annual Reconciliation Statement',
      'Consolidated Annual Return & Reconciliation with Financial Books',
      `Year: ${new Date().getFullYear()}`,
      pageWidth,
      compName,
      compGstin,
      [99, 102, 241]
    );

    autoTable(doc, {
      head: [['Table #', 'Nature of Supplies / Description', 'Taxable Val', 'IGST', 'CGST', 'SGST']],
      body: gstr9Data.map((r) => [
        r.tableNumber,
        r.description,
        fmtRs(r.taxableValue),
        fmtRs(r.integratedTax),
        fmtRs(r.centralTax),
        fmtRs(r.stateTax),
      ]),
      startY: 45,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
    });

    doc.save(`GSTR-9_Annual_${compGstin}_${dateStr}.pdf`);
    toast.success('Standalone GSTR-9/9C Annual PDF report exported.');
  } catch (err) {
    toast.error('Failed to export GSTR-9 PDF.');
  }
};

export const exportGSTR1JSON = (ctx: GstExportContext) => {
  const {
    companyProfile,
    profile,
    startDate,
    endDate,
    gstr1B2BList,
    gstr1B2CLList,
    gstr1B2CSList,
    gstr1HSNList,
    gstr1DocSummary,
  } = ctx;

  try {
    const compGstin = (companyProfile?.gstin || profile?.gstin || 'URP').trim().toUpperCase();

    if (startDate && endDate) {
      const [startYear, startMonth] = startDate.split('-');
      const [endYear, endMonth] = endDate.split('-');
      if (startYear !== endYear || startMonth !== endMonth) {
        toast.error('Multi-month export not allowed. GST portal requires GSTR-1 JSON for a single tax period (MMYYYY). Please select dates within a single calendar month.');
        return;
      }
    }

    const currentPeriod = startDate
      ? `${startDate.split('-')[1]}${startDate.split('-')[0]}`
      : `${String(new Date().getMonth() + 1).padStart(2, '0')}${new Date().getFullYear()}`;

    // Group B2B by recipient GSTIN for GST portal schema
    const b2bByGstin: Record<string, any> = {};
    gstr1B2BList.forEach((item) => {
      if (!b2bByGstin[item.gstin]) {
        b2bByGstin[item.gstin] = {
          ctin: item.gstin,
          inv: [],
        };
      }
      b2bByGstin[item.gstin].inv.push({
        inum: item.invoiceNumber,
        idt: item.invoiceDate.split('-').reverse().join('-'), // DD-MM-YYYY
        val: item.invoiceValue,
        pos: item.placeOfSupply.split('-')[0],
        rchrg: item.reverseCharge,
        inv_typ: 'R',
        itms: [
          {
            num: 1,
            itm_det: {
              rt: item.taxRate,
              txval: item.taxableValue,
              iamt: item.integratedTax,
              camt: item.centralTax,
              samt: item.stateTax,
              csamt: 0,
            },
          },
        ],
      });
    });

    const b2csJson = gstr1B2CSList.map((item) => ({
      sply_ty: item.integratedTax > 0 ? 'INTER' : 'INTRA',
      pos: item.placeOfSupply.split('-')[0],
      typ: 'OE',
      rt: item.taxRate,
      txval: item.taxableValue,
      iamt: item.integratedTax,
      camt: item.centralTax,
      samt: item.stateTax,
      csamt: 0,
    }));

    const hsnJson = gstr1HSNList.map((item, idx) => ({
      num: idx + 1,
      hsn_sc: item.hsnCode,
      desc: item.description,
      uqc: item.uqc,
      qty: item.totalQuantity,
      val: item.totalValue,
      txval: item.taxableValue,
      iamt: item.integratedTax,
      camt: item.centralTax,
      samt: item.stateTax,
      csamt: 0,
    }));

    const payload = {
      gstin: compGstin,
      fp: currentPeriod,
      version: 'GST1.0',
      hash: 'hash',
      b2b: Object.values(b2bByGstin),
      b2cl: gstr1B2CLList.map((item) => ({
        pos: item.placeOfSupply.split('-')[0],
        inv: [
          {
            inum: item.invoiceNumber,
            idt: item.invoiceDate.split('-').reverse().join('-'),
            val: item.invoiceValue,
            itms: [
              {
                num: 1,
                itm_det: {
                  rt: item.taxRate,
                  txval: item.taxableValue,
                  iamt: item.integratedTax,
                  csamt: 0,
                },
              },
            ],
          },
        ],
      })),
      b2cs: b2csJson,
      hsn: { data: hsnJson },
      doc_issue: {
        doc_det: gstr1DocSummary.map((d) => ({
          doc_num: 1,
          doc_typ: d.docType,
          docs: [
            {
              num: 1,
              from: d.fromSerial,
              to: d.toSerial,
              totnum: d.totalCount,
              canc: d.cancelledCount,
              net_issue: d.netIssued,
            },
          ],
        })),
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `GSTR1_${compGstin}_${currentPeriod}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toast.success('Government GSTR-1 JSON downloaded. Ready for upload on GST Portal.');
  } catch (err) {
    console.error('Error exporting GSTR1 JSON:', err);
    toast.error('Failed to generate GSTR-1 JSON.');
  }
};

export const exportGSTPDF = async (ctx: GstExportContext, isPrint: boolean | unknown = false) => {
  const shouldPrint = isPrint === true;
  const {
    companyProfile,
    profile,
    startDate,
    endDate,
    dateRange,
    gstSummaryStats,
    gstr1B2BList,
    gstr1B2CSList,
    gstr1HSNList,
    gstr2bList,
    gstr3bTable61,
  } = ctx;

  try {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    // Landscape A4 for wide multi-column GST reports
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 210mm

    const compName = companyProfile?.company_name || profile?.company_name || 'ESCROW BILL TAXPAYER';
    const compGstin = companyProfile?.gstin || profile?.gstin || 'Unregistered / Not Provided';
    const period =
      startDate && endDate
        ? `${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`
        : dateRange.replace(/_/g, ' ').toUpperCase();

    drawReportHeader(
      doc,
      'GST Compliance & Returns Report',
      'Comprehensive GSTR-1, GSTR-3B & GSTR-2B Reconciliation Statement',
      period,
      pageWidth,
      compName,
      compGstin,
      [99, 102, 241]
    );

    let yPos = 45;
    let secNumber = 1;

    // Section 1: Executive Summary Table
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`${secNumber++}. Executive GST Liability & ITC Summary`, 14, yPos);
    yPos += 4;

    const summaryTableData = [
      [
        'Gross Outward Tax Liability (GSTR-1 / 3B Table 3.1)',
        fmtRs(gstSummaryStats.totalOutputTaxable),
        fmtRs(gstSummaryStats.outputIGST),
        fmtRs(gstSummaryStats.outputCGST),
        fmtRs(gstSummaryStats.outputSGST),
        fmtRs(gstSummaryStats.totalOutputTax),
      ],
      [
        'Eligible Input Tax Credit Available (GSTR-2B / Table 4)',
        fmtRs(gstSummaryStats.totalInputTaxable),
        fmtRs(gstSummaryStats.inputIGST ?? 0),
        fmtRs(gstSummaryStats.inputCGST ?? 0),
        fmtRs(gstSummaryStats.inputSGST ?? 0),
        fmtRs(gstSummaryStats.totalInputTax),
      ],
      [
        'Net Cash Tax Payable (After ITC Offset)',
        '-',
        fmtRs(Math.max(0, gstSummaryStats.outputIGST - (gstSummaryStats.inputIGST ?? 0))),
        fmtRs(Math.max(0, gstSummaryStats.outputCGST - (gstSummaryStats.inputCGST ?? 0))),
        fmtRs(Math.max(0, gstSummaryStats.outputSGST - (gstSummaryStats.inputSGST ?? 0))),
        fmtRs(gstSummaryStats.netCashPayable),
      ],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Component / Supply Head', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Total Tax Amount']],
      body: summaryTableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], fontSize: 8.5, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 89, fontStyle: 'bold' },
        1: { cellWidth: 36, halign: 'right' },
        2: { cellWidth: 36, halign: 'right' },
        3: { cellWidth: 36, halign: 'right' },
        4: { cellWidth: 36, halign: 'right' },
        5: { cellWidth: 36, halign: 'right', fontStyle: 'bold', textColor: [30, 41, 59] },
      },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Section 2: GSTR-3B Table 6.1 Payment of Tax
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${secNumber++}. GSTR-3B Table 6.1 - Payment of Tax & ITC Settlement`, 14, yPos);
    yPos += 4;

    const table61Data = gstr3bTable61.map((r) => [
      r.taxType,
      fmtRs(r.totalTaxPayable, true),
      fmtRs(r.itcPaid, true),
      fmtRs(r.taxPaidCash, true),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [
        ['Tax Head / Act', 'Total Liability', 'Paid Through ITC (Credit Ledger)', 'Net Balance Paid In Cash (Cash Ledger)'],
      ],
      body: table61Data,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], fontSize: 8.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 65, fontStyle: 'bold' },
        1: { cellWidth: 68, halign: 'right' },
        2: { cellWidth: 68, halign: 'right' },
        3: { cellWidth: 68, halign: 'right', fontStyle: 'bold', textColor: [185, 28, 28] },
      },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Section 3: GSTR-1 B2B Supplies
    if (gstr1B2BList.length > 0) {
      if (yPos > pageHeight - 55) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(
        `${secNumber++}. GSTR-1 Table 4A - B2B Registered Outward Invoices (${gstr1B2BList.length} Invoices)`,
        14,
        yPos
      );
      yPos += 4;

      const b2bTableData = gstr1B2BList.slice(0, 50).map((item) => [
        item.gstin,
        item.clientName,
        item.invoiceNumber,
        item.invoiceDate,
        fmtRs(item.invoiceValue),
        `${item.taxRate}%`,
        fmtRs(item.taxableValue),
        fmtRs(item.integratedTax + item.centralTax + item.stateTax),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [
          [
            'GSTIN of Recipient',
            'Party / Trade Name',
            'Invoice #',
            'Date',
            'Invoice Value',
            'Rate',
            'Taxable Value',
            'Total Tax Amount',
          ],
        ],
        body: b2bTableData,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: 'bold' },
          1: { cellWidth: 50 },
          2: { cellWidth: 30 },
          3: { cellWidth: 22, halign: 'center' },
          4: { cellWidth: 32, halign: 'right' },
          5: { cellWidth: 16, halign: 'center' },
          6: { cellWidth: 39, halign: 'right' },
          7: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }

    // Section 4: GSTR-1 Table 7 - B2CS Consumer Supplies (Retail)
    if (gstr1B2CSList.length > 0) {
      if (yPos > pageHeight - 55) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${secNumber++}. GSTR-1 Table 7 - B2CS Consumer Supplies (Unregistered & Retail)`, 14, yPos);
      yPos += 4;

      const b2csTableData = gstr1B2CSList.slice(0, 25).map((item) => [
        item.integratedTax > 0 ? 'Inter-State' : 'Intra-State',
        item.placeOfSupply,
        `${item.taxRate}%`,
        fmtRs(item.taxableValue),
        fmtRs(item.integratedTax),
        fmtRs(item.centralTax),
        fmtRs(item.stateTax),
        fmtRs(item.integratedTax + item.centralTax + item.stateTax),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [
          [
            'Supply Type',
            'Place of Supply (POS)',
            'Rate',
            'Taxable Value',
            'Integrated Tax',
            'Central Tax',
            'State / UT Tax',
            'Total Tax',
          ],
        ],
        body: b2csTableData,
        theme: 'striped',
        headStyles: { fillColor: [13, 148, 136], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 44 },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 34, halign: 'right' },
          4: { cellWidth: 34, halign: 'right' },
          5: { cellWidth: 34, halign: 'right' },
          6: { cellWidth: 34, halign: 'right' },
          7: { cellWidth: 36, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }

    // Section 5: GSTR-2B Inward ITC
    if (gstr2bList.length > 0) {
      if (yPos > pageHeight - 55) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(
        `${secNumber++}. GSTR-2B - Auto-drafted ITC Inward Supplies (${gstr2bList.length} Bills / Invoices)`,
        14,
        yPos
      );
      yPos += 4;

      const itcTableData = gstr2bList.slice(0, 50).map((item) => [
        item.vendorGstin || 'Unregistered',
        item.vendorName || '-',
        item.invoiceNumber || '-',
        item.invoiceDate || '-',
        fmtRs(item.invoiceValue),
        fmtRs(item.taxableValue),
        fmtRs(item.integratedTax + item.centralTax + item.stateTax),
        item.itcAvailable === 'Y' ? 'Eligible' : 'Ineligible',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [
          [
            'Vendor GSTIN',
            'Vendor / Supplier Name',
            'Bill / Inv #',
            'Date',
            'Bill Value',
            'Taxable Value',
            'ITC Amount',
            'ITC Status',
          ],
        ],
        body: itcTableData,
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: 'bold' },
          1: { cellWidth: 50 },
          2: { cellWidth: 32 },
          3: { cellWidth: 22, halign: 'center' },
          4: { cellWidth: 33, halign: 'right' },
          5: { cellWidth: 33, halign: 'right' },
          6: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] },
          7: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
        },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }

    // Section 6: Table 12 - HSN / SAC Summary
    if (gstr1HSNList.length > 0) {
      if (yPos > pageHeight - 55) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${secNumber++}. Table 12 - HSN / SAC Summary of Outward Supplies`, 14, yPos);
      yPos += 4;

      const hsnTableData = gstr1HSNList.slice(0, 30).map((item) => [
        item.hsnCode,
        item.description || 'Goods / Services',
        item.uqc || 'NOS',
        item.totalQuantity.toLocaleString('en-IN'),
        fmtRs(item.totalValue),
        fmtRs(item.taxableValue),
        fmtRs(item.integratedTax + item.centralTax + item.stateTax),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [
          [
            'HSN / SAC',
            'Description of Goods / Services',
            'UQC',
            'Total Qty',
            'Total Value',
            'Taxable Value',
            'Total Tax Amount',
          ],
        ],
        body: hsnTableData,
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 28, fontStyle: 'bold' },
          1: { cellWidth: 68 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 24, halign: 'right' },
          4: { cellWidth: 41, halign: 'right' },
          5: { cellWidth: 42, halign: 'right' },
          6: { cellWidth: 46, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: 14, right: 14 },
      });
    }

    // Professional Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(14, pageHeight - 11, pageWidth - 14, pageHeight - 11);

      doc.setFontSize(7.5);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`ESCROW BILL GST ENGINE • Entity: ${compName} (${compGstin})`, 14, pageHeight - 6);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
    }

    outputPdf(
      doc,
      `GST-Returns-Report-${new Date().toISOString().split('T')[0]}.pdf`,
      shouldPrint,
      'GST PDF Report downloaded successfully.'
    );
  } catch (err) {
    console.error('Error exporting GST PDF:', err);
    toast.error('Failed to generate GST PDF.');
  }
};

