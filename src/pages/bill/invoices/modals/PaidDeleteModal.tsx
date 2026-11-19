import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, AlertTriangle } from 'lucide-react';
import { PaidDeleteModalProps } from '../types';

export const PaidDeleteModal: React.FC<PaidDeleteModalProps> = ({
  open,
  onOpenChange,
  invoiceToDelete,
  paidVerificationChecked,
  setPaidVerificationChecked,
  deleteConfirmText,
  setDeleteConfirmText,
  onConfirmDelete,
  onClose,
}) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-2xl border border-destructive/20 shadow-2xl bg-background">
        {/* Header */}
        <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent border-b border-destructive/15">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-destructive/15 ring-4 ring-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold text-foreground tracking-tight leading-tight">
                Delete Paid Invoice
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-medium">
                Invoice <span className="font-bold text-destructive">#{invoiceToDelete?.invoiceNumber}</span>
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3.5">
          {/* Warning alert */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
              This invoice is marked as <strong>PAID</strong>. Deleting it will permanently erase linked payment records, restore inventory stock, and update reports.
            </div>
          </div>

          {/* Single Tick Confirmation */}
          <label
            htmlFor="paid-single-check"
            className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-150 select-none ${
              paidVerificationChecked
                ? 'border-destructive/50 bg-destructive/5 ring-1 ring-destructive/20'
                : 'border-border/60 hover:border-destructive/30 hover:bg-muted/30 bg-muted/10'
            }`}
          >
            <Checkbox
              id="paid-single-check"
              checked={paidVerificationChecked}
              onCheckedChange={(v) => setPaidVerificationChecked(!!v)}
              className="mt-0.5 shrink-0 border-2 border-destructive/60 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
            />
            <div className="min-w-0">
              <p className="text-xs text-foreground font-semibold leading-relaxed">
                I understand this will permanently delete the invoice, its payment records, and restore item stock.
              </p>
            </div>
          </label>

          {/* Type Confirmation */}
          <div className="space-y-1.5 pt-1">
            <Label htmlFor="delete-paid-input" className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>
                Type <span className="font-mono font-black text-destructive bg-destructive/10 px-1.5 py-0.5 rounded text-xs">DELETE</span> to confirm:
              </span>
              {deleteConfirmText.trim().toUpperCase() === 'DELETE' && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">✓ Verified</span>
              )}
            </Label>
            <Input
              id="delete-paid-input"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              spellCheck={false}
              className={`h-9 text-sm font-mono font-bold border-2 transition-all ${
                deleteConfirmText.trim().toUpperCase() === 'DELETE'
                  ? 'border-destructive/60 bg-destructive/5 text-destructive'
                  : deleteConfirmText.length > 0
                  ? 'border-amber-400/60 bg-amber-50/30 dark:bg-amber-950/20'
                  : 'border-border/60'
              }`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-border/40 bg-muted/10 flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onClose();
            }}
            className="flex-1 h-9 font-semibold text-xs"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              onOpenChange(false);
              await onConfirmDelete();
            }}
            disabled={!paidVerificationChecked || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
            className="flex-1 h-9 text-xs font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete Paid Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

