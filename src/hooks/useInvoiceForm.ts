import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { supabase as rawSupabase, serviceSupabase as rawServiceSupabase } from "@/integrations/supabase/client";
const supabase = (rawServiceSupabase || rawSupabase) as any;
const serviceSupabase = (rawServiceSupabase || rawSupabase) as any;
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Client, Product, Vendor, InvoiceItem, Invoice, PurchaseInvoice, Expense } from '@/types/invoice';
import { adjustStock, formatCategory } from '@/utils/inventory';
import { postInvoiceToLedger } from '@/utils/erpPosting';
import { calculateItemAmount as calcItemAmount, generateInvoiceNumber as genInvNum } from '@/utils/invoice-helpers';
import { type HSNCode } from '@/types/hsn';
import { type InvoiceFormData } from '@/components/invoice/InvoiceHeader';
import { useCurrency } from "@/contexts/CurrencyContext";
import { UncatalogedProductItem, IncompleteItem } from '@/components/invoice/UncatalogedProductsModal';
import { useUserType } from "@/hooks/useUserType";
// import hsnData from '@/data/hsnCodes.json'; // Removed static import for bundle optimization

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
    status: 'pending',
    invoice_number: '',
    payment_method: 'cash'
  });
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

  const initialBillingType = (
    searchParams.get('type') === 'purchase'
      ? 'purchase'
      : (searchParams.get('type') === 'ledger' || searchParams.get('billingType') === 'ledger')
      ? 'ledger'
      : (searchParams.get('type') === 'quotation' || searchParams.get('billingType') === 'quotation')
      ? 'quotation'
      : 'sales'
  ) as 'sales' | 'purchase' | 'ledger' | 'quotation';
  const [billingType, setBillingType] = useState<'sales' | 'purchase' | 'ledger' | 'quotation'>(initialBillingType);
  const [ledgerParties, setLedgerParties] = useState<Array<{ id: string; party_name: string; status: 'take' | 'give'; balance: number; last_date?: string; phone?: string; system_type?: string }>>([]);
  const [selectedLedgerPartyId, setSelectedLedgerPartyId] = useState<string | null>(searchParams.get('partyId') || null);
  const [isPurchase, setIsPurchase] = useState(() => initialBillingType === 'purchase');
  const [isDownpayment, setIsDownpayment] = useState(() => searchParams.get('type') === 'downpayment');
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

  const fetchLedgerPartiesWithBalance = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const client = (serviceSupabase || supabase) as any;
      const { data: partiesData, error: pErr } = await client
        .from('parties')
        .select('*')
        .eq('user_id', targetUserId)
        .order('party_name', { ascending: true });

      if (pErr) throw pErr;
      if (!partiesData || partiesData.length === 0) {
        setLedgerParties([]);
        return;
      }

      const partyIds = partiesData.map((p: any) => p.id);
      const balMap = new Map<string, { balance: number; last_date?: string }>();
      partiesData.forEach((p: any) => {
        balMap.set(p.id, { balance: Number(p.balance) || 0, last_date: undefined });
      });

      try {
        const { data: latestTxns } = await client
          .from('transactions')
          .select('party_id, credit, debit, created_at')
          .in('party_id', partyIds)
          .order('created_at', { ascending: false });

        if (latestTxns && latestTxns.length > 0) {
          const sumMap = new Map<string, { sum: number; last_date?: string }>();
          latestTxns.forEach((txn: any) => {
            const prev = sumMap.get(txn.party_id) || { sum: 0, last_date: txn.created_at };
            sumMap.set(txn.party_id, {
              sum: prev.sum + (Number(txn.credit) || 0) - (Number(txn.debit) || 0),
              last_date: prev.last_date || txn.created_at
            });
          });
          sumMap.forEach((val, pId) => {
            balMap.set(pId, { balance: val.sum, last_date: val.last_date });
          });
        }
      } catch (txnErr) {
        console.warn('Could not compute exact ledger balance, falling back to static:', txnErr);
      }

      const partiesWithBal = partiesData.map((p: any) => {
        const computed = balMap.get(p.id);
        const finalBal = computed ? computed.balance : (Number(p.balance) || 0);
        return {
          id: p.id,
          party_name: p.party_name,
          phone: p.phone,
          system_type: p.system_type,
          status: finalBal >= 0 ? ('take' as const) : ('give' as const),
          balance: Math.abs(finalBal),
          last_date: computed?.last_date
        };
      });

      setLedgerParties(partiesWithBal);
    } catch (err) {
      console.error('Error fetching ledger parties for billing:', err);
    }
  }, [targetUserId]);

  const handleLedgerPartySelect = useCallback(async (partyId: string, customAmount?: number) => {
    setSelectedLedgerPartyId(partyId);
    const party = ledgerParties.find(p => p.id === partyId);
    if (!party) return;

    let matchedClient = clients.find(c => c.name.toLowerCase() === party.party_name.toLowerCase());

    if (!matchedClient && targetUserId) {
      try {
        const client = (serviceSupabase || supabase) as any;
        const { data: newClientData } = await client
          .from('clients')
          .insert([{
            id: crypto.randomUUID(),
            user_id: targetUserId,
            name: party.party_name,
            phone: party.phone || '',
            email: ''
          }])
          .select()
          .single();
        if (newClientData) {
          matchedClient = newClientData as unknown as Client;
          setClients(prev => [...prev, matchedClient!]);
        }
      } catch (err) {
        console.warn("Could not auto-link client for ledger billing:", err);
      }
    }

    if (matchedClient) {
      setFormData(prev => ({
        ...prev,
        client_id: matchedClient!.id,
        notes: `Settlement bill against Account Ledger balance of ₹${Math.abs(party.balance).toLocaleString()} (${party.status === 'take' ? 'Receivable' : 'Payable'}).`
      }));
    }

    const billAmount = customAmount !== undefined ? customAmount : Math.abs(party.balance);
    setItems([
      {
        product_name: `Ledger Settlement (${party.party_name})`,
        description: `Settlement balance adjustment against ledger statement (${party.status === 'take' ? 'Receivable' : 'Payable'})`,
        quantity: 1,
        rate: billAmount,
        discount: 0,
        tax_rate: 0,
        amount: billAmount
      }
    ]);
  }, [ledgerParties, clients, targetUserId]);

  const handleSetBillingType = useCallback((type: 'sales' | 'purchase' | 'ledger' | 'quotation') => {
    setBillingType(type);
    setIsPurchase(type === 'purchase');
    if (type === 'ledger') {
      fetchLedgerPartiesWithBalance();
    }
  }, [fetchLedgerPartiesWithBalance]);

  useEffect(() => {
    const sType = searchParams.get('type') || searchParams.get('billingType');
    const computedType = (
      sType === 'purchase'
        ? 'purchase'
        : sType === 'ledger'
        ? 'ledger'
        : sType === 'quotation'
        ? 'quotation'
        : 'sales'
    ) as 'sales' | 'purchase' | 'ledger' | 'quotation';

    setBillingType(computedType);
    setIsPurchase(computedType === 'purchase');
    if (computedType === 'ledger') {
      fetchLedgerPartiesWithBalance();
    }
  }, [searchParams, fetchLedgerPartiesWithBalance]);

  useEffect(() => {
    if (billingType === 'ledger' && ledgerParties.length > 0) {
      const targetPartyId = searchParams.get('partyId') || selectedLedgerPartyId;
      if (targetPartyId) {
        handleLedgerPartySelect(targetPartyId);
      }
    }
  }, [billingType, ledgerParties, searchParams, selectedLedgerPartyId, handleLedgerPartySelect]);

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
      fetchLedgerPartiesWithBalance();
    }
  }, [targetUserId, fetchClients, fetchProducts, fetchUserSettings, fetchVendors, fetchLedgerPartiesWithBalance]);

  // Enhancement for Cloud Kitchen (food_kitchen user type or Geeta): Pre-fill single Client and Product
  const { isFoodKitchen } = useUserType();
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
          typedInvoice.notes?.includes('is_downpayment') ||
          typedInvoice.notes?.includes('Vehicle:') ||
          typedInvoice.terms?.toLowerCase().includes('downpayment') ||
          typedInvoice.payment_terms?.toLowerCase().includes('downpayment')
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
          status: typedInvoice.status || 'pending',
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
      description: product.description?.trim() ? product.description : '',
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
    if (!newClientFormData.name || !newClientFormData.phone) return;

    setCreatingClient(true);
    try {
      const clientToUse = serviceSupabase || supabase;
      const { data, error } = await clientToUse
        .from('clients')
        .insert([{ ...newClientFormData, user_id: targetUserId }])
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
      const clientToUse = serviceSupabase || supabase;
      const { data, error } = await clientToUse
        .from('vendors')
        .insert([{ ...newVendorFormData, user_id: targetUserId }])
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
          description: newProductFormData.description,
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

  const generateInvoiceNumber = useCallback(async () => {
    return await genInvNum(targetUserId, isPurchase, isDownpayment ? 'DP' : undefined);
  }, [targetUserId, isPurchase, isDownpayment]);

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
          ? (staffName || user?.user_metadata?.full_name || (user?.user_metadata as any)?.name || 'Staff Member')
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

        // Auto-create missing products or resolve existing ones
        const resolvedItemsWithProduct = [];
        const newlyCreatedProductIds = new Set<string>();

        for (const item of items) {
          let pId = item.product_id ?? null;
          const itemName = (item.product_name || item.description || '').trim();

          if (!pId && itemName) {
            const existing = products.find(p =>
              p.name.toLowerCase() === itemName.toLowerCase() ||
              (p.sku && p.sku.toLowerCase() === itemName.toLowerCase())
            );

            if (existing) {
              pId = existing.id;
            } else {
              // Auto-create product in catalog
              try {
                const itemRateInr = invoiceCurrency !== 'INR' ? convertToINR(item.rate) : item.rate;
                const pregenerated = confirmedUncataloged?.find(u => u.name.toLowerCase() === itemName.toLowerCase());
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

                const { data: newProd, error: prodCreateErr } = await clientToUse
                  .from('products')
                  .insert([{
                    user_id: targetUserId,
                    name: itemName,
                    description: item.description?.trim() || itemName,
                    type: 'product',
                    sku: uniqueSku,
                    purchase_price: itemRateInr,
                    price: itemRateInr, // Default sales price equals purchase cost
                    opening_stock: String(itemQty), // Stock initialized to inward quantity
                    tax_rate: Number(item.tax_rate) || 0,
                    hsn_code: item.hsn_code || '',
                    vendor_id: formData.vendor_id || null,
                    unit: item.unit || 'pcs',
                    category: 'General',
                    low_stock_warning: true
                  }])
                  .select()
                  .single();

                if (!prodCreateErr && newProd) {
                  const created = newProd as unknown as Product;
                  pId = created.id;
                  newlyCreatedProductIds.add(created.id);
                  autoCreatedCount++;
                  autoCreatedNames.push(created.name);
                  setProducts(prev => [...prev, created]);

                  // Auto-generate active QR tokens corresponding to the inward stock quantity
                  if (created.id && uniqueSku && itemQty > 0) {
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
                }
              } catch (e) {
                console.error('Error auto-creating product:', e);
              }
            }
          }

          resolvedItemsWithProduct.push({
            item,
            productId: pId
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
          let pId = item.product_id ?? null;
          const itemName = (item.product_name || item.description || '').trim();

          if (!pId && itemName) {
            const existing = products.find(p =>
              p.name.toLowerCase() === itemName.toLowerCase() ||
              (p.sku && p.sku.toLowerCase() === itemName.toLowerCase())
            );

            if (existing) {
              pId = existing.id;
            } else {
              try {
                const itemRateInr = invoiceCurrency !== 'INR' ? convertToINR(item.rate) : item.rate;
                const pregenerated = confirmedUncataloged?.find(u => u.name.toLowerCase() === itemName.toLowerCase());
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

                const { data: newProd, error: prodCreateErr } = await clientToUse
                  .from('products')
                  .insert([{
                    user_id: targetUserId,
                    name: itemName,
                    description: item.description?.trim() || itemName,
                    type: 'product',
                    sku: uniqueSku,
                    purchase_price: itemRateInr,
                    price: itemRateInr,
                    opening_stock: String(itemQty),
                    tax_rate: Number(item.tax_rate) || 0,
                    hsn_code: item.hsn_code || '',
                    vendor_id: formData.vendor_id || null,
                    unit: item.unit || 'pcs',
                    category: 'General',
                    low_stock_warning: true
                  }])
                  .select()
                  .single();

                if (!prodCreateErr && newProd) {
                  const created = newProd as unknown as Product;
                  pId = created.id;
                  newlyCreatedEditProductIds.add(created.id);
                  setProducts(prev => [...prev, created]);

                  if (created.id && uniqueSku && itemQty > 0) {
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
                }
              } catch (e) {
                console.error('Error auto-creating product on bill update:', e);
              }
            }
          }

          resolvedEditItems.push({
            item,
            productId: pId
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

        setShowSuccess(true);
        isDirty.current = false;
        return;
      }

      if (isEditing && invoiceId && !isPurchase) {
        const { vendor_id, payment_method, ...standardFormData } = formData;

        let notesToSave = standardFormData.notes;
        if (isDownpayment && notesToSave && !notesToSave.includes('is_downpayment')) {
          notesToSave = `[META:{"is_downpayment":true}]\n${notesToSave}`.trim();
        }

        const { error: updateError } = await clientToUse
          .from('invoices')
          .update({
            ...standardFormData,
            notes: notesToSave,
            due_date: formData.due_date || null,
            subtotal,
            discount_amount: discountAmount,
            tax_amount: taxAmount,
            total_amount: total,
            status: invoiceStatus || 'draft',
            currency: invoiceCurrency || 'INR'
          })
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

        const formattedItems = items.map(item => {
          const pId = item.product_id ?? resolveProductId(item) ?? null;
          const descToSave = (item.description || '').trim() || item.product_name || 'Item';
          return {
            invoice_id: invoiceId,
            product_id: pId,
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

          // Deduct stock for the updated items
          for (const item of items) {
            const pId = resolveProductId(item);
            if (pId && item.quantity > 0) {
              await adjustStock(pId, -item.quantity);
            }
          }
        }

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

        setShowSuccess(true);
        isDirty.current = false;
        return;
      } else if (!isPurchase) {
        let attempts = 0;
        const maxAttempts = 5;
        let invoiceData = null;

        while (attempts < maxAttempts) {
          const newInvoiceNumber = await genInvNum(targetUserId, false, isDownpayment ? 'DP' : undefined);

          const { vendor_id, payment_method, ...standardFormData } = formData;
          const creatorName = isStaff
            ? (staffName || user?.user_metadata?.full_name || (user?.user_metadata as any)?.name || 'Staff Member')
            : (companyProfile?.company_name || profile?.company_name || 'Company Owner');

          let notesToSave = standardFormData.notes || '';
          if (isDownpayment && !notesToSave.includes('is_downpayment')) {
            notesToSave = `[META:{"is_downpayment":true}]\n${notesToSave}`.trim();
          }

          const { data: currentInvoiceData, error: invoiceError } = await clientToUse
            .from('invoices')
            .insert([{
              ...standardFormData,
              notes: notesToSave,
              user_id: targetUserId,
              invoice_number: newInvoiceNumber,
              payment_terms: isDownpayment
                ? `Downpayment • Created by: ${creatorName}`
                : `Created by: ${creatorName}`,
              terms: standardFormData.terms || (isDownpayment ? 'Vehicle Booking Advance & Downpayment Receipt' : null),
              due_date: formData.due_date || null,
              subtotal,
              discount_amount: discountAmount,
              tax_amount: taxAmount,
              total_amount: total,
              status: 'draft',
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

        const formattedItems = items.map(item => {
          const pId = item.product_id ?? resolveProductId(item) ?? null;
          const descToSave = (item.description || '').trim() || item.product_name || 'Item';
          return {
            invoice_id: (invoiceData as Invoice).id,
            product_id: pId,
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

          for (const item of items) {
            const pId = resolveProductId(item);
            if (pId && item.quantity > 0) {
              await adjustStock(pId, -item.quantity);
            }
          }
        }

        setSuccessInfo({
          title: isDownpayment ? "Downpayment Receipt Created" : "Invoice Created",
          message: `${isDownpayment ? 'Downpayment receipt' : 'Invoice'} ${(invoiceData as Invoice).invoice_number} has been generated successfully.`
        });

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowValidationErrors(true);

    if (!isPurchase && !formData.client_id) {
      toast({
        variant: "destructive",
        title: "Client Required",
        description: "Please select or add a client for this invoice."
      });
      return;
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
            description: product.description?.trim() ? product.description : '',
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
    isPurchase, setIsPurchase, isDownpayment, setIsDownpayment,
    billingType, setBillingType: handleSetBillingType, ledgerParties, selectedLedgerPartyId, handleLedgerPartySelect,
    invoiceLoading, clientSearchOpen, setClientSearchOpen,
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
    uncatalogedModalOpen, setUncatalogedModalOpen, uncatalogedItemsList, incompleteItemsList, confirmAndSavePurchaseBill
  };
}
