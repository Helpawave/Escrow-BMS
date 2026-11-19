import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTablePagination } from "@/components/DataTablePagination";
import { generateAccountId } from '@/utils/accountId';
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { 
  Copy, 
  Mail, 
  Phone, 
  MessageSquare, 
  MoreHorizontal, 
  Edit3, 
  Key, 
  Power, 
  Trash2 
} from "lucide-react";
import { StaffMember, PermissionDefinition } from "../types";

interface StaffTableProps {
  paginatedStaff: StaffMember[];
  totalFilteredCount: number;
  staffPage: number;
  staffPageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onToggleStatus: (staff: StaffMember) => void;
  onSendWhatsApp: (staff: StaffMember) => void;
  onOpenEdit: (staff: StaffMember) => void;
  onOpenPasswordModal: (staff: StaffMember) => void;
  onSetDeleteTarget: (staff: StaffMember) => void;
  onCopyToClipboard: (text: string, label: string) => void;
  availablePermissions: PermissionDefinition[];
}

export const StaffTable: React.FC<StaffTableProps> = ({
  paginatedStaff,
  totalFilteredCount,
  staffPage,
  staffPageSize,
  onPageChange,
  onPageSizeChange,
  onToggleStatus,
  onSendWhatsApp,
  onOpenEdit,
  onOpenPasswordModal,
  onSetDeleteTarget,
  onCopyToClipboard,
  availablePermissions,
}) => {
  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[150px] text-xs font-semibold">Account ID</TableHead>
              <TableHead className="w-[240px] text-xs font-semibold">Staff Member</TableHead>
              <TableHead className="text-xs font-semibold">Assigned Role</TableHead>
              <TableHead className="min-w-[280px] text-xs font-semibold">Authorized Modules</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold">Enrolled</TableHead>
              <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStaff.map((staff) => (
              <TableRow key={staff.id || staff.email} className="hover:bg-muted/20">
                <TableCell>
                  <div className="flex items-center gap-1.5 bg-primary/5 dark:bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg w-fit font-mono">
                    <span className="text-xs font-bold text-primary">
                      #{generateAccountId(staff.user_id || staff.email)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyToClipboard(generateAccountId(staff.user_id || staff.email), 'Account ID');
                      }}
                      className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                      title="Copy Account ID"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-foreground truncate">{staff.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 shrink-0" /> {staff.email}
                      </p>
                      {staff.phone && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 shrink-0" /> {staff.phone}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSendWhatsApp(staff);
                            }}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 transition-colors"
                            title="Send WhatsApp Login Access"
                          >
                            <MessageSquare className="w-2.5 h-2.5" /> WhatsApp
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-semibold text-[11px] px-2 py-0.5 bg-background">
                    {staff.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-sm">
                    {(() => {
                      const permsToDisplay = (staff.permissions || []).filter(pKey => {
                        // If availablePermissions does not include einvoice, don't show einvoice
                        if (pKey === 'einvoice' && !availablePermissions.some(ap => ap.id === 'einvoice')) {
                          return false;
                        }
                        return true;
                      });

                      if (permsToDisplay.length === 0) {
                        return <span className="text-[11px] text-muted-foreground italic">None</span>;
                      }

                      return permsToDisplay.map(pKey => {
                        const permObj = availablePermissions.find(ap => ap.id === pKey);
                        const label = permObj ? permObj.label : (pKey === 'kitchen' ? 'Kitchen Display (KDS)' : pKey);
                        return (
                          <span 
                            key={pKey} 
                            className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/60"
                          >
                            {label}
                          </span>
                        );
                      });
                    })()}
                  </div>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => onToggleStatus(staff)}
                    className="inline-flex items-center gap-1.5 focus:outline-none"
                    title="Click to toggle status"
                  >
                    <span className={`w-2 h-2 rounded-full ${staff.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <Badge 
                      variant="secondary"
                      className={`text-[10px] uppercase font-bold tracking-wider cursor-pointer ${
                        staff.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30' 
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
                      }`}
                    >
                      {staff.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {safelyToLocaleDate(staff.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onSendWhatsApp(staff)}
                      className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs gap-1.5 font-medium"
                      title={`Send WhatsApp Access to ${staff.name}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onSendWhatsApp(staff)} className="text-xs gap-2 text-emerald-600 font-medium">
                          <MessageSquare className="w-3.5 h-3.5" /> Send WhatsApp Invite
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onOpenEdit(staff)} className="text-xs gap-2">
                          <Edit3 className="w-3.5 h-3.5" /> Edit Privileges
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onOpenPasswordModal(staff)} className="text-xs gap-2">
                          <Key className="w-3.5 h-3.5" /> Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleStatus(staff)} className="text-xs gap-2">
                          <Power className="w-3.5 h-3.5" /> {staff.status === 'active' ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onSetDeleteTarget(staff)} className="text-xs gap-2 text-destructive focus:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" /> Remove Staff
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        currentPage={staffPage}
        totalPages={Math.max(1, Math.ceil(totalFilteredCount / staffPageSize))}
        totalCount={totalFilteredCount}
        pageSize={staffPageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        entityName="staff members"
      />
    </>
  );
};

