/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { syncUserAcrossAllModules, ensureDefaultLedgerParties } from '@/utils/erpPosting';

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
  parent_user_id?: string | null;
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
  userRoles: string[];
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signUp: (email: string, password: string, fullName: string, companyName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
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
  hasRole: (...roles: string[]) => boolean;
  refreshUser?: () => Promise<void>;
  checkUserApprovalStatus?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Helper for cached profile
const getCachedProfile = (): Profile | null => {
  try {
    const item = localStorage.getItem('escrow_cached_profile');
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

// ── Provider ───────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(getCachedProfile);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('escrow_is_superadmin') === 'true';
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(true);
  const lastFetchedUserIdRef = React.useRef<string | null>(null);

  const fetchProfile = async (userId: string, email?: string, forceRefresh = false) => {
    if (!forceRefresh && lastFetchedUserIdRef.current === userId) {
      return;
    }
    lastFetchedUserIdRef.current = userId;

    console.log('[PERF] profiles fetch & user_roles fetch');
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId)
      ]);

      let data = profileRes.data;
      if (!data) {
        // Profile not created yet (trigger may not have fired) — create it
        let parentUserId: string | null = null;
        if (email) {
          try {
            const { data: empMatch } = await supabase
              .from('employees')
              .select('user_id')
              .eq('email', email)
              .maybeSingle();
            if (empMatch?.user_id) {
              parentUserId = empMatch.user_id;
            }
          } catch {}
        }
        const { data: created } = await supabase
          .from('profiles')
          .insert({ id: userId, role: parentUserId ? 'member' : 'admin', parent_user_id: parentUserId })
          .select()
          .maybeSingle();
        if (created) {
          data = created;
        }
      }

      if (data) {
        setProfile(data as Profile);
        try { localStorage.setItem('escrow_cached_profile', JSON.stringify(data)); } catch { }
      }

      // Check if user is superadmin strictly in database (user_roles table or profile.role)
      const roles = rolesRes.data;
      const fetchedRoles: string[] = roles ? roles.map((r: any) => r.role) : [];
      setUserRoles(fetchedRoles);
      const hasSuperRole = fetchedRoles.includes('super_admin') || data?.role === 'super_admin';
      setIsSuperAdmin(hasSuperRole);
      // Auto-ensure 2 default ledger parties (Take & Give) for new user accounts
      ensureDefaultLedgerParties(userId).catch(() => {});
    } catch (e) {
      console.error('Error loading profile:', e);
    }
  };

  // Restore session on mount
  useEffect(() => {
    console.log('[PERF] AuthContext init');
    let isMounted = true;

    // Safety fallback: Ensure loading is NEVER stuck for more than 500ms
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 500);

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      if (initialSession) {
        setSession(initialSession as any);
        setUser(initialSession.user as any);
        // Non-blocking async fetch
        fetchProfile(initialSession.user.id, initialSession.user.email);
      }
      setLoading(false);
      clearTimeout(safetyTimer);
    }).catch((err) => {
      console.error('Session get error:', err);
      if (isMounted) setLoading(false);
      clearTimeout(safetyTimer);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!isMounted) return;
      if (currentSession) {
        setSession(currentSession as any);
        setUser(currentSession.user as any);
        if (event !== 'SIGNED_IN') {
          fetchProfile(currentSession.user.id, currentSession.user.email);
        }
      } else {
        lastFetchedUserIdRef.current = null;
        setSession(null);
        setUser(null);
        setProfile(null);
        setUserRoles([]);
        setIsSuperAdmin(false);
        try {
          localStorage.removeItem('escrow_cached_profile');
          localStorage.removeItem('escrow_is_superadmin');
        } catch { }
      }
      setLoading(false);
      clearTimeout(safetyTimer);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id, user.email, true);
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.session && data?.user) {
      setSession(data.session as any);
      setUser(data.user as any);
      // Fetch profile with valid session token immediately during login
      await fetchProfile(data.user.id, data.user.email, true);
    }
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard',
      }
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    lastFetchedUserIdRef.current = null;
    setSession(null);
    setUser(null);
    setProfile(null);
    setUserRoles([]);
    setIsSuperAdmin(false);
    try {
      localStorage.removeItem('escrow_cached_profile');
      localStorage.removeItem('escrow_is_superadmin');
    } catch { }
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
  const isBusinessSetup = !!(profile?.company_name && profile?.company_name.trim() !== '');
  const isBlocked = !!(profile as any)?.is_blocked;

  // ── Subscription / Trial Calculations ─────────────────────────
  const { isSubscribed, isTrialActive, trialDaysRemaining } = React.useMemo(() => {
    if (!profile) {
      return { isSubscribed: true, isTrialActive: false, trialDaysRemaining: 0 };
    }

    // Super Admin is always fully subscribed
    if (profile.role === 'super_admin') {
      return { isSubscribed: true, isTrialActive: false, trialDaysRemaining: 0 };
    }

    const expiresAt = (profile as any).subscription_expires_at;
    const hasActiveFutureExpiry = expiresAt ? new Date(expiresAt).getTime() > Date.now() : false;
    const plan = (profile.plan_type || 'free').toLowerCase();
    const isPaid = !!profile.is_paid || hasActiveFutureExpiry || (plan !== 'free' && plan !== '' && plan !== 'null' && plan !== 'undefined');

    // If the plan is extended by Admin or marked as paid / pro
    if (isPaid) {
      return { isSubscribed: true, isTrialActive: false, trialDaysRemaining: 0 };
    }

    // For free trial accounts (within initial 14 days)
    const createdDate = profile.created_at ? new Date(profile.created_at) : new Date();
    const diffTime = Date.now() - createdDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const daysRemaining = Math.max(0, 14 - diffDays);
    const active = diffDays < 14;

    return {
      isSubscribed: active,
      isTrialActive: active,
      trialDaysRemaining: daysRemaining
    };
  }, [profile]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      role: profile?.role || null,
      userRoles,
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
      isBlocked,
      isBusinessSetup,
      isSupabaseConnected: true,
      hasRole: (...rolesToCheck: string[]) => rolesToCheck.some(r => profile?.role === r || (r === 'admin' && profile?.role === 'admin') || (r === 'super_admin' && isSuperAdmin)),
      refreshUser: async () => { },
      checkUserApprovalStatus: async () => { }
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
