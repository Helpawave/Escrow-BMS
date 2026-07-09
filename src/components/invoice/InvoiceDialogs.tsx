import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Plus, UserPlus, Package, Search, Scan, Minus, Truck, Tag } from "lucide-react";
import { format } from "date-fns";
import QRCode from "react-qr-code";
import { cn } from "@/lib/utils";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { SuccessModal } from "@/components/SuccessModal";
import { Client, Vendor, Product, Expense } from '@/types/invoice';
import { HSNCode } from '@/types/hsn';
import { InvoiceFormData } from './InvoiceHeader';

interface InvoiceDialogsProps {
  // Expense Dialog
  expenseSelectionOpen: boolean;
  setExpenseSelectionOpen: (open: boolean) => void;
  fetchingExpenses: boolean;
  billableExpenses: Expense[];
  addExpenseToInvoice: (expense: Expense) => void;
  currencySymbol: string;

  // Client Dialog
  newClientDialogOpen: boolean;
  setNewClientDialogOpen: (open: boolean) => void;
  newClientFormData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    gstin: string;
    hide_contact_details: boolean;
  };
  setNewClientFormData: React.Dispatch<React.SetStateAction<InvoiceDialogsProps['newClientFormData']>>;
  handleCreateClient: (e: React.FormEvent) => void;
  creatingClient: boolean;
  clientSearchOpen: boolean;
  setClientSearchOpen: (open: boolean) => void;

  // Vendor Dialog
  newVendorDialogOpen: boolean;
  setNewVendorDialogOpen: (open: boolean) => void;
  newVendorFormData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    gstin: string;
  };
  setNewVendorFormData: React.Dispatch<React.SetStateAction<InvoiceDialogsProps['newVendorFormData']>>;
  handleCreateVendor: (e: React.FormEvent) => void;
  creatingVendor: boolean;

  // Product Selection Dialog
  productSelectionOpen: boolean;
  setProductSelectionOpen: (open: boolean) => void;
  productSearchQuery: string;
  setProductSearchQuery: (query: string) => void;
  productCategory: string;
  setProductCategory: (category: string) => void;
  products: Product[];
  handleProductSelect: (product: Product) => void;
  selectedQuantities: Record<string, number>;
  setSelectedQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  updateModalQuantity: (productId: string, delta: number) => void;
  handleBulkAdd: () => void;
  activeItemIndex: number | null;

  // New Product Dialog
  newProductDialogOpen: boolean;
  setNewProductDialogOpen: (open: boolean) => void;
  newProductFormData: {
    name: string;
    category: string;
    unit: string;
    sku: string;
    hsn_code: string;
    opening_stock: string;
    sales_price: string;
    purchase_price: string;
    tax_rate: string;
    price_with_tax: boolean;
    vendor_id: string;
    type?: string;
    description?: string;
    discount?: string;
    barcode?: string;
  };
  setNewProductFormData: React.Dispatch<React.SetStateAction<InvoiceDialogsProps['newProductFormData']>>;
  handleCreateProduct: (e: React.FormEvent) => void;
  creatingProduct: boolean;
  vendors: Vendor[];

  // QR/Barcode Dialog
  showQRDialog: boolean;
  setShowQRDialog: (show: boolean) => void;
  qrPrintStep: 'select' | 'preview';
  setQrPrintStep: (step: 'select' | 'preview') => void;
  qrQuantity: number;
  setQrQuantity: (qty: number) => void;
  qrFormat: 'label' | 'a4';
  setQrFormat: (format: 'label' | 'a4') => void;
  qrPrintType: 'barcode' | 'both' | 'qr';
  setQrPrintType: (type: 'barcode' | 'both' | 'qr') => void;

  // HSN Dialog
  showHSNDialog: boolean;
  setShowHSNDialog: (show: boolean) => void;
  hsnSearchQuery: string;
  setHsnSearchQuery: (query: string) => void;
  hsnCodesData: HSNCode[];

  // Scanner
  isScannerOpen: boolean;
  setIsScannerOpen: (open: boolean) => void;
  handleScan: (data: string) => void;

  // Success Modal
  showSuccess: boolean;
  setShowSuccess: (show: boolean) => void;
  successInfo: { title: string; message: string };
  navigate: (path: string) => void;
  clients: Client[];
}

export const InvoiceDialogs: React.FC<InvoiceDialogsProps> = ({
  expenseSelectionOpen,
  setExpenseSelectionOpen,
  fetchingExpenses,
  billableExpenses,
  addExpenseToInvoice,
  currencySymbol,
  newClientDialogOpen,
  setNewClientDialogOpen,
  newClientFormData,
  setNewClientFormData,
  handleCreateClient,
  creatingClient,
  clientSearchOpen,
  setClientSearchOpen,
  newVendorDialogOpen,
  setNewVendorDialogOpen,
  newVendorFormData,
  setNewVendorFormData,
  handleCreateVendor,
  creatingVendor,
  productSelectionOpen,
  setProductSelectionOpen,
  productSearchQuery,
  setProductSearchQuery,
  productCategory,
  setProductCategory,
  products,
  handleProductSelect,
  selectedQuantities,
  setSelectedQuantities,
  updateModalQuantity,
  handleBulkAdd,
  activeItemIndex,
  newProductDialogOpen,
  setNewProductDialogOpen,
  newProductFormData,
  setNewProductFormData,
  handleCreateProduct,
  creatingProduct,
  vendors,
  showQRDialog,
  setShowQRDialog,
  qrPrintType,
  setQrPrintType,
  qrPrintStep,
  setQrPrintStep,
  qrQuantity,
  setQrQuantity,
  qrFormat,
  setQrFormat,
  showHSNDialog,
  setShowHSNDialog,
  hsnSearchQuery,
  setHsnSearchQuery,
  hsnCodesData,
  isScannerOpen,
  setIsScannerOpen,
  handleScan,
  showSuccess,
  setShowSuccess,
  successInfo,
  navigate,
  clients
}) => {
  return (
    <>
      {/* Billable Expenses Selection Modal */}
      <Dialog open={expenseSelectionOpen} onOpenChange={setExpenseSelectionOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <DialogHeader className="p-4 md:p-6 pb-2 bg-amber-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Billable Expenses</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">Select an expense to add to this invoice</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 md:p-6 max-h-[400px] overflow-y-auto">
            {fetchingExpenses ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
                <p className="text-sm font-medium">Fetching expenses...</p>
              </div>
            ) : billableExpenses.length > 0 ? (
              <div className="grid gap-3">
                {billableExpenses.map((expense) => (
                  <button
                    key={expense.id}
                    onClick={() => addExpenseToInvoice(expense)}
                    className="flex items-center justify-between p-4 rounded-xl border-2 border-transparent bg-muted/30 hover:bg-primary/5 hover:border-primary/20 transition-all text-left group"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-sm group-hover:text-primary transition-colors">{expense.title}</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <span className="bg-background px-1.5 py-0.5 rounded-md border">{expense.category}</span>
                        <span>•</span>
                        <span>{format(new Date(expense.expense_date), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary">{currencySymbol} {Number(expense.amount).toFixed(2)}</p>
                      <Plus className="w-4 h-4 ml-auto mt-1 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border-2 border-dashed rounded-2xl bg-muted/20">
                <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <h3 className="font-bold text-sm">No billable expenses</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                  There are no expenses marked as billable for this client.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="p-4 bg-muted/10 border-t">
            <Button variant="ghost" onClick={() => setExpenseSelectionOpen(false)} className="rounded-xl font-bold h-11">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simplified Quick Add Client Modal */}
      <Dialog open={newClientDialogOpen} onOpenChange={setNewClientDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background max-h-[90vh] flex flex-col">
          <DialogHeader className="p-4 md:p-8 pb-4 shrink-0">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">Add New Client</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">Create a new client profile for your invoices.</DialogDescription>
          </DialogHeader>

          <div className="p-4 md:p-8 pt-2 flex-1 overflow-y-auto custom-scrollbar">
            <form id="new-client-form" onSubmit={handleCreateClient} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name" className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Client Name *</Label>
                  <Input
                    id="client-name"
                    value={newClientFormData.name}
                    onChange={(e) => setNewClientFormData({ ...newClientFormData, name: e.target.value })}
                    placeholder="e.g. Acme Corp"
                    className="h-12 rounded-xl border-2 border-primary/20 focus-visible:ring-primary/20 font-bold bg-primary/5"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-phone" className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Phone *</Label>
                  <Input
                    id="client-phone"
                    value={newClientFormData.phone}
                    onChange={(e) => setNewClientFormData({ ...newClientFormData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="10 digit number"
                    className="h-12 rounded-xl border-2 border-primary/20 focus-visible:ring-primary/20 font-bold bg-primary/5"
                    required
                  />
                </div>
              </div>

              <Collapsible className="space-y-4">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full flex items-center justify-between p-4 h-auto rounded-xl bg-muted/20 hover:bg-muted/30 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shadow-sm">
                        <Plus className="w-4 h-4 text-muted-foreground group-data-[state=open]:rotate-45 transition-transform" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Additional Details (Email, Address, GSTIN)</span>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-5 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="client-email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
                    <Input
                      id="client-email"
                      type="email"
                      value={newClientFormData.email}
                      onChange={(e) => setNewClientFormData({ ...newClientFormData, email: e.target.value })}
                      placeholder="client@example.com"
                      className="h-12 rounded-xl border-2 focus-visible:ring-primary/20 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client-address" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Address</Label>
                    <Textarea
                      id="client-address"
                      value={newClientFormData.address}
                      onChange={(e) => setNewClientFormData({ ...newClientFormData, address: e.target.value })}
                      placeholder="Full billing address"
                      className="min-h-[100px] rounded-xl border-2 focus-visible:ring-primary/20 font-medium bg-muted/30"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="client-gstin" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">GSTIN (Optional)</Label>
                      <Input
                        id="client-gstin"
                        value={newClientFormData.gstin}
                        onChange={(e) => setNewClientFormData({ ...newClientFormData, gstin: e.target.value.toUpperCase() })}
                        placeholder="15-digit GSTIN"
                        className="h-12 rounded-xl border-2 focus-visible:ring-primary/20 font-bold tracking-widest"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border-2 mt-6">
                      <div className="space-y-0.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Privacy Mode</Label>
                        <p className="text-[10px] text-muted-foreground font-bold italic">Hide on PDF</p>
                      </div>
                      <Checkbox
                        checked={newClientFormData.hide_contact_details}
                        onCheckedChange={(checked) => setNewClientFormData({ ...newClientFormData, hide_contact_details: !!checked })}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </form>
          </div>

          <DialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5 border-t">
            <Button variant="outline" type="button" onClick={() => setNewClientDialogOpen(false)} className="flex-1 h-12 font-bold rounded-xl border-2 m-0">
              Cancel
            </Button>
            <Button
              type="submit"
              form="new-client-form"
              className="flex-1 h-12 font-black rounded-xl shadow-lg shadow-primary/20"
              disabled={creatingClient}
            >
              {creatingClient ? "Saving..." : "Save Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Vendor Modal */}
      <Dialog open={newVendorDialogOpen} onOpenChange={setNewVendorDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background max-h-[90vh] flex flex-col">
          <DialogHeader className="p-4 md:p-8 pb-4 shrink-0">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">Add New Vendor</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">Register a new vendor for procurement records.</DialogDescription>
          </DialogHeader>

          <div className="p-4 md:p-8 pt-2 flex-1 overflow-y-auto custom-scrollbar">
            <form id="new-vendor-form" onSubmit={handleCreateVendor} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor-name" className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Vendor Name *</Label>
                  <Input
                    id="vendor-name"
                    value={newVendorFormData.name}
                    onChange={(e) => setNewVendorFormData({ ...newVendorFormData, name: e.target.value })}
                    placeholder="e.g. Wholesale Supplies"
                    className="h-12 rounded-xl border-2 border-primary/20 focus-visible:ring-primary/20 font-bold bg-primary/5"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-phone" className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Phone *</Label>
                  <Input
                    id="vendor-phone"
                    value={newVendorFormData.phone}
                    onChange={(e) => setNewVendorFormData({ ...newVendorFormData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="10 digit number"
                    className="h-12 rounded-xl border-2 border-primary/20 focus-visible:ring-primary/20 font-bold bg-primary/5"
                    required
                  />
                </div>
              </div>

              <Collapsible className="space-y-4">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full flex items-center justify-between p-4 h-auto rounded-xl bg-muted/20 hover:bg-muted/30 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shadow-sm">
                        <Plus className="w-4 h-4 text-muted-foreground group-data-[state=open]:rotate-45 transition-transform" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Additional Details (Email, Address, GSTIN)</span>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-5 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="vendor-email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
                    <Input
                      id="vendor-email"
                      type="email"
                      value={newVendorFormData.email}
                      onChange={(e) => setNewVendorFormData({ ...newVendorFormData, email: e.target.value })}
                      placeholder="vendor@example.com"
                      className="h-12 rounded-xl border-2 focus-visible:ring-primary/20 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendor-address" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Address</Label>
                    <Textarea
                      id="vendor-address"
                      value={newVendorFormData.address}
                      onChange={(e) => setNewVendorFormData({ ...newVendorFormData, address: e.target.value })}
                      placeholder="Full business address"
                      className="min-h-[100px] rounded-xl border-2 focus-visible:ring-primary/20 font-medium bg-muted/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendor-gstin" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">GSTIN (Optional)</Label>
                    <Input
                      id="vendor-gstin"
                      value={newVendorFormData.gstin}
                      onChange={(e) => setNewVendorFormData({ ...newVendorFormData, gstin: e.target.value.toUpperCase() })}
                      placeholder="15-digit GSTIN"
                      className="h-12 rounded-xl border-2 focus-visible:ring-primary/20 font-bold tracking-widest"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </form>
          </div>

          <DialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5 border-t">
            <Button variant="outline" type="button" onClick={() => setNewVendorDialogOpen(false)} className="flex-1 h-12 font-bold rounded-xl border-2 m-0">
              Cancel
            </Button>
            <Button
              type="submit"
              form="new-vendor-form"
              className="flex-1 h-12 font-black rounded-xl shadow-lg shadow-primary/20"
              disabled={creatingVendor}
            >
              {creatingVendor ? "Saving..." : "Save Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Selection Dialog */}
      <Dialog open={productSelectionOpen} onOpenChange={setProductSelectionOpen}>
        <DialogContent className="sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[1200px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background">
          <DialogHeader className="p-4 md:p-8 pb-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight">Select Products</DialogTitle>
                <DialogDescription className="text-muted-foreground font-medium">Add one or more items to your bill</DialogDescription>
              </div>
              <Button
                variant="hero"
                onClick={() => {
                  setProductSelectionOpen(false);
                  setNewProductDialogOpen(true);
                }}
                className="h-12 px-8 font-black rounded-xl shadow-lg shadow-primary/20"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Product
              </Button>
            </div>
          </DialogHeader>

          <div className="p-4 border-b flex flex-col md:flex-row items-center gap-4 bg-muted/20 z-20">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items, HSN, or categories..."
                className="pl-9 h-10 text-sm rounded-md bg-background focus-visible:ring-primary/20"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const q = productSearchQuery.toLowerCase();
                    const filtered = products.filter(p => {
                      const matchesSearch = p.name.toLowerCase().includes(q) ||
                        p.category?.toLowerCase().includes(q) ||
                        p.sku?.toLowerCase().includes(q) ||
                        p.hsn_code?.toLowerCase().includes(q);
                      const matchesCategory = productCategory === "all" || p.category === productCategory;
                      return matchesSearch && matchesCategory;
                    });

                    if (filtered.length > 0) {
                      handleProductSelect(filtered[0]);
                    }
                  }
                }}
              />
            </div>
            <div className="w-full md:w-56 shrink-0">
              <Select value={productCategory} onValueChange={setProductCategory}>
                <SelectTrigger className="h-10 rounded-md bg-background font-medium">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="it">IT Services</SelectItem>
                  <SelectItem value="hardware">Hardware</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Mobile Cards */}
            <div className="md:hidden space-y-4 p-4">
              {products
                .filter(p => {
                  const q = productSearchQuery.toLowerCase();
                  const matchesSearch = p.name.toLowerCase().includes(q) ||
                    p.category?.toLowerCase().includes(q) ||
                    p.sku?.toLowerCase().includes(q) ||
                    p.hsn_code?.toLowerCase().includes(q);
                  const matchesCategory = productCategory === "all" || p.category === productCategory;
                  return matchesSearch && matchesCategory;
                })
                .map((product) => (
                  <div
                    key={product.id}
                    className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-5"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1.5">
                        <h4 className="text-lg font-black text-foreground tracking-tight leading-tight">{product.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">
                          <span>{product.sku || 'No SKU'}</span>
                          {product.hsn_code && <span>• HSN: {product.hsn_code}</span>}
                        </div>
                        <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                          {currencySymbol}{product.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40 mb-0.5">Stock</p>
                        <p className="font-black text-xs text-foreground bg-muted/30 px-2 py-1 rounded-lg">
                          {product.opening_stock || '0'} <span className="text-[10px] opacity-60 ml-0.5">{product.unit?.toUpperCase() || 'PCS'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/10">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Select Quantity</p>
                      <div className="flex items-center border border-border/50 rounded-2xl h-11 bg-background overflow-hidden">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 rounded-none hover:bg-muted/50 border-r"
                          onClick={() => updateModalQuantity(product.id, -1)}
                          disabled={(selectedQuantities[product.id] || 0) === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <input
                          type="number"
                          className="w-14 text-center font-black text-sm focus:outline-none bg-transparent"
                          value={selectedQuantities[product.id] || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setSelectedQuantities(prev => ({ ...prev, [product.id]: Math.max(0, val) }));
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 rounded-none hover:bg-muted/50 border-l"
                          onClick={() => updateModalQuantity(product.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10 border-b">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 px-4">Item Name</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 px-4">SKU / HSN</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 px-4 text-center">Stock</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 px-4">Sale Price</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 px-4">Purchase</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 px-4 text-center">Selection</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products
                    .filter(p => {
                      const q = productSearchQuery.toLowerCase();
                      const matchesSearch = p.name.toLowerCase().includes(q) ||
                        p.category?.toLowerCase().includes(q) ||
                        p.sku?.toLowerCase().includes(q) ||
                        p.hsn_code?.toLowerCase().includes(q);
                      const matchesCategory = productCategory === "all" || p.category === productCategory;
                      return matchesSearch && matchesCategory;
                    })
                    .map((product) => (
                      <TableRow
                        key={product.id}
                        className="hover:bg-muted/10 transition-colors h-16 border-b cursor-pointer"
                        onClick={(e) => {
                          if (!(e.target as HTMLElement).closest('.product-selection-controls')) {
                            handleProductSelect(product);
                          }
                        }}
                      >
                        <TableCell className="font-semibold px-4">{product.name}</TableCell>
                        <TableCell className="px-4">
                          <div className="flex flex-col">
                            <span className="text-sm">{product.sku || '-'}</span>
                            {product.hsn_code && <span className="text-[10px] text-muted-foreground font-bold uppercase">HSN: {product.hsn_code}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 text-center">
                          <span className={cn(
                            "px-2 py-1 rounded text-[10px] font-bold uppercase",
                            (parseInt(String(product.opening_stock ?? '0'), 10) > 10)
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          )}>
                            {product.opening_stock || '0'} {product.unit?.toUpperCase() || 'PCS'}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-primary px-4">{currencySymbol}{product.price.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground px-4 text-sm">{currencySymbol}{(product.purchase_price || 0).toLocaleString()}</TableCell>
                        <TableCell className="px-4">
                          <div className="flex items-center justify-center product-selection-controls">
                            <div className="flex items-center border rounded-md h-9 bg-background shadow-sm overflow-hidden">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none border-r"
                                onClick={() => updateModalQuantity(product.id, -1)}
                                disabled={(selectedQuantities[product.id] || 0) === 0}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <input
                                type="number"
                                className="w-10 text-center font-bold text-sm focus:outline-none bg-transparent"
                                value={selectedQuantities[product.id] || 0}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setSelectedQuantities(prev => ({ ...prev, [product.id]: Math.max(0, val) }));
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none border-l"
                                onClick={() => updateModalQuantity(product.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-muted/10 flex flex-row items-center justify-between gap-4 w-full sticky bottom-0 z-30">
            <div className="hidden md:flex items-center gap-4 text-[10px] text-muted-foreground uppercase font-bold">
              <span>Enter ↵ : Search</span>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
              <div className="text-sm font-bold text-primary">
                {Object.values(selectedQuantities).filter(q => q > 0).length} Selected
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setProductSelectionOpen(false)} className="h-10 px-6 rounded-md font-bold">
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkAdd}
                  className="h-10 px-8 rounded-md font-bold"
                  disabled={Object.values(selectedQuantities).filter(q => q > 0).length === 0 && activeItemIndex === null}
                >
                  Add Items
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Product Dialog */}
      <Dialog open={newProductDialogOpen} onOpenChange={setNewProductDialogOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background max-h-[94vh] flex flex-col">
          <DialogHeader className="p-4 md:p-8 pb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">Create New Item</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background custom-scrollbar focus:outline-none">
              <form id="product-form" onSubmit={handleCreateProduct} className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Package className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Basic Information</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-bold">Item Name*</Label>
                      <Input
                        placeholder="e.g. Premium Consulting Services"
                        value={newProductFormData.name}
                        onChange={(e) => setNewProductFormData({ ...newProductFormData, name: e.target.value })}
                        required
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Category</Label>
                      <Select
                        value={newProductFormData.category}
                        onValueChange={(val) => setNewProductFormData({ ...newProductFormData, category: val })}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="it">IT & Software</SelectItem>
                          <SelectItem value="consulting">Consulting</SelectItem>
                          <SelectItem value="others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Unit</Label>
                      <Select
                        value={newProductFormData.unit}
                        onValueChange={(val) => setNewProductFormData({ ...newProductFormData, unit: val })}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="PCS" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pcs">Pieces (PCS)</SelectItem>
                          <SelectItem value="box">Box (BOX)</SelectItem>
                          <SelectItem value="kg">Kilogram (KG)</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Truck className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Inventory Details</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold">SKU / Barcode</Label>
                      <div className="flex">
                        <Input
                          placeholder="ex: ITM12549"
                          className="flex-1 rounded-r-none border-r-0 h-10"
                          value={newProductFormData.sku}
                          onChange={(e) => setNewProductFormData({ ...newProductFormData, sku: e.target.value })}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            const randomId = Math.floor(100000000 + Math.random() * 900000000);
                            setNewProductFormData({ ...newProductFormData, sku: randomId.toString() });
                          }}
                          className="rounded-l-none font-bold text-[10px] h-10 px-3 uppercase tracking-wider"
                        >
                          Generate
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold opacity-0 invisible">QR</Label>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!newProductFormData.sku}
                        onClick={() => setShowQRDialog(true)}
                        className="w-full h-10 font-bold text-xs flex items-center gap-2"
                      >
                        <Scan className="w-4 h-4" />
                        Barcode
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold">HSN Code</Label>
                      <div className="relative">
                        <Input
                          placeholder="ex: 4010"
                          className="h-10 pr-20"
                          value={newProductFormData.hsn_code || ''}
                          onChange={(e) => setNewProductFormData({ ...newProductFormData, hsn_code: e.target.value })}
                        />
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 text-[10px] font-bold"
                          onClick={() => setShowHSNDialog(true)}
                        >
                          Find
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Opening Stock</Label>
                      <Input
                        placeholder="ex: 150"
                        type="number"
                        className="h-10"
                        value={newProductFormData.opening_stock}
                        onChange={(e) => setNewProductFormData({ ...newProductFormData, opening_stock: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Tag className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Pricing Details</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Sales Price</Label>
                      <div className="flex">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                          <Input
                            placeholder="0.00"
                            className="pl-8 rounded-r-none border-r-0 h-10"
                            type="number"
                            value={newProductFormData.sales_price}
                            onChange={(e) => setNewProductFormData({ ...newProductFormData, sales_price: e.target.value })}
                          />
                        </div>
                        <Select
                          value={newProductFormData.price_with_tax ? "with-tax" : "without-tax"}
                          onValueChange={(val) => setNewProductFormData({ ...newProductFormData, price_with_tax: val === "with-tax" })}
                        >
                          <SelectTrigger className="w-24 rounded-l-none h-10 text-[10px] font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="with-tax">Incl. Tax</SelectItem>
                            <SelectItem value="without-tax">Excl. Tax</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Tax Rate (%)</Label>
                      <Select
                        value={newProductFormData.tax_rate}
                        onValueChange={(val) => setNewProductFormData({ ...newProductFormData, tax_rate: val })}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="12">12%</SelectItem>
                          <SelectItem value="18">18%</SelectItem>
                          <SelectItem value="28">28%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Purchase Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                        <Input
                          placeholder="0.00"
                          className="pl-8 h-10"
                          type="number"
                          value={newProductFormData.purchase_price}
                          onChange={(e) => setNewProductFormData({ ...newProductFormData, purchase_price: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <Label className="text-sm font-bold">Default Vendor</Label>
                       <Select
                         value={newProductFormData.vendor_id}
                         onValueChange={(val) => setNewProductFormData({ ...newProductFormData, vendor_id: val })}
                       >
                         <SelectTrigger className="h-10">
                           <SelectValue placeholder="Select Vendor" />
                         </SelectTrigger>
                         <SelectContent>
                           {(vendors || []).map(vendor => (
                             <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                       <p className="text-[10px] text-muted-foreground font-medium italic">* Generating a purchase bill requires a vendor</p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <DialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5 border-t">
            <Button variant="outline" type="button" onClick={() => setNewProductDialogOpen(false)} className="flex-1 h-12 font-bold rounded-xl border-2 m-0">
              Cancel
            </Button>
            <Button
              type="submit"
              form="product-form"
              className="flex-1 h-12 font-black rounded-xl shadow-lg shadow-primary/20"
              disabled={creatingProduct}
            >
              {creatingProduct ? "Saving..." : "Save Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={(val) => {
        setShowQRDialog(val);
        if (!val) setQrPrintStep('select');
      }}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background max-h-[90vh] flex flex-col">
          <DialogHeader className="p-4 md:p-8 pb-4 shrink-0">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Scan className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">Print Label/Barcode</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">Generate and print QR codes or barcodes for your products.</DialogDescription>
          </DialogHeader>

          <div className="p-4 md:p-8 pt-2 flex-1 overflow-y-auto custom-scrollbar">
            {qrPrintStep === 'select' ? (
              <div className="my-6 space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Select Barcode Printer</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Specify the number of copies based on your stock.</p>
                </div>

                <div className="max-w-xs mx-auto space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Quantity to Print</Label>
                  <Input
                    type="number"
                    value={qrQuantity}
                    onChange={(e) => setQrQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-12 text-center text-lg font-bold border-2 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => { setQrFormat('label'); setQrPrintStep('preview'); }}
                    className="border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl p-4 md:p-6 cursor-pointer hover:bg-indigo-50 transition-all text-center flex flex-col items-center justify-center space-y-3 group"
                  >
                    <div className="w-16 h-10 border-2 border-slate-400 group-hover:border-indigo-400 border-dashed rounded flex bg-white dark:bg-slate-800 transition-colors"></div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 transition-colors">Label Print</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">For thermal label printers</span>
                  </div>

                  <div
                    onClick={() => { setQrFormat('a4'); setQrPrintStep('preview'); }}
                    className="border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl p-4 md:p-6 cursor-pointer hover:bg-indigo-50 transition-all text-center flex flex-col items-center justify-center space-y-3 group"
                  >
                    <div className="w-12 h-16 border-2 border-slate-400 group-hover:border-indigo-400 border-dashed rounded flex flex-wrap gap-1 p-1 bg-white dark:bg-slate-800 transition-colors">
                      <div className="w-[10px] h-2 bg-slate-300 rounded-sm"></div>
                      <div className="w-[10px] h-2 bg-slate-300 rounded-sm"></div>
                      <div className="w-[10px] h-2 bg-slate-300 rounded-sm"></div>
                      <div className="w-[10px] h-2 bg-slate-300 rounded-sm"></div>
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 transition-colors">A4 Print</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">For standard sheet printers</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="my-6">
                <div className="flex gap-4 mb-6">
                  <Button onClick={() => setQrPrintStep('select')} variant="outline">
                    Back
                  </Button>
                  <Button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1">
                    Print {qrQuantity} {qrFormat === 'label' ? 'Labels' : 'A4 Grid'}
                  </Button>
                </div>

                <div id="print-qr-area" className={cn(
                  "bg-white dark:bg-slate-800 p-4 rounded-xl border w-full",
                  qrFormat === 'a4' ? "grid grid-cols-2 sm:grid-cols-3 gap-4" : "flex flex-col items-center gap-4"
                )}>
                  {Array.from({ length: qrQuantity }).map((_, idx) => (
                    <div key={idx} className="flex flex-col items-center justify-center p-3 border rounded-xl space-y-2 w-full max-w-[180px]">
                      <div style={{ width: '100%', maxWidth: 120 }}>
                        <QRCode
                          value={`SKU:${newProductFormData.sku}|NAME:${newProductFormData.name}`}
                          size={120}
                          level="L"
                          style={{ width: '100%', height: 'auto' }}
                        />
                      </div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center uppercase tracking-wider break-all">
                        {newProductFormData.sku}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* HSN Code Lookup Dialog */}
      <Dialog open={showHSNDialog} onOpenChange={setShowHSNDialog}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background max-h-[90vh] flex flex-col">
          <DialogHeader className="p-4 md:p-8 pb-4 border-b shrink-0">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">Search HSN Code</DialogTitle>
            <p className="text-sm text-muted-foreground font-medium">Find code by number or product name</p>
          </DialogHeader>

          <div className="p-4 md:p-6 flex-1 flex flex-col space-y-4 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by HSN Code or Item Name..."
                className="pl-10 h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-sky-500 focus:border-sky-500 rounded-xl"
                value={hsnSearchQuery}
                onChange={(e) => setHsnSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
              {hsnCodesData
                .filter(item =>
                  item.code.toLowerCase().includes(hsnSearchQuery.toLowerCase()) ||
                  item.description.toLowerCase().includes(hsnSearchQuery.toLowerCase())
                )
                .slice(0, 50)
                .map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setNewProductFormData({ ...newProductFormData, hsn_code: item.code });
                      setShowHSNDialog(false);
                      setHsnSearchQuery("");
                    }}
                    className="p-4 border-b border-slate-50 hover:bg-sky-50 transition-colors cursor-pointer group rounded-lg mb-1"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sky-600 group-hover:text-sky-700">{item.code}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                ))}
            </div>
          </div>
          <DialogFooter className="p-4 border-t">
            <Button variant="outline" onClick={() => setShowHSNDialog(false)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isScannerOpen && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      <SuccessModal
        isOpen={showSuccess}
        onOpenChange={(open) => {
          setShowSuccess(open);
          if (!open && successInfo.title.includes('Invoice')) {
            navigate('/invoices');
          }
        }}
        title={successInfo.title}
        message={successInfo.message}
      />
    </>
  );
};
