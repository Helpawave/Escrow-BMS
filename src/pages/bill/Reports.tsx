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
  ShieldCheck,
  Layers,
  ArrowUpDown,
  Package,
  Printer
} from "lucide-react";
import { StaffHeaderBadge } from "@/components/StaffHeaderBadge";
import { supabase, serviceSupabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Invoice, Expense, Client } from "@/types/invoice";

interface ReportInvoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  subtotal?: number;
  tax_amount?: number;
  status: string;
  created_at: string;
  issue_date?: string;
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
  invoice_type: 'sales' | 'purchase' | 'other';
  type?: 'sales' | 'purchase' | 'other';
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
  const [activeTab, setActiveTab] = useState('overview');
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
    
    let filtered = catalogProducts.filter(p => {
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
    let totalUnique = filteredAndSortedInventoryProducts.length;
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
  const { currencySymbol } = useCurrency();

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
        netProfit: totalRevenue - totalPurchaseCost,
        averageInvoiceValue: paidInvoicesCount > 0 ? totalRevenue / paidInvoicesCount : 0
      });

      // 2. Process Monthly Data
      const months = getMonthsInRange(start, end);
      const monthlyStats: MonthlyData[] = months.map(({ month, year, label }) => {
        const monthInvoices = invoices.filter(inv => {
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

      // 3. Process Client Reports
      const clientStats: { [key: string]: ClientReportData } = {};
      invoices.forEach(inv => {
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

      // 4. Process Invoices List
      setInvoicesList(invoices.map(inv => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        created_at: inv.created_at,
        client_name: inv.clients?.name || 'Unknown',
        total_amount: Number(inv.total_amount || 0),
        status: inv.status
      })));

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
            invoice_type: 'sales',
            type: 'sales'
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

  const exportAllGSTExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      const compName = companyProfile?.company_name || profile?.company_name || 'My Business';
      const compGstin = companyProfile?.gstin || profile?.gstin || 'N/A';
      const period = startDate && endDate
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
          gstSummaryStats.totalOutputTax
        ],
        [
          'Eligible Input Tax Credit Available (GSTR-2B / Table 4)',
          gstSummaryStats.totalInputTaxable,
          gstSummaryStats.inputIGST,
          gstSummaryStats.inputCGST,
          gstSummaryStats.inputSGST,
          gstSummaryStats.totalInputTax
        ],
        [
          'Net Cash Tax Payable (Table 6.1)',
          '-',
          Math.max(0, gstSummaryStats.outputIGST - gstSummaryStats.inputIGST),
          Math.max(0, gstSummaryStats.outputCGST - gstSummaryStats.inputCGST),
          Math.max(0, gstSummaryStats.outputSGST - gstSummaryStats.inputSGST),
          gstSummaryStats.netCashPayable
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
        'Cess'
      ];
      const b2bRows = gstr1B2BList.map(item => [
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
        0
      ]);
      const b2bSheet = XLSX.utils.aoa_to_sheet([b2bHeaders, ...b2bRows]);
      XLSX.utils.book_append_sheet(workbook, b2bSheet, 'b2b');

      // Sheet 3: GSTR-1 B2CL (Large)
      const b2clHeaders = ['Invoice Number', 'Invoice Date', 'Invoice Value', 'Place Of Supply', 'Applicable % of Tax Rate', 'Rate', 'Taxable Value', 'Integrated Tax', 'Cess'];
      const b2clRows = gstr1B2CLList.map(item => [
        item.invoiceNumber,
        item.invoiceDate,
        item.invoiceValue,
        item.placeOfSupply,
        '',
        item.taxRate,
        item.taxableValue,
        item.integratedTax,
        0
      ]);
      const b2clSheet = XLSX.utils.aoa_to_sheet([b2clHeaders, ...b2clRows]);
      XLSX.utils.book_append_sheet(workbook, b2clSheet, 'b2cl');

      // Sheet 4: GSTR-1 B2CS (Small)
      const b2csHeaders = ['Type', 'Place Of Supply', 'Applicable % of Tax Rate', 'Rate', 'Taxable Value', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess'];
      const b2csRows = gstr1B2CSList.map(item => [
        'OE',
        item.placeOfSupply,
        '',
        item.taxRate,
        item.taxableValue,
        item.integratedTax,
        item.centralTax,
        item.stateTax,
        0
      ]);
      const b2csSheet = XLSX.utils.aoa_to_sheet([b2csHeaders, ...b2csRows]);
      XLSX.utils.book_append_sheet(workbook, b2csSheet, 'b2cs');

      // Sheet 5: GSTR-1 HSN Summary (Table 12)
      const hsnHeaders = ['HSN', 'Description', 'UQC', 'Total Quantity', 'Total Value', 'Taxable Value', 'Integrated Tax Amount', 'Central Tax Amount', 'State/UT Tax Amount', 'Cess Amount'];
      const hsnRows = gstr1HSNList.map(item => [
        item.hsnCode,
        item.description,
        item.uqc,
        item.totalQuantity,
        item.totalValue,
        item.taxableValue,
        item.integratedTax,
        item.centralTax,
        item.stateTax,
        0
      ]);
      const hsnSheet = XLSX.utils.aoa_to_sheet([hsnHeaders, ...hsnRows]);
      XLSX.utils.book_append_sheet(workbook, hsnSheet, 'hsn');

      // Sheet 6: GSTR-1 Docs Issued (Table 13)
      const docHeaders = ['Nature of Document', 'Sr. No. From', 'Sr. No. To', 'Total Number', 'Cancelled', 'Net Issued'];
      const docRows = gstr1DocSummary.map(item => [
        item.docType,
        item.fromSerial,
        item.toSerial,
        item.totalCount,
        item.cancelledCount,
        item.netIssued
      ]);
      const docSheet = XLSX.utils.aoa_to_sheet([docHeaders, ...docRows]);
      XLSX.utils.book_append_sheet(workbook, docSheet, 'docs');

      // Sheet 7: GSTR-2B Inward ITC
      const itcHeaders = ['Vendor GSTIN', 'Vendor Legal Name', 'Invoice / Bill #', 'Invoice Date', 'Invoice Value', 'Taxable Value', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'ITC Available'];
      const itcRows = gstr2bList.map(item => [
        item.vendorGstin,
        item.vendorName,
        item.invoiceNumber,
        item.invoiceDate,
        item.invoiceValue,
        item.taxableValue,
        item.integratedTax,
        item.centralTax,
        item.stateTax,
        item.itcAvailable
      ]);
      const itcSheet = XLSX.utils.aoa_to_sheet([itcHeaders, ...itcRows]);
      XLSX.utils.book_append_sheet(workbook, itcSheet, 'GSTR2B_ITC');

      // Sheet 8: GSTR-3B Return
      const gstr3bHeaders = ['Section / Table', 'Description', 'Taxable Value', 'Integrated Tax', 'Central Tax', 'State/UT Tax'];
      const gstr3bRows = [
        ...gstr3bTable31.map(row => ['Table 3.1 Outward', row.description, row.taxableValue, row.integratedTax, row.centralTax, row.stateTax]),
        ...gstr3bTable4.map(row => ['Table 4 ITC', row.description, '-', row.integratedTax, row.centralTax, row.stateTax]),
        ...gstr3bTable61.map(row => ['Table 6.1 Net Tax', `${row.taxType} (Paid in Cash: ₹${row.taxPaidCash.toFixed(2)})`, '-', row.taxType.includes('IGST') ? row.totalTaxPayable : 0, row.taxType.includes('CGST') ? row.totalTaxPayable : 0, row.taxType.includes('SGST') ? row.totalTaxPayable : 0])
      ];
      const gstr3bSheet = XLSX.utils.aoa_to_sheet([gstr3bHeaders, ...gstr3bRows]);
      XLSX.utils.book_append_sheet(workbook, gstr3bSheet, 'GSTR3B');

      // Sheet 9: CMP-08 Composition Scheme
      const cmpHeaders = ['Table', 'Description', 'Value', 'Integrated Tax', 'Central Tax', 'State Tax'];
      const cmpRows = cmp08Data.map((row, idx) => [`Item ${idx + 1}`, row.description, row.value, row.integratedTax, row.centralTax, row.stateTax]);
      const cmpSheet = XLSX.utils.aoa_to_sheet([cmpHeaders, ...cmpRows]);
      XLSX.utils.book_append_sheet(workbook, cmpSheet, 'CMP-08');

      // Sheet 10: GSTR-9 / 9C Annual
      const gstr9Headers = ['Table No', 'Nature of Supplies / Description', 'Taxable Value', 'Integrated Tax', 'Central Tax', 'State Tax'];
      const gstr9Rows = gstr9Data.map(row => [row.tableNumber, row.description, row.taxableValue, row.integratedTax, row.centralTax, row.stateTax]);
      const gstr9Sheet = XLSX.utils.aoa_to_sheet([gstr9Headers, ...gstr9Rows]);
      XLSX.utils.book_append_sheet(workbook, gstr9Sheet, 'GSTR-9_Annual');

      XLSX.writeFile(workbook, `GST-Returns-${compGstin}-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast({ title: "Success", description: "Complete GST Returns Excel workbook downloaded successfully." });
    } catch (err) {
      console.error('Error exporting GST Excel:', err);
      toast({ variant: "destructive", title: "Export Error", description: "Failed to generate GST Excel." });
    }
  };

  const exportGSTR1JSON = () => {
    try {
      const compGstin = (companyProfile?.gstin || profile?.gstin || '24AADCS9081J1ZP').trim().toUpperCase();
      const currentPeriod = startDate ? `${startDate.split('-')[1]}${startDate.split('-')[0]}` : `${String(new Date().getMonth() + 1).padStart(2, '0')}${new Date().getFullYear()}`;

      // Group B2B by recipient GSTIN for GST portal schema
      const b2bByGstin: Record<string, any> = {};
      gstr1B2BList.forEach(item => {
        if (!b2bByGstin[item.gstin]) {
          b2bByGstin[item.gstin] = {
            ctin: item.gstin,
            inv: []
          };
        }
        b2bByGstin[item.gstin].inv.push({
          inum: item.invoiceNumber,
          idt: item.invoiceDate.split('-').reverse().join('-'), // DD-MM-YYYY
          val: item.invoiceValue,
          pos: item.placeOfSupply.split('-')[0],
          rchrg: item.reverseCharge,
          inv_typ: 'R',
          itms: [{
            num: 1,
            itm_det: {
              rt: item.taxRate,
              txval: item.taxableValue,
              iamt: item.integratedTax,
              camt: item.centralTax,
              samt: item.stateTax,
              csamt: 0
            }
          }]
        });
      });

      const b2csJson = gstr1B2CSList.map(item => ({
        sply_ty: item.integratedTax > 0 ? 'INTER' : 'INTRA',
        pos: item.placeOfSupply.split('-')[0],
        typ: 'OE',
        rt: item.taxRate,
        txval: item.taxableValue,
        iamt: item.integratedTax,
        camt: item.centralTax,
        samt: item.stateTax,
        csamt: 0
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
        csamt: 0
      }));

      const payload = {
        gstin: compGstin,
        fp: currentPeriod,
        version: "GST1.0",
        hash: "hash",
        b2b: Object.values(b2bByGstin),
        b2cl: gstr1B2CLList.map(item => ({
          pos: item.placeOfSupply.split('-')[0],
          inv: [{
            inum: item.invoiceNumber,
            idt: item.invoiceDate.split('-').reverse().join('-'),
            val: item.invoiceValue,
            itms: [{
              num: 1,
              itm_det: {
                rt: item.taxRate,
                txval: item.taxableValue,
                iamt: item.integratedTax,
                csamt: 0
              }
            }]
          }]
        })),
        b2cs: b2csJson,
        hsn: { data: hsnJson },
        doc_issue: {
          doc_det: gstr1DocSummary.map(d => ({
            doc_num: 1,
            doc_typ: d.docType,
            docs: [{
              num: 1,
              from: d.fromSerial,
              to: d.toSerial,
              totnum: d.totalCount,
              canc: d.cancelledCount,
              net_issue: d.netIssued
            }]
          }))
        }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `GSTR1_${compGstin}_${currentPeriod}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast({ title: "Success", description: "Government GSTR-1 JSON downloaded. Ready for upload on GST Portal." });
    } catch (err) {
      console.error('Error exporting GSTR1 JSON:', err);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate GSTR-1 JSON." });
    }
  };

  const exportGSTPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      // Landscape A4 for wide multi-column GST reports
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 210mm

      const compName = companyProfile?.company_name || profile?.company_name || 'ESCROW BILL TAXPAYER';
      const compGstin = companyProfile?.gstin || profile?.gstin || 'Unregistered / Not Provided';
      const period = startDate && endDate
        ? `${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`
        : dateRange.replace(/_/g, ' ').toUpperCase();

      // Safe currency formatter avoiding UTF-8 symbol corruption in jsPDF core fonts
      const fmtRs = (val: number, decimals: boolean = false) => {
        if (!val || val === 0) return 'Rs. 0';
        return 'Rs. ' + (decimals
          ? val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : Math.round(val).toLocaleString('en-IN')
        );
      };

      // Header Banner (Navy/Slate-900)
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 36, 'F');

      // Accent color bar under header
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 36, pageWidth, 1.5, 'F');

      // Left Header Details
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('GST COMPLIANCE & RETURNS REPORT', 14, 15);

      doc.setFontSize(8.5);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text('Comprehensive GSTR-1, GSTR-3B & GSTR-2B Reconciliation Statement', 14, 23);
      doc.text(`Taxpayer Entity: ${compName}  |  GSTIN: ${compGstin}`, 14, 30);

      // Right Header Meta Details
      doc.setFontSize(8.5);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(248, 250, 252);
      doc.text(`Return Period: ${period}`, pageWidth - 14, 18, { align: 'right' });
      doc.setFont(undefined, 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text(`Report Generated: ${safelyToLocaleDate(new Date())}`, pageWidth - 14, 26, { align: 'right' });

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
          fmtRs(gstSummaryStats.totalOutputTax)
        ],
        [
          'Eligible Input Tax Credit Available (GSTR-2B / Table 4)',
          fmtRs(gstSummaryStats.totalInputTaxable),
          fmtRs(gstSummaryStats.inputIGST),
          fmtRs(gstSummaryStats.inputCGST),
          fmtRs(gstSummaryStats.inputSGST),
          fmtRs(gstSummaryStats.totalInputTax)
        ],
        [
          'Net Cash Tax Payable (After ITC Offset)',
          '-',
          fmtRs(Math.max(0, gstSummaryStats.outputIGST - gstSummaryStats.inputIGST)),
          fmtRs(Math.max(0, gstSummaryStats.outputCGST - gstSummaryStats.inputCGST)),
          fmtRs(Math.max(0, gstSummaryStats.outputSGST - gstSummaryStats.inputSGST)),
          fmtRs(gstSummaryStats.netCashPayable)
        ]
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
          5: { cellWidth: 36, halign: 'right', fontStyle: 'bold', textColor: [30, 41, 59] }
        },
        margin: { left: 14, right: 14 }
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

      const table61Data = gstr3bTable61.map(r => [
        r.taxType,
        fmtRs(r.totalTaxPayable, true),
        fmtRs(r.itcPaid, true),
        fmtRs(r.taxPaidCash, true)
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Tax Head / Act', 'Total Liability', 'Paid Through ITC (Credit Ledger)', 'Net Balance Paid In Cash (Cash Ledger)']],
        body: table61Data,
        theme: 'grid',
        headStyles: { fillColor: [5, 150, 105], fontSize: 8.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 65, fontStyle: 'bold' },
          1: { cellWidth: 68, halign: 'right' },
          2: { cellWidth: 68, halign: 'right' },
          3: { cellWidth: 68, halign: 'right', fontStyle: 'bold', textColor: [185, 28, 28] }
        },
        margin: { left: 14, right: 14 }
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
        doc.text(`${secNumber++}. GSTR-1 Table 4A - B2B Registered Outward Invoices (${gstr1B2BList.length} Invoices)`, 14, yPos);
        yPos += 4;

        const b2bTableData = gstr1B2BList.slice(0, 50).map(item => [
          item.gstin,
          item.clientName,
          item.invoiceNumber,
          item.invoiceDate,
          fmtRs(item.invoiceValue),
          `${item.taxRate}%`,
          fmtRs(item.taxableValue),
          fmtRs(item.integratedTax + item.centralTax + item.stateTax)
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['GSTIN of Recipient', 'Party / Trade Name', 'Invoice #', 'Date', 'Invoice Value', 'Rate', 'Taxable Value', 'Total Tax Amount']],
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
            7: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
          },
          margin: { left: 14, right: 14 }
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

        const b2csTableData = gstr1B2CSList.slice(0, 25).map(item => [
          item.integratedTax > 0 ? 'Inter-State' : 'Intra-State',
          item.placeOfSupply,
          `${item.taxRate}%`,
          fmtRs(item.taxableValue),
          fmtRs(item.integratedTax),
          fmtRs(item.centralTax),
          fmtRs(item.stateTax),
          fmtRs(item.integratedTax + item.centralTax + item.stateTax)
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Supply Type', 'Place of Supply (POS)', 'Rate', 'Taxable Value', 'Integrated Tax', 'Central Tax', 'State / UT Tax', 'Total Tax']],
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
            7: { cellWidth: 36, halign: 'right', fontStyle: 'bold' }
          },
          margin: { left: 14, right: 14 }
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
        doc.text(`${secNumber++}. GSTR-2B - Auto-drafted ITC Inward Supplies (${gstr2bList.length} Bills / Invoices)`, 14, yPos);
        yPos += 4;

        const itcTableData = gstr2bList.slice(0, 50).map(item => [
          item.vendorGstin || 'Unregistered',
          item.vendorName || '-',
          item.invoiceNumber || '-',
          item.invoiceDate || '-',
          fmtRs(item.invoiceValue),
          fmtRs(item.taxableValue),
          fmtRs(item.integratedTax + item.centralTax + item.stateTax),
          item.itcAvailable === 'Y' ? 'Eligible' : 'Ineligible'
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Vendor GSTIN', 'Vendor / Supplier Name', 'Bill / Inv #', 'Date', 'Bill Value', 'Taxable Value', 'ITC Amount', 'ITC Status']],
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
            7: { cellWidth: 24, halign: 'center', fontStyle: 'bold' }
          },
          margin: { left: 14, right: 14 }
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

        const hsnTableData = gstr1HSNList.slice(0, 30).map(item => [
          item.hsnCode,
          item.description || 'Goods / Services',
          item.uqc || 'NOS',
          item.totalQuantity.toLocaleString('en-IN'),
          fmtRs(item.totalValue),
          fmtRs(item.taxableValue),
          fmtRs(item.integratedTax + item.centralTax + item.stateTax)
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['HSN / SAC', 'Description of Goods / Services', 'UQC', 'Total Qty', 'Total Value', 'Taxable Value', 'Total Tax Amount']],
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
            6: { cellWidth: 46, halign: 'right', fontStyle: 'bold' }
          },
          margin: { left: 14, right: 14 }
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

      doc.save(`GST-Returns-Report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Success", description: "GST PDF Report downloaded successfully." });
    } catch (err) {
      console.error('Error exporting GST PDF:', err);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate GST PDF." });
    }
  };

  const exportPaymentsExcel = () => {
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

  const exportPaymentsPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      let periodText = '';
      if (startDate && endDate) {
        periodText = `Period: ${safelyToLocaleDate(startDate)} to ${safelyToLocaleDate(endDate)}`;
      } else {
        periodText = `Period: ${dateRange.replace(/_/g, ' ').toUpperCase()}`;
      }

      // Header Banner (Emerald theme for payments)
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, pageWidth, 45, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text('PAYMENTS & COLLECTIONS REPORT', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${safelyToLocaleDate(new Date())} | ${periodText}`, pageWidth / 2, 32, { align: 'center' });

      let yPos = 55;

      // Summary table
      const summaryRows = [
        ['Total Collected', `${currencySymbol} ${paymentStats.totalCollected.toLocaleString('en-IN')}`, 'Total Transactions', paymentStats.totalTransactions.toString()],
        ['UPI / Digital', `${currencySymbol} ${paymentStats.upiTotal.toLocaleString('en-IN')}`, 'Cash in Hand', `${currencySymbol} ${paymentStats.cashTotal.toLocaleString('en-IN')}`],
        ['Bank Transfer', `${currencySymbol} ${paymentStats.bankTransferTotal.toLocaleString('en-IN')}`, 'Average Receipt', `${currencySymbol} ${paymentStats.averagePayment.toFixed(2)}`]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Collections Metric', 'Value', 'Metric', 'Value']],
        body: summaryRows,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 12;

      // Method Breakdown Table
      if (paymentMethodDistribution.length > 0) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('Payment Methods Breakdown', 14, yPos);
        yPos += 4;

        const methodRows = paymentMethodDistribution.map(m => [
          m.name,
          `${currencySymbol} ${m.value.toLocaleString('en-IN')}`,
          m.count.toString(),
          `${m.percentage.toFixed(1)}%`
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Method', 'Total Amount', 'Transactions', 'Share']],
          body: methodRows,
          theme: 'striped',
          headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] },
          styles: { fontSize: 8.5 },
          margin: { left: 14, right: 14 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 12;
      }

      // Detailed Transactions
      if (paymentsList.length > 0) {
        if (yPos > pageHeight - 50) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('Detailed Payment Ledger', 14, yPos);
        yPos += 4;

        const txRows = paymentsList.slice(0, 150).map(p => [
          safelyToLocaleDate(p.payment_date),
          p.reference_number || '-',
          p.invoice_number,
          p.party_name,
          p.payment_method.toUpperCase(),
          `${currencySymbol} ${p.amount.toLocaleString('en-IN')}`
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Ref #', 'Bill #', 'Party', 'Method', 'Amount']],
          body: txRows,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
          styles: { fontSize: 8 },
          columnStyles: { 5: { halign: 'right', fontStyle: 'bold' } },
          margin: { left: 14, right: 14 }
        });
      }

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8.5);
        doc.setTextColor(128, 128, 128);
        doc.text('ESCROWBILL - Payment & Collections Report', pageWidth / 2, pageHeight - 12, { align: 'center' });
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 7, { align: 'center' });
      }

      doc.save(`payments-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Success", description: "Payments report PDF downloaded successfully." });
    } catch (error) {
      console.error('Error exporting payments PDF:', error);
      toast({ variant: "destructive", title: "Export Failed", description: "Could not export payments PDF." });
    }
  };

  const exportItemsPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      let periodText = '';
      if (startDate && endDate) {
        const start = safelyToLocaleDate(startDate);
        const end = safelyToLocaleDate(endDate);
        periodText = `Period: ${start} to ${end}`;
      } else {
        periodText = `Period: ${dateRange.replace('_', ' ').toUpperCase()}`;
      }

      // Professional Header with indigo theme
      doc.setFillColor(99, 102, 241); // Indigo theme for items
      doc.rect(0, 0, pageWidth, 50, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text('ITEM-WISE PROFIT REPORT', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${safelyToLocaleDate(new Date())}`, pageWidth / 2, 32, { align: 'center' });
      doc.text(periodText, pageWidth / 2, 42, { align: 'center' });

      doc.setTextColor(0, 0, 0);

      let yPosition = 65;

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(99, 102, 241);
      doc.text('Product Performance details (Paid Invoices)', 20, yPosition);
      yPosition += 10;

      if (itemsReports && itemsReports.length > 0) {
        const tableBody = itemsReports.map(item => [
          item.name,
          item.sku,
          item.hsn,
          item.quantitySold.toString(),
          `${currencySymbol} ${item.totalSales.toLocaleString('en-IN')}`,
          `${currencySymbol} ${item.totalCost.toLocaleString('en-IN')}`,
          `${currencySymbol} ${item.netProfit.toLocaleString('en-IN')}`,
          `${item.margin.toFixed(1)}%`
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Item Name', 'SKU', 'HSN', 'Qty Sold', 'Revenue', 'Cost', 'Profit', 'Margin']],
          body: tableBody,
          theme: 'striped',
          headStyles: {
            fillColor: [99, 102, 241],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center',
            cellPadding: 4
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 3,
            textColor: [50, 50, 50]
          },
          alternateRowStyles: {
            fillColor: [245, 247, 250]
          },
          columnStyles: {
            0: { cellWidth: 45, fontStyle: 'bold' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 15, halign: 'center' },
            3: { cellWidth: 15, halign: 'center' },
            4: { cellWidth: 25, halign: 'right' },
            5: { cellWidth: 25, halign: 'right' },
            6: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
            7: { cellWidth: 15, halign: 'center' }
          },
          margin: { left: 15, right: 15 }
        });
      } else {
        doc.setFontSize(12);
        doc.text('No item data available for the selected period.', 20, yPosition + 10);
      }

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text('ESCROWBILL - Invoice Management System', pageWidth / 2, pageHeight - 15, { align: 'center' });
      
      doc.save(`item-wise-profit-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Success", description: "Item profit PDF downloaded successfully." });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF." });
    }
  };

  const exportItemsExcel = () => {
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

  const exportToPDF = async () => {
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


  const exportOverviewPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      let periodText = '';
      if (startDate && endDate) {
        const start = safelyToLocaleDate(startDate);
        const end = safelyToLocaleDate(endDate);
        periodText = `Period: ${start} to ${end}`;
      } else {
        periodText = `Period: ${dateRange.replace('_', ' ').toUpperCase()}`;
      }

      // Professional Header with gradient background
      doc.setFillColor(66, 99, 235); // Blue gradient start
      doc.rect(0, 0, pageWidth, 50, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('OVERVIEW REPORT', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${safelyToLocaleDate(new Date())}`, pageWidth / 2, 32, { align: 'center' });
      doc.text(periodText, pageWidth / 2, 42, { align: 'center' });

      doc.setTextColor(0, 0, 0);

      let yPosition = 65;

      // Summary Section Title
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(66, 99, 235);
      doc.text('Financial Summary', 20, yPosition);
      yPosition += 10;

      const summaryData = [
        ['Total Revenue', `${currencySymbol} ${stats.totalRevenue.toLocaleString('en-IN')}`],
        ['Total Invoices', stats.totalInvoices.toString()],
        ['Paid Invoices', stats.paidInvoices.toString()],
        ['Pending Amount', `${currencySymbol} ${stats.pendingAmount.toLocaleString('en-IN')}`],
        ['Total Expenses', `${currencySymbol} ${stats.totalExpenses.toLocaleString('en-IN')}`],
        ['Net Profit', `${currencySymbol} ${stats.netProfit.toLocaleString('en-IN')}`],
        ['Average Invoice Value', `${currencySymbol} ${stats.averageInvoiceValue.toLocaleString('en-IN')}`]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: {
          fillColor: [66, 99, 235],
          textColor: [255, 255, 255],
          fontSize: 11,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 5
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: 4,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 90 },
          1: { halign: 'right', fontStyle: 'bold', textColor: [66, 99, 235], cellWidth: 80 }
        },
        margin: { left: 20, right: 20 }
      });

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text('ESCROWBILL - Invoice Management System', pageWidth / 2, pageHeight - 15, { align: 'center' });
      doc.text(`Page 1 of 1`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      doc.save(`overview-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Success", description: "Overview PDF downloaded successfully." });
    } catch (error) {
      console.error('Error:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF." });
    }
  };

  const exportInvoicesPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      let periodText = '';
      if (startDate && endDate) {
        const start = safelyToLocaleDate(startDate);
        const end = safelyToLocaleDate(endDate);
        periodText = `Period: ${start} to ${end}`;
      } else {
        periodText = `Period: ${dateRange.replace('_', ' ').toUpperCase()}`;
      }

      // Professional Header
      doc.setFillColor(16, 185, 129); // Green theme for invoices
      doc.rect(0, 0, pageWidth, 50, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('INVOICES REPORT', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${safelyToLocaleDate(new Date())}`, pageWidth / 2, 32, { align: 'center' });
      doc.text(periodText, pageWidth / 2, 42, { align: 'center' });

      doc.setTextColor(0, 0, 0);

      let yPosition = 65;

      // Summary Stats
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text('Invoice Details', 20, yPosition);
      yPosition += 3;

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Total Invoices: ${invoicesList.length}`, 20, yPosition + 5);
      yPosition += 15;

      if (invoicesList && invoicesList.length > 0) {
        const invoiceData = invoicesList.map(inv => [
          safelyToLocaleDate(inv.created_at),
          inv.invoice_number,
          inv.client_name,
          `${currencySymbol} ${inv.total_amount.toLocaleString('en-IN')}`,
          inv.status.toUpperCase()
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Date', 'Invoice #', 'Client', 'Amount', 'Status']],
          body: invoiceData,
          theme: 'striped',
          headStyles: {
            fillColor: [16, 185, 129],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center',
            cellPadding: 4
          },
          bodyStyles: {
            fontSize: 9,
            cellPadding: 3,
            textColor: [50, 50, 50]
          },
          alternateRowStyles: {
            fillColor: [245, 247, 250]
          },
          columnStyles: {
            0: { cellWidth: 30, halign: 'center' },
            1: { cellWidth: 35, fontStyle: 'bold' },
            2: { cellWidth: 50 },
            3: { cellWidth: 45, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] },
            4: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
          },
          didParseCell: function (data) {
            if (data.column.index === 4 && data.section === 'body') {
              const status = data.cell.raw;
              if (status === 'PAID') {
                data.cell.styles.textColor = [16, 185, 129];
                data.cell.styles.fillColor = [220, 252, 231];
              } else if (status === 'PENDING') {
                data.cell.styles.textColor = [234, 179, 8];
                data.cell.styles.fillColor = [254, 249, 195];
              } else if (status === 'OVERDUE') {
                data.cell.styles.textColor = [239, 68, 68];
                data.cell.styles.fillColor = [254, 226, 226];
              }
            }
          },
          margin: { left: 10, right: 10 }
        });
      }

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text('ESCROWBILL - Invoice Management System', pageWidth / 2, pageHeight - 15, { align: 'center' });
      doc.text(`Page 1 of 1`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      doc.save(`invoices-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Success", description: "Invoices PDF downloaded successfully." });
    } catch (error) {
      console.error('Error:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF." });
    }
  };

  const exportFinancialPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      let periodText = '';
      if (startDate && endDate) {
        const start = safelyToLocaleDate(startDate);
        const end = safelyToLocaleDate(endDate);
        periodText = `Period: ${start} to ${end}`;
      } else {
        periodText = `Period: ${dateRange.replace('_', ' ').toUpperCase()}`;
      }

      // Professional Header - Purple theme for financial
      doc.setFillColor(147, 51, 234);
      doc.rect(0, 0, pageWidth, 50, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('FINANCIAL REPORT', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${safelyToLocaleDate(new Date())}`, pageWidth / 2, 32, { align: 'center' });
      doc.text(periodText, pageWidth / 2, 42, { align: 'center' });

      doc.setTextColor(0, 0, 0);

      let yPosition = 65;

      // Financial Summary Title
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(147, 51, 234);
      doc.text('Financial Summary', 20, yPosition);
      yPosition += 10;

      const profitMargin = stats.totalRevenue > 0 ? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(2) : 0;
      const financialData = [
        ['Total Revenue', `${currencySymbol} ${stats.totalRevenue.toLocaleString('en-IN')}`],
        ['Total Expenses', `${currencySymbol} ${stats.totalExpenses.toLocaleString('en-IN')}`],
        ['Net Profit', `${currencySymbol} ${stats.netProfit.toLocaleString('en-IN')}`],
        ['Profit Margin', `${profitMargin}%`]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: financialData,
        theme: 'striped',
        headStyles: {
          fillColor: [147, 51, 234],
          textColor: [255, 255, 255],
          fontSize: 11,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 5
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: 4,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 90 },
          1: { halign: 'right', fontStyle: 'bold', textColor: [147, 51, 234], cellWidth: 80 }
        },
        didParseCell: function (data) {
          if (data.row.index === 2 && data.column.index === 1 && data.section === 'body') {
            // Net Profit row - color based on profit/loss
            if (stats.netProfit >= 0) {
              data.cell.styles.textColor = [16, 185, 129]; // Green for profit
            } else {
              data.cell.styles.textColor = [239, 68, 68]; // Red for loss
            }
          }
        },
        margin: { left: 20, right: 20 }
      });

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text('ESCROWBILL - Invoice Management System', pageWidth / 2, pageHeight - 15, { align: 'center' });
      doc.text(`Page 1 of 1`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      doc.save(`financial-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Success", description: "Financial PDF downloaded successfully." });
    } catch (error) {
      console.error('Error:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF." });
    }
  };

  const exportClientsPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      let periodText = '';
      if (startDate && endDate) {
        const start = safelyToLocaleDate(startDate);
        const end = safelyToLocaleDate(endDate);
        periodText = `Period: ${start} to ${end}`;
      } else {
        periodText = `Period: ${dateRange.replace('_', ' ').toUpperCase()}`;
      }

      // Professional Header - Amber/Orange theme for clients
      doc.setFillColor(245, 158, 11); // Amber
      doc.rect(0, 0, pageWidth, 50, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('CLIENTS PERFORMANCE REPORT', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${safelyToLocaleDate(new Date())}`, pageWidth / 2, 32, { align: 'center' });
      doc.text(periodText, pageWidth / 2, 42, { align: 'center' });

      doc.setTextColor(0, 0, 0);

      let yPosition = 65;

      // Summary Title
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(245, 158, 11);
      doc.text('Client Analysis', 20, yPosition);
      yPosition += 10;

      if (clientReports && clientReports.length > 0) {
        const clientTableData = clientReports.map(client => [
          client.client_name,
          client.total_invoices.toString(),
          `${currencySymbol} ${client.total_amount.toLocaleString('en-IN')}`,
          `${currencySymbol} ${client.paid_amount.toLocaleString('en-IN')}`,
          `${currencySymbol} ${client.pending_amount.toLocaleString('en-IN')}`
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Client Name', 'Invoices', 'Total Billed', 'Amount Paid', 'Amount Pending']],
          body: clientTableData,
          theme: 'striped',
          headStyles: {
            fillColor: [245, 158, 11],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center',
            cellPadding: 4
          },
          bodyStyles: {
            fontSize: 9,
            cellPadding: 3,
            textColor: [50, 50, 50]
          },
          alternateRowStyles: {
            fillColor: [255, 251, 235]
          },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 },
            1: { halign: 'center', cellWidth: 20 },
            2: { halign: 'right', fontStyle: 'bold', cellWidth: 40 },
            3: { halign: 'right', textColor: [16, 185, 129], fontStyle: 'bold', cellWidth: 40 },
            4: { halign: 'right', textColor: [239, 68, 68], fontStyle: 'bold', cellWidth: 40 }
          },
          margin: { left: 10, right: 10 }
        });
      }

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text('ESCROWBILL - Invoice Management System', pageWidth / 2, pageHeight - 15, { align: 'center' });
      doc.text(`Page 1 of 1`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      doc.save(`clients-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Success", description: "Clients PDF downloaded successfully." });
    } catch (error) {
      console.error('Error:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF." });
    }
  };

  const exportExpensesPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      let periodText = '';
      if (startDate && endDate) {
        const start = safelyToLocaleDate(startDate);
        const end = safelyToLocaleDate(endDate);
        periodText = `Period: ${start} to ${end}`;
      } else {
        periodText = `Period: ${dateRange.replace('_', ' ').toUpperCase()}`;
      }

      // Professional Header - Rose/Pink theme for expenses
      doc.setFillColor(225, 29, 72); // Rose-600
      doc.rect(0, 0, pageWidth, 50, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('EXPENSES REPORT', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${safelyToLocaleDate(new Date())}`, pageWidth / 2, 32, { align: 'center' });
      doc.text(periodText, pageWidth / 2, 42, { align: 'center' });

      doc.setTextColor(0, 0, 0);

      let yPosition = 65;

      // Expense Summary
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(225, 29, 72);
      doc.text('Expense Summary', 20, yPosition);
      yPosition += 8;

      const expenseSummaryData = [
        ['Total Expenses', `${currencySymbol} ${stats.totalExpenses.toLocaleString('en-IN')}`],
        ['Total Items', expensesList.length.toString()],
        ['Top Category', categoryData.length > 0 ? categoryData[0].name : 'N/A']
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: expenseSummaryData,
        theme: 'striped',
        headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255] },
        columnStyles: { 0: { cellWidth: 80, fontStyle: 'bold' }, 1: { halign: 'right', cellWidth: 50 } },
        margin: { left: 20 }
      });

      yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

      // Grouped by Category Table
      if (categoryData.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Category Breakdown', 20, yPosition);
        yPosition += 5;

        const catData = categoryData.map(cat => [
          cat.name,
          `${currencySymbol} ${cat.value.toLocaleString('en-IN')}`,
          `${((cat.value / stats.totalExpenses) * 100).toFixed(1)}%`
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Category', 'Amount', 'Percentage']],
          body: catData,
          theme: 'striped',
          headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255] },
          columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center' } },
          margin: { left: 20, right: 20 }
        });

        yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      }

      // Detailed Lists
      if (expensesList.length > 0) {
        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Detailed Expense List', 20, yPosition);
        yPosition += 5;

        const detailedData = expensesList.map(exp => [
          safelyToLocaleDate(exp.expense_date),
          exp.title,
          exp.category,
          exp.payment_method.toUpperCase(),
          `${currencySymbol} ${exp.amount.toLocaleString('en-IN')}`
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Date', 'Title', 'Category', 'Method', 'Amount']],
          body: detailedData,
          theme: 'striped',
          headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255] },
          columnStyles: { 0: { cellWidth: 30 }, 2: { cellWidth: 40 }, 4: { halign: 'right', fontStyle: 'bold' } },
          margin: { left: 10, right: 10 }
        });
      }

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text('ESCROWBILL - Expense Management System', pageWidth / 2, pageHeight - 15, { align: 'center' });
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      doc.save(`expenses-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Success", description: "Expenses PDF downloaded successfully." });
    } catch (error) {
      console.error('Error:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF." });
    }
  };

  const exportToExcel = () => {
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

  const exportOverviewExcel = () => {
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

  const exportInvoicesExcel = () => {
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

  const exportFinancialExcel = () => {
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

  const exportClientsExcel = () => {
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

  const exportExpensesExcel = () => {
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

  const exportInventoryExcel = () => {
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

  const exportInventoryPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const companyName = companyProfile?.company_name || profile?.company_name || 'My Business';
      const companyGstin = companyProfile?.gstin || profile?.gstin || 'N/A';

      // Header Banner (Orange theme for stock/inventory)
      doc.setFillColor(234, 88, 12);
      doc.rect(0, 0, pageWidth, 38, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('INVENTORY STOCK & VALUATION AUDIT REPORT', pageWidth / 2, 16, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(
        `Entity: ${companyName} | GSTIN: ${companyGstin} | Generated: ${safelyToLocaleDate(new Date())} | Total Active Items: ${inventoryStats.totalUnique}`,
        pageWidth / 2,
        27,
        { align: 'center' }
      );

      let yPos = 46;

      // Executive Metrics Grid
      const summaryRows = [
        [
          'Total Unique Items', `${inventoryStats.totalUnique} Products`,
          'Total Stock Units', `${inventoryStats.totalStockQty.toLocaleString('en-IN')} Units`
        ],
        [
          'Inventory Asset Cost', `${currencySymbol} ${inventoryStats.totalPurchaseVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
          'Retail Sale Valuation', `${currencySymbol} ${inventoryStats.totalSalesVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
        ],
        [
          'Potential Gross Profit', `${currencySymbol} ${inventoryStats.totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
          'Average Gross Margin', `${inventoryStats.profitMarginPercent.toFixed(1)}%`
        ]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Inventory Metric', 'Value', 'Inventory Metric', 'Value']],
        body: summaryRows,
        theme: 'grid',
        headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5 },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Valuation Table
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
          `${currencySymbol} ${(p.purchase_price || 0).toLocaleString('en-IN')}`,
          `${currencySymbol} ${p.price.toLocaleString('en-IN')}`,
          `${p.tax_rate}%`,
          `${currencySymbol} ${costVal.toLocaleString('en-IN')}`,
          `${currencySymbol} ${saleVal.toLocaleString('en-IN')}`,
          `${currencySymbol} ${profit.toLocaleString('en-IN')}`,
          `${margin.toFixed(0)}%`
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Product Name', 'SKU', 'HSN', 'Stock', 'Cost Rate', 'Sale Rate', 'GST %', 'Asset Cost', 'Retail Val', 'Profit', 'Margin']],
        body: itemRows,
        theme: 'striped',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 50 },
          4: { halign: 'center', fontStyle: 'bold' },
          8: { halign: 'right', fontStyle: 'bold' },
          9: { halign: 'right', fontStyle: 'bold' },
          10: { halign: 'right', fontStyle: 'bold' },
          11: { halign: 'center' }
        },
        margin: { left: 14, right: 14 }
      });

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${totalPages} | EscrowBill Inventory Management & Audit System | Confidential`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
      }

      doc.save(`inventory-stock-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Success", description: "Inventory Valuation PDF downloaded successfully." });
    } catch (err) {
      console.error("PDF Export error:", err);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not generate PDF report."
      });
    }
  };

  const exportInventoryCSV = () => {
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

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
        
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `EscrowBill_Stock_Valuation_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
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
          {/* Export Buttons */}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={exportOverviewPDF} size="sm" className="flex-1 sm:flex-none" aria-label="Download overview report as PDF">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={exportOverviewExcel} size="sm" className="flex-1 sm:flex-none" aria-label="Download overview report as Excel">
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="p-4 md:p-6 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/5 cursor-default overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground text-xs md:text-sm font-semibold uppercase tracking-wider">Total Revenue</p>
                  <p className="text-xl sm:text-2xl font-black text-foreground whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight py-0.5 mt-1">
                    {currencySymbol}&nbsp;{stats.totalRevenue.toLocaleString('en-IN')}
                  </p>
                  <div className="flex items-center mt-2">
                    {revenueGrowth >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1 shrink-0" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 mr-1 shrink-0" />
                    )}
                    <span className={`text-xs font-bold ${revenueGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {Math.abs(revenueGrowth).toFixed(1)}% vs last period
                    </span>
                  </div>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 hover:border-blue-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/5 cursor-default overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground text-xs md:text-sm font-semibold uppercase tracking-wider">Net Profit</p>
                  <p className="text-xl sm:text-2xl font-black text-foreground whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight py-0.5 mt-1">
                    {stats.netProfit < 0 ? `-${currencySymbol}\u00A0${Math.abs(stats.netProfit).toLocaleString('en-IN')}` : `${currencySymbol}\u00A0${stats.netProfit.toLocaleString('en-IN')}`}
                  </p>
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-2">
                    {stats.totalRevenue > 0 ? `${((stats.netProfit / stats.totalRevenue) * 100).toFixed(1)}% margin` : 'Net earnings'}
                  </p>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/5 cursor-default overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground text-xs md:text-sm font-semibold uppercase tracking-wider">Outstanding</p>
                  <p className="text-xl sm:text-2xl font-black text-foreground whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight py-0.5 mt-1">
                    {currencySymbol}&nbsp;{stats.pendingAmount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-2">
                    Pending receivables
                  </p>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0 flex items-center justify-center">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/20 hover:border-rose-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-rose-500/5 cursor-default overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground text-xs md:text-sm font-semibold uppercase tracking-wider">Expenses</p>
                  <p className="text-xl sm:text-2xl font-black text-foreground whitespace-nowrap overflow-hidden text-ellipsis tabular-nums leading-tight py-0.5 mt-1">
                    {currencySymbol}&nbsp;{stats.totalExpenses.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-2">
                    Operational outflow
                  </p>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shrink-0 flex items-center justify-center">
                  <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-4 md:p-6 bg-card dark:bg-card mt-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Revenue & Profit Analysis</h3>
            {monthlyData && monthlyData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] md:h-[400px]">
                <AreaChart data={monthlyData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${currencySymbol}${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => `${currencySymbol}${Number(value).toLocaleString('en-IN')}`}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    fillOpacity={0.1}
                    fill="var(--color-revenue)"
                    name="Total Revenue"
                    dot={{ r: 3, fill: "var(--color-revenue)", strokeWidth: 1, stroke: "#fff" }}
                    activeDot={{ r: 5, strokeWidth: 1, stroke: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="var(--color-profit)"
                    strokeWidth={2}
                    fillOpacity={0.1}
                    fill="var(--color-profit)"
                    name="Net Profit"
                    dot={{ r: 3, fill: "var(--color-profit)", strokeWidth: 1, stroke: "#fff" }}
                    activeDot={{ r: 5, strokeWidth: 1, stroke: '#fff' }}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                No data available for the selected period
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          {/* Export Buttons */}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={exportInvoicesPDF} size="sm" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={exportInvoicesExcel} size="sm" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>

          <Card className="p-4 sm:p-6 bg-card dark:bg-card overflow-hidden shadow-sm">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground">Invoice History</h3>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={invoiceSearchTerm}
                    onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                    placeholder="Search invoice #, client, status..."
                    className="pl-9 h-10 bg-background"
                  />
                </div>
              </div>

              {/* Billing Summary Bar */}
              <div className="space-y-2 bg-muted/30 p-4 rounded-xl border border-border/50">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs justify-between font-medium">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Paid: {currencySymbol}{billingSummary.paid.toLocaleString('en-IN')} ({billingSummary.paidPct.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Pending: {currencySymbol}{billingSummary.pending.toLocaleString('en-IN')} ({billingSummary.pendingPct.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Overdue: {currencySymbol}{billingSummary.overdue.toLocaleString('en-IN')} ({billingSummary.overduePct.toFixed(1)}%)</span>
                  </div>
                  <div className="text-muted-foreground ml-auto">
                    Total: {currencySymbol}{billingSummary.total.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex shadow-inner">
                  <div style={{ width: `${billingSummary.paidPct}%` }} className="bg-emerald-500 h-full transition-all duration-500" title="Paid" />
                  <div style={{ width: `${billingSummary.pendingPct}%` }} className="bg-amber-500 h-full transition-all duration-500" title="Pending" />
                  <div style={{ width: `${billingSummary.overduePct}%` }} className="bg-rose-500 h-full transition-all duration-500" title="Overdue" />
                </div>
              </div>

              {/* Status Pill Filters */}
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All Invoices', count: invoicesList.length },
                  { value: 'paid', label: 'Paid', count: invoicesList.filter(i => i.status === 'paid').length },
                  { value: 'pending', label: 'Pending', count: invoicesList.filter(i => ['draft', 'sent', 'viewed'].includes(i.status)).length },
                  { value: 'overdue', label: 'Overdue', count: invoicesList.filter(i => i.status === 'overdue').length }
                ].map((pill) => {
                  const isActive = selectedInvoiceStatus === pill.value;
                  return (
                    <button
                      key={pill.value}
                      onClick={() => setSelectedInvoiceStatus(pill.value)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background hover:bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {pill.label} <span className="ml-1 opacity-70 font-normal">({pill.count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2 font-medium">Date</th>
                    <th className="py-2 font-medium">Invoice #</th>
                    <th className="py-2 font-medium">Client</th>
                    <th className="py-2 font-medium text-right">Amount</th>
                    <th className="py-2 font-medium text-center">Status</th>
                    <th className="py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoicesList.length > 0 ? (
                    filteredInvoicesList.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3">{safelyToLocaleDate(invoice.created_at)}</td>
                        <td className="py-3 font-medium">{invoice.invoice_number}</td>
                        <td className="py-3">{invoice.client_name}</td>
                        <td className="py-3 text-right">{currencySymbol}{invoice.total_amount.toLocaleString()}</td>
                        <td className="py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                            ${invoice.status === 'paid' ? 'bg-success-light text-success' :
                              invoice.status === 'overdue' ? 'bg-danger-light text-danger' :
                                'bg-warning-light text-warning'}`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleViewInvoice(invoice.id)}
                              title="View Invoice"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleDownloadInvoice(invoice.id, invoice.invoice_number)}
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No invoices found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {/* Export Buttons */}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={exportPaymentsPDF} size="sm" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={exportPaymentsExcel} size="sm" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>

          {/* Payment Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 sm:p-5 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 cursor-default">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Collections</p>
                  <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                    {currencySymbol}{paymentStats.totalCollected.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {paymentStats.totalCount} transactions received
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-5 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent border border-cyan-500/20 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/5 cursor-default">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-xl text-cyan-600 dark:text-cyan-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">UPI / Digital</p>
                  <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                    {currencySymbol}{paymentStats.upiCollected.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {paymentStats.totalCollected > 0 
                      ? ((paymentStats.upiCollected / paymentStats.totalCollected) * 100).toFixed(1) 
                      : 0}% of collections
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5 cursor-default">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Cash Collections</p>
                  <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                    {currencySymbol}{paymentStats.cashCollected.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {paymentStats.totalCollected > 0 
                      ? ((paymentStats.cashCollected / paymentStats.totalCollected) * 100).toFixed(1) 
                      : 0}% of collections
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-5 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 cursor-default">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Bank & Others</p>
                  <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                    {currencySymbol}{paymentStats.bankCollected.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Avg ticket: {currencySymbol}{Math.round(paymentStats.averageReceipt).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Visual Charts: Timeline & Payment Method Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-5 lg:col-span-2 bg-card dark:bg-card shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Daily Collections Inflow</h3>
                  <p className="text-xs text-muted-foreground">Cash & digital collections received over selected dates</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Realized Inflow</span>
                </div>
              </div>

              {paymentTimeline.length > 0 ? (
                <ChartContainer
                  config={{
                    amount: {
                      label: "Collected Amount",
                      color: "hsl(var(--primary))",
                    }
                  }}
                  className="h-[280px] w-full"
                >
                  <AreaChart data={paymentTimeline}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${currencySymbol}${value.toLocaleString('en-IN')}`}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as PaymentTimelineItem;
                          return (
                            <div className="rounded-lg border bg-background/95 backdrop-blur-sm p-2.5 shadow-md">
                              <p className="text-xs font-medium text-muted-foreground">{data.date}</p>
                              <p className="text-sm font-bold text-foreground mt-1">
                                {currencySymbol}{data.amount.toLocaleString('en-IN')}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {data.count} payment{data.count !== 1 ? 's' : ''}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="var(--color-amount)"
                      strokeWidth={2.5}
                      fillOpacity={0.15}
                      fill="var(--color-amount)"
                      dot={{ r: 3, fill: "var(--color-amount)", strokeWidth: 1, stroke: "#fff" }}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  No payment data in this date range
                </div>
              )}
            </Card>

            <Card className="p-5 bg-card dark:bg-card shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">Collection Methods</h3>
                <p className="text-xs text-muted-foreground mb-3">Breakdown by payment mode</p>
                {paymentMethodDistribution.length > 0 ? (
                  <div className="h-[200px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodDistribution}
                          dataKey="amount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {paymentMethodDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const item = payload[0].payload as PaymentMethodData;
                              const percentage = paymentStats.totalCollected > 0
                                ? ((item.amount / paymentStats.totalCollected) * 100).toFixed(1)
                                : 0;
                              return (
                                <div className="rounded-lg border bg-background/95 backdrop-blur-sm p-2.5 shadow-md">
                                  <p className="text-xs font-semibold" style={{ color: item.color }}>{item.name}</p>
                                  <p className="text-sm font-bold mt-0.5">{currencySymbol}{item.amount.toLocaleString('en-IN')}</p>
                                  <p className="text-[11px] text-muted-foreground">{item.count} txns ({percentage}%)</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                    No transactions recorded
                  </div>
                )}
              </div>

              {/* Legend with percentages */}
              <div className="space-y-1.5 pt-2 border-t border-border/50">
                {paymentMethodDistribution.map((m) => {
                  const pct = paymentStats.totalCollected > 0
                    ? ((m.amount / paymentStats.totalCollected) * 100).toFixed(1)
                    : '0';
                  return (
                    <div key={m.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                        <span className="text-muted-foreground truncate max-w-[120px]">{m.name}</span>
                      </div>
                      <div className="font-semibold text-foreground">
                        {currencySymbol}{m.amount.toLocaleString('en-IN')} <span className="text-[10px] text-muted-foreground font-normal">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Payments Ledger Table */}
          <Card className="p-4 sm:p-6 bg-card dark:bg-card overflow-hidden shadow-sm">
            <div className="flex flex-col gap-4 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Payments Ledger</h3>
                  <p className="text-xs text-muted-foreground">Complete record of collections across invoices & bills</p>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={paymentSearchTerm}
                    onChange={(e) => setPaymentSearchTerm(e.target.value)}
                    placeholder="Search client, invoice #, ref #..."
                    className="pl-9 h-10 bg-background"
                  />
                </div>
              </div>

              {/* Payment Method Filter Chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All Methods', count: paymentsList.length },
                  { value: 'upi', label: 'UPI / Online', count: paymentsList.filter(p => (p.payment_method || '').toLowerCase().includes('upi') || (p.payment_method || '').toLowerCase().includes('online')).length },
                  { value: 'cash', label: 'Cash', count: paymentsList.filter(p => (p.payment_method || '').toLowerCase() === 'cash').length },
                  { value: 'bank_transfer', label: 'Bank Transfer', count: paymentsList.filter(p => (p.payment_method || '').toLowerCase().includes('bank') || (p.payment_method || '').toLowerCase().includes('neft') || (p.payment_method || '').toLowerCase().includes('rtgs')).length },
                  { value: 'cheque', label: 'Cheque', count: paymentsList.filter(p => (p.payment_method || '').toLowerCase().includes('cheque') || (p.payment_method || '').toLowerCase().includes('check')).length },
                  { value: 'card', label: 'Card', count: paymentsList.filter(p => (p.payment_method || '').toLowerCase().includes('card')).length },
                ].map((pill) => {
                  const isActive = selectedPaymentMethod === pill.value;
                  return (
                    <button
                      key={pill.value}
                      onClick={() => setSelectedPaymentMethod(pill.value)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background hover:bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {pill.label} <span className="ml-1 opacity-70 font-normal">({pill.count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2.5 font-medium">Date</th>
                    <th className="py-2.5 font-medium">Party Name</th>
                    <th className="py-2.5 font-medium">Invoice #</th>
                    <th className="py-2.5 font-medium">Type</th>
                    <th className="py-2.5 font-medium">Method</th>
                    <th className="py-2.5 font-medium">Reference #</th>
                    <th className="py-2.5 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPaymentsList.length > 0 ? (
                    filteredPaymentsList.map((payment) => {
                      const methodKey = (payment.payment_method || 'other').toLowerCase();
                      const isUPI = methodKey.includes('upi') || methodKey.includes('online');
                      const isCash = methodKey === 'cash';
                      const isBank = methodKey.includes('bank') || methodKey.includes('neft') || methodKey.includes('rtgs');
                      
                      return (
                        <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="py-3 font-medium text-foreground">
                            {safelyToLocaleDate(payment.payment_date || payment.created_at)}
                          </td>
                          <td className="py-3">
                            <span className="font-medium text-foreground">{payment.party_name}</span>
                          </td>
                          <td className="py-3">
                            <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                              {payment.invoice_number}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                              payment.type === 'purchase'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {payment.type === 'purchase' ? 'Vendor Payout' : 'Client Inflow'}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isUPI
                                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                                : isCash
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : isBank
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            }`}>
                              {isUPI && <CreditCard className="w-3 h-3" />}
                              {isCash && <Banknote className="w-3 h-3" />}
                              {isBank && <Building2 className="w-3 h-3" />}
                              {payment.payment_method || 'Unspecified'}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-xs text-muted-foreground">
                            {payment.reference_number || '—'}
                          </td>
                          <td className="py-3 text-right font-bold text-foreground">
                            {currencySymbol}{payment.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-muted-foreground">
                        <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p>No payments found matching your filter criteria</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          {/* Export Buttons */}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={exportExpensesPDF} size="sm" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={exportExpensesExcel} size="sm" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <Card className="p-4 md:p-6 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/20 hover:border-rose-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-rose-500/5 cursor-default overflow-hidden">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shrink-0 flex items-center justify-center">
                  <Receipt className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground font-semibold uppercase tracking-wider">Total Expenses</p>
                  <p className="text-xl sm:text-2xl font-black text-foreground break-words leading-tight py-0.5 mt-0.5">{currencySymbol} {stats.totalExpenses.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 hover:border-blue-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/5 cursor-default overflow-hidden">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground font-semibold uppercase tracking-wider">Top Category</p>
                  <p className="text-xl sm:text-2xl font-black text-foreground break-words leading-tight py-0.5 mt-0.5" title={categoryData.length > 0 ? categoryData[0].name : 'N/A'}>
                    {categoryData.length > 0 ? categoryData[0].name : 'N/A'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/5 cursor-default overflow-hidden">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground font-semibold uppercase tracking-wider">Expense Items</p>
                  <p className="text-xl sm:text-2xl font-black text-foreground break-words leading-tight py-0.5 mt-0.5">{expensesList.length}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4 sm:p-6 bg-card">
              <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
              <div className="min-h-[300px] flex flex-col justify-center">
                {categoryData.length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-full sm:w-1/2 h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.color} 
                                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                                onClick={() => setSelectedExpenseCategory(selectedExpenseCategory === entry.name ? 'all' : entry.name)}
                              />
                            ))}
                          </Pie>
                          <ChartTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-background border rounded-lg p-2 shadow-lg">
                                    <p className="font-semibold">{payload[0].name}</p>
                                    <p className="text-sm">{currencySymbol} {Number(payload[0].value).toLocaleString('en-IN')}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {((Number(payload[0].value) / stats.totalExpenses) * 100).toFixed(1)}% of total
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="w-full sm:w-1/2 space-y-2 max-h-[260px] overflow-y-auto pr-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground pb-1 border-b">
                        <span>Category</span>
                        <span>Amount</span>
                      </div>
                      {categoryData.map((cat) => {
                        const isSelected = selectedExpenseCategory === cat.name;
                        const percentage = stats.totalExpenses > 0 ? ((cat.value / stats.totalExpenses) * 100).toFixed(1) : 0;
                        return (
                          <button
                            key={cat.name}
                            onClick={() => setSelectedExpenseCategory(isSelected ? 'all' : cat.name)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all hover:bg-muted/50 text-left ${
                              isSelected ? 'bg-muted border border-muted-foreground/20 font-semibold shadow-sm' : 'border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                              <span className="truncate">{cat.name}</span>
                              <span className="text-[10px] text-muted-foreground font-normal">({percentage}%)</span>
                            </div>
                            <span className="font-mono flex-shrink-0">{currencySymbol}{cat.value.toLocaleString('en-IN')}</span>
                          </button>
                        );
                      })}
                      {selectedExpenseCategory !== 'all' && (
                        <button
                          onClick={() => setSelectedExpenseCategory('all')}
                          className="w-full text-center text-xs text-primary font-medium hover:underline pt-2"
                        >
                          Clear Filter
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[260px] text-muted-foreground">
                    No expense data found
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-card overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Expense Items</h3>
                {selectedExpenseCategory !== 'all' && (
                  <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                    Filter: {selectedExpenseCategory}
                  </span>
                )}
              </div>
              {filteredExpensesList.length > 0 ? (
                <div className="space-y-4 overflow-y-auto max-h-[300px]">
                  {filteredExpensesList.slice(0, 10).map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-all duration-200">
                      <div className="min-w-0 flex-1 mr-4">
                        <p className="font-medium truncate">{exp.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium italic">
                            {exp.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {safelyToLocaleDate(exp.expense_date)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-danger">{currencySymbol} {exp.amount.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{exp.payment_method}</p>
                      </div>
                    </div>
                  ))}
                  {filteredExpensesList.length > 10 && (
                    <p className="text-center text-xs text-muted-foreground pt-2">
                      Viewing top 10 of {filteredExpensesList.length} items
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No items listed
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          {/* Export Buttons */}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={exportFinancialPDF} size="sm" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={exportFinancialExcel} size="sm" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue & Expenses Chart */}
            <Card className="p-4 sm:p-6 bg-card dark:bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Revenue, Expenses & Profit Trend</h3>
              {monthlyData && monthlyData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] md:h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradient-revenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0.2} />
                        </linearGradient>
                        <linearGradient id="gradient-expenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-expenses)" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="var(--color-expenses)" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="month"
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${currencySymbol}${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => {
                              return `${currencySymbol}${Number(value).toLocaleString('en-IN')}`;
                            }}
                          />
                        }
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar
                        dataKey="revenue"
                        fill="url(#gradient-revenue)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={30}
                        name="revenue"
                      />
                      <Bar
                        dataKey="expenses"
                        fill="url(#gradient-expenses)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={30}
                        name="expenses"
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        stroke="var(--color-profit)"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 1, fill: "var(--color-profit)", stroke: "#fff" }}
                        activeDot={{ r: 6, strokeWidth: 1, stroke: "#fff" }}
                        name="profit"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available for the selected period
                </div>
              )}
            </Card>

            {/* Monthly Breakdown */}
            <Card className="p-4 sm:p-6 bg-card dark:bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Financial Summary</h3>
              {monthlyData && monthlyData.length > 0 ? (
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {monthlyData.slice(-6).map((month) => (
                    <div key={month.month} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{month.month}</span>
                        <span className={`text-sm px-2 py-1 rounded ${month.profit >= 0 ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                          {month.profit >= 0 ? 'Profit' : 'Loss'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Revenue</div>
                          <div className="font-medium text-success">{currencySymbol}{month.revenue.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Expenses</div>
                          <div className="font-medium text-danger">{currencySymbol}{month.expenses.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Net Profit</div>
                          <div className={`font-medium ${month.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                            {currencySymbol}{month.profit.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Invoices</div>
                          <div className="font-medium">{month.invoices}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No monthly data available
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          {/* Export Buttons */}
          <div className="flex flex-wrap justify-end gap-2 mb-4">
            <Button variant="outline" onClick={exportClientsPDF} size="sm" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={exportClientsExcel} size="sm" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>

          <Card className="p-4 sm:p-6 bg-card dark:bg-card shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Client Performance Report</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{filteredAndSortedClients.length} clients matched</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  placeholder="Search client name..."
                  className="pl-9 h-10 bg-background"
                />
              </div>
            </div>
            {filteredAndSortedClients && filteredAndSortedClients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th onClick={() => handleClientSort('name')} className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted transition-colors rounded-tl-lg">
                        <div className="flex items-center gap-1">
                          Client
                          <span className="text-[10px] text-primary">
                            {clientSortField === 'name' ? (clientSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                          </span>
                        </div>
                      </th>
                      <th onClick={() => handleClientSort('invoices')} className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted transition-colors">
                        <div className="flex items-center justify-end gap-1">
                          Invoices
                          <span className="text-[10px] text-primary">
                            {clientSortField === 'invoices' ? (clientSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                          </span>
                        </div>
                      </th>
                      <th onClick={() => handleClientSort('total')} className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted transition-colors">
                        <div className="flex items-center justify-end gap-1">
                          Total Amount
                          <span className="text-[10px] text-primary">
                            {clientSortField === 'total' ? (clientSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                          </span>
                        </div>
                      </th>
                      <th onClick={() => handleClientSort('paid')} className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted transition-colors">
                        <div className="flex items-center justify-end gap-1">
                          Paid
                          <span className="text-[10px] text-primary">
                            {clientSortField === 'paid' ? (clientSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                          </span>
                        </div>
                      </th>
                      <th onClick={() => handleClientSort('pending')} className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted transition-colors">
                        <div className="flex items-center justify-end gap-1">
                          Pending
                          <span className="text-[10px] text-primary">
                            {clientSortField === 'pending' ? (clientSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                          </span>
                        </div>
                      </th>
                      <th onClick={() => handleClientSort('rate')} className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted transition-colors rounded-tr-lg">
                        <div className="flex items-center justify-end gap-1">
                          Payment Rate
                          <span className="text-[10px] text-primary">
                            {clientSortField === 'rate' ? (clientSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                          </span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAndSortedClients.map((client, index) => {
                      const paymentRate = client.total_amount > 0 ? (client.paid_amount / client.total_amount) * 100 : 0;
                      return (
                        <tr key={index} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground">{client.client_name}</div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{client.total_invoices}</td>
                          <td className="px-4 py-3 text-right font-bold text-foreground">{currencySymbol}{client.total_amount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-success font-semibold">{currencySymbol}{client.paid_amount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-warning font-semibold">{currencySymbol}{client.pending_amount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${paymentRate >= 80 ? 'bg-success-light text-success' :
                              paymentRate >= 50 ? 'bg-warning-light text-warning' :
                                'bg-danger-light text-danger'
                              }`}>
                              {paymentRate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No client data available</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="gst" className="space-y-6">
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
                onClick={exportGSTPDF}
                className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
                title="Download formatted GST compliance PDF report"
              >
                <Download className="w-4 h-4 mr-1.5 text-rose-600" />
                GST PDF
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

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search GSTIN, invoice, client..."
                    value={gstSearchTerm}
                    onChange={e => setGstSearchTerm(e.target.value)}
                    className="h-8 pl-8 text-xs rounded-lg bg-background"
                  />
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

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                      Total ITC: {currencySymbol}{gstSummaryStats.totalInputTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="relative w-full sm:w-56">
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
                <div className="p-4 border-b border-border/60 bg-muted/20">
                  <h3 className="text-sm font-bold text-foreground">Table 3.1 - Details of Outward Supplies &amp; Inward Supplies liable to Reverse Charge</h3>
                  <p className="text-xs text-muted-foreground">Self-assessed monthly gross liability across tax heads</p>
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
              <div className="p-4 border-b border-border/60 bg-muted/20">
                <h3 className="text-sm font-bold text-foreground">Form GST CMP-08 (Quarterly Statement for Composition Scheme)</h3>
                <p className="text-xs text-muted-foreground">Applicable for taxpayers registered under Section 10 Composition Levy (1% flat rate for manufacturers/traders)</p>
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
              <div className="p-4 border-b border-border/60 bg-muted/20">
                <h3 className="text-sm font-bold text-foreground">GSTR-9 Annual Return &amp; GSTR-9C Reconciliation Statement</h3>
                <p className="text-xs text-muted-foreground">Consolidated annual figures across supplies, ITC, taxes paid, and financial book reconciliation</p>
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
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {/* Top Bar with Sub-tabs and Export Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Sub-tab Switcher */}
            <div className="inline-flex bg-muted/70 p-1 rounded-xl border border-border/70 self-start">
              <button
                type="button"
                onClick={() => setProductReportSubTab('stock')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  productReportSubTab === 'stock'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Package className="w-4 h-4 text-amber-500" />
                <span>Stock Valuation</span>
                <span className="text-xs text-muted-foreground font-normal">({catalogProducts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setProductReportSubTab('profit')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  productReportSubTab === 'profit'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-cyan-500" />
                <span>Item Profitability</span>
                <span className="text-xs text-muted-foreground font-normal">({itemsReports.length})</span>
              </button>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center flex-wrap gap-2">
              {productReportSubTab === 'stock' ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportInventoryExcel}
                    className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportInventoryPDF}
                    className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
                  >
                    <Download className="w-4 h-4 mr-1.5 text-rose-600" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportInventoryCSV}
                    className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
                  >
                    <Download className="w-4 h-4 mr-1.5 text-blue-600" />
                    CSV
                  </Button>
                  <Button
                    onClick={() => window.print()}
                    size="sm"
                    className="font-semibold text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                  >
                    <Printer className="w-4 h-4 mr-1.5" />
                    Print
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportItemsExcel}
                    className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportItemsPDF}
                    className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
                  >
                    <Download className="w-4 h-4 mr-1.5 text-rose-600" />
                    PDF
                  </Button>
                  <Button
                    onClick={() => window.print()}
                    size="sm"
                    className="font-semibold text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                  >
                    <Printer className="w-4 h-4 mr-1.5" />
                    Print
                  </Button>
                </>
              )}
            </div>
          </div>

          {productReportSubTab === 'stock' && (
            <div className="space-y-6">
              {/* 5 Clean Stock Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Total Products</span>
                  <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                    {inventoryStats.totalUnique.toLocaleString('en-IN')}
                  </p>
                </Card>

                <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Stock on Hand</span>
                  <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                    {inventoryStats.totalStockQty.toLocaleString('en-IN')} <span className="text-xs font-normal text-muted-foreground">units</span>
                  </p>
                </Card>

                <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Total Cost Value</span>
                  <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                    {currencySymbol}{inventoryStats.totalPurchaseVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                </Card>

                <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Total Retail Value</span>
                  <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                    {currencySymbol}{inventoryStats.totalSalesVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                </Card>

                <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1 col-span-2 lg:col-span-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Expected Profit</span>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {currencySymbol}{inventoryStats.totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                    <span className="text-xs font-semibold text-muted-foreground">
                      ({inventoryStats.profitMarginPercent.toFixed(1)}%)
                    </span>
                  </div>
                </Card>
              </div>

          {/* GST Tax Bracket Inventory Summary (Collapsible) */}
          <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
            <button
              onClick={() => setShowInventoryTaxBreakdown(!showInventoryTaxBreakdown)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors text-xs font-bold text-foreground"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                <span>GST Tax Bracket Stock Summary ({inventoryTaxBrackets.length} Brackets Active)</span>
              </div>
              <span className="text-[11px] text-primary hover:underline font-bold">
                {showInventoryTaxBreakdown ? "Hide Summary ▲" : "Show Summary ▼"}
              </span>
            </button>

            {showInventoryTaxBreakdown && (
              <div className="p-4 border-t border-border/60 bg-muted/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                {inventoryTaxBrackets.length === 0 ? (
                  <p className="text-xs text-muted-foreground col-span-full py-2">No products with tax rates found.</p>
                ) : (
                  inventoryTaxBrackets.map((bracket) => (
                    <div key={bracket.rate} className="p-3.5 bg-card border border-border/60 rounded-xl space-y-1.5 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">GST {bracket.rate}%</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{bracket.itemsCount} items</span>
                      </div>
                      <div className="space-y-1 pt-1 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Taxable Cost:</span>
                          <span className="font-semibold text-foreground">{currencySymbol}{bracket.taxableValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>GST Amount:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{currencySymbol}{bracket.taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between border-t border-border/60 pt-1.5 mt-1 font-bold text-xs">
                          <span>Total Asset:</span>
                          <span className="text-primary font-black">{currencySymbol}{bracket.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>

          {/* Interactive Filters Bar */}
          <Card className="p-4 sm:p-5 rounded-2xl border border-border/70 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Search Catalog</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, SKU, HSN..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="pl-9 h-10 text-xs rounded-xl bg-background border-border/70 font-medium"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</Label>
                <Select value={inventoryCategoryFilter} onValueChange={setInventoryCategoryFilter}>
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-background border-border/70 font-semibold">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl">
                    <SelectItem value="all">All Categories</SelectItem>
                    {inventoryCategories.map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Item Type</Label>
                <Select value={inventoryTypeFilter} onValueChange={setInventoryTypeFilter}>
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-background border-border/70 font-semibold">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="product">Products Only</SelectItem>
                    <SelectItem value="service">Services Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Stock Level Status</Label>
                <Select value={inventoryStockFilter} onValueChange={setInventoryStockFilter}>
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-background border-border/70 font-semibold">
                    <SelectValue placeholder="All Stock Levels" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl">
                    <SelectItem value="all">All Stock Levels</SelectItem>
                    <SelectItem value="in_stock">In Stock (&gt; 5)</SelectItem>
                    <SelectItem value="low_stock">Low Stock (1 to 5)</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock (0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Category Badges */}
            {inventoryCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50">
                <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1.5">Categories:</span>
                <button
                  onClick={() => setInventoryCategoryFilter("all")}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all ${
                    inventoryCategoryFilter === "all"
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  All ({catalogProducts.length})
                </button>
                {inventoryCategories.map(cat => {
                  const count = catalogProducts.filter(p => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setInventoryCategoryFilter(inventoryCategoryFilter === cat ? "all" : cat)}
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize transition-all ${
                        inventoryCategoryFilter === cat
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Full Standard Inventory Table */}
          <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
                  <tr>
                    <th className="px-3 py-3 w-10 text-center">#</th>
                    <th onClick={() => handleInventorySort('name')} className="px-4 py-3 min-w-[180px] cursor-pointer hover:bg-muted/80 transition-colors">
                      <div className="flex items-center gap-1">
                        Item Description
                        <ArrowUpDown className="w-3 h-3 text-primary" />
                      </div>
                    </th>
                    <th className="px-3 py-3 text-center">Unit</th>
                    <th className="px-3 py-3 text-center">GST %</th>
                    <th className="px-3 py-3 text-right">Cost Rate</th>
                    <th className="px-3 py-3 text-right">Sale Price</th>
                    <th onClick={() => handleInventorySort('stock')} className="px-4 py-3 text-center cursor-pointer hover:bg-muted/80 transition-colors">
                      <div className="flex items-center justify-center gap-1">
                        Stock
                        <ArrowUpDown className="w-3 h-3 text-primary" />
                      </div>
                    </th>
                    <th onClick={() => handleInventorySort('cost')} className="px-4 py-3 text-right cursor-pointer hover:bg-muted/80 transition-colors">
                      <div className="flex items-center justify-end gap-1">
                        Cost Valuation
                        <ArrowUpDown className="w-3 h-3 text-primary" />
                      </div>
                    </th>
                    <th onClick={() => handleInventorySort('sale')} className="px-4 py-3 text-right cursor-pointer hover:bg-muted/80 transition-colors">
                      <div className="flex items-center justify-end gap-1">
                        Sale Valuation
                        <ArrowUpDown className="w-3 h-3 text-primary" />
                      </div>
                    </th>
                    <th onClick={() => handleInventorySort('profit')} className="px-4 py-3 text-right cursor-pointer hover:bg-muted/80 transition-colors">
                      <div className="flex items-center justify-end gap-1">
                        Est. Profit
                        <ArrowUpDown className="w-3 h-3 text-primary" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredAndSortedInventoryProducts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-muted-foreground font-semibold">
                        No inventory products match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedInventoryProducts.map((p, idx) => {
                      const stock = p.type === 'service' ? 0 : Number(p.opening_stock || 0);
                      const costVal = stock * Number(p.purchase_price || 0);
                      const saleVal = stock * p.price;
                      const profit = saleVal - costVal;
                      const margin = p.price > 0 ? ((p.price - Number(p.purchase_price || 0)) / p.price) * 100 : 0;

                      return (
                        <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-3 py-3 text-center font-bold text-muted-foreground tabular-nums">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-foreground leading-tight">{p.name}</div>
                            <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                              <span className="text-[9px] bg-muted text-muted-foreground capitalize px-1.5 py-0.2 rounded font-semibold">
                                {p.type || 'product'}
                              </span>
                              {p.sku && (
                                <span className="text-[9px] text-muted-foreground font-mono">
                                  SKU: {p.sku}
                                </span>
                              )}
                              {p.hsn_code && (
                                <span className="text-[9px] text-muted-foreground font-mono">
                                  HSN: {p.hsn_code}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center text-muted-foreground font-medium capitalize">
                            {p.type === 'service' ? '—' : (p.unit || 'pcs')}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-foreground tabular-nums">
                            {p.tax_rate}%
                          </td>
                          <td className="px-3 py-3 text-right font-medium text-muted-foreground tabular-nums">
                            {currencySymbol}{(p.purchase_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-foreground tabular-nums">
                            {currencySymbol}{p.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {p.type === 'service' ? (
                              <span className="text-muted-foreground font-semibold text-[10px]">Service</span>
                            ) : stock <= 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                                Out of Stock (0)
                              </span>
                            ) : stock <= 5 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                                Low Stock ({stock})
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                                {stock} {p.unit || 'pcs'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground tabular-nums">
                            {p.type === 'service' ? '—' : `${currencySymbol}${costVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground tabular-nums">
                            {p.type === 'service' ? '—' : `${currencySymbol}${saleVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {p.type === 'service' ? (
                              <span className="text-muted-foreground font-medium text-[10px]">—</span>
                            ) : (
                              <div>
                                <span className={`font-bold tabular-nums ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
                                  {currencySymbol}{profit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </span>
                                <span className="block text-[9px] text-muted-foreground font-semibold">
                                  {margin.toFixed(1)}% margin
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Summary Total Row */}
                  {filteredAndSortedInventoryProducts.length > 0 && (
                    <tr className="bg-muted/60 font-bold border-t-2 border-border/80 text-foreground">
                      <td colSpan={2} className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Total</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">—</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">—</td>
                      <td className="px-3 py-3 text-right text-muted-foreground">—</td>
                      <td className="px-3 py-3 text-right text-muted-foreground">—</td>
                      <td className="px-4 py-3 text-center text-xs font-bold tabular-nums">
                        {inventoryStats.totalStockQty.toLocaleString('en-IN')} units
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold tabular-nums">
                        {currencySymbol}{inventoryStats.totalPurchaseVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold tabular-nums">
                        {currencySymbol}{inventoryStats.totalSalesVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {currencySymbol}{inventoryStats.totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

          {/* Items Profit & Performance Sub-View */}
          {productReportSubTab === 'profit' && (
            <div className="space-y-6">
              {/* 5 Clean Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Products Sold</span>
                  <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                    {itemProfitStats.totalItems.toLocaleString('en-IN')}
                  </p>
                </Card>

                <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Quantity Sold</span>
                  <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                    {itemProfitStats.totalUnitsSold.toLocaleString('en-IN')} <span className="text-xs font-normal text-muted-foreground">units</span>
                  </p>
                </Card>

                <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Sales Revenue</span>
                  <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                    {currencySymbol}{itemProfitStats.totalSalesVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                </Card>

                <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Purchase Cost (COGS)</span>
                  <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                    {currencySymbol}{itemProfitStats.totalCostVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                </Card>

                <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1 col-span-2 lg:col-span-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Net Profit</span>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-xl sm:text-2xl font-bold tabular-nums ${
                      itemProfitStats.totalProfitVal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"
                    }`}>
                      {currencySymbol}{itemProfitStats.totalProfitVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                    <span className="text-xs font-semibold text-muted-foreground">
                      ({itemProfitStats.avgMargin.toFixed(1)}%)
                    </span>
                  </div>
                </Card>
              </div>

              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={itemSearchTerm}
                    onChange={(e) => setItemSearchTerm(e.target.value)}
                    placeholder="Search product name, SKU, HSN..."
                    className="pl-9 h-10 text-xs rounded-xl bg-card border-border/70 font-medium"
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {filteredAndSortedItems.length} products
                </span>
              </div>

              {/* Full Sortable Items Profit Table */}
              <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
                {filteredAndSortedItems && filteredAndSortedItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-muted/70 border-b border-border/70 text-muted-foreground uppercase text-[10px] font-black tracking-wider">
                        <tr>
                          <th onClick={() => handleItemSort('name')} className="px-4 py-3.5 text-left cursor-pointer select-none hover:bg-muted transition-colors rounded-tl-xl">
                            <div className="flex items-center gap-1">
                              Item Name
                              <span className="text-[10px] text-primary">
                                {itemSortField === 'name' ? (itemSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                              </span>
                            </div>
                          </th>
                          <th className="px-4 py-3.5 text-center">SKU / HSN</th>
                          <th onClick={() => handleItemSort('quantity')} className="px-4 py-3.5 text-right cursor-pointer select-none hover:bg-muted transition-colors">
                            <div className="flex items-center justify-end gap-1">
                              Qty Sold
                              <span className="text-[10px] text-primary">
                                {itemSortField === 'quantity' ? (itemSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                              </span>
                            </div>
                          </th>
                          <th onClick={() => handleItemSort('sales')} className="px-4 py-3.5 text-right cursor-pointer select-none hover:bg-muted transition-colors">
                            <div className="flex items-center justify-end gap-1">
                              Revenue (Sales)
                              <span className="text-[10px] text-primary">
                                {itemSortField === 'sales' ? (itemSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                              </span>
                            </div>
                          </th>
                          <th onClick={() => handleItemSort('cost')} className="px-4 py-3.5 text-right cursor-pointer select-none hover:bg-muted transition-colors">
                            <div className="flex items-center justify-end gap-1">
                              Purchase Cost
                              <span className="text-[10px] text-primary">
                                {itemSortField === 'cost' ? (itemSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                              </span>
                            </div>
                          </th>
                          <th onClick={() => handleItemSort('profit')} className="px-4 py-3.5 text-right cursor-pointer select-none hover:bg-muted transition-colors">
                            <div className="flex items-center justify-end gap-1">
                              Net Profit
                              <span className="text-[10px] text-primary">
                                {itemSortField === 'profit' ? (itemSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                              </span>
                            </div>
                          </th>
                          <th onClick={() => handleItemSort('margin')} className="px-4 py-3.5 text-right cursor-pointer select-none hover:bg-muted transition-colors rounded-tr-xl">
                            <div className="flex items-center justify-end gap-1">
                              Margin %
                              <span className="text-[10px] text-primary">
                                {itemSortField === 'margin' ? (itemSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                              </span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {filteredAndSortedItems.map((item, index) => (
                          <tr key={index} className="hover:bg-muted/40 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-bold text-foreground">{item.name}</div>
                            </td>
                            <td className="px-4 py-3 text-center text-[11px] text-muted-foreground font-mono">
                              <div>{item.sku || '—'}</div>
                              {item.hsn && <div className="text-[10px] opacity-75">HSN: {item.hsn}</div>}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-foreground tabular-nums">
                              {item.quantitySold}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-foreground tabular-nums">
                              {currencySymbol}{item.totalSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-muted-foreground tabular-nums">
                              {currencySymbol}{item.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              <span className={`font-bold ${item.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
                                {currencySymbol}{item.netProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                item.margin >= 20 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50' :
                                item.margin >= 5 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50' :
                                'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                              }`}>
                                {item.margin.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}

                        {/* Summary Total Row */}
                        <tr className="bg-muted/60 font-bold border-t-2 border-border/80 text-foreground">
                          <td className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Total</td>
                          <td className="px-4 py-3 text-center text-muted-foreground">—</td>
                          <td className="px-4 py-3 text-right text-xs font-bold tabular-nums">
                            {filteredItemTotals.units.toLocaleString('en-IN')} units
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold tabular-nums">
                            {currencySymbol}{filteredItemTotals.sales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold tabular-nums text-muted-foreground">
                            {currencySymbol}{filteredItemTotals.cost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                            {currencySymbol}{filteredItemTotals.profit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold tabular-nums">
                            <span className="text-primary font-bold">
                              {filteredItemTotals.sales > 0 ? ((filteredItemTotals.profit / filteredItemTotals.sales) * 100).toFixed(1) : '0.0'}%
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-16 text-center text-muted-foreground space-y-2">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-40 text-primary" />
                    <p className="font-semibold text-foreground">No item performance data available</p>
                    <p className="text-xs max-w-sm mx-auto">
                      Item sales and profit margins are automatically tracked from invoices and purchase receipts in the selected date range.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}
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

