import React, { useState, useMemo, useEffect } from 'react';
import { Client, Product, InvoiceItem } from '@/types/invoice';
import { InvoiceFormData } from '@/components/invoice/InvoiceHeader';
import { cleanProductDescription } from '@/services/foodImageApi';
import { supabase } from '@/integrations/supabase/client';
import { CafeHeaderBar } from './CafeHeaderBar';
import { CafeOrderModeSelector } from './CafeOrderModeSelector';
import { CafeProductGrid } from './CafeProductGrid';
import { CafeCartSidebar } from './CafeCartSidebar';

interface CafePOSBillingProps {
  products: Product[];
  clients: Client[];
  items: InvoiceItem[];
  setItems: React.Dispatch<React.SetStateAction<InvoiceItem[]>>;
  formData: InvoiceFormData;
  setFormData: (data: InvoiceFormData) => void;
  currencySymbol: string;
  getTotals: () => { subtotal: number; discountAmount: number; taxAmount: number; total: number };
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  saving: boolean;
  cafeCustomerPhone?: string;
  setCafeCustomerPhone?: (val: string) => void;
  cafeCustomerName?: string;
  setCafeCustomerName?: (val: string) => void;
  cafeTable?: string;
  setCafeTable?: (val: string) => void;
  onSwitchToClassic?: () => void;
  onResetOrder?: () => void;
  updateItemAmount: (index: number, field: keyof InvoiceItem, value: any) => void;
  removeItem: (index: number) => void;
}

export const CafePOSBilling: React.FC<CafePOSBillingProps> = ({
  products,
  clients,
  items,
  setItems,
  formData,
  setFormData,
  currencySymbol,
  getTotals,
  handleSubmit,
  saving,
  cafeCustomerPhone,
  setCafeCustomerPhone,
  cafeCustomerName,
  setCafeCustomerName,
  cafeTable,
  setCafeTable,
  onSwitchToClassic,
  onResetOrder,
  updateItemAmount,
  removeItem
}) => {
  // Safe prop invocation helpers
  const safeSetCafeTable = (tbl: string) => {
    if (typeof setCafeTable === 'function') setCafeTable(tbl);
  };
  const safeSetCustomerPhone = (phone: string) => {
    if (typeof setCafeCustomerPhone === 'function') setCafeCustomerPhone(phone);
  };
  const safeSetCustomerName = (name: string) => {
    if (typeof setCafeCustomerName === 'function') setCafeCustomerName(name);
  };

  // Order mode state (Dine-In default, Takeaway alternative)
  const [orderMode, setOrderMode] = useState<'takeaway' | 'dine_in'>(() => {
    return (cafeTable && cafeTable === 'Takeaway') ? 'takeaway' : 'dine_in';
  });

  // Cafe POS bills are counter-paid transactions
  useEffect(() => {
    if (formData.status !== 'paid') {
      setFormData({
        ...formData,
        status: 'paid',
        payment_method: formData.payment_method || 'cash'
      });
    }
  }, []);

  const handleSelectOrderMode = (mode: 'takeaway' | 'dine_in') => {
    setOrderMode(mode);
    const cleanNotes = (formData.notes || '').replace(/\[Order: [^\]]+\]\s*/g, '').trim();
    if (mode === 'takeaway') {
      safeSetCafeTable('Takeaway');
      const newNotes = `[Order: Takeaway] ${cleanNotes}`.trim();
      setFormData({ ...formData, notes: newNotes });
    } else {
      const initialTable = (!cafeTable || cafeTable === 'Takeaway') ? 'Table 1' : cafeTable;
      safeSetCafeTable(initialTable);
      const newNotes = `[Order: ${initialTable}] ${cleanNotes}`.trim();
      setFormData({ ...formData, notes: newNotes });
    }
  };

  const handleSelectTable = (tbl: string) => {
    safeSetCafeTable(tbl);
    const cleanNotes = (formData.notes || '').replace(/\[Order: [^\]]+\]\s*/g, '').trim();
    const newNotes = `[Order: ${tbl}] ${cleanNotes}`.trim();
    setFormData({ ...formData, notes: newNotes });
  };

  // Local phone & name states for lag-free typing
  const [localPhone, setLocalPhone] = useState(cafeCustomerPhone || '');
  const [localName, setLocalName] = useState(cafeCustomerName || '');

  useEffect(() => {
    if (cafeCustomerPhone !== localPhone) setLocalPhone(cafeCustomerPhone || '');
  }, [cafeCustomerPhone]);

  useEffect(() => {
    if (cafeCustomerName !== localName) setLocalName(cafeCustomerName || '');
  }, [cafeCustomerName]);

  const matchedClient = useMemo(() => {
    if (formData.client_id) return clients.find(c => c.id === formData.client_id);
    const clean = localPhone.replace(/\D/g, '').slice(-10);
    if (clean.length === 10) {
      return clients.find(c => ((c.phone || (c as any).mobile || '').replace(/\D/g, '').slice(-10) === clean));
    }
    return undefined;
  }, [clients, formData.client_id, localPhone]);

  // Auto-populate customer name immediately when matched client is found
  useEffect(() => {
    if (matchedClient?.name) {
      setLocalName(matchedClient.name);
      safeSetCustomerName(matchedClient.name);
      if (formData.client_id !== matchedClient.id) {
        setFormData({ ...formData, client_id: matchedClient.id });
      }
    }
  }, [matchedClient]);

  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    const cleanDigits = raw.length > 10 ? raw.slice(-10) : raw;
    setLocalPhone(cleanDigits);
    safeSetCustomerPhone(cleanDigits);

    if (cleanDigits.length === 10) {
      const matched = clients.find(c => ((c.phone || (c as any).mobile || '').replace(/\D/g, '').slice(-10) === cleanDigits));
      if (matched) {
        setFormData({ ...formData, client_id: matched.id });
        setLocalName(matched.name);
        safeSetCustomerName(matched.name);
      } else {
        setFormData({ ...formData, client_id: '' });
        // Direct server check in case client was created recently or not in local cache
        void (async () => {
          try {
            const { data: serverClients } = await (supabase as any)
              .from('clients')
              .select('id, name, phone')
              .ilike('phone', `%${cleanDigits}%`)
              .limit(1);
            if (serverClients && serverClients.length > 0) {
              const matchedServer = serverClients[0] as { id: string; name: string; phone?: string };
              setFormData({ ...formData, client_id: matchedServer.id });
              setLocalName(matchedServer.name);
              safeSetCustomerName(matchedServer.name);
            }
          } catch (err) {
            console.warn('Could not query client by phone:', err);
          }
        })();
      }
    } else if (formData.client_id) {
      setFormData({ ...formData, client_id: '' });
    }
  };

  const handleNameChange = (val: string) => {
    setLocalName(val);
    safeSetCustomerName(val);
  };

  // Cart operations
  const activeCartItems = useMemo(() => {
    return items
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => (item.quantity > 0) && (item.product_name || item.description));
  }, [items]);

  const handleAddProduct = (product: Product) => {
    const rate = Number(product.selling_price || product.price || product.rate || 0);
    const taxRate = Number(product.tax_rate ?? 5);

    const existingIndex = items.findIndex(
      it => (it.product_id && it.product_id === product.id) || 
            (it.product_name && it.product_name.toLowerCase() === product.name.toLowerCase())
    );

    if (existingIndex !== -1) {
      const currentQty = Number(items[existingIndex].quantity) || 0;
      updateItemAmount(existingIndex, 'quantity', currentQty + 1);
    } else {
      const blankIndex = items.findIndex(it => !it.product_name && !it.description && Number(it.quantity) === 0);
      const newItem: InvoiceItem = {
        product_id: product.id,
        product_name: product.name,
        name: product.name,
        description: cleanProductDescription(product.description) || product.name,
        quantity: 1,
        rate: rate,
        discount: 0,
        tax_rate: taxRate,
        amount: rate
      };

      if (blankIndex !== -1) {
        const next = [...items];
        next[blankIndex] = newItem;
        setItems(next);
      } else {
        setItems([...items, newItem]);
      }
    }
  };

  const handleIncrementItem = (originalIndex: number) => {
    const current = items[originalIndex];
    if (!current) return;
    updateItemAmount(originalIndex, 'quantity', (Number(current.quantity) || 0) + 1);
  };

  const handleDecrementItem = (originalIndex: number) => {
    const current = items[originalIndex];
    if (!current) return;
    const qty = Number(current.quantity) || 0;
    if (qty > 1) updateItemAmount(originalIndex, 'quantity', qty - 1);
    else removeItem(originalIndex);
  };

  // Kitchen notes formatting
  const displayKitchenNotes = (formData.notes || '').replace(/\[Order: [^\]]+\]\s*/g, '');
  const handleKitchenNotesChange = (val: string) => {
    const currentTable = cafeTable || (orderMode === 'dine_in' ? 'Table 1' : 'Takeaway');
    const clean = val.replace(/\[Order: [^\]]+\]\s*/g, '').trim();
    const updatedNotes = clean ? `[Order: ${currentTable}] ${clean}` : `[Order: ${currentTable}]`;
    setFormData({ ...formData, notes: updatedNotes });
  };

  const selectedPaymentMethod = formData.payment_method || 'cash';
  const handlePaymentSelect = (mode: string) => {
    setFormData({ ...formData, payment_method: mode, status: 'paid' });
  };

  const totals = getTotals();

  return (
    <div className="flex flex-col gap-4 max-w-[1700px] mx-auto pb-10">
      {/* 1. Header Bar */}
      <CafeHeaderBar onSwitchToClassic={onSwitchToClassic} />

      {/* 2. Order Mode & Table Selection */}
      <CafeOrderModeSelector
        orderMode={orderMode}
        onSelectOrderMode={handleSelectOrderMode}
        cafeTable={cafeTable}
        onSelectTable={handleSelectTable}
      />

      {/* 3. Main Split View: Menu Grid (Left) + Cart Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Menu Grid */}
        <div className="lg:col-span-7">
          <CafeProductGrid
            products={products}
            items={items}
            currencySymbol={currencySymbol}
            onAddProduct={handleAddProduct}
          />
        </div>

        {/* Cart Sidebar */}
        <div id="cafe-cart-sidebar-container" className="lg:col-span-5 lg:sticky lg:top-4 scroll-mt-20">
          <CafeCartSidebar
            localPhone={localPhone}
            localName={localName}
            onPhoneChange={handlePhoneChange}
            onNameChange={handleNameChange}
            matchedClient={matchedClient}
            activeCartItems={activeCartItems}
            currencySymbol={currencySymbol}
            onIncrementItem={handleIncrementItem}
            onDecrementItem={handleDecrementItem}
            onRemoveItem={removeItem}
            onResetOrder={onResetOrder}
            kitchenNotes={displayKitchenNotes}
            onKitchenNotesChange={handleKitchenNotesChange}
            totals={totals}
            selectedPaymentMethod={selectedPaymentMethod}
            onPaymentSelect={handlePaymentSelect}
            saving={saving}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      {/* Mobile Floating Cart Summary Bar */}
      {activeCartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-20 left-4 right-4 z-40 animate-in slide-in-from-bottom-3 duration-200">
          <button
            type="button"
            onClick={() => {
              const cartEl = document.getElementById('cafe-cart-sidebar-container');
              cartEl?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl py-3 px-4 shadow-xl flex items-center justify-between font-black text-sm active:scale-95 transition-all border border-amber-400/30 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                {activeCartItems.length}
              </span>
              <span>View Cart &amp; Complete Bill</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-base font-bold">
              <span>{currencySymbol} {totals.total.toFixed(2)}</span>
              <span>↓</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
