import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, serviceSupabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { getCountryTaxConfig } from '@/data/taxCountries';
import {
  ForexRates,
  FALLBACK_RATES,
  CURRENCY_SYMBOLS,
  getLiveForexRates,
  getInrPerForeignUnit,
  convertFromInr,
  convertToInr
} from '@/utils/forex';

export interface CurrencyContextType {
  currencyCode: string;
  currencySymbol: string;
  rates: ForexRates;
  exchangeRate: number; // 1 INR in current currency
  inrPerUnit: number;   // 1 foreign unit in INR (e.g. 95.51)
  convertFromINR: (amountInINR: number) => number;
  convertToINR: (amountInForeign: number) => number;
  formatAmount: (amount: number, options?: { showSymbol?: boolean; decimals?: number; convertFromInr?: boolean }) => string;
  setCurrencyCode: (code: string) => void;
  setCurrencySymbol: (symbol: string) => void;
  refreshRates: () => Promise<void>;
  loading: boolean;
  isFallbackRate: boolean;
  ratesTimestamp: number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currencyCode, setCurrencyCodeState] = useState<string>(() => {
    try {
      const savedCountry = localStorage.getItem('escrow_business_country');
      if (savedCountry) {
        return getCountryTaxConfig(savedCountry).currencyCode;
      }
      const savedCurr = localStorage.getItem('currency');
      if (savedCurr) return savedCurr.toUpperCase();
    } catch {}
    return 'INR';
  });
  const [currencySymbol, setCurrencySymbolState] = useState<string>(() => {
    try {
      const savedCountry = localStorage.getItem('escrow_business_country');
      if (savedCountry) {
        return getCountryTaxConfig(savedCountry).currencySymbol;
      }
      const savedCurr = localStorage.getItem('currency');
      if (savedCurr) return CURRENCY_SYMBOLS[savedCurr.toUpperCase()] || '₹';
    } catch {}
    return '₹';
  });
  const [rates, setRates] = useState<ForexRates>(FALLBACK_RATES);
  const [isFallbackRate, setIsFallbackRate] = useState<boolean>(false);
  const [ratesTimestamp, setRatesTimestamp] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);
  const { user, effectiveUserId } = useAuth();

  // Fetch live exchange rates
  const loadRates = useCallback(async () => {
    try {
      const data = await getLiveForexRates();
      setRates(data.rates);
      setIsFallbackRate(data.isFallback);
      setRatesTimestamp(data.timestamp);
    } catch (e) {
      console.error('Error fetching live forex rates:', e);
      setRates(FALLBACK_RATES);
      setIsFallbackRate(true);
    }
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  // Fetch user default currency setting
  useEffect(() => {
    const fetchCurrency = async () => {
      const targetId = effectiveUserId || user?.id;
      if (!targetId) {
        setLoading(false);
        return;
      }

      try {
        // Priority 1: If user explicitly configured a business country, use its standard currency
        const savedCountry = localStorage.getItem('escrow_business_country');
        const isConfigured = localStorage.getItem('escrow_business_country_configured') === 'true';
        let code: string | null = null;

        if (savedCountry && isConfigured) {
          const explicitConfig = getCountryTaxConfig(savedCountry);
          code = explicitConfig.currencyCode;
        }

        // Priority 2: Check user_settings from Supabase
        if (!code) {
          try {
            const { data } = await (supabase as any)
              .from('user_settings')
              .select('default_currency')
              .eq('user_id', targetId)
              .maybeSingle();

            if (data?.default_currency) {
              code = data.default_currency.trim().toUpperCase();
            }
          } catch (e) {
            console.warn('Error reading user_settings default_currency:', e);
          }
        }

        // Priority 3: Check profile country if available
        if (!code) {
          try {
            const { data: profData } = await (supabase as any)
              .from('profiles')
              .select('country')
              .eq('id', targetId)
              .maybeSingle();

            if (profData?.country) {
              const countryConfig = getCountryTaxConfig(profData.country);
              code = countryConfig.currencyCode;
            }
          } catch {}
        }

        // Fallback default
        if (!code) {
          code = savedCountry ? getCountryTaxConfig(savedCountry).currencyCode : 'INR';
        }

        const symbol = CURRENCY_SYMBOLS[code] || getCountryTaxConfig(code).currencySymbol || '₹';
        setCurrencyCodeState(code);
        setCurrencySymbolState(symbol);

        try {
          localStorage.setItem('currency', code);
          localStorage.setItem('currency_symbol', symbol);
        } catch {}

        // Ensure user_settings in Supabase is synced if different
        try {
          await (supabase as any)
            .from('user_settings')
            .upsert({ user_id: targetId, default_currency: code }, { onConflict: 'user_id' });
        } catch {}
      } catch (error) {
        console.error('Error fetching currency setting:', error);
        try {
          const savedCountry = localStorage.getItem('escrow_business_country');
          if (savedCountry) {
            const cfg = getCountryTaxConfig(savedCountry);
            setCurrencyCodeState(cfg.currencyCode);
            setCurrencySymbolState(cfg.currencySymbol);
          } else {
            setCurrencyCodeState('INR');
            setCurrencySymbolState('₹');
          }
        } catch {
          setCurrencyCodeState('INR');
          setCurrencySymbolState('₹');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCurrency();
  }, [user, effectiveUserId]);

  const setCurrencyCode = useCallback((code: string) => {
    const normalized = (code || 'INR').toUpperCase().trim();
    const symbol = CURRENCY_SYMBOLS[normalized] || getCountryTaxConfig(normalized).currencySymbol || '₹';
    setCurrencyCodeState(normalized);
    setCurrencySymbolState(symbol);
    try {
      localStorage.setItem('currency', normalized);
      localStorage.setItem('currency_symbol', symbol);
    } catch {}
  }, []);

  const setCurrencySymbol = useCallback((symbol: string) => {
    setCurrencySymbolState(symbol);
    const foundCode = Object.keys(CURRENCY_SYMBOLS).find(k => CURRENCY_SYMBOLS[k] === symbol);
    if (foundCode) {
      setCurrencyCodeState(foundCode);
    }
  }, []);

  // Multipliers
  const exchangeRate = rates[currencyCode] || 1;
  const inrPerUnit = getInrPerForeignUnit(currencyCode, rates);

  // Conversion helpers
  const convertFromINR = useCallback((amountInINR: number): number => {
    return convertFromInr(amountInINR, currencyCode, rates);
  }, [currencyCode, rates]);

  const convertToINR = useCallback((amountInForeign: number): number => {
    return convertToInr(amountInForeign, currencyCode, rates);
  }, [currencyCode, rates]);

  const formatAmount = useCallback((amount: number, options?: { showSymbol?: boolean; decimals?: number; convertFromInr?: boolean }): string => {
    const showSymbol = options?.showSymbol !== false;
    const decimals = options?.decimals ?? 2;
    const val = options?.convertFromInr ? convertFromInr(amount, currencyCode, rates) : (amount || 0);
    const locale = currencyCode === 'INR' ? 'en-IN' : currencyCode === 'GBP' ? 'en-GB' : currencyCode === 'EUR' ? 'de-DE' : 'en-US';
    const formatted = val.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    return showSymbol ? `${currencySymbol} ${formatted}` : formatted;
  }, [currencyCode, currencySymbol, rates]);

  return (
    <CurrencyContext.Provider value={{
      currencyCode,
      currencySymbol,
      rates,
      exchangeRate,
      inrPerUnit,
      convertFromINR,
      convertToINR,
      formatAmount,
      setCurrencyCode,
      setCurrencySymbol,
      refreshRates: loadRates,
      loading,
      isFallbackRate,
      ratesTimestamp
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    return {
      currencyCode: 'INR',
      currencySymbol: '₹',
      rates: FALLBACK_RATES,
      exchangeRate: 1,
      inrPerUnit: 1,
      convertFromINR: (amt: number) => amt,
      convertToINR: (amt: number) => amt,
      formatAmount: (amt: number) => `₹${(amt || 0).toLocaleString()}`,
      setCurrencyCode: () => {},
      setCurrencySymbol: () => {},
      refreshRates: async () => {},
      loading: false,
      isFallbackRate: false,
      ratesTimestamp: Date.now()
    };
  }
  return context;
};
