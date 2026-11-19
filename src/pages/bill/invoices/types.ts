import { Invoice } from '@/types/invoice';

export type InvoiceSharedStatus = Record<string, { whatsapp?: boolean; email?: boolean; sms?: boolean }>;

export interface InvoiceToDelete {
  id: string;
  invoiceNumber: string;
  status: string;
}

export interface InvoiceFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchLoading: boolean;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  isAutomobile: boolean;
  isCafe?: boolean;
  nextServiceFilter: string;
  setNextServiceFilter: (filter: string) => void;
}

export interface MarkPaidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  selectedPaymentMethod: string | null;
  setSelectedPaymentMethod: React.Dispatch<React.SetStateAction<string | null>>;
  formatAmount: (amount: number) => string;
  handleMarkAsPaid: (invoice: Invoice, paymentMethod: string | null) => Promise<void>;
  isSubmittingPayment: boolean;
}

export interface PaidDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceToDelete: InvoiceToDelete | null;
  paidVerificationChecked: boolean;
  setPaidVerificationChecked: (checked: boolean) => void;
  deleteConfirmText: string;
  setDeleteConfirmText: (text: string) => void;
  onConfirmDelete: () => Promise<void>;
  onClose: () => void;
}

export interface WhatsAppPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whatsappInvoiceId: string;
  sharedInvoices: InvoiceSharedStatus;
  whatsappMessage: string;
  setWhatsappMessage: (msg: string) => void;
  uploadingWhatsApp: string | null;
  sendingWhatsApp: boolean;
  handleSendWhatsApp: () => Promise<void>;
}

export interface EmailConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceToSend: Invoice | null;
  onSendEmail: (invoice: Invoice) => void;
}

export interface InvoiceActionHandlers {
  handlePreviewInvoice: (invoice: Invoice) => void;
  downloadInvoicePDF: (invoice: Invoice) => void;
  uploadToGoogleDrive: (invoice: Invoice) => void;
  sendInvoiceSMS: (invoice: Invoice) => void;
  setEmailConfirmationOpen: (open: boolean) => void;
  setInvoiceToSend: (invoice: Invoice) => void;
  setInvoiceToMarkPaid: (invoice: Invoice) => void;
  setSelectedPaymentMethod: React.Dispatch<React.SetStateAction<string | null>>;
  setMarkPaidDialogOpen: (open: boolean) => void;
  deleteInvoice: (invoiceId: string, invoiceNumber: string, status: string) => void;
  downloadingPDFId: string | null;
  uploadingWhatsApp: string | null;
  sharingSMS: string | null;
  sharedInvoices: InvoiceSharedStatus;
  isDownpaymentInvoice: (inv: Invoice) => boolean;
  getCreatorTag: (terms?: string | null) => string;
  formatAmount: (amount: number) => string;
}

