import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/types/invoice";

interface UseInvoicesProps {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  statusFilter?: string;
}

export function useInvoices({ page = 1, pageSize = 50, searchTerm = "", statusFilter = "all" }: UseInvoicesProps = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['invoices', user?.id, page, pageSize, searchTerm, statusFilter],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      let query = supabase
        .from('invoices')
        .select('*, clients(id, name, email, phone)', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.ilike('invoice_number', `%${searchTerm}%`);
      }

      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return { invoices: (data || []) as unknown as Invoice[], totalCount: count || 0 };
    },
    enabled: !!user,
  });
}

export function invoiceMutations(userId: string) {
  return {
    add: async (data: object) => {
      const { data: result, error } = await supabase
        .from('invoices')
        .insert({ ...data, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    update: async (id: string, data: object) => {
      const { data: result, error } = await supabase
        .from('invoices')
        .update(data)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
    },
    getAll: async () => {
      const { data, error } = await supabase.from('invoices').select('*').eq('user_id', userId);
      if (error) throw error;
      return data || [];
    },
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, clients(*), invoice_items(*)')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  };
}
