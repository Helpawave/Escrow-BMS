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
import { Key, Eye, EyeOff } from "lucide-react";
import { StaffMember } from "../types";

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetStaff: StaffMember | null;
  newStaffPassword: string;
  setNewStaffPassword: (password: string) => void;
  showNewPassword: boolean;
  setShowNewPassword: (show: boolean) => void;
  onGenerateRandomPassword: () => void;
  onSaveNewPassword: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const PasswordResetDialog: React.FC<PasswordResetDialogProps> = ({
  open,
  onOpenChange,
  targetStaff,
  newStaffPassword,
  setNewStaffPassword,
  showNewPassword,
  setShowNewPassword,
  onGenerateRandomPassword,
  onSaveNewPassword,
  isSubmitting,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" /> Reset Staff Password
          </DialogTitle>
          <DialogDescription className="text-xs">
            Assign a new login password for {targetStaff?.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSaveNewPassword} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">New Password</Label>
              <button
                type="button"
                onClick={onGenerateRandomPassword}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                Generate Strong
              </button>
            </div>
            <div className="relative">
              <Input 
                type={showNewPassword ? "text" : "password"}
                placeholder="Minimum 8 characters (e.g. Staff@1234)" 
                value={newStaffPassword}
                onChange={(e) => setNewStaffPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="h-9 text-xs pr-9"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="font-semibold">
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

