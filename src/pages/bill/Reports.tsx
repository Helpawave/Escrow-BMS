import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Download,
  Filter,
  Search,
  Eye,
  RefreshCw,
  Receipt,
  RotateCcw,
  IndianRupee,
  CreditCard,
  ShoppingBag,
  Wallet,
  Banknote,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  Layers,
  ArrowUpDown,
  Package,
  Printer,
  Car
} from "lucide-react";
import { StaffHeaderBadge } from "@/components/StaffHeaderBadge";
import { supabase, serviceSupabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Invoice, Expense, Client } from "@/types/invoice";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Badge } from "@/components/ui/badge";
import { extractVehicleDetails, extractPaymentDetails } from "@/components/AutoInvoiceTemplate";
import { useUserType } from "@/hooks/useUserType";
import { OverviewReportTab } from "./reports/tabs/OverviewReportTab";
import { InvoicesReportTab } from "./reports/tabs/InvoicesReportTab";
import { DownpaymentsReportTab } from "./reports/tabs/DownpaymentsReportTab";
import { PaymentsReportTab } from "./reports/tabs/PaymentsReportTab";
import { ExpensesReportTab } from "./reports/tabs/ExpensesReportTab";
import { FinancialReportTab } from "./reports/tabs/FinancialReportTab";
import { ClientsReportTab } from "./reports/tabs/ClientsReportTab";
import { GstReportTab } from "./reports/tabs/GstReportTab";
import { InventoryReportTab } from "./reports/tabs/InventoryReportTab";
import {
  exportAllGSTExcel as exportAllGSTExcelUtil,
  exportIndividualGSTR1Excel as exportIndividualGSTR1ExcelUtil,
  exportIndividualGSTR2BExcel as exportIndividualGSTR2BExcelUtil,
  exportIndividualGSTR2BPDF as exportIndividualGSTR2BPDFUtil,
  exportIndividualGSTR3BExcel as exportIndividualGSTR3BExcelUtil,
  exportIndividualGSTR3BPDF as exportIndividualGSTR3BPDFUtil,
  exportIndividualCMP08Excel as exportIndividualCMP08ExcelUtil,
  exportIndividualGSTR9Excel as exportIndividualGSTR9ExcelUtil,
  exportIndividualGSTR9PDF as exportIndividualGSTR9PDFUtil,
  exportGSTR1JSON as exportGSTR1JSONUtil,
  exportGSTPDF as exportGSTPDFUtil,
  GstExportContext
} from './reports/utils/gstExportUtils';

import {
  exportPaymentsPDF as exportPaymentsPDFUtil,
  exportItemsPDF as exportItemsPDFUtil,
  exportToPDF as exportToPDFUtil,
  exportOverviewPDF as exportOverviewPDFUtil,
  exportInvoicesPDF as exportInvoicesPDFUtil,
  exportDownpaymentsPDF as exportDownpaymentsPDFUtil,
  exportFinancialPDF as exportFinancialPDFUtil,
  exportClientsPDF as exportClientsPDFUtil,
  exportExpensesPDF as exportExpensesPDFUtil,
  exportInventoryPDF as exportInventoryPDFUtil,
} from './reports/utils/pdfExportUtils';

import {
  exportPaymentsExcel as exportPaymentsExcelUtil,
  exportItemsExcel as exportItemsExcelUtil,
  exportDownpaymentsExcel as exportDownpaymentsExcelUtil,
  exportToExcel as exportToExcelUtil,
  exportOverviewExcel as exportOverviewExcelUtil,
  exportInvoicesExcel as exportInvoicesExcelUtil,
  exportFinancialExcel as exportFinancialExcelUtil,
  exportClientsExcel as exportClientsExcelUtil,
  exportExpensesExcel as exportExpensesExcelUtil,
  exportInventoryExcel as exportInventoryExcelUtil,
  exportInventoryCSV as exportInventoryCSVUtil,
} from './reports/utils/excelExportUtils';
import { ReportsExportContext } from './reports/types';

interface ReportInvoice {
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

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  invoices: number;
  profit: number;
  [key: string]: string | number | boolean | null | undefined;
}
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, ComposedChart, Tooltip } from "recharts";
import LazyChart from "@/components/LazyChart";
import { InvoicePreview } from "@/components/InvoicePreview";
import * as XLSX from 'xlsx';

interface DashboardStats {
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

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  invoices: number;
  profit: number;
}

interface ClientReportData {
  client_name: string;
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
}

interface InvoiceListItem {
  id: string;
  invoice_number: string;
  created_at: string;
  client_name: string;
  total_amount: number;
  status: string;
}

interface ExpenseListItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  expense_date: string;
  payment_method: string;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  tax_rate: number;
  discount?: number;
  amount: number;
}

interface ItemReportData {
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
  purchase_price?: number;
  sku?: string;
  hsn_code?: string;
  low_stock_warning?: boolean;
  created_at?: string;
}

const ReportsPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    totalClients: 0,
    totalExpenses: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    netProfit: 0,
    averageInvoiceValue: 0
  });

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [clientReports, setClientReports] = useState<ClientReportData[]>([]);
  const [invoicesList, setInvoicesList] = useState<InvoiceListItem[]>([]);
  const [expensesList, setExpensesList] = useState<ExpenseListItem[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last_6_months');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const { isAutomobile } = useUserType();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isAutomobile && activeTab === 'downpayments') {
      setActiveTab('overview');
    }
  }, [isAutomobile, activeTab]);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState("");
  const [debouncedInvoiceSearch, setDebouncedInvoiceSearch] = useState("");
  const [selectedInvoiceStatus, setSelectedInvoiceStatus] = useState<string>('all');
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState<string>('all');
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [debouncedClientSearch, setDebouncedClientSearch] = useState("");
  const [clientSortField, setClientSortField] = useState<'name' | 'invoices' | 'total' | 'paid' | 'pending' | 'rate'>('total');
  const [clientSortDirection, setClientSortDirection] = useState<'asc' | 'desc'>('desc');

  // Payments Reports State
  const [paymentsList, setPaymentsList] = useState<PaymentReportItem[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    totalCollected: 0,
    totalTransactions: 0,
    upiTotal: 0,
    cashTotal: 0,
    bankTransferTotal: 0,
    chequeTotal: 0,
    cardTotal: 0,
    otherTotal: 0,
    averagePayment: 0
  });
  const [paymentMethodDistribution, setPaymentMethodDistribution] = useState<PaymentMethodData[]>([]);
  const [paymentTimeline, setPaymentTimeline] = useState<PaymentTimelineItem[]>([]);
  const [paymentSearchTerm, setPaymentSearchTerm] = useState("");
  const [debouncedPaymentSearch, setDebouncedPaymentSearch] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("all");

  // Downpayment Reports State
  const [downpaymentsList, setDownpaymentsList] = useState<DownpaymentReportItem[]>([]);
  const [downpaymentSearchTerm, setDownpaymentSearchTerm] = useState("");
  const [debouncedDownpaymentSearch, setDebouncedDownpaymentSearch] = useState("");
  const [selectedDownpaymentStatus, setSelectedDownpaymentStatus] = useState<string>("all");
  const [downpaymentReportPage, setDownpaymentReportPage] = useState(1);
  const [downpaymentReportPageSize, setDownpaymentReportPageSize] = useState(10);

  // Item Reports State
  const [itemsReports, setItemsReports] = useState<ItemReportData[]>([]);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [debouncedItemSearch, setDebouncedItemSearch] = useState("");
  const [itemSortField, setItemSortField] = useState<'name' | 'quantity' | 'sales' | 'cost' | 'profit' | 'margin'>('sales');
  const [itemSortDirection, setItemSortDirection] = useState<'asc' | 'desc'>('desc');

  // GST Reports State (GSTR-1 to GSTR-9C Suite)
  const [gstSubTab, setGstSubTab] = useState<'gstr1' | 'gstr2b' | 'gstr3b' | 'cmp08' | 'gstr9' | 'hsn'>('gstr1');
  const [gstr1Section, setGstr1Section] = useState<'b2b' | 'b2cl' | 'b2cs' | 'docs'>('b2b');
  const [gstr1B2BList, setGstr1B2BList] = useState<GSTR1B2BItem[]>([]);
  const [gstr1B2CLList, setGstr1B2CLList] = useState<GSTR1B2BItem[]>([]);
  const [gstr1B2CSList, setGstr1B2CSList] = useState<GSTR1B2CSItem[]>([]);
  const [gstr1HSNList, setGstr1HSNList] = useState<GSTR1HSNItem[]>([]);
  const [gstr1DocSummary, setGstr1DocSummary] = useState<GSTR1DocSummary[]>([]);
  const [gstr2bList, setGstr2bList] = useState<GSTR2BITCItem[]>([]);
  const [gstr3bTable31, setGstr3bTable31] = useState<GSTR3BTable31[]>([]);
  const [gstr3bTable4, setGstr3bTable4] = useState<GSTR3BTable4[]>([]);
  const [gstr3bTable61, setGstr3bTable61] = useState<GSTR3BTable61[]>([]);
  const [cmp08Data, setCmp08Data] = useState<CMP08Item[]>([]);
  const [gstr9Data, setGstr9Data] = useState<GSTR9AnnualItem[]>([]);
  const [gstSummaryStats, setGstSummaryStats] = useState({
    totalOutputTax: 0,
    totalOutputTaxable: 0,
    totalInputTax: 0,
    totalInputTaxable: 0,
    netCashPayable: 0,
    totalInvoicesIssued: 0,
    totalB2BInvoices: 0,
    totalB2CInvoices: 0,
    outputIGST: 0,
    outputCGST: 0,
    outputSGST: 0,
    inputIGST: 0,
    inputCGST: 0,
    inputSGST: 0,
  });
  const [gstSearchTerm, setGstSearchTerm] = useState("");
  const [debouncedGstSearch, setDebouncedGstSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGstSearch(gstSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [gstSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedItemSearch(itemSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [itemSearchTerm]);

  const filteredAndSortedItems = useMemo(() => {
    const q = debouncedItemSearch.trim().toLowerCase();
    
    // Filter
    let filtered = itemsReports;
    if (q) {
      filtered = itemsReports.filter(item => 
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.hsn.toLowerCase().includes(q)
      );
    }
    
    // Sort
    return [...filtered].sort((a, b) => {
      let valA: string | number = 0;
      let valB: string | number = 0;
      
      switch (itemSortField) {
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'quantity':
          valA = a.quantitySold;
          valB = b.quantitySold;
          break;
        case 'sales':
          valA = a.totalSales;
          valB = b.totalSales;
          break;
        case 'cost':
          valA = a.totalCost;
          valB = b.totalCost;
          break;
        case 'profit':
          valA = a.netProfit;
          valB = b.netProfit;
          break;
        case 'margin':
          valA = a.margin;
          valB = b.margin;
          break;
      }
      
      if (valA < valB) return itemSortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return itemSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [itemsReports, debouncedItemSearch, itemSortField, itemSortDirection]);

  const handleItemSort = (field: 'name' | 'quantity' | 'sales' | 'cost' | 'profit' | 'margin') => {
    if (itemSortField === field) {
      setItemSortDirection(itemSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setItemSortField(field);
      setItemSortDirection('desc');
    }
  };

  const itemProfitStats = useMemo(() => {
    let totalUnitsSold = 0;
    let totalSalesVal = 0;
    let totalCostVal = 0;
    let totalProfitVal = 0;

    itemsReports.forEach(item => {
      totalUnitsSold += item.quantitySold || 0;
      totalSalesVal += item.totalSales || 0;
      totalCostVal += item.totalCost || 0;
      totalProfitVal += item.netProfit || 0;
    });

    const avgMargin = totalSalesVal > 0 ? (totalProfitVal / totalSalesVal) * 100 : 0;

    return {
      totalItems: itemsReports.length,
      totalUnitsSold,
      totalSalesVal,
      totalCostVal,
      totalProfitVal,
      avgMargin
    };
  }, [itemsReports]);

  const filteredItemTotals = useMemo(() => {
    return filteredAndSortedItems.reduce((acc, item) => ({
      units: acc.units + (item.quantitySold || 0),
      sales: acc.sales + (item.totalSales || 0),
      cost: acc.cost + (item.totalCost || 0),
      profit: acc.profit + (item.netProfit || 0)
    }), { units: 0, sales: 0, cost: 0, profit: 0 });
  }, [filteredAndSortedItems]);

  // Product Report Sub-Tab State ('stock' = Stock Valuation & Ledger, 'profit' = Items Profit & Sales)
  const [productReportSubTab, setProductReportSubTab] = useState<'stock' | 'profit'>('stock');

  // Inventory Stock & Valuation Report State
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [inventorySearch, setInventorySearch] = useState("");
  const [debouncedInventorySearch, setDebouncedInventorySearch] = useState("");
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState("all");
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState("all");
  const [inventoryStockFilter, setInventoryStockFilter] = useState("all");
  const [showInventoryTaxBreakdown, setShowInventoryTaxBreakdown] = useState(false);
  const [inventorySortField, setInventorySortField] = useState<'name' | 'stock' | 'cost' | 'sale' | 'profit' | 'margin'>('stock');
  const [inventorySortDirection, setInventorySortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInventorySearch(inventorySearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [inventorySearch]);

  const inventoryCategories = useMemo(() => {
    const cats = new Set<string>();
    catalogProducts.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [catalogProducts]);

  const filteredAndSortedInventoryProducts = useMemo(() => {
    const q = debouncedInventorySearch.trim().toLowerCase();
    
    const filtered = catalogProducts.filter(p => {
      const matchesSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.hsn_code && p.hsn_code.toLowerCase().includes(q));

      const matchesCategory = inventoryCategoryFilter === "all" || p.category === inventoryCategoryFilter;
      const matchesType = inventoryTypeFilter === "all" || p.type === inventoryTypeFilter;

      const stock = Number(p.opening_stock || 0);
      let matchesStock = true;
      if (inventoryStockFilter === "low_stock") {
        matchesStock = p.type !== 'service' && stock > 0 && stock <= 5;
      } else if (inventoryStockFilter === "out_of_stock") {
        matchesStock = p.type !== 'service' && stock <= 0;
      } else if (inventoryStockFilter === "in_stock") {
        matchesStock = p.type === 'service' || stock > 5;
      }

      return matchesSearch && matchesCategory && matchesType && matchesStock;
    });

    return [...filtered].sort((a, b) => {
      let valA: string | number = 0;
      let valB: string | number = 0;

      const stockA = a.type === 'service' ? 0 : Number(a.opening_stock || 0);
      const stockB = b.type === 'service' ? 0 : Number(b.opening_stock || 0);
      const costA = stockA * Number(a.purchase_price || 0);
      const costB = stockB * Number(b.purchase_price || 0);
      const saleA = stockA * a.price;
      const saleB = stockB * b.price;
      const profitA = saleA - costA;
      const profitB = saleB - costB;
      const marginA = a.price > 0 ? ((a.price - Number(a.purchase_price || 0)) / a.price) * 100 : 0;
      const marginB = b.price > 0 ? ((b.price - Number(b.purchase_price || 0)) / b.price) * 100 : 0;

      switch (inventorySortField) {
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'stock':
          valA = stockA;
          valB = stockB;
          break;
        case 'cost':
          valA = costA;
          valB = costB;
          break;
        case 'sale':
          valA = saleA;
          valB = saleB;
          break;
        case 'profit':
          valA = profitA;
          valB = profitB;
          break;
        case 'margin':
          valA = marginA;
          valB = marginB;
          break;
      }

      if (valA < valB) return inventorySortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return inventorySortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [catalogProducts, debouncedInventorySearch, inventoryCategoryFilter, inventoryTypeFilter, inventoryStockFilter, inventorySortField, inventorySortDirection]);

  const handleInventorySort = (field: 'name' | 'stock' | 'cost' | 'sale' | 'profit' | 'margin') => {
    if (inventorySortField === field) {
      setInventorySortDirection(inventorySortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setInventorySortField(field);
      setInventorySortDirection('desc');
    }
  };

  const inventoryStats = useMemo(() => {
    const totalUnique = filteredAndSortedInventoryProducts.length;
    let totalStockQty = 0;
    let totalPurchaseVal = 0;
    let totalSalesVal = 0;
    let totalProfit = 0;

    filteredAndSortedInventoryProducts.forEach(p => {
      if (p.type !== 'service') {
        const stock = Number(p.opening_stock || 0);
        totalStockQty += stock;
        totalPurchaseVal += stock * Number(p.purchase_price || 0);
        totalSalesVal += stock * p.price;
        totalProfit += stock * (p.price - Number(p.purchase_price || 0));
      }
    });

    const profitMarginPercent = totalSalesVal > 0 ? (totalProfit / totalSalesVal) * 100 : 0;

    return {
      totalUnique,
      totalStockQty,
      totalPurchaseVal,
      totalSalesVal,
      totalProfit,
      profitMarginPercent
    };
  }, [filteredAndSortedInventoryProducts]);

  const inventoryTaxBrackets = useMemo(() => {
    const brackets: Record<number, { taxableValue: number; taxAmount: number; totalValue: number; itemsCount: number }> = {};
    
    filteredAndSortedInventoryProducts.forEach(p => {
      if (p.type !== 'service') {
        const stock = Number(p.opening_stock || 0);
        const rate = Number(p.tax_rate || 0);
        const stockValCost = stock * Number(p.purchase_price || 0);
        const taxVal = stockValCost * (rate / 100);
        const total = stockValCost + taxVal;
        
        if (!brackets[rate]) {
          brackets[rate] = { taxableValue: 0, taxAmount: 0, totalValue: 0, itemsCount: 0 };
        }
        brackets[rate].taxableValue += stockValCost;
        brackets[rate].taxAmount += taxVal;
        brackets[rate].totalValue += total;
        brackets[rate].itemsCount += 1;
      }
    });
    
    return Object.entries(brackets).map(([rate, data]) => ({
      rate: Number(rate),
      ...data
    })).sort((a, b) => a.rate - b.rate);
  }, [filteredAndSortedInventoryProducts]);


  const navigate = useNavigate();
  const { user, effectiveUserId, isStaff, staffPermissions, companyProfile, profile } = useAuth();
  const targetUserId = effectiveUserId || user?.id;
  const { toast } = useToast();
  const { currencySymbol, formatAmount } = useCurrency();

  useEffect(() => {
    if (isStaff) {
      const permissionPathMap: Record<string, string> = {
        'invoices': '/invoices',
        'purchase-invoices': '/purchase-invoices',
        'clients': '/clients',
        'vendors': '/vendors',
        'products': '/products',
        'payments': '/payments',
        'expenses': '/expenses',
        'einvoice': '/einvoice',
      };
      let target = '/settings';
      for (const perm of (staffPermissions || [])) {
        if (permissionPathMap[perm]) {
          target = permissionPathMap[perm];
          break;
        }
      }
      navigate(target, { replace: true });
    }
  }, [isStaff, staffPermissions, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInvoiceSearch(invoiceSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [invoiceSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedClientSearch(clientSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [clientSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPaymentSearch(paymentSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [paymentSearchTerm]);

  const filteredPaymentsList = useMemo(() => {
    const q = debouncedPaymentSearch.trim().toLowerCase();
    let list = paymentsList;

    if (selectedPaymentMethod !== 'all') {
      list = list.filter(p => {
        const m = (p.payment_method || '').toLowerCase();
        if (selectedPaymentMethod === 'upi') {
          return m.includes('upi') || m.includes('online') || m.includes('qr');
        }
        if (selectedPaymentMethod === 'cash') {
          return m === 'cash';
        }
        if (selectedPaymentMethod === 'bank_transfer') {
          return m.includes('bank') || m.includes('neft') || m.includes('rtgs') || m.includes('transfer') || m.includes('netbanking');
        }
        if (selectedPaymentMethod === 'cheque') {
          return m.includes('cheque') || m.includes('check');
        }
        if (selectedPaymentMethod === 'card') {
          return m.includes('card'); // matches credit_card, debit_card, card
        }
        return m === selectedPaymentMethod.toLowerCase();
      });
    }

    if (!q) return list;
    return list.filter(p => {
      return (
        p.party_name.toLowerCase().includes(q) ||
        p.invoice_number.toLowerCase().includes(q) ||
        (p.reference_number || '').toLowerCase().includes(q) ||
        (p.notes || '').toLowerCase().includes(q) ||
        p.payment_method.toLowerCase().includes(q)
      );
    });
  }, [paymentsList, debouncedPaymentSearch, selectedPaymentMethod]);

  const filteredInvoicesList = useMemo(() => {
    const q = debouncedInvoiceSearch.trim().toLowerCase();
    let list = invoicesList;
    
    if (selectedInvoiceStatus !== 'all') {
      if (selectedInvoiceStatus === 'pending') {
        list = list.filter(inv => ['draft', 'sent', 'viewed'].includes(inv.status));
      } else {
        list = list.filter(inv => inv.status === selectedInvoiceStatus);
      }
    }
    
    if (!q) return list;
    return list.filter((inv) => {
      return (
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.client_name.toLowerCase().includes(q) ||
        inv.status.toLowerCase().includes(q)
      );
    });
  }, [invoicesList, debouncedInvoiceSearch, selectedInvoiceStatus]);

  const billingSummary = useMemo(() => {
    const paid = invoicesList.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0);
    const pending = invoicesList.filter(i => ['draft', 'sent', 'viewed'].includes(i.status)).reduce((sum, i) => sum + i.total_amount, 0);
    const overdue = invoicesList.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total_amount, 0);
    const total = paid + pending + overdue;
    
    return {
      paid,
      pending,
      overdue,
      total,
      paidPct: total > 0 ? (paid / total) * 100 : 0,
      pendingPct: total > 0 ? (pending / total) * 100 : 0,
      overduePct: total > 0 ? (overdue / total) * 100 : 0,
    };
  }, [invoicesList]);

  const filteredExpensesList = useMemo(() => {
    if (selectedExpenseCategory === 'all') return expensesList;
    return expensesList.filter(exp => exp.category === selectedExpenseCategory);
  }, [expensesList, selectedExpenseCategory]);

  const filteredAndSortedClients = useMemo(() => {
    const q = debouncedClientSearch.trim().toLowerCase();
    
    // Filter
    let filtered = clientReports;
    if (q) {
      filtered = clientReports.filter(c => c.client_name.toLowerCase().includes(q));
    }
    
    // Sort
    return [...filtered].sort((a, b) => {
      let valA: string | number = 0;
      let valB: string | number = 0;
      
      switch (clientSortField) {
        case 'name':
          valA = a.client_name.toLowerCase();
          valB = b.client_name.toLowerCase();
          break;
        case 'invoices':
          valA = a.total_invoices;
          valB = b.total_invoices;
          break;
        case 'total':
          valA = a.total_amount;
          valB = b.total_amount;
          break;
        case 'paid':
          valA = a.paid_amount;
          valB = b.paid_amount;
          break;
        case 'pending':
          valA = a.pending_amount;
          valB = b.pending_amount;
          break;
        case 'rate':
          valA = a.total_amount > 0 ? (a.paid_amount / a.total_amount) : 0;
          valB = b.total_amount > 0 ? (b.paid_amount / b.total_amount) : 0;
          break;
      }
      
      if (valA < valB) return clientSortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return clientSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [clientReports, debouncedClientSearch, clientSortField, clientSortDirection]);

  // Pagination states for report tables
  const [salesReportPage, setSalesReportPage] = useState(1);
  const [salesReportPageSize, setSalesReportPageSize] = useState(10);

  const [expensesReportPage, setExpensesReportPage] = useState(1);
  const [expensesReportPageSize, setExpensesReportPageSize] = useState(10);

  const [clientsReportPage, setClientsReportPage] = useState(1);
  const [clientsReportPageSize, setClientsReportPageSize] = useState(10);

  useEffect(() => {
    setSalesReportPage(1);
  }, [debouncedInvoiceSearch, selectedInvoiceStatus]);

  useEffect(() => {
    setExpensesReportPage(1);
  }, [selectedExpenseCategory]);

  useEffect(() => {
    setClientsReportPage(1);
  }, [debouncedClientSearch, clientSortField, clientSortDirection]);

  const paginatedInvoicesList = useMemo(() => {
    const from = (salesReportPage - 1) * salesReportPageSize;
    return filteredInvoicesList.slice(from, from + salesReportPageSize);
  }, [filteredInvoicesList, salesReportPage, salesReportPageSize]);

  const paginatedExpensesList = useMemo(() => {
    const from = (expensesReportPage - 1) * expensesReportPageSize;
    return filteredExpensesList.slice(from, from + expensesReportPageSize);
  }, [filteredExpensesList, expensesReportPage, expensesReportPageSize]);

  const paginatedClientsList = useMemo(() => {
    const from = (clientsReportPage - 1) * clientsReportPageSize;
    return filteredAndSortedClients.slice(from, from + clientsReportPageSize);
  }, [filteredAndSortedClients, clientsReportPage, clientsReportPageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDownpaymentSearch(downpaymentSearchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [downpaymentSearchTerm]);

  useEffect(() => {
    setDownpaymentReportPage(1);
  }, [debouncedDownpaymentSearch, selectedDownpaymentStatus]);

  const downpaymentStats = useMemo(() => {
    const totalValuation = downpaymentsList.reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0);
    const totalAdvances = downpaymentsList.reduce((sum, d) => sum + (Number(d.advance_amount) || 0), 0);
    const totalBalanceDue = downpaymentsList.reduce((sum, d) => sum + (Number(d.balance_due) || 0), 0);
    const totalFinanced = downpaymentsList.reduce((sum, d) => sum + (Number(d.financed_amount) || 0), 0);
    const paidCount = downpaymentsList.filter(d => d.status === 'paid').length;
    const partialCount = downpaymentsList.filter(d => d.advance_amount > 0 && d.balance_due > 0).length;
    const pendingCount = downpaymentsList.filter(d => ['draft', 'sent', 'viewed', 'pending'].includes(d.status)).length;

    return {
      totalValuation,
      totalAdvances,
      totalBalanceDue,
      totalFinanced,
      count: downpaymentsList.length,
      paidCount,
      partialCount,
      pendingCount,
      collectionRate: totalValuation > 0 ? (totalAdvances / totalValuation) * 100 : 0
    };
  }, [downpaymentsList]);

  const filteredDownpaymentsList = useMemo(() => {
    let list = downpaymentsList;
    if (selectedDownpaymentStatus !== 'all') {
      if (selectedDownpaymentStatus === 'paid') {
        list = list.filter(d => d.status === 'paid');
      } else if (selectedDownpaymentStatus === 'partial') {
        list = list.filter(d => d.advance_amount > 0 && d.balance_due > 0);
      } else if (selectedDownpaymentStatus === 'pending') {
        list = list.filter(d => ['draft', 'sent', 'viewed', 'pending'].includes(d.status));
      }
    }
    const q = debouncedDownpaymentSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(d =>
      d.invoice_number.toLowerCase().includes(q) ||
      d.client_name.toLowerCase().includes(q) ||
      d.vehicle_name.toLowerCase().includes(q) ||
      (d.vehicle_vin && d.vehicle_vin.toLowerCase().includes(q)) ||
      (d.vehicle_reg && d.vehicle_reg.toLowerCase().includes(q)) ||
      (d.financier && d.financier.toLowerCase().includes(q))
    );
  }, [downpaymentsList, selectedDownpaymentStatus, debouncedDownpaymentSearch]);

  const paginatedDownpaymentsList = useMemo(() => {
    const from = (downpaymentReportPage - 1) * downpaymentReportPageSize;
    return filteredDownpaymentsList.slice(from, from + downpaymentReportPageSize);
  }, [filteredDownpaymentsList, downpaymentReportPage, downpaymentReportPageSize]);

  const handleClientSort = (field: 'name' | 'invoices' | 'total' | 'paid' | 'pending' | 'rate') => {
    if (clientSortField === field) {
      setClientSortDirection(clientSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setClientSortField(field);
      setClientSortDirection('desc');
    }
  };

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
    expenses: {
      label: "Expenses",
      color: "hsl(var(--chart-2))",
    },
    profit: {
      label: "Net Profit",
      color: "hsl(var(--chart-3))",
    },
    invoices: {
      label: "Invoices",
      color: "hsl(var(--chart-4))",
    },
  };

  const getDateRange = useCallback(() => {
    const now = new Date();
    let start = new Date();
    const end = new Date();

    // Set end of today for the end boundary by default
    end.setHours(23, 59, 59, 999);

    if (startDate || endDate) {
      let customStart: Date;
      let customEnd: Date;
      
      if (startDate && endDate) {
        customStart = new Date(`${startDate}T00:00:00`);
        customEnd = new Date(`${endDate}T23:59:59.999`);
      } else if (startDate) {
        customStart = new Date(`${startDate}T00:00:00`);
        customEnd = new Date(); // default to now
      } else { // only endDate is set
        customEnd = new Date(`${endDate}T23:59:59.999`);
        customStart = new Date(customEnd);
        customStart.setMonth(customStart.getMonth() - 6); // default to 6 months before endDate
        customStart.setHours(0, 0, 0, 0);
      }
      return { start: customStart, end: customEnd };
    }

    switch (dateRange) {
      case 'last_30_days':
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        break;
      case 'last_3_months':
        start.setMonth(now.getMonth() - 3);
        start.setHours(0, 0, 0, 0);
        break;
      case 'last_6_months':
        start.setMonth(now.getMonth() - 6);
        start.setHours(0, 0, 0, 0);
        break;
      case 'last_12_months':
        start.setFullYear(now.getFullYear() - 1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        break;
      default:
        start.setMonth(now.getMonth() - 6);
        start.setHours(0, 0, 0, 0);
    }

    return { start, end };
  }, [startDate, endDate, dateRange]);

  const getMonthsInRange = useCallback((start: Date, end: Date) => {
    const months = [];
    const currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
    const endDateBoundary = new Date(end.getFullYear(), end.getMonth(), 1);

    while (currentDate <= endDateBoundary) {
      months.push({
        month: currentDate.getMonth(),
        year: currentDate.getFullYear(),
        label: currentDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return months;
  }, []);

  const fetchReportsData = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      const clientToUse = serviceSupabase || supabase;
      const { start, end } = getDateRange();
      const startISO = start.toISOString();
      const endISO = end.toISOString();
      const startDateOnly = startISO.split('T')[0];
      const endDateOnly = endISO.split('T')[0];

      // Parallel fetch all required data with optimized light payloads
      const [invoicesRes, expensesRes, clientsCountRes, paymentsRes, purchasesRes, productsRes] = await Promise.all([
        clientToUse
          .from('invoices')
          .select(`
            id, 
            invoice_number, 
            total_amount, 
            subtotal,
            tax_amount,
            status, 
            created_at,
            issue_date,
            due_date,
            notes,
            payment_terms,
            terms,
            clients (id, name, gstin, state, address, postal_code),
            invoice_items (
              id,
              product_id,
              description,
              quantity,
              rate,
              tax_rate,
              amount,
              products (
                id,
                name,
                price,
                purchase_price,
                sku,
                hsn_code
              )
            )
          `)
          .eq('user_id', targetUserId)
          .gte('created_at', startISO)
          .lte('created_at', endISO)
          .order('created_at', { ascending: false })
          .limit(2000),
        clientToUse
          .from('expenses')
          .select('id, title, amount, category, expense_date, payment_method')
          .eq('user_id', targetUserId)
          .gte('expense_date', startDateOnly)
          .lte('expense_date', endDateOnly)
          .order('expense_date', { ascending: false })
          .limit(2000),
        clientToUse
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', targetUserId),
        clientToUse
          .from('payments')
          .select(`
            id,
            amount,
            payment_date,
            payment_method,
            reference_number,
            notes,
            created_at,
            invoice_id,
            purchase_invoice_id,
            invoices (
              invoice_number,
              status,
              clients (name)
            )
          `)
          .eq('user_id', targetUserId)
          .gte('payment_date', startDateOnly)
          .lte('payment_date', endDateOnly)
          .order('payment_date', { ascending: false })
          .limit(2000),
        clientToUse
          .from('purchase_invoices')
          .select(`
            id,
            invoice_number,
            issue_date,
            created_at,
            subtotal,
            tax_amount,
            total_amount,
            status,
            vendors (id, name, gstin, state)
          `)
          .eq('user_id', targetUserId)
          .gte('created_at', startISO)
          .lte('created_at', endISO)
          .order('created_at', { ascending: false })
          .limit(2000),
        clientToUse
          .from('products')
          .select('*')
          .eq('user_id', targetUserId)
          .order('name', { ascending: true })
      ]);

      if (invoicesRes.error) throw invoicesRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      const invoices = (invoicesRes.data as unknown) as ReportInvoice[];
      const expenses = (expensesRes.data as unknown) as Expense[];
      const purchases = (purchasesRes?.data as unknown as any[]) || [];
      const clientsCount = clientsCountRes.count || 0;
      const catalogData = (productsRes?.data as unknown as CatalogProduct[]) || [];
      setCatalogProducts(catalogData);

      // 1. Calculate Summary Stats
      const totalRevenue = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

      const pendingAmount = invoices
        .filter(inv => ['draft', 'sent', 'viewed'].includes(inv.status))
        .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

      const overdueAmount = invoices
        .filter(inv => inv.status === 'overdue')
        .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

      const paidInvoicesCount = invoices.filter(inv => inv.status === 'paid').length;
      const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

      let totalPurchaseCost = 0;
      invoices.forEach(inv => {
        if (inv.status !== 'paid') return;
        const items = inv.invoice_items || [];
        items.forEach(item => {
          const qty = Number(item.quantity || 0);
          const purchasePrice = Number(item.products?.purchase_price || 0);
          totalPurchaseCost += qty * purchasePrice;
        });
      });

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const thisMonthRevenue = invoices
        .filter(inv => {
          const invDate = new Date(inv.created_at);
          return inv.status === 'paid' && invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
        })
        .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

      const lastMonthRevenue = invoices
        .filter(inv => {
          const invDate = new Date(inv.created_at);
          return inv.status === 'paid' && invDate.getMonth() === lastMonth && invDate.getFullYear() === lastMonthYear;
        })
        .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

      setStats({
        totalRevenue,
        totalInvoices: invoices.length,
        paidInvoices: paidInvoicesCount,
        pendingAmount,
        overdueAmount,
        totalClients: clientsCount,
        totalExpenses,
        thisMonthRevenue,
        lastMonthRevenue,
        netProfit: totalRevenue - totalPurchaseCost - totalExpenses,
        averageInvoiceValue: paidInvoicesCount > 0 ? totalRevenue / paidInvoicesCount : 0
      });

      // Segregate downpayment invoices from regular sales invoices
      const isDownpayment = (inv: any) => Boolean(
        inv.invoice_number?.startsWith('DP-') ||
        inv.invoice_number?.startsWith('DP') ||
        inv.notes?.includes('"is_downpayment":true')
      );

      const dpInvoices = invoices.filter(inv => isDownpayment(inv));
      const regularSalesInvoices = invoices.filter(inv => !isDownpayment(inv));

      // 2. Process Monthly Data (Regular Sales Only)
      const months = getMonthsInRange(start, end);
      const monthlyStats: MonthlyData[] = months.map(({ month, year, label }) => {
        const monthInvoices = regularSalesInvoices.filter(inv => {
          const invDate = new Date(inv.created_at);
          return invDate.getMonth() === month && invDate.getFullYear() === year;
        });

        let monthPurchaseCost = 0;
        monthInvoices.forEach(inv => {
          if (inv.status !== 'paid') return;
          const items = inv.invoice_items || [];
          items.forEach(item => {
            const qty = Number(item.quantity || 0);
            const purchasePrice = Number(item.products?.purchase_price || 0);
            monthPurchaseCost += qty * purchasePrice;
          });
        });

        const rev = monthInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
        return { month: label, revenue: rev, expenses: monthPurchaseCost, invoices: monthInvoices.length, profit: rev - monthPurchaseCost };
      });
      setMonthlyData(monthlyStats);

      // 3. Process Client Reports (Regular Sales Only)
      const clientStats: { [key: string]: ClientReportData } = {};
      regularSalesInvoices.forEach(inv => {
        const name = inv.clients?.name || 'Unknown';
        if (!clientStats[name]) {
          clientStats[name] = { client_name: name, total_invoices: 0, total_amount: 0, paid_amount: 0, pending_amount: 0 };
        }
        clientStats[name].total_invoices++;
        clientStats[name].total_amount += Number(inv.total_amount || 0);
        if (inv.status === 'paid') clientStats[name].paid_amount += Number(inv.total_amount || 0);
        else clientStats[name].pending_amount += Number(inv.total_amount || 0);
      });
      setClientReports(Object.values(clientStats).sort((a, b) => b.total_amount - a.total_amount));

      // 4. Process Invoices List (Regular Sales Only)
      setInvoicesList(regularSalesInvoices.map(inv => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        created_at: inv.created_at,
        client_name: inv.clients?.name || 'Unknown',
        total_amount: Number(inv.total_amount || 0),
        status: inv.status
      })));

      // 4b. Process Downpayment Invoices List

      const formattedDownpayments: DownpaymentReportItem[] = dpInvoices.map(inv => {
        const vDetails = extractVehicleDetails(inv);
        const pDetails = extractPaymentDetails(inv);
        const totalAmount = Number(inv.total_amount || 0);
        const advancePaid = pDetails?.amountReceived ?? (pDetails?.finance?.downpayment ?? (inv.status === 'paid' ? totalAmount : 0));
        const balanceDue = pDetails?.balancePending ?? Math.max(0, totalAmount - advancePaid);
        const financed = pDetails?.finance?.financedAmount || 0;
        const financer = vDetails.financer || pDetails?.finance?.financer || 'Self / Cash';

        const vehicleName = vDetails.model || 
          inv.invoice_items?.[0]?.products?.name || 
          inv.invoice_items?.[0]?.description || 
          'Vehicle Booking';

        return {
          id: inv.id,
          invoice_number: inv.invoice_number,
          created_at: inv.created_at,
          issue_date: inv.issue_date,
          due_date: inv.due_date,
          client_name: inv.clients?.name || 'Walk-in Customer',
          total_amount: totalAmount,
          advance_amount: advancePaid,
          balance_due: balanceDue,
          financed_amount: financed,
          status: inv.status,
          vehicle_name: vehicleName,
          vehicle_vin: vDetails.chassisNo,
          vehicle_reg: vDetails.regNo,
          vehicle_color: vDetails.color,
          financier: financer,
          notes: inv.notes
        };
      });

      setDownpaymentsList(formattedDownpayments);

      // 5. Process Expenses List & Categories
      setExpensesList(expenses.map(exp => ({
        id: exp.id, title: exp.title, amount: Number(exp.amount || 0),
        category: exp.category, expense_date: exp.expense_date, payment_method: exp.payment_method
      })));

      const categoryMap: { [key: string]: number } = {};
      const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
      expenses.forEach(exp => {
        const cat = exp.category || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + Number(exp.amount || 0);
      });
      setCategoryData(Object.entries(categoryMap).map(([name, value], i) => ({
        name, value, color: COLORS[i % COLORS.length]
      })).sort((a, b) => b.value - a.value));

      // 6. Process Item Reports (Selling Price vs Purchase Price per item)
      const itemStatsMap: { [key: string]: ItemReportData } = {};
      invoices.forEach(inv => {
        // Only include paid invoices to calculate actual realized profit
        if (inv.status !== 'paid') return;
        
        const invoiceItems = inv.invoice_items || [];
        invoiceItems.forEach(item => {
          const qty = Number(item.quantity || 0);
          const sales = Number(item.amount || 0);
          const purchasePrice = Number(item.products?.purchase_price || 0);
          const cost = qty * purchasePrice;
          const profit = sales - cost;
          
          const key = item.product_id ? item.product_id : `custom-${item.description}`;
          const name = item.products?.name || item.description || 'Custom Item';
          const sku = item.products?.sku || 'N/A';
          const hsn = item.products?.hsn_code || 'N/A';
          
          if (!itemStatsMap[key]) {
            itemStatsMap[key] = {
              productId: item.product_id || null,
              name,
              sku,
              hsn,
              quantitySold: 0,
              totalSales: 0,
              totalCost: 0,
              netProfit: 0,
              margin: 0
            };
          }
          
          itemStatsMap[key].quantitySold += qty;
          itemStatsMap[key].totalSales += sales;
          itemStatsMap[key].totalCost += cost;
          itemStatsMap[key].netProfit += profit;
        });
      });

      const itemsReportData = Object.values(itemStatsMap).map(item => {
        item.margin = item.totalSales > 0 ? (item.netProfit / item.totalSales) * 100 : 0;
        return item;
      }).sort((a, b) => b.totalSales - a.totalSales);
      
      setItemsReports(itemsReportData);

      // 7. Process Payments List, Metrics, Distribution & Timeline
      const rawPayments = (paymentsRes.data as unknown as any[]) || [];
      const unlinkedIds = rawPayments
        .filter(p => !p.invoices && (p.purchase_invoice_id || p.invoice_id))
        .map(p => p.purchase_invoice_id || p.invoice_id);
      const purchaseMap: Record<string, { invoice_number: string; status: string; vendors?: { name: string } }> = {};

      if (unlinkedIds.length > 0) {
        const { data: pBills } = await clientToUse
          .from('purchase_invoices')
          .select('id, invoice_number, status, vendors (name)')
          .in('id', unlinkedIds);

        ((pBills as unknown as any[]) || []).forEach(b => {
          purchaseMap[b.id] = b;
        });
      }

      const formattedPayments: PaymentReportItem[] = rawPayments.map(p => {
        const pBillId = p.purchase_invoice_id || p.invoice_id;
        const pb = purchaseMap[pBillId];

        if (p.purchase_invoice_id || pb) {
          return {
            id: p.id,
            amount: Number(p.amount || 0),
            payment_date: p.payment_date,
            payment_method: p.payment_method || 'cash',
            reference_number: p.reference_number,
            notes: p.notes,
            created_at: p.created_at,
            invoice_id: pBillId,
            party_name: pb?.vendors?.name || 'Vendor',
            invoice_number: pb?.invoice_number || 'N/A',
            invoice_type: 'purchase',
            type: 'purchase'
          };
        }

        if (p.invoices) {
          const isDownpaymentPayment = Boolean(
            p.invoices.invoice_number?.startsWith('DP-') ||
            p.invoices.invoice_number?.startsWith('DP') ||
            p.invoices.notes?.includes('"is_downpayment":true') ||
            (p.invoices.notes?.toLowerCase()?.includes('downpayment') && !p.invoices.notes?.includes('"is_downpayment":false')) ||
            p.notes?.toLowerCase()?.includes('downpayment') ||
            p.notes?.toLowerCase()?.includes('booking advance')
          );

          return {
            id: p.id,
            amount: Number(p.amount || 0),
            payment_date: p.payment_date,
            payment_method: p.payment_method || 'cash',
            reference_number: p.reference_number,
            notes: p.notes,
            created_at: p.created_at,
            invoice_id: p.invoice_id,
            party_name: p.invoices?.clients?.name || 'Customer',
            invoice_number: p.invoices?.invoice_number || 'N/A',
            invoice_type: isDownpaymentPayment ? 'downpayment' : 'sales',
            type: isDownpaymentPayment ? 'downpayment' : 'sales'
          };
        }

        return {
          id: p.id,
          amount: Number(p.amount || 0),
          payment_date: p.payment_date,
          payment_method: p.payment_method || 'cash',
          reference_number: p.reference_number,
          notes: p.notes,
          created_at: p.created_at,
          invoice_id: p.invoice_id,
          party_name: 'Direct Receipt',
          invoice_number: 'N/A',
          invoice_type: 'other',
          type: 'other'
        };
      });

      setPaymentsList(formattedPayments);

      let totalCol = 0;
      let upiCol = 0;
      let cashCol = 0;
      let bankCol = 0;
      let chequeCol = 0;
      let cardCol = 0;
      let otherCol = 0;

      const methodCounts: Record<string, { amount: number; count: number }> = {};

      formattedPayments.forEach(p => {
        const amt = Number(p.amount || 0);
        totalCol += amt;
        const m = (p.payment_method || 'other').toLowerCase();
        if (m === 'upi') upiCol += amt;
        else if (m === 'cash') cashCol += amt;
        else if (['bank_transfer', 'bank', 'neft', 'rtgs', 'netbanking'].includes(m)) bankCol += amt;
        else if (m === 'cheque') chequeCol += amt;
        else if (['credit_card', 'debit_card', 'card'].includes(m)) cardCol += amt;
        else otherCol += amt;

        const normMethod = ['bank', 'neft', 'rtgs', 'netbanking'].includes(m) ? 'bank_transfer' : m;
        if (!methodCounts[normMethod]) {
          methodCounts[normMethod] = { amount: 0, count: 0 };
        }
        methodCounts[normMethod].amount += amt;
        methodCounts[normMethod].count += 1;
      });

      const avg = formattedPayments.length > 0 ? totalCol / formattedPayments.length : 0;

      setPaymentStats({
        totalCollected: totalCol,
        totalTransactions: formattedPayments.length,
        totalCount: formattedPayments.length,
        upiTotal: upiCol,
        upiCollected: upiCol,
        cashTotal: cashCol,
        cashCollected: cashCol,
        bankTransferTotal: bankCol,
        bankCollected: bankCol + chequeCol + cardCol + otherCol,
        chequeTotal: chequeCol,
        cardTotal: cardCol,
        otherTotal: otherCol,
        averagePayment: avg,
        averageReceipt: avg
      });

      const methodColorMap: Record<string, { label: string; color: string }> = {
        upi: { label: 'UPI / Online', color: '#10b981' },
        cash: { label: 'Cash', color: '#3b82f6' },
        bank_transfer: { label: 'Bank Transfer', color: '#8b5cf6' },
        cheque: { label: 'Cheque', color: '#f59e0b' },
        credit_card: { label: 'Credit Card', color: '#06b6d4' },
        debit_card: { label: 'Debit Card', color: '#0ea5e9' },
        other: { label: 'Other', color: '#64748b' }
      };

      const distData: PaymentMethodData[] = Object.entries(methodCounts).map(([method, data]) => {
        const info = methodColorMap[method] || { label: method.replace('_', ' ').toUpperCase(), color: '#94a3b8' };
        return {
          name: info.label,
          value: data.amount,
          amount: data.amount,
          count: data.count,
          color: info.color,
          percentage: totalCol > 0 ? (data.amount / totalCol) * 100 : 0
        };
      }).sort((a, b) => b.value - a.value);

      setPaymentMethodDistribution(distData);

      // Process payment timeline (daily aggregates)
      const timelineMap: Record<string, { total: number; amount: number; count: number; upi: number; cash: number; other: number }> = {};
      formattedPayments.forEach(p => {
        const d = p.payment_date || p.created_at?.split('T')[0] || '';
        if (!d) return;
        if (!timelineMap[d]) {
          timelineMap[d] = { total: 0, amount: 0, count: 0, upi: 0, cash: 0, other: 0 };
        }
        const amt = Number(p.amount || 0);
        timelineMap[d].total += amt;
        timelineMap[d].amount += amt;
        timelineMap[d].count += 1;
        const m = (p.payment_method || '').toLowerCase();
        if (m === 'upi') timelineMap[d].upi += amt;
        else if (m === 'cash') timelineMap[d].cash += amt;
        else timelineMap[d].other += amt;
      });

      const timelineData: PaymentTimelineItem[] = Object.entries(timelineMap)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setPaymentTimeline(timelineData);

      // 8. Process GST Returns (GSTR-1 to GSTR-9C Compliance Suite)
      const compGstin = (companyProfile?.gstin || profile?.gstin || '').trim().toUpperCase();
      const compStateCode = compGstin.length >= 2 ? compGstin.slice(0, 2) : '24'; // Default to Gujarat (24) or from state

      const b2bItems: GSTR1B2BItem[] = [];
      const b2clItems: GSTR1B2BItem[] = [];
      const b2csMap: Record<string, GSTR1B2CSItem> = {};
      const hsnMap: Record<string, GSTR1HSNItem> = {};

      let totalOutTaxable = 0;
      let totalOutIGST = 0;
      let totalOutCGST = 0;
      let totalOutSGST = 0;
      let countB2B = 0;
      let countB2C = 0;

      const validInvoices = invoices.filter(inv => inv.status !== 'cancelled');

      validInvoices.forEach(inv => {
        const clientGstin = (inv.clients?.gstin || '').trim().toUpperCase();
        const clientState = inv.clients?.state || '';
        let clientStateCode = clientGstin.length >= 2 ? clientGstin.slice(0, 2) : '';
        
        if (!clientStateCode && clientState) {
          const found = Object.entries(GST_STATE_CODES).find(([, name]) => 
            name.toLowerCase().includes(clientState.toLowerCase())
          );
          if (found) clientStateCode = found[0];
        }
        if (!clientStateCode) clientStateCode = compStateCode;

        const isInterState = clientStateCode !== compStateCode;
        const posLabel = GST_STATE_CODES[clientStateCode] || `${clientStateCode}-${clientState || 'State'}`;
        const invTotal = Number(inv.total_amount || 0);
        const invTax = Number(inv.tax_amount || 0);
        const invSubtotal = Number(inv.subtotal || (invTotal - invTax));

        totalOutTaxable += invSubtotal;

        const igst = isInterState ? invTax : 0;
        const cgst = !isInterState ? invTax / 2 : 0;
        const sgst = !isInterState ? invTax / 2 : 0;

        totalOutIGST += igst;
        totalOutCGST += cgst;
        totalOutSGST += sgst;

        const effectiveTaxRate = invSubtotal > 0 ? Math.round((invTax / invSubtotal) * 100) : 0;
        const isB2B = clientGstin.length === 15;

        if (isB2B) {
          countB2B++;
          b2bItems.push({
            gstin: clientGstin,
            clientName: inv.clients?.name || 'Registered Client',
            invoiceNumber: inv.invoice_number,
            invoiceDate: inv.issue_date || inv.created_at?.split('T')[0] || '',
            invoiceValue: invTotal,
            placeOfSupply: posLabel,
            reverseCharge: 'N',
            taxRate: effectiveTaxRate,
            taxableValue: invSubtotal,
            integratedTax: igst,
            centralTax: cgst,
            stateTax: sgst
          });
        } else {
          countB2C++;
          if (isInterState && invTotal > 250000) {
            b2clItems.push({
              gstin: 'URP',
              clientName: inv.clients?.name || 'Unregistered Consumer (Large)',
              invoiceNumber: inv.invoice_number,
              invoiceDate: inv.issue_date || inv.created_at?.split('T')[0] || '',
              invoiceValue: invTotal,
              placeOfSupply: posLabel,
              reverseCharge: 'N',
              taxRate: effectiveTaxRate,
              taxableValue: invSubtotal,
              integratedTax: igst,
              centralTax: 0,
              stateTax: 0
            });
          } else {
            const b2csKey = `${posLabel}_${effectiveTaxRate}`;
            if (!b2csMap[b2csKey]) {
              b2csMap[b2csKey] = {
                placeOfSupply: posLabel,
                taxRate: effectiveTaxRate,
                taxableValue: 0,
                integratedTax: 0,
                centralTax: 0,
                stateTax: 0
              };
            }
            b2csMap[b2csKey].taxableValue += invSubtotal;
            b2csMap[b2csKey].integratedTax += igst;
            b2csMap[b2csKey].centralTax += cgst;
            b2csMap[b2csKey].stateTax += sgst;
          }
        }

        // Process HSN Summary
        (inv.invoice_items || []).forEach(item => {
          const rawHsn = item.products?.hsn_code || '9983';
          const itemQty = Number(item.quantity || 1);
          const itemAmt = Number(item.amount || (itemQty * Number(item.rate || 0)));
          const itemTaxRate = Number(item.tax_rate ?? effectiveTaxRate);
          const itemTax = itemAmt * (itemTaxRate / 100);
          const itemIgst = isInterState ? itemTax : 0;
          const itemCgst = !isInterState ? itemTax / 2 : 0;
          const itemSgst = !isInterState ? itemTax / 2 : 0;

          if (!hsnMap[rawHsn]) {
            hsnMap[rawHsn] = {
              hsnCode: rawHsn,
              description: item.products?.name || item.description || 'Goods / Services',
              uqc: 'NOS',
              totalQuantity: 0,
              totalValue: 0,
              taxableValue: 0,
              integratedTax: 0,
              centralTax: 0,
              stateTax: 0
            };
          }
          hsnMap[rawHsn].totalQuantity += itemQty;
          hsnMap[rawHsn].taxableValue += itemAmt;
          hsnMap[rawHsn].totalValue += (itemAmt + itemTax);
          hsnMap[rawHsn].integratedTax += itemIgst;
          hsnMap[rawHsn].centralTax += itemCgst;
          hsnMap[rawHsn].stateTax += itemSgst;
        });
      });

      // Documents Issued (Table 13)
      const sortedInvoices = [...invoices].sort((a, b) => (a.invoice_number || '').localeCompare(b.invoice_number || ''));
      const cancelledInvs = invoices.filter(i => i.status === 'cancelled').length;
      const docSummary: GSTR1DocSummary[] = [{
        docType: 'Invoices for Outward Supply (Tax Invoices)',
        fromSerial: sortedInvoices[0]?.invoice_number || 'INV-001',
        toSerial: sortedInvoices[sortedInvoices.length - 1]?.invoice_number || 'INV-001',
        totalCount: invoices.length,
        cancelledCount: cancelledInvs,
        netIssued: invoices.length - cancelledInvs
      }];

      // Process Purchases for GSTR-2B Inward ITC
      const itcItems: GSTR2BITCItem[] = [];
      let totalInTaxable = 0;
      let totalInIGST = 0;
      let totalInCGST = 0;
      let totalInSGST = 0;

      purchases.forEach((p: any) => {
        const vGstin = (p.vendors?.gstin || '').trim().toUpperCase();
        const vState = p.vendors?.state || '';
        let vStateCode = vGstin.length >= 2 ? vGstin.slice(0, 2) : '';
        if (!vStateCode && vState) {
          const found = Object.entries(GST_STATE_CODES).find(([, name]) => name.toLowerCase().includes(vState.toLowerCase()));
          if (found) vStateCode = found[0];
        }
        if (!vStateCode) vStateCode = compStateCode;

        const isPurchInterState = vStateCode !== compStateCode;
        const pTotal = Number(p.total_amount || 0);
        const pTax = Number(p.tax_amount || 0);
        const pSubtotal = Number(p.subtotal || (pTotal - pTax));

        totalInTaxable += pSubtotal;

        const pIgst = isPurchInterState ? pTax : 0;
        const pCgst = !isPurchInterState ? pTax / 2 : 0;
        const pSgst = !isPurchInterState ? pTax / 2 : 0;

        totalInIGST += pIgst;
        totalInCGST += pCgst;
        totalInSGST += pSgst;

        itcItems.push({
          vendorGstin: vGstin || 'Unregistered',
          vendorName: p.vendors?.name || 'Vendor',
          invoiceNumber: p.invoice_number || 'BILL-001',
          invoiceDate: p.issue_date || p.created_at?.split('T')[0] || '',
          invoiceValue: pTotal,
          taxableValue: pSubtotal,
          integratedTax: pIgst,
          centralTax: pCgst,
          stateTax: pSgst,
          itcAvailable: 'Y'
        });
      });

      // GSTR-3B Table 3.1 Outward supplies
      const table31: GSTR3BTable31[] = [
        {
          description: '(a) Outward taxable supplies (other than zero rated, nil and exempted)',
          taxableValue: totalOutTaxable,
          integratedTax: totalOutIGST,
          centralTax: totalOutCGST,
          stateTax: totalOutSGST
        },
        {
          description: '(b) Outward taxable supplies (zero rated / exports)',
          taxableValue: 0,
          integratedTax: 0,
          centralTax: 0,
          stateTax: 0
        },
        {
          description: '(c) Other outward supplies (Nil rated, exempted)',
          taxableValue: 0,
          integratedTax: 0,
          centralTax: 0,
          stateTax: 0
        },
        {
          description: '(d) Inward supplies liable to reverse charge (RCM)',
          taxableValue: 0,
          integratedTax: 0,
          centralTax: 0,
          stateTax: 0
        },
        {
          description: '(e) Non-GST outward supplies',
          taxableValue: 0,
          integratedTax: 0,
          centralTax: 0,
          stateTax: 0
        }
      ];

      // GSTR-3B Table 4 Eligible ITC
      const table4: GSTR3BTable4[] = [
        {
          description: '(A) (1) Import of Goods',
          integratedTax: 0,
          centralTax: 0,
          stateTax: 0
        },
        {
          description: '(A) (3) Inward supplies liable to reverse charge (other than 1 & 2)',
          integratedTax: 0,
          centralTax: 0,
          stateTax: 0
        },
        {
          description: '(A) (5) All other ITC (Purchases from registered vendors)',
          integratedTax: totalInIGST,
          centralTax: totalInCGST,
          stateTax: totalInSGST
        },
        {
          description: '(C) Net ITC Available (A - B)',
          integratedTax: totalInIGST,
          centralTax: totalInCGST,
          stateTax: totalInSGST
        }
      ];

      // GSTR-3B Table 6.1 Payment of Tax (Net cash liability)
      const cashPayableIGST = Math.max(0, totalOutIGST - totalInIGST);
      const itcUtilizedIGST = Math.min(totalOutIGST, totalInIGST);

      const cashPayableCGST = Math.max(0, totalOutCGST - totalInCGST);
      const itcUtilizedCGST = Math.min(totalOutCGST, totalInCGST);

      const cashPayableSGST = Math.max(0, totalOutSGST - totalInSGST);
      const itcUtilizedSGST = Math.min(totalOutSGST, totalInSGST);

      const table61: GSTR3BTable61[] = [
        {
          taxType: 'Integrated Tax (IGST)',
          totalTaxPayable: totalOutIGST,
          itcPaid: itcUtilizedIGST,
          taxPaidCash: cashPayableIGST
        },
        {
          taxType: 'Central Tax (CGST)',
          totalTaxPayable: totalOutCGST,
          itcPaid: itcUtilizedCGST,
          taxPaidCash: cashPayableCGST
        },
        {
          taxType: 'State / UT Tax (SGST)',
          totalTaxPayable: totalOutSGST,
          itcPaid: itcUtilizedSGST,
          taxPaidCash: cashPayableSGST
        }
      ];

      // CMP-08 Composition Scheme Statement
      const cmp08: CMP08Item[] = [
        {
          description: '1. Value of outward supplies (including exempt supplies)',
          value: totalOutTaxable,
          integratedTax: 0,
          centralTax: totalOutTaxable * 0.005, // 0.5% CGST
          stateTax: totalOutTaxable * 0.005   // 0.5% SGST
        },
        {
          description: '2. Inward supplies attracting reverse charge (RCM)',
          value: 0,
          integratedTax: 0,
          centralTax: 0,
          stateTax: 0
        },
        {
          description: '3. Tax payable (1 + 2)',
          value: totalOutTaxable,
          integratedTax: 0,
          centralTax: totalOutTaxable * 0.005,
          stateTax: totalOutTaxable * 0.005
        }
      ];

      // GSTR-9 / 9C Annual Return Summary
      const gstr9: GSTR9AnnualItem[] = [
        {
          tableNumber: 'Table 4',
          description: 'Details of advances, inward and outward supplies on which tax is payable',
          taxableValue: totalOutTaxable,
          integratedTax: totalOutIGST,
          centralTax: totalOutCGST,
          stateTax: totalOutSGST
        },
        {
          tableNumber: 'Table 5',
          description: 'Details of Outward supplies on which tax is not payable (exempt/nil)',
          taxableValue: 0,
          integratedTax: 0,
          centralTax: 0,
          stateTax: 0
        },
        {
          tableNumber: 'Table 6',
          description: 'Total ITC availed as declared in returns filed during the Financial Year',
          taxableValue: totalInTaxable,
          integratedTax: totalInIGST,
          centralTax: totalInCGST,
          stateTax: totalInSGST
        },
        {
          tableNumber: 'Table 9',
          description: 'Details of Tax paid as declared in returns filed (Paid in Cash + Paid through ITC)',
          taxableValue: totalOutTaxable,
          integratedTax: itcUtilizedIGST + cashPayableIGST,
          centralTax: itcUtilizedCGST + cashPayableCGST,
          stateTax: itcUtilizedSGST + cashPayableSGST
        },
        {
          tableNumber: '9C Reconcil.',
          description: 'Turnover reconciliation between Books of Accounts & GSTR-9 Return',
          taxableValue: totalOutTaxable,
          integratedTax: 0,
          centralTax: 0,
          stateTax: 0
        }
      ];

      setGstr1B2BList(b2bItems);
      setGstr1B2CLList(b2clItems);
      setGstr1B2CSList(Object.values(b2csMap));
      setGstr1HSNList(Object.values(hsnMap));
      setGstr1DocSummary(docSummary);
      setGstr2bList(itcItems);
      setGstr3bTable31(table31);
      setGstr3bTable4(table4);
      setGstr3bTable61(table61);
      setCmp08Data(cmp08);
      setGstr9Data(gstr9);

      setGstSummaryStats({
        totalOutputTax: totalOutIGST + totalOutCGST + totalOutSGST,
        totalOutputTaxable: totalOutTaxable,
        totalInputTax: totalInIGST + totalInCGST + totalInSGST,
        totalInputTaxable: totalInTaxable,
        netCashPayable: cashPayableIGST + cashPayableCGST + cashPayableSGST,
        totalInvoicesIssued: invoices.length,
        totalB2BInvoices: countB2B,
        totalB2CInvoices: countB2C,
        outputIGST: totalOutIGST,
        outputCGST: totalOutCGST,
        outputSGST: totalOutSGST,
        inputIGST: totalInIGST,
        inputCGST: totalInCGST,
        inputSGST: totalInSGST,
      });
    } catch (error) {
      console.error('Error fetching reports data:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load reports data." });
    } finally {
      setLoading(false);
    }
  }, [targetUserId, getDateRange, dateRange, toast, companyProfile, profile]);

  useEffect(() => {
    if (targetUserId) {
      fetchReportsData();
    }
  }, [targetUserId, dateRange, startDate, endDate, fetchReportsData]);

  const reportExportContext: ReportsExportContext = useMemo(() => ({
    companyProfile,
    profile,
    startDate,
    endDate,
    dateRange,
    currencySymbol,
    stats,
    monthlyData,
    categoryData,
    clientReports,
    invoicesList,
    expensesList,
    paymentsList,
    paymentStats,
    paymentMethodDistribution,
    downpaymentStats,
    filteredDownpaymentsList,
    itemsReports,
    inventoryStats,
    filteredAndSortedInventoryProducts,
  }), [
    companyProfile, profile, startDate, endDate, dateRange, currencySymbol,
    stats, monthlyData, categoryData, clientReports, invoicesList, expensesList,
    paymentsList, paymentStats, paymentMethodDistribution, downpaymentStats,
    filteredDownpaymentsList, itemsReports, inventoryStats, filteredAndSortedInventoryProducts
  ]);

  const gstExportContext: GstExportContext = useMemo(() => ({
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
  }), [
    companyProfile, profile, startDate, endDate, dateRange, gstSummaryStats,
    gstr1B2BList, gstr1B2CLList, gstr1B2CSList, gstr1HSNList, gstr1DocSummary,
    gstr2bList, gstr3bTable31, gstr3bTable4, gstr3bTable61, cmp08Data, gstr9Data
  ]);

  const exportAllGSTExcel = () => exportAllGSTExcelUtil(gstExportContext);
  const exportIndividualGSTR1Excel = () => exportIndividualGSTR1ExcelUtil(gstExportContext);
  const exportIndividualGSTR2BExcel = () => exportIndividualGSTR2BExcelUtil(gstExportContext);
  const exportIndividualGSTR2BPDF = () => exportIndividualGSTR2BPDFUtil(gstExportContext);
  const exportIndividualGSTR3BExcel = () => exportIndividualGSTR3BExcelUtil(gstExportContext);
  const exportIndividualGSTR3BPDF = () => exportIndividualGSTR3BPDFUtil(gstExportContext);
  const exportIndividualCMP08Excel = () => exportIndividualCMP08ExcelUtil(gstExportContext);
  const exportIndividualGSTR9Excel = () => exportIndividualGSTR9ExcelUtil(gstExportContext);
  const exportIndividualGSTR9PDF = () => exportIndividualGSTR9PDFUtil(gstExportContext);
  const exportGSTR1JSON = () => exportGSTR1JSONUtil(gstExportContext);
  const exportGSTPDF = (isPrint?: boolean | unknown) => exportGSTPDFUtil(gstExportContext, isPrint);

  const exportPaymentsExcel = () => exportPaymentsExcelUtil(reportExportContext);
  const exportPaymentsPDF = (isPrint?: boolean | unknown) => exportPaymentsPDFUtil(reportExportContext, isPrint);
  const exportItemsPDF = (isPrint?: boolean | unknown) => exportItemsPDFUtil(reportExportContext, isPrint);
  const exportItemsExcel = () => exportItemsExcelUtil(reportExportContext);
  const exportToPDF = () => exportToPDFUtil(reportExportContext);
  const exportOverviewPDF = (isPrint?: boolean | unknown) => exportOverviewPDFUtil(reportExportContext, isPrint);
  const exportInvoicesPDF = (isPrint?: boolean | unknown) => exportInvoicesPDFUtil(reportExportContext, isPrint);
  const exportDownpaymentsExcel = () => exportDownpaymentsExcelUtil(reportExportContext);
  const exportDownpaymentsPDF = (isPrint?: boolean | unknown) => exportDownpaymentsPDFUtil(reportExportContext, isPrint);
  const exportFinancialPDF = (isPrint?: boolean | unknown) => exportFinancialPDFUtil(reportExportContext, isPrint);
  const exportClientsPDF = (isPrint?: boolean | unknown) => exportClientsPDFUtil(reportExportContext, isPrint);
  const exportExpensesPDF = (isPrint?: boolean | unknown) => exportExpensesPDFUtil(reportExportContext, isPrint);
  const exportToExcel = () => exportToExcelUtil(reportExportContext);
  const exportOverviewExcel = () => exportOverviewExcelUtil(reportExportContext);
  const exportInvoicesExcel = () => exportInvoicesExcelUtil(reportExportContext);
  const exportFinancialExcel = () => exportFinancialExcelUtil(reportExportContext);
  const exportClientsExcel = () => exportClientsExcelUtil(reportExportContext);
  const exportExpensesExcel = () => exportExpensesExcelUtil(reportExportContext);
  const exportInventoryExcel = () => exportInventoryExcelUtil(reportExportContext);
  const exportInventoryPDF = (isPrint?: boolean | unknown) => exportInventoryPDFUtil(reportExportContext, isPrint);
  const exportInventoryCSV = () => exportInventoryCSVUtil(reportExportContext);

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      // Fetch full invoice data
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients(*)
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      if (!invoice) throw new Error('Invoice not found');

      // Open preview modal
      setPreviewInvoice((invoice as unknown) as Invoice);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Error viewing invoice:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load invoice."
      });
    }
  };

  const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      // Fetch full invoice data
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients(*)
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      if (!invoice) throw new Error('Invoice not found');

      // Open preview modal
      setPreviewInvoice((invoice as unknown) as Invoice);
      setPreviewOpen(true);

      // Trigger download after modal opens
      setTimeout(() => {
        const downloadButton = Array.from(document.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('Download PDF')
        ) as HTMLButtonElement;

        if (downloadButton) {
          downloadButton.click();
        }
      }, 500);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download invoice."
      });
    }
  };

  const getGrowthPercentage = useCallback((current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }, []);

  // Memoize expensive calculations
  const revenueGrowth = useMemo(() =>
    getGrowthPercentage(stats.thisMonthRevenue, stats.lastMonthRevenue),
    [stats.thisMonthRevenue, stats.lastMonthRevenue, getGrowthPercentage]
  );
  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    setStartDate('');
    setEndDate('');
    setTempStartDate('');
    setTempEndDate('');
  };

  const handleResetFilters = () => {
    setDateRange('last_6_months');
    setStartDate('');
    setEndDate('');
    setTempStartDate('');
    setTempEndDate('');
  };


  if (isStaff) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">
              Reports &amp; Analytics
            </h1>
            <StaffHeaderBadge />
          </div>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Financial summary, GST returns, collections, and expenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchReportsData}
            size="sm"
            disabled={loading}
            className="rounded-xl border-border/80 hover:bg-muted/80 h-10 px-4 font-bold shadow-sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Modern Filter Command Bar */}
      <div className="bg-card dark:bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Quick Range Chips */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-border/50">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            Quick Periods:
          </span>
          <div className="flex items-center flex-wrap gap-1.5">
            {[
              { id: 'last_30_days', label: '30 Days' },
              { id: 'last_3_months', label: '3 Months' },
              { id: 'last_6_months', label: '6 Months' },
              { id: 'this_year', label: 'This Year' },
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => handleDateRangeChange(chip.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  dateRange === chip.id && !startDate && !endDate
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Inputs & Apply Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5 block">
              Preset Range
            </Label>
            <Select value={dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="h-10 rounded-xl bg-background border-border/70 font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl">
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                <SelectItem value="last_12_months">Last 12 Months</SelectItem>
                <SelectItem value="this_year">This Fiscal Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5 block">
              From Date
            </Label>
            <Input
              type="date"
              value={tempStartDate}
              onChange={(e) => setTempStartDate(e.target.value)}
              className="h-10 rounded-xl bg-background border-border/70 font-medium"
            />
          </div>

          <div>
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5 block">
              To Date
            </Label>
            <Input
              type="date"
              value={tempEndDate}
              onChange={(e) => setTempEndDate(e.target.value)}
              className="h-10 rounded-xl bg-background border-border/70 font-medium"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => {
                setStartDate(tempStartDate);
                setEndDate(tempEndDate);
              }}
              className="flex-1 h-10 rounded-xl font-bold shadow-sm"
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Apply Filter
            </Button>
            <Button
              variant="ghost"
              onClick={handleResetFilters}
              className="h-10 px-3 rounded-xl text-muted-foreground hover:text-foreground font-semibold"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="bg-muted/50 p-1.5 rounded-2xl border border-border/60 inline-flex w-auto min-w-full sm:min-w-0 justify-start gap-1 h-auto">
            <TabsTrigger 
              value="overview" 
              className="rounded-xl font-bold py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2 transition-all whitespace-nowrap"
            >
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="invoices" 
              className="rounded-xl font-bold py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2 transition-all whitespace-nowrap"
            >
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Invoices</span>
            </TabsTrigger>
            {isAutomobile && (
              <TabsTrigger 
                value="downpayments" 
                className="rounded-xl font-bold py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2 transition-all whitespace-nowrap"
              >
                <Car className="w-4 h-4 text-amber-500" />
                <span>Downpayments</span>
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="payments" 
              className="rounded-xl font-bold py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2 transition-all whitespace-nowrap"
            >
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span>Payments</span>
            </TabsTrigger>
            <TabsTrigger 
              value="gst" 
              className="rounded-xl font-bold py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2 transition-all whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-500" />
              <span>GST Returns</span>
            </TabsTrigger>
            <TabsTrigger 
              value="expenses" 
              className="rounded-xl font-bold py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2 transition-all whitespace-nowrap"
            >
              <Receipt className="w-4 h-4 text-rose-500" />
              <span>Expenses</span>
            </TabsTrigger>
            <TabsTrigger 
              value="financial" 
              className="rounded-xl font-bold py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2 transition-all whitespace-nowrap"
            >
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span>Financial P&amp;L</span>
            </TabsTrigger>
            <TabsTrigger 
              value="clients" 
              className="rounded-xl font-bold py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2 transition-all whitespace-nowrap"
            >
              <Users className="w-4 h-4 text-amber-500" />
              <span>Clients</span>
            </TabsTrigger>
            <TabsTrigger 
              value="inventory" 
              className="rounded-xl font-bold py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2 transition-all whitespace-nowrap"
            >
              <Package className="w-4 h-4 text-amber-500" />
              <span>Product Report</span>
            </TabsTrigger>
          </TabsList>
        </div>


        <TabsContent value="overview" className="space-y-4 md:space-y-6">
          <OverviewReportTab
            exportOverviewExcel={exportOverviewExcel}
            exportOverviewPDF={exportOverviewPDF}
            formatAmount={formatAmount}
            stats={stats}
            revenueGrowth={revenueGrowth}
            monthlyData={monthlyData}
            chartConfig={chartConfig}
            currencySymbol={currencySymbol}
          />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <InvoicesReportTab
            exportInvoicesExcel={exportInvoicesExcel}
            exportInvoicesPDF={exportInvoicesPDF}
            invoiceSearchTerm={invoiceSearchTerm}
            setInvoiceSearchTerm={setInvoiceSearchTerm}
            currencySymbol={currencySymbol}
            billingSummary={billingSummary}
            invoicesList={invoicesList}
            selectedInvoiceStatus={selectedInvoiceStatus}
            setSelectedInvoiceStatus={setSelectedInvoiceStatus}
            paginatedInvoicesList={paginatedInvoicesList}
            filteredInvoicesList={filteredInvoicesList}
            salesReportPage={salesReportPage}
            salesReportPageSize={salesReportPageSize}
            setSalesReportPage={setSalesReportPage}
            setSalesReportPageSize={setSalesReportPageSize}
            safelyToLocaleDate={safelyToLocaleDate}
            handleViewInvoice={handleViewInvoice}
            handleDownloadInvoice={handleDownloadInvoice}
          />
        </TabsContent>

        {isAutomobile && (
          <TabsContent value="downpayments" className="space-y-6">
            <DownpaymentsReportTab
              exportDownpaymentsExcel={exportDownpaymentsExcel}
              exportDownpaymentsPDF={exportDownpaymentsPDF}
              currencySymbol={currencySymbol}
              downpaymentStats={downpaymentStats}
              downpaymentSearchTerm={downpaymentSearchTerm}
              setDownpaymentSearchTerm={setDownpaymentSearchTerm}
              downpaymentsList={downpaymentsList}
              selectedDownpaymentStatus={selectedDownpaymentStatus}
              setSelectedDownpaymentStatus={setSelectedDownpaymentStatus}
              paginatedDownpaymentsList={paginatedDownpaymentsList}
              filteredDownpaymentsList={filteredDownpaymentsList}
              downpaymentReportPage={downpaymentReportPage}
              downpaymentReportPageSize={downpaymentReportPageSize}
              setDownpaymentReportPage={setDownpaymentReportPage}
              setDownpaymentReportPageSize={setDownpaymentReportPageSize}
              safelyToLocaleDate={safelyToLocaleDate}
              handleViewInvoice={handleViewInvoice}
              handleDownloadInvoice={handleDownloadInvoice}
            />
          </TabsContent>
        )}

        <TabsContent value="payments" className="space-y-6">
          <PaymentsReportTab
            exportPaymentsExcel={exportPaymentsExcel}
            exportPaymentsPDF={exportPaymentsPDF}
            currencySymbol={currencySymbol}
            paymentStats={paymentStats}
            paymentTimeline={paymentTimeline}
            paymentMethodDistribution={paymentMethodDistribution}
            paymentSearchTerm={paymentSearchTerm}
            setPaymentSearchTerm={setPaymentSearchTerm}
            selectedPaymentMethod={selectedPaymentMethod}
            setSelectedPaymentMethod={setSelectedPaymentMethod}
            paymentsList={paymentsList}
            filteredPaymentsList={filteredPaymentsList}
            safelyToLocaleDate={safelyToLocaleDate}
          />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <ExpensesReportTab
            exportExpensesExcel={exportExpensesExcel}
            exportExpensesPDF={exportExpensesPDF}
            currencySymbol={currencySymbol}
            stats={stats}
            categoryData={categoryData}
            expensesList={expensesList}
            selectedExpenseCategory={selectedExpenseCategory}
            setSelectedExpenseCategory={setSelectedExpenseCategory}
            filteredExpensesList={filteredExpensesList}
            paginatedExpensesList={paginatedExpensesList}
            expensesReportPage={expensesReportPage}
            expensesReportPageSize={expensesReportPageSize}
            setExpensesReportPage={setExpensesReportPage}
            setExpensesReportPageSize={setExpensesReportPageSize}
            safelyToLocaleDate={safelyToLocaleDate}
          />
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <FinancialReportTab
            exportFinancialExcel={exportFinancialExcel}
            exportFinancialPDF={exportFinancialPDF}
            monthlyData={monthlyData}
            chartConfig={chartConfig}
            currencySymbol={currencySymbol}
          />
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <ClientsReportTab
            exportClientsExcel={exportClientsExcel}
            exportClientsPDF={exportClientsPDF}
            filteredAndSortedClients={filteredAndSortedClients}
            clientSearchTerm={clientSearchTerm}
            setClientSearchTerm={setClientSearchTerm}
            handleClientSort={handleClientSort}
            clientSortField={clientSortField}
            clientSortDirection={clientSortDirection}
            paginatedClientsList={paginatedClientsList}
            currencySymbol={currencySymbol}
            clientsReportPage={clientsReportPage}
            clientsReportPageSize={clientsReportPageSize}
            setClientsReportPage={setClientsReportPage}
            setClientsReportPageSize={setClientsReportPageSize}
          />
        </TabsContent>

        <TabsContent value="gst" className="space-y-6">
          <GstReportTab
            companyProfile={companyProfile}
            profile={profile}
            exportAllGSTExcel={exportAllGSTExcel}
            exportGSTR1JSON={exportGSTR1JSON}
            exportGSTPDF={exportGSTPDF}
            gstSummaryStats={gstSummaryStats}
            gstSubTab={gstSubTab}
            setGstSubTab={setGstSubTab}
            gstr1B2BList={gstr1B2BList}
            gstr1B2CLList={gstr1B2CLList}
            gstr1B2CSList={gstr1B2CSList}
            gstr1DocSummary={gstr1DocSummary}
            gstr2bList={gstr2bList}
            gstr1HSNList={gstr1HSNList}
            gstr3bTable31={gstr3bTable31}
            gstr3bTable4={gstr3bTable4}
            gstr3bTable61={gstr3bTable61}
            cmp08Data={cmp08Data}
            gstr9Data={gstr9Data}
            gstr1Section={gstr1Section}
            setGstr1Section={setGstr1Section}
            exportIndividualGSTR1Excel={exportIndividualGSTR1Excel}
            exportIndividualGSTR2BExcel={exportIndividualGSTR2BExcel}
            exportIndividualGSTR2BPDF={exportIndividualGSTR2BPDF}
            exportIndividualGSTR3BExcel={exportIndividualGSTR3BExcel}
            exportIndividualGSTR3BPDF={exportIndividualGSTR3BPDF}
            exportIndividualCMP08Excel={exportIndividualCMP08Excel}
            exportIndividualGSTR9Excel={exportIndividualGSTR9Excel}
            exportIndividualGSTR9PDF={exportIndividualGSTR9PDF}
            gstSearchTerm={gstSearchTerm}
            setGstSearchTerm={setGstSearchTerm}
            debouncedGstSearch={debouncedGstSearch}
            currencySymbol={currencySymbol}
            safelyToLocaleDate={safelyToLocaleDate}
          />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <InventoryReportTab
            productReportSubTab={productReportSubTab}
            setProductReportSubTab={setProductReportSubTab}
            catalogProducts={catalogProducts}
            itemsReports={itemsReports}
            exportInventoryExcel={exportInventoryExcel}
            exportInventoryPDF={exportInventoryPDF}
            exportInventoryCSV={exportInventoryCSV}
            exportItemsExcel={exportItemsExcel}
            exportItemsPDF={exportItemsPDF}
            inventoryStats={inventoryStats}
            currencySymbol={currencySymbol}
            showInventoryTaxBreakdown={showInventoryTaxBreakdown}
            setShowInventoryTaxBreakdown={setShowInventoryTaxBreakdown}
            inventoryTaxBrackets={inventoryTaxBrackets}
            inventorySearch={inventorySearch}
            setInventorySearch={setInventorySearch}
            inventoryCategoryFilter={inventoryCategoryFilter}
            setInventoryCategoryFilter={setInventoryCategoryFilter}
            inventoryCategories={inventoryCategories}
            inventoryTypeFilter={inventoryTypeFilter}
            setInventoryTypeFilter={setInventoryTypeFilter}
            inventoryStockFilter={inventoryStockFilter}
            setInventoryStockFilter={setInventoryStockFilter}
            handleInventorySort={handleInventorySort}
            filteredAndSortedInventoryProducts={filteredAndSortedInventoryProducts}
            itemProfitStats={itemProfitStats}
            itemSearchTerm={itemSearchTerm}
            setItemSearchTerm={setItemSearchTerm}
            filteredAndSortedItems={filteredAndSortedItems}
            handleItemSort={handleItemSort}
            itemSortField={itemSortField}
            itemSortDirection={itemSortDirection}
            filteredItemTotals={filteredItemTotals}
          />
        </TabsContent>
      </Tabs>

      {/* Invoice Preview Modal */}
      <InvoicePreview
        invoice={previewInvoice}
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewInvoice(null);
        }}
      />
    </div>
  );
};

export default ReportsPage;

