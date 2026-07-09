import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Download, Mail, Eye, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Payslip {
  id: string;
  employee: string;
  empId: string;
  period: string;
  basic: string;
  hra: string;
  allowances: string;
  gross: string;
  pf: string;
  tax: string;
  esi: string;
  deductions: string;
  net: string;
  status: "Generated" | "Sent";
}

const initialPayslips: Payslip[] = [
  { id: "PS-2026-03-001", employee: "Priya Sharma", empId: "EMP001", period: "March 2026", basic: "₹75,000", hra: "₹30,000", allowances: "₹15,000", gross: "₹1,50,000", pf: "₹9,000", tax: "₹12,500", esi: "₹1,125", deductions: "₹22,625", net: "₹1,27,375", status: "Generated" },
  { id: "PS-2026-03-002", employee: "Rahul Verma", empId: "EMP002", period: "March 2026", basic: "₹1,10,000", hra: "₹44,000", allowances: "₹22,000", gross: "₹2,20,000", pf: "₹13,200", tax: "₹25,000", esi: "₹1,650", deductions: "₹39,850", net: "₹1,80,150", status: "Generated" },
  { id: "PS-2026-03-003", employee: "Ankit Patel", empId: "EMP003", period: "March 2026", basic: "₹90,000", hra: "₹36,000", allowances: "₹18,000", gross: "₹1,80,000", pf: "₹10,800", tax: "₹18,000", esi: "₹1,350", deductions: "₹30,150", net: "₹1,49,850", status: "Sent" },
  { id: "PS-2026-03-004", employee: "Sneha Reddy", empId: "EMP004", period: "March 2026", basic: "₹60,000", hra: "₹24,000", allowances: "₹12,000", gross: "₹1,20,000", pf: "₹7,200", tax: "₹8,000", esi: "₹900", deductions: "₹16,100", net: "₹1,03,900", status: "Generated" },
  { id: "PS-2026-02-001", employee: "Priya Sharma", empId: "EMP001", period: "February 2026", basic: "₹75,000", hra: "₹30,000", allowances: "₹15,000", gross: "₹1,50,000", pf: "₹9,000", tax: "₹12,500", esi: "₹1,125", deductions: "₹22,625", net: "₹1,27,375", status: "Sent" },
  { id: "PS-2026-02-002", employee: "Rahul Verma", empId: "EMP002", period: "February 2026", basic: "₹1,10,000", hra: "₹44,000", allowances: "₹22,000", gross: "₹2,20,000", pf: "₹13,200", tax: "₹25,000", esi: "₹1,650", deductions: "₹39,850", net: "₹1,80,150", status: "Sent" },
];

const statusStyles: Record<string, string> = {
  Generated: "bg-primary/10 text-primary",
  Sent: "bg-success/10 text-success",
};

const Payslips = () => {
  const [search, setSearch] = useState("");
  const [payslips, setPayslips] = useState<Payslip[]>(initialPayslips);
  const [viewSlip, setViewSlip] = useState<Payslip | null>(null);

  const filtered = payslips.filter(
    (p) =>
      p.employee.toLowerCase().includes(search.toLowerCase()) ||
      p.empId.toLowerCase().includes(search.toLowerCase()) ||
      p.period.toLowerCase().includes(search.toLowerCase())
  );

  const handleEmailAll = () => {
    const generated = payslips.filter(p => p.status === "Generated");
    if (generated.length === 0) {
      toast.info("All payslips have already been sent");
      return;
    }
    setPayslips(prev => prev.map(p => ({ ...p, status: "Sent" as const })));
    toast.success(`${generated.length} payslips emailed successfully`);
  };

  const handleGenerate = () => {
    toast.success("Payslips generated for all active employees");
  };

  const handleDownload = (slip: Payslip) => {
    toast.success(`Downloading payslip for ${slip.employee} — ${slip.period}`);
  };

  const handleEmail = (slip: Payslip) => {
    setPayslips(prev => prev.map(p => p.id === slip.id ? { ...p, status: "Sent" as const } : p));
    toast.success(`Payslip emailed to ${slip.employee}`);
  };

  return (
    <AppLayout title="Payslips">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Generate, view, and distribute employee payslips</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleEmailAll}><Mail className="h-3.5 w-3.5" />Email All</Button>
            <Button size="sm" className="gap-2" onClick={handleGenerate}><FileText className="h-3.5 w-3.5" />Generate Payslips</Button>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by employee or period..." className="pl-9 bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="rounded-lg border bg-card shadow-sm overflow-hidden animate-fade-in">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Employee</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Period</th>
                <th className="text-right px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gross</th>
                <th className="text-right px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Deductions</th>
                <th className="text-right px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Net Pay</th>
                <th className="text-center px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((slip) => (
                <tr key={slip.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3">
                    <div>
                      <p className="text-sm font-medium">{slip.employee}</p>
                      <p className="text-xs text-muted-foreground font-mono" data-mono>{slip.empId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm">{slip.period}</td>
                  <td className="px-6 py-3 text-sm text-right font-mono" data-mono>{slip.gross}</td>
                  <td className="px-6 py-3 text-sm text-right font-mono text-destructive" data-mono>{slip.deductions}</td>
                  <td className="px-6 py-3 text-sm text-right font-mono font-semibold" data-mono>{slip.net}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${statusStyles[slip.status]}`}>{slip.status}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setViewSlip(slip)}><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => handleDownload(slip)}><Download className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Payslip Detail Dialog */}
      <Dialog open={!!viewSlip} onOpenChange={(o) => !o && setViewSlip(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Payslip — {viewSlip?.period}</DialogTitle>
          </DialogHeader>
          {viewSlip && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold">{viewSlip.employee}</p>
                  <p className="text-xs text-muted-foreground font-mono">{viewSlip.empId} · {viewSlip.id}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${statusStyles[viewSlip.status]}`}>{viewSlip.status}</span>
              </div>

              <div className="rounded-lg border divide-y">
                <div className="px-4 py-2 bg-muted/30">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Earnings</p>
                </div>
                <div className="px-4 py-2 flex justify-between text-sm"><span>Basic Salary</span><span className="font-mono">{viewSlip.basic}</span></div>
                <div className="px-4 py-2 flex justify-between text-sm"><span>HRA</span><span className="font-mono">{viewSlip.hra}</span></div>
                <div className="px-4 py-2 flex justify-between text-sm"><span>Allowances</span><span className="font-mono">{viewSlip.allowances}</span></div>
                <div className="px-4 py-2 flex justify-between text-sm font-semibold bg-muted/20"><span>Gross</span><span className="font-mono">{viewSlip.gross}</span></div>
              </div>

              <div className="rounded-lg border divide-y">
                <div className="px-4 py-2 bg-muted/30">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Deductions</p>
                </div>
                <div className="px-4 py-2 flex justify-between text-sm"><span>Provident Fund</span><span className="font-mono text-destructive">{viewSlip.pf}</span></div>
                <div className="px-4 py-2 flex justify-between text-sm"><span>Income Tax (TDS)</span><span className="font-mono text-destructive">{viewSlip.tax}</span></div>
                <div className="px-4 py-2 flex justify-between text-sm"><span>ESI</span><span className="font-mono text-destructive">{viewSlip.esi}</span></div>
                <div className="px-4 py-2 flex justify-between text-sm font-semibold bg-muted/20"><span>Total Deductions</span><span className="font-mono text-destructive">{viewSlip.deductions}</span></div>
              </div>

              <div className="rounded-lg border bg-primary/5 px-4 py-3 flex justify-between items-center">
                <span className="font-semibold">Net Pay</span>
                <span className="text-lg font-bold font-mono text-primary">{viewSlip.net}</span>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => { handleEmail(viewSlip); setViewSlip(null); }}>
                  <Mail className="h-3.5 w-3.5" />Email
                </Button>
                <Button size="sm" className="gap-2" onClick={() => handleDownload(viewSlip)}>
                  <Download className="h-3.5 w-3.5" />Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Payslips;
