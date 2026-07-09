import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { BarChart3, TrendingUp, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const departmentCosts = [
  { dept: "Engineering", headcount: 520, cost: "₹2,10,00,000", percentage: 43.5 },
  { dept: "Product", headcount: 180, cost: "₹72,00,000", percentage: 14.9 },
  { dept: "Design", headcount: 85, cost: "₹30,00,000", percentage: 6.2 },
  { dept: "Marketing", headcount: 150, cost: "₹55,00,000", percentage: 11.4 },
  { dept: "Finance", headcount: 95, cost: "₹38,00,000", percentage: 7.9 },
  { dept: "HR", headcount: 65, cost: "₹25,50,000", percentage: 5.3 },
  { dept: "Operations", headcount: 145, cost: "₹52,00,000", percentage: 10.8 },
];

const Reports = () => {
  return (
    <AppLayout title="Reports & Analytics">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Financial insights and compliance reports</p>
          <Button variant="outline" size="sm" className="gap-2"><Download className="h-3.5 w-3.5" />Export All</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Annual Payroll Cost" value="₹57.6 Cr" subtitle="FY 2025-26" icon={BarChart3} trend={{ value: "8.2% YoY", positive: true }} />
          <StatCard title="Avg. CTC" value="₹4,64,516" subtitle="Per employee / month" icon={TrendingUp} />
          <StatCard title="Tax Compliance" value="100%" subtitle="All filings up to date" icon={FileText} />
        </div>

        <div className="rounded-lg border bg-card shadow-sm overflow-hidden animate-slide-up">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Department Cost Breakdown</h2>
            <p className="text-xs text-muted-foreground">March 2026</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Department</th>
                <th className="text-center px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Headcount</th>
                <th className="text-right px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Monthly Cost</th>
                <th className="text-right px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">% of Total</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-48">Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {departmentCosts.map((d) => (
                <tr key={d.dept} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium">{d.dept}</td>
                  <td className="px-6 py-3 text-sm text-center font-mono" data-mono>{d.headcount}</td>
                  <td className="px-6 py-3 text-sm text-right font-mono font-medium" data-mono>{d.cost}</td>
                  <td className="px-6 py-3 text-sm text-right font-mono text-muted-foreground" data-mono>{d.percentage}%</td>
                  <td className="px-6 py-3">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${d.percentage}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default Reports;
