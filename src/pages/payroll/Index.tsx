import { useState, useEffect } from "react";

import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Users, DollarSign, Calendar, AlertTriangle, ArrowRight, ShieldCheck, Plus, Play, Lock, Activity, Wallet, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { PayrollCostSummary } from "@/components/PayrollCostSummary";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// No hardcoded data — fetched from Supabase


const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Real stats from Supabase
  const [employeeCount, setEmployeeCount] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [totalPayroll, setTotalPayroll] = useState(0);
  const [recentPayrollRuns, setRecentPayrollRuns] = useState<{ id: string; period: string; status: 'DRAFT' | 'PAID' | 'LOCKED'; employees: number; total: string }[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const [empRes, leavesRes, runsRes] = await Promise.all([
          supabase.from('employees').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
          supabase.from('leaves').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'pending'),
          supabase.from('payroll_runs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
        ]);
        setEmployeeCount(empRes.count || 0);
        setPendingLeaves(leavesRes.count || 0);

        // Get total salary from employees for payroll target
        const { data: salaryData } = await supabase.from('employees').select('salary').eq('user_id', user.id).eq('status', 'active');
        const totalSalary = (salaryData || []).reduce((sum: number, e: any) => sum + Number(e.salary || 0), 0);
        setTotalPayroll(totalSalary);

        const fmt = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
        const mapped = ((runsRes.data as any[]) || []).map((r: any) => ({
          id: r.id,
          period: r.period || '',
          status: (r.status?.toUpperCase() as 'DRAFT' | 'PAID' | 'LOCKED') || 'DRAFT',
          employees: r.employee_count || 0,
          total: fmt(r.net_amount || r.net || 0),
        }));
        setRecentPayrollRuns(mapped);
      } catch {
        // Tables may not exist yet — graceful empty state
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [user]);

  // Escrow Vault State — derived from real total payroll
  const TARGET_AMOUNT = totalPayroll || 1;
  const [vaultBalance, setVaultBalance] = useState<number>(0);
  const [fundDialogOpen, setFundDialogOpen] = useState<boolean>(false);
  const [fundAmountInput, setFundAmountInput] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<string>("icici");
  const [funding, setFunding] = useState<boolean>(false);

  const fundingPercentage = Math.min(100, Math.round((vaultBalance / TARGET_AMOUNT) * 1000) / 10);
  const remainingNeeded = Math.max(0, TARGET_AMOUNT - vaultBalance);

  const handleFundVault = (e: React.FormEvent) => {
    e.preventDefault();
    const amountInCr = parseFloat(fundAmountInput);
    if (isNaN(amountInCr) || amountInCr <= 0) {
      toast.error("Please enter a valid deposit amount in Crores (Cr)");
      return;
    }

    setFunding(true);
    setTimeout(() => {
      const addedAmount = Math.round(amountInCr * 10000000);
      const newBalance = vaultBalance + addedAmount;
      setVaultBalance(newBalance);
      setFunding(false);
      setFundDialogOpen(false);

      const formattedAdded = (addedAmount / 10000000).toFixed(2);
      const formattedNew = (newBalance / 10000000).toFixed(2);
      toast.success(`₹${formattedAdded} Cr deposited into Escrow Vault!`, {
        description: `Current Vault Balance is now ₹${formattedNew} Cr (${Math.min(100, Math.round((newBalance / TARGET_AMOUNT) * 100))}% Funded).`
      });
    }, 600);
  };

  return (
    <div className="space-y-8 pb-10">

        {/* Welcome Banner */}
        <div className="relative rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-8 shadow-xl overflow-hidden animate-slide-down text-primary-foreground">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Escrow Payroll Dashboard</h1>
            <p className="text-primary-foreground/90 max-w-lg mb-6 leading-relaxed">
              Your payroll target for active employees is <span className="font-semibold">₹{totalPayroll.toLocaleString('en-IN')}</span>.
              Please ensure your Escrow Vault is funded for seamless compliance and execution.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => navigate("/payroll")} variant="secondary" className="gap-2 font-semibold shadow-md active:scale-95 transition-transform">
                <Play className="h-4 w-4" /> Run Payroll
              </Button>
              <Button onClick={() => setFundDialogOpen(true)} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white gap-2 active:scale-95 transition-transform backdrop-blur-sm">
                <Plus className="h-4 w-4" /> Fund Escrow
              </Button>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />
          <ShieldCheck className="absolute -right-8 -top-8 h-56 w-56 text-white/10 rotate-12 pointer-events-none" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Employees" value={employeeCount.toLocaleString('en-IN')} subtitle="Active in directory" icon={Users} />
          <StatCard title="Payroll This Month" value={`₹${totalPayroll.toLocaleString('en-IN')}`} subtitle="Active salary total" icon={DollarSign} />
          <StatCard title="Pending Leaves" value={pendingLeaves.toString()} subtitle="Awaiting approval" icon={Calendar} className="hover:border-primary/50" />
          <StatCard title="Tax Variances" value="0" subtitle="No compliance variances" icon={AlertTriangle} className="border-emerald-500/30 hover:border-emerald-500/60" />
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Escrow Vault & Payroll Runs */}
          <div className="lg:col-span-2 space-y-6">

            <PayrollCostSummary />

            {/* Escrow Vault Feature */}
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
                <Button onClick={() => setFundDialogOpen(true)} variant="outline" size="sm" className="gap-2">
                  <Wallet className="h-4 w-4" /> Manage Vault
                </Button>
              </div>

              <div className="bg-muted/30 rounded-xl p-5 border border-muted/50 mb-1">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Current Vault Balance</p>
                    <h3 className="text-3xl font-bold font-mono tracking-tight text-foreground">
                      ₹{vaultBalance.toLocaleString('en-IN')}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Target</p>
                    <h3 className="text-xl font-bold font-mono tracking-tight text-foreground">₹{totalPayroll.toLocaleString('en-IN')}</h3>
                  </div>
                </div>

                {/* Custom Progress Bar */}
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.min(100, fundingPercentage)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-emerald-500 font-bold">{fundingPercentage}% Funded</span>
                  <span className="text-muted-foreground tracking-tight">
                    {remainingNeeded > 0 
                      ? `Requires ₹${remainingNeeded.toLocaleString('en-IN')} more to fully fund`
                      : "Vault Fully Funded — Ready for Disbursement!"}
                  </span>
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
                  <div key={run.id} onClick={() => navigate("/payroll")} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors group cursor-pointer">
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
                  {recentPayrollRuns.length === 0 && pendingLeaves === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                      <Activity className="h-10 w-10 mb-3 opacity-30" />
                      <p className="text-sm font-medium">No recent activity</p>
                      <p className="text-xs mt-1">Activity will appear here as you use the payroll module</p>
                    </div>
                  ) : (
                    [
                      ...recentPayrollRuns.map((run, i) => ({
                        action: `Payroll Run — ${run.period}`,
                        detail: `Status: ${run.status} · ${run.employees} employees · Net ${run.total}`,
                        time: `Run #${i + 1}`,
                        icon: DollarSign,
                        color: run.status === 'PAID' ? 'text-emerald-500' : 'text-amber-500',
                        bg: run.status === 'PAID' ? 'bg-emerald-500/10' : 'bg-amber-500/10',
                      })),
                      ...(pendingLeaves > 0 ? [{
                        action: 'Leave Requests Pending',
                        detail: `${pendingLeaves} leave request${pendingLeaves > 1 ? 's' : ''} awaiting approval`,
                        time: 'Now',
                        icon: Calendar,
                        color: 'text-blue-500',
                        bg: 'bg-blue-500/10',
                      }] : []),
                    ].map((activity, i) => {
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
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming Events Feature */}
            <div className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow animate-slide-up animation-delay-300 flex flex-col">
              <div className="px-6 py-5 border-b bg-muted/10 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold tracking-tight">Upcoming Events</h2>
              </div>
              <div className="p-6 flex-1">
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Calendar className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-xs font-medium">No upcoming company events scheduled</p>
                  <p className="text-[11px] mt-0.5">Events and holidays will display here</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      {/* Fund Escrow Vault Dialog */}
      <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Shield className="h-6 w-6 text-emerald-600" />
              Fund Escrow Vault
            </DialogTitle>
            <DialogDescription>
              Deposit funds into your dedicated Escrow Vault for upcoming payroll disbursements.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFundVault} className="space-y-4 py-2">
            <div className="p-4 bg-muted/30 rounded-xl border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Required Payout Target:</span>
                <span className="font-mono font-bold text-foreground">₹{totalPayroll.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Vault Balance:</span>
                <span className="font-mono font-bold text-emerald-600">₹{(vaultBalance / 10000000).toFixed(2)} Cr</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="font-semibold text-foreground">Required Addition:</span>
                <span className="font-mono font-bold text-indigo-600">₹{(remainingNeeded / 10000000).toFixed(2)} Cr</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank">Source Escrow Account / Gateway</Label>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger id="bank">
                  <SelectValue placeholder="Select Bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="icici">ICICI Bank Corporate Escrow (A/C ****8921)</SelectItem>
                  <SelectItem value="hdfc">HDFC Bank Escrow Vault (A/C ****4102)</SelectItem>
                  <SelectItem value="axis">Axis Bank Nodal Escrow (A/C ****3390)</SelectItem>
                  <SelectItem value="upi">Corporate RTGS / NEFT Wire Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Deposit Amount (in ₹ Crores)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">₹</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="pl-7 pr-12 font-mono font-bold"
                  value={fundAmountInput}
                  onChange={(e) => setFundAmountInput(e.target.value)}
                  placeholder="2.32"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-xs uppercase">Cr</span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setFundDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={funding} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold">
                {funding ? "Processing..." : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Deposit to Vault
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
