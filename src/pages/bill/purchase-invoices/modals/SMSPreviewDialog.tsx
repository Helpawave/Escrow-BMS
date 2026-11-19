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
import { Textarea } from "@/components/ui/textarea";
import { Phone } from "lucide-react";

interface SMSPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  smsMessage: string;
  setSmsMessage: (message: string) => void;
  onConfirmSend: () => void;
}

export const SMSPreviewDialog: React.FC<SMSPreviewDialogProps> = ({
  open,
  onOpenChange,
  smsMessage,
  setSmsMessage,
  onConfirmSend,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-2xl border-none shadow-2xl bg-background p-0 overflow-hidden">
        <AlertDialogHeader className="p-4 md:p-8 pb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <Phone className="w-6 h-6 text-primary" />
          </div>
          <AlertDialogTitle className="text-2xl font-black tracking-tight">Preview SMS Message</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground font-medium pt-2">
            Edit the message below before sending via SMS to your vendor.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="px-6 md:px-8 py-2">
          <Textarea
            value={smsMessage}
            onChange={(e) => setSmsMessage(e.target.value)}
            className="min-h-[120px] rounded-xl border-2 focus-visible:ring-primary/20 bg-muted/30 font-medium"
          />
        </div>
        <AlertDialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5">
          <AlertDialogCancel className="flex-1 h-11 font-bold rounded-xl border-2 m-0">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmSend}
            className="flex-1 h-11 font-black rounded-xl shadow-lg shadow-primary/20 m-0"
          >
            Open SMS App
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

