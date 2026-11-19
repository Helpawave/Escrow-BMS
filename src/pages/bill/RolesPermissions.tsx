import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase, serviceSupabase } from "@/integrations/supabase/client";
import { formatStaffCredentialsWhatsAppMessage, normalizeWhatsAppNumber, openWhatsAppChat } from '@/utils/whatsappTemplates';
import { generateAccountId } from '@/utils/accountId';
import { 
  Users, 
  UserPlus, 
  RefreshCw, 
  Shield
} from "lucide-react";
import { useUserType } from "@/hooks/useUserType";

import {
  StaffMember,
  AVAILABLE_PERMISSIONS,
  ROLE_PRESETS,
  LOCAL_STORAGE_STAFF_KEY,
  CreatedCredentials,
} from './roles-permissions/types';

import {
  StaffStatsCards,
  StaffFilters,
  StaffTable,
} from './roles-permissions/components';

import {
  EditStaffDialog,
  PasswordResetDialog,
  CredentialsSuccessDialog,
  DeleteStaffAlert,
} from './roles-permissions/modals';

// Re-export for existing callers like AddStaff.tsx
export { AVAILABLE_PERMISSIONS, ROLE_PRESETS, type StaffMember };

export default function RolesPermissions() {
  const { user, profile, isStaff, companyProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAutomobile, isCafe } = useUserType();
  const isEffectiveCafe = isCafe;

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
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const activeRolePresets = useMemo(() => {
    if (isEffectiveCafe) {
      return {
        'Kitchen Chef': {
          name: 'Kitchen Chef',
          permissions: ['kitchen']
        },
        'Billing Operator': {
          name: 'Billing Operator',
          permissions: ['invoices', 'clients', 'payments']
        },
        Accountant: {
          name: 'Accountant',
          permissions: ['invoices', 'purchase-invoices', 'payments', 'expenses']
        },
        'Inventory Manager': {
          name: 'Inventory Manager',
          permissions: ['purchase-invoices', 'vendors', 'products']
        },
        Custom: {
          name: 'Custom',
          permissions: []
        }
      };
    }
    if (isAutomobile) {
      return {
        Accountant: {
          name: 'Accountant',
          permissions: ['invoices', 'downpayment-invoices', 'purchase-invoices', 'payments', 'expenses', 'einvoice']
        },
        'Sales Executive': {
          name: 'Sales Executive',
          permissions: ['invoices', 'downpayment-invoices', 'clients', 'products']
        },
        'Inventory Manager': {
          name: 'Inventory Manager',
          permissions: ['purchase-invoices', 'vendors', 'products']
        },
        'Billing Operator': {
          name: 'Billing Operator',
          permissions: ['invoices', 'downpayment-invoices', 'clients', 'payments']
        },
        Custom: {
          name: 'Custom',
          permissions: []
        }
      };
    }
    return ROLE_PRESETS;
  }, [isAutomobile, isEffectiveCafe]);

  const visiblePermissions = useMemo(() => {
    return AVAILABLE_PERMISSIONS.filter(p => {
      if (p.autoOnly && !isAutomobile) return false;
      if (p.cafeOnly && !isEffectiveCafe) return false;
      if (p.hideForCafe && isEffectiveCafe) return false;
      return true;
    });
  }, [isAutomobile, isEffectiveCafe]);

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
    if (activeRolePresets[roleKey] && roleKey !== 'Custom') {
      setSelectedPermissions(activeRolePresets[roleKey].permissions);
    }
  };

  const handleTogglePermission = (permId: string) => {
    setSelectedPermissions(prev => {
      const next = prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId];
      const matchedPreset = Object.keys(activeRolePresets).find(key => {
        if (key === 'Custom') return false;
        const presetPerms = activeRolePresets[key].permissions;
        return presetPerms.length === next.length && presetPerms.every(p => next.includes(p));
      });
      setSelectedRole(matchedPreset || 'Custom');
      return next;
    });
  };

  const broadcastStaffEvent = (event: 'staff_updated' | 'staff_status_changed' | 'staff_removed', payload: any) => {
    try {
      const chName = `escrow_staff_sync_bc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const ch = supabase.channel(chName);
      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          ch.send({
            type: 'broadcast',
            event,
            payload
          }).finally(() => {
            setTimeout(() => {
              try { supabase.removeChannel(ch); } catch {}
            }, 1000);
          });
        }
      });
    } catch (e) {
      console.warn("Staff event broadcast notice:", e);
    }
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
        broadcastStaffEvent('staff_updated', {
          email: editingStaff.email,
          role: selectedRole,
          permissions: updatedPermissions
        });
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
      broadcastStaffEvent('staff_status_changed', {
        email: staff.email,
        status: nextStatus
      });

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

          // Sync owner user_type and company validity to staff profile
          try {
            const { data: ownerSetting } = await (serviceSupabase as any)
              .from('user_settings')
              .select('user_type')
              .eq('user_id', user.id)
              .maybeSingle();

            const ownerType = isCafe ? 'cafe' : isAutomobile ? 'automobile' : (ownerSetting?.user_type || 'normal');

            if (ownerType !== 'cafe') {
              await (serviceSupabase as any)
                .from('user_settings')
                .upsert({
                  user_id: targetAuthId,
                  user_type: ownerType,
                  updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
            }

            await (serviceSupabase as any)
              .from('system_settings')
              .upsert({
                key: `user_type_${targetAuthId}`,
                value: ownerType,
                updated_at: new Date().toISOString()
              }, { onConflict: 'key' });

            await (serviceSupabase as any)
              .from('profiles')
              .upsert({
                user_id: targetAuthId,
                company_name: profile?.company_name || 'Escrow Company',
                phone: targetStaffForPassword.phone || null,
                mobile: targetStaffForPassword.phone || null,
                is_staff: true,
                company_id: user.id,
                staff_role: targetStaffForPassword.role,
                staff_permissions: targetStaffForPassword.permissions,
                subscription_expires_at: profile?.subscription_expires_at || null,
                is_paid: !!profile?.is_paid,
                role: 'user',
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' });
          } catch (syncErr) {
            console.warn("Staff profile sync warning:", syncErr);
          }

          setStaffList(prev => prev.map(s => s.id === targetStaffForPassword.id ? { ...s, user_id: targetAuthId } : s));
        }
      }

      // Update password for targetAuthId — NEVER for the company owner!
      if (targetAuthId && targetAuthId !== user?.id) {
        try {
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
          if (pwdErr) {
            console.warn("Could not update staff auth credentials directly (non-fatal):", pwdErr);
          }
        } catch (authErr) {
          console.warn("Exception during auth.admin.updateUserById (non-fatal):", authErr);
        }
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
        userId: targetAuthId || targetStaffForPassword.user_id,
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
        broadcastStaffEvent('staff_removed', { 
          email: cleanEmail, 
          user_id: targetAuthId 
        });
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

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
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
      <StaffStatsCards 
        totalStaff={staffList.length} 
        activeStaffCount={activeStaffCount} 
      />

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

            <StaffFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onRefresh={loadStaff}
              loading={loading}
            />
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
            <StaffTable
              paginatedStaff={paginatedStaff}
              totalFilteredCount={filteredStaff.length}
              staffPage={staffPage}
              staffPageSize={staffPageSize}
              onPageChange={setStaffPage}
              onPageSizeChange={setStaffPageSize}
              onToggleStatus={handleToggleStatus}
              onSendWhatsApp={handleSendStaffWhatsApp}
              onOpenEdit={handleOpenEdit}
              onOpenPasswordModal={handleOpenPasswordModal}
              onSetDeleteTarget={setDeleteStaffTarget}
              onCopyToClipboard={copyToClipboard}
              availablePermissions={visiblePermissions}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Staff Modal */}
      <EditStaffDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        editingStaff={editingStaff}
        fullName={fullName}
        setFullName={setFullName}
        email={email}
        phone={phone}
        setPhone={setPhone}
        selectedRole={selectedRole}
        onRolePresetChange={handleRolePresetChange}
        selectedPermissions={selectedPermissions}
        visiblePermissions={visiblePermissions}
        onTogglePermission={handleTogglePermission}
        onSaveEdit={handleSaveEdit}
        isSubmitting={isSubmitting}
      />

      {/* Password Reset Modal */}
      <PasswordResetDialog
        open={isPasswordModalOpen}
        onOpenChange={setIsPasswordModalOpen}
        targetStaff={targetStaffForPassword}
        newStaffPassword={newStaffPassword}
        setNewStaffPassword={setNewStaffPassword}
        showNewPassword={showNewPassword}
        setShowNewPassword={setShowNewPassword}
        onGenerateRandomPassword={generateRandomNewPassword}
        onSaveNewPassword={handleSaveNewPassword}
        isSubmitting={isSubmitting}
      />

      {/* Success Credentials Modal */}
      <CredentialsSuccessDialog
        open={isSuccessModalOpen}
        onOpenChange={setIsSuccessModalOpen}
        createdCredentials={createdCredentials}
        copiedField={copiedField}
        onCopyToClipboard={copyToClipboard}
        onShareWhatsApp={shareCredentialsWhatsApp}
      />

      {/* Delete Confirmation Modal */}
      <DeleteStaffAlert
        deleteStaffTarget={deleteStaffTarget}
        onClose={() => setDeleteStaffTarget(null)}
        onConfirmDelete={handleDeleteStaff}
      />
    </div>
  );
}
