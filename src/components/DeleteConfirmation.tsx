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
import { AlertCircle } from "lucide-react";

interface DeleteConfirmationProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
}

export const DeleteConfirmation = ({
    isOpen,
    onOpenChange,
    onConfirm,
    title,
    description
}: DeleteConfirmationProps) => {
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-[400px] p-0 overflow-hidden rounded-lg border shadow-xl">
                <div className="p-4 md:p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>

                    <AlertDialogTitle className="text-xl font-bold mb-2">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground text-sm">
                        {description}
                    </AlertDialogDescription>
                </div>

                <AlertDialogFooter className="p-4 md:p-6 bg-muted/50 flex flex-row gap-3 sm:justify-center border-t">
                    <AlertDialogCancel className="flex-1 h-10 rounded-md font-medium m-0">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="flex-1 h-10 rounded-md bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium shadow-sm transition-all"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
