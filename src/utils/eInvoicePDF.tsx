import React from 'react';
import { createRoot } from 'react-dom/client';
import { EInvoiceTemplate } from "@/components/EInvoiceTemplate";
import { EWayBillTemplate } from "@/components/EWayBillTemplate";

interface EInvoiceData {
  invoice_type: string;
  invoice_number: string;
  invoice_date: string;
  place_of_supply: string;
  reverse_charge: string;
  notes: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  irn?: string;
  ack_no?: string;
  ack_date?: string;
}

interface EInvoiceItem {
  description: string;
  hsn_code: string;
  quantity: number;
  unit: string;
  rate: number;
  tax_rate: number;
  amount: number;
}

interface Client {
  name: string;
  email: string;
  gstin: string;
  address: string;
  state: string;
  postal_code: string;
  hide_contact_details?: boolean;
}

interface Profile {
  company_name: string;
  business_address: string;
  gstin: string;
  phone: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  signature_url?: string | null;
  logo_url?: string;
}

interface EWayBillData {
  document_type: string;
  document_number: string;
  document_date: string;
  transaction_type: string;
  from_address?: string;
  from_gstin?: string;
  to_address?: string;
  to_gstin?: string;
  vehicle_number?: string;
  transport_mode: string;
  distance?: string;
  transporter_name?: string;
  total_value: number;
  eway_bill_no?: string;
  valid_until?: string;
}

interface EWayBillItem {
  product_name: string;
  hsn_code: string;
  quantity: number;
  unit: string;
  value: number;
}

export const generateEInvoiceHTML = async (
  invoice: EInvoiceData,
  items: EInvoiceItem[],
  client: Client,
  profile: Profile
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
      <EInvoiceTemplate
        invoice={invoice}
        client={client}
        items={items}
        profile={profile}
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

export const generateEWayBillHTML = async (
  eWayBillData: EWayBillData,
  items: EWayBillItem[],
  client: Client,
  profile: Profile
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
      <EWayBillTemplate
        eWayBillData={eWayBillData}
        client={client}
        items={items}
        profile={profile}
      />
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    const invoiceElement = tempContainer.querySelector('.invoice-template');
    if (!invoiceElement) {
      throw new Error('E-Way Bill template did not render correctly');
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

export const generateEInvoicePDF = async (
  invoice: EInvoiceData,
  items: EInvoiceItem[],
  client: Client,
  profile: Profile
): Promise<void> => {
  const printHTML = await generateEInvoiceHTML(invoice, items, client, profile);

  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');

  const captureContainer = document.createElement('div');
  captureContainer.innerHTML = printHTML;
  captureContainer.style.position = 'absolute';
  captureContainer.style.left = '-9999px';
  captureContainer.style.top = '-9999px';
  captureContainer.style.width = '800px';
  document.body.appendChild(captureContainer);

  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const invoiceEl = captureContainer.querySelector('.invoice-template') as HTMLElement | null;
    if (invoiceEl) {
      invoiceEl.style.width = '800px';

      // Smart Page Breaking Logic
      const PAGE_HEIGHT_PX = 1125;
      const breakables = invoiceEl.querySelectorAll('.avoid-break');
      const elements = Array.from(breakables) as HTMLElement[];
      
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const containerRect = invoiceEl.getBoundingClientRect();
        const top = rect.top - containerRect.top;
        const bottom = rect.bottom - containerRect.top;
        
        const pageOfTop = Math.floor(top / PAGE_HEIGHT_PX);
        const pageOfBottom = Math.floor(bottom / PAGE_HEIGHT_PX);
        
        if (pageOfTop !== pageOfBottom) {
          const spacerHeight = PAGE_HEIGHT_PX - (top % PAGE_HEIGHT_PX);
          const spacer = document.createElement('div');
          spacer.style.height = `${spacerHeight}px`;
          el.parentNode?.insertBefore(spacer, el);
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

    pdf.save(`E-Invoice-${invoice.invoice_number}.pdf`);
  } finally {
    if (captureContainer.parentNode) {
      document.body.removeChild(captureContainer);
    }
  }
};

export const generateEWayBillPDF = async (
  eWayBillData: EWayBillData,
  items: EWayBillItem[],
  client: Client,
  profile: Profile
): Promise<void> => {
  const printHTML = await generateEWayBillHTML(eWayBillData, items, client, profile);

  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');

  const captureContainer = document.createElement('div');
  captureContainer.innerHTML = printHTML;
  captureContainer.style.position = 'absolute';
  captureContainer.style.left = '-9999px';
  captureContainer.style.top = '-9999px';
  captureContainer.style.width = '800px';
  document.body.appendChild(captureContainer);

  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    const invoiceEl = captureContainer.querySelector('.invoice-template') as HTMLElement | null;
    if (invoiceEl) {
      invoiceEl.style.width = '800px';

      // Smart Page Breaking Logic
      const PAGE_HEIGHT_PX = 1125;
      const breakables = invoiceEl.querySelectorAll('.avoid-break');
      const elements = Array.from(breakables) as HTMLElement[];
      
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const containerRect = invoiceEl.getBoundingClientRect();
        const top = rect.top - containerRect.top;
        const bottom = rect.bottom - containerRect.top;
        
        const pageOfTop = Math.floor(top / PAGE_HEIGHT_PX);
        const pageOfBottom = Math.floor(bottom / PAGE_HEIGHT_PX);
        
        if (pageOfTop !== pageOfBottom) {
          const spacerHeight = PAGE_HEIGHT_PX - (top % PAGE_HEIGHT_PX);
          const spacer = document.createElement('div');
          spacer.style.height = `${spacerHeight}px`;
          el.parentNode?.insertBefore(spacer, el);
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

    pdf.save(`E-Way-Bill-${eWayBillData.document_number}.pdf`);
  } finally {
    if (captureContainer.parentNode) {
      document.body.removeChild(captureContainer);
    }
  }
};
