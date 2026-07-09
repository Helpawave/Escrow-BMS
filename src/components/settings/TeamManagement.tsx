import { useState } from "react";
import { UserPlus, Users, Mail, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type Role = "admin" | "hr_manager" | "manager" | "employee";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "invited";
  addedAt: string;
};

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  hr_manager: "HR Manager",
  manager: "Manager",
  employee: "Employee",
};

const roleColors: Record<Role, string> = {
  admin: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  hr_manager: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  manager: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  employee: "bg-muted text-muted-foreground border-border",
};

const initialMembers: TeamMember[] = [
  { id: "1", name: "Super Admin", email: "admin@escoroll.io", role: "admin", status: "active", addedAt: "2025-01-01" },
];

export function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);

  const [form, setForm] = useState({ name: "", email: "", role: "" as string });

  const handleAdd = () => {
    if (!form.name.trim() || !form.email.trim() || !form.role) {
      toast.error("All fields are required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (members.some((m) => m.email.toLowerCase() === form.email.toLowerCase())) {
      toast.error("A user with this email already exists");
      return;
    }

    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role as Role,
      status: "invited",
      addedAt: new Date().toISOString().split("T")[0],
    };

    setMembers((prev) => [...prev, newMember]);
    setForm({ name: "", email: "", role: "" });
    setDialogOpen(false);
    toast.success(`${newMember.name} added as ${roleLabels[newMember.role]}`);
  };

  const handleRoleChange = (memberId: string, newRole: Role) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
    const member = members.find((m) => m.id === memberId);
    toast.success(`${member?.name}'s role updated to ${roleLabels[newRole]}`);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setMembers((prev) => prev.filter((m) => m.id !== deleteTarget.id));
    toast.success(`${deleteTarget.name} has been removed`);
    setDeleteTarget(null);
  };

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      roleLabels[m.role].toLowerCase().includes(search.toLowerCase())
  );

  const roleCounts = members.reduce(
    (acc, m) => {
      acc[m.role] = (acc[m.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <section className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold tracking-tight">Team Management</h2>
          <Badge variant="secondary" className="text-[10px]">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Full Name
                </label>
                <Input
                  placeholder="e.g. Rahul Sharma"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="e.g. rahul@company.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Assign Role
                </label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="hr_manager">HR Manager</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} className="w-full gap-2">
                <Mail className="h-4 w-4" />
                Send Invite & Add
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role summary chips */}
      <div className="px-6 pt-4 flex flex-wrap gap-2">
        {(Object.entries(roleLabels) as [Role, string][]).map(([key, label]) => (
          <div
            key={key}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${roleColors[key]}`}
          >
            {label}
            <span className="font-bold">{roleCounts[key] || 0}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="px-6 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background h-9 text-sm"
          />
        </div>
      </div>

      {/* Members list */}
      <div className="p-6 space-y-1">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No members found</p>
        ) : (
          filtered.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between py-3 px-3 rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    {member.status === "invited" && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                        Invited
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Select
                  value={member.role}
                  onValueChange={(v) => handleRoleChange(member.id, v as Role)}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="hr_manager">HR Manager</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(member)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke their access. They will need to be re-invited to regain access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
