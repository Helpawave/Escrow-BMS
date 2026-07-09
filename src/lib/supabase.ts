import type { User } from '@supabase/supabase-js';

export type { User };

export interface CalculationEntry {
  id: string;
  user_id: string;
  date: string;
  time: string;
  a: number;
  c: number;
  a1: number;
  b1: number;
  c1: number;
  sum_x: number;
  sum_y: number;
  today_hisab: number;
  previous_hisab?: number;
  difference?: number;
  clients?: ClientItem[];
  uplines?: ClientItem[];
  banks?: BankItem[];
  rtgs?: RtgsItem[];
  expenses?: ExpenseItem[];
  created_at?: string;
}

export interface ClientItem {
  name?: string;
  amount?: number;
  value?: number;
}

export interface BankItem {
  name?: string;
  amount?: number;
  value?: number;
}

export interface RtgsItem {
  name?: string;
  desc?: string;
  amount?: number;
  value?: number;
}

export interface ExpenseItem {
  name?: string;
  desc?: string;
  amount?: number;
  value?: number;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  name?: string | null;
  company_name: string | null;
  phone: string | null;
  mobile?: string | null;
  role: 'user' | 'admin';
  avatar_url: string | null;
  created_at?: string | null;
  // Compatibility fields
  email?: string;
  is_allowed?: boolean;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  password_text?: string | null;
  workspace_admin_password?: string | null;
  has_password?: boolean;
  approval_expires_at?: string | null;
  approved_at?: string | null;
}

export interface ProfileChangeRequest {
  id: string;
  user_id: string;
  field: string;
  old_value: string;
  new_value: string;
  status: string;
  created_at: string;
  // Compatibility fields
  request_type?: string;
  current_values?: string;
  requested_changes?: string;
  change_reason?: string;
}

// Export supabase from client mock for local persistence
export { supabase } from '@/integrations/supabase/client';
