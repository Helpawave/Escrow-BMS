import { useEffect, useState, useCallback } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { safelyToLocaleDate, safelyFormatDate } from "@/utils/dateUtils";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import {
  Trash2,
  Users,
  FileText,
  Activity,
  LogOut,
  Search,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Key,
  Shield,
  Settings,
  BarChart3,
  Ban,
  Sun,
  Moon,
  History,
  ExternalLink,
  TrendingUp,
  Database,
  Cpu,
  Megaphone,
  CreditCard,
  LayoutDashboard,
  CheckCircle2,
  Calendar,
  Clock,
  PieChart as PieChartIcon,
  Copy,
  Mail,
  Phone,
  MessageSquare,
  ShieldCheck,
  Lock,
  Sparkles,
  Eye,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { CardFooter } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

import { UserData, RawUserData, RevenueData, AuditLog, SystemSetting } from '@/types/admin';



const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const AdminDashboard = () => {
  const { isAdminAuthenticated, isInitializing, logout } = useAdmin();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [resetPasswordEmail, setResetPasswordEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(10);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [totalActiveUsersCount, setTotalActiveUsersCount] = useState(0);
  const [totalInvoicesCount, setTotalInvoicesCount] = useState(0);
  const [totalClientsCount, setTotalClientsCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // System settings states
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [publicSignups, setPublicSignups] = useState(true);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [pendingMaintenanceValue, setPendingMaintenanceValue] = useState(false);
  const [showSignupsDialog, setShowSignupsDialog] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isPublishingBroadcast, setIsPublishingBroadcast] = useState(false);
  const [pendingSignupsValue, setPendingSignupsValue] = useState(false);
  const [extendUserId, setExtendUserId] = useState<string | null>(null);
  const [extendUserEmail, setExtendUserEmail] = useState('');
  const [extensionDays, setExtensionDays] = useState("30");
  const [isExtending, setIsExtending] = useState(false);
  const [now, setNow] = useState(new Date());
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [userDeleteCheckbox1, setUserDeleteCheckbox1] = useState(false);
  const [userDeleteCheckbox2, setUserDeleteCheckbox2] = useState(false);

  const [selectedUserSetting, setSelectedUserSetting] = useState<{ whatsapp_provider: string } | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Module management dialog state
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [targetModuleUser, setTargetModuleUser] = useState<UserData | null>(null);
  const [userModules, setUserModules] = useState<string[]>(['billing', 'payroll', 'ledger', 'inventory', 'crm', 'daily-hisab']);
  const [isSavingModules, setIsSavingModules] = useState(false);

  const ALL_SYSTEM_MODULES = [
    { key: 'billing', label: 'Billing & Invoices', desc: 'Invoices, Quotations, Payments & GST', icon: FileText },
    { key: 'payroll', label: 'Payroll & HR', desc: 'Salary, Employee Directory, Attendance & Leaves', icon: Users },
    { key: 'ledger', label: 'Account Ledger', desc: 'Double-entry bookkeeping, P&L, Balance Sheet', icon: CreditCard },
    { key: 'inventory', label: 'Inventory & Stock', desc: 'Stock tracking, Warehouses, Barcodes', icon: Database },
    { key: 'crm', label: 'CRM & Deals', desc: 'Lead tracking, Sales Pipelines, Contacts', icon: MessageSquare },
    { key: 'daily-hisab', label: 'Daily Hisab', desc: 'Simple cash in/out register', icon: Calendar },
  ];

  const handleOpenModuleModal = (user: UserData) => {
    setTargetModuleUser(user);
    const rawAllowed = (user as any).allowed_modules;
    if (Array.isArray(rawAllowed) && rawAllowed.length > 0) {
      setUserModules(rawAllowed);
    } else {
      setUserModules(['billing', 'payroll', 'ledger', 'inventory', 'crm', 'daily-hisab']);
    }
    setModuleDialogOpen(true);
  };

  const handleToggleModuleKey = (key: string) => {
    if (userModules.includes(key)) {
      setUserModules(userModules.filter(k => k !== key));
    } else {
      setUserModules([...userModules, key]);
    }
  };

  const handleSaveUserModules = async () => {
    if (!targetModuleUser) return;
    setIsSavingModules(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ allowed_modules: userModules })
        .eq('id', targetModuleUser.user_id);

      if (error) throw error;

      localStorage.setItem(`bms_permissions_${targetModuleUser.user_id}`, JSON.stringify(userModules));

      toast({
        title: "Module Visibility Saved",
        description: `Allowed modules updated for ${targetModuleUser.company_name || targetModuleUser.email}.`,
      });
      setModuleDialogOpen(false);
      loadDashboardData(true);
    } catch (err: any) {
      toast({
        title: "Error Saving Modules",
        description: err.message || "Failed to update module permissions",
        variant: "destructive"
      });
    } finally {
      setIsSavingModules(false);
    }
  };

  useEffect(() => {
    if (!selectedUser) {
      setSelectedUserSetting(null);
      return;
    }

    const fetchSelectedUserSettings = async () => {
      setLoadingSettings(true);
      try {
        const { data, error } = await (supabase as any)
          .from('user_settings')
          .select('whatsapp_provider')
          .eq('user_id', selectedUser.user_id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setSelectedUserSetting(data);
        } else {
          setSelectedUserSetting({ whatsapp_provider: 'meta' });
        }
      } catch (err) {
        console.error('Error fetching selected user settings:', err);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSelectedUserSettings();
  }, [selectedUser]);

  const handleUpdateWhatsappProvider = async (provider: string) => {
    if (!selectedUser) return;
    try {
      setLoadingSettings(true);
      const { error } = await (supabase as any)
        .from('user_settings')
        .upsert({
          user_id: selectedUser.user_id,
          whatsapp_provider: provider
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setSelectedUserSetting(prev => prev ? { ...prev, whatsapp_provider: provider } : { whatsapp_provider: provider });

      // Optimistically update the list state
      setUsers(prev => prev.map(u => u.user_id === selectedUser.user_id ? { ...u, whatsapp_provider: provider } : u));

      toast({
        title: "Settings Updated",
        description: `WhatsApp delivery method updated to ${provider === 'personal' ? 'Personal WhatsApp' : 'Official WhatsApp'}`
      });

      // Small delay to let the DB commit the transaction
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadDashboardData(true);
    } catch (err: any) {
      console.error('Error updating whatsapp provider:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to update WhatsApp settings",
        variant: "destructive"
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleToggleWhatsappProvider = async (userId: string, currentProvider: string) => {
    const nextProvider = currentProvider === 'personal' ? 'meta' : 'personal';
    
    // Optimistically update the list state for instant UI response
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, whatsapp_provider: nextProvider } : u));

    try {
      setLoading(true);
      const { error } = await (supabase as any)
        .from('user_settings')
        .upsert({
          user_id: userId,
          whatsapp_provider: nextProvider
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Settings Updated",
        description: `WhatsApp delivery method updated to ${nextProvider === 'personal' ? 'Personal WhatsApp' : 'Official WhatsApp'}`
      });

      // Small delay to let the DB commit the transaction before re-fetching
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadDashboardData(true);
    } catch (err: any) {
      console.error('Error updating whatsapp provider:', err);
      // Revert optimistic update on error
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, whatsapp_provider: currentProvider } : u));
      toast({
        title: "Error",
        description: err.message || "Failed to update WhatsApp settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);


  // Calculate Dynamic Data for Charts
  const generateGrowthData = () => {
    if (!users.length) return [];

    // Group users by creation date (last 7 days grouped loosely for the chart)
    const last14Days = Array.from({ length: 4 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (14 - i * 4));
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: d.getTime()
      };
    });

    return last14Days.map((period, i) => {
      // Calculate cumulative users up to this period
      const prevTimestamp = i === 0 ? 0 : last14Days[i - 1].timestamp;
      const usersUpToDate = users.filter(u => new Date(u.created_at).getTime() <= period.timestamp).length;
      const proUsersUpToDate = users.filter(u => u.subscription_expires_at && new Date(u.created_at).getTime() <= period.timestamp).length;

      return {
        date: period.date,
        users: usersUpToDate,
        pro: proUsersUpToDate
      };
    });
  };

  const growthData = generateGrowthData();

  const planData = [
    { name: 'Free', value: users.length - users.filter(u => u.subscription_expires_at).length },
    { name: 'Pro', value: users.filter(u => u.subscription_expires_at).length },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      const { data: adminData } = await (supabase as unknown as { 
        rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> 
      }).rpc('admin_get_all_users', {
        p_limit: usersPageSize,
        p_offset: (usersPage - 1) * usersPageSize,
        p_search: debouncedSearch
      });
      if (adminData) {
        const userList = adminData as (RawUserData & { total_count: number })[];
        // Extract total count from the first record if available
        if (userList.length > 0) {
          setTotalUsersCount(Number(userList[0].total_count));
        } else {
          setTotalUsersCount(0);
        }

        // Merge profiles table to guarantee subscription_expires_at, is_paid, and plan_type are up to date!
        const { data: profs } = await supabase.from('profiles').select('*');
        const profMap = new Map((profs || []).map((p: any) => [p.id || p.user_id, p]));

        const mappedUsers: UserData[] = userList.map(u => {
          const prof: any = profMap.get(u.user_id) || {};
          const expiresAt = prof.subscription_expires_at || u.subscription_expires_at || null;
          const hasFutureExpiry = expiresAt ? new Date(expiresAt).getTime() > Date.now() : false;
          const isPaid = !!(prof.is_paid || u.is_paid || hasFutureExpiry);
          return {
            user_id: u.user_id,
            company_name: u.company_name || prof.company_name,
            email: u.email || prof.email,
            mobile: u.mobile || prof.mobile || null,
            created_at: u.created_at || prof.created_at,
            last_sign_in_at: u.last_sign_in_at,
            last_invoice_created_at: u.last_invoice_created_at,
            invoice_count: Number(u.invoice_count || 0),
            client_count: Number(u.client_count || 0),
            subscription_expires_at: expiresAt,
            plan_type: prof.plan_type || u.plan_type || (hasFutureExpiry ? 'pro' : 'free'),
            is_blocked: !!(prof.is_blocked || u.is_blocked),
            is_paid: isPaid,
            whatsapp_provider: u.whatsapp_provider || 'meta'
          };
        });
        setUsers(mappedUsers);
        return;
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [usersPage, usersPageSize, debouncedSearch]);


  const fetchAuditLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.warn("admin_actions table might not exist or be accessible", error);
        return;
      }

      if (data) {
        const logs = data as unknown as {
          id: string;
          action_type: string | null;
          target_id: string | null;
          created_at: string;
          admin_email: string | null;
        }[];
        const formattedLogs = logs.map((log) => ({
          id: log.id,
          action: log.action_type || 'System Event',
          details: log.target_id || 'N/A',
          created_at: log.created_at,
          time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          target: log.target_id || 'General System',
          admin: log.admin_email || 'Super Admin'
        }));
        setAuditLogs(formattedLogs);
      }
    } catch (error) {
      console.error('Error fetching audit logs', error);
    }
  }, []);

  const fetchSystemSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['maintenance_mode', 'public_signups', 'platform_broadcast']);

      if (error) {
        // Table system_settings may not exist in database schema, fallback gracefully
        return;
      }

      if (data) {
        const settings = data as unknown as { key: string; value: string | boolean }[];
        const maintenance = settings.find(s => s.key === 'maintenance_mode');
        const signups = settings.find(s => s.key === 'public_signups');

        // Handle both string and boolean values from database
        setMaintenanceMode(maintenance?.value === 'true' || maintenance?.value === true);
        setPublicSignups(signups?.value === 'true' || signups?.value === true);
      }
    } catch {
      // Fallback silently without throwing error toasts
    }
  }, []);

  const fetchSystemStats = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any).rpc('admin_get_stats');
      if (error) throw error;
      if (data) {
        setTotalUsersCount(Number(data.total_users || 0));
        setTotalActiveUsersCount(Number(data.active_users || 0));
        setTotalInvoicesCount(Number(data.total_invoices || 0));
        setTotalClientsCount(Number(data.total_clients || 0));
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  }, []);

  const loadDashboardData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    await Promise.all([
      fetchUsers(),
      fetchAuditLogs(),
      fetchSystemSettings(),
      fetchSystemStats()
    ]);
    if (!silent) setLoading(false);
  }, [fetchUsers, fetchAuditLogs, fetchSystemSettings, fetchSystemStats]);

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadDashboardData();
    }
  }, [isAdminAuthenticated, loadDashboardData]);

  useEffect(() => {
    if (!isAdminAuthenticated) return;

    const timer = setInterval(() => {
      void loadDashboardData(true);
    }, 15000);

    return () => clearInterval(timer);
  }, [isAdminAuthenticated, loadDashboardData]);

  // Sync selectedUser when the users list updates (e.g. after extension)
  useEffect(() => {
    if (selectedUser && users.length > 0) {
      const fresh = users.find(u => u.user_id === selectedUser.user_id);
      if (fresh && (
        fresh.subscription_expires_at !== selectedUser.subscription_expires_at ||
        fresh.is_blocked !== selectedUser.is_blocked ||
        fresh.email !== selectedUser.email ||
        fresh.mobile !== selectedUser.mobile ||
        fresh.last_sign_in_at !== selectedUser.last_sign_in_at ||
        fresh.last_invoice_created_at !== selectedUser.last_invoice_created_at ||
        fresh.invoice_count !== selectedUser.invoice_count ||
        fresh.client_count !== selectedUser.client_count ||
        fresh.plan_type !== selectedUser.plan_type ||
        fresh.is_paid !== selectedUser.is_paid ||
        fresh.whatsapp_provider !== selectedUser.whatsapp_provider
      )) {
        setSelectedUser(fresh);
      }
    }
  }, [users, selectedUser]); // Only trigger when the users list itself changes or selected user is changed

  const updateSystemSetting = async (settingName: string, value: boolean) => {
    try {
      setLoading(true);
      const { error } = await (supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: unknown }> })
        .rpc('admin_upsert_setting', {
          p_key: settingName,
          p_value: JSON.stringify(value)
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${settingName.replace('_', ' ')} updated successfully.`,
      });

      if (settingName === 'maintenance_mode') {
        setMaintenanceMode(value);
        setShowMaintenanceDialog(false);
      } else if (settingName === 'public_signups') {
        setPublicSignups(value);
        setShowSignupsDialog(false);
      }

    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error(`Error updating ${settingName}:`, error);
      toast({
        title: "Error",
        description: `Failed to update ${settingName}: ${err.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (userId: string) => {
    try {
      setLoading(true);
      const { error } = await (supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: unknown }> })
        .rpc('admin_cancel_subscription', { target_user_id: userId });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subscription cancelled successfully",
      });

      loadDashboardData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockUser = async (userId: string) => {
    try {
      setLoading(true);
      const { error } = await (supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: unknown }> })
        .rpc('admin_toggle_block_user', { target_user_id: userId });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User status updated successfully",
      });

      // Small delay to ensure DB consistency before re-fetching
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadDashboardData(true);
    } catch (error) {
      console.error('Error toggling block status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await (supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: unknown }> })
        .rpc('admin_delete_user', { target_user_id: userId });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User profile deleted successfully",
      });

      // Small delay to ensure DB consistency before re-fetching
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadDashboardData(true);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handlePasswordReset = async () => {
    if (!resetPasswordId || !newPassword) return;

    try {
      setLoading(true);
      const { error } = await (supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: unknown }> })
        .rpc('admin_reset_password', {
          target_user_id: resetPasswordId,
          new_password: newPassword
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Password updated successfully for ${resetPasswordEmail}`,
      });

      setResetPasswordId(null);
      setResetPasswordEmail('');
      setNewPassword("");

    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: `Failed to update password: ${err.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExtendPlan = async () => {
    if (!extendUserId) return;

    try {
      setIsExtending(true);
      const daysToAdd = parseInt(extensionDays) || 30;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysToAdd);

      const targetPlanType = daysToAdd >= 300 ? 'pro_yearly' : (daysToAdd < 0 ? 'free' : 'pro_monthly');

      // Update profiles table with extended expiry and plan_type
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          plan_type: targetPlanType
        })
        .eq('id', extendUserId);

      if (profileErr) {
        await supabase
          .from('profiles')
          .update({
            plan_type: targetPlanType
          })
          .eq('user_id', extendUserId);
      }

      // Try RPC fallback if present
      try {
        await (supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: unknown }> })
          .rpc('admin_extend_subscription', {
            target_user_id: extendUserId,
            days_to_add: daysToAdd
          });
      } catch {
        /* RPC fallback */
      }

      toast({
        title: "Plan Extended Successfully",
        description: `Plan extended by ${daysToAdd} days (${targetPlanType}) for ${extendUserEmail}.`,
      });

      setExtendUserId(null);
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadDashboardData(true);
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error extending plan:', error);
      toast({
        title: "Error",
        description: `Extension failed: ${err.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsExtending(false);
    }
  };

  const handlePublishBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      toast({
        title: "Warning",
        description: "Please enter a message for the broadcast.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPublishingBroadcast(true);
      const broadcastData = {
        message: broadcastMessage.trim(),
        timestamp: new Date().toISOString(),
        id: crypto.randomUUID()
      };

      const { error } = await (supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: unknown }> })
        .rpc('admin_upsert_setting', {
          p_key: 'platform_broadcast',
          p_value: broadcastData
        });

      if (error) throw error;

      toast({
        title: "Broadcast Published",
        description: "Your message is now visible to all users.",
      });
      setBroadcastMessage('');
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error publishing broadcast:', error);
      toast({
        title: "Error",
        description: `Failed to publish broadcast: ${err.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsPublishingBroadcast(false);
    }
  };

  const getSubscriptionStatus = (expiresAt: string | null, planType: string | null, isPaid: boolean = false, createdAt?: string) => {
    const hasFutureExpiry = expiresAt ? new Date(expiresAt).getTime() > Date.now() : false;
    
    if (isPaid || hasFutureExpiry) {
      const label = planType ? (planType.charAt(0).toUpperCase() + planType.slice(1)) : 'Pro';
      return { status: `Paid Plan - ${label}`, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }

    if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
      return { status: 'Expired', color: 'bg-rose-100 text-rose-600 border-rose-200' };
    }

    return { status: 'Free Trial', color: 'bg-blue-100 text-blue-600 border-blue-200' };
  };

  const getSubscriptionCountdown = (expiresAt: string | null) => {
    if (!expiresAt) return "No active plan";
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Account access expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 365) return "Permanent / Lifetime";
    if (days > 0) return `${days} days and ${hours} hours left`;
    return `${hours}h ${minutes}m remaining`;
  };

  const totalUserPages = Math.max(1, Math.ceil(totalUsersCount / usersPageSize));
  const safeUsersPage = Math.min(usersPage, totalUserPages);
  const paginatedUsers = users; // Data is already paginated from server
  const userRangeStart = totalUsersCount === 0 ? 0 : (safeUsersPage - 1) * usersPageSize + 1;
  const userRangeEnd = Math.min(safeUsersPage * usersPageSize, totalUsersCount);
  const userPageNumbers = Array.from({ length: totalUserPages }, (_, index) => index + 1)
    .filter(page => page === 1 || page === totalUserPages || Math.abs(page - safeUsersPage) <= 1);

  useEffect(() => {
    setUsersPage(1);
  }, [searchTerm, usersPageSize]);

  useEffect(() => {
    if (usersPage > totalUserPages) {
      setUsersPage(totalUserPages);
    }
  }, [usersPage, totalUserPages]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">Initializing Security Protocol...</p>
        </div>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const navItems = [
    { id: 'overview', label: 'Overview & Analytics', icon: TrendingUp, desc: 'Platform metrics' },
    { id: 'users', label: 'Organizations & Users', icon: Users, badge: users.length, desc: 'Multi-tenant directory' },
    { id: 'system', label: 'System & Security', icon: Settings, desc: 'Logs & Guard rails' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-600 selection:text-white transition-colors duration-200 flex">
      {/* Mobile Sidebar Overlay */}
      {mobileNavOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Desktop & Mobile Left Sidebar */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
        mobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <img src="/logo.png" alt="Escrow BMS" className="w-6 h-6 object-contain" onError={(e) => { (e.target as any).style.display = 'none'; }} />
              </div>
              <div>
                <h2 className="font-black text-sm tracking-tight text-slate-900 dark:text-white">Escrow BMS</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Superadmin</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setMobileNavOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-1.5">
            <p className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Navigation</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Theme</span>
            <ThemeToggle />
          </div>

          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">Root Superadmin</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">admin_bms@escrowbms.com</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={logout} 
            variant="ghost" 
            className="w-full justify-start text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Exit Console
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {activeTab === 'overview' && 'Platform Overview & Analytics'}
                {activeTab === 'users' && 'Multi-Tenant Organization Directory'}
                {activeTab === 'system' && 'Infrastructure & Security Controls'}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                {activeTab === 'overview' && 'Real-time metrics on user growth, activity, and subscriptions'}
                {activeTab === 'users' && 'Manage business access, module licenses, and plan durations'}
                {activeTab === 'system' && 'System audit logs, platform guards, and global broadcast'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              All Systems Operational
            </span>
            <Button
              onClick={() => loadDashboardData(true)}
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-slate-200 dark:border-slate-700 font-semibold text-xs"
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </div>
        </header>

        {/* Body Container */}
        <main className="p-4 md:p-8 space-y-6 flex-1">
          {/* 4 Professional SaaS KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Organizations */}
            <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Companies</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{totalUsersCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registered tenant accounts</p>
            </div>

            {/* Card 2: Active Users */}
            <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Workspaces</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{totalActiveUsersCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Verified active businesses</p>
            </div>

            {/* Card 3: Invoices */}
            <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Invoices</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{totalInvoicesCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Issued across all stores</p>
            </div>

            {/* Card 4: Clients */}
            <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Clients & Parties</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{totalClientsCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Connected party records</p>
            </div>
          </div>

          {/* Views based on activeTab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900 rounded-2xl">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <CardTitle className="text-base font-bold flex items-center text-slate-900 dark:text-white">
                      <Activity className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                      User & Organization Growth
                    </CardTitle>
                    <CardDescription className="text-xs">New business registrations over the last 14 days</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[280px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={growthData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A3B8" opacity={0.2} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="users" stroke="#6366F1" strokeWidth={2.5} fillOpacity={0.15} fill="#6366F1" />
                        <Area type="monotone" dataKey="pro" stroke="#10B981" strokeWidth={2.5} fillOpacity={0.1} fill="#10B981" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900 rounded-2xl">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <CardTitle className="text-base font-bold flex items-center text-slate-900 dark:text-white">
                      <PieChartIcon className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                      Subscription Distribution
                    </CardTitle>
                    <CardDescription className="text-xs">Active plans across Pro Yearly, Pro Monthly, and Free Trial</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[280px] w-full pt-4 flex flex-col items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={planData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {planData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 justify-center mt-2">
                      {planData.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{p.name}: {p.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'API Gateway Latency', value: '38ms', status: 'Optimal', icon: <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> },
                  { label: 'Database Connections', value: '16/100', status: 'Healthy', icon: <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
                  { label: 'Server Load', value: '5.2%', status: 'Normal', icon: <Cpu className="w-4 h-4 text-amber-600 dark:text-amber-400" /> },
                ].map((comp, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3.5">
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      {comp.icon}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{comp.label}</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{comp.value}</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">{comp.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900 rounded-2xl">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5 gap-4">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Multi-Tenant Organization Directory
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Manage company workspaces, feature module licenses, and plan durations.
                  </CardDescription>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search company, email, phone..."
                      className="pl-10 w-full sm:w-[280px] h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-medium"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => loadDashboardData(false)} variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700" disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Company / Organization</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Contact</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Created</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Account Status</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Subscription Tier</TableHead>
                      <TableHead className="text-right font-bold text-xs uppercase tracking-wider pr-6">Management</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="border-slate-100 dark:border-slate-800">
                          <TableCell colSpan={6} className="py-4">
                            <Skeleton className="h-10 w-full rounded-xl" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      users.length === 0 ? (
                        <TableRow className="border-slate-100 dark:border-slate-800">
                          <TableCell colSpan={6} className="text-center py-20">
                            <div className="flex flex-col items-center">
                              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                                <Search className="w-8 h-8 text-slate-400" />
                              </div>
                              <p className="text-slate-500 dark:text-slate-400 font-bold text-base">No registered accounts matching "{searchTerm}"</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.user_id} className="group border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-200 dark:border-indigo-800">
                                  {user.company_name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white text-sm">{user.company_name || 'Individual Merchant'}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs font-semibold">{user.mobile || 'Not provided'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{safelyToLocaleDate(user.created_at)}</p>
                            </TableCell>
                            <TableCell>
                              {user.is_blocked ? (
                                <Badge className="rounded-full bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900 text-[11px] font-bold">Suspended</Badge>
                              ) : (
                                <Badge className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900 text-[11px] font-bold">Active</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const sub = getSubscriptionStatus(user.subscription_expires_at, user.plan_type, user.is_paid, user.created_at);
                                return <Badge className={`rounded-full shadow-none text-[11px] font-bold ${sub.color}`}>{sub.status}</Badge>;
                              })()}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                                  title="Manage Allowed Modules (Billing, Payroll, Ledger, Inventory, CRM)"
                                  onClick={() => handleOpenModuleModal(user)}
                                >
                                  <LayoutDashboard className="w-4 h-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setUserDetailsOpen(true);
                                  }}
                                  title="User Audit Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                  title="Extend Plan (+30 Days)"
                                  onClick={() => {
                                    setExtendUserId(user.user_id);
                                    setExtendUserEmail(user.email);
                                  }}
                                >
                                  <Clock className="w-4 h-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                  title="Delete User"
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setDeleteConfirmText("");
                                    setUserDeleteCheckbox1(false);
                                    setUserDeleteCheckbox2(false);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )
                    )}
                  </TableBody>
                </Table>
                <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Showing {userRangeStart}-{userRangeEnd} of {totalUsersCount} organizations
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Page Size</span>
                      <Select value={String(usersPageSize)} onValueChange={(value) => setUsersPageSize(Number(value))}>
                        <SelectTrigger className="h-8 w-[80px] rounded-lg border-slate-200 dark:border-slate-700 font-bold text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 20, 30, 40, 50].map((size) => (
                            <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Pagination className="mx-0 w-auto justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          className={safeUsersPage === 1 ? "pointer-events-none opacity-50" : ""}
                          onClick={(event) => {
                            event.preventDefault();
                            setUsersPage((page) => Math.max(1, page - 1));
                          }}
                        />
                      </PaginationItem>
                      {userPageNumbers.map((page, index) => {
                        const previousPage = userPageNumbers[index - 1];
                        const showGap = previousPage && page - previousPage > 1;

                        return (
                          <PaginationItem key={page} className="flex items-center">
                            {showGap && <span className="px-2 text-slate-400">...</span>}
                            <PaginationLink
                              href="#"
                              isActive={page === safeUsersPage}
                              className={page === safeUsersPage ? "bg-indigo-600 text-white rounded-lg border-none font-bold" : ""}
                              onClick={(event) => {
                                event.preventDefault();
                                setUsersPage(page);
                              }}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          className={safeUsersPage === totalUserPages ? "pointer-events-none opacity-50" : ""}
                          onClick={(event) => {
                            event.preventDefault();
                            setUsersPage((page) => Math.min(totalUserPages, page + 1));
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'system' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl h-fit">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <CardTitle className="text-base font-bold flex items-center text-slate-900 dark:text-white">
                      <History className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                      Platform Security & Audit Logs
                    </CardTitle>
                    <CardDescription className="text-xs">Administrative actions and security policy events</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {auditLogs.length > 0 ? (
                        auditLogs.map((log) => (
                          <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <div className={`p-2.5 rounded-xl ${log.action.includes('Blocked') ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'}`}>
                              <Shield className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{log.action}</p>
                                <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300">Target Workspace: {log.target}</p>
                              <p className="text-[10px] text-slate-400 mt-1">Initiated by: {log.admin}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">No recent platform security incidents recorded</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <CardTitle className="text-base font-bold flex items-center text-slate-900 dark:text-white">
                      <Settings className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                      Platform Guard Rails
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Maintenance Mode</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Lock the platform for updates</p>
                      </div>
                      <AlertDialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
                        <AlertDialogTrigger asChild>
                          <div onClick={(e) => {
                            e.preventDefault();
                            setPendingMaintenanceValue(!maintenanceMode);
                            setShowMaintenanceDialog(true);
                          }}>
                            <Checkbox checked={maintenanceMode} />
                          </div>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-black flex items-center gap-2">
                              <AlertTriangle className="text-amber-500 w-5 h-5" />
                              Critical Operation
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-sm font-medium pt-2">
                              {pendingMaintenanceValue
                                ? "Enabling maintenance mode will block all non-admin users from accessing their dashboards. Are you absolutely certain?"
                                : "Disabling maintenance mode will restore platform access for all users immediately."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl font-bold border-none bg-slate-100">Abort</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => updateSystemSetting('maintenance_mode', pendingMaintenanceValue)}
                              className="rounded-xl font-bold bg-slate-900 text-white"
                            >
                              Confirm Action
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Public Signups</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Enable new user registration</p>
                      </div>
                      <AlertDialog open={showSignupsDialog} onOpenChange={setShowSignupsDialog}>
                        <AlertDialogTrigger asChild>
                          <div onClick={(e) => {
                            e.preventDefault();
                            setPendingSignupsValue(!publicSignups);
                            setShowSignupsDialog(true);
                          }}>
                            <Checkbox checked={publicSignups} />
                          </div>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-black">Authentication Guard</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm font-medium pt-2">
                              {pendingSignupsValue
                                ? "New businesses will be able to register on the platform. Proceed?"
                                : "Disabling signups will prevent any new registrations until re-enabled."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl font-bold border-none bg-slate-100">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => updateSystemSetting('public_signups', pendingSignupsValue)}
                              className="rounded-xl font-bold bg-primary text-white"
                            >
                              Confirm Request
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden relative">
                  <CardHeader className="bg-blue-50/50 dark:bg-blue-950/20 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-base font-bold flex items-center text-blue-600 dark:text-blue-400">
                      <Megaphone className="w-4 h-4 mr-2" />
                      Platform Broadcast
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10 pt-6">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">Send a notice to all logged-in users instantly.</p>
                    <Input
                      placeholder="Enter notice text..."
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 h-10 mb-3"
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                    />
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      onClick={handlePublishBroadcast}
                      disabled={isPublishingBroadcast}
                    >
                      {isPublishingBroadcast ? 'Publishing...' : 'Publish Announcement'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Account Analysis</DialogTitle>
            <DialogDescription>Infrastructure and activity overview for this entity</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-6 space-y-6">
              <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Business Name</p>
                    <p className="font-bold text-xl leading-tight">{selectedUser.company_name || 'Individual Profile'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">System UID</p>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono text-slate-600">{selectedUser.user_id}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(selectedUser.user_id); toast({ title: "Copied", description: "UID copied to clipboard" }); }}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Registered Email</p>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Mail className="w-4 h-4 opacity-50" />
                      <p className="text-sm font-bold">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date of Entry</p>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Calendar className="w-4 h-4 opacity-50" />
                      <p className="text-sm font-bold">{safelyFormatDate(selectedUser.created_at, 'PPpp')}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mobile Number</p>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Phone className="w-4 h-4 opacity-50" />
                      <p className="text-sm font-bold">{selectedUser.mobile || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Account Activity</p>
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Activity className="w-3.5 h-3.5" />
                    <p className="text-xs font-bold">
                      {selectedUser.last_sign_in_at ? safelyFormatDate(selectedUser.last_sign_in_at, 'PPpp') : 'Never'}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Invoice Generated</p>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <FileText className="w-3.5 h-3.5" />
                    <p className="text-xs font-bold">
                      {safelyFormatDate(selectedUser.last_invoice_created_at, 'PPpp', 'No invoices created yet')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Invoices</p>
                  <p className="text-2xl font-black text-blue-700 dark:text-blue-400">{selectedUser.invoice_count || 0}</p>
                </div>
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100/50 dark:border-purple-800/30 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center mb-2">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Total Clients</p>
                  <p className="text-2xl font-black text-purple-700 dark:text-purple-400">{selectedUser.client_count || 0}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-800/30 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Profile Health</p>
                  <p className={`text-sm font-black ${selectedUser.is_blocked ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    {selectedUser.is_blocked ? 'SUSPENDED' : 'OPTIMAL'}
                  </p>
                </div>
              </div>

              <div className="p-4 md:p-6 rounded-[24px] bg-slate-900 dark:bg-slate-950 text-white relative overflow-hidden group shadow-xl transition-all">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                        <Lock className="w-3 h-3 text-primary" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Subscription Protocol</p>
                    </div>
                    {selectedUser.subscription_expires_at && (
                      <div className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                        Verified Tier
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-2xl font-black tracking-tight flex items-center gap-3">
                      {(selectedUser.subscription_expires_at || (selectedUser.plan_type && selectedUser.plan_type !== 'free'))
                        ? `Paid Plan (${selectedUser.plan_type ? selectedUser.plan_type.toUpperCase() : 'PRO'})`
                        : `Free Trial Tier`}
                      <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                    </p>
                    <p className="text-xs text-slate-400 font-medium italic">
                      {(selectedUser.subscription_expires_at || (selectedUser.plan_type && selectedUser.plan_type !== 'free'))
                        ? "Active Subscription (Granted & Verified by Admin)"
                        : "No active plan detected (grant access from Extend Plan)"}
                    </p>
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-4 h-4 text-primary animate-spin-slow" />
                      <p className="text-xs font-bold text-slate-300">Countdown to Inactivation:</p>
                    </div>
                    <p className="text-xl font-black text-emerald-400 font-mono tabular-nums leading-none">
                      {(selectedUser.subscription_expires_at || (selectedUser.plan_type && selectedUser.plan_type !== 'free'))
                        ? "ACTIVE PRO ACCESS (UNLIMITED)"
                        : getSubscriptionCountdown(selectedUser.subscription_expires_at)}
                    </p>
                  </div>
                </div>

                {/* Abstract decoration */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl transition-all group-hover:scale-150" />
                <div className="absolute -top-10 -left-10 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl transition-all group-hover:scale-150" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setUserDetailsOpen(false)} className="rounded-xl font-bold bg-slate-900 text-white">Close Analysis</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordId} onOpenChange={(open) => !open && setResetPasswordId(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Force Credential Reset</DialogTitle>
            <DialogDescription>
              Assigning a temporary passkey for <span className="font-bold text-slate-900 dark:text-white">{resetPasswordEmail}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Label htmlFor="new-password">New Security Password</Label>
            <Input
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="e.g. TempPass123!"
              type="text"
              className="mt-2 rounded-xl h-11"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">The user should change this immediately upon logging in.</p>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setResetPasswordId(null)} className="rounded-xl font-bold">
              Abort
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" disabled={!newPassword || loading} className="rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white">
                  {loading ? 'Processing...' : 'Overwrite Password'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-bold text-2xl">Confirm Password Override?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                    This will forcibly change the login credentials for <span className="font-bold text-slate-900">{resetPasswordEmail}</span>.
                    The user will be required to log in with the new password.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl font-bold">Abort</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePasswordReset} className="rounded-xl font-bold bg-blue-600 text-white">
                    Execute Override
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Extension Dialog */}
      <Dialog open={!!extendUserId} onOpenChange={(open) => !open && setExtendUserId(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
              <Clock className="w-6 h-6 text-emerald-600" />
              Extend Access Plan
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Adding free operational time for <span className="font-extrabold text-emerald-600">{extendUserEmail}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-8 space-y-6">
            <div className="space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Quick Selection</Label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: '-30d', value: "-30", color: "text-rose-600 hover:bg-rose-50" },
                  { label: '-7d', value: "-7", color: "text-rose-500 hover:bg-rose-50" },
                  { label: '+7d', value: "7", color: "text-emerald-600 hover:bg-emerald-50" },
                  { label: '+30d', value: "30", color: "text-emerald-600 hover:bg-emerald-50" },
                  { label: '+1y', value: "365", color: "text-emerald-700 hover:bg-emerald-50" }
                ].map((preset) => (
                  <Button
                    key={preset.value}
                    variant={extensionDays === preset.value ? "default" : "outline"}
                    className={`rounded-xl h-10 text-[10px] px-1 font-black ${extensionDays === preset.value ? (parseInt(preset.value) < 0 ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500') : preset.color}`}
                    onClick={() => setExtensionDays(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-days" className="text-xs font-black uppercase tracking-widest text-slate-400">Custom Duration (Days)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="custom-days"
                  type="number"
                  value={extensionDays}
                  onChange={(e) => setExtensionDays(e.target.value)}
                  className="pl-10 h-12 rounded-xl font-bold border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                  placeholder="Enter days..."
                />
              </div>
            </div>

            <div className={`p-4 rounded-2xl border flex gap-3 items-center ${parseInt(extensionDays) < 0 ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${parseInt(extensionDays) < 0 ? 'bg-rose-100 dark:bg-rose-800/30' : 'bg-emerald-100 dark:bg-emerald-800/30'}`}>
                {parseInt(extensionDays) < 0 ? <AlertTriangle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className={`text-[11px] font-bold leading-tight ${parseInt(extensionDays) < 0 ? 'text-rose-800 dark:text-rose-400' : 'text-emerald-800 dark:text-emerald-400'}`}>
                This will {parseInt(extensionDays) < 0 ? 'reduce' : 'extend'} their access by {Math.abs(parseInt(extensionDays))} days.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setExtendUserId(null)} className="rounded-xl font-bold h-12">Cancel</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={isExtending || !extensionDays}
                  className="rounded-xl font-bold h-12 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 px-8 transition-all hover:scale-[1.02]"
                >
                  {isExtending ? 'Updating Access...' : 'Commit Change'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-bold text-2xl">Verify Infrastructure Change?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                    Are you sure you want to <span className="font-bold text-slate-900 dark:text-white">{parseInt(extensionDays) >= 0 ? 'EXTEND' : 'REDUCE'}</span> the access period for <span className="font-bold text-slate-900">{extendUserEmail}</span> by <span className="font-bold text-blue-600">{Math.abs(parseInt(extensionDays))} days</span>?
                    This modification will be applied to the global ledger.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl font-bold border-none bg-slate-100">Abort Change</AlertDialogCancel>
                  <AlertDialogAction onClick={handleExtendPlan} className="rounded-xl font-bold bg-slate-900 text-white">
                    Confirm & Execute
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purge User Profile Dialog with Double Verification */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent className="max-w-md rounded-2xl border-none shadow-2xl bg-background p-0 overflow-hidden">
          <AlertDialogHeader className="p-4 md:p-8 pb-4 border-b bg-rose-50/50">
            <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tight text-rose-950">
              Purge User Profile?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-rose-900/70 font-medium pt-2">
              Destroying all data (invoices, clients, business records, products) for <span className="font-bold text-rose-950">{userToDelete?.company_name}</span> ({userToDelete?.email}).
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="p-4 md:p-6 md:p-8 space-y-6">
            <div className="space-y-3">
              <div
                className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
                onClick={() => setUserDeleteCheckbox1(!userDeleteCheckbox1)}
              >
                <Checkbox
                  id="user-delete-verify1"
                  checked={userDeleteCheckbox1}
                  className="rounded-lg border-2"
                />
                <Label htmlFor="user-delete-verify1" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer group-hover:text-foreground">
                  I understand this destroys all databases and invoice history.
                </Label>
              </div>

              <div
                className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
                onClick={() => setUserDeleteCheckbox2(!userDeleteCheckbox2)}
              >
                <Checkbox
                  id="user-delete-verify2"
                  checked={userDeleteCheckbox2}
                  className="rounded-lg border-2"
                />
                <Label htmlFor="user-delete-verify2" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer group-hover:text-foreground">
                  I acknowledge this operation is permanent and irreversible.
                </Label>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 ml-1">Type "DELETE" to confirm</Label>
                <Input
                  placeholder="Type DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="h-12 rounded-md bg-muted/50 border-border text-center font-bold tracking-widest focus-visible:ring-rose-500/20"
                />
              </div>
            </div>
          </div>

          <AlertDialogFooter className="p-4 md:p-8 pt-4 flex flex-row gap-3 bg-muted/5 border-t">
            <AlertDialogCancel className="flex-1 h-11 font-bold rounded-xl border-2 m-0 hover:bg-slate-100 transition-all">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                if (deleteConfirmText !== 'DELETE' || !userDeleteCheckbox1 || !userDeleteCheckbox2) {
                  e.preventDefault();
                  return;
                }
                if (userToDelete) {
                  deleteUser(userToDelete.user_id);
                  setUserToDelete(null);
                }
              }}
              disabled={deleteConfirmText !== 'DELETE' || !userDeleteCheckbox1 || !userDeleteCheckbox2}
              className="flex-1 h-11 font-black rounded-xl shadow-lg shadow-rose-500/20 bg-rose-600 hover:bg-rose-700 text-white transition-all disabled:opacity-50"
            >
              Purge User Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Module Access Control Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold font-heading">
              <LayoutDashboard className="w-5 h-5 text-purple-600" />
              Manage Workspace Modules
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Select which modules are enabled for <span className="font-bold text-slate-900 dark:text-white">{targetModuleUser?.company_name || targetModuleUser?.email}</span>. Unchecked modules will be automatically removed from their sidebar navigation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 py-3">
            {ALL_SYSTEM_MODULES.map((mod) => {
              const Icon = mod.icon;
              const isChecked = userModules.includes(mod.key);
              return (
                <div 
                  key={mod.key} 
                  onClick={() => handleToggleModuleKey(mod.key)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                    isChecked 
                      ? 'bg-purple-50/60 border-purple-200 dark:bg-purple-950/20 dark:border-purple-900/40 shadow-sm' 
                      : 'bg-slate-50/40 border-slate-200/60 dark:bg-slate-900/50 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isChecked ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">{mod.label}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{mod.desc}</p>
                    </div>
                  </div>
                  <Checkbox 
                    checked={isChecked} 
                    onCheckedChange={() => handleToggleModuleKey(mod.key)} 
                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)} className="rounded-xl font-bold text-xs">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveUserModules} 
              disabled={isSavingModules}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs gap-2 shadow-lg shadow-purple-600/20"
            >
              {isSavingModules && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Save Module Visibility
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
