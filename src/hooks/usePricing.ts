import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase, serviceSupabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserType, UserTypePricingMap, DEFAULT_USER_TYPE_PRICING } from "@/types/admin";

export interface PricingState {
  effectiveMonthly: number;
  effectiveYearly: number;
  platformMonthly: number;
  platformYearly: number;
  userCustomMonthly: number | null;
  userCustomYearly: number | null;
  userCustomPrice: number | null;
  userTypePricing: UserTypePricingMap;
  resolvedUserType: UserType;
  isCustomPricing: boolean;
  annualSavings: number;
  loading: boolean;
  refetchPricing: () => Promise<void>;
}

export function usePricing(): PricingState {
  const { user, profile, isStaff, effectiveUserId } = useAuth();
  const targetUid = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
  const cleanEmail = (user?.email || (profile as any)?.email || '').toLowerCase().trim();
  const [customUserType, setCustomUserType] = useState<UserType | null>(() => {
    return targetUid ? (localStorage.getItem(`escrow_user_type_${targetUid}`) as UserType) : null;
  });

  const resolvedUserType: UserType = (
    customUserType ||
    (profile as any)?.user_type ||
    user?.user_metadata?.user_type ||
    (targetUid ? (localStorage.getItem(`escrow_user_type_${targetUid}`) as UserType) : null) ||
    'normal'
  ) as UserType;

  // Dynamic Platform & User-Specific Pricing States initialized from cache
  const [platformMonthly, setPlatformMonthly] = useState<number>(() => {
    const cached = localStorage.getItem('escrow_platform_monthly');
    return cached && !isNaN(Number(cached)) && Number(cached) > 0 ? Number(cached) : 449;
  });

  const [platformYearly, setPlatformYearly] = useState<number>(() => {
    const cached = localStorage.getItem('escrow_platform_yearly');
    return cached && !isNaN(Number(cached)) && Number(cached) > 0 ? Number(cached) : 4499;
  });

  const [userTypePricing, setUserTypePricing] = useState<UserTypePricingMap>(() => {
    try {
      const cached = localStorage.getItem('escrow_pricing_by_user_type');
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULT_USER_TYPE_PRICING;
  });

  const [userCustomPrice, setUserCustomPrice] = useState<number | null>(null);

  const [userCustomMonthly, setUserCustomMonthly] = useState<number | null>(() => {
    const c1 = targetUid ? localStorage.getItem(`escrow_user_custom_monthly_${targetUid}`) : null;
    const c2 = cleanEmail ? localStorage.getItem(`escrow_user_custom_monthly_${cleanEmail}`) : null;
    const val = c1 || c2;
    return val && !isNaN(Number(val)) && Number(val) >= 0 ? Number(val) : null;
  });

  const [userCustomYearly, setUserCustomYearly] = useState<number | null>(() => {
    const c1 = targetUid ? localStorage.getItem(`escrow_user_custom_yearly_${targetUid}`) : null;
    const c2 = cleanEmail ? localStorage.getItem(`escrow_user_custom_yearly_${cleanEmail}`) : null;
    const val = c1 || c2;
    return val && !isNaN(Number(val)) && Number(val) >= 0 ? Number(val) : null;
  });

  const [loading, setLoading] = useState(false);

  // Fetch Pricing from system_settings
  const fetchPricing = useCallback(async () => {
    const clientToUse = serviceSupabase || supabase;
    try {
      setLoading(true);
      const keysToFetch = ['pricing_monthly', 'pricing_yearly', 'pricing_by_user_type'];
      if (targetUid) {
        keysToFetch.push(`user_plan_price_${targetUid}`);
        keysToFetch.push(`user_payment_record_${targetUid}`);
        keysToFetch.push(`user_type_${targetUid}`);
      }
      if (cleanEmail) {
        keysToFetch.push(`user_plan_price_${cleanEmail}`);
        keysToFetch.push(`user_payment_record_${cleanEmail}`);
      }

      const { data } = await (clientToUse as any)
        .from('system_settings')
        .select('key, value')
        .in('key', keysToFetch);

      // Clear previous custom pricing before applying fresh settings
      setUserCustomMonthly(null);
      setUserCustomYearly(null);
      setUserCustomPrice(null);

      if (data && Array.isArray(data)) {
        data.forEach((item: any) => {
          let val = item.value;
          try { val = typeof val === 'string' ? JSON.parse(val) : val; } catch {}

          if (item.key === 'pricing_monthly') {
            const num = Number(val);
            if (!isNaN(num) && num > 0) {
              setPlatformMonthly(num);
              localStorage.setItem('escrow_platform_monthly', String(num));
            }
          } else if (item.key === 'pricing_yearly') {
            const num = Number(val);
            if (!isNaN(num) && num > 0) {
              setPlatformYearly(num);
              localStorage.setItem('escrow_platform_yearly', String(num));
            }
          } else if (item.key === 'pricing_by_user_type') {
            if (val && typeof val === 'object') {
              setUserTypePricing(prev => ({ ...prev, ...val }));
              localStorage.setItem('escrow_pricing_by_user_type', JSON.stringify(val));
            }
          } else if (
            (targetUid && (item.key === `user_plan_price_${targetUid}` || item.key === `user_payment_record_${targetUid}`)) ||
            (cleanEmail && (item.key === `user_plan_price_${cleanEmail}` || item.key === `user_payment_record_${cleanEmail}`))
          ) {
            if (typeof val === 'object' && val !== null) {
              if (val.monthly !== undefined && !isNaN(Number(val.monthly)) && Number(val.monthly) >= 0) {
                const m = Number(val.monthly);
                setUserCustomMonthly(m);
                if (targetUid) localStorage.setItem(`escrow_user_custom_monthly_${targetUid}`, String(m));
                if (cleanEmail) localStorage.setItem(`escrow_user_custom_monthly_${cleanEmail}`, String(m));
              }
              if (val.yearly !== undefined && !isNaN(Number(val.yearly)) && Number(val.yearly) >= 0) {
                const y = Number(val.yearly);
                setUserCustomYearly(y);
                if (targetUid) localStorage.setItem(`escrow_user_custom_yearly_${targetUid}`, String(y));
                if (cleanEmail) localStorage.setItem(`escrow_user_custom_yearly_${cleanEmail}`, String(y));
              }
              if (val.amount !== undefined && !isNaN(Number(val.amount)) && Number(val.amount) >= 0) {
                setUserCustomPrice(Number(val.amount));
              }
            } else {
              const num = Number(val);
              if (!isNaN(num) && num >= 0) {
                setUserCustomPrice(num);
              }
            }
          } else if (targetUid && item.key === `user_type_${targetUid}`) {
            const rawType = typeof val === 'string' ? val : '';
            if (['normal', 'automobile', 'food_kitchen', 'cafe'].includes(rawType)) {
              setCustomUserType(rawType as UserType);
              localStorage.setItem(`escrow_user_type_${targetUid}`, rawType);
            }
          }
        });
      }

      // Check user_settings table as secondary resolution
      if (targetUid) {
        try {
          const { data: usRow } = await (clientToUse as any)
            .from('user_settings')
            .select('user_type')
            .eq('user_id', targetUid)
            .maybeSingle();
          if (usRow?.user_type && ['normal', 'automobile', 'food_kitchen', 'cafe'].includes(usRow.user_type)) {
            setCustomUserType(usRow.user_type as UserType);
            localStorage.setItem(`escrow_user_type_${targetUid}`, usRow.user_type);
          }
        } catch { }
      }
    } catch (err) {
      console.warn("[usePricing] Failed to fetch dynamic pricing:", err);
    } finally {
      setLoading(false);
    }
  }, [targetUid, cleanEmail]);

  useEffect(() => {
    if (!targetUid && !cleanEmail) {
      setUserCustomMonthly(null);
      setUserCustomYearly(null);
      setUserCustomPrice(null);
    }
  }, [targetUid, cleanEmail]);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  // Realtime Synchronization via window events and unique DB channel
  useEffect(() => {
    // 1. Listen to broadcast events forwarded by AuthContext
    const handlePlatformUpdate = (e: any) => {
      const { monthly, yearly } = e.detail || {};
      if (monthly && !isNaN(Number(monthly))) {
        setPlatformMonthly(Number(monthly));
        localStorage.setItem('escrow_platform_monthly', String(monthly));
      }
      if (yearly && !isNaN(Number(yearly))) {
        setPlatformYearly(Number(yearly));
        localStorage.setItem('escrow_platform_yearly', String(yearly));
      }
    };

    const handleUserTypeUpdate = (e: any) => {
      const { userTypePricing: map } = e.detail || {};
      if (map) {
        setUserTypePricing(prev => ({ ...prev, ...map }));
        localStorage.setItem('escrow_pricing_by_user_type', JSON.stringify(map));
      }
    };

    const handlePlanUpdate = (e: any) => {
      const data = e.detail;
      const matches = data && (
        (targetUid && data.userId === targetUid) ||
        (cleanEmail && data.email && cleanEmail === String(data.email).toLowerCase().trim())
      );
      if (matches) {
        if (data.customMonthlyPrice !== undefined) {
          const m = Number(data.customMonthlyPrice);
          if (!isNaN(m) && m >= 0) {
            setUserCustomMonthly(m);
            if (targetUid) localStorage.setItem(`escrow_user_custom_monthly_${targetUid}`, String(m));
            if (cleanEmail) localStorage.setItem(`escrow_user_custom_monthly_${cleanEmail}`, String(m));
          }
        }
        if (data.customYearlyPrice !== undefined) {
          const y = Number(data.customYearlyPrice);
          if (!isNaN(y) && y >= 0) {
            setUserCustomYearly(y);
            if (targetUid) localStorage.setItem(`escrow_user_custom_yearly_${targetUid}`, String(y));
            if (cleanEmail) localStorage.setItem(`escrow_user_custom_yearly_${cleanEmail}`, String(y));
          }
        }
        if (data.customPrice !== undefined) {
          const c = Number(data.customPrice);
          if (!isNaN(c) && c >= 0) setUserCustomPrice(c);
        }
      }
    };

    window.addEventListener('escrow_platform_pricing_updated', handlePlatformUpdate);
    window.addEventListener('escrow_user_type_pricing_updated', handleUserTypeUpdate);
    window.addEventListener('escrow_plan_updated', handlePlanUpdate);

    // 2. Database changes on system_settings using a dedicated unique channel
    const uniqueChName = `pricing_sub_${Math.random().toString(36).substring(2, 9)}`;
    const dbChannel = supabase
      .channel(uniqueChName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
        fetchPricing();
      })
      .subscribe();

    return () => {
      window.removeEventListener('escrow_platform_pricing_updated', handlePlatformUpdate);
      window.removeEventListener('escrow_user_type_pricing_updated', handleUserTypeUpdate);
      window.removeEventListener('escrow_plan_updated', handlePlanUpdate);
      supabase.removeChannel(dbChannel);
    };
  }, [targetUid, cleanEmail, fetchPricing]);

  const effectiveMonthly = useMemo(() => {
    const typeRate = userTypePricing[resolvedUserType]?.monthly;
    // An intentional custom price overrides category rate ONLY IF it's not a legacy platform fallback
    if (userCustomMonthly !== null && userCustomMonthly !== undefined && userCustomMonthly !== 449 && userCustomMonthly !== platformMonthly) {
      return userCustomMonthly;
    }
    if (userCustomPrice !== null && userCustomPrice !== undefined && userCustomPrice !== 449 && userCustomPrice !== platformMonthly && profile?.plan_type !== 'yearly') {
      return userCustomPrice;
    }
    if (typeRate && !isNaN(typeRate) && typeRate > 0) return typeRate;
    if (userCustomMonthly !== null && userCustomMonthly !== undefined) return userCustomMonthly;
    return platformMonthly;
  }, [userCustomMonthly, userCustomPrice, profile?.plan_type, userTypePricing, resolvedUserType, platformMonthly]);

  const effectiveYearly = useMemo(() => {
    const typeRate = userTypePricing[resolvedUserType]?.yearly;
    // An intentional custom price overrides category rate ONLY IF it's not a legacy platform fallback
    if (userCustomYearly !== null && userCustomYearly !== undefined && userCustomYearly !== 4499 && userCustomYearly !== platformYearly) {
      return userCustomYearly;
    }
    if (userCustomPrice !== null && userCustomPrice !== undefined && userCustomPrice !== 4499 && userCustomPrice !== platformYearly && profile?.plan_type === 'yearly') {
      return userCustomPrice;
    }
    if (typeRate && !isNaN(typeRate) && typeRate > 0) return typeRate;
    if (userCustomYearly !== null && userCustomYearly !== undefined) return userCustomYearly;
    return platformYearly;
  }, [userCustomYearly, userCustomPrice, profile?.plan_type, userTypePricing, resolvedUserType, platformYearly]);

  const isCustomPricing = useMemo(() => {
    const typeMonthly = userTypePricing[resolvedUserType]?.monthly;
    const typeYearly = userTypePricing[resolvedUserType]?.yearly;
    const hasCustomM = userCustomMonthly !== null && userCustomMonthly !== undefined && userCustomMonthly !== 449 && userCustomMonthly !== platformMonthly && userCustomMonthly !== typeMonthly;
    const hasCustomY = userCustomYearly !== null && userCustomYearly !== undefined && userCustomYearly !== 4499 && userCustomYearly !== platformYearly && userCustomYearly !== typeYearly;
    const hasCustomP = userCustomPrice !== null && userCustomPrice !== undefined && userCustomPrice !== 449 && userCustomPrice !== 4499 && userCustomPrice !== platformMonthly && userCustomPrice !== platformYearly && userCustomPrice !== typeMonthly && userCustomPrice !== typeYearly;
    return Boolean(hasCustomM || hasCustomY || hasCustomP);
  }, [userCustomMonthly, userCustomYearly, userCustomPrice, userTypePricing, resolvedUserType, platformMonthly, platformYearly]);

  const annualSavings = Math.max(0, (effectiveMonthly * 12) - effectiveYearly);

  return {
    effectiveMonthly,
    effectiveYearly,
    platformMonthly,
    platformYearly,
    userCustomMonthly,
    userCustomYearly,
    userCustomPrice,
    userTypePricing,
    resolvedUserType,
    isCustomPricing,
    annualSavings,
    loading,
    refetchPricing: fetchPricing
  };
}

