import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Users, EyeOff, User, MapPin, ShieldCheck, Check, Info, CreditCard, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SuccessModal } from "@/components/SuccessModal";
import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LayoutGrid, List as ListIcon } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  gstin: string;
  hide_contact_details: boolean;
  pending_amount?: number;
}

import { useClients } from "@/hooks/useClients";
import { useQueryClient } from "@tanstack/react-query";

const ClientsPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || "";
  const initialClientId = searchParams.get('id') || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const { data, isLoading: loading, isFetching: searchLoading } = useClients({
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
    searchTerm: debouncedSearch
  });

  const clients = data?.clients || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    gstin: '',
    hide_contact_details: false
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewClientDialog, setViewClientDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: '', message: '' });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchClients = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  }, [queryClient]);

  // Handle specific client navigation from global search
  useEffect(() => {
    const findClientPage = async () => {
      if (initialClientId && user) {
        try {
          // Get all client IDs ordered by created_at DESC to find the position
          const { data } = await supabase
            .from('clients')
            .select('id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (data) {
            const index = data.findIndex(c => c.id === initialClientId);
            if (index !== -1) {
              const page = Math.ceil((index + 1) / ITEMS_PER_PAGE);
              setCurrentPage(page);
            }
          }
        } catch (err) {
          console.error("Error finding client page:", err);
        }
      }
    };

    if (user) {
      findClientPage();
    }
  }, [initialClientId, user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user, debouncedSearch, fetchClients, currentPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];
    if (!formData.name.trim()) errors.push("Client name is required.");
    if (!formData.phone.trim()) errors.push("Phone number is required.");
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Please enter a valid email address.");
    }
    const gstinTrimmed = formData.gstin.trim();
    if (gstinTrimmed && gstinTrimmed.length !== 15) {
      // Just a warning in console if needed, but not blocking as per user request
      console.warn("GSTIN is usually 15 characters, but allowing custom saving.");
    }

    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Validation Failed",
        description: (
          <ul className="list-disc list-inside text-xs mt-1">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        )
      });
      return;
    }

    try {
      const finalizedData = {
        ...formData,
        gstin: formData.gstin.trim(),
        name: formData.name.trim(),
        email: formData.email.trim()
      };

      if (editingId) {
        const { error } = await supabase
          .from('clients')
          .update(finalizedData)
          .eq('id', editingId)
          .eq('user_id', user?.id);

        if (error) throw error;
        setSuccessInfo({
          title: 'Client Updated',
          message: 'Client profile has been successfully synchronized with your records.'
        });
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([{ ...finalizedData, user_id: user?.id }]);

        if (error) throw error;
        setSuccessInfo({
          title: 'Client Registered',
          message: 'Success! Your new client discovery is now part of your network.'
        });
      }

      resetForm();
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDialogOpen(false);
      setShowSuccess(true);
    } catch (error: unknown) {
      console.error('Error saving client:', error);

      const maybeError = typeof error === "object" && error !== null ? (error as { code?: unknown; message?: unknown }) : null;
      let errorMessage = "An unexpected error occurred.";
      if (maybeError?.code === '23505') errorMessage = "A client with this information already exists.";
      else if (typeof maybeError?.message === "string") errorMessage = maybeError.message;

      toast({
        variant: "destructive",
        title: "Save Failed",
        description: (
          <div className="mt-2 text-sm">
            <p className="font-semibold text-destructive">{errorMessage}</p>
            <div className="mt-2 p-2 bg-destructive/5 rounded border border-destructive/10 text-[10px]">
              <p className="font-bold uppercase tracking-widest opacity-70 mb-1">Troubleshooting:</p>
              <ul className="list-disc list-inside space-y-0.5 opacity-90">
                <li>Name: {formData.name || "N/A"}</li>
                <li>Phone: {formData.phone || "N/A"}</li>
                <li>Session: {user?.id ? "Active" : "Expired"}</li>
              </ul>
            </div>
          </div>
        )
      });
    }
  };

  const handleEdit = (client: Client) => {
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      city: client.city,
      state: client.state,
      postal_code: client.postal_code,
      country: client.country,
      gstin: client.gstin,
      hide_contact_details: client.hide_contact_details ?? false
    });
    setEditingId(client.id);
    setEditingId(client.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setIdToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;

    try {
      // Check if client has any linked invoices
      const { data: linkedInvoices, error: linkError } = await supabase
        .from('invoices')
        .select('id')
        .eq('client_id', idToDelete)
        .limit(1);

      if (linkError) throw linkError;

      if (linkedInvoices && linkedInvoices.length > 0) {
        toast({
          variant: "destructive",
          title: "Cannot Delete Client",
          description: "This client has linked invoices. Please delete or reassign them first."
        });
        return;
      }

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', idToDelete);

      if (error) throw error;

      setShowDeleteConfirm(false);
      setSuccessInfo({
        title: 'Client Deleted',
        message: 'The client has been permanently removed from your list.'
      });
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete client."
      });
    } finally {
      setIdToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India',
      gstin: '',
      hide_contact_details: false
    });
    setEditingId(null);
    setEditingId(null);
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your client relationships</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="lg" className="w-full sm:w-auto h-11" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background max-h-[90vh] flex flex-col">
            <DialogHeader className="p-4 md:p-8 pb-4 shrink-0">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                {editingId ? 'Edit Client Profile' : 'Register New Client'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                {editingId ? 'Update client details below.' : 'Add a new client to your business records.'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
              <form id="client-modal-form" onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <User className="w-4 h-4" />
                    <h3 className="font-semibold text-sm uppercase tracking-wider">Basic Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="name">Client / Company Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g. Acme Corporation"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contact@acme.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        pattern="[0-9]{10}"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <MapPin className="w-4 h-4" />
                    <h3 className="font-semibold text-sm uppercase tracking-wider">Address Details</h3>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Business Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Street, Area, Building..."
                      className="resize-none min-h-[80px]"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        placeholder="State"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">PIN Code</Label>
                      <Input
                        id="postal_code"
                        placeholder="6-digit ZIP"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Compliance Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck className="w-4 h-4" />
                    <h3 className="font-semibold text-sm uppercase tracking-wider">Tax & Compliance</h3>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstin">GSTIN Number (Optional)</Label>
                    <Input
                      id="gstin"
                      placeholder="22AAAAA0000A1Z5"
                      className="uppercase"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      onBlur={() => setFormData({ ...formData, gstin: formData.gstin.trim() })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-md border bg-muted/30">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Show Name Only on Invoice</Label>
                      <p className="text-xs text-muted-foreground">Hide detailed contact info on generated PDFs</p>
                    </div>
                    <Checkbox
                      checked={formData.hide_contact_details}
                      onCheckedChange={(checked) => setFormData({ ...formData, hide_contact_details: !!checked })}
                    />
                  </div>
                </div>
              </form>
            </div>

            <DialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5 shrink-0">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 h-11 font-bold rounded-xl border-2">
                Cancel
              </Button>
              <Button
                type="submit"
                form="client-modal-form"
                className="flex-1 h-11 font-black rounded-xl shadow-lg shadow-primary/20"
              >
                {editingId ? 'Update Client' : 'Create Client'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, phone or GSTIN..."
          className="pl-10 h-11 bg-background border-border/50 rounded-xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {loading ? (
        <div className={cn(
          "grid gap-4",
          viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 md:p-6 rounded-2xl border-border bg-card shadow-sm">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
                <div className="space-y-3 flex-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <Card className="p-6 md:p-12 text-center border-dashed bg-card/50">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-bold mb-2">No Clients Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
            Start by adding your first client to manage relationships.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Client
          </Button>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map((client) => (
                <Card
                  key={client.id}
                  className="group hover:border-primary transition-all cursor-pointer p-5 flex flex-col h-full"
                  onClick={() => {
                    setSelectedClient(client);
                    setViewClientDialog(true);
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{client.name}</h3>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs text-muted-foreground font-medium">{client.email || 'No email'}</p>
                        <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider">{client.phone || 'No phone'}</p>
                      </div>
                      {client.pending_amount !== undefined && client.pending_amount > 0 && (
                        <div className="mt-2 text-rose-600 font-bold text-xs flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          Pending: ₹{client.pending_amount.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/5 hover:text-primary transition-colors"
                        onClick={(e) => { e.stopPropagation(); handleEdit(client); }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                        onClick={(e) => { e.stopPropagation(); handleDelete(client.id); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>

              ))}
              <Card
                className="border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 cursor-pointer flex flex-col items-center justify-center p-4 md:p-8 min-h-[160px]"
                onClick={() => { resetForm(); setDialogOpen(true); }}
              >
                <Plus className="w-8 h-8 text-primary mb-2" />
                <span className="text-sm font-semibold">Add New Client</span>
              </Card>
            </div>
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Pending Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedClient(client);
                        setViewClientDialog(true);
                      }}
                    >
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.email || '-'}</TableCell>
                      <TableCell>{client.phone || '-'}</TableCell>
                      <TableCell>{client.city || '-'}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-bold",
                          (client.pending_amount || 0) > 0 ? "text-rose-600" : "text-emerald-600"
                        )}>
                          ₹{(client.pending_amount || 0).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(client)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(client.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
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
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmDelete}
        title="Remove Client Profile?"
        description="Are you sure you want to delete this client? This action is permanent and only possible if no invoices are linked."
      />

      <SuccessModal
        isOpen={showSuccess}
        onOpenChange={setShowSuccess}
        title={successInfo.title}
        message={successInfo.message}
      />

      {/* View Client Details Dialog */}
      <Dialog open={viewClientDialog} onOpenChange={setViewClientDialog}>
        <DialogContent className="sm:max-w-[700px] bg-background border-none shadow-2xl overflow-hidden p-0 rounded-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="p-4 md:p-8 pb-4 shrink-0">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
              {selectedClient?.name}
            </DialogTitle>
            <div className="flex items-center gap-2 mt-2">
              {selectedClient?.gstin ? (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                  GST Registered
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                  Unregistered
                </span>
              )}
              {selectedClient?.hide_contact_details && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest">
                  Privacy Active
                </span>
              )}
            </div>
          </DialogHeader>

           <div className="p-4 md:p-6 bg-muted/5 flex-1 overflow-y-auto space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-background border border-border rounded-md p-4 space-y-4">
                 <div className="flex items-center gap-2 border-b border-border pb-2 mb-2">
                   <User className="w-3.5 h-3.5 text-primary" />
                   <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contact Details</p>
                 </div>
 
                 <div className="space-y-3">
                   <div>
                     <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email Address</p>
                     <p className="text-sm font-medium text-foreground">{selectedClient?.email || 'Not Provided'}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Phone Number</p>
                     <p className="text-sm font-medium text-foreground">{selectedClient?.phone || 'Not Provided'}</p>
                   </div>
                 </div>
               </div>
 
               <div className="bg-background border border-border rounded-md p-4 space-y-4">
                 <div className="flex items-center gap-2 border-b border-border pb-2 mb-2">
                   <MapPin className="w-3.5 h-3.5 text-primary" />
                   <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Address Info</p>
                 </div>
 
                 <div className="space-y-3">
                   <div>
                     <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Primary Address</p>
                     <p className="text-sm font-medium text-foreground leading-relaxed">{selectedClient?.address || 'No address specified'}</p>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">City</p>
                       <p className="text-xs font-medium text-foreground">{selectedClient?.city || '—'}</p>
                     </div>
                     <div>
                       <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">State</p>
                       <p className="text-xs font-medium text-foreground">{selectedClient?.state || '—'}</p>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
 
             <div className="bg-background border border-border rounded-md p-4 space-y-4">
               <div className="flex items-center gap-2 border-b border-border pb-2 mb-2">
                 <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                 <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Compliance & Legal</p>
               </div>
 
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">GSTIN Registered</p>
                   <p className="text-sm font-semibold text-primary uppercase">
                     {selectedClient?.gstin || 'No GST Details Provided'}
                   </p>
                 </div>
                 <div>
                   <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Data Visibility</p>
                   <p className="text-sm font-medium text-foreground">
                     {selectedClient?.hide_contact_details
                       ? 'Privacy Enabled'
                       : 'Standard Visibility'}
                   </p>
                 </div>
               </div>
             </div>
           </div>

           <DialogFooter className="p-4 border-t border-border bg-muted/20 sm:justify-end items-center flex-row gap-3">
             <Button
               variant="outline"
               className="flex-1 sm:flex-none font-semibold h-9 px-4 rounded-md text-xs"
               onClick={() => setViewClientDialog(false)}
             >
               Close
             </Button>
             <Button
               className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white font-semibold h-9 px-5 rounded-md text-xs transition-all active:scale-95"
               onClick={() => {
                 setViewClientDialog(false);
                 if (selectedClient) handleEdit(selectedClient);
               }}
             >
               <Edit className="w-3.5 h-3.5 mr-2" />
               Edit Profile
             </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsPage;
