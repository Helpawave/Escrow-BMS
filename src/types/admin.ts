export type UserType = 'normal' | 'automobile' | 'food_kitchen' | 'cafe';

export interface UserTypePricingTier {
  monthly: number;
  yearly: number;
}

export type UserTypePricingMap = Record<UserType, UserTypePricingTier>;

export const DEFAULT_USER_TYPE_PRICING: UserTypePricingMap = {
  normal: { monthly: 449, yearly: 4499 },
  automobile: { monthly: 449, yearly: 4499 },
  food_kitchen: { monthly: 449, yearly: 4499 },
  cafe: { monthly: 449, yearly: 4499 },
};

export interface BusinessTypeRequest {
  id: string;
  user_id: string;
  user_email: string;
  company_name?: string | null;
  current_type: UserType;
  requested_type: UserType;
  reason?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
  processed_at?: string | null;
  processed_by?: string | null;
}

export const USER_TYPE_LABELS: Record<UserType, { label: string; icon: string; badge: string; description: string }> = {
  normal: { 
    label: 'Retail', 
    icon: '🛍️', 
    badge: 'Retail Store',
    description: 'Retail shops, wholesalers, general trading, inventory & GST billing' 
  },
  automobile: { 
    label: 'Automobile', 
    icon: '🚗', 
    badge: 'Automobile Dealership',
    description: 'Car / Bike showrooms, workshops, RTO expenses & downpayment invoices' 
  },
  food_kitchen: { 
    label: 'Food & Kitchen', 
    icon: '🍛', 
    badge: 'Food / Cloud Kitchen',
    description: 'Restaurants, cloud kitchens, bakery & culinary businesses' 
  },
  cafe: { 
    label: 'Cafe', 
    icon: '☕', 
    badge: 'Cafe / Coffee Shop',
    description: 'Cafes, coffee shops, quick bites with live Kitchen KDS & POS thermal receipts' 
  },
};

export interface StaffInfo {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  mobile?: string | null;
  role: string;
  staff_role?: string | null;
  permissions?: string[];
  status: 'active' | 'inactive';
  created_at: string;
  user_id?: string | null;
  subscription_expires_at?: string | null;
  is_paid?: boolean;
}

export interface UserData {
  user_id: string;
  company_name: string;
  email: string;
  mobile: string | null;
  phone?: string | null;
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
  is_staff?: boolean;
  company_owner_id?: string | null;
  staff_role?: string | null;
  staff_members?: StaffInfo[];
  custom_price?: number | null;
  custom_monthly_price?: number | null;
  custom_yearly_price?: number | null;
  payment_notes?: string | null;
  is_setup_completed?: boolean;
}

export interface RawUserData {
  user_id: string;
  company_name: string;
  email: string;
  mobile: string | null;
  phone?: string | null;
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
  custom_price?: number | null;
  custom_monthly_price?: number | null;
  custom_yearly_price?: number | null;
  payment_notes?: string | null;
  is_setup_completed?: boolean;
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

