import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mail } from "lucide-react";
import { PurchaseInvoice } from '../types';

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailInvoice: PurchaseInvoice | null;
  onConfirmSend: () => void;
}

export const EmailPreviewDialog: React.FC<EmailPreviewDialogProps> = ({
  open,
  onOpenChange,
  emailInvoice,
  onConfirmSend,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-2xl border-none shadow-2xl bg-background p-0 overflow-hidden">
        <AlertDialogHeader className="p-4 md:p-8 pb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <AlertDialogTitle className="text-2xl font-black tracking-tight">Email Purchase Bill</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground font-medium pt-2">
            Send purchase bill <span className="font-bold text-foreground">#{emailInvoice?.invoice_number}</span> to <span className="font-bold text-foreground">{emailInvoice?.vendors?.email || 'vendor'}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5">
          <AlertDialogCancel className="flex-1 h-11 font-bold rounded-xl border-2 m-0">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmSend}
            className="flex-1 h-11 font-black rounded-xl shadow-lg shadow-primary/20 bg-primary hover:opacity-90"
          >
            Send Email
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
