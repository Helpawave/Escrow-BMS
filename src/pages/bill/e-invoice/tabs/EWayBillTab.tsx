import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { TabsContent } from "@/components/ui/tabs";
import { ChevronsUpDown, Check, Truck, Package, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Client, PartialInvoice, EWayBillItem, UNIT_OPTIONS, EWayBillFormData } from "../types";

export type { EWayBillFormData };

interface EWayBillTabProps {
  eWayBillData: EWayBillFormData;
  setEWayBillData: React.Dispatch<React.SetStateAction<EWayBillFormData>>;
  clients: Client[];
  invoices: PartialInvoice[];
  ewayBillSearchOpen: boolean;
  setEwayBillSearchOpen: (open: boolean) => void;
  handleInvoiceSelect: (invoiceId: string, targetTab: 'einvoice' | 'ewaybill') => void;
  eWayBillItems: EWayBillItem[];
  updateEWayBillItem: (id: string, field: keyof EWayBillItem, value: any) => void;
  removeEWayBillItem: (id: string) => void;
  openProductModal: (target: 'einvoice' | 'ewaybill') => void;
  currencySymbol: string;
  handleEWayBillSubmit: () => void;
}

export const EWayBillTab: React.FC<EWayBillTabProps> = ({
  eWayBillData,
  setEWayBillData,
  clients,
  invoices,
  ewayBillSearchOpen,
  setEwayBillSearchOpen,
  handleInvoiceSelect,
  eWayBillItems,
  updateEWayBillItem,
  removeEWayBillItem,
  openProductModal,
  currencySymbol,
  handleEWayBillSubmit,
}) => {
  return (
    <TabsContent value="ewaybill" className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">E-Way Bill Details</CardTitle>
          <p className="text-sm text-muted-foreground">Provide information to generate an E-Way Bill</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="client_eway">Client *</Label>
              <Select value={eWayBillData.client_id} onValueChange={(value) => setEWayBillData({ ...eWayBillData, client_id: value })}>
                <SelectTrigger id="client_eway" aria-label="Select client for e-way bill">
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
              <Label htmlFor="document_type">Document Type *</Label>
              <Select value={eWayBillData.document_type} onValueChange={(value) => setEWayBillData({ ...eWayBillData, document_type: value })}>
                <SelectTrigger id="document_type" aria-label="Select document type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tax Invoice">Tax Invoice</SelectItem>
                  <SelectItem value="Bill of Supply">Bill of Supply</SelectItem>
                  <SelectItem value="Delivery Challan">Delivery Challan</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="document_number">Document Number *</Label>
              <Popover open={ewayBillSearchOpen} onOpenChange={setEwayBillSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={ewayBillSearchOpen}
                    className="w-full justify-between"
                  >
                    {eWayBillData.document_number ? eWayBillData.document_number : "Select Invoice..."}
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
                            onSelect={() => handleInvoiceSelect(inv.id, 'ewaybill')}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                eWayBillData.document_number === inv.invoice_number ? "opacity-100" : "opacity-0"
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
              <Label htmlFor="document_date">Document Date *</Label>
              <Input
                id="document_date"
                type="date"
                value={eWayBillData.document_date}
                onChange={(e) => setEWayBillData({ ...eWayBillData, document_date: e.target.value })}
                aria-label="Select document date"
              />
            </div>

            <div>
              <Label htmlFor="transaction_type">Transaction Type *</Label>
              <Select value={eWayBillData.transaction_type} onValueChange={(value) => setEWayBillData({ ...eWayBillData, transaction_type: value })}>
                <SelectTrigger id="transaction_type" aria-label="Select transaction type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Bill To-Ship To">Bill To-Ship To</SelectItem>
                  <SelectItem value="Bill From-Dispatch From">Bill From-Dispatch From</SelectItem>
                  <SelectItem value="Combination of 2 and 3">Combination of 2 and 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="vehicle_number">Vehicle Number</Label>
              <Input
                id="vehicle_number"
                value={eWayBillData.vehicle_number}
                onChange={(e) => setEWayBillData({ ...eWayBillData, vehicle_number: e.target.value })}
                placeholder="MH01AB1234"
                aria-label="Enter vehicle number"
              />
            </div>

            <div className="col-span-full pt-4 border-t border-dashed mt-2">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                E-Way Bill System Details (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eway_bill_no">E-Way Bill Number</Label>
                  <Input
                    id="eway_bill_no"
                    value={eWayBillData.eway_bill_no}
                    onChange={(e) => setEWayBillData({ ...eWayBillData, eway_bill_no: e.target.value })}
                    placeholder="12-digit number..."
                  />
                </div>
                <div>
                  <Label htmlFor="valid_until">Valid Until (Expiry)</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={eWayBillData.valid_until}
                    onChange={(e) => setEWayBillData({ ...eWayBillData, valid_until: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="transport_mode">Transport Mode *</Label>
              <Select value={eWayBillData.transport_mode} onValueChange={(value) => setEWayBillData({ ...eWayBillData, transport_mode: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Road">Road</SelectItem>
                  <SelectItem value="Rail">Rail</SelectItem>
                  <SelectItem value="Air">Air</SelectItem>
                  <SelectItem value="Ship">Ship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="distance">Distance (KM)</Label>
              <Input
                id="distance"
                type="number"
                value={eWayBillData.distance}
                onChange={(e) => setEWayBillData({ ...eWayBillData, distance: e.target.value })}
                placeholder="100"
              />
            </div>

            <div>
              <Label htmlFor="transporter_name">Transporter Name</Label>
              <Input
                id="transporter_name"
                value={eWayBillData.transporter_name}
                onChange={(e) => setEWayBillData({ ...eWayBillData, transporter_name: e.target.value })}
                placeholder="Transporter company name"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* E-Way Bill Items */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Goods Details</CardTitle>
          <Button onClick={() => openProductModal('ewaybill')} size="sm" variant="outline">
            <Package className="h-4 w-4 mr-2" />
            Add Items
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {eWayBillItems.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end p-4 border rounded-lg">
                <div className="md:col-span-2">
                  <Label>Product Name *</Label>
                  <Input
                    value={item.product_name}
                    onChange={(e) => updateEWayBillItem(item.id, 'product_name', e.target.value)}
                    placeholder="Product name"
                  />
                </div>
                <div>
                  <Label>HSN Code *</Label>
                  <Input
                    value={item.hsn_code}
                    onChange={(e) => updateEWayBillItem(item.id, 'hsn_code', e.target.value)}
                    placeholder="HSN"
                  />
                </div>
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateEWayBillItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={item.unit} onValueChange={(value) => updateEWayBillItem(item.id, 'unit', value)}>
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
                  <Label>Value *</Label>
                  <Input
                    type="number"
                    value={item.value}
                    onChange={(e) => updateEWayBillItem(item.id, 'value', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="flex items-center">
                  {eWayBillItems.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeEWayBillItem(item.id)}
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
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Value:</span>
              <span>{currencySymbol}{eWayBillItems.reduce((sum, item) => sum + item.value, 0).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleEWayBillSubmit} size="lg">
          Generate E-Way Bill
        </Button>
      </div>
    </TabsContent>
  );
};
