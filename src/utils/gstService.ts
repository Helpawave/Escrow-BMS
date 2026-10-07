/**
 * Indian GSTIN Validation and Verification Service
 * Supports 15-digit format check, Luhn Mod-36 checksum calculation,
 * State & Entity decoding, and public/online lookup.
 */

export const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman & Diu",
  "26": "Dadra & Nagar Haveli",
  "27": "Maharashtra",
  "28": "Andhra Pradesh (Old)",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman & Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
  "99": "Centre Jurisdiction"
};

export const PAN_ENTITY_TYPES: Record<string, string> = {
  C: "Company (Pvt Ltd / Ltd)",
  P: "Individual / Proprietorship",
  H: "Hindu Undivided Family (HUF)",
  F: "Partnership Firm / LLP",
  A: "Association of Persons (AOP)",
  T: "Trust",
  B: "Body of Individuals (BOI)",
  L: "Local Authority",
  J: "Artificial Juridical Person",
  G: "Government"
};

const GST_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Validates the 15-character structure of Indian GSTIN
 */
export function validateGSTINFormat(gstin: string): boolean {
  if (!gstin) return false;
  const clean = gstin.trim().toUpperCase();
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(clean);
}

/**
 * Validates the GSTIN Checksum using official Luhn Mod-36 algorithm
 */
export function validateGSTINChecksum(gstin: string): boolean {
  if (!validateGSTINFormat(gstin)) return false;
  const clean = gstin.trim().toUpperCase();

  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const char = clean[i];
    const charVal = GST_CHARS.indexOf(char);
    if (charVal === -1) return false;

    // Weight factor: 1 for even index, 2 for odd index
    const factor = (i % 2 === 0) ? 1 : 2;
    const product = charVal * factor;
    const quotient = Math.floor(product / 36);
    const remainder = product % 36;
    sum += quotient + remainder;
  }

  const remainder = sum % 36;
  const checkDigitVal = (36 - remainder) % 36;
  const calculatedCheckChar = GST_CHARS[checkDigitVal];

  return calculatedCheckChar === clean[14];
}

export interface GSTVerificationResult {
  valid: boolean;
  gstin: string;
  name?: string;
  tradeName?: string;
  legalName?: string;
  state?: string;
  stateCode?: string;
  entityType?: string;
  status?: string;
  address?: string;
  pincode?: string;
  error?: string;
}

/**
 * Verifies GSTIN with Luhn Mod-36 checksum and official government portal lookup
 */
export async function verifyGSTIN(gstin: string): Promise<GSTVerificationResult> {
  const clean = (gstin || '').trim().toUpperCase();

  if (!clean || clean.length !== 15) {
    return {
      valid: false,
      gstin: clean,
      error: "GSTIN must be exactly 15 characters"
    };
  }

  if (!validateGSTINFormat(clean)) {
    return {
      valid: false,
      gstin: clean,
      error: "Invalid GSTIN format. Example: 27AABCA1234F1Z8"
    };
  }

  const stateCode = clean.substring(0, 2);
  const stateName = GST_STATE_CODES[stateCode];
  if (!stateName) {
    return {
      valid: false,
      gstin: clean,
      error: `Invalid State Code (${stateCode}) in GSTIN`
    };
  }

  // 1. Strictly check Luhn Mod-36 checksum
  if (!validateGSTINChecksum(clean)) {
    return {
      valid: false,
      gstin: clean,
      error: "GSTIN checksum verification failed. Please check the digits carefully."
    };
  }

  const entityChar = clean[5]; // 4th letter of PAN (index 5 of GSTIN)
  const entityType = PAN_ENTITY_TYPES[entityChar] || "Registered Business";

  // 2. Query official Jamku RapidAPI government GST portal
  const rapidApiKey = (import.meta as any).env?.VITE_RAPIDAPI_KEY || (typeof window !== 'undefined' ? localStorage.getItem('rapidapi_key') : '');
  if (!rapidApiKey || rapidApiKey.trim().length === 0) {
    return {
      valid: false,
      gstin: clean,
      error: "GST verification service key is not configured. Please contact support."
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`https://gst-return-status.p.rapidapi.com/free/gstin/${clean}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'gst-return-status.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey.trim()
      }
    });
    clearTimeout(timeoutId);

    if (response.status === 404) {
      return {
        valid: false,
        gstin: clean,
        error: "GSTIN is not registered on the government GST portal."
      };
    }

    if (!response.ok) {
      let msg = "Could not verify GSTIN with government portal.";
      try {
        const errJson = await response.json();
        if (errJson?.message) msg = errJson.message;
      } catch {
        // ignore parse error
      }
      return {
        valid: false,
        gstin: clean,
        error: msg
      };
    }

    const json = await response.json();
    if (json?.success === false) {
      return {
        valid: false,
        gstin: clean,
        error: json.message || "GSTIN validation failed on government portal."
      };
    }

    const data = json?.data || json;
    const tradeName = data?.tradeName || data?.tradeNam;
    const legalName = data?.lgnm || data?.legalName;
    const status = data?.sts || "Active";
    const verifiedName = legalName || tradeName;

    // Check if official taxpayer name was actually returned
    if (!verifiedName || verifiedName.trim().length === 0) {
      return {
        valid: false,
        gstin: clean,
        error: "No registered taxpayer found for this GSTIN on the government portal."
      };
    }

    // Extract address if available
    let resolvedAddress = data?.adr || "";
    if (!resolvedAddress && data?.pradr?.addr && typeof data.pradr.addr === 'object') {
      resolvedAddress = Object.values(data.pradr.addr).filter(Boolean).join(', ');
    }

    const pincode = data?.pincode || data?.pradr?.addr?.pncd || "";

    return {
      valid: true,
      gstin: clean,
      name: verifiedName,
      tradeName: tradeName || verifiedName,
      legalName: legalName || verifiedName,
      state: data?.pradr?.addr?.st || stateName,
      stateCode,
      entityType: data?.ctb || entityType,
      status,
      address: resolvedAddress,
      pincode
    };
  } catch (err: any) {
    console.error('GST verification network error:', err);
    return {
      valid: false,
      gstin: clean,
      error: err?.name === 'AbortError'
        ? "Verification request timed out. Please try again."
        : "Network error while reaching GST portal. Please check your connection."
    };
  }
}
