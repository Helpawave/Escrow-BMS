import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { Product, InvoiceItem } from '@/types/invoice';
import { CafeProductCard } from './CafeProductCard';

interface CafeProductGridProps {
  products: Product[];
  items: InvoiceItem[];
  currencySymbol: string;
  onAddProduct: (product: Product) => void;
}

export const CafeProductGrid: React.FC<CafeProductGridProps> = ({
  products,
  items,
  currencySymbol,
  onAddProduct
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Extract distinct categories from products
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q));

      const matchesCat = selectedCategory === 'All' || 
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());

      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="space-y-4">
      {/* Search & Category Tabs */}
      <Card className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search menu items (e.g. Espresso, Cold Coffee, Pizza, Sandwich)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl focus:border-amber-500 font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                  isSelected
                    ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </Card>

      {/* PRODUCTS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5">
        {filteredProducts.map((product) => {
          const inCartItem = items.find(
            it => (it.product_id && it.product_id === product.id) || 
                  (it.product_name && it.product_name.toLowerCase() === product.name.toLowerCase())
          );
          const cartQty = inCartItem ? Number(inCartItem.quantity) || 0 : 0;

          return (
            <CafeProductCard
              key={product.id}
              product={product}
              currencySymbol={currencySymbol}
              cartQty={cartQty}
              onAdd={onAddProduct}
            />
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
            <Coffee className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No dishes matched "{searchQuery}"</p>
            <p className="text-xs text-muted-foreground">Try searching for a different dish name or category.</p>
          </div>
        )}
      </div>
    </div>
  );
};
