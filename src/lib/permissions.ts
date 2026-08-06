export type AppRole = 'admin' | 'accountant' | 'sales' | 'hr' | 'view' | 'custom';

export const ROLE_LABELS: Record<AppRole | string, string> = {
  admin: 'Admin',
  accountant: 'Accountant',
  sales: 'Sales',
  hr: 'HR',
  view: 'View Only',
  custom: 'Custom Role',
};

export const ROLE_DESCRIPTIONS: Record<AppRole | string, string> = {
  admin: 'Full access to all modules & business settings',
  accountant: 'Access to Account Ledger, Billing, Daily Calc & Inventory',
  sales: 'Access to CRM pipeline & lead management',
  hr: 'Access to Payroll, Employees, Leave & Payslips',
  view: 'Read-only access to all modules (no editing)',
  custom: 'Custom module access configured by Admin',
};

export const ROLE_BADGE_STYLES: Record<AppRole | string, string> = {
  admin: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  accountant: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  sales: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  hr: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  view: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  custom: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

/**
 * Checks if a given user role has access to a specific module
 */
export function hasRoleModuleAccess(role: string | null | undefined, moduleKey: string): boolean {
  if (!role || role === 'dashboard') return true;
  const r = role.toLowerCase();

  // Admin, Custom (defaults to true for non-restricted), View have full module visibility
  if (r === 'admin' || r === 'view' || r === 'custom' || r === 'super_admin' || r === 'user' || r === 'owner') {
    return true;
  }

  switch (r) {
    case 'accountant':
      return ['ledger', 'billing', 'hisab', 'inventory', 'members', 'reports', 'settings', 'dashboard'].includes(moduleKey);
    case 'sales':
      return ['crm', 'reports', 'settings', 'dashboard'].includes(moduleKey);
    case 'hr':
      return ['payroll', 'members', 'reports', 'settings', 'dashboard'].includes(moduleKey);
    default:
      return true;
  }
}

/**
 * Returns default home route for a given user role
 */
export function getDefaultRouteForRole(role: string | null | undefined): string {
  if (!role) return '/dashboard';
  const r = role.toLowerCase();

  switch (r) {
    case 'sales':
      return '/crm/tasks';
    case 'hr':
      return '/payroll/employees';
    case 'accountant':
      return '/billing/invoices';
    default:
      return '/dashboard';
  }
}

/**
 * Helper to check if current user has edit/mutation permissions
 */
export function canUserEdit(role: string | null | undefined): boolean {
  if (!role) return true;
  return role.toLowerCase() !== 'view';
}
