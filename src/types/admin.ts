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
