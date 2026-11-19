import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatCategory } from "@/utils/inventory";
import { Minus, Plus, Search } from "lucide-react";
import { Product } from '../types';

interface ProductSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  selectedQuantities: Record<string, number>;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onSetQuantity: (productId: string, val: number) => void;
  onAddSelectedProducts: () => void;
  onOpenNewProductDialog: () => void;
  currencySymbol: string;
}

export const ProductSelectionDialog: React.FC<ProductSelectionDialogProps> = ({
  open,
  onOpenChange,
  products,
  selectedQuantities,
  onUpdateQuantity,
  onSetQuantity,
  onAddSelectedProducts,
  onOpenNewProductDialog,
  currencySymbol,
}) => {
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productCategory, setProductCategory] = useState("all");

  useEffect(() => {
    if (open) {
      setProductSearchQuery("");
      setProductCategory("all");
    }
  }, [open]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      (p.hsn_code || "").toLowerCase().includes(productSearchQuery.toLowerCase());
    const matchesCategory = productCategory === "all" || 
      (p.category || "").toLowerCase() === productCategory.toLowerCase() ||
      formatCategory(p.category).toLowerCase() === productCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const selectedCount = Object.values(selectedQuantities).filter(q => q > 0).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[1200px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background">
        <DialogHeader className="p-4 md:p-8 pb-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-3xl font-black tracking-tight leading-tight">Select Products</DialogTitle>
              <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest mt-1">Add one or more items to your bill</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild className="h-12 px-6 font-black rounded-xl border-2 uppercase text-[10px] tracking-widest hidden md:flex">
                <Link to="/products">Manage Catalog</Link>
              </Button>
              <Button
                variant="hero"
                onClick={() => {
                  onOpenChange(false);
                  onOpenNewProductDialog();
                }}
                className="h-12 px-8 font-black rounded-xl shadow-lg shadow-primary/20"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Product
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 border-b flex flex-col md:flex-row items-center gap-4 bg-muted/20 z-20">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items, HSN, or categories..."
              className="pl-9 h-10 text-sm rounded-md bg-background focus-visible:ring-primary/20"
              value={productSearchQuery}
              onChange={(e) => setProductSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full md:w-56 shrink-0">
            <Select value={productCategory} onValueChange={setProductCategory}>
              <SelectTrigger className="h-10 rounded-md bg-background font-medium">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="it">IT & Software</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="consulting">Consulting</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => {
              onOpenChange(false);
              onOpenNewProductDialog();
            }}
            className="h-10 px-6 font-bold rounded-md w-full md:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Item
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Mobile View for Product Selection */}
          <div className="md:hidden space-y-4 p-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="p-5 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/40 shadow-xl shadow-black/5 space-y-5 active:scale-[0.98] transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                <div className="flex justify-between items-start gap-4 relative z-10">
                  <div className="space-y-1.5">
                    <h4 className="text-lg font-black text-foreground tracking-tight leading-tight">{product.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">
                      <span>{product.sku || 'No SKU'}</span>
                      {product.hsn_code && <span>• HSN: {product.hsn_code}</span>}
                      <span>• {formatCategory(product.category)}</span>
                    </div>
                    <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                      {currencySymbol}{product.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40 mb-0.5">Stock</p>
                    <p className="font-black text-xs text-foreground bg-muted/30 px-2 py-1 rounded-lg">
                      {product.opening_stock || '0'} <span className="text-[10px] opacity-60 ml-0.5">{product.unit?.toUpperCase() || 'PCS'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border/10 relative z-10">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Select Quantity</p>
                  <div className="flex items-center border border-border/50 rounded-2xl h-11 bg-background/50 backdrop-blur-md overflow-hidden shadow-inner">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 rounded-none hover:bg-muted/50 border-r border-border/20 active:scale-90 transition-transform"
                      onClick={() => onUpdateQuantity(product.id, -1)}
                      disabled={(selectedQuantities[product.id] || 0) === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <input
                      type="number"
                      className="w-14 text-center font-black text-sm focus:outline-none bg-transparent text-foreground"
                      value={selectedQuantities[product.id] || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        onSetQuantity(product.id, Math.max(0, val));
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 rounded-none hover:bg-muted/50 border-l border-border/20 active:scale-95 transition-transform"
                      onClick={() => onUpdateQuantity(product.id, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-muted/30 sticky top-0 z-10 border-b">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-black text-xs uppercase tracking-widest py-4 px-6">Item Name</TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-widest py-4 px-4 text-center">SKU / HSN</TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-widest py-4 px-4 text-center">In Stock</TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-widest py-4 px-4">Market Price</TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-widest py-4 px-6 text-center">Selection</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/10 transition-colors h-20 border-b">
                    <TableCell className="px-6">
                       <div className="flex flex-col gap-0.5">
                          <span className="font-black text-foreground text-sm leading-tight tracking-tight">{product.name}</span>
                          <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">{formatCategory(product.category)}</span>
                       </div>
                    </TableCell>
                    <TableCell className="px-4 text-center">
                       <Badge variant="outline" className="text-[10px] font-black uppercase border-2 py-0.5">
                          {product.sku || (product.hsn_code ? `HSN:${product.hsn_code}` : 'NO-SKU')}
                       </Badge>
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      <span className={cn(
                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-border/20",
                        (parseInt(product.opening_stock || '0') > 10)
                          ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
                      )}>
                        {product.opening_stock || '0'} {product.unit?.toUpperCase() || 'PCS'}
                      </span>
                    </TableCell>
                    <TableCell className="font-black text-indigo-600 dark:text-indigo-400 px-4">{currencySymbol}{product.price.toLocaleString()}</TableCell>
                    <TableCell className="px-6">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center border-2 border-border/40 rounded-xl h-12 bg-background shadow-md overflow-hidden relative group-hover:border-primary/30 transition-colors">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-full w-12 rounded-none border-r-2 border-border/20 hover:bg-muted active:scale-90 transition-transform"
                            onClick={() => onUpdateQuantity(product.id, -1)}
                            disabled={(selectedQuantities[product.id] || 0) === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <input
                            type="number"
                            className="w-14 text-center font-black text-sm focus:outline-none bg-transparent"
                            value={selectedQuantities[product.id] || 0}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              onSetQuantity(product.id, Math.max(0, val));
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-full w-12 rounded-none border-l-2 border-border/20 hover:bg-muted active:scale-95 transition-transform"
                            onClick={() => onUpdateQuantity(product.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <div className="bg-muted/10 px-2 h-full flex items-center text-[9px] font-bold text-muted-foreground border-l-2 border-border/10 uppercase">
                            {product.unit?.toUpperCase() || 'PCS'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              
                {/* Visual cue to add more items */}
                <TableRow
                  className="hover:bg-transparent border-none cursor-pointer group"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenNewProductDialog();
                  }}
                >
                  <TableCell colSpan={6} className="py-8 px-6">
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 md:p-6 flex flex-col items-center justify-center gap-3 text-slate-400 group-hover:border-indigo-500/50 group-hover:text-indigo-500 transition-all bg-slate-50/30 dark:bg-slate-900/30 group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-950/20">
                      <Plus className="w-6 h-6" />
                      <div className="flex flex-col items-center">
                        <span className="font-black tracking-tight text-sm uppercase">Add New Product to Catalog</span>
                        <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Create a new item that isn't listed here</span>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5 shrink-0 items-center justify-between sm:flex-row sm:space-x-0">
           <div className="hidden md:flex items-center gap-4 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
             <span className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">Enter ↵ : Search</span>
             <span className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">↑ ↓ : Navigate</span>
           </div>

           <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
             <div className="text-sm font-black text-primary uppercase tracking-widest">
               {selectedCount} Selected Items
             </div>
             <div className="flex gap-4">
               <Button 
                 variant="outline" 
                 onClick={() => onOpenChange(false)} 
                 className="h-12 font-bold rounded-xl border-2 px-8 uppercase text-[10px] tracking-widest hover:bg-muted"
               >
                 Cancel
               </Button>
               <Button
                 onClick={onAddSelectedProducts}
                 className="h-12 font-black rounded-xl shadow-xl shadow-primary/25 bg-primary hover:opacity-95 text-primary-foreground uppercase tracking-widest px-10 active:scale-[0.98] transition-all"
                 disabled={selectedCount === 0}
               >
                 Add Items
               </Button>
             </div>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
