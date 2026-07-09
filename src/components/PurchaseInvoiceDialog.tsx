import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useInvoiceForm } from "@/hooks/useInvoiceForm";
import { InvoiceHeader } from "@/components/invoice/InvoiceHeader";
import { InvoiceItemsTable } from "@/components/invoice/InvoiceItemsTable";
import { InvoiceTotals } from "@/components/invoice/InvoiceTotals";
import { InvoiceDialogs } from "@/components/invoice/InvoiceDialogs";
import { SuccessModal } from '@/components/SuccessModal';
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

interface PurchaseInvoiceDialogProps {
  invoiceId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PurchaseInvoiceDialog({ invoiceId, isOpen, onOpenChange, onSuccess }: PurchaseInvoiceDialogProps) {
  const navigate = useNavigate();
  const {
    loading, invoiceLoading, saving, clients, products, vendors,
    formData, setFormData, items, setItems, isPurchase, setIsPurchase,
    isEditing, clientSearchOpen, setClientSearchOpen, newClientDialogOpen,
    setNewClientDialogOpen, newVendorDialogOpen, setNewVendorDialogOpen,
    creatingVendor, newVendorFormData, setNewVendorFormData,
    productSelectionOpen, setProductSelectionOpen,
    newProductDialogOpen, setNewProductDialogOpen, isScannerOpen, setIsScannerOpen,
    expenseSelectionOpen, setExpenseSelectionOpen, showSuccess, setShowSuccess,
    successInfo, newClientFormData, setNewClientFormData, creatingClient,
    newProductFormData, setNewProductFormData, creatingProduct, productSearchQuery,
    setProductSearchQuery, productCategory, setProductCategory, selectedQuantities,
    setSelectedQuantities, activeItemIndex, setActiveItemIndex, currencySymbol,
    invoiceStatus, invoiceCurrency, invoiceNumber, hideCompanyDetails,
    setHideCompanyDetails, getTotals, handleSubmit, handleCreateClient,
    handleCreateVendor, handleCreateProduct, addExpenseToInvoice, removeItem, updateItemAmount,
    handleProductSelect, updateModalQuantity, handleBulkAdd, handleScan,
    addItem, billableExpenses, fetchingExpenses, showHSNDialog, setShowHSNDialog,
    hsnSearchQuery, setHsnSearchQuery, hsnCodesData, showQRDialog, setShowQRDialog,
    qrQuantity, setQrQuantity, qrPrintStep, setQrPrintStep, qrFormat, setQrFormat,
    qrPrintType, setQrPrintType, showValidationErrors
  } = useInvoiceForm(invoiceId || undefined, () => {
    onSuccess?.();
    onOpenChange(false);
  });

  const totals = getTotals();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full sm:h-[90vh] sm:max-w-5xl p-0 overflow-hidden flex flex-col rounded-none sm:rounded-[2.5rem] border-none shadow-2xl">
        <DialogHeader className="p-4 sm:p-6 border-b text-left bg-slate-50/50 dark:bg-slate-900/50">
          <DialogTitle className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
            Edit Purchase Bill {invoiceNumber ? `#${invoiceNumber}` : ''}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-slate-500 font-medium">
            Update procurement details, vendor information, and bill items.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4 sm:p-8">
          {invoiceLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">Loading bill details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {showValidationErrors && isPurchase && !formData.vendor_id && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="font-bold">Attention Required</AlertTitle>
                  <AlertDescription>Please select a vendor to proceed with the purchase bill.</AlertDescription>
                </Alert>
              )}

              <InvoiceHeader
                isPurchase={true}
                setIsPurchase={() => {}} // Lock to purchase in this dialog
                formData={formData}
                setFormData={setFormData}
                clients={clients}
                vendors={vendors}
                clientSearchOpen={clientSearchOpen}
                setClientSearchOpen={setClientSearchOpen}
                setNewClientDialogOpen={setNewClientDialogOpen}
                setNewVendorDialogOpen={setNewVendorDialogOpen}
                isEditing={true}
                invoiceNumber={invoiceNumber}
                invoiceStatus={invoiceStatus}
                invoiceCurrency={invoiceCurrency}
                hideCompanyDetails={hideCompanyDetails}
                setHideCompanyDetails={setHideCompanyDetails}
              />

              <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-xl border border-dashed border-muted-foreground/30">
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Bill Status:</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.status === 'pending' ? 'hero' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, status: 'pending' })}
                    className="h-9 px-4 rounded-lg font-bold"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Pending
                  </Button>
                  <Button
                    type="button"
                    variant={formData.status === 'paid' ? 'hero' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, status: 'paid' })}
                    className="h-9 px-4 rounded-lg font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Paid
                  </Button>
                </div>
              </div>

              <Card className="p-4 md:p-6 border-none shadow-xl shadow-indigo-100/20 overflow-hidden ring-1 ring-slate-200/60">
                <InvoiceItemsTable
                  items={items}
                  setItems={setItems}
                  removeItem={removeItem}
                  updateItemAmount={updateItemAmount}
                  onProductSearchClick={(index) => {
                    setActiveItemIndex(index);
                    setProductSelectionOpen(true);
                  }}
                  currencySymbol={currencySymbol || '₹'}
                  addItem={addItem}
                  setProductSelectionOpen={setProductSelectionOpen}
                  setActiveItemIndex={setActiveItemIndex}
                  setIsScannerOpen={setIsScannerOpen}
                />
              </Card>

              <InvoiceTotals
                currencySymbol={currencySymbol || '₹'}
                subtotal={totals.subtotal}
                discountAmount={totals.discountAmount}
                taxAmount={totals.taxAmount}
                total={totals.total}
                formData={formData}
                setFormData={setFormData}
                saving={saving}
                clients={clients}
                isEditing={true}
                submitLabel="Update Bill"
                onAddExpense={() => setExpenseSelectionOpen(true)}
                navigate={navigate}
              />
            </form>
          )}
        </ScrollArea>

        <InvoiceDialogs
          clientSearchOpen={clientSearchOpen}
          setClientSearchOpen={setClientSearchOpen}
          newClientDialogOpen={newClientDialogOpen}
          setNewClientDialogOpen={setNewClientDialogOpen}
          newVendorDialogOpen={newVendorDialogOpen}
          setNewVendorDialogOpen={setNewVendorDialogOpen}
          productSelectionOpen={productSelectionOpen}
          setProductSelectionOpen={setProductSelectionOpen}
          newProductDialogOpen={newProductDialogOpen}
          setNewProductDialogOpen={setNewProductDialogOpen}
          isScannerOpen={isScannerOpen}
          setIsScannerOpen={setIsScannerOpen}
          expenseSelectionOpen={expenseSelectionOpen}
          setExpenseSelectionOpen={setExpenseSelectionOpen}
          showHSNDialog={showHSNDialog}
          setShowHSNDialog={setShowHSNDialog}
          showQRDialog={showQRDialog}
          setShowQRDialog={setShowQRDialog}
          currencySymbol={currencySymbol}
          clients={clients}
          vendors={vendors}
          products={products}
          billableExpenses={billableExpenses}
          fetchingExpenses={fetchingExpenses}
          newClientFormData={newClientFormData}
          setNewClientFormData={setNewClientFormData}
          creatingClient={creatingClient}
          newVendorFormData={newVendorFormData}
          setNewVendorFormData={setNewVendorFormData}
          handleCreateVendor={handleCreateVendor}
          creatingVendor={creatingVendor}
          newProductFormData={newProductFormData}
          setNewProductFormData={setNewProductFormData}
          creatingProduct={creatingProduct}
          productSearchQuery={productSearchQuery}
          setProductSearchQuery={setProductSearchQuery}
          productCategory={productCategory}
          setProductCategory={setProductCategory}
          selectedQuantities={selectedQuantities}
          setSelectedQuantities={setSelectedQuantities}
          updateModalQuantity={updateModalQuantity}
          handleBulkAdd={handleBulkAdd}
          handleProductSelect={handleProductSelect}
          handleCreateClient={handleCreateClient}
          handleCreateProduct={handleCreateProduct}
          addExpenseToInvoice={addExpenseToInvoice}
          handleScan={handleScan}
          hsnSearchQuery={hsnSearchQuery}
          setHsnSearchQuery={setHsnSearchQuery}
          hsnCodesData={hsnCodesData}
          qrQuantity={qrQuantity}
          setQrQuantity={setQrQuantity}
          qrPrintStep={qrPrintStep}
          setQrPrintStep={setQrPrintStep}
          qrFormat={qrFormat}
          setQrFormat={setQrFormat}
          qrPrintType={qrPrintType}
          setQrPrintType={setQrPrintType}
          showSuccess={showSuccess}
          setShowSuccess={setShowSuccess}
          successInfo={successInfo}
          activeItemIndex={activeItemIndex}
          navigate={navigate}
        />

        <SuccessModal
          isOpen={showSuccess}
          onOpenChange={(open) => {
            setShowSuccess(open);
            if (!open) {
              onSuccess?.();
              onOpenChange(false);
            }
          }}
          title={successInfo.title}
          message={successInfo.message}
        />
      </DialogContent>
    </Dialog>
  );
}
