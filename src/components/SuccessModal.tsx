import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    message: string;
}

export const SuccessModal = ({ isOpen, onOpenChange, title, message }: SuccessModalProps) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onOpenChange(false);
            }, 1000); // 1-second auto-dismissal as requested
            return () => clearTimeout(timer);
        }
    }, [isOpen, onOpenChange]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background text-center animate-in fade-in zoom-in duration-300">
                <div className="p-5 md:p-10 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/5 rotate-3">
                        <Check className="w-10 h-10 text-emerald-500" strokeWidth={3} />
                    </div>

                    <DialogTitle className="text-3xl font-black tracking-tight mb-3 text-foreground">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground font-medium text-base px-2">
                        {message}
                    </DialogDescription>
                </div>

                <div className="p-4 md:p-8 pt-0 flex justify-center">
                    <Button
                        onClick={() => onOpenChange(false)}
                        className="w-full h-14 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98]"
                    >
                        Great, Thanks!
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
