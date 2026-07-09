import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, Activity, Database, Key, ShieldCheck, Mail, UserPlus, 
  Trash2, Edit, ChevronDown, CheckCircle, BarChart3, Settings, ShieldAlert, Lock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Manager' | 'Auditor' | 'Staff';
  dateAdded: string;
}

export default function ClientAdminDashboard() {
  const { user, profile } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Invite employee form
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeeRole, setEmployeeRole] = useState<'Owner' | 'Manager' | 'Auditor' | 'Staff'>('Staff');

  // Business settings form
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');

  // Workspace Lock States
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [enterPassword, setEnterPassword] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [mainPassword, setMainPassword] = useState('');
  const [lockError, setLockError] = useState('');

  const [stats, setStats] = useState({
    totalParties: 0,
    totalTransactions: 0,
    totalLeads: 0,
    totalExpenses: 0,
  });

  useEffect(() => {
    if (user && profile) {
      loadWorkspaceData();
    }
  }, [user, profile]);

  const loadWorkspaceData = async () => {
    if (!user || !profile) return;
    
    // Load company configurations
    setCompanyName(profile.company_name || '');
    setCompanyPhone(profile.phone || '');
    setCompanyAddress(localStorage.getItem(`bms_company_address_${user.id}`) || '123 Main Business Way');

    const savedPassword = (profile as any).workspace_admin_password;
    if (!savedPassword) {
      setShowSetup(true);
    } else {
      setShowSetup(false);
    }

    try {
      // Load team members from profiles
      const { data: members } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_name', profile.company_name || '');
        
      if (members) {
        setTeam(members.map((m: any) => ({
          id: m.id,
          name: m.full_name || 'Team Member',
          email: m.email || 'No Email',
          role: m.role === 'admin' ? 'Owner' : 'Staff',
          dateAdded: m.created_at || new Date().toISOString()
        })));
      }

      // Load aggregated counts from Supabase
      const [partiesRes, transactionsRes, leadsRes, expensesRes] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('expenses').select('amount').eq('user_id', user.id)
      ]);

      setStats({
        totalParties: partiesRes.count || 0,
        totalTransactions: transactionsRes.count || 0,
        totalLeads: leadsRes.count || 0,
        totalExpenses: (expensesRes.data || []).reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0)
      });
    } catch (e) {
      console.error("Error loading Supabase workspace statistics:", e);
    }
  };

  const handleInviteEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !employeeName || !employeeEmail) return;

    const exists = team.some((m) => m.email.toLowerCase() === employeeEmail.toLowerCase());
    if (exists) {
      toast.error('This email is already invited or exists in your workspace!');
      return;
    }

    // For a real implementation, you'd call a Supabase Edge Function to invite a user to the workspace.
    toast.success(`Successfully invited ${employeeName} as ${employeeRole}!`);
    setEmployeeName('');
    setEmployeeEmail('');
    setEmployeeRole('Staff');
    setIsModalOpen(false);
    loadWorkspaceData();
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!user) return;
    if (memberId === user.id) {
      toast.error('You cannot remove the primary workspace Owner!');
      return;
    }

    toast.success('Team member removal requested.');
  };

  const handleSaveCompanyConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Save address locally (since profiles table doesn't have address column yet)
      localStorage.setItem(`bms_company_address_${user.id}`, companyAddress);

      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: companyName,
          phone: companyPhone
        })
        .eq('id', user.id);
        
      if (error) {
        toast.error(`Supabase update error: ${error.message}`);
        return;
      }

      toast.success('Workspace profile settings saved successfully!');
      loadWorkspaceData();
    } catch (err: any) {
      toast.error(`Error saving to Supabase: ${err.message}`);
      return;
    }
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLockError('');
    if (adminPassword !== confirmPassword) {
      setLockError("Passwords don't match!");
      return;
    }
    if (adminPassword.length < 4) {
      setLockError("Password must be at least 4 characters.");
      return;
    }
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ workspace_admin_password: adminPassword })
        .eq('id', user!.id);
      if (error) throw error;
      toast.success('Workspace admin password configured successfully!');
      setIsUnlocked(true);
      setShowSetup(false);
      setAdminPassword('');
      setConfirmPassword('');
      // Reload profile properties in AuthContext
      window.location.reload();
    } catch (err: any) {
      setLockError(err.message || 'Failed to configure password.');
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setLockError('');
    const savedPassword = (profile as any).workspace_admin_password;
    if (enterPassword === savedPassword) {
      setIsUnlocked(true);
      setEnterPassword('');
    } else {
      setLockError('Incorrect password! Please try again.');
    }
  };

  const handleResetWorkspacePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLockError('');
    try {
      // Re-authenticate using their main profile credentials
      const { error } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: mainPassword
      });
      if (error) {
        setLockError('Incorrect main account password!');
        return;
      }
      
      // Successfully re-authenticated, delete lock password so they can re-configure it
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ workspace_admin_password: null })
        .eq('id', user!.id);
        
      if (updateError) throw updateError;
      
      toast.success('Lock password cleared. Please set up a new password.');
      setShowSetup(true);
      setShowForgot(false);
      setMainPassword('');
    } catch (err: any) {
      setLockError(err.message || 'Verification failed.');
    }
  };

  const handleEditRole = async (member: TeamMember, nextRole: 'Owner' | 'Manager' | 'Auditor' | 'Staff') => {
    if (!user) return;
    if (member.id === user.id) {
      toast.error("You cannot change the primary workspace Owner's role!");
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: nextRole === 'Owner' ? 'admin' : 'user' })
        .eq('id', member.id);
        
      if (error) throw error;

      toast.success(`Updated ${member.name}'s role to ${nextRole}`);
      loadWorkspaceData();
    } catch (err: any) {
      toast.error(`Error updating role: ${err.message}`);
    }
  };

  return (
    <AppLayout>
      {!isUnlocked ? (
        <div className="max-w-md mx-auto my-12 animate-fade-in">
          {showSetup ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-50">Setup Workspace Admin Lock</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Set a secondary password to restrict access to company profile configurations, stats, and team roles.
                </p>
              </div>

              {lockError && (
                <div className="bg-red-50 dark:bg-red-550/10 text-red-600 dark:text-red-400 text-xs font-semibold p-3.5 rounded-xl border border-red-100 dark:border-red-950/20">
                  {lockError}
                </div>
              )}

              <form onSubmit={handleSetupPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Choose Password</label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-50 text-xs font-bold rounded-xl focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-50 text-xs font-bold rounded-xl focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-all"
                >
                  Save & Enable Lock
                </button>
              </form>
            </div>
          ) : showForgot ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-50">Reset Workspace Password</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter your main platform password to verify identity and reset Workspace Admin lock.
                </p>
              </div>

              {lockError && (
                <div className="bg-red-50 dark:bg-red-550/10 text-red-600 dark:text-red-400 text-xs font-semibold p-3.5 rounded-xl border border-red-100 dark:border-red-950/20">
                  {lockError}
                </div>
              )}

              <form onSubmit={handleResetWorkspacePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Main Account Password</label>
                  <input
                    type="password"
                    required
                    value={mainPassword}
                    onChange={(e) => setMainPassword(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-50 text-xs font-bold rounded-xl focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-all"
                >
                  Verify & Reset Lock
                </button>

                <button
                  type="button"
                  onClick={() => { setShowForgot(false); setLockError(''); }}
                  className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-700 block mt-2"
                >
                  Cancel
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-50">Workspace Admin Locked</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Please enter your secondary admin password to access company profile and configurations.
                </p>
              </div>

              {lockError && (
                <div className="bg-red-50 dark:bg-red-550/10 text-red-600 dark:text-red-400 text-xs font-semibold p-3.5 rounded-xl border border-red-100 dark:border-red-950/20">
                  {lockError}
                </div>
              )}

              <form onSubmit={handleUnlock} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Admin Password</label>
                    <button
                      type="button"
                      onClick={() => { setShowForgot(true); setLockError(''); }}
                      className="text-xs font-bold text-indigo-650 hover:text-indigo-750 dark:text-indigo-400"
                    >
                      Forgot Lock Password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={enterPassword}
                    onChange={(e) => setEnterPassword(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-50 text-xs font-bold rounded-xl focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-all"
                >
                  Unlock Admin Panel
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
            Workspace Administration
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Manage your company profile, add employee logins, and allocate role permissions for this workspace.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Active Team Members', value: team.length, color: 'text-amber-600', icon: <Users className="w-5 h-5 text-amber-600" /> },
            { label: 'Workspace Customers', value: stats.totalParties, color: 'text-emerald-600', icon: <Database className="w-5 h-5 text-emerald-600" /> },
            { label: 'Sales Transactions', value: stats.totalTransactions, color: 'text-blue-600', icon: <Activity className="w-5 h-5 text-blue-600" /> },
            { label: 'Platform CRM Leads', value: stats.totalLeads, color: 'text-purple-600', icon: <ChevronDown className="w-5 h-5 text-purple-600 rotate-180" /> },
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{card.label}</p>
                <p className="text-3xl font-black text-slate-900 dark:text-slate-50">{card.value}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-850">{card.icon}</div>
            </div>
          ))}
        </div>

        {/* Two-Column Setup */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Team / Employee Management */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-5 mb-5">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-50">Workspace Members & Roles</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Control staff access configurations and routing privileges</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Add Team Member
                </button>
              </div>

              {/* Members Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-3">Name / Email</th>
                      <th className="py-3.5 px-3">Workspace Role</th>
                      <th className="py-3.5 px-3">Access Tier Details</th>
                      <th className="py-3.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map((member) => (
                      <tr key={member.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors">
                        <td className="py-4 px-3">
                          <p className="font-extrabold text-slate-900 dark:text-slate-50">{member.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{member.email}</p>
                        </td>
                        <td className="py-4 px-3">
                          <select
                            value={member.role}
                            onChange={(e) => handleEditRole(member, e.target.value as any)}
                            disabled={member.id === `member-${user?.id}`}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-100 font-semibold px-2 py-1 rounded-lg focus:outline-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="Owner">Owner</option>
                            <option value="Manager">Manager</option>
                            <option value="Auditor">Auditor</option>
                            <option value="Staff">Staff</option>
                          </select>
                        </td>
                        <td className="py-4 px-3 font-medium text-slate-500">
                          {member.role === 'Owner' && 'Full platform operations'}
                          {member.role === 'Manager' && 'Full edits except configuration'}
                          {member.role === 'Auditor' && 'Read-only financial audit logs'}
                          {member.role === 'Staff' && 'Restricted operational metrics'}
                        </td>
                        <td className="py-4 px-3 text-right">
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            disabled={member.id === `member-${user?.id}`}
                            className="p-1.5 text-rose-500 hover:bg-rose-55 hover:text-rose-600 rounded-lg transition-all disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Business Configuration Profile Settings */}
          <div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50">Workspace Profile</h2>
                <p className="text-xs text-slate-400 mt-0.5">Edit operational settings and coordinates</p>
              </div>

              <form onSubmit={handleSaveCompanyConfig} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Company Legal Title</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-50 text-xs font-bold rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Contact Coordinates</label>
                  <input
                    type="text"
                    required
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-50 text-xs font-bold rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Physical Address</label>
                  <textarea
                    required
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full min-h-20 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-50 text-xs font-bold rounded-xl focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-all"
                >
                  Save Profile coordinates
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Invite Team Member Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-2xl space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-850 pb-4">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-50">Add Workspace Member</h3>
                <p className="text-xs text-slate-400 mt-1">Configure profile and access capabilities</p>
              </div>

              <form onSubmit={handleInviteEmployee} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-50 text-xs font-bold rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="john@company.com"
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-50 text-xs font-bold rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Access Role</label>
                  <select
                    value={employeeRole}
                    onChange={(e) => setEmployeeRole(e.target.value as any)}
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl focus:outline-none cursor-pointer"
                  >
                    <option value="Manager">Manager</option>
                    <option value="Auditor">Auditor</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-850">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-sm"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-all"
                  >
                    Invite Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      )}
    </AppLayout>
  );
}
