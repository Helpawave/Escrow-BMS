import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase, serviceSupabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Invoice } from "@/types/invoice";

interface UseInvoicesProps {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  statusFilter?: string;
  typeFilter?: 'all' | 'sales' | 'downpayment';
}

export function useInvoices({ 
  page = 1, 
  pageSize = 10, 
  searchTerm = "", 
  statusFilter = "all",
  typeFilter = "all"
}: UseInvoicesProps = {}) {
  const { user, effectiveUserId } = useAuth();
  const targetUserId = effectiveUserId || user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['invoices', targetUserId, page, pageSize, searchTerm, statusFilter, typeFilter],
    queryFn: async () => {
      if (!targetUserId) throw new Error("User not authenticated");
      console.log('[useInvoices] Fetching invoices for targetUserId:', targetUserId, { effectiveUserId, authUserId: user?.id, page, searchTerm, typeFilter });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const clientToUse = serviceSupabase || supabase;
      let query = clientToUse
        .from('invoices')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            phone
          )
        `, { count: 'exact' })
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        let clientFilter = '';
        try {
          const { data: matchedClients } = await clientToUse
            .from('clients')
            .select('id')
            .eq('user_id', targetUserId)
            .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
            .limit(20);
          if (matchedClients && matchedClients.length > 0) {
            const clientIds = matchedClients.map((c: any) => c.id).join(',');
            clientFilter = `,client_id.in.(${clientIds})`;
          }
        } catch {}
        query = query.or(`invoice_number.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%${clientFilter}`);
      }

      if (typeFilter === 'downpayment') {
        query = query.or('invoice_number.ilike.DP-%,invoice_number.ilike.DP%,notes.ilike.%is_downpayment%,notes.ilike.%downpayment%,notes.ilike.%down payment%,notes.ilike.%Vehicle:%,notes.ilike.%vehicle%,notes.ilike.%booking%');
      } else if (typeFilter === 'sales') {
        query = query.not('invoice_number', 'ilike', 'DP-%').not('notes', 'ilike', '%is_downpayment%');
      }

      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'overdue') {
          const todayStr = new Date().toISOString().split('T')[0];
          query = query.or(`status.eq.overdue,and(status.neq.paid,due_date.lt.${todayStr})`);
        } else {
          query = query.eq('status', statusFilter);
        }
      }

      const { data, error, count } = await query.range(from, to);
      console.log('[useInvoices] Query result:', { targetUserId, dataLength: data?.length, count, error });

      if (error) {
        console.warn('[useInvoices] Direct query failed, falling back to RPC:', error);
        // Fallback to RPC if direct relation query fails
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_invoices', {
          p_limit: pageSize,
          p_offset: (page - 1) * pageSize,
          p_search_term: searchTerm,
          p_status_filter: statusFilter
        });
        if (rpcError) throw rpcError;
        const results = (rpcData || []) as any[];
        const totalCount = results[0]?.total_count || 0;
        const formattedInvoices = results.map(inv => ({
          ...inv,
          clients: {
            id: inv.client_id,
            name: inv.client_name,
            email: inv.client_email,
            phone: inv.client_phone
          }
        }));
        return {
          invoices: formattedInvoices as unknown as Invoice[],
          totalCount: Number(totalCount)
        };
      }

      const rawInvoices = (data as any[]) || [];
      // Ensure latest created invoice is strictly first (created_at DESC, then invoice_number numeric DESC)
      const sortedInvoices = [...rawInvoices].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;

        const numA = parseInt((a.invoice_number || '').replace(/\D/g, '') || '0', 10);
        const numB = parseInt((b.invoice_number || '').replace(/\D/g, '') || '0', 10);
        return numB - numA;
      });

      return {
        invoices: sortedInvoices as unknown as Invoice[],
        totalCount: count || 0
      };
    },
    enabled: !!targetUserId,
  });

  // ─── Supabase Realtime: auto-refresh when ANY device changes invoice/payment data ───
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`invoices-realtime-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices', filter: `user_id=eq.${user.id}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['invoices'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${user.id}` },
        () => {
          // Payments affect invoice paid status — refresh invoices too
          void queryClient.invalidateQueries({ queryKey: ['invoices'] });
          void queryClient.invalidateQueries({ queryKey: ['payments'] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
}

