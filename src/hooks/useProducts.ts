import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UseProductsProps {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

export function useProducts({ 
  page = 1, 
  pageSize = 50, 
  searchTerm = "" 
}: UseProductsProps = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['products', user?.id, page, pageSize, searchTerm],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      return {
        products: data || [],
        totalCount: count || 0
      };
    },
    enabled: !!user,
  });
}
