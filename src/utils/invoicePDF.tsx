import { InvoiceTemplate } from "@/components/InvoiceTemplate";
import React from "react";
import { createRoot } from "react-dom/client";
import { InvoiceData, ClientData, CompanyData, ItemData, InvoiceTemplateId } from "@/types/invoice";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import {
  PurchaseBillTemplate,
  PurchaseTemplateId,
  PurchaseInvoiceData,
  VendorDetails,
  CompanyDetails as PurchaseCompanyDetails,
  PurchaseItem
} from "@/components/PurchaseBillTemplate";

export const generateInvoiceHTML = async (
  invoice: InvoiceData,
  client: ClientData,
  items: ItemData[],
  company: CompanyData,
  template: InvoiceTemplateId = 'corporate',
  currencySymbol: string = '₹'
): Promise<string> => {
  const isThermal = template === 'thermal';
  const isCompact = isThermal || template === 'auto_compact';
  const targetWidth = isCompact ? 460 : 800;

  const tempContainer = document.createElement('div');
  tempContainer.className = 'invoice-html-temp-container';
  tempContainer.style.position = 'fixed';
  tempContainer.style.left = '0';
  tempContainer.style.top = '0';
  tempContainer.style.zIndex = '-99999';
  tempContainer.style.pointerEvents = 'none';
  tempContainer.style.opacity = '1';
  tempContainer.style.width = `${targetWidth}px`;
  tempContainer.style.background = '#ffffff';
  document.body.appendChild(tempContainer);

  const root = createRoot(tempContainer);

  try {
    root.render(
      <CurrencyProvider>
        <InvoiceTemplate
          invoice={invoice}
          client={client}
          items={items}
          company={company}
          template={template}
          currencySymbol={currencySymbol}
        />
      </CurrencyProvider>
    );

    // Wait for document fonts and React rendering
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {}
    }
    await new Promise(resolve => setTimeout(resolve, 400));

    const invoiceElement = tempContainer.querySelector('.invoice-template');
    if (!invoiceElement) {
      throw new Error('Invoice template did not render correctly');
    }

    const stylesheets = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            ${stylesheets}
            * {
              -webkit-font-smoothing: antialiased !important;
              -moz-osx-font-smoothing: grayscale !important;
              text-rendering: geometricPrecision !important;
              box-sizing: border-box !important;
            }
            body { 
              margin: 0; 
              padding: 0; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.45;
              background: #ffffff;
            }
            img {
              display: inline-block !important;
              vertical-align: middle !important;
            }
            .invoice-template {
              box-shadow: none !important;
              box-sizing: border-box !important;
              overflow: visible !important;
              margin: 0 auto !important;
            }
            .truncate, [class*="line-clamp"] {
              overflow: visible !important;
              text-overflow: clip !important;
              white-space: normal !important;
            }
            p, span, div, td, th {
              overflow: visible !important;
            }
            /* Lock desktop alignment on all devices */
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
            .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
            .sm\\:flex-row { flex-direction: row !important; }
            .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            .sm\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
            .sm\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
            .sm\\:text-right { text-align: right !important; }
            .sm\\:items-end { align-items: flex-end !important; }
            .sm\\:w-auto { width: auto !important; }
            .sm\\:justify-end { justify-content: flex-end !important; }
            .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            .md\\:flex-row { flex-direction: row !important; }
          </style>
        </head>
        <body>
          ${invoiceElement.outerHTML}
        </body>
      </html>
    `;
  } finally {
    root.unmount();
    if (tempContainer.parentNode) {
      document.body.removeChild(tempContainer);
    }
  }
};

export const generateInvoicePDFBlob = async (
  invoice: InvoiceData,
  client: ClientData,
  items: ItemData[],
  company: CompanyData,
  template: InvoiceTemplateId = 'corporate',
  currencySymbol: string = '₹'
): Promise<Blob> => {
  // Dynamically import heavy rendering libraries
  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');

  const isThermal = template === 'thermal';
  const isCompact = isThermal || template === 'auto_compact';
  const targetWidth = isCompact ? 460 : 800;

  // Render directly in live document DOM at fixed (0, 0)
  // This guarantees active Tailwind classes, Google Fonts, and React QR code SVGs render accurately
  const captureContainer = document.createElement('div');
  captureContainer.className = 'invoice-pdf-capture-container';
  captureContainer.style.position = 'fixed';
  captureContainer.style.left = '0';
  captureContainer.style.top = '0';
  captureContainer.style.zIndex = '-99999';
  captureContainer.style.pointerEvents = 'none';
  captureContainer.style.opacity = '1';
  captureContainer.style.width = `${targetWidth}px`;
  captureContainer.style.maxWidth = `${targetWidth}px`;
  captureContainer.style.background = '#ffffff';
  captureContainer.style.margin = '0';
  captureContainer.style.padding = '0';
  captureContainer.style.boxSizing = 'border-box';
  document.body.appendChild(captureContainer);

  const root = createRoot(captureContainer);

  try {
    root.render(
      <CurrencyProvider>
        <InvoiceTemplate
          invoice={invoice}
          client={client}
          items={items}
          company={company}
          template={template}
          currencySymbol={currencySymbol}
        />
      </CurrencyProvider>
    );

    // 1. Wait for document fonts to finish loading with safety timeout
    if (document.fonts?.ready) {
      try {
        await Promise.race([
          document.fonts.ready,
          new Promise(res => setTimeout(res, 600))
        ]);
      } catch {}
    }

    // 2. Allow React component render & layout stabilization
    await new Promise(resolve => setTimeout(resolve, 400));

    // 3. Ensure all images are fully loaded
    const images = Array.from(captureContainer.querySelectorAll('img'));
    await Promise.all(
      images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>(resolve => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 1500);
        });
      })
    );

    const invoiceEl = captureContainer.querySelector('.invoice-template') as HTMLElement | null;
    if (invoiceEl) {
      invoiceEl.style.boxShadow = 'none';
      invoiceEl.style.margin = '0 auto';
      invoiceEl.style.overflow = 'visible';
      // Reset any arbitrary minimum height constraints from templates (e.g. 297mm or 1000px)
      // so compact invoices take only their natural height and don't spill to page 2
      invoiceEl.style.minHeight = 'auto';

      if (!isCompact) {
        invoiceEl.style.width = '800px';
        invoiceEl.style.maxWidth = '800px';

        // An A4 page at 800px width with 20pt margin has content height = 1155.3px:
        // (841.89 - 40) / (595.28 - 40) * 800 = 1155.28px
        const EXACT_PAGE_HEIGHT_PX = 1155;
        const totalHeight = invoiceEl.scrollHeight || invoiceEl.offsetHeight;

        // Only insert page-break spacers if the invoice genuinely exceeds single-page scaling limit (> 1.28 pages)
        // Downpayment & automobile templates are single-page booking receipts and should NEVER have artificial spacers inserted
        if (!template.startsWith('auto_') && totalHeight > EXACT_PAGE_HEIGHT_PX * 1.28) {
          const breakables = invoiceEl.querySelectorAll('.avoid-break');
          const elements = Array.from(breakables) as HTMLElement[];

          elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const containerRect = invoiceEl.getBoundingClientRect();
            const top = rect.top - containerRect.top;
            const bottom = rect.bottom - containerRect.top;

            const pageOfTop = Math.floor(top / EXACT_PAGE_HEIGHT_PX);
            const pageOfBottom = Math.floor(bottom / EXACT_PAGE_HEIGHT_PX);

            if (pageOfTop !== pageOfBottom) {
              const spacerHeight = EXACT_PAGE_HEIGHT_PX - (top % EXACT_PAGE_HEIGHT_PX);
              if (spacerHeight > 0 && spacerHeight < 250) {
                const spacer = document.createElement('div');
                spacer.style.height = `${spacerHeight}px`;
                el.parentNode?.insertBefore(spacer, el);
              }
            }
          });
        }
      } else {
        invoiceEl.style.width = '100%';
        invoiceEl.style.maxWidth = `${targetWidth}px`;
      }
    }

    const captureTarget = invoiceEl || captureContainer;

    const html2canvasPromise = html2canvas(captureTarget, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      width: captureTarget.offsetWidth || targetWidth,
      windowWidth: targetWidth,
      logging: false,
      onclone: (clonedDoc) => {
        // Inject global style fixes for html2canvas baseline calculations
        const style = clonedDoc.createElement('style');
        style.textContent = `
          * {
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
            text-rendering: geometricPrecision !important;
            box-sizing: border-box !important;
          }
          img {
            display: inline-block !important;
            vertical-align: middle !important;
          }
          .truncate, [class*="line-clamp"] {
            overflow: visible !important;
            text-overflow: clip !important;
            white-space: normal !important;
          }
          p, span, div, td, th, h1, h2, h3, h4, h5, h6 {
            overflow: visible !important;
          }
          /* Lock desktop 2/3/4 column alignment even when generated on mobile devices */
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
          .sm\\:flex-row { flex-direction: row !important; }
          .sm\\:flex-col { flex-direction: column !important; }
          .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .sm\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          .sm\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
          .sm\\:text-right { text-align: right !important; }
          .sm\\:text-left { text-align: left !important; }
          .sm\\:items-end { align-items: flex-end !important; }
          .sm\\:items-center { align-items: center !important; }
          .sm\\:w-auto { width: auto !important; }
          .sm\\:w-48 { width: 12rem !important; }
          .sm\\:justify-end { justify-content: flex-end !important; }
          .sm\\:justify-between { justify-content: space-between !important; }
          .sm\\:p-8 { padding: 2rem !important; }
          .sm\\:p-7 { padding: 1.75rem !important; }
          .sm\\:p-6 { padding: 1.5rem !important; }
          .sm\\:px-6 { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
          .sm\\:text-2xl { font-size: 1.5rem !important; }
          .sm\\:border-l { border-left-width: 1px !important; }
          .sm\\:border-t-0 { border-top-width: 0px !important; }
          .sm\\:pl-4 { padding-left: 1rem !important; }
          .sm\\:pt-0 { padding-top: 0px !important; }
          .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          .md\\:grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
          .md\\:col-span-3 { grid-column: span 3 / span 3 !important; }
          .md\\:col-span-4 { grid-column: span 4 / span 4 !important; }
          .md\\:col-span-5 { grid-column: span 5 / span 5 !important; }
          .md\\:col-span-6 { grid-column: span 6 / span 6 !important; }
          .md\\:col-span-7 { grid-column: span 7 / span 7 !important; }
          .md\\:col-span-8 { grid-column: span 8 / span 8 !important; }
          .md\\:col-span-9 { grid-column: span 9 / span 9 !important; }
          .md\\:flex-row { flex-direction: row !important; }
          .md\\:p-8 { padding: 2rem !important; }
          .md\\:p-10 { padding: 2.5rem !important; }
          .md\\:divide-x-2 > :not([hidden]) ~ :not([hidden]) { border-left-width: 2px !important; }
          .md\\:divide-y-0 > :not([hidden]) ~ :not([hidden]) { border-top-width: 0px !important; }
        `;
        clonedDoc.head.appendChild(style);

        const clonedTarget = clonedDoc.querySelector('.invoice-template') as HTMLElement;
        if (clonedTarget) {
          clonedTarget.style.overflow = 'visible';
          clonedTarget.style.boxShadow = 'none';
          clonedTarget.style.minHeight = 'auto';
        }
      }
    });

    const canvasTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('html2canvas render timed out (5s)')), 5000)
    );

    const canvas = await Promise.race([html2canvasPromise, canvasTimeout]);

    const imgData = canvas.toDataURL('image/jpeg', 0.96);

    if (isThermal) {
      // Authentic Continuous 80mm Thermal Receipt (Standard POS Roll format)
      // Standard 80mm roll width in points: 226.77 pt (approx 80mm)
      // Height perfectly hugs the receipt content so it NEVER breaks onto 2 pages
      const rollWidth = 226.77;
      const rollHeight = Math.max(260, (canvas.height * rollWidth) / canvas.width + 24);
      
      const pdf = new jsPDF('p', 'pt', [rollWidth, rollHeight]);
      pdf.addImage(imgData, 'JPEG', 0, 12, rollWidth, (canvas.height * rollWidth) / canvas.width, undefined, 'FAST');
      const blob = pdf.output('blob');
      return blob;
    }

    if (template === 'auto_compact') {
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();   // 595.28 pt
      const pageHeight = pdf.internal.pageSize.getHeight(); // 841.89 pt
      
      // Proportional compact voucher centered cleanly on A4
      const slipWidth = 320;
      const slipHeight = (canvas.height * slipWidth) / canvas.width;
      const xOffset = (pageWidth - slipWidth) / 2;
      const yOffset = Math.max(30, (pageHeight - slipHeight) / 2);

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, slipWidth, slipHeight, undefined, 'FAST');
      const blob = pdf.output('blob');
      return blob;
    }

    // Standard A4 full-page invoice with balanced margins & smart single-page fit
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();   // 595.28 pt
    const pageHeight = pdf.internal.pageSize.getHeight(); // 841.89 pt
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);

    let imgWidth = contentWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    const isAutoTemplate = template.startsWith('auto_');

    // Downpayment / Automobile vouchers are ALWAYS single-page allotment slips (like vehicle booking token receipts)
    // For standard sales invoices, allow up to 35% headroom to squeeze onto 1 single page cleanly
    if (isAutoTemplate || imgHeight <= contentHeight * 1.35) {
      if (imgHeight > contentHeight) {
        const scaleDown = contentHeight / imgHeight;
        imgWidth = imgWidth * scaleDown;
        imgHeight = contentHeight;
      }
      const xOffset = margin + (contentWidth - imgWidth) / 2;
      const yOffset = margin;
      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'FAST');
    } else {
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= contentHeight;

      while (heightLeft > 20) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= contentHeight;
      }
    }

    const blob = pdf.output('blob');
    return blob;

  } finally {
    root.unmount();
    if (captureContainer.parentNode) {
      document.body.removeChild(captureContainer);
    }
  }
};

export const generatePurchaseBillPDFBlob = async (
  invoice: PurchaseInvoiceData,
  vendor: VendorDetails,
  items: PurchaseItem[],
  company: PurchaseCompanyDetails,
  template: PurchaseTemplateId = 'classic-blue',
  currencySymbol: string = '₹'
): Promise<Blob> => {
  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');

  const targetWidth = 800;
  const captureContainer = document.createElement('div');
  captureContainer.className = 'purchase-bill-pdf-temp-container';
  captureContainer.style.position = 'fixed';
  captureContainer.style.left = '0';
  captureContainer.style.top = '0';
  captureContainer.style.zIndex = '-99999';
  captureContainer.style.pointerEvents = 'none';
  captureContainer.style.opacity = '1';
  captureContainer.style.width = `${targetWidth}px`;
  captureContainer.style.maxWidth = `${targetWidth}px`;
  captureContainer.style.background = '#ffffff';
  captureContainer.style.margin = '0';
  captureContainer.style.padding = '0';
  captureContainer.style.boxSizing = 'border-box';
  document.body.appendChild(captureContainer);

  const root = createRoot(captureContainer);

  try {
    root.render(
      <CurrencyProvider>
        <PurchaseBillTemplate
          invoice={invoice}
          vendor={vendor}
          company={company}
          items={items}
          template={template}
          currencySymbol={currencySymbol}
        />
      </CurrencyProvider>
    );

    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {}
    }

    await new Promise(resolve => setTimeout(resolve, 400));

    const images = Array.from(captureContainer.querySelectorAll('img'));
    await Promise.all(
      images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>(resolve => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 1500);
        });
      })
    );

    const canvas = await html2canvas(captureContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      width: captureContainer.offsetWidth || targetWidth,
      windowWidth: targetWidth,
      logging: false,
      onclone: (clonedDoc) => {
        const style = clonedDoc.createElement('style');
        style.textContent = `
          * {
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
            text-rendering: geometricPrecision !important;
            box-sizing: border-box !important;
          }
          img {
            display: inline-block !important;
            vertical-align: middle !important;
          }
          .truncate, [class*="line-clamp"] {
            overflow: visible !important;
            text-overflow: clip !important;
            white-space: normal !important;
          }
          /* Lock desktop 2-column layout even when generated on mobile devices */
          .sm\\:flex-row {
            flex-direction: row !important;
          }
          .sm\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .sm\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          .sm\\:grid-cols-4 {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
          .sm\\:text-right {
            text-align: right !important;
          }
          .sm\\:items-end {
            align-items: flex-end !important;
          }
          .sm\\:w-auto {
            width: auto !important;
          }
          .sm\\:w-48 {
            width: 12rem !important;
          }
          .sm\\:justify-end {
            justify-content: flex-end !important;
          }
        `;
        clonedDoc.head.appendChild(style);
      }
    });

    if (!canvas || !canvas.width || !canvas.height) {
      throw new Error('Canvas rendering produced zero dimensions');
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Balanced A4 margins
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);

    let imgWidth = contentWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Smart 1-page fit: if total height is within 28% of 1 page height, scale slightly down to fit on 1 page cleanly
    if (imgHeight > contentHeight && imgHeight <= contentHeight * 1.28) {
      const scaleDown = contentHeight / imgHeight;
      imgWidth = imgWidth * scaleDown;
      imgHeight = contentHeight;
      const xOffset = margin + (contentWidth - imgWidth) / 2;
      pdf.addImage(imgData, 'JPEG', xOffset, margin, imgWidth, imgHeight, undefined, 'FAST');
    } else if (imgHeight <= contentHeight) {
      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight, undefined, 'FAST');
    } else {
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= contentHeight;

      while (heightLeft > 20) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= contentHeight;
      }
    }

    const blob = pdf.output('blob');
    return blob;
  } finally {
    root.unmount();
    if (captureContainer.parentNode) {
      document.body.removeChild(captureContainer);
    }
  }
};
