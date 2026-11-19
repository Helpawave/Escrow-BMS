import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { TabsContent } from "@/components/ui/tabs";
import { ChevronsUpDown, Check, ShieldAlert, Package, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Client, PartialInvoice, EInvoiceItem, UNIT_OPTIONS, EInvoiceFormData } from "../types";

export type { EInvoiceFormData };

interface EInvoiceTabProps {
  eInvoiceData: EInvoiceFormData;
  setEInvoiceData: React.Dispatch<React.SetStateAction<EInvoiceFormData>>;
  clients: Client[];
  invoices: PartialInvoice[];
  invoiceSearchOpen: boolean;
  setInvoiceSearchOpen: (open: boolean) => void;
  handleInvoiceSelect: (invoiceId: string, targetTab: 'einvoice' | 'ewaybill') => void;
  eInvoiceItems: EInvoiceItem[];
  updateEInvoiceItem: (id: string, field: keyof EInvoiceItem, value: any) => void;
  removeEInvoiceItem: (id: string) => void;
  openProductModal: (target: 'einvoice' | 'ewaybill') => void;
  currencySymbol: string;
  calculateEInvoiceTotals: () => { subtotal: number; taxAmount: number; total: number };
  handleEInvoiceSubmit: () => void;
}

export const EInvoiceTab: React.FC<EInvoiceTabProps> = ({
  eInvoiceData,
  setEInvoiceData,
  clients,
  invoices,
  invoiceSearchOpen,
  setInvoiceSearchOpen,
  handleInvoiceSelect,
  eInvoiceItems,
  updateEInvoiceItem,
  removeEInvoiceItem,
  openProductModal,
  currencySymbol,
  calculateEInvoiceTotals,
  handleEInvoiceSubmit,
}) => {
  return (
    <TabsContent value="einvoice" className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">E-Invoice Details</CardTitle>
          <p className="text-sm text-muted-foreground">Provide information to generate an E-Invoice</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="client">Client *</Label>
              <Select value={eInvoiceData.client_id} onValueChange={(value) => setEInvoiceData({ ...eInvoiceData, client_id: value })}>
                <SelectTrigger id="client" aria-label="Select client">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({client.gstin})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="invoice_type">Invoice Type *</Label>
              <Select value={eInvoiceData.invoice_type} onValueChange={(value) => setEInvoiceData({ ...eInvoiceData, invoice_type: value })}>
                <SelectTrigger id="invoice_type" aria-label="Select invoice type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tax Invoice">Tax Invoice</SelectItem>
                  <SelectItem value="Bill of Supply">Bill of Supply</SelectItem>
                  <SelectItem value="Credit Note">Credit Note</SelectItem>
                  <SelectItem value="Debit Note">Debit Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="invoice_number">Invoice Number *</Label>
              <Popover open={invoiceSearchOpen} onOpenChange={setInvoiceSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={invoiceSearchOpen}
                    className="w-full justify-between"
                  >
                    {eInvoiceData.invoice_number ? eInvoiceData.invoice_number : "Select Invoice..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search invoice number..." />
                    <CommandList>
                      <CommandEmpty>No invoice found.</CommandEmpty>
                      <CommandGroup>
                        {invoices.map((inv) => (
                          <CommandItem
                            key={inv.id}
                            value={inv.invoice_number}
                            onSelect={() => handleInvoiceSelect(inv.id, 'einvoice')}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                eInvoiceData.invoice_number === inv.invoice_number ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{inv.invoice_number}</span>
                              <span className="text-xs text-muted-foreground">
                                {inv.issue_date} - {currencySymbol}{inv.total_amount}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="invoice_date">Invoice Date *</Label>
              <Input
                id="invoice_date"
                type="date"
                value={eInvoiceData.invoice_date}
                onChange={(e) => setEInvoiceData({ ...eInvoiceData, invoice_date: e.target.value })}
                aria-label="Select invoice date"
              />
            </div>

            <div>
              <Label htmlFor="place_of_supply">Place of Supply *</Label>
              <Input
                id="place_of_supply"
                value={eInvoiceData.place_of_supply}
                onChange={(e) => setEInvoiceData({ ...eInvoiceData, place_of_supply: e.target.value })}
                placeholder="State name"
                aria-label="Enter place of supply"
              />
            </div>

            <div>
              <Label htmlFor="reverse_charge">Reverse Charge</Label>
              <Select value={eInvoiceData.reverse_charge} onValueChange={(value) => setEInvoiceData({ ...eInvoiceData, reverse_charge: value })}>
                <SelectTrigger id="reverse_charge" aria-label="Select reverse charge status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-full pt-4 border-t border-dashed mt-2">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Portal Details (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="irn">IRN (Invoice Ref. No)</Label>
                  <Input
                    id="irn"
                    value={eInvoiceData.irn}
                    onChange={(e) => setEInvoiceData({ ...eInvoiceData, irn: e.target.value })}
                    placeholder="64-digit hash..."
                  />
                </div>
                <div>
                  <Label htmlFor="ack_no">Acknowledgement No</Label>
                  <Input
                    id="ack_no"
                    value={eInvoiceData.ack_no}
                    onChange={(e) => setEInvoiceData({ ...eInvoiceData, ack_no: e.target.value })}
                    placeholder="122..."
                  />
                </div>
                <div>
                  <Label htmlFor="ack_date">Acknowledgement Date</Label>
                  <Input
                    id="ack_date"
                    type="date"
                    value={eInvoiceData.ack_date}
                    onChange={(e) => setEInvoiceData({ ...eInvoiceData, ack_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={eInvoiceData.notes}
              onChange={(e) => setEInvoiceData({ ...eInvoiceData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* E-Invoice Items */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Invoice Items</CardTitle>
          <Button onClick={() => openProductModal('einvoice')} size="sm" variant="outline">
            <Package className="h-4 w-4 mr-2" />
            Add Items
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {eInvoiceItems.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-8 gap-2 items-end p-4 border rounded-lg">
                <div className="md:col-span-2">
                  <Label>Description *</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateEInvoiceItem(item.id, 'description', e.target.value)}
                    placeholder="Item description"
                  />
                </div>
                <div>
                  <Label>HSN Code *</Label>
                  <Input
                    value={item.hsn_code}
                    onChange={(e) => updateEInvoiceItem(item.id, 'hsn_code', e.target.value)}
                    placeholder="HSN"
                  />
                </div>
                <div>
                  <Label>Qty *</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateEInvoiceItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={item.unit} onValueChange={(value) => updateEInvoiceItem(item.id, 'unit', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rate *</Label>
                  <Input
                    type="number"
                    value={item.rate}
                    onChange={(e) => updateEInvoiceItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Tax %</Label>
                  <Input
                    type="number"
                    value={item.tax_rate}
                    onChange={(e) => updateEInvoiceItem(item.id, 'tax_rate', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label>Amount</Label>
                    <div className="text-sm font-medium">{currencySymbol}{item.amount.toFixed(2)}</div>
                  </div>
                  {eInvoiceItems.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeEInvoiceItem(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span>Subtotal:</span>
              <span className="font-medium">{currencySymbol}{calculateEInvoiceTotals().subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span>Tax Amount:</span>
              <span className="font-medium">{currencySymbol}{calculateEInvoiceTotals().taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span>{currencySymbol}{calculateEInvoiceTotals().total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleEInvoiceSubmit} size="lg" className="w-full sm:w-auto">
          Generate E-Invoice
        </Button>
      </div>
    </TabsContent>
  );
};
