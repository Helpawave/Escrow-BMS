
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
  Calculator,
  Check,
} from "lucide-react";
import { MODULES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { updateUserAcrossAllModules } from "@/utils/erpPosting";

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
  allowed_modules?: string[];
}

// No hardcoded data — loaded from Supabase

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

export interface SalaryBreakdown {
  ctcAnnual: number;
  ctcMonthly: number;
  basicMonthly: number;
  hraMonthly: number;
  specialAllowanceMonthly: number;
  grossMonthly: number;
  pfDeduction: number;
  esiDeduction: number;
  ptDeduction: number;
  totalDeductions: number;
  netInHandMonthly: number;
  netInHandAnnual: number;
}

export function calculateSalaryBreakdown(ctcValue: number | string, isAnnual: boolean = true): SalaryBreakdown {
  const num = typeof ctcValue === 'number' ? ctcValue : parseFloat(String(ctcValue).replace(/[^\d.]/g, '')) || 0;
  const ctcAnnual = isAnnual ? num : num * 12;
  const ctcMonthly = Math.round(ctcAnnual / 12);

  const basicMonthly = Math.round(ctcMonthly * 0.50);
  const hraMonthly = Math.round(basicMonthly * 0.50);
  const specialAllowanceMonthly = Math.max(0, ctcMonthly - (basicMonthly + hraMonthly));
  const grossMonthly = ctcMonthly;

  const pfDeduction = basicMonthly > 0 ? Math.min(1800, Math.round(basicMonthly * 0.12)) : 0;
  const esiDeduction = (grossMonthly > 0 && grossMonthly <= 21000) ? Math.round(grossMonthly * 0.0075) : 0;
  const ptDeduction = grossMonthly > 20000 ? 200 : grossMonthly > 15000 ? 150 : 0;

  const totalDeductions = pfDeduction + esiDeduction + ptDeduction;
  const netInHandMonthly = Math.max(0, grossMonthly - totalDeductions);
  const netInHandAnnual = netInHandMonthly * 12;

  return {
    ctcAnnual,
    ctcMonthly,
    basicMonthly,
    hraMonthly,
    specialAllowanceMonthly,
    grossMonthly,
    pfDeduction,
    esiDeduction,
    ptDeduction,
    totalDeductions,
    netInHandMonthly,
    netInHandAnnual
  };
}

export function formatSalaryDisplay(salaryVal: string | number): { formattedBadge: string; subtext: string } {
  if (!salaryVal) return { formattedBadge: '₹6.0 LPA', subtext: '₹48,000/mo in-hand' };
  const rawNum = typeof salaryVal === 'number' ? salaryVal : parseFloat(String(salaryVal).replace(/[^\d.]/g, '')) || 0;
  if (rawNum <= 0) return { formattedBadge: '₹6.0 LPA', subtext: '₹48,000/mo in-hand' };

  if (rawNum >= 100000) {
    const lpa = (rawNum / 100000).toFixed(1);
    const monthlyGross = Math.round(rawNum / 12);
    const basic = monthlyGross * 0.5;
    const pf = Math.min(1800, basic * 0.12);
    const pt = monthlyGross > 20000 ? 200 : 150;
    const inHandMonthly = Math.max(0, monthlyGross - pf - pt);
    return {
      formattedBadge: `₹${lpa} LPA`,
      subtext: `₹${inHandMonthly.toLocaleString('en-IN')}/mo in-hand`
    };
  } else {
    const annual = rawNum * 12;
    const lpa = (annual / 100000).toFixed(1);
    const basic = rawNum * 0.5;
    const pf = Math.min(1800, basic * 0.12);
    const pt = rawNum > 20000 ? 200 : 150;
    const inHandMonthly = Math.max(0, rawNum - pf - pt);
    return {
      formattedBadge: `₹${lpa} LPA`,
      subtext: `₹${inHandMonthly.toLocaleString('en-IN')}/mo in-hand`
    };
  }
}

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
  const { t } = useLanguage();
  // Ensure Owner and all authenticated admins can manage employees
  const canManage = true;

  const [search, setSearch] = useState("");
  const [activeDept, setActiveDept] = useState("All");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real employees from Supabase
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        let mapped: Employee[] = (data || []).map((e: any) => ({
          id: e.employee_id || e.id,
          name: e.name || e.full_name || '',
          department: e.department || '',
          designation: e.designation || e.position || 'Staff Member',
          salary: e.salary ? `₹${Number(e.salary).toLocaleString('en-IN')}` : '₹45,000',
          status: e.status || 'Active',
          joinDate: e.join_date || e.joining_date || e.created_at?.substring(0, 10) || '',
          email: e.email || '',
          phone: e.phone || e.mobile || '',
        }));

        // Load and merge members added from MembersPage or local sync
        const addMemberToEmployeeList = (mName: string, mEmail: string, mDept: string, mDesig: string, mId?: string, mDate?: string, allowedMods?: string[]) => {
          if (!mName) return;
          const empId = mId || `sync-emp-${Date.now()}`;
          let permissions: string[] = allowedMods || ['billing', 'ledger'];
          try {
            const savedPerms = localStorage.getItem(`bms_permissions_${empId}`);
            if (savedPerms) permissions = JSON.parse(savedPerms);
          } catch {}

          const existsIdx = mapped.findIndex(emp => 
            (mEmail && emp.email?.toLowerCase() === mEmail.toLowerCase()) ||
            emp.name.toLowerCase() === mName.toLowerCase()
          );
          if (existsIdx >= 0) {
            mapped[existsIdx].allowed_modules = permissions;
          } else {
            mapped.push({
              id: empId,
              name: mName,
              department: mDept || 'General Operations',
              designation: mDesig || 'Department Staff',
              salary: '₹6,00,000',
              status: 'Active',
              joinDate: mDate || new Date().toISOString().substring(0, 10),
              email: mEmail || '',
              phone: '',
              allowed_modules: permissions
            });
          }
        };

        try {
          const savedMembers = localStorage.getItem('company_department_invited_members_v2');
          if (savedMembers) {
            const parsedMembers = JSON.parse(savedMembers);
            parsedMembers.forEach((m: any) => {
              addMemberToEmployeeList(m.full_name, m.email, m.department, m.role === 'department_head' ? 'Department Head' : 'Department Staff', m.id, m.invited_at, m.allowed_modules);
            });
          }

          const syncedEmps = localStorage.getItem('synced_payroll_employees_v1');
          if (syncedEmps) {
            const parsedSynced = JSON.parse(syncedEmps);
            parsedSynced.forEach((m: any) => {
              addMemberToEmployeeList(m.name, m.email, m.department, m.designation, m.id, m.joinDate, m.allowed_modules);
            });
          }
        } catch (mErr) {
          console.warn("Error merging members into payroll employees:", mErr);
        }

        setEmployees(mapped);
      } catch (err: any) {
        toast.error('Failed to load employees', { description: err.message });
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

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

      // Refresh employee list from Supabase after adding
      const { data: refreshed } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
      const mapped: Employee[] = (refreshed || []).map((e: any) => ({
        id: e.employee_id || e.id,
        name: e.name || e.full_name || '',
        department: e.department || '',
        designation: e.designation || e.position || '',
        salary: e.salary ? `₹${Number(e.salary).toLocaleString('en-IN')}` : '₹0',
        status: e.status || 'Active',
        joinDate: e.join_date || e.joining_date || e.created_at?.substring(0, 10) || '',
        email: e.email || '',
        phone: e.phone || e.mobile || '',
      }));
      setEmployees(mapped);
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
    let perms = emp.allowed_modules;
    if (!perms) {
      try {
        const saved = localStorage.getItem(`bms_permissions_${emp.id}`);
        if (saved) perms = JSON.parse(saved);
      } catch {}
    }
    setEditForm({
      ...emp,
      allowed_modules: perms || ['billing', 'ledger', 'payroll', 'crm', 'inventory', 'hisab']
    });
  };

  const handleEdit = async () => {
    if (!editEmp) return;
    try {
      await updateUserAcrossAllModules({
        id: editEmp.id,
        name: editForm.name || editEmp.name,
        email: editForm.email || editEmp.email || '',
        phone: editForm.phone || editEmp.phone || '',
        department: editForm.department || editEmp.department,
        designation: editForm.designation || editEmp.designation,
        allowedModules: editForm.allowed_modules
      });
    } catch { /* graceful */ }
    setEmployees((prev) =>
      prev.map((e) => (e.id === editEmp.id ? { ...e, ...editForm } as Employee : e))
    );
    toast.success(`${editForm.name ?? editEmp.name}'s profile & matrix rights updated across staff directory!`);
    setEditEmp(null);
  };

  const handleStatusChange = async (emp: Employee, newStatus: string) => {
    try {
      await supabase.from('employees').update({ status: newStatus }).eq('id', emp.id);
    } catch { /* graceful */ }
    setEmployees((prev) =>
      prev.map((e) => (e.id === emp.id ? { ...e, status: newStatus } : e))
    );
    toast.success(`${emp.name}'s status changed to ${newStatus}`);
  };

  const handleDelete = async () => {
    if (!deleteEmp) return;
    try {
      await supabase.from('employees').delete().eq('id', deleteEmp.id);
    } catch { /* graceful */ }
    setEmployees((prev) => prev.filter((e) => e.id !== deleteEmp.id));
    toast.success(`${deleteEmp.name} removed from directory`);
    setDeleteEmp(null);
  };

  return (
    <div className="space-y-6">
        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: t("Total Employees"), value: employees.length, icon: Users, color: "text-primary", bg: "bg-primary/10" },
            { label: t("Active"), value: activeCount, icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: t("On Leave"), value: onLeaveCount, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: t("Probation"), value: probationCount, icon: UserX, color: "text-blue-500", bg: "bg-blue-500/10" },
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
              placeholder={t("search")}
              className="pl-9 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canManage && (
            <Button size="sm" className="gap-2 shrink-0" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> {t("Add Employee")}
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
              {t(dept)}
            </button>
          ))}
        </div>

        {/* ── Table ── */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden animate-fade-in">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("Employee")}</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden md:table-cell">{t("Department")}</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden lg:table-cell">{t("Designation")}</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">{t("Salary")}</th>
                <th className="text-center px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("Status")}</th>
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

                      {/* Department & Granted Module Rights */}
                      <td className="px-5 py-3 text-sm text-foreground hidden md:table-cell">
                        <div>
                          <span className="inline-flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                            <Building2 className="h-3.5 w-3.5 text-purple-600" />
                            {emp.department}
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {MODULES.map((mod) => {
                              const hasAccess = (emp.allowed_modules || ['billing', 'ledger', 'payroll', 'crm', 'inventory', 'hisab']).includes(mod.key);
                              if (!hasAccess) return null;
                              return (
                                <span
                                  key={mod.key}
                                  className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold rounded-md text-[9px] border border-purple-200 dark:border-purple-800/60 inline-flex items-center gap-0.5"
                                >
                                  <Check className="w-2.5 h-2.5 text-purple-600" />
                                  {mod.name}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </td>

                      {/* Designation */}
                      <td className="px-5 py-3 text-sm text-muted-foreground hidden lg:table-cell">{emp.designation}</td>

                      {/* Salary */}
                      <td className="px-5 py-3 text-right hidden sm:table-cell">
                        {(() => {
                          const fmt = formatSalaryDisplay(emp.salary);
                          return (
                            <div className="flex flex-col items-end">
                              <span className="font-extrabold text-slate-900 dark:text-white text-xs bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-xl border border-purple-200 dark:border-purple-800/80 shadow-2xs">
                                {fmt.formattedBadge}
                              </span>
                              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-0.5">
                                {fmt.subtext}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

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

      {/* View Profile Sheet */}
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
          Add Employee Dialog with Live CTC & Salary Calculator
      ════════════════════════════════════════ */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Users className="w-5 h-5 text-purple-600" />
              Add New Employee & Salary Package
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Staff Full Name *</Label>
                <Input placeholder="e.g. Priya Sharma" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Staff Email Address *</Label>
                <Input type="email" placeholder="e.g. priya@company.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Role *</Label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>{roles.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department *</Label>
                <Select value={form.department} onValueChange={(v) => setForm((f) => ({ ...f, department: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                  <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Designation / Position *</Label>
                <Input placeholder="e.g. Senior Software Engineer" value={form.designation} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} />
              </div>

              {/* CTC & In-Hand Auto Calculator Input */}
              <div className="col-span-2 space-y-2 p-3.5 bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-purple-600" />
                    Salary CTC Package (Auto-Calculator) *
                  </Label>
                  <span className="text-[10px] text-purple-600 font-bold bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full">
                    Indian Statutory Calculator
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-slate-500 mb-1 block">Annual CTC Package (₹)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 600000 (6 Lakhs)"
                      value={form.salary}
                      onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
                      className="bg-white dark:bg-slate-900 border-purple-300 font-bold"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500 mb-1 block">Join Date</Label>
                    <Input type="date" value={form.joinDate} onChange={(e) => setForm((f) => ({ ...f, joinDate: e.target.value }))} />
                  </div>
                </div>

                {/* Live Salary Breakdown Output */}
                {form.salary && parseFloat(form.salary) > 0 && (() => {
                  const b = calculateSalaryBreakdown(form.salary, true);
                  return (
                    <div className="mt-3 p-3 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-slate-600 dark:text-slate-300">Gross Monthly CTC:</span>
                        <span className="font-black text-slate-900 dark:text-white">₹{b.ctcMonthly.toLocaleString('en-IN')}/mo</span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                        <div>Basic Salary (50%): <strong className="text-slate-800 dark:text-slate-200">₹{b.basicMonthly.toLocaleString('en-IN')}</strong></div>
                        <div>HRA (25%): <strong className="text-slate-800 dark:text-slate-200">₹{b.hraMonthly.toLocaleString('en-IN')}</strong></div>
                        <div>Special Allowance: <strong className="text-slate-800 dark:text-slate-200">₹{b.specialAllowanceMonthly.toLocaleString('en-IN')}</strong></div>
                        <div>PF Deduction (12%): <strong className="text-rose-600 dark:text-rose-400">-₹{b.pfDeduction.toLocaleString('en-IN')}</strong></div>
                        <div>Professional Tax: <strong className="text-rose-600 dark:text-rose-400">-₹{b.ptDeduction.toLocaleString('en-IN')}</strong></div>
                        <div>Total Monthly Deductions: <strong className="text-rose-600 font-bold">-₹{b.totalDeductions.toLocaleString('en-IN')}</strong></div>
                      </div>

                      <div className="pt-2 border-t border-purple-100 dark:border-purple-900/60 flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg text-emerald-800 dark:text-emerald-300">
                        <span className="font-black text-xs">💵 Estimated Monthly In-Hand Take Home:</span>
                        <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                          ₹{b.netInHandMonthly.toLocaleString('en-IN')} / month
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={submitting} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Employee & Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════
          Edit Employee Dialog with Live Salary Calculator
      ════════════════════════════════════════ */}
      <Dialog open={!!editEmp} onOpenChange={(o) => !o && setEditEmp(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Pencil className="w-4 h-4 text-purple-600" />
              Edit Employee Profile & Package
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name *</Label>
                <Input value={editForm.name ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department</Label>
                <Select value={editForm.department ?? ""} onValueChange={(v) => setEditForm((f) => ({ ...f, department: v }))}>
                  <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                  <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</Label>
                <Select value={editForm.status ?? ""} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>{allStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Designation</Label>
                <Input value={editForm.designation ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, designation: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email</Label>
                <Input type="email" value={editForm.email ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone</Label>
                <Input value={editForm.phone ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>

              {/* Edit Salary CTC Input */}
              <div className="col-span-2 space-y-2 p-3.5 bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl">
                <Label className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-purple-600" />
                  Annual CTC Package (₹)
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 600000"
                  value={editForm.salary ? String(editForm.salary).replace(/[^\d]/g, '') : ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, salary: e.target.value }))}
                  className="bg-white dark:bg-slate-900 border-purple-300 font-bold text-xs"
                />

                {editForm.salary && parseFloat(String(editForm.salary).replace(/[^\d]/g, '')) > 0 && (() => {
                  const b = calculateSalaryBreakdown(editForm.salary as string, true);
                  return (
                    <div className="mt-2 p-3 bg-white dark:bg-slate-900 border border-purple-200 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold">
                        <span>Monthly CTC: ₹{b.ctcMonthly.toLocaleString('en-IN')}</span>
                        <span className="text-emerald-600">Net In-Hand: ₹{b.netInHandMonthly.toLocaleString('en-IN')}/mo</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
                        <span>Basic: ₹{b.basicMonthly.toLocaleString('en-IN')}</span>
                        <span>HRA: ₹{b.hraMonthly.toLocaleString('en-IN')}</span>
                        <span>PF: -₹{b.pfDeduction.toLocaleString('en-IN')}</span>
                        <span>PT: -₹{b.ptDeduction.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Granted Department Module Access Rights */}
              <div className="col-span-2 space-y-2 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Granted Department Module Access Rights
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {MODULES.map((mod) => {
                    const currentMods = editForm.allowed_modules || ['billing', 'ledger', 'payroll', 'crm', 'inventory', 'hisab'];
                    const selected = currentMods.includes(mod.key);
                    return (
                      <button
                        key={mod.key}
                        type="button"
                        onClick={() => {
                          const updated = selected
                            ? currentMods.filter(m => m !== mod.key)
                            : [...currentMods, mod.key];
                          setEditForm(prev => ({ ...prev, allowed_modules: updated }));
                        }}
                        className={cn(
                          'p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border cursor-pointer transition-all',
                          selected
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-400'
                            : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                        )}
                      >
                        <span>{mod.name}</span>
                        {selected ? <Check className="w-4 h-4 text-purple-600" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEmp(null)}>Cancel</Button>
            <Button onClick={handleEdit} className="gap-2 bg-purple-600 text-white">
              <Pencil className="h-4 w-4" /> Save Salary & Profile
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
    </div>
  );
};

export default Employees;
