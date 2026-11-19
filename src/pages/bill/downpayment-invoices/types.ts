import { Invoice } from '@/types/invoice';

export interface DownpaymentFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

export interface DownpaymentCardItemProps {
  invoice: Invoice;
  formatAmount: (amount: number) => string;
  getCreatorTag: (terms?: string | null) => string;
  handlePreviewInvoice: (invoice: Invoice) => void;
  handleDownloadPDF: (invoice: Invoice) => void;
  handleShareWhatsApp: (invoice: Invoice) => void;
  handleShareEmail: (invoice: Invoice) => void;
  handleShareSMS: (invoice: Invoice) => void;
  handlePrint: (invoice: Invoice) => void;
  handleOpenMarkPaid: (invoice: Invoice) => void;
  handleViewHistory: (invoice: Invoice) => void;
  deleteInvoice: (invoiceId: string, invoiceNumber: string, status: string) => void;
  downloadingPDFId: string | null;
  uploadingWhatsApp: string | null;
  navigate: (path: string) => void;
}

export interface DownpaymentSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceToMarkPaid: Invoice | null;
  formatAmount: (amount: number) => string;
  currencySymbol: string;
  alreadyPaidAmount: number;
  remainingBalanceAmount: number;
  balanceSettleType: 'balance_full' | 'balance_partial' | 'finance_disburse';
  setBalanceSettleType: (type: 'balance_full' | 'balance_partial' | 'finance_disburse') => void;
  installmentAmount: string;
  setInstallmentAmount: (amt: string) => void;
  paymentType: 'full' | 'partial' | 'finance';
  setPaymentType: (type: 'full' | 'partial' | 'finance') => void;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (method: string) => void;
  paymentDate: string;
  setPaymentDate: (date: string) => void;
  transactionRef: string;
  setTransactionRef: (ref: string) => void;
  partialAmount: string;
  setPartialAmount: (amt: string) => void;
  balanceDueDate: string;
  setBalanceDueDate: (date: string) => void;
  downpaymentAmount: string;
  setDownpaymentAmount: (amt: string) => void;
  financierName: string;
  setFinancierName: (name: string) => void;
  customFinancier: string;
  setCustomFinancier: (name: string) => void;
  financedAmount: string;
  setFinancedAmount: (amt: string) => void;
  financeStatus: 'disbursed' | 'pending';
  setFinanceStatus: (status: 'disbursed' | 'pending') => void;
  loanAccountNo: string;
  setLoanAccountNo: (no: string) => void;
  isSubmittingPayment: boolean;
  handleMarkAsPaid: () => Promise<void>;
}

export interface DownpaymentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  historyInvoice: Invoice | null;
  historyPayments: any[];
  isLoadingHistory: boolean;
  deletingPaymentId: string | null;
  formatAmount: (amount: number) => string;
  handleDeleteHistoryPayment: (paymentId: string) => Promise<void>;
  handleOpenMarkPaid: (invoice: Invoice) => void;
}
