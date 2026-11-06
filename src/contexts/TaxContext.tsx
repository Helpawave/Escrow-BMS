import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, serviceSupabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import {
  CountryTaxConfig,
  TAX_COUNTRIES,
  TaxSystem,
  getCountryTaxConfig,
  isVatCountry,
  isGstCountry
} from '@/data/taxCountries';
import { useCurrency } from './CurrencyContext';

const LOCAL_STORAGE_COUNTRY_KEY = 'escrow_business_country';
const LOCAL_STORAGE_CONFIGURED_FLAG = 'escrow_business_country_configured';

export interface TaxContextType {
  businessCountry: CountryTaxConfig;
  countryCode: string;
  countryName: string;
  taxSystem: TaxSystem;
  taxName: string;
  taxIdLabel: string;
  taxIdPlaceholder: string;
  standardTaxRate: number;
  taxRates: number[];
  hasSubTaxes: boolean;
  currencyCode: string;
  currencySymbol: string;
  isVat: boolean;
  isGst: boolean;
  isSalesTax: boolean;
  isCountryConfigured: boolean;
  loading: boolean;
  updateBusinessCountry: (countryCodeOrName: string) => Promise<{ success: boolean; error?: string }>;
}

const TaxContext = createContext<TaxContextType | undefined>(undefined);

export const TaxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, companyProfile, effectiveUserId, isStaff, refreshProfile } = useAuth();
  const { setCurrencyCode } = useCurrency();

  const [countryCode, setCountryCode] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_COUNTRY_KEY);
      if (saved) return saved;
      const savedCurr = localStorage.getItem('currency');
      if (savedCurr) {
        const byCurr = getCountryTaxConfig(savedCurr);
        if (byCurr && byCurr.countryCode !== 'IN') return byCurr.countryCode;
      }
    } catch {}
    return 'IN';
  });

  const [isCountryConfigured, setIsCountryConfigured] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_CONFIGURED_FLAG) === 'true';
    } catch {
      return false;
    }
  });

  const [loading, setLoading] = useState(true);

  // Listen to real-time custom events across windows / tabs / components
  useEffect(() => {
    const handleTaxChange = (e: any) => {
      if (e?.detail?.countryCode) {
        setCountryCode(e.detail.countryCode);
        setIsCountryConfigured(true);
      }
    };
    window.addEventListener('escrow_tax_country_changed', handleTaxChange);
    return () => window.removeEventListener('escrow_tax_country_changed', handleTaxChange);
  }, []);

  // Synchronize country from localStorage / user_settings / profile
  useEffect(() => {
    const resolveCountry = async () => {
      const activeProf = companyProfile || profile;
      const targetUserId = effectiveUserId || user?.id;

      // 1. If explicit choice exists and was configured in localStorage, honor it permanently
      const saved = localStorage.getItem(LOCAL_STORAGE_COUNTRY_KEY);
      const isConfigured = localStorage.getItem(LOCAL_STORAGE_CONFIGURED_FLAG) === 'true';
      if (saved && isConfigured) {
        const config = getCountryTaxConfig(saved);
        setCountryCode(config.countryCode);
        setIsCountryConfigured(true);
        setLoading(false);

        // Ensure user_settings in Supabase has the matching currency if logged in
        if (targetUserId) {
          try {
            await (supabase as any)
              .from('user_settings')
              .upsert({ user_id: targetUserId, default_currency: config.currencyCode }, { onConflict: 'user_id' });
          } catch {}
        }
        return;
      }

      // 2. Check user_settings default_currency from Supabase
      if (targetUserId) {
        try {
          const { data } = await (supabase as any)
            .from('user_settings')
            .select('default_currency')
            .eq('user_id', targetUserId)
            .maybeSingle();

          if (data?.default_currency) {
            const config = getCountryTaxConfig(data.default_currency);
            if (config) {
              setCountryCode(config.countryCode);
              setIsCountryConfigured(true);
              try {
                localStorage.setItem(LOCAL_STORAGE_COUNTRY_KEY, config.countryCode);
                localStorage.setItem(LOCAL_STORAGE_CONFIGURED_FLAG, 'true');
                localStorage.setItem('currency', config.currencyCode);
                localStorage.setItem('currency_symbol', config.currencySymbol);
              } catch {}
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Tax setting resolution note:', e);
        }
      }

      // 3. Check profile country
      const profCountry = (activeProf as any)?.country;
      if (profCountry) {
        const config = getCountryTaxConfig(profCountry);
        setCountryCode(config.countryCode);
        setIsCountryConfigured(true);
        try {
          localStorage.setItem(LOCAL_STORAGE_COUNTRY_KEY, config.countryCode);
          localStorage.setItem(LOCAL_STORAGE_CONFIGURED_FLAG, 'true');
          localStorage.setItem('currency', config.currencyCode);
          localStorage.setItem('currency_symbol', config.currencySymbol);
        } catch {}
        setLoading(false);
        return;
      }

      // 4. Fallback to localStorage or default (India)
      if (saved) {
        const config = getCountryTaxConfig(saved);
        setCountryCode(config.countryCode);
        setIsCountryConfigured(isConfigured);
      }

      setLoading(false);
    };

    if (user) {
      resolveCountry();
    } else {
      setLoading(false);
    }
  }, [user, effectiveUserId]);

  const businessCountry = useMemo(() => {
    return getCountryTaxConfig(countryCode);
  }, [countryCode]);

  // Update business country and sync across user profile, settings, currency & local cache
  const updateBusinessCountry = useCallback(
    async (countryCodeOrName: string): Promise<{ success: boolean; error?: string }> => {
      const config = getCountryTaxConfig(countryCodeOrName);
      setCountryCode(config.countryCode);
      setIsCountryConfigured(true);

      try {
        localStorage.setItem(LOCAL_STORAGE_COUNTRY_KEY, config.countryCode);
        localStorage.setItem(LOCAL_STORAGE_CONFIGURED_FLAG, 'true');
        localStorage.setItem('currency', config.currencyCode);
        localStorage.setItem('currency_symbol', config.currencySymbol);
      } catch {}

      // Automatically sync currency to country standard
      try {
        setCurrencyCode(config.currencyCode);
      } catch (currErr) {
        console.warn('Currency auto-sync note:', currErr);
      }

      // Realtime event dispatch across components & tabs
      try {
        window.dispatchEvent(new CustomEvent('escrow_tax_country_changed', { detail: config }));
      } catch {}

      const targetUserId = effectiveUserId || user?.id;
      if (!targetUserId) return { success: true };

      try {
        // 1. Update in user_settings table using authenticated supabase client
        try {
          const { error: usErr } = await (supabase as any)
            .from('user_settings')
            .upsert(
              {
                user_id: targetUserId,
                default_currency: config.currencyCode,
              },
              { onConflict: 'user_id' }
            );

          if (usErr) {
            await (supabase as any)
              .from('user_settings')
              .update({ default_currency: config.currencyCode })
              .eq('user_id', targetUserId);
          }
        } catch (usErr) {
          console.warn('user_settings save note:', usErr);
        }

        // 2. Update in profiles table (country column)
        try {
          await (supabase as any)
            .from('profiles')
            .update({
              country: config.countryName,
            })
            .eq('id', targetUserId);
        } catch (profErr) {
          console.warn('Profile update country note:', profErr);
        }

        // 3. Refresh profile in auth context
        try {
          refreshProfile?.();
        } catch {}

        return { success: true };
      } catch (err: any) {
        console.warn('Save business country DB note:', err);
        return { success: true };
      }
    },
    [effectiveUserId, user?.id, setCurrencyCode, refreshProfile]
  );

  const value = useMemo<TaxContextType>(() => {
    return {
      businessCountry,
      countryCode: businessCountry.countryCode,
      countryName: businessCountry.countryName,
      taxSystem: businessCountry.taxSystem,
      taxName: businessCountry.taxName,
      taxIdLabel: businessCountry.taxIdLabel,
      taxIdPlaceholder: businessCountry.taxIdPlaceholder,
      standardTaxRate: businessCountry.standardTaxRate,
      taxRates: businessCountry.taxRates,
      hasSubTaxes: businessCountry.hasSubTaxes,
      currencyCode: businessCountry.currencyCode,
      currencySymbol: businessCountry.currencySymbol,
      isVat: businessCountry.taxSystem === 'VAT',
      isGst: businessCountry.taxSystem === 'GST',
      isSalesTax: businessCountry.taxSystem === 'SALES_TAX',
      isCountryConfigured,
      loading,
      updateBusinessCountry,
    };
  }, [businessCountry, isCountryConfigured, loading, updateBusinessCountry]);

  return <TaxContext.Provider value={value}>{children}</TaxContext.Provider>;
};

export const useTaxConfig = (): TaxContextType => {
  const context = useContext(TaxContext);
  if (context === undefined) {
    const defaultCountry = TAX_COUNTRIES[0];
    return {
      businessCountry: defaultCountry,
      countryCode: defaultCountry.countryCode,
      countryName: defaultCountry.countryName,
      taxSystem: defaultCountry.taxSystem,
      taxName: defaultCountry.taxName,
      taxIdLabel: defaultCountry.taxIdLabel,
      taxIdPlaceholder: defaultCountry.taxIdPlaceholder,
      standardTaxRate: defaultCountry.standardTaxRate,
      taxRates: defaultCountry.taxRates,
      hasSubTaxes: defaultCountry.hasSubTaxes,
      currencyCode: defaultCountry.currencyCode,
      currencySymbol: defaultCountry.currencySymbol,
      isVat: false,
      isGst: true,
      isSalesTax: false,
      isCountryConfigured: true,
      loading: false,
      updateBusinessCountry: async () => ({ success: true }),
    };
  }
  return context;
};

