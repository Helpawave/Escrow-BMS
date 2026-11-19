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
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { generateAccountId } from "@/utils/accountId";
import { AccountDeletionRequest } from '@/types/admin';

interface ApproveDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestToApprove: AccountDeletionRequest | null;
  approveConfirmText: string;
  setApproveConfirmText: (val: string) => void;
  isProcessingAction: boolean;
  onApproveDeletion: () => Promise<void> | void;
}

export const ApproveDeletionDialog: React.FC<ApproveDeletionDialogProps> = ({
  open,
  onOpenChange,
  requestToApprove,
  approveConfirmText,
  setApproveConfirmText,
  isProcessingAction,
  onApproveDeletion,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-border bg-card shadow-2xl">
        <div className="bg-rose-50 dark:bg-rose-950/40 p-5 border-b border-rose-200 dark:border-rose-900/50 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-black text-rose-950 dark:text-rose-100">
              Confirm Permanent Account Purge
            </DialogTitle>
            <DialogDescription className="text-xs text-rose-800/80 dark:text-rose-300/80 mt-1">
              This operation will irreversibly wipe out the user and cascade across all databases.
            </DialogDescription>
          </div>
        </div>

        {requestToApprove && (
          <div className="p-5 space-y-4">
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-1.5">
              <p><strong>User Email:</strong> {requestToApprove.user_email}</p>
              <p><strong>Business Name:</strong> {requestToApprove.company_name || 'Individual Profile'}</p>
              <p><strong>Account ID:</strong> #{generateAccountId(requestToApprove.user_id)}</p>
              <p><strong>Reason:</strong> {requestToApprove.reason}</p>
              {requestToApprove.feedback && (
                <p><strong>Feedback:</strong> {requestToApprove.feedback}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-purge-confirm" className="text-xs font-semibold text-foreground">
                Type <span className="font-black text-rose-600">DELETE</span> to authorize permanent purge:
              </Label>
              <Input
                id="admin-purge-confirm"
                value={approveConfirmText}
                onChange={(e) => setApproveConfirmText(e.target.value)}
                placeholder="DELETE"
                className="h-10 text-xs font-mono font-bold uppercase tracking-wider text-center"
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
                variant="destructive"
                disabled={isProcessingAction || approveConfirmText.trim().toUpperCase() !== 'DELETE'}
                onClick={onApproveDeletion}
                className="h-10 text-xs font-bold uppercase tracking-wider gap-2 shadow-sm"
              >
                {isProcessingAction ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Purging Data...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Approve & Delete User
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

