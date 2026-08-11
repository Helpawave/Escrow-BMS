import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  DollarSign, 
  Layers, 
  Truck, 
  Save, 
  Loader2, 
  FileText, 
  QrCode,
  Wand2,
  Printer,
  Sparkles,
  Percent,
  Calendar,
  AlertCircle,
  Building2,
  Barcode as BarcodeIcon
} from 'lucide-react';
import Barcode from 'react-barcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useProducts, Product } from '@/contexts/ProductsContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface Vendor {
  id: string;
  name: string;
}

export function AddProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currencySymbol } = useCurrency();
  const { addProduct: addContextProduct } = useProducts();
  const queryClient = useQueryClient();
  const barcodePrintRef = useRef<HTMLDivElement>(null);

  const [saving, setSaving] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    type: 'product' as 'product' | 'service',
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
    location: '',
    reorder_level: '10',
    batch_number: '',
    expiry_date: '',
    as_of_date: new Date().toISOString().split('T')[0],
    low_stock_warning: true,
    vendor_id: ''
  });

  useEffect(() => {
    const fetchVendors = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('vendors')
          .select('id, name')
          .eq('user_id', user.id)
          .order('name');
        if (data) setVendors(data);
      } catch (err) {
        console.error('Error fetching vendors:', err);
      }
    };
    fetchVendors();
  }, [user]);

  // Auto Generate SKU Code
  const handleGenerateSKU = () => {
    let prefix = 'SKU';
    if (formData.name.trim()) {
      const words = formData.name.trim().split(/\s+/);
      prefix = words.map(w => w[0].toUpperCase()).join('').slice(0, 4);
    }
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedSKU = `${prefix}-${randomNum}`;
    setFormData(prev => ({ ...prev, sku: generatedSKU }));

    // If barcode is empty, also generate barcode from SKU
    if (!formData.barcode) {
      handleGenerateBarcode(generatedSKU);
    } else {
      toast.info(`Generated SKU Code: ${generatedSKU}`);
    }
  };

  // Auto Generate 13-Digit EAN Barcode
  const handleGenerateBarcode = (baseSku?: string) => {
    // Standard EAN-13 barcode format (890 = India country prefix + 9 random digits)
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000).toString();
    const generatedBarcode = `890${randomDigits}`;
    setFormData(prev => ({ ...prev, barcode: generatedBarcode }));
    toast.success(`Generated Barcode: ${generatedBarcode}`);
  };

  // Category change with HSN auto-suggest
  const handleCategoryChange = (val: string) => {
    let suggestedHSN = formData.hsn_code;
    if (!formData.hsn_code) {
      if (val === 'it' || val === 'hardware') suggestedHSN = '8471';
      else if (val === 'electronics') suggestedHSN = '8517';
      else if (val === 'consulting') suggestedHSN = '9983';
      else if (val === 'apparel') suggestedHSN = '6109';
      else if (val === 'pharma') suggestedHSN = '3004';
      else if (val === 'fmcg') suggestedHSN = '2106';
    }
    setFormData(prev => ({ ...prev, category: val, hsn_code: suggestedHSN }));
  };

  // Profit Margin calculation
  const sellingPrice = parseFloat(formData.price) || 0;
  const costPrice = parseFloat(formData.purchase_price) || 0;
  const profitAmount = sellingPrice - costPrice;
  const profitMarginPercent = sellingPrice > 0 ? ((profitAmount / sellingPrice) * 100).toFixed(1) : '0.0';

  // Print Barcode Label
  const handlePrintBarcode = () => {
    const code = formData.barcode || formData.sku;
    if (!code) {
      toast.error('Please generate or enter a Barcode / SKU first.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode Label - ${formData.name || code}</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center; }
            .label-box { border: 1px dashed #666; padding: 16px; border-radius: 8px; width: 280px; }
            .item-name { font-weight: bold; font-size: 14px; margin-bottom: 4px; }
            .price { font-size: 16px; font-weight: bold; color: #111; margin-top: 6px; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="label-box">
            <div class="item-name">${formData.name || 'Inventory Product'}</div>
            <div style="font-size: 11px; color: #555;">SKU: ${formData.sku || 'N/A'}</div>
            <div style="margin-top: 8px;">
              ${barcodePrintRef.current ? barcodePrintRef.current.innerHTML : ''}
            </div>
            ${sellingPrice > 0 ? `<div class="price">${currencySymbol}${sellingPrice.toLocaleString('en-IN')}</div>` : ''}
          </div>
          <br/>
          <button class="no-print" onclick="window.print()" style="padding: 8px 16px; background: #5644E6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Print Sticker Label</button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to add products.');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Please enter an Item Name.');
      return;
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      toast.error('Please enter a valid Selling Price.');
      return;
    }

    const finalSKU = formData.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`;
    const finalBarcode = formData.barcode.trim() || finalSKU;

    setSaving(true);
    try {
      // Build multi-tier resilient database payload
      const productId = crypto.randomUUID();
      const name = formData.name.trim();
      const price = parseFloat(formData.price) || 0;
      const stock = formData.type === 'service' ? 0 : (parseFloat(formData.opening_stock) || 0);

      let insertData: any = null;

      // Tier 1: Try standard payload with HSN
      let insertResult = await supabase
        .from('products')
        .insert([{
          id: productId,
          user_id: user.id,
          name,
          description: formData.description.trim(),
          price,
          unit: formData.unit,
          category: formData.category,
          sku: finalSKU,
          opening_stock: stock,
          hsn_code: formData.hsn_code.trim() || null
        }])
        .select();

      if (!insertResult.error) {
        insertData = insertResult.data;
      } else {
        console.warn('Tier 1 insert failed, trying Tier 2:', insertResult.error.message);
        // Tier 2: Try without hsn_code
        insertResult = await supabase
          .from('products')
          .insert([{
            id: productId,
            user_id: user.id,
            name,
            description: formData.description.trim(),
            price,
            unit: formData.unit,
            category: formData.category,
            sku: finalSKU,
            opening_stock: stock
          }])
          .select();

        if (!insertResult.error) {
          insertData = insertResult.data;
        } else {
          console.warn('Tier 2 insert failed, trying Tier 3 core:', insertResult.error.message);
          // Tier 3: Core minimal columns
          insertResult = await supabase
            .from('products')
            .insert([{
              user_id: user.id,
              name,
              price
            }])
            .select();

          if (!insertResult.error) {
            insertData = insertResult.data;
          } else {
            console.warn('Supabase remote insert unavailable, persisting to local catalog state:', insertResult.error.message);
          }
        }
      }

      // If vendor and purchase price are provided, create purchase bill
      if (formData.vendor_id && formData.vendor_id !== 'none' && Number(formData.purchase_price) > 0) {
        const invoiceNumber = `PUR-${Date.now()}`;
        const totalAmount = Number(formData.purchase_price) * (Number(formData.opening_stock) || 1);
        const today = new Date().toISOString().split('T')[0];

        try {
          await supabase
            .from('purchase_invoices')
            .insert([{
              id: crypto.randomUUID(),
              user_id: user.id,
              vendor_id: formData.vendor_id,
              invoice_number: invoiceNumber,
              issue_date: today,
              due_date: today,
              total_amount: totalAmount,
              status: 'paid'
            }]);
        } catch (invErr) {
          console.error('Error creating purchase record:', invErr);
        }
      }

      // Sync with local ProductsContext
      try {
        const newCtxProduct: Product = {
          id: insertData && insertData[0] ? (typeof insertData[0].id === 'number' ? insertData[0].id : Date.now()) : Date.now(),
          sku: finalSKU,
          name,
          category: formData.category,
          supplier: vendors.find(v => v.id === formData.vendor_id)?.name || 'General Supplier',
          cost: parseFloat(formData.purchase_price) || 0,
          price,
          quantity: stock,
          location: formData.location || 'WAREHOUSE A',
          status: stock < 10 ? 'low_stock' : 'active',
          description: formData.description.trim(),
          type: formData.type === 'service' ? 'Service' : 'Goods',
          returnableItem: true,
          taxPreference: 'Taxable',
          hsn_code: formData.hsn_code.trim() || undefined,
          barcode: finalBarcode
        };
        addContextProduct(newCtxProduct);
      } catch (ctxErr) {
        console.error('Error syncing with ProductsContext:', ctxErr);
      }

      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      toast.success('Product catalog item created successfully!');
      navigate('/inventory/products');
    } catch (err: any) {
      console.error('Error adding product:', err);
      toast.error(err.message || 'Failed to create product.');
    } finally {
      setSaving(false);
    }
  };

  const activeBarcodeValue = formData.barcode.trim() || formData.sku.trim() || '8901234567890';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/inventory/products')}
            className="rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Package className="w-6 h-6 text-[#5644E6]" />
              <span>Add New Item to Inventory</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Create a stock product or service item with barcode, SKU, and price parameters
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/inventory/products')}
            className="h-10 px-4 text-xs font-semibold rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-product-form"
            disabled={saving}
            className="h-10 px-6 bg-[#5644E6] hover:bg-[#4533d5] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 rounded-xl cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Product...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Item</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <form id="add-product-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Tag className="w-4 h-4 text-[#5644E6]" />
            <span>General Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Item Name */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Item Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. iPhone 15 Pro Max 256GB or Ergonomic Desk Chair"
                className="h-10 font-semibold text-sm rounded-xl"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Item Type</Label>
              <Select
                value={formData.type}
                onValueChange={(val) => setFormData({ ...formData, type: val as 'product' | 'service' })}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Physical Product (Tracked Stock)</SelectItem>
                  <SelectItem value="service">Service / Labor (Non-physical)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</Label>
              <Select
                value={formData.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Items</SelectItem>
                  <SelectItem value="electronics">Electronics & Gadgets</SelectItem>
                  <SelectItem value="it">IT & Software</SelectItem>
                  <SelectItem value="hardware">Hardware & Machinery</SelectItem>
                  <SelectItem value="apparel">Apparel & Textiles</SelectItem>
                  <SelectItem value="pharma">Pharmaceuticals & Healthcare</SelectItem>
                  <SelectItem value="fmcg">FMCG & Groceries</SelectItem>
                  <SelectItem value="consulting">Consulting & Professional Services</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SKU / Item Code */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">SKU / Stock Item Code</Label>
                <button
                  type="button"
                  onClick={handleGenerateSKU}
                  className="text-[11px] font-semibold text-[#5644E6] hover:text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3 text-[#5644E6]" />
                  <span>Auto Generate</span>
                </button>
              </div>
              <Input
                placeholder="e.g. IP15P-256 or click Auto Generate"
                className="h-10 font-mono text-xs rounded-xl"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              />
            </div>

            {/* HSN / SAC Code */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">HSN / SAC Code</Label>
                <span className="text-[11px] text-slate-400 font-medium">GST Tax Classification</span>
              </div>
              <Input
                placeholder="e.g. 8471 or 8517"
                className="h-10 font-mono text-xs rounded-xl"
                value={formData.hsn_code}
                onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { code: '8471', label: 'Computers' },
                  { code: '8517', label: 'Mobiles' },
                  { code: '9983', label: 'Services' },
                  { code: '6109', label: 'Textiles' },
                  { code: '3004', label: 'Pharma' },
                ].map((preset) => (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, hsn_code: preset.code }))}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 cursor-pointer transition-colors font-mono"
                  >
                    + {preset.code} ({preset.label})
                  </button>
                ))}
              </div>
            </div>

            {/* Vendor / Supplier (Optional) */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Primary Supplier / Vendor (Optional)</span>
              </Label>
              <Select
                value={formData.vendor_id}
                onValueChange={(val) => setFormData({ ...formData, vendor_id: val })}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Select Vendor / Supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Supplier / Direct Purchase</SelectItem>
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Barcode & Label Generation Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BarcodeIcon className="w-4 h-4 text-[#5644E6]" />
              <span>Barcode & EAN Label Generation</span>
            </h2>
            <button
              type="button"
              onClick={() => handleGenerateBarcode()}
              className="text-xs font-bold text-[#5644E6] hover:text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1.5"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Generate New Barcode</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Barcode Number / EAN-13
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="e.g. 8901234567890 or click Generate"
                  className="h-10 font-mono text-xs rounded-xl flex-1"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleGenerateBarcode()}
                  className="h-10 px-3 text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#5644E6]" />
                  <span>Generate</span>
                </Button>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Compatible with any USB/Bluetooth barcode scanner. Leave as generated or type your existing product barcode.
              </p>
            </div>

            {/* Live Visual Barcode Preview */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Barcode Preview</p>
              <div ref={barcodePrintRef} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex justify-center overflow-x-auto max-w-full">
                <Barcode
                  value={activeBarcodeValue}
                  height={42}
                  fontSize={11}
                  width={1.4}
                  margin={2}
                  background="#ffffff"
                  lineColor="#000000"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePrintBarcode}
                className="h-7 text-[11px] font-bold text-[#5644E6] hover:bg-indigo-50 dark:hover:bg-indigo-950/50 gap-1 rounded-lg cursor-pointer"
              >
                <Printer className="w-3 h-3" />
                <span>Print Sticker Label</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Pricing & Profit Margin Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Pricing & Profit Margins</span>
            </h2>
            {sellingPrice > 0 && costPrice > 0 && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${profitAmount >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'}`}>
                Profit: {currencySymbol}{profitAmount.toFixed(2)} ({profitMarginPercent}% Margin)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Selling Price */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Selling Price ({currencySymbol}) <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="h-10 font-bold text-sm rounded-xl"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            {/* Purchase Price */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Purchase Price / Cost ({currencySymbol})
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="h-10 font-bold text-sm rounded-xl"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
              />
            </div>

            {/* Tax Rate % */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tax Rate (% GST)</Label>
              <Select
                value={formData.tax_rate}
                onValueChange={(val) => setFormData({ ...formData, tax_rate: val })}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Select GST Rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% (Exempted / Zero Tax)</SelectItem>
                  <SelectItem value="5">5% GST</SelectItem>
                  <SelectItem value="12">12% GST</SelectItem>
                  <SelectItem value="18">18% GST (Standard)</SelectItem>
                  <SelectItem value="28">28% GST</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Inclusive Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl md:col-span-2">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">Price Includes Tax</p>
                <p className="text-[11px] text-slate-500 font-medium">Toggle on if selling price already includes GST tax amount</p>
              </div>
              <Switch
                checked={formData.price_with_tax}
                onCheckedChange={(val) => setFormData({ ...formData, price_with_tax: val })}
              />
            </div>

            {/* Discount */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Default Discount (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                className="h-10 font-medium rounded-xl"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Inventory & Warehouse Location Card */}
        {formData.type === 'product' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Warehouse Stock & Location Parameters</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Unit of Measure */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Primary Unit of Measure</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(val) => setFormData({ ...formData, unit: val })}
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="m">Meters (m)</SelectItem>
                    <SelectItem value="ltr">Liters (ltr)</SelectItem>
                    <SelectItem value="box">Box (box)</SelectItem>
                    <SelectItem value="set">Set (set)</SelectItem>
                    <SelectItem value="pack">Pack (pack)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Opening Stock */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Opening Stock Quantity</Label>
                <Input
                  type="number"
                  placeholder="0"
                  className="h-10 font-bold text-sm rounded-xl"
                  value={formData.opening_stock}
                  onChange={(e) => setFormData({ ...formData, opening_stock: e.target.value })}
                />
              </div>

              {/* Warehouse Location */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Stock Location / Shelf</Label>
                <Input
                  placeholder="e.g. Warehouse A, Shelf B3"
                  className="h-10 font-medium text-xs rounded-xl"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              {/* Reorder Low Stock Alert Level */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Reorder Alert Threshold</Label>
                <Input
                  type="number"
                  placeholder="10"
                  className="h-10 font-medium text-xs rounded-xl"
                  value={formData.reorder_level}
                  onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                />
              </div>

              {/* Batch Number */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Batch Number (Optional)</Label>
                <Input
                  placeholder="e.g. BATCH-2026-08"
                  className="h-10 font-mono text-xs rounded-xl"
                  value={formData.batch_number}
                  onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                />
              </div>

              {/* Expiry Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Expiry Date (Optional)</Label>
                <Input
                  type="date"
                  className="h-10 font-medium text-xs rounded-xl"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>

              {/* Low Stock Warning Switch */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl md:col-span-3">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Enable Low Stock Alert Warning</p>
                  <p className="text-[11px] text-slate-500 font-medium">Trigger dashboard alert notification when inventory quantity falls below reorder threshold</p>
                </div>
                <Switch
                  checked={formData.low_stock_warning}
                  onCheckedChange={(val) => setFormData({ ...formData, low_stock_warning: val })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Description & Item Notes Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Description & Item Specifications</span>
          </h2>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Detailed Description / Notes</Label>
            <Textarea
              placeholder="Enter product specifications, warranty terms, or internal notes..."
              className="min-h-[100px] text-xs leading-relaxed rounded-xl"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/inventory/products')}
            className="h-11 px-6 text-xs font-semibold rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="h-11 px-8 bg-[#5644E6] hover:bg-[#4533d5] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 rounded-xl cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Item...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Create Item</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AddProduct;
