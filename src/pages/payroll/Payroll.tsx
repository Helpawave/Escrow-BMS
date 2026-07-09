import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Play, Lock, Eye, MoreHorizontal, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type PayrollStatus = 'DRAFT' | 'VALIDATING' | 'CALCULATED' | 'LOCKED' | 'PAID';

const statusOrder: PayrollStatus[] = ['DRAFT', 'VALIDATING', 'CALCULATED', 'LOCKED', 'PAID'];

interface PayrollRun {
  id: string;
  period: string;
  status: PayrollStatus;
  employees: number;
  gross: string;
  deductions: string;
  net: string;
}

const initialRuns: PayrollRun[] = [
  { id: "PR-2026-03", period: "March 2026", status: "DRAFT", employees: 1240, gross: "₹6,12,50,000", deductions: "₹1,30,00,000", net: "₹4,82,50,000" },
  { id: "PR-2026-02", period: "February 2026", status: "PAID", employees: 1238, gross: "₹6,08,20,000", deductions: "₹1,30,00,000", net: "₹4,78,20,000" },
  { id: "PR-2026-01", period: "January 2026", status: "PAID", employees: 1235, gross: "₹6,05,00,000", deductions: "₹1,30,00,000", net: "₹4,75,00,000" },
  { id: "PR-2025-12", period: "December 2025", status: "PAID", employees: 1230, gross: "₹6,00,00,000", deductions: "₹1,28,00,000", net: "₹4,72,00,000" },
  { id: "PR-2025-11", period: "November 2025", status: "PAID", employees: 1228, gross: "₹5,98,00,000", deductions: "₹1,27,00,000", net: "₹4,71,00,000" },
];

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const years = ["2025", "2026", "2027"];

const statusActionLabel: Record<PayrollStatus, string> = {
  DRAFT: "Start Validation",
  VALIDATING: "Calculate Payroll",
  CALCULATED: "Lock Payroll",
  LOCKED: "Process Payment",
  PAID: "",
};

const Payroll = () => {
  const [runs, setRuns] = useState<PayrollRun[]>(initialRuns);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("2026");
  const [empCount, setEmpCount] = useState("1240");
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; runId: string; nextStatus: PayrollStatus | null }>({ open: false, runId: "", nextStatus: null });

  const handleCreate = () => {
    if (!month || !year) {
      toast.error("Please select a month and year");
      return;
    }

    const period = `${month} ${year}`;
    if (runs.some(r => r.period === period)) {
      toast.error(`Payroll run for ${period} already exists`);
      return;
    }

    const monthIdx = months.indexOf(month) + 1;
    const id = `PR-${year}-${String(monthIdx).padStart(2, "0")}`;
    const count = parseInt(empCount) || 1240;

    const newRun: PayrollRun = {
      id,
      period,
      status: "DRAFT",
      employees: count,
      gross: "₹0",
      deductions: "₹0",
      net: "₹0",
    };

    setRuns([newRun, ...runs]);
    setOpen(false);
    setMonth("");
    toast.success(`Payroll run ${id} created as DRAFT`);
  };

  const advanceStatus = (runId: string) => {
    const run = runs.find(r => r.id === runId);
    if (!run || run.status === "PAID") return;

    const currentIdx = statusOrder.indexOf(run.status);
    const nextStatus = statusOrder[currentIdx + 1];

    setConfirmDialog({ open: true, runId, nextStatus });
  };

  const confirmAdvance = () => {
    const { runId, nextStatus } = confirmDialog;
    if (!nextStatus) return;

    setRuns(prev => prev.map(r => {
      if (r.id !== runId) return r;
      const updated = { ...r, status: nextStatus };
      // Simulate values when moving from VALIDATING to CALCULATED
      if (nextStatus === "CALCULATED" && r.gross === "₹0") {
        updated.gross = `₹${(r.employees * 50000).toLocaleString("en-IN")}`;
        updated.deductions = `₹${(r.employees * 10000).toLocaleString("en-IN")}`;
        updated.net = `₹${(r.employees * 40000).toLocaleString("en-IN")}`;
      }
      return updated;
    }));

    toast.success(`Payroll moved to ${nextStatus}`);
    setConfirmDialog({ open: false, runId: "", nextStatus: null });
  };

  const currentActive = runs.find(r => r.status !== "PAID");

  return (
    <AppLayout title="Payroll Runs">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Manage payroll processing, review, and disbursement</p>
          <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
            <Play className="h-3.5 w-3.5" />New Payroll Run
          </Button>
        </div>

        {/* State Machine Pipeline */}
        {currentActive && (
          <div className="rounded-lg border bg-card p-6 shadow-sm animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Current Run: {currentActive.period}
              </p>
              {currentActive.status !== "PAID" && (
                <Button size="sm" className="gap-2" onClick={() => advanceStatus(currentActive.id)}>
                  <ArrowRight className="h-3.5 w-3.5" />{statusActionLabel[currentActive.status]}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {statusOrder.map((step, i) => {
                const currentIdx = statusOrder.indexOf(currentActive.status);
                const isCompleted = i < currentIdx;
                const isCurrent = step === currentActive.status;
                return (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`flex items-center justify-center h-9 px-4 rounded-md text-xs font-bold uppercase tracking-wider border transition-colors ${
                      isCurrent ? "bg-primary/10 text-primary border-primary/30" :
                      isCompleted ? "bg-success/10 text-success border-success/30" :
                      "bg-muted/30 text-muted-foreground border-border"
                    }`}>
                      {isCompleted && <CheckCircle2 className="h-3 w-3 mr-1.5" />}
                      {step}
                    </div>
                    {i < 4 && <div className={`w-6 h-px ${isCompleted ? "bg-success" : "bg-border"}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payroll Table */}
        <div className="rounded-lg border bg-card shadow-sm overflow-hidden animate-slide-up">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Run ID</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Period</th>
                <th className="text-center px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Employees</th>
                <th className="text-right px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gross</th>
                <th className="text-right px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Deductions</th>
                <th className="text-right px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Net Pay</th>
                <th className="text-center px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3 text-sm font-mono font-medium">{run.id}</td>
                  <td className="px-6 py-3 text-sm">{run.period}</td>
                  <td className="px-6 py-3 text-sm text-center font-mono">{run.employees.toLocaleString()}</td>
                  <td className="px-6 py-3 text-sm text-right font-mono">{run.gross}</td>
                  <td className="px-6 py-3 text-sm text-right font-mono text-destructive">{run.deductions}</td>
                  <td className="px-6 py-3 text-sm text-right font-mono font-semibold">{run.net}</td>
                  <td className="px-6 py-3 text-center"><StatusBadge status={run.status} /></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => toast.info(`Viewing details for ${run.period}`)}><Eye className="h-3.5 w-3.5" /></Button>
                      {run.status !== "PAID" && run.status !== "LOCKED" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => advanceStatus(run.id)}>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {run.status === "CALCULATED" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => advanceStatus(run.id)}>
                          <Lock className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Payroll Run Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Payroll Run</DialogTitle>
            <DialogDescription>Create a new payroll run for processing</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employee Count</Label>
              <Input type="number" value={empCount} onChange={e => setEmpCount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="gap-2"><Play className="h-3.5 w-3.5" />Create Run</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Status Advance Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(o) => !o && setConfirmDialog({ open: false, runId: "", nextStatus: null })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Move payroll to <span className="font-semibold text-foreground">{confirmDialog.nextStatus}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, runId: "", nextStatus: null })}>Cancel</Button>
            <Button onClick={confirmAdvance}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Payroll;
