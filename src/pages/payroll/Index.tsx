import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Users, DollarSign, Calendar, AlertTriangle, ArrowRight, ShieldCheck, Plus, Play, Lock, ChevronRight, Activity, Wallet, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { PayrollCostSummary } from "@/components/PayrollCostSummary";

const recentPayrollRuns = [
  { id: "PR-2026-03", period: "March 2026", status: "DRAFT" as const, employees: 1240, total: "₹4,82,50,000" },
  { id: "PR-2026-02", period: "February 2026", status: "PAID" as const, employees: 1238, total: "₹4,78,20,000" },
  { id: "PR-2026-01", period: "January 2026", status: "PAID" as const, employees: 1235, total: "₹4,75,00,000" },
];

const recentActivity = [
  { action: "Payroll Locked", detail: "February 2026 payroll locked by HR Admin", time: "2 hours ago", icon: Lock, color: "text-amber-500", bg: "bg-amber-500/10" },
  { action: "Employee Onboarded", detail: "Priya Sharma added to Engineering", time: "5 hours ago", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  { action: "Leave Approved", detail: "Rahul Verma - 3 days casual leave", time: "1 day ago", icon: Calendar, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { action: "Salary Revised", detail: "Ankit Patel - 15% increment effective April", time: "2 days ago", icon: DollarSign, color: "text-indigo-500", bg: "bg-indigo-500/10" },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-8 pb-10">

        {/* Welcome Banner */}
        <div className="relative rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-8 shadow-xl overflow-hidden animate-slide-down text-primary-foreground">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to ESCOROLL Payroll</h1>
            <p className="text-primary-foreground/90 max-w-lg mb-6 leading-relaxed">
              Your next payroll runs in 3 days. Total required payout is <span className="font-semibold">₹4.82 Cr</span>.
              Please ensure your Escrow Vault is fully funded for seamless compliance and execution.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => navigate("/payroll")} variant="secondary" className="gap-2 font-semibold shadow-md active:scale-95 transition-transform">
                <Play className="h-4 w-4" /> Run Payroll
              </Button>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white gap-2 active:scale-95 transition-transform backdrop-blur-sm">
                <Plus className="h-4 w-4" /> Fund Escrow
              </Button>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />
          <ShieldCheck className="absolute -right-8 -top-8 h-56 w-56 text-white/10 rotate-12 pointer-events-none" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Employees" value="1,240" subtitle="Across 3 departments" icon={Users} trend={{ value: "2.1% from last month", positive: true }} />
          <StatCard title="Payroll This Month" value="₹4.82 Cr" subtitle="March 2026 · Draft" icon={DollarSign} trend={{ value: "0.9% from last month", positive: true }} />
          <StatCard title="Pending Leaves" value="23" subtitle="Awaiting approval" icon={Calendar} className="hover:border-primary/50" />
          <StatCard title="Tax Variances" value="7" subtitle="Requires review" icon={AlertTriangle} className="border-destructive/30 hover:border-destructive/60" />
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Escrow Vault & Payroll Runs */}
          <div className="lg:col-span-2 space-y-6">

            <PayrollCostSummary />

            {/* NEW Escrow Vault Feature */}
            <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 animate-slide-up group">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Escrow Vault Status</h2>
                    <p className="text-xs text-muted-foreground">Secure holding for upcoming payroll</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Wallet className="h-4 w-4" /> Manage Vault
                </Button>
              </div>

              <div className="bg-muted/30 rounded-xl p-5 border border-muted/50 mb-1">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Current Vault Balance</p>
                    <h3 className="text-3xl font-bold font-mono tracking-tight text-foreground">₹2.50 Cr</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Target</p>
                    <h3 className="text-xl font-bold font-mono tracking-tight text-foreground">₹4.82 Cr</h3>
                  </div>
                </div>

                {/* Custom Progress Bar */}
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-emerald-500 rounded-full w-[51.8%] transition-all duration-1000 ease-out" />
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-emerald-500">51.8% Funded</span>
                  <span className="text-muted-foreground tracking-tight">Requires ₹2.32 Cr more by Mar 28</span>
                </div>
              </div>
            </div>

            {/* Recent Payroll Runs */}
            <div className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow animate-slide-up animation-delay-100">
              <div className="flex items-center justify-between px-6 py-5 border-b bg-muted/10">
                <h2 className="text-base font-semibold tracking-tight">Recent Payroll Runs</h2>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-1 -mr-2" onClick={() => navigate("/payroll")}>
                  View all <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="divide-y">
                {recentPayrollRuns.map((run) => (
                  <div key={run.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors group cursor-pointer">
                    <div className="mb-2 sm:mb-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">{run.period}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5" data-mono>{run.id}</p>
                    </div>
                    <div className="flex items-center gap-6 justify-between sm:justify-end w-full sm:w-auto">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-mono font-medium" data-mono>{run.total}</p>
                        <p className="text-xs text-muted-foreground">{run.employees} employees</p>
                      </div>
                      <StatusBadge status={run.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Activity Timeline & Events */}
          <div className="flex flex-col space-y-6">
            <div className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow animate-slide-up animation-delay-200 flex flex-col flex-1">
              <div className="px-6 py-5 border-b bg-muted/10 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold tracking-tight">Activity Timeline</h2>
              </div>
              <div className="p-6 flex-1">
                <div className="relative border-l-2 border-muted pl-6 space-y-10 ml-2 py-2">
                  {recentActivity.map((activity, i) => {
                    const Icon = activity.icon;
                    return (
                      <div key={i} className="relative group">
                        <div className={`absolute -left-[35px] top-1 h-7 w-7 rounded-full flex items-center justify-center border-4 border-card ${activity.bg} ${activity.color} group-hover:scale-110 transition-transform`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold group-hover:text-primary transition-colors">{activity.action}</p>
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{activity.detail}</p>
                          <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider font-medium">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="p-4 border-t bg-muted/10">
                <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-foreground">
                  View All Activity
                </Button>
              </div>
            </div>

            {/* Upcoming Events Feature */}
            <div className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow animate-slide-up animation-delay-300 flex flex-col">
              <div className="px-6 py-5 border-b bg-muted/10 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold tracking-tight">Upcoming Events</h2>
              </div>
              <div className="p-6 flex-1">
                <div className="space-y-4">
                  {[
                    { name: "Good Friday", date: "April 10, 2026", type: "Public" },
                    { name: "Labour Day", date: "May 1, 2026", type: "Public" },
                    { name: "Company Retreat", date: "May 15, 2026", type: "Internal" }
                  ].map((event, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">{event.name}</p>
                        <p className="text-xs text-muted-foreground">{event.date}</p>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wider ${event.type === 'Public' ? 'bg-indigo-500/10 text-indigo-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                        {event.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
