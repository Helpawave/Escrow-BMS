import { toast } from '@/hooks/use-toast';
import { safelyToLocaleDate } from '@/utils/dateUtils';
import { fmtRs, drawReportHeader, drawReportFooter, outputPdf } from './pdfCommon';
import { ReportsExportContext } from '../types';

export const exportPaymentsPDF = async (ctx: ReportsExportContext, isPrint: boolean | unknown = false) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    const shouldPrint = isPrint === true;
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const compName = companyProfile?.company_name || profile?.company_name || 'My Business';
      const compGstin = companyProfile?.gstin || profile?.gstin || 'Unregistered / Not Provided';
      const periodText = startDate && endDate
        ? `${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`
        : dateRange.replace(/_/g, ' ').toUpperCase();

      drawReportHeader(
        doc,
        'Payments & Collections Report',
        'Comprehensive Collections Ledger, Payment Modes & Settlement Record',
        periodText,
        pageWidth,
        compName,
        compGstin,
        [16, 185, 129] // Emerald
      );

      let yPos = 46;

      // Summary table
      const summaryRows = [
        ['Total Collected', fmtRs(paymentStats.totalCollected), 'Total Transactions', paymentStats.totalTransactions.toString()],
        ['UPI / Digital Payment', fmtRs(paymentStats.upiTotal), 'Cash in Hand', fmtRs(paymentStats.cashTotal)],
        ['Bank Transfer / Cheque', fmtRs(paymentStats.bankTransferTotal), 'Average Receipt Size', fmtRs(paymentStats.averagePayment, true)]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Collections Metric', 'Value', 'Metric', 'Value']],
        body: summaryRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        styles: { fontSize: 8.5, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: 40, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] },
          2: { cellWidth: 50, fontStyle: 'bold' },
          3: { cellWidth: 42, halign: 'right' }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Method Breakdown Table
      if (paymentMethodDistribution.length > 0) {
        if (yPos > pageHeight - 55) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('Payment Methods & Channel Distribution', 14, yPos);
        yPos += 4;

        const methodRows = paymentMethodDistribution.map(m => [
          m.name,
          fmtRs(m.value),
          m.count.toString(),
          `${m.percentage.toFixed(1)}%`
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Payment Method / Channel', 'Total Realized Amount', 'Receipts Count', 'Portfolio Share']],
          body: methodRows,
          theme: 'striped',
          headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 2.5 },
          columnStyles: {
            0: { cellWidth: 70, fontStyle: 'bold' },
            1: { cellWidth: 45, halign: 'right' },
            2: { cellWidth: 35, halign: 'center' },
            3: { cellWidth: 32, halign: 'center' }
          },
          margin: { left: 14, right: 14 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Detailed Transactions
      if (paymentsList.length > 0) {
        if (yPos > pageHeight - 55) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`Detailed Payment Receipts Ledger (${paymentsList.length} Entries)`, 14, yPos);
        yPos += 4;

        const totalTxAmount = paymentsList.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const txRows = paymentsList.map(p => [
          safelyToLocaleDate(p.payment_date),
          p.reference_number || '-',
          p.invoice_number || '-',
          p.party_name || 'Direct Customer',
          p.payment_method ? p.payment_method.toUpperCase() : 'CASH',
          fmtRs(p.amount)
        ]);

        // Grand Total row
        txRows.push([
          '',
          '',
          'GRAND TOTAL',
          `${paymentsList.length} Payments`,
          '',
          fmtRs(totalTxAmount)
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Reference #', 'Bill #', 'Party / Client Name', 'Mode', 'Amount']],
          body: txRows,
          theme: 'striped',
          headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 2.5 },
          columnStyles: {
            0: { cellWidth: 25, halign: 'center' },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 30, fontStyle: 'bold' },
            3: { cellWidth: 52 },
            4: { cellWidth: 20, halign: 'center' },
            5: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
          },
          didParseCell: function (data) {
            if (data.row.index === txRows.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [226, 232, 240];
              data.cell.styles.textColor = [15, 23, 42];
            }
          },
          margin: { left: 14, right: 14 }
        });
      }

      drawReportFooter(doc, pageWidth, pageHeight, 'Payments & Collections Report', compName, compGstin);

      outputPdf(doc, `payments-report-${new Date().toISOString().split('T')[0]}.pdf`, shouldPrint, "Payments report PDF downloaded successfully.");
    } catch (error) {
      console.error('Error exporting payments PDF:', error);
      toast({ variant: "destructive", title: "Export Failed", description: "Could not export payments PDF." });
    }
  };


export const exportItemsPDF = async (ctx: ReportsExportContext, isPrint: boolean | unknown = false) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    const shouldPrint = isPrint === true;
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      // Landscape A4 for wide multi-column items report
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const compName = companyProfile?.company_name || profile?.company_name || 'My Business';
      const compGstin = companyProfile?.gstin || profile?.gstin || 'Unregistered / Not Provided';
      const periodText = startDate && endDate
        ? `${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`
        : dateRange.replace(/_/g, ' ').toUpperCase();

      drawReportHeader(
        doc,
        'Item-Wise Sales & Profit Analysis Report',
        'Product Sales Volume, Cost Basis, Revenue Realization & Profit Margins',
        periodText,
        pageWidth,
        compName,
        compGstin,
        [99, 102, 241] // Indigo
      );

      let yPos = 46;

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Product Performance Details (${itemsReports?.length || 0} Items)`, 14, yPos);
      yPos += 4;

      if (itemsReports && itemsReports.length > 0) {
        const totalQty = itemsReports.reduce((acc, i) => acc + (Number(i.quantitySold) || 0), 0);
        const totalSales = itemsReports.reduce((acc, i) => acc + (Number(i.totalSales) || 0), 0);
        const totalCost = itemsReports.reduce((acc, i) => acc + (Number(i.totalCost) || 0), 0);
        const totalProfit = itemsReports.reduce((acc, i) => acc + (Number(i.netProfit) || 0), 0);
        const overallMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100) : 0;

        const tableBody = itemsReports.map(item => [
          item.name,
          item.sku || '-',
          item.hsn || '-',
          item.quantitySold.toString(),
          fmtRs(item.totalSales),
          fmtRs(item.totalCost),
          fmtRs(item.netProfit),
          `${item.margin.toFixed(1)}%`
        ]);

        // Grand Total row
        tableBody.push([
          'GRAND TOTAL',
          '-',
          '-',
          totalQty.toString(),
          fmtRs(totalSales),
          fmtRs(totalCost),
          fmtRs(totalProfit),
          `${overallMargin.toFixed(1)}%`
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Item / Product Name', 'SKU', 'HSN Code', 'Qty Sold', 'Total Revenue', 'Cost Basis', 'Net Profit', 'Profit Margin']],
          body: tableBody,
          theme: 'striped',
          headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontSize: 8.5,
            fontStyle: 'bold',
            halign: 'center',
            cellPadding: 3
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 2.5,
            textColor: [30, 41, 59]
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          columnStyles: {
            0: { cellWidth: 70, fontStyle: 'bold' },
            1: { cellWidth: 28, halign: 'center' },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
            4: { cellWidth: 35, halign: 'right' },
            5: { cellWidth: 35, halign: 'right' },
            6: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] },
            7: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
          },
          didParseCell: function (data) {
            if (data.row.index === tableBody.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [226, 232, 240];
              data.cell.styles.textColor = [15, 23, 42];
            }
          },
          margin: { left: 14, right: 14 }
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('No item sales data recorded for the selected date range.', 14, yPos + 10);
      }

      drawReportFooter(doc, pageWidth, pageHeight, 'Item-Wise Profit Report', compName, compGstin);

      outputPdf(doc, `item-wise-profit-report-${new Date().toISOString().split('T')[0]}.pdf`, shouldPrint, "Item profit PDF downloaded successfully.");
    } catch (error) {
      console.error('Error generating Item PDF:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate Item PDF." });
    }
  };


export const exportToPDF = async (ctx: ReportsExportContext) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    try {
      // Dynamic import to ensure proper loading in production
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Determine date range text
      let periodText = '';
      if (startDate && endDate) {
        const start = safelyToLocaleDate(startDate);
        const end = safelyToLocaleDate(endDate);
        periodText = `Period: ${start} to ${end}`;
      } else {
        // Preset date range
        periodText = `Period: ${dateRange.replace('_', ' ').toUpperCase()}`;
      }

      // Header
      doc.setFontSize(20);
      doc.text('Business Reports', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, pageWidth / 2, 30, { align: 'center' });
      doc.text(periodText, pageWidth / 2, 40, { align: 'center' });

      let yPosition = 60;

      // Summary Stats
      doc.setFontSize(16);
      doc.text('Summary Statistics', 20, yPosition);
      yPosition += 10;

      const summaryData = [
        ['Total Revenue', `${currencySymbol} ${stats.totalRevenue.toLocaleString('en-IN')}`],
        ['Total Invoices', stats.totalInvoices.toString()],
        ['Paid Invoices', stats.paidInvoices.toString()],
        ['Pending Amount', `${currencySymbol} ${stats.pendingAmount.toLocaleString('en-IN')}`],
        ['Overdue Amount', `${currencySymbol} ${stats.overdueAmount.toLocaleString('en-IN')}`],
        ['Net Profit', `${currencySymbol} ${stats.netProfit.toLocaleString('en-IN')}`],
        ['Average Invoice Value', `${currencySymbol} ${stats.averageInvoiceValue.toLocaleString('en-IN')}`]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [102, 126, 234] },
        margin: { left: 20, right: 20 }
      });

      yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

      // Client Reports
      if (clientReports && clientReports.length > 0) {
        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.text('Top Clients', 20, yPosition);
        yPosition += 10;

        const clientTableData = clientReports.slice(0, 10).map(client => [
          client.client_name,
          client.total_invoices.toString(),
          `${currencySymbol} ${client.total_amount.toLocaleString('en-IN')}`,
          `${currencySymbol} ${client.paid_amount.toLocaleString('en-IN')}`,
          `${currencySymbol} ${client.pending_amount.toLocaleString('en-IN')}`
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Client', 'Invoices', 'Total Amount', 'Paid', 'Pending']],
          body: clientTableData,
          theme: 'grid',
          headStyles: { fillColor: [102, 126, 234] },
          margin: { left: 20, right: 20 }
        });
      }

      // Save PDF
      const fileName = `business-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "Success",
        description: "PDF report downloaded successfully."
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF report. Please try again."
      });
    }
  };



export const exportOverviewPDF = async (ctx: ReportsExportContext, isPrint: boolean | unknown = false) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    const shouldPrint = isPrint === true;
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const compName = companyProfile?.company_name || profile?.company_name || 'My Business';
      const compGstin = companyProfile?.gstin || profile?.gstin || 'Unregistered / Not Provided';
      const period = startDate && endDate
        ? `${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`
        : dateRange.replace(/_/g, ' ').toUpperCase();

      drawReportHeader(
        doc,
        'Executive Business & Financial Overview',
        'Executive Performance Summary, Revenue Analytics & Operating Position',
        period,
        pageWidth,
        compName,
        compGstin,
        [59, 130, 246] // Blue
      );

      let yPos = 46;

      // 1. Executive Summary Table
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('1. Key Financial & Operational Highlights', 14, yPos);
      yPos += 4;

      const grossBilled = stats.totalRevenue + stats.pendingAmount;
      const summaryData = [
        ['Total Revenue Billed', fmtRs(grossBilled), 'Total Invoices Issued', stats.totalInvoices.toString()],
        ['Total Payments Collected', fmtRs(stats.totalRevenue), 'Fully Settled Invoices', stats.paidInvoices.toString()],
        ['Pending / Outstanding Dues', fmtRs(stats.pendingAmount), 'Average Invoice Value', fmtRs(stats.averageInvoiceValue)],
        ['Total Operating Expenses', fmtRs(stats.totalExpenses), 'Net Operating Margin', stats.totalRevenue > 0 ? `${((stats.netProfit / stats.totalRevenue) * 100).toFixed(1)}%` : '0.0%'],
        ['Net Realized Profit', fmtRs(stats.netProfit), 'Profitability Status', stats.netProfit >= 0 ? 'Profitable (Surplus)' : 'Net Operating Deficit']
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Financial Metric', 'Value', 'Operational Metric', 'Status / Count']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { fontSize: 8.5, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: 'bold' },
          1: { cellWidth: 40, halign: 'right', fontStyle: 'bold', textColor: [37, 99, 235] },
          2: { cellWidth: 50, fontStyle: 'bold' },
          3: { cellWidth: 37, halign: 'right' }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // 2. Monthly Trend if available
      if (monthlyData && monthlyData.length > 0) {
        if (yPos > pageHeight - 55) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('2. Monthly Revenue Performance & Trend', 14, yPos);
        yPos += 4;

        const monthRows = monthlyData.map(m => [
          m.month || '',
          fmtRs(m.revenue || 0),
          (m.invoices || 0).toString(),
          fmtRs(m.expenses || 0),
          fmtRs(m.profit !== undefined ? m.profit : (m.revenue || 0) - (m.expenses || 0))
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Month', 'Gross Revenue', 'Invoices', 'Total Expenses', 'Net Profit']],
          body: monthRows,
          theme: 'striped',
          headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' },
          bodyStyles: { fontSize: 8, cellPadding: 2.5 },
          columnStyles: {
            0: { cellWidth: 42, fontStyle: 'bold' },
            1: { cellWidth: 35, halign: 'right' },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 35, halign: 'right' },
            4: { cellWidth: 45, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] }
          },
          margin: { left: 14, right: 14 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // 3. Top Expense Categories if available
      if (categoryData && categoryData.length > 0) {
        if (yPos > pageHeight - 55) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('3. Operating Expense Breakdown by Category', 14, yPos);
        yPos += 4;

        const catRows = categoryData.map(c => [
          c.name,
          fmtRs(c.value || 0),
          stats.totalExpenses > 0 ? `${(((c.value || 0) / stats.totalExpenses) * 100).toFixed(1)}%` : '0%'
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Expense Category', 'Total Expenditure', 'Share of Total Outflow']],
          body: catRows,
          theme: 'striped',
          headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' },
          bodyStyles: { fontSize: 8, cellPadding: 2.5 },
          columnStyles: {
            0: { cellWidth: 90, fontStyle: 'bold' },
            1: { cellWidth: 50, halign: 'right' },
            2: { cellWidth: 42, halign: 'center' }
          },
          margin: { left: 14, right: 14 }
        });
      }

      drawReportFooter(doc, pageWidth, pageHeight, 'Executive Overview Report', compName, compGstin);

      outputPdf(doc, `overview-report-${new Date().toISOString().split('T')[0]}.pdf`, shouldPrint, "Overview PDF downloaded successfully.");
    } catch (error) {
      console.error('Error generating Overview PDF:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate Overview PDF." });
    }
  };


export const exportInvoicesPDF = async (ctx: ReportsExportContext, isPrint: boolean | unknown = false) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    const shouldPrint = isPrint === true;
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const compName = companyProfile?.company_name || profile?.company_name || 'My Business';
      const compGstin = companyProfile?.gstin || profile?.gstin || 'Unregistered / Not Provided';
      const period = startDate && endDate
        ? `${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`
        : dateRange.replace(/_/g, ' ').toUpperCase();

      drawReportHeader(
        doc,
        'Sales & Invoice Register',
        'Detailed Billed Transactions, Customer Billing History & Payment Status',
        period,
        pageWidth,
        compName,
        compGstin,
        [16, 185, 129] // Emerald
      );

      let yPos = 46;

      const totalAmount = invoicesList.reduce((acc, inv) => acc + (Number(inv.total_amount) || 0), 0);
      const paidCount = invoicesList.filter(inv => (inv.status || '').toLowerCase() === 'paid').length;
      const pendingCount = invoicesList.filter(inv => {
        const s = (inv.status || '').toLowerCase();
        return s === 'pending' || s === 'partial' || s === 'draft' || s === 'sent' || s === 'viewed';
      }).length;
      const overdueCount = invoicesList.filter(inv => (inv.status || '').toLowerCase() === 'overdue').length;

      const summaryData = [
        ['Total Invoices Issued', invoicesList.length.toString(), 'Gross Billing Amount', fmtRs(totalAmount)],
        ['Paid Invoices', paidCount.toString(), 'Pending / Overdue Invoices', (pendingCount + overdueCount).toString()]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Invoice Metric', 'Count', 'Financial Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8.5, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: 'bold' },
          1: { cellWidth: 35, halign: 'center' },
          2: { cellWidth: 55, fontStyle: 'bold' },
          3: { cellWidth: 37, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Tax Invoices Register (${invoicesList.length} Records)`, 14, yPos);
      yPos += 4;

      const invoiceData = invoicesList.map((inv, idx) => [
        (idx + 1).toString(),
        safelyToLocaleDate(inv.created_at),
        inv.invoice_number || '-',
        inv.client_name || 'Cash Customer',
        inv.status ? inv.status.toUpperCase() : 'PENDING',
        fmtRs(inv.total_amount)
      ]);

      // Grand Total row
      invoiceData.push([
        '',
        '',
        'GRAND TOTAL',
        `${invoicesList.length} Invoices`,
        '',
        fmtRs(totalAmount)
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Date', 'Invoice #', 'Client Name', 'Status', 'Total Amount']],
        body: invoiceData,
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 8.5,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 3
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2.5,
          textColor: [30, 41, 59]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 35, fontStyle: 'bold' },
          3: { cellWidth: 60 },
          4: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
          5: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] }
        },
        didParseCell: function (data) {
          if (data.row.index === invoiceData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [226, 232, 240];
            data.cell.styles.textColor = [15, 23, 42];
          } else if (data.column.index === 4 && data.section === 'body') {
            const status = String(data.cell.raw);
            if (status === 'PAID') {
              data.cell.styles.textColor = [16, 185, 129];
              data.cell.styles.fillColor = [220, 252, 231];
            } else if (status === 'PENDING') {
              data.cell.styles.textColor = [202, 138, 4];
              data.cell.styles.fillColor = [254, 249, 195];
            } else if (status === 'OVERDUE') {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fillColor = [254, 226, 226];
            }
          }
        },
        margin: { left: 14, right: 14 }
      });

      drawReportFooter(doc, pageWidth, pageHeight, 'Sales & Invoices Register', compName, compGstin);

      outputPdf(doc, `invoices-report-${new Date().toISOString().split('T')[0]}.pdf`, shouldPrint, "Invoices PDF downloaded successfully.");
    } catch (error) {
      console.error('Error exporting Invoices PDF:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate Invoices PDF." });
    }
  };


export const exportDownpaymentsPDF = async (ctx: ReportsExportContext, isPrint: boolean | unknown = false) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    const shouldPrint = isPrint === true;
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const compName = companyProfile?.company_name || profile?.company_name || 'My Dealership';
      const compGstin = companyProfile?.gstin || profile?.gstin || 'Unregistered / Not Provided';
      const period = startDate && endDate
        ? `${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`
        : dateRange.replace(/_/g, ' ').toUpperCase();

      drawReportHeader(
        doc,
        'Vehicle Downpayments & Booking Advances Register',
        'Dealership Advance Receipts, Financed Liabilities, Vehicle Allotments & Pending Dues',
        period,
        pageWidth,
        compName,
        compGstin,
        [245, 158, 11] // Amber / Gold
      );

      let yPos = 46;

      const summaryData = [
        ['Total Vehicle Bookings', downpaymentStats.count.toString(), 'Total Vehicle Valuation', fmtRs(downpaymentStats.totalValuation)],
        ['Total Advances Collected', fmtRs(downpaymentStats.totalAdvances), 'Total Customer Balances Due', fmtRs(downpaymentStats.totalBalanceDue)]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value', 'Financial Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8.5, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 60, fontStyle: 'bold' },
          1: { cellWidth: 40, halign: 'center' },
          2: { cellWidth: 60, fontStyle: 'bold' },
          3: { cellWidth: 50, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Vehicle Downpayment & Advance Records (${filteredDownpaymentsList.length} Entries)`, 14, yPos);
      yPos += 4;

      const tableData = filteredDownpaymentsList.map((item, idx) => [
        (idx + 1).toString(),
        safelyToLocaleDate(item.created_at),
        item.invoice_number,
        item.client_name,
        item.vehicle_name,
        fmtRs(item.total_amount),
        fmtRs(item.advance_amount),
        fmtRs(item.balance_due),
        item.financier || 'Cash / Self',
        item.status.toUpperCase()
      ]);

      // Grand total
      tableData.push([
        '',
        '',
        'TOTALS',
        `${filteredDownpaymentsList.length} Vehicles`,
        '-',
        fmtRs(filteredDownpaymentsList.reduce((s, i) => s + i.total_amount, 0)),
        fmtRs(filteredDownpaymentsList.reduce((s, i) => s + i.advance_amount, 0)),
        fmtRs(filteredDownpaymentsList.reduce((s, i) => s + i.balance_due, 0)),
        '-',
        ''
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Date', 'Receipt #', 'Customer', 'Vehicle Details', 'Total Price', 'Advance Paid', 'Balance Due', 'Financier', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [217, 119, 6], // Amber 600
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 2.5
        },
        bodyStyles: {
          fontSize: 7.5,
          cellPadding: 2,
          textColor: [30, 41, 59]
        },
        alternateRowStyles: {
          fillColor: [254, 252, 232] // Light amber
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 22, halign: 'center' },
          2: { cellWidth: 26, fontStyle: 'bold' },
          3: { cellWidth: 40 },
          4: { cellWidth: 46 },
          5: { cellWidth: 28, halign: 'right' },
          6: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] },
          7: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] },
          8: { cellWidth: 26 },
          9: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
        },
        didParseCell: function (data) {
          if (data.row.index === tableData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [15, 23, 42];
          }
        },
        margin: { left: 14, right: 14 }
      });

      drawReportFooter(doc, pageWidth, pageHeight, 'Vehicle Downpayments Register', compName, compGstin);

      outputPdf(doc, `downpayments-report-${new Date().toISOString().split('T')[0]}.pdf`, shouldPrint, "Downpayment PDF downloaded successfully.");
    } catch (error) {
      console.error('Error generating Downpayment PDF:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate Downpayment PDF." });
    }
  };


export const exportFinancialPDF = async (ctx: ReportsExportContext, isPrint: boolean | unknown = false) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    const shouldPrint = isPrint === true;
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const compName = companyProfile?.company_name || profile?.company_name || 'My Business';
      const compGstin = companyProfile?.gstin || profile?.gstin || 'Unregistered / Not Provided';
      const period = startDate && endDate
        ? `${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`
        : dateRange.replace(/_/g, ' ').toUpperCase();

      drawReportHeader(
        doc,
        'Financial Profit & Loss (P&L) Statement',
        'Income Statement, Operating Expenditure & Net Profitability Analysis',
        period,
        pageWidth,
        compName,
        compGstin,
        [147, 51, 234] // Purple
      );

      let yPos = 46;

      const profitMargin = stats.totalRevenue > 0 ? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(2) : '0.00';
      
      // Executive P&L Cards
      const summaryRows = [
        ['Gross Operating Revenue', fmtRs(stats.totalRevenue), 'Total Invoiced Count', stats.totalInvoices.toString()],
        ['Total Operating Expenses', fmtRs(stats.totalExpenses), 'Operating Expense Ratio', stats.totalRevenue > 0 ? `${((stats.totalExpenses / stats.totalRevenue) * 100).toFixed(1)}%` : '0.0%'],
        ['Net Operating Profit / (Loss)', fmtRs(stats.netProfit), 'Net Profit Margin %', `${profitMargin}%`]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['P&L Core Metric', 'Amount', 'Performance Ratio', 'Value']],
        body: summaryRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: 'bold' },
          1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
          2: { cellWidth: 50, fontStyle: 'bold' },
          3: { cellWidth: 37, halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: function (data) {
          if (data.row.index === 2 && data.column.index === 1) {
            data.cell.styles.textColor = stats.netProfit >= 0 ? [16, 185, 129] : [220, 38, 38];
          }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Detailed Income & Expense Schedule
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Statement of Income & Expenditures', 14, yPos);
      yPos += 4;

      const scheduleData: any[] = [
        ['OPERATING REVENUE', '', ''],
        ['  Gross Invoiced Sales', fmtRs(stats.totalRevenue), '100.0%'],
        ['  Total Payments Received', fmtRs(stats.paidInvoices > 0 ? (stats.totalRevenue - stats.pendingAmount) : 0), stats.totalRevenue > 0 ? `${(((stats.totalRevenue - stats.pendingAmount) / stats.totalRevenue) * 100).toFixed(1)}%` : '0%'],
        ['  Outstanding Trade Receivables', fmtRs(stats.pendingAmount), stats.totalRevenue > 0 ? `${((stats.pendingAmount / stats.totalRevenue) * 100).toFixed(1)}%` : '0%'],
        ['OPERATING EXPENDITURES', '', '']
      ];

      if (categoryData && categoryData.length > 0) {
        categoryData.forEach(cat => {
          scheduleData.push([
            `  ${cat.name}`,
            fmtRs(cat.value),
            stats.totalRevenue > 0 ? `${((cat.value / stats.totalRevenue) * 100).toFixed(1)}%` : '-'
          ]);
        });
      } else {
        scheduleData.push(['  General Operating Expenses', fmtRs(stats.totalExpenses), stats.totalRevenue > 0 ? `${((stats.totalExpenses / stats.totalRevenue) * 100).toFixed(1)}%` : '-']);
      }

      scheduleData.push(['TOTAL OPERATING COSTS', fmtRs(stats.totalExpenses), stats.totalRevenue > 0 ? `${((stats.totalExpenses / stats.totalRevenue) * 100).toFixed(1)}%` : '-']);
      scheduleData.push(['NET OPERATING SURPLUS / (DEFICIT)', fmtRs(stats.netProfit), `${profitMargin}%`]);

      autoTable(doc, {
        startY: yPos,
        head: [['Account Category / Particulars', 'Amount', '% of Gross Revenue']],
        body: scheduleData,
        theme: 'striped',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 45, halign: 'right' },
          2: { cellWidth: 37, halign: 'center' }
        },
        didParseCell: function (data) {
          const rowText = String(data.row.raw[0] || '');
          if (rowText === 'OPERATING REVENUE' || rowText === 'OPERATING EXPENDITURES') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 245, 249];
            data.cell.styles.textColor = [30, 41, 59];
          } else if (rowText === 'TOTAL OPERATING COSTS') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [254, 242, 242];
            data.cell.styles.textColor = [185, 28, 28];
          } else if (rowText === 'NET OPERATING SURPLUS / (DEFICIT)') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = stats.netProfit >= 0 ? [240, 253, 244] : [254, 242, 242];
            data.cell.styles.textColor = stats.netProfit >= 0 ? [22, 101, 52] : [185, 28, 28];
          }
        },
        margin: { left: 14, right: 14 }
      });

      drawReportFooter(doc, pageWidth, pageHeight, 'Financial P&L Statement', compName, compGstin);

      outputPdf(doc, `financial-report-${new Date().toISOString().split('T')[0]}.pdf`, shouldPrint, "Financial PDF downloaded successfully.");
    } catch (error) {
      console.error('Error:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate Financial PDF." });
    }
  };


export const exportClientsPDF = async (ctx: ReportsExportContext, isPrint: boolean | unknown = false) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    const shouldPrint = isPrint === true;
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const compName = companyProfile?.company_name || profile?.company_name || 'My Business';
      const compGstin = companyProfile?.gstin || profile?.gstin || 'Unregistered / Not Provided';
      const period = startDate && endDate
        ? `${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`
        : dateRange.replace(/_/g, ' ').toUpperCase();

      drawReportHeader(
        doc,
        'Client Performance & Receivables Report',
        'Customer Billing History, Collection Receipts & Outstanding Receivables',
        period,
        pageWidth,
        compName,
        compGstin,
        [245, 158, 11] // Amber
      );

      let yPos = 46;

      const totalBilled = clientReports.reduce((acc, c) => acc + (Number(c.total_amount) || 0), 0);
      const totalPaid = clientReports.reduce((acc, c) => acc + (Number(c.paid_amount) || 0), 0);
      const totalPending = clientReports.reduce((acc, c) => acc + (Number(c.pending_amount) || 0), 0);
      const totalInvoicesCount = clientReports.reduce((acc, c) => acc + (Number(c.total_invoices) || 0), 0);

      // Summary table
      const summaryRows = [
        ['Total Clients Registered', clientReports.length.toString(), 'Total Invoices Raised', totalInvoicesCount.toString()],
        ['Gross Billed to Clients', fmtRs(totalBilled), 'Total Received from Clients', fmtRs(totalPaid)],
        ['Total Pending Receivables', fmtRs(totalPending), 'Client Recovery Ratio', totalBilled > 0 ? `${((totalPaid / totalBilled) * 100).toFixed(1)}%` : '0%']
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Portfolio Metric', 'Count / Total', 'Receivables Metric', 'Amount / Ratio']],
        body: summaryRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: 'bold' },
          1: { cellWidth: 35, halign: 'center' },
          2: { cellWidth: 55, fontStyle: 'bold' },
          3: { cellWidth: 37, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Customer Ledger Statement (${clientReports.length} Clients)`, 14, yPos);
      yPos += 4;

      if (clientReports && clientReports.length > 0) {
        const clientTableData = clientReports.map((client, idx) => [
          (idx + 1).toString(),
          client.client_name || 'Unnamed Client',
          client.total_invoices.toString(),
          fmtRs(client.total_amount),
          fmtRs(client.paid_amount),
          fmtRs(client.pending_amount)
        ]);

        // Grand Total row
        clientTableData.push([
          '',
          'GRAND TOTAL',
          totalInvoicesCount.toString(),
          fmtRs(totalBilled),
          fmtRs(totalPaid),
          fmtRs(totalPending)
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Client / Party Name', 'Invoices', 'Total Billed', 'Amount Received', 'Balance Due']],
          body: clientTableData,
          theme: 'striped',
          headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontSize: 8.5,
            fontStyle: 'bold',
            halign: 'center',
            cellPadding: 3
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 2.5,
            textColor: [30, 41, 59]
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 62, fontStyle: 'bold' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
            4: { cellWidth: 30, halign: 'right', textColor: [16, 185, 129], fontStyle: 'bold' },
            5: { cellWidth: 30, halign: 'right', textColor: [220, 38, 38], fontStyle: 'bold' }
          },
          didParseCell: function (data) {
            if (data.row.index === clientTableData.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [226, 232, 240];
              data.cell.styles.textColor = [15, 23, 42];
            }
          },
          margin: { left: 14, right: 14 }
        });
      }

      drawReportFooter(doc, pageWidth, pageHeight, 'Client Performance Report', compName, compGstin);

      outputPdf(doc, `clients-report-${new Date().toISOString().split('T')[0]}.pdf`, shouldPrint, "Clients PDF downloaded successfully.");
    } catch (error) {
      console.error('Error:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate Clients PDF." });
    }
  };


export const exportExpensesPDF = async (ctx: ReportsExportContext, isPrint: boolean | unknown = false) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    const shouldPrint = isPrint === true;
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const compName = companyProfile?.company_name || profile?.company_name || 'My Business';
      const compGstin = companyProfile?.gstin || profile?.gstin || 'Unregistered / Not Provided';
      const period = startDate && endDate
        ? `${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`
        : dateRange.replace(/_/g, ' ').toUpperCase();

      drawReportHeader(
        doc,
        'Business Expenses & Expenditure Report',
        'Operating Expenditure Audit, Category Allocation & Payment Disbursements',
        period,
        pageWidth,
        compName,
        compGstin,
        [225, 29, 72] // Rose
      );

      let yPos = 46;

      const totalExpenseAmount = expensesList.reduce((acc, exp) => acc + (Number(exp.amount) || 0), 0);

      // Expense Summary
      const expenseSummaryData = [
        ['Total Expenses Incurred', fmtRs(totalExpenseAmount), 'Total Expense Entries', expensesList.length.toString()],
        ['Top Expense Category', categoryData.length > 0 ? categoryData[0].name : 'N/A', 'Top Category Outflow', categoryData.length > 0 ? fmtRs(categoryData[0].value) : 'Rs. 0']
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Cost Metric', 'Expenditure', 'Category Highlight', 'Amount']],
        body: expenseSummaryData,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: 'bold' },
          1: { cellWidth: 40, halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] },
          2: { cellWidth: 50, fontStyle: 'bold' },
          3: { cellWidth: 37, halign: 'right' }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Grouped by Category Table
      if (categoryData.length > 0) {
        if (yPos > pageHeight - 55) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('Expense Allocation by Category', 14, yPos);
        yPos += 4;

        const catData = categoryData.map(cat => [
          cat.name,
          fmtRs(cat.value),
          totalExpenseAmount > 0 ? `${((cat.value / totalExpenseAmount) * 100).toFixed(1)}%` : '0%'
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Expense Category Head', 'Total Outflow', 'Portfolio Percentage']],
          body: catData,
          theme: 'striped',
          headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 2.5 },
          columnStyles: {
            0: { cellWidth: 90, fontStyle: 'bold' },
            1: { cellWidth: 50, halign: 'right' },
            2: { cellWidth: 42, halign: 'center' }
          },
          margin: { left: 14, right: 14 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Detailed Lists
      if (expensesList.length > 0) {
        if (yPos > pageHeight - 55) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`Detailed Expenses Disbursements (${expensesList.length} Entries)`, 14, yPos);
        yPos += 4;

        const detailedData = expensesList.map(exp => [
          safelyToLocaleDate(exp.expense_date),
          exp.title || '-',
          exp.category || 'General',
          exp.payment_method ? exp.payment_method.toUpperCase() : 'CASH',
          fmtRs(exp.amount)
        ]);

        // Grand Total row
        detailedData.push([
          '',
          'GRAND TOTAL',
          `${expensesList.length} Expenses`,
          '',
          fmtRs(totalExpenseAmount)
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Expense Title / Description', 'Category', 'Payment Mode', 'Amount']],
          body: detailedData,
          theme: 'striped',
          headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 2.5 },
          columnStyles: {
            0: { cellWidth: 28, halign: 'center' },
            1: { cellWidth: 64, fontStyle: 'bold' },
            2: { cellWidth: 40 },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
          },
          didParseCell: function (data) {
            if (data.row.index === detailedData.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [226, 232, 240];
              data.cell.styles.textColor = [15, 23, 42];
            }
          },
          margin: { left: 14, right: 14 }
        });
      }

      drawReportFooter(doc, pageWidth, pageHeight, 'Business Expenses Report', compName, compGstin);

      outputPdf(doc, `expenses-report-${new Date().toISOString().split('T')[0]}.pdf`, shouldPrint, "Expenses PDF downloaded successfully.");
    } catch (error) {
      console.error('Error:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate Expenses PDF." });
    }
  };


export const exportInventoryPDF = async (ctx: ReportsExportContext, isPrint: boolean | unknown = false) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    const shouldPrint = isPrint === true;
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const compName = companyProfile?.company_name || profile?.company_name || 'My Business';
      const compGstin = companyProfile?.gstin || profile?.gstin || 'Unregistered / Not Provided';
      const period = startDate && endDate
        ? `${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`
        : dateRange.replace(/_/g, ' ').toUpperCase();

      drawReportHeader(
        doc,
        'Inventory Stock & Valuation Audit Report',
        'Asset Valuation, Stock-on-Hand, Cost Basis & Retail Profitability Audit',
        period,
        pageWidth,
        compName,
        compGstin,
        [234, 88, 12] // Orange
      );

      let yPos = 46;

      // Executive Metrics Grid
      const summaryRows = [
        [
          'Total Unique Items', `${inventoryStats.totalUnique} Products`,
          'Total Stock Units', `${inventoryStats.totalStockQty.toLocaleString('en-IN')} Units`
        ],
        [
          'Inventory Asset Cost Basis', fmtRs(inventoryStats.totalPurchaseVal, true),
          'Retail Sale Valuation', fmtRs(inventoryStats.totalSalesVal, true)
        ],
        [
          'Potential Gross Profit', fmtRs(inventoryStats.totalProfit, true),
          'Average Gross Margin', `${inventoryStats.profitMarginPercent.toFixed(1)}%`
        ]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Inventory Metric', 'Value', 'Inventory Metric', 'Value']],
        body: summaryRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        styles: { fontSize: 8.5, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { cellWidth: 65, halign: 'right', fontStyle: 'bold', textColor: [234, 88, 12] },
          2: { cellWidth: 70, fontStyle: 'bold' },
          3: { cellWidth: 64, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Inventory Stock Valuation Ledger (${filteredAndSortedInventoryProducts.length} Items)`, 14, yPos);
      yPos += 4;

      // Valuation Table
      const totalCostVal = filteredAndSortedInventoryProducts.reduce((acc, p) => acc + (p.type === 'service' ? 0 : Number(p.opening_stock || 0)) * Number(p.purchase_price || 0), 0);
      const totalSaleVal = filteredAndSortedInventoryProducts.reduce((acc, p) => acc + (p.type === 'service' ? 0 : Number(p.opening_stock || 0)) * Number(p.price || 0), 0);
      const totalProfitVal = totalSaleVal - totalCostVal;
      const overallItemMargin = totalSaleVal > 0 ? ((totalProfitVal / totalSaleVal) * 100) : 0;

      const itemRows = filteredAndSortedInventoryProducts.map((p, idx) => {
        const stock = p.type === 'service' ? 0 : Number(p.opening_stock || 0);
        const costVal = stock * Number(p.purchase_price || 0);
        const saleVal = stock * p.price;
        const profit = saleVal - costVal;
        const margin = p.price > 0 ? ((p.price - Number(p.purchase_price || 0)) / p.price) * 100 : 0;
        return [
          (idx + 1).toString(),
          p.name,
          p.sku || '-',
          p.hsn_code || '-',
          p.type === 'service' ? 'Service' : `${stock} ${p.unit || 'pcs'}`,
          fmtRs(p.purchase_price || 0),
          fmtRs(p.price),
          `${p.tax_rate}%`,
          fmtRs(costVal),
          fmtRs(saleVal),
          fmtRs(profit),
          `${margin.toFixed(0)}%`
        ];
      });

      // Grand Total Row
      itemRows.push([
        '',
        'GRAND TOTAL',
        '-',
        '-',
        `${inventoryStats.totalStockQty} Units`,
        '',
        '',
        '',
        fmtRs(totalCostVal),
        fmtRs(totalSaleVal),
        fmtRs(totalProfitVal),
        `${overallItemMargin.toFixed(0)}%`
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Product Name', 'SKU', 'HSN', 'Stock', 'Cost Rate', 'Sale Rate', 'GST %', 'Asset Cost', 'Retail Val', 'Profit', 'Margin']],
        body: itemRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 50 },
          4: { halign: 'center', fontStyle: 'bold' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'center' },
          8: { halign: 'right', fontStyle: 'bold' },
          9: { halign: 'right', fontStyle: 'bold' },
          10: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] },
          11: { halign: 'center' }
        },
        didParseCell: function (data) {
          if (data.row.index === itemRows.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [226, 232, 240];
            data.cell.styles.textColor = [15, 23, 42];
          }
        },
        margin: { left: 14, right: 14 }
      });

      drawReportFooter(doc, pageWidth, pageHeight, 'Inventory Stock Valuation Report', compName, compGstin);

      outputPdf(doc, `inventory-stock-report-${new Date().toISOString().split('T')[0]}.pdf`, shouldPrint, "Inventory Valuation PDF downloaded successfully.");
    } catch (err) {
      console.error("PDF Export error:", err);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not generate PDF report."
      });
    }
  };


