import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  FileText,
  ShoppingBag,
  Car,
  Eye,
  Check,
  Printer,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InvoiceTemplate } from "@/components/InvoiceTemplate";
import { InvoiceTemplateId } from "@/types/invoice";
import { PurchaseBillTemplate, PurchaseTemplateId } from "@/components/PurchaseBillTemplate";
import { AutoTemplateId } from "@/components/AutoInvoiceTemplate";
import { useUserType } from "@/hooks/useUserType";

export interface InvoiceTemplatesTabProps {
  isAutomobile: boolean;
  templateCategory: 'sales' | 'purchase' | 'automobile';
  setTemplateCategory: (cat: 'sales' | 'purchase' | 'automobile') => void;
  settings: any;
  setSettings: (s: any) => void;
  handleSettingsSave: (newSettings?: any, opts?: { showToast?: boolean }) => Promise<any>;
  setPreviewTemplate: (id: InvoiceTemplateId) => void;
  handleTemplateSelect: (id: InvoiceTemplateId) => void;
  profile: any;
  setActiveSection: (s: string) => void;
  purchaseBillTemplate: PurchaseTemplateId;
  handlePurchaseTemplateSelect: (id: PurchaseTemplateId) => Promise<void>;
  setPreviewPurchaseTemplate: (id: PurchaseTemplateId | null) => void;
  downpaymentTemplate: AutoTemplateId;
  handleDownpaymentTemplateSelect: (id: AutoTemplateId) => Promise<void>;
  sampleInvoiceData: any;
  samplePurchaseData: any;
  sampleAutoData: any;
}

export const InvoiceTemplatesTab: React.FC<InvoiceTemplatesTabProps> = ({
  isAutomobile,
  templateCategory,
  setTemplateCategory,
  settings,
  setSettings,
  handleSettingsSave,
  setPreviewTemplate,
  handleTemplateSelect,
  profile,
  setActiveSection,
  purchaseBillTemplate,
  handlePurchaseTemplateSelect,
  setPreviewPurchaseTemplate,
  downpaymentTemplate,
  handleDownpaymentTemplateSelect,
  sampleInvoiceData,
  samplePurchaseData,
  sampleAutoData,
}) => {
  const { isCafe } = useUserType();
  React.useEffect(() => {
    // Only auto-set thermal for cafe if no template has been explicitly chosen yet
    if (isCafe && !settings.invoice_template) {
      handleTemplateSelect("thermal");
    }
  }, [isCafe]);
  return (
    <div className="space-y-5">
      {/* Top Category Division / Segmented Switcher */}
      <div className="flex flex-col gap-3 p-3 bg-muted/40 rounded-2xl border border-border shadow-xs">
        <div className={cn("grid gap-2 p-1.5 bg-background rounded-xl border border-border/70 shadow-xs", isAutomobile ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2")}>
          <button
            type="button"
            onClick={() => setTemplateCategory('sales')}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all w-full text-center",
              templateCategory === 'sales'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="truncate">Sales Invoices (GST)</span>
            <Badge variant={templateCategory === 'sales' ? "outline" : "secondary"} className="text-[10px] py-0 px-1.5 font-mono shrink-0">
              10
            </Badge>
          </button>
          <button
            type="button"
            onClick={() => setTemplateCategory('purchase')}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all w-full text-center",
              templateCategory === 'purchase'
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="truncate">Purchase Bills</span>
            <Badge variant={templateCategory === 'purchase' ? "outline" : "secondary"} className="text-[10px] py-0 px-1.5 font-mono shrink-0">
              5
            </Badge>
          </button>
          {isAutomobile && (
            <button
              type="button"
              onClick={() => setTemplateCategory('automobile')}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all w-full text-center",
                templateCategory === 'automobile'
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Car className="w-4 h-4 shrink-0" />
              <span className="truncate">Downpayment &amp; Booking</span>
              <Badge variant={templateCategory === 'automobile' ? "outline" : "secondary"} className="text-[10px] py-0 px-1.5 font-mono shrink-0">
                5
              </Badge>
            </button>
          )}
        </div>

        <div className="text-xs text-muted-foreground px-2 font-medium flex items-center gap-2">
          <span className={cn(
            "inline-block w-2 h-2 rounded-full shrink-0",
            templateCategory === 'sales' ? "bg-primary" :
              templateCategory === 'purchase' ? "bg-indigo-600" : "bg-amber-600"
          )} />
          <span>
            {templateCategory === 'sales'
              ? 'Standard GST Customer Sales Invoices & Service Bills (Applied to all regular Sales Invoices)'
              : templateCategory === 'purchase'
                ? 'Inward Supplier Purchase Bills & Inventory Inflow (Applied to all Purchase Bills)'
                : 'Vehicle Booking Token Advances & Downpayment Receipts (Applies ONLY to Downpayment Invoices)'}
          </span>
        </div>
      </div>

      {/* SECTION 1: SALES INVOICE TEMPLATES */}
      {templateCategory === 'sales' && (
        <Card className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-transparent">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground tracking-tight">Sales Invoice Templates</h3>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active: {
                      settings.invoice_template === 'modern' ? 'Modern UPI' :
                        settings.invoice_template === 'corporate' ? 'Corporate' :
                          settings.invoice_template === 'professional' ? 'Professional' :
                            settings.invoice_template === 'elegant' ? 'Elegant' :
                              settings.invoice_template === 'classic' ? 'Classic GST' :
                                settings.invoice_template === 'creative' ? 'Creative Studio' :
                                  settings.invoice_template === 'retail' ? 'Retail Superstore' :
                                    settings.invoice_template === 'thermal' ? 'Thermal POS' :
                                      settings.invoice_template === 'export' ? 'Global Export' :
                                        settings.invoice_template === 'minimal' ? 'Minimal' :
                                          'Corporate'
                    }
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose from 10 GST compliant formats designed for Indian customer sales, agencies, retail, and international trade.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewTemplate((settings.invoice_template as InvoiceTemplateId) || 'corporate')}
                className="h-8 gap-1.5 font-bold text-xs uppercase tracking-wider border-primary/30 text-primary hover:bg-primary/10"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview Active
              </Button>
            </div>
          </div>

          {/* Sales Template Cards Grid */}
          <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[
                {
                  id: 'classic' as const,
                  name: 'Classic GST',
                  formatTag: 'Rule 46 Grid',
                  description: 'Ruled boxed layout with detailed HSN/SAC summary tax table.',
                },
                {
                  id: 'corporate' as const,
                  name: 'Corporate',
                  formatTag: 'Navy Ribbon',
                  description: 'Formal layout with dark navy ribbon, serif typography, and dual sign boxes.',
                },
                {
                  id: 'creative' as const,
                  name: 'Creative Studio',
                  formatTag: 'Agency & Tech',
                  description: 'Violet accent studio layout with deliverable milestones, project notes, and UPI.',
                },
                {
                  id: 'retail' as const,
                  name: 'Retail Superstore',
                  formatTag: 'Cash Memo & POS',
                  description: 'Emerald retail layout with Savings callout, return policy, and itemized GST.',
                },
                {
                  id: 'professional' as const,
                  name: 'Professional',
                  formatTag: 'Gradient Header',
                  description: 'Clean business invoice with gradient banner, accent borders, and bank card.',
                },
                {
                  id: 'modern' as const,
                  name: 'Modern UPI',
                  formatTag: 'Scan & Pay QR',
                  description: 'Contemporary invoice with dynamic UPI QR code for fast mobile payments.',
                },
                {
                  id: 'elegant' as const,
                  name: 'Elegant',
                  formatTag: 'Tax Split Grid',
                  description: 'Refined layout with Sold By vs Billing columns and itemized tax breakdown.',
                },
                {
                  id: 'export' as const,
                  name: 'Global Export',
                  formatTag: 'International LUT',
                  description: 'Cross-border invoice under LUT with Port details, USD currency, and SWIFT box.',
                },
                {
                  id: 'minimal' as const,
                  name: 'Minimal',
                  formatTag: 'Clean Editorial',
                  description: 'Distraction-free typographic layout with generous whitespace and fine dividers.',
                },
                {
                  id: 'thermal' as const,
                  name: 'Thermal POS',
                  formatTag: '58mm / 80mm',
                  description: 'Compact monospace receipt designed for POS thermal roll printers with barcode.',
                }
              ].filter(tpl => isCafe ? tpl.id === "thermal" : true).map((tpl) => {
                const isActive = settings.invoice_template === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    className={cn(
                      "group relative rounded-xl border p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer bg-card",
                      isActive
                        ? "border-primary bg-primary/[0.02] ring-2 ring-primary/25 shadow-md"
                        : "border-border hover:border-primary/40"
                    )}
                    onClick={() => handleTemplateSelect(tpl.id)}
                  >
                    {isActive && (
                      <div className="absolute -top-2.5 -right-2 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-wider py-0.5 px-2.5 rounded-full shadow-sm flex items-center gap-1 z-10">
                        <Check className="w-3 h-3 stroke-[3]" />
                        Active
                      </div>
                    )}

                    <div className="space-y-3">
                      <div
                        className="h-52 w-full rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 overflow-hidden relative flex justify-center items-start pt-2 px-2 shadow-inner select-none group-hover:border-primary/50 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplate(tpl.id);
                        }}
                      >
                        <div
                          className="origin-top transition-transform duration-300 pointer-events-none"
                          style={{
                            width: tpl.id === 'thermal' ? '340px' : '794px',
                            transform: tpl.id === 'thermal' ? 'scale(0.56)' : 'scale(0.26)',
                            transformOrigin: 'top center',
                          }}
                        >
                          <div className="bg-white text-slate-900 shadow-md border border-slate-300 rounded-sm pointer-events-none overflow-hidden">
                            <InvoiceTemplate
                              template={tpl.id}
                              invoice={tpl.id === 'export' ? { ...sampleInvoiceData.invoice, currency: 'USD', tax_amount: 0, total_amount: 12000 } : sampleInvoiceData.invoice}
                              client={tpl.id === 'export' ? { ...sampleInvoiceData.client, country: 'United States' } : sampleInvoiceData.client}
                              items={sampleInvoiceData.items}
                              company={sampleInvoiceData.company}
                            />
                          </div>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 py-2 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-bold text-white flex items-center gap-1 drop-shadow">
                            <Eye className="w-3 h-3 text-white" /> Click to preview full size
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <h4 className="font-bold text-sm text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">{tpl.name}</h4>
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60 shrink-0">
                            {tpl.formatTag}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-border flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs font-semibold gap-1.5 rounded-lg border-border hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplate(tpl.id);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        Preview
                      </Button>
                      <Button
                        variant={isActive ? "secondary" : "default"}
                        size="sm"
                        disabled={isActive}
                        className={cn(
                          "flex-1 h-8 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                          isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default opacity-100"
                            : "shadow-sm hover:opacity-95"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTemplateSelect(tpl.id);
                        }}
                      >
                        {isActive ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        ) : "Apply"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Print Stationary & Letterhead Preferences Card */}
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground">Print & Business Defaults</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-start gap-3">
                  <Checkbox
                    id="hideCompanyDetails"
                    checked={settings.hide_company_details}
                    onCheckedChange={(checked) => {
                      const next = { ...settings, hide_company_details: !!checked };
                      setSettings(next);
                      void handleSettingsSave(next, { showToast: true });
                    }}
                    className="mt-0.5"
                  />
                  <div>
                    <Label htmlFor="hideCompanyDetails" className="text-xs font-bold text-foreground cursor-pointer">
                      Pre-printed Letterhead Mode
                    </Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Hides company header on PDFs. Use when printing on letterhead stationary.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Branding Assets</h5>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {profile.logo_url ? "✓ Logo" : "⚠️ No logo"} • {profile.signature_url ? "✓ Signature" : "⚠️ No signature"} • {profile.upi_id ? "✓ UPI QR (Active)" : "⚠️ No UPI ID"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveSection('business')}
                    className="shrink-0 h-7 text-[11px] font-bold"
                  >
                    Manage
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* SECTION 2: PURCHASE BILL TEMPLATES */}
      {templateCategory === 'purchase' && (
        <Card className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground tracking-tight">Purchase Bill Templates</h3>
                  <Badge variant="outline" className="bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border-indigo-600/30 text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active: {
                      purchaseBillTemplate === 'classic-blue' ? 'Classic Blue (Image 1)' :
                        purchaseBillTemplate === 'commercial-erp' ? 'Commercial ERP (Image 2)' :
                          purchaseBillTemplate === 'tax-itc' ? 'GST ITC Voucher' :
                            purchaseBillTemplate === 'grn' ? 'GRN Note' :
                              'Standard Procurement'
                    }
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Professional inward procurement layouts tailored for vendor bills, stock receipt verification, and GST Input Tax Credit (ITC) audits.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewPurchaseTemplate(purchaseBillTemplate)}
                className="h-8 gap-1.5 font-bold text-xs uppercase tracking-wider border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview Active
              </Button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  id: 'classic-blue' as const,
                  name: 'Classic Blue',
                  formatTag: 'Vertex42 Style • Ref Image 1',
                  description: 'Clean corporate procurement bill with solid blue BILL TO / SHIP TO banners, P.O. logistics strip, ruled item table, and comments box.',
                },
                {
                  id: 'commercial-erp' as const,
                  name: 'Commercial ERP Invoice',
                  formatTag: 'Enterprise ERP • Ref Image 2',
                  description: 'Commercial purchase layout with prominent dark header banner, yellow supplier info box, full lined grid, bank details, and stock verification box.',
                },
                {
                  id: 'tax-itc' as const,
                  name: 'GST ITC Audit Voucher',
                  formatTag: 'Section 16 CGST • CA Audit',
                  description: 'Auditor-grade voucher with CGST, SGST, IGST tax credit split, supplier GSTIN verification, and legal ITC claim certification.',
                },
                {
                  id: 'grn' as const,
                  name: 'Goods Receipt Note (GRN)',
                  formatTag: 'Warehouse Stock Inward',
                  description: 'Physical inventory inward stock entry voucher with billed qty vs received qty inspection and store keeper signatures.',
                },
                {
                  id: 'standard' as const,
                  name: 'Standard Procurement',
                  formatTag: 'Voucher Format',
                  description: 'Clean modern inward procurement voucher with dual party cards, HSN breakdown, and stock approved verification.',
                }
              ].map((tpl) => {
                const isActive = purchaseBillTemplate === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    className={cn(
                      "group relative rounded-xl border p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer bg-card",
                      isActive
                        ? "border-indigo-600 bg-indigo-50/10 dark:bg-indigo-950/20 ring-2 ring-indigo-500/25 shadow-md"
                        : "border-border hover:border-indigo-500/40"
                    )}
                    onClick={() => handlePurchaseTemplateSelect(tpl.id)}
                  >
                    {isActive && (
                      <div className="absolute -top-2.5 -right-2 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider py-0.5 px-2.5 rounded-full shadow-sm flex items-center gap-1 z-10">
                        <Check className="w-3 h-3 stroke-[3]" />
                        Active Default
                      </div>
                    )}

                    <div className="space-y-3">
                      <div
                        className="h-56 w-full rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 overflow-hidden relative flex justify-center items-start pt-2 px-2 shadow-inner select-none group-hover:border-indigo-500/50 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewPurchaseTemplate(tpl.id);
                        }}
                      >
                        <div
                          className="origin-top transition-transform duration-300 pointer-events-none"
                          style={{
                            width: '794px',
                            transform: 'scale(0.26)',
                            transformOrigin: 'top center',
                          }}
                        >
                          <div className="bg-white text-slate-900 shadow-md border border-slate-300 rounded-sm pointer-events-none overflow-hidden">
                            <PurchaseBillTemplate
                              template={tpl.id}
                              invoice={samplePurchaseData.invoice}
                              vendor={samplePurchaseData.vendor}
                              items={samplePurchaseData.items}
                              company={samplePurchaseData.company}
                            />
                          </div>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 py-2 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-bold text-white flex items-center gap-1 drop-shadow">
                            <Eye className="w-3 h-3 text-white" /> Click to preview full size
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <h4 className="font-bold text-sm text-foreground tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{tpl.name}</h4>
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                            {tpl.formatTag}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-border flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs font-semibold gap-1.5 rounded-lg border-border hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewPurchaseTemplate(tpl.id);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        Preview
                      </Button>
                      <Button
                        variant={isActive ? "secondary" : "default"}
                        size="sm"
                        disabled={isActive}
                        className={cn(
                          "flex-1 h-8 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                          isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default opacity-100"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePurchaseTemplateSelect(tpl.id);
                        }}
                      >
                        {isActive ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        ) : "Apply"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 flex items-start gap-3">
                <PackageCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-foreground">Automatic Inward Stock Linking</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Items created in purchase bills automatically update your inventory stock count and are fully tracked in stock adjustment history.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-foreground">100% Tax Credit (ITC) Compliance</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    All purchase bill formats strictly separate vendor GSTIN, CGST, SGST, and IGST to ensure seamless monthly GSTR-2B reconciliation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* SECTION 3: AUTOMOBILE DOWNPAYMENT & BOOKING SLIP TEMPLATES */}
      {isAutomobile && templateCategory === 'automobile' && (
        <Card className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground tracking-tight">Vehicle Booking &amp; Downpayment Slip Templates</h3>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Active: {
                      downpaymentTemplate === 'auto_dealership' ? 'Dealership Slip' :
                        downpaymentTemplate === 'auto_modern' ? 'Modern Drive Voucher' :
                          downpaymentTemplate === 'auto_classic' ? 'Corporate RTO Form' :
                            downpaymentTemplate === 'auto_executive' ? 'Executive Luxury Allotment' :
                              downpaymentTemplate === 'auto_compact' ? 'Compact Token Counter Slip' :
                                'Corporate RTO Form'
                    }
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  5 specialized booking slip layouts for token advances, booking slips, and downpayment receipts. (These do NOT affect regular Sales Invoices).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewTemplate(downpaymentTemplate as InvoiceTemplateId)}
                className="h-8 gap-1.5 font-bold text-xs uppercase tracking-wider border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview Active
              </Button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {[
                {
                  id: 'auto_dealership' as const,
                  name: 'Dealership Slip',
                  formatTag: 'Showroom Official',
                  description: 'Red & Slate dual-tone dealership header with vehicle specs box, Form 21 compliance, and dual sign.',
                },
                {
                  id: 'auto_modern' as const,
                  name: 'Modern Drive',
                  formatTag: 'Digital VIN Card',
                  description: 'Dark-gradient hero voucher with vehicle badge card, financial allotment breakdown, and UPI QR.',
                },
                {
                  id: 'auto_classic' as const,
                  name: 'Corporate RTO Order',
                  formatTag: 'Vehicle Particulars',
                  description: 'Traditional corporate automotive grid with boxed vehicle particulars table, booking terms, and cashier seal.',
                },
                {
                  id: 'auto_executive' as const,
                  name: 'Executive Luxury',
                  formatTag: 'Luxury Navy/Gold',
                  description: 'Premium dealership certificate with vehicle allocation table, loan hypothecation details, and manager sign.',
                },
                {
                  id: 'auto_compact' as const,
                  name: 'Compact Counter',
                  formatTag: 'Quick Token Slip',
                  description: 'Monospace quick counter slip designed for 2W & 4W instant booking token and advance deposits.',
                }
              ].map((tpl) => {
                const isActive = downpaymentTemplate === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    className={cn(
                      "group relative rounded-xl border p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer bg-card",
                      isActive
                        ? "border-amber-600 bg-amber-500/[0.02] ring-2 ring-amber-500/25 shadow-md"
                        : "border-border hover:border-amber-500/40"
                    )}
                    onClick={() => handleDownpaymentTemplateSelect(tpl.id)}
                  >
                    {isActive && (
                      <div className="absolute -top-2.5 -right-2 bg-amber-600 text-white text-[9px] font-black uppercase tracking-wider py-0.5 px-2.5 rounded-full shadow-sm flex items-center gap-1 z-10">
                        <Check className="w-3 h-3 stroke-[3]" />
                        Active
                      </div>
                    )}

                    <div className="space-y-3">
                      <div
                        className="h-52 w-full rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 overflow-hidden relative flex justify-center items-start pt-2 px-2 shadow-inner select-none group-hover:border-amber-500/50 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplate(tpl.id);
                        }}
                      >
                        <div
                          className="origin-top transition-transform duration-300 pointer-events-none"
                          style={{
                            width: tpl.id === 'auto_compact' ? '440px' : '794px',
                            transform: tpl.id === 'auto_compact' ? 'scale(0.48)' : 'scale(0.26)',
                            transformOrigin: 'top center',
                          }}
                        >
                          <div className="bg-white text-slate-900 shadow-md border border-slate-300 rounded-sm pointer-events-none overflow-hidden">
                            <InvoiceTemplate
                              template={tpl.id}
                              invoice={sampleAutoData.invoice}
                              client={sampleAutoData.client}
                              items={sampleAutoData.items}
                              company={sampleAutoData.company}
                            />
                          </div>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 py-2 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-bold text-white flex items-center gap-1 drop-shadow">
                            <Eye className="w-3 h-3 text-white" /> Click to preview full size
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <h4 className="font-bold text-sm text-foreground tracking-tight leading-none group-hover:text-amber-600 transition-colors">{tpl.name}</h4>
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60 shrink-0">
                            {tpl.formatTag}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-border flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs font-semibold gap-1.5 rounded-lg border-border hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplate(tpl.id);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        Preview
                      </Button>
                      <Button
                        variant={isActive ? "secondary" : "default"}
                        size="sm"
                        disabled={isActive}
                        className={cn(
                          "flex-1 h-8 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                          isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default opacity-100"
                            : "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownpaymentTemplateSelect(tpl.id);
                        }}
                      >
                        {isActive ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        ) : "Apply"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 flex items-start gap-3">
                <Car className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-foreground">Complete Vehicle &amp; Service Specifications Capture</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Captures Vehicle Number, Model, Total KM, 3 Free Services, Next Service Auto (+2,500 KM / 1 Mo), and Hypothecation directly on the invoice receipt.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-foreground">RTO / Dealership Booking Compliance</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Fully formatted for vehicle dealership booking advance receipts, Form 21 sale certificates, and bank hypothecation clearance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

