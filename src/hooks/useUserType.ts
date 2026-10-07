import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserType = 'normal' | 'automobile' | 'food_kitchen';

// Global singleton cache & listener registry across all components to prevent duplicate channel creation
let globalUserType: UserType = 'normal';
let globalUserId: string | null = null;
let globalLoading = true;
let globalChannel: ReturnType<typeof supabase.channel> | null = null;
const globalListeners = new Set<(type: UserType, loading: boolean) => void>();

function notifyListeners() {
  globalListeners.forEach(fn => fn(globalUserType, globalLoading));
}

async function fetchUserTypeGlobal(targetUserId: string, companyName: string) {
  try {
    // 1. Try user_settings first
    const { data } = await (supabase as any)
      .from('user_settings')
      .select('user_type')
      .eq('user_id', targetUserId)
      .maybeSingle();

    const setting = data as { user_type?: string } | null;

    if (setting?.user_type && ['normal', 'automobile', 'food_kitchen'].includes(setting.user_type)) {
      globalUserType = setting.user_type as UserType;
      globalLoading = false;
      notifyListeners();
      return;
    }

    // 2. Check system_settings where admin sets it
    const { data: sysSetting } = await (supabase as any)
      .from('system_settings')
      .select('value')
      .eq('key', `user_type_${targetUserId}`)
      .maybeSingle();

    if (sysSetting?.value) {
      let cleanVal = sysSetting.value;
      try { cleanVal = typeof cleanVal === 'string' ? JSON.parse(cleanVal) : cleanVal; } catch {}
      if (['normal', 'automobile', 'food_kitchen'].includes(cleanVal)) {
        globalUserType = cleanVal as UserType;
        globalLoading = false;
        notifyListeners();
        return;
      }
    }

    // 3. Fallback heuristic
    if (companyName.includes('geeta') || companyName.includes('cloud kitchen')) {
      globalUserType = 'food_kitchen';
    } else {
      globalUserType = 'normal';
    }
  } catch {
    globalUserType = 'normal';
  } finally {
    globalLoading = false;
    notifyListeners();
  }
}

function ensureGlobalChannel(targetUserId: string, companyName: string) {
  if (globalUserId === targetUserId && globalChannel) {
    return;
  }

  // If user changed, clean up old channel
  if (globalChannel) {
    try {
      supabase.removeChannel(globalChannel);
    } catch {}
    globalChannel = null;
  }

  globalUserId = targetUserId;
  const channelName = `user_type_sync_${targetUserId}`;

  try {
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_settings',
          filter: `user_id=eq.${targetUserId}`
        },
        (payload: any) => {
          const newType = payload?.new?.user_type;
          if (newType && ['normal', 'automobile', 'food_kitchen'].includes(newType)) {
            globalUserType = newType as UserType;
            globalLoading = false;
            notifyListeners();
          } else {
            void fetchUserTypeGlobal(targetUserId, companyName);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings',
          filter: `key=eq.user_type_${targetUserId}`
        },
        (payload: any) => {
          let val = payload?.new?.value;
          try { val = typeof val === 'string' ? JSON.parse(val) : val; } catch {}
          if (val && ['normal', 'automobile', 'food_kitchen'].includes(val)) {
            globalUserType = val as UserType;
            globalLoading = false;
            notifyListeners();
          } else {
            void fetchUserTypeGlobal(targetUserId, companyName);
          }
        }
      )
      .subscribe();

    globalChannel = channel;
  } catch (err) {
    console.warn('Could not establish user_type realtime subscription:', err);
  }
}

/**
 * Hook to fetch and return the user_type for the currently authenticated user.
 * Reads from user_settings table with system_settings fallback.
 * Uses a single singleton channel to eliminate "cannot add callbacks after subscribe" errors.
 */
export function useUserType() {
  const { user, effectiveUserId, profile, companyProfile } = useAuth();
  const targetUserId = effectiveUserId || user?.id;

  const [userType, setUserType] = useState<UserType>(globalUserType);
  const [userTypeLoading, setUserTypeLoading] = useState<boolean>(globalLoading);

  const companyName =
    companyProfile?.company_name?.toLowerCase() ||
    profile?.company_name?.toLowerCase() ||
    '';

  const refetch = useCallback(() => {
    if (targetUserId) {
      void fetchUserTypeGlobal(targetUserId, companyName);
    }
  }, [targetUserId, companyName]);

  useEffect(() => {
    if (!targetUserId) {
      setUserTypeLoading(false);
      return;
    }

    const listener = (newType: UserType, loading: boolean) => {
      setUserType(newType);
      setUserTypeLoading(loading);
    };

    globalListeners.add(listener);

    // Initial fetch if user changed or not loaded yet
    if (globalUserId !== targetUserId || globalLoading) {
      void fetchUserTypeGlobal(targetUserId, companyName);
    } else {
      setUserType(globalUserType);
      setUserTypeLoading(false);
    }

    ensureGlobalChannel(targetUserId, companyName);

    const onFocus = () => {
      if (targetUserId) {
        void fetchUserTypeGlobal(targetUserId, companyName);
      }
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', onFocus);

    return () => {
      globalListeners.delete(listener);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onFocus);

      // If all components unmounted, clean up channel
      if (globalListeners.size === 0 && globalChannel) {
        try {
          supabase.removeChannel(globalChannel);
        } catch {}
        globalChannel = null;
        globalUserId = null;
      }
    };
  }, [targetUserId, companyName]);

  const isAutomobile = userType === 'automobile';
  const isFoodKitchen = userType === 'food_kitchen';
  const isNormal = userType === 'normal';

  return { userType, userTypeLoading, isAutomobile, isFoodKitchen, isNormal, refetchUserType: refetch };
}
