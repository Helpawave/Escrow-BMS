import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const chartConfig = {
  netPay: {
    label: "Net Pay",
    color: "#2563eb", // Primary Blue
  },
  taxes: {
    label: "Taxes",
    color: "#0ea5e9", // Sky Blue
  },
  statutories: {
    label: "Statutories",
    color: "#10b981", // Emerald
  },
  deductions: {
    label: "Deductions",
    color: "#f59e0b", // Amber
  },
};

export function PayrollCostSummary() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const loadRealChartData = async () => {
      const months = ["Apr 2025", "May 2025", "Jun 2025", "Jul 2025", "Aug 2025", "Sep 2025", "Oct 2025", "Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026"];
      
      let realRuns: any[] = [];
      if (user) {
        try {
          const { data } = await supabase
            .from('payroll_runs')
            .select('*')
            .eq('user_id', user.id);
          realRuns = data || [];
        } catch {
          /* graceful fallback */
        }
      }

      const formatted = months.map((m) => {
        const matchingRun = realRuns.find((r) => r.period === m);
        const net = matchingRun ? Number(matchingRun.net_amount || matchingRun.net || 0) : 0;
        const tax = matchingRun ? Math.round(net * 0.1) : 0;
        return {
          month: m,
          netPay: net,
          taxes: tax,
          statutories: 0,
          deductions: 0,
        };
      });

      setChartData(formatted);
    };

    loadRealChartData();
  }, [user]);
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 animate-slide-up group w-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-semibold tracking-tight">Payroll Cost Summary</h2>
        <Select defaultValue="this_year">
          <SelectTrigger className="w-[130px] h-8 text-xs bg-transparent border-0 shadow-none hover:bg-muted/50 focus:ring-0 text-muted-foreground mr-[-8px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this_year">This Year</SelectItem>
            <SelectItem value="last_year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="h-[300px] w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={16}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              interval={0}
              tickFormatter={(value) => {
                const [month, year] = value.split(" ");
                return `${month} '${year.slice(2)}`;
              }}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value / 1000000} M`}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              dx={-10}
              domain={[0, 'dataMax']}
              ticks={[0, 5000000, 10000000, 15000000]}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="bg-white border-none shadow-lg w-[260px] p-4 rounded-xl"
                  formatter={(value: any, name: any, props: any) => {
                    const formatted = new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                    }).format(value);
                    return <div className="flex w-full justify-between items-center ml-2">
                        <span className="text-[13px] font-medium text-slate-500">{chartConfig[name as keyof typeof chartConfig]?.label || name}</span>
                        <span className="text-[13px] font-semibold text-slate-800 ml-auto">{formatted}</span>
                    </div>;
                  }}
                  hideLabel={true}
                />
              }
              cursor={{fill: '#f3f4f6', opacity: 0.4}}
            />
            <ChartLegend content={<ChartLegendContent />} className="mt-4" />
            <Bar dataKey="netPay" stackId="a" fill="var(--color-netPay)" radius={[4, 4, 4, 4]} stroke="#ffffff" strokeWidth={2} />
            <Bar dataKey="taxes" stackId="a" fill="var(--color-taxes)" radius={[4, 4, 4, 4]} stroke="#ffffff" strokeWidth={2} />
            <Bar dataKey="statutories" stackId="a" fill="var(--color-statutories)" radius={[4, 4, 4, 4]} stroke="#ffffff" strokeWidth={2} />
            <Bar dataKey="deductions" stackId="a" fill="var(--color-deductions)" radius={[4, 4, 4, 4]} stroke="#ffffff" strokeWidth={2} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
