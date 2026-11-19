/**
 * TemplateViewer — Public standalone page for mobile app WebView integration & live template view.
 * URL: /view-template/:userId/:templateId?invoiceId=<uuid|invoice_number>
 *
 * Designed for Flutter / React Native WebViews, browser previews, and direct printing.
 * Works seamlessly whether authenticated or unauthenticated.
 */
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase, serviceSupabase } from '@/integrations/supabase/client';
import { InvoiceTemplate } from '@/components/InvoiceTemplate';
import { AutoInvoiceTemplate, AutoTemplateId } from '@/components/AutoInvoiceTemplate';
import { PurchaseBillTemplate, PurchaseTemplateId } from '@/components/PurchaseBillTemplate';
import { EInvoiceTemplate } from '@/components/EInvoiceTemplate';
import { EWayBillTemplate } from '@/components/EWayBillTemplate';
import { ResponsiveInvoiceWrapper } from '@/components/ResponsiveInvoiceWrapper';
import { InvoiceTemplateId, InvoiceData, ClientData, CompanyData, ItemData } from '@/types/invoice';
import { Loader2, Printer, CheckCircle2, Sparkles, Building2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateInvoicePDFBlob, generatePurchaseBillPDFBlob } from '@/utils/invoicePDF';

// ---------------------------------------------------------------------------
// Helpers & Types
// ---------------------------------------------------------------------------

const db = serviceSupabase || supabase;

const SALES_TEMPLATE_SET = new Set<string>([
  'modern', 'classic', 'corporate', 'creative', 'retail',
  'professional', 'elegant', 'minimal', 'thermal', 'export'
]);

const AUTO_TEMPLATE_SET = new Set<string>([
  'automobile', 'auto_dealership', 'auto_modern', 'auto_classic', 'auto_executive', 'auto_compact'
]);

const PURCHASE_TEMPLATE_SET = new Set<string>([
  'purchase', 'classic-blue', 'commercial-erp', 'tax-itc', 'grn', 'standard'
]);

export const TemplateViewer: React.FC = () => {
  const { userId, templateId } = useParams<{ userId: string; templateId: string }>();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoiceId') ?? undefined;

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Record<string, any> | null>(null);
  const [invoice, setInvoice] = useState<Record<string, any> | null>(null);
  const [client, setClient] = useState<Record<string, any> | null>(null);
  const [isSampleData, setIsSampleData] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const rawTemplate = (templateId || 'modern').toLowerCase();

  // -------------------------------------------------------------------------
  // Data fetch
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        let targetUid = userId?.trim() || '';

        // 1. Resolve 'me', 'current', or empty to current logged in user if available
        if (!targetUid || targetUid === 'me' || targetUid === 'current' || targetUid === 'my') {
          try {
            const { data: authData } = await supabase.auth.getUser();
            if (authData?.user?.id) {
              targetUid = authData.user.id;
            }
          } catch {
            // Ignore auth check errors in public context
          }
        }

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUid);
        let profileResult: Record<string, any> | null = null;

        // 2. Fetch business profile from Supabase if valid UUID or email is provided
        if (isUuid) {
          try {
            const { data, error } = await (db as any)
              .from('profiles')
              .select('*')
              .eq('user_id', targetUid)
              .maybeSingle();

            if (!error && data) {
              profileResult = data;
            }
          } catch (err) {
            console.warn('[TemplateViewer] Profile fetch error by UUID:', err);
          }
        } else if (targetUid.includes('@')) {
          try {
            const { data, error } = await (db as any)
              .from('profiles')
              .select('*')
              .eq('email', targetUid)
              .maybeSingle();

            if (!error && data) {
              profileResult = data;
            }
          } catch (err) {
            console.warn('[TemplateViewer] Profile fetch error by email:', err);
          }
        }

        // 3. Graceful fallback for Demo / Preview / Anonymous mode
        if (!profileResult) {
          setIsSampleData(true);
          profileResult = {
            company_name: 'Escrow Technologies Pvt Ltd',
            gstin: '07AAAAA0000A1Z5',
            phone: '+91 98765 43210',
            mobile: '+91 98765 43210',
            email: 'accounts@escrowbms.in',
            website: 'https://bill.escrowbms.in',
            business_address: 'Plot No. 42, Cyber Hub, DLF Phase 2, Gurugram, Haryana 122002',
            city: 'Gurugram',
            state: 'Haryana',
            pincode: '122002',
            logo_url: null,
            bank_name: 'HDFC Bank Ltd',
            account_number: '50100123456789',
            ifsc_code: 'HDFC0000123',
            bank_branch: 'Cyber City Branch',
            signature_url: null,
            account_holder_name: 'Escrow Technologies Pvt Ltd',
            account_type: 'Current Account',
            upi_id: 'escrow@hdfcbank'
          };
        }

        if (cancelled) return;
        setCompany(profileResult);

        // 4. Fetch specific invoice if invoiceId is provided
        let fetchedInvoice: Record<string, any> | null = null;
        let fetchedClient: Record<string, any> | null = null;

        if (invoiceId) {
          const isInvUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invoiceId);
          try {
            let invQuery = (db as any).from('invoices').select('*, clients(*)');
            if (isInvUuid) {
              invQuery = invQuery.eq('id', invoiceId);
            } else {
              invQuery = invQuery.eq('invoice_number', invoiceId);
            }

            if (isUuid && profileResult?.user_id) {
              invQuery = invQuery.eq('user_id', profileResult.user_id);
            }

            const { data: invRows, error: invErr } = await invQuery.limit(1);
            if (!invErr && invRows && invRows.length > 0) {
              fetchedInvoice = invRows[0];

              // Sync real company profile if invoice belongs to a user
              if (fetchedInvoice.user_id && (!profileResult || isSampleData || profileResult.user_id !== fetchedInvoice.user_id)) {
                try {
                  const { data: realProf } = await (db as any)
                    .from('profiles')
                    .select('*')
                    .eq('user_id', fetchedInvoice.user_id)
                    .maybeSingle();
                  if (realProf) {
                    profileResult = realProf;
                    setIsSampleData(false);
                    if (!cancelled) setCompany(realProf);
                  }
                } catch {}
              }

              if (fetchedInvoice.clients) {
                fetchedClient = fetchedInvoice.clients;
              } else if (fetchedInvoice.client_id) {
                const { data: clientRow } = await (db as any)
                  .from('clients')
                  .select('*')
                  .eq('id', fetchedInvoice.client_id)
                  .maybeSingle();

                if (clientRow) {
                  fetchedClient = clientRow;
                }
              }

              // Fetch real invoice items so dummy items are not displayed
              const { data: itemRows } = await (db as any)
                .from('invoice_items')
                .select('*, products(id, name, description, hsn_code, unit, type, opening_stock)')
                .eq('invoice_id', fetchedInvoice.id)
                .order('created_at', { ascending: true });

              if (itemRows && itemRows.length > 0) {
                fetchedInvoice.items = itemRows.map((it: any) => ({
                  description: it.description || it.products?.name || '',
                  name: it.products?.name || it.name || it.description || '',
                  product_name: it.products?.name || it.product_name || it.description || '',
                  quantity: it.quantity ?? 1,
                  rate: it.rate ?? 0,
                  amount: it.amount ?? 0,
                  tax_rate: it.tax_rate ?? 0,
                  discount: it.discount ?? 0,
                  hsn_code: it.hsn_code || it.products?.hsn_code || '',
                  product: it.products
                }));
              }
            } else if (isPurchaseCategory) {
              // Fallback to purchase_invoices if template is purchase bill
              let purQuery = (db as any).from('purchase_invoices').select('*, vendors(*)');
              if (isInvUuid) {
                purQuery = purQuery.eq('id', invoiceId);
              } else {
                purQuery = purQuery.eq('invoice_number', invoiceId);
              }
              const { data: purRows } = await purQuery.limit(1);
              if (purRows && purRows.length > 0) {
                fetchedInvoice = purRows[0];
                if (fetchedInvoice.vendors) {
                  fetchedClient = fetchedInvoice.vendors;
                }
                const { data: purItems } = await (db as any)
                  .from('purchase_invoice_items')
                  .select('*, products(*)')
                  .eq('purchase_invoice_id', fetchedInvoice.id)
                  .order('created_at', { ascending: true });
                if (purItems) {
                  fetchedInvoice.items = purItems;
                }
              }
            }
          } catch (err) {
            console.warn('[TemplateViewer] Invoice fetch error:', err);
          }
        }

        if (cancelled) return;
        if (fetchedInvoice) {
          setInvoice(fetchedInvoice);
        }
        if (fetchedClient) {
          setClient(fetchedClient);
        }
      } catch (err) {
        console.warn('[TemplateViewer] Unexpected error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [userId, invoiceId]);

  // -------------------------------------------------------------------------
  // Realistic Fallback Datasets for Previews & WebViews
  // -------------------------------------------------------------------------

  const defaultSalesData = useMemo(() => ({
    invoice: {
      id: 'inv_sample_01',
      invoice_number: 'INV-2026-0042',
      issue_date: new Date().toISOString(),
      invoice_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 15 * 864e5).toISOString(),
      status: 'sent',
      subtotal: 18500,
      tax_amount: 3330,
      discount_amount: 500,
      total_amount: 21330,
      currency: rawTemplate === 'export' ? 'USD' : 'INR',
      notes: 'Thank you for your business! We appreciate your partnership and trust.',
      terms: '1. Please remit payment within 15 days of invoice date.\n2. Digital tax invoice generated via EscrowBill compliant with GST regulations.',
      items: [
        {
          description: 'Cloud Infrastructure Strategy & Architecture Setup',
          quantity: 1,
          rate: 12000,
          amount: 12000,
          tax_rate: 18,
          hsn_code: '998313'
        },
        {
          description: 'Annual Software License, Security Audit & Maintenance',
          quantity: 1,
          rate: 6500,
          amount: 6500,
          tax_rate: 18,
          hsn_code: '998315'
        }
      ]
    },
    client: {
      name: 'Acme Enterprises India Pvt Ltd',
      email: 'billing@acme-enterprises.in',
      phone: '+91 98765 43210',
      address: 'Plot No. 18, Tech Horizon Park, Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka',
      postal_code: '560066',
      country: rawTemplate === 'export' ? 'United States' : 'India',
      gstin: '29ABCDE1234F1Z5'
    }
  }), [rawTemplate]);

  const defaultAutoData = useMemo(() => ({
    invoice: {
      id: 'auto_sample_01',
      invoice_number: 'BK-2026-0089',
      issue_date: new Date().toISOString(),
      invoice_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 7 * 864e5).toISOString(),
      status: 'paid',
      subtotal: 50000,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 50000,
      currency: 'INR',
      notes: 'Advance booking token received with thanks. Subject to vehicle allotment policy.',
      terms: '1. Booking token is refundable as per standard dealership cancellation norms.\n2. Balance payable prior to RTO registration and delivery.',
      vehicle_details: {
        model: 'Hyundai Creta SX (O) 1.5 Turbo DCT',
        color: 'Titan Grey Metallic',
        vehicleNo: 'Applied For / Temp Reg',
        regNo: 'TEMP-2026-DL-8891',
        chassisNo: 'MALC181CLPM982341',
        financer: 'HDFC Bank Auto Loan',
        deliveryDate: new Date(Date.now() + 10 * 864e5).toLocaleDateString('en-IN')
      },
      items: [
        {
          description: 'Advance Booking Token — Hyundai Creta SX(O) Petrol DCT',
          quantity: 1,
          rate: 50000,
          amount: 50000,
          tax_rate: 0
        }
      ]
    },
    client: {
      name: 'Rahul Sharma',
      phone: '+91 98112 33445',
      email: 'rahul.sharma@gmail.com',
      address: 'B-402, Green Valley Apartments, Sector 48',
      city: 'Gurugram',
      state: 'Haryana',
      postal_code: '122001',
      gstin: ''
    }
  }), []);

  const defaultPurchaseData = useMemo(() => ({
    invoice: {
      id: 'pur_sample_01',
      invoice_number: 'PB-2026-089',
      issue_date: new Date().toISOString(),
      invoice_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30 * 864e5).toISOString(),
      status: 'pending',
      subtotal: 24500,
      tax_amount: 4410,
      discount_amount: 1000,
      total_amount: 27910,
      currency: 'INR',
      notes: '1. Inward inventory verified by store manager.\n2. 100% ITC claimable under GST Section 16.',
      terms: 'Net 30 days payment by RTGS / Bank Cheque.',
      items: [
        { description: 'High Precision CNC Milling Components', quantity: 25, rate: 800, amount: 20000, tax_rate: 18, hsn_code: '846693' },
        { description: 'Industrial Grade Fasteners & Fixtures', quantity: 15, rate: 300, amount: 4500, tax_rate: 18, hsn_code: '731815' }
      ]
    },
    vendor: {
      name: 'Apex Industrial Supplies Pvt Ltd',
      email: 'sales@apexsupplies.com',
      phone: '+91 98230 11223',
      address: 'Phase 3, Industrial Area, Sector 58',
      city: 'Noida',
      state: 'Uttar Pradesh',
      postal_code: '201301',
      country: 'India',
      gstin: '09AAACA1234E1Z1'
    }
  }), []);

  // Determine active invoice and client shapes
  const isAutoCategory = AUTO_TEMPLATE_SET.has(rawTemplate);
  const isPurchaseCategory = PURCHASE_TEMPLATE_SET.has(rawTemplate);

  const activeInvoice: any = invoice ?? (
    isAutoCategory ? defaultAutoData.invoice :
      isPurchaseCategory ? defaultPurchaseData.invoice :
        defaultSalesData.invoice
  );

  const activeClient: any = client ?? (
    isAutoCategory ? defaultAutoData.client :
      isPurchaseCategory ? defaultPurchaseData.vendor :
        defaultSalesData.client
  );

  const issueDate: string =
    activeInvoice?.issue_date ?? activeInvoice?.invoice_date ?? new Date().toISOString();

  const normalizedInvoice: any = { ...activeInvoice, issue_date: issueDate };

  const companyForTemplate = {
    company_name: company?.company_name ?? 'Your Business Name',
    gstin: company?.gstin ?? '',
    phone: company?.phone ?? company?.mobile ?? '',
    mobile: company?.mobile ?? company?.phone ?? '',
    email: company?.email ?? '',
    website: company?.website ?? '',
    business_address: company?.business_address ?? '',
    city: company?.city ?? '',
    state: company?.state ?? '',
    pincode: company?.pincode ?? '',
    logo_url: company?.logo_url ?? null,
    bank_name: company?.bank_name ?? '',
    account_number: company?.account_number ?? company?.bank_account ?? '',
    ifsc_code: company?.ifsc_code ?? company?.bank_ifsc ?? '',
    bank_branch: company?.bank_branch ?? '',
    signature_url: company?.signature_url ?? company?.authorized_signature_url ?? null,
    upi_id: company?.upi_id ?? '',
    upi_qr_url: company?.upi_qr_url ?? '',
    account_holder_name: company?.account_holder_name ?? company?.company_name ?? '',
    account_type: company?.account_type ?? 'Current Account'
  };

  const rawItems: any[] = Array.isArray(activeInvoice.items) && activeInvoice.items.length > 0
    ? activeInvoice.items
    : (isAutoCategory ? defaultAutoData.invoice.items : isPurchaseCategory ? defaultPurchaseData.invoice.items : defaultSalesData.invoice.items);

  // -------------------------------------------------------------------------
  // Render Matching Template
  // -------------------------------------------------------------------------
  function renderTemplate() {
    // 1. Automobile Templates
    if (isAutoCategory) {
      const autoTplId: AutoTemplateId =
        rawTemplate === 'automobile' ? 'auto_classic' : (rawTemplate as AutoTemplateId);

      return (
        <AutoInvoiceTemplate
          template={autoTplId}
          invoice={normalizedInvoice}
          client={activeClient}
          items={rawItems}
          company={companyForTemplate}
        />
      );
    }

    // 2. Purchase Bill Templates
    if (isPurchaseCategory) {
      const purTplId: PurchaseTemplateId =
        rawTemplate === 'purchase' ? 'classic-blue' : (rawTemplate as PurchaseTemplateId);

      const purchaseCompany = {
        company_name: companyForTemplate.company_name,
        gstin: companyForTemplate.gstin,
        phone: companyForTemplate.phone,
        business_address: companyForTemplate.business_address,
        logo_url: companyForTemplate.logo_url ?? undefined,
        signature_url: companyForTemplate.signature_url ?? undefined,
      };

      return (
        <PurchaseBillTemplate
          template={purTplId}
          invoice={normalizedInvoice}
          vendor={activeClient}
          company={purchaseCompany}
          items={rawItems}
        />
      );
    }

    // 3. GST E-Invoice
    if (rawTemplate === 'e-invoice' || rawTemplate === 'einvoice') {
      const eInvoiceProfile = {
        company_name: companyForTemplate.company_name,
        business_address: companyForTemplate.business_address,
        gstin: companyForTemplate.gstin,
        phone: companyForTemplate.phone,
        bank_name: companyForTemplate.bank_name,
        account_number: companyForTemplate.account_number,
        ifsc_code: companyForTemplate.ifsc_code,
        account_holder_name: companyForTemplate.account_holder_name,
        signature_url: companyForTemplate.signature_url,
        logo_url: companyForTemplate.logo_url ?? undefined,
      };

      const eInvoiceData = {
        invoice_type: 'TAX INVOICE',
        invoice_number: normalizedInvoice.invoice_number ?? 'INV-2026-0042',
        invoice_date: normalizedInvoice.issue_date,
        place_of_supply: normalizedInvoice.place_of_supply ?? '07-Delhi',
        reverse_charge: normalizedInvoice.reverse_charge ?? 'N',
        subtotal: normalizedInvoice.subtotal ?? 18500,
        tax_amount: normalizedInvoice.tax_amount ?? 3330,
        total_amount: normalizedInvoice.total_amount ?? 21330,
        notes: normalizedInvoice.notes ?? '',
        irn: normalizedInvoice.irn ?? '4b5f8c6e2a1d9e7f3b8a0c2d4e6f8a1b3c5e7d9f0a2b4c6e8d0f2a4b6c8e0d2',
        ack_no: normalizedInvoice.ack_no ?? '112026987654321',
        ack_date: normalizedInvoice.ack_date ?? new Date().toLocaleDateString('en-IN'),
      };

      return (
        <EInvoiceTemplate
          invoice={eInvoiceData}
          client={activeClient}
          items={rawItems}
          profile={eInvoiceProfile}
        />
      );
    }

    // 4. E-Way Bill
    if (rawTemplate === 'e-way-bill' || rawTemplate === 'eway' || rawTemplate === 'ewaybill') {
      const eWayProfile = {
        company_name: companyForTemplate.company_name,
        business_address: companyForTemplate.business_address,
        gstin: companyForTemplate.gstin,
        phone: companyForTemplate.phone,
      };

      const eWayBillData = {
        document_type: normalizedInvoice.document_type ?? 'Tax Invoice',
        document_number: normalizedInvoice.invoice_number ?? 'INV-2026-0042',
        document_date: normalizedInvoice.issue_date,
        transaction_type: normalizedInvoice.transaction_type ?? 'Regular',
        from_address: companyForTemplate.business_address,
        from_gstin: companyForTemplate.gstin,
        to_address: activeClient.address ?? '',
        to_gstin: activeClient.gstin ?? '',
        vehicle_number: normalizedInvoice.vehicle_no ?? 'HR 26 DQ 7890',
        transport_mode: normalizedInvoice.transport_mode ?? 'Road',
        distance: normalizedInvoice.distance ?? '240 km',
        transporter_name: normalizedInvoice.transporter_name ?? 'SafeXpress Logistics Ltd',
        total_value: normalizedInvoice.total_amount ?? 21330,
        eway_bill_no: normalizedInvoice.ewb_no ?? '281098273645',
        valid_until: normalizedInvoice.valid_until ?? new Date(Date.now() + 48 * 3600 * 1000).toLocaleString('en-IN'),
      };

      return (
        <EWayBillTemplate
          eWayBillData={eWayBillData}
          client={activeClient}
          items={rawItems}
          profile={eWayProfile}
        />
      );
    }

    // 5. Standard Sales GST Invoices (default: modern)
    const salesTplId: InvoiceTemplateId = SALES_TEMPLATE_SET.has(rawTemplate)
      ? (rawTemplate as InvoiceTemplateId)
      : 'modern';

    return (
      <InvoiceTemplate
        template={salesTplId}
        invoice={normalizedInvoice}
        client={activeClient}
        items={rawItems}
        company={companyForTemplate}
      />
    );
  }

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Loading document template…
          </p>
        </div>
      </div>
    );
  }

  // Max width optimization for thermal / compact vouchers
  const wrapperMaxWidth =
    rawTemplate === 'thermal' ? 380 :
      rawTemplate === 'auto_compact' ? 440 : 800;

  const handleDownloadPDF = async () => {
    if (downloading) return;
    setDownloading(true);

    try {
      const invNumber = normalizedInvoice.invoice_number || 'document';
      const cleanInvNum = invNumber.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${cleanInvNum}.pdf`;

      // 1. Check if public PDF already exists in Supabase storage (company-assets)
      let publicPdfUrl: string | null = null;
      const targetUserId = activeInvoice?.user_id || company?.user_id;

      if (targetUserId && activeInvoice?.id) {
        const folder = isPurchaseCategory ? 'purchase-invoices' : 'invoices';
        const invoiceDir = `${targetUserId}/${folder}/${activeInvoice.id}`;
        try {
          const { data: fileList } = await db.storage
            .from('company-assets')
            .list(invoiceDir);
          const matched = fileList?.find((f: any) => f.name && f.name.toLowerCase().endsWith('.pdf'));
          if (matched?.name) {
            const { data: pubData } = db.storage
              .from('company-assets')
              .getPublicUrl(`${invoiceDir}/${matched.name}`);
            if (pubData?.publicUrl) {
              publicPdfUrl = `${pubData.publicUrl}?t=${Date.now()}`;
            }
          }
        } catch (e) {
          console.warn('[TemplateViewer] Storage list check failed:', e);
        }
      }

      // 2. Generate PDF blob
      let blob: Blob;

      if (isPurchaseCategory) {
        const purchaseCompany = {
          company_name: companyForTemplate.company_name,
          gstin: companyForTemplate.gstin,
          phone: companyForTemplate.phone,
          business_address: companyForTemplate.business_address,
          logo_url: companyForTemplate.logo_url ?? undefined,
          signature_url: companyForTemplate.signature_url ?? undefined,
        };
        const purTplId: PurchaseTemplateId =
          rawTemplate === 'purchase' ? 'classic-blue' : (rawTemplate as PurchaseTemplateId);

        blob = await generatePurchaseBillPDFBlob(
          normalizedInvoice,
          activeClient,
          rawItems,
          purchaseCompany,
          purTplId
        );
      } else {
        const salesTplId: InvoiceTemplateId = SALES_TEMPLATE_SET.has(rawTemplate)
          ? (rawTemplate as InvoiceTemplateId)
          : (isAutoCategory ? 'auto_classic' : 'corporate');

        const invoiceData: InvoiceData = {
          invoice_number: normalizedInvoice.invoice_number || 'INV-0001',
          issue_date: normalizedInvoice.issue_date,
          due_date: normalizedInvoice.due_date || normalizedInvoice.issue_date,
          status: normalizedInvoice.status || 'paid',
          subtotal: Number(normalizedInvoice.subtotal || 0),
          tax_amount: Number(normalizedInvoice.tax_amount || 0),
          discount_amount: Number(normalizedInvoice.discount_amount || 0),
          total_amount: Number(normalizedInvoice.total_amount || 0),
          currency: normalizedInvoice.currency || 'INR',
          notes: normalizedInvoice.notes || '',
          terms: normalizedInvoice.terms || '',
          vehicle_details: normalizedInvoice.vehicle_details
        };

        const clientData: ClientData = {
          name: activeClient.name || 'Customer',
          email: activeClient.email || '',
          phone: activeClient.phone || '',
          address: activeClient.address || '',
          city: activeClient.city || '',
          state: activeClient.state || '',
          postal_code: activeClient.postal_code || activeClient.pincode || '',
          country: activeClient.country || 'India',
          gstin: activeClient.gstin || '',
          hide_contact_details: activeClient.hide_contact_details || false
        };

        const formattedItems: ItemData[] = rawItems.map((item: any) => ({
          description: item.description || item.product_name || item.name || '',
          name: item.name || item.product_name || item.description || '',
          product_name: item.product_name || item.name || item.description || '',
          quantity: Number(item.quantity || 1),
          rate: Number(item.rate || 0),
          tax_rate: Number(item.tax_rate || 0),
          discount: Number(item.discount || 0),
          amount: Number(item.amount || 0),
          hsn_code: item.hsn_code || item.products?.hsn_code || '',
          product: item.product || item.products
        }));

        const companyData: CompanyData = {
          company_name: companyForTemplate.company_name,
          email: companyForTemplate.email || company?.email || '',
          phone: companyForTemplate.phone,
          mobile: companyForTemplate.mobile || companyForTemplate.phone,
          business_address: companyForTemplate.business_address,
          gstin: companyForTemplate.gstin,
          logo_url: companyForTemplate.logo_url || '',
          website: companyForTemplate.website || '',
          signature_url: companyForTemplate.signature_url || '',
          bank_name: companyForTemplate.bank_name,
          account_number: companyForTemplate.account_number,
          ifsc_code: companyForTemplate.ifsc_code,
          account_holder_name: companyForTemplate.account_holder_name,
          account_type: companyForTemplate.account_type,
          hide_company_details: false,
          upi_id: companyForTemplate.upi_id,
          upi_qr_url: companyForTemplate.upi_qr_url,
        };

        blob = await generateInvoicePDFBlob(
          invoiceData,
          clientData,
          formattedItems,
          companyData,
          salesTplId
        );
      }

      // 3. Upload to Supabase Storage if not existing so mobile webview has a permanent HTTPS URL
      if (!publicPdfUrl && targetUserId && activeInvoice?.id) {
        try {
          const folder = isPurchaseCategory ? 'purchase-invoices' : 'invoices';
          const fullPath = `${targetUserId}/${folder}/${activeInvoice.id}/${fileName}`;
          await db.storage
            .from('company-assets')
            .upload(fullPath, blob, { upsert: true, contentType: 'application/pdf' });
          const { data: pubData } = db.storage
            .from('company-assets')
            .getPublicUrl(fullPath);
          if (pubData?.publicUrl) {
            publicPdfUrl = `${pubData.publicUrl}?t=${Date.now()}`;
          }
        } catch (uploadErr) {
          console.warn('[TemplateViewer] Uploading generated PDF failed:', uploadErr);
        }
      }

      // 4. Trigger download & viewing
      const blobUrl = URL.createObjectURL(blob);
      const targetDownloadUrl = publicPdfUrl || blobUrl;

      const a = document.createElement('a');
      a.href = targetDownloadUrl;
      a.download = fileName;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();

      // Mobile WebView Fallback: In-app browsers often ignore <a download>.
      // Direct navigation to the PDF URL forces mobile browser to download or open the PDF viewer.
      const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
      if (isMobileDevice) {
        if (publicPdfUrl) {
          window.location.href = publicPdfUrl;
        } else {
          window.open(blobUrl, '_blank');
        }
      }

      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
      }, 1000);

    } catch (err) {
      console.error('[TemplateViewer] handleDownloadPDF error:', err);
      // Fallback: try window.print() if browser supports it
      try {
        window.print();
      } catch {}
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-start py-4 px-2 sm:px-4">
      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; background: white !important; }
          .print-clean { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      {/* Top Banner (Hidden in Print) */}
      <div className="no-print w-full max-w-4xl mx-auto mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                {companyForTemplate.company_name}
              </span>
              {isSampleData && (
                <Badge variant="outline" className="text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 px-1.5 py-0">
                  <Sparkles className="w-2.5 h-2.5" /> Sample Preview
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">
              Layout Style: <span className="font-bold uppercase text-foreground">{rawTemplate}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloading}
            size="sm"
            className="flex-1 sm:flex-initial h-10 sm:h-9 rounded-xl font-bold text-xs gap-2 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-95"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {downloading ? 'Preparing PDF...' : 'Print / Download PDF'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            size="sm"
            className="hidden sm:inline-flex h-9 rounded-xl font-bold text-xs gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </Button>
        </div>
      </div>

      {/* Main Document Presentation */}
      <div className="w-full flex justify-center">
        <ResponsiveInvoiceWrapper maxWidth={wrapperMaxWidth}>
          <div className="shadow-2xl ring-1 ring-slate-900/10 rounded-sm bg-white dark:bg-slate-900 overflow-hidden print-clean">
            {renderTemplate()}
          </div>
        </ResponsiveInvoiceWrapper>
      </div>

      {/* Floating Bottom Print Action for Mobile WebViews */}
      <div className="no-print fixed bottom-5 right-5 z-50 sm:hidden">
        <Button
          type="button"
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="rounded-full h-12 px-5 shadow-2xl bg-primary text-primary-foreground font-bold text-xs gap-2 transition-all active:scale-95"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {downloading ? 'Preparing...' : 'Download PDF'}
        </Button>
      </div>
    </div>
  );
};

export default TemplateViewer;
