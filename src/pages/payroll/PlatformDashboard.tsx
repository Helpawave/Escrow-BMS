import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Building2, Users, Crown, Search, Plus, MoreHorizontal, KeyRound, Loader2, Shield,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Company {
  id: string;
  name: string;
  registration_no: string | null;
  plan: string;
  plan_started_at: string | null;
  is_active: boolean;
  user_count: number;
  created_at: string;
}

interface PlatformUser {
  id: string;
  full_name: string | null;
  email: string | null;
  company_id: string | null;
  role: string;
  created_at: string;
}

const PlatformDashboard = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [tab, setTab] = useState<"companies" | "users">("companies");

  const [form, setForm] = useState({
    company_name: "",
    admin_email: "",
    admin_name: "",
    plan: "free",
    registration_no: "",
    pan: "",
    gst: "",
  });

  const fetchData = async () => {
    setLoading(true);
    const [compRes, userRes] = await Promise.all([
      supabase.functions.invoke("platform-admin", { body: { action: "list_companies" } }),
      supabase.functions.invoke("platform-admin", { body: { action: "list_users" } }),
    ]);
    if (compRes.data?.companies) setCompanies(compRes.data.companies);
    if (userRes.data?.users) setUsers(userRes.data.users);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddCompany = async () => {
    if (!form.company_name || !form.admin_email || !form.admin_name) {
      toast.error("Company name, admin email, and admin name are required");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("platform-admin", {
      body: { action: "add_company", ...form },
    });
    setSubmitting(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Failed to add company");
      return;
    }
    toast.success(`${form.company_name} created`, {
      description: `Admin: ${form.admin_email} / Password: ${data.temporary_password}`,
      duration: 15000,
    });
    setAddOpen(false);
    setForm({ company_name: "", admin_email: "", admin_name: "", plan: "free", registration_no: "", pan: "", gst: "" });
    fetchData();
  };

  const handleToggleStatus = async (company: Company) => {
    await supabase.functions.invoke("platform-admin", {
      body: { action: "toggle_company_status", company_id: company.id, is_active: !company.is_active },
    });
    toast.success(`${company.name} ${company.is_active ? "deactivated" : "activated"}`);
    fetchData();
  };

  const handlePlanChange = async (company: Company, plan: string) => {
    await supabase.functions.invoke("platform-admin", {
      body: { action: "update_plan", company_id: company.id, plan },
    });
    toast.success(`${company.name} plan updated to ${plan}`);
    fetchData();
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("platform-admin", {
      body: { action: "reset_user_password", user_id: selectedUser.id, new_password: newPassword },
    });
    setSubmitting(false);
    if (error || data?.error) {
      toast.error(data?.error || "Failed to reset password");
      return;
    }
    toast.success(`Password reset for ${selectedUser.email}`);
    setResetOpen(false);
    setNewPassword("");
    setSelectedUser(null);
  };

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = users.length;
  const premiumCount = companies.filter((c) => c.plan === "premium").length;
  const activeCount = companies.filter((c) => c.is_active).length;

  return (
    <AppLayout title="Platform Administration">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Companies" value={companies.length.toString()} subtitle={`${activeCount} active`} icon={Building2} />
          <StatCard title="Total Users" value={totalUsers.toString()} subtitle="Across all companies" icon={Users} />
          <StatCard title="Premium Plans" value={premiumCount.toString()} subtitle={`of ${companies.length} companies`} icon={Crown} />
          <StatCard title="Platform" value="Active" subtitle="All systems operational" icon={Shield} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setTab("companies")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "companies" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Companies
            </button>
            <button
              onClick={() => setTab("users")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "users" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              All Users
            </button>
          </div>
          {tab === "companies" && (
            <Button size="sm" className="gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" />Add Company
            </Button>
          )}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={`Search ${tab}...`} className="pl-9 bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tab === "companies" ? (
          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Company</th>
                  <th className="text-center px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Users</th>
                  <th className="text-center px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Plan</th>
                  <th className="text-center px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="text-center px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Registered</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          {c.registration_no && <p className="text-xs text-muted-foreground font-mono">{c.registration_no}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-center font-mono">{c.user_count}</td>
                    <td className="px-6 py-3 text-center">
                      <Select value={c.plan} onValueChange={(v) => handlePlanChange(c, v)}>
                        <SelectTrigger className="w-28 h-7 text-xs mx-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Switch checked={c.is_active} onCheckedChange={() => handleToggleStatus(c)} />
                    </td>
                    <td className="px-6 py-3 text-xs text-center text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-3 py-3"></td>
                  </tr>
                ))}
                {filteredCompanies.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">No companies found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">User</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Role</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Joined</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3">
                      <p className="text-sm font-medium">{u.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                        {u.role.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-3 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => { setSelectedUser(u); setResetOpen(true); }}
                      >
                        <KeyRound className="h-3 w-3" />Reset
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Company Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Register New Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company Name *</Label>
              <Input placeholder="e.g. Acme Corp" value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Admin Name *</Label>
                <Input placeholder="e.g. John Doe" value={form.admin_name} onChange={(e) => setForm((f) => ({ ...f, admin_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Admin Email *</Label>
                <Input type="email" placeholder="admin@company.com" value={form.admin_email} onChange={(e) => setForm((f) => ({ ...f, admin_email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan</Label>
              <Select value={form.plan} onValueChange={(v) => setForm((f) => ({ ...f, plan: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reg. No</Label>
                <Input placeholder="Optional" value={form.registration_no} onChange={(e) => setForm((f) => ({ ...f, registration_no: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">PAN</Label>
                <Input placeholder="Optional" value={form.pan} onChange={(e) => setForm((f) => ({ ...f, pan: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">GST</Label>
                <Input placeholder="Optional" value={form.gst} onChange={(e) => setForm((f) => ({ ...f, gst: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCompany} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}Register Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Reset password for <strong>{selectedUser?.email}</strong>
            </p>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New Password</Label>
              <Input type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default PlatformDashboard;
