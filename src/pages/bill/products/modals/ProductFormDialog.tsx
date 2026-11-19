import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Tag, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCategory, CAFE_PRODUCT_CATEGORIES, CAFE_PRODUCT_UNITS, STANDARD_PRODUCT_CATEGORIES, STANDARD_PRODUCT_UNITS } from "@/utils/inventory";
import { useUserType } from "@/hooks/useUserType";
import { ProductFormData } from "../types";
import { fetchFoodImageByProductName, CAFE_PHOTO_PRESETS, getInstantProductThumbnail, createFoodSvgFallback } from "@/services/foodImageApi";
import { Sparkles, Loader2 } from "lucide-react";
import type { Vendor } from "@/pages/bill/Vendors";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onOpenHSNDialog: () => void;
  vendors: Vendor[];
  currencySymbol: string;
}

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  open,
  onOpenChange,
  editingId,
  formData,
  setFormData,
  onSubmit,
  onOpenHSNDialog,
  vendors,
  currencySymbol,
}) => {
  const { isCafe } = useUserType();
  const [isFetchingPhoto, setIsFetchingPhoto] = React.useState(false);
  const categories = isCafe ? CAFE_PRODUCT_CATEGORIES : STANDARD_PRODUCT_CATEGORIES;
  const units = isCafe ? CAFE_PRODUCT_UNITS : STANDARD_PRODUCT_UNITS;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <form id="product-page-form" onSubmit={onSubmit} className="space-y-8">
              {/* Basic Details Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4" /> Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-bold">Item Name <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder={isCafe ? "e.g. Cold Coffee / Margherita Pizza / Veg Burger" : "e.g. Premium Consulting Services"}
                      className="h-10 border-border bg-background text-sm"
                      value={formData.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          name: newName,
                        }));
                      }}
                      required
                    />
                  </div>

                  {/* Dish Image Preview & Auto-Fetch widget — ONLY FOR CAFE USERS */}
                  {isCafe && (
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border/80 rounded-xl">
                        {/* Live Image Preview */}
                        {(() => {
                          const candidate = formData.image_url && formData.image_url.startsWith('http')
                            ? formData.image_url
                            : '';

                          return (
                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-border/80 bg-background flex items-center justify-center shrink-0 shadow-2xs relative">
                              {candidate ? (
                                <img
                                  src={candidate}
                                  alt="Product preview"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = createFoodSvgFallback(formData.name || 'Preview');
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 bg-muted/20">
                                  <Package className="w-6 h-6" />
                                  <span className="text-[9px] font-bold mt-0.5">No Photo</span>
                                </div>
                              )}
                              {isFetchingPhoto && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        <div className="flex-1 space-y-1.5 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <span>Dish Photo</span>
                              <span className="text-[10px] text-muted-foreground font-normal">
                                (Optional)
                              </span>
                            </Label>

                            <div className="flex items-center gap-1.5">
                              {formData.image_url && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                                  className="h-7 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 px-2 rounded-lg"
                                >
                                  ✕ Remove
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={!formData.name?.trim() || isFetchingPhoto}
                                onClick={async () => {
                                  if (formData.name?.trim()) {
                                    setIsFetchingPhoto(true);
                                    try {
                                      const url = await fetchFoodImageByProductName(formData.name);
                                      if (url && url.startsWith('http')) {
                                        setFormData(prev => ({ ...prev, image_url: url }));
                                      } else {
                                        setFormData(prev => ({ ...prev, image_url: '' }));
                                      }
                                    } finally {
                                      setIsFetchingPhoto(false);
                                    }
                                  }
                                }}
                                className="h-7 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-500/10 gap-1.5 px-2.5 rounded-lg"
                              >
                                {isFetchingPhoto ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3.5 h-3.5" />
                                )}
                                <span>{isFetchingPhoto ? 'Fetching...' : 'Auto-Fetch Photo'}</span>
                              </Button>
                            </div>
                          </div>

                          <Input
                            placeholder="Optional: Paste photo URL, or click Auto-Fetch Photo / 1-Tap preset"
                            value={formData.image_url?.startsWith('data:') ? '' : (formData.image_url || '')}
                            onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                            className="h-8 text-xs font-mono bg-background border-border/70"
                          />

                          {/* 1-Tap Quick Category Photo Presets for Cafe Users */}
                          <div className="pt-1.5 space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                              ⚡ 1-Tap Dish Photo Presets:
                            </span>
                            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto scrollbar-none p-1 bg-muted/20 rounded-lg border border-border/40">
                              {CAFE_PHOTO_PRESETS.map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, image_url: preset.url }))}
                                  className={cn(
                                    "px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap",
                                    formData.image_url === preset.url
                                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                                      : "bg-background hover:bg-muted text-foreground border-border/60 hover:border-amber-400"
                                  )}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</Label>
                    <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                      <SelectTrigger className="h-10 border-border bg-background text-sm">
                        <SelectValue placeholder="Select Category">
                          {formatCategory(formData.category)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                        {formData.category && !categories.some(c => c.value.toLowerCase() === formData.category.toLowerCase()) && (
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
                        onClick={onOpenHSNDialog}
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
                        {units.map((u) => (
                          <SelectItem key={u.value} value={u.value}>
                            {u.label}
                          </SelectItem>
                        ))}
                        {formData.unit && !units.some(u => u.value.toLowerCase() === formData.unit.toLowerCase()) && (
                          <SelectItem value={formData.unit}>{formData.unit.toUpperCase()}</SelectItem>
                        )}
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
            onClick={() => onOpenChange(false)}
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
  );
};
