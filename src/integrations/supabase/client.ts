import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Standard Vite environment variable access
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Singleton pattern to prevent "Multiple GoTrueClient instances detected" warning
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;
let serviceSupabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance;

  // Defensive check for missing configuration
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.error(
      'CRITICAL: Supabase environment variables are missing! ' +
      'Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are defined in your .env file.'
    );
    if (!SUPABASE_URL) throw new Error("Supabase URL is missing. Check your VITE_SUPABASE_URL environment variable.");
    if (!SUPABASE_PUBLISHABLE_KEY) throw new Error("Supabase Anon Key is missing. Check your VITE_SUPABASE_PUBLISHABLE_KEY environment variable.");
  }

  supabaseInstance = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      storageKey: 'escrow-auth-token',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  });

  return supabaseInstance;
})();

export const serviceSupabase = (() => {
  if (serviceSupabaseInstance) return serviceSupabaseInstance;
  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_PUBLISHABLE_KEY;
  if (SUPABASE_URL && key) {
    serviceSupabaseInstance = createClient<Database>(SUPABASE_URL, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        },
      },
      global: {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      },
    });
    return serviceSupabaseInstance;
  }
  return supabase;
})();
