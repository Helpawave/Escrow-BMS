import * as XLSX from 'xlsx';
import { toast } from '@/hooks/use-toast';
import { safelyToLocaleDate } from '@/utils/dateUtils';
import { ReportsExportContext } from '../types';

export const exportPaymentsExcel = (ctx: ReportsExportContext) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    try {
      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ['Metric', 'Value'],
        ['Total Collections', paymentStats.totalCollected],
        ['Total Transactions', paymentStats.totalTransactions],
        ['UPI / Digital Total', paymentStats.upiTotal],
        ['Cash Total', paymentStats.cashTotal],
        ['Bank Transfer Total', paymentStats.bankTransferTotal],
        ['Cheque Total', paymentStats.chequeTotal],
        ['Cards Total', paymentStats.cardTotal],
        ['Other Methods Total', paymentStats.otherTotal],
        ['Average Receipt', paymentStats.averagePayment]
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Collections Summary');

      // Method Breakdown Sheet
      const methodHeaders = ['Payment Method', 'Total Amount', 'Transactions', 'Share %'];
      const methodRows = paymentMethodDistribution.map(m => [
        m.name,
        m.value,
        m.count,
        `${m.percentage.toFixed(1)}%`
      ]);
      const methodSheet = XLSX.utils.aoa_to_sheet([methodHeaders, ...methodRows]);
      XLSX.utils.book_append_sheet(workbook, methodSheet, 'Method Breakdown');

      // Detailed Transactions Sheet
      const txHeaders = ['Date', 'Reference #', 'Invoice / Bill #', 'Party Name', 'Type', 'Method', 'Amount', 'Notes'];
      const txRows = paymentsList.map(p => [
        safelyToLocaleDate(p.payment_date),
        p.reference_number || 'N/A',
        p.invoice_number,
        p.party_name,
        p.invoice_type.toUpperCase(),
        p.payment_method.toUpperCase(),
        p.amount,
        p.notes || ''
      ]);
      const txSheet = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
      XLSX.utils.book_append_sheet(workbook, txSheet, 'Transactions');

      XLSX.writeFile(workbook, `escrowbill-payments-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast({ title: "Success", description: "Payments report Excel downloaded successfully." });
    } catch (error) {
      console.error('Error exporting payments Excel:', error);
      toast({ variant: "destructive", title: "Export Failed", description: "Could not export payments report." });
    }
  };


export const exportItemsExcel = (ctx: ReportsExportContext) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    const workbook = XLSX.utils.book_new();

    const period = startDate && endDate
      ? `${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`
      : dateRange.replace('_', ' ').toUpperCase();

    // Summary Sheet
    const summaryData = [
      ['ITEM-WISE PROFIT REPORT SUMMARY'],
      [`Period: ${period}`],
      [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
      [],
      ['Metric', 'Value'],
      ['Total Items Sold', itemsReports.reduce((sum, item) => sum + item.quantitySold, 0)],
      ['Total Revenue', itemsReports.reduce((sum, item) => sum + item.totalSales, 0)],
      ['Total Cost', itemsReports.reduce((sum, item) => sum + item.totalCost, 0)],
      ['Total Net Profit', itemsReports.reduce((sum, item) => sum + item.netProfit, 0)],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Details Sheet
    const headers = ['Item Name', 'SKU', 'HSN', 'Qty Sold', 'Revenue', 'Cost', 'Profit', 'Margin %'];
    const rows = itemsReports.map(item => [
      item.name,
      item.sku,
      item.hsn,
      item.quantitySold,
      item.totalSales,
      item.totalCost,
      item.netProfit,
      item.margin.toFixed(2)
    ]);

    const detailedSheet = XLSX.utils.aoa_to_sheet([
      ['DETAILED ITEM PERFORMANCE & PROFIT'],
      [],
      headers,
      ...rows
    ]);

    detailedSheet['!cols'] = [
      { wch: 30 }, // Name
      { wch: 15 }, // SKU
      { wch: 12 }, // HSN
      { wch: 10 }, // Qty
      { wch: 15 }, // Revenue
      { wch: 15 }, // Cost
      { wch: 15 }, // Profit
      { wch: 12 }  // Margin %
    ];

    XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Items Profit');

    XLSX.writeFile(workbook, `item-wise-profit-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: "Success", description: "Item profit Excel downloaded successfully." });
  };


export const exportDownpaymentsExcel = (ctx: ReportsExportContext) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    try {
      const exportData = filteredDownpaymentsList.map((item, idx) => ({
        '#': idx + 1,
        'Booking Date': safelyToLocaleDate(item.created_at),
        'Downpayment Receipt #': item.invoice_number,
        'Customer Name': item.client_name,
        'Vehicle Model': item.vehicle_name,
        'Chassis / VIN': item.vehicle_vin || 'N/A',
        'Reg / Temp #': item.vehicle_reg || 'N/A',
        'Vehicle Valuation': item.total_amount,
        'Advance Collected': item.advance_amount,
        'Balance Due': item.balance_due,
        'Financed Amount': item.financed_amount,
        'Financier / Bank': item.financier || 'N/A',
        'Payment Status': item.status.toUpperCase()
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehicle_Downpayments');
      XLSX.writeFile(workbook, `downpayment-report-${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "Excel Exported",
        description: "Vehicle downpayment register downloaded successfully."
      });
    } catch (err) {
      console.error('Error exporting downpayment excel:', err);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not export Downpayment Excel file."
      });
    }
  };


export const exportToExcel = (ctx: ReportsExportContext) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Revenue', stats.totalRevenue],
      ['Total Invoices', stats.totalInvoices],
      ['Paid Invoices', stats.paidInvoices],
      ['Pending Amount', stats.pendingAmount],
      ['Overdue Amount', stats.overdueAmount],
      ['Net Profit', stats.netProfit],
      ['Average Invoice Value', stats.averageInvoiceValue]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Monthly Data Sheet
    const monthlyHeaders = ['Month', 'Revenue', 'Expenses', 'Profit', 'Invoices'];
    const monthlyRows = monthlyData.map(month => [
      month.month,
      month.revenue,
      month.expenses,
      month.profit,
      month.invoices
    ]);
    const monthlySheet = XLSX.utils.aoa_to_sheet([monthlyHeaders, ...monthlyRows]);
    XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Data');

    // Client Reports Sheet
    const clientHeaders = ['Client', 'Total Invoices', 'Total Amount', 'Paid Amount', 'Pending Amount'];
    const clientRows = clientReports.map(client => [
      client.client_name,
      client.total_invoices,
      client.total_amount,
      client.paid_amount,
      client.pending_amount
    ]);
    const clientSheet = XLSX.utils.aoa_to_sheet([clientHeaders, ...clientRows]);
    XLSX.utils.book_append_sheet(workbook, clientSheet, 'Client Reports');

    // Invoice List Sheet
    const invoiceHeaders = ['Date', 'Invoice #', 'Client', 'Amount', 'Status'];
    const invoiceRows = invoicesList.map(inv => [
      safelyToLocaleDate(inv.created_at),
      inv.invoice_number,
      inv.client_name,
      inv.total_amount,
      inv.status
    ]);
    const invoiceSheet = XLSX.utils.aoa_to_sheet([invoiceHeaders, ...invoiceRows]);
    XLSX.utils.book_append_sheet(workbook, invoiceSheet, 'Invoices');

    XLSX.writeFile(workbook, `business-report-${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Success",
      description: "Excel report downloaded successfully."
    });
  };


export const exportOverviewExcel = (ctx: ReportsExportContext) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    const workbook = XLSX.utils.book_new();

    const period = startDate && endDate
      ? `${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`
      : dateRange.replace('_', ' ').toUpperCase();

    const summaryData = [
      ['OVERVIEW REPORT'],
      [`Period: ${period}`],
      [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
      [],
      ['Metric', 'Value'],
      ['Total Revenue', stats.totalRevenue],
      ['Total Invoices', stats.totalInvoices],
      ['Paid Invoices', stats.paidInvoices],
      ['Pending Amount', stats.pendingAmount],
      ['Total Expenses', stats.totalExpenses],
      ['Net Profit', stats.netProfit],
      ['Average Invoice Value', stats.averageInvoiceValue]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

    // Set column widths
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Overview');

    XLSX.writeFile(workbook, `overview-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: "Success", description: "Overview Excel downloaded successfully." });
  };


export const exportInvoicesExcel = (ctx: ReportsExportContext) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    const workbook = XLSX.utils.book_new();

    const period = startDate && endDate
      ? `${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`
      : dateRange.replace('_', ' ').toUpperCase();

    const invoiceHeaders = ['Date', 'Invoice #', 'Client', 'Amount', 'Status'];
    const invoiceRows = invoicesList.map(inv => [
      safelyToLocaleDate(inv.created_at),
      inv.invoice_number,
      inv.client_name,
      inv.total_amount,
      inv.status.toUpperCase()
    ]);

    const sheetData = [
      ['INVOICES REPORT'],
      [`Period: ${period}`],
      [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
      [],
      invoiceHeaders,
      ...invoiceRows
    ];

    const invoiceSheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Set column widths
    invoiceSheet['!cols'] = [
      { wch: 15 }, // Date
      { wch: 20 }, // Invoice #
      { wch: 30 }, // Client
      { wch: 15 }, // Amount
      { wch: 15 }  // Status
    ];

    XLSX.utils.book_append_sheet(workbook, invoiceSheet, 'Invoices');

    XLSX.writeFile(workbook, `invoices-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: "Success", description: "Invoices Excel downloaded successfully." });
  };


export const exportFinancialExcel = (ctx: ReportsExportContext) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    const workbook = XLSX.utils.book_new();

    const period = startDate && endDate
      ? `${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`
      : dateRange.replace('_', ' ').toUpperCase();

    // Financial Summary
    const profitMargin = stats.totalRevenue > 0 ? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(2) + '%' : '0%';
    const financialData = [
      ['FINANCIAL SUMMARY REPORT'],
      [`Period: ${period}`],
      [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
      [],
      ['Metric', 'Value'],
      ['Total Revenue', stats.totalRevenue],
      ['Total Expenses', stats.totalExpenses],
      ['Net Profit', stats.netProfit],
      ['Profit Margin', profitMargin]
    ];
    const financialSheet = XLSX.utils.aoa_to_sheet(financialData);
    financialSheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, financialSheet, 'Financial Summary');

    // Monthly Data
    if (monthlyData && monthlyData.length > 0) {
      const monthlyHeaders = ['Month', 'Revenue', 'Expenses', 'Profit', 'Invoices'];
      const monthlyRows = monthlyData.map(month => [
        month.month,
        month.revenue,
        month.expenses,
        month.profit,
        month.invoices
      ]);
      const monthlySheet = XLSX.utils.aoa_to_sheet([
        ['MONTHLY TREND ANALYSIS'],
        [],
        monthlyHeaders,
        ...monthlyRows
      ]);
      monthlySheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Data');
    }

    XLSX.writeFile(workbook, `financial-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: "Success", description: "Financial Excel downloaded successfully." });
  };


export const exportClientsExcel = (ctx: ReportsExportContext) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    const workbook = XLSX.utils.book_new();

    const period = startDate && endDate
      ? `${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`
      : dateRange.replace('_', ' ').toUpperCase();

    const clientHeaders = ['Client Name', 'Total Invoices', 'Total Amount', 'Paid Amount', 'Pending Amount'];
    const clientRows = clientReports.map(client => [
      client.client_name,
      client.total_invoices,
      client.total_amount,
      client.paid_amount,
      client.pending_amount
    ]);

    const sheetData = [
      ['CLIENT PERFORMANCE REPORT'],
      [`Period: ${period}`],
      [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
      [],
      clientHeaders,
      ...clientRows
    ];

    const clientSheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Set column widths
    clientSheet['!cols'] = [
      { wch: 35 }, // Client
      { wch: 15 }, // Invoices
      { wch: 20 }, // Total
      { wch: 20 }, // Paid
      { wch: 20 }  // Pending
    ];

    XLSX.utils.book_append_sheet(workbook, clientSheet, 'Clients');

    XLSX.writeFile(workbook, `clients-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: "Success", description: "Clients Excel downloaded successfully." });
  };


export const exportExpensesExcel = (ctx: ReportsExportContext) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    const workbook = XLSX.utils.book_new();

    const period = startDate && endDate
      ? `${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`
      : dateRange.replace('_', ' ').toUpperCase();

    // Summary Sheet
    const summaryData = [
      ['EXPENSES REPORT SUMMARY'],
      [`Period: ${period}`],
      [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
      [],
      ['Metric', 'Value'],
      ['Total Expenses', stats.totalExpenses],
      ['Total Items', expensesList.length],
      ['Top Category', categoryData.length > 0 ? categoryData[0].name : 'N/A']
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Category Breakdown Sheet
    if (categoryData.length > 0) {
      const catHeaders = ['Category', 'Amount', 'Percentage'];
      const catRows = categoryData.map(cat => [
        cat.name,
        cat.value,
        ((cat.value / stats.totalExpenses) * 100).toFixed(2) + '%'
      ]);
      const catSheet = XLSX.utils.aoa_to_sheet([
        ['CATEGORY BREAKDOWN'],
        [],
        catHeaders,
        ...catRows
      ]);
      catSheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, catSheet, 'Categories');
    }

    // Detailed List Sheet
    const expenseHeaders = ['Date', 'Title', 'Category', 'Payment Method', 'Amount'];
    const expenseRows = expensesList.map(exp => [
      safelyToLocaleDate(exp.expense_date),
      exp.title,
      exp.category,
      exp.payment_method.toUpperCase(),
      exp.amount
    ]);

    const detailedSheet = XLSX.utils.aoa_to_sheet([
      ['DETAILED EXPENSE LIST'],
      [],
      expenseHeaders,
      ...expenseRows
    ]);

    detailedSheet['!cols'] = [
      { wch: 15 }, // Date
      { wch: 35 }, // Title
      { wch: 25 }, // Category
      { wch: 20 }, // Method
      { wch: 15 }  // Amount
    ];

    XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Expenses');

    XLSX.writeFile(workbook, `expenses-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: "Success", description: "Expenses Excel downloaded successfully." });
  };


export const exportInventoryExcel = (ctx: ReportsExportContext) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    const workbook = XLSX.utils.book_new();

    const companyName = companyProfile?.company_name || profile?.company_name || 'My Business';
    const companyGstin = companyProfile?.gstin || profile?.gstin || 'N/A';

    const summaryData = [
      ['INVENTORY STOCK & VALUATION AUDIT REPORT'],
      [`Company: ${companyName}`],
      [`GSTIN: ${companyGstin}`],
      [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
      [],
      ['Valuation Metric', 'Value'],
      ['Total Unique Items', inventoryStats.totalUnique],
      ['Total Stock Units', inventoryStats.totalStockQty],
      ['Inventory Asset Value (Cost)', inventoryStats.totalPurchaseVal],
      ['Sale Valuation (Retail)', inventoryStats.totalSalesVal],
      ['Expected Gross Profit', inventoryStats.totalProfit],
      ['Avg Profit Margin', `${inventoryStats.profitMarginPercent.toFixed(1)}%`],
      []
    ];

    const itemHeaders = [
      '#', 'Item Name', 'Type', 'SKU', 'HSN/SAC', 'Category', 'Unit', 'Tax Rate', 
      'Purchase Price', 'Sales Price', 'Stock Qty', 'Cost Valuation', 'Sale Valuation', 'Est. Profit'
    ];

    const itemRows = filteredAndSortedInventoryProducts.map((p, idx) => {
      const stock = p.type === 'service' ? 0 : Number(p.opening_stock || 0);
      const costVal = stock * Number(p.purchase_price || 0);
      const saleVal = stock * p.price;
      const profit = saleVal - costVal;
      return [
        idx + 1,
        p.name,
        p.type || 'product',
        p.sku || '-',
        p.hsn_code || '-',
        p.category || 'General',
        p.unit || 'pcs',
        `${p.tax_rate}%`,
        p.purchase_price || 0,
        p.price,
        p.type === 'service' ? 'N/A' : stock,
        costVal,
        saleVal,
        profit
      ];
    });

    const sheetData = [
      ...summaryData,
      itemHeaders,
      ...itemRows
    ];

    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
    sheet['!cols'] = [
      { wch: 6 }, { wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 15 },
      { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 16 },
      { wch: 16 }, { wch: 16 }
    ];

    XLSX.utils.book_append_sheet(workbook, sheet, 'Inventory Valuation');
    XLSX.writeFile(workbook, `inventory-stock-valuation-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: "Success", description: "Inventory Valuation Excel downloaded successfully." });
  };


export const exportInventoryCSV = (ctx: ReportsExportContext) => {
    const { companyProfile, profile, startDate, endDate, dateRange, stats, invoicesList, expensesList, paymentsList, paymentStats, downpaymentStats, filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts, currencySymbol = "₹", clientReports, monthlyData = [], categoryData = [], paymentMethodDistribution = [] } = ctx;
    try {
      const headers = [
        "Product Name", 
        "Type",
        "SKU", 
        "HSN/SAC", 
        "Category", 
        "Unit",
        "Tax Rate (%)", 
        "Purchase Price", 
        "Sales Price", 
        "Stock Qty", 
        "Asset Cost Valuation",
        "Retail Valuation",
        "Est. Profit",
        "Margin %"
      ];
      
      const rows = filteredAndSortedInventoryProducts.map((p) => {
        const stock = p.type === 'service' ? 0 : Number(p.opening_stock || 0);
        const costVal = stock * Number(p.purchase_price || 0);
        const saleVal = stock * p.price;
        const profit = saleVal - costVal;
        const margin = p.price > 0 ? ((p.price - Number(p.purchase_price || 0)) / p.price) * 100 : 0;
        return [
          p.name,
          p.type || "product",
          p.sku || "-",
          p.hsn_code || "-",
          p.category || "General",
          p.unit || "pcs",
          `${p.tax_rate}%`,
          p.purchase_price || 0,
          p.price,
          p.type === 'service' ? 'N/A' : stock,
          costVal,
          saleVal,
          profit,
          `${margin.toFixed(1)}%`
        ];
      });

      const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `EscrowBill_Stock_Valuation_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Stock valuation CSV downloaded successfully."
      });
    } catch (err) {
      console.error("CSV Export error:", err);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not export CSV file."
      });
    }
  };


