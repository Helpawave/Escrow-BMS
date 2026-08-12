import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ArrowLeft, AlertTriangle, ChevronsUpDown, Check, Plus, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Client, Vendor, Invoice } from '@/types/invoice';

export interface InvoiceFormData {
  client_id: string;
  vendor_id: string;
  issue_date: string;
  due_date: string;
  notes: string;
  terms: string;
  status: string;
}

interface InvoiceHeaderProps {
  isPurchase: boolean;
  setIsPurchase: (val: boolean) => void;
  formData: InvoiceFormData;
  setFormData: (data: InvoiceFormData) => void;
  clients: Client[];
  vendors: Vendor[];
  clientSearchOpen: boolean;
  setClientSearchOpen: (open: boolean) => void;
  setNewClientDialogOpen: (open: boolean) => void;
  setNewVendorDialogOpen: (open: boolean) => void;
  isEditing: boolean;
  invoiceNumber: string | null;
  invoiceStatus: string;
  invoiceCurrency: string;
  hideCompanyDetails: boolean;
  setHideCompanyDetails: (val: boolean) => void;
}

export const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({
  isPurchase,
  setIsPurchase,
  formData,
  setFormData,
  clients,
  vendors,
  clientSearchOpen,
  setClientSearchOpen,
  setNewClientDialogOpen,
  setNewVendorDialogOpen,
  isEditing,
  invoiceNumber,
  invoiceStatus,
  invoiceCurrency,
  hideCompanyDetails,
  setHideCompanyDetails
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Toggle Buttons */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl gap-1">
        <Button 
          type="button" 
          variant={!isPurchase ? "hero" : "ghost"} 
          onClick={() => setIsPurchase(false)}
          className={cn(
            "flex-1 h-10 sm:h-11 rounded-xl font-black text-xs sm:text-sm transition-all",
            !isPurchase ? "shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:bg-white/50"
          )}
        >
          Sales Invoice
        </Button>
        <Button 
          type="button" 
          variant={isPurchase ? "hero" : "ghost"} 
          onClick={() => setIsPurchase(true)}
          className={cn(
            "flex-1 h-10 sm:h-11 rounded-xl font-black text-xs sm:text-sm transition-all",
            isPurchase ? "shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:bg-white/50"
          )}
        >
          Purchase Bill
        </Button>
      </div>

      {/* No Clients Alert */}
      {!isPurchase && clients.length === 0 && (
        <Alert variant="destructive" className="bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No clients found</AlertTitle>
          <AlertDescription className="flex items-center flex-wrap gap-2 mt-1">
            <span>You need to add clients first before creating invoices.</span>
          </AlertDescription>
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/40 p-4 rounded-xl border border-border">
        {/* Toggle Type & Status */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-background p-1.5 rounded-lg border border-border">
            <Label htmlFor="invoice-type" className="text-xs font-semibold px-2 cursor-pointer">
              {isPurchase ? "Purchase Bill" : "Sales Invoice"}
            </Label>
            <Switch
              id="invoice-type"
              checked={isPurchase}
              onCheckedChange={setIsPurchase}
              disabled={isEditing}
            />
          </div>

          {isEditing && (
            <Badge variant="outline" className="text-xs font-medium px-2.5 py-1">
              Status: <span className="capitalize font-semibold ml-1">{invoiceStatus || 'Draft'}</span>
            </Badge>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <Switch
              id="hide-details"
              checked={hideCompanyDetails}
              onCheckedChange={setHideCompanyDetails}
            />
            <Label htmlFor="hide-details" className="cursor-pointer font-medium text-muted-foreground">
              Hide my details
            </Label>
          </div>
        </div>
      </div>

      {/* Main Header Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-xl border border-border shadow-xs">
        {/* Left: Client / Vendor Selector */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            {isPurchase ? "Vendor / Supplier" : "Client / Customer"}
            <span className="text-destructive">*</span>
          </Label>

          <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={clientSearchOpen}
                className="w-full justify-between font-normal"
                id="entity_id"
              >
                {isPurchase 
                  ? (formData.vendor_id ? (purchaseVendorOptions.find(v => v.id === formData.vendor_id)?.name || vendors.find(v => v.id === formData.vendor_id)?.name || clients.find(c => c.id === formData.vendor_id)?.name) : "Select a vendor or client...")
                  : (formData.client_id ? clients.find(c => c.id === formData.client_id)?.name : "Select a client...")
                }
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder={isPurchase ? "Search vendor or client..." : "Search client..."} />
                <CommandList className="max-h-[130px] overflow-y-auto">
                  <CommandEmpty className="py-2 px-4 text-sm text-muted-foreground flex flex-col gap-2">
                    {isPurchase ? "No vendor/client found." : "No client found."}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={() => {
                        setClientSearchOpen(false);
                        if (isPurchase) setNewVendorDialogOpen(true);
                        else setNewClientDialogOpen(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" /> {isPurchase ? "Add as new vendor" : "Add as new client"}
                    </Button>
                  </CommandEmpty>
                  <CommandGroup>
                    {(isPurchase ? purchaseVendorOptions : clients).map((entity) => (
                      <CommandItem
                        key={entity.id}
                        value={entity.name}
                        onSelect={() => {
                          if (isPurchase) {
                            setFormData({ ...formData, vendor_id: entity.id });
                          } else {
                            setFormData({ ...formData, client_id: entity.id });
                          }
                          setClientSearchOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            (isPurchase ? formData.vendor_id === entity.id : formData.client_id === entity.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {entity.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
                    <div className="border-t border-border p-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-primary hover:text-primary hover:bg-primary/5"
                        onClick={() => {
                          setClientSearchOpen(false);
                          if (isPurchase) setNewVendorDialogOpen(true);
                          else setNewClientDialogOpen(true);
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        {isPurchase ? "Add New Vendor" : "Add New Client"}
                      </Button>
                    </div>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="issue_date">Issue Date</Label>
            <Input
              id="issue_date"
              type="date"
              value={formData.issue_date}
              onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
