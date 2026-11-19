import React from 'react';

export const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const getUserDisplayName = (u?: { company_name?: string | null; email?: string | null; mobile?: string | null } | null): string => {
  if (!u) return 'Business Account';
  const comp = (u.company_name || '').trim();
  const lower = comp.toLowerCase();
  const isInvalid = !comp || ['n/a', 'null', 'company', 'undefined', 'individual profile', 'individual account', 'individual'].includes(lower);
  if (!isInvalid) return comp;
  if (u.email) {
    const prefix = u.email.split('@')[0];
    const formatted = prefix.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return formatted || 'Business Account';
  }
  if (u.mobile) return u.mobile;
  return 'Business Account';
};

export const getUserInitial = (u?: { company_name?: string | null; email?: string | null } | null): string => {
  const name = getUserDisplayName(u);
  return (name ? name.charAt(0) : 'U').toUpperCase();
};

export const getSubscriptionCountdown = (expiresAt: string | null | undefined) => {
  if (!expiresAt) return "No active plan";
  const expiry = new Date(expiresAt);
  if (isNaN(expiry.getTime())) return "No active plan";
  const diff = expiry.getTime() - Date.now();

  if (diff <= 0) return "Account access expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 365) return "Permanent / Lifetime";
  if (days > 0) return `${days} days and ${hours} hours left`;
  return `${hours}h ${minutes}m remaining`;
};

export const calculateNewExpiresAt = (
  mode: 'from_today' | 'keep' | 'extend' | 'custom',
  status: 'paid' | 'trial' | 'expired',
  presetDays: string,
  customDate: string,
  existingExpiresAt: string | null | undefined
): string | null => {
  if (status === 'expired') {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString();
  }

  if (mode === 'keep') {
    if (existingExpiresAt) return existingExpiresAt;
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString();
  }

  if (mode === 'custom') {
    if (!customDate) return new Date().toISOString();
    return new Date(customDate + 'T23:59:59.999Z').toISOString();
  }

  if (mode === 'extend') {
    const days = parseInt(presetDays, 10) || 30;
    let baseDate = new Date();
    if (existingExpiresAt && new Date(existingExpiresAt) > baseDate) {
      baseDate = new Date(existingExpiresAt);
    }
    baseDate.setDate(baseDate.getDate() + days);
    return baseDate.toISOString();
  }

  // Default 'from_today' (prevents runaway year-on-year / month-on-month stacking)
  const days = parseInt(presetDays, 10) || 30;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export interface SubscriptionStatusInfo {
  status: string;
  color: string;
  badgeColor: string;
  label: string;
  daysLeft: number;
  isExpired: boolean;
  isActive: boolean;
  isTrial: boolean;
  typeLabel: string;
}

export const getSubscriptionStatus = (
  expiresAt: string | null | undefined,
  planType: string | null | undefined,
  isPaid: boolean = false,
  _createdAt?: string
): SubscriptionStatusInfo => {
  let expiry: Date;

  if (expiresAt) {
    expiry = new Date(expiresAt);
  } else if (_createdAt) {
    // If subscription_expires_at is not explicitly set, calculate 7-day trial from registration date
    const createdDate = new Date(_createdAt);
    expiry = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else {
    return {
      status: 'Expired',
      color: 'bg-rose-100 text-rose-600 border-rose-200',
      badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30',
      label: 'Expired',
      daysLeft: 0,
      isExpired: true,
      isActive: false,
      isTrial: false,
      typeLabel: 'Expired'
    };
  }

  const diff = expiry.getTime() - Date.now();
  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

  const typeLabel = planType === 'enterprise' ? 'Enterprise' : planType === 'free' ? 'Free Trial' : (daysLeft > 180 || planType === 'yearly') ? 'Yearly' : 'Monthly';

  if (diff <= 0) {
    return {
      status: 'Expired',
      color: 'bg-rose-100 text-rose-600 border-rose-200',
      badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30',
      label: 'Expired',
      daysLeft: Math.max(0, daysLeft),
      isExpired: true,
      isActive: false,
      isTrial: false,
      typeLabel
    };
  }

  if (isPaid) {
    return {
      status: `Paid Plan - ${typeLabel}`,
      color: 'bg-blue-100 text-blue-600 border-blue-200',
      badgeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30',
      label: `Active • ${typeLabel}`,
      daysLeft,
      isExpired: false,
      isActive: true,
      isTrial: false,
      typeLabel
    };
  }

  if (daysLeft > 180 || planType === 'yearly') {
    return {
      status: `Free Trial - Yearly`,
      color: 'bg-emerald-100 text-emerald-600 border-emerald-200',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
      label: 'Active Trial (Yearly)',
      daysLeft,
      isExpired: false,
      isActive: true,
      isTrial: true,
      typeLabel: 'Yearly'
    };
  }

  if (daysLeft <= 7) {
    return {
      status: 'Expiring Soon',
      color: 'bg-amber-100 text-amber-600 border-amber-200',
      badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
      label: `Expiring Soon (${daysLeft}d)`,
      daysLeft,
      isExpired: false,
      isActive: true,
      isTrial: true,
      typeLabel
    };
  }

  return {
    status: `Free Trial - ${typeLabel}`,
    color: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
    label: `Active Trial (${daysLeft}d)`,
    daysLeft,
    isExpired: false,
    isActive: true,
    isTrial: true,
    typeLabel
  };
};
