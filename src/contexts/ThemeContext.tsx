import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
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

  // Load theme from user settings
  useEffect(() => {
    const loadTheme = async () => {
      if (user) {
        try {
          const { data } = await supabase
            .from('user_settings')
            .select('dark_mode')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data) {
            setTheme(data.dark_mode ? 'dark' : 'light');
          } else {
            setTheme('light');
          }
        } catch (error) {
          console.error('Error loading theme:', error);
          setTheme('light');
        }
      } else {
        // Load from localStorage for non-authenticated users
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
          setTheme(savedTheme);
        }
      }
    };

    loadTheme();
  }, [user]);

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
    // More descriptive error with debugging info
    console.error('useTheme must be used within a ThemeProvider. Make sure ThemeProvider wraps your component tree.');
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
