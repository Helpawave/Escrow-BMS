import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { MODULES, type ModuleKey } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import {
  Users,
  UserCheck,
  Shield,
  ShieldCheck,
  Lock,
  Search,
  UserPlus,
  Check,
  X,
  Loader2,
  RefreshCw,
  Building2,
  Mail,
  Edit3,
  Trash2,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';

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

export interface SystemUser {
  id: string;
  full_name: string;
  email: string;
  company_name: string;
  created_at: string;
}

export default function UsersAndMembers({ defaultTab = 'members' }: { defaultTab?: 'users' | 'members' }) {
  const { profile: currentProfile } = useAuth();
  const { refresh: refreshSubscription } = useSubscription();
  const [activeTab, setActiveTab] = useState<'users' | 'members'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Check if current user is Main Company Owner
  const isOwner = currentProfile?.role === 'owner' || currentProfile?.role === 'super_admin' || !currentProfile?.role || currentProfile?.role === 'admin';

  // State for Invited Company Department Members
  const [invitedMembers, setInvitedMembers] = useState<CompanyMember[]>(() => {
    const saved = localStorage.getItem('company_department_invited_members');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: currentProfile?.id || 'owner-account',
        full_name: currentProfile?.full_name || 'Company Director (Main Owner)',
        email: currentProfile?.email || 'owner@company.com',
        department: 'Executive Board',
        role: 'owner',
        allowed_modules: ['billing', 'ledger', 'payroll', 'inventory', 'crm', 'hisab'],
        invited_at: new Date().toISOString().substring(0, 10),
        status: 'active'
      },
      {
        id: 'member-dept-101',
        full_name: 'Vikram Singh',
        email: 'vikram.billing@company.com',
        department: 'Billing & Sales Dept',
        role: 'member',
        allowed_modules: ['billing', 'ledger'],
        invited_at: '2026-02-10',
        status: 'active'
      },
      {
        id: 'member-dept-102',
        full_name: 'Ananya Sharma',
        email: 'ananya.payroll@company.com',
        department: 'HR & Payroll Dept',
        role: 'member',
        allowed_modules: ['payroll', 'hisab'],
        invited_at: '2026-03-01',
        status: 'active'
      }
    ];
  });

  // State for System Users Directory
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);

  // Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberDepartment, setMemberDepartment] = useState('Billing & Sales Dept');
  const [selectedModules, setSelectedModules] = useState<ModuleKey[]>(['billing']);

  useEffect(() => {
    localStorage.setItem('company_department_invited_members', JSON.stringify(invitedMembers));
  }, [invitedMembers]);

  // Fetch Users & Members Data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch System Users from Supabase profiles
      const { data: profilesData } = user 
        ? await supabase.from('profiles').select('*').eq('id', user.id)
        : { data: [] };
      if (profilesData && profilesData.length > 0) {
        const usersMapped: SystemUser[] = profilesData.map((p: any) => ({
          id: p.id,
          full_name: p.full_name || p.email?.split('@')[0] || 'User',
          email: p.email || 'no-email',
          company_name: p.company_name || 'Registered Business',
          created_at: p.created_at ? p.created_at.substring(0, 10) : new Date().toISOString().substring(0, 10)
        }));
        setSystemUsers(usersMapped);
      } else {
        setSystemUsers([
          {
            id: currentProfile?.id || 'u-1',
            full_name: currentProfile?.full_name || 'System Admin',
            email: currentProfile?.email || 'admin@escrow.com',
            company_name: currentProfile?.company_name || 'Main Enterprise',
            created_at: '2026-01-01'
          }
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleModuleAccess = async (memberId: string, moduleKey: ModuleKey) => {
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

        // Cache locally for instant access control check
        localStorage.setItem(`bms_permissions_${m.id}`, JSON.stringify(nextMods));
        
        return {
          ...m,
          allowed_modules: nextMods
        };
      }
      return m;
    });

    setInvitedMembers(updated);
    toast.success('Department module permission updated successfully!');
    refreshSubscription();
  };

  const handleInviteDepartmentMember = (e: React.FormEvent) => {
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

    setMemberName('');
    setMemberEmail('');
    setSelectedModules(['billing']);
    setShowInviteModal(false);

    toast.success(`Department invitation sent to ${memberEmail}! Authorized for ${selectedModules.length} modules.`);
  };

  const handleRemoveMember = (memberId: string) => {
    if (!isOwner) return;
    const updated = invitedMembers.filter(m => m.id !== memberId);
    setInvitedMembers(updated);
    toast.success('Department member removed successfully');
  };

  const filteredMembers = invitedMembers.filter(m =>
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = systemUsers.filter(u =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Banner Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Building2 className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">Company & Department Management</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Invite company staff members & grant department-specific module read/write access
              </p>
            </div>
          </div>

          <div>
            {isOwner && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Invite Department Member</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('members')}
            className={cn(
              'pb-3 text-xs font-bold flex items-center gap-2 transition-colors relative cursor-pointer',
              activeTab === 'members'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Invited Company Members ({invitedMembers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              'pb-3 text-xs font-bold flex items-center gap-2 transition-colors relative cursor-pointer',
              activeTab === 'users'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            )}
          >
            <Users className="w-4 h-4" />
            <span>System Registered Users Directory ({systemUsers.length})</span>
          </button>
        </div>

        {/* Notice Info */}
        {!isOwner ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs">
            <Lock className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <div>
              <span className="font-bold">Member Department Scope:</span> You can view your team members. You have full read/write access ONLY inside the specific department modules assigned to you by the Primary Owner.
            </div>
          </div>
        ) : (
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-xl flex items-center gap-3 text-indigo-800 dark:text-indigo-300 text-xs">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-indigo-600" />
            <div>
              <span className="font-bold">Owner Department Control:</span> Members are explicitly invited by email. Click any module badge below to grant or revoke full department read/write access for that member.
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={activeTab === 'members' ? "Search invited member by name, email or department..." : "Search system user by name, email or company..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Members Tab View */}
        {activeTab === 'members' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Invited Member Details</th>
                    <th className="px-4 py-3.5">Department</th>
                    <th className="px-5 py-3.5">Assigned Department Modules (Owner Toggle)</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredMembers.map((member) => {
                    const memberIsOwner = member.role === 'owner';
                    return (
                      <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                              {member.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{member.full_name}</p>
                              <p className="text-[11px] text-slate-400">{member.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-[10px] inline-flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-indigo-500" />
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
                                    'px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 border cursor-pointer',
                                    hasAccess
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60 shadow-2xs'
                                      : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100',
                                    (!isOwner || memberIsOwner) && 'cursor-not-allowed'
                                  )}
                                >
                                  {hasAccess ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                                  <span>{mod.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right">
                          {isOwner && !memberIsOwner ? (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              title="Remove Invited Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Owner</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab View */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">User Profile</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">Registered Business</th>
                    <th className="px-4 py-3.5 text-right">Registered On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700">
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-500">{user.email}</td>
                      <td className="px-4 py-4 font-semibold text-indigo-600 dark:text-indigo-400">{user.company_name}</td>
                      <td className="px-4 py-4 text-right text-slate-400">{user.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Invite Department Member */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                  Invite Department Member
                </h3>
                <button onClick={() => setShowInviteModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInviteDepartmentMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Staff Member Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Staff Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="rajesh.billing@company.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Company Department</label>
                  <select
                    value={memberDepartment}
                    onChange={(e) => setMemberDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Assign Department Module Access (Read & Write)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {MODULES.map((mod) => {
                      const selected = selectedModules.includes(mod.key);
                      return (
                        <button
                          key={mod.key}
                          type="button"
                          onClick={() => {
                            setSelectedModules(prev => 
                              selected ? prev.filter(m => m !== mod.key) : [...prev, mod.key]
                            );
                          }}
                          className={cn(
                            'p-2 rounded-xl text-xs font-bold flex items-center justify-between border cursor-pointer transition-all',
                            selected
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-400'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                          )}
                        >
                          <span>{mod.name}</span>
                          {selected ? <Check className="w-3.5 h-3.5 text-indigo-600" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20">
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
  );
}
