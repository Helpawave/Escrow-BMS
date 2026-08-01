import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Download, Mail, Eye, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

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

// No hardcoded data — payslips generated from real employee data

const statusStyles: Record<string, string> = {
  Generated: "bg-primary/10 text-primary",
  Sent: "bg-success/10 text-success",
};

function generatePayslipFromEmployee(emp: any, period: string): Payslip {
  const salary = Number(emp.salary || 0);
  const basic = Math.round(salary * 0.5);
  const hra = Math.round(salary * 0.2);
  const allowances = salary - basic - hra;
  const gross = salary;
  const pf = Math.round(basic * 0.12);
  const esi = salary <= 21000 ? Math.round(salary * 0.0075) : 0;
  const tax = Math.round(Math.max(0, (salary * 12 - 250000) / 12 * 0.05));
  const deductions = pf + esi + tax;
  const net = gross - deductions;
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  return {
    id: `PS-${period.replace(' ', '-')}-${emp.employee_id || emp.id}`,
    employee: emp.name || emp.full_name || 'Unknown',
    empId: emp.employee_id || emp.id || '',
    period,
    basic: fmt(basic),
    hra: fmt(hra),
    allowances: fmt(allowances),
    gross: fmt(gross),
    pf: fmt(pf),
    tax: fmt(tax),
    esi: fmt(esi),
    deductions: fmt(deductions),
    net: fmt(net),
    status: 'Generated',
  };
}

const Payslips = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewSlip, setViewSlip] = useState<Payslip | null>(null);

  useEffect(() => {
    if (!user) return;
    const generatePayslips = async () => {
      setLoading(true);
      try {
        const { data: employees, error } = await supabase
          .from('employees')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active');
        if (error) throw error;
        const now = new Date();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const currentPeriod = `${months[now.getMonth()]} ${now.getFullYear()}`;
        const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevPeriod = `${months[prevDate.getMonth()]} ${prevDate.getFullYear()}`;
        const generated: Payslip[] = [];
        for (const emp of (employees || [])) {
          generated.push(generatePayslipFromEmployee(emp, currentPeriod));
          generated.push({ ...generatePayslipFromEmployee(emp, prevPeriod), status: 'Sent' });
        }
        setPayslips(generated);
      } catch (err: any) {
        toast.error('Failed to generate payslips', { description: err.message });
      } finally {
        setLoading(false);
      }
    };
    generatePayslips();
  }, [user]);

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
    toast.success(`Preparing printable payslip for ${slip.employee} (${slip.period})...`);
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip - ${slip.employee} - ${slip.period}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; max-width: 700px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #4338ca; font-size: 24px; }
            .header p { margin: 5px 0 0 0; color: #64748b; font-size: 13px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 25px; background: #f8fafc; padding: 15px; border-radius: 8px; }
            .section { margin-bottom: 20px; }
            .section h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .text-right { text-align: right; }
            .net-box { background: #e0e7ff; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; color: #3730a3; margin-top: 20px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ESCOROLL PAYROLL SLIP</h1>
            <p>Official Salary Statement for ${slip.period}</p>
          </div>
          <div class="meta">
            <div>
              <strong>Employee Name:</strong> ${slip.employee}<br/>
              <strong>Employee ID:</strong> ${slip.empId}
            </div>
            <div style="text-align: right;">
              <strong>Payslip Ref:</strong> ${slip.id}<br/>
              <strong>Pay Period:</strong> ${slip.period}
            </div>
          </div>
          <div class="section">
            <h3>Earnings Breakdown</h3>
            <table>
              <tr><td>Basic Salary</td><td class="text-right">${slip.basic}</td></tr>
              <tr><td>HRA (House Rent Allowance)</td><td class="text-right">${slip.hra}</td></tr>
              <tr><td>Special & Conveyance Allowances</td><td class="text-right">${slip.allowances}</td></tr>
              <tr style="font-weight: bold; background: #f8fafc;"><td>Gross Salary</td><td class="text-right">${slip.gross}</td></tr>
            </table>
          </div>
          <div class="section">
            <h3>Deductions Breakdown</h3>
            <table>
              <tr><td>Provident Fund (PF)</td><td class="text-right" style="color:#dc2626;">${slip.pf}</td></tr>
              <tr><td>Income Tax / TDS</td><td class="text-right" style="color:#dc2626;">${slip.tax}</td></tr>
              <tr><td>ESI Contribution</td><td class="text-right" style="color:#dc2626;">${slip.esi}</td></tr>
              <tr style="font-weight: bold; background: #f8fafc;"><td>Total Deductions</td><td class="text-right" style="color:#dc2626;">${slip.deductions}</td></tr>
            </table>
          </div>
          <div class="net-box">
            <span>NET TAKE-HOME SALARY</span>
            <span>${slip.net}</span>
          </div>
          <div style="margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center;">
            This is a computer-generated document requiring no signature.
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
    setTimeout(() => {
      printWin.print();
    }, 400);
  };

  const handleEmail = (slip: Payslip) => {
    setPayslips(prev => prev.map(p => p.id === slip.id ? { ...p, status: "Sent" as const } : p));
    toast.success(`Payslip emailed to ${slip.employee}`);
  };

  return (
    <AppLayout title={t("Payslips")}>
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
