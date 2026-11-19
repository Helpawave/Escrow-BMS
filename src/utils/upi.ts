/**
 * Shared UPI validation, normalization, and URI generation utilities.
 */

/**
 * Validates whether a string is a properly formatted UPI VPA with handle.
 * e.g. "username@bank", "9876543210@paytm", "shop@okaxis"
 */
export function isValidUpiId(upiId?: string | null): boolean {
  if (!upiId) return false;
  const clean = upiId.trim();
  // Must contain an @ with valid user prefix and bank handle suffix
  return /^[\w.-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/.test(clean);
}

/**
 * Normalizes a raw UPI ID by trimming and removing internal whitespace.
 * If user provided a 10-digit mobile number, fall back to @paytm to prevent QR suppression.
 */
export function normalizeUpiId(rawUpi?: string | null): string | null {
  if (!rawUpi) return null;
  const clean = rawUpi.trim().replace(/\s+/g, '');
  if (!clean) return null;
  if (!clean.includes('@')) {
    if (/^\d{10}$/.test(clean)) {
      return `${clean}@paytm`;
    }
    return null;
  }
  return isValidUpiId(clean) ? clean : null;
}

/**
 * Builds a standardized UPI Payment URI (`upi://pay?...`).
 * Returns null if upiId is missing or invalid.
 */
export function buildUpiPayUri(params: {
  upiId?: string | null;
  payeeName: string;
  amount?: number;
  note?: string;
}): string | null {
  const normalizedUpi = normalizeUpiId(params.upiId);
  if (!normalizedUpi) return null;

  const pa = encodeURIComponent(normalizedUpi);
  const pn = encodeURIComponent(params.payeeName || 'Business');
  let uri = `upi://pay?pa=${pa}&pn=${pn}&cu=INR`;

  if (params.amount !== undefined && params.amount > 0) {
    uri += `&am=${params.amount.toFixed(2)}`;
  }
  if (params.note) {
    uri += `&tn=${encodeURIComponent(params.note)}`;
  }
  return uri;
}

