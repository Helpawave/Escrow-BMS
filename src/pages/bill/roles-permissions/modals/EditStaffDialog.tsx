import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car } from "lucide-react";
import { StaffMember, PermissionDefinition } from "../types";

interface EditStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingStaff: StaffMember | null;
  fullName: string;
  setFullName: (name: string) => void;
  email: string;
  phone: string;
  setPhone: (phone: string) => void;
  selectedRole: string;
  onRolePresetChange: (role: string) => void;
  selectedPermissions: string[];
  visiblePermissions: PermissionDefinition[];
  onTogglePermission: (permId: string) => void;
  onSaveEdit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const EditStaffDialog: React.FC<EditStaffDialogProps> = ({
  open,
  onOpenChange,
  editingStaff,
  fullName,
  setFullName,
  email,
  phone,
  setPhone,
  selectedRole,
  onRolePresetChange,
  selectedPermissions,
  visiblePermissions,
  onTogglePermission,
  onSaveEdit,
  isSubmitting,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Edit Staff Member</DialogTitle>
          <DialogDescription className="text-xs">
            Update assigned role and authorized modules for {editingStaff?.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSaveEdit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Full Name</Label>
              <Input 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Login Email</Label>
              <Input 
                value={email}
                disabled
                className="h-9 text-xs bg-muted text-muted-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Contact Number</Label>
            <Input 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Role Preset</Label>
            <Select value={selectedRole} onValueChange={onRolePresetChange}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Accountant">Accountant</SelectItem>
                <SelectItem value="Sales Executive">Sales Executive</SelectItem>
                <SelectItem value="Inventory Manager">Inventory Manager</SelectItem>
                <SelectItem value="Billing Operator">Billing Operator</SelectItem>
                <SelectItem value="Custom">Custom Role</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Module Authorization
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {selectedPermissions.length} / {visiblePermissions.length} Enabled
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {visiblePermissions.map((perm) => {
                const isChecked = selectedPermissions.includes(perm.id);
                return (
                  <div 
                    key={perm.id}
                    onClick={() => onTogglePermission(perm.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                      isChecked 
                        ? 'border-primary/50 bg-primary/5 dark:bg-primary/10' 
                        : 'border-border/60 hover:bg-muted/40'
                    }`}
                  >
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      tabIndex={-1}
                      className="pointer-events-none mt-0.5 rounded text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-semibold leading-none">{perm.label}</p>
                        {perm.autoOnly && (
                          <Badge variant="outline" className="text-[8px] px-1 py-0 bg-amber-50 text-amber-800 border-amber-300 font-bold">
                            <Car className="w-2.5 h-2.5 mr-0.5 inline" /> Auto
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{perm.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="font-semibold">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

