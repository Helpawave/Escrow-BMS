import { useState, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Trash2,
  MoreHorizontal,
  Eye,
  Pencil,
  CreditCard,
  X,
  Banknote,
  Smartphone,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PurchaseInvoiceDialog } from "@/components/PurchaseInvoiceDialog";
import { PurchasePreviewDialog } from "@/components/PurchasePreviewDialog";
import { SuccessModal } from "@/components/SuccessModal";
import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { adjustStockBatch } from "@/utils/inventory";

interface PurchaseInvoice {
  id: string;
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
  const { user, profile } = useAuth();
  const targetUserId = user?.id;
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // Dialog & Modal states
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: '', message: '' });
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [billToMarkPaid, setBillToMarkPaid] = useState<PurchaseInvoice | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'upi' | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: rawInvoices, isLoading: loading } = useQuery({
    queryKey: ['purchase_invoices', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const { data, error } = await supabase
        .from('purchase_invoices')
        .select(`
          *,
          vendors (
            name,
            email,
            phone
          )
        `)
        .eq('user_id', targetUserId)
        .order('issue_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown) as PurchaseInvoice[];
    },
    enabled: !!targetUserId
  });

  const filteredInvoices = useMemo(() => {
    if (!rawInvoices) return [];
    let list = rawInvoices;

    if (statusFilter && statusFilter !== 'all') {
      list = list.filter(inv => inv.status === statusFilter);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      list = list.filter(inv => 
        (inv.invoice_number && inv.invoice_number.toLowerCase().includes(q)) ||
        (inv.vendors?.name && inv.vendors.name.toLowerCase().includes(q)) ||
        (inv.vendors?.email && inv.vendors.email.toLowerCase().includes(q)) ||
        (inv.vendors?.phone && inv.vendors.phone.toLowerCase().includes(q))
      );
    }

    return list;
  }, [rawInvoices, statusFilter, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE));
  const paginatedInvoices = useMemo(() => {
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(from, from + ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

  const handleMarkAsPaid = async (inv: PurchaseInvoice, paymentMethod: 'cash' | 'upi' | 'pending' | null) => {
    try {
      if (!targetUserId) throw new Error("User not authenticated");

      // 1. Update purchase bill status to paid
      const { error: billError } = await supabase
        .from('purchase_invoices')
        .update({ status: 'paid' })
        .eq('id', inv.id);

      if (billError) throw billError;

      // 2. Insert into payments table
      const creatorName = profile?.company_name || user?.user_metadata?.full_name || 'Owner';
      const isPending = !paymentMethod || paymentMethod === 'pending';
      const actualMethod = isPending ? 'pending' : paymentMethod;
      const paymentNotes = isPending
        ? `Purchase Bill #${inv.invoice_number} paid (Mode of payment is pended) • Created by: ${creatorName}`
        : `Purchase Bill #${inv.invoice_number} paid via ${paymentMethod === 'upi' ? 'UPI' : 'Cash'} • Created by: ${creatorName}`;

      const { error: payError } = await supabase
        .from('payments')
        .insert([{
          invoice_id: inv.id,
          amount: Number(inv.total_amount || 0),
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: actualMethod,
          reference_number: '',
          notes: paymentNotes,
          user_id: targetUserId
        }]);

      if (payError) {
        console.warn('Payment record insertion warning:', payError);
      }

      if (isPending) {
        toast({
          title: "Mode of payment is pended ⚠️",
          description: `Purchase Bill #${inv.invoice_number} marked as paid. Payment recorded with pending mode — you can set the method in Payments.`
        });
      } else {
        toast({
          title: "Bill Marked as Paid! ✅",
          description: `Purchase Bill #${inv.invoice_number} settled via ${paymentMethod === 'upi' ? 'UPI' : 'Cash'}.`
        });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
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
      // Reverse stock for items atomically before deleting purchase bill
      const { data: purchaseItems } = await supabase
        .from('purchase_invoice_items')
        .select('product_id, quantity')
        .eq('invoice_id', deleteTargetId);

      if (purchaseItems && purchaseItems.length > 0) {
        const deleteOpId = crypto.randomUUID();
        const validItems = (purchaseItems as unknown as { product_id: string | null; quantity: number }[])
          .filter(i => i.product_id && i.quantity > 0)
          .map(i => ({ product_id: i.product_id!, quantity: i.quantity }));

        if (validItems.length > 0) {
          await adjustStockBatch(validItems, 'PURCHASE_CANCEL', deleteTargetId, `${deleteOpId}:DELETE`);
        }
      }

      const { error } = await supabase
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
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      console.error('Error deleting purchase bill:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete purchase bill."
      });
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-foreground">Purchase Bills</h1>
          <p className="text-xs md:text-base text-muted-foreground mt-1">Manage vendor bills and procurement records</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Button
            variant="default"
            size="lg"
            onClick={() => navigate('/create-invoice?type=purchase')}
            className="w-full sm:w-auto h-11 cursor-pointer font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span>Create Purchase Bill</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search bills by number, vendor name, email or phone..."
            className="pl-9 pr-10 h-11 bg-background border-border/50 rounded-xl font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
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
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Bills Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <Card className="p-8 md:p-12 text-center bg-card">
          <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-foreground mb-2">No Purchase Bills Found</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
            {rawInvoices?.length === 0 
              ? "Start logging your vendor bills and procurement expenses." 
              : "No purchase bills match your current search and filter criteria."}
          </p>
          {rawInvoices?.length === 0 && (
            <Button onClick={() => navigate('/create-invoice?type=purchase')} className="cursor-pointer font-bold">
              <Plus className="w-4 h-4 mr-2" />
              Create First Purchase Bill
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {paginatedInvoices.map((inv) => (
            <Card key={inv.id} className="p-4 md:p-5 rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-all">
              {/* Mobile Layout */}
              <div className="md:hidden space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{inv.invoice_number}</span>
                      <StatusBadge status={inv.status as "sent" | "paid" | "draft" | "overdue"} />
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">{inv.vendors?.name || 'Unknown Vendor'}</p>
                    <p className="text-[11px] text-muted-foreground">{safelyToLocaleDate(inv.issue_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-foreground">
                      {currencySymbol}{Number(inv.total_amount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t">
                  {inv.status !== 'paid' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBillToMarkPaid(inv);
                        setSelectedPaymentMethod('cash');
                        setMarkPaidDialogOpen(true);
                      }}
                      className="flex-1 h-9 text-xs font-bold text-emerald-700 bg-emerald-50 border-emerald-200 cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Mark Paid
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setPreviewInvoiceId(inv.id);
                      setIsPreviewDialogOpen(true);
                    }}
                    className="flex-1 h-9 text-xs font-bold cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingInvoiceId(inv.id);
                      setIsEditDialogOpen(true);
                    }}
                    className="h-9 w-9 p-0 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDeleteTargetId(inv.id);
                      setShowDeleteConfirm(true);
                    }}
                    className="h-9 w-9 p-0 text-destructive cursor-pointer hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-foreground truncate">{inv.invoice_number}</h3>
                    <p className="text-sm font-semibold text-muted-foreground truncate">{inv.vendors?.name || 'Unknown Vendor'}</p>
                    <p className="text-xs text-muted-foreground">{safelyToLocaleDate(inv.issue_date)}</p>
                  </div>
                  <StatusBadge status={inv.status as "sent" | "paid" | "draft" | "overdue"} />
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-lg font-black text-foreground">
                      {currencySymbol}{Number(inv.total_amount || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase">{inv.currency || 'INR'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {inv.status !== 'paid' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBillToMarkPaid(inv);
                          setSelectedPaymentMethod('cash');
                          setMarkPaidDialogOpen(true);
                        }}
                        className="h-9 px-3 text-xs font-bold text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Mark Paid
                      </Button>
                    )}

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setPreviewInvoiceId(inv.id);
                        setIsPreviewDialogOpen(true);
                      }}
                      className="h-9 px-3 text-xs font-bold cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingInvoiceId(inv.id);
                        setIsEditDialogOpen(true);
                      }}
                      className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Edit Bill"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteTargetId(inv.id);
                        setShowDeleteConfirm(true);
                      }}
                      className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      title="Delete Bill"
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
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="cursor-pointer"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="cursor-pointer"
          >
            Next
          </Button>
        </div>
      )}

      {/* Edit & Preview Dialogs */}
      <PurchaseInvoiceDialog 
        invoiceId={editingInvoiceId}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
        }}
      />

      <PurchasePreviewDialog
        invoiceId={previewInvoiceId}
        isOpen={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
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
              Bill #{billToMarkPaid?.invoice_number} • Amount: {currencySymbol}{Number(billToMarkPaid?.total_amount || 0).toFixed(2)}
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
                  className="text-[11px] font-bold text-amber-600 hover:underline cursor-pointer"
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

            {!selectedPaymentMethod && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <span>No mode selected. Bill will be settled with <strong>Pending Payment Mode</strong> (you can set it in Payments anytime).</span>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 bg-muted/5 border-t border-border/50 flex flex-row gap-3 shrink-0 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMarkPaidDialogOpen(false)}
              className="flex-1 h-11 font-bold rounded-xl cursor-pointer"
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
              className="flex-1 h-11 font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              {selectedPaymentMethod ? `OK (Confirm ${selectedPaymentMethod.toUpperCase()})` : 'OK (Mode is Pended)'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteConfirm}
        title="Delete Purchase Bill"
        description="Are you sure you want to delete this purchase bill record? This action cannot be undone and will reverse items from stock."
      />

      <SuccessModal
        isOpen={showSuccess}
        onOpenChange={setShowSuccess}
        title={successInfo.title}
        message={successInfo.message}
      />
    </div>
  );
};

export default PurchaseInvoicesPage;
