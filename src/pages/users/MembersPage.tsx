import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES, type ModuleKey } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { generateAccountId, generateStaffCode } from '@/utils/accountId';
import {
  ShieldCheck,
  UserPlus,
  Briefcase,
  Check,
  X,
  Search,
  Trash2,
  Building2,
  Users,
  Edit3,
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Copy,
  Share2,
  Sparkles,
  RefreshCw,
  Power,
  Layers,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DeleteConfirmation } from '@/components/DeleteConfirmation';
import { SuccessModal } from '@/components/SuccessModal';

export interface StaffMember {
  id: string;
  staff_id: string;
  company_owner_id: string;
  company_id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  allowed_modules: ModuleKey[];
  status: 'active' | 'inactive';
  temp_password?: string;
  created_at: string;
  updated_at?: string;
}

export const ESCROW_BMS_MODULES: { id: ModuleKey; label: string; description: string; icon: string }[] = [
  { id: 'billing', label: 'Billing & Invoices', description: 'Tax invoices, purchase bills, and quotations', icon: 'FileText' },
  { id: 'ledger', label: 'Account Ledger', description: 'Party ledger accounts, debit/credit, and balance sheets', icon: 'BookOpen' },
  { id: 'inventory', label: 'Inventory & Stock', description: 'Product catalog, rates, stock levels, and HSN codes', icon: 'Package' },
  { id: 'hisab', label: 'Daily Hisab', description: 'Daily cash register, income, and expense records', icon: 'Calculator' },
  { id: 'payroll', label: 'Payroll & HR', description: 'Employee salary slips, attendance, and leaves', icon: 'Users' },
  { id: 'crm', label: 'CRM & Clients', description: 'Client directory, leads, and customer interactions', icon: 'Building2' },
];

export const ROLE_PRESETS: Record<string, { name: string; modules: ModuleKey[]; description: string }> = {
  Accountant: {
    name: 'Accountant',
    modules: ['ledger', 'billing', 'inventory', 'hisab'],
    description: 'Account Ledger, Invoices & Billing, Inventory & Stock, and Daily Hisab'
  },
  Sales: {
    name: 'Sales',
    modules: ['crm'],
    description: 'CRM & Client Lead Management'
  },
  HR: {
    name: 'HR',
    modules: ['payroll'],
    description: 'Payroll & HR, Employee Salaries and Attendance'
  },
  Admin: {
    name: 'Admin',
    modules: ['billing', 'ledger', 'inventory', 'hisab', 'payroll', 'crm'],
    description: 'Full access to all BMS modules with complete editing permissions'
  },
  'View Only': {
    name: 'View Only',
    modules: ['billing', 'ledger', 'inventory', 'hisab', 'payroll', 'crm'],
    description: 'All BMS modules with view & reading permissions only'
  },
  Custom: {
    name: 'Custom Role',
    modules: ['billing'],
    description: 'Tailored module permissions configured manually'
  }
};

const getStaffBackupKey = (ownerId: string) => `escrow_company_staff_backup_${ownerId}`;

export default function MembersPage() {
  const { user, profile, companyId: activeCompanyId, isStaff } = useAuth();
  const ownerId = profile?.parent_user_id || user?.id || '';
  const displayCompanyId = activeCompanyId || generateAccountId(ownerId);

  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    if (!ownerId) return [];
    try {
      const saved = localStorage.getItem(getStaffBackupKey(ownerId));
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Add Staff Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'create' | 'link'>('create');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Accountant');
  const [selectedModules, setSelectedModules] = useState<ModuleKey[]>(ROLE_PRESETS['Accountant'].modules);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Staff Modal States
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editModules, setEditModules] = useState<ModuleKey[]>([]);

  // Credentials / WhatsApp Share Modal States
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    staffId: string;
    companyId: string;
    email: string;
    password?: string;
    role: string;
    modules: ModuleKey[];
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Delete & Success confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: '', message: '' });

  // 1. Fetch Staff Members from Supabase & fallback to local backup
  const fetchStaffMembers = async () => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_staff')
        .select('*')
        .eq('company_owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: StaffMember[] = data.map((item: any, idx: number) => ({
          id: item.id,
          staff_id: item.staff_id || generateStaffCode(item.id || idx),
          company_owner_id: item.company_owner_id || ownerId,
          company_id: item.company_id || displayCompanyId,
          name: item.name || item.full_name || 'Staff Member',
          email: item.email,
          phone: item.phone || '',
          role: item.role || 'Staff',
          allowed_modules: Array.isArray(item.permissions || item.allowed_modules) 
            ? (item.permissions || item.allowed_modules) 
            : (typeof item.permissions === 'string' ? JSON.parse(item.permissions || '[]') : ['billing']),
          status: item.status || 'active',
          temp_password: item.temp_password || '',
          created_at: item.created_at || new Date().toISOString()
        }));

        setStaffList(mapped);
        localStorage.setItem(getStaffBackupKey(ownerId), JSON.stringify(mapped));
      } else {
        // Fallback from localStorage
        const saved = localStorage.getItem(getStaffBackupKey(ownerId));
        if (saved) {
          setStaffList(JSON.parse(saved));
        }
      }
    } catch (err) {
      console.warn('Error querying company_staff table:', err);
      const saved = localStorage.getItem(getStaffBackupKey(ownerId));
      if (saved) setStaffList(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ownerId) {
      fetchStaffMembers();
    }
  }, [ownerId]);

  // Persist local backup whenever staffList updates
  useEffect(() => {
    if (ownerId && staffList.length > 0) {
      localStorage.setItem(getStaffBackupKey(ownerId), JSON.stringify(staffList));
    }
  }, [staffList, ownerId]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%';
    let generated = '';
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
  };

  const handleRolePresetChange = (roleKey: string) => {
    setSelectedRole(roleKey);
    if (ROLE_PRESETS[roleKey] && roleKey !== 'Custom') {
      setSelectedModules(ROLE_PRESETS[roleKey].modules);
    }
  };

  const handleToggleModule = (moduleId: ModuleKey) => {
    setSelectedModules(prev => {
      const next = prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId];
      const matchedPreset = Object.keys(ROLE_PRESETS).find(key => {
        if (key === 'Custom') return false;
        const presetModules = ROLE_PRESETS[key].modules;
        return presetModules.length === next.length && presetModules.every(m => next.includes(m));
      });
      setSelectedRole(matchedPreset || 'Custom');
      return next;
    });
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(`${fieldName} copied to clipboard!`);
  };

  const shareCredentialsWhatsApp = () => {
    if (!createdCredentials) return;
    const company = profile?.company_name || 'Escrow BMS';
    const isGoogle = addMode === 'link' || createdCredentials.password === '(Google Sign-In / Existing)';
    const modulesText = createdCredentials.modules.map(m => `• ${m.toUpperCase()}`).join('\n');
    
    let message = '';
    if (isGoogle) {
      message = `*${company} - Staff Login Access*\n\n` +
        `Your staff account is ready on Escrow BMS!\n\n` +
        `🏢 *Company ID:* \`${createdCredentials.companyId}\`\n` +
        `🆔 *Staff ID:* \`${createdCredentials.staffId}\`\n` +
        `👤 *Name:* ${createdCredentials.name}\n` +
        `📧 *Email:* ${createdCredentials.email}\n` +
        `💼 *Role:* ${createdCredentials.role}\n\n` +
        `🔐 *Module Access:*\n${modulesText}\n\n` +
        `👉 *Login Instructions:* Open Escrow BMS and sign in using Google Sign-In with this email address. Your permissions and company data are pre-configured!`;
    } else {
      message = `*${company} - Staff Login Access*\n\n` +
        `Your staff account has been configured on Escrow BMS:\n\n` +
        `🏢 *Company ID:* \`${createdCredentials.companyId}\`\n` +
        `🆔 *Staff ID:* \`${createdCredentials.staffId}\`\n` +
        `👤 *Name:* ${createdCredentials.name}\n` +
        `📧 *Email:* ${createdCredentials.email}\n` +
        `🔑 *Password:* \`${createdCredentials.password || '[As Configured]'}\`\n` +
        `💼 *Role:* ${createdCredentials.role}\n\n` +
        `🔐 *Module Access:*\n${modulesText}\n\n` +
        `👉 *Login Instructions:* Sign in using your email and password.`;
    }
    
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerId) return;

    if (!fullName.trim() || !email.trim()) {
      toast.error("Full name and email are required.");
      return;
    }

    if (addMode === 'create' && (!password || password.length < 6)) {
      toast.error("Please enter a password with at least 6 characters (or generate one).");
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedCode = generateStaffCode(staffList.length + 1);
      const newStaffId = crypto.randomUUID();

      const newMember: StaffMember = {
        id: newStaffId,
        staff_id: generatedCode,
        company_owner_id: ownerId,
        company_id: displayCompanyId,
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || '',
        role: selectedRole,
        allowed_modules: selectedModules,
        status: 'active',
        temp_password: addMode === 'create' ? password : '(Google Sign-In / Existing)',
        created_at: new Date().toISOString()
      };

      // 1. Try to save to Supabase company_staff table
      try {
        await supabase.from('company_staff').insert([{
          id: newStaffId,
          staff_id: generatedCode,
          company_owner_id: ownerId,
          company_id: displayCompanyId,
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          role: selectedRole,
          permissions: selectedModules,
          status: 'active',
          temp_password: addMode === 'create' ? password : null
        }]);
      } catch (dbErr) {
        console.warn('Could not insert to company_staff in DB (using local storage):', dbErr);
      }

      // 2. Update local state & backup
      const updatedList = [newMember, ...staffList];
      setStaffList(updatedList);
      localStorage.setItem(getStaffBackupKey(ownerId), JSON.stringify(updatedList));

      // 3. Show credentials modal
      setCreatedCredentials({
        name: newMember.name,
        staffId: newMember.staff_id,
        companyId: displayCompanyId,
        email: newMember.email,
        password: newMember.temp_password,
        role: newMember.role,
        modules: newMember.allowed_modules
      });

      setShowAddModal(false);
      setShowCredentialsModal(true);

      // Reset form
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setSelectedRole('Accountant');
      setSelectedModules(ROLE_PRESETS['Accountant'].modules);

      toast.success(`Staff member "${newMember.name}" created successfully!`);
    } catch (err: any) {
      console.error('Error adding staff member:', err);
      toast.error(err?.message || 'Failed to create staff member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (staff: StaffMember) => {
    setEditingStaff(staff);
    setEditFullName(staff.name);
    setEditPhone(staff.phone || '');
    setEditRole(staff.role);
    setEditModules(staff.allowed_modules || []);
    setShowEditModal(true);
  };

  const handleUpdateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !ownerId) return;

    try {
      const updatedMember: StaffMember = {
        ...editingStaff,
        name: editFullName.trim(),
        phone: editPhone.trim() || '',
        role: editRole,
        allowed_modules: editModules,
        updated_at: new Date().toISOString()
      };

      // 1. Update in Supabase
      try {
        await supabase
          .from('company_staff')
          .update({
            name: editFullName.trim(),
            phone: editPhone.trim() || null,
            role: editRole,
            permissions: editModules,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingStaff.id);
      } catch (err) {
        console.warn('DB update warning:', err);
      }

      // 2. Update local state
      const updatedList = staffList.map(s => s.id === editingStaff.id ? updatedMember : s);
      setStaffList(updatedList);
      localStorage.setItem(getStaffBackupKey(ownerId), JSON.stringify(updatedList));

      setShowEditModal(false);
      setEditingStaff(null);
      toast.success('Staff permissions & details updated successfully!');
    } catch (err: any) {
      console.error('Error updating staff:', err);
      toast.error('Failed to update staff member.');
    }
  };

  const handleToggleStatus = async (staff: StaffMember) => {
    const newStatus: 'active' | 'inactive' = staff.status === 'active' ? 'inactive' : 'active';
    try {
      try {
        await supabase
          .from('company_staff')
          .update({ status: newStatus })
          .eq('id', staff.id);
      } catch {}

      const updatedList: StaffMember[] = staffList.map(s => s.id === staff.id ? { ...s, status: newStatus } : s);
      setStaffList(updatedList);
      localStorage.setItem(getStaffBackupKey(ownerId), JSON.stringify(updatedList));

      toast.success(`Staff status changed to ${newStatus.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const handleDeleteStaff = (staff: StaffMember) => {
    setStaffToDelete(staff);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteStaff = async () => {
    if (!staffToDelete || !ownerId) return;
    try {
      try {
        await supabase
          .from('company_staff')
          .delete()
          .eq('id', staffToDelete.id);
      } catch {}

      const updatedList = staffList.filter(s => s.id !== staffToDelete.id);
      setStaffList(updatedList);
      localStorage.setItem(getStaffBackupKey(ownerId), JSON.stringify(updatedList));

      setSuccessInfo({
        title: 'Staff Member Removed',
        message: `Account for ${staffToDelete.name} has been deleted and access revoked.`
      });
      setShowSuccess(true);
    } catch (err) {
      toast.error('Failed to delete staff member.');
    } finally {
      setShowDeleteConfirm(false);
      setStaffToDelete(null);
    }
  };

  // Filter staff records
  const filteredStaff = useMemo(() => {
    let list = staffList;
    if (roleFilter !== 'all') {
      list = list.filter(s => s.role.toLowerCase() === roleFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.staff_id.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        s.role.toLowerCase().includes(q)
      );
    }
    return list;
  }, [staffList, roleFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = staffList.length;
    const active = staffList.filter(s => s.status === 'active').length;
    const distinctRoles = Array.from(new Set(staffList.map(s => s.role))).length;
    return { total, active, distinctRoles };
  }, [staffList]);

  return (
    <AppLayout title="Team & Staff Management">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Company ID & Header Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden border border-indigo-900/40">
          <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-72 h-72 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black tracking-wider uppercase backdrop-blur-md">
                <Building2 className="w-3.5 h-3.5" />
                <span>{profile?.company_name || 'Enterprise Workspace'}</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
                Team & Staff Management
              </h1>
              <p className="text-indigo-200/80 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
                Add department staff, assign dedicated roles, and grant granular module access for Escrow BMS.
              </p>
            </div>

            {/* Company ID Badge */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 px-5 border border-white/20 flex items-center justify-between gap-4 shadow-lg">
                <div>
                  <span className="text-[10px] font-black tracking-widest uppercase text-indigo-300 block">
                    Company ID / Code
                  </span>
                  <span className="text-2xl font-black tracking-wider text-white font-mono">
                    {displayCompanyId}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(displayCompanyId, 'Company ID')}
                  className="h-9 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer border border-white/10"
                >
                  {copiedField === 'Company ID' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span className="ml-1.5">{copiedField === 'Company ID' ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>

              {!isStaff && (
                <Button
                  size="lg"
                  onClick={() => setShowAddModal(true)}
                  className="h-14 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-blue-500/25 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Add Staff Member</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 rounded-2xl border-2 border-slate-200/80 dark:border-slate-800 bg-card shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{stats.total}</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">Configured in workspace</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-5 rounded-2xl border-2 border-slate-200/80 dark:border-slate-800 bg-card shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Staff</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.active}</p>
                <p className="text-xs text-emerald-600/70 font-medium mt-1">Login access enabled</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-5 rounded-2xl border-2 border-slate-200/80 dark:border-slate-800 bg-card shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Assigned Roles</p>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{stats.distinctRoles}</p>
                <p className="text-xs text-indigo-600/70 font-medium mt-1">Preset & custom roles</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name, email, Staff ID, or mobile..."
              className="pl-10 h-11 bg-background border-border/60 rounded-xl font-medium text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="w-full sm:w-52">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full h-11 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Roles</option>
              <option value="Accountant">Accountant</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
              <option value="Admin">Admin</option>
              <option value="View Only">View Only</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Staff Members List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredStaff.length === 0 ? (
          <Card className="p-8 md:p-12 text-center bg-card rounded-3xl border-2 border-dashed border-border/80">
            <Users className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-1">No Staff Members Found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              {staffList.length === 0
                ? "Start adding your team members to collaborate across Billing, Ledger, Inventory, and Payroll."
                : "No staff records match your search criteria."}
            </p>
            {staffList.length === 0 && !isStaff && (
              <Button
                onClick={() => setShowAddModal(true)}
                className="h-11 px-6 rounded-xl font-bold bg-primary text-primary-foreground cursor-pointer"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add First Staff Member
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredStaff.map((staff) => (
              <Card
                key={staff.id}
                className={cn(
                  "p-5 rounded-2xl border-2 transition-all bg-card hover:shadow-md",
                  staff.status === 'active' ? "border-border/80" : "border-slate-200/60 dark:border-slate-800 opacity-75"
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                        {staff.staff_id}
                      </span>
                      <h3 className="text-base font-black text-foreground">{staff.name}</h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold uppercase",
                          staff.status === 'active'
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400"
                        )}
                      >
                        {staff.status === 'active' ? 'Active' : 'Deactivated'}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-bold bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200"
                      >
                        {staff.role}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {staff.email}
                      </span>
                      {staff.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {staff.phone}
                        </span>
                      )}
                    </div>

                    {/* Modules Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-black uppercase text-muted-foreground mr-1">Modules:</span>
                      {staff.allowed_modules?.map((modKey) => {
                        const modInfo = ESCROW_BMS_MODULES.find(m => m.id === modKey);
                        return (
                          <span
                            key={modKey}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700"
                          >
                            {modInfo?.label || modKey}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCreatedCredentials({
                          name: staff.name,
                          staffId: staff.staff_id,
                          companyId: displayCompanyId,
                          email: staff.email,
                          password: staff.temp_password,
                          role: staff.role,
                          modules: staff.allowed_modules
                        });
                        setShowCredentialsModal(true);
                      }}
                      className="h-9 px-3 rounded-xl font-bold text-xs cursor-pointer"
                      title="Share / View Login Credentials"
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                      <span>Share Details</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClick(staff)}
                      className="h-9 px-3 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStatus(staff)}
                      className={cn(
                        "h-9 px-2.5 rounded-xl font-bold text-xs cursor-pointer",
                        staff.status === 'active' ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                      )}
                      title={staff.status === 'active' ? 'Deactivate Staff' : 'Activate Staff'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteStaff(staff)}
                      className="h-9 w-9 p-0 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Remove Staff"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── Add Staff Modal ────────────────────────────────────────── */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-background max-h-[90vh] flex flex-col">
            <DialogHeader className="p-6 pb-4 bg-muted/10 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black text-foreground">Add New Staff Member</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Assign role and grant modular permissions for Company ID: <strong>{displayCompanyId}</strong>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
              <Tabs value={addMode} onValueChange={(v) => setAddMode(v as 'create' | 'link')} className="w-full">
                <TabsList className="grid grid-cols-2 h-11 p-1 bg-muted/40 rounded-xl">
                  <TabsTrigger value="create" className="font-bold text-xs rounded-lg cursor-pointer">
                    Create New Account
                  </TabsTrigger>
                  <TabsTrigger value="link" className="font-bold text-xs rounded-lg cursor-pointer">
                    Link Existing / Google Account
                  </TabsTrigger>
                </TabsList>

                <form id="add-staff-form" onSubmit={handleAddStaffSubmit} className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Full Name <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="h-11 rounded-xl font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Mobile Number (Optional)
                      </Label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="h-11 rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Email Address <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. staff@company.com"
                      className="h-11 rounded-xl font-medium"
                    />
                  </div>

                  {addMode === 'create' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Temporary Password <span className="text-rose-500">*</span>
                        </Label>
                        <button
                          type="button"
                          onClick={generateRandomPassword}
                          className="text-[11px] font-black text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Generate Strong Password</span>
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="h-11 pr-10 rounded-xl font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Role Presets */}
                  <div className="space-y-2 pt-1">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Select Role Preset
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.keys(ROLE_PRESETS).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleRolePresetChange(key)}
                          className={cn(
                            "p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                            selectedRole === key
                              ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 font-bold shadow-sm"
                              : "border-border/60 hover:border-border text-muted-foreground"
                          )}
                        >
                          <span className="text-xs font-black">{key}</span>
                          <span className="text-[10px] opacity-70 mt-0.5 line-clamp-1">{ROLE_PRESETS[key].description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Module Permissions Checklist */}
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Escrow BMS Module Access ({selectedModules.length} Enabled)
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ESCROW_BMS_MODULES.map((mod) => {
                        const isChecked = selectedModules.includes(mod.id);
                        return (
                          <div
                            key={mod.id}
                            onClick={() => handleToggleModule(mod.id)}
                            className={cn(
                              "p-3 rounded-xl border-2 flex items-center justify-between gap-2 cursor-pointer transition-all",
                              isChecked
                                ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100"
                                : "border-border/60 hover:border-border text-muted-foreground"
                            )}
                          >
                            <div>
                              <p className="text-xs font-black">{mod.label}</p>
                              <p className="text-[10px] opacity-70 leading-tight">{mod.description}</p>
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded-md flex items-center justify-center border transition-all",
                              isChecked ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-700"
                            )}>
                              {isChecked && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </form>
              </Tabs>
            </div>

            <DialogFooter className="p-4 bg-muted/5 border-t border-border/50 flex flex-row gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1 h-11 font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="add-staff-form"
                disabled={isSubmitting}
                className="flex-1 h-11 font-black rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                {isSubmitting ? 'Creating...' : 'Create Staff Member'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Edit Staff Modal ───────────────────────────────────────── */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-background">
            <DialogHeader className="p-6 pb-4 bg-muted/10 border-b border-border/50">
              <DialogTitle className="text-xl font-black text-foreground">Edit Staff Permissions</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update details and accessible modules for <strong>{editingStaff?.name}</strong>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateStaffSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Full Name</Label>
                  <Input
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="h-11 rounded-xl font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Mobile</Label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="h-11 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Role Title</Label>
                <Input
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="h-11 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Module Permissions
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {ESCROW_BMS_MODULES.map((mod) => {
                    const isChecked = editModules.includes(mod.id);
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => {
                          setEditModules(prev =>
                            prev.includes(mod.id) ? prev.filter(id => id !== mod.id) : [...prev, mod.id]
                          );
                        }}
                        className={cn(
                          "p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 cursor-pointer transition-all",
                          isChecked
                            ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 font-bold"
                            : "border-border/60 text-muted-foreground"
                        )}
                      >
                        <span className="text-xs">{mod.label}</span>
                        <div className={cn(
                          "w-4 h-4 rounded flex items-center justify-center border text-white",
                          isChecked ? "bg-blue-600 border-blue-600" : "border-slate-300"
                        )}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <DialogFooter className="pt-4 border-t flex flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 h-11 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 font-black rounded-xl bg-primary text-primary-foreground cursor-pointer"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Generated Credentials & 1-Click WhatsApp Share Modal ───── */}
        <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-background">
            <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border-b border-border/50">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <DialogTitle className="text-xl font-black text-foreground">Staff Login Credentials</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Copy or share login details with the staff member
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3 font-medium text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Company ID</span>
                  <span className="font-mono font-black text-sm text-foreground">{createdCredentials?.companyId}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Staff ID / Code</span>
                  <span className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">{createdCredentials?.staffId}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Email Address</span>
                  <span className="font-bold text-foreground">{createdCredentials?.email}</span>
                </div>

                {createdCredentials?.password && createdCredentials.password !== '(Google Sign-In / Existing)' && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Temporary Password</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-foreground bg-white dark:bg-slate-800 px-2 py-0.5 rounded border">
                        {createdCredentials.password}
                      </span>
                      <button
                        onClick={() => copyToClipboard(createdCredentials.password || '', 'Password')}
                        className="text-slate-400 hover:text-foreground cursor-pointer"
                        title="Copy Password"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Assigned Role</span>
                  <span className="font-bold text-foreground">{createdCredentials?.role}</span>
                </div>
              </div>

              {/* Share actions */}
              <div className="space-y-2">
                <Button
                  onClick={shareCredentialsWhatsApp}
                  className="w-full h-12 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share via WhatsApp</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    const text = `Company ID: ${createdCredentials?.companyId}\nStaff ID: ${createdCredentials?.staffId}\nEmail: ${createdCredentials?.email}\nPassword: ${createdCredentials?.password || '[As Configured]'}`;
                    copyToClipboard(text, 'All Credentials');
                  }}
                  className="w-full h-11 rounded-2xl font-bold text-xs cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 mr-2" />
                  <span>Copy All Credentials</span>
                </Button>
              </div>
            </div>

            <DialogFooter className="p-4 bg-muted/5 border-t border-border/50">
              <Button
                variant="ghost"
                onClick={() => setShowCredentialsModal(false)}
                className="w-full h-11 font-bold rounded-xl cursor-pointer"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmation
          isOpen={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          onConfirm={confirmDeleteStaff}
          title="Remove Staff Account?"
          description={`Are you sure you want to remove staff account for ${staffToDelete?.name || 'this member'}? Their login access and module permissions will be revoked.`}
        />

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccess}
          onOpenChange={setShowSuccess}
          title={successInfo.title}
          message={successInfo.message}
        />
      </div>
    </AppLayout>
  );
}
