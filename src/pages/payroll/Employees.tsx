import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  MoreHorizontal,
  Loader2,
  Users,
  UserCheck,
  UserX,
  Clock,
  Eye,
  Pencil,
  Trash2,
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  Building2,
  BadgeCheck,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Employee {
  id: string;
  name: string;
  department: string;
  designation: string;
  salary: string;
  status: string;
  joinDate: string;
  email?: string;
  phone?: string;
}

const initialEmployees: Employee[] = [
  { id: "EMP001", name: "Priya Sharma", department: "Engineering", designation: "Senior Developer", salary: "₹1,50,000", status: "Active", joinDate: "2023-03-15", email: "priya.sharma@company.com", phone: "+91 98765 43210" },
  { id: "EMP002", name: "Rahul Verma", department: "Engineering", designation: "Tech Lead", salary: "₹2,20,000", status: "Active", joinDate: "2021-07-01", email: "rahul.verma@company.com", phone: "+91 98765 43211" },
  { id: "EMP003", name: "Ankit Patel", department: "Product", designation: "Product Manager", salary: "₹1,80,000", status: "Active", joinDate: "2022-01-10", email: "ankit.patel@company.com", phone: "+91 98765 43212" },
  { id: "EMP004", name: "Sneha Reddy", department: "Design", designation: "UI/UX Designer", salary: "₹1,20,000", status: "Active", joinDate: "2023-08-20", email: "sneha.reddy@company.com", phone: "+91 98765 43213" },
  { id: "EMP005", name: "Vikram Singh", department: "Finance", designation: "Financial Analyst", salary: "₹1,10,000", status: "On Leave", joinDate: "2022-05-15", email: "vikram.singh@company.com", phone: "+91 98765 43214" },
  { id: "EMP006", name: "Deepa Nair", department: "HR", designation: "HR Manager", salary: "₹1,40,000", status: "Active", joinDate: "2020-11-01", email: "deepa.nair@company.com", phone: "+91 98765 43215" },
  { id: "EMP007", name: "Arjun Gupta", department: "Engineering", designation: "Junior Developer", salary: "₹80,000", status: "Probation", joinDate: "2026-01-15", email: "arjun.gupta@company.com", phone: "+91 98765 43216" },
  { id: "EMP008", name: "Kavita Joshi", department: "Marketing", designation: "Marketing Lead", salary: "₹1,60,000", status: "Active", joinDate: "2021-09-01", email: "kavita.joshi@company.com", phone: "+91 98765 43217" },
];

const statusConfig: Record<string, { classes: string; dot: string }> = {
  Active: { classes: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20", dot: "bg-emerald-500" },
  "On Leave": { classes: "bg-amber-500/10 text-amber-600 border border-amber-500/20", dot: "bg-amber-500" },
  Probation: { classes: "bg-blue-500/10 text-blue-500 border border-blue-500/20", dot: "bg-blue-500" },
  Inactive: { classes: "bg-muted text-muted-foreground border border-border", dot: "bg-muted-foreground" },
};

const allStatuses = ["Active", "On Leave", "Probation", "Inactive"];
const departments = ["Engineering", "Product", "Design", "Finance", "HR", "Marketing", "Operations"];
const roles = [
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "hr_manager", label: "HR Manager" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-amber-600",
    "from-rose-500 to-pink-600",
    "from-indigo-500 to-blue-600",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

const Employees = () => {
  const { hasRole } = useAuth();
  const canManage = hasRole("super_admin", "admin", "hr_manager");

  const [search, setSearch] = useState("");
  const [activeDept, setActiveDept] = useState("All");
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", department: "", designation: "",
    salary: "", role: "employee", joinDate: new Date().toISOString().split("T")[0],
  });

  // View sheet
  const [viewEmp, setViewEmp] = useState<Employee | null>(null);

  // Edit dialog
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState<Partial<Employee>>({});

  // Delete dialog
  const [deleteEmp, setDeleteEmp] = useState<Employee | null>(null);

  // --- Derived stats ---
  const activeCount = employees.filter((e) => e.status === "Active").length;
  const onLeaveCount = employees.filter((e) => e.status === "On Leave").length;
  const probationCount = employees.filter((e) => e.status === "Probation").length;

  const deptTabs = ["All", ...Array.from(new Set(employees.map((e) => e.department))).sort()];

  const filtered = employees.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()) ||
      e.designation.toLowerCase().includes(search.toLowerCase());
    const matchDept = activeDept === "All" || e.department === activeDept;
    return matchSearch && matchDept;
  });

  // --- Add employee ---
  const handleAdd = async () => {
    if (!form.name || !form.email || !form.department || !form.designation || !form.salary) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-employee", {
        body: {
          email: form.email,
          full_name: form.name,
          department: form.department,
          designation: form.designation,
          role: form.role,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const nextId = `EMP${String(employees.length + 1).padStart(3, "0")}`;
      const newEmployee: Employee = {
        id: nextId,
        name: form.name,
        email: form.email,
        department: form.department,
        designation: form.designation,
        salary: `₹${Number(form.salary).toLocaleString("en-IN")}`,
        status: "Probation",
        joinDate: form.joinDate,
      };
      setEmployees((prev) => [newEmployee, ...prev]);
      toast.success(`${form.name} added successfully`, {
        description: `Credentials — Email: ${form.email}, Password: ${data.temporary_password}`,
        duration: 15000,
      });
      setForm({ name: "", email: "", department: "", designation: "", salary: "", role: "employee", joinDate: new Date().toISOString().split("T")[0] });
      setAddOpen(false);
    } catch (err: any) {
      toast.error("Failed to create employee", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Edit employee ---
  const openEdit = (emp: Employee) => {
    setEditEmp(emp);
    setEditForm({ ...emp });
  };
  const handleEdit = () => {
    if (!editEmp) return;
    setEmployees((prev) =>
      prev.map((e) => (e.id === editEmp.id ? { ...e, ...editForm } as Employee : e))
    );
    toast.success(`${editForm.name ?? editEmp.name}'s profile updated`);
    setEditEmp(null);
  };

  // --- Change status ---
  const handleStatusChange = (emp: Employee, newStatus: string) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === emp.id ? { ...e, status: newStatus } : e))
    );
    toast.success(`${emp.name}'s status changed to ${newStatus}`);
  };

  // --- Delete employee ---
  const handleDelete = () => {
    if (!deleteEmp) return;
    setEmployees((prev) => prev.filter((e) => e.id !== deleteEmp.id));
    toast.success(`${deleteEmp.name} removed from directory`);
    setDeleteEmp(null);
  };

  return (
    <AppLayout title="Employee Directory">
      <div className="space-y-6">
        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Employees", value: employees.length, icon: Users, color: "text-primary", bg: "bg-primary/10" },
            { label: "Active", value: activeCount, icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "On Leave", value: onLeaveCount, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Probation", value: probationCount, icon: UserX, color: "text-blue-500", bg: "bg-blue-500/10" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border bg-card p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, ID, department…"
              className="pl-9 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canManage && (
            <Button size="sm" className="gap-2 shrink-0" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Employee
            </Button>
          )}
        </div>

        {/* ── Department filter tabs ── */}
        <div className="flex gap-2 flex-wrap">
          {deptTabs.map((dept) => (
            <button
              key={dept}
              onClick={() => setActiveDept(dept)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                activeDept === dept
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        {/* ── Table ── */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden animate-fade-in">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Employee</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden md:table-cell">Department</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Designation</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Salary</th>
                <th className="text-center px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No employees match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const cfg = statusConfig[emp.status] ?? statusConfig["Inactive"];
                  return (
                    <tr
                      key={emp.id}
                      className="group hover:bg-muted/20 transition-colors cursor-default"
                    >
                      {/* Employee cell */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-full bg-gradient-to-br ${getAvatarColor(emp.name)} flex items-center justify-center shrink-0 shadow-sm`}
                          >
                            <span className="text-xs font-bold text-white">{getInitials(emp.name)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold leading-none">{emp.name}</p>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{emp.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-5 py-3 text-sm text-foreground hidden md:table-cell">
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {emp.department}
                        </span>
                      </td>

                      {/* Designation */}
                      <td className="px-5 py-3 text-sm text-muted-foreground hidden lg:table-cell">{emp.designation}</td>

                      {/* Salary */}
                      <td className="px-5 py-3 text-sm text-right font-mono font-semibold hidden sm:table-cell">{emp.salary}</td>

                      {/* Status badge */}
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${cfg.classes}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {emp.status}
                        </span>
                      </td>

                      {/* Actions — three dots */}
                      <td className="px-3 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity data-[state=open]:opacity-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            {/* View Profile */}
                            <DropdownMenuItem
                              onClick={() => setViewEmp(emp)}
                              className="gap-2 cursor-pointer"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              View Profile
                            </DropdownMenuItem>

                            {/* Edit */}
                            {canManage && (
                              <DropdownMenuItem
                                onClick={() => openEdit(emp)}
                                className="gap-2 cursor-pointer"
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                Edit Employee
                              </DropdownMenuItem>
                            )}

                            {/* Change Status submenu */}
                            {canManage && (
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="gap-2 cursor-pointer">
                                  <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                                  Change Status
                                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-40">
                                  {allStatuses.map((s) => {
                                    const c = statusConfig[s];
                                    return (
                                      <DropdownMenuItem
                                        key={s}
                                        disabled={emp.status === s}
                                        onClick={() => handleStatusChange(emp, s)}
                                        className="gap-2 cursor-pointer"
                                      >
                                        <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                                        {s}
                                      </DropdownMenuItem>
                                    );
                                  })}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            )}

                            {/* Delete */}
                            {canManage && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteEmp(emp)}
                                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Remove Employee
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Footer */}
          <div className="border-t bg-muted/10 px-5 py-2.5">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
              <span className="font-medium text-foreground">{employees.length}</span> employees
            </p>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          View Profile Sheet
      ════════════════════════════════════════ */}
      <Sheet open={!!viewEmp} onOpenChange={(o) => !o && setViewEmp(null)}>
        <SheetContent className="w-full sm:max-w-sm">
          {viewEmp && (
            <SheetHeader className="mb-6">
              <div className="flex flex-col items-center gap-3 pb-4 border-b">
                <div
                  className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${getAvatarColor(viewEmp.name)} flex items-center justify-center shadow-lg`}
                >
                  <span className="text-2xl font-bold text-white">{getInitials(viewEmp.name)}</span>
                </div>
                <div className="text-center">
                  <SheetTitle className="text-xl">{viewEmp.name}</SheetTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{viewEmp.designation}</p>
                  <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${statusConfig[viewEmp.status]?.classes}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusConfig[viewEmp.status]?.dot}`} />
                    {viewEmp.status}
                  </span>
                </div>
              </div>
            </SheetHeader>
          )}
          {viewEmp && (
            <div className="space-y-4">
              {[
                { icon: BadgeCheck, label: "Employee ID", value: viewEmp.id },
                { icon: Building2, label: "Department", value: viewEmp.department },
                { icon: Mail, label: "Email", value: viewEmp.email ?? "—" },
                { icon: Phone, label: "Phone", value: viewEmp.phone ?? "—" },
                { icon: Calendar, label: "Join Date", value: viewEmp.joinDate },
                { icon: Users, label: "Monthly Salary", value: viewEmp.salary },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ════════════════════════════════════════
          Add Employee Dialog
      ════════════════════════════════════════ */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name *</Label>
                <Input placeholder="e.g. Priya Sharma" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email *</Label>
                <Input type="email" placeholder="e.g. priya@company.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Role *</Label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>{roles.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department *</Label>
                <Select value={form.department} onValueChange={(v) => setForm((f) => ({ ...f, department: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                  <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Designation *</Label>
                <Input placeholder="e.g. Senior Developer" value={form.designation} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Salary (₹) *</Label>
                <Input type="number" placeholder="150000" value={form.salary} onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Join Date</Label>
                <Input type="date" value={form.joinDate} onChange={(e) => setForm((f) => ({ ...f, joinDate: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════
          Edit Employee Dialog
      ════════════════════════════════════════ */}
      <Dialog open={!!editEmp} onOpenChange={(o) => !o && setEditEmp(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</Label>
                <Input value={editForm.name ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</Label>
                <Select value={editForm.department ?? ""} onValueChange={(v) => setEditForm((f) => ({ ...f, department: v }))}>
                  <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                  <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</Label>
                <Select value={editForm.status ?? ""} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>{allStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Designation</Label>
                <Input value={editForm.designation ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, designation: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</Label>
                <Input type="email" value={editForm.email ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</Label>
                <Input value={editForm.phone ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEmp(null)}>Cancel</Button>
            <Button onClick={handleEdit} className="gap-2">
              <Pencil className="h-4 w-4" /> Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════
          Delete Confirmation Dialog
      ════════════════════════════════════════ */}
      <AlertDialog open={!!deleteEmp} onOpenChange={(o) => !o && setDeleteEmp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">{deleteEmp?.name}</span> from the directory?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Employees;
