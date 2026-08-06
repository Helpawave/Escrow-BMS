import React, { useState, useEffect } from 'react';
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
  QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
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
  const queryClient = useQueryClient();

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
    as_of_date: new Date().toISOString().split('T')[0],
    low_stock_warning: false,
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

    setSaving(true);
    try {
      const productData = {
        user_id: user.id,
        name: formData.name.trim(),
        type: formData.type,
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        price_with_tax: formData.price_with_tax,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        unit: formData.unit,
        opening_stock: formData.type === 'service' ? 0 : (parseFloat(formData.opening_stock) || 0),
        description: formData.description.trim(),
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : 0,
        sku: formData.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        hsn_code: formData.hsn_code.trim(),
        barcode: formData.barcode.trim(),
        alternative_unit: formData.alternative_unit.trim(),
        as_of_date: formData.as_of_date,
        low_stock_warning: formData.low_stock_warning,
        vendor_id: formData.vendor_id && formData.vendor_id !== 'none' ? formData.vendor_id : null
      };

      const { data: insertData, error } = await supabase
        .from('products')
        .insert([productData])
        .select();

      if (error) throw error;

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/inventory/products')}
            className="rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              <span>Add New Product / Service</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Create a new item in your unified inventory catalog
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/inventory/products')}
            className="h-10 px-4 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-product-form"
            disabled={saving}
            className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Product</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <form id="add-product-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Tag className="w-4 h-4 text-indigo-500" />
            <span>Basic Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Item Name */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Item Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Wireless Ergonomic Mouse or Consulting Service"
                className="h-10 font-medium"
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
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product (Physical Stock Item)</SelectItem>
                  <SelectItem value="service">Service (Non-physical / Labor)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Items</SelectItem>
                  <SelectItem value="it">IT & Software</SelectItem>
                  <SelectItem value="hardware">Hardware & Electronics</SelectItem>
                  <SelectItem value="consulting">Consulting & Professional Services</SelectItem>
                  <SelectItem value="retail">Retail & E-commerce</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SKU / Item Code */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">SKU / Item Code</Label>
              <Input
                placeholder="Auto-generated if left blank"
                className="h-10 font-mono text-xs"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>

            {/* HSN / SAC Code */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">HSN / SAC Code</Label>
              <Input
                placeholder="e.g. 8471 or 9983"
                className="h-10 font-mono text-xs"
                value={formData.hsn_code}
                onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
              />
            </div>

            {/* Barcode Number */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-slate-400" />
                <span>Barcode / EAN</span>
              </Label>
              <Input
                placeholder="e.g. 8901234567890"
                className="h-10 font-mono text-xs"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
            </div>

            {/* Vendor (Optional) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-slate-400" />
                <span>Default Supplier / Vendor (Optional)</span>
              </Label>
              <Select
                value={formData.vendor_id}
                onValueChange={(val) => setFormData({ ...formData, vendor_id: val })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select Vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Vendor</SelectItem>
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Pricing & Tax Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span>Pricing & Tax Details</span>
          </h2>

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
                className="h-10 font-bold data-mono"
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
                className="h-10 font-bold data-mono"
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
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select Tax Rate" />
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
                <p className="text-[11px] text-slate-500 font-medium">Toggle if selling price already includes GST tax amount</p>
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
                className="h-10 font-medium"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Inventory & Stock Tracking Card */}
        {formData.type === 'product' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Layers className="w-4 h-4 text-purple-500" />
              <span>Inventory & Stock Tracking</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Unit */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Primary Unit of Measure</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(val) => setFormData({ ...formData, unit: val })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="m">Meters (m)</SelectItem>
                    <SelectItem value="ltr">Liters (ltr)</SelectItem>
                    <SelectItem value="box">Box (box)</SelectItem>
                    <SelectItem value="set">Set (set)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Opening Stock */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Opening Stock Quantity</Label>
                <Input
                  type="number"
                  placeholder="0"
                  className="h-10 font-bold data-mono"
                  value={formData.opening_stock}
                  onChange={(e) => setFormData({ ...formData, opening_stock: e.target.value })}
                />
              </div>

              {/* As Of Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">As Of Date</Label>
                <Input
                  type="date"
                  className="h-10 font-medium"
                  value={formData.as_of_date}
                  onChange={(e) => setFormData({ ...formData, as_of_date: e.target.value })}
                />
              </div>

              {/* Low Stock Warning */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl md:col-span-3">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Enable Low Stock Warning</p>
                  <p className="text-[11px] text-slate-500 font-medium">Receive dashboard alert when quantity drops below 5 units</p>
                </div>
                <Switch
                  checked={formData.low_stock_warning}
                  onCheckedChange={(val) => setFormData({ ...formData, low_stock_warning: val })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Description & Additional Info Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FileText className="w-4 h-4 text-blue-500" />
            <span>Description / Item Notes</span>
          </h2>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Detailed Description</Label>
            <Textarea
              placeholder="Add product specifications, notes, or invoice terms..."
              className="min-h-[100px] text-xs leading-relaxed"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/inventory/products')}
            className="h-11 px-6 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Product...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Create Product</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AddProduct;
