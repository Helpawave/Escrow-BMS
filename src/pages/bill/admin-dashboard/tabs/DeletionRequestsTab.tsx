import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { generateAccountId } from "@/utils/accountId";
import { AccountDeletionRequest } from '@/types/admin';
import { Trash2, RefreshCw, Search, ShieldCheck } from 'lucide-react';

interface DeletionRequestsTabProps {
  pendingDeletionCount: number;
  fetchDeletionRequests: () => Promise<void> | void;
  deletionRequestsLoading: boolean;
  deletionSearch: string;
  setDeletionSearch: (val: string) => void;
  deletionRequests: AccountDeletionRequest[];
  filteredDeletionRequests: AccountDeletionRequest[];
  deletionStatusFilter: 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled';
  setDeletionStatusFilter: (val: 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled') => void;
  onRequestReject: (req: AccountDeletionRequest) => void;
  onRequestApprove: (req: AccountDeletionRequest) => void;
}

export const DeletionRequestsTab: React.FC<DeletionRequestsTabProps> = ({
  pendingDeletionCount,
  fetchDeletionRequests,
  deletionRequestsLoading,
  deletionSearch,
  setDeletionSearch,
  deletionRequests,
  filteredDeletionRequests,
  deletionStatusFilter,
  setDeletionStatusFilter,
  onRequestReject,
  onRequestApprove,
}) => {
  return (
    <TabsContent value="deletion-requests" className="space-y-6 outline-none">
      {/* Header Card */}
      <Card className="border shadow-sm bg-white dark:bg-slate-800">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-950 dark:text-slate-100">
                  <span>Account Deletion & Data Wipeout Requests</span>
                  {pendingDeletionCount > 0 && (
                    <Badge variant="destructive" className="font-bold text-[10px]">
                      {pendingDeletionCount} Pending
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  Review, approve permanent data erasure, or decline business account deletion requests
                </CardDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDeletionRequests()}
              disabled={deletionRequestsLoading}
              className="h-9 gap-1.5 font-bold text-xs"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", deletionRequestsLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by email, company name, or reason..."
                value={deletionSearch}
                onChange={(e) => setDeletionSearch(e.target.value)}
                className="pl-9 h-10 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'pending', 'approved', 'rejected', 'cancelled'] as const).map((status) => {
                const count = status === 'all'
                  ? deletionRequests.length
                  : deletionRequests.filter(r => r.status === status).length;
                return (
                  <Button
                    key={status}
                    type="button"
                    variant={deletionStatusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDeletionStatusFilter(status)}
                    className={cn(
                      "h-8 text-xs font-bold capitalize transition-all",
                      deletionStatusFilter === status && status === 'pending' && "bg-amber-600 hover:bg-amber-700 text-white",
                      deletionStatusFilter === status && status === 'approved' && "bg-emerald-600 hover:bg-emerald-700 text-white",
                      deletionStatusFilter === status && status === 'rejected' && "bg-rose-600 hover:bg-rose-700 text-white"
                    )}
                  >
                    {status} ({count})
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Requests Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80">
                <TableRow>
                  <TableHead className="text-xs font-bold uppercase tracking-wider py-3.5 min-w-[180px]">User / Business</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider py-3.5 min-w-[200px]">Reason & Feedback</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider py-3.5 min-w-[120px]">Requested Date</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider py-3.5 min-w-[110px]">Status</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider py-3.5 text-right min-w-[130px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeletionRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-slate-400" />
                        <p className="text-sm font-semibold">No deletion requests found</p>
                        <p className="text-xs text-slate-400">
                          {deletionSearch ? "No requests match your search criteria." : "There are currently no deletion requests in this category."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeletionRequests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{req.user_email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span>{req.company_name || 'Individual Profile'}</span>
                            <span>•</span>
                            <span className="font-mono font-semibold text-primary">#{generateAccountId(req.user_id)}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 max-w-xs">
                        <div className="space-y-1">
                          <div className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            {req.reason}
                          </div>
                          {req.feedback && (
                            <p className="text-xs text-slate-500 italic line-clamp-2">
                              &quot;{req.feedback}&quot;
                            </p>
                          )}
                          {req.admin_notes && (
                            <div className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded border border-rose-200 dark:border-rose-900/50">
                              <strong>Admin Note:</strong> {req.admin_notes}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                          <p className="font-medium">{safelyToLocaleDate(req.created_at)}</p>
                          <p className="text-[10px] text-slate-400">{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        {req.status === 'pending' && (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold text-[10px] uppercase">
                            Pending Review
                          </Badge>
                        )}
                        {req.status === 'approved' && (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold text-[10px] uppercase">
                            Purged / Deleted
                          </Badge>
                        )}
                        {req.status === 'rejected' && (
                          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold text-[10px] uppercase">
                            Declined
                          </Badge>
                        )}
                        {req.status === 'cancelled' && (
                          <Badge variant="outline" className="text-slate-500 font-bold text-[10px] uppercase">
                            User Cancelled
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onRequestReject(req)}
                              className="h-8 text-xs font-bold border-slate-300 dark:border-slate-700"
                            >
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onRequestApprove(req)}
                              className="h-8 text-xs font-bold gap-1 shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Purge Account
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            {req.processed_at ? `Resolved on ${safelyToLocaleDate(req.processed_at)}` : 'Closed'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

