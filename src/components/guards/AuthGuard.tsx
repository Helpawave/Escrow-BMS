import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ children, redirectTo = '/auth' }: AuthGuardProps) {
  const { user, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

// For superadmin-only platform routes
export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Redirect logged-in users away from public pages UNLESS they are in password recovery flow or explicitly viewing auth
export function PublicOnlyGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  // Check if current URL is part of password recovery flow or explicit auth view/switch
  const isBypassFlow = 
    typeof window !== 'undefined' && (
      window.location.hash.includes('type=recovery') || 
      window.location.search.includes('mode=reset-password') ||
      window.location.pathname.includes('reset-password') ||
      window.location.search.includes('switch') ||
      window.location.search.includes('action=login') ||
      window.location.search.includes('action=signup') ||
      window.location.search.includes('force')
    );

  // If user is authenticated via recovery token or deliberately switching account, allow auth view
  if (user && !isBypassFlow) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
