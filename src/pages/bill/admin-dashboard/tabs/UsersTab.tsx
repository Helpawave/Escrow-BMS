import React, { Fragment } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { generateAccountId } from "@/utils/accountId";
import { getUserDisplayName, getUserInitial, getSubscriptionStatus, WhatsAppIcon } from '../utils';
import { UserData, UserType, UserTypePricingMap } from '@/types/admin';
import { UserFilterType } from '../types';
import {
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Eye,
  MoreVertical,
  Users,
  ChevronDown,
  Phone,
  Key,
  Shield,
  Trash2,
  CheckCircle
} from 'lucide-react';

interface UsersTabProps {
  displayUsers: UserData[];
  filteredDisplayUsers: UserData[];
  paginatedDisplayUsers: UserData[];
  userFilter: UserFilterType;
  setUserFilter: (val: UserFilterType) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  loading: boolean;
  loadDashboardData: (showToast?: boolean) => Promise<void>;
  monthlyPrice: number;
  yearlyPrice: number;
  userTypePricing?: UserTypePricingMap;
  expandedStaffOwners: Record<string, boolean>;
  toggleStaffExpand: (ownerId: string) => void;
  onRequestUserTypeChange: (user: UserData, type: UserType) => void;
  onOpenChangePlanModal: (user: UserData) => void;
  onSelectUser: (user: UserData) => void;
  onToggleWhatsappProvider: (userId: string, currentProvider: string) => Promise<void>;
  onOpenResetPasswordModal: (userId: string, email: string) => void;
  onOpenToggleBlockModal: (user: UserData) => void;
  onOpenPurgeUserModal: (user: UserData) => void;
  userRangeStart: number;
  userRangeEnd: number;
  usersPageSize: number;
  setUsersPageSize: (size: number) => void;
  safeUsersPage: number;
  totalUserPages: number;
  userPageNumbers: number[];
  setUsersPage: React.Dispatch<React.SetStateAction<number>>;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  displayUsers,
  filteredDisplayUsers,
  paginatedDisplayUsers,
  userFilter,
  setUserFilter,
  searchTerm,
  setSearchTerm,
  loading,
  loadDashboardData,
  monthlyPrice,
  yearlyPrice,
  userTypePricing,
  expandedStaffOwners,
  toggleStaffExpand,
  onRequestUserTypeChange,
  onOpenChangePlanModal,
  onSelectUser,
  onToggleWhatsappProvider,
  onOpenResetPasswordModal,
  onOpenToggleBlockModal,
  onOpenPurgeUserModal,
  userRangeStart,
  userRangeEnd,
  usersPageSize,
  setUsersPageSize,
  safeUsersPage,
  totalUserPages,
  userPageNumbers,
  setUsersPage,
}) => {
  const { toast } = useToast();

  return (
    <TabsContent value="users" className="space-y-6 outline-none">
      <Card className="border shadow-sm overflow-hidden bg-white dark:bg-slate-800">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 p-4 sm:p-6 gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg sm:text-xl font-bold">User Directory</CardTitle>
              <div className="flex items-center gap-1.5 p-0.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-border text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setUserFilter('all')}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all cursor-pointer",
                    userFilter === 'all'
                      ? "bg-white dark:bg-slate-800 text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  All ({displayUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserFilter('completed')}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                    userFilter === 'completed'
                      ? "bg-emerald-600 text-white shadow-xs font-bold"
                      : "text-muted-foreground hover:text-emerald-600"
                  )}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Setup Done ({displayUsers.filter(u => u.is_setup_completed).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserFilter('pending')}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                    userFilter === 'pending'
                      ? "bg-amber-600 text-white shadow-xs font-bold"
                      : "text-muted-foreground hover:text-amber-600"
                  )}
                >
                  <Clock className="w-3 h-3" />
                  <span>Pending ({displayUsers.filter(u => !u.is_setup_completed).length})</span>
                </button>
              </div>
            </div>
            <CardDescription className="text-xs">Manage profile access, business categorization, and billing for all platform users</CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search users..."
                className="pl-9 w-full h-9 rounded-xl bg-slate-50 dark:bg-slate-900 border-border text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => loadDashboardData(false)} variant="outline" size="icon" className="h-9 w-9 rounded-xl shrink-0" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Card View (< 768px) */}
          <div className="md:hidden divide-y divide-border">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-full rounded-lg" />
                </div>
              ))
            ) : filteredDisplayUsers.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-bold">No users found matching &quot;{searchTerm}&quot;</p>
              </div>
            ) : (
              paginatedDisplayUsers.map((user) => (
                <div key={user.user_id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-sm text-primary shrink-0">
                        {getUserInitial(user)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate">{getUserDisplayName(user)}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 px-2 py-0.5 rounded-md font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        #{generateAccountId(user.user_id)}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generateAccountId(user.user_id));
                          toast({ title: "Copied!", description: `Account ID #${generateAccountId(user.user_id)} copied.` });
                        }}
                        className="text-muted-foreground hover:text-foreground p-1"
                        title="Copy ID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-border/50">
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-bold block">Mobile</span>
                      <span className="font-semibold">{user.mobile || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-bold block">Joined</span>
                      <span className="font-semibold">{safelyToLocaleDate(user.created_at)}</span>
                    </div>
                  </div>

                  {/* Mobile User Plan & Rates Card Row */}
                  {(() => {
                    const sub = getSubscriptionStatus(user.subscription_expires_at, user.plan_type, user.is_paid, user.created_at);
                    const isYearlyPlan = user.plan_type === 'yearly' || sub.daysLeft > 180;
                    const userTypeRates = userTypePricing?.[(user.user_type || 'normal') as UserType] || { monthly: monthlyPrice, yearly: yearlyPrice };
                    const isLegacyFallback = (user.custom_monthly_price === 449 && (user.custom_yearly_price === 4499 || !user.custom_yearly_price)) ||
                      (user.custom_price === 449 && (!user.custom_yearly_price || user.custom_yearly_price === 4499));
                    const hasCustomM = !isLegacyFallback && user.custom_monthly_price !== null && user.custom_monthly_price !== undefined && user.custom_monthly_price !== userTypeRates.monthly;
                    const hasCustomY = !isLegacyFallback && user.custom_yearly_price !== null && user.custom_yearly_price !== undefined && user.custom_yearly_price !== userTypeRates.yearly;
                    const userM = hasCustomM ? user.custom_monthly_price : (!isLegacyFallback && !isYearlyPlan && user.custom_price && user.custom_price !== userTypeRates.monthly ? user.custom_price : userTypeRates.monthly);
                    const userY = hasCustomY ? user.custom_yearly_price : (!isLegacyFallback && isYearlyPlan && user.custom_price && user.custom_price !== userTypeRates.yearly ? user.custom_price : userTypeRates.yearly);

                    return (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-border/60 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-muted-foreground text-[10px] uppercase">Plan & Pricing</span>
                          <Badge className={cn("text-[9px] font-bold px-2 py-0.5", sub.badgeColor)}>
                            {sub.label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-0.5">
                          <div className="flex items-center gap-1 font-bold">
                            <span className="text-muted-foreground text-[10px]">Monthly:</span>
                            <span className="text-blue-600 dark:text-blue-400 font-extrabold">₹{Number(userM).toLocaleString('en-IN')}/mo</span>
                            {hasCustomM && <Badge className="text-[8px] px-1 py-0 bg-blue-500/15 text-blue-700 border-blue-500/30">Custom</Badge>}
                          </div>
                          <div className="flex items-center gap-1 font-bold">
                            <span className="text-muted-foreground text-[10px]">Yearly:</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">₹{Number(userY).toLocaleString('en-IN')}/yr</span>
                            {hasCustomY && <Badge className="text-[8px] px-1 py-0 bg-emerald-500/15 text-emerald-700 border-emerald-500/30">Custom</Badge>}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Select
                        value={user.user_type || 'normal'}
                        onValueChange={(val) => onRequestUserTypeChange(user, val as UserType)}
                      >
                        <SelectTrigger className="h-7 px-2 text-[11px] font-bold rounded-lg border w-fit">
                          <span className="flex items-center gap-1">
                            <span>{user.user_type === 'automobile' ? '🚗 Auto' : user.user_type === 'food_kitchen' ? '🍳 Kitchen' : user.user_type === 'cafe' ? '☕ Cafe' : '🏪 Retail'}</span>
                          </span>
                        </SelectTrigger>
                        <SelectContent align="start">
                          <SelectItem value="normal">🏪 Retail</SelectItem>
                          <SelectItem value="automobile">🚗 Automobile</SelectItem>
                          <SelectItem value="food_kitchen">🍳 Food / Kitchen</SelectItem>
                          <SelectItem value="cafe">☕ Cafe</SelectItem>
                        </SelectContent>
                      </Select>

                      {user.is_blocked ? (
                        <Badge variant="outline" className="text-[10px] font-bold bg-rose-50 text-rose-600 border-rose-200">Blocked</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border-emerald-200">Active</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-xs font-bold"
                        onClick={() => onOpenChangePlanModal(user)}
                        title="Change Plan & Pricing Rates"
                      >
                        <CreditCard className="w-3.5 h-3.5 mr-1" />
                        <span>Plan</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-lg text-blue-600 hover:bg-blue-50"
                        onClick={() => onSelectUser(user)}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => onOpenChangePlanModal(user)} className="text-emerald-600 font-semibold">
                            <CreditCard className="w-3.5 h-3.5 mr-2" />
                            <span>Change Plan & Rate</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => onToggleWhatsappProvider(user.user_id, user.whatsapp_provider || 'meta')}
                            className="cursor-pointer text-xs flex items-center justify-between"
                          >
                            <span className="flex items-center gap-2">
                              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WhatsApp Mode</span>
                            </span>
                            <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0">
                              {user.whatsapp_provider === 'personal' ? 'wa.me' : 'API'}
                            </Badge>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => onOpenResetPasswordModal(user.user_id, user.email)}
                            className="cursor-pointer text-xs flex items-center gap-2"
                          >
                            <Key className="w-3.5 h-3.5 text-amber-600" />
                            <span>Reset Password</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => onOpenToggleBlockModal(user)}
                            className="cursor-pointer text-xs flex items-center gap-2"
                          >
                            {user.is_blocked ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Unblock Account</span>
                              </>
                            ) : (
                              <>
                                <Shield className="w-3.5 h-3.5 text-rose-600" />
                                <span>Block Account</span>
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => onOpenPurgeUserModal(user)}
                            className="cursor-pointer text-xs flex items-center gap-2 text-rose-600 focus:text-rose-600 font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Purge Account</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-bold w-[130px] pl-4 pr-2">Account ID</TableHead>
                  <TableHead className="font-bold pl-4 pr-3">Business & User</TableHead>
                  <TableHead className="font-bold w-[135px] px-3 whitespace-nowrap">Contact & Joined</TableHead>
                  <TableHead className="font-bold w-[115px] px-2">Type</TableHead>
                  <TableHead className="font-bold w-[190px] px-3 whitespace-nowrap">Plan & Rates</TableHead>
                  <TableHead className="text-right font-bold w-[130px] pr-4 pl-1">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="py-4">
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  filteredDisplayUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20">
                        <div className="flex flex-col items-center">
                          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                            <Search className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">No users found matching &quot;{searchTerm}&quot;</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedDisplayUsers.map((user) => (
                      <Fragment key={user.user_id}>
                        <TableRow className="group border-border transition-colors hover:bg-muted/40">
                          {/* Account ID */}
                          <TableCell className="py-3 pl-4 pr-2 w-[140px]">
                            <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 px-2 py-0.5 rounded-md w-fit font-mono shrink-0">
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                #{generateAccountId(user.user_id)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(generateAccountId(user.user_id));
                                  toast({
                                    title: "Copied!",
                                    description: `Account ID #${generateAccountId(user.user_id)} copied.`
                                  });
                                }}
                                aria-label={`Copy Account ID #${generateAccountId(user.user_id)}`}
                                className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors p-0.5"
                                title="Copy Account ID"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </TableCell>

                          {/* Organization & Email */}
                          <TableCell className="py-3 pl-4 pr-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center font-bold text-xs text-blue-600 shrink-0">
                                {getUserInitial(user)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-bold text-xs sm:text-sm text-foreground truncate" title={getUserDisplayName(user)}>
                                    {getUserDisplayName(user)}
                                  </p>
                                  {user.is_setup_completed ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold shrink-0">
                                      Setup Done
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold shrink-0">
                                      Pending Setup
                                    </Badge>
                                  )}
                                  {user.staff_members && user.staff_members.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleStaffExpand(user.user_id);
                                      }}
                                      aria-label={`Toggle staff members for ${user.company_name || user.email}`}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer shrink-0"
                                      title="Click to view staff members"
                                    >
                                      <Users className="w-3 h-3" />
                                      <span>{user.staff_members.length} Staff</span>
                                      <ChevronDown className={`w-2.5 h-2.5 transition-transform ${expandedStaffOwners[user.user_id] ? 'rotate-180' : ''}`} />
                                    </button>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate" title={user.email}>
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Contact & Joined */}
                          <TableCell className="py-3 px-3 w-[145px]">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 text-foreground text-xs font-semibold truncate">
                                <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{user.mobile || 'No mobile'}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground pl-4 truncate">
                                {safelyToLocaleDate(user.created_at)}
                              </p>
                            </div>
                          </TableCell>

                          {/* User Type Selector */}
                          <TableCell className="py-3 px-2 w-[120px]">
                            <Select
                              value={user.user_type || 'normal'}
                              onValueChange={(val) => onRequestUserTypeChange(user, val as UserType)}
                            >
                              <SelectTrigger
                                className={`h-8 px-2 rounded-lg border text-xs font-semibold w-full max-w-[115px] flex items-center justify-between transition-all ${user.user_type === 'automobile'
                                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-700 dark:text-amber-300'
                                    : user.user_type === 'food_kitchen'
                                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 text-purple-700 dark:text-purple-300'
                                      : user.user_type === 'cafe' ? 'bg-amber-100/60 dark:bg-amber-950/60 border-amber-300 text-amber-900 dark:text-amber-200' : 'bg-muted/40 border-border text-foreground'
                                  }`}
                                title="Click to switch business category"
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <span>{user.user_type === 'automobile' ? '🚗' : user.user_type === 'food_kitchen' ? '🍳' : user.user_type === 'cafe' ? '☕' : '🏪'}</span>
                                  <span className="truncate">{user.user_type === 'automobile' ? 'Auto' : user.user_type === 'food_kitchen' ? 'Kitchen' : user.user_type === 'cafe' ? 'Cafe' : 'Retail'}</span>
                                </span>
                              </SelectTrigger>
                              <SelectContent align="start" className="rounded-xl">
                                <SelectItem value="normal">
                                  <span className="flex items-center gap-2">🏪 <span>Retail</span></span>
                                </SelectItem>
                                <SelectItem value="automobile">
                                  <span className="flex items-center gap-2">🚗 <span>Automobile</span></span>
                                </SelectItem>
                                <SelectItem value="food_kitchen">
                                  <span className="flex items-center gap-2">🍳 <span>Food / Cloud Kitchen</span></span>
                                </SelectItem>
                                <SelectItem value="cafe">
                                  <span className="flex items-center gap-2">☕ <span>Cafe</span></span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Plan & Rates */}
                          <TableCell className="py-3 px-3 w-[190px]">
                            {(() => {
                              const sub = getSubscriptionStatus(user.subscription_expires_at, user.plan_type, user.is_paid, user.created_at);
                              const isYearlyPlan = user.plan_type === 'yearly' || sub.daysLeft > 180;
                              const userTypeRates = userTypePricing?.[(user.user_type || 'normal') as UserType] || { monthly: monthlyPrice, yearly: yearlyPrice };
                              const isLegacyFallback = (user.custom_monthly_price === 449 && (user.custom_yearly_price === 4499 || !user.custom_yearly_price)) ||
                                (user.custom_price === 449 && (!user.custom_yearly_price || user.custom_yearly_price === 4499));
                              const hasCustomM = !isLegacyFallback && user.custom_monthly_price !== null && user.custom_monthly_price !== undefined && user.custom_monthly_price !== userTypeRates.monthly;
                              const hasCustomY = !isLegacyFallback && user.custom_yearly_price !== null && user.custom_yearly_price !== undefined && user.custom_yearly_price !== userTypeRates.yearly;
                              const userM = hasCustomM ? user.custom_monthly_price : (!isLegacyFallback && !isYearlyPlan && user.custom_price && user.custom_price !== userTypeRates.monthly ? user.custom_price : userTypeRates.monthly);
                              const userY = hasCustomY ? user.custom_yearly_price : (!isLegacyFallback && isYearlyPlan && user.custom_price && user.custom_price !== userTypeRates.yearly ? user.custom_price : userTypeRates.yearly);

                              return (
                                <div className="flex flex-col gap-1 w-fit">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Badge className={`rounded-full shadow-none text-[10px] font-bold px-2 py-0.5 whitespace-nowrap ${sub.color}`}>
                                      {sub.status}
                                    </Badge>
                                    {user.is_blocked ? (
                                      <Badge variant="outline" className="rounded-full text-[10px] font-bold px-2 py-0 bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40">
                                        Blocked
                                      </Badge>
                                    ) : sub.isExpired ? (
                                      <Badge variant="outline" className="rounded-full text-[10px] font-bold px-2 py-0 bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40">
                                        Locked
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="rounded-full text-[10px] font-bold px-2 py-0 bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40">
                                        Active
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold leading-tight">
                                    <span className="text-muted-foreground text-[10px]">Monthly:</span>
                                    <span className="text-blue-600 dark:text-blue-400 font-extrabold">₹{Number(userM).toLocaleString('en-IN')}<span className="text-[9px] font-normal text-muted-foreground">/mo</span></span>
                                    {hasCustomM && <Badge className="text-[8px] px-1 py-0 bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30">Custom</Badge>}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold leading-tight">
                                    <span className="text-muted-foreground text-[10px]">Yearly:</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">₹{Number(userY).toLocaleString('en-IN')}<span className="text-[9px] font-normal text-muted-foreground">/yr</span></span>
                                    {hasCustomY && <Badge className="text-[8px] px-1 py-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">Custom</Badge>}
                                  </div>
                                </div>
                              );
                            })()}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right pr-4 pl-1 py-3 w-[130px]">
                            <div className="flex items-center justify-end gap-1.5 w-full ml-auto">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 shrink-0"
                                onClick={() => onOpenChangePlanModal(user)}
                                title="Change Plan & Pricing Rates"
                                aria-label={`Change Plan & Rates for ${user.company_name || user.email}`}
                              >
                                <CreditCard className="w-4 h-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 shrink-0"
                                onClick={() => onSelectUser(user)}
                                title="User Details & Activity Analysis"
                                aria-label={`View details for ${user.company_name || user.email}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                                    title="Account Operations"
                                    aria-label={`More account operations for ${user.company_name || user.email}`}
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 rounded-xl z-50">
                                  <DropdownMenuItem
                                    onClick={() => onOpenChangePlanModal(user)}
                                    className="cursor-pointer text-xs flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold"
                                  >
                                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Change Plan & Rate</span>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => onToggleWhatsappProvider(user.user_id, user.whatsapp_provider || 'meta')}
                                    className="cursor-pointer text-xs flex items-center justify-between"
                                  >
                                    <span className="flex items-center gap-2">
                                      <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>WhatsApp Mode</span>
                                    </span>
                                    <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0">
                                      {user.whatsapp_provider === 'personal' ? 'wa.me' : 'API'}
                                    </Badge>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => onOpenResetPasswordModal(user.user_id, user.email)}
                                    className="cursor-pointer text-xs flex items-center gap-2"
                                  >
                                    <Key className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Reset Password</span>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => onOpenToggleBlockModal(user)}
                                    className="cursor-pointer text-xs flex items-center gap-2"
                                  >
                                    {user.is_blocked ? (
                                      <>
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Unblock Account</span>
                                      </>
                                    ) : (
                                      <>
                                        <Shield className="w-3.5 h-3.5 text-rose-600" />
                                        <span>Block Account</span>
                                      </>
                                    )}
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={() => onOpenPurgeUserModal(user)}
                                    className="cursor-pointer text-xs flex items-center gap-2 text-rose-600 focus:text-rose-600 font-semibold"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Purge Account</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Nested Staff Sub-Table Row */}
                        {expandedStaffOwners[user.user_id] && user.staff_members && user.staff_members.length > 0 && (
                          <TableRow className="bg-slate-50/70 dark:bg-slate-900/40 border-b border-border/80">
                            <TableCell colSpan={6} className="py-3 px-6">
                              <div className="rounded-xl border border-blue-100 dark:border-blue-950/60 bg-white dark:bg-slate-900 p-3 shadow-xs space-y-2">
                                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-xs font-bold text-foreground">Staff Members ({user.staff_members.length})</span>
                                    <span className="text-[11px] text-muted-foreground">• Assigned under {user.company_name || user.email}</span>
                                  </div>
                                  <Badge variant="outline" className="text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200">
                                    Validity Synced with Company
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 divide-y divide-border/40">
                                  {user.staff_members.map((staff) => (
                                    <div key={staff.user_id} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[10px]">
                                          {staff.name?.[0]?.toUpperCase() || 'S'}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-foreground">{staff.name || 'Staff Member'}</span>
                                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-semibold bg-slate-100 dark:bg-slate-800">
                                              {staff.staff_role || 'Staff'}
                                            </Badge>
                                          </div>
                                          <div className="text-[11px] text-muted-foreground">{staff.email} {staff.mobile ? `• ${staff.mobile}` : ''}</div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4 text-[11px]">
                                        <div className="text-muted-foreground">
                                          Plan Validity: <span className="font-semibold text-foreground">{staff.subscription_expires_at ? new Date(staff.subscription_expires_at).toLocaleDateString('en-IN') : (user.subscription_expires_at ? new Date(user.subscription_expires_at).toLocaleDateString('en-IN') : 'Active')}</span>
                                        </div>
                                        <div className="flex items-center gap-1 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                          #{generateAccountId(staff.user_id)}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    ))
                  )
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-4 border-t border-slate-100 p-4 sm:p-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Showing {userRangeStart}-{userRangeEnd} of {filteredDisplayUsers.length} businesses
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Rows</span>
                <Select value={String(usersPageSize)} onValueChange={(value) => setUsersPageSize(Number(value))}>
                  <SelectTrigger className="h-9 w-[86px] rounded-xl border-slate-200 font-bold dark:border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 30, 40, 50].map((size) => (
                      <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Pagination className="mx-0 w-full sm:w-auto justify-center sm:justify-end overflow-x-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    className={safeUsersPage === 1 ? "pointer-events-none opacity-50" : ""}
                    onClick={(event) => {
                      event.preventDefault();
                      setUsersPage((page) => Math.max(1, page - 1));
                    }}
                  />
                </PaginationItem>
                {userPageNumbers.map((page, index) => {
                  const previousPage = userPageNumbers[index - 1];
                  const showGap = previousPage && page - previousPage > 1;

                  return (
                    <PaginationItem key={page} className="flex items-center">
                      {showGap && <span className="px-2 text-slate-400">...</span>}
                      <PaginationLink
                        href="#"
                        isActive={page === safeUsersPage}
                        onClick={(event) => {
                          event.preventDefault();
                          setUsersPage(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    className={safeUsersPage === totalUserPages ? "pointer-events-none opacity-50" : ""}
                    onClick={(event) => {
                      event.preventDefault();
                      setUsersPage((page) => Math.min(totalUserPages, page + 1));
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

