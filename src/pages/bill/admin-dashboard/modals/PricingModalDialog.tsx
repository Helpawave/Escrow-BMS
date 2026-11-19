import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { CreditCard, RefreshCw, CheckCircle } from 'lucide-react';

interface PricingModalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editMonthlyPrice: string;
  setEditMonthlyPrice: (val: string) => void;
  editYearlyPrice: string;
  setEditYearlyPrice: (val: string) => void;
  isSavingPricing: boolean;
  onSavePricing: () => Promise<void> | void;
}

export const PricingModalDialog: React.FC<PricingModalDialogProps> = ({
  open,
  onOpenChange,
  editMonthlyPrice,
  setEditMonthlyPrice,
  editYearlyPrice,
  setEditYearlyPrice,
  isSavingPricing,
  onSavePricing,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="bg-primary/5 p-5 border-b border-border/80 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-foreground">
              Edit Universal Platform Pricing
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Update the base rate (INR) for Monthly and Yearly plans displayed to users.
            </DialogDescription>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSavePricing(); }} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="monthly-price" className="text-xs font-semibold text-foreground">
              Monthly Pro Plan Price (₹) *
            </Label>
            <Input
              id="monthly-price"
              type="number"
              min="1"
              value={editMonthlyPrice}
              onChange={(e) => setEditMonthlyPrice(e.target.value)}
              placeholder="e.g. 349"
              className="h-10 text-xs font-bold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="yearly-price" className="text-xs font-semibold text-foreground">
              Yearly Pro Plan Price (₹) *
            </Label>
            <Input
              id="yearly-price"
              type="number"
              min="1"
              value={editYearlyPrice}
              onChange={(e) => setEditYearlyPrice(e.target.value)}
              placeholder="e.g. 3499"
              className="h-10 text-xs font-bold"
              required
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSavingPricing}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSavingPricing}
              className="text-xs font-bold gap-1.5"
            >
              {isSavingPricing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Save Pricing Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

