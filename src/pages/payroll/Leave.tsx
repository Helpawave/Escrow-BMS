import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Clock, CheckCircle2, XCircle, CalendarDays } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface LeaveRequest {
  id: string;
  employee: string;
  empId: string;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  appliedOn: string;
}

const initialRequests: LeaveRequest[] = [
  { id: "LR-001", employee: "Priya Sharma", empId: "EMP001", type: "Casual Leave", from: "2026-03-24", to: "2026-03-25", days: 2, reason: "Personal work", status: "Pending", appliedOn: "2026-03-18" },
  { id: "LR-002", employee: "Rahul Verma", empId: "EMP002", type: "Sick Leave", from: "2026-03-20", to: "2026-03-21", days: 2, reason: "Medical appointment", status: "Approved", appliedOn: "2026-03-17" },
  { id: "LR-003", employee: "Ankit Patel", empId: "EMP003", type: "Paid Leave", from: "2026-04-01", to: "2026-04-05", days: 5, reason: "Family vacation", status: "Pending", appliedOn: "2026-03-15" },
  { id: "LR-004", employee: "Sneha Reddy", empId: "EMP004", type: "Casual Leave", from: "2026-03-19", to: "2026-03-19", days: 1, reason: "Personal errand", status: "Approved", appliedOn: "2026-03-16" },
  { id: "LR-005", employee: "Vikram Singh", empId: "EMP005", type: "Unpaid Leave", from: "2026-03-17", to: "2026-03-21", days: 5, reason: "Family emergency", status: "Approved", appliedOn: "2026-03-14" },
  { id: "LR-006", employee: "Arjun Gupta", empId: "EMP007", type: "Casual Leave", from: "2026-03-22", to: "2026-03-22", days: 1, reason: "Moving house", status: "Rejected", appliedOn: "2026-03-18" },
  { id: "LR-007", employee: "Kavita Joshi", empId: "EMP008", type: "Sick Leave", from: "2026-03-25", to: "2026-03-26", days: 2, reason: "Not feeling well", status: "Pending", appliedOn: "2026-03-19" },
];

const typeStyles: Record<string, string> = {
  "Casual Leave": "bg-primary/10 text-primary",
  "Sick Leave": "bg-destructive/10 text-destructive",
  "Paid Leave": "bg-success/10 text-success",
  "Unpaid Leave": "bg-warning/10 text-warning",
};

const statusStyles: Record<string, string> = {
  Pending: "bg-warning/10 text-warning",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
};

const Leave = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>(initialRequests);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employee: "", empId: "", type: "", from: "", to: "", reason: "" });

  const filtered = requests.filter(
    (l) =>
      l.employee.toLowerCase().includes(search.toLowerCase()) ||
      l.empId.toLowerCase().includes(search.toLowerCase()) ||
      l.type.toLowerCase().includes(search.toLowerCase())
  );

  const pending = requests.filter((l) => l.status === "Pending").length;
  const approved = requests.filter((l) => l.status === "Approved").length;
  const rejected = requests.filter((l) => l.status === "Rejected").length;

  const handleApprove = (id: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Approved" as const } : r)));
    const req = requests.find((r) => r.id === id);
    toast.success(`Leave approved for ${req?.employee}`);
  };

  const handleReject = (id: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Rejected" as const } : r)));
    const req = requests.find((r) => r.id === id);
    toast.error(`Leave rejected for ${req?.employee}`);
  };

  const handleCreate = () => {
    if (!form.employee || !form.type || !form.from || !form.to || !form.reason) {
      toast.error("Please fill in all fields");
      return;
    }
    const fromDate = new Date(form.from);
    const toDate = new Date(form.to);
    if (toDate < fromDate) {
      toast.error("End date must be after start date");
      return;
    }
    const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const nextId = `LR-${String(requests.length + 1).padStart(3, "0")}`;

    const newReq: LeaveRequest = {
      id: nextId,
      employee: form.employee,
      empId: form.empId || "EMP000",
      type: form.type,
      from: form.from,
      to: form.to,
      days,
      reason: form.reason,
      status: "Pending",
      appliedOn: new Date().toISOString().split("T")[0],
    };

    setRequests((prev) => [newReq, ...prev]);
    setForm({ employee: "", empId: "", type: "", from: "", to: "", reason: "" });
    setDialogOpen(false);
    toast.success("Leave request submitted");
  };

  return (
    <AppLayout title="Leave Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Manage leave requests and approval workflows</p>
          <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="h-3.5 w-3.5" />New Leave Request</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Pending Requests" value={pending.toString()} subtitle="Awaiting approval" icon={Clock} />
          <StatCard title="Approved" value={approved.toString()} subtitle="This month" icon={CheckCircle2} />
          <StatCard title="Rejected" value={rejected.toString()} subtitle="This month" icon={XCircle} />
          <StatCard title="On Leave Today" value="2" subtitle="Across departments" icon={CalendarDays} />
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by employee or leave type..." className="pl-9 bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="rounded-lg border bg-card shadow-sm overflow-hidden animate-fade-in">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Employee</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Duration</th>
                <th className="text-center px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Days</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reason</th>
                <th className="text-center px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3">
                    <div>
                      <p className="text-sm font-medium">{req.employee}</p>
                      <p className="text-xs text-muted-foreground font-mono" data-mono>{req.empId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${typeStyles[req.type]}`}>{req.type}</span>
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-sm font-mono" data-mono>{req.from}</p>
                    {req.from !== req.to && <p className="text-xs text-muted-foreground font-mono" data-mono>to {req.to}</p>}
                  </td>
                  <td className="px-6 py-3 text-sm text-center font-mono font-semibold" data-mono>{req.days}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground max-w-[200px] truncate">{req.reason}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${statusStyles[req.status]}`}>{req.status}</span>
                  </td>
                  <td className="px-3 py-3">
                    {req.status === "Pending" && (
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-success hover:text-success" onClick={() => handleApprove(req.id)}>Approve</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => handleReject(req.id)}>Reject</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Employee Name *</Label>
              <Input placeholder="e.g. Priya Sharma" value={form.employee} onChange={(e) => setForm((f) => ({ ...f, employee: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Employee ID</Label>
              <Input placeholder="e.g. EMP001" value={form.empId} onChange={(e) => setForm((f) => ({ ...f, empId: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Leave Type *</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {["Casual Leave", "Sick Leave", "Paid Leave", "Unpaid Leave"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">From *</Label>
                <Input type="date" value={form.from} onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">To *</Label>
                <Input type="date" value={form.to} onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason *</Label>
              <Textarea placeholder="Reason for leave..." value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Leave;
