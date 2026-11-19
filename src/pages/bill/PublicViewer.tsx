import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, serviceSupabase } from '@/integrations/supabase/client';
import { FileText, Download, Loader2, AlertCircle, ExternalLink, Printer, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchFullInvoiceData, formatInvoiceData, formatClientData, formatCompanyData } from '@/utils/invoice-service';
import { generateInvoicePDFBlob } from '@/utils/invoicePDF';

export const PublicViewer: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function resolveAndRedirect() {
      if (!code) {
        if (isMounted) {
          setError('Invalid or missing invoice link code.');
          setLoading(false);
        }
        return;
      }

      const rawCode = decodeURIComponent(code).trim();
      const cleanCode = rawCode.replace(/^#+/, '');
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanCode);
      const client = serviceSupabase || supabase;

      try {
        // 1. If code is a UUID or has invoiceId in shortlink, look up exact record first
        // Only check system_settings shortlinks if cleanCode has shortlink prefix or is an exact unique ID
        if (isUuid) {
          const { data: exactLink } = await (client as any)
            .from('system_settings')
            .select('key, value')
            .eq('key', `shortlink_${cleanCode}`)
            .maybeSingle();

          if (exactLink?.value) {
            let parsed = exactLink.value;
            if (typeof parsed === 'string') {
              try { parsed = JSON.parse(parsed); } catch {}
            }
            const destinationUrl = typeof parsed === 'string' ? parsed : (parsed?.url || parsed?.pdfUrl);
            if (destinationUrl && typeof destinationUrl === 'string' && destinationUrl.startsWith('http')) {
              if (isMounted) {
                setTargetUrl(destinationUrl);
                setLoading(false);
              }
              return;
            }
          }
        }

        // 2. Primary: Search invoice by ID (if UUID) or exact invoice_number
        let invQuery = (client as any).from('invoices').select('id, user_id, invoice_number, notes, status, created_at');
        if (isUuid) {
          invQuery = invQuery.eq('id', cleanCode);
        } else {
          invQuery = invQuery.eq('invoice_number', cleanCode);
        }

        let { data: invoiceRows } = await invQuery
          .order('created_at', { ascending: false })
          .limit(1);

        // If not found with exact match and not uuid, try with '#' prefix or case-insensitive
        if ((!invoiceRows || invoiceRows.length === 0) && !isUuid) {
          const { data: retryRows } = await (client as any)
            .from('invoices')
            .select('id, user_id, invoice_number, notes, status, created_at')
            .or(`invoice_number.eq.#${cleanCode},invoice_number.ilike.${cleanCode}`)
            .order('created_at', { ascending: false })
            .limit(1);
          invoiceRows = retryRows;
        }

        const invoice = invoiceRows?.[0];

        if (invoice) {
          const invoiceDir = `${invoice.user_id}/invoices/${invoice.id}`;
          let matchedFileName: string | null = null;

          try {
            const { data: fileList } = await client.storage
              .from('company-assets')
              .list(invoiceDir);
            const pdfFile = fileList?.find((f: any) => f.name && f.name.toLowerCase().endsWith('.pdf'));
            if (pdfFile?.name) {
              matchedFileName = pdfFile.name;
            }
          } catch (e) {
            // list fallback
          }

          if (matchedFileName) {
            const fullPath = `${invoiceDir}/${matchedFileName}`;
            const { data: pubData } = client.storage
              .from('company-assets')
              .getPublicUrl(fullPath);

            if (pubData?.publicUrl) {
              const finalUrl = `${pubData.publicUrl}?t=${Date.now()}`;
              if (isMounted) {
                setTargetUrl(finalUrl);
                setLoading(false);
              }
              return;
            }
          } else {
            // PDF has not been uploaded to company-assets yet. Generate and save on the fly!
            try {
              const { invoice: freshInvoice, items, client: freshClient, settings, profile } = await fetchFullInvoiceData(invoice.id, invoice.user_id);
              const invoiceData = formatInvoiceData(freshInvoice, (settings as any)?.default_terms, (settings as any)?.default_payment_terms);
              const clientData = formatClientData(freshClient);
              const companyData = formatCompanyData(profile, '');
              const formattedItems = (items || []).map((item: any) => ({
                description: item.description,
                product_name: item.product_name || item.products?.name || item.name || '',
                name: item.name || item.product_name || item.products?.name || '',
                quantity: item.quantity,
                rate: item.rate,
                tax_rate: item.tax_rate,
                discount: item.discount || 0,
                amount: item.amount,
                hsn_code: item.hsn_code || item.products?.hsn_code || '',
                product: item.products || item.product
              }));
              const isDp = Boolean(
                freshInvoice.invoice_number?.startsWith('DP-') ||
                freshInvoice.invoice_number?.startsWith('DP') ||
                freshInvoice.invoice_number?.startsWith('BK-') ||
                freshInvoice.invoice_number?.startsWith('BK') ||
                freshInvoice.notes?.includes('"is_downpayment":true')
              );
              const isCafe = Boolean(
                freshInvoice.notes?.includes('[Order:') ||
                (profile as any)?.user_type === 'cafe'
              );
              const template = isDp
                ? 'auto_classic'
                : (settings?.invoice_template && !settings.invoice_template.startsWith('auto_'))
                  ? settings.invoice_template
                  : (isCafe ? 'thermal' : 'corporate');
              const blob = await generateInvoicePDFBlob(
                invoiceData,
                clientData as any,
                formattedItems as any,
                companyData as any,
                template as any
              );
              const targetFileName = isDp
                ? `downpayment-${freshInvoice.invoice_number}.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_')
                : `invoice-${freshInvoice.invoice_number}.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_');
              const fullPath = `${invoiceDir}/${targetFileName}`;

              await client.storage
                .from('company-assets')
                .upload(fullPath, blob, { upsert: true, contentType: 'application/pdf' });

              const { data: pubData } = client.storage
                .from('company-assets')
                .getPublicUrl(fullPath);

              if (pubData?.publicUrl) {
                const finalUrl = `${pubData.publicUrl}?t=${Date.now()}`;
                if (isMounted) {
                  setTargetUrl(finalUrl);
                  setLoading(false);
                }
                return;
              }
            } catch (genErr) {
              console.warn('Could not auto-generate PDF in PublicViewer:', genErr);
            }
          }
        }

        // 3. Fallback: Search purchase_invoices
        let purQuery = (client as any).from('purchase_invoices').select('id, user_id, invoice_number');
        if (isUuid) {
          purQuery = purQuery.eq('id', cleanCode);
        } else {
          purQuery = purQuery.ilike('invoice_number', cleanCode);
        }

        const { data: purRows } = await purQuery
          .order('created_at', { ascending: false })
          .limit(1);

        const purInv = purRows?.[0];

        if (purInv) {
          const purDir = `${purInv.user_id}/purchase-invoices/${purInv.id}`;
          let matchedFileName: string | null = null;

          try {
            const { data: purFileList } = await client.storage
              .from('company-assets')
              .list(purDir);
            const pdfFile = purFileList?.find((f: any) => f.name && f.name.toLowerCase().endsWith('.pdf'));
            if (pdfFile?.name) {
              matchedFileName = pdfFile.name;
            }
          } catch (e) {}

          if (matchedFileName) {
            const fullPath = `${purDir}/${matchedFileName}`;
            const { data: pubData } = client.storage
              .from('company-assets')
              .getPublicUrl(fullPath);

            if (pubData?.publicUrl) {
              const finalUrl = `${pubData.publicUrl}?t=${Date.now()}`;
              if (isMounted) {
                setTargetUrl(finalUrl);
                setLoading(false);
              }
              return;
            }
          }
        }

        if (isMounted) {
          setError(`Invoice receipt #${cleanCode} could not be located or has expired.`);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError('Unable to load receipt at this moment. Please check the link or contact the issuer.');
          setLoading(false);
        }
      }
    }

    resolveAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [code]);

  const downloadUrl = React.useMemo(() => {
    if (!targetUrl) return '';
    if (targetUrl.startsWith('blob:')) return targetUrl;
    const filename = `Invoice-${code}.pdf`;
    if (targetUrl.includes('supabase.co')) {
      const sep = targetUrl.includes('?') ? '&' : '?';
      return `${targetUrl}${sep}download=${encodeURIComponent(filename)}`;
    }
    return targetUrl;
  }, [targetUrl, code]);

  const isDirectDownloadable = Boolean(
    targetUrl && (targetUrl.startsWith('blob:') || targetUrl.includes('supabase.co'))
  );

  const handleDownloadClick = async (e: React.MouseEvent) => {
    if (!targetUrl) return;
    if (isDirectDownloadable) {
      return;
    }
    e.preventDefault();
    try {
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error('Download fetch failed');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `Invoice-${code}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    } catch {
      window.open(targetUrl, '_blank');
    }
  };

  if (targetUrl) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 shadow-xs">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                EB
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Invoice #{code}</span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Escrow Bill Verified Document</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex h-9 text-xs font-semibold gap-1.5">
                <a href={targetUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Full Screen
                </a>
              </Button>
              <Button asChild size="sm" className="h-9 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
                <a href={downloadUrl} download={`Invoice-${code}.pdf`} onClick={handleDownloadClick} target="_blank" rel="noopener noreferrer">
                  <Download className="w-3.5 h-3.5" />
                  {isDirectDownloadable ? 'Download PDF' : 'Save PDF'}
                </a>
              </Button>
            </div>
          </div>
        </header>

        {/* Embedded PDF Document Viewer (Native Object Viewer with High-Fidelity Fallback) */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-2 sm:p-4 flex flex-col gap-3">
          <div className="flex-1 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative min-h-[75vh] flex flex-col">
            <object
              data={targetUrl}
              type="application/pdf"
              className="w-full h-full min-h-[75vh] md:min-h-[82vh] rounded-xl flex-1 border-0"
            >
              {/* Fallback displayed automatically when browser blocks cross-origin PDF embedding */}
              <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh] space-y-4 bg-white dark:bg-slate-900 m-auto">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Official Invoice #{code}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Your verified document has been generated and is ready to view. Click below to view the official PDF in full resolution or save it to your device.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Button asChild size="default" className="font-bold bg-primary hover:bg-primary/90 text-white shadow-xs">
                    <a href={targetUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Full PDF Document
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="default" className="font-bold">
                    <a href={downloadUrl} download={`Invoice-${code}.pdf`} onClick={handleDownloadClick} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      {isDirectDownloadable ? 'Download PDF' : 'Save PDF'}
                    </a>
                  </Button>
                </div>
              </div>
            </object>
          </div>

          {/* Mobile Bottom Download & Fallback Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 text-center sm:text-left">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <span>Tap below to download the official verified invoice PDF directly.</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button asChild size="sm" variant="outline" className="w-full sm:w-auto font-semibold h-9">
                <a href={targetUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Open in New Tab
                </a>
              </Button>
              <Button asChild size="sm" variant="default" className="w-full sm:w-auto font-bold h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
                <a href={downloadUrl} download={`Invoice-${code}.pdf`} onClick={handleDownloadClick} target="_blank" rel="noopener noreferrer">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  {isDirectDownloadable ? 'Download PDF' : 'Save PDF'}
                </a>
              </Button>
            </div>
          </div>
        </main>

        <footer className="py-3 text-center text-[11px] text-slate-400">
          Powered by <span className="font-semibold text-slate-600 dark:text-slate-300">Escrow Bill Cloud Invoicing</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 text-center space-y-6">
        {/* Brand / Logo */}
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
            EB
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-slate-100">
            ESCROW<span className="text-primary font-normal">BILL</span>
          </span>
        </div>

        {loading ? (
          <div className="py-8 space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Opening Receipt #{code || '...'}
              </h2>
              <p className="text-xs text-slate-500">
                Preparing verified invoice document...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Document Unavailable</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">{error}</p>
            </div>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/">Back to Escrow Bill</Link>
            </Button>
          </div>
        ) : null}

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 text-[11px] text-slate-400">
          Secured and powered by <span className="font-semibold text-slate-600 dark:text-slate-300">Escrow Bill Cloud Invoicing</span>
        </div>
      </div>
    </div>
  );
};

export default PublicViewer;
