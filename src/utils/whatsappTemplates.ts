/**
 * Professional, Clean & Compact WhatsApp Templates
 * Inspired by industry standards (Vyapar, myBillBook, Khatabook, Zoho Books, Razorpay)
 * Designed to be concise, easy-to-read on mobile screens, and spam-free.
 */

import { serviceSupabase, supabase } from '@/integrations/supabase/client';

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
  vehicleNo?: string;
  vehicleModel?: string;
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

  const isPaid = (params.status || '').toLowerCase().trim() === 'paid';
  const isPartial = (params.status || '').toLowerCase().trim() === 'partial';
  const statusLine = isPaid
    ? `✅ *Payment Status:* PAID (Settled)`
    : isPartial
      ? `⏳ *Payment Status:* PARTIALLY PAID`
      : `⏳ *Payment Status:* PENDING / UNPAID`;

  const lines: string[] = [
    `Hello *${client}*,`,
    ``,
    `Your invoice from *${companyDisplayName}* is ready.`,
    ``,
    `📄 *Invoice:* #${cleanInv}`,
    `💰 *Amount:* ${sym}${amountStr}`,
    statusLine,
  ];

  if (params.vehicleNo || params.vehicleModel) {
    const isBooking = params.vehicleNo && /^BK-/i.test(params.vehicleNo);
    const numLabel = isBooking ? 'Booking Number' : 'Vehicle Number';
    const numIcon = isBooking ? '🔖' : '🔢';
    const vParts = [
      params.vehicleModel ? `🚗 Model: ${params.vehicleModel}` : '',
      params.vehicleNo ? `${numIcon} ${numLabel}: ${params.vehicleNo}` : ''
    ].filter(Boolean);
    if (vParts.length > 0) {
      lines.push(vParts.join(' | '));
    }
  }

  if (params.pdfUrl) {
    lines.push(``);
    lines.push(`🔗 *Download PDF:*`);
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
  pdfUrl?: string | null;
  paymentMethod?: string;
  items?: { description?: string; name?: string; quantity?: number; amount?: number }[];
  companyPhone?: string;
  companyEmail?: string;
}

export function formatPurchaseBillWhatsAppMessage(params: PurchaseBillWhatsAppParams): string {
  const company = (params.companyName || '').trim() || 'Our Business';
  const vendor = (params.vendorName || 'Vendor').trim();
  const rawBill = (params.invoiceNumber || '').trim();
  const cleanBill = rawBill.replace(/^#+/, '');
  const sym = params.currencySymbol || '₹';
  const amountStr = Number(params.totalAmount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const lines: string[] = [
    `Hello *${vendor}*,`,
    ``,
    `Your purchase bill from *${company}* is ready.`,
    ``,
    `📄 *Purchase Bill:* #${cleanBill}`,
    `💰 *Amount:* ${sym}${amountStr}`,
  ];

  if (params.pdfUrl) {
    lines.push(``);
    lines.push(`🔗 *Download PDF:*`);
    lines.push(params.pdfUrl);
  }

  lines.push(``);
  lines.push(`Thank you for your trust and business!`);
  lines.push(`_Powered by ESCROWBILL_`);

  return lines.join('\n');
}

export function formatPurchaseBillEmail(params: PurchaseBillWhatsAppParams): { subject: string; body: string } {
  const company = (params.companyName || '').trim() || 'Our Business';
  const cleanBill = (params.invoiceNumber || '').trim().replace(/^#+/, '');
  const subject = `Purchase Bill #${cleanBill} from ${company}`;
  const body = formatPurchaseBillWhatsAppMessage(params);
  return { subject, body };
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
 * Supports:
 * - Direct native invocation of the installed WhatsApp Desktop App on Windows / macOS (via whatsapp://)
 * - Official WhatsApp Gateway (api.whatsapp.com / wa.me) for desktop app trigger with WhatsApp Web fallback
 * - Native WhatsApp Mobile App on Android & iOS (wa.me)
 */
export function openWhatsAppChat(phone?: string | null, text: string = ''): string {
  const normalizedPhone = normalizeWhatsAppNumber(phone);
  const encodedText = encodeURIComponent(text);

  const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // 1. Mobile deep link: wa.me directly invokes the native WhatsApp application on mobile devices
  const mobileUrl = normalizedPhone 
    ? `https://wa.me/${normalizedPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  // 2. Desktop: Use official WhatsApp Universal Gateway (api.whatsapp.com/send)
  // This cleanly prompts to launch WhatsApp Desktop if installed, provides instant WhatsApp Web fallback,
  // runs synchronously inside user click handlers (zero popup-blocker issues), and avoids duplicate tabs.
  const desktopGatewayUrl = normalizedPhone
    ? `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  if (isMobile) {
    // On mobile devices, direct navigation to wa.me seamlessly opens native WhatsApp app
    try {
      window.location.href = mobileUrl;
    } catch {
      window.open(mobileUrl, '_blank');
    }
    return mobileUrl;
  }

  // On laptop / desktop:
  try {
    const win = window.open(desktopGatewayUrl, '_blank');
    if (!win) {
      window.location.href = desktopGatewayUrl;
    }
  } catch {
    window.location.href = desktopGatewayUrl;
  }

  return desktopGatewayUrl;
}

/**
 * Asynchronously shortens a long URL via TinyURL with a tight 2.5s timeout.
 * Leaves short URLs untouched and falls back gracefully to original URL if offline.
 */
export async function shortenUrl(longUrl?: string | null): Promise<string> {
  if (!longUrl || typeof longUrl !== 'string' || longUrl.length < 35) return longUrl || '';
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().startsWith('http')) {
        return text.trim();
      }
    }
  } catch {
    // Fallback to original long URL without blocking the user
  }
  return longUrl;
}

/**
 * Generates an ultra-clean, branded short link for public document access:
 * e.g., https://bill.escrowbms.in/v/INV-0018
 * Also registers it in system_settings using serviceSupabase to bypass RLS.
 */
export async function createShortReceiptLink(
  invoiceNumber: string,
  fullPdfUrl: string,
  supabaseClient?: any,
  invoiceId?: string
): Promise<string> {
  const cleanCode = (invoiceNumber || '').trim().replace(/^#+/, '');
  let baseUrl = 'https://bill.escrowbms.in';
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      baseUrl = origin.replace('www.bill.escrowbms.in', 'bill.escrowbms.in');
    }
  }
  const targetCode = invoiceId || cleanCode;
  const shortUrl = `${baseUrl}/v/${encodeURIComponent(targetCode)}`;

  const client = serviceSupabase || supabaseClient || supabase;
  if (client && targetCode && fullPdfUrl) {
    try {
      const payload = {
        url: fullPdfUrl,
        code: cleanCode,
        id: invoiceId || null,
        created_at: new Date().toISOString()
      };
      
      // Deduplicate keys: prioritize invoiceId so every invoice shortlink is completely isolated
      const keysToRegister = Array.from(new Set([
        ...(invoiceId ? [`shortlink_${invoiceId}`] : [`shortlink_${cleanCode}`, `shortlink_${cleanCode.toUpperCase()}`])
      ]));

      const recordsToUpsert = keysToRegister.map(key => ({
        key,
        value: JSON.stringify(payload),
        updated_at: new Date().toISOString()
      }));

      const { error: upsertError } = await (client as any)
        .from('system_settings')
        .upsert(recordsToUpsert, { onConflict: 'key' });

      if (upsertError) {
        // Fallback: If system_settings has no updated_at column, retry without updated_at
        const simpleRecords = keysToRegister.map(key => ({
          key,
          value: JSON.stringify(payload)
        }));
        const { error: retryError } = await (client as any)
          .from('system_settings')
          .upsert(simpleRecords, { onConflict: 'key' });
        if (retryError) {
          console.warn('Could not register short receipt link in system_settings:', retryError);
        }
      }
    } catch (e) {
      console.warn('Could not register short receipt link in system_settings:', e);
    }
  }

  return shortUrl;
}

export interface DownpaymentWhatsAppParams {
  invoiceNumber: string;
  clientName?: string;
  companyName?: string;
  totalAmount: number;
  currencySymbol?: string;
  issueDate?: string;
  status?: string;
  pdfUrl?: string | null;
  vehicleModel?: string;
  vehicleRegNo?: string;
  vehicleChassis?: string;
  financer?: string;
  paymentDetails?: {
    type?: string;
    amountReceived?: number;
    balancePending?: number;
    paymentMethod?: string;
  };
  companyPhone?: string;
  companyEmail?: string;
}

export function formatDownpaymentWhatsAppMessage(params: DownpaymentWhatsAppParams): string {
  const company = (params.companyName || '').trim() || 'Our Business';
  const client = (params.clientName || 'Customer').trim();
  const rawInv = (params.invoiceNumber || '').trim();
  const cleanInv = rawInv.replace(/^#+/, '');
  const sym = params.currencySymbol || '₹';
  const amountStr = Number(params.totalAmount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const isPaid = (params.status || '').toLowerCase().trim() === 'paid';
  const statusLine = isPaid
    ? `✅ *Payment Status:* PAID (Settled)`
    : `⏳ *Payment Status:* PENDING / ADVANCE`;

  const lines: string[] = [
    `Hello *${client}*,`,
    ``,
    `Your downpayment receipt from *${company}* is ready.`,
    ``,
    `📄 *Downpayment Receipt:* #${cleanInv}`,
    `💰 *Amount:* ${sym}${amountStr}`,
    statusLine,
  ];

  if (params.vehicleRegNo || params.vehicleModel) {
    const isBooking = !params.vehicleRegNo || /^BK-/i.test(params.vehicleRegNo) || !params.vehicleRegNo.match(/^[A-Z]{2}[-\s]?\d/i);
    const numLabel = isBooking ? 'Booking Number' : 'Vehicle Number';
    const numIcon = isBooking ? '🔖' : '🔢';
    const vParts = [
      params.vehicleModel ? `🚗 Model: ${params.vehicleModel}` : '',
      params.vehicleRegNo ? `${numIcon} ${numLabel}: ${params.vehicleRegNo}` : ''
    ].filter(Boolean);
    if (vParts.length > 0) {
      lines.push(vParts.join(' | '));
    }
  }

  if (params.pdfUrl) {
    lines.push(``);
    lines.push(`🔗 *Download PDF:*`);
    lines.push(params.pdfUrl);
  }

  lines.push(``);
  lines.push(`Thank you for your trust and business!`);
  lines.push(`_Powered by ESCROWBILL_`);

  return lines.join('\n');
}

export function formatDownpaymentEmail(params: DownpaymentWhatsAppParams): { subject: string; body: string } {
  const company = (params.companyName || '').trim() || 'Our Business';
  const cleanInv = (params.invoiceNumber || '').trim().replace(/^#+/, '');
  const subject = `Downpayment Receipt #${cleanInv} from ${company}`;
  const body = formatDownpaymentWhatsAppMessage(params);
  return { subject, body };
}



