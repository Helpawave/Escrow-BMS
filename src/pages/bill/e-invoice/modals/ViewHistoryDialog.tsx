import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { ResponsiveInvoiceWrapper } from "@/components/ResponsiveInvoiceWrapper";
import { EInvoiceTemplate } from "@/components/EInvoiceTemplate";
import { EWayBillTemplate } from "@/components/EWayBillTemplate";
import { Client, EInvoiceHistoryItem, EWayBillHistoryItem, Profile } from '../types';

interface ViewHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewHistoryType: 'einvoice' | 'ewaybill';
  viewHistoryItem: EInvoiceHistoryItem | EWayBillHistoryItem | null;
  clients: Client[];
  profile: Profile | null;
  onDownloadPDF: (type: 'einvoice' | 'ewaybill', item: EInvoiceHistoryItem | EWayBillHistoryItem) => void;
}

export const ViewHistoryDialog: React.FC<ViewHistoryDialogProps> = ({
  open,
  onOpenChange,
  viewHistoryType,
  viewHistoryItem,
  clients,
  profile,
  onDownloadPDF,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="sm:max-w-[95vw] w-full max-h-[96vh] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white flex flex-col">
        <DialogHeader className="px-8 py-5 bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-black tracking-tight text-slate-900 uppercase">
                {viewHistoryType === 'einvoice' ? 'E-Invoice Preview' : 'E-Way Bill Preview'}
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                Generated Record Details
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => viewHistoryItem && onDownloadPDF(viewHistoryType, viewHistoryItem)}
                className="font-black rounded-xl uppercase text-[10px] tracking-widest h-10 px-6 border-2"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-10 w-10 text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-slate-100/30 p-4 md:p-10 flex justify-center">
          {viewHistoryItem && profile && (
            <ResponsiveInvoiceWrapper>
              <div className="shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-slate-200 bg-white origin-top mb-10 h-fit rounded-sm overflow-hidden">
                {viewHistoryType === 'einvoice' ? (
                  <EInvoiceTemplate
                    invoice={viewHistoryItem as EInvoiceHistoryItem}
                    client={(clients.find(c => c.id === viewHistoryItem.client_id) as Client) || { name: '', email: '', gstin: '', address: '', state: '', postal_code: '' }}
                    items={(viewHistoryItem as EInvoiceHistoryItem).items}
                    profile={profile}
                  />
                ) : (
                  <EWayBillTemplate
                    eWayBillData={viewHistoryItem as EWayBillHistoryItem}
                    client={(clients.find(c => c.id === viewHistoryItem.client_id) as Client) || { name: '', email: '', gstin: '', address: '', state: '', postal_code: '' }}
                    items={(viewHistoryItem as EWayBillHistoryItem).items}
                    profile={profile}
                  />
                )}
              </div>
            </ResponsiveInvoiceWrapper>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
