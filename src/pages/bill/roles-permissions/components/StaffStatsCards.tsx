import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, ShieldCheck } from "lucide-react";

interface StaffStatsCardsProps {
  totalStaff: number;
  activeStaffCount: number;
}

export const StaffStatsCards: React.FC<StaffStatsCardsProps> = ({
  totalStaff,
  activeStaffCount,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="border border-border/70 shadow-sm bg-card overflow-hidden">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Total Staff</p>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1 break-words leading-tight py-0.5">{totalStaff}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">Enrolled team members</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/70 shadow-sm bg-card overflow-hidden">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Active Status</p>
            <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 break-words leading-tight py-0.5">{activeStaffCount}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{totalStaff - activeStaffCount} inactive members</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/70 shadow-sm bg-card overflow-hidden">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Security Architecture</p>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1 break-words leading-tight py-0.5">Role-Scoped</h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">Restricted module visibility</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

