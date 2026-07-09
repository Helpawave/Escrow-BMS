import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Payment } from "@/types/invoice";

interface UsePaymentsProps {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

export function usePayments({ page = 1, pageSize = 50, searchTerm = "" }: UsePaymentsProps = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payments', user?.id, page, pageSize, searchTerm],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      let query = supabase
        .from('payments')
        .select('*, invoices(invoice_number, status, clients(name))', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`reference_number.ilike.%${searchTerm}%,payment_method.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`);
      }

      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return { payments: (data || []) as unknown as Payment[], totalCount: count || 0 };
    },
    enabled: !!user,
  });
}

export function usePendingPaymentInvoices() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['invoices', 'pending-payment', user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('invoices')
        .select('*, clients(name)')
        .eq('user_id', user.id)
        .in('status', ['sent', 'viewed', 'overdue']);

      if (error) throw error;
      return (data || []).map((inv: any) => ({
        ...inv,
        remaining_amount: Number(inv.total_amount || 0),
      }));
    },
    enabled: !!user,
  });
}

export function paymentMutations(userId: string) {
  return {
    add: async (data: object) => {
      const { data: result, error } = await supabase
        .from('payments')
        .insert({ ...data, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from('payments').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
    },
    getAll: async () => {
      const { data, error } = await supabase.from('payments').select('*').eq('user_id', userId);
      if (error) throw error;
      return data || [];
    },
  };
}
