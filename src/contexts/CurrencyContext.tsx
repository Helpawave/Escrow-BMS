import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface CurrencyContextType {
    currencySymbol: string;
    setCurrencySymbol: (symbol: string) => void;
    loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currencySymbol, setCurrencySymbol] = useState('₹');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchCurrency = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('user_settings')
                    .select('default_currency')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (error) throw error;

                const symbolMap: Record<string, string> = {
                    'INR': '₹',
                    'USD': '$',
                    'EUR': '€',
                    'GBP': '£',
                    'DOLLAR': '$',
                    'RUPEE': '₹',
                    'EURO': '€',
                    'POUND': '£',
                    '₹': '₹',
                    '$': '$',
                    '€': '€',
                    '£': '£'
                };

                const settings = data as unknown as { default_currency: string } | null;
                const currencyValue = settings?.default_currency?.trim() || 'INR';
                const currencyCode = currencyValue.toUpperCase();
                
                // Strict fallback: always default to Rupee if mapping fails or is empty
                const symbol = symbolMap[currencyCode] || symbolMap[currencyValue] || '₹';
                
                setCurrencySymbol(symbol);
            } catch (error) {
                console.error('Error fetching currency setting:', error);
                setCurrencySymbol('₹'); // Default on error
            } finally {
                setLoading(false);
            }
        };

        fetchCurrency();
    }, [user]);

    return (
        <CurrencyContext.Provider value={{ currencySymbol, setCurrencySymbol, loading }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
