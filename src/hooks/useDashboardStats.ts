import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type DateRangeFilter = number | 'all' | 'current_month' | { from: string; to: string };

export function useDashboardStats(range: DateRangeFilter = 'current_month') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', user?.id, range],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      let cutoffDate: string | null = null;
      let cutoffEnd: string | null = null;

      if (range === 'all') {
        cutoffDate = null;
      } else if (range === 'current_month') {
        const now = new Date();
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        cutoffEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      } else if (typeof range === 'object' && 'from' in range) {
        cutoffDate = new Date(range.from).toISOString();
        cutoffEnd = new Date(range.to + 'T23:59:59.999').toISOString();
      } else {
        cutoffDate = new Date(Date.now() - Number(range) * 24 * 60 * 60 * 1000).toISOString();
      }

      // Parallel fetch invoices, expenses, clients, products
      const [invRes, expRes, clientRes, productRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('id, status, total_amount, created_at, client_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('expenses')
          .select('amount, created_at')
          .eq('user_id', user.id),
        supabase
          .from('clients')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id),
        supabase
          .from('products')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id),
      ]);

      const invoices = (invRes.data || []).filter((inv: any) => {
        if (!cutoffDate) return true;
        const d = new Date(inv.created_at);
        return d >= new Date(cutoffDate) && (!cutoffEnd || d <= new Date(cutoffEnd));
      });
      const expenses = (expRes.data || []).filter((e: any) => {
        if (!cutoffDate) return true;
        const d = new Date(e.created_at);
        return d >= new Date(cutoffDate) && (!cutoffEnd || d <= new Date(cutoffEnd));
      });

      let totalRevenue = 0;
      let totalSalesAll = 0;
      let outstanding = 0;

      invoices.forEach((inv: any) => {
        const amt = Number(inv.total_amount || 0);
        if (inv.status === 'paid') totalRevenue += amt;
        if (inv.status !== 'cancelled') totalSalesAll += amt;
        if (inv.status === 'sent' || inv.status === 'overdue') outstanding += amt;
      });

      const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

      // Build chart data by month
      const monthMap: Record<string, { sales: number; revenue: number; expense: number }> = {};
      invoices.forEach((inv: any) => {
        const month = new Date(inv.created_at).toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!monthMap[month]) monthMap[month] = { sales: 0, revenue: 0, expense: 0 };
        monthMap[month].sales += Number(inv.total_amount || 0);
        if (inv.status === 'paid') monthMap[month].revenue += Number(inv.total_amount || 0);
      });
      expenses.forEach((e: any) => {
        const month = new Date(e.created_at).toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!monthMap[month]) monthMap[month] = { sales: 0, revenue: 0, expense: 0 };
        monthMap[month].expense += Number(e.amount || 0);
      });

      const chartData = Object.entries(monthMap).map(([name, v]) => ({ name, ...v }));
      const currentMonth = chartData[chartData.length - 1] || { sales: 0, revenue: 0, expense: 0 };
      const prevMonth = chartData[chartData.length - 2] || { sales: 0, revenue: 0, expense: 0 };
      const calculateTrend = (curr: number, prev: number) => {
        if (!prev || prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
      };

      return {
        totalRevenue,
        totalSalesAll,
        totalInvoices: invoices.length,
        activeClients: clientRes.count || 0,
        totalProducts: productRes.count || 0,
        outstanding,
        totalExpenses,
        totalPurchase: 0,
        netProfit: totalRevenue - totalExpenses,
        totalPurchaseCost: 0,
        chartData,
        statusData: [],
        trends: {
          sales: calculateTrend(currentMonth.sales, prevMonth.sales),
          revenue: calculateTrend(currentMonth.revenue, prevMonth.revenue),
          expense: calculateTrend(currentMonth.expense, prevMonth.expense),
          purchase: 0,
        }
      };
    },
    enabled: !!user,
  });
}
