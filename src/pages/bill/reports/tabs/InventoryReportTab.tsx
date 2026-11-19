import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Package,
  ShoppingBag,
  Filter,
  Search,
  ArrowUpDown,
  BarChart3,
} from 'lucide-react';
import { CatalogProduct, ItemReportData } from '../types';

export interface InventoryStats {
  totalUnique: number;
  totalStockQty: number;
  totalPurchaseVal: number;
  totalSalesVal: number;
  totalProfit: number;
  profitMarginPercent: number;
}

export interface ItemProfitStats {
  totalItems: number;
  totalUnitsSold: number;
  totalSalesVal: number;
  totalCostVal: number;
  totalProfitVal: number;
  avgMargin: number;
}

export interface InventoryTaxBracket {
  rate: number;
  itemsCount: number;
  taxableValue: number;
  taxAmount: number;
  totalValue: number;
}

export interface InventoryReportTabProps {
  productReportSubTab: 'stock' | 'profit';
  setProductReportSubTab: (tab: 'stock' | 'profit') => void;
  catalogProducts: CatalogProduct[];
  itemsReports: ItemReportData[];
  exportInventoryExcel: () => void;
  exportInventoryPDF: (isPrint?: boolean) => void;
  exportInventoryCSV: () => void;
  exportItemsExcel: () => void;
  exportItemsPDF: (isPrint?: boolean) => void;
  inventoryStats: InventoryStats;
  currencySymbol: string;
  showInventoryTaxBreakdown: boolean;
  setShowInventoryTaxBreakdown: (show: boolean) => void;
  inventoryTaxBrackets: InventoryTaxBracket[];
  inventorySearch: string;
  setInventorySearch: (value: string) => void;
  inventoryCategoryFilter: string;
  setInventoryCategoryFilter: (value: string) => void;
  inventoryCategories: string[];
  inventoryTypeFilter: string;
  setInventoryTypeFilter: (value: string) => void;
  inventoryStockFilter: string;
  setInventoryStockFilter: (value: string) => void;
  handleInventorySort: (field: string) => void;
  filteredAndSortedInventoryProducts: CatalogProduct[];
  itemProfitStats: ItemProfitStats;
  itemSearchTerm: string;
  setItemSearchTerm: (value: string) => void;
  filteredAndSortedItems: ItemReportData[];
  handleItemSort: (field: string) => void;
  itemSortField: string;
  itemSortDirection: 'asc' | 'desc';
  filteredItemTotals: {
    units: number;
    sales: number;
    cost: number;
    profit: number;
  };
}

export const InventoryReportTab: React.FC<InventoryReportTabProps> = ({
  productReportSubTab,
  setProductReportSubTab,
  catalogProducts,
  itemsReports,
  exportInventoryExcel,
  exportInventoryPDF,
  exportInventoryCSV,
  exportItemsExcel,
  exportItemsPDF,
  inventoryStats,
  currencySymbol,
  showInventoryTaxBreakdown,
  setShowInventoryTaxBreakdown,
  inventoryTaxBrackets,
  inventorySearch,
  setInventorySearch,
  inventoryCategoryFilter,
  setInventoryCategoryFilter,
  inventoryCategories,
  inventoryTypeFilter,
  setInventoryTypeFilter,
  inventoryStockFilter,
  setInventoryStockFilter,
  handleInventorySort,
  filteredAndSortedInventoryProducts,
  itemProfitStats,
  itemSearchTerm,
  setItemSearchTerm,
  filteredAndSortedItems,
  handleItemSort,
  itemSortField,
  itemSortDirection,
  filteredItemTotals,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Bar with Sub-tabs and Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Sub-tab Switcher */}
        <div className="inline-flex bg-muted/70 p-1 rounded-xl border border-border/70 self-start">
          <button
            type="button"
            onClick={() => setProductReportSubTab('stock')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              productReportSubTab === 'stock'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="w-4 h-4 text-amber-500" />
            <span>Stock Valuation</span>
            <span className="text-xs text-muted-foreground font-normal">({catalogProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setProductReportSubTab('profit')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              productReportSubTab === 'profit'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-cyan-500" />
            <span>Item Profitability</span>
            <span className="text-xs text-muted-foreground font-normal">({itemsReports.length})</span>
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {productReportSubTab === 'stock' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={exportInventoryExcel}
                className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportInventoryPDF(false)}
                className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
              >
                <Download className="w-4 h-4 mr-1.5 text-rose-600" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportInventoryCSV}
                className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
              >
                <Download className="w-4 h-4 mr-1.5 text-blue-600" />
                CSV
              </Button>
              <Button
                onClick={() => exportInventoryPDF(true)}
                size="sm"
                className="font-semibold text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={exportItemsExcel}
                className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportItemsPDF(false)}
                className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
              >
                <Download className="w-4 h-4 mr-1.5 text-rose-600" />
                PDF
              </Button>
              <Button
                onClick={() => exportItemsPDF(true)}
                size="sm"
                className="font-semibold text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print
              </Button>
            </>
          )}
        </div>
      </div>

      {productReportSubTab === 'stock' && (
        <div className="space-y-6">
          {/* 5 Clean Stock Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground block">Total Products</span>
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                {inventoryStats.totalUnique.toLocaleString('en-IN')}
              </p>
            </Card>

            <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground block">Stock on Hand</span>
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                {inventoryStats.totalStockQty.toLocaleString('en-IN')} <span className="text-xs font-normal text-muted-foreground">units</span>
              </p>
            </Card>

            <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground block">Total Cost Value</span>
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                {currencySymbol}{inventoryStats.totalPurchaseVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </Card>

            <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground block">Total Retail Value</span>
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                {currencySymbol}{inventoryStats.totalSalesVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </Card>

            <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1 col-span-2 lg:col-span-1">
              <span className="text-[11px] font-semibold text-muted-foreground block">Expected Profit</span>
              <div className="flex items-baseline gap-2">
                <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {currencySymbol}{inventoryStats.totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
                <span className="text-xs font-semibold text-muted-foreground">
                  ({inventoryStats.profitMarginPercent.toFixed(1)}%)
                </span>
              </div>
            </Card>
          </div>

          {/* GST Tax Bracket Inventory Summary (Collapsible) */}
          <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
            <button
              onClick={() => setShowInventoryTaxBreakdown(!showInventoryTaxBreakdown)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors text-xs font-bold text-foreground"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                <span>GST Tax Bracket Stock Summary ({inventoryTaxBrackets.length} Brackets Active)</span>
              </div>
              <span className="text-[11px] text-primary hover:underline font-bold">
                {showInventoryTaxBreakdown ? "Hide Summary ▲" : "Show Summary ▼"}
              </span>
            </button>

            {showInventoryTaxBreakdown && (
              <div className="p-4 border-t border-border/60 bg-muted/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                {inventoryTaxBrackets.length === 0 ? (
                  <p className="text-xs text-muted-foreground col-span-full py-2">No products with tax rates found.</p>
                ) : (
                  inventoryTaxBrackets.map((bracket) => (
                    <div key={bracket.rate} className="p-3.5 bg-card border border-border/60 rounded-xl space-y-1.5 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">GST {bracket.rate}%</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{bracket.itemsCount} items</span>
                      </div>
                      <div className="space-y-1 pt-1 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Taxable Cost:</span>
                          <span className="font-semibold text-foreground">{currencySymbol}{bracket.taxableValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>GST Amount:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{currencySymbol}{bracket.taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between border-t border-border/60 pt-1.5 mt-1 font-bold text-xs">
                          <span>Total Asset:</span>
                          <span className="text-primary font-black">{currencySymbol}{bracket.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>

          {/* Interactive Filters Bar */}
          <Card className="p-4 sm:p-5 rounded-2xl border border-border/70 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Search Catalog</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, SKU, HSN..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="pl-9 h-10 text-xs rounded-xl bg-background border-border/70 font-medium"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</Label>
                <Select value={inventoryCategoryFilter} onValueChange={setInventoryCategoryFilter}>
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-background border-border/70 font-semibold">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl">
                    <SelectItem value="all">All Categories</SelectItem>
                    {inventoryCategories.map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Item Type</Label>
                <Select value={inventoryTypeFilter} onValueChange={setInventoryTypeFilter}>
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-background border-border/70 font-semibold">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="product">Products Only</SelectItem>
                    <SelectItem value="service">Services Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Stock Level Status</Label>
                <Select value={inventoryStockFilter} onValueChange={setInventoryStockFilter}>
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-background border-border/70 font-semibold">
                    <SelectValue placeholder="All Stock Levels" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl">
                    <SelectItem value="all">All Stock Levels</SelectItem>
                    <SelectItem value="in_stock">In Stock (&gt; 5)</SelectItem>
                    <SelectItem value="low_stock">Low Stock (1 to 5)</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock (0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Category Badges */}
            {inventoryCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50">
                <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1.5">Categories:</span>
                <button
                  onClick={() => setInventoryCategoryFilter("all")}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all ${
                    inventoryCategoryFilter === "all"
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  All ({catalogProducts.length})
                </button>
                {inventoryCategories.map(cat => {
                  const count = catalogProducts.filter(p => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setInventoryCategoryFilter(inventoryCategoryFilter === cat ? "all" : cat)}
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize transition-all ${
                        inventoryCategoryFilter === cat
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Full Standard Inventory Table */}
          <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
                  <tr>
                    <th className="px-3 py-3 w-10 text-center">#</th>
                    <th onClick={() => handleInventorySort('name')} className="px-4 py-3 min-w-[180px] cursor-pointer hover:bg-muted/80 transition-colors">
                      <div className="flex items-center gap-1">
                        Item Description
                        <ArrowUpDown className="w-3 h-3 text-primary" />
                      </div>
                    </th>
                    <th className="px-3 py-3 text-center">Unit</th>
                    <th className="px-3 py-3 text-center">GST %</th>
                    <th className="px-3 py-3 text-right">Cost Rate</th>
                    <th className="px-3 py-3 text-right">Sale Price</th>
                    <th onClick={() => handleInventorySort('stock')} className="px-4 py-3 text-center cursor-pointer hover:bg-muted/80 transition-colors">
                      <div className="flex items-center justify-center gap-1">
                        Stock
                        <ArrowUpDown className="w-3 h-3 text-primary" />
                      </div>
                    </th>
                    <th onClick={() => handleInventorySort('cost')} className="px-4 py-3 text-right cursor-pointer hover:bg-muted/80 transition-colors">
                      <div className="flex items-center justify-end gap-1">
                        Cost Valuation
                        <ArrowUpDown className="w-3 h-3 text-primary" />
                      </div>
                    </th>
                    <th onClick={() => handleInventorySort('sale')} className="px-4 py-3 text-right cursor-pointer hover:bg-muted/80 transition-colors">
                      <div className="flex items-center justify-end gap-1">
                        Sale Valuation
                        <ArrowUpDown className="w-3 h-3 text-primary" />
                      </div>
                    </th>
                    <th onClick={() => handleInventorySort('profit')} className="px-4 py-3 text-right cursor-pointer hover:bg-muted/80 transition-colors">
                      <div className="flex items-center justify-end gap-1">
                        Est. Profit
                        <ArrowUpDown className="w-3 h-3 text-primary" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredAndSortedInventoryProducts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-muted-foreground font-semibold">
                        No inventory products match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedInventoryProducts.map((p, idx) => {
                      const stock = p.type === 'service' ? 0 : Number(p.opening_stock || 0);
                      const costVal = stock * Number(p.purchase_price || 0);
                      const saleVal = stock * p.price;
                      const profit = saleVal - costVal;
                      const margin = p.price > 0 ? ((p.price - Number(p.purchase_price || 0)) / p.price) * 100 : 0;

                      return (
                        <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-3 py-3 text-center font-bold text-muted-foreground tabular-nums">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-foreground leading-tight">{p.name}</div>
                            <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                              <span className="text-[9px] bg-muted text-muted-foreground capitalize px-1.5 py-0.2 rounded font-semibold">
                                {p.type || 'product'}
                              </span>
                              {p.sku && (
                                <span className="text-[9px] text-muted-foreground font-mono">
                                  SKU: {p.sku}
                                </span>
                              )}
                              {p.hsn_code && (
                                <span className="text-[9px] text-muted-foreground font-mono">
                                  HSN: {p.hsn_code}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center text-muted-foreground font-medium capitalize">
                            {p.type === 'service' ? '—' : (p.unit || 'pcs')}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-foreground tabular-nums">
                            {p.tax_rate}%
                          </td>
                          <td className="px-3 py-3 text-right font-medium text-muted-foreground tabular-nums">
                            {currencySymbol}{(p.purchase_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-foreground tabular-nums">
                            {currencySymbol}{p.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {p.type === 'service' ? (
                              <span className="text-muted-foreground font-semibold text-[10px]">Service</span>
                            ) : stock <= 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                                Out of Stock (0)
                              </span>
                            ) : stock <= 5 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                                Low Stock ({stock})
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                                {stock} {p.unit || 'pcs'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground tabular-nums">
                            {p.type === 'service' ? '—' : `${currencySymbol}${costVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground tabular-nums">
                            {p.type === 'service' ? '—' : `${currencySymbol}${saleVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {p.type === 'service' ? (
                              <span className="text-muted-foreground font-medium text-[10px]">—</span>
                            ) : (
                              <div>
                                <span className={`font-bold tabular-nums ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
                                  {currencySymbol}{profit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </span>
                                <span className="block text-[9px] text-muted-foreground font-semibold">
                                  {margin.toFixed(1)}% margin
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Summary Total Row */}
                  {filteredAndSortedInventoryProducts.length > 0 && (
                    <tr className="bg-muted/60 font-bold border-t-2 border-border/80 text-foreground">
                      <td colSpan={2} className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Total</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">—</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">—</td>
                      <td className="px-3 py-3 text-right text-muted-foreground">—</td>
                      <td className="px-3 py-3 text-right text-muted-foreground">—</td>
                      <td className="px-4 py-3 text-center text-xs font-bold tabular-nums">
                        {inventoryStats.totalStockQty.toLocaleString('en-IN')} units
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold tabular-nums">
                        {currencySymbol}{inventoryStats.totalPurchaseVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold tabular-nums">
                        {currencySymbol}{inventoryStats.totalSalesVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {currencySymbol}{inventoryStats.totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Items Profit & Performance Sub-View */}
      {productReportSubTab === 'profit' && (
        <div className="space-y-6">
          {/* 5 Clean Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground block">Products Sold</span>
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                {itemProfitStats.totalItems.toLocaleString('en-IN')}
              </p>
            </Card>

            <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground block">Quantity Sold</span>
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                {itemProfitStats.totalUnitsSold.toLocaleString('en-IN')} <span className="text-xs font-normal text-muted-foreground">units</span>
              </p>
            </Card>

            <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground block">Sales Revenue</span>
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                {currencySymbol}{itemProfitStats.totalSalesVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </Card>

            <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground block">Purchase Cost (COGS)</span>
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                {currencySymbol}{itemProfitStats.totalCostVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </Card>

            <Card className="p-3 sm:p-4 rounded-2xl border border-border/70 shadow-sm bg-card space-y-1 col-span-2 lg:col-span-1">
              <span className="text-[11px] font-semibold text-muted-foreground block">Net Profit</span>
              <div className="flex items-baseline gap-2">
                <p className={`text-xl sm:text-2xl font-bold tabular-nums ${
                  itemProfitStats.totalProfitVal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"
                }`}>
                  {currencySymbol}{itemProfitStats.totalProfitVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
                <span className="text-xs font-semibold text-muted-foreground">
                  ({itemProfitStats.avgMargin.toFixed(1)}%)
                </span>
              </div>
            </Card>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={itemSearchTerm}
                onChange={(e) => setItemSearchTerm(e.target.value)}
                placeholder="Search product name, SKU, HSN..."
                className="pl-9 h-10 text-xs rounded-xl bg-card border-border/70 font-medium"
              />
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {filteredAndSortedItems.length} products
            </span>
          </div>

          {/* Full Sortable Items Profit Table */}
          <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
            {filteredAndSortedItems && filteredAndSortedItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/70 border-b border-border/70 text-muted-foreground uppercase text-[10px] font-black tracking-wider">
                    <tr>
                      <th onClick={() => handleItemSort('name')} className="px-4 py-3.5 text-left cursor-pointer select-none hover:bg-muted transition-colors rounded-tl-xl">
                        <div className="flex items-center gap-1">
                          Item Name
                          <span className="text-[10px] text-primary">
                            {itemSortField === 'name' ? (itemSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                          </span>
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-center">SKU / HSN</th>
                      <th onClick={() => handleItemSort('quantity')} className="px-4 py-3.5 text-right cursor-pointer select-none hover:bg-muted transition-colors">
                        <div className="flex items-center justify-end gap-1">
                          Qty Sold
                          <span className="text-[10px] text-primary">
                            {itemSortField === 'quantity' ? (itemSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                          </span>
                        </div>
                      </th>
                      <th onClick={() => handleItemSort('sales')} className="px-4 py-3.5 text-right cursor-pointer select-none hover:bg-muted transition-colors">
                        <div className="flex items-center justify-end gap-1">
                          Revenue (Sales)
                          <span className="text-[10px] text-primary">
                            {itemSortField === 'sales' ? (itemSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                          </span>
                        </div>
                      </th>
                      <th onClick={() => handleItemSort('cost')} className="px-4 py-3.5 text-right cursor-pointer select-none hover:bg-muted transition-colors">
                        <div className="flex items-center justify-end gap-1">
                          Purchase Cost
                          <span className="text-[10px] text-primary">
                            {itemSortField === 'cost' ? (itemSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                          </span>
                        </div>
                      </th>
                      <th onClick={() => handleItemSort('profit')} className="px-4 py-3.5 text-right cursor-pointer select-none hover:bg-muted transition-colors">
                        <div className="flex items-center justify-end gap-1">
                          Net Profit
                          <span className="text-[10px] text-primary">
                            {itemSortField === 'profit' ? (itemSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                          </span>
                        </div>
                      </th>
                      <th onClick={() => handleItemSort('margin')} className="px-4 py-3.5 text-right cursor-pointer select-none hover:bg-muted transition-colors rounded-tr-xl">
                        <div className="flex items-center justify-end gap-1">
                          Margin %
                          <span className="text-[10px] text-primary">
                            {itemSortField === 'margin' ? (itemSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                          </span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredAndSortedItems.map((item, index) => (
                      <tr key={index} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-foreground">{item.name}</div>
                        </td>
                        <td className="px-4 py-3 text-center text-[11px] text-muted-foreground font-mono">
                          <div>{item.sku || '—'}</div>
                          {item.hsn && <div className="text-[10px] opacity-75">HSN: {item.hsn}</div>}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-foreground tabular-nums">
                          {item.quantitySold}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-foreground tabular-nums">
                          {currencySymbol}{item.totalSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-muted-foreground tabular-nums">
                          {currencySymbol}{item.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className={`font-bold ${item.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
                            {currencySymbol}{item.netProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.margin >= 20 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50' :
                            item.margin >= 5 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50' :
                            'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                          }`}>
                            {item.margin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}

                    {/* Summary Total Row */}
                    <tr className="bg-muted/60 font-bold border-t-2 border-border/80 text-foreground">
                      <td className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Total</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">—</td>
                      <td className="px-4 py-3 text-right text-xs font-bold tabular-nums">
                        {filteredItemTotals.units.toLocaleString('en-IN')} units
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold tabular-nums">
                        {currencySymbol}{filteredItemTotals.sales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold tabular-nums text-muted-foreground">
                        {currencySymbol}{filteredItemTotals.cost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {currencySymbol}{filteredItemTotals.profit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold tabular-nums">
                        <span className="text-primary font-bold">
                          {filteredItemTotals.sales > 0 ? ((filteredItemTotals.profit / filteredItemTotals.sales) * 100).toFixed(1) : '0.0'}%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground space-y-2">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-40 text-primary" />
                <p className="font-semibold text-foreground">No item performance data available</p>
                <p className="text-xs max-w-sm mx-auto">
                  Item sales and profit margins are automatically tracked from invoices and purchase receipts in the selected date range.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

