import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface Vendor {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  gstin?: string;
  created_at: string;
  updated_at?: string;
}

interface UseVendorsProps {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

export const getCachedVendors = (userId?: string | null): Vendor[] => {
  try {
    const key = `cached_vendors_${userId || 'default'}`;
    const raw = localStorage.getItem(key) || localStorage.getItem('cached_vendors');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveVendorToCache = (userId: string | null | undefined, vendor: Vendor) => {
  try {
    const key = `cached_vendors_${userId || 'default'}`;
    const list = getCachedVendors(userId);
    const cleanName = (vendor.name || '').trim().toLowerCase();
    const existingIndex = list.findIndex(v => v.id === vendor.id || (cleanName && (v.name || '').trim().toLowerCase() === cleanName));
    let updated: Vendor[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = { ...list[existingIndex], ...vendor };
    } else {
      updated = [vendor, ...list];
    }
    localStorage.setItem(key, JSON.stringify(updated));
    localStorage.setItem('cached_vendors', JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to write to local vendor cache:", err);
  }
};

export const removeVendorFromCache = (userId: string | null | undefined, vendorId: string) => {
  try {
    const key = `cached_vendors_${userId || 'default'}`;
    const list = getCachedVendors(userId);
    const updated = list.filter(v => v.id !== vendorId);
    localStorage.setItem(key, JSON.stringify(updated));
    localStorage.setItem('cached_vendors', JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to delete from local vendor cache:", err);
  }
};

export function useVendors({ page = 1, pageSize = 50, searchTerm = "" }: UseVendorsProps = {}) {
  const { user, profile, effectiveUserId } = useAuth();
  const targetUserId = effectiveUserId || profile?.parent_user_id || user?.id;

  return useQuery({
    queryKey: ['vendors', targetUserId, page, pageSize, searchTerm],
    queryFn: async () => {
      const cached = getCachedVendors(targetUserId);

      let data: any[] | null = null;
      let count: number | null = null;
      let fetchError: any = null;

      try {
        let query = supabase
          .from('vendors')
          .select('*', { count: 'exact' });

        if (targetUserId) {
          query = query.eq('user_id', targetUserId);
        }

        query = query.order('created_at', { ascending: false });

        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
        }

        const from = (page - 1) * pageSize;
        query = query.range(from, from + pageSize - 1);

        const res = await query;
        data = res.data;
        count = res.count;
        fetchError = res.error;
      } catch (err) {
        fetchError = err;
      }

      if (!fetchError && data) {
        const dbVendors = (data || []) as Vendor[];
        const dbIds = new Set(dbVendors.map(v => v.id));
        const dbNames = new Set(dbVendors.map(v => (v.name || '').trim().toLowerCase()));

        const pendingLocal = cached.filter(v => !dbIds.has(v.id) && !dbNames.has((v.name || '').trim().toLowerCase()));
        const merged = [...pendingLocal, ...dbVendors];

        try {
          const key = `cached_vendors_${targetUserId || 'default'}`;
          localStorage.setItem(key, JSON.stringify(merged));
          localStorage.setItem('cached_vendors', JSON.stringify(merged));
        } catch {}

        let resultList = merged;
        if (searchTerm) {
          const s = searchTerm.trim().toLowerCase();
          resultList = resultList.filter(v =>
            (v.name || '').toLowerCase().includes(s) ||
            (v.email || '').toLowerCase().includes(s) ||
            (v.phone || '').toLowerCase().includes(s)
          );
        }

        const from = (page - 1) * pageSize;
        const paged = resultList.slice(from, from + pageSize);
        return { vendors: paged, totalCount: resultList.length };
      }

      console.warn("Vendors fetch from Supabase warning, using local cache:", fetchError);
      let resultList = cached;
      if (searchTerm) {
        const s = searchTerm.trim().toLowerCase();
        resultList = resultList.filter(v =>
          (v.name || '').toLowerCase().includes(s) ||
          (v.email || '').toLowerCase().includes(s) ||
          (v.phone || '').toLowerCase().includes(s)
        );
      }
      const from = (page - 1) * pageSize;
      const paged = resultList.slice(from, from + pageSize);
      return { vendors: paged, totalCount: resultList.length };
    },
    initialData: () => {
      const cached = getCachedVendors(targetUserId);
      if (cached && cached.length > 0) {
        return { vendors: cached.slice(0, pageSize), totalCount: cached.length };
      }
      return undefined;
    },
    enabled: true,
  });
}

export function vendorMutations(userId: string) {
  return {
    add: async (data: Omit<Vendor, 'id' | 'created_at' | 'user_id'>) => {
      const vendorRecord: Vendor = {
        id: crypto.randomUUID(),
        user_id: userId,
        ...data,
        created_at: new Date().toISOString()
      };
      saveVendorToCache(userId, vendorRecord);
      try {
        const { data: result, error } = await supabase
          .from('vendors')
          .insert(vendorRecord)
          .select()
          .single();
        if (!error && result) return result as Vendor;
      } catch (err) {
        console.warn("vendorMutations add remote insert warning:", err);
      }
      return vendorRecord;
    },
    update: async (id: string, data: Partial<Vendor>) => {
      const list = getCachedVendors(userId);
      const existing = list.find(v => v.id === id);
      if (existing) {
        const updated = { ...existing, ...data };
        saveVendorToCache(userId, updated);
      }
      try {
        const { data: result, error } = await supabase
          .from('vendors')
          .update(data)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();
        if (!error && result) return result as Vendor;
      } catch (err) {
        console.warn("vendorMutations update remote update warning:", err);
      }
      return (existing ? { ...existing, ...data } : data) as Vendor;
    },
    remove: async (id: string) => {
      removeVendorFromCache(userId, id);
      try {
        await supabase.from('vendors').delete().eq('id', id).eq('user_id', userId);
      } catch (err) {
        console.warn("vendorMutations remove remote delete warning:", err);
      }
    },
    getAll: async () => {
      try {
        const { data, error } = await supabase.from('vendors').select('*').eq('user_id', userId);
        if (!error && data) return data as Vendor[];
      } catch {}
      return getCachedVendors(userId);
    },
    getById: async (id: string) => {
      try {
        const { data, error } = await supabase.from('vendors').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
        if (!error && data) return data as Vendor | null;
      } catch {}
      const cached = getCachedVendors(userId);
      return cached.find(v => v.id === id) || null;
    },
  };
}
