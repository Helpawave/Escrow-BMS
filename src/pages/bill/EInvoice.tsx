import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";
import { SuccessModal } from "@/components/SuccessModal";
import { Check, ChevronsUpDown, CalendarIcon, FileText, Truck, Plus, Trash2, Download, History, Eye, Package, Search, Minus, ShieldAlert, ArrowRight, Scan, Tag, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { generateEInvoicePDF, generateEWayBillPDF } from "@/utils/eInvoicePDF";
import { EInvoiceTemplate } from "@/components/EInvoiceTemplate";
import { EWayBillTemplate } from "@/components/EWayBillTemplate";
import { ResponsiveInvoiceWrapper } from "@/components/ResponsiveInvoiceWrapper";
import { format } from "date-fns";
import { type HSNCode } from '@/types/hsn';

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface InvoiceItemRaw {
  description?: string;
  name?: string;
  hsn_code?: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  price?: number;
  tax_rate?: number;
  products?: {
    unit?: string;
    hsn_code?: string;
  };
}

interface PartialInvoice {
  id: string;
  invoice_number: string;
  client_id: string;
  total_amount: number;
  issue_date: string;
  invoice_items?: InvoiceItemRaw[];
}

interface Client {
  id: string;
  name: string;
  email: string;
  gstin: string;
  address: string;
  state: string;
  postal_code: string;
  hide_contact_details?: boolean;
}

interface EInvoiceItem {
  id: string;
  product_id?: string;
  description: string;
  hsn_code: string;
  quantity: number;
  unit: string;
  rate: number;
  tax_rate: number;
  amount: number;
}

interface EWayBillItem {
  id: string;
  product_id?: string;
  product_name: string;
  hsn_code: string;
  quantity: number;
  unit: string;
  value: number;
}

interface Profile {
  user_id: string;
  company_name: string;
  email?: string;
  phone: string;
  mobile: string;
  business_address: string;
  gstin: string;
  logo_url?: string;
  website?: string;
  signature_url?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  account_type?: string;
}

interface EInvoiceHistoryItem {
  id: string;
  client_id: string;
  invoice_type: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  status: string;
  place_of_supply: string;
  reverse_charge: string;
  notes?: string;
  subtotal: number;
  tax_amount: number;
  items: EInvoiceItem[];
  template?: InvoiceTemplateType;
  irn?: string;
  ack_no?: string;
  ack_date?: string;
}

interface EWayBillHistoryItem {
  id: string;
  client_id: string;
  document_type: string;
  document_number: string;
  document_date: string;
  total_value: number;
  status: string;
  transport_mode: string;
  vehicle_number?: string;
  distance?: string;
  transporter_name?: string;
  from_gstin?: string;
  to_gstin?: string;
  from_address?: string;
  to_address?: string;
  transaction_type: string;
  items: EWayBillItem[];
  template?: InvoiceTemplateType;
  eway_bill_no?: string;
  valid_until?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  tax_rate: number;
  opening_stock: string;
  unit: string;
  category?: string;
  purchase_price?: number;
  discount?: number;
  hsn_code?: string;
}



const UNIT_OPTIONS = [
  { label: "Numbers (NOS)", value: "NOS" },
  { label: "Pieces (PCS)", value: "PCS" },
  { label: "Kilograms (KGS)", value: "KGS" },
  { label: "Litres (LTR)", value: "LTR" },
  { label: "Meters (MTR)", value: "MTR" },
  { label: "Box (BOX)", value: "BOX" },
  { label: "Service", value: "SERVICE" },
  { label: "Others (OTH)", value: "OTH" },
];

const TEMPLATE_OPTIONS = [
  { label: "Official GST", value: "official" },
  { label: "Professional", value: "professional" },
  { label: "Elegant", value: "elegant" },
  { label: "Minimal", value: "minimal" },
  { label: "Modern", value: "modern" },
  { label: "Corporate", value: "corporate" },
] as const;

type InvoiceTemplateType = typeof TEMPLATE_OPTIONS[number]['value'];

const mapProductUnitToInvoiceUnit = (unit: string | undefined): string => {
  if (!unit) return "NOS";
  const u = unit.toLowerCase();
  if (u === "pcs" || u === "pieces") return "PCS";
  if (u === "kg" || u === "kilogram" || u === "kgs") return "KGS";
  if (u === "ltr" || u === "litre" || u === "litres") return "LTR";
  if (u === "mtr" || u === "meter" || u === "meters") return "MTR";
  if (u === "box") return "BOX";
  if (u === "service") return "SERVICE";
  return "NOS";
};

const EInvoicePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("einvoice");
  const [historyTab, setHistoryTab] = useState("einvoice-history");

  // History data
  const [eInvoiceHistory, setEInvoiceHistory] = useState<EInvoiceHistoryItem[]>([]);
  const [eWayBillHistory, setEWayBillHistory] = useState<EWayBillHistoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;
    setHistoryLoading(true);
    try {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      if (historyTab === 'einvoice-history') {
        const { data, error, count } = await supabase
          .from('e_invoices')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        setEInvoiceHistory((data || []) as unknown as EInvoiceHistoryItem[]);
        if (count !== null) setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
      } else {
        const { data, error, count } = await supabase
          .from('e_way_bills')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        setEWayBillHistory((data || []) as unknown as EWayBillHistoryItem[]);
        if (count !== null) setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch history" });
    } finally {
      setHistoryLoading(false);
    }
  }, [user?.id, currentPage, historyTab, toast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [historyTab]);

  // E-Invoice State
  const [eInvoiceData, setEInvoiceData] = useState({
    client_id: "",
    invoice_type: "Tax Invoice",
    invoice_number: "",
    invoice_date: new Date().toISOString().split('T')[0],
    place_of_supply: "",
    reverse_charge: "No",
    notes: "",
    template: "official" as InvoiceTemplateType,
    irn: "",
    ack_no: "",
    ack_date: new Date().toISOString().split('T')[0]
  });
  const [eInvoiceItems, setEInvoiceItems] = useState<EInvoiceItem[]>([
    { id: "1", description: "", hsn_code: "", quantity: 1, unit: "NOS", rate: 0, tax_rate: 18, amount: 0 }
  ]);

  // E-Way Bill State
  const [eWayBillData, setEWayBillData] = useState({
    client_id: "",
    document_type: "Tax Invoice",
    document_number: "",
    document_date: new Date().toISOString().split('T')[0],
    from_gstin: "",
    to_gstin: "",
    transaction_type: "Regular",
    sub_supply_type: "Supply",
    from_address: "",
    to_address: "",
    from_state: "",
    to_state: "",
    from_pincode: "",
    to_pincode: "",
    vehicle_number: "",
    transport_mode: "Road",
    distance: "",
    transporter_name: "",
    transporter_id: "",
    template: "official" as InvoiceTemplateType,
    eway_bill_no: "",
    valid_until: "",
    irn: "",
    ack_no: "",
    ack_date: new Date().toISOString().split('T')[0]
  });
  const [eWayBillItems, setEWayBillItems] = useState<EWayBillItem[]>([
    { id: "1", product_name: "", hsn_code: "", quantity: 1, unit: "NOS", value: 0 }
  ]);

  // Product Selection Modal State
  const [productSelectionOpen, setProductSelectionOpen] = useState(false);
  const [modalSource, setModalSource] = useState<'einvoice' | 'ewaybill'>('einvoice');
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productCategory, setProductCategory] = useState("all");
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [viewHistoryItem, setViewHistoryItem] = useState<EInvoiceHistoryItem | EWayBillHistoryItem | null>(null);
  const [viewHistoryType, setViewHistoryType] = useState<'einvoice' | 'ewaybill' | null>(null);
  const [isViewHistoryOpen, setIsViewHistoryOpen] = useState(false);

  // New Product Modal State
  const [newProductDialogOpen, setNewProductDialogOpen] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [newProductFormData, setNewProductFormData] = useState({
    name: '', type: 'product' as const, category: 'general', sales_price: '',
    price_with_tax: true, tax_rate: '18', unit: 'pcs',
    opening_stock: '', description: '',
    purchase_price: '', sku: '', discount: '',
    hsn_code: '', barcode: '', alternative_unit: '',
    as_of_date: new Date().toISOString().split('T')[0], low_stock_warning: false
  });

  // HSN Lookup State
  const [showHSNDialog, setShowHSNDialog] = useState(false);
  const [hsnSearchQuery, setHsnSearchQuery] = useState("");
  const [hsnCodesData, setHsnCodesData] = useState<HSNCode[]>([]);

  // Success Feedback State
  const [showSuccess, setShowSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: "", message: "" });

  // Invoice Search State
  const [invoices, setInvoices] = useState<PartialInvoice[]>([]);
  const [invoiceSearchOpen, setInvoiceSearchOpen] = useState(false);
  const [ewayBillSearchOpen, setEwayBillSearchOpen] = useState(false);

  const { currencySymbol } = useCurrency();


  const fetchInitialData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [clientsRes, profileRes, productsRes, invoicesRes] = await Promise.all([
        supabase.from('clients').select('id, name, email, gstin, address, state, postal_code, hide_contact_details').eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('products').select('id, name, sku, price, tax_rate, opening_stock, unit, hsn_code').eq('user_id', user.id).order('name'),
        supabase.from('invoices').select(`
          id, invoice_number, client_id, total_amount, issue_date, 
          invoice_items (description, quantity, rate, tax_rate, products (unit, hsn_code))
        `).eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setClients((clientsRes.data as any) || []);
      setProfile(profileRes.data as unknown as Profile);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setProducts((productsRes.data as any) || []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setInvoices((invoicesRes.data as any) || [] as any);
    } catch (error) {
      console.error('Error fetching initial e-invoice data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user, fetchInitialData]);

  const handleInvoiceSelect = (invoiceId: string, target: 'einvoice' | 'ewaybill') => {
    const selected = invoices.find(inv => inv.id === invoiceId);
    if (!selected) return;

    if (target === 'einvoice') {
      setEInvoiceData({
        ...eInvoiceData,
        invoice_number: selected.invoice_number,
        client_id: selected.client_id,
        invoice_date: selected.issue_date
      });
      setInvoiceSearchOpen(false);

      if (selected.invoice_items && Array.isArray(selected.invoice_items)) {
        const mappedItems = (selected.invoice_items as InvoiceItemRaw[]).map((item) => ({
          id: Math.random().toString(36).substr(2, 9),
          description: item.description || "",
          hsn_code: item.hsn_code || item.products?.hsn_code || "",
          quantity: item.quantity || 1,
          unit: mapProductUnitToInvoiceUnit(item.unit || item.products?.unit),
          rate: item.rate || item.price || 0,
          tax_rate: item.tax_rate !== undefined && item.tax_rate !== null ? item.tax_rate : 18,
          amount: (item.quantity || 1) * (item.rate || item.price || 0)
        }));
        setEInvoiceItems(mappedItems);
      }
    } else {
      setEWayBillData({
        ...eWayBillData,
        document_number: selected.invoice_number,
        client_id: selected.client_id,
        document_date: selected.issue_date
      });
      setEwayBillSearchOpen(false);

      if (selected.invoice_items && Array.isArray(selected.invoice_items)) {
        const mappedItems = (selected.invoice_items as InvoiceItemRaw[]).map((item) => ({
          id: Math.random().toString(36).substr(2, 9),
          product_name: item.description || "",
          hsn_code: item.hsn_code || item.products?.hsn_code || "",
          quantity: item.quantity || 1,
          unit: mapProductUnitToInvoiceUnit(item.unit || item.products?.unit),
          value: (item.quantity || 1) * (item.rate || item.price || 0)
        }));
        setEWayBillItems(mappedItems);
      }
    }
    
    toast({ title: "Success", description: `Loaded details from invoice ${selected.invoice_number}` });
  };

  useEffect(() => {
    if (user && activeTab === "history") {
      fetchHistory();
    }
  }, [user, activeTab, fetchHistory]);

  // Dynamically import HSN codes only when search is opened to reduce initial bundle size
  useEffect(() => {
    if (showHSNDialog && hsnCodesData.length === 0) {
      import('@/data/hsnCodes.json').then(module => {
        setHsnCodesData(module.default);
      }).catch(err => {
        console.error('Failed to load HSN codes:', err);
      });
    }
  }, [showHSNDialog, hsnCodesData.length]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductFormData.name || !newProductFormData.sales_price) {
      toast({ variant: "destructive", title: "Error", description: "Please enter product name and price." });
      return;
    }

    setCreatingProduct(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: newProductFormData.name,
          price: Number(newProductFormData.sales_price),
          discount: Number(newProductFormData.discount) || 0,
          tax_rate: Number(newProductFormData.tax_rate),
          unit: newProductFormData.unit,
          category: newProductFormData.category || 'general',
          type: newProductFormData.type,
          description: newProductFormData.description,
          opening_stock: newProductFormData.opening_stock,
          purchase_price: Number(newProductFormData.purchase_price) || 0,
          sku: newProductFormData.sku,
          hsn_code: newProductFormData.hsn_code,
          user_id: user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      setSuccessInfo({
        title: "Product Added",
        message: "The product has been successfully added to your catalog."
      });
      setShowSuccess(true);

      // Update products list
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newProduct = data as any;
      setProducts(prev => [...prev, newProduct].sort((a, b) => a.name.localeCompare(b.name)));

      // Reset and close
      setNewProductFormData({
        name: '', type: 'product', category: 'general', sales_price: '',
        price_with_tax: true, tax_rate: '18', unit: 'pcs',
        opening_stock: '', description: '',
        purchase_price: '', sku: '', discount: '',
        hsn_code: '', barcode: '', alternative_unit: '',
        as_of_date: new Date().toISOString().split('T')[0], low_stock_warning: false
      });
      setNewProductDialogOpen(false);
    } catch (error) {
      console.error('Error creating product:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to create product." });
    } finally {
      setCreatingProduct(false);
    }
  };

  // E-Invoice Functions
  const addEInvoiceItem = () => {
    const newItem: EInvoiceItem = {
      id: Date.now().toString(),
      description: "",
      hsn_code: "",
      quantity: 1,
      unit: "NOS",
      rate: 0,
      tax_rate: 18,
      amount: 0
    };
    setEInvoiceItems([...eInvoiceItems, newItem]);
  };

  const removeEInvoiceItem = (id: string) => {
    if (eInvoiceItems.length > 1) {
      setEInvoiceItems(eInvoiceItems.filter(item => item.id !== id));
    }
  };

  const updateEInvoiceItem = (id: string, field: keyof EInvoiceItem, value: string | number) => {
    setEInvoiceItems(items => items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value } as EInvoiceItem;
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateEInvoiceTotals = () => {
    const subtotal = eInvoiceItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = eInvoiceItems.reduce((sum, item) => sum + (item.amount * item.tax_rate / 100), 0);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  // E-Way Bill Functions
  const addEWayBillItem = () => {
    const newItem: EWayBillItem = {
      id: Date.now().toString(),
      product_name: "",
      hsn_code: "",
      quantity: 1,
      unit: "NOS",
      value: 0
    };
    setEWayBillItems([...eWayBillItems, newItem]);
  };

  const removeEWayBillItem = (id: string) => {
    if (eWayBillItems.length > 1) {
      setEWayBillItems(eWayBillItems.filter(item => item.id !== id));
    }
  };

  const updateEWayBillItem = (id: string, field: keyof EWayBillItem, value: string | number) => {
    setEWayBillItems(items => items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value } as EWayBillItem;
        // If quantity changes, and we have a product_id, we could try to infer the original rate
        // However, EWayBillItem doesn't store rate directly, only total value.
        // For simplicity, we'll just update the field. User might need to adjust 'value' manually.
        return updatedItem;
      }
      return item;
    }));
  };

  const openProductModal = (source: 'einvoice' | 'ewaybill') => {
    setModalSource(source);
    setSelectedQuantities({});
    setProductSearchQuery("");
    setProductCategory("all");
    setProductSelectionOpen(true);
  };

  const updateModalQuantity = (productId: string, delta: number) => {
    setSelectedQuantities(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const addSelectedProducts = () => {
    const selected = products.filter(p => (selectedQuantities[p.id] || 0) > 0);

    if (selected.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Please select at least one item" });
      return;
    }

    if (modalSource === 'einvoice') {
      const newItems: EInvoiceItem[] = selected.map(p => ({
        id: Math.random().toString(36).substr(2, 9),
        product_id: p.id,
        description: p.name,
        hsn_code: p.hsn_code || p.sku || "",
        quantity: selectedQuantities[p.id],
        unit: mapProductUnitToInvoiceUnit(p.unit),
        rate: p.price,
        tax_rate: p.tax_rate !== undefined && p.tax_rate !== null ? Number(p.tax_rate) : 18,
        amount: p.price * selectedQuantities[p.id]
      }));

      // If the first row is empty, replace it
      if (eInvoiceItems.length === 1 && !eInvoiceItems[0].description) {
        setEInvoiceItems(newItems);
      } else {
        setEInvoiceItems([...eInvoiceItems, ...newItems]);
      }
    } else {
      const newItems: EWayBillItem[] = selected.map(p => ({
        id: Math.random().toString(36).substr(2, 9),
        product_id: p.id,
        product_name: p.name,
        hsn_code: p.hsn_code || p.sku || "",
        quantity: selectedQuantities[p.id],
        unit: mapProductUnitToInvoiceUnit(p.unit),
        value: p.price * selectedQuantities[p.id]
      }));

      // If the first row is empty, replace it
      if (eWayBillItems.length === 1 && !eWayBillItems[0].product_name) {
        setEWayBillItems(newItems);
      } else {
        setEWayBillItems([...eWayBillItems, ...newItems]);
      }
    }

    setProductSelectionOpen(false);
    setSelectedQuantities({});
    toast({ title: "Success", description: `Successfully injected ${selected.length} items to your bill` });
  };

  const handleEInvoiceSubmit = async () => {
    try {
      const totals = calculateEInvoiceTotals();
      const selectedClient = clients.find(c => c.id === eInvoiceData.client_id);

      if (!selectedClient) {
        toast({ variant: "destructive", title: "Error", description: "Please select a client" });
        return;
      }

      // Block generation when total is {currencySymbol}0
      if (totals.total <= 0) {
        toast({ variant: "destructive", title: "Error", description: "Cannot generate E-Invoice with a total amount of {currencySymbol}0. Please add items with valid rates." });
        return;
      }
      const eInvoicePayload = {
        user_id: user?.id || "",
        client_id: eInvoiceData.client_id,
        invoice_type: eInvoiceData.invoice_type,
        invoice_number: eInvoiceData.invoice_number,
        invoice_date: eInvoiceData.invoice_date,
        place_of_supply: eInvoiceData.place_of_supply,
        reverse_charge: eInvoiceData.reverse_charge,
        notes: eInvoiceData.notes,
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        total_amount: totals.total,
        items: eInvoiceItems as unknown as Json,
        status: 'generated',
        template: eInvoiceData.template,
        irn: eInvoiceData.irn,
        ack_no: eInvoiceData.ack_no,
        ack_date: eInvoiceData.ack_date
      };

      // Save to database
      const { error } = await supabase
        .from('e_invoices')
        .insert(eInvoicePayload);

      if (error) throw error;

      // Deduct stock for E-Invoice items
      for (const item of eInvoiceItems) {
        if (item.product_id && item.quantity > 0) {
          const { data: product } = await supabase
            .from('products')
            .select('opening_stock')
            .eq('id', item.product_id)
            .single();

          if (product) {
            // @ts-expect-error: opening_stock is valid on product but inference fails
            const currentStock = parseFloat(product.opening_stock || "0");
            const newStock = currentStock - item.quantity;
            await supabase
              .from('products')
              .update({ opening_stock: newStock.toString() })
              .eq('id', item.product_id);
          }
        }
      }

      // Generate PDF
      await generateEInvoicePDF(
        {
          ...eInvoiceData,
          subtotal: totals.subtotal,
          tax_amount: totals.taxAmount,
          total_amount: totals.total
        },
        eInvoiceItems,
        selectedClient,
        profile as Profile
      );

      toast({ title: "Success", description: "E-Invoice created and downloaded successfully!" });

      // Reset form
      setEInvoiceData({
        client_id: "",
        invoice_type: "Tax Invoice",
        invoice_number: "",
        invoice_date: new Date().toISOString().split('T')[0],
        place_of_supply: "",
        reverse_charge: "No",
        notes: "",
        template: "official" as InvoiceTemplateType,
        irn: "",
        ack_no: "",
        ack_date: new Date().toISOString().split('T')[0]
      });
      setEInvoiceItems([{ id: "1", description: "", hsn_code: "", quantity: 1, unit: "NOS", rate: 0, tax_rate: 18, amount: 0 }]);
    } catch (error: unknown) {
      console.error('Error creating E-Invoice:', error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during E-Invoice generation.";
      
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: (
          <div className="mt-2 text-sm">
            <p className="font-semibold text-destructive">{errorMessage}</p>
            <div className="mt-2 p-2 bg-destructive/5 rounded border border-destructive/10 text-[10px]">
              <p className="font-bold uppercase tracking-widest opacity-70 mb-1">Troubleshooting:</p>
              <ul className="list-disc list-inside space-y-0.5 opacity-90">
                <li>Client selected: {eInvoiceData.client_id ? "Yes" : "No"}</li>
                <li>Items: {eInvoiceItems.length}</li>
                <li>Session: {user?.id ? "Active" : "Logged Out"}</li>
              </ul>
            </div>
          </div>
        )
      });
    }
  };

  const handleEWayBillSubmit = async () => {
    try {
      const totalValue = eWayBillItems.reduce((sum, item) => sum + item.value, 0);
      const selectedClient = clients.find(c => c.id === eWayBillData.client_id);

      if (!selectedClient) {
        toast({ variant: "destructive", title: "Error", description: "Please select a client" });
        return;
      }

      // Block generation when total value is {currencySymbol}0
      if (totalValue <= 0) {
        toast({ variant: "destructive", title: "Error", description: "Cannot generate E-Way Bill with a total value of {currencySymbol}0. Please add items with valid values." });
        return;
      }
      const eWayBillPayload = {
        user_id: user?.id || "",
        client_id: eWayBillData.client_id,
        document_type: eWayBillData.document_type,
        document_number: eWayBillData.document_number,
        document_date: eWayBillData.document_date,
        from_gstin: eWayBillData.from_gstin || profile?.gstin,
        to_gstin: eWayBillData.to_gstin || selectedClient.gstin,
        transaction_type: eWayBillData.transaction_type,
        sub_supply_type: eWayBillData.sub_supply_type,
        from_address: eWayBillData.from_address || profile?.business_address,
        to_address: eWayBillData.to_address || selectedClient.address,
        from_state: eWayBillData.from_state,
        to_state: eWayBillData.to_state,
        from_pincode: eWayBillData.from_pincode,
        to_pincode: eWayBillData.to_pincode,
        vehicle_number: eWayBillData.vehicle_number,
        transport_mode: eWayBillData.transport_mode,
        distance: eWayBillData.distance,
        transporter_name: eWayBillData.transporter_name,
        transporter_id: eWayBillData.transporter_id,
        total_value: totalValue,
        items: eWayBillItems as unknown as Json,
        status: 'generated',
        template: eWayBillData.template,
        eway_bill_no: eWayBillData.eway_bill_no,
        valid_until: eWayBillData.valid_until
      };

      // Save to database
      const { error } = await supabase
        .from('e_way_bills')
        .insert(eWayBillPayload);

      if (error) throw error;

      // Deduct stock for E-Way Bill items
      for (const item of eWayBillItems) {
        if (item.product_id && item.quantity > 0) {
          const { data: product } = await supabase
            .from('products')
            .select('opening_stock')
            .eq('id', item.product_id)
            .single();

          if (product) {
            // @ts-expect-error: opening_stock is valid on product but inference fails
            const currentStock = parseFloat(product.opening_stock || "0");
            const newStock = currentStock - item.quantity;
            await supabase
              .from('products')
              .update({ opening_stock: newStock.toString() })
              .eq('id', item.product_id);
          }
        }
      }

      // Generate PDF
      await generateEWayBillPDF(
        { ...eWayBillData, total_value: totalValue },
        eWayBillItems,
        selectedClient,
        profile as Profile
      );

      toast({ title: "Success", description: "E-Way Bill created and downloaded successfully!" });

      // Reset form
      setEWayBillData({
        client_id: "",
        document_type: "Tax Invoice",
        document_number: "",
        document_date: new Date().toISOString().split('T')[0],
        from_gstin: "",
        to_gstin: "",
        transaction_type: "Regular",
        sub_supply_type: "Supply",
        from_address: "",
        to_address: "",
        from_state: "",
        to_state: "",
        from_pincode: "",
        to_pincode: "",
        vehicle_number: "",
        transport_mode: "Road",
        distance: "",
        transporter_name: "",
        transporter_id: "",
        template: "official" as InvoiceTemplateType,
        eway_bill_no: "",
        valid_until: "",
        irn: "",
        ack_no: "",
        ack_date: new Date().toISOString().split('T')[0]
      });
      setEWayBillItems([{ id: "1", product_name: "", hsn_code: "", quantity: 1, unit: "NOS", value: 0 }]);
    } catch (error: unknown) {
      console.error('Error creating E-Way Bill:', error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during E-Way Bill generation.";
      
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: (
          <div className="mt-2 text-sm">
            <p className="font-semibold text-destructive">{errorMessage}</p>
            <div className="mt-2 p-2 bg-destructive/5 rounded border border-destructive/10 text-[10px]">
              <p className="font-bold uppercase tracking-widest opacity-70 mb-1">Troubleshooting:</p>
              <ul className="list-disc list-inside space-y-0.5 opacity-90">
                <li>Client selected: {eWayBillData.client_id ? "Yes" : "No"}</li>
                <li>Items: {eWayBillItems.length}</li>
                <li>Session: {user?.id ? "Active" : "Logged Out"}</li>
              </ul>
            </div>
          </div>
        )
      });
    }
  };

  const downloadHistoryPDF = async (type: 'einvoice' | 'ewaybill', item: EInvoiceHistoryItem | EWayBillHistoryItem) => {
    try {
      const clientId = item.client_id;
      const selectedClient = clients.find(c => c.id === clientId);
      if (!selectedClient) {
        toast({ variant: "destructive", title: "Error", description: "Client data not found" });
        return;
      }

      if (type === 'einvoice') {
        const einv = item as EInvoiceHistoryItem;
        await generateEInvoicePDF(
          {
            invoice_type: einv.invoice_type,
            invoice_number: einv.invoice_number,
            invoice_date: einv.invoice_date,
            place_of_supply: einv.place_of_supply,
            reverse_charge: einv.reverse_charge,
            notes: einv.notes || "",
            subtotal: einv.subtotal,
            tax_amount: einv.tax_amount,
            total_amount: einv.total_amount
          },
          einv.items as unknown as EInvoiceItem[],
          {
            name: selectedClient.name,
            email: selectedClient.email || "",
            gstin: selectedClient.gstin || "",
            address: selectedClient.address || "",
            state: selectedClient.state || "",
            postal_code: selectedClient.postal_code || "",
            hide_contact_details: selectedClient.hide_contact_details
          },
          profile!
        );
      } else {
        const ewb = item as EWayBillHistoryItem;
        await generateEWayBillPDF(
          {
            document_type: ewb.document_type,
            document_number: ewb.document_number,
            document_date: ewb.document_date,
            transaction_type: ewb.transaction_type,
            vehicle_number: ewb.vehicle_number || "",
            transport_mode: ewb.transport_mode,
            distance: ewb.distance || "",
            transporter_name: ewb.transporter_name || "",
            from_gstin: ewb.from_gstin || "",
            to_gstin: ewb.to_gstin || "",
            from_address: ewb.from_address || "",
            to_address: ewb.to_address || "",
            total_value: ewb.total_value
          },
          ewb.items as unknown as EWayBillItem[],
          {
            name: selectedClient.name,
            email: selectedClient.email || "",
            gstin: selectedClient.gstin || "",
            address: selectedClient.address || "",
            state: selectedClient.state || "",
            postal_code: selectedClient.postal_code || "",
            hide_contact_details: selectedClient.hide_contact_details
          },
          profile!
        );
      }
      toast({ title: "Success", description: "PDF generated successfully" });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile?.gstin) {
    return (
      <div className="container mx-auto p-4 md:p-6 min-h-[70vh] flex items-center justify-center">
        <Card className="max-w-md w-full p-4 md:p-8 text-center border-border/50 shadow-xl bg-card/50 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
          
          <div className="relative z-10 space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <ShieldAlert className="w-10 h-10 text-primary animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground tracking-tight">GST Information Required</h2>
              <p className="text-muted-foreground text-sm leading-relaxed px-4">
                To generate E-Invoices and E-Way Bills, you must first add your business GST details in settings.
              </p>
            </div>

            <div className="pt-2">
              <Button asChild className="w-full h-12 bg-primary hover:opacity-90 text-primary-foreground rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                <Link to="/settings?tab=business" className="flex items-center justify-center gap-2">
                  Complete Business Profile
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold">E-Invoice & E-Way Bill</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
          <TabsList className="bg-transparent h-auto p-0 flex space-x-2 border-b rounded-none mb-8">
            <TabsTrigger
              value="einvoice"
              className="px-6 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <FileText className="h-4 w-4 mr-2" />
              E-Invoice
            </TabsTrigger>
            <TabsTrigger
              value="ewaybill"
              className="px-6 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Truck className="h-4 w-4 mr-2" />
              E-Way Bill
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="px-6 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>
        </div>

        {/* E-Invoice Tab */}
        <TabsContent value="einvoice" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">E-Invoice Details</CardTitle>
              <p className="text-sm text-muted-foreground">Provide information to generate an E-Invoice</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="client">Client *</Label>
                  <Select value={eInvoiceData.client_id} onValueChange={(value) => setEInvoiceData({ ...eInvoiceData, client_id: value })}>
                    <SelectTrigger id="client" aria-label="Select client">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.gstin})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="invoice_type">Invoice Type *</Label>
                  <Select value={eInvoiceData.invoice_type} onValueChange={(value) => setEInvoiceData({ ...eInvoiceData, invoice_type: value })}>
                    <SelectTrigger id="invoice_type" aria-label="Select invoice type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tax Invoice">Tax Invoice</SelectItem>
                      <SelectItem value="Bill of Supply">Bill of Supply</SelectItem>
                      <SelectItem value="Credit Note">Credit Note</SelectItem>
                      <SelectItem value="Debit Note">Debit Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


                <div className="flex flex-col gap-2">
                  <Label htmlFor="invoice_number">Invoice Number *</Label>
                  <Popover open={invoiceSearchOpen} onOpenChange={setInvoiceSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={invoiceSearchOpen}
                        className="w-full justify-between"
                      >
                        {eInvoiceData.invoice_number ? eInvoiceData.invoice_number : "Select Invoice..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search invoice number..." />
                        <CommandList>
                          <CommandEmpty>No invoice found.</CommandEmpty>
                          <CommandGroup>
                            {invoices.map((inv) => (
                              <CommandItem
                                key={inv.id}
                                value={inv.invoice_number}
                                onSelect={() => handleInvoiceSelect(inv.id, 'einvoice')}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    eInvoiceData.invoice_number === inv.invoice_number ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{inv.invoice_number}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {inv.issue_date} - {currencySymbol}{inv.total_amount}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="invoice_date">Invoice Date *</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    value={eInvoiceData.invoice_date}
                    onChange={(e) => setEInvoiceData({ ...eInvoiceData, invoice_date: e.target.value })}
                    aria-label="Select invoice date"
                  />
                </div>

                <div>
                  <Label htmlFor="place_of_supply">Place of Supply *</Label>
                  <Input
                    id="place_of_supply"
                    value={eInvoiceData.place_of_supply}
                    onChange={(e) => setEInvoiceData({ ...eInvoiceData, place_of_supply: e.target.value })}
                    placeholder="State name"
                    aria-label="Enter place of supply"
                  />
                </div>

                <div>
                  <Label htmlFor="reverse_charge">Reverse Charge</Label>
                  <Select value={eInvoiceData.reverse_charge} onValueChange={(value) => setEInvoiceData({ ...eInvoiceData, reverse_charge: value })}>
                    <SelectTrigger id="reverse_charge" aria-label="Select reverse charge status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="Yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-full pt-4 border-t border-dashed mt-2">
                   <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4" />
                      Portal Details (Optional)
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="irn">IRN (Invoice Ref. No)</Label>
                        <Input
                          id="irn"
                          value={eInvoiceData.irn}
                          onChange={(e) => setEInvoiceData({ ...eInvoiceData, irn: e.target.value })}
                          placeholder="64-digit hash..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="ack_no">Acknowledgement No</Label>
                        <Input
                          id="ack_no"
                          value={eInvoiceData.ack_no}
                          onChange={(e) => setEInvoiceData({ ...eInvoiceData, ack_no: e.target.value })}
                          placeholder="122..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="ack_date">Acknowledgement Date</Label>
                        <Input
                          id="ack_date"
                          type="date"
                          value={eInvoiceData.ack_date}
                          onChange={(e) => setEInvoiceData({ ...eInvoiceData, ack_date: e.target.value })}
                        />
                      </div>
                   </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={eInvoiceData.notes}
                  onChange={(e) => setEInvoiceData({ ...eInvoiceData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* E-Invoice Items */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Invoice Items</CardTitle>
              <Button onClick={() => openProductModal('einvoice')} size="sm" variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Add Items
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eInvoiceItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-8 gap-2 items-end p-4 border rounded-lg">
                    <div className="md:col-span-2">
                      <Label>Description *</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateEInvoiceItem(item.id, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    <div>
                      <Label>HSN Code *</Label>
                      <Input
                        value={item.hsn_code}
                        onChange={(e) => updateEInvoiceItem(item.id, 'hsn_code', e.target.value)}
                        placeholder="HSN"
                      />
                    </div>
                    <div>
                      <Label>Qty *</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateEInvoiceItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Select value={item.unit} onValueChange={(value) => updateEInvoiceItem(item.id, 'unit', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Rate *</Label>
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateEInvoiceItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label>Tax %</Label>
                      <Input
                        type="number"
                        value={item.tax_rate}
                        onChange={(e) => updateEInvoiceItem(item.id, 'tax_rate', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Label>Amount</Label>
                        <div className="text-sm font-medium">{currencySymbol}{item.amount.toFixed(2)}</div>
                      </div>
                      {eInvoiceItems.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeEInvoiceItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span>Subtotal:</span>
                  <span className="font-medium">{currencySymbol}{calculateEInvoiceTotals().subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Tax Amount:</span>
                  <span className="font-medium">{currencySymbol}{calculateEInvoiceTotals().taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>{currencySymbol}{calculateEInvoiceTotals().total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleEInvoiceSubmit} size="lg" className="w-full sm:w-auto">
              Generate E-Invoice
            </Button>
          </div>
        </TabsContent>

        {/* E-Way Bill Tab */}
        <TabsContent value="ewaybill" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">E-Way Bill Details</CardTitle>
              <p className="text-sm text-muted-foreground">Provide information to generate an E-Way Bill</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="client_eway">Client *</Label>
                  <Select value={eWayBillData.client_id} onValueChange={(value) => setEWayBillData({ ...eWayBillData, client_id: value })}>
                    <SelectTrigger id="client_eway" aria-label="Select client for e-way bill">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.gstin})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="document_type">Document Type *</Label>
                  <Select value={eWayBillData.document_type} onValueChange={(value) => setEWayBillData({ ...eWayBillData, document_type: value })}>
                    <SelectTrigger id="document_type" aria-label="Select document type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tax Invoice">Tax Invoice</SelectItem>
                      <SelectItem value="Bill of Supply">Bill of Supply</SelectItem>
                      <SelectItem value="Delivery Challan">Delivery Challan</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


                <div className="flex flex-col gap-2">
                  <Label htmlFor="document_number">Document Number *</Label>
                  <Popover open={ewayBillSearchOpen} onOpenChange={setEwayBillSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={ewayBillSearchOpen}
                        className="w-full justify-between"
                      >
                        {eWayBillData.document_number ? eWayBillData.document_number : "Select Invoice..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search invoice number..." />
                        <CommandList>
                          <CommandEmpty>No invoice found.</CommandEmpty>
                          <CommandGroup>
                            {invoices.map((inv) => (
                              <CommandItem
                                key={inv.id}
                                value={inv.invoice_number}
                                onSelect={() => handleInvoiceSelect(inv.id, 'ewaybill')}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    eWayBillData.document_number === inv.invoice_number ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{inv.invoice_number}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {inv.issue_date} - {currencySymbol}{inv.total_amount}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="document_date">Document Date *</Label>
                  <Input
                    id="document_date"
                    type="date"
                    value={eWayBillData.document_date}
                    onChange={(e) => setEWayBillData({ ...eWayBillData, document_date: e.target.value })}
                    aria-label="Select document date"
                  />
                </div>

                <div>
                  <Label htmlFor="transaction_type">Transaction Type *</Label>
                  <Select value={eWayBillData.transaction_type} onValueChange={(value) => setEWayBillData({ ...eWayBillData, transaction_type: value })}>
                    <SelectTrigger id="transaction_type" aria-label="Select transaction type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Bill To-Ship To">Bill To-Ship To</SelectItem>
                      <SelectItem value="Bill From-Dispatch From">Bill From-Dispatch From</SelectItem>
                      <SelectItem value="Combination of 2 and 3">Combination of 2 and 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vehicle_number">Vehicle Number</Label>
                  <Input
                    id="vehicle_number"
                    value={eWayBillData.vehicle_number}
                    onChange={(e) => setEWayBillData({ ...eWayBillData, vehicle_number: e.target.value })}
                    placeholder="MH01AB1234"
                    aria-label="Enter vehicle number"
                  />
                </div>

                <div className="col-span-full pt-4 border-t border-dashed mt-2">
                   <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      E-Way Bill System Details (Optional)
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="eway_bill_no">E-Way Bill Number</Label>
                        <Input
                          id="eway_bill_no"
                          value={eWayBillData.eway_bill_no}
                          onChange={(e) => setEWayBillData({ ...eWayBillData, eway_bill_no: e.target.value })}
                          placeholder="12-digit number..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="valid_until">Valid Until (Expiry)</Label>
                        <Input
                          id="valid_until"
                          type="date"
                          value={eWayBillData.valid_until}
                          onChange={(e) => setEWayBillData({ ...eWayBillData, valid_until: e.target.value })}
                        />
                      </div>
                   </div>
                </div>

                <div>
                  <Label htmlFor="transport_mode">Transport Mode *</Label>
                  <Select value={eWayBillData.transport_mode} onValueChange={(value) => setEWayBillData({ ...eWayBillData, transport_mode: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Road">Road</SelectItem>
                      <SelectItem value="Rail">Rail</SelectItem>
                      <SelectItem value="Air">Air</SelectItem>
                      <SelectItem value="Ship">Ship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="distance">Distance (KM)</Label>
                  <Input
                    id="distance"
                    type="number"
                    value={eWayBillData.distance}
                    onChange={(e) => setEWayBillData({ ...eWayBillData, distance: e.target.value })}
                    placeholder="100"
                  />
                </div>

                <div>
                  <Label htmlFor="transporter_name">Transporter Name</Label>
                  <Input
                    id="transporter_name"
                    value={eWayBillData.transporter_name}
                    onChange={(e) => setEWayBillData({ ...eWayBillData, transporter_name: e.target.value })}
                    placeholder="Transporter company name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* E-Way Bill Items */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Goods Details</CardTitle>
              <Button onClick={() => openProductModal('ewaybill')} size="sm" variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Add Items
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eWayBillItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end p-4 border rounded-lg">
                    <div className="md:col-span-2">
                      <Label>Product Name *</Label>
                      <Input
                        value={item.product_name}
                        onChange={(e) => updateEWayBillItem(item.id, 'product_name', e.target.value)}
                        placeholder="Product name"
                      />
                    </div>
                    <div>
                      <Label>HSN Code *</Label>
                      <Input
                        value={item.hsn_code}
                        onChange={(e) => updateEWayBillItem(item.id, 'hsn_code', e.target.value)}
                        placeholder="HSN"
                      />
                    </div>
                     <div>
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateEWayBillItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Select value={item.unit} onValueChange={(value) => updateEWayBillItem(item.id, 'unit', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Value *</Label>
                      <Input
                        type="number"
                        value={item.value}
                        onChange={(e) => updateEWayBillItem(item.id, 'value', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="flex items-center">
                      {eWayBillItems.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeEWayBillItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Value:</span>
                  <span>{currencySymbol}{eWayBillItems.reduce((sum, item) => sum + item.value, 0).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleEWayBillSubmit} size="lg">
              Generate E-Way Bill
            </Button>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Document History</CardTitle>
              <p className="text-sm text-muted-foreground">Review previously generated documents</p>
            </CardHeader>
            <CardContent>
              <Tabs value={historyTab} onValueChange={setHistoryTab}>
                <TabsList className="bg-transparent h-auto p-0 flex space-x-2 border-b rounded-none mb-6">
                  <TabsTrigger
                    value="einvoice-history"
                    className="px-6 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    E-Invoice History
                  </TabsTrigger>
                  <TabsTrigger
                    value="ewaybill-history"
                    className="px-6 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    E-Way Bill History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="einvoice-history">
                  {historyLoading ? (
                    <div className="flex items-center justify-center p-4 md:p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : eInvoiceHistory.length === 0 ? (
                    <div className="text-center p-4 md:p-8 text-muted-foreground">
                      No E-Invoices found
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest">Invoice Number</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest">Client</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest">Date</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest">Amount</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest">Status</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {eInvoiceHistory.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                              <TableCell>{clients.find(c => c.id === invoice.client_id)?.name || 'N/A'}</TableCell>
                              <TableCell>{format(new Date(invoice.invoice_date), 'dd/MM/yyyy')}</TableCell>
                              <TableCell>{currencySymbol}{invoice.total_amount.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge variant={invoice.status === 'generated' ? 'default' : 'secondary'}>
                                  {invoice.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setViewHistoryItem(invoice);
                                      setViewHistoryType('einvoice');
                                      setIsViewHistoryOpen(true);
                                    }}
                                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadHistoryPDF('einvoice', invoice)}
                                    className="h-8 bg-background hover:bg-muted font-bold text-[10px] uppercase tracking-widest border-2 px-3"
                                  >
                                    <Download className="h-3.5 w-3.5 mr-1" />
                                    PDF
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="ewaybill-history">
                  {historyLoading ? (
                    <div className="flex items-center justify-center p-4 md:p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : eWayBillHistory.length === 0 ? (
                    <div className="text-center p-4 md:p-8 text-muted-foreground">
                      No E-Way Bills found
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest">Document Number</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest">Client</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest">Date</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest">Value</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest">Transport Mode</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest">Status</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {eWayBillHistory.map((ewaybill) => (
                            <TableRow key={ewaybill.id}>
                              <TableCell className="font-medium">{ewaybill.document_number}</TableCell>
                              <TableCell>{clients.find(c => c.id === ewaybill.client_id)?.name || 'N/A'}</TableCell>
                              <TableCell>{format(new Date(ewaybill.document_date), 'dd/MM/yyyy')}</TableCell>
                              <TableCell>{currencySymbol}{ewaybill.total_value.toFixed(2)}</TableCell>
                              <TableCell>{ewaybill.transport_mode}</TableCell>
                              <TableCell>
                                <Badge variant={ewaybill.status === 'generated' ? 'default' : 'secondary'}>
                                  {ewaybill.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setViewHistoryItem(ewaybill);
                                      setViewHistoryType('ewaybill');
                                      setIsViewHistoryOpen(true);
                                    }}
                                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadHistoryPDF('ewaybill', ewaybill)}
                                    className="h-8 bg-background hover:bg-muted font-bold text-[10px] uppercase tracking-widest border-2 px-3"
                                  >
                                    <Download className="h-3.5 w-3.5 mr-1" />
                                    PDF
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={productSelectionOpen} onOpenChange={setProductSelectionOpen}>
        <DialogContent className="sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[1200px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background">
          <DialogHeader className="p-4 md:p-8 pb-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight leading-tight">Select Products</DialogTitle>
                <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest mt-1">Add one or more items to your bill</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild className="h-12 px-6 font-black rounded-xl border-2 uppercase text-[10px] tracking-widest hidden md:flex">
                  <Link to="/products">Manage Catalog</Link>
                </Button>
                <Button
                  variant="hero"
                  onClick={() => {
                    setProductSelectionOpen(false);
                    setNewProductDialogOpen(true);
                  }}
                  className="h-12 px-8 font-black rounded-xl shadow-lg shadow-primary/20"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  New Product
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 border-b flex flex-col md:flex-row items-center gap-4 bg-muted/20 z-20">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items, HSN, or categories..."
                className="pl-9 h-10 text-sm rounded-md bg-background focus-visible:ring-primary/20"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-56 shrink-0">
              <Select value={productCategory} onValueChange={setProductCategory}>
                <SelectTrigger className="h-10 rounded-md bg-background font-medium">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="it">IT Services</SelectItem>
                  <SelectItem value="hardware">Hardware</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                setProductSelectionOpen(false);
                setNewProductDialogOpen(true);
              }}
              className="h-10 px-6 font-bold rounded-md w-full md:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Item
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Mobile View for Product Selection */}
            <div className="md:hidden space-y-4 p-4">
              {products
                .filter(p => {
                  const matchesSearch = p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                    (p.category || "").toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                    (p.sku || "").toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                    (p.hsn_code || "").toLowerCase().includes(productSearchQuery.toLowerCase());
                  const matchesCategory = productCategory === "all" || p.category === productCategory;
                  return matchesSearch && matchesCategory;
                })
                .map((product) => (
                  <div key={product.id} className="p-5 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/40 shadow-xl shadow-black/5 space-y-5 active:scale-[0.98] transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                    <div className="flex justify-between items-start gap-4 relative z-10">
                      <div className="space-y-1.5">
                        <h4 className="text-lg font-black text-foreground tracking-tight leading-tight">{product.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">
                          <span>{product.sku || 'No SKU'}</span>
                          {product.hsn_code && <span>• HSN: {product.hsn_code}</span>}
                        </div>
                        <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                          {currencySymbol}{product.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40 mb-0.5">Stock</p>
                        <p className="font-black text-xs text-foreground bg-muted/30 px-2 py-1 rounded-lg">
                          {product.opening_stock || '0'} <span className="text-[10px] opacity-60 ml-0.5">{product.unit?.toUpperCase() || 'PCS'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border/10 relative z-10">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Select Quantity</p>
                      <div className="flex items-center border border-border/50 rounded-2xl h-11 bg-background/50 backdrop-blur-md overflow-hidden shadow-inner">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 rounded-none hover:bg-muted/50 border-r border-border/20 active:scale-90 transition-transform"
                          onClick={() => updateModalQuantity(product.id, -1)}
                          disabled={(selectedQuantities[product.id] || 0) === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <input
                          type="number"
                          className="w-14 text-center font-black text-sm focus:outline-none bg-transparent text-foreground"
                          value={selectedQuantities[product.id] || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setSelectedQuantities(prev => ({ ...prev, [product.id]: Math.max(0, val) }));
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 rounded-none hover:bg-muted/50 border-l border-border/20 active:scale-95 transition-transform"
                          onClick={() => updateModalQuantity(product.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Desktop View Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10 border-b">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-black text-xs uppercase tracking-widest py-4 px-6">Item Name</TableHead>
                    <TableHead className="font-black text-xs uppercase tracking-widest py-4 px-4 text-center">SKU / HSN</TableHead>
                    <TableHead className="font-black text-xs uppercase tracking-widest py-4 px-4 text-center">In Stock</TableHead>
                    <TableHead className="font-black text-xs uppercase tracking-widest py-4 px-4">Market Price</TableHead>
                    <TableHead className="font-black text-xs uppercase tracking-widest py-4 px-4">Purchase</TableHead>
                    <TableHead className="font-black text-xs uppercase tracking-widest py-4 px-6 text-center">Selection</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products
                    .filter(p => {
                      const matchesSearch = p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                        (p.category || "").toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                        (p.sku || "").toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                        (p.hsn_code || "").toLowerCase().includes(productSearchQuery.toLowerCase());
                      const matchesCategory = productCategory === "all" || p.category === productCategory;
                      return matchesSearch && matchesCategory;
                    })
                    .map((product) => (
                      <TableRow key={product.id} className="hover:bg-muted/10 transition-colors h-20 border-b">
                        <TableCell className="px-6">
                           <div className="flex flex-col gap-0.5">
                              <span className="font-black text-foreground text-sm leading-tight tracking-tight">{product.name}</span>
                              <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">{product.category || 'Standard Category'}</span>
                           </div>
                        </TableCell>
                        <TableCell className="px-4 text-center">
                           <Badge variant="outline" className="text-[10px] font-black uppercase border-2 py-0.5">
                              {product.sku || (product.hsn_code ? `HSN:${product.hsn_code}` : 'NO-SKU')}
                           </Badge>
                        </TableCell>
                        <TableCell className="px-4 text-center">
                          <span className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-border/20",
                            (parseInt(product.opening_stock || '0') > 10)
                              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                              : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
                          )}>
                            {product.opening_stock || '0'} {product.unit?.toUpperCase() || 'PCS'}
                          </span>
                        </TableCell>
                        <TableCell className="font-black text-indigo-600 dark:text-indigo-400 px-4">₹{product.price.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground px-4 text-sm">₹{(product.purchase_price || 0).toLocaleString()}</TableCell>
                        <TableCell className="px-6">
                          <div className="flex items-center justify-center">
                            <div className="flex items-center border-2 border-border/40 rounded-xl h-12 bg-background shadow-md overflow-hidden relative group-hover:border-primary/30 transition-colors">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-full w-12 rounded-none border-r-2 border-border/20 hover:bg-muted active:scale-90 transition-transform"
                                onClick={() => updateModalQuantity(product.id, -1)}
                                disabled={(selectedQuantities[product.id] || 0) === 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <input
                                type="number"
                                className="w-14 text-center font-black text-sm focus:outline-none bg-transparent"
                                value={selectedQuantities[product.id] || 0}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setSelectedQuantities(prev => ({ ...prev, [product.id]: Math.max(0, val) }));
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-full w-12 rounded-none border-l-2 border-border/20 hover:bg-muted active:scale-95 transition-transform"
                                onClick={() => updateModalQuantity(product.id, 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <div className="bg-muted/10 px-2 h-full flex items-center text-[9px] font-bold text-muted-foreground border-l-2 border-border/10 uppercase">
                                {product.unit?.toUpperCase() || 'PCS'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  
                  {/* Visual cue to add more items */}
                  <TableRow
                    className="hover:bg-transparent border-none cursor-pointer group"
                    onClick={() => {
                      setProductSelectionOpen(false);
                      setNewProductDialogOpen(true);
                    }}
                  >
                    <TableCell colSpan={6} className="py-8 px-6">
                      <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 md:p-6 flex flex-col items-center justify-center gap-3 text-slate-400 group-hover:border-indigo-500/50 group-hover:text-indigo-500 transition-all bg-slate-50/30 dark:bg-slate-900/30 group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-950/20">
                        <Plus className="w-6 h-6" />
                        <div className="flex flex-col items-center">
                          <span className="font-black tracking-tight text-sm uppercase">Add New Product to Catalog</span>
                          <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Create a new item that isn't listed here</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5 shrink-0 items-center justify-between sm:flex-row sm:space-x-0">
             <div className="hidden md:flex items-center gap-4 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
               <span className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">Enter ↵ : Search</span>
               <span className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">↑ ↓ : Navigate</span>
             </div>

             <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
               <div className="text-sm font-black text-primary uppercase tracking-widest">
                 {Object.values(selectedQuantities).filter(q => q > 0).length} Selected Items
               </div>
               <div className="flex gap-4">
                 <Button 
                   variant="outline" 
                   onClick={() => setProductSelectionOpen(false)} 
                   className="h-12 font-bold rounded-xl border-2 px-8 uppercase text-[10px] tracking-widest hover:bg-muted"
                 >
                   Cancel
                 </Button>
                 <Button
                   onClick={addSelectedProducts}
                   className="h-12 font-black rounded-xl shadow-xl shadow-primary/25 bg-primary hover:opacity-95 text-primary-foreground uppercase tracking-widest px-10 active:scale-[0.98] transition-all"
                   disabled={Object.values(selectedQuantities).filter(q => q > 0).length === 0}
                 >
                   Add Items
                 </Button>
               </div>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simplified Create New Item Modal for EInvoice */}
      <Dialog open={newProductDialogOpen} onOpenChange={setNewProductDialogOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background">
          <DialogHeader className="p-4 md:p-8 pb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">Create New Item</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-full max-h-[75vh] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background custom-scrollbar">
              <form id="product-form" onSubmit={handleCreateProduct} className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Package className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Basic Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-bold">Item Name*</Label>
                      <Input
                        placeholder="e.g. Premium Consulting Services"
                        value={newProductFormData.name}
                        onChange={(e) => setNewProductFormData({ ...newProductFormData, name: e.target.value })}
                        required
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Category</Label>
                      <Select
                        value={newProductFormData.category}
                        onValueChange={(val) => setNewProductFormData({ ...newProductFormData, category: val })}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="it">IT & Software</SelectItem>
                          <SelectItem value="consulting">Consulting</SelectItem>
                          <SelectItem value="others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Unit</Label>
                      <Select
                        value={newProductFormData.unit}
                        onValueChange={(val) => setNewProductFormData({ ...newProductFormData, unit: val })}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="PCS" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PCS">Pieces (PCS)</SelectItem>
                          <SelectItem value="BOX">Box (BOX)</SelectItem>
                          <SelectItem value="KGS">Kilogram (KG)</SelectItem>
                          <SelectItem value="SERVICE">Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Truck className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Inventory Details</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold">SKU / Barcode</Label>
                      <div className="flex">
                        <Input
                          placeholder="ex: ITM12549"
                          className="flex-1 rounded-r-none border-r-0 h-10"
                          value={newProductFormData.sku}
                          onChange={(e) => setNewProductFormData({ ...newProductFormData, sku: e.target.value })}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            const randomId = Math.floor(100000000 + Math.random() * 900000000);
                            setNewProductFormData({ ...newProductFormData, sku: randomId.toString() });
                          }}
                          className="rounded-l-none font-bold text-[10px] h-10 px-3 uppercase tracking-wider"
                        >
                          Generate
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold opacity-0 invisible">QR</Label>
                      <div className="w-full h-10 border border-slate-200 dark:border-slate-800 rounded-md flex items-center justify-center bg-slate-50 dark:bg-slate-900 shadow-sm opacity-50 cursor-not-allowed">
                        <Scan className="w-4 h-4 mr-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quick Scanner</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold">HSN Code</Label>
                      <div className="relative">
                        <Input
                          placeholder="ex: 4010"
                          className="h-10 pr-20"
                          value={newProductFormData.hsn_code || ''}
                          onChange={(e) => setNewProductFormData({ ...newProductFormData, hsn_code: e.target.value })}
                        />
                        <Button 
                          type="button" 
                          variant="link" 
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 text-[10px] font-bold"
                          onClick={() => setShowHSNDialog(true)}
                        >
                          Find
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Opening Stock</Label>
                      <Input
                        placeholder="ex: 150"
                        type="number"
                        className="h-10"
                        value={newProductFormData.opening_stock}
                        onChange={(e) => setNewProductFormData({ ...newProductFormData, opening_stock: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Description</Label>
                    <Textarea
                      placeholder="Product details..."
                      className="min-h-[80px]"
                      value={newProductFormData.description}
                      onChange={(e) => setNewProductFormData({ ...newProductFormData, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Tag className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Pricing Details</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Sales Price</Label>
                      <div className="flex">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                          <Input
                            placeholder="0.00"
                            className="pl-8 rounded-r-none border-r-0 h-10"
                            type="number"
                            value={newProductFormData.sales_price}
                            onChange={(e) => setNewProductFormData({ ...newProductFormData, sales_price: e.target.value })}
                          />
                        </div>
                        <Select
                          value={newProductFormData.price_with_tax ? "with-tax" : "without-tax"}
                          onValueChange={(val) => setNewProductFormData({ ...newProductFormData, price_with_tax: val === "with-tax" })}
                        >
                          <SelectTrigger className="w-24 rounded-l-none h-10 text-[10px] font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="with-tax">Incl. Tax</SelectItem>
                            <SelectItem value="without-tax">Excl. Tax</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Tax Rate (%)</Label>
                      <Select
                        value={newProductFormData.tax_rate}
                        onValueChange={(val) => setNewProductFormData({ ...newProductFormData, tax_rate: val })}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="12">12%</SelectItem>
                          <SelectItem value="18">18%</SelectItem>
                          <SelectItem value="28">28%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Purchase Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                        <Input
                          placeholder="0.00"
                          className="pl-8 h-10"
                          type="number"
                          value={newProductFormData.purchase_price}
                          onChange={(e) => setNewProductFormData({ ...newProductFormData, purchase_price: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Discount (%)</Label>
                      <Input
                        placeholder="0"
                        type="number"
                        className="h-10"
                        value={newProductFormData.discount}
                        onChange={(e) => setNewProductFormData({ ...newProductFormData, discount: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <DialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5 border-t">
            <Button variant="outline" type="button" onClick={() => setNewProductDialogOpen(false)} className="flex-1 h-12 font-bold rounded-xl border-2 m-0 hover:bg-muted/50">
              Cancel
            </Button>
            <Button
              type="submit"
              form="product-form"
              className="flex-1 h-12 font-black rounded-xl shadow-lg shadow-primary/20"
              disabled={creatingProduct}
            >
              {creatingProduct ? "Saving..." : "Save Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HSN Code Lookup Dialog for EInvoice */}
      <Dialog open={showHSNDialog} onOpenChange={setShowHSNDialog}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background">
          <DialogHeader className="p-4 md:p-8 pb-4 border-b">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight tracking-tight leading-tight uppercase">Search HSN Code</DialogTitle>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Find code by number or product name</p>
          </DialogHeader>

          <div className="p-4 md:p-6 flex-1 flex flex-col space-y-4 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by HSN Code or Item Name..."
                className="pl-10 h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-sky-500 focus:border-sky-500 rounded-xl"
                value={hsnSearchQuery}
                onChange={(e) => setHsnSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
              {hsnCodesData
                .filter(item =>
                  item.code.toLowerCase().includes(hsnSearchQuery.toLowerCase()) ||
                  item.description.toLowerCase().includes(hsnSearchQuery.toLowerCase())
                )
                .slice(0, 50)
                .map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setNewProductFormData({ ...newProductFormData, hsn_code: item.code });
                      setShowHSNDialog(false);
                      setHsnSearchQuery("");
                    }}
                    className="p-4 border-b border-slate-50 hover:bg-sky-50 transition-colors cursor-pointer group rounded-lg mb-1"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sky-600 group-hover:text-sky-700">{item.code}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                ))}

              {hsnCodesData.filter(item =>
                item.code.toLowerCase().includes(hsnSearchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(hsnSearchQuery.toLowerCase())
              ).length === 0 && (
                  <div className="text-center py-12">
                    <div className="bg-slate-50 dark:bg-slate-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No HSN codes found for "{hsnSearchQuery}"</p>
                  </div>
                )}
            </div>
          </div>

          <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setShowHSNDialog(false)}
              className="w-full sm:w-auto font-bold border-slate-300 dark:border-slate-600 hover:bg-white dark:bg-slate-800"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SuccessModal
        isOpen={showSuccess}
        onOpenChange={setShowSuccess}
        title={successInfo.title}
        message={successInfo.message}
      />

      <Dialog open={isViewHistoryOpen} onOpenChange={setIsViewHistoryOpen}>
        <DialogContent className="sm:max-w-[95vw] w-full max-h-[96vh] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white flex flex-col">
          <DialogHeader className="px-8 py-5 bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  {viewHistoryType === 'einvoice' ? 'E-Invoice Preview' : 'E-Way Bill Preview'}
                </DialogTitle>
                <DialogDescription className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Generated Record Details
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => downloadHistoryPDF(viewHistoryType, viewHistoryItem!)}
                   className="font-black rounded-xl uppercase text-[10px] tracking-widest h-10 px-6 border-2"
                 >
                   <Download className="w-4 h-4 mr-2" />
                   Download PDF
                 </Button>
                 <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsViewHistoryOpen(false)}
                    className="h-10 w-10 text-slate-400 hover:text-slate-900"
                  >
                    <X className="w-5 h-5" />
                 </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto bg-slate-100/30 p-4 md:p-10 flex justify-center">
            {viewHistoryItem && (
              <ResponsiveInvoiceWrapper>
                <div className="shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-slate-200 bg-white origin-top mb-10 h-fit rounded-sm overflow-hidden">
                  {viewHistoryType === 'einvoice' ? (
                    <EInvoiceTemplate
                      invoice={viewHistoryItem as EInvoiceHistoryItem}
                      client={(clients.find(c => c.id === viewHistoryItem.client_id) as Client) || { name: '', email: '', gstin: '', address: '', state: '', postal_code: '' }}
                      items={(viewHistoryItem as EInvoiceHistoryItem).items}
                      profile={profile!}
                    />
                  ) : (
                    <EWayBillTemplate
                      eWayBillData={viewHistoryItem as EWayBillHistoryItem}
                      client={(clients.find(c => c.id === viewHistoryItem.client_id) as Client) || { name: '', email: '', gstin: '', address: '', state: '', postal_code: '' }}
                      items={(viewHistoryItem as EWayBillHistoryItem).items}
                      profile={profile!}
                    />
                  )}
                </div>
              </ResponsiveInvoiceWrapper>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EInvoicePage;
