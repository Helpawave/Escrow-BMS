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
import { Shield, RefreshCw } from 'lucide-react';
import { AccountDeletionRequest } from '@/types/admin';

interface RejectDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestToReject: AccountDeletionRequest | null;
  rejectionNotes: string;
  setRejectionNotes: (val: string) => void;
  isProcessingAction: boolean;
  onRejectDeletion: () => Promise<void> | void;
}

export const RejectDeletionDialog: React.FC<RejectDeletionDialogProps> = ({
  open,
  onOpenChange,
  requestToReject,
  rejectionNotes,
  setRejectionNotes,
  isProcessingAction,
  onRejectDeletion,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-border bg-card shadow-2xl">
        <div className="bg-slate-50 dark:bg-slate-900 p-5 border-b border-border flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-black text-foreground">
              Decline Account Deletion Request
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Provide an explanation for the user on why this deletion request cannot be executed at this time.
            </DialogDescription>
          </div>
        </div>

        {requestToReject && (
          <div className="p-5 space-y-4">
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
              <p><strong>User:</strong> {requestToReject.user_email}</p>
              <p><strong>Reason:</strong> {requestToReject.reason}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-rejection-notes" className="text-xs font-semibold text-foreground">
                Reason for Declining (Sent to User) *
              </Label>
              <Textarea
                id="admin-rejection-notes"
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="e.g. Please clear open invoices first, or contact support regarding license verification..."
                className="min-h-[85px] text-xs resize-y"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isProcessingAction}
                className="h-10 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isProcessingAction || !rejectionNotes.trim()}
                onClick={onRejectDeletion}
                className="h-10 text-xs font-bold uppercase tracking-wider gap-2 shadow-sm"
              >
                {isProcessingAction ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Decline & Notify User"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

