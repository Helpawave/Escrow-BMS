import React, { useState, useRef } from 'react';
import Barcode from 'react-barcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Settings2, Sparkles, Check, Tag } from 'lucide-react';
import { toast } from 'sonner';

export interface BarcodeProductInfo {
  name: string;
  sku: string;
  barcode?: string;
  price?: number;
  batch_number?: string;
  expiry_date?: string;
  companyName?: string;
}

interface BarcodeStickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: BarcodeProductInfo | null;
}

export function BarcodeStickerModal({ open, onOpenChange, product }: BarcodeStickerModalProps) {
  const [paperSize, setPaperSize] = useState<'thermal-50-25' | 'thermal-40-30' | 'a4-24' | 'a4-40'>('thermal-50-25');
  const [printCount, setPrintCount] = useState<number>(12);
  const [showCompany, setShowCompany] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showBatch, setShowBatch] = useState(true);
  const [showExpiry, setShowExpiry] = useState(true);

  if (!product) return null;

  const barcodeValue = product.barcode?.trim() || product.sku?.trim() || '8901234567890';
  const companyName = product.companyName || 'ESCROW BMS';

  const handlePrint = () => {
    window.print();
    toast.success(`Printing ${printCount} barcode stickers...`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl bg-background">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                Print Barcode / Price Stickers
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure sticker layout, thermal label roll, or A4 sticker sheet
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border border-border/50">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Sticker Paper / Label Format
              </Label>
              <Select value={paperSize} onValueChange={(v) => setPaperSize(v as any)}>
                <SelectTrigger className="h-11 rounded-xl font-bold text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="thermal-50-25" className="text-xs font-medium">
                    Thermal Roll: 50mm × 25mm (2" × 1")
                  </SelectItem>
                  <SelectItem value="thermal-40-30" className="text-xs font-medium">
                    Thermal Roll: 40mm × 30mm
                  </SelectItem>
                  <SelectItem value="a4-24" className="text-xs font-medium">
                    A4 Sheet: 24 Stickers (3 × 8 Grid)
                  </SelectItem>
                  <SelectItem value="a4-40" className="text-xs font-medium">
                    A4 Sheet: 40 Stickers (4 × 10 Grid)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Quantity to Print
              </Label>
              <Input
                type="number"
                min={1}
                max={500}
                value={printCount}
                onChange={(e) => setPrintCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-11 rounded-xl font-bold text-xs"
              />
            </div>

            {/* Checkbox Toggles */}
            <div className="sm:col-span-2 pt-2 border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showCompany}
                  onChange={(e) => setShowCompany(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-bold text-slate-700 dark:text-slate-300">Company Name</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-bold text-slate-700 dark:text-slate-300">MRP / Price</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBatch}
                  onChange={(e) => setShowBatch(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-bold text-slate-700 dark:text-slate-300">Batch No.</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showExpiry}
                  onChange={(e) => setShowExpiry(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-bold text-slate-700 dark:text-slate-300">Expiry Date</span>
              </label>
            </div>
          </div>

          {/* Live Preview Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Live Sticker Preview
              </p>
              <span className="text-[11px] font-semibold text-indigo-600">
                {paperSize.includes('thermal') ? 'Thermal Label Roll' : 'Standard A4 Sticker Paper'}
              </span>
            </div>

            <div className="bg-slate-100 dark:bg-slate-900/60 p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center overflow-x-auto">
              {/* Single Sticker Card Preview */}
              <div className="bg-white text-black p-3 rounded-xl border border-slate-300 shadow-md flex flex-col items-center justify-between text-center w-[220px] min-h-[120px] select-none">
                {showCompany && (
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-700 truncate w-full">
                    {companyName}
                  </p>
                )}
                <p className="text-xs font-black text-black line-clamp-1 w-full mt-0.5">
                  {product.name}
                </p>

                <div className="my-1 scale-90 -my-1">
                  <Barcode
                    value={barcodeValue}
                    width={1.2}
                    height={32}
                    fontSize={10}
                    margin={2}
                    displayValue={true}
                  />
                </div>

                <div className="w-full flex items-center justify-between text-[9px] font-bold text-slate-600 border-t border-slate-200 pt-1 mt-0.5">
                  {showPrice && (
                    <span className="font-black text-black">
                      MRP: ₹{product.price?.toFixed(2) || '0.00'}
                    </span>
                  )}
                  {showBatch && product.batch_number && (
                    <span>B: {product.batch_number}</span>
                  )}
                  {showExpiry && product.expiry_date && (
                    <span>EXP: {product.expiry_date}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Hidden Print Container specifically targeted by @media print */}
          <div className="hidden print:block print-sticker-container">
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                .print-sticker-container, .print-sticker-container * {
                  visibility: visible;
                }
                .print-sticker-container {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  display: flex;
                  flex-wrap: wrap;
                  gap: 4mm;
                  padding: 4mm;
                  background: white;
                  color: black;
                }
                .print-sticker-item {
                  box-sizing: border-box;
                  page-break-inside: avoid;
                  border: 0.2mm solid #e2e8f0;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: space-between;
                  text-align: center;
                  padding: 2mm;
                  ${paperSize === 'thermal-50-25' ? 'width: 50mm; height: 25mm;' : ''}
                  ${paperSize === 'thermal-40-30' ? 'width: 40mm; height: 30mm;' : ''}
                  ${paperSize === 'a4-24' ? 'width: 63.5mm; height: 33.9mm;' : ''}
                  ${paperSize === 'a4-40' ? 'width: 48.5mm; height: 25.4mm;' : ''}
                }
              }
            `}</style>

            {Array.from({ length: printCount }).map((_, idx) => (
              <div key={idx} className="print-sticker-item">
                {showCompany && (
                  <p style={{ fontSize: '7pt', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>
                    {companyName}
                  </p>
                )}
                <p style={{ fontSize: '8pt', fontWeight: 'bold', margin: '1mm 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                  {product.name}
                </p>

                <div style={{ margin: '1mm 0' }}>
                  <Barcode
                    value={barcodeValue}
                    width={1.0}
                    height={24}
                    fontSize={8}
                    margin={0}
                    displayValue={true}
                  />
                </div>

                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '6.5pt', fontWeight: 'bold', borderTop: '0.1mm solid #ccc', paddingTop: '0.5mm' }}>
                  {showPrice && <span>MRP: ₹{product.price?.toFixed(2) || '0.00'}</span>}
                  {showBatch && product.batch_number && <span>B:{product.batch_number}</span>}
                  {showExpiry && product.expiry_date && <span>EXP:{product.expiry_date}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/10 border-t border-border/50 flex flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11 font-bold rounded-xl cursor-pointer"
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            className="flex-1 h-11 font-black rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print {printCount} Stickers</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
