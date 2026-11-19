import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { TypeChangeModalState } from '../types';
import { UserType } from '@/types/admin';

interface TypeChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeChangeModal: TypeChangeModalState | null;
  onConfirmTypeChange: (userId: string, newType: UserType) => Promise<void> | void;
}

export const TypeChangeDialog: React.FC<TypeChangeDialogProps> = ({
  open,
  onOpenChange,
  typeChangeModal,
  onConfirmTypeChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3 text-amber-600 mb-2">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <DialogTitle className="text-lg font-bold">
              Confirm Business Type Change
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Changing the business type will alter available feature modules, invoice templates, and tabs for this company and all its staff members.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 p-4 rounded-xl bg-muted/40 border border-border/60 space-y-3 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-border/50">
            <span className="text-muted-foreground font-semibold">Account / Company:</span>
            <span className="font-bold text-foreground">{typeChangeModal?.userName}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-border/50">
            <span className="text-muted-foreground font-semibold">Email:</span>
            <span className="font-mono text-foreground">{typeChangeModal?.userEmail}</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-muted-foreground font-semibold">Mode Switch:</span>
            <div className="flex items-center gap-2 font-bold">
              <Badge variant="outline" className="text-[11px] font-bold">
                {typeChangeModal?.currentType === 'automobile' ? '🚗 Automobile' : typeChangeModal?.currentType === 'food_kitchen' ? '🍳 Kitchen' : typeChangeModal?.currentType === 'cafe' ? '☕ Cafe' : '🏪 Retail'}
              </Badge>
              <span>➜</span>
              <Badge className="text-[11px] font-bold bg-primary text-primary-foreground">
                {typeChangeModal?.newType === 'automobile' ? '🚗 Automobile' : typeChangeModal?.newType === 'food_kitchen' ? '🍳 Kitchen' : typeChangeModal?.newType === 'cafe' ? '☕ Cafe' : '🏪 Retail'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 font-medium">
          ⚠️ <strong>Verification Check:</strong> Please ensure the client has requested this business category change. All staff members under this account will immediately inherit the new mode.
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl h-10 px-4 font-bold w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={async () => {
              if (typeChangeModal) {
                const { userId, newType } = typeChangeModal;
                onOpenChange(false);
                await onConfirmTypeChange(userId, newType);
              }
            }}
            className="rounded-xl h-10 px-5 font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 w-full sm:w-auto"
          >
            Confirm & Change Type
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

