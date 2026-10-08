import { ArrowLeft, AlertTriangle, Sparkles, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useInvoiceForm } from "@/hooks/useInvoiceForm";
import { InvoiceHeader } from "@/components/invoice/InvoiceHeader";
import { InvoiceItemsTable } from "@/components/invoice/InvoiceItemsTable";
import { InvoiceTotals } from "@/components/invoice/InvoiceTotals";
import { InvoiceDialogs } from "@/components/invoice/InvoiceDialogs";
import { SuccessModal } from '@/components/SuccessModal';
import { StaffHeaderBadge } from "@/components/StaffHeaderBadge";
import { CompleteProfileModal } from "@/components/CompleteProfileModal";
import { UncatalogedProductsModal } from "@/components/invoice/UncatalogedProductsModal";
import { extractVehicleDetails } from "@/components/AutoInvoiceTemplate";

const CreateInvoicePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDownpaymentUrl = location.pathname.includes('downpayment') || new URLSearchParams(location.search).get('type') === 'downpayment';
  const [vehicleDetails, setVehicleDetails] = useState({
    model: '',
    chassisNo: '',
    engineNo: '',
    color: '',
    regNo: '',
    financer: '',
  });

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
    qrPrintType, setQrPrintType, showValidationErrors, inrPerUnit,
    uncatalogedModalOpen, setUncatalogedModalOpen, uncatalogedItemsList,
    incompleteItemsList, confirmAndSavePurchaseBill,
    isDownpayment: formIsDownpayment
  } = useInvoiceForm();

  const isDownpayment = isDownpaymentUrl || formIsDownpayment;

  // Populate vehicle details if editing an invoice with vehicle metadata
  useEffect(() => {
    if (formData.notes) {
      const hasMeta = formData.notes.includes('is_downpayment') || formData.notes.includes('Vehicle:') || isDownpayment;
      if (hasMeta && (!vehicleDetails.model && !vehicleDetails.chassisNo && !vehicleDetails.engineNo)) {
        const extracted = extractVehicleDetails({ notes: formData.notes });
        if (extracted && (extracted.model || extracted.chassisNo || extracted.engineNo || extracted.color || extracted.regNo || extracted.financer)) {
          setVehicleDetails({
            model: extracted.model || '',
            chassisNo: extracted.chassisNo || '',
            engineNo: extracted.engineNo || '',
            color: extracted.color || '',
            regNo: extracted.regNo || '',
            financer: extracted.financer || ''
          });
        }
      }
    }
  }, [formData.notes, isDownpayment]);

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDownpayment) {
      const metaTag = `[META:${JSON.stringify({ is_downpayment: true, vehicle: vehicleDetails })}]`;
      const humanNotes = [
        vehicleDetails.model ? `Vehicle: ${vehicleDetails.model}` : '',
        vehicleDetails.chassisNo ? `Chassis/VIN: ${vehicleDetails.chassisNo}` : '',
        vehicleDetails.engineNo ? `Engine No: ${vehicleDetails.engineNo}` : '',
        vehicleDetails.color ? `Color: ${vehicleDetails.color}` : '',
        vehicleDetails.regNo ? `Booking/Reg: ${vehicleDetails.regNo}` : '',
        vehicleDetails.financer ? `Financer: ${vehicleDetails.financer}` : '',
      ].filter(Boolean).join(' | ');

      const existingCleanNotes = (formData.notes || '').replace(/\[META:.*?\]\s*/g, '').trim();
      const updatedNotes = `${metaTag}\n${humanNotes ? `${humanNotes}\n` : ''}${existingCleanNotes}`.trim();

      formData.notes = updatedNotes;
      setFormData(prev => ({ ...prev, notes: updatedNotes }));
    }
    await handleSubmit(e);
  };

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
            onClick={() => navigate(isPurchase ? '/purchase-invoices' : isDownpayment ? '/billing/downpayment-invoices' : '/invoices')}
            className="rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                {isEditing ? (
                  <>{isPurchase ? 'Edit Purchase Bill' : isDownpayment ? 'Edit Downpayment Invoice' : (billingType === 'ledger' ? 'Edit Ledger Bill' : (billingType === 'quotation' ? 'Edit Quotation' : 'Edit Invoice'))}</>
                ) : (
                  <>{isPurchase ? 'Record Purchase Bill' : isDownpayment ? 'Create Downpayment Invoice' : (billingType === 'ledger' ? 'Create Ledger Bill' : (billingType === 'quotation' ? 'Create Quotation / Price Estimate' : 'Create New Invoice'))}</>
                )}
              </h1>
              {isDownpayment && (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-300 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5" /> Automobile Downpayment
                </span>
              )}
              <StaffHeaderBadge />
            </div>
            <p className="text-slate-500 mt-1">
              {isEditing 
                ? `Managing ${isPurchase ? 'purchase record' : isDownpayment ? 'downpayment receipt' : (billingType === 'quotation' ? 'quotation' : 'invoice')} #${invoiceNumber}` 
                : (billingType === 'ledger' 
                    ? 'Generate an official settlement bill directly from Account Ledger party remaining balances' 
                    : (billingType === 'quotation'
                        ? 'Generate a formal price quote / estimate for your customer (no stock deduction)'
                        : (isPurchase ? 'Record vendor procurement, inward stock, and purchase bill details' : isDownpayment ? 'Generate vehicle booking advance and downpayment receipt' : 'Generate a professional invoice for your business')
                      )
                  )
              }
            </p>
          </div>
        </div>
      </div>

      {invoiceCurrency && invoiceCurrency !== 'INR' && (
        <div className="mb-6 p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>
              <strong>Forex Multiplier Active:</strong> 1 {invoiceCurrency} ≈ ₹{inrPerUnit?.toFixed(2) || '95.51'}. Catalog rates and totals automatically convert to {invoiceCurrency} ({currencySymbol}).
            </span>
          </div>
          <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[11px] shadow-sm self-start sm:self-auto flex-shrink-0">
            {invoiceCurrency} Mode
          </span>
        </div>
      )}

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

      <form onSubmit={onFormSubmit} className="space-y-6 md:space-y-8">
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

        {isDownpayment && (
          <Card className="p-5 border-2 border-amber-200/80 bg-amber-50/30 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <Car className="w-5 h-5 text-amber-600" />
              <span>Automobile & Vehicle Booking Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Vehicle Model / Variant</Label>
                <Input
                  placeholder="e.g. Swift VXI / Creta SX"
                  value={vehicleDetails.model}
                  onChange={(e) => setVehicleDetails(prev => ({ ...prev, model: e.target.value }))}
                  className="bg-white rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Chassis / VIN Number</Label>
                <Input
                  placeholder="e.g. MA3E...1234"
                  value={vehicleDetails.chassisNo}
                  onChange={(e) => setVehicleDetails(prev => ({ ...prev, chassisNo: e.target.value }))}
                  className="bg-white rounded-xl uppercase font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Engine Number</Label>
                <Input
                  placeholder="e.g. K12M...5678"
                  value={vehicleDetails.engineNo}
                  onChange={(e) => setVehicleDetails(prev => ({ ...prev, engineNo: e.target.value }))}
                  className="bg-white rounded-xl uppercase font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Color</Label>
                <Input
                  placeholder="e.g. Pearl Arctic White"
                  value={vehicleDetails.color}
                  onChange={(e) => setVehicleDetails(prev => ({ ...prev, color: e.target.value }))}
                  className="bg-white rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Booking / Reg Number</Label>
                <Input
                  placeholder="e.g. DL-01-AB-1234 or BK-909"
                  value={vehicleDetails.regNo}
                  onChange={(e) => setVehicleDetails(prev => ({ ...prev, regNo: e.target.value }))}
                  className="bg-white rounded-xl uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Financer / Hypothecation</Label>
                <Input
                  placeholder="e.g. HDFC Bank Ltd / Cash"
                  value={vehicleDetails.financer}
                  onChange={(e) => setVehicleDetails(prev => ({ ...prev, financer: e.target.value }))}
                  className="bg-white rounded-xl"
                />
              </div>
            </div>
          </Card>
        )}

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
            isPurchase={isPurchase}
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
              ? (isPurchase ? 'Update Purchase Bill' : isDownpayment ? 'Update Downpayment Invoice' : 'Update Invoice')
              : (billingType === 'ledger' 
                  ? 'Generate Ledger Bill' 
                  : (billingType === 'quotation' 
                      ? 'Create Quotation' 
                      : (isPurchase ? 'Record Purchase Bill' : isDownpayment ? 'Generate Downpayment Invoice' : 'Create Invoice')))
          }
          navigate={navigate}
          onAddExpense={() => setExpenseSelectionOpen(true)}
          isPurchase={isPurchase}
          isDownpayment={isDownpayment}
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
        newProductFormData={newProductFormData as any}
        setNewProductFormData={setNewProductFormData as any}
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
          if (!open) navigate(isPurchase ? '/purchase-invoices' : isDownpayment ? '/billing/downpayment-invoices' : '/invoices');
        }}
        title={successInfo.title}
        message={successInfo.message}
      />

      <UncatalogedProductsModal
        isOpen={uncatalogedModalOpen}
        onClose={() => setUncatalogedModalOpen(false)}
        onConfirm={confirmAndSavePurchaseBill}
        uncatalogedItems={uncatalogedItemsList}
        incompleteItems={incompleteItemsList}
        currencySymbol={currencySymbol}
        saving={saving}
      />

      <CompleteProfileModal featureName="creating invoices" />
    </div>
  );
};

export default CreateInvoicePage;
