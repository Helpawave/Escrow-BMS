import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { 
  AlertTriangle, 
  ChevronsUpDown, 
  Check, 
  Plus, 
  UserPlus, 
  BookOpen, 
  CreditCard, 
  Calendar, 
  CheckCircle2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Client, Vendor } from '@/types/invoice';

export interface InvoiceFormData {
  client_id: string;
  vendor_id: string;
  issue_date: string;
  due_date: string;
  notes: string;
  terms: string;
  status: string;
}

export interface LedgerPartyOption {
  id: string;
  party_name: string;
  status: 'take' | 'give';
  balance: number;
  last_date?: string;
  phone?: string;
}

interface InvoiceHeaderProps {
  billingType?: 'sales' | 'purchase' | 'ledger';
  setBillingType?: (type: 'sales' | 'purchase' | 'ledger') => void;
  isPurchase: boolean;
  setIsPurchase: (val: boolean) => void;
  formData: InvoiceFormData;
  setFormData: (data: InvoiceFormData) => void;
  clients: Client[];
  vendors: Vendor[];
  ledgerParties?: LedgerPartyOption[];
  selectedLedgerPartyId?: string | null;
  onLedgerPartySelect?: (partyId: string, customAmount?: number) => void;
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
  billingType = 'sales',
  setBillingType,
  isPurchase,
  setIsPurchase,
  formData,
  setFormData,
  clients,
  vendors,
  ledgerParties = [],
  selectedLedgerPartyId,
  onLedgerPartySelect,
  clientSearchOpen,
  setClientSearchOpen,
  setNewClientDialogOpen,
  setNewVendorDialogOpen
}) => {
  const isLedger = billingType === 'ledger';

  const purchaseVendorOptions = React.useMemo(() => {
    if (!isPurchase) return [];
    const map = new Map<string, { id: string; name: string }>();
    (vendors || []).forEach(v => {
      if (v.id && v.name) map.set(v.id, { id: v.id, name: v.name });
    });
    (clients || []).forEach(c => {
      if (c.id && c.name && !map.has(c.id)) {
        map.set(c.id, { id: c.id, name: c.name });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [isPurchase, vendors, clients]);

  const selectedParty = React.useMemo(() => {
    if (!isLedger) return null;
    return ledgerParties.find(p => p.id === selectedLedgerPartyId) || null;
  }, [isLedger, ledgerParties, selectedLedgerPartyId]);

  const handleTabChange = (type: 'sales' | 'purchase' | 'ledger') => {
    if (setBillingType) {
      setBillingType(type);
    } else {
      setIsPurchase(type === 'purchase');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 3-Way Mode Toggle Tabs */}
      <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl gap-1.5 shadow-inner">
        <Button 
          type="button" 
          variant={billingType === 'sales' ? "hero" : "ghost"} 
          onClick={() => handleTabChange('sales')}
          className={cn(
            "flex-1 h-10 sm:h-11 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer",
            billingType === 'sales' 
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md shadow-slate-200/50 dark:shadow-none" 
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <span>Sales Invoice</span>
        </Button>
        <Button 
          type="button" 
          variant={billingType === 'purchase' ? "hero" : "ghost"} 
          onClick={() => handleTabChange('purchase')}
          className={cn(
            "flex-1 h-10 sm:h-11 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer",
            billingType === 'purchase' 
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md shadow-slate-200/50 dark:shadow-none" 
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <span>Purchase Bill</span>
        </Button>
        <Button 
          type="button" 
          variant={billingType === 'ledger' ? "hero" : "ghost"} 
          onClick={() => handleTabChange('ledger')}
          className={cn(
            "flex-1 h-10 sm:h-11 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            billingType === 'ledger' 
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20" 
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>Ledger Billing</span>
        </Button>
      </div>

      {/* Ledger Billing Information Guide */}
      {isLedger && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/60 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-blue-900 dark:text-blue-200">
            <p className="font-bold text-sm text-blue-950 dark:text-blue-100 mb-0.5">
              Account Ledger Balance Billing Mode
            </p>
            <p className="opacity-90">
              Select any party from your Account Ledger below. Their live remaining balance and contact details will automatically be fetched and populated into the bill.
            </p>
          </div>
        </div>
      )}

      {/* No Clients Alert for Sales */}
      {billingType === 'sales' && clients.length === 0 && (
        <Alert variant="destructive" className="bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No clients found</AlertTitle>
          <AlertDescription className="flex items-center flex-wrap gap-2 mt-1">
            <span>You need to add clients first before creating invoices.</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Entity and Date Selection */}
      <Card className="p-4 md:p-6 bg-card dark:bg-card rounded-2xl border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="entity_id" className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {isLedger 
                ? "Ledger Party & Account *" 
                : (isPurchase ? "Vendor / Supplier *" : "Client / Customer *")
              }
            </Label>
            <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={clientSearchOpen}
                  className="w-full justify-between font-medium h-11 rounded-xl"
                  id="entity_id"
                >
                  {isLedger ? (
                    selectedParty ? (
                      <div className="flex items-center justify-between w-full pr-2">
                        <span className="font-bold text-slate-900 dark:text-white truncate">{selectedParty.party_name}</span>
                        <span className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-md ml-2 shrink-0",
                          selectedParty.balance >= 0 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        )}>
                          Bal: ₹{Math.abs(selectedParty.balance).toLocaleString()} ({selectedParty.status === 'take' ? 'Take' : 'Give'})
                        </span>
                      </div>
                    ) : "Select party with ledger balance..."
                  ) : isPurchase ? (
                    formData.vendor_id 
                      ? (purchaseVendorOptions.find(v => v.id === formData.vendor_id)?.name || vendors.find(v => v.id === formData.vendor_id)?.name || clients.find(c => c.id === formData.vendor_id)?.name) 
                      : "Select a vendor or client..."
                  ) : (
                    formData.client_id ? clients.find(c => c.id === formData.client_id)?.name : "Select a client..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl" align="start">
                <Command>
                  <CommandInput placeholder={isLedger ? "Search party by name..." : (isPurchase ? "Search vendor or client..." : "Search client...")} />
                  <CommandList className="max-h-[220px] overflow-y-auto">
                    <CommandEmpty className="py-3 px-4 text-xs text-muted-foreground flex flex-col gap-2">
                      {isLedger ? "No ledger parties found." : (isPurchase ? "No vendor/client found." : "No client found.")}
                      {!isLedger && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs cursor-pointer"
                          onClick={() => {
                            setClientSearchOpen(false);
                            if (isPurchase) setNewVendorDialogOpen(true);
                            else setNewClientDialogOpen(true);
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" /> {isPurchase ? "Add as new vendor" : "Add as new client"}
                        </Button>
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {isLedger ? (
                        ledgerParties.map((party) => (
                          <CommandItem
                            key={party.id}
                            value={party.party_name}
                            onSelect={() => {
                              if (onLedgerPartySelect) {
                                onLedgerPartySelect(party.id);
                              }
                              setClientSearchOpen(false);
                            }}
                            className="cursor-pointer py-2.5 px-3 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Check
                                className={cn(
                                  "h-4 w-4 shrink-0",
                                  selectedLedgerPartyId === party.id ? "opacity-100 text-blue-600" : "opacity-0"
                                )}
                              />
                              <div className="truncate">
                                <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{party.party_name}</p>
                                <p className="text-[10px] text-slate-400">Status: {party.status === 'take' ? 'Take' : 'Give'}</p>
                              </div>
                            </div>
                            <span className={cn(
                              "text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0 border",
                              party.balance >= 0 
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800" 
                                : "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800"
                            )}>
                              ₹{Math.abs(party.balance).toLocaleString()}
                            </span>
                          </CommandItem>
                        ))
                      ) : (
                        (isPurchase ? purchaseVendorOptions : clients).map((entity) => (
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
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                (isPurchase ? formData.vendor_id === entity.id : formData.client_id === entity.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {entity.name}
                          </CommandItem>
                        ))
                      )}
                    </CommandGroup>
                  </CommandList>
                  {!isLedger && (
                    <div className="border-t border-border p-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-primary hover:text-primary hover:bg-primary/5 cursor-pointer"
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
                  )}
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="issue_date" className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Issue Date</Label>
            <Input
              id="issue_date"
              type="date"
              className="h-11 rounded-xl font-medium"
              value={formData.issue_date}
              onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="due_date" className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              className="h-11 rounded-xl font-medium"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
        </div>

        {/* Selected Party Balance Quick-Action Panel */}
        {isLedger && selectedParty && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Live Ledger Outstanding</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">
                ₹{Math.abs(selectedParty.balance).toLocaleString()}
              </span>
              <span className={cn(
                "text-[10px] font-black ml-2 px-1.5 py-0.5 rounded",
                selectedParty.status === 'take' ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
              )}>
                {selectedParty.status === 'take' ? 'Take' : 'Give'}
              </span>
            </div>

            <div className="sm:col-span-2 flex flex-wrap items-center gap-2 justify-start sm:justify-end">
              <span className="text-xs font-bold text-slate-500 mr-1">Settlement Presets:</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onLedgerPartySelect && onLedgerPartySelect(selectedParty.id, Math.abs(selectedParty.balance))}
                className="h-8 text-xs font-bold rounded-lg border-blue-300 text-blue-700 hover:bg-blue-50 cursor-pointer"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                100% Full Balance (₹{Math.abs(selectedParty.balance).toLocaleString()})
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onLedgerPartySelect && onLedgerPartySelect(selectedParty.id, Math.round(Math.abs(selectedParty.balance) / 2))}
                className="h-8 text-xs font-bold rounded-lg cursor-pointer"
              >
                50% Partial (₹{Math.round(Math.abs(selectedParty.balance) / 2).toLocaleString()})
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
