import { UserData, UserType, BusinessTypeRequest, AccountDeletionRequest, AuditLog } from '@/types/admin';

export interface TypeChangeModalState {
  isOpen: boolean;
  userId: string;
  userName: string;
  userEmail: string;
  currentType: UserType;
  newType: UserType;
}

export type UserFilterType = 'all' | 'completed' | 'pending';
export type PaymentsFilterType = 'all' | 'paid' | 'monthly' | 'yearly' | 'trial' | 'expired';

export interface OverviewGrowthPoint {
  date: string;
  users: number;
  pro: number;
}

export interface OverviewPlanPoint {
  name: string;
  value: number;
}

