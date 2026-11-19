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
import { Package, Settings2, Scan, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCategory } from "@/utils/inventory";
import { extractProductImage, cleanProductDescription } from "@/services/foodImageApi";
import { useUserType } from "@/hooks/useUserType";
import { Product } from "../types";

interface ViewProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProduct: Product | null;
  currencySymbol: string;
  onEdit: (product: Product) => void;
  onOpenBarcode: (product: Product) => void;
}

export const ViewProductDialog: React.FC<ViewProductDialogProps> = ({
  open,
  onOpenChange,
  selectedProduct,
  currencySymbol,
  onEdit,
  onOpenBarcode,
}) => {
  const { isCafe } = useUserType();
  const imgUrl = (isCafe && selectedProduct) ? extractProductImage(selectedProduct) : null;
  const cleanedDesc = selectedProduct?.description ? cleanProductDescription(selectedProduct.description) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] w-full max-h-[96vh] overflow-y-auto p-0 bg-white dark:bg-slate-950 border-none shadow-2xl flex flex-col">
        <DialogHeader className="sticky top-0 z-10 w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 rounded-t-lg shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                {selectedProduct?.type === 'service' ? (
                  <Settings2 className="w-5 h-5 text-primary" />
                ) : (
                  <Package className="w-5 h-5 text-primary" />
                )}
                Product Details - {selectedProduct?.name}
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Detailed specifications and inventory status
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 md:p-6 bg-muted/5 flex-1 overflow-y-auto space-y-6">
          {imgUrl && (
            <div className="w-full h-44 sm:h-52 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative">
              <img
                src={imgUrl}
                alt={selectedProduct?.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-background border border-border rounded-md p-4 shadow-sm">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Selling Price</p>
              <p className="text-xl font-bold text-foreground">{currencySymbol}{Number(selectedProduct?.price || 0).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{selectedProduct?.tax_rate}% GST Applicable</p>
            </div>
            <div className="bg-background border border-border rounded-md p-4 shadow-sm">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Current Stock</p>
              {selectedProduct?.type === 'service' ? (
                <p className="text-xl font-bold text-muted-foreground">—</p>
              ) : (
                <p className={cn(
                  "text-xl font-bold",
                  Number(selectedProduct?.opening_stock || 0) <= 5 ? "text-destructive" : "text-emerald-500"
                )}>
                  {selectedProduct?.opening_stock || 0} <span className="text-[10px] font-semibold uppercase text-muted-foreground ml-1">{selectedProduct?.unit || 'pcs'}</span>
                </p>
              )}
            </div>
          </div>

          <div className="bg-background border border-border rounded-md overflow-hidden shadow-sm">
            <div className="grid grid-cols-2 gap-px bg-border">
              <div className="bg-background p-4 relative group">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">SKU / Item Code</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">{selectedProduct?.sku || 'N/A'}</p>
                  {selectedProduct?.sku && selectedProduct.type !== 'service' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenBarcode(selectedProduct)}
                      className="h-6 px-2 text-[9px] font-semibold uppercase bg-muted hover:bg-muted/80 text-primary rounded transition-all"
                    >
                      <Scan className="w-3 h-3 mr-1" />
                      Barcode ({selectedProduct?.opening_stock || 0})
                    </Button>
                  )}
                </div>
              </div>
              <div className="bg-background p-4">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Category</p>
                <p className="text-sm font-bold text-foreground">{formatCategory(selectedProduct?.category)}</p>
              </div>
              <div className="bg-background p-4">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">HSN Code</p>
                <p className="text-sm font-bold text-foreground">{selectedProduct?.hsn_code || 'N/A'}</p>
              </div>
              <div className="bg-background p-4">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Purchase Price</p>
                <p className="text-sm font-bold text-foreground">{selectedProduct?.purchase_price ? `${currencySymbol}${Number(selectedProduct.purchase_price).toLocaleString()}` : 'N/A'}</p>
              </div>
              <div className="bg-background p-4">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Discount</p>
                <p className="text-sm font-bold text-foreground">{selectedProduct?.discount ? `${selectedProduct.discount}%` : '0%'}</p>
              </div>
              <div className="bg-background p-4">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Profit per Unit</p>
                {selectedProduct?.type === 'service' ? (
                  <p className="text-sm font-bold text-muted-foreground">—</p>
                ) : (
                  <p className={cn(
                    "text-sm font-bold",
                    (Number(selectedProduct?.price || 0) - Number(selectedProduct?.purchase_price || 0)) >= 0 ? "text-emerald-600 dark:text-emerald-450" : "text-rose-600"
                  )}>
                    {currencySymbol}{(Number(selectedProduct?.price || 0) - Number(selectedProduct?.purchase_price || 0)).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="bg-background p-4">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Profit Margin</p>
                {selectedProduct?.type === 'service' ? (
                  <p className="text-sm font-bold text-muted-foreground">—</p>
                ) : (
                  <p className="text-sm font-bold text-foreground">
                    {selectedProduct?.price ? (((Number(selectedProduct.price) - Number(selectedProduct.purchase_price || 0)) / Number(selectedProduct.price)) * 100).toFixed(1) : 0}%
                  </p>
                )}
              </div>
            </div>
          </div>

          {cleanedDesc && (
            <div className="bg-background border border-border rounded-md p-4 shadow-sm">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Description</p>
              <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{cleanedDesc}</p>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border bg-muted/20 sm:justify-between items-center flex-row">
          <span className="text-[10px] text-muted-foreground hidden sm:inline-block">
            Added on: {selectedProduct?.created_at ? new Date(selectedProduct.created_at).toLocaleDateString() : 'N/A'}
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none font-semibold h-9 px-4 rounded-md text-xs"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white font-semibold h-9 px-5 rounded-md text-xs"
              onClick={() => {
                onOpenChange(false);
                if (selectedProduct) onEdit(selectedProduct);
              }}
            >
              <Edit className="w-3.5 h-3.5 mr-2" />
              Edit Item
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
