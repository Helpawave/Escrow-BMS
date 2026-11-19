import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateAccountId } from '@/utils/accountId';
import { Copy, Check, Share2 } from "lucide-react";
import { CreatedCredentials } from "../types";

interface CredentialsSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createdCredentials: CreatedCredentials | null;
  copiedField: string | null;
  onCopyToClipboard: (text: string, fieldName: string) => void;
  onShareWhatsApp: () => void;
}

export const CredentialsSuccessDialog: React.FC<CredentialsSuccessDialogProps> = ({
  open,
  onOpenChange,
  createdCredentials,
  copiedField,
  onCopyToClipboard,
  onShareWhatsApp,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-center">
            Credentials Updated
          </DialogTitle>
          <DialogDescription className="text-xs text-center">
            Share the updated credentials with {createdCredentials?.name}.
          </DialogDescription>
        </DialogHeader>

        {createdCredentials && (
          <div className="space-y-3 my-2">
            <div className="bg-muted/40 p-3.5 rounded-lg space-y-2 border border-border/70 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Portal URL:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] truncate max-w-[180px]">{createdCredentials.loginUrl}</span>
                  <button onClick={() => onCopyToClipboard(createdCredentials.loginUrl, 'Portal URL')}>
                    {copiedField === 'Portal URL' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Account ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    #{generateAccountId(createdCredentials.userId || createdCredentials.email)}
                  </span>
                  <button onClick={() => onCopyToClipboard(generateAccountId(createdCredentials.userId || createdCredentials.email), 'Account ID')}>
                    {copiedField === 'Account ID' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-semibold">{createdCredentials.email}</span>
                  <button onClick={() => onCopyToClipboard(createdCredentials.email, 'Email')}>
                    {copiedField === 'Email' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              {createdCredentials.password && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Password:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {createdCredentials.password}
                    </span>
                    <button onClick={() => onCopyToClipboard(createdCredentials.password || '', 'Password')}>
                      {copiedField === 'Password' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const text = `Portal: ${createdCredentials.loginUrl}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password || ''}\nRole: ${createdCredentials.role}`;
                  onCopyToClipboard(text, 'All Credentials');
                }}
                className="text-xs"
              >
                <Copy className="w-3 h-3 mr-1.5" /> Copy Details
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onShareWhatsApp}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Share2 className="w-3 h-3 mr-1.5" /> WhatsApp
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button size="sm" className="w-full" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

