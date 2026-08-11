import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useUserSettings } from './UserSettingsContext';

interface CurrencyContextType {
    currencySymbol: string;
    setCurrencySymbol: (symbol: string) => void;
    loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currencySymbol, setCurrencySymbol] = useState('₹');
    const { user } = useAuth();
    const userSettings = useUserSettings();
    const loading = userSettings?.loading ?? false;

    useEffect(() => {
        if (!user) {
            setCurrencySymbol('₹');
            return;
        }

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

        const currencyValue = userSettings?.settings?.default_currency?.trim() || 'INR';
        const currencyCode = currencyValue.toUpperCase();
        
        // Strict fallback: always default to Rupee if mapping fails or is empty
        const symbol = symbolMap[currencyCode] || symbolMap[currencyValue] || '₹';
        setCurrencySymbol(symbol);
    }, [user, userSettings?.settings]);

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
