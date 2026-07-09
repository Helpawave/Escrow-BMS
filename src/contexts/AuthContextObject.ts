import { createContext } from 'react';
import { User, Session, AuthError, RealtimeChannel } from '@supabase/supabase-js';

export interface Profile {
  user_id: string;
  company_name: string | null;
  business_address: string | null;
  phone: string | null;
  mobile: string | null;
  gstin: string | null;
  state: string | null;
  city: string | null;
  pincode: string | null;
  is_blocked: boolean;
  subscription_expires_at: string | null;
  logo_url: string | null;
  is_paid: boolean;
  role: 'user' | 'admin';
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, companyName?: string, mobile?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  isSupabaseConnected: boolean | null;
  profile: Profile | null;
  isSubscribed: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  isBlocked: boolean;
  isBusinessSetup: boolean;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
