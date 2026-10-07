// Live Forex Exchange Rate Service for Escrow Bill

export interface ForexRates {
  USD: number; // 1 INR in USD (e.g. ~0.01047)
  EUR: number; // 1 INR in EUR (e.g. ~0.00902)
  GBP: number; // 1 INR in GBP (e.g. ~0.00775)
  INR: number; // Always 1
  [key: string]: number;
}

// Reliable fallback rates (1 INR = X currency) in case of offline/network failure
export const FALLBACK_RATES: ForexRates = {
  INR: 1,
  USD: 0.01047, // 1 USD = ~₹95.51
  EUR: 0.00902, // 1 EUR = ~₹110.85
  GBP: 0.00775  // 1 GBP = ~₹129.03
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£'
};

const CACHE_KEY = 'escrow_forex_rates_v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface CachedForexData {
  rates: ForexRates;
  timestamp: number;
}

/**
 * Fetches live exchange rates from open-access API with 1-hour localStorage caching
 */
export async function getLiveForexRates(): Promise<{ rates: ForexRates; timestamp: number; isFallback: boolean }> {
  // Check local cache first
  try {
    const cachedStr = localStorage.getItem(CACHE_KEY);
    if (cachedStr) {
      const cached: CachedForexData = JSON.parse(cachedStr);
      if (Date.now() - cached.timestamp < CACHE_TTL_MS && cached.rates?.USD) {
        return { rates: cached.rates, timestamp: cached.timestamp, isFallback: false };
      }
    }
  } catch (e) {
    console.warn('Failed to read forex cache:', e);
  }

  // Fetch live rates
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/INR', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP status ${response.status}`);
    const data = await response.json();

    if (data && data.rates && data.rates.USD) {
      const rates: ForexRates = {
        INR: 1,
        USD: Number(data.rates.USD) || FALLBACK_RATES.USD,
        EUR: Number(data.rates.EUR) || FALLBACK_RATES.EUR,
        GBP: Number(data.rates.GBP) || FALLBACK_RATES.GBP
      };

      const result = { rates, timestamp: Date.now(), isFallback: false };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(result));
      } catch (e) {
        console.warn('Failed to save forex cache:', e);
      }
      return result;
    }
  } catch (err) {
    console.warn('Live forex fetch failed, using fallback rates:', err);
  }

  return { rates: FALLBACK_RATES, timestamp: Date.now(), isFallback: true };
}

/**
 * Returns how many INR equals 1 unit of foreign currency (e.g. 1 USD = ₹95.51)
 */
export function getInrPerForeignUnit(currency: string, rates: ForexRates = FALLBACK_RATES): number {
  const code = (currency || 'INR').toUpperCase().trim();
  if (code === 'INR' || code === '₹' || code === 'RUPEE') return 1;

  const rate = rates[code] || FALLBACK_RATES[code as keyof ForexRates] || 1;
  if (rate <= 0) return 1;

  // Since rate is 1 INR in foreign currency, 1 foreign unit = 1 / rate in INR
  return Math.round((1 / rate) * 100) / 100;
}

/**
 * Converts an INR amount to the specified target currency
 */
export function convertFromInr(amountInInr: number, targetCurrency: string, rates: ForexRates = FALLBACK_RATES): number {
  if (!amountInInr || isNaN(amountInInr)) return 0;
  const code = (targetCurrency || 'INR').toUpperCase().trim();
  if (code === 'INR' || code === '₹' || code === 'RUPEE') return amountInInr;

  const rate = rates[code] || FALLBACK_RATES[code as keyof ForexRates] || 1;
  const converted = amountInInr * rate;
  return Math.round(converted * 100) / 100;
}

/**
 * Converts a foreign currency amount back to base INR
 */
export function convertToInr(amountInForeign: number, sourceCurrency: string, rates: ForexRates = FALLBACK_RATES): number {
  if (!amountInForeign || isNaN(amountInForeign)) return 0;
  const code = (sourceCurrency || 'INR').toUpperCase().trim();
  if (code === 'INR' || code === '₹' || code === 'RUPEE') return amountInForeign;

  const inrRate = getInrPerForeignUnit(code, rates);
  const inrValue = amountInForeign * inrRate;
  return Math.round(inrValue * 100) / 100;
}
