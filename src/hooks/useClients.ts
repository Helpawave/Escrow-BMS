import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { syncClientsAndLedgerParties } from "@/utils/erpPosting";

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  company_name?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  gstin?: string;
  hide_contact_details?: boolean;
  pending_amount?: number;
  created_at: string;
  updated_at?: string;
}

interface UseClientsProps {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

export const getCachedClients = (userId?: string | null): Client[] => {
  try {
    const key = `cached_clients_${userId || 'default'}`;
    const raw = localStorage.getItem(key) || localStorage.getItem('cached_clients');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveClientToCache = (userId: string | null | undefined, client: Client) => {
  try {
    const key = `cached_clients_${userId || 'default'}`;
    const list = getCachedClients(userId);
    const cleanName = (client.name || '').trim().toLowerCase();
    const existingIndex = list.findIndex(c => c.id === client.id || (cleanName && (c.name || '').trim().toLowerCase() === cleanName));
    let updated: Client[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = { ...list[existingIndex], ...client };
    } else {
      updated = [client, ...list];
    }
    localStorage.setItem(key, JSON.stringify(updated));
    localStorage.setItem('cached_clients', JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to write to local client cache:", err);
  }
};

export const removeClientFromCache = (userId: string | null | undefined, clientId: string) => {
  try {
    const key = `cached_clients_${userId || 'default'}`;
    const list = getCachedClients(userId);
    const updated = list.filter(c => c.id !== clientId);
    localStorage.setItem(key, JSON.stringify(updated));
    localStorage.setItem('cached_clients', JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to delete from local client cache:", err);
  }
};

export function useClients({ page = 1, pageSize = 50, searchTerm = "" }: UseClientsProps = {}) {
  const { user, profile, effectiveUserId } = useAuth();
  const targetUserId = effectiveUserId || profile?.parent_user_id || user?.id;

  return useQuery({
    queryKey: ['clients', targetUserId, page, pageSize, searchTerm],
    queryFn: async () => {
      const cached = getCachedClients(targetUserId);

      if (page === 1 && !searchTerm && targetUserId) {
        try {
          await syncClientsAndLedgerParties(targetUserId);
        } catch {}
      }

      let data: any[] | null = null;
      let count: number | null = null;
      let fetchError: any = null;

      try {
        let query = supabase
          .from('clients')
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
        const dbClients = (data || []) as Client[];
        const dbIds = new Set(dbClients.map(c => c.id));
        const dbNames = new Set(dbClients.map(c => (c.name || '').trim().toLowerCase()));

        // Merge any newly added local clients that haven't synced to DB yet
        const pendingLocal = cached.filter(c => !dbIds.has(c.id) && !dbNames.has((c.name || '').trim().toLowerCase()));
        const merged = [...pendingLocal, ...dbClients];

        // Update local cache with latest merged
        try {
          const key = `cached_clients_${targetUserId || 'default'}`;
          localStorage.setItem(key, JSON.stringify(merged));
          localStorage.setItem('cached_clients', JSON.stringify(merged));
        } catch {}

        let resultList = merged;
        if (searchTerm) {
          const s = searchTerm.trim().toLowerCase();
          resultList = resultList.filter(c =>
            (c.name || '').toLowerCase().includes(s) ||
            (c.email || '').toLowerCase().includes(s) ||
            (c.phone || '').toLowerCase().includes(s)
          );
        }

        const from = (page - 1) * pageSize;
        const paged = resultList.slice(from, from + pageSize);
        return { clients: paged, totalCount: resultList.length };
      }

      // If Supabase fetch failed (403, 401, offline), gracefully fallback to local cache
      console.warn("Clients fetch from Supabase warning, using local cache:", fetchError);
      let resultList = cached;
      if (searchTerm) {
        const s = searchTerm.trim().toLowerCase();
        resultList = resultList.filter(c =>
          (c.name || '').toLowerCase().includes(s) ||
          (c.email || '').toLowerCase().includes(s) ||
          (c.phone || '').toLowerCase().includes(s)
        );
      }
      const from = (page - 1) * pageSize;
      const paged = resultList.slice(from, from + pageSize);
      return { clients: paged, totalCount: resultList.length };
    },
    initialData: () => {
      const cached = getCachedClients(targetUserId);
      if (cached && cached.length > 0) {
        return { clients: cached.slice(0, pageSize), totalCount: cached.length };
      }
      return undefined;
    },
    enabled: true,
  });
}

export function clientMutations(userId: string) {
  return {
    add: async (data: Omit<Client, 'id' | 'created_at' | 'user_id'>) => {
      const clientRecord: Client = {
        id: crypto.randomUUID(),
        user_id: userId,
        ...data,
        created_at: new Date().toISOString()
      };
      saveClientToCache(userId, clientRecord);

      try {
        const { data: result, error } = await supabase
          .from('clients')
          .insert(clientRecord)
          .select()
          .single();
        if (!error && result) return result as Client;
      } catch (err) {
        console.warn("clientMutations add remote insert warning:", err);
      }
      return clientRecord;
    },
    update: async (id: string, data: Partial<Client>) => {
      const list = getCachedClients(userId);
      const existing = list.find(c => c.id === id);
      if (existing) {
        const updated = { ...existing, ...data };
        saveClientToCache(userId, updated);
      }
      try {
        const { data: result, error } = await supabase
          .from('clients')
          .update(data)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();
        if (!error && result) return result as Client;
      } catch (err) {
        console.warn("clientMutations update remote update warning:", err);
      }
      return (existing ? { ...existing, ...data } : data) as Client;
    },
    remove: async (id: string) => {
      removeClientFromCache(userId, id);
      try {
        await supabase.from('clients').delete().eq('id', id).eq('user_id', userId);
      } catch (err) {
        console.warn("clientMutations remove remote delete warning:", err);
      }
    },
    getAll: async () => {
      try {
        const { data, error } = await supabase.from('clients').select('*').eq('user_id', userId);
        if (!error && data) return data as Client[];
      } catch {}
      return getCachedClients(userId);
    },
    getById: async (id: string) => {
      try {
        const { data, error } = await supabase.from('clients').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
        if (!error && data) return data as Client | null;
      } catch {}
      const cached = getCachedClients(userId);
      return cached.find(c => c.id === id) || null;
    },
  };
}
