import { Shield, Users, ChevronRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";

type Permission = {
  key: string;
  label: string;
  description: string;
};

type PermissionGroup = {
  group: string;
  permissions: Permission[];
};

const permissionGroups: PermissionGroup[] = [
  {
    group: "Employee Management",
    permissions: [
      { key: "emp_view", label: "View Employees", description: "View employee directory and profiles" },
      { key: "emp_create", label: "Add Employees", description: "Onboard new employees" },
      { key: "emp_edit", label: "Edit Employees", description: "Modify employee details" },
      { key: "emp_delete", label: "Remove Employees", description: "Offboard or delete employee records" },
    ],
  },
  {
    group: "Payroll",
    permissions: [
      { key: "pay_view", label: "View Payroll", description: "View payroll runs and summaries" },
      { key: "pay_run", label: "Run Payroll", description: "Create and process payroll" },
      { key: "pay_approve", label: "Approve Payroll", description: "Lock and approve payroll for disbursement" },
      { key: "pay_export", label: "Export Payroll", description: "Download payroll reports" },
    ],
  },
  {
    group: "Leave & Attendance",
    permissions: [
      { key: "leave_view", label: "View Leave", description: "View leave requests and balances" },
      { key: "leave_approve", label: "Approve Leave", description: "Approve or reject leave requests" },
      { key: "att_view", label: "View Attendance", description: "View attendance logs" },
      { key: "att_manage", label: "Manage Attendance", description: "Edit attendance records" },
    ],
  },
  {
    group: "Reports & Audit",
    permissions: [
      { key: "report_view", label: "View Reports", description: "Access analytics and reports" },
      { key: "report_export", label: "Export Reports", description: "Download reports as CSV/PDF" },
      { key: "audit_view", label: "View Audit Log", description: "Access system audit trail" },
    ],
  },
  {
    group: "System",
    permissions: [
      { key: "settings_view", label: "View Settings", description: "View system configuration" },
      { key: "settings_edit", label: "Edit Settings", description: "Modify system settings" },
      { key: "roles_manage", label: "Manage Roles", description: "Configure roles and permissions" },
    ],
  },
];

const allPermissionKeys = permissionGroups.flatMap((g) => g.permissions.map((p) => p.key));

type RoleConfig = {
  label: string;
  description: string;
  color: string;
  permissions: Set<string>;
};

const defaultRoles: Record<string, RoleConfig> = {
  super_admin: {
    label: "Super Admin",
    description: "Full system access with no restrictions",
    color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    permissions: new Set(allPermissionKeys),
  },
  admin: {
    label: "Admin",
    description: "System administration excluding role management",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    permissions: new Set(allPermissionKeys.filter((k) => k !== "roles_manage")),
  },
  hr_manager: {
    label: "HR Manager",
    description: "Employee, leave, attendance, and payroll management",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    permissions: new Set([
      "emp_view", "emp_create", "emp_edit", "emp_delete",
      "pay_view", "pay_run", "pay_export",
      "leave_view", "leave_approve", "att_view", "att_manage",
      "report_view", "report_export", "settings_view",
    ]),
  },
  manager: {
    label: "Manager",
    description: "Team oversight with limited administrative access",
    color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    permissions: new Set([
      "emp_view", "pay_view", "leave_view", "leave_approve",
      "att_view", "report_view",
    ]),
  },
  employee: {
    label: "Employee",
    description: "Self-service access to personal records only",
    color: "bg-muted text-muted-foreground border-border",
    permissions: new Set(["emp_view", "pay_view", "leave_view", "att_view"]),
  },
};

export function RolesPermissions() {
  const [roles, setRoles] = useState<Record<string, RoleConfig>>(defaultRoles);
  const [editingRole, setEditingRole] = useState<string | null>(null);

  const togglePermission = (roleKey: string, permKey: string) => {
    if (roleKey === "super_admin") {
      toast.error("Super Admin permissions cannot be modified");
      return;
    }
    setRoles((prev) => {
      const role = prev[roleKey];
      const newPerms = new Set(role.permissions);
      if (newPerms.has(permKey)) {
        newPerms.delete(permKey);
      } else {
        newPerms.add(permKey);
      }
      return { ...prev, [roleKey]: { ...role, permissions: newPerms } };
    });
  };

  const toggleGroupAll = (roleKey: string, group: PermissionGroup, enable: boolean) => {
    if (roleKey === "super_admin") {
      toast.error("Super Admin permissions cannot be modified");
      return;
    }
    setRoles((prev) => {
      const role = prev[roleKey];
      const newPerms = new Set(role.permissions);
      group.permissions.forEach((p) => {
        if (enable) newPerms.add(p.key);
        else newPerms.delete(p.key);
      });
      return { ...prev, [roleKey]: { ...role, permissions: newPerms } };
    });
  };

  const handleSave = () => {
    toast.success(`Permissions for ${roles[editingRole!].label} updated`);
    setEditingRole(null);
  };

  const currentRole = editingRole ? roles[editingRole] : null;

  return (
    <section className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold tracking-tight">Roles & Permissions</h2>
        <span className="ml-auto text-xs text-muted-foreground">{Object.keys(roles).length} roles</span>
      </div>
      <div className="p-6 space-y-1">
        {Object.entries(roles).map(([key, role]) => (
          <div
            key={key}
            className="flex items-center justify-between py-3 px-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group"
            onClick={() => setEditingRole(key)}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{role.label}</p>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${role.color}`}>
                    {role.permissions.size}/{allPermissionKeys.length}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{role.description}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configure — {currentRole?.label}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{currentRole?.description}</p>
          </DialogHeader>

          <div className="space-y-6 mt-2">
            {permissionGroups.map((group) => {
              const allEnabled = group.permissions.every((p) => currentRole?.permissions.has(p.key));
              const someEnabled = group.permissions.some((p) => currentRole?.permissions.has(p.key));

              return (
                <div key={group.group} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {group.group}
                    </h3>
                    {editingRole !== "super_admin" && (
                      <button
                        onClick={() => toggleGroupAll(editingRole!, group, !allEnabled)}
                        className="text-[10px] font-medium text-primary hover:underline"
                      >
                        {allEnabled ? "Revoke All" : "Grant All"}
                      </button>
                    )}
                  </div>
                  <div className="rounded-md border divide-y">
                    {group.permissions.map((perm) => {
                      const enabled = currentRole?.permissions.has(perm.key) ?? false;
                      return (
                        <div key={perm.key} className="flex items-center justify-between px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center ${enabled ? "bg-primary/10" : "bg-muted"}`}>
                              {enabled ? (
                                <Check className="h-3 w-3 text-primary" />
                              ) : (
                                <X className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{perm.label}</p>
                              <p className="text-xs text-muted-foreground">{perm.description}</p>
                            </div>
                          </div>
                          <Switch
                            checked={enabled}
                            disabled={editingRole === "super_admin"}
                            onCheckedChange={() => togglePermission(editingRole!, perm.key)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" size="sm" onClick={() => setEditingRole(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save Permissions
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
