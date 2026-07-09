import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CreditCard, Package, Scan, Trash2, Search, Plus } from "lucide-react";
import { InvoiceItem, Product, Expense } from '@/types/invoice';

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
  setItems: (items: InvoiceItem[]) => void;
  removeItem: (index: number) => void;
  updateItemAmount: (index: number, field: keyof InvoiceItem, value: number) => void;
  onProductSearchClick: (index: number | null) => void;
  currencySymbol: string;
  addItem: () => void;
  setProductSelectionOpen: (open: boolean) => void;
  setActiveItemIndex: (index: number | null) => void;
  setIsScannerOpen: (open: boolean) => void;
}

export const InvoiceItemsTable: React.FC<InvoiceItemsTableProps> = ({
  items,
  setItems,
  removeItem,
  updateItemAmount,
  onProductSearchClick,
  currencySymbol,
  addItem,
  setProductSelectionOpen,
  setActiveItemIndex,
  setIsScannerOpen
}) => {
  return (
    <div className="overflow-x-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Label className="text-xs font-black uppercase tracking-widest text-slate-500 opacity-60">Invoice Items</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="hero" onClick={() => onProductSearchClick(null)} aria-label="Add items" className="w-full sm:w-auto rounded-xl font-bold h-11 px-6 shadow-lg shadow-indigo-500/20">
            <Package className="w-4 h-4 mr-2" />
            Add Product
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsScannerOpen(true)}
            className="w-full sm:w-auto h-11 px-6 font-bold border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
          >
            <Scan className="w-4 h-4 mr-2" />
            Scan Code
          </Button>
        </div>
      </div>

      {/* Column Headers (Desktop) */}
      <div className="hidden md:grid grid-cols-12 gap-2 mb-2 pb-2 border-b border-border min-w-[800px]">
        <div className="col-span-2">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">Product</Label>
        </div>
        <div className="col-span-3">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">Description</Label>
        </div>
        <div className="col-span-1 text-center">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">Qty</Label>
        </div>
        <div className="col-span-2">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">Price</Label>
        </div>
        <div className="col-span-1 text-center">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">Disc %</Label>
        </div>
        <div className="col-span-1 text-center">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">GST %</Label>
        </div>
        <div className="col-span-1 text-right">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">Amount</Label>
        </div>
        <div className="col-span-1 text-center">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">Action</Label>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {items.map((item, index) => (
          <Card key={index} className="p-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] relative overflow-hidden shadow-sm">
            <div className="flex justify-between items-start mb-4 gap-3">
              <div className="flex-1 min-w-0">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between font-bold h-12 px-4 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                  onClick={() => onProductSearchClick(index)}
                >
                  <span className="truncate text-slate-700">
                    {item.description || "Select Product"}
                  </span>
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50 text-indigo-500" />
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                className="h-10 w-10 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-full shrink-0 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Description</Label>
                <Input
                  placeholder="Item details..."
                  value={item.description}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].description = e.target.value;
                    setItems(newItems);
                  }}
                  className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Quantity</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={item.quantity === 0 ? '' : `${item.quantity}`}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                        if (raw === '') {
                          const newItems = [...items];
                          newItems[index] = { ...newItems[index], quantity: 0 };
                          setItems(newItems);
                        } else {
                          updateItemAmount(index, 'quantity', Number(raw));
                        }
                      }}
                      className="h-11 pr-10 rounded-xl font-bold bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-center"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase pointer-events-none">
                      PCS
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{currencySymbol}</span>
                    <Input
                      type="number"
                      value={item.rate || ''}
                      onChange={(e) => updateItemAmount(index, 'rate', Number(e.target.value) || 0)}
                      className="h-11 pl-7 rounded-xl font-bold bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Discount %</Label>
                  <Input
                    type="number"
                    value={item.discount || ''}
                    onChange={(e) => updateItemAmount(index, 'discount', Number(e.target.value) || 0)}
                    className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-bold text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">GST %</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={item.tax_rate === 0 ? '' : `${item.tax_rate}`}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9.]/g, '');
                      if (raw === '') {
                        const newItems = [...items];
                        newItems[index] = { ...newItems[index], tax_rate: 0 };
                        setItems(newItems);
                      } else {
                        updateItemAmount(index, 'tax_rate', Number(raw));
                      }
                    }}
                    className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-bold text-center"
                  />
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center bg-indigo-50/30 -mx-5 px-5 -mb-5 py-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Total Amount</span>
                <span className="text-lg font-black text-indigo-600">{currencySymbol} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block space-y-3 min-w-[800px]">
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-center group relative">
            <div className="col-span-2">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between font-normal text-muted-foreground h-10 rounded-xl border-slate-200 truncate"
                onClick={() => onProductSearchClick(index)}
              >
                <span className="truncate">
                  {item.description || "Select Product"}
                </span>
                <Search className="ml-1 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </div>
            <div className="col-span-3">
              <Input
                placeholder="Description"
                value={item.description}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[index].description = e.target.value;
                  setItems(newItems);
                }}
                className="h-10 rounded-xl bg-background border-slate-200"
              />
            </div>
            <div className="col-span-1">
              <div className="relative flex items-center">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Qty"
                  value={item.quantity === 0 ? '' : `${item.quantity}`}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9.]/g, '');
                    if (raw === '') {
                      const newItems = [...items];
                      newItems[index] = { ...newItems[index], quantity: 0 };
                      setItems(newItems);
                    } else {
                      updateItemAmount(index, 'quantity', Number(raw));
                    }
                  }}
                  onBlur={(e) => {
                    const raw = e.target.value.replace(/[^0-9.]/g, '');
                    if ((raw === '' || Number(raw) === 0) && items.length > 1) {
                      setItems(items.filter((_, i) => i !== index));
                    }
                  }}
                  className="h-10 text-center rounded-xl bg-background border-slate-200"
                />
              </div>
            </div>
            <div className="col-span-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground opacity-50">{currencySymbol}</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Rate"
                  value={item.rate || ''}
                  onChange={(e) => updateItemAmount(index, 'rate', Number(e.target.value) || 0)}
                  className="h-10 pl-6 rounded-xl font-bold bg-background border-slate-200"
                />
              </div>
            </div>
            <div className="col-span-1">
              <Input
                type="number"
                step="1"
                min="0"
                max="100"
                placeholder="0"
                value={item.discount || ''}
                onChange={(e) => updateItemAmount(index, 'discount', Number(e.target.value) || 0)}
                className="h-10 text-center rounded-xl bg-background border-slate-200"
              />
            </div>
            <div className="col-span-1">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={item.tax_rate === 0 ? '' : `${item.tax_rate}`}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9.]/g, '');
                  if (raw === '') {
                    const newItems = [...items];
                    newItems[index] = { ...newItems[index], tax_rate: 0 };
                    setItems(newItems);
                  } else {
                    updateItemAmount(index, 'tax_rate', Number(raw));
                  }
                }}
                onBlur={(e) => {
                  const raw = e.target.value.replace(/[^0-9.]/g, '');
                  if (raw === '') updateItemAmount(index, 'tax_rate', 0);
                }}
                className="h-10 text-center rounded-xl bg-background border-slate-200"
              />
            </div>
            <div className="col-span-1 text-right">
              <span className="text-sm font-black text-primary">{currencySymbol} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="col-span-1 flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl"
                aria-label={`Remove item ${index + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          className="w-full max-w-xs border-dashed border-2 hover:border-primary hover:text-primary transition-all rounded-xl h-12 font-bold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add More Items
        </Button>
      </div>
    </div>
  );
};
