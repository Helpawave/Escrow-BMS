import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, AlertTriangle, CheckCircle2, Barcode as BarcodeIcon, Loader2, Info } from "lucide-react";

export interface UncatalogedProductItem {
  index: number;
  name: string;
  quantity: number;
  rate: number;
  tax_rate: number;
  sku: string;
  unit: string;
}

export interface IncompleteItem {
  index: number;
  issue: string;
}

interface UncatalogedProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  uncatalogedItems: UncatalogedProductItem[];
  incompleteItems: IncompleteItem[];
  currencySymbol: string;
  saving?: boolean;
}

export const UncatalogedProductsModal: React.FC<UncatalogedProductsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  uncatalogedItems,
  incompleteItems,
  currencySymbol,
  saving = false
}) => {
  const hasIncomplete = incompleteItems.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-3xl border border-border/60 shadow-2xl bg-background max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-slate-50/70 dark:bg-slate-900/50 border-b border-border/40">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${hasIncomplete ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'}`}>
              {hasIncomplete ? <AlertTriangle className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-foreground">
                {hasIncomplete ? "Items Verification & Incomplete Details" : "Add New Products to Catalog"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-medium mt-0.5">
                {hasIncomplete 
                  ? "Please resolve incomplete item details or verify new products before saving the purchase bill."
                  : "These items are not yet in your inventory catalog. Saving the bill will automatically add them, track opening stock, and generate QR/barcodes."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* Incomplete items warning if any */}
          {hasIncomplete && (
            <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Items Missing Required Details:</span>
              </div>
              <ul className="space-y-1 text-xs text-rose-600 dark:text-rose-300 ml-6 list-disc">
                {incompleteItems.map((item, idx) => (
                  <li key={idx}>
                    <strong>Item #{item.index}:</strong> {item.issue}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-rose-500 font-medium pt-1">
                Please enter a product name and quantity in the bill table first.
              </p>
            </div>
          )}

          {/* Uncataloged products list */}
          {uncatalogedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    New Products ({uncatalogedItems.length})
                  </span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-bold">
                    Inward Stock Ready
                  </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Opening Stock = Bill Qty
                </span>
              </div>

              <div className="border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800/40">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider">Product Name</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider text-center">Opening Stock</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider text-right">Purchase Cost</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider text-center">Auto SKU / Barcode</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uncatalogedItems.map((item, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-bold text-xs">
                          <div>{item.name}</div>
                          {item.tax_rate > 0 && (
                            <span className="text-[10px] text-muted-foreground font-medium">GST: {item.tax_rate}%</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-bold text-xs tabular-nums text-emerald-600">
                          {item.quantity} {item.unit || 'pcs'}
                        </TableCell>
                        <TableCell className="text-right font-black text-xs tabular-nums text-foreground">
                          {currencySymbol} {Number(item.rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 font-mono font-bold text-[10px]">
                            <BarcodeIcon className="w-3 h-3" />
                            {item.sku}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Informative footer card */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-200">
                <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-relaxed text-[11px]">
                  <strong>Automatic Setup:</strong> Saving will add these items to your Products catalog, initialize their opening stock, and activate instant QR/barcode lookup.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 sm:p-6 bg-slate-50/70 dark:bg-slate-900/50 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="w-full sm:w-auto h-11 px-5 rounded-xl font-bold border-slate-200 dark:border-slate-800"
          >
            {hasIncomplete ? "Back to Fix Items" : "Review / Edit Items"}
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={saving || hasIncomplete || uncatalogedItems.length === 0}
            className="w-full sm:w-auto h-11 px-6 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Bill & Adding Products...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Add Products to Catalog & Save Bill
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
