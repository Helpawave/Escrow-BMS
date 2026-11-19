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
import { Trash2 } from "lucide-react";
import { StaffMember } from "../types";

interface DeleteStaffAlertProps {
  deleteStaffTarget: StaffMember | null;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export const DeleteStaffAlert: React.FC<DeleteStaffAlertProps> = ({
  deleteStaffTarget,
  onClose,
  onConfirmDelete,
}) => {
  return (
    <AlertDialog open={!!deleteStaffTarget} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Remove Staff Member
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            Are you sure you want to remove <strong className="text-foreground">{deleteStaffTarget?.name}</strong> ({deleteStaffTarget?.email})? They will immediately lose access to company data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold"
          >
            Remove Staff
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

