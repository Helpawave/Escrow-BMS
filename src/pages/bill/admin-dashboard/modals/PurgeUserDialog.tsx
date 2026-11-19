import React from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Trash2 } from 'lucide-react';
import { UserData } from '@/types/admin';

interface PurgeUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToDelete: UserData | null;
  userDeleteCheckbox1: boolean;
  setUserDeleteCheckbox1: (val: boolean) => void;
  userDeleteCheckbox2: boolean;
  setUserDeleteCheckbox2: (val: boolean) => void;
  deleteConfirmText: string;
  setDeleteConfirmText: (val: string) => void;
  onDeleteUser: (userId: string) => Promise<void> | void;
}

export const PurgeUserDialog: React.FC<PurgeUserDialogProps> = ({
  open,
  onOpenChange,
  userToDelete,
  userDeleteCheckbox1,
  setUserDeleteCheckbox1,
  userDeleteCheckbox2,
  setUserDeleteCheckbox2,
  deleteConfirmText,
  setDeleteConfirmText,
  onDeleteUser,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-2xl border-none shadow-2xl bg-background p-0 overflow-hidden">
        <AlertDialogHeader className="p-4 md:p-8 pb-4 border-b bg-rose-50/50">
          <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6 text-rose-600" />
          </div>
          <AlertDialogTitle className="text-2xl font-black tracking-tight text-rose-950">
            Purge User Profile?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-rose-900/70 font-medium pt-2">
            Destroying all data (invoices, clients, business records, products) for <span className="font-bold text-rose-950">{userToDelete?.company_name}</span> ({userToDelete?.email}).
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="p-4 md:p-6 md:p-8 space-y-6">
          <div className="space-y-3">
            <div
              className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
              onClick={() => setUserDeleteCheckbox1(!userDeleteCheckbox1)}
            >
              <Checkbox
                id="user-delete-verify1"
                checked={userDeleteCheckbox1}
                className="rounded-lg border-2"
              />
              <Label htmlFor="user-delete-verify1" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer group-hover:text-foreground">
                I understand this destroys all databases and invoice history.
              </Label>
            </div>

            <div
              className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
              onClick={() => setUserDeleteCheckbox2(!userDeleteCheckbox2)}
            >
              <Checkbox
                id="user-delete-verify2"
                checked={userDeleteCheckbox2}
                className="rounded-lg border-2"
              />
              <Label htmlFor="user-delete-verify2" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer group-hover:text-foreground">
                I acknowledge this operation is permanent and irreversible.
              </Label>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 ml-1">Type &quot;DELETE&quot; to confirm</Label>
              <Input
                placeholder="Type DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="h-12 rounded-md bg-muted/50 border-border text-center font-bold tracking-widest focus-visible:ring-rose-500/20"
              />
            </div>
          </div>
        </div>

        <AlertDialogFooter className="p-4 md:p-8 pt-4 flex flex-col-reverse sm:flex-row gap-3 bg-muted/5 border-t">
          <AlertDialogCancel className="w-full sm:flex-1 h-11 font-bold rounded-xl border-2 m-0 hover:bg-slate-100 transition-all">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              if (deleteConfirmText !== 'DELETE' || !userDeleteCheckbox1 || !userDeleteCheckbox2) {
                e.preventDefault();
                return;
              }
              if (userToDelete) {
                onDeleteUser(userToDelete.user_id);
                onOpenChange(false);
              }
            }}
            disabled={deleteConfirmText !== 'DELETE' || !userDeleteCheckbox1 || !userDeleteCheckbox2}
            className="w-full sm:flex-1 h-11 font-black rounded-xl shadow-lg shadow-rose-500/20 bg-rose-600 hover:bg-rose-700 text-white transition-all disabled:opacity-50"
          >
            Purge User Profile
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

