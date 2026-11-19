import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, LayoutList, Plus } from "lucide-react";
import { supabase, serviceSupabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SuccessModal } from "@/components/SuccessModal";
import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCategory, CAFE_PRODUCT_CATEGORIES } from "@/utils/inventory";
import { encodeProductDescription, extractProductImage, cleanProductDescription, getInstantProductThumbnail } from "@/services/foodImageApi";
import { useUserType } from "@/hooks/useUserType";
import { useProducts } from "@/hooks/useProducts";
import { useVendors } from "@/hooks/useVendors";
import type { Vendor } from "./Vendors";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StaffHeaderBadge } from "@/components/StaffHeaderBadge";
import {
  Product,
  QRToken,
  ProductFormData,
  getDateBounds,
} from "./products/types";
import {
  ProductFormDialog,
  ViewProductDialog,
  ProductQRBarcodeDialog,
  HSNCodeDialog,
} from "./products/modals";
import {
  CloudKitchenStats,
  ProductFilters,
  ProductGridCard,
  ProductTable,
} from "./products/components";

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

  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { isFoodKitchen, isCafe } = useUserType();
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

  const [formData, setFormData] = useState<ProductFormData>({
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
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrPrintStep, setQrPrintStep] = useState<'select' | 'preview'>('select');
  const [qrFormat, setQrFormat] = useState<'label' | 'a4'>('a4');
  const [printType, setQrPrintType] = useState<'both' | 'qr' | 'barcode'>('both');
  const [qrQuantity, setQrQuantity] = useState(1);
  const [showHSNDialog, setShowHSNDialog] = useState(false);

  const [viewProductDialog, setViewProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Helper to highlight matching search characters
  const highlightText = useCallback((text: string, search: string) => {
    if (!search.trim()) return <>{text}</>;
    try {
      const escapedSearch = search.replace(/[\\^$*+?.()|[\]{}/-]/g, '\\$&');
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
  }, [initialProductId, targetUserId, pageSize]);

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
    const base = isCafe
      ? [{ value: 'all', label: 'All Categories' }, ...CAFE_PRODUCT_CATEGORIES]
      : [
          { value: 'all', label: 'All Categories' },
          { value: 'general', label: 'General Items' },
          { value: 'it', label: 'IT & Software' },
          { value: 'hardware', label: 'Hardware & Electronics' },
          { value: 'consulting', label: 'Consulting & Professional Services' },
          { value: 'retail', label: 'Retail & E-commerce' },
          { value: 'others', label: 'Others' }
        ];
    const known = new Set(base.map(c => c.value.toLowerCase()));
    (products || []).forEach(p => {
      const raw = (p.category || '').trim();
      if (raw && !known.has(raw.toLowerCase())) {
        known.add(raw.toLowerCase());
        base.push({ value: raw, label: formatCategory(raw) });
      }
    });
    return base;
  }, [products, isCafe]);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user, currentPage, debouncedSearch, fetchProducts]);

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
        description: isCafe
          ? encodeProductDescription(formData.description?.trim() || '', formData.image_url?.trim() || getInstantProductThumbnail(formData.name.trim()))
          : (formData.description?.trim() || null),
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
      description: cleanProductDescription(product.description || ''),
      image_url: extractProductImage(product),
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

          <Button
            variant="default"
            size="lg"
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="w-full sm:w-auto h-11"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {isCloudKitchenUser && (
        <CloudKitchenStats totalSoldQuantity={totalSoldQuantity} />
      )}

      <ProductFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchLoading={searchLoading}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        availableCategories={availableCategories}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
      />

      {products.length === 0 ? (
        <Card className="flex flex-col items-center justify-center h-64 text-center p-4 md:p-8 bg-muted/20 border-border/40 rounded-xl border-dashed">
          <Package className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-bold text-foreground/60">No items found</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">Try adjusting your search filters or add a new premium item to your catalog.</p>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductGridCard
              key={product.id}
              product={product}
              searchTerm={searchTerm}
              highlightText={highlightText}
              formatProductPrice={formatProductPrice}
              getStockStatusBadge={getStockStatusBadge}
              onView={(p) => {
                setSelectedProduct(p);
                setViewProductDialog(true);
              }}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onOpenBarcode={(p) => {
                setSelectedProduct(p);
                setQrQuantity(Number(p.opening_stock || 1));
                setShowQRDialog(true);
                setQrPrintStep('select');
              }}
            />
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
        <ProductTable
          products={products}
          searchTerm={searchTerm}
          highlightText={highlightText}
          formatProductPrice={formatProductPrice}
          getStockStatusBadge={getStockStatusBadge}
          onView={(p) => {
            setSelectedProduct(p);
            setViewProductDialog(true);
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOpenBarcode={(p) => {
            setSelectedProduct(p);
            setQrQuantity(Number(p.opening_stock || 1));
            setShowQRDialog(true);
            setQrPrintStep('select');
          }}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          loading={loading}
        />
      )}

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onOpenHSNDialog={() => setShowHSNDialog(true)}
        vendors={vendors}
        currencySymbol={currencySymbol}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmDelete}
        title="Delete Product?"
        description="Are you sure you want to remove this product? This action cannot be undone and will affect future invoices referencing this item."
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onOpenChange={setShowSuccess}
        title={successInfo.title}
        message={successInfo.message}
      />

      {/* HSN Code Lookup Dialog */}
      <HSNCodeDialog
        open={showHSNDialog}
        onOpenChange={setShowHSNDialog}
        onSelectHSN={(code) => setFormData(prev => ({ ...prev, hsn_code: code }))}
      />

      {/* View Product Details Dialog */}
      <ViewProductDialog
        open={viewProductDialog}
        onOpenChange={setViewProductDialog}
        selectedProduct={selectedProduct}
        currencySymbol={currencySymbol}
        onEdit={handleEdit}
        onOpenBarcode={(p) => {
          setSelectedProduct(p);
          setQrQuantity(Number(p.opening_stock || 1));
          setShowQRDialog(true);
          setQrPrintStep('select');
        }}
      />

      {/* QR & Barcode Print Dialog */}
      <ProductQRBarcodeDialog
        open={showQRDialog}
        onOpenChange={setShowQRDialog}
        selectedProduct={selectedProduct}
        qrPrintStep={qrPrintStep}
        setQrPrintStep={setQrPrintStep}
        qrFormat={qrFormat}
        setQrFormat={setQrFormat}
        printType={printType}
        setQrPrintType={setQrPrintType}
        qrQuantity={qrQuantity}
        setQrQuantity={setQrQuantity}
      />
    </div>
  );
};

export default ProductsPage;
