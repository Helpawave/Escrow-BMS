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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Copy, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { WhatsAppPreviewModalProps } from '../types';

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  open,
  onOpenChange,
  whatsappInvoiceId,
  sharedInvoices,
  whatsappMessage,
  setWhatsappMessage,
  uploadingWhatsApp,
  sendingWhatsApp,
  handleSendWhatsApp,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg rounded-2xl border-none shadow-2xl bg-background p-0 overflow-hidden">
        <AlertDialogHeader className="p-4 md:p-8 pb-4 border-b">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-emerald-500">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <AlertDialogTitle className="text-2xl font-black tracking-tight">WhatsApp Preview</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground font-medium pt-2">
            Review and edit the message below. Clicking <strong>Open WhatsApp</strong> will open WhatsApp with this message pre-filled — just press Send.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="p-4 bg-[url('/wa-bg.webp')] bg-repeat flex flex-col gap-3">
          {whatsappInvoiceId && sharedInvoices[whatsappInvoiceId]?.whatsapp && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-3 flex items-start gap-2 max-w-[85%] self-start shadow-sm backdrop-blur-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-semibold">
                Notice: This WhatsApp message has already been sent once.
              </div>
            </div>
          )}
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-tr-lg rounded-tl-lg rounded-br-lg p-3 shadow-sm relative max-w-[85%] mb-2">
            <div className="relative">
              <Textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                className="min-h-[150px] border-none focus-visible:ring-0 resize-none p-0 text-sm leading-relaxed text-gray-800 dark:text-gray-200 bg-transparent"
                disabled={uploadingWhatsApp !== null}
              />
              {uploadingWhatsApp !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    <p className="text-xs font-bold text-emerald-600 animate-pulse">Preparing PDF...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="text-[10px] text-gray-400 text-right mt-1 flex items-center justify-end gap-1">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              <span className="text-[#34B7F1]">✓✓</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 text-gray-400 hover:text-gray-600 dark:text-gray-400"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(whatsappMessage);
                  toast({
                    title: "Copied!",
                    description: "Message copied to clipboard",
                    duration: 2000,
                  });
                } catch {}
              }}
              title="Copy message"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <AlertDialogFooter className="p-4 bg-muted/5 flex flex-row gap-3 items-center justify-end border-t">
          <AlertDialogCancel className="m-0 h-11 px-6 font-bold rounded-xl border-2 hover:bg-muted/50 transition-all">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={uploadingWhatsApp !== null || sendingWhatsApp}
            onClick={(e) => {
              e.preventDefault();
              handleSendWhatsApp();
            }}
            className="h-11 px-8 font-black rounded-xl shadow-lg shadow-emerald-500/20 bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {sendingWhatsApp ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Opening...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Open WhatsApp
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

