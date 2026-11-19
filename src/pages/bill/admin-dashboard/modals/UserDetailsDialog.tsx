import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { safelyToLocaleDate, safelyFormatDate } from "@/utils/dateUtils";
import { generateAccountId } from "@/utils/accountId";
import { getSubscriptionCountdown } from '../utils';
import { UserData, UserType } from '@/types/admin';
import {
  Copy,
  Mail,
  Calendar,
  Phone,
  Activity,
  FileText,
  Users,
  ShieldCheck,
  Lock,
  Clock,
  CreditCard
} from 'lucide-react';

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: UserData | null;
  selectedUserSetting?: { user_type?: UserType } | null;
  onRequestUserTypeChange: (user: UserData, type: UserType) => void;
  onOpenChangePlanModal: (user: UserData) => void;
}

export const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  open,
  onOpenChange,
  selectedUser,
  selectedUserSetting,
  onRequestUserTypeChange,
  onOpenChangePlanModal,
}) => {
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Account Analysis</DialogTitle>
          <DialogDescription>Infrastructure and activity overview for this entity</DialogDescription>
        </DialogHeader>
        {selectedUser && (
          <div className="py-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Business Name</p>
                  <p className="font-bold text-xl leading-tight truncate">{selectedUser.company_name || 'Individual Profile'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">7-Digit Account ID</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-black text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                      #{generateAccountId(selectedUser.user_id)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Copy Account ID"
                      className="h-6 w-6 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(generateAccountId(selectedUser.user_id));
                        toast({ title: "Copied", description: "Account ID copied to clipboard" });
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">System UUID</p>
                  <div className="flex items-center gap-2 max-w-full">
                    <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono text-slate-600 break-all">{selectedUser.user_id}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Copy User UUID"
                      className="h-6 w-6 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedUser.user_id);
                        toast({ title: "Copied", description: "UID copied to clipboard" });
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Registered Email</p>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Mail className="w-4 h-4 opacity-50 shrink-0" />
                    <p className="text-sm font-bold truncate break-all">{selectedUser.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date of Entry</p>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Calendar className="w-4 h-4 opacity-50" />
                    <p className="text-sm font-bold">{safelyFormatDate(selectedUser.created_at, 'PPpp')}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mobile Number</p>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Phone className="w-4 h-4 opacity-50" />
                    <p className="text-sm font-bold">{selectedUser.mobile || 'Not provided'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Business / User Type</p>
                  <Select
                    value={selectedUserSetting?.user_type || selectedUser.user_type || 'normal'}
                    onValueChange={(val) => onRequestUserTypeChange(selectedUser, val as UserType)}
                  >
                    <SelectTrigger className="h-9 px-3 rounded-xl border text-xs font-bold w-full max-w-[220px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start" className="rounded-xl">
                      <SelectItem value="normal">🏪 Retail Business</SelectItem>
                      <SelectItem value="automobile">🚗 Automobile / Downpayment</SelectItem>
                      <SelectItem value="food_kitchen">🍳 Food / Cloud Kitchen</SelectItem>
                      <SelectItem value="cafe">☕ Cafe / Coffee Shop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pb-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Account Activity</p>
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Activity className="w-3.5 h-3.5" />
                  <p className="text-xs font-bold">
                    {selectedUser.last_sign_in_at ? safelyFormatDate(selectedUser.last_sign_in_at, 'PPpp') : 'Never'}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Invoice Generated</p>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <FileText className="w-3.5 h-3.5" />
                  <p className="text-xs font-bold">
                    {safelyFormatDate(selectedUser.last_invoice_created_at, 'PPpp', 'No invoices created yet')}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30 flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Invoices</p>
                <p className="text-2xl font-black text-blue-700 dark:text-blue-400">{selectedUser.invoice_count || 0}</p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100/50 dark:border-purple-800/30 flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center mb-2">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Total Clients</p>
                <p className="text-2xl font-black text-purple-700 dark:text-purple-400">{selectedUser.client_count || 0}</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-800/30 flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Profile Health</p>
                <p className={`text-sm font-black ${selectedUser.is_blocked ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-400'}`}>
                  {selectedUser.is_blocked ? 'SUSPENDED' : 'OPTIMAL'}
                </p>
              </div>
            </div>

            <div className="p-4 md:p-6 rounded-[24px] bg-slate-900 dark:bg-slate-950 text-white relative overflow-hidden group shadow-xl transition-all">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                      <Lock className="w-3 h-3 text-primary" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Subscription Protocol</p>
                  </div>
                  {selectedUser.subscription_expires_at && (
                    <div className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                      Verified Tier
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-2xl font-black tracking-tight">
                    {(() => {
                      if (!selectedUser.subscription_expires_at) {
                        return `Free Plan (${selectedUser.plan_type ? (selectedUser.plan_type.charAt(0).toUpperCase() + selectedUser.plan_type.slice(1)) : 'Monthly'})`;
                      }
                      const isExpired = new Date(selectedUser.subscription_expires_at).getTime() < Date.now();
                      return isExpired ? 'Expired Subscription' : 'Paid Plan';
                    })()}
                  </p>
                  <p className="text-xs text-slate-400 font-medium italic">
                    {selectedUser.subscription_expires_at
                      ? `Valid through ${safelyToLocaleDate(selectedUser.subscription_expires_at)}`
                      : "No active plan detected (grant access from Extend Plan)"}
                  </p>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-4 h-4 text-primary animate-spin-slow" />
                    <p className="text-xs font-bold text-slate-300">Countdown to Inactivation:</p>
                  </div>
                  <p className="text-xl font-black text-primary font-mono tabular-nums leading-none">
                    {getSubscriptionCountdown(selectedUser.subscription_expires_at)}
                  </p>
                </div>
              </div>

              {/* Abstract decoration */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl transition-all group-hover:scale-150" />
              <div className="absolute -top-10 -left-10 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl transition-all group-hover:scale-150" />
            </div>
          </div>
        )}
        <DialogFooter>
          {selectedUser && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const u = selectedUser;
                onOpenChange(false);
                onOpenChangePlanModal(u);
              }}
              className="rounded-xl font-bold gap-2 text-xs border-primary/40 hover:bg-primary/10 text-primary"
            >
              <CreditCard className="w-4 h-4" />
              Change Payment Plan
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)} className="rounded-xl font-bold bg-slate-900 text-white">Close Analysis</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

