import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, serviceSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserType = 'normal' | 'automobile' | 'food_kitchen' | 'cafe';

function getCachedUserType(userId?: string | null): UserType | null {
  if (!userId) return null;
  try {
    const cached = localStorage.getItem(`escrow_user_type_${userId}`);
    if (cached && ['normal', 'automobile', 'food_kitchen', 'cafe'].includes(cached)) {
      return cached as UserType;
    }
  } catch {}
  return null;
}

function setCachedUserType(userId: string, type: UserType) {
  try {
    localStorage.setItem(`escrow_user_type_${userId}`, type);
  } catch {}
}

export function resetUserTypeCache() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('escrow_user_type_')) {
        localStorage.removeItem(key);
      }
    }
  } catch {}
}

// Clear user_type cache on auth sign out
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    resetUserTypeCache();
  }
});

// Singleton Realtime Subscription Manager to eliminate duplicate subscription errors
let activeChannel: any = null;
let activeChannelId: string | null = null;
let channelSubscriberCount = 0;
const typeListeners = new Set<(type: UserType) => void>();

function notifyAllListeners(type: UserType, primaryId: string) {
  setCachedUserType(primaryId, type);
  typeListeners.forEach(listener => {
    try { listener(type); } catch (e) { console.warn('Listener notification error:', e); }
  });
}

function subscribeRealtimeType(primaryId: string, onUpdate: (type: UserType) => void) {
  typeListeners.add(onUpdate);
  channelSubscriberCount++;

  if (!activeChannel || activeChannelId !== primaryId) {
    if (activeChannel) {
      try { supabase.removeChannel(activeChannel); } catch {}
    }
    activeChannelId = primaryId;
    try {
      activeChannel = supabase
        .channel(`user_type_channel_${primaryId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'system_settings',
            filter: `key=eq.user_type_${primaryId}`
          },
          (payload: any) => {
            let val = payload?.new?.value;
            try { val = typeof val === 'string' ? JSON.parse(val) : val; } catch {}
            if (val && ['normal', 'automobile', 'food_kitchen', 'cafe'].includes(val)) {
              notifyAllListeners(val as UserType, primaryId);
            }
          }
        )
        .on(
          'broadcast',
          { event: 'type_updated' },
          (payload: any) => {
            const newType = payload?.payload?.userType;
            if (newType && ['normal', 'automobile', 'food_kitchen', 'cafe'].includes(newType)) {
              notifyAllListeners(newType as UserType, primaryId);
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription suppressed safe notice:', err);
    }
  }

  return () => {
    typeListeners.delete(onUpdate);
    channelSubscriberCount--;
    if (channelSubscriberCount <= 0 && activeChannel) {
      try {
        supabase.removeChannel(activeChannel);
      } catch {}
      activeChannel = null;
      activeChannelId = null;
      channelSubscriberCount = 0;
    }
  };
}

/**
 * Universal hook to fetch and return the user_type for the currently authenticated user.
 * 
 * Simple, deterministic & reactive:
 * 1. Checks business identity / company name first (e.g. Escrow Cafe -> 'cafe').
 * 2. Checks session metadata & system_settings (key: user_type_<id>).
 * 3. Staff accounts inherit their company owner's type.
 * 4. Multi-subscriber singleton prevents Supabase Realtime errors.
 */
export function useUserType() {
  const { user, isStaff, companyOwnerId, effectiveUserId, profile, companyProfile } = useAuth();
  
  // For staff members, target is companyOwnerId; for company owners, target is user.id
  const targetUserId = (isStaff && companyOwnerId) ? companyOwnerId : (effectiveUserId || user?.id);

  // Synchronous resolution on initial render
  const resolveInitialType = useCallback((): UserType => {
    // 0. User-scoped cache check (highest priority, strictly isolated per user)
    if (targetUserId) {
      const cached = getCachedUserType(targetUserId);
      if (cached) {
        if (cached !== 'cafe') {
          try { localStorage.removeItem('escrow_company_is_cafe'); } catch {}
        }
        return cached;
      }
    }
    if (user?.id && user.id !== targetUserId) {
      const cachedUser = getCachedUserType(user.id);
      if (cachedUser) {
        if (cachedUser !== 'cafe') {
          try { localStorage.removeItem('escrow_company_is_cafe'); } catch {}
        }
        return cachedUser;
      }
    }

    // 1. User / Session metadata (explicit user choice at registration or admin update)
    const metaType = (user?.user_metadata?.user_type || (user as any)?.raw_user_meta_data?.user_type) as UserType;
    if (metaType && ['normal', 'automobile', 'food_kitchen', 'cafe'].includes(metaType)) {
      if (metaType === 'cafe') {
        try { localStorage.setItem('escrow_company_is_cafe', 'true'); } catch {}
      } else {
        try { localStorage.removeItem('escrow_company_is_cafe'); } catch {}
      }
      return metaType;
    }

    // 2. Staff kitchen permission check (when staff allocated with kitchen rights)
    try {
      if (typeof window !== 'undefined' && isStaff) {
        const perms = localStorage.getItem('escrow_staff_permissions');
        if (perms && perms.includes('kitchen')) {
          return 'cafe';
        }
      }
    } catch {}

    try { localStorage.removeItem('escrow_company_is_cafe'); } catch {}
    return 'normal';
  }, [user, targetUserId, isStaff]);

  const [userType, setUserType] = useState<UserType>(() => resolveInitialType());
  const [userTypeLoading, setUserTypeLoading] = useState<boolean>(false);

  // Sync state if profile/metadata arrives asynchronously after initial mount
  useEffect(() => {
    const fastResolved = resolveInitialType();
    setUserType(fastResolved);
    if (targetUserId) setCachedUserType(targetUserId, fastResolved);
  }, [resolveInitialType, targetUserId]);

  const fetchAndSyncUserType = useCallback(async () => {
    const checkIds = [targetUserId, companyOwnerId, user?.id].filter(Boolean) as string[];
    if (checkIds.length === 0) {
      return;
    }

    try {
      const client = serviceSupabase || supabase;

      // 1. Primary Source of Truth: system_settings table (where Admin & Onboarding write)
      for (const uid of checkIds) {
        const { data: sysSetting } = await (client as any)
          .from('system_settings')
          .select('value')
          .eq('key', `user_type_${uid}`)
          .maybeSingle();

        if (sysSetting?.value) {
          let cleanVal = sysSetting.value;
          if (typeof cleanVal === 'string') {
            cleanVal = cleanVal.replace(/^"|"$/g, '').trim();
          }
          try { cleanVal = typeof cleanVal === 'string' ? JSON.parse(cleanVal) : cleanVal; } catch {}
          if (cleanVal && ['normal', 'automobile', 'food_kitchen', 'cafe'].includes(cleanVal)) {
            const finalType = cleanVal as UserType;
            setUserType(finalType);
            checkIds.forEach(id => setCachedUserType(id, finalType));
            if (finalType === 'cafe') {
              try { localStorage.setItem('escrow_company_is_cafe', 'true'); } catch {}
            } else {
              try { localStorage.removeItem('escrow_company_is_cafe'); } catch {}
            }
            return;
          }
        }
      }

      // 2. Fallback: Check explicit user_type column from profiles
      for (const uid of checkIds) {
        const { data: prof } = await (client as any)
          .from('profiles')
          .select('user_type')
          .eq('user_id', uid)
          .maybeSingle();

        if (prof?.user_type && ['normal', 'automobile', 'food_kitchen', 'cafe'].includes(prof.user_type)) {
          const finalType = prof.user_type as UserType;
          setUserType(finalType);
          if (finalType === 'cafe') {
            try { localStorage.setItem('escrow_company_is_cafe', 'true'); } catch {}
          } else {
            try { localStorage.removeItem('escrow_company_is_cafe'); } catch {}
          }
          checkIds.forEach(id => setCachedUserType(id, finalType));
          return;
        }
      }

      // 3. Fallback: User metadata
      const meta = user?.user_metadata?.user_type;
      if (meta && ['normal', 'automobile', 'food_kitchen', 'cafe'].includes(meta)) {
        const finalType = meta as UserType;
        setUserType(finalType);
        if (finalType === 'cafe') {
          try { localStorage.setItem('escrow_company_is_cafe', 'true'); } catch {}
        } else {
          try { localStorage.removeItem('escrow_company_is_cafe'); } catch {}
        }
        checkIds.forEach(id => setCachedUserType(id, finalType));
        return;
      }

      // 4. Default: normal
      setUserType('normal');
      checkIds.forEach(id => setCachedUserType(id, 'normal'));
      try { localStorage.removeItem('escrow_company_is_cafe'); } catch {}
    } catch (err) {
      console.warn('Safe notice synchronizing user_type:', err);
    }
  }, [targetUserId, companyOwnerId, user]);

  useEffect(() => {
    void fetchAndSyncUserType();

    const primaryId = targetUserId || user?.id || '';
    if (!primaryId) return;

    // Use singleton subscription to eliminate duplicate subscribe callback errors
    const unsubscribe = subscribeRealtimeType(primaryId, (newType) => {
      setUserType(newType);
    });

    return () => {
      unsubscribe();
    };
  }, [targetUserId, user?.id, fetchAndSyncUserType]);

  const isAutomobile = userType === 'automobile';
  const isFoodKitchen = userType === 'food_kitchen';
  const isCafe = userType === 'cafe';
  const isNormal = userType === 'normal';

  return {
    userType,
    userTypeLoading,
    isAutomobile,
    isFoodKitchen,
    isCafe,
    isNormal,
    refetchUserType: fetchAndSyncUserType
  };
}
