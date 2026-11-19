import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { supabase, serviceSupabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Client, Product, Vendor, InvoiceItem, Invoice, PurchaseInvoice, Expense } from '@/types/invoice';
import { adjustStock, formatCategory } from '@/utils/inventory';
import { calculateItemAmount as calcItemAmount, generateInvoiceNumber as genInvNum } from '@/utils/invoice-helpers';
import { type HSNCode } from '@/types/hsn';
import { type InvoiceFormData } from '@/components/invoice/InvoiceHeader';
import { useCurrency } from "@/contexts/CurrencyContext";
import type { UncatalogedProductItem, IncompleteItem } from '@/components/invoice/UncatalogedProductsModal';
import { useUserType } from "@/hooks/useUserType";
import { encodeProductDescription, getInstantProductThumbnail, cleanProductDescription } from "@/services/foodImageApi";
import { kitchenService, broadcastKitchenSync } from "@/services/kitchenService";
// import hsnData from '@/data/hsnCodes.json'; // Removed static import for bundle optimization

export function useInvoiceForm(initialId?: string, onSaveSuccess?: () => void, isPurchaseOverride?: boolean) {
  const queryClient = useQueryClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<InvoiceFormData>({
    client_id: '',
    vendor_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    terms: 'Payment due within 30 days',
    status: 'draft',
    invoice_number: '',
    payment_method: 'cash'
  });
  const [cafeCustomerPhone, setCafeCustomerPhone] = useState<string>('');
  const [cafeCustomerName, setCafeCustomerName] = useState<string>('');
  const [cafeTable, setCafeTable] = useState<string>('Table 1');

  const [items, setItems] = useState<InvoiceItem[]>([
    { product_name: '', description: '', quantity: 0, rate: 0, discount: 0, tax_rate: 0, amount: 0 }
  ]);
  const [uncatalogedModalOpen, setUncatalogedModalOpen] = useState(false);
  const [uncatalogedItemsList, setUncatalogedItemsList] = useState<UncatalogedProductItem[]>([]);
  const [incompleteItemsList, setIncompleteItemsList] = useState<IncompleteItem[]>([]);

  const { user, effectiveUserId, isStaff, companyProfile, profile, staffName, currentUserName } = useAuth();
  const targetUserId = effectiveUserId || user?.id;
  const { toast } = useToast();
  const navigate = useNavigate();
  const { invoiceId: paramsId } = useParams<{ invoiceId?: string }>();
  // Use initialId if provided (for dialogs on list pages), otherwise use paramsId (for full pages)
  const invoiceId = initialId || paramsId;
  const location = useLocation();
  const [searchParams] = useState(() => new URLSearchParams(location.search));
  const { currencySymbol: globalCurrencySymbol, convertFromINR, convertToINR, inrPerUnit } = useCurrency();
  const symbolMap: Record<string, string> = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'DOLLAR': '$',
    'RUPEE': '₹',
    'EURO': '€',
    'POUND': '£'
  };

  const isEditing = Boolean(invoiceId);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [invoiceStatus, setInvoiceStatus] = useState<string>('draft');
  const [invoiceCurrency, setInvoiceCurrency] = useState<string>('INR');
  const [currencySymbol, setCurrencySymbol] = useState<string>(globalCurrencySymbol || '₹');

  useEffect(() => {
    if (!isEditing && globalCurrencySymbol) {
      setCurrencySymbol(globalCurrencySymbol);
    }
  }, [globalCurrencySymbol, isEditing]);

  const [isPurchase, setIsPurchase] = useState(() => isPurchaseOverride !== undefined ? isPurchaseOverride : (searchParams.get('type') === 'purchase' || location.pathname.includes('purchase')));
  const [isDownpayment, setIsDownpayment] = useState(() => 
    location.pathname.includes('downpayment') || searchParams.get('type') === 'downpayment'
  );

  const generateInvoiceNumber = useCallback(async () => {
    return await genInvNum(targetUserId, isPurchase, isDownpayment ? 'DP' : undefined);
  }, [targetUserId, isPurchase, isDownpayment]);

  // Auto-generate supplier bill sequence for Purchase Bills if empty
  useEffect(() => {
    if (!isEditing && isPurchase && !formData.invoice_number && targetUserId) {
      generateInvoiceNumber().then((autoNum) => {
        if (autoNum) {
          setFormData(prev => prev.invoice_number ? prev : { ...prev, invoice_number: autoNum });
        }
      });
    }
  }, [isEditing, isPurchase, targetUserId, generateInvoiceNumber]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState<boolean>(isEditing);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [newClientDialogOpen, setNewClientDialogOpen] = useState(false);
  const [newClientActiveTab, setNewClientActiveTab] = useState('basic');
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [newClientFormData, setNewClientFormData] = useState({
    name: '', email: '', phone: '', address: '', city: '',
    state: '', postal_code: '', country: 'India', gstin: '',
    hide_contact_details: false
  });
  const [creatingClient, setCreatingClient] = useState(false);
  const [hideCompanyDetails, setHideCompanyDetails] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const lastScannedCode = useRef<string | null>(null);
  const scanTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Product Selection/Creation State
  const [productSelectionOpen, setProductSelectionOpen] = useState(false);
  const [newProductDialogOpen, setNewProductDialogOpen] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [productCategory, setProductCategory] = useState("all");
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [newProductActiveTab, setNewProductActiveTab] = useState("basic");
  const [newProductFormData, setNewProductFormData] = useState({
    name: '', type: 'product', category: '', sales_price: '',
    price_with_tax: true, tax_rate: '18', unit: 'pcs',
    opening_stock: '', description: '',
    purchase_price: '', sku: '', discount: '',
    hsn_code: '', barcode: '', alternative_unit: '',
    as_of_date: new Date().toISOString().split('T')[0], low_stock_warning: false,
    vendor_id: '',
    image_url: ''
  });
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrPrintStep, setQrPrintStep] = useState<'select' | 'preview'>('select');
  const [qrFormat, setQrFormat] = useState<'label' | 'a4'>('a4');
  const [qrPrintType, setQrPrintType] = useState<'both' | 'qr' | 'barcode'>('both');
  const [qrQuantity, setQrQuantity] = useState(1);
  const [showHSNDialog, setShowHSNDialog] = useState(false);
  const [newVendorDialogOpen, setNewVendorDialogOpen] = useState(false);
  const [creatingVendor, setCreatingVendor] = useState(false);
  const [newVendorFormData, setNewVendorFormData] = useState({
    name: '', email: '', phone: '', address: '', city: '',
    state: '', postal_code: '', country: 'India', gstin: ''
  });
  const [billableExpenses, setBillableExpenses] = useState<Expense[]>([]);
  const [expenseSelectionOpen, setExpenseSelectionOpen] = useState(false);
  const [fetchingExpenses, setFetchingExpenses] = useState(false);
  const [hsnSearchQuery, setHsnSearchQuery] = useState("");
  const [hsnCodesData, setHsnCodesData] = useState<HSNCode[]>([]);

  // Lazy load HSN data only when the dialog is about to be shown
  useEffect(() => {
    if (showHSNDialog && hsnCodesData.length === 0) {
      const loadHSN = async () => {
        try {
          const module = await import('@/data/hsnCodes.json');
          setHsnCodesData(module.default as unknown as HSNCode[]);
        } catch (error) {
          console.error('Failed to load HSN codes:', error);
        }
      };
      loadHSN();
    }
  }, [showHSNDialog, hsnCodesData.length]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ title: string; message: string; invoiceId?: string; invoiceNumber?: string }>({ title: '', message: '' });
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const isDirty = useRef(false);

  // Totals calculation logic moved here
  const getTotals = useCallback(() => {
    const subtotal = Math.round(items.reduce((sum, item) => sum + (item.quantity * item.rate), 0) * 100) / 100;
    const discountAmount = Math.round(items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.rate;
      return sum + (itemSubtotal * item.discount) / 100;
    }, 0) * 100) / 100;
    const taxAmount = Math.round(items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.rate;
      const itemDiscountAmount = (itemSubtotal * item.discount) / 100;
      const itemAfterDiscount = itemSubtotal - itemDiscountAmount;
      return sum + (itemAfterDiscount * item.tax_rate) / 100;
    }, 0) * 100) / 100;
    const total = Math.round((subtotal - discountAmount + taxAmount) * 100) / 100;

    return { subtotal, discountAmount, taxAmount, total };
  }, [items]);

  const fetchUserSettings = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const clientToUse = serviceSupabase || supabase;
      const { data, error } = await clientToUse
        .from('user_settings')
        .select('hide_company_details, default_currency, default_payment_terms, default_terms')
        .eq('user_id', targetUserId)
        .maybeSingle();
      if (!error && data) {
        const s = data as unknown as {
          hide_company_details?: boolean;
          default_currency?: string;
          default_payment_terms?: string;
          default_terms?: string;
        };
        setHideCompanyDetails(s.hide_company_details || false);
        if (s.default_currency && !isEditing) {
          const curr = s.default_currency.trim();
          setInvoiceCurrency(curr);
          const mapped = symbolMap[curr.toUpperCase()] || symbolMap[curr];
          if (mapped) setCurrencySymbol(mapped);
        }
        if (!isEditing) {
          setFormData(prev => {
            const updates: Partial<InvoiceFormData> = {};
            let paymentDays = 30;
            if (s.default_payment_terms) {
              const match = s.default_payment_terms.match(/\d+/);
              if (match) {
                const days = parseInt(match[0], 10);
                if (!isNaN(days) && days >= 0) {
                  paymentDays = days;
                  const baseDate = prev.issue_date ? new Date(prev.issue_date) : new Date();
                  const due = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
                  updates.due_date = due.toISOString().split('T')[0];
                }
              }
            }
            if (s.default_terms && s.default_terms.trim()) {
              updates.terms = s.default_terms.trim();
            } else {
              updates.terms = paymentDays === 0 ? 'Payment due on receipt' : `Payment due within ${paymentDays} days`;
            }
            return { ...prev, ...updates };
          });
        }
      }
    } catch (e) {
      console.error('Error fetching user settings:', e);
    }
  }, [targetUserId, isEditing]);

  const fetchClients = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const clientToUse = serviceSupabase || supabase;
      const { data, error } = await clientToUse
        .from('clients')
        .select('*')
        .eq('user_id', targetUserId)
        .order('name', { ascending: true });

      if (error) throw error;
      const rawClients = (data as unknown as Client[]) || [];
      const uniqueClients: Client[] = [];
      const seenNames = new Set<string>();
      for (const c of rawClients) {
        const key = (c.name || '').trim().toLowerCase();
        if (key && !seenNames.has(key)) {
          seenNames.add(key);
          uniqueClients.push(c);
        } else if (!key) {
          uniqueClients.push(c);
        }
      }
      setClients(uniqueClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load clients."
      });
    }
  }, [targetUserId, toast]);

  const fetchVendors = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const clientToUse = serviceSupabase || supabase;
      const { data, error } = await clientToUse
        .from('vendors')
        .select('*')
        .eq('user_id', targetUserId)
        .order('name', { ascending: true });

      if (error) throw error;
      const rawVendors = (data as unknown as Vendor[]) || [];
      const uniqueVendors: Vendor[] = [];
      const seenNames = new Set<string>();
      for (const v of rawVendors) {
        const key = (v.name || '').trim().toLowerCase();
        if (key && !seenNames.has(key)) {
          seenNames.add(key);
          uniqueVendors.push(v);
        } else if (!key) {
          uniqueVendors.push(v);
        }
      }
      setVendors(uniqueVendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  }, [targetUserId]);

  const fetchProducts = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const clientToUse = serviceSupabase || supabase;
      const { data, error } = await clientToUse
        .from('products')
        .select('*')
        .eq('user_id', targetUserId)
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts((data as unknown as Product[]) || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load products."
      });
    } finally {
      setLoading(false);
    }
  }, [targetUserId, toast]);

  const fetchBillableExpenses = useCallback(async (clientId: string) => {
    if (!clientId || !targetUserId) return;
    setFetchingExpenses(true);
    try {
      const clientToUse = serviceSupabase || supabase;
      const { data, error } = await clientToUse
        .from('expenses')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('client_id', clientId)
        .eq('is_billable', true);

      if (error) throw error;
      setBillableExpenses((data as unknown as Expense[]) || []);
    } catch (error) {
      console.error('Error fetching billable expenses:', error);
    } finally {
      setFetchingExpenses(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    if (formData.client_id) {
      fetchBillableExpenses(formData.client_id);
    } else {
      setBillableExpenses([]);
    }
  }, [formData.client_id, fetchBillableExpenses]);

  useEffect(() => {
    if (targetUserId) {
      fetchClients();
      fetchVendors();
      fetchProducts();
      fetchUserSettings();
    }
  }, [targetUserId, fetchClients, fetchProducts, fetchUserSettings, fetchVendors]);

  // Sync cafe customer info when client_id changes
  useEffect(() => {
    if (formData.client_id && clients.length > 0) {
      const activeClient = clients.find(c => c.id === formData.client_id);
      if (activeClient) {
        if (!cafeCustomerName) setCafeCustomerName(activeClient.name);
        if (!cafeCustomerPhone && activeClient.phone) {
          setCafeCustomerPhone(activeClient.phone.replace(/\D/g, '').slice(-10));
        }
      }
    }
  }, [formData.client_id, clients]);

  // Enhancement for Cloud Kitchen (food_kitchen user type or Geeta): Pre-fill single Client and Product
  const { isFoodKitchen, isCafe } = useUserType();
  const isCloudKitchenUser = isFoodKitchen || 
    targetUserId === 'dddbc465-7743-42c6-88f0-039a4332711d' || 
    profile?.company_name?.toLowerCase().includes('geeta') || 
    companyProfile?.company_name?.toLowerCase().includes('geeta') ||
    user?.email === 'krishnayadav240225@gmail.com';

  const hasAutoFilledGeeta = useRef(false);

  useEffect(() => {
    if (!isEditing && !isPurchase && isCloudKitchenUser && !hasAutoFilledGeeta.current) {
      if (clients.length > 0 && products.length > 0) {
        hasAutoFilledGeeta.current = true;
        // 1. Pre-select client (Krishna Yadav or first client)
        const kitchenClient = clients.find(c => c.name?.toLowerCase().includes('krishna')) || clients[0];
        if (kitchenClient && !formData.client_id) {
          setFormData(prev => ({ ...prev, client_id: kitchenClient.id }));
        }

        // 2. Pre-fill product item (Biryani or first product)
        const kitchenProduct = products.find(p => p.name?.toLowerCase().includes('biryani')) || products[0];
        if (kitchenProduct) {
          const qty = 1;
          const rate = Number(kitchenProduct.price || 0);
          const disc = Number(kitchenProduct.discount || 0);
          const tax = Number(kitchenProduct.tax_rate || 0);
          const amt = calcItemAmount(qty, rate, disc, tax);

          setItems([
            {
              product_id: kitchenProduct.id,
              product_name: kitchenProduct.name,
              description: kitchenProduct.description || '',
              quantity: qty,
              rate: rate,
              discount: disc,
              tax_rate: tax,
              hsn_code: kitchenProduct.hsn_code || '',
              unit: kitchenProduct.unit || 'unit',
              amount: amt
            }
          ]);
        }
      }
    }
  }, [clients, products, isEditing, isPurchase, isCloudKitchenUser, formData.client_id]);

  // Load existing invoice if editing
  useEffect(() => {
    if (!isEditing || !invoiceId) return;

    const loadInvoice = async () => {
      setInvoiceLoading(true);
      try {
        const clientToUse = serviceSupabase || supabase;
        const table = isPurchase ? 'purchase_invoices' : 'invoices';
        const itemsTable = isPurchase ? 'purchase_invoice_items' : 'invoice_items';
        const foreignKey = 'invoice_id';

        const { data: invoiceData, error: invoiceError } = await clientToUse
          .from(table)
          .select('*')
          .eq('id', invoiceId)
          .maybeSingle();

        if (invoiceError) throw invoiceError;
        if (!invoiceData) throw new Error('Invoice not found');

        const typedInvoice = invoiceData as unknown as Invoice;
        const typedPurchase = invoiceData as unknown as PurchaseInvoice;

        const isDp = Boolean(
          typedInvoice.invoice_number?.startsWith('DP-') ||
          typedInvoice.invoice_number?.startsWith('DP') ||
          typedInvoice.notes?.includes('"is_downpayment":true')
        );
        if (isDp) {
          setIsDownpayment(true);
        }

        setInvoiceNumber(typedInvoice.invoice_number || null);
        setInvoiceStatus(typedInvoice.status || 'draft');
        const currentCurrency = typedInvoice.currency || 'INR';
        setInvoiceCurrency(currentCurrency);
        setCurrencySymbol(symbolMap[currentCurrency.toUpperCase()] || symbolMap[currentCurrency] || globalCurrencySymbol || '₹');

        setFormData({
          client_id: isPurchase ? '' : typedInvoice.client_id || '',
          issue_date: typedInvoice.issue_date?.split('T')[0] || new Date().toISOString().split('T')[0],
          due_date: typedInvoice.due_date ? (typedInvoice.due_date as string).split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: typedInvoice.notes || '',
          terms: typedInvoice.terms || (isPurchase ? 'Payment due as per terms' : 'Payment due within 30 days'),
          vendor_id: isPurchase ? (typedPurchase.vendor_id || '') : (typedInvoice.vendor_id || ''),
          status: typedInvoice.status || 'draft',
          invoice_number: typedInvoice.invoice_number || '',
          payment_method: 'cash'
        });

        const { data: itemsData, error: itemsError } = await clientToUse
          .from(itemsTable)
          .select('*, products(name, hsn_code)')
          .eq(foreignKey, invoiceId);

        if (itemsError) throw itemsError;

        if (itemsData && itemsData.length > 0) {
          setItems(
            (itemsData as unknown as Array<{
              id: string;
              product_id?: string;
              description?: string;
              quantity?: number;
              rate?: number;
              discount?: number;
              tax_rate?: number;
              amount?: number;
              hsn_code?: string;
              products?: { name: string; hsn_code?: string } | null;
            }>).map((item) => {
              const quantity = item.quantity || 0;
              const rate = item.rate || 0;
              const discount = item.discount || 0;
              const taxRate = item.tax_rate || 0;
              const subtotal = quantity * rate;
              const discountAmount = (subtotal * discount) / 100;
              const afterDiscount = subtotal - discountAmount;
              const taxAmount = (afterDiscount * taxRate) / 100;
              const computedAmount = afterDiscount + taxAmount;

              return {
                id: item.id,
                product_id: item.product_id || undefined,
                product_name: item.products?.name || '',
                name: item.products?.name || '',
                description: item.description || '',
                hsn_code: item.hsn_code || item.products?.hsn_code || '',
                quantity,
                rate,
                discount,
                tax_rate: taxRate,
                amount: typeof item.amount === 'number' ? item.amount : computedAmount
              };
            })
          );
        }
      } catch (error) {
        console.error('Error loading invoice:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load ${isPurchase ? 'bill' : 'invoice'} for editing.`
        });
        navigate(isPurchase ? '/purchase-invoices' : '/invoices');
      } finally {
        setInvoiceLoading(false);
      }
    };

    loadInvoice();
  }, [user, isEditing, invoiceId, toast, navigate, isPurchase]);

  const addItem = () => {
    setItems([...items, { product_name: '', description: '', quantity: 0, rate: 0, discount: 0, tax_rate: 0, amount: 0 }]);
    isDirty.current = true;
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    } else {
      setItems([{ product_name: '', description: '', quantity: 0, rate: 0, discount: 0, tax_rate: 0, amount: 0 }]);
    }
    isDirty.current = true;
  };

  const updateItemAmount = (index: number, field: keyof InvoiceItem, value: number) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === 'quantity' || field === 'rate' || field === 'discount' || field === 'tax_rate' || field === 'amount') {
      item[field] = value;
    } else if (field === 'description') {
      // should not happen with number value, but for type safety
    }

    if (field === 'quantity' || field === 'rate' || field === 'discount' || field === 'tax_rate') {
      item.amount = calcItemAmount(
        item.quantity,
        item.rate,
        item.discount,
        item.tax_rate
      );
    }

    newItems[index] = item;
    setItems(newItems);
    isDirty.current = true;
  };

  const applyProductToItem = useCallback((product: Product, index: number) => {
    const newItems = [...items];
    const baseInrRate = isPurchase ? (product.purchase_price || product.price) : product.price;
    const defaultRate = invoiceCurrency !== 'INR' ? convertFromINR(baseInrRate) : baseInrRate;
    newItems[index] = {
      ...newItems[index],
      product_id: product.id,
      product_name: product.name,
      name: product.name,
      description: product.description?.trim() ? cleanProductDescription(product.description) : '',
      hsn_code: product.hsn_code || newItems[index].hsn_code || '',
      rate: defaultRate,
      discount: typeof product.discount === 'number' ? product.discount : (parseFloat(String(product.discount)) || 0),
      tax_rate: product.tax_rate,
      amount: calcItemAmount(newItems[index].quantity, defaultRate, newItems[index].discount, product.tax_rate)
    };
    setItems(newItems);
    isDirty.current = true;
  }, [items, isPurchase, invoiceCurrency, convertFromINR]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientFormData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Client name is required."
      });
      return;
    }

    const cleanPhone = newClientFormData.phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9."
      });
      return;
    }

    if (newClientFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClientFormData.email.trim())) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid email address."
      });
      return;
    }

    setCreatingClient(true);
    try {
      const clientToUse = serviceSupabase || supabase;
      const { data, error } = await clientToUse
        .from('clients')
        .insert([{
          ...newClientFormData,
          name: newClientFormData.name.trim(),
          phone: cleanPhone,
          email: newClientFormData.email.trim(),
          user_id: targetUserId
        }])
        .select()
        .single();

      if (error) throw error;

      const newClient = data as unknown as Client;
      setClients(prev => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData(prev => ({ ...prev, client_id: newClient.id }));
      
      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      // Use toast instead of success modal to avoid navigating away from create invoice
      toast({
        title: "Client Created",
        description: `${newClient.name} has been added and selected.`
      });
      setNewClientDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create client. Please try again."
      });
    } finally {
      setCreatingClient(false);
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorFormData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Vendor name is required."
      });
      return;
    }

    const cleanPhone = newVendorFormData.phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9."
      });
      return;
    }

    if (newVendorFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newVendorFormData.email.trim())) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid email address."
      });
      return;
    }

    setCreatingVendor(true);
    try {
      const clientToUse = serviceSupabase || supabase;
      const { data, error } = await clientToUse
        .from('vendors')
        .insert([{
          ...newVendorFormData,
          name: newVendorFormData.name.trim(),
          phone: cleanPhone,
          email: newVendorFormData.email.trim(),
          user_id: targetUserId
        }])
        .select()
        .single();

      if (error) throw error;

      const newVendor = data as unknown as Vendor;
      setVendors(prev => [...prev, newVendor].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData(prev => ({ ...prev, vendor_id: newVendor.id }));

      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['vendors'] });

      // Use toast instead of success modal to avoid navigating away from create invoice
      toast({
        title: "Vendor Created",
        description: `${newVendor.name} has been added and selected.`
      });
      setNewVendorDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create vendor. Please try again."
      });
    } finally {
      setCreatingVendor(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductFormData.name || !newProductFormData.sales_price) return;

    setCreatingProduct(true);
    try {
      const clientToUse = serviceSupabase || supabase;
      const finalSku = newProductFormData.sku?.trim() || `ITM${Math.floor(100000 + Math.random() * 900000)}`;
      const stockQty = Math.max(0, Number(newProductFormData.opening_stock) || (isPurchase ? 1 : 0));

      const { data, error } = await clientToUse
        .from('products')
        .insert([{
          name: newProductFormData.name,
          price: Number(newProductFormData.sales_price),
          discount: Number(newProductFormData.discount) || 0,
          tax_rate: Number(newProductFormData.tax_rate),
          unit: newProductFormData.unit,
          category: newProductFormData.category ? formatCategory(newProductFormData.category) : 'General',
          type: newProductFormData.type,
          description: isCafe
            ? encodeProductDescription(newProductFormData.description || '', (newProductFormData as any).image_url?.trim() || getInstantProductThumbnail(newProductFormData.name.trim()))
            : (newProductFormData.description || ''),
          opening_stock: String(stockQty),
          purchase_price: Number(newProductFormData.purchase_price) || 0,
          sku: finalSku,
          hsn_code: newProductFormData.hsn_code,
          low_stock_warning: true,
          user_id: targetUserId
        }])
        .select()
        .single();

      if (error) throw error;

      const newProduct = data as unknown as Product;
      setProducts(prev => [...prev, newProduct].sort((a, b) => a.name.localeCompare(b.name)));

      // Auto-create initial QR tokens if stock is present
      if (newProduct?.id && finalSku && stockQty > 0) {
        try {
          const tokenCount = Math.min(Math.round(stockQty), 100);
          if (tokenCount > 0) {
            const newTokens = Array.from({ length: tokenCount }).map(() => ({
              product_id: newProduct.id,
              sku: finalSku,
              token: crypto.randomUUID(),
              status: 'active'
            }));
            await clientToUse.from('qr_tokens').insert(newTokens);
          }
        } catch (tokenErr) {
          console.warn('QR tokens generation error (non-fatal):', tokenErr);
        }
      }

      if (activeItemIndex !== null) {
        applyProductToItem(newProduct, activeItemIndex);
      }

      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['products'] });

      setNewProductDialogOpen(false);
    } catch (error) {
      console.error(error);
      isDirty.current = true;
    } finally {
      setCreatingProduct(false);
    }
  };

  const resolveProductId = useCallback((item: { product_id?: string | null; product_name?: string; description?: string }) => {
    if (item.product_id) return item.product_id;
    const searchName = (item.product_name || item.description || '').trim().toLowerCase();
    if (!searchName) return null;
    const matched = products.find(p =>
      p.name.toLowerCase() === searchName ||
      (p.sku && p.sku.toLowerCase() === searchName)
    );
    return matched ? matched.id : null;
  }, [products]);

  const autoCreateOrResolveProduct = useCallback(async (
    item: InvoiceItem,
    isPurchaseBill: boolean,
    confirmedUncatalogedList?: UncatalogedProductItem[]
  ): Promise<{ productId: string | null; isNewlyCreated: boolean; name: string }> => {
    const pId = item.product_id ?? null;
    const itemName = (item.product_name || item.description || '').trim();

    if (pId) {
      return { productId: pId, isNewlyCreated: false, name: itemName };
    }

    if (!itemName) {
      return { productId: null, isNewlyCreated: false, name: '' };
    }

    // 1. Check if already exists in products list by name or SKU
    const existing = products.find(p =>
      p.name.toLowerCase() === itemName.toLowerCase() ||
      (p.sku && p.sku.toLowerCase() === itemName.toLowerCase())
    );

    if (existing) {
      return { productId: existing.id, isNewlyCreated: false, name: existing.name };
    }

    // 2. Auto-create product in catalog
    try {
      const clientToUse = serviceSupabase || supabase;
      const itemRateInr = invoiceCurrency !== 'INR' ? convertToINR(item.rate) : item.rate;
      const pregenerated = confirmedUncatalogedList?.find(u => u.name.toLowerCase() === itemName.toLowerCase());
      let uniqueSku = pregenerated?.sku;
      if (!uniqueSku) {
        const existingSkus = new Set(products.map(p => (p.sku || '').toUpperCase()));
        let attempts = 0;
        do {
          const randDigits = Math.floor(100000 + Math.random() * 900000);
          uniqueSku = `ITM${randDigits}`;
          attempts++;
        } while (existingSkus.has(uniqueSku) && attempts < 50);
      }

      const itemQty = Math.max(0, Number(item.quantity) || 0);

      const productPayload = {
        user_id: targetUserId,
        name: itemName,
        description: item.description?.trim() || itemName,
        type: 'product',
        sku: uniqueSku,
        purchase_price: isPurchaseBill ? itemRateInr : 0,
        price: (pregenerated?.sales_price !== undefined && Number(pregenerated.sales_price) > 0) 
          ? (invoiceCurrency !== 'INR' ? convertToINR(Number(pregenerated.sales_price)) : Number(pregenerated.sales_price)) 
          : itemRateInr,
        discount: Number(item.discount) || 0,
        opening_stock: isPurchaseBill ? String(itemQty) : '0',
        tax_rate: Number(item.tax_rate) || 0,
        hsn_code: item.hsn_code || null,
        vendor_id: isPurchaseBill ? (formData.vendor_id || null) : null,
        unit: item.unit || 'pcs',
        category: isDownpayment ? 'Automobile' : isCafe ? 'Hot Beverages ☕' : 'General',
        low_stock_warning: true
      };

      const { data, error } = await clientToUse
        .from('products')
        .insert([productPayload])
        .select();

      if (error) {
        console.error('Error auto-creating product in database:', error);
        return { productId: null, isNewlyCreated: false, name: itemName };
      }

      if (data && data.length > 0) {
        const created = data[0] as unknown as Product;
        setProducts(prev => [...prev, created]);

        // Auto-generate active QR tokens if purchase bill with inward stock
        if (isPurchaseBill && created.id && uniqueSku && itemQty > 0) {
          try {
            const tokenCount = Math.min(Math.round(itemQty), 100);
            if (tokenCount > 0) {
              const newTokens = Array.from({ length: tokenCount }).map(() => ({
                product_id: created.id,
                sku: uniqueSku,
                token: crypto.randomUUID(),
                status: 'active'
              }));
              await clientToUse.from('qr_tokens').insert(newTokens);
            }
          } catch (tokErr) {
            console.warn('QR tokens generation notice:', tokErr);
          }
        }

        return { productId: created.id, isNewlyCreated: true, name: created.name };
      }
    } catch (e) {
      console.error('Exception auto-creating product:', e);
    }

    return { productId: null, isNewlyCreated: false, name: itemName };
  }, [products, invoiceCurrency, convertToINR, targetUserId, formData.vendor_id, isDownpayment]);

  const executeSave = async (confirmedUncataloged?: UncatalogedProductItem[]) => {
    setSaving(true);
    const { subtotal, discountAmount, taxAmount, total } = getTotals();
    const clientToUse = serviceSupabase || supabase;

    try {
      if (total <= 0) {
        toast({
          variant: "destructive",
          title: isPurchase ? "Invalid Purchase Bill Amount" : "Invalid Invoice Amount",
          description: `Total amount must be greater than ${currencySymbol}0. Please check item rates and quantities.`
        });
        setSaving(false);
        return;
      }

      if (!isEditing && isPurchase) {
        // Handle Purchase Bill Creation
        // Filter formData to avoid sending client_id and non-column fields to purchase_invoices
        const { client_id, payment_method, invoice_number: inputInvoiceNumber, ...purchaseFormData } = formData;
        const creatorName = isStaff
          ? (staffName || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Staff Member')
          : (companyProfile?.company_name || profile?.company_name || 'Company Owner');

        const finalInvoiceNumber = inputInvoiceNumber?.trim() || await generateInvoiceNumber();
        const finalStatus = formData.status || 'pending';

        const { data: rawPurchaseData, error: purchaseError } = await clientToUse
          .from('purchase_invoices')
          .insert([{
            ...purchaseFormData,
            user_id: targetUserId,
            invoice_number: finalInvoiceNumber,
            notes: purchaseFormData.notes?.trim() || `Created by: ${creatorName}`,
            terms: purchaseFormData.terms?.trim() || `Created by: ${creatorName}`,
            subtotal,
            discount_amount: discountAmount,
            tax_amount: taxAmount,
            total_amount: total,
            status: finalStatus,
            currency: invoiceCurrency || 'INR'
          }])
          .select('*')
          .single();

        if (purchaseError) throw purchaseError;
        const purchaseData = rawPurchaseData as unknown as PurchaseInvoice;

        let autoCreatedCount = 0;
        const autoCreatedNames: string[] = [];
        const resolvedItemsWithProduct = [];
        const newlyCreatedProductIds = new Set<string>();

        for (const item of items) {
          const { productId, isNewlyCreated, name } = await autoCreateOrResolveProduct(item, true, confirmedUncataloged);
          if (productId && isNewlyCreated) {
            newlyCreatedProductIds.add(productId);
            autoCreatedCount++;
            autoCreatedNames.push(name);
          }
          resolvedItemsWithProduct.push({
            item,
            productId
          });
        }

        const formattedPurchaseItems = resolvedItemsWithProduct.map(({ item, productId }) => ({
          invoice_id: purchaseData.id,
          product_id: productId,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          discount: item.discount,
          tax_rate: item.tax_rate,
          amount: calcItemAmount(item.quantity, item.rate, item.discount, item.tax_rate)
        }));

        const { error: piError } = await clientToUse
          .from('purchase_invoice_items')
          .insert(formattedPurchaseItems);

        if (piError) throw piError;

        // Increment stock for purchase items (only for existing products; newly created ones already have opening_stock set to the inward quantity)
        for (const { item, productId } of resolvedItemsWithProduct) {
          if (productId && item.quantity > 0 && !newlyCreatedProductIds.has(productId)) {
            await adjustStock(productId, item.quantity);
          }
        }

        // Record payment in payments table if bill was created as paid
        if (finalStatus === 'paid') {
          const methodLabel = (formData.payment_method || 'cash').toUpperCase();
          await clientToUse
            .from('payments')
            .insert([{
              amount: total,
              payment_date: formData.issue_date || new Date().toISOString().split('T')[0],
              payment_method: formData.payment_method || 'cash',
              purchase_invoice_id: purchaseData.id,
              user_id: targetUserId,
              notes: `Purchase Bill #${finalInvoiceNumber} paid via ${methodLabel} • Created by: ${creatorName}`
            }]);
          queryClient.invalidateQueries({ queryKey: ['payments'] });
        }

        let successMsg = `Purchase bill ${purchaseData.invoice_number} has been recorded.`;
        if (autoCreatedCount > 0) {
          successMsg += ` ${autoCreatedCount} new product${autoCreatedCount > 1 ? 's' : ''} (${autoCreatedNames.slice(0, 3).join(', ')}${autoCreatedNames.length > 3 ? '...' : ''}) automatically added to inventory catalog.`;
        }

        setSuccessInfo({
          title: "Purchase Bill Created",
          message: successMsg
        });
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        fetchProducts();
        
        setShowSuccess(true);
        return;
      }

      if (isEditing && invoiceId && isPurchase) {
        const { client_id, payment_method, invoice_number: inputInvoiceNumber, ...purchaseFormData } = formData;

        const updatePayload: Record<string, any> = {
          ...purchaseFormData,
          subtotal,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          total_amount: total,
          currency: invoiceCurrency || 'INR'
        };
        if (inputInvoiceNumber?.trim()) {
          updatePayload.invoice_number = inputInvoiceNumber.trim();
        }

        const { error: updateError } = await clientToUse
          .from('purchase_invoices')
          .update(updatePayload)
          .eq('id', invoiceId);

        if (updateError) throw updateError;

        // Stock Reconciliation for Purchase Bill edits
        const { data: oldItems } = await clientToUse
          .from('purchase_invoice_items')
          .select('product_id, quantity')
          .eq('invoice_id', invoiceId);

        if (oldItems) {
          for (const oldItem of (oldItems as unknown as { product_id: string, quantity: number }[])) {
            if (oldItem.product_id && oldItem.quantity > 0) {
              await adjustStock(oldItem.product_id, -oldItem.quantity);
            }
          }
        }

        await clientToUse
          .from('purchase_invoice_items')
          .delete()
          .eq('invoice_id', invoiceId);

        // Auto-create missing products or resolve existing ones
        const resolvedEditItems = [];
        const newlyCreatedEditProductIds = new Set<string>();

        for (const item of items) {
          const { productId, isNewlyCreated } = await autoCreateOrResolveProduct(item, true, confirmedUncataloged);
          if (productId && isNewlyCreated) {
            newlyCreatedEditProductIds.add(productId);
          }
          resolvedEditItems.push({
            item,
            productId
          });
        }

        const formattedItems = resolvedEditItems.map(({ item, productId }) => ({
          invoice_id: invoiceId,
          product_id: productId,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          discount: item.discount,
          tax_rate: item.tax_rate,
          amount: calcItemAmount(item.quantity, item.rate, item.discount, item.tax_rate)
        }));

        if (formattedItems.length > 0) {
          const { error: insertError } = await clientToUse
            .from('purchase_invoice_items')
            .insert(formattedItems);
          if (insertError) throw insertError;

          for (const { item, productId } of resolvedEditItems) {
            if (productId && item.quantity > 0 && !newlyCreatedEditProductIds.has(productId)) {
              await adjustStock(productId, item.quantity);
            }
          }
        }

        setSuccessInfo({
          title: "Purchase Bill Updated",
          message: invoiceNumber
            ? `Purchase bill ${invoiceNumber} has been successfully updated.`
            : "The purchase bill has been updated successfully."
        });

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        fetchProducts();

        setShowSuccess(true);
        isDirty.current = false;
        return;
      }

      if (isEditing && invoiceId && !isPurchase) {
        const { vendor_id, payment_method, client_id, due_date, status, ...restEditFormData } = formData;

        let notesToSave = restEditFormData.notes;
        if (isDownpayment && notesToSave && !notesToSave.includes('is_downpayment')) {
          notesToSave = `[META:{"is_downpayment":true}]\n${notesToSave}`.trim();
        }

        const allowedInvoiceStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
        const finalStatus = (invoiceStatus && allowedInvoiceStatuses.includes(invoiceStatus))
          ? invoiceStatus
          : (status && allowedInvoiceStatuses.includes(status) ? status : 'draft');

        const updatePayload: Record<string, any> = {
          ...restEditFormData,
          notes: notesToSave,
          due_date: due_date || null,
          subtotal,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          total_amount: total,
          status: finalStatus,
          currency: invoiceCurrency || 'INR'
        };

        if (client_id && client_id.trim()) {
          updatePayload.client_id = client_id.trim();
        }

        const { error: updateError } = await clientToUse
          .from('invoices')
          .update(updatePayload)
          .eq('id', invoiceId);

        if (updateError) throw updateError;

        // Stock Reconciliation for Edits: Refund old quantities first
        const { data: oldItems } = await clientToUse
          .from('invoice_items')
          .select('product_id, quantity')
          .eq('invoice_id', invoiceId);

        if (oldItems) {
          for (const oldItem of (oldItems as unknown as { product_id: string, quantity: number }[])) {
            if (oldItem.product_id && oldItem.quantity > 0) {
              await adjustStock(oldItem.product_id, oldItem.quantity);
            }
          }
        }

        const { error: deleteError } = await clientToUse
          .from('invoice_items')
          .delete()
          .eq('invoice_id', invoiceId);

        if (deleteError) throw deleteError;

        const resolvedEditSalesItems: { item: InvoiceItem; productId: string | null }[] = [];
        const newlyCreatedEditSalesProductIds = new Set<string>();

        for (const item of items) {
          const { productId, isNewlyCreated } = await autoCreateOrResolveProduct(item, false);
          if (productId && isNewlyCreated) {
            newlyCreatedEditSalesProductIds.add(productId);
          }
          resolvedEditSalesItems.push({ item, productId });
        }

        const formattedItems = resolvedEditSalesItems.map(({ item, productId }) => {
          const descToSave = cleanProductDescription((item.description || '').trim()) || item.product_name || 'Item';
          return {
            invoice_id: invoiceId,
            product_id: productId,
            description: descToSave,
            quantity: item.quantity,
            rate: item.rate,
            discount: item.discount,
            tax_rate: item.tax_rate,
            amount: calcItemAmount(item.quantity, item.rate, item.discount, item.tax_rate)
          };
        });

        if (formattedItems.length > 0) {
          const { error: insertError } = await clientToUse
            .from('invoice_items')
            .insert(formattedItems);

          if (insertError) throw insertError;

          // Deduct stock for the updated items (skip newly created products)
          for (const { item, productId } of resolvedEditSalesItems) {
            if (productId && item.quantity > 0 && !newlyCreatedEditSalesProductIds.has(productId)) {
              await adjustStock(productId, -item.quantity);
            }
          }
        }

        // (KOT creation intentionally removed on invoice edit to avoid duplicate tickets)

        setSuccessInfo({
          title: isDownpayment ? "Downpayment Receipt Updated" : "Invoice Updated",
          message: invoiceNumber
            ? `${isDownpayment ? 'Downpayment receipt' : 'Invoice'} ${invoiceNumber} has been successfully updated.`
            : `The ${isDownpayment ? 'downpayment receipt' : 'invoice'} has been updated successfully.`
        });

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        fetchProducts();

        setShowSuccess(true);
        isDirty.current = false;
        return;
      } else if (!isPurchase) {
        let attempts = 0;
        const maxAttempts = 5;
        let invoiceData = null;
        let tokenForKot = '';
        const creatorName = isStaff
          ? (staffName || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Staff Member')
          : (companyProfile?.company_name || profile?.company_name || 'Company Owner');

        while (attempts < maxAttempts) {
          const newInvoiceNumber = await genInvNum(targetUserId, false, isDownpayment ? 'DP' : undefined);

          const { vendor_id, payment_method, client_id, due_date, status, ...restFormData } = formData;

          const cleanClientId = (client_id || '').trim();
          if (!cleanClientId) {
            throw new Error("Please select or add a client before saving the invoice.");
          }

          let notesToSave = restFormData.notes || '';
          if (isCafe && !isPurchase) {
            // Derive Token directly from invoice sequence number so Kitchen and Invoice match 100%
            const numDigits = (newInvoiceNumber || '').replace(/\D/g, '');
            tokenForKot = numDigits ? String(parseInt(numDigits, 10)).padStart(2, '0') : kitchenService.getNextTokenNumber();
            if (!notesToSave.includes('[Token:')) {
              notesToSave = `[Token: ${tokenForKot}][KDS:in_progress] ${notesToSave}`.trim();
            }
          }
          if (isDownpayment && !notesToSave.includes('is_downpayment')) {
            notesToSave = `[META:{"is_downpayment":true}]\n${notesToSave}`.trim();
          }

          const allowedInvoiceStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
          // Cafe POS bills are counter-paid upon order; strictly default to 'paid'
          const finalStatus = isCafe
            ? ((status && status !== 'draft' && allowedInvoiceStatuses.includes(status)) ? status : 'paid')
            : ((status && allowedInvoiceStatuses.includes(status)) ? status : 'draft');

          const { data: currentInvoiceData, error: invoiceError } = await clientToUse
            .from('invoices')
            .insert([{
              ...restFormData,
              client_id: cleanClientId,
              notes: notesToSave,
              user_id: targetUserId,
              invoice_number: newInvoiceNumber,
              payment_terms: isDownpayment
                ? `Downpayment • Created by: ${creatorName}`
                : `Created by: ${creatorName}`,
              terms: restFormData.terms || (isDownpayment ? 'Vehicle Booking Advance & Downpayment Receipt' : null),
              due_date: due_date || null,
              subtotal,
              discount_amount: discountAmount,
              tax_amount: taxAmount,
              total_amount: total,
              status: finalStatus,
              currency: invoiceCurrency || 'INR'
            }])
            .select('*')
            .maybeSingle();

          if (invoiceError) {
            if (invoiceError.code === '23505' || invoiceError.message.includes('invoice_number')) {
              attempts++;
              if (attempts >= maxAttempts) {
                throw new Error("Unable to generate a unique invoice number. Please try again.");
              }
              continue;
            }
            throw invoiceError;
          }

          invoiceData = currentInvoiceData as unknown as Invoice;
          break;
        }

        if (!invoiceData) {
          throw new Error("Failed to create invoice after retries.");
        }

        // Filter out blank / zero-quantity items so phantom rows are never saved
        const activeInvoiceItems = items.filter(it => (it.product_name?.trim() || it.description?.trim()) && Number(it.quantity) > 0);
        if (activeInvoiceItems.length === 0) {
          throw new Error("Please add at least one item with a valid name and quantity.");
        }

        // Auto-create missing products or resolve existing ones (for Sales & Downpayment)
        const resolvedSalesItems: { item: InvoiceItem; productId: string | null }[] = [];
        const newlyCreatedSalesProductIds = new Set<string>();

        for (const item of activeInvoiceItems) {
          const { productId, isNewlyCreated } = await autoCreateOrResolveProduct(item, false, confirmedUncataloged);
          if (productId && isNewlyCreated) {
            newlyCreatedSalesProductIds.add(productId);
          }
          resolvedSalesItems.push({ item, productId });
        }

        const formattedItems = resolvedSalesItems.map(({ item, productId }) => {
          const descToSave = (item.description || '').trim() || item.product_name || 'Item';
          return {
            invoice_id: (invoiceData as Invoice).id,
            product_id: productId,
            description: descToSave,
            quantity: item.quantity,
            rate: item.rate,
            discount: item.discount,
            tax_rate: item.tax_rate,
            amount: calcItemAmount(item.quantity, item.rate, item.discount, item.tax_rate)
          };
        });

        if (formattedItems.length > 0) {
          const { error: itemsError } = await clientToUse
            .from('invoice_items')
            .insert(formattedItems);

          if (itemsError) throw itemsError;

          // Deduct stock only for existing (pre-existing) products
          for (const { item, productId } of resolvedSalesItems) {
            if (productId && item.quantity > 0 && !newlyCreatedSalesProductIds.has(productId)) {
              await adjustStock(productId, -item.quantity);
            }
          }
        }

        // Record payment in payments table if sales invoice was created as paid (e.g. Cafe POS sale)
        const finalSalesStatus = (isCafe && formData.status) ? formData.status : (formData.status || 'draft');
        if (finalSalesStatus === 'paid') {
          const methodLabel = (formData.payment_method || 'cash').toUpperCase();
          try {
            await clientToUse
              .from('payments')
              .insert([{
                amount: total,
                payment_date: formData.issue_date || new Date().toISOString().split('T')[0],
                payment_method: formData.payment_method || 'cash',
                invoice_id: (invoiceData as Invoice).id,
                user_id: targetUserId,
                notes: `Sales Invoice #${(invoiceData as Invoice).invoice_number} paid via ${methodLabel} • Created by: ${creatorName}`
              }]);
            queryClient.invalidateQueries({ queryKey: ['payments'] });
          } catch (payErr) {
            console.warn('Could not record sales payment entry:', payErr);
          }
        }

        // Auto-generate Kitchen Order Ticket (KOT) for Cafe users
        if (isCafe && !isPurchase) {
          try {
            const kotItems = activeInvoiceItems.map(it => ({
              name: it.product_name || cleanProductDescription(it.description) || 'Cafe Item',
              quantity: Number(it.quantity) || 1,
              notes: it.description && it.description !== it.product_name ? cleanProductDescription(it.description) : undefined,
              rate: Number(it.rate) || 0,
              amount: (Number(it.quantity) || 1) * (Number(it.rate) || 0)
            }));
            const numDigits = ((invoiceData as Invoice).invoice_number || '').replace(/\D/g, '');
            const tokenNo = numDigits ? String(parseInt(numDigits, 10)).padStart(2, '0') : (tokenForKot || '01');
            const activeCustomer = clients.find(c => c.id === (formData.client_id || (invoiceData as Invoice).client_id));
            const cleanKitchenNotes = (formData.notes || '')
              .replace(/\[Order: [^\]]+\]\s*/g, '')
              .replace(/\[Token: [^\]]+\]\s*/g, '')
              .replace(/\[KDS: [^\]]+\]\s*/g, '')
              .trim();
            const createdKotOrder = kitchenService.addOrder({
              orderNumber: (invoiceData as Invoice).invoice_number,
              tokenNumber: tokenNo,
              tableName: cafeTable || (formData.client_id ? 'Dine-In' : 'Takeaway'),
              customerName: cafeCustomerName || activeCustomer?.name || 'Customer',
              customerMobile: cafeCustomerPhone || activeCustomer?.phone || undefined,
              items: kotItems,
              totalAmount: total,
              paymentMode: formData.payment_method || 'Cash',
              notes: cleanKitchenNotes || undefined,
              invoiceId: (invoiceData as Invoice).id
            });
            broadcastKitchenSync({
              action: 'new_order',
              order: createdKotOrder,
              orderId: (invoiceData as Invoice).id,
              invoiceId: (invoiceData as Invoice).id,
              orderNumber: (invoiceData as Invoice).invoice_number,
              status: 'active',
              notes: (invoiceData as Invoice).notes,
              userId: targetUserId
            });
          } catch (kotErr) {
            console.warn('Could not auto-generate kitchen order:', kotErr);
          }
        }

        setSuccessInfo({
          title: isDownpayment ? "Downpayment Receipt Created" : "Invoice Created",
          message: `${isDownpayment ? 'Downpayment receipt' : 'Invoice'} ${(invoiceData as Invoice).invoice_number} has been generated successfully.`,
          invoiceId: (invoiceData as Invoice).id,
          invoiceNumber: (invoiceData as Invoice).invoice_number
        });

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        fetchProducts();

        setShowSuccess(true);

        try {
          await clientToUse.from('notifications').insert({
            user_id: user?.id,
            title: 'Invoice Created',
            message: `New invoice #${(invoiceData as Invoice).invoice_number} has been created successfully.`,
            type: 'success'
          });
        } catch {}
      }
    } catch (error) {
      console.error('Error saving invoice:', error);

      let errorMessage = "An unexpected error occurred.";
      const errObj = error as Record<string, unknown>;
      const rawMsg = (error instanceof Error ? error.message : (errObj?.message as string)) || "";
      const details = (errObj?.details as string) || "";
      const hint = (errObj?.hint as string) || "";
      const code = (errObj?.code as string) || "";

      if (rawMsg.includes('unique constraint') || rawMsg.includes('duplicate key') || code === '23505' || rawMsg.includes('invoice_number_key')) {
        errorMessage = isPurchase
          ? "Duplicate Bill Number: A purchase bill with this number already exists. Please change or regenerate the bill number."
          : "Duplicate Invoice Number: An invoice with this number already exists. Please change or regenerate the invoice number.";
      } else if (rawMsg.includes('foreign key constraint') || code === '23503') {
        if (rawMsg.includes('client')) {
          errorMessage = "Selected client not found in the database. Please re-select the client.";
        } else if (rawMsg.includes('vendor')) {
          errorMessage = "Selected vendor not found in the database. Please re-select the vendor.";
        } else {
          errorMessage = "A linked reference (Client/Vendor/Product) is invalid. Please check selected details.";
        }
      } else if (rawMsg.includes('JWT') || rawMsg.includes('permission denied') || rawMsg.includes('row-level security') || code === '42501' || rawMsg.includes('406') || rawMsg.includes('403')) {
        errorMessage = "Permission issue: Please check your staff permissions or refresh the page.";
      } else if (rawMsg.includes('null value in column') || code === '23502') {
        const colMatch = rawMsg.match(/column "(.*?)"/);
        const colName = colMatch ? colMatch[1].replace(/_/g, ' ') : 'required field';
        errorMessage = `Required field missing: Please provide a value for "${colName}".`;
      } else if (rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError') || rawMsg.includes('network')) {
        errorMessage = "Network error: Please check your internet connection and try again.";
      } else if (rawMsg) {
        errorMessage = details && details !== 'null' ? `${rawMsg} (${details})` : rawMsg;
        if (hint && hint !== 'null') errorMessage += ` - Hint: ${hint}`;
      }

      toast({
        variant: "destructive",
        title: isEditing ? (isPurchase ? "Purchase Bill Update Failed" : "Invoice Update Failed") : (isPurchase ? "Purchase Bill Creation Failed" : "Invoice Creation Failed"),
        description: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = useCallback(() => {
    setItems([{ product_name: '', description: '', quantity: 0, rate: 0, discount: 0, tax_rate: 0, amount: 0 }]);
    setCafeCustomerPhone('');
    setCafeCustomerName('');
    setCafeTable('Table 1');
    setFormData(prev => ({
      ...prev,
      client_id: '',
      vendor_id: '',
      notes: '[Order: Table 1]',
      status: 'paid',
      payment_method: 'cash'
    }));
    setShowValidationErrors(false);
    generateInvoiceNumber().then(num => {
      if (num) {
        setFormData(prev => ({ ...prev, invoice_number: num }));
      }
    });
  }, [generateInvoiceNumber]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setShowValidationErrors(true);
    const clientToUse = serviceSupabase || supabase;

    // Strict validation for Cafe POS: Mobile Number & Name are compulsory
    if (isCafe && !isPurchase) {
      const cleanPhone = (cafeCustomerPhone || '').replace(/\D/g, '').slice(-10);
      const customerName = (cafeCustomerName || '').trim();

      if (!cleanPhone || cleanPhone.length !== 10) {
        toast({
          variant: "destructive",
          title: "Customer Mobile Number Required",
          description: "Please enter a valid 10-digit customer mobile number before completing the bill."
        });
        return;
      }

      if (!customerName || customerName.toLowerCase() === 'walk-in guest') {
        toast({
          variant: "destructive",
          title: "Customer Name Required",
          description: "Please enter the customer name before completing the bill."
        });
        return;
      }
    }

    if (!isPurchase && !formData.client_id) {
      if (isCafe) {
        try {
          const cleanPhone = (cafeCustomerPhone || '').replace(/\D/g, '').slice(-10);
          const customerName = (cafeCustomerName || '').trim();

          // Auto-resolve existing client by 10-digit phone
          const matchedClient = clients.find(c => {
            if (cleanPhone && c.phone) {
              return c.phone.replace(/\D/g, '').slice(-10) === cleanPhone;
            }
            return false;
          });

          let resolvedId = matchedClient?.id;

          // If client exists, update name if needed
          if (matchedClient && customerName && matchedClient.name !== customerName) {
            void clientToUse
              .from('clients')
              .update({ name: customerName })
              .eq('id', matchedClient.id);
          }

          if (!resolvedId) {
            const { data: newClientData, error: clientErr } = await clientToUse
              .from('clients')
              .insert([{
                user_id: targetUserId,
                name: customerName,
                phone: cleanPhone
              }])
              .select()
              .single();

            if (!clientErr && newClientData) {
              const createdClient = newClientData as unknown as Client;
              resolvedId = createdClient.id;
              queryClient.invalidateQueries({ queryKey: ['clients'] });
            }
          }

          if (resolvedId) {
            formData.client_id = resolvedId;
            setFormData(prev => ({ ...prev, client_id: resolvedId }));
          }
        } catch (clientResolveErr) {
          console.warn('Could not auto-resolve cafe client:', clientResolveErr);
        }
      }

      if (!formData.client_id) {
        toast({
          variant: "destructive",
          title: "Client Required",
          description: "Please select or add a client for this invoice."
        });
        return;
      }
    }

    if (isPurchase && !formData.vendor_id) {
      toast({
        variant: "destructive",
        title: "Vendor Required",
        description: "Please select or add a vendor for this purchase bill."
      });
      return;
    }

    if (!items || items.length === 0 || items.every(item => !item.description?.trim() && !item.product_name?.trim())) {
      toast({
        variant: "destructive",
        title: "Item Details Missing",
        description: "Please add at least one item or product with a name/description."
      });
      return;
    }

    if (isPurchase) {
      const incomplete: IncompleteItem[] = [];
      const uncataloged: UncatalogedProductItem[] = [];
      const existingSkus = new Set(products.map(p => (p.sku || '').toUpperCase()));

      items.forEach((item, index) => {
        const itemNumber = index + 1;
        const name = (item.product_name || item.description || '').trim();
        const hasSomeValue = (item.rate && Number(item.rate) > 0) || (item.quantity && Number(item.quantity) > 0) || Boolean(item.product_id);

        if (!name) {
          if (hasSomeValue) {
            incomplete.push({
              index: itemNumber,
              issue: "Product name ya description missing hai."
            });
          }
          return;
        }

        const qty = Number(item.quantity);
        if (isNaN(qty) || qty <= 0) {
          incomplete.push({
            index: itemNumber,
            issue: `"${name}" ki quantity kam se kam 1 honi chahiye.`
          });
          return;
        }

        // Check if product exists in catalog
        let exists = false;
        if (item.product_id) {
          exists = products.some(p => p.id === item.product_id);
        }
        if (!exists) {
          const match = products.find(p =>
            p.name.toLowerCase() === name.toLowerCase() ||
            (p.sku && p.sku.toLowerCase() === name.toLowerCase())
          );
          if (match) exists = true;
        }

        if (!exists) {
          let uniqueSku = '';
          let attempts = 0;
          do {
            const randDigits = Math.floor(100000 + Math.random() * 900000);
            uniqueSku = `ITM${randDigits}`;
            attempts++;
          } while (existingSkus.has(uniqueSku) && attempts < 50);
          existingSkus.add(uniqueSku);

          uncataloged.push({
            index: itemNumber,
            name,
            quantity: qty,
            rate: Number(item.rate) || 0,
            tax_rate: Number(item.tax_rate) || 0,
            sku: uniqueSku,
            unit: item.unit || 'pcs'
          });
        }
      });

      if (incomplete.length > 0 || uncataloged.length > 0) {
        setIncompleteItemsList(incomplete);
        setUncatalogedItemsList(uncataloged);
        setUncatalogedModalOpen(true);
        return;
      }
    }

    const invalidItem = items.find(item => (item.description || item.product_name) && (isNaN(item.quantity) || item.quantity <= 0));
    if (invalidItem) {
      toast({
        variant: "destructive",
        title: "Invalid Item Quantity",
        description: `Quantity for "${invalidItem.description || invalidItem.product_name || 'item'}" must be at least 1.`
      });
      return;
    }

    await executeSave();
  };

  const handleUpdateSalesPrice = useCallback((index: number, salesPrice: number) => {
    setUncatalogedItemsList(prev => prev.map(item => item.index === index ? { ...item, sales_price: salesPrice } : item));
  }, []);

  const confirmAndSavePurchaseBill = async () => {
    setUncatalogedModalOpen(false);
    await executeSave(uncatalogedItemsList);
  };

  const handleScan = useCallback((data: string) => {
    if (data === lastScannedCode.current) return;

    lastScannedCode.current = data;
    if (scanTimeout.current) clearTimeout(scanTimeout.current);
    scanTimeout.current = setTimeout(() => {
      lastScannedCode.current = null;
    }, 2000);

    const product = products.find(p => p.sku === data || p.id === data);
    if (product) {
      const existingItemIndex = items.findIndex(item => item.product_id === product.id);
      if (existingItemIndex !== -1) {
        const newItems = [...items];
        newItems[existingItemIndex].quantity += 1;
        newItems[existingItemIndex].amount = calcItemAmount(
          newItems[existingItemIndex].quantity,
          newItems[existingItemIndex].rate,
          newItems[existingItemIndex].discount,
          newItems[existingItemIndex].tax_rate
        );
        setItems(newItems);
      } else {
        const emptyIndex = items.findIndex(item => !item.product_name && !item.description && item.quantity === 0);
        if (emptyIndex !== -1) {
          applyProductToItem(product, emptyIndex);
          const scannedRate = invoiceCurrency !== 'INR' ? convertFromINR(product.price) : product.price;
          const newItems = [...items];
          newItems[emptyIndex].quantity = 1;
          newItems[emptyIndex].amount = calcItemAmount(1, scannedRate, 0, product.tax_rate);
          setItems(newItems);
        } else {
          const scannedRate = invoiceCurrency !== 'INR' ? convertFromINR(product.price) : product.price;
          setItems([...items, {
            product_id: product.id,
            product_name: product.name,
            name: product.name,
            description: product.description?.trim() ? cleanProductDescription(product.description) : '',
            hsn_code: product.hsn_code || '',
            quantity: 1,
            rate: scannedRate,
            discount: 0,
            tax_rate: product.tax_rate,
            amount: scannedRate
          }]);
        }
      }

      setIsScannerOpen(false);
      toast({
        title: "Product Added",
        description: `${product.name} added to invoice.`
      });
    } else {
      toast({
        variant: "destructive",
        title: "Product Not Found",
        description: `No product found with SKU: ${data}`
      });
    }
  }, [products, items, setIsScannerOpen, toast, applyProductToItem]);

  const updateModalQuantity = useCallback((productId: string, delta: number) => {
    setSelectedQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + delta)
    }));
  }, []);

  const addExpenseToInvoice = useCallback((expense: Expense) => {
    const newItems = [...items];
    const emptyIndex = newItems.findIndex(item => !item.description && item.quantity === 0);

    const expenseItem = {
      description: expense.title,
      quantity: 1,
      rate: Number(expense.amount),
      discount: 0,
      tax_rate: 0,
      amount: Number(expense.amount)
    };

    if (emptyIndex !== -1) {
      newItems[emptyIndex] = expenseItem;
    } else {
      newItems.push(expenseItem);
    }

    setItems(newItems);
    setExpenseSelectionOpen(false);
    isDirty.current = true;
    toast({
      title: "Expense Added",
      description: `${expense.title} added to invoice.`
    });
  }, [items, toast]);

  const handleBulkAdd = useCallback(() => {
    const itemsToAdd = Object.entries(selectedQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const product = products.find(p => p.id === id);
        if (!product) return null;
        const baseInrRate = isPurchase ? (product.purchase_price || product.price) : product.price;
        const defaultRate = invoiceCurrency !== 'INR' ? convertFromINR(baseInrRate) : baseInrRate;
        return {
          product_id: product.id,
          product_name: product.name,
          name: product.name,
          description: product.description?.trim() ? product.description : '',
          hsn_code: product.hsn_code || '',
          quantity: qty,
          rate: defaultRate,
          discount: 0,
          tax_rate: product.tax_rate,
          amount: calcItemAmount(qty, defaultRate, 0, product.tax_rate)
        };
      })
      .filter(Boolean) as InvoiceItem[];

    if (itemsToAdd.length > 0) {
      const isInitialState = items.length === 1 && !items[0].product_id && items[0].quantity === 0;
      if (isInitialState) {
        setItems(itemsToAdd);
      } else {
        setItems([...items, ...itemsToAdd]);
      }
      setSelectedQuantities({});
      setProductSelectionOpen(false);
      isDirty.current = true;
      toast({
        title: "Products Added",
        description: `Added ${itemsToAdd.length} products to invoice.`
      });
    } else if (activeItemIndex !== null) {
      setProductSelectionOpen(false);
    }
  }, [selectedQuantities, products, items, activeItemIndex, isPurchase, toast]);

  const handleProductSelect = useCallback((product: Product) => {
    if (activeItemIndex !== null) {
      applyProductToItem(product, activeItemIndex);
    } else {
      // Bulk mode - add a new item or increment existing one
      const baseInrRate = isPurchase ? (product.purchase_price || product.price) : product.price;
      const defaultRate = invoiceCurrency !== 'INR' ? convertFromINR(baseInrRate) : baseInrRate;
      const newItem = {
        product_id: product.id,
        product_name: product.name,
        name: product.name,
        description: product.description?.trim() ? product.description : '',
        hsn_code: product.hsn_code || '',
        quantity: 1,
        rate: defaultRate,
        discount: typeof product.discount === 'number' ? product.discount : 0,
        tax_rate: product.tax_rate,
        amount: calcItemAmount(1, defaultRate, typeof product.discount === 'number' ? product.discount : 0, product.tax_rate)
      };

      setItems(prevItems => {
        const existingIndex = prevItems.findIndex(item => item.product_id === product.id);
        if (existingIndex !== -1) {
          const updated = [...prevItems];
          updated[existingIndex].quantity += 1;
          updated[existingIndex].amount = calcItemAmount(
            updated[existingIndex].quantity,
            updated[existingIndex].rate,
            updated[existingIndex].discount,
            updated[existingIndex].tax_rate
          );
          return updated;
        }
        return [...prevItems, newItem];
      });
    }
    setProductSelectionOpen(false);
    setActiveItemIndex(null);
  }, [activeItemIndex, applyProductToItem, setItems]);

  return {
    clients, products, vendors, loading, saving, formData, setFormData,
    items, setItems, invoiceNumber, invoiceStatus, invoiceCurrency,
    isPurchase, setIsPurchase, isDownpayment, setIsDownpayment, invoiceLoading, clientSearchOpen, setClientSearchOpen,
    newClientDialogOpen, setNewClientDialogOpen, newClientActiveTab, setNewClientActiveTab,
    isDetailsExpanded, setIsDetailsExpanded, newClientFormData, setNewClientFormData,
    creatingClient, hideCompanyDetails, setHideCompanyDetails, isScannerOpen, setIsScannerOpen,
    productSelectionOpen, setProductSelectionOpen, newProductDialogOpen, setNewProductDialogOpen,
    activeItemIndex, setActiveItemIndex, productSearchQuery, setProductSearchQuery,
    selectedQuantities, setSelectedQuantities, productCategory, setProductCategory,
    creatingProduct, newProductActiveTab, setNewProductActiveTab, newProductFormData, setNewProductFormData,
    showQRDialog, setShowQRDialog, qrPrintStep, setQrPrintStep, qrFormat, setQrFormat,
    qrPrintType, setQrPrintType, qrQuantity, setQrQuantity, showHSNDialog, setShowHSNDialog,
    billableExpenses, expenseSelectionOpen, setExpenseSelectionOpen, fetchingExpenses,
    hsnSearchQuery, setHsnSearchQuery, hsnCodesData, showSuccess, setShowSuccess,
    successInfo, isDirty, handleSubmit, handleCreateClient, handleCreateVendor, handleCreateProduct,
    addItem, removeItem, updateItemAmount, applyProductToItem, getTotals, isEditing,
    invoiceId, user, navigate, handleScan, handleBulkAdd, updateModalQuantity,
    addExpenseToInvoice, handleProductSelect, currencySymbol,
    newVendorDialogOpen, setNewVendorDialogOpen, creatingVendor, newVendorFormData, setNewVendorFormData,
    showValidationErrors, inrPerUnit, setInvoiceCurrency,
    uncatalogedModalOpen, setUncatalogedModalOpen, uncatalogedItemsList, incompleteItemsList, confirmAndSavePurchaseBill, handleUpdateSalesPrice,
    cafeCustomerPhone, setCafeCustomerPhone,
    cafeCustomerName, setCafeCustomerName,
    cafeTable, setCafeTable,
    resetForm
  };
}
