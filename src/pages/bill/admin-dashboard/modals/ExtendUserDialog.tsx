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
import { Clock, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ExtendUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extendUserEmail: string;
  extensionDays: string;
  setExtensionDays: (val: string) => void;
  isExtending: boolean;
  onExtendPlan: () => Promise<void> | void;
}

export const ExtendUserDialog: React.FC<ExtendUserDialogProps> = ({
  open,
  onOpenChange,
  extendUserEmail,
  extensionDays,
  setExtensionDays,
  isExtending,
  onExtendPlan,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
            <Clock className="w-6 h-6 text-emerald-600" />
            Extend Access Plan
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Adding free operational time for <span className="font-extrabold text-emerald-600">{extendUserEmail}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-8 space-y-6">
          <div className="space-y-4">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Quick Selection</Label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: '-30d', value: "-30", color: "text-rose-600 hover:bg-rose-50" },
                { label: '-7d', value: "-7", color: "text-rose-500 hover:bg-rose-50" },
                { label: '+7d', value: "7", color: "text-emerald-600 hover:bg-emerald-50" },
                { label: '+30d', value: "30", color: "text-emerald-600 hover:bg-emerald-50" },
                { label: '+1y', value: "365", color: "text-emerald-700 hover:bg-emerald-50" }
              ].map((preset) => (
                <Button
                  key={preset.value}
                  variant={extensionDays === preset.value ? "default" : "outline"}
                  className={`rounded-xl h-10 text-[10px] px-1 font-black ${extensionDays === preset.value ? (parseInt(preset.value) < 0 ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500') : preset.color}`}
                  onClick={() => setExtensionDays(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-days" className="text-xs font-black uppercase tracking-widest text-slate-400">Custom Duration (Days)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="custom-days"
                type="number"
                value={extensionDays}
                onChange={(e) => setExtensionDays(e.target.value)}
                className="pl-10 h-12 rounded-xl font-bold border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                placeholder="Enter days..."
              />
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex gap-3 items-center ${parseInt(extensionDays) < 0 ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${parseInt(extensionDays) < 0 ? 'bg-rose-100 dark:bg-rose-800/30' : 'bg-emerald-100 dark:bg-emerald-800/30'}`}>
              {parseInt(extensionDays) < 0 ? <AlertTriangle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className={`text-[11px] font-bold leading-tight ${parseInt(extensionDays) < 0 ? 'text-rose-800 dark:text-rose-400' : 'text-emerald-800 dark:text-emerald-400'}`}>
              This will {parseInt(extensionDays) < 0 ? 'reduce' : 'extend'} their access by {Math.abs(parseInt(extensionDays))} days.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold h-12">Cancel</Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isExtending || !extensionDays}
                className="rounded-xl font-bold h-12 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 px-8 transition-all hover:scale-[1.02]"
              >
                {isExtending ? 'Updating Access...' : 'Commit Change'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-bold text-2xl">Verify Infrastructure Change?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                  Are you sure you want to <span className="font-bold text-slate-900 dark:text-white">{parseInt(extensionDays) >= 0 ? 'EXTEND' : 'REDUCE'}</span> the access period for <span className="font-bold text-slate-900">{extendUserEmail}</span> by <span className="font-bold text-blue-600">{Math.abs(parseInt(extensionDays))} days</span>?
                  This modification will be applied to the global ledger.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl font-bold border-none bg-slate-100">Abort Change</AlertDialogCancel>
                <AlertDialogAction onClick={onExtendPlan} className="rounded-xl font-bold bg-slate-900 text-white">
                  Confirm & Execute
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

