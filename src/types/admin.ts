export type UserType = 'normal' | 'automobile' | 'food_kitchen';

export interface UserData {
  user_id: string;
  company_name: string;
  email: string;
  mobile: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  last_invoice_created_at: string | null;
  invoice_count: number;
  client_count: number;
  subscription_expires_at: string | null;
  plan_type: string | null;
  is_blocked: boolean;
  is_paid?: boolean;
  whatsapp_provider?: string | null;
  user_type?: UserType | null;
  role?: string | null;
}

export interface RawUserData {
  user_id: string;
  company_name: string;
  email: string;
  mobile: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  last_invoice_created_at: string | null;
  invoice_count: number | null;
  client_count: number | null;
  subscription_expires_at: string | null;
  plan_type: string | null;
  is_blocked: boolean | null;
  is_paid: boolean | null;
  whatsapp_provider?: string | null;
  user_type?: UserType | null;
  role?: string | null;
}

export interface RevenueData {
  created_at: string;
  total_amount: number;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  created_at: string;
  time: string;
  target: string;
  admin: string;
}

export interface SystemSetting {
  key: string;
  value: string | boolean;
}

export interface AccountDeletionRequest {
  id: string;
  user_id: string;
  user_email: string;
  company_name?: string | null;
  reason: string;
  feedback?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
  processed_at?: string | null;
  processed_by?: string | null;
}

