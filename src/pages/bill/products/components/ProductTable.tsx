import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Scan } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCategory } from "@/utils/inventory";
import { extractProductImage } from "@/services/foodImageApi";
import { useUserType } from "@/hooks/useUserType";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Product } from "../types";

interface ProductTableProps {
  products: Product[];
  searchTerm: string;
  highlightText: (text: string, search: string) => React.ReactNode;
  formatProductPrice: (amount: number) => string;
  getStockStatusBadge: (product: Product) => React.ReactNode;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onOpenBarcode: (product: Product) => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  loading: boolean;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  searchTerm,
  highlightText,
  formatProductPrice,
  getStockStatusBadge,
  onView,
  onEdit,
  onDelete,
  onOpenBarcode,
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading,
}) => {
  const { isCafe } = useUserType();

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border/60 rounded-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="h-12">
                <TableHead className="font-semibold text-[10px] uppercase tracking-widest pl-6">Item Information</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-widest">Category</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-widest text-right">Purchase Price</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-widest text-right">Selling Price</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-widest text-right">Profit/Unit</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-widest text-center">Stock</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-widest text-center">Barcode</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-widest">Tax</TableHead>
                <TableHead className="text-right font-semibold text-[10px] uppercase tracking-widest pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow
                  key={product.id}
                  className="hover:bg-muted/40 transition-all cursor-pointer group h-14"
                  onClick={() => onView(product)}
                >
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      {isCafe && extractProductImage(product) && (
                        <img
                          src={extractProductImage(product)}
                          alt={product.name}
                          className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-800 shadow-2xs"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                          {highlightText(product.name, searchTerm)}
                        </div>
                        {product.sku && (
                          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            SKU: {highlightText(product.sku, searchTerm)}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                      {formatCategory(product.category)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-muted-foreground">{formatProductPrice(product.purchase_price || 0)}</TableCell>
                  <TableCell className="text-right font-bold text-foreground">{formatProductPrice(product.price || 0)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {product.type === 'service' ? (
                      <span className="text-slate-400 font-semibold text-xs">—</span>
                    ) : (
                      <div className="text-right">
                        <span className={cn(
                          "text-xs font-bold",
                          (product.price - (product.purchase_price || 0)) >= 0 ? "text-emerald-600 dark:text-emerald-450" : "text-rose-600"
                        )}>
                          {formatProductPrice(product.price - (product.purchase_price || 0))}
                        </span>
                        <span className="block text-[8px] text-slate-450 font-semibold">
                          ({product.price > 0 ? (((product.price - (product.purchase_price || 0)) / product.price) * 100).toFixed(0) : 0}% margin)
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {product.type === 'service' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-350 border border-slate-200 dark:border-slate-700/50">
                        Service
                      </span>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className={cn(
                          "font-black text-sm",
                          Number(product.opening_stock || 0) <= 0 ? "text-rose-600 dark:text-rose-450" :
                          Number(product.opening_stock || 0) <= 5 ? "text-amber-600 dark:text-amber-450" : "text-slate-800 dark:text-slate-100"
                        )}>
                          {Number(product.opening_stock || 0).toLocaleString()}
                          <span className="text-[10px] font-semibold text-muted-foreground ml-1 uppercase">{product.unit || 'PCS'}</span>
                        </span>
                        {getStockStatusBadge(product)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {product.sku && product.type !== 'service' ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-primary hover:bg-primary/5 mx-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenBarcode(product);
                        }}
                        title="Barcode/QR Code"
                      >
                        <Scan className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-[10px] font-semibold">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[10px] font-bold">{product.tax_rate}%</TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-primary/5"
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
                        className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/5"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(product.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="mt-6">
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          entityName="products"
          isLoading={loading}
        />
      </div>
    </div>
  );
};
