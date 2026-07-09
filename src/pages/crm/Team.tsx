import React, { useState } from 'react'; // React hooks
import { useCrm } from '@/contexts/CrmContext';
import type { UserPermissions } from '@/contexts/CrmContext';
import { UserPlus, Trash2, Shield, Mail, X } from 'lucide-react';

export const Team: React.FC = () => {
  const { teamMembers, addTeamMember, deleteTeamMember } = useCrm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Invite Form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Sales Agent');
  const [permissions, setPermissions] = useState<UserPermissions>({
    viewLeads: true,
    manageLeads: false,
    viewTasks: true,
    manageTasks: true,
    viewAnalytics: false,
    manageSettings: false,
  });

  const handleRoleChange = (selectedRole: string) => {
    setRole(selectedRole);
    if (selectedRole === 'Sales Agent') {
      setPermissions({
        viewLeads: true,
        manageLeads: false,
        viewTasks: true,
        manageTasks: true,
        viewAnalytics: false,
        manageSettings: false,
      });
    } else if (selectedRole === 'Lead Manager') {
      setPermissions({
        viewLeads: true,
        manageLeads: true,
        viewTasks: true,
        manageTasks: false,
        viewAnalytics: true,
        manageSettings: false,
      });
    } else if (selectedRole === 'Task Manager') {
      setPermissions({
        viewLeads: false,
        manageLeads: false,
        viewTasks: true,
        manageTasks: true,
        viewAnalytics: false,
        manageSettings: false,
      });
    }
  };

  const handlePermissionToggle = (key: keyof UserPermissions) => {
    setRole('Custom');
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;

    await addTeamMember({
      email: email.trim(),
      name: name.trim(),
      role,
      permissions
    });

    // Reset fields
    setEmail('');
    setName('');
    handleRoleChange('Sales Agent');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-slate-800 dark:text-slate-100">
            Team Workspace Members
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Invite agents, assign workspace access permissions, and manage roles
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-all cursor-pointer"
        >
          <UserPlus className="w-5 h-5" /> Add Member
        </button>
      </div>

      {/* Helper Warning SQL Box */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl flex flex-col gap-1 text-xs text-blue-700 dark:text-blue-300">
        <span className="font-bold flex items-center gap-1.5 text-sm mb-1 text-blue-800 dark:text-blue-200">
          <Shield className="w-4.5 h-4.5" /> Database Integration Status
        </span>
        <p className="leading-relaxed">
          Invited members can register and log in to ApexCRM with their email. Once registered, they will instantly access your shared workspace. 
          If you have not run the Supabase SQL schema migrations yet, team member profiles will automatically fall back to local sandboxed sessions.
        </p>
      </div>

      {/* Members Directory Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Member Info</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Role Designation</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Access Scope Permissions</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 text-center w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {teamMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No active team members. Click "Add Member" to expand your workspace.
                  </td>
                </tr>
              ) : (
                teamMembers.map(member => {
                  const initials = member.name ? member.name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9.5 h-9.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold text-sm flex items-center justify-center flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-850 dark:text-slate-200">{member.name}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" /> {member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-150 dark:border-indigo-900/60">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {member.permissions.viewLeads && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-bold border border-emerald-100 dark:border-emerald-950">Leads View</span>
                          )}
                          {member.permissions.manageLeads && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-bold border border-emerald-100 dark:border-emerald-950">Leads CRUD</span>
                          )}
                          {member.permissions.viewTasks && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[10px] uppercase font-bold border border-blue-100 dark:border-blue-950">Tasks View</span>
                          )}
                          {member.permissions.manageTasks && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[10px] uppercase font-bold border border-blue-100 dark:border-blue-950">Tasks CRUD</span>
                          )}
                          {member.permissions.viewAnalytics && (
                            <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[10px] uppercase font-bold border border-amber-100 dark:border-amber-950">Analytics</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${member.name} from the workspace?`)) {
                              deleteTeamMember(member.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer inline-block"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Invite Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Invite Workspace Member
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-350">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 text-slate-805 dark:text-slate-150 outline-none transition-all"
                    placeholder="e.g. Rahul Verma"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-350">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 text-slate-805 dark:text-slate-150 outline-none transition-all"
                    placeholder="name@company.com"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-350">Access Role</label>
                  <select
                    value={role}
                    onChange={e => handleRoleChange(e.target.value)}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 text-slate-805 dark:text-slate-150 outline-none transition-all cursor-pointer"
                  >
                    <option value="Sales Agent">Sales Agent (Manage Tasks, View Leads)</option>
                    <option value="Lead Manager">Lead Manager (Manage Leads, View Analytics)</option>
                    <option value="Task Manager">Task Manager (Tasks Board Only)</option>
                    <option value="Custom">Custom Permissions...</option>
                  </select>
                </div>

                {/* Permissions Toggles Grid */}
                <div className="space-y-3 pt-2">
                  <span className="text-sm font-semibold text-slate-750 dark:text-slate-300 block">Configure Permissions Scope</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer select-none transition-colors">
                      <input
                        type="checkbox"
                        checked={permissions.viewLeads}
                        onChange={() => handlePermissionToggle('viewLeads')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">View Leads & Contacts</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer select-none transition-colors">
                      <input
                        type="checkbox"
                        checked={permissions.manageLeads}
                        onChange={() => handlePermissionToggle('manageLeads')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Create & Delete Leads</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer select-none transition-colors">
                      <input
                        type="checkbox"
                        checked={permissions.viewTasks}
                        onChange={() => handlePermissionToggle('viewTasks')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">View Task Board</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer select-none transition-colors">
                      <input
                        type="checkbox"
                        checked={permissions.manageTasks}
                        onChange={() => handlePermissionToggle('manageTasks')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Edit Kanban Status</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer select-none transition-colors md:col-span-2">
                      <input
                        type="checkbox"
                        checked={permissions.viewAnalytics}
                        onChange={() => handlePermissionToggle('viewAnalytics')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">View Sales Analytics Reports</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-305 rounded-xl font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all cursor-pointer"
                >
                  Add to Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
