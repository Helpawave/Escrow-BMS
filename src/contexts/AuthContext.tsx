/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { syncUserAcrossAllModules, ensureDefaultLedgerParties } from '@/utils/erpPosting';
import { generateAccountId } from '@/utils/accountId';

// ── Types ──────────────────────────────────────────────────────
export interface Profile {
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
  is_staff?: boolean;
  company_id?: string | null;
  staff_role?: string | null;
  staff_permissions?: string[];
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

export type User = {
  id: string;
  email: string;
  created_at?: string;
  user_metadata: {
    full_name?: string;
    company_name?: string;
    is_staff?: boolean;
    company_id?: string;
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

export type Session = {
  user: User;
  access_token: string;
};

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: string | null;
  userRoles: string[];
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  companyId: string;
  isStaff: boolean;
  staffRole: string | null;
  staffPermissions: string[];
  staffName: string | null;
  companyOwnerId: string | null;
  effectiveUserId: string | null;
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
  const [isStaff, setIsStaff] = useState<boolean>(() => {
    try {
      return localStorage.getItem('escrow_is_staff') === 'true';
    } catch {
      return false;
    }
  });
  const [companyOwnerId, setCompanyOwnerId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('escrow_cached_effective_user_id') || null;
    } catch {
      return null;
    }
  });
  const [staffRole, setStaffRole] = useState<string | null>(null);
  const [staffPermissions, setStaffPermissions] = useState<string[]>([]);
  const [staffName, setStaffName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lastFetchedUserIdRef = useRef<string | null>(null);

  const fetchProfile = async (userId: string, email?: string, forceRefresh = false) => {
    if (!forceRefresh && lastFetchedUserIdRef.current === userId) {
      return;
    }
    lastFetchedUserIdRef.current = userId;

    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId)
      ]);

      let data = profileRes.data;
      if (!data) {
        // Profile not created yet — create it
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

      // Check if user is a staff member from profile or employees
      let staffData: any = null;
      if (data?.parent_user_id || data?.role === 'member') {
        staffData = {
          role: data?.role || 'member',
          name: data?.full_name || '',
          company_owner_id: data?.parent_user_id || '',
          permissions: ['billing', 'ledger', 'inventory', 'payroll', 'crm', 'hisab']
        };
      }

      if (!staffData && email) {
        try {
          const { data: empMatch } = await supabase
            .from('employees')
            .select('*')
            .or(`user_id.eq.${userId},email.eq.${email}`)
            .maybeSingle();
          if (empMatch) {
            staffData = {
              ...empMatch,
              company_owner_id: empMatch.user_id
            };
          }
        } catch {
          // Ignore
        }
      }

      // Check localStorage backup for staff records
      if (!staffData && email) {
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('escrow_company_staff_backup') || key.startsWith('escrow_employees_backup'))) {
              const stored = JSON.parse(localStorage.getItem(key) || '[]');
              const found = stored.find((s: any) => s.email?.toLowerCase() === email.toLowerCase());
              if (found) {
                staffData = found;
                break;
              }
            }
          }
        } catch {}
      }

      if (staffData) {
        setIsStaff(true);
        try { localStorage.setItem('escrow_is_staff', 'true'); } catch {}
        setStaffRole(staffData.role || 'Staff');
        setStaffName(staffData.name || null);
        const perms = Array.isArray(staffData.permissions)
          ? staffData.permissions
          : (typeof staffData.permissions === 'string' ? JSON.parse(staffData.permissions || '[]') : []);
        setStaffPermissions(perms);
        if (staffData.company_owner_id) {
          setCompanyOwnerId(staffData.company_owner_id);
          try { localStorage.setItem('escrow_cached_effective_user_id', staffData.company_owner_id); } catch {}
        }
      } else {
        setIsStaff(false);
        try { localStorage.removeItem('escrow_is_staff'); } catch {}
      }

      // Check if user is superadmin
      const roles = rolesRes.data;
      const fetchedRoles: string[] = roles ? roles.map((r: any) => r.role) : [];
      setUserRoles(fetchedRoles);
      const isDesignatedSuperadmin = email?.toLowerCase() === 'admin_bms@escrowbms.com';
      const hasSuperRole = fetchedRoles.includes('super_admin') || data?.role === 'super_admin' || isDesignatedSuperadmin;
      setIsSuperAdmin(hasSuperRole);
      try { localStorage.setItem('escrow_is_superadmin', hasSuperRole ? 'true' : 'false'); } catch {}

      if (isDesignatedSuperadmin && data && data.role !== 'super_admin') {
        supabase.from('profiles').update({ role: 'super_admin' }).eq('id', userId).then(() => {});
      }
      
      // Auto-ensure default ledger parties only for regular business accounts
      if (!hasSuperRole && !isDesignatedSuperadmin) {
        ensureDefaultLedgerParties(userId).catch(() => {});
      }
    } catch (e) {
      console.error('Error loading profile:', e);
    }
  };

  // Restore session on mount
  useEffect(() => {
    let isMounted = true;
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 500);

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      if (initialSession) {
        setSession(initialSession as any);
        setUser(initialSession.user as any);
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
        setIsStaff(false);
        setCompanyOwnerId(null);
        try {
          localStorage.removeItem('escrow_cached_profile');
          localStorage.removeItem('escrow_is_superadmin');
          localStorage.removeItem('escrow_is_staff');
          localStorage.removeItem('escrow_cached_effective_user_id');
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
        data: {
          full_name: fullName,
          company_name: companyName,
        },
      },
    });
    return { error };
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Compatibility methods
  const login = signIn;
  const signup = signUp;
  const logout = signOut;

  const resetPassword = async (email?: string): Promise<{ error: Error | null }> => {
    const targetEmail = email || user?.email;
    if (!targetEmail) return { error: new Error('Email is required') };
    const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (password: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const changePassword = async (_currentPassword: string, newPassword: string): Promise<boolean> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return !error;
  };

  const updateProfile = async (updates: Record<string, unknown>): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('Not authenticated') };
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      if (error) throw error;
      await fetchProfile(user.id, user.email, true);
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  const updateUser = async (updates: any): Promise<{ error: Error | null }> => {
    return updateProfile(updates);
  };

  const isAdmin = useMemo(() => {
    return isSuperAdmin || profile?.role === 'admin' || userRoles.includes('admin') || userRoles.includes('super_admin');
  }, [isSuperAdmin, profile?.role, userRoles]);

  const companyId = useMemo(() => {
    const effectiveOwnerId = profile?.parent_user_id || companyOwnerId || user?.id;
    return generateAccountId(effectiveOwnerId);
  }, [profile?.parent_user_id, companyOwnerId, user?.id]);

  const effectiveUserId = useMemo(() => {
    return profile?.parent_user_id || companyOwnerId || user?.id || null;
  }, [profile?.parent_user_id, companyOwnerId, user?.id]);

  const isBlocked = profile?.role === 'blocked';
  const isBusinessSetup = !!profile?.company_name;

  const { isSubscribed, isTrialActive, trialDaysRemaining } = useMemo(() => {
    if (!profile) {
      return { isSubscribed: true, isTrialActive: false, trialDaysRemaining: 0 };
    }

    if (profile.role === 'super_admin') {
      return { isSubscribed: true, isTrialActive: false, trialDaysRemaining: 0 };
    }

    const expiresAt = (profile as any).subscription_expires_at;
    const hasActiveFutureExpiry = expiresAt ? new Date(expiresAt).getTime() > Date.now() : false;
    const plan = (profile.plan_type || 'free').toLowerCase();
    const isPaid = !!profile.is_paid || hasActiveFutureExpiry || (plan !== 'free' && plan !== '' && plan !== 'null' && plan !== 'undefined');

    if (isPaid) {
      return { isSubscribed: true, isTrialActive: false, trialDaysRemaining: 0 };
    }

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
      companyId,
      isStaff,
      staffRole,
      staffPermissions,
      staffName,
      companyOwnerId,
      effectiveUserId,
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
