import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useUserSettings } from './UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
  }
  return 'light';
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const { user } = useAuth();
  const userSettings = useUserSettings();

  // Load theme from userSettings context or localStorage
  useEffect(() => {
    if (user) {
      if (userSettings?.settings) {
        setTheme(userSettings.settings.dark_mode ? 'dark' : 'light');
      }
    } else {
      // Load from localStorage for non-authenticated users
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    }
  }, [user, userSettings?.settings]);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    // Update user settings if authenticated
    if (user) {
      supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          dark_mode: newTheme === 'dark'
        }, { onConflict: 'user_id' })
        .then(({ error }) => {
          if (error) console.error('Error updating theme:', error);
          if (!error && userSettings?.refetchSettings) {
            userSettings.refetchSettings();
          }
        });
    }
  };

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);

    // Update user settings if authenticated
    if (user) {
      supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          dark_mode: newTheme === 'dark'
        }, { onConflict: 'user_id' })
        .then(({ error }) => {
          if (error) console.error('Error updating theme:', error);
          if (!error && userSettings?.refetchSettings) {
            userSettings.refetchSettings();
          }
        });
    }
  };

  const value = {
    theme,
    setTheme: updateTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    const savedTheme = typeof window !== 'undefined' ? (localStorage.getItem('theme') as Theme) || 'light' : 'light';
    return {
      theme: (savedTheme === 'dark' ? 'dark' : 'light') as Theme,
      setTheme: () => {},
      toggleTheme: () => {
        if (typeof window !== 'undefined') {
          const current = localStorage.getItem('theme') === 'dark' ? 'light' : 'dark';
          localStorage.setItem('theme', current);
          document.documentElement.classList.toggle('dark', current === 'dark');
        }
      },
    };
  }
  return context;
}
