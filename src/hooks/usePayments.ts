import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Payment } from "@/types/invoice";

interface UsePaymentsProps {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  methodFilter?: string;
  dateFilter?: string;
  startDate?: string;
  endDate?: string;
}

export interface PendingInvoiceItem {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  type: 'sales' | 'purchase';
  party_name: string;
  has_payment_record: boolean;
  payment_method?: string;
  total_paid: number;
  remaining_amount: number;
  clients?: { name: string };
  vendors?: { name: string };
}

function getDateBounds(dateFilter?: string, customStart?: string, customEnd?: string) {
  if (!dateFilter || dateFilter === 'all') return { from: null, to: null };
  const now = new Date();
  
  if (dateFilter === 'today') {
    const todayStr = now.toISOString().split('T')[0];
    return { from: todayStr, to: todayStr };
  }
  
  if (dateFilter === 'this_week') {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    const mondayStr = d.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    return { from: mondayStr, to: todayStr };
  }
  
  if (dateFilter === 'this_month') {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const startStr = `${y}-${m}-01`;
    const todayStr = now.toISOString().split('T')[0];
    return { from: startStr, to: todayStr };
  }
  
  if (dateFilter === 'last_month') {
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const y = prevMonth.getFullYear();
    const m = String(prevMonth.getMonth() + 1).padStart(2, '0');
    const startStr = `${y}-${m}-01`;
    const endStr = lastDayPrevMonth.toISOString().split('T')[0];
    return { from: startStr, to: endStr };
  }
  
  if (dateFilter === 'custom') {
    return { from: customStart || null, to: customEnd || null };
  }
  
  return { from: null, to: null };
}

export function usePayments({ 
  page = 1, 
  pageSize = 50, 
  searchTerm = "",
  methodFilter = "all",
  dateFilter = "all",
  startDate = "",
  endDate = ""
}: UsePaymentsProps = {}) {
  const { user } = useAuth();
  const targetUserId = user?.id;

  return useQuery({
    queryKey: ['payments', targetUserId, page, pageSize, searchTerm, methodFilter, dateFilter, startDate, endDate],
    queryFn: async () => {
      if (!targetUserId) throw new Error("User not authenticated");

      const clientToUse = supabase;
      let matchedInvoiceIds: string[] = [];

      if (searchTerm) {
        // 1. Find matching clients & vendors
        const { data: clientsData } = await clientToUse
          .from('clients')
          .select('id')
          .eq('user_id', targetUserId)
          .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,gstin.ilike.%${searchTerm}%`);

        const matchedClientIds = ((clientsData as unknown) as { id: string }[] || []).map((c) => c.id);

        const { data: vendorsData } = await clientToUse
          .from('vendors')
          .select('id')
          .eq('user_id', targetUserId)
          .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,gstin.ilike.%${searchTerm}%`);

        const matchedVendorIds = ((vendorsData as unknown) as { id: string }[] || []).map((v) => v.id);

        // 2. Find matching sales invoices
        let invIdQuery = clientToUse
          .from('invoices')
          .select('id')
          .eq('user_id', targetUserId);

        if (matchedClientIds.length > 0) {
          invIdQuery = invIdQuery.or(`invoice_number.ilike.%${searchTerm}%,client_id.in.(${matchedClientIds.join(',')})`);
        } else {
          invIdQuery = invIdQuery.ilike('invoice_number', `%${searchTerm}%`);
        }

        const { data: invoiceIdData } = await (invIdQuery as unknown as Promise<{ data: { id: string }[] | null }>);
        const sInvoiceIds = ((invoiceIdData as unknown) as { id: string }[] || []).map((inv) => inv.id);

        // 3. Find matching purchase invoices
        let billIdQuery = clientToUse
          .from('purchase_invoices')
          .select('id')
          .eq('user_id', targetUserId);

        if (matchedVendorIds.length > 0) {
          billIdQuery = billIdQuery.or(`invoice_number.ilike.%${searchTerm}%,vendor_id.in.(${matchedVendorIds.join(',')})`);
        } else {
          billIdQuery = billIdQuery.ilike('invoice_number', `%${searchTerm}%`);
        }

        const { data: billIdData } = await (billIdQuery as unknown as Promise<{ data: { id: string }[] | null }>);
        const pBillIds = ((billIdData as unknown) as { id: string }[] || []).map((b) => b.id);

        matchedInvoiceIds = Array.from(new Set([...sInvoiceIds, ...pBillIds]));
      }

      // Fetch all payments summary for global stats
      const { data: allUserPayments } = await clientToUse
        .from('payments')
        .select('amount, payment_method, payment_date')
        .eq('user_id', targetUserId);

      const allPaymentsList = (allUserPayments as unknown as { amount: number; payment_method: string; payment_date: string }[]) || [];
      
      let overallTotal = 0;
      let overallCash = 0;
      let overallUpi = 0;

      allPaymentsList.forEach(p => {
        const amt = Number(p.amount || 0);
        overallTotal += amt;
        const m = (p.payment_method || '').toLowerCase();
        if (m === 'cash') overallCash += amt;
        if (m === 'upi') overallUpi += amt;
      });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = clientToUse
        .from('payments')
        .select(`
          *,
          invoices (
            invoice_number,
            status,
            clients (name)
          )
        `, { count: 'exact' })
        .eq('user_id', targetUserId)
        .order('payment_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (searchTerm) {
        const filters = [
          `reference_number.ilike.%${searchTerm}%`,
          `payment_method.ilike.%${searchTerm}%`,
          `notes.ilike.%${searchTerm}%`,
        ];
        if (matchedInvoiceIds.length > 0) {
          filters.push(`invoice_id.in.(${matchedInvoiceIds.join(',')})`);
        }
        query = query.or(filters.join(','));
      }

      if (methodFilter && methodFilter !== 'all') {
        query = query.eq('payment_method', methodFilter);
      }

      const { from: dateFrom, to: dateTo } = getDateBounds(dateFilter, startDate, endDate);
      if (dateFrom) {
        query = query.gte('payment_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('payment_date', dateTo);
      }

      const { data, error, count } = await (query as unknown as { range: (f: number, t: number) => Promise<{ data: unknown[], error: unknown, count: number }> }).range(from, to);
      if (error) throw error;

      const rawPayments = (data as unknown) as (Payment & { invoices?: { invoice_number: string; status: string; clients?: { name: string } } | null })[] || [];

      // For payments where invoice relationship is null or points to purchase_invoices, resolve purchase_invoices
      const unlinkedIds = rawPayments.filter(p => !p.invoices).map(p => p.invoice_id).filter(Boolean);
      const purchaseMap: Record<string, { invoice_number: string; status: string; vendors?: { name: string } }> = {};

      if (unlinkedIds.length > 0) {
        const { data: pBills } = await clientToUse
          .from('purchase_invoices')
          .select('id, invoice_number, status, vendors (name)')
          .in('id', unlinkedIds);

        ((pBills as unknown) as { id: string; invoice_number: string; status: string; vendors: { name: string } }[] || []).forEach(b => {
          purchaseMap[b.id] = b;
        });
      }

      const formattedPayments: Payment[] = rawPayments.map(p => {
        if (p.invoices) {
          return {
            ...p,
            invoice_type: 'sales',
            party_name: p.invoices?.clients?.name || 'Unknown Client',
            display_number: p.invoices?.invoice_number || 'N/A'
          };
        }
        const pb = purchaseMap[p.invoice_id];
        if (pb) {
          return {
            ...p,
            invoice_type: 'purchase',
            invoices: {
              invoice_number: pb.invoice_number,
              status: pb.status,
              clients: { name: pb.vendors?.name || 'Unknown Vendor' }
            },
            party_name: pb.vendors?.name || 'Unknown Vendor',
            display_number: pb.invoice_number
          };
        }
        return {
          ...p,
          invoice_type: 'sales',
          party_name: 'Direct Payment',
          display_number: 'N/A'
        };
      });

      return {
        payments: formattedPayments,
        totalCount: count || 0,
        stats: {
          overallTotal,
          overallCash,
          overallUpi,
          totalRecords: allPaymentsList.length
        }
      };
    },
    enabled: !!targetUserId,
  });
}

export function usePendingPaymentInvoices() {
  const { user } = useAuth();
  const targetUserId = user?.id;

  return useQuery({
    queryKey: ['invoices', 'pending-for-payments', targetUserId],
    queryFn: async () => {
      if (!targetUserId) throw new Error("User not authenticated");

      const clientToUse = supabase;

      // 1. Fetch sales invoices marked as paid
      const { data: invoices, error: invError } = await clientToUse
        .from('invoices')
        .select(`
          id,
          invoice_number,
          total_amount,
          status,
          clients (name)
        `)
        .eq('user_id', targetUserId)
        .eq('status', 'paid')
        .order('created_at', { ascending: false });

      if (invError) throw invError;

      // 2. Fetch purchase invoices marked as paid
      const { data: purchaseBills } = await clientToUse
        .from('purchase_invoices')
        .select(`
          id,
          invoice_number,
          total_amount,
          status,
          vendors (name)
        `)
        .eq('user_id', targetUserId)
        .eq('status', 'paid')
        .order('created_at', { ascending: false });

      // 3. Fetch existing payments
      const { data: payments, error: payError } = await clientToUse
        .from('payments')
        .select('invoice_id, amount, payment_method')
        .eq('user_id', targetUserId);

      if (payError) throw payError;
      const paymentsData = (payments as unknown) as { invoice_id: string, amount: number, payment_method?: string }[];

      const paidAmountsMap: Record<string, number> = {};
      const paidMethodMap: Record<string, string> = {};
      paymentsData?.forEach(p => {
        if (p.invoice_id) {
          paidAmountsMap[p.invoice_id] = (paidAmountsMap[p.invoice_id] || 0) + Number(p.amount || 0);
          if (p.payment_method) {
            paidMethodMap[p.invoice_id] = p.payment_method;
          }
        }
      });

      const salesList: PendingInvoiceItem[] = ((invoices as unknown) as { id: string, invoice_number: string, total_amount: number, status: string, clients: { name: string } }[] || []).map(inv => {
        const totalPaid = paidAmountsMap[inv.id] || 0;
        return {
          id: inv.id,
          invoice_number: inv.invoice_number,
          total_amount: Number(inv.total_amount || 0),
          status: inv.status,
          type: 'sales' as const,
          party_name: inv.clients?.name || 'Unknown Client',
          has_payment_record: (paidAmountsMap[inv.id] !== undefined && paidAmountsMap[inv.id] > 0),
          payment_method: paidMethodMap[inv.id] || 'cash',
          total_paid: totalPaid,
          remaining_amount: Math.max(0, Number(inv.total_amount || 0) - totalPaid),
          clients: inv.clients
        };
      });

      const purchaseList: PendingInvoiceItem[] = ((purchaseBills as unknown) as { id: string, invoice_number: string, total_amount: number, status: string, vendors: { name: string } }[] || []).map(bill => {
        const totalPaid = paidAmountsMap[bill.id] || 0;
        return {
          id: bill.id,
          invoice_number: bill.invoice_number,
          total_amount: Number(bill.total_amount || 0),
          status: bill.status,
          type: 'purchase' as const,
          party_name: bill.vendors?.name || 'Unknown Vendor',
          has_payment_record: (paidAmountsMap[bill.id] !== undefined && paidAmountsMap[bill.id] > 0),
          payment_method: paidMethodMap[bill.id] || 'cash',
          total_paid: totalPaid,
          remaining_amount: Math.max(0, Number(bill.total_amount || 0) - totalPaid),
          vendors: bill.vendors
        };
      });

      return [...salesList, ...purchaseList];
    },
    enabled: !!targetUserId
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
    update: async (id: string, data: object) => {
      const { data: result, error } = await supabase
        .from('payments')
        .update(data)
        .eq('id', id)
        .eq('user_id', userId)
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
