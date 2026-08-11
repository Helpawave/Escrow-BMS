import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface UserSettingsData {
  dark_mode: boolean;
  default_currency: string;
  default_payment_terms: string;
  invoice_template: string;
  hide_company_details: boolean;
}

interface UserSettingsContextType {
  settings: UserSettingsData | null;
  loading: boolean;
  refetchSettings: () => Promise<void>;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const UserSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const lastFetchedUserIdRef = useRef<string | null>(null);

  const fetchUserSettings = async (userId: string, force = false) => {
    if (!force && lastFetchedUserIdRef.current === userId) {
      return;
    }
    lastFetchedUserIdRef.current = userId;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('dark_mode, default_currency, default_payment_terms, invoice_template, hide_company_details')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          dark_mode: data.dark_mode ?? false,
          default_currency: data.default_currency || 'INR',
          default_payment_terms: data.default_payment_terms || 'Net 30',
          invoice_template: data.invoice_template || 'corporate',
          hide_company_details: data.hide_company_details ?? false,
        });
      } else {
        setSettings(null);
      }
    } catch (err) {
      console.error('Error fetching user_settings:', err);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserSettings(user.id);
    } else {
      lastFetchedUserIdRef.current = null;
      setSettings(null);
      setLoading(false);
    }
  }, [user]);

  const refetchSettings = async () => {
    if (user) {
      await fetchUserSettings(user.id, true);
    }
  };

  return (
    <UserSettingsContext.Provider value={{ settings, loading, refetchSettings }}>
      {children}
    </UserSettingsContext.Provider>
  );
};

export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  return context;
};
