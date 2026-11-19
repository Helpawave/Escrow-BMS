import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { safelyFormatDate } from "@/utils/dateUtils";
import { getSubscriptionStatus } from '../utils';
import { UserData, UserType, UserTypePricingMap, USER_TYPE_LABELS } from '@/types/admin';
import { PaymentsFilterType } from '../types';
import { Search, CreditCard, RefreshCw, CheckCircle, Tag, SlidersHorizontal } from 'lucide-react';

interface PaymentsTabProps {
  monthlyPrice: number;
  yearlyPrice: number;
  paymentStats: { total: number; monthly: number; yearly: number; trial: number; expired: number };
  editMonthlyPrice: string;
  setEditMonthlyPrice: (val: string) => void;
  editYearlyPrice: string;
  setEditYearlyPrice: (val: string) => void;
  isSavingMonthly: boolean;
  isSavingYearly: boolean;
  handleSaveMonthlyRate: () => Promise<void> | void;
  handleSaveYearlyRate: () => Promise<void> | void;
  userTypePricing: UserTypePricingMap;
  editUserTypePricing: Record<UserType, { monthly: string | number; yearly: string | number }>;
  setEditUserTypePricing: React.Dispatch<React.SetStateAction<Record<UserType, { monthly: string | number; yearly: string | number }>>>;
  isSavingUserTypePricing: Record<UserType, boolean>;
  handleSaveUserTypeRate: (type: UserType) => Promise<void> | void;
  handleSaveAllUserTypeRates?: () => Promise<void> | void;
  userTypeCounts?: Record<UserType, number>;
  paymentsSearch: string;
  setPaymentsSearch: (val: string) => void;
  paymentsFilter: PaymentsFilterType;
  setPaymentsFilter: (val: PaymentsFilterType) => void;
  filteredPaymentsUsers: UserData[];
  paginatedPaymentsUsers: UserData[];
  openChangePlanModal: (user: UserData) => void;
  paymentsRangeStart: number;
  paymentsRangeEnd: number;
  paymentsPageSize: number;
  setPaymentsPageSize: (size: number) => void;
  safePaymentsPage: number;
  totalPaymentsPages: number;
  setPaymentsPage: React.Dispatch<React.SetStateAction<number>>;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({
  monthlyPrice,
  yearlyPrice,
  paymentStats,
  editMonthlyPrice,
  setEditMonthlyPrice,
  editYearlyPrice,
  setEditYearlyPrice,
  isSavingMonthly,
  isSavingYearly,
  handleSaveMonthlyRate,
  handleSaveYearlyRate,
  userTypePricing,
  editUserTypePricing,
  setEditUserTypePricing,
  isSavingUserTypePricing,
  handleSaveUserTypeRate,
  handleSaveAllUserTypeRates,
  userTypeCounts,
  paymentsSearch,
  setPaymentsSearch,
  paymentsFilter,
  setPaymentsFilter,
  filteredPaymentsUsers,
  paginatedPaymentsUsers,
  openChangePlanModal,
  paymentsRangeStart,
  paymentsRangeEnd,
  paymentsPageSize,
  setPaymentsPageSize,
  safePaymentsPage,
  totalPaymentsPages,
  setPaymentsPage,
}) => {
  return (
    <TabsContent value="payments" className="space-y-6 outline-none">
      {/* User-Type / Industry Specific Pricing Card Section */}
      <Card className="border border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-background to-transparent shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
                <Tag className="w-3 h-3" />
                <span>Multi-Tier Industry Pricing</span>
              </div>
              <CardTitle className="text-base sm:text-lg font-black text-foreground">
                Rates by User Type (Monthly & Yearly)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Set custom monthly and yearly subscription fees based on business category. Users with this category will automatically be billed at these rates.
              </CardDescription>
            </div>

            {handleSaveAllUserTypeRates && (
              <Button
                type="button"
                size="sm"
                onClick={handleSaveAllUserTypeRates}
                className="h-9 px-4 font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs shrink-0 self-start sm:self-center"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                Save All Rates
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {(['normal', 'automobile', 'food_kitchen', 'cafe'] as UserType[]).map((typeKey) => {
              const meta = USER_TYPE_LABELS[typeKey];
              const currentTier = userTypePricing[typeKey] || { monthly: monthlyPrice, yearly: yearlyPrice };
              const editTier = editUserTypePricing[typeKey] || currentTier;
              const isSaving = isSavingUserTypePricing[typeKey];
              const count = userTypeCounts?.[typeKey] || 0;

              const monthlyValStr = editTier.monthly !== undefined ? String(editTier.monthly) : String(currentTier.monthly);
              const yearlyValStr = editTier.yearly !== undefined ? String(editTier.yearly) : String(currentTier.yearly);

              const parsedM = parseInt(monthlyValStr, 10);
              const parsedY = parseInt(yearlyValStr, 10);
              const hasChanges = (
                !isNaN(parsedM) && parsedM > 0 && parsedM !== currentTier.monthly
              ) || (
                !isNaN(parsedY) && parsedY > 0 && parsedY !== currentTier.yearly
              );

              return (
                <div
                  key={typeKey}
                  className="rounded-xl border border-border/80 bg-card p-4 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-1 pb-1 border-b border-border/50">
                      <div className="flex items-center gap-1.5 font-black text-sm text-foreground">
                        <span className="text-lg">{meta.icon}</span>
                        <span>{meta.label}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground px-1.5 py-0 bg-muted/40">
                        {count} {count === 1 ? 'user' : 'users'}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {/* Monthly Field */}
                      <div>
                        <Label className="text-[11px] font-bold text-foreground flex items-center justify-between">
                          <span>Monthly Rate</span>
                          <span className="text-[10px] text-muted-foreground font-semibold">Active: ₹{currentTier.monthly}/mo</span>
                        </Label>
                        <div className="relative mt-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-xs text-muted-foreground">₹</span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={monthlyValStr}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, '');
                              setEditUserTypePricing(prev => ({
                                ...prev,
                                [typeKey]: {
                                  ...(prev[typeKey] || currentTier),
                                  monthly: raw
                                }
                              }));
                            }}
                            className="pl-6 h-8 text-xs font-black rounded-lg bg-background"
                            placeholder="e.g. 449"
                          />
                        </div>
                        {/* Monthly Presets */}
                        <div className="flex items-center gap-1 flex-wrap pt-1.5">
                          {['299', '349', '449', '499', '599'].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => {
                                setEditUserTypePricing(prev => ({
                                  ...prev,
                                  [typeKey]: {
                                    ...(prev[typeKey] || currentTier),
                                    monthly: val
                                  }
                                }));
                              }}
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer",
                                monthlyValStr === val
                                  ? "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40"
                                  : "bg-muted/40 text-muted-foreground border-border/70 hover:bg-muted"
                              )}
                            >
                              ₹{val}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Yearly Field */}
                      <div>
                        <Label className="text-[11px] font-bold text-foreground flex items-center justify-between">
                          <span>Yearly Rate</span>
                          <span className="text-[10px] text-muted-foreground font-semibold">Active: ₹{currentTier.yearly}/yr</span>
                        </Label>
                        <div className="relative mt-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-xs text-muted-foreground">₹</span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={yearlyValStr}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, '');
                              setEditUserTypePricing(prev => ({
                                ...prev,
                                [typeKey]: {
                                  ...(prev[typeKey] || currentTier),
                                  yearly: raw
                                }
                              }));
                            }}
                            className="pl-6 h-8 text-xs font-black rounded-lg bg-background"
                            placeholder="e.g. 4499"
                          />
                        </div>
                        {/* Yearly Presets */}
                        <div className="flex items-center gap-1 flex-wrap pt-1.5">
                          {['2499', '2999', '3499', '4499', '5499'].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => {
                                setEditUserTypePricing(prev => ({
                                  ...prev,
                                  [typeKey]: {
                                    ...(prev[typeKey] || currentTier),
                                    yearly: val
                                  }
                                }));
                              }}
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer",
                                yearlyValStr === val
                                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                                  : "bg-muted/40 text-muted-foreground border-border/70 hover:bg-muted"
                              )}
                            >
                              ₹{val}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    disabled={isSaving || !hasChanges}
                    onClick={() => handleSaveUserTypeRate(typeKey)}
                    className={cn(
                      "w-full h-8 font-bold text-xs rounded-lg transition-all",
                      hasChanges ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs" : ""
                    )}
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                    Save {meta.label} Rates
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* BOTTOM: User Plans & Subscription Management Table */}
      <Card className="border shadow-sm overflow-hidden bg-white dark:bg-slate-800 rounded-2xl">
        <CardHeader className="p-4 sm:p-6 pb-3 border-b border-border/60 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold">User Subscriptions & Plans</CardTitle>
              <CardDescription className="text-xs">
                View and manage subscription validity or assign custom prices to specific businesses.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search company, email, phone..."
                className="pl-8 h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border-border"
                value={paymentsSearch}
                onChange={(e) => setPaymentsSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
            {[
              { id: 'all', label: 'All Users', count: paymentStats.total, icon: '👥' },
              { id: 'monthly', label: 'Monthly Pro', count: paymentStats.monthly, icon: '📅' },
              { id: 'yearly', label: 'Yearly Pro', count: paymentStats.yearly, icon: '⭐' },
              { id: 'trial', label: 'Free Trial', count: paymentStats.trial, icon: '⏳' },
              { id: 'expired', label: 'Expired', count: paymentStats.expired, icon: '🔒' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPaymentsFilter(tab.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                  paymentsFilter === tab.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground border border-border/60"
                )}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-black",
                  paymentsFilter === tab.id ? "bg-white/20 text-white" : "bg-muted text-foreground"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Payments Card View (< 768px) */}
          <div className="md:hidden divide-y divide-border">
            {filteredPaymentsUsers.length === 0 ? (
              <div className="text-center py-10 px-4 text-muted-foreground text-xs font-medium">
                No users found matching filter.
              </div>
            ) : (
              paginatedPaymentsUsers.map((u) => {
                const sub = getSubscriptionStatus(u.subscription_expires_at, u.plan_type, u.is_paid, u.created_at);
                const isYearlyPlan = u.plan_type === 'yearly' || sub.daysLeft > 180;
                const userTypeRates = userTypePricing[(u.user_type || 'normal') as UserType] || { monthly: monthlyPrice, yearly: yearlyPrice };
                const isLegacyFallback = (u.custom_monthly_price === 449 && (u.custom_yearly_price === 4499 || !u.custom_yearly_price)) ||
                  (u.custom_price === 449 && (!u.custom_yearly_price || u.custom_yearly_price === 4499));
                const hasCustomMonthly = !isLegacyFallback && u.custom_monthly_price !== null && u.custom_monthly_price !== undefined && u.custom_monthly_price !== userTypeRates.monthly;
                const hasCustomYearly = !isLegacyFallback && u.custom_yearly_price !== null && u.custom_yearly_price !== undefined && u.custom_yearly_price !== userTypeRates.yearly;
                const userM = hasCustomMonthly ? u.custom_monthly_price : (!isLegacyFallback && !isYearlyPlan && u.custom_price && u.custom_price !== userTypeRates.monthly ? u.custom_price : userTypeRates.monthly);
                const userY = hasCustomYearly ? u.custom_yearly_price : (!isLegacyFallback && isYearlyPlan && u.custom_price && u.custom_price !== userTypeRates.yearly ? u.custom_price : userTypeRates.yearly);

                return (
                  <div key={u.user_id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-foreground truncate">{u.company_name || 'Individual Account'}</div>
                        <div className="text-xs text-muted-foreground font-mono truncate">{u.email}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold capitalize">
                          {isYearlyPlan ? '⭐ Yearly Pro' : u.plan_type === 'enterprise' ? '👑 Enterprise' : u.plan_type === 'free' ? '⏳ Free Trial' : '📅 Monthly Pro'}
                        </Badge>
                        <Badge className={cn("text-[9px] font-bold uppercase", sub.badgeColor)}>
                          {sub.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-border/60 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold">Validity</span>
                        <span className="font-bold text-foreground">
                          {u.subscription_expires_at ? safelyFormatDate(u.subscription_expires_at) : 'No Expiry Set'}
                          <span className="text-[10px] text-muted-foreground font-normal ml-1">
                            ({sub.daysLeft > 0 ? `${sub.daysLeft}d left` : 'Expired'})
                          </span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50 text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-bold">Monthly</span>
                          <div className="flex items-center gap-1 font-black text-blue-600 dark:text-blue-400">
                            <span>₹{Number(userM).toLocaleString('en-IN')}/mo</span>
                            {hasCustomMonthly && <Badge className="text-[8px] px-1 py-0 bg-blue-500/15 text-blue-700 border-blue-500/30">Custom</Badge>}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-bold">Yearly</span>
                          <div className="flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400">
                            <span>₹{Number(userY).toLocaleString('en-IN')}/yr</span>
                            {hasCustomYearly && <Badge className="text-[8px] px-1 py-0 bg-emerald-500/15 text-emerald-700 border-emerald-500/30">Custom</Badge>}
                          </div>
                        </div>
                      </div>

                      {u.payment_notes && (
                        <p className="text-[10px] text-muted-foreground italic border-t border-border/40 pt-1 truncate">
                          📝 {u.payment_notes}
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => openChangePlanModal(u)}
                      className="w-full h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                      Change Plan & Rate
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Payments Table View (>= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead className="text-xs font-bold py-3.5 pl-6">Business / User</TableHead>
                  <TableHead className="text-xs font-bold py-3.5">Plan Tier & Status</TableHead>
                  <TableHead className="text-xs font-bold py-3.5">Validity & Expiry</TableHead>
                  <TableHead className="text-xs font-bold py-3.5">Monthly & Yearly Rates</TableHead>
                  <TableHead className="text-xs font-bold py-3.5 text-right pr-6">Change Plan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {filteredPaymentsUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-xs font-medium">
                      No users found matching filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPaymentsUsers.map((u) => {
                    const sub = getSubscriptionStatus(u.subscription_expires_at, u.plan_type, u.is_paid, u.created_at);
                    const isYearlyPlan = u.plan_type === 'yearly' || sub.daysLeft > 180;
                    const userTypeRates = userTypePricing[(u.user_type || 'normal') as UserType] || { monthly: monthlyPrice, yearly: yearlyPrice };
                    const isLegacyFallback = (u.custom_monthly_price === 449 && (u.custom_yearly_price === 4499 || !u.custom_yearly_price)) ||
                      (u.custom_price === 449 && (!u.custom_yearly_price || u.custom_yearly_price === 4499));
                    const hasCustomMonthly = !isLegacyFallback && u.custom_monthly_price !== null && u.custom_monthly_price !== undefined && u.custom_monthly_price !== userTypeRates.monthly;
                    const hasCustomYearly = !isLegacyFallback && u.custom_yearly_price !== null && u.custom_yearly_price !== undefined && u.custom_yearly_price !== userTypeRates.yearly;
                    const userM = hasCustomMonthly ? u.custom_monthly_price : (!isLegacyFallback && !isYearlyPlan && u.custom_price && u.custom_price !== userTypeRates.monthly ? u.custom_price : userTypeRates.monthly);
                    const userY = hasCustomYearly ? u.custom_yearly_price : (!isLegacyFallback && isYearlyPlan && u.custom_price && u.custom_price !== userTypeRates.yearly ? u.custom_price : userTypeRates.yearly);
                    return (
                      <TableRow key={u.user_id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3.5 pl-6">
                          <div className="font-bold text-xs text-foreground">{u.company_name || 'Individual Account'}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">{u.email}</div>
                        </TableCell>
                        <TableCell className="py-3.5">
                          <div className="flex flex-col gap-1 items-start">
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold capitalize">
                              {isYearlyPlan ? '⭐ Yearly Pro' : u.plan_type === 'enterprise' ? '👑 Enterprise' : u.plan_type === 'free' ? '⏳ Free Trial' : '📅 Monthly Pro'}
                            </Badge>
                            <Badge className={cn("text-[9px] font-bold uppercase", sub.badgeColor)}>
                              {sub.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5">
                          <div className="text-xs font-bold text-foreground">
                            {u.subscription_expires_at ? safelyFormatDate(u.subscription_expires_at) : 'No Expiry Set'}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {sub.daysLeft > 0 ? `${sub.daysLeft} days remaining` : 'Expired / Inactive'}
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5">
                          <div className="flex flex-col gap-1">
                            {/* Monthly Rate Row */}
                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                              <span className="text-[11px] text-muted-foreground font-semibold">Monthly:</span>
                              <span className="text-blue-600 dark:text-blue-400 font-black">
                                ₹{Number(userM).toLocaleString('en-IN')}<span className="text-[10px] font-semibold text-muted-foreground">/mo</span>
                              </span>
                              {hasCustomMonthly && (
                                <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[8px] px-1 py-0 font-bold uppercase">
                                  Custom
                                </Badge>
                              )}
                            </div>

                            {/* Yearly Rate Row */}
                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                              <span className="text-[11px] text-muted-foreground font-semibold">Yearly:</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-black">
                                ₹{Number(userY).toLocaleString('en-IN')}<span className="text-[10px] font-semibold text-muted-foreground">/yr</span>
                              </span>
                              {hasCustomYearly && (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[8px] px-1 py-0 font-bold uppercase">
                                  Custom
                                </Badge>
                              )}
                            </div>

                            {u.payment_notes && (
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate max-w-[170px]" title={u.payment_notes}>
                                📝 {u.payment_notes}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 text-right pr-6">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => openChangePlanModal(u)}
                            className="h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                          >
                            Change Plan & Rate
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {filteredPaymentsUsers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border/60 bg-slate-50/60 dark:bg-slate-900/40 text-xs">
              <div className="flex items-center gap-3 text-muted-foreground">
                <span>
                  Showing <strong className="text-foreground">{paymentsRangeStart}</strong> to <strong className="text-foreground">{paymentsRangeEnd}</strong> of <strong className="text-foreground">{filteredPaymentsUsers.length}</strong> businesses
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rows</span>
                  <Select value={String(paymentsPageSize)} onValueChange={(v) => setPaymentsPageSize(Number(v))}>
                    <SelectTrigger className="h-8 w-[72px] rounded-lg text-xs font-bold border-slate-200 dark:border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {totalPaymentsPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePaymentsPage <= 1}
                    onClick={() => setPaymentsPage(p => Math.max(1, p - 1))}
                    className="h-8 px-2.5 text-xs font-semibold"
                  >
                    Previous
                  </Button>
                  <span className="px-2 text-xs font-bold text-muted-foreground">
                    {safePaymentsPage} / {totalPaymentsPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePaymentsPage >= totalPaymentsPages}
                    onClick={() => setPaymentsPage(p => Math.min(totalPaymentsPages, p + 1))}
                    className="h-8 px-2.5 text-xs font-semibold"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};

