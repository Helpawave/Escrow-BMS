import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useInvoiceForm } from "@/hooks/useInvoiceForm";
import { InvoiceHeader } from "@/components/invoice/InvoiceHeader";
import { InvoiceItemsTable } from "@/components/invoice/InvoiceItemsTable";
import { InvoiceTotals } from "@/components/invoice/InvoiceTotals";
import { InvoiceDialogs } from "@/components/invoice/InvoiceDialogs";
import { SuccessModal } from '@/components/SuccessModal';

const CreateInvoicePage = () => {
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
  } = useInvoiceForm();

  if (loading || invoiceLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const totals = getTotals();

  return (
    <div className="container mx-auto py-4 md:py-8 px-4 max-w-7xl animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(isPurchase ? '/purchase-invoices' : '/invoices')}
            className="rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              {isEditing ? (
                <>Edit {isPurchase ? 'Bill' : 'Invoice'}</>
              ) : (
                <>Create New {isPurchase ? 'Bill' : 'Invoice'}</>
              )}
            </h1>
            <p className="text-slate-500 mt-1">
              {isEditing 
                ? `Managing ${isPurchase ? 'purchase record' : 'invoice'} #${invoiceNumber}` 
                : `Generate a professional ${isPurchase ? 'purchase bill' : 'invoice'} for your business`
              }
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        {showValidationErrors && !isPurchase && !formData.client_id && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 animate-in slide-in-from-top duration-300">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-bold">Attention Required</AlertTitle>
            <AlertDescription>Please select a client to proceed with the invoice.</AlertDescription>
          </Alert>
        )}

        {showValidationErrors && isPurchase && !formData.vendor_id && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 animate-in slide-in-from-top duration-300">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-bold">Attention Required</AlertTitle>
            <AlertDescription>Please select a vendor to proceed with the purchase bill.</AlertDescription>
          </Alert>
        )}

        <InvoiceHeader
          isPurchase={isPurchase}
          setIsPurchase={setIsPurchase}
          formData={formData}
          setFormData={setFormData}
          clients={clients}
          vendors={vendors}
          clientSearchOpen={clientSearchOpen}
          setClientSearchOpen={setClientSearchOpen}
          setNewClientDialogOpen={setNewClientDialogOpen}
          setNewVendorDialogOpen={setNewVendorDialogOpen}
          isEditing={isEditing}
          invoiceNumber={invoiceNumber}
          invoiceStatus={invoiceStatus}
          invoiceCurrency={invoiceCurrency}
          hideCompanyDetails={hideCompanyDetails}
          setHideCompanyDetails={setHideCompanyDetails}
        />

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
          isEditing={isEditing}
          submitLabel={isEditing ? 'Update Invoice' : 'Create Invoice'}
          navigate={navigate}
          onAddExpense={() => setExpenseSelectionOpen(true)}
        />
      </form>

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
        navigate={navigate}
        activeItemIndex={activeItemIndex}
      />

      <SuccessModal
        isOpen={showSuccess}
        onOpenChange={(open) => {
          setShowSuccess(open);
          if (!open && !isEditing) navigate(isPurchase ? '/purchase-invoices' : '/invoices');
        }}
        title={successInfo.title}
        message={successInfo.message}
      />
    </div>
  );
};

export default CreateInvoicePage;
