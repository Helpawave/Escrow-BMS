/**
 * Professional, Clean & Compact WhatsApp Templates
 * Inspired by industry standards (Vyapar, myBillBook, Khatabook, Zoho Books, Razorpay)
 * Designed to be concise, easy-to-read on mobile screens, and spam-free.
 */

export interface InvoiceBankDetails {
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolder?: string;
  upiId?: string;
}

export interface InvoiceWhatsAppParams {
  invoiceNumber: string;
  clientName?: string;
  companyName?: string;
  totalAmount: number;
  currencySymbol?: string;
  issueDate?: string;
  dueDate?: string;
  status?: string;
  pdfUrl?: string | null;
  items?: { description?: string; name?: string; quantity?: number; amount?: number }[];
  bankDetails?: InvoiceBankDetails;
  companyPhone?: string;
  companyEmail?: string;
}

function formatWhatsAppDate(dateStr?: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;

  try {
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const [y, m, d] = trimmed.split('T')[0].split('-');
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {}
  return trimmed;
}

export function formatInvoiceWhatsAppMessage(params: InvoiceWhatsAppParams): string {
  const company = (params.companyName || '').trim();
  const client = (params.clientName || 'Customer').trim();
  const rawInv = (params.invoiceNumber || '').trim();
  const cleanInv = rawInv.replace(/^#+/, '');
  const sym = params.currencySymbol || '₹';
  const amountStr = Number(params.totalAmount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const companyDisplayName = company || 'Our Business';

  const lines: string[] = [
    `Hello ${client},`,
    ``,
    `Your invoice from ${companyDisplayName} is ready.`,
    ``,
    `📄 Invoice: #${cleanInv}`,
    `💰 Amount: ${sym}${amountStr}`,
  ];

  if (params.pdfUrl) {
    lines.push(``);
    lines.push(`🔗 Download PDF:`);
    lines.push(params.pdfUrl);
  }


  lines.push(``);
  lines.push(`Thank you for your trust and business!`);
  lines.push(`_Powered by ESCROWBILL_`);

  return lines.join('\n');
}

export interface PurchaseBillWhatsAppParams {
  invoiceNumber: string;
  vendorName?: string;
  companyName?: string;
  totalAmount: number;
  currencySymbol?: string;
  issueDate?: string;
  status?: string;
  paymentMethod?: string;
  items?: { description?: string; name?: string; quantity?: number; amount?: number }[];
  companyPhone?: string;
  companyEmail?: string;
}

export function formatPurchaseBillWhatsAppMessage(params: PurchaseBillWhatsAppParams): string {
  const company = (params.companyName || 'Our Business').trim();
  const vendor = (params.vendorName || 'Vendor').trim();
  const billNum = (params.invoiceNumber || '').trim();
  const sym = params.currencySymbol || '₹';
  const amountStr = Number(params.totalAmount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const status = (params.status || 'pending').toLowerCase();
  const isPaid = status === 'paid';
  const statusText = isPaid
    ? (params.paymentMethod ? `🟢 Paid (${params.paymentMethod.toUpperCase()})` : '🟢 Paid')
    : '🟡 Recorded';

  const lines: string[] = [
    `Dear *${vendor}*,`,
    ``,
    `A purchase bill has been recorded by *${company}*:`,
    ``,
    `📦 *Bill No:* #${billNum}`,
  ];

  if (params.issueDate) {
    lines.push(`📅 *Date:* ${params.issueDate}`);
  }

  lines.push(`💰 *Total Amount:* *${sym}${amountStr}*`);
  lines.push(`📌 *Status:* ${statusText}`);
  lines.push(``);
  lines.push(`Thank you,`);
  lines.push(`*${company}*`);

  return lines.join('\n');
}

export interface StaffCredentialsWhatsAppParams {
  companyName?: string;
  portalUrl: string;
  email: string;
  password?: string;
  role: string;
  isGoogle?: boolean;
}

export function formatStaffCredentialsWhatsAppMessage(params: StaffCredentialsWhatsAppParams): string {
  const company = (params.companyName || 'Escrow Bill').trim();

  const lines: string[] = [
    `Hello,`,
    ``,
    `Your staff account for *${company}* is ready:`,
    ``,
    `🔗 *Portal URL:* ${params.portalUrl}`,
    `👤 *Email:* ${params.email}`,
  ];

  if (!params.isGoogle && params.password) {
    lines.push(`🔑 *Password:* ${params.password}`);
  }

  lines.push(`🛡️ *Role:* ${params.role}`);
  lines.push(``);

  if (params.isGoogle) {
    lines.push(`👉 *Login:* Click the link and choose "Continue with Google".`);
  } else {
    lines.push(`Please log in and keep your credentials secure.`);
  }

  lines.push(``);
  lines.push(`*${company}*`);

  return lines.join('\n');
}

/**
 * Normalizes a raw phone string into an international WhatsApp-compatible number without symbols.
 * Handles leading +91, 0, local 10-digit Indian numbers, etc.
 */
export function normalizeWhatsAppNumber(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  let digits = rawPhone.replace(/[^\d]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  return digits;
}

/**
 * Universally opens WhatsApp chat on desktop and mobile apps without popup blockers.
 */
export function openWhatsAppChat(phone?: string | null, text: string = '') {
  const normalizedPhone = normalizeWhatsAppNumber(phone);
  const encodedText = encodeURIComponent(text);

  const url = normalizedPhone 
    ? `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 100);
  } catch {
    window.open(url, '_blank');
  }
}

