// repository.ts — Supabase database repository
import { supabase } from '@/integrations/supabase/client';
import type { CalculationEntry } from './supabase';

// ── Calculations Repository ────────────────────────────────────
class CalculationsRepository {
  getUserEntries(userId: string): { data: CalculationEntry[]; error: null } {
    // Sync version required by compiler stubs
    return { data: [], error: null };
  }

  addEntry(entry: Omit<CalculationEntry, 'id' | 'created_at'>): { data: CalculationEntry; error: null } {
    return { data: {} as any, error: null };
  }

  updateEntry(id: string, updates: Partial<CalculationEntry>): { data: CalculationEntry | null; error: null } {
    return { data: null, error: null };
  }

  deleteEntry(id: string, userId?: string): { error: null } {
    return { error: null };
  }
}

// ── Live Supabase Calculations API ────────────────────────────────────
class AsyncCalculationsRepository {
  getUserEntries = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('calculations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return { data: (data as any) || [], error };
    } catch (e: any) {
      return { data: [], error: e };
    }
  };

  addEntry = async (entry: Omit<CalculationEntry, 'id' | 'created_at'>) => {
    try {
      const newId = `calc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newEntry = {
        ...entry,
        id: newId
      };
      
      const { data, error } = await supabase
        .from('calculations')
        .insert(newEntry)
        .select()
        .single();
        
      return { data: (data as any) || newEntry, error };
    } catch (e: any) {
      return { data: null, error: e };
    }
  };

  updateEntry = async (id: string, updates: Partial<CalculationEntry>) => {
    try {
      const { data, error } = await supabase
        .from('calculations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data: (data as any) || null, error };
    } catch (e: any) {
      return { data: null, error: e };
    }
  };

  deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('calculations')
        .delete()
        .eq('id', id);
      return { error };
    } catch (e: any) {
      return { error: e };
    }
  };
}

// ── Live Supabase Profiles API ────────────────────────────────────
class ProfilesRepository {
  async getAllProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      
      // Map profiles and attach compatibility properties
      const mapped = (data || []).map((p: any) => ({
        ...p,
        email: p.email || `${p.full_name?.toLowerCase().replace(/\s+/g, '') || 'user'}@escrowbms.com`,
        is_allowed: p.is_allowed !== undefined ? p.is_allowed : true,
        rejected_at: p.rejected_at || null,
        rejection_reason: p.rejection_reason || null,
        password_text: p.password_text || '********',
        workspace_admin_password: p.workspace_admin_password || null,
        has_password: true,
        approval_expires_at: null,
        approved_at: p.created_at
      }));
      
      return { data: mapped, error: null };
    } catch (e: any) {
      return { data: [], error: e };
    }
  }

  async approveUser(userId: string) {
    // Auto-approves for compatibility
    return { error: null };
  }

  async rejectUser(userId: string, reason: string) {
    return { error: null };
  }

  async deleteProfile(userId: string) {
    return { error: null };
  }

  async renewUserApproval(userId: string) {
    return { error: null };
  }
}

// ── Saved Names API (autocomplete cache) ────────────────────────────────────
class SavedNamesRepository {
  async getSavedNames(userId: string, category: string) {
    const localKey = `bms_saved_names_${userId}_${category}`;
    try {
      const raw = localStorage.getItem(localKey);
      const data = raw ? JSON.parse(raw) : [];
      return { data, error: null };
    } catch (e) {
      return { data: [], error: null };
    }
  }

  async saveNames(userId: string, category: string, names: { name: string }[]) {
    const localKey = `bms_saved_names_${userId}_${category}`;
    try {
      localStorage.setItem(localKey, JSON.stringify(names));
      return { error: null };
    } catch (e) {
      return { error: e };
    }
  }

  async clearAllNames(userId: string) {
    const categories = ['clients', 'uplines', 'banks', 'rtgs', 'expenses'];
    try {
      categories.forEach(category => {
        localStorage.removeItem(`bms_saved_names_${userId}_${category}`);
      });
      return { error: null };
    } catch (e) {
      return { error: e };
    }
  }
}

// ── Stub classes to prevent import errors ──────────────────────
class StubRepository {
  signInWithEmail = () => Promise.resolve({ data: null, error: null });
  signUpWithEmail = () => Promise.resolve({ data: null, error: null });
  signInWithGoogle = () => Promise.resolve({ data: null, error: null });
  signOut = () => Promise.resolve({ error: null });
  getCurrentSession = () => Promise.resolve({ data: { session: null }, error: null });
  onAuthStateChange = (_cb: unknown) => ({ data: { subscription: { unsubscribe: () => {} } } });
  getProfile = () => Promise.resolve({ data: null, error: null });
  upsertProfile = () => Promise.resolve({ data: null, error: null });
  listUsers = () => Promise.resolve({ data: { users: [] }, error: null });
  updateUserPassword = () => Promise.resolve({ data: null, error: null });
  deleteUser = () => Promise.resolve({ data: null, error: null });
  
  // daily-hisab admin compatibility stubs
  getPendingChangeRequests = (...args: any[]) => Promise.resolve({ data: [], error: null });
  checkAndUpdateExpiredUsers = (...args: any[]) => Promise.resolve({ expiredCount: 0, error: null });
  approvePasswordSetRequest = (...args: any[]) => Promise.resolve({ error: null });
  approvePasswordChangeRequest = (...args: any[]) => Promise.resolve({ error: null });
  approveChangeRequest = (...args: any[]) => Promise.resolve({ error: null });
  rejectChangeRequest = (...args: any[]) => Promise.resolve({ error: null });
  changeUserPassword = (...args: any[]) => Promise.resolve({ error: null });
  getUserChangeRequests = (...args: any[]) => Promise.resolve({ data: [], error: null });
  hasPendingChangeRequest = (...args: any[]) => Promise.resolve({ hasPending: false });
  createPasswordSetRequest = (...args: any[]) => Promise.resolve({ error: null });
  createPasswordChangeRequest = (...args: any[]) => Promise.resolve({ error: null });
  createChangeRequest = (...args: any[]) => Promise.resolve({ error: null });
}

const stub = new StubRepository();

export const db = {
  calculations: new AsyncCalculationsRepository(),
  profiles: new ProfilesRepository(),
  savedNames: new SavedNamesRepository()
};

export const AuthRepository = stub;
export const ProfileRepository = stub;
export const AdminRepository = stub;
export const ProfileChangeRequestRepository = stub;

export { stub as CalculationsRepository };
