import { ArrowLeft, AlertTriangle, Sparkles, Car, Gauge, Wrench, Calendar, Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useNavigate, useLocation } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useInvoiceForm } from "@/hooks/useInvoiceForm";
import { InvoiceHeader } from "@/components/invoice/InvoiceHeader";
import { CafePOSBilling } from "@/components/cafe/CafePOSBilling";
import { InvoiceItemsTable } from "@/components/invoice/InvoiceItemsTable";
import { InvoiceTotals } from "@/components/invoice/InvoiceTotals";
import { InvoiceDialogs } from "@/components/invoice/InvoiceDialogs";
import { SuccessModal } from '@/components/SuccessModal';
import { StaffHeaderBadge } from "@/components/StaffHeaderBadge";
import { CompleteProfileModal } from "@/components/CompleteProfileModal";
import { UncatalogedProductsModal } from "@/components/invoice/UncatalogedProductsModal";
import { extractVehicleDetails } from "@/components/AutoInvoiceTemplate";
import { useUserType } from "@/hooks/useUserType";
import { generateBookingNumber } from "@/utils/invoice-helpers";

const CreateInvoicePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAutomobile, isCafe } = useUserType();
  const isDownpaymentUrl = isAutomobile && (location.pathname.includes('downpayment') || new URLSearchParams(location.search).get('type') === 'downpayment');
  
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [showClassicView, setShowClassicView] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState({
    model: '',
    chassisNo: '',
    vehicleNo: '',
    regNo: '',
    totalKm: '',
    serviceType: '1st Service',
    freeServiceNo: '1',
    totalFreeServices: 3,
    nextServiceKm: '',
    nextServiceDate: '',
    color: '',
    financer: '',
    deliveryDate: '',
  });

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
    qrPrintType, setQrPrintType, showValidationErrors, inrPerUnit,
    uncatalogedModalOpen, setUncatalogedModalOpen, uncatalogedItemsList,
    incompleteItemsList, confirmAndSavePurchaseBill, handleUpdateSalesPrice,
    isDownpayment: formIsDownpayment,
    setIsDownpayment,
    user,
    cafeCustomerPhone, setCafeCustomerPhone,
    cafeCustomerName, setCafeCustomerName,
    cafeTable, setCafeTable,
    resetForm
  } = useInvoiceForm();

  const [tabIsDownpayment, setTabIsDownpayment] = useState(false);
  const isDownpayment = isAutomobile && (isDownpaymentUrl || formIsDownpayment || tabIsDownpayment);

  const handleSetDownpayment = (val: boolean) => {
    if (!isAutomobile) return;
    setTabIsDownpayment(val);
    setIsDownpayment(val);
    if (val) setShowVehicleDetails(true);
  };

  // Auto-generate Booking Number for downpayment if not yet set (including editing past invoices where it was missing)
  useEffect(() => {
    if (isDownpayment && !vehicleDetails.vehicleNo && !vehicleDetails.regNo) {
      generateBookingNumber(user?.id).then(bk => {
        if (bk) {
          setVehicleDetails(prev => {
            if (!prev.vehicleNo && !prev.regNo) {
              return { ...prev, vehicleNo: bk, regNo: bk };
            }
            return prev;
          });
        }
      });
    }
  }, [isDownpayment, user?.id]);

  // Auto-expand vehicle details when automobile business type or downpayment
  useEffect(() => {
    if (isAutomobile || isDownpayment) {
      setShowVehicleDetails(true);
    }
  }, [isAutomobile, isDownpayment]);

  // Apply service interval helper (+2500 KM / 1 Mo default, or customizable)
  const applyServiceInterval = (kmAdd: number, monthsAdd: number) => {
    const rawVal = (vehicleDetails.totalKm || '').replace(/[^0-9]/g, '');
    const kmNum = parseInt(rawVal, 10);
    const nextKm = !isNaN(kmNum) && kmNum > 0 ? String(kmNum + kmAdd) : '';

    const baseDate = formData.issue_date ? new Date(formData.issue_date) : new Date();
    const nextDate = new Date(baseDate);
    nextDate.setMonth(nextDate.getMonth() + monthsAdd);
    const day = String(nextDate.getDate()).padStart(2, '0');
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const year = nextDate.getFullYear();
    const nextDateStr = `${day}/${month}/${year}`;

    setVehicleDetails(prev => ({
      ...prev,
      nextServiceKm: nextKm,
      nextServiceDate: nextDateStr
    }));
  };

  // Auto calculate Next Service (+2500 KM & +1 Month) upon entering Total KM
  const handleTotalKmChange = (val: string) => {
    const rawVal = val.replace(/[^0-9]/g, '');
    const kmNum = parseInt(rawVal, 10);
    
    // Auto calculate Next Service KM = Current KM + 2500
    const nextKm = !isNaN(kmNum) && kmNum > 0 ? String(kmNum + 2500) : '';
    
    // Auto calculate Next Service Date = Issue Date (or today) + 1 Month
    const baseDate = formData.issue_date ? new Date(formData.issue_date) : new Date();
    const nextDate = new Date(baseDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    const day = String(nextDate.getDate()).padStart(2, '0');
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const year = nextDate.getFullYear();
    const nextDateStr = `${day}/${month}/${year}`;

    setVehicleDetails(prev => ({
      ...prev,
      totalKm: rawVal,
      nextServiceKm: nextKm,
      nextServiceDate: nextKm ? nextDateStr : prev.nextServiceDate
    }));
  };

  // Populate vehicle details if editing an invoice with vehicle metadata
  useEffect(() => {
    if (formData.notes) {
      const hasMeta = formData.notes.includes('is_downpayment') || 
                      formData.notes.includes('Vehicle') || 
                      formData.notes.includes('Total KM') || 
                      isDownpayment;
      if (hasMeta && !vehicleDetails.vehicleNo && !vehicleDetails.model) {
        const extracted = extractVehicleDetails({ notes: formData.notes });
        if (extracted.model || extracted.vehicleNo || extracted.regNo || extracted.totalKm) {
          setShowVehicleDetails(true);
          setVehicleDetails({
            model: extracted.model || '',
            chassisNo: extracted.chassisNo || '',
            vehicleNo: extracted.vehicleNo || extracted.regNo || '',
            regNo: extracted.regNo || extracted.vehicleNo || '',
            totalKm: extracted.totalKm != null ? String(extracted.totalKm) : '',
            serviceType: extracted.serviceType || '1st Free Service (1 of 3)',
            freeServiceNo: extracted.freeServiceNo != null ? String(extracted.freeServiceNo) : '1',
            totalFreeServices: Number(extracted.totalFreeServices) || 3,
            nextServiceKm: extracted.nextServiceKm != null ? String(extracted.nextServiceKm) : '',
            nextServiceDate: extracted.nextServiceDate || '',
            color: extracted.color || '',
            financer: extracted.financer || '',
            deliveryDate: (extracted as any).deliveryDate || ''
          });
        }
      }
    }
  }, [formData.notes, isDownpayment]);

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasVehicle = Boolean(
      isDownpayment || 
      showVehicleDetails || 
      vehicleDetails.vehicleNo || 
      vehicleDetails.regNo || 
      vehicleDetails.totalKm || 
      vehicleDetails.model
    );

    if (hasVehicle) {
      let vehNo = (vehicleDetails.vehicleNo || vehicleDetails.regNo || '').trim();
      if (isDownpayment && !vehNo) {
        vehNo = await generateBookingNumber(user?.id);
        setVehicleDetails(prev => ({ ...prev, vehicleNo: vehNo, regNo: vehNo }));
      }

      const vehiclePayload = isDownpayment
        ? {
            model: vehicleDetails.model,
            vehicleNo: vehNo,
            regNo: vehNo,
            chassisNo: vehicleDetails.chassisNo,
            color: vehicleDetails.color,
            financer: vehicleDetails.financer,
            deliveryDate: vehicleDetails.deliveryDate
          }
        : {
            ...vehicleDetails,
            vehicleNo: vehNo,
            regNo: vehNo
          };

      // ONLY mark is_downpayment: true for actual downpayment invoices!
      // Regular sales invoices MUST NOT contain the word is_downpayment so queries don't misclassify them.
      const metaTag = isDownpayment
        ? `[META:${JSON.stringify({ 
            is_downpayment: true, 
            vehicle: vehiclePayload 
          })}]`
        : `[META:${JSON.stringify({ 
            vehicle: vehiclePayload 
          })}]`;

      const humanNotes = isDownpayment
        ? [
            vehNo ? `Booking / Reg No: ${vehNo}` : '',
            vehicleDetails.model ? `Model: ${vehicleDetails.model}` : '',
            vehicleDetails.chassisNo ? `Chassis/VIN: ${vehicleDetails.chassisNo}` : '',
            vehicleDetails.color ? `Color: ${vehicleDetails.color}` : '',
            vehicleDetails.financer ? `Financer: ${vehicleDetails.financer}` : '',
            vehicleDetails.deliveryDate ? `Delivery Date: ${vehicleDetails.deliveryDate}` : ''
          ].filter(Boolean).join(' | ')
        : [
            vehNo ? `Vehicle Reg No: ${vehNo}` : '',
            vehicleDetails.totalKm ? `Total KM: ${vehicleDetails.totalKm} KM` : '',
            vehicleDetails.serviceType ? `Service: ${vehicleDetails.serviceType}` : '',
            vehicleDetails.nextServiceKm ? `Next Service KM: ${vehicleDetails.nextServiceKm} KM` : '',
            vehicleDetails.nextServiceDate ? `Next Service Date: ${vehicleDetails.nextServiceDate}` : '',
          ].filter(Boolean).join(' | ');

      const existingCleanNotes = (formData.notes || '')
        .replace(/\[META:.*?\]\s*/g, '')
        .replace(/Vehicle Reg No:.*?\n?/g, '')
        .replace(/Vehicle No:.*?\n?/g, '')
        .replace(/Vehicle \/ Reg No:.*?\n?/g, '')
        .replace(/Booking \/ Reg No:.*?\n?/g, '')
        .replace(/Vehicle:.*?\n?/g, '')
        .trim();

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
      <SEO
        title={isCafe && !isPurchase && !showClassicView ? "CAFE POS COUNTER | ESCROWBILL" : "CREATE INVOICE | ESCROWBILL"}
        description="Rapid touchscreen counter billing, instant table management & live kitchen ticket sync."
      />
      {(!isCafe || isPurchase || showClassicView) && (
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(isPurchase ? '/purchase-invoices' : isDownpayment ? '/downpayment-invoices' : '/invoices')}
              className="rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                  {isEditing ? (
                    <>{isPurchase ? 'Edit Purchase Bill' : isDownpayment ? 'Edit Downpayment Invoice' : 'Edit Invoice'}</>
                  ) : (
                    <>{isPurchase ? 'Record Purchase Bill' : isDownpayment ? 'Create Downpayment Invoice' : 'Create New Invoice (Standard B2B)'}</>
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
                  ? `Managing ${isPurchase ? 'purchase record' : isDownpayment ? 'downpayment receipt' : 'invoice'} #${invoiceNumber}` 
                  : (isPurchase ? 'Record vendor procurement, inward stock, and purchase bill details' : isDownpayment ? 'Generate vehicle booking advance and downpayment receipt' : 'Generate a professional invoice for your business')
                }
              </p>
            </div>
          </div>
        </div>
      )}

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

      <form onSubmit={onFormSubmit} className="space-y-6 md:space-y-8">
        {isCafe && !isPurchase && !showClassicView ? (
          <CafePOSBilling
            products={products}
            clients={clients}
            items={items}
            setItems={setItems}
            formData={formData}
            setFormData={setFormData}
            currencySymbol={currencySymbol || '₹'}
            getTotals={getTotals}
            handleSubmit={handleSubmit}
            saving={saving}
            cafeCustomerPhone={cafeCustomerPhone}
            setCafeCustomerPhone={setCafeCustomerPhone}
            cafeCustomerName={cafeCustomerName}
            setCafeCustomerName={setCafeCustomerName}
            cafeTable={cafeTable}
            setCafeTable={setCafeTable}
            onSwitchToClassic={() => setShowClassicView(true)}
            onResetOrder={resetForm}
            updateItemAmount={updateItemAmount}
            removeItem={removeItem}
          />
        ) : (
          <>
            {isCafe && !isPurchase && showClassicView && (
              <div className="flex justify-end mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClassicView(false)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  ☕ Switch to Cafe POS Mode
                </Button>
              </div>
            )}
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
          isDownpayment={isDownpayment}
          setIsDownpayment={handleSetDownpayment}
          isAutomobile={isAutomobile}
          isCafe={isCafe}
          cafeCustomerPhone={cafeCustomerPhone}
          setCafeCustomerPhone={setCafeCustomerPhone}
          cafeCustomerName={cafeCustomerName}
          setCafeCustomerName={setCafeCustomerName}
          cafeTable={cafeTable}
          setCafeTable={setCafeTable}
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

        {/* Automobile & Vehicle Service Details Section (STRICTLY FOR AUTOMOBILE USERS OR DOWNPAYMENTS) */}
        {!isPurchase && (isAutomobile || isDownpayment || Boolean(vehicleDetails.vehicleNo || vehicleDetails.regNo || vehicleDetails.model)) && (
          <>
            <div className="flex items-center justify-between px-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowVehicleDetails(!showVehicleDetails)}
                className={`text-xs gap-1.5 rounded-xl border transition-all ${
                  (showVehicleDetails || isDownpayment) 
                    ? isDownpayment
                      ? 'bg-indigo-500/10 text-indigo-900 border-indigo-300 dark:text-indigo-300 font-bold'
                      : 'bg-amber-500/10 text-amber-900 border-amber-300 dark:text-amber-300 font-bold' 
                    : 'bg-background hover:bg-muted text-muted-foreground'
                }`}
              >
                <Car className={`w-4 h-4 ${isDownpayment ? 'text-indigo-600' : 'text-amber-600'}`} />
                <span>
                  {isDownpayment 
                    ? ((showVehicleDetails || isDownpayment) ? 'Vehicle Booking Card (Active)' : '+ Add Vehicle Booking Details')
                    : ((showVehicleDetails || isDownpayment) ? 'Vehicle & Service Card (Active)' : '+ Add Vehicle & Service Details')}
                </span>
              </Button>
              {(showVehicleDetails || isDownpayment) && (
                isDownpayment ? (
                  <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-100/90 px-3 py-1 rounded-full border border-indigo-300 shadow-2xs">
                    🚗 Vehicle Booking & Token Advance
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300 shadow-2xs">
                    🛠 3 Free Services Tracked • Next Service Auto (+2,500 KM / 1 Mo)
                  </span>
                )
              )}
            </div>

            {(showVehicleDetails || isDownpayment) && (
              isDownpayment ? (
                /* DOWNPAYMENT: Vehicle Booking & Advance Details (Compact Single-Row Layout) */
                <Card className="p-3 sm:p-3.5 border border-indigo-300/80 bg-indigo-50/30 rounded-xl shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-indigo-200/80 pb-2">
                    <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs sm:text-sm">
                      <Car className="w-4 h-4 text-indigo-600" />
                      <span>Vehicle Booking & Downpayment Details</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-900 bg-white/95 px-2.5 py-0.5 rounded-md border border-indigo-200 w-fit">
                      <span>🚗 Token Advance & Allotment Profile</span>
                    </div>
                  </div>

                  {/* Single responsive compact row for all 6 fields with strict baseline alignment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 items-end">
                    {/* Vehicle Model */}
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <div className="h-5 flex items-center text-[11px] font-bold text-slate-800 truncate">
                        <span>Model / Variant <span className="text-rose-500">*</span></span>
                      </div>
                      <Input
                        placeholder="e.g. Swift VXI / Creta"
                        value={vehicleDetails.model}
                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, model: e.target.value }))}
                        className="bg-white rounded-lg text-slate-900 border-indigo-200 focus:border-indigo-500 font-medium text-xs h-9 w-full"
                      />
                    </div>

                    {/* Booking / Reg Number */}
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <div className="h-5 flex items-center text-[11px] font-bold text-slate-800 truncate">
                        <span>Booking # <span className="text-rose-500">*</span></span>
                      </div>
                      <div className="relative w-full">
                        <Input
                          placeholder="e.g. BK-0001"
                          value={vehicleDetails.vehicleNo || vehicleDetails.regNo}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setVehicleDetails(prev => ({ ...prev, vehicleNo: val, regNo: val }));
                          }}
                          className="bg-white rounded-lg uppercase font-mono font-bold text-slate-900 border-indigo-200 focus:border-indigo-500 text-xs h-9 w-full pr-12"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const bk = await generateBookingNumber(user?.id);
                            setVehicleDetails(prev => ({ ...prev, vehicleNo: bk, regNo: bk }));
                          }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-indigo-700 hover:text-indigo-900 font-bold bg-indigo-50 hover:bg-indigo-100 px-1.5 py-1 rounded border border-indigo-200 cursor-pointer transition-colors shadow-2xs"
                          title="Auto-generate next booking number"
                        >
                          Auto ⚡
                        </button>
                      </div>
                    </div>

                    {/* Chassis / VIN Number */}
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <div className="h-5 flex items-center text-[11px] font-bold text-slate-800 truncate">
                        <span>Chassis / VIN</span>
                      </div>
                      <Input
                        placeholder="e.g. MA3E...1234"
                        value={vehicleDetails.chassisNo}
                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, chassisNo: e.target.value.toUpperCase() }))}
                        className="bg-white rounded-lg uppercase font-mono border-indigo-200 text-xs h-9 w-full"
                      />
                    </div>

                    {/* Color / Exterior Finish */}
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <div className="h-5 flex items-center text-[11px] font-bold text-slate-800 truncate">
                        <span>Color / Finish</span>
                      </div>
                      <Input
                        placeholder="e.g. Pearl White"
                        value={vehicleDetails.color}
                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, color: e.target.value }))}
                        className="bg-white rounded-lg border-indigo-200 text-xs h-9 w-full"
                      />
                    </div>

                    {/* Financer / Bank */}
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <div className="h-5 flex items-center text-[11px] font-bold text-slate-800 truncate">
                        <span>Financer / Bank</span>
                      </div>
                      <Input
                        placeholder="e.g. HDFC Bank / Cash"
                        value={vehicleDetails.financer}
                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, financer: e.target.value }))}
                        className="bg-white rounded-lg border-indigo-200 text-xs h-9 w-full"
                      />
                    </div>

                    {/* Expected Delivery Date with Calendar Date Select */}
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <div className="h-5 flex items-center gap-1 text-[11px] font-bold text-slate-800 truncate">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">Delivery Date</span>
                      </div>
                      <Input
                        type="date"
                        value={vehicleDetails.deliveryDate || ''}
                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, deliveryDate: e.target.value }))}
                        className="bg-white rounded-lg border-indigo-200 text-xs h-9 text-slate-900 focus:border-indigo-500 font-medium w-full"
                      />
                    </div>
                  </div>
                </Card>
              ) : (
                /* SALES & SERVICE: Automobile & Workshop Service Details (Compact Layout) */
                <Card className="p-3 sm:p-3.5 border border-amber-300/80 bg-amber-50/30 rounded-xl shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-amber-200/80 pb-2">
                    <div className="flex items-center gap-2 text-amber-950 font-bold text-xs sm:text-sm">
                      <Car className="w-4 h-4 text-amber-600" />
                      <span>Automobile Workshop Service Details</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-white/95 px-2.5 py-0.5 rounded-md border border-amber-300 w-fit">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>3 Free Services Active</span>
                    </div>
                  </div>

                  {/* Single responsive compact row for all 5 fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {/* Vehicle Number (Reg No) */}
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          Vehicle Number <span className="text-rose-500">*</span>
                        </span>
                        <span className="text-[9px] text-slate-500">Plate No</span>
                      </Label>
                      <Input
                        placeholder="e.g. DL-01-AB-1234"
                        value={vehicleDetails.vehicleNo || vehicleDetails.regNo}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setVehicleDetails(prev => ({ ...prev, vehicleNo: val, regNo: val }));
                        }}
                        className="bg-white rounded-lg uppercase font-mono font-bold text-xs h-9 text-slate-900 border-amber-300 focus:border-amber-500"
                      />
                    </div>

                    {/* Total KM (Odometer) with Auto calculation */}
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1"><Gauge className="w-3 h-3 text-blue-600" /> Total KM</span>
                        <span className="text-[9px] text-emerald-700 font-bold">+2500 KM</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder="e.g. 5000"
                        value={vehicleDetails.totalKm}
                        onChange={(e) => handleTotalKmChange(e.target.value)}
                        className="bg-white rounded-lg font-mono font-bold text-xs h-9 text-blue-950 border-blue-200"
                      />
                    </div>

                    {/* Service Type Selection */}
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-amber-600" /> Service Type
                        </span>
                      </Label>
                      <Select
                        value={vehicleDetails.serviceType || '1st Service'}
                        onValueChange={(val) => {
                          const freeNum = val.includes('1') ? '1' : val.includes('2') ? '2' : val.includes('3') ? '3' : '';
                          setVehicleDetails(prev => ({ 
                            ...prev, 
                            serviceType: val,
                            freeServiceNo: freeNum
                          }));
                        }}
                      >
                        <SelectTrigger className="bg-white rounded-lg h-9 text-xs font-semibold border-amber-300">
                          <SelectValue placeholder="Select Service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1st Service">1st Service</SelectItem>
                          <SelectItem value="2nd Service">2nd Service</SelectItem>
                          <SelectItem value="3rd Service">3rd Service</SelectItem>
                          <SelectItem value="Paid Service">Paid Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Next Service Due KM (Auto) */}
                    <div className="space-y-1 bg-emerald-50/90 p-1.5 rounded-lg border border-emerald-300">
                      <Label className="text-[11px] font-bold text-emerald-950 flex items-center justify-between">
                        <span>Next KM (Auto)</span>
                        <span className="text-[9px] text-emerald-700 font-bold">+2.5K KM</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder="e.g. 7500"
                        value={vehicleDetails.nextServiceKm}
                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, nextServiceKm: e.target.value }))}
                        className="bg-white rounded-md font-mono font-bold text-xs h-7 text-emerald-950 border-emerald-300"
                      />
                    </div>

                    {/* Next Service Due Date (Auto) */}
                    <div className="space-y-1 bg-emerald-50/90 p-1.5 rounded-lg border border-emerald-300">
                      <Label className="text-[11px] font-bold text-emerald-950 flex items-center justify-between">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-emerald-700" /> Next Date</span>
                        <span className="text-[9px] text-emerald-700 font-bold">+1 Mo</span>
                      </Label>
                      <Input
                        placeholder="DD/MM/YYYY"
                        value={vehicleDetails.nextServiceDate}
                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, nextServiceDate: e.target.value }))}
                        className="bg-white rounded-lg font-mono font-bold text-xs h-7 text-emerald-950 border-emerald-300"
                      />
                    </div>
                  </div>

                  {/* Quick Auto Next Service Preset Intervals */}
                  <div className="pt-1.5 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                    <span className="text-slate-600 font-medium text-[10px]">
                      Auto Interval Presets:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyServiceInterval(2500, 1)}
                        className="h-6 px-2 text-[10px] font-bold rounded-md bg-emerald-100/90 hover:bg-emerald-200 text-emerald-900 border-emerald-300"
                      >
                        ⚡ +2,500 KM / 1 Mo
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyServiceInterval(3000, 3)}
                        className="h-6 px-2 text-[10px] font-medium rounded-md bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                      >
                        +3,000 KM / 3 Mo
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyServiceInterval(5000, 6)}
                        className="h-6 px-2 text-[10px] font-medium rounded-md bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                      >
                        +5,000 KM / 6 Mo
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            )}
          </>
        )}

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
          submitLabel={isPurchase ? (isEditing ? 'Update Purchase Bill' : 'Record Purchase Bill') : (isEditing ? 'Update Invoice' : isDownpayment ? 'Generate Downpayment Invoice' : isCafe ? 'Generate Cafe Bill & KOT ☕' : 'Create Invoice')}
          navigate={navigate}
          onAddExpense={() => setExpenseSelectionOpen(true)}
          isPurchase={isPurchase}
          isDownpayment={isDownpayment}
          isCafe={isCafe}
        />
          </>
        )}
      </form>

      <InvoiceDialogs
        isCafe={isCafe}
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

      {isCafe && !isPurchase ? (
        <Dialog open={showSuccess} onOpenChange={(open) => {
          setShowSuccess(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="max-w-md p-6 bg-white dark:bg-slate-900 border-none shadow-2xl rounded-3xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl shadow-inner">
              ☕
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl font-black text-slate-900 dark:text-slate-100">
                Order &amp; Bill Created! 🎉
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Order <span className="font-mono font-bold text-foreground">#{successInfo.invoiceNumber}</span> has been generated &amp; KOT sent to Kitchen.
              </DialogDescription>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {successInfo.invoiceId && (
                <Button
                  type="button"
                  onClick={() => {
                    const targetUid = user?.id || 'me';
                    window.open(`/view-template/${targetUid}/thermal?invoiceId=${successInfo.invoiceId}`, '_blank');
                  }}
                  className="w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs gap-2 shadow-md shadow-amber-600/20 cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>🖨️ Print 80mm Thermal Receipt</span>
                </Button>
              )}

              <Button
                type="button"
                onClick={() => {
                  setShowSuccess(false);
                  resetForm();
                }}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 shadow-sm cursor-pointer"
              >
                <span>New Order (Next Customer)</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowSuccess(false);
                  navigate('/invoices');
                }}
                className="w-full h-9 rounded-xl text-xs text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
              >
                <span>View in Invoices List →</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <SuccessModal
          isOpen={showSuccess}
          onOpenChange={(open) => {
            setShowSuccess(open);
            if (!open) navigate(isPurchase ? '/purchase-invoices' : isDownpayment ? '/downpayment-invoices' : '/invoices');
          }}
          title={successInfo.title}
          message={successInfo.message}
        />
      )}

      <UncatalogedProductsModal
        isOpen={uncatalogedModalOpen}
        onClose={() => setUncatalogedModalOpen(false)}
        onConfirm={confirmAndSavePurchaseBill}
        uncatalogedItems={uncatalogedItemsList}
        incompleteItems={incompleteItemsList}
        currencySymbol={currencySymbol}
        saving={saving}
        onUpdateSalesPrice={handleUpdateSalesPrice}
      />

      {!isCafe && <CompleteProfileModal featureName="creating invoices" />}
    </div>
  );
};

export default CreateInvoicePage;
