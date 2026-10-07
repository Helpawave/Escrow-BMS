import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, serviceSupabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
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
  formatAmount: (amountInINR: number, options?: { showSymbol?: boolean; decimals?: number }) => string;
  setCurrencyCode: (code: string) => void;
  setCurrencySymbol: (symbol: string) => void;
  refreshRates: () => Promise<void>;
  loading: boolean;
  isFallbackRate: boolean;
  ratesTimestamp: number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currencyCode, setCurrencyCodeState] = useState<string>('INR');
  const [currencySymbol, setCurrencySymbolState] = useState<string>('₹');
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
        const client = (serviceSupabase || supabase) as any;
        const { data, error } = await client
          .from('user_settings')
          .select('default_currency')
          .eq('user_id', targetId)
          .maybeSingle();

        if (error) throw error;

        const settings = data as unknown as { default_currency: string } | null;
        const currencyValue = settings?.default_currency?.trim() || 'INR';
        const code = currencyValue.toUpperCase();
        const symbol = CURRENCY_SYMBOLS[code] || CURRENCY_SYMBOLS[currencyValue] || '₹';

        setCurrencyCodeState(code);
        setCurrencySymbolState(symbol);
      } catch (error) {
        console.error('Error fetching currency setting:', error);
        setCurrencyCodeState('INR');
        setCurrencySymbolState('₹');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrency();
  }, [user, effectiveUserId]);

  const setCurrencyCode = useCallback((code: string) => {
    const normalized = (code || 'INR').toUpperCase().trim();
    const symbol = CURRENCY_SYMBOLS[normalized] || '₹';
    setCurrencyCodeState(normalized);
    setCurrencySymbolState(symbol);
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

  const formatAmount = useCallback((amountInINR: number, options?: { showSymbol?: boolean; decimals?: number }): string => {
    const showSymbol = options?.showSymbol !== false;
    const decimals = options?.decimals ?? 2;
    const converted = convertFromInr(amountInINR, currencyCode, rates);
    const formatted = converted.toLocaleString(currencyCode === 'INR' ? 'en-IN' : 'en-US', {
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
