import { Payment } from "@/types/invoice";

export type PaymentActiveTab = 'sales' | 'downpayment' | 'purchase';
export type DownpaymentSubTab = 'all' | 'advance' | 'partial' | 'ledger';
export type PaymentCategoryFilter = 'all' | 'downpayment' | 'regular';

export interface VehicleLedgerItem {
  invoiceId: string;
  invoiceNumber: string;
  partyName: string;
  totalAmount: number;
  status: string;
  notes?: string;
  payments: Payment[];
  firstPayment?: Payment;
  secondPayment?: Payment;
  firstAmount: number;
  secondAmount: number;
  totalPaid: number;
  totalVehiclePrice: number;
  remainingBalance: number;
  isFullySettled: boolean;
}

