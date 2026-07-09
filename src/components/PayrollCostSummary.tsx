import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const chartData = [
  { month: "Apr 2022", netPay: 10600000, taxes: 4900000, statutories: 3750, deductions: 0 },
  { month: "May 2022", netPay: 10800000, taxes: 5500000, statutories: 3750, deductions: 0 },
  { month: "Jun 2022", netPay: 10800000, taxes: 5500000, statutories: 3750, deductions: 0 },
  { month: "Jul 2022", netPay: 10800000, taxes: 5400000, statutories: 3750, deductions: 0 },
  { month: "Aug 2022", netPay: 10800000, taxes: 5400000, statutories: 3750, deductions: 0 },
  { month: "Sep 2022", netPay: 11600000, taxes: 6100000, statutories: 3750, deductions: 0 },
  { month: "Oct 2022", netPay: 11672400, taxes: 6166903, statutories: 3750, deductions: 0 },
  { month: "Nov 2022", netPay: 0, taxes: 0, statutories: 0, deductions: 0 },
  { month: "Dec 2022", netPay: 0, taxes: 0, statutories: 0, deductions: 0 },
  { month: "Jan 2023", netPay: 0, taxes: 0, statutories: 0, deductions: 0 },
  { month: "Feb 2023", netPay: 0, taxes: 0, statutories: 0, deductions: 0 },
  { month: "Mar 2023", netPay: 0, taxes: 0, statutories: 0, deductions: 0 },
];

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
