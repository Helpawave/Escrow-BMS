import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { MODULES, type ModuleKey } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  ShieldCheck,
  UserPlus,
  Briefcase,
  Check,
  X,
  Lock,
  Search,
  Trash2,
  Building2,
  Users,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  Save,
  ShieldAlert,
  Calculator,
  Eye,
  Mail,
  Phone,
  Calendar,
  ChevronRight,
  Crown,
  BadgeCheck,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

import { syncMemberToPayroll, updateUserAcrossAllModules } from '@/utils/erpPosting';
import { formatSalaryDisplay, calculateSalaryBreakdown } from '@/pages/payroll/Employees';

const PRESET_ROLES = [
  { key: 'admin', label: 'Admin', modules: ['billing', 'ledger', 'payroll', 'inventory', 'crm', 'hisab'] as ModuleKey[] },
  { key: 'accountant', label: 'Accountant', modules: ['billing', 'ledger', 'inventory', 'hisab'] as ModuleKey[] },
  { key: 'sales', label: 'Sales', modules: ['crm'] as ModuleKey[] },
  { key: 'hr', label: 'HR', modules: ['payroll'] as ModuleKey[] },
  { key: 'view', label: 'View Only', modules: ['billing', 'ledger', 'payroll', 'inventory', 'crm', 'hisab'] as ModuleKey[] },
  { key: 'custom', label: 'Custom', modules: null }
];

function getMatchingRoleKey(modules: ModuleKey[]): string {
  if (!modules || modules.length === 0) return 'custom';
  if (modules.length === 4 && ['billing', 'ledger', 'inventory', 'hisab'].every(m => modules.includes(m as any))) return 'accountant';
  if (modules.length === 1 && modules.includes('crm' as any)) return 'sales';
  if (modules.length === 1 && modules.includes('payroll' as any)) return 'hr';
  if (modules.length === 6) return 'admin';
  return 'custom';
}

export interface CompanyMember {
  id: string;
  full_name: string;
  email: string;
  department: string;
  role: 'owner' | 'department_head' | 'member';
  allowed_modules: ModuleKey[];
  invited_at: string;
  status: 'active' | 'pending';
}

export default function MembersPage() {
  const { profile: currentProfile } = useAuth();
  const { refresh: refreshSubscription } = useSubscription();
  const [searchQuery, setSearchQuery] = useState('');

  // Check if current user is Main Company Owner
  const isOwner = currentProfile?.role === 'owner' || currentProfile?.role === 'super_admin' || !currentProfile?.role || currentProfile?.role === 'admin';

  // State for Invited Company Department Members (No mock data)
  const [invitedMembers, setInvitedMembers] = useState<CompanyMember[]>(() => {
    const saved = localStorage.getItem('company_department_invited_members_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter((m: any) => 
          !['member-dept-101', 'member-dept-102', 'owner-account'].includes(m.id) &&
          !['vikram.billing@company.com', 'ananya.payroll@company.com', 'user@company.com'].includes(m.email)
        );
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('company_department_invited_members_v2', JSON.stringify(invitedMembers));
  }, [invitedMembers]);

  // Modal State - Invite
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberDepartment, setMemberDepartment] = useState('Billing & Sales Dept');
  const [selectedModules, setSelectedModules] = useState<ModuleKey[]>(['billing']);
  const [inviteRole, setInviteRole] = useState<string>('custom');

  // Modal State - Edit & Double Verification
  const [editingMember, setEditingMember] = useState<CompanyMember | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
  const [editRole, setEditRole] = useState<string>('custom');
  const [editForm, setEditForm] = useState<{
    full_name: string;
    email: string;
    department: string;
    salary?: string;
    allowed_modules: ModuleKey[];
  }>({
    full_name: '',
    email: '',
    department: '',
    salary: '600000',
    allowed_modules: ['billing']
  });

  // Modal State - Delete & Double Verification
  const [deletingMember, setDeletingMember] = useState<CompanyMember | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Modal State - Full Member Profile Dossier Page View
  const [viewMemberDossier, setViewMemberDossier] = useState<CompanyMember | null>(null);

  const handleToggleModuleAccess = (memberId: string, moduleKey: ModuleKey) => {
    if (!isOwner) {
      toast.error('Only the Primary Business Owner can assign department module access to members.');
      return;
    }

    const updated = invitedMembers.map(m => {
      if (m.id === memberId) {
        const hasAccess = m.allowed_modules.includes(moduleKey);
        const nextMods = hasAccess
          ? m.allowed_modules.filter(mod => mod !== moduleKey)
          : [...m.allowed_modules, moduleKey];

        localStorage.setItem(`bms_permissions_${m.id}`, JSON.stringify(nextMods));
        
        return {
          ...m,
          allowed_modules: nextMods
        };
      }
      return m;
    });

    setInvitedMembers(updated);
    toast.success('Department module access permission updated successfully!');
    refreshSubscription();
  };

  const handleInviteDepartmentMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      toast.error('Only Company Owner can invite department members.');
      return;
    }

    if (!memberName || !memberEmail) {
      toast.error('Please fill in Member Name and Email.');
      return;
    }

    const newMember: CompanyMember = {
      id: `dept-member-${Date.now()}`,
      full_name: memberName,
      email: memberEmail,
      department: memberDepartment || 'General Operations',
      role: 'member',
      allowed_modules: selectedModules,
      invited_at: new Date().toISOString().substring(0, 10),
      status: 'active'
    };

    const updated = [...invitedMembers, newMember];
    setInvitedMembers(updated);
    localStorage.setItem(`bms_permissions_${newMember.id}`, JSON.stringify(selectedModules));

    // Auto-sync department staff member to Payroll Employees module
    await syncMemberToPayroll({
      name: memberName,
      email: memberEmail,
      department: memberDepartment || 'General Operations',
      designation: 'Department Staff'
    });

    setMemberName('');
    setMemberEmail('');
    setSelectedModules(['billing']);
    setShowInviteModal(false);

    toast.success(`Department member ${memberName} added & synchronized to Payroll Employees!`);
  };

  // Open Edit Modal Step 1
  const openEditModal = (member: CompanyMember) => {
    setEditingMember(member);
    setEditForm({
      full_name: member.full_name,
      email: member.email,
      department: member.department,
      salary: (member as any).salary || '600000',
      allowed_modules: [...member.allowed_modules]
    });
    setEditRole(getMatchingRoleKey(member.allowed_modules));
    setShowEditModal(true);
  };

  // Trigger Edit Double Verification Step 2
  const handleEditSubmitStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.full_name.trim()) {
      toast.error('Member name is required');
      return;
    }
    // Show Double Verification Popup
    setShowEditConfirmModal(true);
  };

  // Final Execute Edit after Double Verification Confirmation Button
  const handleConfirmEditFinal = async () => {
    if (!editingMember) return;

    await updateUserAcrossAllModules({
      id: editingMember.id,
      name: editForm.full_name,
      email: editForm.email,
      department: editForm.department,
      allowedModules: editForm.allowed_modules
    });

    const updated = invitedMembers.map(m => {
      if (m.id === editingMember.id) {
        return {
          ...m,
          full_name: editForm.full_name.trim(),
          email: editForm.email.trim(),
          department: editForm.department,
          salary: (editForm as any).salary || '600000',
          allowed_modules: editForm.allowed_modules
        };
      }
      return m;
    });

    setInvitedMembers(updated);
    setShowEditConfirmModal(false);
    setShowEditModal(false);
    setEditingMember(null);

    toast.success(`Member "${editForm.full_name}" details & matrix rights updated after double verification!`);
    refreshSubscription();
  };

  // Trigger Delete Double Verification Step 1
  const openDeleteConfirmModal = (member: CompanyMember) => {
    setDeletingMember(member);
    setShowDeleteConfirmModal(true);
  };

  // Final Execute Delete after Double Verification Confirmation Button
  const handleConfirmDeleteFinal = () => {
    if (!deletingMember) return;

    const updated = invitedMembers.filter(m => m.id !== deletingMember.id);
    setInvitedMembers(updated);
    localStorage.removeItem(`bms_permissions_${deletingMember.id}`);

    setShowDeleteConfirmModal(false);
    setDeletingMember(null);

    toast.success(`Department member "${deletingMember.full_name}" removed after double verification!`);
    refreshSubscription();
  };

  const filteredMembers = invitedMembers.filter(m =>
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Purple / Indigo Header Banner for Members */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-violet-800 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="px-3 py-1 bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                Department Members & Matrix Rights
              </span>
              <h1 className="text-2xl font-black text-white mt-1">Company Staff & Module Access</h1>
              <p className="text-xs text-purple-100 mt-0.5">
                Invite staff members & grant department-specific module read and write permissions
              </p>
            </div>
          </div>

          <div>
            {isOwner && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2.5 bg-white text-purple-900 hover:bg-purple-50 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-purple-700" />
                <span>+ Invite Department Member</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Department Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invited Staff Members</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{invitedMembers.length}</p>
            <p className="text-[11px] text-purple-600 font-semibold mt-1">Active Department Staff</p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Departments</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {new Set(invitedMembers.map(m => m.department)).size}
            </p>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1">Functional Divisions</p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department Rights Control</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">Matrix Active</p>
            <p className="text-[11px] text-slate-400 mt-1">Double Verification Protection</p>
          </div>
        </div>

        {/* Notice Info */}
        {!isOwner ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs">
            <Lock className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <div>
              <span className="font-bold">Department Scope:</span> You have full read/write access ONLY inside the specific department modules assigned to you by the Primary Business Owner.
            </div>
          </div>
        ) : (
          <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 rounded-xl flex items-center gap-3 text-purple-800 dark:text-purple-300 text-xs">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-purple-600" />
            <div>
              <span className="font-bold">Owner Control Matrix:</span> Click any module button below to grant/revoke rights. Use Edit/Delete buttons with double verification to manage staff.
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search invited member by name, email or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Members Cards Grid */}
        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <ShieldCheck className="w-12 h-12 text-purple-300 mx-auto" />
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">No Invited Department Members Yet</h3>
              <p className="text-xs text-slate-400 mt-1">Staff members are added by sending an explicit invitation. Click below to invite staff members.</p>
            </div>
            {isOwner && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 inline-flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Invite Department Member</span>
              </button>
            )}
          </div>
        ) : (
          <>
          {/* ── Cards Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMembers.map((member) => {
              const memberIsOwner = member.role === 'owner';
              const grantedCount = member.allowed_modules.length;
              const avatarColors = [
                'from-purple-600 to-indigo-600',
                'from-emerald-500 to-teal-600',
                'from-rose-500 to-pink-600',
                'from-amber-500 to-orange-600',
                'from-cyan-500 to-blue-600',
              ];
              const colorIdx = member.full_name.charCodeAt(0) % avatarColors.length;
              return (
                <div
                  key={member.id}
                  onClick={() => setViewMemberDossier(member)}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer overflow-hidden"
                >
                  {/* Gradient header strip */}
                  <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${avatarColors[colorIdx]} rounded-t-2xl`} />

                  {/* Owner crown badge */}
                  {memberIsOwner && (
                    <span className="absolute top-3.5 right-3.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-amber-300">
                      <Crown className="w-2.5 h-2.5" /> Owner
                    </span>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarColors[colorIdx]} text-white font-black text-base flex items-center justify-center flex-shrink-0 shadow-md`}>
                      {member.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 dark:text-white text-sm truncate">{member.full_name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{member.email}</p>
                    </div>
                  </div>

                  <div className="mt-3.5 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate">{member.department}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{grantedCount} module{grantedCount !== 1 ? 's' : ''} access granted</span>
                    </div>
                  </div>

                  {/* Module pills */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {member.allowed_modules.slice(0, 3).map(mod => {
                      const m = MODULES.find(x => x.key === mod);
                      return m ? (
                        <span key={mod} className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded text-[9px] font-bold border border-purple-200 dark:border-purple-800/60">
                          {m.name}
                        </span>
                      ) : null;
                    })}
                    {member.allowed_modules.length > 3 && (
                      <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[9px] font-bold border border-slate-200 dark:border-slate-700">
                        +{member.allowed_modules.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> View Profile
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Full-detail Table (owner only full view) ── */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Invited Staff Member</th>
                    <th className="px-4 py-3.5">Assigned Department</th>
                    <th className="px-5 py-3.5">Department Module Rights (Click to Toggle)</th>
                    <th className="px-4 py-3.5 text-right">Salary Package</th>
                    <th className="px-4 py-3.5 text-right">Actions (Double Verification)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredMembers.map((member) => {
                    const memberIsOwner = member.role === 'owner';
                    return (
                      <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-600/20">
                              {member.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-sm">{member.full_name}</p>
                              <p className="text-[11px] text-slate-400">{member.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className="px-3 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold rounded-xl text-[10px] border border-purple-200 dark:border-purple-800/60 inline-flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                            {member.department}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {MODULES.map((mod) => {
                              const hasAccess = member.allowed_modules.includes(mod.key);
                              return (
                                <button
                                  key={mod.key}
                                  disabled={!isOwner || memberIsOwner}
                                  onClick={() => handleToggleModuleAccess(member.id, mod.key)}
                                  title={memberIsOwner ? 'Owner has full access' : !isOwner ? 'Only Owner can modify permissions' : `Toggle ${mod.name} Department Access`}
                                  className={cn(
                                    'px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5 border cursor-pointer',
                                    hasAccess
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60 shadow-2xs'
                                      : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100',
                                    (!isOwner || memberIsOwner) && 'cursor-not-allowed'
                                  )}
                                >
                                  {hasAccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                                  <span>{mod.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right">
                          {(() => {
                            const fmt = formatSalaryDisplay((member as any).salary || '600000');
                            return (
                              <div className="flex flex-col items-end">
                                <span className="font-extrabold text-slate-900 dark:text-white text-xs bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-xl border border-purple-200 dark:border-purple-800/80 shadow-2xs">
                                  {fmt.formattedBadge}
                                </span>
                                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-0.5">
                                  {fmt.subtext}
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Action Buttons: Edit & Delete with Double Verification */}
                        <td className="px-4 py-4 text-right">
                          {isOwner && !memberIsOwner ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal(member)}
                                className="px-2.5 py-1.5 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1 border border-purple-200 dark:border-purple-800"
                                title="Edit Member Profile & Permissions"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => openDeleteConfirmModal(member)}
                                className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 rounded-xl transition-all border border-rose-200 dark:border-rose-900 cursor-pointer"
                                title="Delete Member (Double Verification)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 uppercase font-black">Primary Owner</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}

        {/* ═══════════════════════════════════════
            Member Profile Dossier Slide-Over Panel
        ═══════════════════════════════════════ */}
        {viewMemberDossier && (
          <div className="fixed inset-0 z-[200] flex">
            {/* Backdrop */}
            <div
              className="flex-1 bg-slate-950/60 backdrop-blur-xs"
              onClick={() => setViewMemberDossier(null)}
            />
            {/* Panel */}
            <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col animate-in slide-in-from-right">
              {/* Header */}
              <div className={`relative bg-gradient-to-br from-purple-700 to-indigo-700 px-6 pt-10 pb-8 flex-shrink-0`}>
                <button
                  onClick={() => setViewMemberDossier(null)}
                  className="absolute top-4 left-4 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl cursor-pointer transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-20 h-20 rounded-3xl bg-white/20 text-white font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white/30">
                    {viewMemberDossier.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{viewMemberDossier.full_name}</h2>
                    <p className="text-purple-200 text-xs mt-0.5">{viewMemberDossier.email}</p>
                    {viewMemberDossier.role === 'owner' && (
                      <span className="inline-flex items-center gap-1 mt-1.5 bg-amber-400/20 text-amber-200 border border-amber-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                        <Crown className="w-3 h-3" /> Primary Business Owner
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 p-6 space-y-5">
                {/* Department & Role */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Department & Role</h4>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold">Department</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{viewMemberDossier.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center">
                      <Users className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold">Role</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white capitalize">{viewMemberDossier.role || 'Department Staff'}</p>
                    </div>
                  </div>
                  {(viewMemberDossier as any).joinDate && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold">Joined</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{(viewMemberDossier as any).joinDate}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Module Rights */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Granted Module Access Rights</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {MODULES.map((mod) => {
                      const hasAccess = viewMemberDossier.allowed_modules.includes(mod.key);
                      return (
                        <div
                          key={mod.key}
                          className={cn(
                            'p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2 border',
                            hasAccess
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 opacity-60'
                          )}
                        >
                          {hasAccess
                            ? <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            : <X className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                          {mod.name}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Salary — ONLY visible to owner */}
                {isOwner && (viewMemberDossier as any).salary && (
                  <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl p-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-3">Salary Package (Confidential)</h4>
                    {(() => {
                      const fmt = formatSalaryDisplay((viewMemberDossier as any).salary);
                      const b = calculateSalaryBreakdown((viewMemberDossier as any).salary, true);
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Annual Package</span>
                            <span className="font-black text-lg text-purple-700 dark:text-purple-200">{fmt.formattedBadge}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-white dark:bg-slate-900 rounded-xl p-3 border border-purple-200">
                            <span className="text-slate-500">Monthly Gross</span><span className="font-black text-right text-slate-800 dark:text-slate-200">₹{b.ctcMonthly.toLocaleString('en-IN')}</span>
                            <span className="text-slate-500">Basic</span><span className="font-bold text-right text-slate-700 dark:text-slate-300">₹{b.basicMonthly.toLocaleString('en-IN')}</span>
                            <span className="text-slate-500">HRA</span><span className="font-bold text-right text-slate-700 dark:text-slate-300">₹{b.hraMonthly.toLocaleString('en-IN')}</span>
                            <span className="text-slate-500">PF</span><span className="font-bold text-right text-rose-600">-₹{b.pfDeduction.toLocaleString('en-IN')}</span>
                            <span className="text-slate-500">PT</span><span className="font-bold text-right text-rose-600">-₹{b.ptDeduction.toLocaleString('en-IN')}</span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-black col-span-1">Net In-Hand</span><span className="font-black text-right text-emerald-600 dark:text-emerald-400">₹{b.netInHandMonthly.toLocaleString('en-IN')}/mo</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Action buttons for owner */}
                {isOwner && viewMemberDossier.role !== 'owner' && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => { setViewMemberDossier(null); openEditModal(viewMemberDossier); }}
                      className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-purple-600/20"
                    >
                      <Edit3 className="w-4 h-4" /> Edit Profile & Rights
                    </button>
                    <button
                      onClick={() => { setViewMemberDossier(null); openDeleteConfirmModal(viewMemberDossier); }}
                      className="px-3 py-2.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 dark:border-rose-900 cursor-pointer transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Invite Department Member */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                  Invite Staff Department Member
                </h3>
                <button onClick={() => setShowInviteModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInviteDepartmentMember} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Staff Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Staff Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="rajesh.billing@company.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Company Department Division</label>
                  <select
                    value={memberDepartment}
                    onChange={(e) => setMemberDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Billing & Sales Dept">Billing & Sales Dept</option>
                    <option value="Accounts & Finance Dept">Accounts & Finance Dept</option>
                    <option value="HR & Payroll Dept">HR & Payroll Dept</option>
                    <option value="Stock & Inventory Dept">Stock & Inventory Dept</option>
                    <option value="CRM & Client Relations Dept">CRM & Client Relations Dept</option>
                    <option value="Daily Operations Dept">Daily Operations Dept</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Assign System Role</span>
                    <span className="text-[10px] text-purple-600 font-extrabold uppercase">Preset Auto-Config</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    {PRESET_ROLES.map((r) => {
                      const isSelected = inviteRole === r.key;
                      return (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => {
                            setInviteRole(r.key);
                            if (r.modules !== null) {
                              setSelectedModules(r.modules);
                            }
                          }}
                          className={cn(
                            "px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all text-left truncate cursor-pointer flex items-center justify-between",
                            isSelected
                              ? "bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-500/30"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                          )}
                        >
                          <span className="truncate">{r.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">Granted Module Access Rights</label>
                  <div className="grid grid-cols-2 gap-2">
                    {MODULES.map((mod) => {
                      const selected = selectedModules.includes(mod.key);
                      return (
                        <button
                          key={mod.key}
                          type="button"
                          onClick={() => {
                            const nextModules = selected
                              ? selectedModules.filter(m => m !== mod.key)
                              : [...selectedModules, mod.key];
                            setSelectedModules(nextModules);
                            setInviteRole(getMatchingRoleKey(nextModules));
                          }}
                          className={cn(
                            'p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border cursor-pointer transition-all',
                            selected
                              ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-400 shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          )}
                        >
                          <span>{mod.name}</span>
                          <div className={cn(
                            "w-4 h-4 rounded-md border flex items-center justify-center transition-all",
                            selected ? "bg-purple-600 border-purple-600 text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                          )}>
                            {selected ? <Check className="w-3 h-3 text-white" /> : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 cursor-pointer">
                    Send Staff Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Department Member (Step 1) */}
        {showEditModal && editingMember && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95">

              {/* Modal Header – Purple Gradient */}
              <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Edit Staff Member & Rights</h3>
                    <p className="text-[11px] text-purple-200 mt-0.5">Update member details and module access permissions</p>
                  </div>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto flex-1">
                <form onSubmit={handleEditSubmitStep1} className="p-6 space-y-5 text-xs">

                  {/* ── Section 1: Staff Info ── */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                      <Users className="w-3.5 h-3.5 text-purple-600" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Staff Information</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Staff Full Name *</label>
                        <input
                          type="text"
                          required
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Staff Email Address *</label>
                        <input
                          type="email"
                          required
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department Division</label>
                      <select
                        value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                      >
                        <option value="Billing & Sales Dept">Billing & Sales Dept</option>
                        <option value="Accounts & Finance Dept">Accounts & Finance Dept</option>
                        <option value="HR & Payroll Dept">HR & Payroll Dept</option>
                        <option value="Stock & Inventory Dept">Stock & Inventory Dept</option>
                        <option value="CRM & Client Relations Dept">CRM & Client Relations Dept</option>
                        <option value="Daily Operations Dept">Daily Operations Dept</option>
                      </select>
                    </div>
                  </div>

                  {/* ── Section 2: Salary ── */}
                  <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Calculator className="w-4 h-4 text-purple-600" />
                        Annual CTC Salary Package (₹)
                      </label>
                      <span className="text-[10px] text-purple-600 font-bold bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full">
                        Statutory Auto-Calculator
                      </span>
                    </div>
                    <input
                      type="number"
                      placeholder="e.g. 600000 (6 Lakhs)"
                      value={(editForm as any).salary !== undefined && (editForm as any).salary !== null ? String((editForm as any).salary).replace(/[^\d]/g, '') : ''}
                      onChange={(e) => setEditForm({ ...editForm, salary: e.target.value } as any)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-xl font-bold text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {(editForm as any).salary && parseFloat(String((editForm as any).salary).replace(/[^\d]/g, '')) > 0 && (() => {
                      const b = calculateSalaryBreakdown((editForm as any).salary, true);
                      return (
                        <div className="mt-2 p-3 bg-white dark:bg-slate-900 border border-purple-200 rounded-xl text-[11px]">
                          <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                            <span>Monthly Gross CTC: ₹{b.ctcMonthly.toLocaleString('en-IN')}</span>
                            <span className="text-emerald-600 font-black">Net In-Hand: ₹{b.netInHandMonthly.toLocaleString('en-IN')}/mo</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* ── Section 3: Role Presets ── */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assign System Role</span>
                      <span className="ml-auto text-[9px] font-black text-purple-600 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full uppercase tracking-wider">Preset Auto-Config</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_ROLES.map((r) => {
                        const isSelected = editRole === r.key;
                        return (
                          <button
                            key={r.key}
                            type="button"
                            onClick={() => {
                              setEditRole(r.key);
                              if (r.modules !== null) {
                                setEditForm(prev => ({ ...prev, allowed_modules: r.modules as ModuleKey[] }));
                              }
                            }}
                            className={cn(
                              "py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-between gap-1 cursor-pointer",
                              isSelected
                                ? "bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-400/30"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-300"
                            )}
                          >
                            <span className="truncate">{r.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Section 4: Module Access ── */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                      <Lock className="w-3.5 h-3.5 text-purple-600" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Granted Module Access Rights</span>
                      <span className="ml-auto text-[10px] font-bold text-slate-500">
                        {editForm.allowed_modules.length}/{MODULES.length} modules
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {MODULES.map((mod) => {
                        const selected = editForm.allowed_modules.includes(mod.key);
                        return (
                          <button
                            key={mod.key}
                            type="button"
                            onClick={() => {
                              const nextModules = selected
                                ? editForm.allowed_modules.filter(m => m !== mod.key)
                                : [...editForm.allowed_modules, mod.key];
                              setEditForm(prev => ({ ...prev, allowed_modules: nextModules }));
                              setEditRole(getMatchingRoleKey(nextModules));
                            }}
                            className={cn(
                              'p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border cursor-pointer transition-all',
                              selected
                                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-400'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-purple-300 hover:bg-purple-50/40'
                            )}
                          >
                            <span>{mod.name}</span>
                            <div className={cn(
                              "w-4 h-4 rounded-md border flex items-center justify-center transition-all flex-shrink-0",
                              selected ? "bg-purple-600 border-purple-600" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                            )}>
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Footer Buttons ── */}
                  <div className="pt-1 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md shadow-purple-600/20 cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Proceed to Verification
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Edit Double Verification Popup (Step 2 Button Confirmation) */}
        {showEditConfirmModal && editingMember && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[110] animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 text-center animate-in zoom-in-95">
              <div className="w-13 h-13 bg-purple-100 dark:bg-purple-950 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div>
                <span className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-full text-[10px] font-black uppercase">
                  Double Verification Required
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">Confirm Member Update?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to update department rights for <strong className="text-slate-800 dark:text-slate-200">{editForm.full_name}</strong>?
                </p>
              </div>

              <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 rounded-2xl text-left text-xs space-y-1.5 text-purple-900 dark:text-purple-200">
                <p><strong>Department:</strong> {editForm.department}</p>
                <p><strong>Granted Modules:</strong> {editForm.allowed_modules.length} selected</p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditConfirmModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEditFinal}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Yes, Confirm Update</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Delete Double Verification Popup (Step 2 Button Confirmation) */}
        {showDeleteConfirmModal && deletingMember && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[110] animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 text-center animate-in zoom-in-95">
              <div className="w-13 h-13 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <ShieldAlert className="w-7 h-7" />
              </div>

              <div>
                <span className="px-2.5 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Double Verification Security
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">Confirm Permanent Removal?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to remove staff member <strong className="text-slate-900 dark:text-white">{deletingMember.full_name}</strong> ({deletingMember.email}) from <strong className="text-purple-600">{deletingMember.department}</strong>?
                </p>
              </div>

              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-2xl text-left text-xs text-rose-800 dark:text-rose-300 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                  Warning: Revokes all department rights
                </p>
                <p className="text-[11px] text-rose-600/90 dark:text-rose-400">
                  This member will immediately lose access to all modules and will be removed from the department matrix.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setDeletingMember(null);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel & Keep
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDeleteFinal}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Yes, Confirm Permanent Deletion</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
  );
}
