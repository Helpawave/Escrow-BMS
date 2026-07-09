import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isSubscribed, isBlocked, isBusinessSetup } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Connecting...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect blocked users immediately
  if (isBlocked === true) {
    return <Navigate to="/blocked-account" replace />;
  }

  // Redirect to business setup if details are missing
  if (isBusinessSetup === false && location.pathname !== '/setup-business') {
    return <Navigate to="/setup-business" replace />;
  }

  // Redirect expired subscriptions immediately
  // We now handle this via a modal in the Layout to keep the dashboard context visible
  /*
  if (isSubscribed === false && location.pathname !== '/subscription-required') {
    return <Navigate to="/subscription-required" replace />;
  }
  */

  return <>{children}</>;
}
