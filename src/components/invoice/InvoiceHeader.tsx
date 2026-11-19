import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ArrowLeft, AlertTriangle, ChevronsUpDown, Check, Plus, UserPlus, Car, Phone, Coffee, Utensils, Sparkles, User } from "lucide-react";
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
  invoice_number?: string;
  payment_method?: string;
}

interface InvoiceHeaderProps {
  isPurchase: boolean;
  setIsPurchase: (val: boolean) => void;
  isDownpayment?: boolean;
  setIsDownpayment?: (val: boolean) => void;
  isAutomobile?: boolean;
  isCafe?: boolean;
  cafeCustomerPhone?: string;
  setCafeCustomerPhone?: (val: string) => void;
  cafeCustomerName?: string;
  setCafeCustomerName?: (val: string) => void;
  cafeTable?: string;
  setCafeTable?: (val: string) => void;
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
  isDownpayment = false,
  setIsDownpayment,
  isAutomobile = false,
  isCafe = false,
  cafeCustomerPhone,
  setCafeCustomerPhone,
  cafeCustomerName,
  setCafeCustomerName,
  cafeTable,
  setCafeTable,
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
  const matchedClient = React.useMemo(() => {
    if (formData.client_id) {
      return clients.find(c => c.id === formData.client_id);
    }
    const cleanPhone = (cafeCustomerPhone || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone.length === 10) {
      return clients.find(c => ((c.phone || (c as any).mobile || '').replace(/\D/g, '').slice(-10) === cleanPhone));
    }
    return undefined;
  }, [clients, formData.client_id, cafeCustomerPhone]);

  // Auto-fetch name as soon as matchedClient is resolved
  React.useEffect(() => {
    if (matchedClient?.name && (!cafeCustomerName || cafeCustomerName !== matchedClient.name)) {
      setCafeCustomerName?.(matchedClient.name);
      if (formData.client_id !== matchedClient.id) {
        setFormData({ ...formData, client_id: matchedClient.id });
      }
    }
  }, [matchedClient]);

  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    const digitsOnly = raw.length > 10 ? raw.slice(-10) : raw;
    setCafeCustomerPhone?.(digitsOnly);

    if (digitsOnly.length === 10) {
      const existing = clients.find(c => ((c.phone || (c as any).mobile || '').replace(/\D/g, '').slice(-10) === digitsOnly));
      if (existing) {
        setFormData({ ...formData, client_id: existing.id });
        setCafeCustomerName?.(existing.name);
      } else {
        setFormData({ ...formData, client_id: '' });
      }
    } else {
      if (formData.client_id) {
        const active = clients.find(c => c.id === formData.client_id);
        if (active && (active.phone || (active as any).mobile || '').replace(/\D/g, '').slice(-10) !== digitsOnly) {
          setFormData({ ...formData, client_id: '' });
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toggle Buttons: Sales Invoice vs Purchase Bill vs Downpayment (Only when creating new document) */}
      {!isEditing ? (
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl gap-1">
          <Button 
            type="button" 
            variant={!isPurchase && !isDownpayment ? "hero" : "ghost"} 
            onClick={() => {
              setIsPurchase(false);
              if (setIsDownpayment) setIsDownpayment(false);
            }}
            className={cn(
              "flex-1 h-10 sm:h-11 rounded-xl font-black text-xs sm:text-sm transition-all",
              !isPurchase && !isDownpayment ? "shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:bg-white/50"
            )}
          >
            Sales Invoice
          </Button>
          <Button 
            type="button" 
            variant={isPurchase ? "hero" : "ghost"} 
            onClick={() => {
              setIsPurchase(true);
              if (setIsDownpayment) setIsDownpayment(false);
            }}
            className={cn(
              "flex-1 h-10 sm:h-11 rounded-xl font-black text-xs sm:text-sm transition-all",
              isPurchase ? "shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:bg-white/50"
            )}
          >
            Purchase Bill
          </Button>
          {setIsDownpayment && isAutomobile && (
            <Button 
              type="button" 
              variant={isDownpayment ? "default" : "ghost"} 
              onClick={() => {
                setIsPurchase(false);
                setIsDownpayment(true);
              }}
              className={cn(
                "flex-1 h-10 sm:h-11 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5",
                isDownpayment 
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/25" 
                  : "text-slate-500 hover:bg-white/50"
              )}
            >
              <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
              <span>Downpayment</span>
            </Button>
          )}
        </div>
      ) : (
        /* Locked Document Type Banner when Editing */
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm shadow-2xs">
          <div className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200">
            {isPurchase ? (
              <>
                <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">📦</span>
                <span>Editing Purchase Bill <strong className="font-mono text-blue-700 dark:text-blue-400">#{invoiceNumber}</strong></span>
              </>
            ) : isDownpayment ? (
              <>
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">🚗</span>
                <span>Editing Downpayment Receipt <strong className="font-mono text-amber-700 dark:text-amber-400">#{invoiceNumber}</strong></span>
              </>
            ) : (
              <>
                <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">📄</span>
                <span>Editing Sales Invoice <strong className="font-mono text-indigo-700 dark:text-indigo-400">#{invoiceNumber}</strong></span>
              </>
            )}
          </div>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
            {isPurchase ? 'Purchase Record' : isDownpayment ? 'Downpayment Voucher' : 'Sales Invoice'}
          </span>
        </div>
      )}

      {/* No Clients Alert */}
      {!isPurchase && !isCafe && clients.length === 0 && (
        <Alert variant="destructive" className="bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No clients found</AlertTitle>
          <AlertDescription className="flex items-center flex-wrap gap-2 mt-1">
            <span>You need to add clients first before creating invoices.</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Entity and Date Selection */}
      <Card className="p-4 md:p-6 bg-card dark:bg-card">
        {isCafe && !isPurchase ? (
          <div className="space-y-4">
            {/* Cafe POS Quick Counter Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300/80 dark:border-amber-700/80 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-amber-500/20 shrink-0">
                  ☕
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                      Cafe Quick POS Billing
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-400/40">
                      ⚡ Instant Customer Match
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Sirf customer ka 10-digit mobile number enter karein — client automatically match ya create ho jayega!
                  </p>
                </div>
              </div>

              {/* Quick Date Display */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Date</span>
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formData.issue_date || new Date().toISOString().split('T')[0]}
                  </span>
                </div>
              </div>
            </div>

            {/* Table / Order Type Quick Selectors */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-amber-600" />
                  <span>Order Type / Dining Table</span>
                </Label>
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  {cafeTable ? `Selected: ${cafeTable}` : 'Takeaway / Parcel'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { label: '🥡 Takeaway / Parcel', val: 'Takeaway' },
                  { label: '🍽️ Table 1', val: 'Table 1' },
                  { label: '🍽️ Table 2', val: 'Table 2' },
                  { label: '🍽️ Table 3', val: 'Table 3' },
                  { label: '🍽️ Table 4', val: 'Table 4' },
                  { label: '🍽️ Table 5', val: 'Table 5' },
                  { label: '🍽️ Table 6', val: 'Table 6' },
                  { label: '🍽️ Table 7', val: 'Table 7' },
                  { label: '🍽️ Table 8', val: 'Table 8' },
                ].map((item) => {
                  const isSelected = (cafeTable === item.val) || (!cafeTable && item.val === 'Takeaway');
                  return (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => {
                        setCafeTable?.(item.val);
                        const cleanNotes = (formData.notes || '').replace(/\[Table: [^\]]+\]\s*/g, '').trim();
                        const newNotes = `[Table: ${item.val}] ${cleanNotes}`.trim();
                        setFormData({ ...formData, notes: newNotes });
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer",
                        isSelected
                          ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-sm scale-102"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400"
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer Phone & Name Direct Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Mobile Number */}
              <div className="md:col-span-5 space-y-1.5">
                <Label htmlFor="cafe_customer_phone" className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-amber-600" />
                    <span>Customer Mobile (10 Digits)</span>
                  </span>
                  {matchedClient ? (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                      ✓ Existing Customer
                    </span>
                  ) : (cafeCustomerPhone && cafeCustomerPhone.length === 10) ? (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300">
                      + New Customer (Auto-Save)
                    </span>
                  ) : null}
                </Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500 font-mono">
                    +91
                  </span>
                  <Input
                    id="cafe_customer_phone"
                    type="tel"
                    maxLength={10}
                    value={cafeCustomerPhone || ''}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="pl-14 h-11 text-sm sm:text-base font-mono font-bold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-amber-500 rounded-xl"
                  />
                  {cafeCustomerPhone && (
                    <button
                      type="button"
                      onClick={() => handlePhoneChange('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 hover:text-slate-600 font-bold px-1.5 py-1"
                      title="Clear"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Customer Name */}
              <div className="md:col-span-4 space-y-1.5">
                <Label htmlFor="cafe_customer_name" className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-600" />
                    <span>Customer Name</span>
                  </span>
                  <span className="text-xs text-muted-foreground">Default: Walk-in Guest</span>
                </Label>
                <Input
                  id="cafe_customer_name"
                  value={cafeCustomerName || ''}
                  onChange={(e) => setCafeCustomerName?.(e.target.value)}
                  placeholder="e.g. Rohit Kumar / Guest"
                  className="h-11 text-sm sm:text-base font-bold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-amber-500 rounded-xl"
                />
              </div>

              {/* Browse Existing Clients Popover */}
              <div className="md:col-span-3">
                <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-10 text-xs font-bold border-slate-300 dark:border-slate-700 hover:border-amber-500 flex items-center justify-between px-3"
                    >
                      <span className="truncate">
                        {formData.client_id ? (clients.find(c => c.id === formData.client_id)?.name || "Change Client") : "Saved Clients"}
                      </span>
                      <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Search client name or phone..." />
                      <CommandList className="max-h-[220px] overflow-y-auto">
                        <CommandEmpty className="py-3 px-4 text-xs text-muted-foreground text-center">
                          No matching clients found.
                        </CommandEmpty>
                        <CommandGroup>
                          {clients.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={`${c.name} ${c.phone || ''}`}
                              onSelect={() => {
                                setFormData({ ...formData, client_id: c.id });
                                setCafeCustomerName?.(c.name);
                                if (c.phone) {
                                  setCafeCustomerPhone?.(c.phone.replace(/\D/g, '').slice(-10));
                                }
                                setClientSearchOpen(false);
                              }}
                              className="text-xs flex flex-col items-start py-2 cursor-pointer"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-bold text-slate-800 dark:text-slate-100">{c.name}</span>
                                {formData.client_id === c.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              </div>
                              {c.phone && <span className="text-[11px] text-muted-foreground font-mono">{c.phone}</span>}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Quick Status / Auto-create Hint */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                {matchedClient
                  ? `Matched returning client "${matchedClient.name}". Bills and orders are automatically linked to their profile.`
                  : (cafeCustomerPhone && cafeCustomerPhone.length === 10)
                  ? `New customer with mobile +91 ${cafeCustomerPhone} will be automatically saved on bill generation.`
                  : "Enter mobile number for quick tracking or proceed as Walk-in Guest."
                }
              </span>
            </div>
          </div>
        ) : (
          <div>
            {isPurchase && (
          <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Supplier &amp; Bill Information
              </h3>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50">
              Procurement Inward
            </span>
          </div>
        )}

        <div className={cn("grid gap-4", isPurchase ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-3")}>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="entity_id" className="text-xs font-bold">{isPurchase ? "Vendor / Supplier *" : "Client *"}</Label>
            <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={clientSearchOpen}
                  className="w-full justify-between font-normal h-10"
                  id="entity_id"
                >
                  {isPurchase 
                    ? (formData.vendor_id ? vendors.find(v => v.id === formData.vendor_id)?.name : "Select a vendor...")
                    : (formData.client_id ? clients.find(c => c.id === formData.client_id)?.name : "Select a client...")
                  }
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder={isPurchase ? "Search vendor..." : "Search client..."} />
                  <CommandList className="max-h-[130px] overflow-y-auto">
                    <CommandEmpty className="py-2 px-4 text-sm text-muted-foreground flex flex-col gap-2">
                      {isPurchase ? "No vendor found." : "No client found."}
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
                      {(isPurchase ? vendors : clients).map((entity) => (
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

          {/* Supplier's Bill Number for Purchase Bills */}
          {isPurchase && (
            <div className="flex flex-col space-y-2">
              <Label htmlFor="invoice_number" className="text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>Supplier Bill / Invoice #</span>
                  <span className="text-rose-500 font-bold">*</span>
                </span>
                <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">Mandatory</span>
              </Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number || ''}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="e.g. PB-2026/012 (Auto-generated)"
                className="h-10 text-sm font-medium border-primary/30 focus:border-primary"
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="issue_date" className="text-xs font-bold">{isPurchase ? "Bill Date" : "Issue Date"}</Label>
            <Input
              id="issue_date"
              type="date"
              value={formData.issue_date}
              onChange={(e) => {
                const newIssue = e.target.value;
                if (!newIssue) {
                  setFormData({ ...formData, issue_date: newIssue });
                  return;
                }
                // Maintain credit period between issue_date and due_date
                if (formData.issue_date && formData.due_date) {
                  const oldIssueTime = new Date(formData.issue_date).getTime();
                  const oldDueTime = new Date(formData.due_date).getTime();
                  const diffDays = Math.round((oldDueTime - oldIssueTime) / (1000 * 60 * 60 * 24));
                  const validDiff = !isNaN(diffDays) && diffDays >= 0 ? diffDays : 30;
                  const newDue = new Date(new Date(newIssue).getTime() + validDiff * 24 * 60 * 60 * 1000);
                  setFormData({
                    ...formData,
                    issue_date: newIssue,
                    due_date: newDue.toISOString().split('T')[0]
                  });
                } else {
                  setFormData({ ...formData, issue_date: newIssue });
                }
              }}
              className="h-10 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="due_date" className="text-xs font-bold">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="h-10 text-sm"
            />
          </div>
        </div>

        {/* Selected Vendor Preview & Payment Status for Purchase Bills */}
        {isPurchase && (
          <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-7">
              {formData.vendor_id ? (
                (() => {
                  const v = vendors.find(item => item.id === formData.vendor_id);
                  if (!v) return null;
                  return (
                    <div className="text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-muted-foreground flex flex-col gap-0.5">
                      <span className="font-bold text-foreground">{v.name}</span>
                      <div className="flex flex-wrap gap-x-3 text-[11px]">
                        {v.phone && <span>📞 {v.phone}</span>}
                        {v.gstin && <span>🏛️ GSTIN: <strong className="text-foreground">{v.gstin}</strong></span>}
                        {v.address && <span className="truncate max-w-[240px]">📍 {v.address}</span>}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Select a supplier above to link procurement to this vendor.
                </p>
              )}
            </div>

            <div className="md:col-span-5 flex flex-wrap items-center justify-start md:justify-end gap-2.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment:</span>
              <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={formData.status === 'pending' ? 'hero' : 'ghost'}
                  onClick={() => setFormData({ ...formData, status: 'pending' })}
                  className={cn(
                    "h-8 px-3 text-xs font-bold rounded-lg transition-all",
                    formData.status === 'pending' ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                  )}
                >
                  Unpaid / Credit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={formData.status === 'paid' ? 'hero' : 'ghost'}
                  onClick={() => setFormData({ ...formData, status: 'paid' })}
                  className={cn(
                    "h-8 px-3 text-xs font-bold rounded-lg transition-all",
                    formData.status === 'paid' ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                  )}
                >
                  Paid
                </Button>
              </div>

              {formData.status === 'paid' && (
                <select
                  value={formData.payment_method || 'cash'}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="h-8 px-2.5 text-xs font-bold rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / Online</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              )}
            </div>
          </div>
        )}
          </div>
        )}
      </Card>
    </div>
  );
};
