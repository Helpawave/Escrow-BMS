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
import { CheckCircle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserData } from '@/types/admin';

interface ToggleBlockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToToggleBlock: UserData | null;
  onToggleBlockUser: (userId: string) => Promise<void> | void;
}

export const ToggleBlockUserDialog: React.FC<ToggleBlockUserDialogProps> = ({
  open,
  onOpenChange,
  userToToggleBlock,
  onToggleBlockUser,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-bold text-2xl flex items-center gap-2">
            {userToToggleBlock?.is_blocked ? (
              <>
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                <span>Unblock User Account?</span>
              </>
            ) : (
              <>
                <Shield className="w-6 h-6 text-rose-600" />
                <span>Block User Account?</span>
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600 dark:text-slate-400 pt-2">
            {userToToggleBlock?.is_blocked
              ? `Restoring dashboard access for ${userToToggleBlock.company_name || userToToggleBlock.email}. They will be able to log in immediately.`
              : `Temporarily suspending access for ${userToToggleBlock?.company_name || userToToggleBlock?.email}. They will be logged out and cannot sign in until unblocked.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (userToToggleBlock) {
                onToggleBlockUser(userToToggleBlock.user_id);
                onOpenChange(false);
              }
            }}
            className={cn(
              "rounded-xl font-bold",
              userToToggleBlock?.is_blocked
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            )}
          >
            {userToToggleBlock?.is_blocked ? 'Confirm Unblock' : 'Restrict Access'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

