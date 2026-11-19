import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Scan } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCategory } from "@/utils/inventory";
import { Product } from "../types";

interface ProductGridCardProps {
  product: Product;
  searchTerm: string;
  highlightText: (text: string, search: string) => React.ReactNode;
  formatProductPrice: (amount: number) => string;
  getStockStatusBadge: (product: Product) => React.ReactNode;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onOpenBarcode: (product: Product) => void;
}

export const ProductGridCard: React.FC<ProductGridCardProps> = ({
  product,
  searchTerm,
  highlightText,
  formatProductPrice,
  getStockStatusBadge,
  onView,
  onEdit,
  onDelete,
  onOpenBarcode,
}) => {
  return (
    <Card
      className="p-4 bg-card border border-border/60 rounded-md shadow-sm hover:shadow-md transition-all group relative cursor-pointer"
      onClick={() => onView(product)}
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground text-sm line-clamp-1">
                {highlightText(product.name, searchTerm)}
              </h3>
              {Number(product.discount || 0) > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-emerald-100 text-emerald-700 shrink-0">
                  -{product.discount}%
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest truncate">
              {product.sku ? highlightText(product.sku, searchTerm) : 'No SKU'}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {product.sku && product.type !== 'service' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary hover:text-primary rounded-full bg-primary/5 hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenBarcode(product);
                }}
                title="Barcode/QR Code"
              >
                <Scan className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto border-t border-slate-100 dark:border-slate-800/50 pt-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-slate-400">SP:</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                {formatProductPrice(product.price || 0)}
              </span>
            </div>
            {product.type !== 'service' && (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-slate-400">CP:</span>
                  <span className="text-xs font-bold text-slate-650 dark:text-slate-400">
                    {formatProductPrice(product.purchase_price || 0)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-slate-400">Profit:</span>
                  <span className={cn(
                    "text-xs font-black",
                    (product.price - (product.purchase_price || 0)) >= 0 ? "text-emerald-600 dark:text-emerald-450" : "text-rose-600"
                  )}>
                    {formatProductPrice(product.price - (product.purchase_price || 0))}
                  </span>
                </div>
              </>
            )}
            <p className="text-[9px] text-muted-foreground font-semibold mt-0.5">{formatCategory(product.category)}</p>
          </div>
          <div className="flex flex-col items-end justify-between self-stretch">
            <div className="text-right">
              {getStockStatusBadge(product)}
              <p className="text-[10px] font-black text-slate-650 dark:text-slate-350 mt-1">
                Qty: {product.type === 'service' ? '—' : (product.opening_stock || 0)}
              </p>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary rounded-full hover:bg-primary/5"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(product);
                }}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-full hover:bg-destructive/5"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(product.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
