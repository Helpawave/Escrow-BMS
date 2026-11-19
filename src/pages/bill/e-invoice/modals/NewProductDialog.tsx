import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Scan, Tag, Truck } from "lucide-react";
import { NewProductFormData } from '../types';

export type { NewProductFormData };

interface NewProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: NewProductFormData;
  onFormDataChange: (data: NewProductFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  creatingProduct: boolean;
  onOpenHSNDialog: () => void;
  currencySymbol: string;
}

export const NewProductDialog: React.FC<NewProductDialogProps> = ({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  creatingProduct,
  onOpenHSNDialog,
  currencySymbol,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background">
        <DialogHeader className="p-4 md:p-8 pb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight">Create New Item</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full max-h-[75vh] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background custom-scrollbar">
            <form id="product-form" onSubmit={onSubmit} className="space-y-8">
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
                      value={formData.name}
                      onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                      required
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(val) => onFormDataChange({ ...formData, category: val })}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="IT & Software">IT & Software</SelectItem>
                        <SelectItem value="Hardware">Hardware</SelectItem>
                        <SelectItem value="Consulting">Consulting</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Unit</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(val) => onFormDataChange({ ...formData, unit: val })}
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
                        value={formData.sku}
                        onChange={(e) => onFormDataChange({ ...formData, sku: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          const randomId = Math.floor(100000000 + Math.random() * 900000000);
                          onFormDataChange({ ...formData, sku: randomId.toString() });
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
                        value={formData.hsn_code || ''}
                        onChange={(e) => onFormDataChange({ ...formData, hsn_code: e.target.value })}
                      />
                      <Button 
                        type="button" 
                        variant="link" 
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 text-[10px] font-bold"
                        onClick={onOpenHSNDialog}
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
                      value={formData.opening_stock}
                      onChange={(e) => onFormDataChange({ ...formData, opening_stock: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold">Description</Label>
                  <Textarea
                    placeholder="Product details..."
                    className="min-h-[80px]"
                    value={formData.description}
                    onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
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
                          value={formData.sales_price}
                          onChange={(e) => onFormDataChange({ ...formData, sales_price: e.target.value })}
                        />
                      </div>
                      <Select
                        value={formData.price_with_tax ? "with-tax" : "without-tax"}
                        onValueChange={(val) => onFormDataChange({ ...formData, price_with_tax: val === "with-tax" })}
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
                      value={formData.tax_rate}
                      onValueChange={(val) => onFormDataChange({ ...formData, tax_rate: val })}
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
                        value={formData.purchase_price}
                        onChange={(e) => onFormDataChange({ ...formData, purchase_price: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Discount (%)</Label>
                    <Input
                      placeholder="0"
                      type="number"
                      className="h-10"
                      value={formData.discount}
                      onChange={(e) => onFormDataChange({ ...formData, discount: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        <DialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5 border-t">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)} className="flex-1 h-12 font-bold rounded-xl border-2 m-0 hover:bg-muted/50">
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
  );
};
