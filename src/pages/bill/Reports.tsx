import { useState, useEffect, useMemo, useCallback, memo } from 'react';
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
  IndianRupee
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Invoice, Expense, Client } from "@/types/invoice";

interface ReportInvoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  clients: { id: string, name: string } | null;
  invoice_items?: {
    id: string;
    product_id: string | null;
    description: string;
    quantity: number;
    rate: number;
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
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, ComposedChart } from "recharts";
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

  // Item Reports State
  const [itemsReports, setItemsReports] = useState<ItemReportData[]>([]);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [debouncedItemSearch, setDebouncedItemSearch] = useState("");
  const [itemSortField, setItemSortField] = useState<'name' | 'quantity' | 'sales' | 'cost' | 'profit' | 'margin'>('sales');
  const [itemSortDirection, setItemSortDirection] = useState<'asc' | 'desc'>('desc');

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


  const { user } = useAuth();
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();

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
    if (!user) return;
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const startISO = start.toISOString();
      const endISO = end.toISOString();
      const startDateOnly = startISO.split('T')[0];
      const endDateOnly = endISO.split('T')[0];

      // Parallel fetch all required data
      const [invoicesRes, expensesRes, clientsCountRes] = await Promise.all([
        supabase
          .from('invoices')
          .select(`
            id, 
            invoice_number, 
            total_amount, 
            status, 
            created_at,
            clients (id, name),
            invoice_items (
              id,
              product_id,
              description,
              quantity,
              rate,
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
          .gte('created_at', startISO)
          .lte('created_at', endISO)
          .order('created_at', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .gte('expense_date', startDateOnly)
          .lte('expense_date', endDateOnly)
          .order('expense_date', { ascending: false }),
        supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
      ]);

      if (invoicesRes.error) throw invoicesRes.error;
      if (expensesRes.error) throw expensesRes.error;

      const invoices = (invoicesRes.data as unknown) as ReportInvoice[];
      const expenses = (expensesRes.data as unknown) as Expense[];
      const clientsCount = clientsCountRes.count || 0;

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

    } catch (error) {
      console.error('Error fetching reports data:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load reports data." });
    } finally {
      setLoading(false);
    }
  }, [user, getDateRange, dateRange, toast]);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

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


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Comprehensive business insights and performance metrics</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={fetchReportsData} size="sm" className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="p-4 md:p-6 bg-card dark:bg-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
          <div className="sm:col-span-2 lg:col-span-1">
            <Label className="text-sm">Date Range</Label>
            <Select value={dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                <SelectItem value="last_12_months">Last 12 Months</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Start Date</Label>
            <Input
              type="date"
              value={tempStartDate}
              onChange={(e) => setTempStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm">End Date</Label>
            <Input
              type="date"
              value={tempEndDate}
              onChange={(e) => setTempEndDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
            <Button variant="outline" onClick={() => {
              setStartDate(tempStartDate);
              setEndDate(tempEndDate);
            }} size="sm" className="flex-1">
              <Filter className="w-4 h-4" />
              <span className="ml-2">Apply</span>
            </Button>
            <Button variant="ghost" onClick={handleResetFilters} size="sm" className="flex-1 text-muted-foreground hover:text-foreground">
              <RotateCcw className="w-4 h-4" />
              <span className="ml-2">Reset</span>
            </Button>
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
          <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs md:text-sm">Invoices</TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs md:text-sm">Expenses</TabsTrigger>
          <TabsTrigger value="financial" className="text-xs md:text-sm">Financial</TabsTrigger>
          <TabsTrigger value="clients" className="text-xs md:text-sm">Clients</TabsTrigger>
          <TabsTrigger value="items" className="text-xs md:text-sm">Items Profit</TabsTrigger>
        </TabsList>

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
            <Card className="p-4 md:p-6 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/5 cursor-default">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground text-xs md:text-sm font-medium">Total Revenue</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground truncate mt-1">{currencySymbol}{stats.totalRevenue.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    {revenueGrowth >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-success mr-1 flex-shrink-0" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-danger mr-1 flex-shrink-0" />
                    )}
                    <span className={`text-[10px] sm:text-xs md:text-sm font-semibold ${revenueGrowth >= 0 ? 'text-success' : 'text-danger'}`}>
                      {Math.abs(revenueGrowth).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 hover:border-blue-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/5 cursor-default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium">Net Profit</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{currencySymbol}{stats.netProfit.toLocaleString()}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/5 cursor-default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium">Outstanding</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{currencySymbol}{stats.pendingAmount.toLocaleString()}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/20 hover:border-rose-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-rose-500/5 cursor-default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium">Expenses</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{currencySymbol}{stats.totalExpenses.toLocaleString()}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-4 md:p-6 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/20 hover:border-rose-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-rose-500/5 cursor-default">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Total Expenses</p>
                  <p className="text-2xl font-bold mt-1">{currencySymbol} {stats.totalExpenses.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 hover:border-blue-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/5 cursor-default">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Top Category</p>
                  <p className="text-2xl font-bold truncate mt-1">
                    {categoryData.length > 0 ? categoryData[0].name : 'N/A'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/5 cursor-default">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Expense Items</p>
                  <p className="text-2xl font-bold mt-1">{expensesList.length}</p>
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

        <TabsContent value="items" className="space-y-6">
          {/* Export Buttons */}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={exportItemsPDF} size="sm" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={exportItemsExcel} size="sm" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>

          <Card className="p-4 sm:p-6 bg-card dark:bg-card shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Item Performance & Profit Report</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{filteredAndSortedItems.length} items sold</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={itemSearchTerm}
                  onChange={(e) => setItemSearchTerm(e.target.value)}
                  placeholder="Search item name, SKU, HSN..."
                  className="pl-9 h-10 bg-background"
                />
              </div>
            </div>

            {filteredAndSortedItems && filteredAndSortedItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th onClick={() => handleItemSort('name')} className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted transition-colors rounded-tl-lg">
                        <div className="flex items-center gap-1">
                          Item Name
                          <span className="text-[10px] text-primary">
                            {itemSortField === 'name' ? (itemSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                          </span>
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-muted-foreground">SKU / HSN</th>
                      <th onClick={() => handleItemSort('quantity')} className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted transition-colors">
                        <div className="flex items-center justify-end gap-1">
                          Qty Sold
                          <span className="text-[10px] text-primary">
                            {itemSortField === 'quantity' ? (itemSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                          </span>
                        </div>
                      </th>
                      <th onClick={() => handleItemSort('sales')} className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted transition-colors">
                        <div className="flex items-center justify-end gap-1">
                          Revenue (Sales)
                          <span className="text-[10px] text-primary">
                            {itemSortField === 'sales' ? (itemSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                          </span>
                        </div>
                      </th>
                      <th onClick={() => handleItemSort('cost')} className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted transition-colors">
                        <div className="flex items-center justify-end gap-1">
                          Purchase Cost
                          <span className="text-[10px] text-primary">
                            {itemSortField === 'cost' ? (itemSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                          </span>
                        </div>
                      </th>
                      <th onClick={() => handleItemSort('profit')} className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted transition-colors">
                        <div className="flex items-center justify-end gap-1">
                          Net Profit
                          <span className="text-[10px] text-primary">
                            {itemSortField === 'profit' ? (itemSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                          </span>
                        </div>
                      </th>
                      <th onClick={() => handleItemSort('margin')} className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted transition-colors rounded-tr-lg">
                        <div className="flex items-center justify-end gap-1">
                          Margin %
                          <span className="text-[10px] text-primary">
                            {itemSortField === 'margin' ? (itemSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                          </span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAndSortedItems.map((item, index) => {
                      return (
                        <tr key={index} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground">{item.name}</div>
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                            <div>SKU: {item.sku}</div>
                            <div>HSN: {item.hsn}</div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{item.quantitySold}</td>
                          <td className="px-4 py-3 text-right font-bold text-foreground">{currencySymbol}{item.totalSales.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{currencySymbol}{item.totalCost.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={item.netProfit >= 0 ? "text-success font-bold" : "text-danger font-bold"}>
                              {currencySymbol}{item.netProfit.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.margin >= 20 ? 'bg-success-light text-success' :
                              item.margin >= 5 ? 'bg-warning-light text-warning' :
                                'bg-danger-light text-danger'
                              }`}>
                              {item.margin.toFixed(1)}%
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
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No item performance data available</p>
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
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No invoices found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
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

