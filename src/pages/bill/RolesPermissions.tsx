import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DataTablePagination } from "@/components/DataTablePagination";
import { supabase, serviceSupabase } from "@/integrations/supabase/client";
import { generateAccountId } from '@/utils/accountId';
import { formatStaffCredentialsWhatsAppMessage, normalizeWhatsAppNumber, openWhatsAppChat } from '@/utils/whatsappTemplates';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Key, 
  Copy, 
  Check, 
  Search, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Sparkles,
  Phone,
  Mail,
  MoreHorizontal,
  UserCheck,
  Power,
  Share2,
  Shield,
  Filter,
  MessageSquare
} from "lucide-react";
import { safelyToLocaleDate } from "@/utils/dateUtils";


export interface StaffMember {
  id: string;
  company_owner_id: string;
  user_id?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  permissions: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
  temp_password?: string;
}

export const AVAILABLE_PERMISSIONS = [
  { id: 'invoices', label: 'Sales Invoices', description: 'Create, view, and manage client tax invoices' },
  { id: 'purchase-invoices', label: 'Purchase Bills', description: 'Record and track vendor purchase bills' },
  { id: 'clients', label: 'Client Directory', description: 'Manage client accounts and billing records' },
  { id: 'vendors', label: 'Vendor Directory', description: 'Manage supplier and vendor relationships' },
  { id: 'products', label: 'Inventory & Catalog', description: 'Maintain product rates, stock, and HSN codes' },
  { id: 'payments', label: 'Payments & Receipts', description: 'Log incoming and outgoing payment transactions' },
  { id: 'expenses', label: 'Company Expenses', description: 'Track business expenses and categories' },
  { id: 'einvoice', label: 'E-Way & E-Invoice', description: 'Generate GST compliant e-invoices and waybills' },
];

export const ROLE_PRESETS: Record<string, { name: string; permissions: string[] }> = {
  Accountant: {
    name: 'Accountant',
    permissions: ['invoices', 'purchase-invoices', 'payments', 'expenses', 'einvoice']
  },
  'Sales Executive': {
    name: 'Sales Executive',
    permissions: ['invoices', 'clients', 'products']
  },
  'Inventory Manager': {
    name: 'Inventory Manager',
    permissions: ['purchase-invoices', 'vendors', 'products']
  },
  'Billing Operator': {
    name: 'Billing Operator',
    permissions: ['invoices', 'clients', 'payments']
  },
  Custom: {
    name: 'Custom',
    permissions: []
  }
};

const LOCAL_STORAGE_STAFF_KEY = 'escrow_company_staff_backup';

export default function RolesPermissions() {
  const { user, profile, isStaff } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [deleteStaffTarget, setDeleteStaffTarget] = useState<StaffMember | null>(null);

  // Form states
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('Accountant');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password reset state
  const [targetStaffForPassword, setTargetStaffForPassword] = useState<StaffMember | null>(null);
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Credentials display state
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password?: string;
    role: string;
    loginUrl: string;
    phone?: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const generateRandomNewPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%';
    let generated = '';
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewStaffPassword(generated);
  };

  const handleRolePresetChange = (roleKey: string) => {
    setSelectedRole(roleKey);
    if (ROLE_PRESETS[roleKey] && roleKey !== 'Custom') {
      setSelectedPermissions(ROLE_PRESETS[roleKey].permissions);
    }
  };

  const handleTogglePermission = (permId: string) => {
    setSelectedPermissions(prev => {
      const next = prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId];
      const matchedPreset = Object.keys(ROLE_PRESETS).find(key => {
        if (key === 'Custom') return false;
        const presetPerms = ROLE_PRESETS[key].permissions;
        return presetPerms.length === next.length && presetPerms.every(p => next.includes(p));
      });
      setSelectedRole(matchedPreset || 'Custom');
      return next;
    });
  };

  const loadStaff = useCallback(async () => {
    if (!user?.id) return;
    try {
      let fetchedList: StaffMember[] = [];

      // Step 0: Read existing cached passwords from localStorage across workspace
      const localStaffCache = new Map<string, string>();
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(LOCAL_STORAGE_STAFF_KEY)) {
            const cached = localStorage.getItem(key);
            if (cached) {
              const list = JSON.parse(cached);
              if (Array.isArray(list)) {
                list.forEach((s: any) => {
                  if (s && s.email && s.temp_password) {
                    localStaffCache.set(s.email.toLowerCase().trim(), s.temp_password);
                  }
                });
              }
            }
          }
        }
      } catch (e) {
        console.warn("Error inspecting local staff cache:", e);
      }

      // 1. Fetch from company_staff table
      try {
        const { data, error } = await (serviceSupabase as any)
          .from('company_staff')
          .select('*')
          .eq('company_owner_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          fetchedList = data.map((item: any) => {
            const staffEmail = (item.email || '').toLowerCase().trim();
            const cachedPwd = localStaffCache.get(staffEmail);
            return {
              ...item,
              temp_password: cachedPwd || undefined,
              permissions: Array.isArray(item.permissions) 
                ? item.permissions 
                : typeof item.permissions === 'string' 
                  ? JSON.parse(item.permissions) 
                  : []
            };
          });
        }
      } catch (err) {
        console.warn("Error querying company_staff:", err);
      }

      // 2. Fetch from Auth admin users list (where company_id = ownerId) and attach metadata passwords
      try {
        const { data: userListData } = await (serviceSupabase as any).auth.admin.listUsers();
        if (userListData?.users) {
          userListData.users.forEach((u: any) => {
            if (u.id === user.id) return;
            const meta = u.user_metadata || {};
            const cleanEmail = (u.email || '').toLowerCase().trim();
            const userPwd = meta.initial_password || meta.temp_password || null;

            const existing = fetchedList.find(s => 
              (s.user_id && s.user_id === u.id) || 
              (s.email && s.email.toLowerCase().trim() === cleanEmail)
            );

            if (existing) {
              if (userPwd && !existing.temp_password) {
                existing.temp_password = userPwd;
              }
              if (!existing.user_id) {
                existing.user_id = u.id;
              }
            } else if ((meta.company_id === user.id || (meta.is_staff && meta.company_id === user.id)) && u.email) {
              fetchedList.push({
                id: crypto.randomUUID(),
                company_owner_id: user.id,
                user_id: u.id,
                name: meta.full_name || meta.name || u.email.split('@')[0],
                email: u.email,
                phone: meta.mobile || null,
                role: meta.staff_role || 'Staff',
                permissions: ['invoices', 'clients', 'products', 'purchase_invoices', 'payments', 'expenses'],
                status: 'active',
                created_at: u.created_at || new Date().toISOString(),
                temp_password: userPwd || localStaffCache.get(cleanEmail) || undefined
              });
            }
          });
        }
      } catch (err) {
        console.warn("Error querying staff auth users:", err);
      }

      // 3. Fallback to localStorage backup across workspace
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(LOCAL_STORAGE_STAFF_KEY)) {
            const cached = localStorage.getItem(key);
            if (cached) {
              const list = JSON.parse(cached);
              if (Array.isArray(list)) {
                list.forEach((s: any) => {
                  if (s && s.email) {
                    const cleanEmail = s.email.toLowerCase().trim();
                    const existing = fetchedList.find(existing => 
                      (s.user_id && existing.user_id === s.user_id) || 
                      (existing.email && existing.email.toLowerCase().trim() === cleanEmail)
                    );
                    if (existing) {
                      if (s.temp_password && !existing.temp_password) {
                        existing.temp_password = s.temp_password;
                      }
                    } else {
                      fetchedList.push({
                        ...s,
                        company_owner_id: user.id,
                        permissions: Array.isArray(s.permissions) ? s.permissions : []
                      });
                    }
                  }
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn("Error reading localStorage staff:", err);
      }

      setStaffList(fetchedList);
      if (fetchedList.length > 0) {
        localStorage.setItem(`${LOCAL_STORAGE_STAFF_KEY}_${user.id}`, JSON.stringify(fetchedList));
      }
    } catch (err) {
      console.error("Error loading staff list:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleOpenEdit = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFullName(staff.name);
    setEmail(staff.email);
    setPhone(staff.phone || '');
    setSelectedRole(staff.role);
    setSelectedPermissions(staff.permissions || []);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !user?.id) return;

    setIsSubmitting(true);
    try {
      const updatedPermissions = selectedPermissions;

      try {
        await (serviceSupabase as any)
          .from('company_staff')
          .update({
            name: fullName.trim(),
            phone: phone.trim() || null,
            role: selectedRole,
            permissions: updatedPermissions,
            updated_at: new Date().toISOString()
          })
          .eq('company_owner_id', user.id)
          .ilike('email', editingStaff.email);

        if (editingStaff.user_id && editingStaff.user_id !== user.id) {
          await (serviceSupabase as any)
            .from('profiles')
            .update({
              staff_role: selectedRole,
              staff_permissions: updatedPermissions,
              phone: phone.trim() || null,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', editingStaff.user_id);
        }

        // Broadcast realtime update to staff sessions
        const syncChannel = supabase.channel('escrow_staff_sync');
        syncChannel.send({
          type: 'broadcast',
          event: 'staff_updated',
          payload: { email: editingStaff.email, role: selectedRole, permissions: updatedPermissions }
        }).catch(() => {});
      } catch (err) {
        console.warn("DB update error:", err);
      }

      const updatedList = staffList.map(s => {
        if (s.id === editingStaff.id || s.email.toLowerCase() === editingStaff.email.toLowerCase()) {
          return {
            ...s,
            name: fullName.trim(),
            phone: phone.trim() || null,
            role: selectedRole,
            permissions: updatedPermissions,
            updated_at: new Date().toISOString()
          };
        }
        return s;
      });

      setStaffList(updatedList);
      localStorage.setItem(`${LOCAL_STORAGE_STAFF_KEY}_${user.id}`, JSON.stringify(updatedList));
      setIsEditModalOpen(false);
      setEditingStaff(null);

      toast({
        title: "Staff Updated",
        description: `Privileges for ${fullName} updated successfully.`,
      });
    } catch (err: any) {
      console.error("Error updating staff:", err);
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update staff details.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff: StaffMember) => {
    if (!user?.id) return;
    const nextStatus = staff.status === 'active' ? 'inactive' : 'active';
    try {
      await (serviceSupabase as any)
        .from('company_staff')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('company_owner_id', user.id)
        .ilike('email', staff.email);

      if (staff.user_id && staff.user_id !== user.id) {
        await (serviceSupabase as any)
          .from('profiles')
          .update({ is_blocked: nextStatus === 'inactive', updated_at: new Date().toISOString() })
          .eq('user_id', staff.user_id);
      }

      // Broadcast realtime update to staff sessions
      const syncChannel = supabase.channel('escrow_staff_sync');
      syncChannel.send({
        type: 'broadcast',
        event: 'staff_status_changed',
        payload: { email: staff.email, status: nextStatus }
      }).catch(() => {});

      const updatedList: StaffMember[] = staffList.map(s => s.id === staff.id ? { ...s, status: nextStatus as 'active' | 'inactive' } : s);
      setStaffList(updatedList);
      localStorage.setItem(`${LOCAL_STORAGE_STAFF_KEY}_${user.id}`, JSON.stringify(updatedList));

      toast({
        title: `Staff ${nextStatus === 'active' ? 'Activated' : 'Deactivated'}`,
        description: `${staff.name} is now ${nextStatus}.`
      });
    } catch (err) {
      console.error("Status toggle error:", err);
    }
  };

  const handleOpenPasswordModal = (staff: StaffMember) => {
    setTargetStaffForPassword(staff);
    setNewStaffPassword('');
    setIsPasswordModalOpen(true);
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStaffForPassword || !newStaffPassword || newStaffPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanTargetEmail = targetStaffForPassword.email.toLowerCase().trim();
      let targetAuthId = targetStaffForPassword.user_id;

      // If user_id is missing or erroneously points to the company owner, resolve real auth user
      if (!targetAuthId || targetAuthId === user?.id) {
        const { data: userListData } = await (serviceSupabase as any).auth.admin.listUsers();
        const found = userListData?.users?.find((u: any) => u.email?.toLowerCase() === cleanTargetEmail);
        if (found) {
          targetAuthId = found.id;
        } else {
          // If staff member does not exist in Auth, create an Auth account for them
          const { data: createdAuth, error: createErr } = await (serviceSupabase as any).auth.admin.createUser({
            email: cleanTargetEmail,
            password: newStaffPassword,
            email_confirm: true,
            user_metadata: {
              full_name: targetStaffForPassword.name,
              mobile: targetStaffForPassword.phone || '',
              company_id: user.id,
              company_name: profile?.company_name || 'Escrow Company',
              is_staff: true,
              staff_role: targetStaffForPassword.role,
              initial_password: newStaffPassword,
              temp_password: newStaffPassword
            }
          });
          if (createErr) throw createErr;
          if (createdAuth?.user) {
            targetAuthId = createdAuth.user.id;
          }
        }

        // Link the correct user_id in company_staff table
        if (targetAuthId) {
          await (serviceSupabase as any)
            .from('company_staff')
            .update({ user_id: targetAuthId, updated_at: new Date().toISOString() })
            .eq('id', targetStaffForPassword.id);

          setStaffList(prev => prev.map(s => s.id === targetStaffForPassword.id ? { ...s, user_id: targetAuthId } : s));
        }
      }

      // Update password for targetAuthId — NEVER for the company owner!
      if (targetAuthId && targetAuthId !== user?.id) {
        const { error: pwdErr } = await (serviceSupabase as any).auth.admin.updateUserById(
          targetAuthId,
          { 
            password: newStaffPassword,
            email_confirm: true,
            user_metadata: {
              full_name: targetStaffForPassword.name,
              mobile: targetStaffForPassword.phone || '',
              company_id: user.id,
              company_name: profile?.company_name || 'Escrow Company',
              is_staff: true,
              staff_role: targetStaffForPassword.role,
              initial_password: newStaffPassword,
              temp_password: newStaffPassword
            }
          }
        );
        if (pwdErr) throw pwdErr;
      }

      // Update staffList state and persist to localStorage so temp_password is kept for table WhatsApp
      setStaffList(prev => {
        const updated = prev.map(s => {
          if (s.id === targetStaffForPassword.id || s.email.toLowerCase().trim() === cleanTargetEmail) {
            return {
              ...s,
              user_id: targetAuthId || s.user_id,
              temp_password: newStaffPassword
            };
          }
          return s;
        });
        if (user?.id) {
          localStorage.setItem(`${LOCAL_STORAGE_STAFF_KEY}_${user.id}`, JSON.stringify(updated));
        }
        return updated;
      });

      const loginUrl = `${window.location.origin}/auth`;
      setCreatedCredentials({
        name: targetStaffForPassword.name,
        email: targetStaffForPassword.email,
        password: newStaffPassword,
        role: targetStaffForPassword.role,
        loginUrl: loginUrl,
        phone: targetStaffForPassword.phone || undefined
      });

      setIsPasswordModalOpen(false);
      setIsSuccessModalOpen(true);

      toast({
        title: "Credentials Updated",
        description: `New password saved for ${targetStaffForPassword.name}.`,
      });
    } catch (err: any) {
      console.error("Password update error:", err);
      toast({
        title: "Password Update Failed",
        description: err.message || "Failed to update password.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deleteStaffTarget || !user?.id) return;
    try {
      const cleanEmail = deleteStaffTarget.email.toLowerCase().trim();
      let targetAuthId = deleteStaffTarget.user_id;

      // Find auth user ID if missing
      if (!targetAuthId) {
        try {
          const { data: userListData } = await (serviceSupabase as any).auth.admin.listUsers();
          const found = userListData?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail);
          if (found) targetAuthId = found.id;
        } catch (e) {
          console.warn("Could not find user in auth list:", e);
        }
      }

      // 1. Delete from company_staff table
      await (serviceSupabase as any)
        .from('company_staff')
        .delete()
        .eq('company_owner_id', user.id)
        .ilike('email', cleanEmail);

      // 2. Delete from profiles table (guard: NEVER delete owner's profile!)
      if (targetAuthId && targetAuthId !== user.id) {
        await (serviceSupabase as any)
          .from('profiles')
          .delete()
          .eq('user_id', targetAuthId);
      }

      // 3. Delete from Supabase Auth completely (guard: NEVER delete owner's account!)
      if (targetAuthId && targetAuthId !== user.id) {
        try {
          await (serviceSupabase as any).auth.admin.deleteUser(targetAuthId);
        } catch (authDelErr) {
          console.warn("Auth user deletion warning:", authDelErr);
        }
      }

      // 4. Broadcast instant logout signal to active staff browser sessions
      try {
        const syncChannel = supabase.channel('escrow_staff_sync');
        syncChannel.send({
          type: 'broadcast',
          event: 'staff_removed',
          payload: { 
            email: cleanEmail, 
            user_id: targetAuthId 
          }
        }).catch(() => {});
      } catch (bcErr) {
        console.warn("Broadcast error:", bcErr);
      }

      // 5. Update local state & workspace cache
      const updatedList = staffList.filter(s => s.id !== deleteStaffTarget.id && s.email.toLowerCase() !== cleanEmail);
      setStaffList(updatedList);
      localStorage.setItem(`${LOCAL_STORAGE_STAFF_KEY}_${user.id}`, JSON.stringify(updatedList));

      toast({
        title: "Staff Deleted Permanently",
        description: `${deleteStaffTarget.name} (${cleanEmail}) credentials have been permanently deleted and access revoked.`
      });
    } catch (err: any) {
      console.error("Delete staff error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to remove staff.",
        variant: "destructive"
      });
    } finally {
      setDeleteStaffTarget(null);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copied",
      description: `${fieldName} copied to clipboard.`
    });
  };

  const shareCredentialsWhatsApp = () => {
    if (!createdCredentials) return;
    const company = profile?.company_name || 'Escrow Bill';
    const message = formatStaffCredentialsWhatsAppMessage({
      companyName: company,
      portalUrl: createdCredentials.loginUrl,
      email: createdCredentials.email,
      password: createdCredentials.password,
      role: createdCredentials.role,
      isGoogle: false
    });
    openWhatsAppChat(createdCredentials.phone || '', message);
  };

  const handleSendStaffWhatsApp = async (staff: StaffMember) => {
    const rawPhone = staff.phone || '';
    const normalizedPhone = normalizeWhatsAppNumber(rawPhone);
    
    if (!normalizedPhone) {
      toast({
        title: "Mobile Number Missing",
        description: `No contact number is saved for ${staff.name}. Please edit their details to add a phone number.`,
        variant: "destructive"
      });
      return;
    }

    // 1. Check if staff already has temp_password in state
    let passwordToSend = staff.temp_password;

    // 2. Fallback: check localStorage cache
    if (!passwordToSend && user?.id) {
      try {
        const cached = localStorage.getItem(`${LOCAL_STORAGE_STAFF_KEY}_${user.id}`);
        if (cached) {
          const list = JSON.parse(cached);
          const found = list.find((s: any) => s.email?.toLowerCase().trim() === staff.email.toLowerCase().trim());
          if (found?.temp_password) {
            passwordToSend = found.temp_password;
          }
        }
      } catch (e) {
        console.warn("Error checking localStorage for staff password:", e);
      }
    }

    // 3. Fallback: check Supabase Auth admin user_metadata in real-time
    if (!passwordToSend) {
      try {
        const cleanEmail = staff.email.toLowerCase().trim();
        const { data: userListData } = await (serviceSupabase as any).auth.admin.listUsers();
        const found = userListData?.users?.find((u: any) => 
          (staff.user_id && u.id === staff.user_id) || 
          u.email?.toLowerCase().trim() === cleanEmail
        );
        if (found?.user_metadata?.initial_password || found?.user_metadata?.temp_password) {
          passwordToSend = found.user_metadata.initial_password || found.user_metadata.temp_password;
          // Update in local state and localStorage for instant access
          setStaffList(prev => {
            const updated = prev.map(s => s.id === staff.id ? { ...s, temp_password: passwordToSend } : s);
            if (user?.id) {
              localStorage.setItem(`${LOCAL_STORAGE_STAFF_KEY}_${user.id}`, JSON.stringify(updated));
            }
            return updated;
          });
        }
      } catch (err) {
        console.warn("Could not check auth user metadata for password:", err);
      }
    }

    // 4. If password is STILL not found (legacy staff account or password never recorded):
    if (!passwordToSend) {
      setTargetStaffForPassword(staff);
      generateRandomNewPassword();
      setIsPasswordModalOpen(true);
      toast({
        title: "Password Needed For WhatsApp",
        description: `No password is saved for ${staff.name}. We generated a secure password below—click 'Save Password' to send via WhatsApp!`,
      });
      return;
    }

    const company = profile?.company_name || 'Escrow Bill';
    const loginUrl = `${window.location.origin}/auth`;

    const message = formatStaffCredentialsWhatsAppMessage({
      companyName: company,
      portalUrl: loginUrl,
      email: staff.email,
      password: passwordToSend,
      role: staff.role,
      isGoogle: false
    });

    openWhatsAppChat(normalizedPhone, message);

    toast({
      title: "Opening WhatsApp! 📱",
      description: `Opening WhatsApp chat for ${staff.name} (+${normalizedPhone}) with login credentials.`
    });
  };

  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const accountId = generateAccountId(s.user_id || s.email);
      const matchesQuery = !searchQuery.trim() || (
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        accountId.includes(searchQuery.replace('#', '')) ||
        (s.phone && s.phone.includes(searchQuery))
      );

      const matchesRole = roleFilter === 'all' || s.role.toLowerCase() === roleFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [staffList, searchQuery, roleFilter, statusFilter]);

  const [staffPage, setStaffPage] = useState(1);
  const [staffPageSize, setStaffPageSize] = useState(10);

  useEffect(() => {
    setStaffPage(1);
  }, [searchQuery, roleFilter, statusFilter]);

  const paginatedStaff = useMemo(() => {
    const from = (staffPage - 1) * staffPageSize;
    return filteredStaff.slice(from, from + staffPageSize);
  }, [filteredStaff, staffPage, staffPageSize]);

  const activeStaffCount = staffList.filter(s => s.status === 'active').length;

  if (isStaff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Staff and permission management is reserved for company administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage company team members, access privileges, and module visibility.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => navigate('/roles-permissions/add')} 
            className="h-10 px-4 font-semibold shadow-sm"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/70 shadow-sm bg-card overflow-hidden">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Total Staff</p>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1 break-words leading-tight py-0.5">{staffList.length}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">Enrolled team members</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-sm bg-card overflow-hidden">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Active Status</p>
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 break-words leading-tight py-0.5">{activeStaffCount}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{staffList.length - activeStaffCount} inactive members</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-sm bg-card overflow-hidden">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Security Architecture</p>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1 break-words leading-tight py-0.5">Role-Scoped</h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">Restricted module visibility</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-border/70 shadow-sm bg-card">
        <CardHeader className="p-5 border-b border-border/60">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-foreground">Staff Directory</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Staff accounts inherit your company workspace and only see allowed tabs.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Accountant">Accountant</SelectItem>
                  <SelectItem value="Sales Executive">Sales</SelectItem>
                  <SelectItem value="Inventory Manager">Inventory</SelectItem>
                  <SelectItem value="Billing Operator">Billing</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[110px] h-9 text-xs">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={loadStaff} className="h-9 px-2.5">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-medium">Loading staff records...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No staff members found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                  ? "No results matched your active filter criteria."
                  : "Add your team members to grant them scoped access to company modules."}
              </p>
              {!searchQuery && roleFilter === 'all' && statusFilter === 'all' && (
                <Button 
                  onClick={() => navigate('/roles-permissions/add')}
                  size="sm"
                  className="mt-4"
                >
                  <UserPlus className="w-4 h-4 mr-2" /> Add Staff Member
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[150px] text-xs font-semibold">Account ID</TableHead>
                    <TableHead className="w-[240px] text-xs font-semibold">Staff Member</TableHead>
                    <TableHead className="text-xs font-semibold">Assigned Role</TableHead>
                    <TableHead className="min-w-[280px] text-xs font-semibold">Authorized Modules</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Enrolled</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStaff.map((staff) => (
                    <TableRow key={staff.id || staff.email} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-1.5 bg-primary/5 dark:bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg w-fit font-mono">
                          <span className="text-xs font-bold text-primary">
                            #{generateAccountId(staff.user_id || staff.email)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(generateAccountId(staff.user_id || staff.email), 'Account ID');
                            }}
                            className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                            title="Copy Account ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-foreground truncate">{staff.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                              <Mail className="w-3 h-3 shrink-0" /> {staff.email}
                            </p>
                            {staff.phone && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5 shrink-0" /> {staff.phone}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendStaffWhatsApp(staff);
                                  }}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 transition-colors"
                                  title="Send WhatsApp Login Access"
                                >
                                  <MessageSquare className="w-2.5 h-2.5" /> WhatsApp
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-semibold text-[11px] px-2 py-0.5 bg-background">
                          {staff.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {staff.permissions && staff.permissions.length > 0 ? (
                            staff.permissions.map(pKey => {
                              const permObj = AVAILABLE_PERMISSIONS.find(ap => ap.id === pKey);
                              return (
                                <span 
                                  key={pKey} 
                                  className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/60"
                                >
                                  {permObj ? permObj.label : pKey}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleStatus(staff)}
                          className="inline-flex items-center gap-1.5 focus:outline-none"
                          title="Click to toggle status"
                        >
                          <span className={`w-2 h-2 rounded-full ${staff.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <Badge 
                            variant="secondary"
                            className={`text-[10px] uppercase font-bold tracking-wider cursor-pointer ${
                              staff.status === 'active' 
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30' 
                                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
                            }`}
                          >
                            {staff.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {safelyToLocaleDate(staff.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSendStaffWhatsApp(staff)}
                            className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs gap-1.5 font-medium"
                            title={`Send WhatsApp Access to ${staff.name}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleSendStaffWhatsApp(staff)} className="text-xs gap-2 text-emerald-600 font-medium">
                                <MessageSquare className="w-3.5 h-3.5" /> Send WhatsApp Invite
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEdit(staff)} className="text-xs gap-2">
                                <Edit3 className="w-3.5 h-3.5" /> Edit Privileges
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenPasswordModal(staff)} className="text-xs gap-2">
                                <Key className="w-3.5 h-3.5" /> Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(staff)} className="text-xs gap-2">
                                <Power className="w-3.5 h-3.5" /> {staff.status === 'active' ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteStaffTarget(staff)} className="text-xs gap-2 text-destructive focus:text-destructive">
                                <Trash2 className="w-3.5 h-3.5" /> Remove Staff
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DataTablePagination
              currentPage={staffPage}
              totalPages={Math.max(1, Math.ceil(filteredStaff.length / staffPageSize))}
              totalCount={filteredStaff.length}
              pageSize={staffPageSize}
              onPageChange={setStaffPage}
              onPageSizeChange={setStaffPageSize}
              entityName="staff members"
            />
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Staff Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Staff Member</DialogTitle>
            <DialogDescription className="text-xs">
              Update assigned role and authorized modules for {editingStaff?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Full Name</Label>
                <Input 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Login Email</Label>
                <Input 
                  value={email}
                  disabled
                  className="h-9 text-xs bg-muted text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Contact Number</Label>
              <Input 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Role Preset</Label>
              <Select value={selectedRole} onValueChange={handleRolePresetChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Accountant">Accountant</SelectItem>
                  <SelectItem value="Sales Executive">Sales Executive</SelectItem>
                  <SelectItem value="Inventory Manager">Inventory Manager</SelectItem>
                  <SelectItem value="Billing Operator">Billing Operator</SelectItem>
                  <SelectItem value="Custom">Custom Role</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Module Authorization
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {selectedPermissions.length} / {AVAILABLE_PERMISSIONS.length} Enabled
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_PERMISSIONS.map((perm) => {
                  const isChecked = selectedPermissions.includes(perm.id);
                  return (
                    <div 
                      key={perm.id}
                      onClick={() => handleTogglePermission(perm.id)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                        isChecked 
                          ? 'border-primary/50 bg-primary/5 dark:bg-primary/10' 
                          : 'border-border/60 hover:bg-muted/40'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePermission(perm.id)}
                        className="mt-0.5 rounded text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold leading-none">{perm.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{perm.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="font-semibold">
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Reset Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" /> Reset Staff Password
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign a new login password for {targetStaffForPassword?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNewPassword} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">New Password</Label>
                <button
                  type="button"
                  onClick={generateRandomNewPassword}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Generate Strong
                </button>
              </div>
              <div className="relative">
                <Input 
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters (e.g. Staff@1234)" 
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-9 text-xs pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsPasswordModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="font-semibold">
                {isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Credentials Modal */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-center">
              Credentials Updated
            </DialogTitle>
            <DialogDescription className="text-xs text-center">
              Share the updated credentials with {createdCredentials?.name}.
            </DialogDescription>
          </DialogHeader>

          {createdCredentials && (
            <div className="space-y-3 my-2">
              <div className="bg-muted/40 p-3.5 rounded-lg space-y-2 border border-border/70 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Portal URL:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] truncate max-w-[180px]">{createdCredentials.loginUrl}</span>
                    <button onClick={() => copyToClipboard(createdCredentials.loginUrl, 'Portal URL')}>
                      {copiedField === 'Portal URL' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Account ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      #{generateAccountId(createdCredentials.email)}
                    </span>
                    <button onClick={() => copyToClipboard(generateAccountId(createdCredentials.email), 'Account ID')}>
                      {copiedField === 'Account ID' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-semibold">{createdCredentials.email}</span>
                    <button onClick={() => copyToClipboard(createdCredentials.email, 'Email')}>
                      {copiedField === 'Email' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                {createdCredentials.password && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Password:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {createdCredentials.password}
                      </span>
                      <button onClick={() => copyToClipboard(createdCredentials.password || '', 'Password')}>
                        {copiedField === 'Password' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = `Portal: ${createdCredentials.loginUrl}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password || ''}\nRole: ${createdCredentials.role}`;
                    copyToClipboard(text, 'All Credentials');
                  }}
                  className="text-xs"
                >
                  <Copy className="w-3 h-3 mr-1.5" /> Copy Details
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={shareCredentialsWhatsApp}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Share2 className="w-3 h-3 mr-1.5" /> WhatsApp
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button size="sm" className="w-full" onClick={() => setIsSuccessModalOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteStaffTarget} onOpenChange={() => setDeleteStaffTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Remove Staff Member
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to remove <strong className="text-foreground">{deleteStaffTarget?.name}</strong> ({deleteStaffTarget?.email})? They will immediately lose access to company data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteStaff}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold"
            >
              Remove Staff
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
