import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  gstin?: string;
  pending_amount?: number;
  created_at: string;
}

interface UseClientsProps {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

export function useClients({ page = 1, pageSize = 50, searchTerm = "" }: UseClientsProps = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['clients', user?.id, page, pageSize, searchTerm],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      let query = supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return { clients: (data || []) as Client[], totalCount: count || 0 };
    },
    enabled: !!user,
  });
}

export function clientMutations(userId: string) {
  return {
    add: async (data: Omit<Client, 'id' | 'created_at' | 'user_id'>) => {
      const { data: result, error } = await supabase
        .from('clients')
        .insert({ ...data, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return result as Client;
    },
    update: async (id: string, data: Partial<Client>) => {
      const { data: result, error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return result as Client;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
    },
    getAll: async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('user_id', userId);
      if (error) throw error;
      return (data || []) as Client[];
    },
    getById: async (id: string) => {
      const { data, error } = await supabase.from('clients').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data as Client | null;
    },
  };
}
