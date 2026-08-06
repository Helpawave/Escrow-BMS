import React, { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  Briefcase,
  Check,
  X,
  Users,
  Calendar,
  ShieldCheck,
  Crown,
  BadgeCheck,
  Mail,
  Building2,
} from 'lucide-react';

export default function MyProfilePage() {
  const { user, profile } = useAuth();

  // Load this member's record from local storage
  const myRecord = useMemo(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('company_department_invited_members_v2') || '[]');
      return saved.find((m: any) => m.email?.toLowerCase() === user?.email?.toLowerCase()) || null;
    } catch {
      return null;
    }
  }, [user?.email]);

  const isOwner = profile?.role === 'admin' || myRecord?.role === 'owner' || !myRecord;
  const myModules: string[] = myRecord?.allowed_modules || MODULES.map(m => m.key);

  const avatarColors = ['from-purple-600 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-rose-500 to-pink-600'];
  const avatarColor = avatarColors[(user?.email?.charCodeAt(0) || 0) % avatarColors.length];

  const initials = myRecord?.full_name
    ? myRecord.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email || 'U').charAt(0).toUpperCase();

  const displayName = myRecord?.full_name || profile?.full_name || user?.email?.split('@')[0] || 'Team Member';
  const displayDept = myRecord?.department || profile?.company_name || '—';
  const displayRole = isOwner ? 'Business Owner' : (myRecord?.role || 'Department Staff');
  const joinedOn = myRecord?.invited_at?.substring(0, 10) || profile?.created_at?.substring?.(0, 10) || null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page title */}
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">My Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Your personal department profile &amp; module access information</p>
        </div>

        {/* Hero Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          {/* Banner */}
          <div className={`bg-gradient-to-br from-purple-700 to-indigo-700 px-8 py-10 flex flex-col sm:flex-row items-center gap-6`}>
            <div className={`w-24 h-24 rounded-3xl bg-white/20 border-2 border-white/30 text-white font-black text-3xl flex items-center justify-center shadow-lg flex-shrink-0`}>
              {initials}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-black text-white leading-tight">{displayName}</h2>
              <p className="text-purple-200 text-sm mt-0.5 flex items-center gap-1.5 justify-center sm:justify-start">
                <Mail className="w-3.5 h-3.5" />
                {user?.email}
              </p>
              {isOwner ? (
                <span className="inline-flex items-center gap-1.5 mt-2 bg-amber-400/20 text-amber-200 border border-amber-400/30 text-[11px] font-black px-3 py-1 rounded-full">
                  <Crown className="w-3 h-3" /> Primary Business Owner
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 mt-2 bg-white/10 text-white border border-white/20 text-[11px] font-black px-3 py-1 rounded-full">
                  <BadgeCheck className="w-3 h-3 text-emerald-300" /> Department Staff Member
                </span>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center mb-2">
                  <Briefcase className="w-4.5 h-4.5 text-purple-600" />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Department</p>
                <p className="font-black text-foreground text-sm">{displayDept}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center mb-2">
                  <Users className="w-4.5 h-4.5 text-indigo-600" />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Role</p>
                <p className="font-black text-foreground text-sm capitalize">{displayRole}</p>
              </div>
              {joinedOn && (
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mb-2">
                    <Calendar className="w-4.5 h-4.5 text-emerald-600" />
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Joined</p>
                  <p className="font-black text-foreground text-sm">{joinedOn}</p>
                </div>
              )}
            </div>

            {/* Module Access Rights */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <h3 className="font-black text-sm text-foreground uppercase tracking-wide">Granted Module Access Rights</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {MODULES.map((mod) => {
                  const hasAccess = myModules.includes(mod.key);
                  return (
                    <div
                      key={mod.key}
                      className={cn(
                        'p-3 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all',
                        hasAccess
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 opacity-60'
                      )}
                    >
                      {hasAccess
                        ? <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        : <X className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
                      {mod.name}
                    </div>
                  );
                })}
              </div>
              {!isOwner && (
                <p className="text-[11px] text-muted-foreground mt-3">
                  * Module access rights are assigned by the Business Owner. Contact them to request access changes.
                </p>
              )}
            </div>

            {/* Company Info */}
            {profile?.company_name && (
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-black text-sm text-foreground uppercase tracking-wide">Company</h3>
                </div>
                <p className="font-bold text-foreground">{profile.company_name}</p>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
