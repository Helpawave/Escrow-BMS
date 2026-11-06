import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES, type ModuleKey } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { CountryPhoneInput } from '@/components/ui/CountryPhoneInput';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Lock,
  Key,
  Eye,
  EyeOff,
  Check,
  X,
  ShieldCheck,
  Save,
  Loader2,
  Crown,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function MyProfilePage() {
  const {
    user,
    profile,
    isStaff,
    staffRole,
    staffPermissions,
    companyProfile,
    updateProfile,
    updatePassword,
    refreshProfile
  } = useAuth();

  // ── Profile Information Form State ──
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Password Change Form State ──
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPwd, setUpdatingPwd] = useState(false);

  // Initialize form fields when profile/user loads
  useEffect(() => {
    const prof = profile as any;
    if (prof) {
      setFullName(prof.full_name || prof.name || user?.user_metadata?.full_name || '');
      setPhone(prof.phone || prof.mobile || user?.user_metadata?.phone || '');
    } else if (user) {
      setFullName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
      setPhone(user.user_metadata?.phone || '');
    }
  }, [profile, user]);

  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email || 'U').charAt(0).toUpperCase();

  const displayCompanyName =
    companyProfile?.company_name || (profile as any)?.company_name || user?.user_metadata?.company_name || 'Business Workspace';

  const assignedModules: ModuleKey[] = isStaff
    ? ((staffPermissions && staffPermissions.length > 0
        ? staffPermissions
        : user?.user_metadata?.allowed_modules || (profile as any)?.allowed_modules || []) as ModuleKey[])
    : (MODULES.map((m) => m.key) as ModuleKey[]);

  // ── 1. Save Personal Details ──
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Please enter your full name.');
      return;
    }

    setSavingProfile(true);
    try {
      // 1. Update in profiles table
      const { error: profileErr } = await (updateProfile as any)({
        full_name: fullName.trim(),
        name: fullName.trim(),
        phone: phone.trim(),
        mobile: phone.trim()
      });
      if (profileErr) throw profileErr;

      // 2. Update Supabase Auth metadata
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            mobile: phone.trim()
          }
        });
      } catch (metaErr) {
        console.warn('Auth user metadata update note:', metaErr);
      }

      // 3. Sync to employees table if staff employee record exists
      if (user?.email) {
        try {
          await (supabase as any)
            .from('employees')
            .update({
              name: fullName.trim(),
              phone: phone.trim()
            })
            .eq('email', user.email.trim().toLowerCase());
        } catch (empErr) {
          console.warn('Employees sync note:', empErr);
        }
      }

      await refreshProfile();
      toast.success('Profile details updated successfully!');
    } catch (err: any) {
      console.error('Save profile error:', err);
      toast.error(err?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── 2. Update Login Password ──
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      toast.error('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match. Please re-enter.');
      return;
    }

    setUpdatingPwd(true);
    try {
      const { error: pwdErr } = await updatePassword(newPassword);
      if (pwdErr) throw pwdErr;

      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully! You can now log in with your new password.');
    } catch (err: any) {
      console.error('Update password error:', err);
      toast.error(err?.message || 'Failed to update password.');
    } finally {
      setUpdatingPwd(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
          My Profile
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
          {isStaff
            ? 'Manage your staff profile credentials and view your granted module access rights'
            : 'Manage your personal business profile and account login credentials'}
        </p>
      </div>

      {/* Hero Banner Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-6 sm:px-8 py-8 flex flex-col sm:flex-row items-center sm:items-center gap-5 text-white">
          <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/30 text-white font-black text-2xl flex items-center justify-center shadow-lg flex-shrink-0 backdrop-blur-sm">
            {initials}
          </div>
          <div className="text-center sm:text-left flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-black leading-tight truncate">
              {fullName || user?.email?.split('@')[0] || 'User'}
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm mt-0.5 flex items-center gap-1.5 justify-center sm:justify-start truncate">
              <Mail className="w-3.5 h-3.5 flex-shrink-0 text-indigo-200" />
              <span>{user?.email}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2.5 justify-center sm:justify-start">
              {isStaff ? (
                <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-200 border border-amber-300/30 text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs">
                  <BadgeCheck className="w-3.5 h-3.5 text-amber-300" />
                  {staffRole || 'Staff Member'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs">
                  <Crown className="w-3.5 h-3.5 text-emerald-300" />
                  Business Owner
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-white border border-white/20 text-[11px] font-bold px-3 py-0.5 rounded-full truncate">
                <Building2 className="w-3 h-3 text-indigo-200 flex-shrink-0" />
                <span className="truncate max-w-[200px]">{displayCompanyName}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Details Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Workspace</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{displayCompanyName}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Role / Designation</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 truncate capitalize">
                {isStaff ? (staffRole || 'Staff Member') : 'Business Owner (Administrator)'}
              </p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Account
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── CARD 1: Edit Personal Details ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Personal Information
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update your full name and contact phone number
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Phone / Mobile Number
              </label>
              <CountryPhoneInput
                value={phone}
                onChange={(val) => setPhone(val)}
                placeholder="e.g. 98765 43210"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-sm font-semibold text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Email is fixed as your primary login identifier.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile Details</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── CARD 2: Change Password ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Change Password
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update your account password for secure login access
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Must be at least 6 characters. Use letters and numbers for higher strength.
            </p>

            <button
              type="submit"
              disabled={updatingPwd || !newPassword}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              {updatingPwd ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── CARD 3: Granted Module Permissions ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Assigned Module Permissions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isStaff
                  ? `Modules permitted for role: ${staffRole || 'Staff'}`
                  : 'Full business access across all system modules'}
              </p>
            </div>
          </div>
          {isStaff && (
            <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Managed By Admin
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          {MODULES.map((mod) => {
            const hasAccess = assignedModules.includes(mod.key);
            const Icon = mod.icon;
            return (
              <div
                key={mod.key}
                className={cn(
                  'p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-3 transition-all',
                  hasAccess
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800 shadow-2xs'
                    : 'bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 border-slate-200/70 dark:border-slate-800 opacity-60'
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0',
                    hasAccess
                      ? 'bg-emerald-500 text-white shadow-2xs'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black">{mod.name}</p>
                  <p className="text-[10px] font-medium opacity-80 truncate">
                    {hasAccess ? 'Active Access' : 'Locked'}
                  </p>
                </div>
                {hasAccess ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {isStaff && (
          <p className="text-[11px] font-medium text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            * Module rights are assigned strictly by the business owner. Contact your manager or business owner to request permission changes.
          </p>
        )}
      </div>
    </div>
  );
}
