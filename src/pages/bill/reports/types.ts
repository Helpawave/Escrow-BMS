export interface ReportInvoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  subtotal?: number;
  tax_amount?: number;
  status: string;
  created_at: string;
  issue_date?: string;
  due_date?: string;
  notes?: string | null;
  terms?: string | null;
  payment_terms?: string | null;
  clients: {
    id: string;
    name: string;
    gstin?: string | null;
    state?: string | null;
    address?: string | null;
    postal_code?: string | null;
  } | null;
  invoice_items?: {
    id: string;
    product_id: string | null;
    description: string;
    quantity: number;
    rate: number;
    tax_rate?: number;
    amount: number;
    products: {
      id: string;
      name: string;
      price: number;
      purchase_price: number | null;
      sku: string | null;
      hsn_code: string | null;
    } | null;
  }[];
}

export interface DownpaymentReportItem {
  id: string;
  invoice_number: string;
  created_at: string;
  issue_date?: string;
  due_date?: string;
  client_name: string;
  total_amount: number;
  advance_amount: number;
  balance_due: number;
  financed_amount: number;
  status: string;
  vehicle_name: string;
  vehicle_vin?: string;
  vehicle_reg?: string;
  vehicle_color?: string;
  financier?: string;
  notes?: string | null;
}

export interface GSTR1B2BItem {
  gstin: string;
  clientName: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  placeOfSupply: string;
  reverseCharge: string;
  taxRate: number;
  taxableValue: number;
  integratedTax: number;
  centralTax: number;
  stateTax: number;
}

export interface GSTR1B2CSItem {
  placeOfSupply: string;
  taxRate: number;
  taxableValue: number;
  integratedTax: number;
  centralTax: number;
  stateTax: number;
}

export interface GSTR1HSNItem {
  hsnCode: string;
  description: string;
  uqc: string;
  totalQuantity: number;
  totalValue: number;
  taxableValue: number;
  integratedTax: number;
  centralTax: number;
  stateTax: number;
}

export interface GSTR1DocSummary {
  docType: string;
  fromSerial: string;
  toSerial: string;
  totalCount: number;
  cancelledCount: number;
  netIssued: number;
}

export interface GSTR2BITCItem {
  vendorGstin: string;
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  taxableValue: number;
  integratedTax: number;
  centralTax: number;
  stateTax: number;
  itcAvailable: string;
}

export interface GSTR3BTable31 {
  description: string;
  taxableValue: number;
  integratedTax: number;
  centralTax: number;
  stateTax: number;
}

export interface GSTR3BTable4 {
  description: string;
  integratedTax: number;
  centralTax: number;
  stateTax: number;
}

export interface GSTR3BTable61 {
  taxType: string;
  totalTaxPayable: number;
  itcPaid: number;
  taxPaidCash: number;
}

export interface CMP08Item {
  description: string;
  value: number;
  integratedTax: number;
  centralTax: number;
  stateTax: number;
}

export interface GSTR9AnnualItem {
  tableNumber: string;
  description: string;
  taxableValue: number;
  integratedTax: number;
  centralTax: number;
  stateTax: number;
}

export const GST_STATE_CODES: Record<string, string> = {
  '01': '01-Jammu & Kashmir',
  '02': '02-Himachal Pradesh',
  '03': '03-Punjab',
  '04': '04-Chandigarh',
  '05': '05-Uttarakhand',
  '06': '06-Haryana',
  '07': '07-Delhi',
  '08': '08-Rajasthan',
  '09': '09-Uttar Pradesh',
  '10': '10-Bihar',
  '11': '11-Sikkim',
  '12': '12-Arunachal Pradesh',
  '13': '13-Nagaland',
  '14': '14-Manipur',
  '15': '15-Mizoram',
  '16': '16-Tripura',
  '17': '17-Meghalaya',
  '18': '18-Assam',
  '19': '19-West Bengal',
  '20': '20-Jharkhand',
  '21': '21-Odisha',
  '22': '22-Chhattisgarh',
  '23': '23-Madhya Pradesh',
  '24': '24-Gujarat',
  '26': '26-Dadra & Nagar Haveli and Daman & Diu',
  '27': '27-Maharashtra',
  '29': '29-Karnataka',
  '30': '30-Goa',
  '31': '31-Lakshadweep',
  '32': '32-Kerala',
  '33': '33-Tamil Nadu',
  '34': '34-Puducherry',
  '35': '35-Andaman & Nicobar Islands',
  '36': '36-Telangana',
  '37': '37-Andhra Pradesh',
  '38': '38-Ladakh',
  '97': '97-Other Territory'
};

export interface DashboardStats {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingAmount: number;
  overdueAmount: number;
  totalClients: number;
  totalExpenses: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  netProfit: number;
  averageInvoiceValue: number;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  invoices: number;
  profit: number;
  [key: string]: string | number | boolean | null | undefined;
}

export interface ClientReportData {
  client_name: string;
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
}

export interface InvoiceListItem {
  id: string;
  invoice_number: string;
  created_at: string;
  client_name: string;
  total_amount: number;
  status: string;
}

export interface ExpenseListItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  expense_date: string;
  payment_method: string;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  tax_rate: number;
  discount?: number;
  amount: number;
}

export interface ItemReportData {
  productId: string | null;
  name: string;
  sku: string;
  hsn: string;
  quantitySold: number;
  totalSales: number;
  totalCost: number;
  netProfit: number;
  margin: number;
}

export interface PaymentReportItem {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
  invoice_id: string | null;
  party_name: string;
  invoice_number: string;
  invoice_type: 'sales' | 'purchase' | 'downpayment' | 'other';
  type?: 'sales' | 'purchase' | 'downpayment' | 'other';
}

export interface PaymentStats {
  totalCollected: number;
  totalTransactions: number;
  totalCount?: number;
  upiTotal: number;
  upiCollected?: number;
  cashTotal: number;
  cashCollected?: number;
  bankTransferTotal: number;
  bankCollected?: number;
  chequeTotal: number;
  cardTotal: number;
  otherTotal: number;
  averagePayment: number;
  averageReceipt?: number;
}

export interface PaymentMethodData {
  name: string;
  value: number;
  amount?: number;
  count: number;
  color: string;
  percentage: number;
}

export interface PaymentTimelineItem {
  date: string;
  total: number;
  amount?: number;
  count?: number;
  upi: number;
  cash: number;
  other: number;
}

export interface CatalogProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  discount?: number;
  tax_rate: number;
  unit: string;
  category: string;
  type?: string;
  opening_stock?: string;
  stock_quantity?: number;
  sku?: string;
  hsn_code?: string;
  purchase_price?: number;
}

export interface ReportsExportContext {
  companyProfile?: any;
  profile?: any;
  startDate?: string;
  endDate?: string;
  dateRange: string;
  currencySymbol?: string;
  stats: DashboardStats;
  monthlyData?: MonthlyData[];
  categoryData?: CategoryData[];
  clientReports: ClientReportData[];
  invoicesList: InvoiceListItem[];
  expensesList: ExpenseListItem[];
  paymentsList: PaymentReportItem[];
  paymentStats: PaymentStats;
  paymentMethodDistribution?: PaymentMethodData[];
  downpaymentStats: {
    count: number;
    totalValuation: number;
    totalAdvances: number;
    totalBalanceDue: number;
    totalFinanced: number;
  };
  filteredDownpaymentsList: DownpaymentReportItem[];
  itemsReports: ItemReportData[];
  inventoryStats: {
    totalUnique: number;
    totalStockQty: number;
    totalPurchaseVal: number;
    totalSalesVal: number;
    totalProfit: number;
    profitMarginPercent: number;
  };
  filteredAndSortedInventoryProducts: any[];
}

