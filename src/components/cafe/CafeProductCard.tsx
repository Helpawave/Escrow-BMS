import React from 'react';
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Product } from '@/types/invoice';
import { getInstantProductThumbnail, extractProductImage, createFoodSvgFallback } from '@/services/foodImageApi';

interface CafeProductCardProps {
  product: Product;
  currencySymbol: string;
  cartQty: number;
  onAdd: (product: Product) => void;
}

export const CafeProductCard: React.FC<CafeProductCardProps> = ({
  product,
  currencySymbol,
  cartQty,
  onAdd
}) => {
  const rate = Number(product.selling_price || product.price || product.rate || 0);
  const imgUrl = (product as any).image_url || extractProductImage(product) || getInstantProductThumbnail(product.name, product.description);

  return (
    <div
      onClick={() => onAdd(product)}
      className={cn(
        "group relative flex flex-col justify-between p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 cursor-pointer hover:shadow-lg select-none",
        cartQty > 0
          ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/5 bg-amber-50/20 dark:bg-amber-950/20"
          : "border-slate-200/80 dark:border-slate-800 hover:border-amber-300"
      )}
    >
      {/* Photo Container */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2">
        <img
          src={imgUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.onerror = null;
            target.src = createFoodSvgFallback(product.name);
          }}
        />
        {cartQty > 0 && (
          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-amber-600 text-white font-mono font-black text-xs shadow-md">
            {cartQty}
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="space-y-1">
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-amber-600 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="font-black font-mono text-xs sm:text-sm text-amber-700 dark:text-amber-400">
            {currencySymbol} {rate.toFixed(2)}
          </span>
          {product.category && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
              {product.category}
            </span>
          )}
        </div>
      </div>

      {/* Add Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAdd(product);
        }}
        className={cn(
          "mt-2 w-full h-7 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all",
          cartQty > 0
            ? "bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
            : "bg-slate-100 hover:bg-amber-600 hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
        )}
      >
        <Plus className="w-3.5 h-3.5" />
        <span>{cartQty > 0 ? 'Add More' : 'Add to Bill'}</span>
      </button>
    </div>
  );
};

