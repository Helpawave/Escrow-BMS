import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resetPasswordEmail: string;
  newPassword: string;
  setNewPassword: (val: string) => void;
  loading: boolean;
  onResetPassword: () => Promise<void> | void;
}

export const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  open,
  onOpenChange,
  resetPasswordEmail,
  newPassword,
  setNewPassword,
  loading,
  onResetPassword,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Force Credential Reset</DialogTitle>
          <DialogDescription>
            Assigning a temporary passkey for <span className="font-bold text-slate-900 dark:text-white">{resetPasswordEmail}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <Label htmlFor="new-password">New Security Password</Label>
          <Input
            id="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="e.g. TempPass123!"
            type="text"
            className="mt-2 rounded-xl h-11"
          />
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">The user should change this immediately upon logging in.</p>
        </div>
        <DialogFooter className="sm:justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">
            Abort
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" disabled={!newPassword || loading} className="rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white">
                {loading ? 'Processing...' : 'Overwrite Password'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-bold text-2xl">Confirm Password Override?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                  This will forcibly change the login credentials for <span className="font-bold text-slate-900">{resetPasswordEmail}</span>.
                  The user will be required to log in with the new password.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl font-bold">Abort</AlertDialogCancel>
                <AlertDialogAction onClick={onResetPassword} className="rounded-xl font-bold bg-blue-600 text-white">
                  Execute Override
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

