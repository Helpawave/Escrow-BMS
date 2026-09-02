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
    billingType, setBillingType, ledgerParties, selectedLedgerPartyId, handleLedgerPartySelect,
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
                <>Edit {billingType === 'ledger' ? 'Ledger Bill' : (isPurchase ? 'Bill' : 'Invoice')}</>
              ) : (
                <>Create {billingType === 'ledger' ? 'Ledger Bill' : (isPurchase ? 'Purchase Bill' : 'Sales Invoice')}</>
              )}
            </h1>
            <p className="text-slate-500 mt-1">
              {isEditing 
                ? `Managing ${isPurchase ? 'purchase record' : 'invoice'} #${invoiceNumber}` 
                : (billingType === 'ledger' 
                    ? 'Generate an official settlement bill directly from Account Ledger party remaining balances' 
                    : `Generate a professional ${isPurchase ? 'purchase bill' : 'invoice'} for your business`
                  )
              }
            </p>
          </div>
        </div>
      </div>

      {(!isPurchase && clients.length === 0) && (
        <Alert className="bg-amber-50 border-amber-200 text-amber-900 mb-6 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="font-bold">No Clients Found</AlertTitle>
          <AlertDescription className="flex items-center justify-between mt-1 flex-wrap gap-2">
            <span>You don't have any saved clients yet. Please add a client to issue invoices.</span>
            <Button size="sm" type="button" onClick={() => setNewClientDialogOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold">
              + Add First Client
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {billingType !== 'ledger' && products.length === 0 && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-900 mb-6 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-blue-600" />
          <AlertTitle className="font-bold">No Products or Services Found</AlertTitle>
          <AlertDescription className="flex items-center justify-between mt-1 flex-wrap gap-2">
            <span>Your inventory catalog is currently empty. Add a product or service to quickly add line items.</span>
            <Button size="sm" type="button" onClick={() => navigate('/inventory/products/new')} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer">
              + Add First Product
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
          billingType={billingType}
          setBillingType={setBillingType}
          isPurchase={isPurchase}
          setIsPurchase={setIsPurchase}
          formData={formData}
          setFormData={setFormData}
          clients={clients}
          vendors={vendors}
          ledgerParties={ledgerParties}
          selectedLedgerPartyId={selectedLedgerPartyId}
          onLedgerPartySelect={handleLedgerPartySelect}
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
            billingType={billingType}
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
          submitLabel={
            isEditing 
              ? 'Update Invoice' 
              : (billingType === 'ledger' ? 'Generate Ledger Bill' : (isPurchase ? 'Create Purchase Bill' : 'Create Invoice'))
          }
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
          if (!open) navigate(isPurchase ? '/purchase-invoices' : '/invoices');
        }}
        title={successInfo.title}
        message={successInfo.message}
      />
    </div>
  );
};

export default CreateInvoicePage;
