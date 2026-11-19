import React from 'react';
import { cn } from '@/lib/utils';

interface AdminTopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingTypeRequestsCount: number;
  pendingDeletionCount: number;
}

export const AdminTopNav: React.FC<AdminTopNavProps> = ({
  activeTab,
  setActiveTab,
  pendingTypeRequestsCount,
  pendingDeletionCount,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-border/60">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2 truncate">
          {activeTab === 'overview' && 'Dashboard Overview'}
          {activeTab === 'users' && 'Users & Businesses'}
          {activeTab === 'payments' && 'Payments & Plans'}
          {activeTab === 'deletion-requests' && 'Account Deletion Requests'}
          {activeTab === 'system' && 'System Settings'}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
          {activeTab === 'overview' && 'Platform statistics, user growth, and subscription breakdown'}
          {activeTab === 'users' && 'Manage registered businesses, user types, and billing tiers'}
          {activeTab === 'payments' && 'Universal platform pricing and user subscription tiers'}
          {activeTab === 'deletion-requests' && 'Review user-requested account deletions and manage data'}
          {activeTab === 'system' && 'Maintenance controls, signup access, and platform settings'}
        </p>
      </div>

      {/* Quick tab switcher pill bar */}
      <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50 shrink-0 overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={cn(
            "px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0",
            activeTab === 'overview' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={cn(
            "px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 shrink-0",
            activeTab === 'users' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Users
          {pendingTypeRequestsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title={`${pendingTypeRequestsCount} Category Requests`} />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={cn(
            "px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0",
            activeTab === 'payments' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Payments
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('deletion-requests')}
          className={cn(
            "px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 shrink-0",
            activeTab === 'deletion-requests' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Deletions
          {pendingDeletionCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title={`${pendingDeletionCount} Pending Deletions`} />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={cn(
            "px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0",
            activeTab === 'system' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          System
        </button>
      </div>
    </div>
  );
};

