import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { ModuleKey } from '@/lib/constants';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ahdcjmydbsxoibvplmuz.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// ── Standard Roles & Permissions Definition ─────────────────────────────
export interface RoleDefinition {
  name: string;
  label: string;
  modules: ModuleKey[];
  description: string;
  badgeColor: string;
}

export const STANDARD_ROLES: Record<string, RoleDefinition> = {
  Admin: {
    name: 'Admin',
    label: 'Workspace Admin',
    modules: ['billing', 'ledger', 'inventory', 'hisab', 'payroll', 'crm'],
    description: 'Full administrative access across all BMS modules with full editing permissions.',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300'
  },
  Manager: {
    name: 'Manager',
    label: 'Operations Manager',
    modules: ['billing', 'ledger', 'inventory', 'crm', 'hisab'],
    description: 'Comprehensive operational control over Invoices, Ledgers, Stock, CRM, and Cash Register.',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300'
  },
  Accountant: {
    name: 'Accountant',
    label: 'Billing & Accounts Specialist',
    modules: ['billing', 'ledger', 'inventory', 'hisab'],
    description: 'Manages sales invoices, client/vendor ledgers, product catalog, and daily cash transactions.',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300'
  },
  Sales: {
    name: 'Sales',
    label: 'Sales & Client Executive',
    modules: ['crm'],
    description: 'Manages leads, customer pipeline, tasks, and CRM interactions.',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300'
  },
  HR: {
    name: 'HR',
    label: 'Human Resources & Payroll',
    modules: ['payroll'],
    description: 'Oversees staff records, attendance, salary slips, and payroll expenses.',
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300'
  },
  'View Only': {
    name: 'View Only',
    label: 'Auditor & Read-Only Viewer',
    modules: ['billing', 'ledger', 'inventory', 'hisab', 'payroll', 'crm'],
    description: 'Audit and review access across all business modules with view-only permissions.',
    badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300'
  },
  Custom: {
    name: 'Custom',
    label: 'Custom Role',
    modules: ['billing'],
    description: 'Tailored module permissions configured manually by the business owner.',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300'
  }
};

/**
 * Creates an isolated GoTrue / Supabase client that NEVER writes to localStorage.
 * This guarantees that creating or authenticating a staff user will NEVER log out
 * the company owner who is currently logged in!
 */
export function getIsolatedAuthClient() {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      }
    }
  });
}

export interface CreateStaffAccountParams {
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
  role: string;
  modules: ModuleKey[];
  ownerId: string;
  companyId: string;
  companyName: string;
}

export interface CreateStaffAccountResult {
  success: boolean;
  userId?: string;
  isExistingUser?: boolean;
  error?: string;
}

/**
 * Creates a real Supabase Auth account for a staff member without disturbing
 * the currently logged-in company owner session.
 * Also configures the staff profile with parent_user_id and allowed_modules.
 */
export async function createStaffAccount(params: CreateStaffAccountParams): Promise<CreateStaffAccountResult> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanPhone = (params.phone || '').trim();
  const pwd = params.password || '';

  if (!cleanEmail) {
    return { success: false, error: 'Email address is required.' };
  }

  const isolatedClient = getIsolatedAuthClient();
  let createdUserId: string | null = null;
  let isExisting = false;

  // 1. Try to sign up the staff member in Supabase Auth
  if (pwd && pwd.length >= 6) {
    try {
      const { data: signUpData, error: signUpError } = await isolatedClient.auth.signUp({
        email: cleanEmail,
        password: pwd,
        options: {
          data: {
            full_name: params.fullName.trim(),
            company_name: params.companyName || 'Escrow BMS',
            parent_user_id: params.ownerId,
            company_id: params.companyId,
            is_staff: true,
            role: params.role,
            staff_role: params.role,
            allowed_modules: params.modules,
            permissions: params.modules,
            phone: cleanPhone,
            mobile: cleanPhone,
            initial_password: pwd
          }
        }
      });

      if (signUpError) {
        const msg = signUpError.message?.toLowerCase() || '';
        if (msg.includes('already registered') || msg.includes('user already exists')) {
          isExisting = true;
          // Attempt sign in on isolated client to update their user_metadata & profile
          try {
            const { data: signInData } = await isolatedClient.auth.signInWithPassword({
              email: cleanEmail,
              password: pwd
            });
            if (signInData?.user?.id) {
              createdUserId = signInData.user.id;
              await isolatedClient.auth.updateUser({
                data: {
                  full_name: params.fullName.trim(),
                  company_name: params.companyName || 'Escrow BMS',
                  parent_user_id: params.ownerId,
                  company_id: params.companyId,
                  is_staff: true,
                  role: params.role,
                  staff_role: params.role,
                  allowed_modules: params.modules,
                  permissions: params.modules
                }
              });
              await isolatedClient.from('profiles').update({
                email: cleanEmail,
                full_name: params.fullName.trim(),
                phone: cleanPhone || null,
                company_name: params.companyName || 'Escrow BMS',
                parent_user_id: params.ownerId,
                role: params.role.toLowerCase() === 'admin' ? 'admin' : 'member',
                allowed_modules: params.modules
              }).eq('id', createdUserId);
            }
          } catch (signInErr) {
            console.warn('Isolated signin fallback for existing user:', signInErr);
          }
        } else {
          console.warn('Staff auth signUp notice:', signUpError);
        }
      } else if (signUpData?.user?.id) {
        createdUserId = signUpData.user.id;

        // Immediately update the new user's profiles row with their owner link & permissions
        try {
          await isolatedClient.from('profiles').update({
            email: cleanEmail,
            full_name: params.fullName.trim(),
            phone: cleanPhone || null,
            company_name: params.companyName || 'Escrow BMS',
            parent_user_id: params.ownerId,
            role: params.role.toLowerCase() === 'admin' ? 'admin' : 'member',
            allowed_modules: params.modules
          }).eq('id', createdUserId);
        } catch (updateErr) {
          console.warn('Could not update profile via isolated client:', updateErr);
        }
      }
    } catch (err: any) {
      console.warn('Isolated signup exception:', err);
    }
  }

  // 2. Also directly update profiles table via the workspace owner's active client
  try {
    if (createdUserId) {
      await supabase.from('profiles').update({
        email: cleanEmail,
        full_name: params.fullName.trim(),
        phone: cleanPhone || null,
        company_name: params.companyName || 'Escrow BMS',
        parent_user_id: params.ownerId,
        role: params.role.toLowerCase() === 'admin' ? 'admin' : 'member',
        allowed_modules: params.modules
      }).eq('id', createdUserId);
    } else {
      await supabase.from('profiles').update({
        email: cleanEmail,
        full_name: params.fullName.trim(),
        phone: cleanPhone || null,
        company_name: params.companyName || 'Escrow BMS',
        parent_user_id: params.ownerId,
        role: params.role.toLowerCase() === 'admin' ? 'admin' : 'member',
        allowed_modules: params.modules
      }).eq('email', cleanEmail);
    }
  } catch (ownerUpdateErr) {
    console.warn('Owner direct update profile by email/id:', ownerUpdateErr);
  }

  // 3. Upsert into employees table using the owner's client
  try {
    const empRecord: any = {
      id: createdUserId || crypto.randomUUID(),
      user_id: params.ownerId,
      name: params.fullName.trim(),
      email: cleanEmail,
      phone: cleanPhone || null,
      role: params.role,
      permissions: params.modules,
      status: 'active'
    };

    await supabase.from('employees').upsert([empRecord], { onConflict: 'id' });
  } catch (dbErr) {
    console.warn('Upsert into employees table warning:', dbErr);
  }

  return {
    success: true,
    userId: createdUserId || undefined,
    isExistingUser: isExisting
  };
}

/**
 * Formats a clean, professional WhatsApp message with staff login credentials.
 */
export function formatStaffWhatsAppInvite({
  companyName,
  staffName,
  companyId,
  staffCode,
  email,
  password,
  role,
  modules,
  loginUrl
}: {
  companyName: string;
  staffName: string;
  companyId: string;
  staffCode?: string;
  email: string;
  password?: string;
  role: string;
  modules: ModuleKey[];
  loginUrl?: string;
}): string {
  const url = loginUrl || `${window.location.origin}/auth`;
  const isGoogle = !password || password.includes('Google') || password === '(Google Sign-In / Existing)';
  const formattedModules = modules.map(m => `  • ${m.toUpperCase()}`).join('\n');

  if (isGoogle) {
    return (
      `*${companyName} — Staff Portal Access*\n\n` +
      `Hello *${staffName}*,\n` +
      `Your staff account has been set up on *Escrow BMS*.\n\n` +
      `🏢 *Company ID:* \`${companyId}\`\n` +
      (staffCode ? `🆔 *Staff ID:* \`${staffCode}\`\n` : '') +
      `📧 *Registered Email:* ${email}\n` +
      `💼 *Assigned Role:* ${role}\n\n` +
      `🔐 *Permitted Modules:*\n${formattedModules}\n\n` +
      `👉 *How to Login:*\n` +
      `1. Open: ${url}\n` +
      `2. Sign in with Google using this email address.\n\n` +
      `All permissions and company records are pre-configured!`
    );
  }

  return (
    `*${companyName} — Staff Login Credentials*\n\n` +
    `Hello *${staffName}*,\n` +
    `Your staff account has been created on *Escrow BMS*.\n\n` +
    `🏢 *Company ID:* \`${companyId}\`\n` +
    (staffCode ? `🆔 *Staff ID:* \`${staffCode}\`\n` : '') +
    `📧 *Email:* ${email}\n` +
    `🔑 *Password:* \`${password}\`\n` +
    `💼 *Assigned Role:* ${role}\n\n` +
    `🔐 *Permitted Modules:*\n${formattedModules}\n\n` +
    `👉 *Login Portal:* ${url}\n\n` +
    `Please log in and update your password if desired.`
  );
}

