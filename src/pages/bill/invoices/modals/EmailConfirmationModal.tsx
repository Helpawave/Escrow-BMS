import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Mail } from 'lucide-react';
import { EmailConfirmationModalProps } from '../types';

export const EmailConfirmationModal: React.FC<EmailConfirmationModalProps> = ({
  open,
  onOpenChange,
  invoiceToSend,
  onSendEmail,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-none shadow-2xl bg-background p-0 overflow-hidden max-w-md">
        <AlertDialogHeader className="p-4 md:p-8 pb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <AlertDialogTitle className="text-2xl font-black tracking-tight">Send Invoice via Email?</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground font-medium pt-2">
            Are you sure you want to send this invoice to <span className="text-foreground font-bold">{invoiceToSend?.clients?.email}</span>?
            This action requires Google Drive authentication to attach the PDF link.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5">
          <AlertDialogCancel className="flex-1 h-11 font-bold rounded-xl border-2 m-0 hover:bg-muted/50 transition-all">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => invoiceToSend && onSendEmail(invoiceToSend)}
            className="flex-1 h-11 font-black rounded-xl shadow-lg shadow-primary/20 bg-primary hover:opacity-90 transition-all"
          >
            Send Email
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

