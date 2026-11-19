import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scan } from "lucide-react";
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';
import { cn } from "@/lib/utils";
import { Product } from "../types";

interface ProductQRBarcodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProduct: Product | null;
  qrPrintStep: 'select' | 'preview';
  setQrPrintStep: (step: 'select' | 'preview') => void;
  qrFormat: 'label' | 'a4';
  setQrFormat: (format: 'label' | 'a4') => void;
  printType: 'both' | 'qr' | 'barcode';
  setQrPrintType: (type: 'both' | 'qr' | 'barcode') => void;
  qrQuantity: number;
  setQrQuantity: (qty: number) => void;
}

export const ProductQRBarcodeDialog: React.FC<ProductQRBarcodeDialogProps> = ({
  open,
  onOpenChange,
  selectedProduct,
  qrPrintStep,
  setQrPrintStep,
  qrFormat,
  setQrFormat,
  printType,
  setQrPrintType,
  qrQuantity,
  setQrQuantity,
}) => {
  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) setQrPrintStep('select');
    }}>
      <DialogContent className="sm:max-w-[550px] w-[95vw] max-h-[90vh] p-0 bg-white dark:bg-slate-950 border-none shadow-2xl rounded-2xl overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Scan className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Print Code
                </DialogTitle>
                <p className="text-[10px] text-slate-500 font-medium">SKU: {selectedProduct?.sku}</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 md:p-6 overflow-y-auto flex-1 custom-scrollbar">
          {qrPrintStep === 'select' ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Print Quantity</Label>
                  <Input
                    type="number"
                    value={qrQuantity}
                    onChange={(e) => setQrQuantity(Math.min(500, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="h-11 font-bold border-slate-200 focus:ring-primary/20 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Code Type</Label>
                  <Select value={printType} onValueChange={(val: 'both' | 'qr' | 'barcode') => setQrPrintType(val)}>
                    <SelectTrigger className="h-11 font-bold border-slate-200 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both Codes</SelectItem>
                      <SelectItem value="qr">QR Only</SelectItem>
                      <SelectItem value="barcode">Barcode Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Print Format</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => { setQrFormat('label'); setQrPrintStep('preview'); }}
                    className="flex flex-col items-center p-5 rounded-2xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all group text-left"
                  >
                    <div className="w-12 h-8 border-2 border-slate-300 group-hover:border-primary/50 border-dashed rounded mb-3" />
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Label Print</span>
                    <span className="text-[10px] text-slate-400 font-medium">Roll / Thermal</span>
                  </button>

                  <button
                    onClick={() => { setQrFormat('a4'); setQrPrintStep('preview'); }}
                    className="flex flex-col items-center p-5 rounded-2xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all group text-left"
                  >
                    <div className="w-10 h-12 border-2 border-slate-300 group-hover:border-primary/50 border-dashed rounded mb-3 flex flex-wrap gap-0.5 p-1">
                      <div className="w-full h-1 bg-slate-200 rounded-full" />
                      <div className="w-full h-1 bg-slate-200 rounded-full" />
                      <div className="w-full h-1 bg-slate-200 rounded-full" />
                    </div>
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">A4 Sheet</span>
                    <span className="text-[10px] text-slate-400 font-medium">Standard Printer</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex gap-3">
                <Button onClick={() => setQrPrintStep('select')} variant="outline" className="h-11 rounded-xl px-6 font-bold border-slate-200">
                  Back
                </Button>
                <Button onClick={() => window.print()} className="h-11 rounded-xl flex-1 font-bold shadow-lg shadow-primary/20">
                  Print {qrQuantity} {qrFormat === 'label' ? 'Labels' : 'A4 Codes'}
                </Button>
              </div>

              <div id="print-qr-area" className={cn(
                "bg-slate-50 dark:bg-slate-900/50 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 max-h-[400px] overflow-y-auto custom-scrollbar",
                qrFormat === 'a4' ? "grid grid-cols-2 gap-4" : "flex flex-col items-center gap-4"
              )}>
                {Array.from({ length: qrQuantity }).map((_, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center space-y-3 w-full max-w-[200px] mx-auto shadow-sm">
                    <div className="flex flex-col items-center gap-3 w-full">
                      {(printType === 'both' || printType === 'qr') && (
                        <div className="p-1 bg-white" style={{ width: 80, height: 80 }}>
                          <QRCode
                            value={`SKU:${selectedProduct?.sku}|NAME:${selectedProduct?.name}`}
                            size={80}
                            level="H"
                            style={{ width: '100%', height: 'auto' }}
                          />
                        </div>
                      )}

                      {(printType === 'both' || printType === 'barcode') && (
                        <div className="w-full flex justify-center overflow-hidden py-1">
                          <Barcode
                            value={selectedProduct?.sku || "N/A"}
                            width={1}
                            height={30}
                            fontSize={8}
                            margin={0}
                            background="transparent"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
