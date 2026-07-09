import { InvoiceTemplate } from "@/components/InvoiceTemplate";
import React from "react";
import { createRoot } from "react-dom/client";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { InvoiceData, ClientData, CompanyData, ItemData } from "@/types/invoice";

export type { InvoiceData, ClientData, CompanyData, ItemData };

export const generateInvoiceHTML = async (
  invoice: InvoiceData,
  client: ClientData,
  items: ItemData[],
  company: CompanyData,
  template: 'professional' | 'elegant' | 'minimal' | 'modern' | 'corporate' = 'corporate',
  currencySymbol: string = '₹'
): Promise<string> => {
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '-9999px';
  tempContainer.style.width = '800px';
  document.body.appendChild(tempContainer);

  const root = createRoot(tempContainer);

  try {
    root.render(
      <InvoiceTemplate
        invoice={invoice}
        client={client}
        items={items}
        company={company}
        template={template}
        currencySymbol={currencySymbol}
      />
    );

    await new Promise(resolve => setTimeout(resolve, 500));

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
          <style>
            ${stylesheets}
            body { 
              margin: 0; 
              padding: 0; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: white;
            }
            .invoice-template {
              box-shadow: none !important;
              border: none !important;
              box-sizing: border-box !important;
            }
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
  template: 'professional' | 'elegant' | 'minimal' | 'modern' | 'corporate' = 'corporate',
  currencySymbol: string = '₹'
): Promise<Blob> => {
  const printHTML = await generateInvoiceHTML(invoice, client, items, company, template, currencySymbol);

  // Import generation libs
  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');

  // Create a temp div for capture
  const captureContainer = document.createElement('div');
  captureContainer.innerHTML = printHTML;
  captureContainer.style.position = 'absolute';
  captureContainer.style.left = '-9999px';
  captureContainer.style.top = '-9999px';
  captureContainer.style.width = '800px';
  captureContainer.style.background = '#ffffff';
  document.body.appendChild(captureContainer);

  try {
    // Wait for styles and images to load
    await new Promise(resolve => setTimeout(resolve, 500));

    const invoiceEl = captureContainer.querySelector('.invoice-template') as HTMLElement | null;
    if (invoiceEl) {
      invoiceEl.style.width = '800px';

      // Smart Page Breaking Logic
      const PAGE_HEIGHT_PX = 1125; // Slightly less than A4 1131 for safe margin
      const breakables = invoiceEl.querySelectorAll('.avoid-break');
      
      // We must track accumulated offset because inserting spacers shifts all subsequent elements
      let accumulatedSpacerHeight = 0;
      
      // Convert NodeList to Array to avoid issues if we modify DOM
      const elements = Array.from(breakables) as HTMLElement[];
      
      elements.forEach(el => {
        // Get current position relative to container top
        const rect = el.getBoundingClientRect();
        const containerRect = invoiceEl.getBoundingClientRect();
        const top = rect.top - containerRect.top;
        const bottom = rect.bottom - containerRect.top;
        
        const pageOfTop = Math.floor(top / PAGE_HEIGHT_PX);
        const pageOfBottom = Math.floor(bottom / PAGE_HEIGHT_PX);
        
        if (pageOfTop !== pageOfBottom) {
          // Element crosses a page boundary
          const spacerHeight = PAGE_HEIGHT_PX - (top % PAGE_HEIGHT_PX);
          const spacer = document.createElement('div');
          spacer.style.height = `${spacerHeight}px`;
          spacer.className = 'page-spacer'; // for debugging if needed
          el.parentNode?.insertBefore(spacer, el);
          accumulatedSpacerHeight += spacerHeight;
        }
      });
    }

    const canvas = await html2canvas(captureContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 800,
      windowWidth: 800
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 20) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    const blob = pdf.output('blob');

    // Clean up
    if (captureContainer.parentNode) {
      document.body.removeChild(captureContainer);
    }

    return blob;

  } catch (error) {
    // Clean up on error
    if (captureContainer && captureContainer.parentNode) {
      document.body.removeChild(captureContainer);
    }
    throw error;
  }
};
