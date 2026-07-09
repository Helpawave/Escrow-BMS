/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──────────────────────────────────────────────────────
interface Profile {
  id: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  role: 'user' | 'admin' | string;
  avatar_url: string | null;
  subscription_expires_at?: string | null;
  company_phone?: string | null;
  company_address?: string | null;
  company_website?: string | null;
  plan_type?: string | null;
  is_paid?: boolean | null;
  // daily-hisab compatibility fields
  name?: string | null;
  mobile?: string | null;
  email?: string | null;
  created_at?: string | null;
  is_allowed?: boolean | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  password_text?: string | null;
  workspace_admin_password?: string | null;
  has_password?: boolean | null;
  approval_expires_at?: string | null;
  approved_at?: string | null;
  isTrialActive?: boolean;
  trialDaysRemaining?: number;
}

type User = {
  id: string;
  email: string;
  created_at?: string;
  user_metadata: {
    full_name?: string;
    company_name?: string;
    dismissed_broadcasts?: string[];
  };
  companyName?: string;
  is_allowed?: boolean;
  name?: string;
  phone?: string;
  approval_expires_at?: string;
  approved_at?: string;
  role?: string;
};

type Session = {
  user: User;
  access_token: string;
};

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: string | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signUp: (email: string, password: string, fullName: string, companyName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  // Compatibility properties for other modules
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (email: string, password: string, fullName: string, companyName: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  resetPassword: (email?: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Record<string, unknown>) => Promise<{ error: Error | null }>;
  updateUser: (updates: any) => Promise<{ error: Error | null }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  isLoading: boolean;
  isInitialized: boolean;
  isSubscribed: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  isBlocked: boolean;
  isBusinessSetup: boolean;
  isSupabaseConnected: boolean;
  hasRole: (role: string, ...args: any[]) => boolean;
  refreshUser?: () => Promise<void>;
  checkUserApprovalStatus?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) {
        setProfile(data as Profile);
      } else {
        // Profile not created yet (trigger may not have fired) — create it
        const { data: created } = await supabase
          .from('profiles')
          .insert({ id: userId, role: 'admin', plan_type: 'free' })
          .select()
          .maybeSingle();
        if (created) setProfile(created as Profile);
      }

      // Check if user is superadmin in user_roles or email list
      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', userId);
      const hasSuperRole = roles?.some((r: any) => r.role === 'super_admin') || false;
      const isSuperEmail = email === 'admin_bms@escrowbms.com';
      setIsSuperAdmin(hasSuperRole || isSuperEmail);
    } catch (e) {
      console.error('Error loading profile:', e);
    }
  };

  // Restore session on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (initialSession) {
        setSession(initialSession as any);
        setUser(initialSession.user as any);
        await fetchProfile(initialSession.user.id, initialSession.user.email);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (currentSession) {
        setSession(currentSession as any);
        setUser(currentSession.user as any);
        await fetchProfile(currentSession.user.id, currentSession.user.email);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsSuperAdmin(false);
      }
      setLoading(false);
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id, user.email);
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    companyName: string
  ): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, company_name: companyName }
      }
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard',
      }
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Compatibility implementations
  const login = signIn;
  const signup = signUp;
  const logout = signOut;
  
  const resetPassword = async (email?: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email || user?.email || '', {
      redirectTo: window.location.origin + '/auth',
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (password: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error as Error | null };
  };

  const changePassword = async (_currentPassword: string, newPassword: string): Promise<boolean> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return !error;
  };

  const updateProfile = async (updates: any): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('No user logged in') };
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (!error) await refreshProfile();
    return { error: error as Error | null };
  };

  const updateUser = async (updates: any): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('No user logged in') };
    const { error } = await supabase.auth.updateUser({
      data: updates
    });
    return { error: error as Error | null };
  };

  const isAdmin = profile?.role === 'admin';
  const isBusinessSetup = !!profile?.company_name;

  // ── Subscription / Trial Calculations ─────────────────────────
  const { isSubscribed, isTrialActive, trialDaysRemaining } = React.useMemo(() => {
    if (!profile) {
      return { isSubscribed: true, isTrialActive: false, trialDaysRemaining: 0 };
    }

    // Super Admin is always fully subscribed
    if (profile.role === 'super_admin') {
      return { isSubscribed: true, isTrialActive: false, trialDaysRemaining: 0 };
    }

    const plan = (profile.plan_type || 'free').toLowerCase();
    const isPaid = !!profile.is_paid;
    
    // For free trial accounts
    if (plan === 'free' && !isPaid) {
      const createdDate = profile.created_at ? new Date(profile.created_at) : new Date();
      const diffTime = Date.now() - createdDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const daysRemaining = Math.max(0, 14 - diffDays);
      const active = diffDays < 14;
      
      return {
        isSubscribed: active, // Subscribed is true while trial is active, becomes false once trial is expired!
        isTrialActive: active,
        trialDaysRemaining: daysRemaining
      };
    }

    // For paid subscription plans (starter, growth, enterprise, monthly, yearly, pro)
    return { isSubscribed: true, isTrialActive: false, trialDaysRemaining: 0 };
  }, [profile]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      role: profile?.role || null,
      loading, 
      isAdmin, 
      isSuperAdmin,
      signUp, 
      signIn, 
      signInWithGoogle, 
      signOut, 
      refreshProfile,
      login,
      signup,
      logout,
      resetPassword,
      updatePassword,
      updateProfile,
      updateUser,
      changePassword,
      isLoading: loading,
      isInitialized: !loading,
      isSubscribed,
      isTrialActive,
      trialDaysRemaining,
      isBlocked: false,
      isBusinessSetup,
      isSupabaseConnected: true,
      hasRole: (roleToCheck: string) => profile?.role === roleToCheck,
      refreshUser: async () => {},
      checkUserApprovalStatus: async () => {}
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
