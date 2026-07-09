import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Client, Product, Vendor, InvoiceItem, Invoice, PurchaseInvoice, Expense } from '@/types/invoice';
import { adjustStock } from '@/utils/inventory';
import { calculateItemAmount as calcItemAmount, generateInvoiceNumber as genInvNum } from '@/utils/invoice-helpers';
import { type HSNCode } from '@/types/hsn';
import { type InvoiceFormData } from '@/components/invoice/InvoiceHeader';
// import hsnData from '@/data/hsnCodes.json'; // Removed static import for bundle optimization

const getProductPrice = (product: Product): number => Number(product.price ?? product.rate ?? 0);

export function useInvoiceForm(initialId?: string, onSaveSuccess?: () => void) {
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
    status: 'paid'
  });
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 0, rate: 0, discount: 0, tax_rate: 0, amount: 0 }
  ]);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { invoiceId: paramsId } = useParams<{ invoiceId?: string }>();
  // Use initialId if provided (for dialogs on list pages), otherwise use paramsId (for full pages)
  const invoiceId = initialId || paramsId;
  const location = useLocation();
  const [searchParams] = useState(() => new URLSearchParams(location.search));
  const isEditing = Boolean(invoiceId);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [invoiceStatus, setInvoiceStatus] = useState<string>('draft');
  const [invoiceCurrency, setInvoiceCurrency] = useState<string>('INR');
  const [currencySymbol, setCurrencySymbol] = useState<string>('₹');
  const [isPurchase, setIsPurchase] = useState(() => searchParams.get('type') === 'purchase');
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
    vendor_id: ''
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
  const [successInfo, setSuccessInfo] = useState({ title: '', message: '' });
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
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('hide_company_details')
        .eq('user_id', user?.id)
        .single();
      if (!error && data) {
        setHideCompanyDetails((data as unknown as { hide_company_details: boolean }).hide_company_details || false);
      }
    } catch (e) {
      console.error('Error fetching user settings:', e);
    }
  }, [user]);

  const fetchClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setClients((data as unknown as Client[]) || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load clients."
      });
    }
  }, [toast]);

  const fetchVendors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setVendors((data as unknown as Vendor[]) || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
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
  }, [toast]);

  const fetchBillableExpenses = useCallback(async (clientId: string) => {
    if (!clientId) return;
    setFetchingExpenses(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user?.id)
        .eq('client_id', clientId)
        .eq('is_billable', true);

      if (error) throw error;
      setBillableExpenses((data as unknown as Expense[]) || []);
    } catch (error) {
      console.error('Error fetching billable expenses:', error);
    } finally {
      setFetchingExpenses(false);
    }
  }, [user]);

  useEffect(() => {
    if (formData.client_id) {
      fetchBillableExpenses(formData.client_id);
    } else {
      setBillableExpenses([]);
    }
  }, [formData.client_id, fetchBillableExpenses]);

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchVendors();
      fetchProducts();
      fetchUserSettings();
    }
  }, [user, fetchClients, fetchProducts, fetchUserSettings, fetchVendors]);

  // Load existing invoice if editing
  useEffect(() => {
    if (!user || !isEditing || !invoiceId) return;

    const loadInvoice = async () => {
      setInvoiceLoading(true);
      try {
        const table = isPurchase ? 'purchase_invoices' : 'invoices';
        const itemsTable = isPurchase ? 'purchase_invoice_items' : 'invoice_items';
        const foreignKey = 'invoice_id';

        const { data: invoiceData, error: invoiceError } = await supabase
          .from(table)
          .select('*')
          .eq('id', invoiceId)
          .eq('user_id', user.id)
          .single();

        if (invoiceError) throw invoiceError;
        if (!invoiceData) throw new Error('Invoice not found');

        const typedInvoice = invoiceData as unknown as Invoice;
        const typedPurchase = invoiceData as unknown as PurchaseInvoice;

        setInvoiceNumber(typedInvoice.invoice_number || null);
        setInvoiceStatus(typedInvoice.status || 'draft');
        setInvoiceCurrency(typedInvoice.currency || 'INR');
        setCurrencySymbol(typedInvoice.currency === 'USD' ? '$' : '₹');

        setFormData({
          client_id: isPurchase ? '' : typedInvoice.client_id || '',
          issue_date: typedInvoice.issue_date?.split('T')[0] || new Date().toISOString().split('T')[0],
          due_date: typedInvoice.due_date ? (typedInvoice.due_date as string).split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: typedInvoice.notes || '',
          terms: typedInvoice.terms || (isPurchase ? 'Payment due as per terms' : 'Payment due within 30 days'),
          vendor_id: isPurchase ? (typedPurchase.vendor_id || '') : (typedInvoice.vendor_id || ''),
          status: typedInvoice.status || 'paid'
        });

        const { data: itemsData, error: itemsError } = await supabase
          .from(itemsTable)
          .select('*')
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
                description: item.description || '',
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
    setItems([...items, { description: '', quantity: 0, rate: 0, discount: 0, tax_rate: 0, amount: 0 }]);
    isDirty.current = true;
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    } else {
      setItems([{ description: '', quantity: 0, rate: 0, discount: 0, tax_rate: 0, amount: 0 }]);
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
    newItems[index] = {
      ...newItems[index],
      product_id: product.id,
      description: product.description?.trim() ? product.description : product.name,
      rate: getProductPrice(product),
      discount: typeof product.discount === 'number' ? product.discount : (parseFloat(String(product.discount)) || 0),
      tax_rate: product.tax_rate,
      amount: calcItemAmount(newItems[index].quantity, getProductPrice(product), newItems[index].discount, product.tax_rate)
    };
    setItems(newItems);
    isDirty.current = true;
  }, [items]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientFormData.name || !newClientFormData.phone) return;

    setCreatingClient(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...newClientFormData, user_id: user?.id }])
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
    if (!newVendorFormData.name || !newVendorFormData.phone) return;

    setCreatingVendor(true);
    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert([{ ...newVendorFormData, user_id: user?.id }])
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

      const newProduct = data as unknown as Product;
      setProducts(prev => [...prev, newProduct].sort((a, b) => a.name.localeCompare(b.name)));

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

  const generateInvoiceNumber = useCallback(async () => {
    return await genInvNum();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidationErrors(true);

    if (!isPurchase && !formData.client_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a client."
      });
      return;
    }

    if (isPurchase && !formData.vendor_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a vendor."
      });
      return;
    }

    if (items.length === 0 || items.every(item => !item.description)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add at least one item."
      });
      return;
    }

    setSaving(true);
    const { subtotal, discountAmount, taxAmount, total } = getTotals();
    const currencySymbol = invoiceCurrency === 'INR' ? '₹' : (invoiceCurrency === 'USD' ? '$' : '€');

    try {
      if (total <= 0) {
        toast({
          variant: "destructive",
          title: "Invalid Invoice",
          description: "Total invoice amount must be greater than zero."
        });
        setSaving(false);
        return;
      }

      if (isPurchase) {
        // Handle Purchase Bill Creation
        // Filter formData to avoid sending client_id to purchase_invoices
        const { client_id, ...purchaseFormData } = formData;

        const { data: rawPurchaseData, error: purchaseError } = await supabase
          .from('purchase_invoices')
          .insert([{
            ...purchaseFormData,
            user_id: user?.id,
            invoice_number: await generateInvoiceNumber(),
            subtotal,
            discount_amount: discountAmount,
            tax_amount: taxAmount,
            total_amount: total,
            currency: 'INR'
          }])
          .select('*')
          .single();

        if (purchaseError) throw purchaseError;
        const purchaseData = rawPurchaseData as unknown as PurchaseInvoice;

        const formattedPurchaseItems = items.map(item => ({
          invoice_id: purchaseData.id,
          product_id: item.product_id ?? null,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          discount: item.discount,
          tax_rate: item.tax_rate,
          amount: calcItemAmount(item.quantity, item.rate, item.discount, item.tax_rate)
        }));

        const { error: piError } = await supabase
          .from('purchase_invoice_items')
          .insert(formattedPurchaseItems);

        if (piError) throw piError;

        // Increment stock for purchase
        for (const item of items) {
          if (item.product_id && item.quantity > 0) {
            const { data: productData } = await supabase
              .from('products')
              .select('opening_stock')
              .eq('id', item.product_id)
              .single();

            if (productData) {
              const currentStock = parseFloat((productData as unknown as { opening_stock: string }).opening_stock) || 0;
              const newStock = currentStock + item.quantity;
              await supabase
                .from('products')
                .update({ opening_stock: newStock.toString() })
                .eq('id', item.product_id);
            }
          }
        }

        setSuccessInfo({
          title: "Purchase Bill Created",
          message: `Purchase bill ${purchaseData.invoice_number} has been recorded.`
        });
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        
        setShowSuccess(true);
        return;
      }

      if (isEditing && invoiceId && isPurchase) {
        const { client_id, ...purchaseFormData } = formData;

        const { error: updateError } = await supabase
          .from('purchase_invoices')
          .update({
            ...purchaseFormData,
            subtotal,
            discount_amount: discountAmount,
            tax_amount: taxAmount,
            total_amount: total,
            currency: invoiceCurrency || 'INR'
          })
          .eq('id', invoiceId);

        if (updateError) throw updateError;

        // Stock Reconciliation for Purchase Bill edits
        const { data: oldItems } = await supabase
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

        await supabase
          .from('purchase_invoice_items')
          .delete()
          .eq('invoice_id', invoiceId);

        const formattedItems = items.map(item => ({
          invoice_id: invoiceId,
          product_id: item.product_id ?? null,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          discount: item.discount,
          tax_rate: item.tax_rate,
          amount: calcItemAmount(item.quantity, item.rate, item.discount, item.tax_rate)
        }));

        if (formattedItems.length > 0) {
          const { error: insertError } = await supabase
            .from('purchase_invoice_items')
            .insert(formattedItems);
          if (insertError) throw insertError;

          for (const item of items) {
            if (item.product_id && item.quantity > 0) {
              await adjustStock(item.product_id, item.quantity);
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

        setShowSuccess(true);
        isDirty.current = false;
        return;
      }

      if (isEditing && invoiceId && !isPurchase) {
        const { vendor_id, ...standardFormData } = formData;

        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            ...standardFormData,
            due_date: formData.due_date || null,
            subtotal,
            discount_amount: discountAmount,
            tax_amount: taxAmount,
            total_amount: total,
            status: invoiceStatus || 'draft',
            currency: invoiceCurrency || 'INR',
            hide_company_details: hideCompanyDetails,
            hide_contact_details: clients.find(c => c.id === formData.client_id)?.hide_contact_details || false
          })
          .eq('id', invoiceId);

        if (updateError) throw updateError;

        // Stock Reconciliation for Edits: Refund old quantities first
        const { data: oldItems } = await supabase
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

        const { error: deleteError } = await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', invoiceId);

        if (deleteError) throw deleteError;

        const formattedItems = items.map(item => ({
          invoice_id: invoiceId,
          product_id: item.product_id ?? null,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          discount: item.discount,
          tax_rate: item.tax_rate,
          amount: calcItemAmount(item.quantity, item.rate, item.discount, item.tax_rate)
        }));

        if (formattedItems.length > 0) {
          const { error: insertError } = await supabase
            .from('invoice_items')
            .insert(formattedItems);

          if (insertError) throw insertError;

          // Deduct stock for the updated items
          for (const item of items) {
            if (item.product_id && item.quantity > 0) {
              await adjustStock(item.product_id, -item.quantity);
            }
          }
        }

        setSuccessInfo({
          title: "Invoice Updated",
          message: invoiceNumber
            ? `Invoice ${invoiceNumber} has been successfully updated.`
            : "The invoice has been updated successfully."
        });

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

        setShowSuccess(true);
        isDirty.current = false;
        return;
      } else if (!isPurchase) {
        let attempts = 0;
        const maxAttempts = 3;
        let invoiceData = null;

        while (attempts < maxAttempts) {
          const newInvoiceNumber = await generateInvoiceNumber();

          const { vendor_id, ...standardFormData } = formData;

          const { data: currentInvoiceData, error: invoiceError } = await supabase
            .from('invoices')
            .insert([{
              ...standardFormData,
              user_id: user?.id,
              invoice_number: newInvoiceNumber,
              due_date: formData.due_date || null,
              subtotal,
              discount_amount: discountAmount,
              tax_amount: taxAmount,
              total_amount: total,
              status: 'draft',
              currency: 'INR',
              hide_company_details: hideCompanyDetails,
              hide_contact_details: clients.find(c => c.id === formData.client_id)?.hide_contact_details || false
            }])
            .select('*')
            .maybeSingle();

          if (invoiceError) {
            if (invoiceError.code === '23505' && invoiceError.message.includes('invoice_number')) {
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

        const formattedItems = items.map(item => ({
          invoice_id: (invoiceData as Invoice).id,
          product_id: item.product_id ?? null,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          discount: item.discount,
          tax_rate: item.tax_rate,
          amount: calcItemAmount(item.quantity, item.rate, item.discount, item.tax_rate)
        }));

        if (formattedItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(formattedItems);

          if (itemsError) throw itemsError;

          for (const item of items) {
            if (item.product_id && item.quantity > 0) {
              await adjustStock(item.product_id, -item.quantity);
            }
          }
        }

        setSuccessInfo({
          title: "Invoice Created",
          message: `Invoice ${(invoiceData as Invoice).invoice_number} has been generated successfully.`
        });

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

        setShowSuccess(true);

        await supabase.from('notifications').insert({
          user_id: user?.id,
          title: 'Invoice Created',
          message: `New invoice #${(invoiceData as Invoice).invoice_number} has been created successfully.`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error saving invoice:', error);

      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) errorMessage = error.message;
      else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }

      toast({
        variant: "destructive",
        title: isEditing ? "Update Failed" : "Generation Failed",
        description: `Error: ${errorMessage}`
      });
    }
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
        const emptyIndex = items.findIndex(item => !item.description && item.quantity === 0);
        if (emptyIndex !== -1) {
          applyProductToItem(product, emptyIndex);
          const newItems = [...items];
          newItems[emptyIndex].quantity = 1;
          newItems[emptyIndex].amount = calcItemAmount(1, getProductPrice(product), 0, product.tax_rate);
          setItems(newItems);
        } else {
          setItems([...items, {
            product_id: product.id,
            description: product.name,
            quantity: 1,
            rate: getProductPrice(product),
            discount: 0,
            tax_rate: product.tax_rate,
            amount: getProductPrice(product)
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
        return {
          product_id: product.id,
          description: product.name,
          quantity: qty,
          rate: getProductPrice(product),
          discount: 0,
          tax_rate: product.tax_rate,
          amount: calcItemAmount(qty, getProductPrice(product), 0, product.tax_rate)
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
  }, [selectedQuantities, products, items, activeItemIndex, toast]);

  const handleProductSelect = useCallback((product: Product) => {
    if (activeItemIndex !== null) {
      applyProductToItem(product, activeItemIndex);
    } else {
      // Bulk mode - add a new item or increment existing one
      const newItem = {
        product_id: product.id,
        description: product.description?.trim() ? product.description : product.name,
        quantity: 1,
        rate: getProductPrice(product),
        discount: typeof product.discount === 'number' ? product.discount : 0,
        tax_rate: product.tax_rate,
        amount: calcItemAmount(1, getProductPrice(product), typeof product.discount === 'number' ? product.discount : 0, product.tax_rate)
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
    isPurchase, setIsPurchase, invoiceLoading, clientSearchOpen, setClientSearchOpen,
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
    showValidationErrors
  };
}
