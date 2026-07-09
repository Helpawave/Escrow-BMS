import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Shield, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const auditLogs = [
  { id: "AUD-001", user: "admin@escoroll.io", role: "Super Admin", action: "Payroll Locked", target: "PR-2026-02", detail: "Locked February 2026 payroll run", timestamp: "2026-03-19 14:32:10", ip: "192.168.1.45" },
  { id: "AUD-002", user: "hr@escoroll.io", role: "HR Manager", action: "Employee Added", target: "EMP007", detail: "Added Arjun Gupta to Engineering", timestamp: "2026-03-19 11:15:00", ip: "192.168.1.22" },
  { id: "AUD-003", user: "admin@escoroll.io", role: "Super Admin", action: "Bulk Export", target: "Employees", detail: "Exported all employee records as CSV", timestamp: "2026-03-18 16:45:30", ip: "192.168.1.45" },
  { id: "AUD-004", user: "hr@escoroll.io", role: "HR Manager", action: "Leave Approved", target: "LR-002", detail: "Approved sick leave for Rahul Verma", timestamp: "2026-03-18 10:20:00", ip: "192.168.1.22" },
  { id: "AUD-005", user: "admin@escoroll.io", role: "Super Admin", action: "Salary Revised", target: "EMP003", detail: "15% increment for Ankit Patel", timestamp: "2026-03-17 09:30:00", ip: "192.168.1.45" },
  { id: "AUD-006", user: "admin@escoroll.io", role: "Super Admin", action: "Settings Updated", target: "System", detail: "Updated password policy to 90-day rotation", timestamp: "2026-03-16 14:00:00", ip: "192.168.1.45" },
  { id: "AUD-007", user: "manager@escoroll.io", role: "Manager", action: "Leave Rejected", target: "LR-006", detail: "Rejected casual leave for Arjun Gupta", timestamp: "2026-03-16 11:10:00", ip: "192.168.1.33" },
  { id: "AUD-008", user: "hr@escoroll.io", role: "HR Manager", action: "Payslips Generated", target: "March 2026", detail: "Generated payslips for 8 employees", timestamp: "2026-03-15 15:45:00", ip: "192.168.1.22" },
];

const actionStyles: Record<string, string> = {
  "Payroll Locked": "bg-warning/10 text-warning",
  "Employee Added": "bg-success/10 text-success",
  "Bulk Export": "bg-destructive/10 text-destructive",
  "Leave Approved": "bg-success/10 text-success",
  "Salary Revised": "bg-primary/10 text-primary",
  "Settings Updated": "bg-muted text-muted-foreground",
  "Leave Rejected": "bg-destructive/10 text-destructive",
  "Payslips Generated": "bg-primary/10 text-primary",
};

export const Audit = () => {
  const [search, setSearch] = useState("");

  const filtered = auditLogs.filter(
    (log) =>
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.target.toLowerCase().includes(search.toLowerCase()) ||
      log.detail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Audit Log">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Complete audit trail of all system actions</p>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success("Audit log exported")}>
            <Download className="h-3.5 w-3.5" />Export Log
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by user, action, or target..." className="pl-9 bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="rounded-lg border bg-card shadow-sm overflow-hidden animate-fade-in">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Timestamp</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">User</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Action</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Detail</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap" data-mono>{log.timestamp}</td>
                  <td className="px-6 py-3">
                    <div>
                      <p className="text-sm font-medium">{log.user}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{log.role}</p>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${actionStyles[log.action] || "bg-muted text-muted-foreground"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm font-mono" data-mono>{log.target}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground max-w-[250px] truncate">{log.detail}</td>
                  <td className="px-6 py-3 text-xs font-mono text-muted-foreground" data-mono>{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};
