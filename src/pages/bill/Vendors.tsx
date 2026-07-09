import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Users, User, MapPin, ShieldCheck, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SuccessModal } from "@/components/SuccessModal";
import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useVendors } from "@/hooks/useVendors";
import { useQueryClient } from "@tanstack/react-query";

export interface Vendor {
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
}

const VendorsPage = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [viewMode] = useState<'grid' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const { data, isLoading: loading, isFetching: searchLoading } = useVendors({
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
    searchTerm: debouncedSearch
  });

  const vendors = (data as unknown as { vendors: Vendor[] })?.vendors || [];
  const totalCount = (data as unknown as { totalCount: number })?.totalCount || 0;
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
    gstin: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewVendorDialog, setViewVendorDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: '', message: '' });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchVendors = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ['vendors'] });
  }, [queryClient]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (user) {
      fetchVendors();
    }
  }, [user, debouncedSearch, fetchVendors, currentPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];
    if (!formData.name.trim()) errors.push("Vendor name is required.");
    if (!formData.phone.trim()) errors.push("Phone number is required.");
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Please enter a valid email address.");
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
          .from('vendors')
          .update(finalizedData)
          .eq('id', editingId)
          .eq('user_id', user?.id);

        if (error) throw error;
        setSuccessInfo({
          title: 'Vendor Updated',
          message: 'Vendor profile has been successfully updated.'
        });
      } else {
        const { error } = await supabase
          .from('vendors')
          .insert([{ ...finalizedData, user_id: user?.id }]);

        if (error) throw error;
        setSuccessInfo({
          title: 'Vendor Registered',
          message: 'Success! New vendor has been added to your procurement list.'
        });
      }

      resetForm();
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setDialogOpen(false);
      setShowSuccess(true);
    } catch (error: unknown) {
      console.error('Error saving vendor:', error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Failed to save vendor details."
      });
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setFormData({
      name: vendor.name,
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      postal_code: vendor.postal_code || '',
      country: vendor.country || 'India',
      gstin: vendor.gstin || ''
    });
    setEditingId(vendor.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setIdToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;

    try {
      // Check if vendor has any linked products
      const { data: linkedProducts } = await supabase
        .from('products')
        .select('id')
        .eq('vendor_id', idToDelete)
        .limit(1);

      if (linkedProducts && linkedProducts.length > 0) {
        toast({
          variant: "destructive",
          title: "Cannot Delete Vendor",
          description: "This vendor is linked to products. Please remove the link first."
        });
        return;
      }

      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', idToDelete);

      if (error) throw error;

      setShowDeleteConfirm(false);
      setSuccessInfo({
        title: 'Vendor Deleted',
        message: 'The vendor has been permanently removed.'
      });
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete vendor."
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
      gstin: ''
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Vendors</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your procurement partners</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="lg" className="w-full sm:w-auto h-11" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background max-h-[90vh] flex flex-col">
            <DialogHeader className="p-4 md:p-6 pb-2 shrink-0">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
                <User className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                {editingId ? 'Edit Vendor Profile' : 'Register New Vendor'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                {editingId ? 'Update vendor details below.' : 'Add a new vendor to your business records.'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 py-2 bg-background">
              <form id="vendor-modal-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <User className="w-4 h-4" />
                    <h3 className="font-semibold text-sm uppercase tracking-wider">Basic Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="name">Vendor / Company Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g. Wholesale Supplies Co."
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
                        placeholder="contact@wholesale.com"
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

                <div className="space-y-3">
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

                <div className="space-y-3">
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
                    />
                  </div>
                </div>
              </form>
            </div>

            <DialogFooter className="p-4 md:p-6 pt-2 flex flex-row gap-3 bg-muted/5 shrink-0">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 h-11 font-bold rounded-xl border-2">
                Cancel
              </Button>
              <Button
                type="submit"
                form="vendor-modal-form"
                className="flex-1 h-11 font-black rounded-xl shadow-lg shadow-primary/20"
              >
                {editingId ? 'Update Vendor' : 'Create Vendor'}
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
        <div className="grid grid-cols-1 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <Card className="p-6 md:p-12 text-center border-dashed bg-card/50">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-bold mb-2">No Vendors Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
            Start by adding your first procurement partner.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Vendor
          </Button>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow
                    key={vendor.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedVendor(vendor as Vendor);
                      setViewVendorDialog(true);
                    }}
                  >
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>{vendor.email || '-'}</TableCell>
                    <TableCell>{vendor.phone || '-'}</TableCell>
                    <TableCell>{vendor.city || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(vendor)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete((vendor as Vendor).id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

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
        title="Remove Vendor Profile?"
        description="Are you sure you want to delete this vendor? This action is permanent and only possible if no products are linked."
      />

      <SuccessModal
        isOpen={showSuccess}
        onOpenChange={setShowSuccess}
        title={successInfo.title}
        message={successInfo.message}
      />

      <Dialog open={viewVendorDialog} onOpenChange={setViewVendorDialog}>
        <DialogContent className="sm:max-w-[700px] bg-background border-none shadow-2xl overflow-hidden p-0 rounded-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="p-4 md:p-6 pb-2 shrink-0">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
              <User className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
              {selectedVendor?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 md:p-6 pb-2 bg-muted/5 flex-1 overflow-y-auto space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-background border border-border rounded-md p-4 space-y-4">
                 <div className="flex items-center gap-2 border-b border-border pb-2 mb-2">
                   <User className="w-3.5 h-3.5 text-primary" />
                   <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contact Details</p>
                 </div>
                 <div className="space-y-3">
                   <div>
                     <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email Address</p>
                     <p className="text-sm font-medium text-foreground">{selectedVendor?.email || 'Not Provided'}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Phone Number</p>
                     <p className="text-sm font-medium text-foreground">{selectedVendor?.phone || 'Not Provided'}</p>
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
                     <p className="text-sm font-medium text-foreground leading-relaxed">{selectedVendor?.address || 'No address specified'}</p>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">City</p>
                       <p className="text-xs font-medium text-foreground">{selectedVendor?.city || '—'}</p>
                     </div>
                     <div>
                       <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">State</p>
                       <p className="text-xs font-medium text-foreground">{selectedVendor?.state || '—'}</p>
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
               <div>
                 <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">GSTIN Registered</p>
                 <p className="text-sm font-semibold text-primary uppercase">
                   {selectedVendor?.gstin || 'No GST Details Provided'}
                 </p>
               </div>
             </div>
          </div>

          <DialogFooter className="p-2 px-4 md:px-6 border-t border-border bg-muted/20 sm:justify-end items-center flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none font-semibold h-9 px-4 rounded-md text-xs"
              onClick={() => setViewVendorDialog(false)}
            >
              Close
            </Button>
            <Button
              className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white font-semibold h-9 px-5 rounded-md text-xs transition-all active:scale-95"
              onClick={() => {
                setViewVendorDialog(false);
                if (selectedVendor) handleEdit(selectedVendor);
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

export default VendorsPage;
