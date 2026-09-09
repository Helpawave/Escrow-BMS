import { useNavigate } from "react-router-dom";
import { Building2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";

interface CompleteProfileModalProps {
  open?: boolean;
  featureName?: string;
}

export function CompleteProfileModal({ open, featureName = "creating invoices" }: CompleteProfileModalProps) {
  const { user, profile, isBusinessSetup, isStaff, loading } = useAuth();
  const navigate = useNavigate();

  // If `open` prop is explicitly provided, respect it.
  // Otherwise, display whenever the user is a business owner with an incomplete profile.
  const isOpen = open !== undefined 
    ? open 
    : Boolean(user && !loading && !isStaff && isBusinessSetup === false);

  if (!isOpen) return null;

  const hasName = Boolean(profile?.company_name?.trim() && profile?.company_name !== 'null');
  const hasPhone = Boolean((profile?.phone?.trim() && profile?.phone !== 'null') || (profile?.mobile?.trim() && profile?.mobile !== 'null'));
  const hasAddress = Boolean(profile?.business_address?.trim() && profile?.business_address !== 'null');

  return (
    <Dialog open={isOpen} onOpenChange={() => undefined}>
      <DialogContent
        className="sm:max-w-md rounded-3xl p-6 md:p-8 [&>button]:hidden shadow-2xl border-slate-100 dark:border-slate-800"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 shadow-inner">
            <Building2 className="h-7 w-7" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Complete Your Profile
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
            To start {featureName}, please provide your essential business details for valid invoices and billing records.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-100 dark:border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-600 dark:text-slate-300">Company Name</span>
            {hasName ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Added
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> Required
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-600 dark:text-slate-300">Business Phone</span>
            {hasPhone ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Added
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> Required
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-600 dark:text-slate-300">Business Address</span>
            {hasAddress ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Added
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> Required
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <Button
            onClick={() => navigate('/setup-business')}
            className="h-12 w-full text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/20 group transition-all"
          >
            Complete Profile Now
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="h-11 w-full text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl"
          >
            Back to Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
