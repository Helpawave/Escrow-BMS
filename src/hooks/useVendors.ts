import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Vendor {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  created_at: string;
}

interface UseVendorsProps {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

export function useVendors({ page = 1, pageSize = 50, searchTerm = "" }: UseVendorsProps = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['vendors', user?.id, page, pageSize, searchTerm],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      let query = supabase
        .from('vendors')
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

      return { vendors: (data || []) as Vendor[], totalCount: count || 0 };
    },
    enabled: !!user,
  });
}

export function vendorMutations(userId: string) {
  return {
    add: async (data: Omit<Vendor, 'id' | 'created_at' | 'user_id'>) => {
      const { data: result, error } = await supabase
        .from('vendors')
        .insert({ ...data, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return result as Vendor;
    },
    update: async (id: string, data: Partial<Vendor>) => {
      const { data: result, error } = await supabase
        .from('vendors')
        .update(data)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return result as Vendor;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('vendors').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
    },
    getAll: async () => {
      const { data, error } = await supabase.from('vendors').select('*').eq('user_id', userId);
      if (error) throw error;
      return (data || []) as Vendor[];
    },
    getById: async (id: string) => {
      const { data, error } = await supabase.from('vendors').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data as Vendor | null;
    },
  };
}
