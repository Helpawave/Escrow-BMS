import React, { useState } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  RefreshCw,
  Download,
  Moon,
  Sun,
  User,
  Mail,
  Briefcase,
  Lock,
  LogOut
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, toggleTheme, resetDatabase, leads, tasks, activities, triggerToast } = useCrm();
  const { user, updateProfile, logout } = useAuth();

  const [name, setName] = useState<string>(user?.name || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [role, setRole] = useState<string>(user?.role || '');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false);

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the CRM database? This deletes all custom changes.')) {
      resetDatabase();
    }
  };

  const handleExport = () => {
    const data = {
      leads,
      tasks,
      activities
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apexcrm_react_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('JSON configuration backup file exported.', 'success');
  };

  const handleUpdateProfileDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      triggerToast('Name and Email cannot be empty.', 'error');
      return;
    }

    setProfileLoading(true);
    const { error } = await updateProfile({ name: name.trim(), role, email: email.trim() });
    if (!error) {
      triggerToast('Profile details updated successfully.', 'success');
    } else {
      triggerToast('Email is already in use by another user.', 'error');
    }
    setProfileLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      triggerToast('Please fill all password fields.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      triggerToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('Passwords do not match.', 'error');
      return;
    }

    setPasswordLoading(true);

    const { error } = await updateProfile({ name, role, email, password: newPassword });
    if (!error) {
      triggerToast('Password updated successfully.', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      triggerToast('Failed to update password.', 'error');
    }
    setPasswordLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* View Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-slate-800 dark:text-slate-100">
          System Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage your user profile and local dashboard databases
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Details Card */}
        <div className="glass-panel rounded-2xl shadow-md p-6 lg:col-span-2 space-y-5">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" /> Personal Profile Info
            </span>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Update your account details and CRM access authorization role
            </p>
          </div>

          <form onSubmit={handleUpdateProfileDetails} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-450 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-450 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Access Role</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-450 pointer-events-none" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm outline-none focus:border-blue-500 appearance-none cursor-pointer"
                >
                  <option value="Sales Agent">Sales Agent</option>
                  <option value="Sales Director">Sales Director</option>
                  <option value="CRM Manager">CRM Manager</option>
                  <option value="Data Analyst">Data Analyst</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center gap-4">
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 px-4 h-10 border border-rose-200 dark:border-rose-950 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
              <button
                type="submit"
                disabled={profileLoading}
                className="px-5 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                {profileLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="glass-panel rounded-2xl shadow-md p-6 space-y-5">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-500" /> Security Settings
            </span>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Change your password credentials securely
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {passwordLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      <div className="glass-panel rounded-2xl divide-y divide-slate-200 dark:divide-slate-800 shadow-md">
        {/* Settings item: Theme Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 gap-4">
          <div className="space-y-1">
            <span className="text-base font-bold text-slate-800 dark:text-slate-100">Visual Theme Mode</span>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-lg leading-relaxed">
              Switch visual elements to Dark Theme for reduced eye-strain or use default Light Theme
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center gap-2 px-5 h-10 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 rounded-xl font-semibold outline-none cursor-pointer transition-all self-start sm:self-center"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-blue-500" /> Switch to Dark Mode
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500" /> Switch to Light Mode
              </>
            )}
          </button>
        </div>

        {/* Settings item: Sandbox Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 gap-4">
          <div className="space-y-1">
            <span className="text-base font-bold text-slate-800 dark:text-slate-100">Regenerate Mock Database</span>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-lg leading-relaxed">
              Purges current storage and loads realistic baseline client lists, pipeline deals, and task records
            </p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-5 h-10 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-700 rounded-xl font-semibold outline-none cursor-pointer transition-all self-start sm:self-center"
          >
            <RefreshCw className="w-4 h-4" /> Reset Database
          </button>
        </div>

        {/* Settings item: Export Data */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 gap-4">
          <div className="space-y-1">
            <span className="text-base font-bold text-slate-800 dark:text-slate-100">Backup Local Database</span>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-lg leading-relaxed">
              Downloads local storage configuration values in JSON format for safekeeping
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-5 h-10 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 rounded-xl font-semibold outline-none cursor-pointer transition-all self-start sm:self-center"
          >
            <Download className="w-4 h-4" /> Export JSON
          </button>
        </div>
      </div>
    </div>
  );
};
