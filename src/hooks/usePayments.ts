import { useQuery } from "@tanstack/react-query";
import { supabase, serviceSupabase } from "@/integrations/supabase/client";
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
  typeFilter?: 'all' | 'sales' | 'purchase';
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
  endDate = "",
  typeFilter = "all"
}: UsePaymentsProps = {}) {
  const { user, effectiveUserId } = useAuth();
  const targetUserId = effectiveUserId || user?.id;

  return useQuery({
    queryKey: ['payments', targetUserId, page, pageSize, searchTerm, methodFilter, dateFilter, startDate, endDate, typeFilter],
    queryFn: async () => {
      if (!targetUserId) throw new Error("User not authenticated");

      const clientToUse = serviceSupabase || supabase;

      // 1. Fetch user purchase bills to map purchase payments reliably
      const { data: userPurchaseBills } = await clientToUse
        .from('purchase_invoices')
        .select('id, invoice_number, status, total_amount, vendors (name)')
        .eq('user_id', targetUserId);

      const pBillsList = (userPurchaseBills as unknown as { id: string; invoice_number: string; status: string; total_amount: number; vendors: { name: string } }[]) || [];
      const purchaseMap: Record<string, { invoice_number: string; status: string; vendors?: { name: string } }> = {};
      const purchaseIdSet = new Set<string>();
      pBillsList.forEach(b => {
        purchaseMap[b.id] = b;
        purchaseIdSet.add(b.id);
      });
      const purchaseIdsArray = Array.from(purchaseIdSet);

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
        .select('amount, payment_method, invoice_id, purchase_invoice_id, payment_date')
        .eq('user_id', targetUserId);

      const allPaymentsList = (allUserPayments as unknown as { amount: number; payment_method: string; invoice_id?: string; purchase_invoice_id?: string; payment_date: string }[]) || [];
      
      const { from: dateFrom, to: dateTo } = getDateBounds(dateFilter, startDate, endDate);

      const classifyMethod = (raw?: string | null): 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'card' | 'other' => {
        const m = (raw || '').toLowerCase().trim();
        if (m === 'cash') return 'cash';
        if (m === 'upi' || m.includes('upi') || m.includes('gpay') || m.includes('phonepe') || m.includes('paytm')) return 'upi';
        if (m === 'bank_transfer' || m.includes('bank') || m.includes('neft') || m.includes('rtgs') || m.includes('imps') || m.includes('netbanking')) return 'bank_transfer';
        if (m === 'cheque' || m.includes('cheque') || m.includes('check') || m.includes('dd')) return 'cheque';
        if (m === 'credit_card' || m === 'debit_card' || m.includes('card')) return 'card';
        return 'other';
      };

      const matchesMethod = (rawMethod?: string | null, targetFilter?: string) => {
        if (!targetFilter || targetFilter === 'all') return true;
        const raw = (rawMethod || '').toLowerCase().trim();
        const filt = targetFilter.toLowerCase().trim();
        if (filt === 'card') {
          return raw === 'credit_card' || raw === 'debit_card' || raw.includes('card');
        }
        if (filt === 'pending') {
          return raw === 'pending' || raw === '';
        }
        if (filt === 'upi') {
          return raw === 'upi' || raw.includes('upi') || raw.includes('gpay') || raw.includes('phonepe') || raw.includes('paytm');
        }
        if (filt === 'bank_transfer') {
          return raw === 'bank_transfer' || raw.includes('bank') || raw.includes('neft') || raw.includes('rtgs') || raw.includes('imps') || raw.includes('netbanking');
        }
        if (filt === 'cheque') {
          return raw === 'cheque' || raw.includes('cheque') || raw.includes('check') || raw.includes('dd');
        }
        return raw === filt;
      };

      let overallTotal = 0;
      let overallCash = 0;
      let overallUpi = 0;
      let overallBankTransfer = 0;
      let overallCheque = 0;
      let overallCard = 0;
      let overallOther = 0;

      let salesTotal = 0;
      let salesRecords = 0;
      let salesCash = 0;
      let salesCashCount = 0;
      let salesUpi = 0;
      let salesUpiCount = 0;
      let salesBankTransfer = 0;
      let salesBankTransferCount = 0;
      let salesCheque = 0;
      let salesChequeCount = 0;
      let salesCard = 0;
      let salesCardCount = 0;
      let salesOther = 0;
      let salesOtherCount = 0;

      let purchaseTotal = 0;
      let purchaseRecords = 0;
      let purchaseCash = 0;
      let purchaseCashCount = 0;
      let purchaseUpi = 0;
      let purchaseUpiCount = 0;
      let purchaseBankTransfer = 0;
      let purchaseBankTransferCount = 0;
      let purchaseCheque = 0;
      let purchaseChequeCount = 0;
      let purchaseCard = 0;
      let purchaseCardCount = 0;
      let purchaseOther = 0;
      let purchaseOtherCount = 0;

      let selectedMethodSalesTotal = 0;
      let selectedMethodSalesCount = 0;
      let selectedMethodPurchaseTotal = 0;
      let selectedMethodPurchaseCount = 0;

      allPaymentsList.forEach(p => {
        const amt = Number(p.amount || 0);
        overallTotal += amt;
        const methodCat = classifyMethod(p.payment_method);
        if (methodCat === 'cash') overallCash += amt;
        else if (methodCat === 'upi') overallUpi += amt;
        else if (methodCat === 'bank_transfer') overallBankTransfer += amt;
        else if (methodCat === 'cheque') overallCheque += amt;
        else if (methodCat === 'card') overallCard += amt;
        else overallOther += amt;

        const pDate = (p.payment_date || '').split('T')[0];
        const dateMatches = (!dateFrom || pDate >= dateFrom) && (!dateTo || pDate <= dateTo);
        if (!dateMatches) return;

        const isPurchase = !!p.purchase_invoice_id || (!!p.invoice_id && purchaseIdSet.has(p.invoice_id));
        const methodMatches = matchesMethod(p.payment_method, methodFilter);

        if (isPurchase) {
          purchaseTotal += amt;
          purchaseRecords++;
          if (methodCat === 'cash') { purchaseCash += amt; purchaseCashCount++; }
          else if (methodCat === 'upi') { purchaseUpi += amt; purchaseUpiCount++; }
          else if (methodCat === 'bank_transfer') { purchaseBankTransfer += amt; purchaseBankTransferCount++; }
          else if (methodCat === 'cheque') { purchaseCheque += amt; purchaseChequeCount++; }
          else if (methodCat === 'card') { purchaseCard += amt; purchaseCardCount++; }
          else { purchaseOther += amt; purchaseOtherCount++; }

          if (methodMatches && methodFilter !== 'all') {
            selectedMethodPurchaseTotal += amt;
            selectedMethodPurchaseCount++;
          }
        } else {
          salesTotal += amt;
          salesRecords++;
          if (methodCat === 'cash') { salesCash += amt; salesCashCount++; }
          else if (methodCat === 'upi') { salesUpi += amt; salesUpiCount++; }
          else if (methodCat === 'bank_transfer') { salesBankTransfer += amt; salesBankTransferCount++; }
          else if (methodCat === 'cheque') { salesCheque += amt; salesChequeCount++; }
          else if (methodCat === 'card') { salesCard += amt; salesCardCount++; }
          else { salesOther += amt; salesOtherCount++; }

          if (methodMatches && methodFilter !== 'all') {
            selectedMethodSalesTotal += amt;
            selectedMethodSalesCount++;
          }
        }
      });

      const computedStats = {
        overallTotal,
        overallCash,
        overallUpi,
        overallBankTransfer,
        overallCheque,
        overallCard,
        overallOther,
        totalRecords: allPaymentsList.length,
        salesTotal,
        salesCash,
        salesCashCount,
        salesUpi,
        salesUpiCount,
        salesBankTransfer,
        salesBankTransferCount,
        salesCheque,
        salesChequeCount,
        salesCard,
        salesCardCount,
        salesOther,
        salesOtherCount,
        salesRecords,
        purchaseTotal,
        purchaseCash,
        purchaseCashCount,
        purchaseUpi,
        purchaseUpiCount,
        purchaseBankTransfer,
        purchaseBankTransferCount,
        purchaseCheque,
        purchaseChequeCount,
        purchaseCard,
        purchaseCardCount,
        purchaseOther,
        purchaseOtherCount,
        purchaseRecords,
        selectedMethodSalesTotal,
        selectedMethodSalesCount,
        selectedMethodPurchaseTotal,
        selectedMethodPurchaseCount,
        isDateFiltered: Boolean(dateFrom || dateTo)
      };

      // If user selected purchase payments but has no purchase bills, return early
      if (typeFilter === 'purchase' && purchaseIdsArray.length === 0) {
        return {
          payments: [],
          totalCount: 0,
          stats: computedStats
        };
      }

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

      // Apply type filtering
      if (typeFilter === 'purchase') {
        const pFilters = [`purchase_invoice_id.not.is.null`];
        if (purchaseIdsArray.length > 0) {
          pFilters.push(`invoice_id.in.(${purchaseIdsArray.join(',')})`);
        }
        query = query.or(pFilters.join(','));
      } else if (typeFilter === 'sales') {
        query = query.is('purchase_invoice_id', null);
        if (purchaseIdsArray.length > 0) {
          query = query.not('invoice_id', 'in', `(${purchaseIdsArray.join(',')})`);
        }
      }

      if (searchTerm) {
        const filters = [
          `reference_number.ilike.%${searchTerm}%`,
          `payment_method.ilike.%${searchTerm}%`,
          `notes.ilike.%${searchTerm}%`,
        ];
        if (matchedInvoiceIds.length > 0) {
          filters.push(`invoice_id.in.(${matchedInvoiceIds.join(',')})`);
          filters.push(`purchase_invoice_id.in.(${matchedInvoiceIds.join(',')})`);
        }
        query = query.or(filters.join(','));
      }

      if (methodFilter && methodFilter !== 'all') {
        query = query.eq('payment_method', methodFilter);
      }

      if (dateFrom) {
        query = query.gte('payment_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('payment_date', dateTo);
      }

      const { data, error, count } = await (query as unknown as { range: (f: number, t: number) => Promise<{ data: unknown[], error: unknown, count: number }> }).range(from, to);
      if (error) throw error;

      const rawPayments = (data as unknown) as (Payment & { invoices?: { invoice_number: string; status: string; clients?: { name: string } } | null })[] || [];

      const formattedPayments: Payment[] = rawPayments.map(p => {
        const rawP = p as unknown as { invoice_id?: string; purchase_invoice_id?: string };
        const billId = rawP.purchase_invoice_id || rawP.invoice_id;
        const isPurchase = !!rawP.purchase_invoice_id || (!!rawP.invoice_id && purchaseIdSet.has(rawP.invoice_id));

        if (isPurchase && billId) {
          const pb = purchaseMap[billId];
          return {
            ...p,
            invoice_type: 'purchase' as const,
            invoices: pb ? {
              invoice_number: pb.invoice_number,
              status: pb.status,
              clients: { name: pb.vendors?.name || 'Unknown Vendor' }
            } : null,
            party_name: pb?.vendors?.name || 'Unknown Vendor',
            display_number: pb?.invoice_number || 'N/A'
          };
        }

        return {
          ...p,
          invoice_type: 'sales' as const,
          party_name: p.invoices?.clients?.name || 'Direct Payment',
          display_number: p.invoices?.invoice_number || 'N/A'
        };
      });

      return {
        payments: formattedPayments,
        totalCount: count || 0,
        stats: computedStats
      };
    },
    enabled: !!targetUserId,
  });
}

export function usePendingPaymentInvoices() {
  const { user, effectiveUserId } = useAuth();
  const targetUserId = effectiveUserId || user?.id;

  return useQuery({
    queryKey: ['invoices', 'pending-for-payments', targetUserId],
    queryFn: async () => {
      if (!targetUserId) throw new Error("User not authenticated");

      const clientToUse = serviceSupabase || supabase;

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
        .ilike('status', 'paid')
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
        .ilike('status', 'paid')
        .order('created_at', { ascending: false });

      // 3. Fetch existing payments
      const { data: payments, error: payError } = await clientToUse
        .from('payments')
        .select('invoice_id, purchase_invoice_id, amount, payment_method')
        .eq('user_id', targetUserId);

      if (payError) throw payError;
      const paymentsData = (payments as unknown) as { invoice_id?: string; purchase_invoice_id?: string; amount: number; payment_method?: string }[];

      const paidAmountsMap: Record<string, number> = {};
      const paidMethodMap: Record<string, string> = {};
      const recordedInvoiceIds = new Set<string>();
      paymentsData?.forEach(p => {
        const targetId = p.purchase_invoice_id || p.invoice_id;
        if (targetId) {
          recordedInvoiceIds.add(targetId);
          paidAmountsMap[targetId] = (paidAmountsMap[targetId] || 0) + Number(p.amount || 0);
          if (p.payment_method) {
            paidMethodMap[targetId] = p.payment_method;
          }
        }
      });

      const salesList: PendingInvoiceItem[] = ((invoices as unknown) as { id: string, invoice_number: string, total_amount: number, status: string, clients: { name: string } }[] || [])
        .filter(inv => String(inv.status || '').toLowerCase().trim() === 'paid')
        .map(inv => {
          const totalPaid = paidAmountsMap[inv.id] || 0;
          return {
            id: inv.id,
            invoice_number: inv.invoice_number,
            total_amount: Number(inv.total_amount || 0),
            status: inv.status,
            type: 'sales' as const,
            party_name: inv.clients?.name || 'Unknown Client',
            has_payment_record: recordedInvoiceIds.has(inv.id) || (paidAmountsMap[inv.id] !== undefined && paidAmountsMap[inv.id] > 0),
            payment_method: paidMethodMap[inv.id] || 'cash',
            total_paid: totalPaid,
            remaining_amount: Math.max(0, Number(inv.total_amount || 0) - totalPaid),
            clients: inv.clients
          };
        });

      const purchaseList: PendingInvoiceItem[] = ((purchaseBills as unknown) as { id: string, invoice_number: string, total_amount: number, status: string, vendors: { name: string } }[] || [])
        .filter(bill => String(bill.status || '').toLowerCase().trim() === 'paid')
        .map(bill => {
          const totalPaid = paidAmountsMap[bill.id] || 0;
          return {
            id: bill.id,
            invoice_number: bill.invoice_number,
            total_amount: Number(bill.total_amount || 0),
            status: bill.status,
            type: 'purchase' as const,
            party_name: bill.vendors?.name || 'Unknown Vendor',
            has_payment_record: recordedInvoiceIds.has(bill.id) || (paidAmountsMap[bill.id] !== undefined && paidAmountsMap[bill.id] > 0),
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
