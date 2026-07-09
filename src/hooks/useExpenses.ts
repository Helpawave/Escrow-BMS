import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Expense } from "@/types/invoice";

interface UseExpensesProps {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  category?: string;
}

export function useExpenses({ page = 1, pageSize = 50, searchTerm = "", category = "all" }: UseExpensesProps = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['expenses', user?.id, page, pageSize, searchTerm, category],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      let query = supabase
        .from('expenses')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      if (searchTerm) {
        query = query.or(`category.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return { expenses: (data || []) as unknown as Expense[], totalCount: count || 0 };
    },
    enabled: !!user,
  });
}

export function expenseMutations(userId: string) {
  return {
    add: async (data: Omit<Expense, 'id' | 'created_at'>) => {
      const { data: result, error } = await supabase
        .from('expenses')
        .insert({ ...data, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    update: async (id: string, data: Partial<Expense>) => {
      const { data: result, error } = await supabase
        .from('expenses')
        .update(data)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
    },
    getAll: async () => {
      const { data, error } = await supabase.from('expenses').select('*').eq('user_id', userId);
      if (error) throw error;
      return data || [];
    },
  };
}
