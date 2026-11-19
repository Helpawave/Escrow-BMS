import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Plus } from "lucide-react";
import { type HSNCode } from '@/types/hsn';

interface HSNCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectHSN: (code: string) => void;
}

export const HSNCodeDialog: React.FC<HSNCodeDialogProps> = ({
  open,
  onOpenChange,
  onSelectHSN,
}) => {
  const [hsnSearchQuery, setHsnSearchQuery] = useState("");
  const [hsnCodesData, setHsnCodesData] = useState<HSNCode[]>([]);

  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (open && hsnCodesData.length === 0) {
      setLoadError(false);
      import('@/data/hsnCodes.json')
        .then(module => {
          setHsnCodesData(module.default);
        })
        .catch(err => {
          console.error("Failed to load HSN codes:", err);
          setLoadError(true);
        });
    }
  }, [open, hsnCodesData.length]);

  const filteredHsnCodes = useMemo(() => {
    if (!open || hsnCodesData.length === 0) return [];
    if (!hsnSearchQuery) return hsnCodesData.slice(0, 50);

    const query = hsnSearchQuery.toLowerCase();
    return hsnCodesData
      .filter(item =>
        item.code.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      )
      .slice(0, 50);
  }, [open, hsnSearchQuery, hsnCodesData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background">
        <DialogHeader className="p-4 md:p-8 pb-4 shrink-0">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
            HSN Code Lookup
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            Search and select the appropriate GST HSN code for your product.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 md:p-6 flex-1 flex flex-col space-y-4 overflow-hidden">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-sky-500 transition-colors" />
            <Input
              placeholder="Search by HSN Code or Item Name..."
              className="pl-12 h-14 bg-muted/20 border-border/50 focus:ring-sky-500 focus:border-sky-500 rounded-2xl transition-all shadow-inner font-medium text-lg"
              value={hsnSearchQuery}
              onChange={(e) => setHsnSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
            {loadError ? (
              <div className="flex flex-col justify-center items-center h-full min-h-[200px] text-center p-6 space-y-2">
                <p className="text-sm font-bold text-destructive">Failed to load HSN codes database.</p>
                <p className="text-xs text-muted-foreground">Please check your connection or enter the HSN code manually in the form.</p>
              </div>
            ) : hsnCodesData.length === 0 ? (
              <div className="flex justify-center items-center h-full min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
              </div>
            ) : filteredHsnCodes.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onSelectHSN(item.code);
                  onOpenChange(false);
                  setHsnSearchQuery("");
                }}
                className="p-5 border-b border-border/50 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition-all cursor-pointer group rounded-xl mb-2 border border-transparent hover:border-sky-200 dark:hover:border-sky-800/50"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-primary text-lg group-hover:scale-110 transition-transform origin-left">{item.code}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-sky-600 dark:text-sky-400 text-xs font-bold">
                    Select <Plus className="w-3 h-3 ml-1" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed group-hover:text-foreground transition-colors font-medium">{item.description}</p>
              </div>
            ))}

            {hsnCodesData.length > 0 && filteredHsnCodes.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground font-medium">No HSN codes found for "{hsnSearchQuery}"</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/20 border-t border-border/30">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto font-bold border-border/50 hover:bg-background"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
