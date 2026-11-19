import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { CreditCard, Calendar, RefreshCw, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { safelyFormatDate } from "@/utils/dateUtils";
import { getUserDisplayName, calculateNewExpiresAt } from '../utils';
import { UserData, UserType, UserTypePricingMap, USER_TYPE_LABELS } from '@/types/admin';

interface ChangePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changePlanUser: UserData | null;
  monthlyPrice: number;
  yearlyPrice: number;
  userTypePricing?: UserTypePricingMap;
  userModalMonthlyRate: string;
  setUserModalMonthlyRate: (val: string) => void;
  userModalYearlyRate: string;
  setUserModalYearlyRate: (val: string) => void;
  validityMode: 'from_today' | 'keep' | 'extend' | 'custom';
  setValidityMode: (val: 'from_today' | 'keep' | 'extend' | 'custom') => void;
  selectedPresetDays: string;
  setSelectedPresetDays: (val: string) => void;
  customExpiryDate: string;
  setCustomExpiryDate: (val: string) => void;
  selectedPlanStatus: 'paid' | 'trial' | 'expired';
  setSelectedPlanStatus: (val: 'paid' | 'trial' | 'expired') => void;
  paymentNotes: string;
  setPaymentNotes: (val: string) => void;
  isUpdatingPlan: boolean;
  onSaveUserPlan: () => Promise<void> | void;
}

export const ChangePlanDialog: React.FC<ChangePlanDialogProps> = ({
  open,
  onOpenChange,
  changePlanUser,
  monthlyPrice,
  yearlyPrice,
  userTypePricing,
  userModalMonthlyRate,
  setUserModalMonthlyRate,
  userModalYearlyRate,
  setUserModalYearlyRate,
  validityMode,
  setValidityMode,
  selectedPresetDays,
  setSelectedPresetDays,
  customExpiryDate,
  setCustomExpiryDate,
  selectedPlanStatus,
  setSelectedPlanStatus,
  paymentNotes,
  setPaymentNotes,
  isUpdatingPlan,
  onSaveUserPlan,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg p-0 gap-0 max-h-[88vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Fixed Sticky Header */}
        <div className="bg-primary/5 p-4 sm:p-5 border-b border-border/80 flex items-start gap-3.5 shrink-0 pr-12">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-foreground">
              Change User Payment Plan
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Update billing tier, subscription status, and validity period for this business.
            </DialogDescription>
          </div>
        </div>

        {changePlanUser && (
          <form onSubmit={(e) => { e.preventDefault(); onSaveUserPlan(); }} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Scrollable Content Body */}
            <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1 overscroll-contain">
              {/* User details header pill */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-foreground">{getUserDisplayName(changePlanUser)}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{changePlanUser.email} {changePlanUser.mobile ? `• ${changePlanUser.mobile}` : ''}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Current Tier</span>
                  <p className="font-bold text-primary capitalize">
                    {(() => {
                      const days = changePlanUser.subscription_expires_at
                        ? Math.ceil((new Date(changePlanUser.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        : 0;
                      return (changePlanUser.plan_type === 'yearly' || days > 180) ? 'Yearly Pro' : (changePlanUser.plan_type === 'enterprise' ? 'Enterprise' : 'Monthly Pro');
                    })()}
                  </p>
                </div>
              </div>

              {/* 1. Custom Rates for this User - Separate Monthly & Yearly Cards with their OWN Inputs & Presets (No Selection Needed) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">
                    Custom Pricing Rates for this Business
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Set specific monthly & yearly rates for this user
                  </span>
                </div>

                {(() => {
                  const uType = (changePlanUser?.user_type || 'normal') as UserType;
                  const catRate = userTypePricing?.[uType] || { monthly: monthlyPrice, yearly: yearlyPrice };
                  const catLabel = USER_TYPE_LABELS[uType]?.label || 'Category';

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Monthly Pro Rate Card */}
                      <div className="p-3.5 rounded-2xl border border-blue-500/30 bg-blue-500/5 flex flex-col justify-between space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">📅</span>
                          <div>
                            <h4 className="font-black text-sm text-foreground">Monthly Pro Rate</h4>
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              30-day renewal cycle ({catLabel}: ₹{catRate.monthly}/mo)
                            </span>
                          </div>
                        </div>

                        {/* Monthly Rate Input */}
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-foreground">Monthly Amount (₹)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-xs text-muted-foreground">₹</span>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={userModalMonthlyRate}
                              onChange={(e) => setUserModalMonthlyRate(e.target.value)}
                              placeholder={`e.g. ${catRate.monthly}`}
                              className="pl-7 h-9 text-xs font-bold rounded-xl bg-background border-border"
                            />
                          </div>

                          {/* Monthly Presets */}
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            {[
                              { label: `₹${catRate.monthly} (${catLabel})`, val: String(catRate.monthly) },
                              { label: '₹199', val: '199' },
                              { label: '₹299', val: '299' },
                              { label: '₹499', val: '499' },
                              { label: '₹0 (Free)', val: '0' },
                            ].map(chip => (
                              <button
                                key={chip.val}
                                type="button"
                                onClick={() => setUserModalMonthlyRate(chip.val)}
                                className={cn(
                                  "px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                                  userModalMonthlyRate === chip.val
                                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                    : "bg-background hover:bg-muted text-muted-foreground border-border/70"
                                )}
                              >
                                {chip.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Yearly Pro Rate Card */}
                      <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col justify-between space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">⭐</span>
                          <div>
                            <h4 className="font-black text-sm text-foreground">Yearly Pro Rate</h4>
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              365-day annual cycle ({catLabel}: ₹{catRate.yearly}/yr)
                            </span>
                          </div>
                        </div>

                        {/* Yearly Rate Input */}
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-foreground">Yearly Amount (₹)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-xs text-muted-foreground">₹</span>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={userModalYearlyRate}
                              onChange={(e) => setUserModalYearlyRate(e.target.value)}
                              placeholder={`e.g. ${catRate.yearly}`}
                              className="pl-7 h-9 text-xs font-bold rounded-xl bg-background border-border"
                            />
                          </div>

                          {/* Yearly Presets */}
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            {[
                              { label: `₹${catRate.yearly} (${catLabel})`, val: String(catRate.yearly) },
                              { label: '₹1,999', val: '1999' },
                              { label: '₹2,499', val: '2499' },
                              { label: '₹2,999', val: '2999' },
                              { label: '₹0 (Free)', val: '0' },
                            ].map(chip => (
                              <button
                                key={chip.val}
                                type="button"
                                onClick={() => setUserModalYearlyRate(chip.val)}
                                className={cn(
                                  "px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                                  userModalYearlyRate === chip.val
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                    : "bg-background hover:bg-muted text-muted-foreground border-border/70"
                                )}
                              >
                                {chip.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 2. Validity / Duration Option */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">Validity Duration</Label>
                  <div className="inline-flex rounded-lg border border-border/80 p-0.5 bg-muted/40 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setValidityMode('from_today')}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer",
                        validityMode === 'from_today' ? "bg-background shadow-xs text-primary font-bold" : "text-muted-foreground"
                      )}
                    >
                      From Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setValidityMode('extend')}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer",
                        validityMode === 'extend' ? "bg-background shadow-xs text-primary font-bold" : "text-muted-foreground"
                      )}
                    >
                      + Extend
                    </button>
                    <button
                      type="button"
                      onClick={() => setValidityMode('custom')}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer",
                        validityMode === 'custom' ? "bg-background shadow-xs text-primary font-bold" : "text-muted-foreground"
                      )}
                    >
                      Exact Date
                    </button>
                  </div>
                </div>

                {validityMode !== 'custom' ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { days: '30', label: '30 Days (1 Mo)' },
                      { days: '60', label: '60 Days (2 Mo)' },
                      { days: '90', label: '90 Days (3 Mo)' },
                      { days: '180', label: '180 Days (6 Mo)' },
                      { days: '365', label: '1 Year (365d)' },
                      { days: '730', label: '2 Years (730d)' },
                    ].map((item) => (
                      <button
                        key={item.days}
                        type="button"
                        onClick={() => {
                          if (validityMode === 'keep') {
                            setValidityMode('from_today');
                          }
                          setSelectedPresetDays(item.days);
                        }}
                        className={cn(
                          "py-2 px-2 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer",
                          selectedPresetDays === item.days
                            ? "border-primary bg-primary/10 text-primary shadow-xs font-black"
                            : "border-border/70 hover:border-border text-muted-foreground bg-muted/20"
                        )}
                      >
                        {validityMode === 'extend' ? `+${item.label}` : item.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Input
                      type="date"
                      value={customExpiryDate}
                      onChange={(e) => setCustomExpiryDate(e.target.value)}
                      className="h-10 text-xs font-semibold rounded-xl bg-background border-border"
                      required
                    />
                    <p className="text-[10px] text-muted-foreground">User subscription will remain valid until 23:59 on this date.</p>
                  </div>
                )}
              </div>

              {/* 3. Account Payment Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Account Payment Status</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'paid', label: 'Active & Paid', icon: '✅' },
                    { id: 'trial', label: 'Free Trial', icon: '⏳' },
                    { id: 'expired', label: 'Expired / Lock', icon: '🔒' },
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedPlanStatus(st.id as any)}
                      className={cn(
                        "py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                        selectedPlanStatus === st.id
                          ? st.id === 'paid'
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 shadow-xs"
                            : st.id === 'trial'
                              ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400 shadow-xs"
                              : "bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-400 shadow-xs"
                          : "border-border/70 text-muted-foreground bg-muted/20 hover:bg-muted"
                      )}
                    >
                      <span>{st.icon}</span>
                      <span>{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Payment Note / Reference */}
              <div className="space-y-1">
                <Label htmlFor="plan-payment-notes" className="text-[11px] font-semibold text-muted-foreground">
                  Payment Note / Reference (Optional)
                </Label>
                <Input
                  id="plan-payment-notes"
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid via UPI / Special discount / Cash"
                  className="h-9 text-xs rounded-xl bg-background border-border"
                />
              </div>
            </div>

            {/* 5. Live Summary Preview Box */}
            {(() => {
              const previewDate = calculateNewExpiresAt(
                validityMode,
                selectedPlanStatus,
                selectedPresetDays,
                customExpiryDate,
                changePlanUser.subscription_expires_at
              );
              const previewDays = previewDate ? Math.max(0, Math.ceil((new Date(previewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
              return (
                <div className="p-3.5 rounded-xl border border-primary/25 bg-primary/5 flex items-center justify-between text-xs mx-4 sm:mx-5 mb-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">New Expiry Date</span>
                    <p className="font-extrabold text-foreground text-xs sm:text-sm flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary shrink-0" />
                      <span>
                        {selectedPlanStatus === 'expired'
                          ? 'Expired Immediately'
                          : previewDate
                            ? safelyFormatDate(previewDate)
                            : 'No Expiry Set'}
                      </span>
                      {selectedPlanStatus !== 'expired' && previewDays > 0 && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          ({previewDays}d left)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Configured Rates</span>
                    <p className="font-bold text-xs flex items-center gap-1.5 justify-end">
                      <span className={selectedPlanStatus === 'paid' ? 'text-emerald-600 font-bold' : selectedPlanStatus === 'expired' ? 'text-rose-600 font-bold' : 'text-amber-600 font-bold'}>
                        {selectedPlanStatus === 'paid' ? 'Paid' : selectedPlanStatus === 'expired' ? 'Expired' : 'Trial'}
                      </span>
                      <span>•</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">₹{userModalMonthlyRate}/mo</span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹{userModalYearlyRate}/yr</span>
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Fixed Sticky Footer */}
            <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 shrink-0 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isUpdatingPlan}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isUpdatingPlan}
                className="text-xs font-bold gap-1.5 shadow-sm"
              >
                {isUpdatingPlan ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Save & Apply Plan
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

