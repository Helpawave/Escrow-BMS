import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, ArrowRightLeft, Check, X } from 'lucide-react';
import { BusinessTypeRequest } from '@/types/admin';

interface AdminBannersProps {
  pendingDeletionCount: number;
  pendingTypeRequestsCount: number;
  pendingTypeRequests: BusinessTypeRequest[];
  isProcessingTypeAction: boolean;
  onNavigateToTab: (tab: string) => void;
  onApproveTypeRequest: (req: BusinessTypeRequest) => void;
  onRejectTypeRequestPrompt: (req: BusinessTypeRequest) => void;
}

export const AdminBanners: React.FC<AdminBannersProps> = ({
  pendingDeletionCount,
  pendingTypeRequestsCount,
  pendingTypeRequests,
  isProcessingTypeAction,
  onNavigateToTab,
  onApproveTypeRequest,
  onRejectTypeRequestPrompt,
}) => {
  return (
    <>
      {/* Account Deletion Requests Banner */}
      {pendingDeletionCount > 0 && (
        <div className="p-3.5 sm:p-5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/80 dark:bg-rose-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs sm:text-sm text-rose-950 dark:text-rose-100 truncate">
                {pendingDeletionCount} Account Deletion Request{pendingDeletionCount > 1 ? 's' : ''} Pending
              </p>
              <p className="text-[11px] sm:text-xs text-rose-800/80 dark:text-rose-300/80 mt-0.5">
                Business user{pendingDeletionCount > 1 ? 's have' : ' has'} requested account deletion.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onNavigateToTab('deletion-requests')}
            className="font-semibold text-xs w-full sm:w-auto shrink-0 gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Review Requests
          </Button>
        </div>
      )}

      {/* Business Type Switch Requests Banner */}
      {pendingTypeRequestsCount > 0 && (
        <div className="p-3.5 sm:p-5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs sm:text-sm text-amber-950 dark:text-amber-100 truncate">
                {pendingTypeRequestsCount} Industry Category Switch Request{pendingTypeRequestsCount > 1 ? 's' : ''} Pending
              </p>
              <p className="text-[11px] sm:text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                Business user{pendingTypeRequestsCount > 1 ? 's have' : ' has'} requested category updates.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {pendingTypeRequests.slice(0, 3).map((req) => (
              <div key={req.id} className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  onClick={() => onApproveTypeRequest(req)}
                  disabled={isProcessingTypeAction}
                  className="h-8 text-xs font-bold gap-1 bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve {req.company_name} ({req.requested_type === 'automobile' ? '🚗 Auto' : req.requested_type === 'food_kitchen' ? '🍳 Food' : '🏪 Retail'})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  title="Reject Request"
                  onClick={() => onRejectTypeRequestPrompt(req)}
                  disabled={isProcessingTypeAction}
                  className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateToTab('users')}
              className="h-8 text-xs font-semibold"
            >
              View in Users
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

