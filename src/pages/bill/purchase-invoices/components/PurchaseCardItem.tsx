import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  Printer,
  Mail,
  Phone,
  Pencil,
  CreditCard,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { PurchaseInvoice } from "../types";

interface PurchaseCardItemProps {
  invoice: PurchaseInvoice;
  onPreview: (inv: PurchaseInvoice) => void;
  onPrint: (inv: PurchaseInvoice) => void;
  onWhatsApp: (inv: PurchaseInvoice, e: React.MouseEvent) => void;
  onEmail: (inv: PurchaseInvoice, e: React.MouseEvent) => void;
  onSMS: (inv: PurchaseInvoice, e: React.MouseEvent) => void;
  onEdit: (inv: PurchaseInvoice) => void;
  onMarkPaid: (inv: PurchaseInvoice) => void;
  onDelete: (id: string) => void;
  sharedStatus?: { whatsapp?: boolean; email?: boolean; sms?: boolean };
  formatAmount: (amount: number) => string;
  getCreatorTag: (notes?: string | null) => string;
}

export const PurchaseCardItem: React.FC<PurchaseCardItemProps> = ({
  invoice: inv,
  onPreview,
  onPrint,
  onWhatsApp,
  onEmail,
  onSMS,
  onEdit,
  onMarkPaid,
  onDelete,
  sharedStatus,
  formatAmount,
  getCreatorTag,
}) => {
  return (
    <Card className="p-4 md:p-6 rounded-md border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        <div
          className="space-y-4 cursor-pointer"
          onClick={() => onPreview(inv)}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{inv.invoice_number}</span>
                <StatusBadge status={inv.status} dueDate={inv.due_date} />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{inv.vendors?.name || 'Unknown Vendor'}</p>
              <p className="text-[10px] text-muted-foreground/60 font-normal">
                {getCreatorTag(inv.notes)}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{safelyToLocaleDate(inv.issue_date)}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{formatAmount(Number(inv.total_amount || 0))}</p>
              <p className="text-xs text-muted-foreground uppercase">{inv.currency || 'INR'}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="h-10 w-full"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(inv);
              }}
              title="Preview Bill"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 w-full"
              onClick={(e) => {
                e.stopPropagation();
                onPrint(inv);
              }}
              title="Print Bill"
            >
              <Printer className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`h-10 w-full ${sharedStatus?.whatsapp ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : ''}`}
              onClick={(e) => onWhatsApp(inv, e)}
              title="Share to WhatsApp"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${sharedStatus?.whatsapp ? 'text-emerald-700' : 'text-emerald-500'}`}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {inv.vendors?.email && (
                  <DropdownMenuItem
                    onClick={(e) => onEmail(inv, e as any)}
                    className={sharedStatus?.email ? "text-emerald-600 font-medium" : ""}
                  >
                    <Mail className={`mr-2 h-4 w-4 ${sharedStatus?.email ? "text-emerald-600" : ""}`} />
                    Email to Vendor {sharedStatus?.email && "✓"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => onSMS(inv, e as any)}
                  className={sharedStatus?.sms ? "text-emerald-600 font-medium" : ""}
                >
                  <Phone className={`mr-2 h-4 w-4 ${sharedStatus?.sms ? "text-emerald-600" : ""}`} />
                  Send via SMS {sharedStatus?.sms && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onPrint(inv);
                }}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Bill
                </DropdownMenuItem>
                {inv.status !== 'paid' ? (
                  <>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onEdit(inv);
                    }}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Bill
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkPaid(inv);
                      }}
                      className="cursor-pointer font-medium text-emerald-700 dark:text-emerald-400"
                    >
                      <CreditCard className="mr-2 h-4 w-4 text-emerald-600" />
                      Mark as Paid
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    disabled
                    className="text-emerald-600 font-medium disabled:opacity-100"
                  >
                    <CreditCard className="mr-2 h-4 w-4 text-emerald-600" />
                    Settled / Paid
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(inv.id);
                  }}
                  className="text-destructive font-medium cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Bill
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Desktop Card Layout */}
      <div className="hidden md:flex items-center justify-between gap-3">
        {/* Left: Bill info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base lg:text-lg font-semibold truncate">{inv.invoice_number}</h3>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {inv.vendors?.name || 'Unknown Vendor'}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{safelyToLocaleDate(inv.issue_date)}</span>
              <span className="text-[10px] text-muted-foreground/60">
                {getCreatorTag(inv.notes)}
              </span>
            </div>
          </div>
          <StatusBadge status={inv.status} dueDate={inv.due_date} />
        </div>

        {/* Right: Amount + Actions */}
        <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
          <div className="text-right">
            <p className="text-base lg:text-lg font-bold">{formatAmount(Number(inv.total_amount || 0))}</p>
            <p className="text-xs lg:text-sm text-muted-foreground uppercase">{inv.currency || 'INR'}</p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* WhatsApp */}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => onWhatsApp(inv, e)}
              title="Send via WhatsApp"
              className={`flex items-center gap-1 h-8 lg:h-9 px-2 lg:px-3 font-semibold ${sharedStatus?.whatsapp ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800' : 'text-emerald-700 hover:bg-emerald-50'}`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-600">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>

            {/* Mark as Paid */}
            {inv.status !== 'paid' && (
              <Button
                variant="outline"
                size="sm"
                title="Mark as Paid"
                onClick={() => onMarkPaid(inv)}
                className="h-8 lg:h-9 px-2 lg:px-3 font-semibold bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800 transition-all active:scale-95"
              >
                <CreditCard className="w-4 h-4 lg:mr-1 text-emerald-600" />
                <span className="hidden sm:inline">Mark as Paid</span>
              </Button>
            )}

            {/* Quick Preview on wider screens */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onPreview(inv)} 
              title="Preview Bill" 
              className="hidden xl:inline-flex h-8 lg:h-9 w-8 lg:w-9 p-0"
            >
              <Eye className="w-4 h-4" />
            </Button>

            {/* Quick Print on wider screens */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onPrint(inv)} 
              title="Print Bill" 
              className="hidden xl:inline-flex h-8 lg:h-9 w-8 lg:w-9 p-0"
            >
              <Printer className="w-4 h-4" />
            </Button>

            {/* Dropdown Menu for Extra Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 lg:h-9 w-8 lg:w-9 p-0"
                  onClick={(e) => e.stopPropagation()}
                  title="More actions"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => onPreview(inv)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Bill
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPrint(inv)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Bill
                </DropdownMenuItem>
                {inv.vendors?.email && (
                  <DropdownMenuItem onClick={(e) => onEmail(inv, e as any)}>
                    <Mail className={`mr-2 h-4 w-4 ${sharedStatus?.email ? 'text-emerald-600' : ''}`} />
                    Email to Vendor {sharedStatus?.email && "✓"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={(e) => onSMS(inv, e as any)}>
                  <Phone className={`mr-2 h-4 w-4 ${sharedStatus?.sms ? 'text-emerald-600' : ''}`} />
                  Send via SMS {sharedStatus?.sms && "✓"}
                </DropdownMenuItem>
                {inv.status !== 'paid' && (
                  <DropdownMenuItem onClick={() => onEdit(inv)}>
                    <Pencil className="mr-2 h-4 w-4 text-amber-600" />
                    Edit Bill
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onDelete(inv.id)}
                  className="text-destructive font-medium cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {inv.status === 'paid' ? 'Delete Paid Bill ⚠️' : 'Delete Bill'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  );
};

