import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Receipt, Package, Truck, Tag, CreditCard, Settings2, X, Search, Scan, Loader2, AlertCircle, Check, LayoutList, LayoutGrid, List, Printer, Download, Filter, ShoppingBag } from "lucide-react";
import { supabase, serviceSupabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { SuccessModal } from "@/components/SuccessModal";
import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { type HSNCode } from '@/types/hsn';
import { DataTablePagination } from "@/components/DataTablePagination";
import { formatCategory } from "@/utils/inventory";
import { useUserType } from "@/hooks/useUserType";

interface QRToken {
  id: string;
  product_id: string;
  sku: string;
  token: string;
  status: string | null;
  created_at: string | null;
  used_at: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
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
  vendor_id?: string;
}

import { useProducts } from "@/hooks/useProducts";
import { useVendors } from "@/hooks/useVendors";
import type { Vendor } from "./Vendors";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StaffHeaderBadge } from "@/components/StaffHeaderBadge";

const ProductsPage = () => {
  const { user, effectiveUserId, profile, companyProfile } = useAuth();
  const targetUserId = effectiveUserId || user?.id;
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || "";
  const initialProductId = searchParams.get('id') || "";
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

function getDateBounds(dateFilter?: string, customStart?: string, customEnd?: string) {
  if (!dateFilter || dateFilter === 'all') return { from: null, to: null };
  const now = new Date();
  
  if (dateFilter === 'today') {
    const todayStr = now.toISOString().split('T')[0];
    return { from: todayStr, to: todayStr };
  }
  
  if (dateFilter === 'this_week') {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    const mondayStr = d.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    return { from: mondayStr, to: todayStr };
  }
  
  if (dateFilter === 'this_month') {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const startStr = `${y}-${m}-01`;
    const todayStr = now.toISOString().split('T')[0];
    return { from: startStr, to: todayStr };
  }
  
  if (dateFilter === 'last_month') {
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const y = prevMonth.getFullYear();
    const m = String(prevMonth.getMonth() + 1).padStart(2, '0');
    const startStr = `${y}-${m}-01`;
    const endStr = lastDayPrevMonth.toISOString().split('T')[0];
    return { from: startStr, to: endStr };
  }
  
  if (dateFilter === 'custom') {
    return { from: customStart || null, to: customEnd || null };
  }
  
  return { from: null, to: null };
}

  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { isFoodKitchen } = useUserType();
  const isGeetaUser = targetUserId === 'dddbc465-7743-42c6-88f0-039a4332711d' || 
    profile?.company_name?.toLowerCase().includes('geeta') || 
    companyProfile?.company_name?.toLowerCase().includes('geeta') ||
    user?.email === 'krishnayadav240225@gmail.com';
  const isCloudKitchenUser = isFoodKitchen || isGeetaUser;

  const { data: totalSoldQuantity = 0 } = useQuery({
    queryKey: ['total-quantity-sold', targetUserId, dateFilter, startDate, endDate, categoryFilter, typeFilter],
    queryFn: async () => {
      if (!targetUserId) return 0;
      const clientToUse = serviceSupabase || supabase;
      
      let query = clientToUse
        .from('invoices')
        .select(`
          id,
          issue_date,
          invoice_items (
            quantity,
            products (
              category,
              type
            )
          )
        `)
        .eq('user_id', targetUserId);

      const { from: dateFrom, to: dateTo } = getDateBounds(dateFilter, startDate, endDate);
      if (dateFrom) {
        query = query.gte('issue_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('issue_date', dateTo);
      }

      const { data: invoices, error } = await query;
      if (error) {
        console.error("Error calculating sold quantity:", error);
        return 0;
      }

      let total = 0;
      ((invoices as unknown as { invoice_items?: { quantity: number; products?: { category?: string; type?: string } }[] }[]) || []).forEach(inv => {
        (inv.invoice_items || []).forEach(item => {
          const cat = item.products?.category?.toLowerCase();
          const pType = item.products?.type?.toLowerCase();

          if (categoryFilter && categoryFilter !== 'all' && cat !== categoryFilter.toLowerCase()) {
            return;
          }
          if (typeFilter && typeFilter !== 'all' && pType !== typeFilter.toLowerCase()) {
            return;
          }

          total += Number(item.quantity || 0);
        });
      });
      return total;
    },
    enabled: !!targetUserId && isCloudKitchenUser
  });

  const { data, isLoading: loading, isFetching: searchLoading } = useProducts({
    page: currentPage,
    pageSize: pageSize,
    searchTerm: debouncedSearch,
    categoryFilter,
    typeFilter
  });

  const products = (data?.products || []) as unknown as Product[];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const fetchProducts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }, [queryClient]);

  const [formData, setFormData] = useState({
    name: '',
    type: 'product',
    category: 'general',
    price: '',
    price_with_tax: true,
    tax_rate: '18',
    unit: 'pcs',
    opening_stock: '',
    description: '',
    purchase_price: '',
    sku: '',
    discount: '',
    hsn_code: '',
    barcode: '',
    alternative_unit: '',
    as_of_date: new Date().toISOString().split('T')[0],
    low_stock_warning: false,
    vendor_id: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: '', message: '' });
  const [activeTab, setActiveTab] = useState("basic");
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrPrintStep, setQrPrintStep] = useState<'select' | 'preview'>('select');
  const [qrFormat, setQrFormat] = useState<'label' | 'a4'>('a4');
  const [printType, setQrPrintType] = useState<'both' | 'qr' | 'barcode'>('both');
  const [qrQuantity, setQrQuantity] = useState(1);
  const [showHSNDialog, setShowHSNDialog] = useState(false);

  const [viewProductDialog, setViewProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [hsnSearchQuery, setHsnSearchQuery] = useState("");
  const [hsnCodesData, setHsnCodesData] = useState<HSNCode[]>([]);
  const [tokens, setTokens] = useState<QRToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);


  // Helper to highlight matching search characters
  const highlightText = useCallback((text: string, search: string) => {
    if (!search.trim()) return <>{text}</>;
    try {
      const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(${escapedSearch})`, 'gi');
      const parts = text.split(regex);
      return (
        <>
          {parts.map((part, i) => 
            part.toLowerCase() === search.toLowerCase() 
              ? <mark key={i} className="bg-amber-250/90 dark:bg-amber-900/60 dark:text-amber-200 px-0.5 rounded font-semibold">{part}</mark> 
              : part
          )}
        </>
      );
    } catch (e) {
      return <>{text}</>;
    }
  }, []);

  // Helper to render high-fidelity inventory badges
  const getStockStatusBadge = useCallback((product: Product) => {
    if (product.type === 'service') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-350 border border-slate-200 dark:border-slate-700/50">
          Service
        </span>
      );
    }
    const stock = Number(product.opening_stock || 0);
    if (stock <= 0) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-450 border border-rose-100 dark:border-rose-900/40">
          Out of Stock
        </span>
      );
    }
    if (stock <= 5) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/40">
        In Stock
      </span>
    );
  }, []);

  const { data: vendorsData } = useVendors({ pageSize: 1000 });
  const vendors = (vendorsData as unknown as { vendors: Vendor[] })?.vendors || [] as Vendor[];

  const { currencySymbol, convertFromINR, currencyCode } = useCurrency();
  const formatProductPrice = useCallback((inrAmount: number) => {
    const converted = currencyCode !== 'INR' ? convertFromINR(inrAmount) : inrAmount;
    return `${currencySymbol}${converted.toLocaleString(currencyCode === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }, [currencyCode, convertFromINR, currencySymbol]);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  // Handle specific product navigation from global search
  useEffect(() => {
    const findProductPage = async () => {
      if (initialProductId && targetUserId) {
        try {
          const clientToUse = serviceSupabase || supabase;
          const { data } = await clientToUse
            .from('products')
            .select('id')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });

          if (data) {
            const index = (data as unknown as Product[]).findIndex((p: Product) => p.id === initialProductId);
            if (index !== -1) {
              const page = Math.ceil((index + 1) / pageSize);
              setCurrentPage(page);
            }
          }
        } catch (err) {
          console.error("Error finding product page:", err);
        }
      }
    };

    if (targetUserId) {
      findProductPage();
    }
  }, [initialProductId, targetUserId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, categoryFilter, typeFilter]);

  const availableCategories = useMemo(() => {
    const base = [
      { value: 'all', label: 'All Categories' },
      { value: 'general', label: 'General Items' },
      { value: 'it', label: 'IT & Software' },
      { value: 'hardware', label: 'Hardware & Electronics' },
      { value: 'consulting', label: 'Consulting & Professional Services' },
      { value: 'retail', label: 'Retail & E-commerce' },
      { value: 'others', label: 'Others' }
    ];
    const known = new Set(['all', 'general', 'it', 'hardware', 'consulting', 'retail', 'others']);
    (products || []).forEach(p => {
      const raw = (p.category || '').trim();
      if (raw && !known.has(raw.toLowerCase())) {
        known.add(raw.toLowerCase());
        base.push({ value: raw, label: formatCategory(raw) });
      }
    });
    return base;
  }, [products]);

  const filteredHsnCodes = useMemo(() => {
    if (!showHSNDialog || hsnCodesData.length === 0) return [];
    if (!hsnSearchQuery) return hsnCodesData.slice(0, 50);

    const query = hsnSearchQuery.toLowerCase();
    return hsnCodesData
      .filter(item =>
        item.code.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      )
      .slice(0, 50);
  }, [showHSNDialog, hsnSearchQuery, hsnCodesData]);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user, currentPage, debouncedSearch, fetchProducts]);

  useEffect(() => {
    if (showHSNDialog && hsnCodesData.length === 0) {
      import('@/data/hsnCodes.json').then(module => {
        setHsnCodesData(module.default);
      });
    }
  }, [showHSNDialog, hsnCodesData.length]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Comprehensive validation
    const errors: string[] = [];
    if (!formData.name.trim()) errors.push("Product name is required.");
    if (formData.price === '' || formData.price === null || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      errors.push("A valid sales price (0 or greater) is required.");
    }
    if (formData.purchase_price && (isNaN(Number(formData.purchase_price)) || Number(formData.purchase_price) < 0)) {
      errors.push("Purchase price cannot be negative.");
    }
    if (formData.discount && (isNaN(Number(formData.discount)) || Number(formData.discount) < 0 || Number(formData.discount) > 100)) {
      errors.push("Discount must be between 0 and 100.");
    }
    if (formData.opening_stock && (isNaN(Number(formData.opening_stock)) || Number(formData.opening_stock) < 0)) {
      errors.push("Opening stock cannot be negative.");
    }
    if (!targetUserId) {
      errors.push("User session is not active. Please refresh the page.");
    }

    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Validation Failed",
        description: (
          <ul className="list-disc list-inside text-xs mt-1 text-white">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        )
      });
      return;
    }

    try {
      const sanitizedVendorId = (formData.vendor_id && formData.vendor_id !== 'none' && formData.vendor_id.trim() !== '')
        ? formData.vendor_id.trim()
        : null;

      const productData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        price: Number(formData.price),
        discount: Number(formData.discount) || 0,
        tax_rate: Number(formData.tax_rate) || 0,
        unit: formData.unit || 'pcs',
        category: formData.category ? formatCategory(formData.category) : 'General',
        type: formData.type || 'product',
        sku: formData.sku?.trim() || null,
        purchase_price: Number(formData.purchase_price) || 0,
        opening_stock: formData.opening_stock ? String(formData.opening_stock).trim() : "0",
        hsn_code: formData.hsn_code?.trim() || null,
        low_stock_warning: Boolean(formData.low_stock_warning),
        vendor_id: sanitizedVendorId,
        user_id: targetUserId
      };

      console.log('Attempting to save product with data:', productData);

      const clientToUse = serviceSupabase || supabase;

      if (editingId) {
        const { error } = await clientToUse
          .from('products')
          .update(productData)
          .eq('id', editingId);

        if (error) {
          console.error('Supabase update error:', error);
          throw new Error(`Failed to update product: ${error.message}`);
        }

        setSuccessInfo({
          title: 'Product Updated',
          message: 'Your product details have been successfully synchronized.'
        });
      } else {
        const { data: insertData, error } = await clientToUse
          .from('products')
          .insert([{ ...productData }])
          .select();

        if (error) {
          console.error('Supabase insert error:', error);
          throw new Error(`Failed to create product: ${error.message}`);
        }

        const newProduct = insertData?.[0] as unknown as Product;

        // Create Purchase Invoice if Vendor is selected and purchase price is set
        if (sanitizedVendorId && Number(formData.purchase_price) > 0 && newProduct) {
          const invoiceNumber = `PUR-${Date.now()}`;
          const totalAmount = Number(formData.purchase_price) * (Number(formData.opening_stock) || 1);

          const { data: invData, error: invError } = await clientToUse
            .from('purchase_invoices')
            .insert([{
              user_id: targetUserId,
              vendor_id: sanitizedVendorId,
              invoice_number: invoiceNumber,
              issue_date: new Date().toISOString().split('T')[0],
              total_amount: totalAmount,
              status: 'paid'
            }])
            .select();

          if (invError) {
            console.error('Error creating purchase invoice:', invError);
          } else if (invData?.[0]) {
            await clientToUse.from('purchase_invoice_items').insert([{
              invoice_id: (invData[0] as unknown as { id: string }).id,
              product_id: newProduct.id,
              quantity: Number(formData.opening_stock) || 1,
              rate: Number(formData.purchase_price),
              amount: totalAmount
            }]);
          }
        }

        setSuccessInfo({
          title: 'Product Created',
          message: 'Excellent! Your new product is now active and a purchase record has been created.'
        });
      }

      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      resetForm();
    } catch (error) {
      console.error('Detailed error saving product:', error);
      const err = error as { code?: string; column?: string; message?: string };

      let errorMessage = "An unexpected error occurred.";
      let technicalDetails = "";

      if (err?.code === '23505') {
        errorMessage = "An item with this SKU already exists.";
        technicalDetails = "Unique constraint violation (SKU).";
      } else if (err?.code === '23502') {
        errorMessage = "Some mandatory fields are missing in the database.";
        technicalDetails = `Missing required column: ${err.column}`;
      } else if (err?.code === '42703') {
        errorMessage = "Database schema mismatch.";
        technicalDetails = "Column does not exist.";
      } else if (err?.message) {
        errorMessage = err.message;
      }

      toast({
        variant: "destructive",
        title: "Product Saving Failed",
        description: (
          <div className="mt-2 text-sm text-destructive-foreground">
            <p className="font-semibold text-white">{errorMessage}</p>
            <div className="mt-2 p-2 bg-white/10 rounded border border-white/20">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1 text-white">Troubleshooting Info:</p>
              <ul className="list-disc list-inside text-[10px] space-y-0.5 text-white/90">
                <li>Form Name: {formData.name || "Missing"}</li>
                <li>Sales Price: {formData.price || "0"}</li>
                <li>SKU/Code: {formData.sku || "Auto-generated"}</li>
                {technicalDetails && <li>Technical Error: {technicalDetails}</li>}
                <li>Session Status: {user?.id ? "Active" : "Logged Out"}</li>
              </ul>
            </div>
            <p className="mt-2 text-[10px] italic opacity-80 text-white">Please check the highlighted fields and try again.</p>
          </div>
        )
      });
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price ? product.price.toString() : '',
      discount: (product.discount && Number(product.discount) > 0) ? product.discount.toString() : '',
      tax_rate: String(product.tax_rate !== null && product.tax_rate !== undefined ? product.tax_rate : 18),
      unit: product.unit || 'pcs',
      category: product.category || 'general',
      type: product.type || 'product',
      sku: product.sku || '',
      purchase_price: (product.purchase_price && Number(product.purchase_price) > 0) ? product.purchase_price.toString() : '',
      opening_stock: (product.opening_stock && product.opening_stock !== '0' && Number(product.opening_stock) > 0) ? product.opening_stock : '',
      price_with_tax: true,
      hsn_code: product.hsn_code || '',
      barcode: '',
      alternative_unit: '',
      as_of_date: new Date().toISOString().split('T')[0],
      low_stock_warning: product.low_stock_warning || false,
      vendor_id: product.vendor_id || ''
    });
    setEditingId(product.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setIdToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;
    try {
      const clientToUse = serviceSupabase || supabase;
      const { error } = await clientToUse
        .from('products')
        .delete()
        .eq('id', idToDelete);

      if (error) throw error;

      setShowDeleteConfirm(false);
      setSuccessInfo({
        title: 'Product Deleted',
        message: 'The product has been permanently removed from your catalog.'
      });
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (err: unknown) {
      console.error('Error deleting product:', err);
      const error = err as { code?: string; message?: string };
      
      let errorMessage = "Failed to delete product.";
      if (error?.code === '23503') {
        errorMessage = "This product is linked to invoices or other records and cannot be deleted. Try renaming it or marking it as inactive instead.";
      }

      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: errorMessage
      });
    } finally {
      setIdToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'product',
      category: 'general',
      price: '',
      price_with_tax: true,
      tax_rate: '18',
      unit: 'pcs',
      opening_stock: '',
      description: '',
      purchase_price: '',
      sku: '',
      discount: '',
      hsn_code: '',
      barcode: '',
      alternative_unit: '',
      as_of_date: new Date().toISOString().split('T')[0],
      low_stock_warning: false,
      vendor_id: ''
    });
    setEditingId(null);
  };

  const ensureTokens = async (productId: string, sku: string, count: number) => {
    if (!productId || count <= 0) return;

    setLoadingTokens(true);
    try {
      const clientToUse = serviceSupabase || supabase;
      // 1. Fetch existing active tokens
      const { data: existingTokens } = await clientToUse
        .from('qr_tokens')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'active');

      const currentActiveCount = existingTokens?.length || 0;

      // 2. If we need more tokens, generate them
      if (currentActiveCount < count) {
        const needed = count - currentActiveCount;
        const newTokens = Array.from({ length: needed }).map(() => ({
          product_id: productId,
          sku: sku,
          token: crypto.randomUUID(),
          status: 'active'
        }));

        const { error: insertError } = await clientToUse
          .from('qr_tokens')
          .insert(newTokens);

        if (insertError) throw insertError;
      }

      // 3. Fetch all active tokens again to be sure
      const { data: finalTokens } = await clientToUse
        .from('qr_tokens')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'active');

      setTokens((finalTokens as unknown as QRToken[]) || []);
    } catch (error) {
      console.error('Error ensuring tokens:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate QR tokens."
      });
    } finally {
      setLoadingTokens(false);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Products & Services</h1>
            <StaffHeaderBadge />
          </div>
          <p className="text-muted-foreground mt-1">Manage your products and services catalog</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Layout Toggle */}
          <div className="flex items-center border border-border/60 rounded-md p-1 bg-muted/20">
            <Button
              variant={viewMode === 'grid' ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={cn(
                "h-8 w-8 p-0 rounded-sm",
                viewMode === 'grid' ? "shadow-sm" : "hover:bg-muted"
              )}
            >
              <Package className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn(
                "h-8 w-8 p-0 rounded-sm",
                viewMode === 'list' ? "shadow-sm" : "hover:bg-muted"
              )}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="lg" onClick={resetForm} className="w-full sm:w-auto h-11">
                <Plus className="w-5 h-5 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[90vw] lg:max-w-[850px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background max-h-[85vh] flex flex-col">
              <DialogHeader className="p-4 md:p-8 pb-4 shrink-0">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                  {editingId ? 'Edit Item Details' : 'Create New Item Catalog'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground font-medium">
                  {editingId ? 'Update the details of your inventory item below.' : 'Fill in the details below to add a new item to your inventory.'}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background custom-scrollbar">
                  <DialogDescription className="sr-only">
                    Form to add or edit product details including basic info, pricing, and inventory.
                  </DialogDescription>
                  <form id="product-page-form" onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Details Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                        <Package className="w-4 h-4" /> Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm font-bold">Item Name <span className="text-destructive">*</span></Label>
                          <Input
                            placeholder="e.g. Premium Consulting Services"
                            className="h-10 border-border bg-background text-sm"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</Label>
                          <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                            <SelectTrigger className="h-10 border-border bg-background text-sm">
                              <SelectValue placeholder="Select Category">
                                {formatCategory(formData.category)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General Items</SelectItem>
                              <SelectItem value="it">IT & Software</SelectItem>
                              <SelectItem value="hardware">Hardware & Electronics</SelectItem>
                              <SelectItem value="consulting">Consulting & Professional Services</SelectItem>
                              <SelectItem value="retail">Retail & E-commerce</SelectItem>
                              <SelectItem value="others">Others</SelectItem>
                              {formData.category && !['general', 'it', 'hardware', 'consulting', 'retail', 'others'].includes(formData.category.toLowerCase()) && (
                                <SelectItem value={formData.category}>{formatCategory(formData.category)}</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vendor</Label>
                          <Select value={formData.vendor_id || "none"} onValueChange={(val) => setFormData({ ...formData, vendor_id: val === "none" ? "" : val })}>
                            <SelectTrigger className="h-10 border-border bg-background text-sm">
                              <SelectValue placeholder="Select Vendor (Optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Vendor</SelectItem>
                              {vendors.map((vendor: Vendor) => (
                                <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-[10px] text-muted-foreground italic mt-1">If selected, a purchase bill will be created upon item creation.</p>
                        </div>
                      </div>
                    </div>

                    <hr className="border-border/50" />

                    {/* Pricing Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                        <Tag className="w-4 h-4" /> Pricing & Taxation
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sales Price <span className="text-destructive">*</span></Label>
                          <div className="flex h-10 rounded-md overflow-hidden border border-border bg-background focus-within:ring-1 focus-within:ring-primary transition-all">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">{currencySymbol}</span>
                              <Input
                                placeholder="0.00"
                                type="number"
                                className="pl-8 border-none h-full focus-visible:ring-0 font-medium text-sm bg-transparent"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                              />
                            </div>
                            <div className="w-px bg-border my-2"></div>
                            <Select
                              value={formData.price_with_tax ? "with-tax" : "without-tax"}
                              onValueChange={(val) => setFormData({ ...formData, price_with_tax: val === "with-tax" })}
                            >
                              <SelectTrigger className="w-28 border-none h-full bg-muted/20 text-[10px] uppercase tracking-wider focus:ring-0 px-3">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="with-tax">INCL. TAX</SelectItem>
                                <SelectItem value="without-tax">EXCL. TAX</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Discount (%)</Label>
                          <Input
                            placeholder="0"
                            type="number"
                            className="h-10 border-border bg-background text-sm"
                            value={formData.discount}
                            onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">GST Tax Rate</Label>
                          <Select
                            value={String(formData.tax_rate)}
                            onValueChange={(val) => setFormData({ ...formData, tax_rate: val })}
                            disabled={!formData.price_with_tax}
                          >
                            <SelectTrigger className={cn(
                              "h-10 border-border bg-background text-sm font-medium",
                              !formData.price_with_tax && "opacity-50 cursor-not-allowed bg-muted"
                            )}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">None (0%)</SelectItem>
                              <SelectItem value="5">GST 5%</SelectItem>
                              <SelectItem value="12">GST 12%</SelectItem>
                              <SelectItem value="18">GST 18%</SelectItem>
                              <SelectItem value="28">GST 28%</SelectItem>
                            </SelectContent>
                          </Select>
                          {!formData.price_with_tax && (
                            <p className="text-[10px] text-muted-foreground italic mt-1">Tax rate is auto-managed for tax-exclusive pricing.</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Purchase Price</Label>
                          <div className="relative h-10">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">{currencySymbol}</span>
                            <Input
                              placeholder="0.00"
                              type="number"
                              className="pl-8 h-full border-border bg-background text-sm"
                              value={formData.purchase_price}
                              onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr className="border-border/50" />

                    {/* Inventory Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Inventory & Stock
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Item Code (SKU)</Label>
                          <div className="flex h-10 rounded-md overflow-hidden border border-border bg-background">
                            <Input
                              placeholder="ex: ITM12549"
                              className="flex-1 border-none focus-visible:ring-0 text-sm px-3 bg-transparent"
                              value={formData.sku}
                              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            />
                            <Button
                              type="button"
                              onClick={() => {
                                const randomId = Math.floor(10000 + Math.random() * 90000);
                                setFormData({ ...formData, sku: `ITM${randomId}` });
                              }}
                              className="bg-muted text-primary hover:bg-muted/80 px-3 text-[10px] font-semibold tracking-wider h-full border-l border-border rounded-none"
                            >
                              Generate
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">HSN/SAC Code</Label>
                          <div className="flex h-10 rounded-md overflow-hidden border border-border bg-background">
                            <Input
                              placeholder="ex: 8471"
                              className="flex-1 border-none focus-visible:ring-0 text-sm px-3 bg-transparent"
                              value={formData.hsn_code}
                              onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                            />
                            <Button
                              type="button"
                              onClick={() => setShowHSNDialog(true)}
                              className="bg-muted text-primary hover:bg-muted/80 px-3 text-[10px] font-semibold tracking-wider h-full border-l border-border rounded-none"
                            >
                              Lookup
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unit</Label>
                          <Select 
                            value={formData.unit} 
                            onValueChange={(val) => setFormData({ 
                              ...formData, 
                              unit: val,
                              type: val === 'service' ? 'service' : 'product'
                            })}
                          >
                            <SelectTrigger className="h-10 border-border bg-background text-sm">
                              <SelectValue placeholder="Pieces (PCS)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pcs">Pieces (PCS)</SelectItem>
                              <SelectItem value="box">Box (BOX)</SelectItem>
                              <SelectItem value="kg">Kilograms (KG)</SelectItem>
                              <SelectItem value="unit">Units (UNT)</SelectItem>
                              <SelectItem value="service">Service</SelectItem>
                              <SelectItem value="hours">Hours (HRS)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.type === 'product' && (
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Opening Stock</Label>
                            <div className="flex h-10 rounded-md overflow-hidden border border-border bg-background">
                              <Input
                                placeholder="0"
                                type="number"
                                className="flex-1 border-none focus-visible:ring-0 text-sm px-3 bg-transparent"
                                value={formData.opening_stock}
                                onChange={(e) => setFormData({ ...formData, opening_stock: e.target.value })}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between p-3 rounded-md border border-border bg-muted/5 md:col-span-2">
                          <Label className="text-sm font-semibold">Low Stock Notifications</Label>
                          <Checkbox
                            checked={formData.low_stock_warning}
                            onCheckedChange={(val) => setFormData({ ...formData, low_stock_warning: !!val })}
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Description</Label>
                          <Textarea
                            placeholder="Add internal notes or customer-facing product details..."
                            className="resize-none border border-border bg-background rounded-md p-3 min-h-[80px] text-sm"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              <DialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1 h-11 font-bold rounded-xl border-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="product-page-form"
                  className="flex-1 h-11 font-black rounded-xl shadow-lg shadow-primary/20"
                >
                  {editingId ? 'Save Changes' : 'Create Item'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isCloudKitchenUser && (
        <Card className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Quantity Sold</p>
              <p className="text-xl font-black text-foreground">{totalSoldQuantity.toLocaleString('en-IN')} <span className="text-xs font-bold text-emerald-600">Plates / Units</span></p>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-bold">
            Cloud Kitchen Active
          </Badge>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name, SKU, category..."
            className="pl-10 h-11 bg-background border-border/50 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="w-full sm:w-44">
          <select
            className="w-full h-11 rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium capitalize"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {availableCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-36">
          <select
            className="w-full h-11 rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="product">Products</option>
            <option value="service">Services</option>
          </select>
        </div>

      </div>

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmDelete}
        title="Delete Product?"
        description="Are you sure you want to remove this product? This action cannot be undone and will affect future invoices referencing this item."
      />

      <SuccessModal
        isOpen={showSuccess}
        onOpenChange={setShowSuccess}
        title={successInfo.title}
      message={successInfo.message}
      />


      {/* HSN Code Lookup Dialog */}
      <Dialog open={showHSNDialog} onOpenChange={setShowHSNDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background">
          <DialogHeader className="p-4 md:p-8 pb-4 shrink-0">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
              HSN Code Lookup
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Search and select the appropriate GST HSN code for your product.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 md:p-6 flex-1 flex flex-col space-y-4 overflow-hidden">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-sky-500 transition-colors" />
              <Input
                placeholder="Search by HSN Code or Item Name..."
                className="pl-12 h-14 bg-muted/20 border-border/50 focus:ring-sky-500 focus:border-sky-500 rounded-2xl transition-all shadow-inner font-medium text-lg"
                value={hsnSearchQuery}
                onChange={(e) => setHsnSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
              {hsnCodesData.length === 0 ? (
                <div className="flex justify-center items-center h-full min-h-[200px]">
                  <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                </div>
              ) : filteredHsnCodes.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setFormData({ ...formData, hsn_code: item.code });
                    setShowHSNDialog(false);
                    setHsnSearchQuery("");
                  }}
                  className="p-5 border-b border-border/50 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition-all cursor-pointer group rounded-xl mb-2 border border-transparent hover:border-sky-200 dark:hover:border-sky-800/50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-primary text-lg group-hover:scale-110 transition-transform origin-left">{item.code}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-sky-600 dark:text-sky-400 text-xs font-bold">
                      Select <Plus className="w-3 h-3 ml-1" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed group-hover:text-foreground transition-colors font-medium">{item.description}</p>
                </div>
              ))}

              {hsnCodesData.length > 0 && filteredHsnCodes.length === 0 && (
                <div className="text-center py-12">
                  <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-muted-foreground font-medium">No HSN codes found for "{hsnSearchQuery}"</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-4 bg-muted/20 border-t border-border/30">
            <Button
              variant="outline"
              onClick={() => setShowHSNDialog(false)}
              className="w-full sm:w-auto font-bold border-border/50 hover:bg-background"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {products.length === 0 ? (
        <Card className="flex flex-col items-center justify-center h-64 text-center p-4 md:p-8 bg-muted/20 border-border/40 rounded-xl border-dashed">
          <Package className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-bold text-foreground/60">No items found</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">Try adjusting your search filters or add a new premium item to your catalog.</p>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="p-4 bg-card border border-border/60 rounded-md shadow-sm hover:shadow-md transition-all group relative cursor-pointer"
                  onClick={() => {
                    setSelectedProduct(product);
                    setViewProductDialog(true);
                  }}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground text-sm line-clamp-1">
                            {highlightText(product.name, searchTerm)}
                          </h3>
                          {product.discount && Number(product.discount) > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-emerald-100 text-emerald-700 shrink-0">
                              -{product.discount}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest truncate">
                          {product.sku ? highlightText(product.sku, searchTerm) : 'No SKU'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {product.sku && product.type !== 'service' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:text-primary rounded-full bg-primary/5 hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(product);
                              setQrQuantity(Number(product.opening_stock || 1));
                              setShowQRDialog(true);
                              setQrPrintStep('select');
                            }}
                            title="Barcode/QR Code"
                          >
                            <Scan className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto border-t border-slate-100 dark:border-slate-800/50 pt-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold text-slate-400">SP:</span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">{formatProductPrice(product.price || 0)}</span>
                        </div>
                        {product.type !== 'service' && (
                          <>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-bold text-slate-400">CP:</span>
                              <span className="text-xs font-bold text-slate-650 dark:text-slate-400">{formatProductPrice(product.purchase_price || 0)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-bold text-slate-400">Profit:</span>
                              <span className={cn(
                                "text-xs font-black",
                                (product.price - (product.purchase_price || 0)) >= 0 ? "text-emerald-600 dark:text-emerald-450" : "text-rose-600"
                              )}>
                                {formatProductPrice(product.price - (product.purchase_price || 0))}
                              </span>
                            </div>
                          </>
                        )}
                        <p className="text-[9px] text-muted-foreground font-semibold mt-0.5">{formatCategory(product.category)}</p>
                      </div>
                      <div className="flex flex-col items-end justify-between self-stretch">
                        <div className="text-right">
                          {getStockStatusBadge(product)}
                          <p className="text-[10px] font-black text-slate-650 dark:text-slate-350 mt-1">
                            Qty: {product.type === 'service' ? '—' : (product.opening_stock || 0)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary rounded-full hover:bg-primary/5"
                            onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-full hover:bg-destructive/5"
                            onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    </div>
                  </Card>
              ))}

              {/* Simplified Add Product Card */}
              <Card
                className="flex flex-col items-center justify-center p-4 md:p-6 bg-muted/10 border border-dashed border-border/60 rounded-md hover:bg-muted/20 transition-all cursor-pointer group h-full min-h-[140px]"
                onClick={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest">Add Product</p>
              </Card>
            </div>
          ) : (
            <Card className="bg-card border border-border/60 rounded-md shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="h-12">
                    <TableHead className="font-semibold text-[10px] uppercase tracking-widest pl-6">Item Information</TableHead>
                    <TableHead className="font-semibold text-[10px] uppercase tracking-widest">Category</TableHead>
                    <TableHead className="font-semibold text-[10px] uppercase tracking-widest text-right">Purchase Price</TableHead>
                    <TableHead className="font-semibold text-[10px] uppercase tracking-widest text-right">Selling Price</TableHead>
                    <TableHead className="font-semibold text-[10px] uppercase tracking-widest text-right">Profit/Unit</TableHead>
                    <TableHead className="font-semibold text-[10px] uppercase tracking-widest text-center">Stock</TableHead>
                    <TableHead className="font-semibold text-[10px] uppercase tracking-widest text-center">Barcode</TableHead>
                    <TableHead className="font-semibold text-[10px] uppercase tracking-widest">Tax</TableHead>
                    <TableHead className="text-right font-semibold text-[10px] uppercase tracking-widest pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow
                      key={product.id}
                      className="hover:bg-muted/40 transition-all cursor-pointer group h-14"
                      onClick={() => {
                        setSelectedProduct(product);
                        setViewProductDialog(true);
                      }}
                    >
                      <TableCell className="pl-6">
                        <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                          {highlightText(product.name, searchTerm)}
                        </div>
                        {product.sku && (
                          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            SKU: {highlightText(product.sku, searchTerm)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                          {formatCategory(product.category)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-muted-foreground">{formatProductPrice(product.purchase_price || 0)}</TableCell>
                      <TableCell className="text-right font-bold text-foreground">{formatProductPrice(product.price || 0)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {product.type === 'service' ? (
                          <span className="text-slate-400 font-semibold text-xs">—</span>
                        ) : (
                          <div className="text-right">
                            <span className={cn(
                              "text-xs font-bold",
                              (product.price - (product.purchase_price || 0)) >= 0 ? "text-emerald-600 dark:text-emerald-450" : "text-rose-600"
                            )}>
                              {formatProductPrice(product.price - (product.purchase_price || 0))}
                            </span>
                            <span className="block text-[8px] text-slate-450 font-semibold">
                              ({product.price > 0 ? (((product.price - (product.purchase_price || 0)) / product.price) * 100).toFixed(0) : 0}% margin)
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {product.type === 'service' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-350 border border-slate-200 dark:border-slate-700/50">
                            Service
                          </span>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <span className={cn(
                              "font-black text-sm",
                              Number(product.opening_stock || 0) <= 0 ? "text-rose-600 dark:text-rose-450" :
                              Number(product.opening_stock || 0) <= 5 ? "text-amber-600 dark:text-amber-450" : "text-slate-800 dark:text-slate-100"
                            )}>
                              {Number(product.opening_stock || 0).toLocaleString()}
                              <span className="text-[10px] font-semibold text-muted-foreground ml-1 uppercase">{product.unit || 'PCS'}</span>
                            </span>
                            {getStockStatusBadge(product)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {product.sku && product.type !== 'service' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-primary hover:bg-primary/5 mx-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(product);
                              setQrQuantity(Number(product.opening_stock || 1));
                              setShowQRDialog(true);
                              setQrPrintStep('select');
                            }}
                            title="Barcode/QR Code"
                          >
                            <Scan className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-[10px] font-semibold">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[10px] font-bold">{product.tax_rate}%</TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-primary/5"
                            onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/5"
                            onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}

      <div className="mt-6">
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          entityName="products"
          isLoading={loading}
        />
      </div>

      {/* View Product Details Dialog */}
      <Dialog open={viewProductDialog} onOpenChange={setViewProductDialog}>
        <DialogContent className="sm:max-w-[95vw] w-full max-h-[96vh] overflow-y-auto p-0 bg-white dark:bg-slate-950 border-none shadow-2xl flex flex-col">
          <DialogHeader className="sticky top-0 z-10 w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 rounded-t-lg shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  {selectedProduct?.type === 'service' ? (
                    <Settings2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Package className="w-5 h-5 text-primary" />
                  )}
                  Product Details - {selectedProduct?.name}
                </DialogTitle>
                <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  Detailed specifications and inventory status
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 md:p-6 bg-muted/5 flex-1 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-background border border-border rounded-md p-4 shadow-sm">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Selling Price</p>
                <p className="text-xl font-bold text-foreground">{currencySymbol}{Number(selectedProduct?.price || 0).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{selectedProduct?.tax_rate}% GST Applicable</p>
              </div>
              <div className="bg-background border border-border rounded-md p-4 shadow-sm">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Current Stock</p>
                {selectedProduct?.type === 'service' ? (
                  <p className="text-xl font-bold text-muted-foreground">—</p>
                ) : (
                  <p className={cn(
                    "text-xl font-bold",
                    Number(selectedProduct?.opening_stock || 0) <= 5 ? "text-destructive" : "text-emerald-500"
                  )}>
                    {selectedProduct?.opening_stock || 0} <span className="text-[10px] font-semibold uppercase text-muted-foreground ml-1">{selectedProduct?.unit || 'pcs'}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="bg-background border border-border rounded-md overflow-hidden shadow-sm">
              <div className="grid grid-cols-2 gap-px bg-border">
                <div className="bg-background p-4 relative group">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">SKU / Item Code</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">{selectedProduct?.sku || 'N/A'}</p>
                    {selectedProduct?.sku && selectedProduct.type !== 'service' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setQrQuantity(Number(selectedProduct?.opening_stock || 1)); setShowQRDialog(true); }}
                        className="h-6 px-2 text-[9px] font-semibold uppercase bg-muted hover:bg-muted/80 text-primary rounded transition-all"
                      >
                        <Scan className="w-3 h-3 mr-1" />
                        Barcode ({selectedProduct?.opening_stock || 0})
                      </Button>
                    )}
                  </div>
                </div>
                <div className="bg-background p-4">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Category</p>
                  <p className="text-sm font-bold text-foreground">{formatCategory(selectedProduct?.category)}</p>
                </div>
                <div className="bg-background p-4">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">HSN Code</p>
                  <p className="text-sm font-bold text-foreground">{selectedProduct?.hsn_code || 'N/A'}</p>
                </div>
                <div className="bg-background p-4">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Purchase Price</p>
                  <p className="text-sm font-bold text-foreground">{selectedProduct?.purchase_price ? `${currencySymbol}${Number(selectedProduct.purchase_price).toLocaleString()}` : 'N/A'}</p>
                </div>
                <div className="bg-background p-4">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Discount</p>
                  <p className="text-sm font-bold text-foreground">{selectedProduct?.discount ? `${selectedProduct.discount}%` : '0%'}</p>
                </div>
                <div className="bg-background p-4">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Profit per Unit</p>
                  {selectedProduct?.type === 'service' ? (
                    <p className="text-sm font-bold text-muted-foreground">—</p>
                  ) : (
                    <p className={cn(
                      "text-sm font-bold",
                      (Number(selectedProduct?.price || 0) - Number(selectedProduct?.purchase_price || 0)) >= 0 ? "text-emerald-600 dark:text-emerald-450" : "text-rose-600"
                    )}>
                      {currencySymbol}{(Number(selectedProduct?.price || 0) - Number(selectedProduct?.purchase_price || 0)).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="bg-background p-4">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Profit Margin</p>
                  {selectedProduct?.type === 'service' ? (
                    <p className="text-sm font-bold text-muted-foreground">—</p>
                  ) : (
                    <p className="text-sm font-bold text-foreground">
                      {selectedProduct?.price ? (((Number(selectedProduct.price) - Number(selectedProduct.purchase_price || 0)) / Number(selectedProduct.price)) * 100).toFixed(1) : 0}%
                    </p>
                  )}
                </div>
              </div>
            </div>

            {selectedProduct?.description && (
              <div className="bg-background border border-border rounded-md p-4 shadow-sm">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Description</p>
                <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedProduct.description}</p>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t border-border bg-muted/20 sm:justify-between items-center flex-row">
            <span className="text-[10px] text-muted-foreground hidden sm:inline-block">
              Added on: {selectedProduct?.created_at ? new Date(selectedProduct.created_at).toLocaleDateString() : 'N/A'}
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none font-semibold h-9 px-4 rounded-md text-xs"
                onClick={() => setViewProductDialog(false)}
              >
                Close
              </Button>
              <Button
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white font-semibold h-9 px-5 rounded-md text-xs"
                onClick={() => {
                  setViewProductDialog(false);
                  if (selectedProduct) handleEdit(selectedProduct);
                }}
              >
                <Edit className="w-3.5 h-3.5 mr-2" />
                Edit Item
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showQRDialog} onOpenChange={(val) => {
        setShowQRDialog(val);
        if (!val) setQrPrintStep('select');
      }}>
        <DialogContent className="sm:max-w-[550px] w-[95vw] max-h-[90vh] p-0 bg-white dark:bg-slate-950 border-none shadow-2xl rounded-2xl overflow-hidden flex flex-col">
          <DialogHeader className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Scan className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Print Code
                  </DialogTitle>
                  <p className="text-[10px] text-slate-500 font-medium">SKU: {selectedProduct?.sku}</p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 md:p-6 overflow-y-auto flex-1 custom-scrollbar">
            {qrPrintStep === 'select' ? (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Print Quantity</Label>
                    <Input
                      type="number"
                      value={qrQuantity}
                      onChange={(e) => setQrQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-11 font-bold border-slate-200 focus:ring-primary/20 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Code Type</Label>
                    <Select value={printType} onValueChange={(val: 'both' | 'qr' | 'barcode') => setQrPrintType(val)}>
                      <SelectTrigger className="h-11 font-bold border-slate-200 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">Both Codes</SelectItem>
                        <SelectItem value="qr">QR Only</SelectItem>
                        <SelectItem value="barcode">Barcode Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Print Format</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => { setQrFormat('label'); setQrPrintStep('preview'); }}
                      className="flex flex-col items-center p-5 rounded-2xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all group text-left"
                    >
                      <div className="w-12 h-8 border-2 border-slate-300 group-hover:border-primary/50 border-dashed rounded mb-3" />
                      <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Label Print</span>
                      <span className="text-[10px] text-slate-400 font-medium">Roll / Thermal</span>
                    </button>

                    <button
                      onClick={() => { setQrFormat('a4'); setQrPrintStep('preview'); }}
                      className="flex flex-col items-center p-5 rounded-2xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all group text-left"
                    >
                      <div className="w-10 h-12 border-2 border-slate-300 group-hover:border-primary/50 border-dashed rounded mb-3 flex flex-wrap gap-0.5 p-1">
                        <div className="w-full h-1 bg-slate-200 rounded-full" />
                        <div className="w-full h-1 bg-slate-200 rounded-full" />
                        <div className="w-full h-1 bg-slate-200 rounded-full" />
                      </div>
                      <span className="font-bold text-sm text-slate-700 dark:text-slate-200">A4 Sheet</span>
                      <span className="text-[10px] text-slate-400 font-medium">Standard Printer</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-3">
                  <Button onClick={() => setQrPrintStep('select')} variant="outline" className="h-11 rounded-xl px-6 font-bold border-slate-200">
                    Back
                  </Button>
                  <Button onClick={() => window.print()} className="h-11 rounded-xl flex-1 font-bold shadow-lg shadow-primary/20">
                    Print {qrQuantity} {qrFormat === 'label' ? 'Labels' : 'A4 Codes'}
                  </Button>
                </div>

                <div id="print-qr-area" className={cn(
                  "bg-slate-50 dark:bg-slate-900/50 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 max-h-[400px] overflow-y-auto custom-scrollbar",
                  qrFormat === 'a4' ? "grid grid-cols-2 gap-4" : "flex flex-col items-center gap-4"
                )}>
                  {Array.from({ length: qrQuantity }).map((_, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center space-y-3 w-full max-w-[200px] mx-auto shadow-sm">
                      <div className="flex flex-col items-center gap-3 w-full">
                        {(printType === 'both' || printType === 'qr') && (
                          <div className="p-1 bg-white" style={{ width: 80, height: 80 }}>
                            <QRCode
                              value={`SKU:${selectedProduct?.sku}|NAME:${selectedProduct?.name}`}
                              size={80}
                              level="H"
                              style={{ width: '100%', height: 'auto' }}
                            />
                          </div>
                        )}

                        {(printType === 'both' || printType === 'barcode') && (
                          <div className="w-full flex justify-center overflow-hidden py-1">
                            <Barcode
                              value={selectedProduct?.sku || "N/A"}
                              width={1}
                              height={30}
                              fontSize={8}
                              margin={0}
                              background="transparent"
                            />
                          </div>
                        )}
                      </div>

                      {/* Name and price removed for cleaner label as requested */}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsPage;
