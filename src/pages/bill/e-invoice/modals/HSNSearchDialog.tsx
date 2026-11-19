import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { type HSNCode } from '@/types/hsn';

interface HSNSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectHSN: (code: string) => void;
}

export const HSNSearchDialog: React.FC<HSNSearchDialogProps> = ({
  open,
  onOpenChange,
  onSelectHSN,
}) => {
  const [hsnSearchQuery, setHsnSearchQuery] = useState("");
  const [hsnCodesData, setHsnCodesData] = useState<HSNCode[]>([]);

  useEffect(() => {
    if (open && hsnCodesData.length === 0) {
      import('@/data/hsnCodes.json')
        .then(module => {
          setHsnCodesData(module.default);
        })
        .catch(err => {
          console.error('Failed to load HSN codes:', err);
        });
    }
  }, [open, hsnCodesData.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background">
        <DialogHeader className="p-4 md:p-8 pb-4 border-b">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight leading-tight uppercase">
            Search HSN Code
          </DialogTitle>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">
            Find code by number or product name
          </p>
        </DialogHeader>

        <div className="p-4 md:p-6 flex-1 flex flex-col space-y-4 overflow-hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by HSN Code or Item Name..."
              className="pl-10 h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-sky-500 focus:border-sky-500 rounded-xl"
              value={hsnSearchQuery}
              onChange={(e) => setHsnSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
            {hsnCodesData
              .filter(item =>
                item.code.toLowerCase().includes(hsnSearchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(hsnSearchQuery.toLowerCase())
              )
              .slice(0, 50)
              .map((item, idx) => (
                <div
                  key={idx}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onSelectHSN(item.code);
                    onOpenChange(false);
                    setHsnSearchQuery("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectHSN(item.code);
                      onOpenChange(false);
                      setHsnSearchQuery("");
                    }
                  }}
                  className="p-4 border-b border-slate-50 hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-colors cursor-pointer group rounded-lg mb-1 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sky-600 group-hover:text-sky-700">{item.code}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                </div>
              ))}

            {hsnCodesData.filter(item =>
              item.code.toLowerCase().includes(hsnSearchQuery.toLowerCase()) ||
              item.description.toLowerCase().includes(hsnSearchQuery.toLowerCase())
            ).length === 0 && (
              <div className="text-center py-12">
                <div className="bg-slate-50 dark:bg-slate-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No HSN codes found for "{hsnSearchQuery}"</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto font-bold border-slate-300 dark:border-slate-600 hover:bg-white dark:bg-slate-800"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
