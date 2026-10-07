import { useState, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Mail,
  MoreHorizontal,
  Eye,
  Loader2,
  Phone,
  Pencil,
  CreditCard,
  X,
  AlertTriangle,
  Copy,
  Banknote,
  Smartphone,
  ChevronDown,
  Printer
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffHeaderBadge } from "@/components/StaffHeaderBadge";
import { supabase, serviceSupabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { formatPurchaseBillWhatsAppMessage } from "@/utils/whatsappTemplates";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PurchaseInvoiceDialog } from "@/components/PurchaseInvoiceDialog";
import { PurchasePreviewDialog } from "@/components/PurchasePreviewDialog";
import { SuccessModal } from "@/components/SuccessModal";
import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { adjustStock } from "@/utils/inventory";
import { DataTablePagination } from "@/components/DataTablePagination";

const getPaymentMethodLabel = (method: string | null | undefined): string => {
  switch (method) {
    case 'cash':
      return 'Cash';
    case 'upi':
      return 'UPI / Online';
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'cheque':
      return 'Cheque';
    case 'credit_card':
      return 'Credit Card';
    case 'debit_card':
      return 'Debit Card';
    case 'net_banking':
      return 'Net Banking';
    case 'other':
      return 'Other Method';
    case 'pending':
      return 'Pending';
    default:
      return method ? method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Pending';
  }
};

interface PurchaseInvoice {
  id: string;
  user_id?: string;
  invoice_number: string;
  vendor_id: string;
  vendors: { 
    name: string;
    email?: string;
    phone?: string;
  };
  total_amount: number;
  issue_date: string;
  due_date?: string;
  status: string;
  currency: string;
  notes?: string;
  created_at?: string;
}

const PurchaseInvoicesPage = () => {
  const { user, effectiveUserId, companyProfile, profile, ownerName, isStaff, staffName } = useAuth();
  const targetUserId = effectiveUserId || user?.id;
  const { toast } = useToast();
  const { currencySymbol, formatAmount } = useCurrency();

  const getCreatorTag = (notesText?: string | null) => {
    if (notesText && notesText.includes('Created by:')) {
      const extracted = notesText.slice(notesText.indexOf('Created by:')).split('•')[0].trim();
      const n = extracted.replace('Created by:', '').trim();
      if (n && n.toLowerCase() !== 'company' && n.toLowerCase() !== 'company owner') {
        return `Created by: ${n}`;
      }
    }
    const fallback = ownerName || profile?.company_name || companyProfile?.company_name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Owner';
    return `Created by: ${fallback}`;
  };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialog & Modal states
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  // WhatsApp & SMS Dialog States (Matches Invoices.tsx)
  const [whatsappConfirmationOpen, setWhatsappConfirmationOpen] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappInvoiceId, setWhatsappInvoiceId] = useState("");
  const [whatsappProvider, setWhatsappProvider] = useState<string | null>(null);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  const [smsConfirmationOpen, setSmsConfirmationOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
  const [smsPhone, setSmsPhone] = useState("");
  const [smsInvoiceId, setSmsInvoiceId] = useState("");

  const [emailConfirmationOpen, setEmailConfirmationOpen] = useState(false);
  const [emailInvoice, setEmailInvoice] = useState<PurchaseInvoice | null>(null);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: '', message: '' });
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [billToMarkPaid, setBillToMarkPaid] = useState<PurchaseInvoice | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  // Shared state tracking
  const [sharedInvoices, setSharedInvoices] = useState<Record<string, { whatsapp?: boolean; email?: boolean; sms?: boolean }>>(() => {
    const saved = localStorage.getItem('purchase_bill_shared_status');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('purchase_bill_shared_status', JSON.stringify(sharedInvoices));
  }, [sharedInvoices]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const { data: invoices = [], isLoading: loading, isFetching: searchLoading } = useQuery({
    queryKey: ['purchase_invoices', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const clientToUse = serviceSupabase || supabase;
      const { data, error } = await clientToUse
        .from('purchase_invoices')
        .select('*, vendors(name, email, phone)')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rawBills = (data as unknown as PurchaseInvoice[]) || [];
      return [...rawBills].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        const numA = parseInt((a.invoice_number || '').replace(/\D/g, '') || '0', 10);
        const numB = parseInt((b.invoice_number || '').replace(/\D/g, '') || '0', 10);
        return numB - numA;
      });
    },
    enabled: !!targetUserId
  });

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    let list = invoices;
    
    if (statusFilter !== "all") {
      if (statusFilter === "overdue") {
        list = list.filter(inv => {
          if (inv.status === 'paid') return false;
          if (inv.status === 'overdue') return true;
          if (inv.due_date) {
            const d = new Date(inv.due_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            d.setHours(0, 0, 0, 0);
            return d < today;
          }
          return false;
        });
      } else {
        list = list.filter(inv => inv.status?.toLowerCase() === statusFilter.toLowerCase());
      }
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      list = list.filter(inv => 
        inv.invoice_number?.toLowerCase().includes(q) ||
        (inv.vendors?.name || '').toLowerCase().includes(q) ||
        inv.total_amount?.toString().includes(q)
      );
    }

    return list;
  }, [invoices, debouncedSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const paginatedInvoices = useMemo(() => {
    const from = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(from, from + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  const handleMarkAsPaid = async (inv: PurchaseInvoice, paymentMethod: string | null) => {
    try {
      const clientToUse = serviceSupabase || supabase;
      
      // 1. Update purchase bill status to paid
      const { error: billError } = await clientToUse
        .from('purchase_invoices')
        .update({ status: 'paid' })
        .eq('id', inv.id);

      if (billError) throw billError;

      // 2. Insert into payments table
      const creatorName = isStaff
        ? (staffName || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Staff Member')
        : (companyProfile?.company_name || 'Company Owner');

      const isPending = !paymentMethod || paymentMethod === 'pending';
      const actualMethod = isPending ? 'pending' : paymentMethod;
      const methodLabel = getPaymentMethodLabel(paymentMethod);
      const paymentNotes = isPending
        ? `Purchase Bill #${inv.invoice_number} paid (Mode of payment is pended) • Created by: ${creatorName}`
        : `Purchase Bill #${inv.invoice_number} paid via ${methodLabel} • Created by: ${creatorName}`;

      const { error: payError } = await clientToUse
        .from('payments')
        .insert([{
          purchase_invoice_id: inv.id,
          invoice_id: null,
          amount: Number(inv.total_amount || 0),
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: actualMethod,
          reference_number: '',
          notes: paymentNotes,
          user_id: inv.user_id || targetUserId || user?.id
        }]);

      if (payError) {
        console.error('Payment record insertion error:', payError);
        throw payError;
      }

      if (isPending) {
        toast({
          title: "Mode of payment is pended ⚠️",
          description: `Purchase Bill #${inv.invoice_number} marked as paid. Payment recorded with pending mode — you can set the method in Payments.`
        });
      } else {
        toast({
          title: "Bill Marked as Paid! ✅",
          description: `Purchase Bill #${inv.invoice_number} settled via ${methodLabel}. Payment recorded in Payments.`
        });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'pending-for-payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (error) {
      console.error('Error marking purchase bill as paid:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark bill as paid."
      });
    }
  };



  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      const clientToUse = serviceSupabase || supabase;

      // 1. Revert stock for all items in this purchase bill before deleting
      const { data: items } = await clientToUse
        .from('purchase_invoice_items')
        .select('product_id, quantity')
        .eq('invoice_id', deleteTargetId);

      if (items && items.length > 0) {
        for (const item of (items as unknown as { product_id: string | null; quantity: number }[])) {
          if (item.product_id && item.quantity > 0) {
            await adjustStock(item.product_id, -item.quantity);
          }
        }
      }

      // 2. Delete linked payment records
      await clientToUse
        .from('payments')
        .delete()
        .eq('purchase_invoice_id', deleteTargetId);

      // 3. Delete purchase invoice items
      await clientToUse
        .from('purchase_invoice_items')
        .delete()
        .eq('invoice_id', deleteTargetId);

      // 4. Delete purchase invoice
      const { error } = await clientToUse
        .from('purchase_invoices')
        .delete()
        .eq('id', deleteTargetId);

      if (error) throw error;
      
      setSuccessInfo({
        title: "Purchase Bill Deleted",
        message: "The purchase bill record has been permanently removed."
      });
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete purchase bill." });
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    }
  };

  // WhatsApp Flow: Direct open for personal WhatsApp, background send with notifications for Cloud API
  const openWhatsAppModal = async (inv: PurchaseInvoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (sendingWhatsApp) return;

    if (sharedInvoices[inv.id]?.whatsapp) {
      toast({
        title: "Already Sent ⚠️",
        description: "This WhatsApp message has already been sent once.",
      });
    }

    const vendorName = inv.vendors?.name || 'Vendor';
    const currency = inv.currency === 'USD' ? '$' : (inv.currency === 'EUR' ? '€' : (inv.currency === 'GBP' ? '£' : currencySymbol));
    
    let purchaseItems: { description?: string; quantity?: number; amount?: number }[] = [];
    try {
      const clientToUse = serviceSupabase || supabase;
      const { data: pItems } = await (clientToUse as any)
        .from('purchase_invoice_items')
        .select('description, quantity, amount')
        .eq('invoice_id', inv.id)
        .order('created_at', { ascending: true })
        .limit(10);
      if (pItems) purchaseItems = pItems as { description?: string; quantity?: number; amount?: number }[];
    } catch {}

    const text = formatPurchaseBillWhatsAppMessage({
      invoiceNumber: inv.invoice_number,
      vendorName: vendorName,
      companyName: companyProfile?.company_name || profile?.company_name || ownerName,
      totalAmount: Number(inv.total_amount || 0),
      currencySymbol: currency,
      issueDate: safelyToLocaleDate(inv.issue_date),
      status: inv.status,
      paymentMethod: (inv as any).payment_method,
      items: purchaseItems,
      companyPhone: companyProfile?.phone || profile?.phone,
      companyEmail: companyProfile?.email || profile?.email || user?.email,
    });
    
    const rawPhone = inv.vendors?.phone || '';
    const digitsOnly = rawPhone.replace(/[^\d]/g, '');
    let phoneWithCC = digitsOnly;
    if (rawPhone.trim().startsWith('+')) {
      phoneWithCC = digitsOnly;
    } else if (digitsOnly.length === 10) {
      phoneWithCC = `91${digitsOnly}`;
    }

    let provider = 'meta';
    try {
      const clientToUse = serviceSupabase || supabase;
      const { data: settings } = await clientToUse
        .from('user_settings')
        .select('whatsapp_provider')
        .eq('user_id', targetUserId)
        .maybeSingle();
      if ((settings as any)?.whatsapp_provider) {
        provider = (settings as any).whatsapp_provider;
      }
    } catch (e) {
      // fallback
    }

    // 1. Personal WhatsApp Mode: Direct Open without preview modal
    if (provider === 'personal') {
      const waUrl = `https://wa.me/${phoneWithCC}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
      setSharedInvoices(prev => ({
        ...prev,
        [inv.id]: { ...(prev[inv.id] || {}), whatsapp: true }
      }));
      toast({
        title: "WhatsApp Opened! 📱",
        description: `Direct WhatsApp chat opened for purchase bill #${inv.invoice_number}.`
      });
      return;
    }

    // 2. Official WhatsApp Mode: Run in background with notifications
    setSendingWhatsApp(true);
    toast({
      title: "Sending via WhatsApp...",
      description: `Sending purchase bill #${inv.invoice_number}...`
    });

    try {
      const { error } = await supabase.functions.invoke('send-invoice-whatsapp', {
        body: {
          invoiceId: inv.id,
          recipientPhone: phoneWithCC,
          message: text
        }
      });

      if (error) throw error;

      setSharedInvoices(prev => ({
        ...prev,
        [inv.id]: { ...(prev[inv.id] || {}), whatsapp: true }
      }));

      toast({
        title: "WhatsApp Message Sent",
        description: `Purchase bill #${inv.invoice_number} sent successfully.`
      });
    } catch (error: any) {
      console.warn('WhatsApp Cloud API failed, opening personal WhatsApp fallback:', error);
      const waUrl = `https://wa.me/${phoneWithCC}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
      setSharedInvoices(prev => ({
        ...prev,
        [inv.id]: { ...(prev[inv.id] || {}), whatsapp: true }
      }));
      toast({
        title: "WhatsApp Opened",
        description: "Opened in WhatsApp to send bill."
      });
    } finally {
      setSendingWhatsApp(false);
    }
  };

  // SMS Flow with preview modal (Matches Invoices.tsx)
  const openSMSModal = (inv: PurchaseInvoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const vendorName = inv.vendors?.name || 'Vendor';
    const text = `Purchase Bill ${inv.invoice_number} for ${vendorName}: Amount INR ${inv.total_amount}. Status: ${inv.status}`;
    setSmsMessage(text);
    setSmsPhone(inv.vendors?.phone ? inv.vendors.phone.replace(/\D/g, '') : '');
    setSmsInvoiceId(inv.id);
    setSmsConfirmationOpen(true);
  };

  const executeSMSSend = () => {
    window.open(`sms:${smsPhone}?body=${encodeURIComponent(smsMessage)}`, '_blank');
    setSharedInvoices(prev => ({
      ...prev,
      [smsInvoiceId]: { ...(prev[smsInvoiceId] || {}), sms: true }
    }));
    setSmsConfirmationOpen(false);
  };

  // Email Flow (Matches Invoices.tsx)
  const openEmailModal = (inv: PurchaseInvoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEmailInvoice(inv);
    setEmailConfirmationOpen(true);
  };

  const executeEmailSend = () => {
    if (!emailInvoice) return;
    const email = emailInvoice.vendors?.email || '';
    const subject = encodeURIComponent(`Purchase Bill ${emailInvoice.invoice_number}`);
    const body = encodeURIComponent(`Hello,\n\nPlease find the details for purchase bill ${emailInvoice.invoice_number}.\n\nVendor: ${emailInvoice.vendors?.name || 'N/A'}\nTotal Amount: INR ${emailInvoice.total_amount}\nDate: ${safelyToLocaleDate(emailInvoice.issue_date)}\nStatus: ${emailInvoice.status}\n\nRegards,\nEscrowBill`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    setSharedInvoices(prev => ({
      ...prev,
      [emailInvoice.id]: { ...(prev[emailInvoice.id] || {}), email: true }
    }));
    setEmailConfirmationOpen(false);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl md:text-3xl font-bold text-foreground">Purchase Bills</h1>
            <StaffHeaderBadge />
          </div>
          <p className="text-xs md:text-base text-muted-foreground mt-1">Manage procurement expenses and vendor bills</p>
        </div>
        <Button
          variant="default"
          size="lg"
          onClick={() => navigate('/create-invoice?type=purchase')}
          className="w-full sm:w-auto h-11 shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span className="text-sm md:text-base">Create Purchase Bill</span>
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by bill number or vendor name..."
            className="pl-10 pr-10 h-11 bg-background border-border/50 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm.trim() && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {searchLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="w-full sm:w-48">
          <select
            className="w-full h-11 rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Cards List Layout */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4 md:p-6 rounded-xl border-border bg-card shadow-sm">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-6 w-24 ml-auto" />
                  <Skeleton className="h-3 w-12 ml-auto" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <Card className="p-4 md:p-6 md:p-8 text-center bg-card dark:bg-card">
          <FileText className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">No Purchase Bills Found</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-4">
            {invoices.length === 0
              ? "Record your first vendor purchase bill to track procurement expenses."
              : "No purchase bills match your search criteria."}
          </p>
          {invoices.length === 0 && (
            <Button
              variant="default"
              onClick={() => navigate('/create-invoice?type=purchase')}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Purchase Bill
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {paginatedInvoices.map((inv) => (
            <Card key={inv.id} className="p-4 md:p-6 rounded-md border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-4">
                <div
                  className="space-y-4 cursor-pointer"
                  onClick={() => {
                    setPreviewInvoiceId(inv.id);
                    setIsPreviewDialogOpen(true);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{inv.invoice_number}</span>
                        <StatusBadge status={inv.status} dueDate={inv.due_date} />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">{inv.vendors?.name || 'Unknown Vendor'}</p>
                      <p className="text-[10px] text-muted-foreground/60 font-normal">
                        {getCreatorTag(inv.notes)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{safelyToLocaleDate(inv.issue_date)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatAmount(Number(inv.total_amount || 0))}</p>
                      <p className="text-xs text-muted-foreground uppercase">{inv.currency || 'INR'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewInvoiceId(inv.id);
                        setIsPreviewDialogOpen(true);
                      }}
                      title="Preview Bill"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewInvoiceId(inv.id);
                        setIsPreviewDialogOpen(true);
                      }}
                      title="Print Bill"
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-10 w-full ${sharedInvoices[inv.id]?.whatsapp ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : ''}`}
                      onClick={(e) => openWhatsAppModal(inv, e)}
                      title="Share to WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${sharedInvoices[inv.id]?.whatsapp ? 'text-emerald-700' : 'text-emerald-500'}`}>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {inv.vendors?.email && (
                          <DropdownMenuItem
                            onClick={(e) => openEmailModal(inv, e as any)}
                            className={sharedInvoices[inv.id]?.email ? "text-emerald-600 font-medium" : ""}
                          >
                            <Mail className={`mr-2 h-4 w-4 ${sharedInvoices[inv.id]?.email ? "text-emerald-600" : ""}`} />
                            Email to Vendor {sharedInvoices[inv.id]?.email && "✓"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => openSMSModal(inv, e as any)}
                          className={sharedInvoices[inv.id]?.sms ? "text-emerald-600 font-medium" : ""}
                        >
                          <Phone className={`mr-2 h-4 w-4 ${sharedInvoices[inv.id]?.sms ? "text-emerald-600" : ""}`} />
                          Send via SMS {sharedInvoices[inv.id]?.sms && "✓"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setPreviewInvoiceId(inv.id);
                          setIsPreviewDialogOpen(true);
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview Bill
                        </DropdownMenuItem>
                        {inv.status !== 'paid' ? (
                          <>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setEditingInvoiceId(inv.id);
                              setIsEditDialogOpen(true);
                            }}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Bill
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setBillToMarkPaid(inv);
                                setSelectedPaymentMethod(null);
                                setMarkPaidDialogOpen(true);
                              }}
                              className="cursor-pointer font-medium text-emerald-700 dark:text-emerald-400"
                            >
                              <CreditCard className="mr-2 h-4 w-4 text-emerald-600" />
                              Mark as Paid
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem
                            disabled
                            className="text-emerald-600 font-medium disabled:opacity-100"
                          >
                            <CreditCard className="mr-2 h-4 w-4 text-emerald-600" />
                            Settled / Paid
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetId(inv.id);
                            setShowDeleteConfirm(true);
                          }}
                          className="text-destructive font-medium cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Bill
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Desktop Card Layout */}
              <div className="hidden md:flex items-center justify-between gap-3">
                {/* Left: Bill info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base lg:text-lg font-semibold truncate">{inv.invoice_number}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {inv.vendors?.name || 'Unknown Vendor'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{safelyToLocaleDate(inv.issue_date)}</span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {getCreatorTag(inv.notes)}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={inv.status} dueDate={inv.due_date} />
                </div>

                {/* Right: Amount + Actions */}
                <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-base lg:text-lg font-bold">{formatAmount(Number(inv.total_amount || 0))}</p>
                    <p className="text-xs lg:text-sm text-muted-foreground uppercase">{inv.currency || 'INR'}</p>
                  </div>

                  <div className="flex items-center gap-1 lg:gap-2">
                    {/* Email */}
                    {inv.vendors?.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => openEmailModal(inv, e)}
                        title="Send via Email"
                        className={`h-8 lg:h-9 px-2 lg:px-3 ${sharedInvoices[inv.id]?.email ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800' : ''}`}
                      >
                        <Mail className={`w-4 h-4 lg:mr-1 ${sharedInvoices[inv.id]?.email ? 'text-emerald-700' : ''}`} />
                        <span className="hidden lg:inline">Email</span>
                      </Button>
                    )}

                    {/* SMS */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => openSMSModal(inv, e)}
                      title="Send SMS"
                      className={`h-8 lg:h-9 px-2 lg:px-3 ${sharedInvoices[inv.id]?.sms ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800' : ''}`}
                    >
                      <Phone className={`w-4 h-4 lg:mr-1 ${sharedInvoices[inv.id]?.sms ? 'text-emerald-700' : ''}`} />
                      <span className="hidden lg:inline">SMS</span>
                    </Button>

                    {/* WhatsApp */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => openWhatsAppModal(inv, e)}
                      title="Send via WhatsApp"
                      className={`flex items-center gap-1 h-8 lg:h-9 px-2 lg:px-3 ${sharedInvoices[inv.id]?.whatsapp ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800' : ''}`}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${sharedInvoices[inv.id]?.whatsapp ? 'text-emerald-700' : 'text-emerald-500'}`}>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      <span className="hidden lg:inline">WhatsApp</span>
                    </Button>

                    {/* Mark as Paid */}
                    {inv.status !== 'paid' && (
                      <Button
                        variant="outline"
                        size="sm"
                        title="Mark as Paid"
                        onClick={() => {
                          setBillToMarkPaid(inv);
                          setSelectedPaymentMethod(null);
                          setMarkPaidDialogOpen(true);
                        }}
                        className="h-8 lg:h-9 px-2 lg:px-3 font-semibold bg-emerald-50/60 hover:bg-emerald-100/80 border-emerald-300 text-emerald-800 hover:text-emerald-900 transition-all active:scale-95"
                      >
                        <CreditCard className="w-4 h-4 lg:mr-1 text-emerald-600" />
                        <span className="hidden lg:inline">Mark as Paid</span>
                      </Button>
                    )}

                    {/* Preview */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setPreviewInvoiceId(inv.id);
                        setIsPreviewDialogOpen(true);
                      }} 
                      title="Preview Bill" 
                      className="h-8 lg:h-9 w-8 lg:w-9 p-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    {/* Print */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setPreviewInvoiceId(inv.id);
                        setIsPreviewDialogOpen(true);
                      }} 
                      title="Print Bill" 
                      className="h-8 lg:h-9 w-8 lg:w-9 p-0"
                    >
                      <Printer className="w-4 h-4" />
                    </Button>

                    {/* Edit */}
                    {inv.status !== 'paid' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setEditingInvoiceId(inv.id);
                          setIsEditDialogOpen(true);
                        }} 
                        title="Edit Bill" 
                        className="h-8 lg:h-9 w-8 lg:w-9 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Delete */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setDeleteTargetId(inv.id);
                        setShowDeleteConfirm(true);
                      }} 
                      title="Delete Bill" 
                      className="h-8 lg:h-9 w-8 lg:w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <DataTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={filteredInvoices.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        entityName="purchase bills"
        isLoading={loading}
      />



      {/* SMS Preview Dialog (Matches Invoices.tsx) */}
      <AlertDialog open={smsConfirmationOpen} onOpenChange={setSmsConfirmationOpen}>
        <AlertDialogContent className="max-w-md rounded-2xl border-none shadow-2xl bg-background p-0 overflow-hidden">
          <AlertDialogHeader className="p-4 md:p-8 pb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-primary" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tight">Preview SMS Message</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium pt-2">
              Edit the message below before sending via SMS to your vendor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 md:px-8 py-2">
            <Textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              className="min-h-[120px] rounded-xl border-2 focus-visible:ring-primary/20 bg-muted/30 font-medium"
            />
          </div>
          <AlertDialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5">
            <AlertDialogCancel className="flex-1 h-11 font-bold rounded-xl border-2 m-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeSMSSend}
              className="flex-1 h-11 font-black rounded-xl shadow-lg shadow-primary/20 bg-primary hover:opacity-90"
            >
              Send SMS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Preview Dialog (Matches Invoices.tsx) */}
      <AlertDialog open={emailConfirmationOpen} onOpenChange={setEmailConfirmationOpen}>
        <AlertDialogContent className="max-w-md rounded-2xl border-none shadow-2xl bg-background p-0 overflow-hidden">
          <AlertDialogHeader className="p-4 md:p-8 pb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tight">Email Purchase Bill</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium pt-2">
              Send purchase bill <span className="font-bold text-foreground">#{emailInvoice?.invoice_number}</span> to <span className="font-bold text-foreground">{emailInvoice?.vendors?.email || 'vendor'}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5">
            <AlertDialogCancel className="flex-1 h-11 font-bold rounded-xl border-2 m-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeEmailSend}
              className="flex-1 h-11 font-black rounded-xl shadow-lg shadow-primary/20 bg-primary hover:opacity-90"
            >
              Send Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <PurchaseInvoiceDialog 
        invoiceId={editingInvoiceId}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
        }}
      />

      {/* Preview Dialog */}
      <PurchasePreviewDialog
        invoiceId={previewInvoiceId}
        isOpen={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteConfirm}
        title="Delete Purchase Bill"
        description="Are you sure you want to delete this purchase bill record? This action cannot be undone."
      />

      {/* Mark as Paid Selection Popup Dialog */}
      <Dialog open={markPaidDialogOpen} onOpenChange={setMarkPaidDialogOpen}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background">
          <DialogHeader className="p-6 pb-4 bg-muted/10 border-b border-border/50">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
              <CreditCard className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-foreground">
              Mark Purchase Bill as Paid
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Bill #{billToMarkPaid?.invoice_number} • Amount: {formatAmount(Number(billToMarkPaid?.total_amount || 0))}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Select Payment Method (Optional)
              </Label>
              {selectedPaymentMethod && (
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod(null)}
                  className="text-[11px] font-bold text-amber-600 hover:underline"
                >
                  Clear Selection
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedPaymentMethod(prev => prev === 'cash' ? null : 'cash')}
                className={`p-4 rounded-xl border-2 text-left flex flex-col gap-2 transition-all cursor-pointer active:scale-95 ${
                  selectedPaymentMethod === 'cash'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-border/60 hover:border-border text-muted-foreground hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Banknote className={`w-5 h-5 ${selectedPaymentMethod === 'cash' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                  {selectedPaymentMethod === 'cash' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  )}
                </div>
                <div>
                  <p className="font-black text-sm text-foreground">Cash</p>
                  <p className="text-[10px] opacity-70">Physical Cash Payment</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPaymentMethod(prev => prev === 'upi' ? null : 'upi')}
                className={`p-4 rounded-xl border-2 text-left flex flex-col gap-2 transition-all cursor-pointer active:scale-95 ${
                  selectedPaymentMethod === 'upi'
                    ? 'border-violet-600 bg-violet-50/70 dark:bg-violet-950/40 text-violet-900 dark:text-violet-100 shadow-md ring-2 ring-violet-500/20'
                    : 'border-border/60 hover:border-border text-muted-foreground hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Smartphone className={`w-5 h-5 ${selectedPaymentMethod === 'upi' ? 'text-violet-600' : 'text-muted-foreground'}`} />
                  {selectedPaymentMethod === 'upi' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-600"></span>
                  )}
                </div>
                <div>
                  <p className="font-black text-sm text-foreground">UPI / Online</p>
                  <p className="text-[10px] opacity-70">GPay, PhonePe, QR</p>
                </div>
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Or Other Payment Method
              </Label>
              <Select
                value={
                  selectedPaymentMethod && selectedPaymentMethod !== 'cash' && selectedPaymentMethod !== 'upi'
                    ? selectedPaymentMethod
                    : ""
                }
                onValueChange={(val) => {
                  if (val === 'none') {
                    setSelectedPaymentMethod(null);
                  } else {
                    setSelectedPaymentMethod(val);
                  }
                }}
              >
                <SelectTrigger className="w-full h-11 bg-muted/20 border-border/70 rounded-xl text-sm font-medium focus:ring-emerald-500">
                  <SelectValue placeholder="Choose other payment method..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border shadow-xl z-50">
                  <SelectItem value="none" className="cursor-pointer py-2 text-muted-foreground italic font-medium">
                    -- None (Mode is Pended) --
                  </SelectItem>
                  <SelectItem value="bank_transfer" className="cursor-pointer py-2 font-medium">
                    🏦 Bank Transfer (NEFT / RTGS / IMPS)
                  </SelectItem>
                  <SelectItem value="cheque" className="cursor-pointer py-2 font-medium">
                    📜 Cheque
                  </SelectItem>
                  <SelectItem value="credit_card" className="cursor-pointer py-2 font-medium">
                    💳 Credit Card
                  </SelectItem>
                  <SelectItem value="debit_card" className="cursor-pointer py-2 font-medium">
                    💳 Debit Card
                  </SelectItem>
                  <SelectItem value="net_banking" className="cursor-pointer py-2 font-medium">
                    🌐 Net Banking
                  </SelectItem>
                  <SelectItem value="other" className="cursor-pointer py-2 font-medium">
                    📦 Other Method
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!selectedPaymentMethod && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>No mode selected. Bill will be settled with <strong>Pending Payment Mode</strong> (you can set it in Payments anytime).</span>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 bg-muted/5 border-t border-border/50 flex flex-row gap-3 shrink-0 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMarkPaidDialogOpen(false)}
              className="w-24 sm:w-28 h-11 font-bold rounded-xl shrink-0"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (billToMarkPaid) {
                  await handleMarkAsPaid(billToMarkPaid, selectedPaymentMethod);
                  setMarkPaidDialogOpen(false);
                  setBillToMarkPaid(null);
                }
              }}
              className="flex-1 h-11 font-bold text-xs sm:text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 px-3 whitespace-nowrap overflow-hidden text-ellipsis"
            >
              {selectedPaymentMethod 
                ? `Confirm (${getPaymentMethodLabel(selectedPaymentMethod)})` 
                : 'Confirm (Mode is Pended)'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onOpenChange={setShowSuccess}
        title={successInfo.title}
        message={successInfo.message}
      />

      {/* Purchase Bill Preview Modal */}
      <PurchasePreviewDialog
        invoiceId={previewInvoiceId}
        isOpen={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
      />

      {/* Purchase Bill Edit Modal */}
      <PurchaseInvoiceDialog
        invoiceId={editingInvoiceId}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }}
      />
    </div>
  );
};

export default PurchaseInvoicesPage;
