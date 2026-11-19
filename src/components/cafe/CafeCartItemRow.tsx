import React from 'react';
import { Plus, Minus } from "lucide-react";
import { InvoiceItem } from '@/types/invoice';
import { getInstantProductThumbnail, extractProductImage, createFoodSvgFallback } from '@/services/foodImageApi';

interface CafeCartItemRowProps {
  item: InvoiceItem;
  originalIndex: number;
  currencySymbol: string;
  onIncrement: (index: number) => void;
  onDecrement: (index: number) => void;
  onRemove: (index: number) => void;
}

export const CafeCartItemRow: React.FC<CafeCartItemRowProps> = ({
  item,
  originalIndex,
  currencySymbol,
  onIncrement,
  onDecrement,
  onRemove
}) => {
  const itemRate = Number(item.rate) || 0;
  const itemQty = Number(item.quantity) || 1;
  const itemAmount = itemRate * itemQty;
  const thumb = extractProductImage({ description: item.description }) || getInstantProductThumbnail(item.product_name || '', item.description);

  return (
    <div className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
      {/* Left: Thumbnail & Name */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <img
          src={thumb}
          alt={item.product_name}
          className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-800"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.onerror = null;
            target.src = createFoodSvgFallback(item.product_name || 'Dish');
          }}
        />
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
            {item.product_name || item.description}
          </p>
          <p className="text-[11px] text-muted-foreground font-mono">
            {currencySymbol} {itemRate.toFixed(2)} each
          </p>
        </div>
      </div>

      {/* Center: Stepper */}
      <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => onDecrement(originalIndex)}
          className="w-6 h-6 flex items-center justify-center rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-600 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-6 text-center text-xs font-black font-mono">
          {itemQty}
        </span>
        <button
          type="button"
          onClick={() => onIncrement(originalIndex)}
          className="w-6 h-6 flex items-center justify-center rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-600 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Right: Amount & Delete */}
      <div className="text-right shrink-0 min-w-[70px]">
        <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 block">
          {currencySymbol} {itemAmount.toFixed(2)}
        </span>
        <button
          type="button"
          onClick={() => onRemove(originalIndex)}
          className="text-[10px] text-rose-500 hover:text-rose-700 font-medium cursor-pointer"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

