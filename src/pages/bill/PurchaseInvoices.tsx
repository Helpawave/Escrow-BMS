import { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Plus, Eye, Trash2, Edit2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PurchaseInvoiceDialog } from "@/components/PurchaseInvoiceDialog";
import { PurchasePreviewDialog } from "@/components/PurchasePreviewDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  vendor_id: string;
  vendors: { name: string };
  total_amount: number;
  issue_date: string;
  status: string;
  currency: string;
}

const PurchaseInvoicesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['purchase_invoices', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_invoices')
        .select('*, vendors(name)')
        .eq('user_id', user?.id)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      return (data as unknown) as PurchaseInvoice[];
    },
    enabled: !!user
  });

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    let filtered = invoices;
    
    if (activeTab === "pending") {
      filtered = filtered.filter(inv => inv.status === "pending");
    } else if (activeTab === "paid") {
      filtered = filtered.filter(inv => inv.status === "paid");
    }

    return filtered.filter(inv => 
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.vendors?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm, activeTab]);

  const handleMarkAsPaid = async (id: string) => {
    try {
      const { error } = await supabase
        .from('purchase_invoices')
        .update({ status: 'paid' })
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Bill marked as paid." });
      queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this purchase bill?")) return;
    
    try {
      const { error } = await supabase
        .from('purchase_invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Purchase bill deleted." });
      queryClient.invalidateQueries({ queryKey: ['purchase_invoices'] });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete purchase bill." });
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">Purchase Bills</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage procurement expenses and vendor bills</p>
        </div>
        <Button onClick={() => navigate('/create-invoice?type=purchase')} className="w-full sm:w-auto h-11 text-sm font-bold rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> New Purchase Bill
        </Button>
      </div>

      <Card className="p-4 border-none shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search bills..." 
              className="pl-10 h-11 bg-background border-border/50 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-auto">
            <TabsList className="bg-muted/50 p-1 rounded-xl w-full flex overflow-x-auto no-scrollbar border border-border/40 backdrop-blur-sm">
              <TabsTrigger value="all" className="flex-1 lg:flex-none rounded-lg font-bold data-[state=active]:bg-hero-gradient data-[state=active]:text-white h-9 px-3 text-xs md:text-sm">
                All ({invoices?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex-1 lg:flex-none rounded-lg font-bold data-[state=active]:bg-hero-gradient data-[state=active]:text-white h-9 px-3 text-xs md:text-sm">
                Pending ({invoices?.filter(i => i.status === 'pending').length || 0})
              </TabsTrigger>
              <TabsTrigger value="paid" className="flex-1 lg:flex-none rounded-lg font-bold data-[state=active]:bg-hero-gradient data-[state=active]:text-white h-9 px-3 text-xs md:text-sm">
                Paid ({invoices?.filter(i => i.status === 'paid').length || 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
            <div className="min-w-[800px] sm:min-w-full">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-b-2">
                    <TableHead className="w-[140px] font-black uppercase tracking-widest text-[10px]">Bill Number</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">Vendor</TableHead>
                    <TableHead className="hidden md:table-cell font-black uppercase tracking-widest text-[10px]">Date</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">Amount</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px] text-center">Status</TableHead>
                    <TableHead className="w-[180px] font-black uppercase tracking-widest text-[10px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground font-medium">
                        No purchase bills found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <TableRow key={inv.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-border/40">
                        <TableCell className="font-bold text-sm tracking-tight">{inv.invoice_number}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{inv.vendors?.name || 'Unknown'}</span>
                            <span className="md:hidden text-[10px] text-muted-foreground font-medium leading-none mt-1">
                              {new Date(inv.issue_date).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs font-medium text-slate-500">
                          {new Date(inv.issue_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-black text-sm">
                          {inv.currency === 'USD' ? '$' : (inv.currency === 'EUR' ? '€' : (inv.currency === 'GBP' ? '£' : '₹'))}
                          {inv.total_amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={inv.status as 'paid' | 'overdue' | 'draft' | 'sent' | 'viewed' | 'pending'} className="px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wider" />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <TooltipProvider>
                              <div className="flex items-center gap-1 sm:gap-2">
                                {inv.status === 'pending' && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 md:h-9 md:w-9 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg" 
                                        onClick={() => handleMarkAsPaid(inv.id)}
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Mark as Paid</TooltipContent>
                                  </Tooltip>
                                )}
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 md:h-9 md:w-9 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg" 
                                      onClick={() => {
                                        setPreviewInvoiceId(inv.id);
                                        setIsPreviewDialogOpen(true);
                                      }}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Preview Bill</TooltipContent>
                                </Tooltip>
          
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 md:h-9 md:w-9 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg" 
                                      onClick={() => {
                                        setEditingInvoiceId(inv.id);
                                        setIsEditDialogOpen(true);
                                      }}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit Bill</TooltipContent>
                                </Tooltip>
          
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 md:h-9 md:w-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg" 
                                      onClick={() => handleDelete(inv.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete Bill</TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Card>

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
    </div>
  );
};

export default PurchaseInvoicesPage;
