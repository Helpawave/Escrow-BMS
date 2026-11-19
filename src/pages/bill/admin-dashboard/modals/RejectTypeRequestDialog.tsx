import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { BusinessTypeRequest } from '@/types/admin';

interface RejectTypeRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeRequestToReject: BusinessTypeRequest | null;
  typeRejectNotes: string;
  setTypeRejectNotes: (val: string) => void;
  isProcessingTypeAction: boolean;
  onRejectTypeRequest: () => Promise<void> | void;
}

export const RejectTypeRequestDialog: React.FC<RejectTypeRequestDialogProps> = ({
  open,
  onOpenChange,
  typeRequestToReject,
  typeRejectNotes,
  setTypeRejectNotes,
  isProcessingTypeAction,
  onRejectTypeRequest,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="bg-rose-50 dark:bg-rose-950/40 p-5 border-b border-rose-200 dark:border-rose-900/50 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-rose-950 dark:text-rose-100">
              Reject Business Type Change Request
            </DialogTitle>
            <DialogDescription className="text-xs text-rose-800/80 dark:text-rose-300/80 mt-0.5">
              Are you sure you want to decline this category change request for {typeRequestToReject?.company_name || typeRequestToReject?.user_email}?
            </DialogDescription>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reject-type-notes" className="text-xs font-semibold text-foreground">
              Rejection Reason / Admin Note (Optional)
            </Label>
            <Textarea
              id="reject-type-notes"
              value={typeRejectNotes}
              onChange={(e) => setTypeRejectNotes(e.target.value)}
              placeholder="e.g. Account does not match criteria for automobile dealership..."
              className="min-h-[70px] text-xs resize-y"
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isProcessingTypeAction}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onRejectTypeRequest}
              disabled={isProcessingTypeAction}
              className="text-xs font-bold gap-1.5"
            >
              {isProcessingTypeAction ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

