import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase, serviceSupabase as serviceRoleSupabase } from '@/integrations/supabase/client';
import { safelyToLocaleDate, safelyFormatDate } from "@/utils/dateUtils";
import { generateAccountId } from "@/utils/accountId";
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
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
  ChevronRight,
  ChevronDown,
  MoreVertical
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

import { UserData, RawUserData, RevenueData, AuditLog, SystemSetting, AccountDeletionRequest, UserType } from '@/types/admin';



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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
  const [userToToggleBlock, setUserToToggleBlock] = useState<UserData | null>(null);
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

  // Account Deletion Requests states
  const [deletionRequests, setDeletionRequests] = useState<AccountDeletionRequest[]>([]);
  const [deletionRequestsLoading, setDeletionRequestsLoading] = useState(false);
  const [deletionSearch, setDeletionSearch] = useState('');
  const [deletionStatusFilter, setDeletionStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'>('all');
  const [requestToApprove, setRequestToApprove] = useState<AccountDeletionRequest | null>(null);
  const [requestToReject, setRequestToReject] = useState<AccountDeletionRequest | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [approveConfirmText, setApproveConfirmText] = useState('');

  const [selectedUserSetting, setSelectedUserSetting] = useState<{ whatsapp_provider: string; user_type?: UserType | null } | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);


  useEffect(() => {
    if (!selectedUser) {
      setSelectedUserSetting(null);
      return;
    }

    const fetchSelectedUserSettings = async () => {
      setLoadingSettings(true);
      try {
        const client = serviceRoleSupabase || supabase;
        const { data, error } = await (client as any)
          .from('user_settings')
          .select('whatsapp_provider, user_type')
          .eq('user_id', selectedUser.user_id)
          .maybeSingle();

        if (error) console.warn('fetchSelectedUserSettings notice:', error);

        let resolvedType = data?.user_type || selectedUser.user_type || null;

        // Fallback to system_settings if not yet present in user_settings
        if (!resolvedType) {
          const { data: sysData } = await (client as any)
            .from('system_settings')
            .select('value')
            .eq('key', `user_type_${selectedUser.user_id}`)
            .maybeSingle();

          if (sysData?.value) {
            let val = sysData.value;
            try { val = typeof val === 'string' ? JSON.parse(val) : val; } catch {}
            if (['normal', 'automobile', 'food_kitchen'].includes(val)) {
              resolvedType = val as UserType;
            }
          }
        }

        setSelectedUserSetting({
          whatsapp_provider: data?.whatsapp_provider || 'meta',
          user_type: resolvedType
        });
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
      const client = serviceRoleSupabase || supabase;
      const { data: existing } = await client
        .from('user_settings')
        .select('id, user_id')
        .eq('user_id', selectedUser.user_id)
        .maybeSingle();

      if (existing) {
        await client
          .from('user_settings')
          .update({ whatsapp_provider: provider, updated_at: new Date().toISOString() })
          .eq('user_id', selectedUser.user_id);
      } else {
        await client
          .from('user_settings')
          .insert({ user_id: selectedUser.user_id, whatsapp_provider: provider });
      }

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
      const client = serviceRoleSupabase || supabase;
      const { data: existing } = await client
        .from('user_settings')
        .select('id, user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        await client
          .from('user_settings')
          .update({ whatsapp_provider: nextProvider, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
      } else {
        await client
          .from('user_settings')
          .insert({ user_id: userId, whatsapp_provider: nextProvider });
      }

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

  const handleUpdateUserType = async (userId: string, newType: UserType) => {
    const prevUsers = [...users];
    // 1. Instant optimistic UI feedback
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, user_type: newType } : u));
    if (selectedUser?.user_id === userId) {
      setSelectedUserSetting(prev => prev ? { ...prev, user_type: newType } : { whatsapp_provider: 'meta', user_type: newType });
    }

    try {
      const client = serviceRoleSupabase || supabase;
      let dbSaved = false;

      // Tier 1: Upsert directly into user_settings table
      try {
        const { error: usErr } = await client
          .from('user_settings')
          .upsert({
            user_id: userId,
            user_type: newType,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (!usErr) {
          dbSaved = true;
        } else {
          console.warn('user_settings upsert returned error, attempting update fallback:', usErr);
          const { error: updErr } = await client
            .from('user_settings')
            .update({ user_type: newType, updated_at: new Date().toISOString() })
            .eq('user_id', userId);
          if (!updErr) dbSaved = true;
        }
      } catch (usEx) {
        console.warn('Direct user_settings update attempt failed:', usEx);
      }

      // Tier 2: Upsert into system_settings table as universal fallback
      try {
        const { error: sysErr } = await client
          .from('system_settings')
          .upsert({
            key: `user_type_${userId}`,
            value: newType,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });

        if (!sysErr) {
          dbSaved = true;
        } else {
          console.warn('system_settings upsert error:', sysErr);
        }
      } catch (sysEx) {
        console.warn('system_settings upsert failed:', sysEx);
      }

      // Tier 3: Trigger RPC admin_update_user_type if installed in database
      try {
        await (client as any).rpc('admin_update_user_type', {
          target_user_id: userId,
          new_type: newType
        });
      } catch {}

      if (!dbSaved) {
        throw new Error("Unable to save user type to database. Please check Supabase connection.");
      }

      const typeLabels: Record<UserType, string> = {
        normal: 'Normal 📋',
        automobile: 'Automobile 🚗',
        food_kitchen: 'Food / Cloud Kitchen 🍛',
      };
      toast({
        title: "User Type Updated",
        description: `Business mode set to "${typeLabels[newType]}"`
      });
    } catch (err: any) {
      // Revert only if completely failed to save to any tier
      setUsers(prevUsers);
      console.error('Error updating user type:', err);
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update user type",
        variant: "destructive"
      });
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

        const client = serviceRoleSupabase || supabase;
        const typeOverrides: Record<string, UserType> = {};
        try {
          const keys = userList.map(u => `user_type_${u.user_id}`);
          if (keys.length > 0) {
            const { data: sysData } = await client
              .from('system_settings')
              .select('key, value')
              .in('key', keys);
            if (sysData) {
              sysData.forEach((s: any) => {
                const uid = s.key.replace('user_type_', '');
                let val = s.value;
                try { val = typeof val === 'string' ? JSON.parse(val) : val; } catch {}
                if (['normal', 'automobile', 'food_kitchen'].includes(val)) {
                  typeOverrides[uid] = val as UserType;
                }
              });
            }
          }
        } catch (err) {
          console.warn('Error reading system_settings user_types:', err);
        }

        // Query user_settings table for all users to get their direct business configuration
        const userSettingsMap: Record<string, UserType> = {};
        try {
          const uids = userList.map(u => u.user_id);
          if (uids.length > 0) {
            const { data: usData } = await client
              .from('user_settings')
              .select('user_id, user_type')
              .in('user_id', uids);
            if (usData) {
              usData.forEach((row: any) => {
                if (row.user_id && ['normal', 'automobile', 'food_kitchen'].includes(row.user_type)) {
                  userSettingsMap[row.user_id] = row.user_type as UserType;
                }
              });
            }
          }
        } catch (err) {
          console.warn('Error reading user_settings user_types:', err);
        }

        const mappedUsers: UserData[] = userList
          .map(u => ({
            user_id: u.user_id,
            company_name: u.company_name,
            email: u.email,
            mobile: u.mobile || null,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            last_invoice_created_at: u.last_invoice_created_at,
            invoice_count: Number(u.invoice_count || 0),
            client_count: Number(u.client_count || 0),
            subscription_expires_at: u.subscription_expires_at,
            plan_type: u.plan_type,
            is_blocked: !!u.is_blocked,
            is_paid: !!u.is_paid,
            whatsapp_provider: u.whatsapp_provider || 'meta',
            user_type: (u.user_type as UserType) || userSettingsMap[u.user_id] || typeOverrides[u.user_id] || 'normal'
          }));
        setUsers(mappedUsers);

        // Synchronize selected user if modal is open - removed from here to prevent loop
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

      if (error) throw error;

      if (data) {
        const settings = data as unknown as { key: string; value: string | boolean }[];
        const maintenance = settings.find(s => s.key === 'maintenance_mode');
        const signups = settings.find(s => s.key === 'public_signups');

        // Handle both string and boolean values from database
        setMaintenanceMode(maintenance?.value === 'true' || maintenance?.value === true);
        setPublicSignups(signups?.value === 'true' || signups?.value === true);
      }
    } catch (error: unknown) {
      console.error('Error fetching system settings:', error);
      toast({
        title: "Error",
        description: "Failed to load system settings.",
        variant: "destructive",
      });
    }
  }, [toast]);

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

  const fetchDeletionRequests = useCallback(async () => {
    try {
      setDeletionRequestsLoading(true);
      const { data, error } = await (supabase as any)
        .from('account_deletion_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deletion requests:', error);
        return;
      }
      if (data) {
        setDeletionRequests(data as unknown as AccountDeletionRequest[]);
      }
    } catch (err) {
      console.error('Error fetching deletion requests:', err);
    } finally {
      setDeletionRequestsLoading(false);
    }
  }, []);

  const handleApproveDeletion = async () => {
    if (!requestToApprove) return;
    try {
      setIsProcessingAction(true);
      const { error } = await (supabase as any).rpc('admin_approve_and_delete_user', {
        p_request_id: requestToApprove.id,
        p_target_user_id: requestToApprove.user_id
      });

      if (error) throw error;

      toast({
        title: "Account Permanently Deleted",
        description: `Account for ${requestToApprove.user_email} and all data have been purged.`
      });

      setRequestToApprove(null);
      setApproveConfirmText('');
      await Promise.all([fetchDeletionRequests(), loadDashboardData(true)]);
    } catch (err: any) {
      console.error('Error approving deletion:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to purge account"
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRejectDeletion = async () => {
    if (!requestToReject) return;
    try {
      setIsProcessingAction(true);
      const { error } = await (supabase as any).rpc('admin_reject_deletion_request', {
        p_request_id: requestToReject.id,
        p_admin_notes: rejectionNotes.trim() || null
      });

      if (error) throw error;

      toast({
        title: "Deletion Request Declined",
        description: `Request for ${requestToReject.user_email} has been rejected.`
      });

      setRequestToReject(null);
      setRejectionNotes('');
      await fetchDeletionRequests();
    } catch (err: any) {
      console.error('Error rejecting deletion request:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to reject deletion request"
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const loadDashboardData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    await Promise.all([
      fetchUsers(),
      fetchAuditLogs(),
      fetchSystemSettings(),
      fetchSystemStats(),
      fetchDeletionRequests()
    ]);
    if (!silent) setLoading(false);
  }, [fetchUsers, fetchAuditLogs, fetchSystemSettings, fetchSystemStats, fetchDeletionRequests]);

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadDashboardData();
    }
  }, [isAdminAuthenticated, loadDashboardData]);

  // Realtime subscription for account deletion requests
  useEffect(() => {
    if (!isAdminAuthenticated) return;

    const channel = supabase
      .channel('admin_deletion_requests_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_deletion_requests'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newReq = payload.new as AccountDeletionRequest;
            setDeletionRequests(prev => [newReq, ...prev.filter(r => r.id !== newReq.id)]);
            toast({
              title: "⚠️ New Deletion Request",
              description: `${newReq.user_email} requested account deletion: "${newReq.reason}"`,
              variant: "destructive"
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedReq = payload.new as AccountDeletionRequest;
            setDeletionRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string };
            setDeletionRequests(prev => prev.filter(r => r.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdminAuthenticated, toast]);

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
      let resetErr: any = null;
      try {
        const { error } = await (serviceRoleSupabase as any).auth.admin.updateUserById(
          resetPasswordId,
          { password: newPassword, email_confirm: true }
        );
        resetErr = error;
      } catch (e) {
        resetErr = e;
      }

      if (resetErr) {
        // Fallback to RPC if admin API throws
        const { error: rpcErr } = await (supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: unknown }> })
          .rpc('admin_reset_password', {
            target_user_id: resetPasswordId,
            new_password: newPassword
          });
        if (rpcErr) throw rpcErr;
      }

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
      const { error } = await (supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: unknown }> })
        .rpc('admin_extend_subscription', {
          target_user_id: extendUserId,
          days_to_add: parseInt(extensionDays)
        });

      if (error) throw error;

      toast({
        title: "Adjustment Success",
        description: `Protocol updated successfully for ${extendUserEmail}`,
      });

      setExtendUserId(null);
      // Small delay to ensure DB consistency before re-fetching
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
    let expiry: Date;

    if (expiresAt) {
      expiry = new Date(expiresAt);
    } else {
      return { status: 'Expired', color: 'bg-rose-100 text-rose-600 border-rose-200' };
    }

    const diff = expiry.getTime() - new Date().getTime();
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    // Dynamically calculate typeLabel based on daysLeft if the db planType is incorrect due to manual extension
    const typeLabel = (daysLeft > 300 || planType === 'yearly') ? 'Yearly' : 'Monthly';

    if (diff <= 0) {
      return { status: 'Expired', color: 'bg-rose-100 text-rose-600 border-rose-200' };
    }

    if (isPaid) {
      return { status: `Paid Plan - ${typeLabel}`, color: 'bg-blue-100 text-blue-600 border-blue-200' };
    }

    // Special case for the users who were manually extended (e.g. 1 year trials)
    if (daysLeft > 300) {
      return { status: `Free Trial - Yearly`, color: 'bg-emerald-100 text-emerald-600 border-emerald-200' };
    }

    if (daysLeft <= 7) {
      return { status: 'Expiring Soon', color: 'bg-amber-100 text-amber-600 border-amber-200' };
    }

    return { status: `Free Trial - ${typeLabel}`, color: 'bg-emerald-100 text-emerald-600 border-emerald-200' };
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

  const pendingDeletionCount = useMemo(() => {
    return deletionRequests.filter(r => r.status === 'pending').length;
  }, [deletionRequests]);

  const filteredDeletionRequests = useMemo(() => {
    return deletionRequests.filter((req) => {
      const matchesStatus = deletionStatusFilter === 'all' || req.status === deletionStatusFilter;
      const search = deletionSearch.toLowerCase().trim();
      const matchesSearch = !search ||
        req.user_email.toLowerCase().includes(search) ||
        (req.company_name && req.company_name.toLowerCase().includes(search)) ||
        req.reason.toLowerCase().includes(search) ||
        (req.feedback && req.feedback.toLowerCase().includes(search));
      return matchesStatus && matchesSearch;
    });
  }, [deletionRequests, deletionStatusFilter, deletionSearch]);


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

  const adminNavItems = [
    {
      id: 'overview',
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'users',
      label: 'Users & Businesses',
      icon: Users,
      badge: totalUsersCount > 0 ? totalUsersCount.toLocaleString('en-IN') : null,
      badgeColor: 'bg-primary/10 text-primary',
    },
    {
      id: 'deletion-requests',
      label: 'Deletion Requests',
      icon: Trash2,
      badge: pendingDeletionCount > 0 ? `${pendingDeletionCount}` : null,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
    },
    {
      id: 'system',
      label: 'System Settings',
      icon: ShieldCheck,
      badge: maintenanceMode ? 'Locked' : null,
      badgeColor: 'bg-amber-500/20 text-amber-600',
    },
  ];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Admin Header matching main website Header style */}
      <header className="bg-background border-b border-border px-4 md:px-6 py-2.5 md:py-3 shrink-0 z-40 backdrop-blur-md bg-background/95">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden flex items-center gap-1.5 font-bold text-xs h-9 px-2.5 border-border"
            >
              <Menu className="h-4 w-4" />
              <span>Menu</span>
            </Button>
            <BrandLogo size="md" asLink to="/admin/dashboard" />
            <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1.5 bg-primary/10 text-primary border-primary/20 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              <Shield className="w-3 h-3 text-primary" />
              Admin Console
            </Badge>
          </div>

          <div className="flex items-center space-x-2 md:space-x-3">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border z-50">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      Super Administrator
                    </p>
                    <p className="text-xs text-muted-foreground">admin@escrowbill.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveTab('overview')} className="cursor-pointer">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard Overview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('users')} className="cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  Users & Businesses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('system')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  System Security
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-rose-600 focus:text-rose-600 font-semibold cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout Admin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Body: Sidebar + Main Content Area */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Mobile Navigation Drawer */}
        <div
          className={cn(
            "lg:hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out",
            isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className={cn(
              "w-[280px] h-full bg-background border-r border-border shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col justify-between",
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between bg-muted/30 shrink-0">
              <div className="flex items-center gap-2">
                <BrandLogo size="md" />
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">Admin</Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-4 space-y-1 overflow-hidden">
              {adminNavItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                    activeTab === item.id
                      ? "bg-secondary text-primary font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("w-4 h-4", activeTab === item.id ? "text-primary" : "text-muted-foreground")} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", item.badgeColor)}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-border bg-muted/10 shrink-0 mt-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Sidebar matching main website Navigation style */}
        <aside className="hidden lg:flex w-64 bg-background border-r border-border flex-col justify-between shrink-0 h-full overflow-hidden select-none">
          {/* Desktop Navigation Items */}
          <div className="p-3">
            <nav className="space-y-1">
              {adminNavItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                    activeTab === item.id
                      ? "bg-secondary text-primary font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("w-4 h-4", activeTab === item.id ? "text-primary" : "text-muted-foreground")} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", item.badgeColor)}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Desktop Sidebar Footer - Fixed at the very bottom/last */}
          <div className="p-4 border-t border-border bg-muted/10 shrink-0 mt-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col relative bg-slate-50/50 dark:bg-slate-950 h-full overflow-y-auto">
          <div className="flex-1 p-4 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
            {/* Content Top Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                  {activeTab === 'overview' && 'Dashboard Overview'}
                  {activeTab === 'users' && 'Users & Businesses'}
                  {activeTab === 'deletion-requests' && 'Account Deletion Requests'}
                  {activeTab === 'system' && 'System Settings'}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {activeTab === 'overview' && 'Platform statistics, user growth, and subscription breakdown'}
                  {activeTab === 'users' && 'Manage registered businesses, user types, and billing tiers'}
                  {activeTab === 'deletion-requests' && 'Review user-requested account deletions and manage data'}
                  {activeTab === 'system' && 'Maintenance controls, signup access, and platform settings'}
                </p>
              </div>

              {/* Quick tab switcher pill bar */}
              <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/50 shrink-0 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap", activeTab === 'overview' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap", activeTab === 'users' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
                >
                  Users
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('deletion-requests')}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1", activeTab === 'deletion-requests' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
                >
                  Deletions
                  {pendingDeletionCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('system')}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap", activeTab === 'system' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
                >
                  System
                </button>
              </div>
            </div>

            {/* Global Key Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {[
                { label: 'Total Users', value: totalUsersCount, icon: <Users className="w-5 h-5 text-blue-500" />, bgColor: 'bg-blue-500/10' },
                { label: 'Active Users', value: totalActiveUsersCount, icon: <CheckCircle className="w-5 h-5 text-emerald-500" />, bgColor: 'bg-emerald-500/10' },
                { label: 'Total Invoices', value: totalInvoicesCount, icon: <FileText className="w-5 h-5 text-indigo-500" />, bgColor: 'bg-indigo-500/10' },
                { label: 'Total Clients', value: totalClientsCount, icon: <Users className="w-5 h-5 text-amber-500" />, bgColor: 'bg-amber-500/10' },
              ].map((stat, i) => (
                <Card key={i} className="relative overflow-hidden border shadow-sm transition-all bg-card">
                  <div className="p-3.5 sm:p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${stat.bgColor}`}>
                        {stat.icon}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground truncate">{stat.label}</p>
                      <p className="text-xl sm:text-2xl font-bold mt-1 text-foreground break-words leading-tight py-0.5">{stat.value.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    {stat.icon}
                  </div>
                </Card>
              ))}
            </div>

            {/* Account Deletion Requests Banner */}
            {pendingDeletionCount > 0 && (
              <div className="p-4 md:p-5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/80 dark:bg-rose-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-rose-950 dark:text-rose-100">
                      {pendingDeletionCount} Account Deletion Request{pendingDeletionCount > 1 ? 's' : ''} Pending
                    </h4>
                    <p className="text-xs text-rose-800/80 dark:text-rose-300/80 mt-0.5">
                      Business user{pendingDeletionCount > 1 ? 's have' : ' has'} requested account deletion.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setActiveTab('deletion-requests')}
                  className="font-semibold text-xs shrink-0 gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Review Requests
                </Button>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">


          <TabsContent value="overview" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border shadow-sm overflow-hidden bg-white dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-blue-500" />
                    User Growth
                  </CardTitle>
                  <CardDescription>Platform adoption over the last 14 days</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] w-full pt-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={3} fillOpacity={0.1} fill="#3B82F6" />
                      <Area type="monotone" dataKey="pro" stroke="#10B981" strokeWidth={3} fillOpacity={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border shadow-sm overflow-hidden bg-white dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center">
                    <PieChartIcon className="w-4 h-4 mr-2 text-emerald-500" />
                    Subscription Mix
                  </CardTitle>
                  <CardDescription>Distribution of Free vs Pro users</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] w-full pt-0 flex flex-col items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {planData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-6 mt-4">
                    {planData.map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{p.name}: {p.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'API Latency', value: '45ms', status: 'Optimal', icon: <Activity className="w-5 h-5 text-blue-500" /> },
                { label: 'DB Connections', value: '12/100', status: 'Healthy', icon: <Database className="w-5 h-5 text-emerald-500" /> },
                { label: 'CPU Usage', value: '8%', status: 'Normal', icon: <Cpu className="w-5 h-5 text-amber-500" /> },
              ].map((comp, i) => (
                <Card key={i} className="border-none shadow-sm bg-white dark:bg-slate-800/50">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        {comp.icon}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{comp.label}</p>
                        <p className="text-lg font-bold">{comp.value}</p>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">{comp.status}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6 outline-none">
            <Card className="border shadow-sm overflow-hidden bg-white dark:bg-slate-800">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 p-4 sm:p-6 gap-4">
                <div>
                  <CardTitle className="text-xl font-bold">User Directory</CardTitle>
                  <CardDescription>Manage profile access, business categorization, and billing for all platform users</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search users..."
                      className="pl-9 w-[220px] sm:w-[280px] h-9 rounded-xl bg-slate-50 dark:bg-slate-900 border-border text-xs"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => loadDashboardData(false)} variant="outline" size="icon" className="h-9 w-9 rounded-xl shrink-0" disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Mobile Card View (< 768px) */}
                <div className="md:hidden divide-y divide-border">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-xl" />
                          <div className="space-y-1 flex-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-44" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-full rounded-lg" />
                      </div>
                    ))
                  ) : users.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-bold">No users found matching "{searchTerm}"</p>
                    </div>
                  ) : (
                    users.map((user) => (
                      <div key={user.user_id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-sm text-primary shrink-0">
                              {user.company_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm truncate">{user.company_name || 'Individual Profile'}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 px-2 py-0.5 rounded-md font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                              #{generateAccountId(user.user_id)}
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(generateAccountId(user.user_id));
                                toast({ title: "Copied!", description: `Account ID #${generateAccountId(user.user_id)} copied.` });
                              }}
                              className="text-muted-foreground hover:text-foreground p-1"
                              title="Copy ID"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-border/50">
                          <div>
                            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Mobile</span>
                            <span className="font-semibold">{user.mobile || '—'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Joined</span>
                            <span className="font-semibold">{safelyToLocaleDate(user.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Select
                              value={user.user_type || 'normal'}
                              onValueChange={(val) => handleUpdateUserType(user.user_id, val as UserType)}
                            >
                              <SelectTrigger className="h-7 px-2 text-[11px] font-bold rounded-lg border w-fit">
                                <span className="flex items-center gap-1">
                                  <span>{user.user_type === 'automobile' ? '🚗 Auto' : user.user_type === 'food_kitchen' ? '🍛 Kitchen' : '📋 Normal'}</span>
                                </span>
                              </SelectTrigger>
                              <SelectContent align="start">
                                <SelectItem value="normal">📋 Normal</SelectItem>
                                <SelectItem value="automobile">🚗 Automobile</SelectItem>
                                <SelectItem value="food_kitchen">🍛 Food / Kitchen</SelectItem>
                              </SelectContent>
                            </Select>

                            {user.is_blocked ? (
                              <Badge variant="outline" className="text-[10px] font-bold bg-rose-50 text-rose-600 border-rose-200">Blocked</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border-emerald-200">Active</Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-lg text-blue-600 hover:bg-blue-50"
                              onClick={() => { setSelectedUser(user); setUserDetailsOpen(true); }}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-lg text-emerald-600 hover:bg-emerald-50"
                              onClick={() => { setExtendUserId(user.user_id); setExtendUserEmail(user.email); }}
                              title="Extend Plan"
                            >
                              <Clock className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleToggleWhatsappProvider(user.user_id, user.whatsapp_provider || 'meta')}>
                                  <WhatsAppIcon className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                                  <span>WhatsApp Mode</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setResetPasswordId(user.user_id); setResetPasswordEmail(user.email); setNewPassword(""); }}>
                                  <Key className="w-3.5 h-3.5 mr-2 text-amber-600" />
                                  <span>Reset Password</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setUserToToggleBlock(user)}>
                                  {user.is_blocked ? <CheckCircle className="w-3.5 h-3.5 mr-2 text-emerald-600" /> : <Shield className="w-3.5 h-3.5 mr-2 text-rose-600" />}
                                  <span>{user.is_blocked ? "Unblock Account" : "Block Account"}</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setUserToDelete(user); setDeleteConfirmText(""); setUserDeleteCheckbox1(false); setUserDeleteCheckbox2(false); }} className="text-rose-600 font-semibold">
                                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                                  <span>Purge Account</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop Table View (>= 768px) */}
                <div className="hidden md:block w-full overflow-x-hidden">
                  <Table className="w-full table-fixed">
                    <colgroup>
                      <col style={{ width: '140px' }} />
                      <col />
                      <col style={{ width: '145px' }} />
                      <col style={{ width: '120px' }} />
                      <col style={{ width: '160px' }} />
                      <col style={{ width: '125px' }} />
                    </colgroup>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="font-bold w-[140px] pl-4 pr-2">Account ID</TableHead>
                        <TableHead className="font-bold pl-4 pr-3">Business & User</TableHead>
                        <TableHead className="font-bold w-[145px] px-3 whitespace-nowrap">Contact & Joined</TableHead>
                        <TableHead className="font-bold w-[120px] px-2">Type</TableHead>
                        <TableHead className="font-bold w-[160px] px-3 whitespace-nowrap">Plan & Status</TableHead>
                        <TableHead className="text-right font-bold w-[125px] pr-4 pl-1">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={6} className="py-4">
                              <Skeleton className="h-10 w-full rounded-lg" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-20">
                              <div className="flex flex-col items-center">
                                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                                  <Search className="w-8 h-8 text-slate-400" />
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">No users found matching "{searchTerm}"</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user.user_id} className="group border-border transition-colors hover:bg-muted/40">
                              {/* Account ID */}
                              <TableCell className="py-3 pl-4 pr-2 w-[140px]">
                                <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 px-2 py-0.5 rounded-md w-fit font-mono shrink-0">
                                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                    #{generateAccountId(user.user_id)}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(generateAccountId(user.user_id));
                                      toast({
                                        title: "Copied!",
                                        description: `Account ID #${generateAccountId(user.user_id)} copied.`
                                      });
                                    }}
                                    className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors p-0.5"
                                    title="Copy Account ID"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </TableCell>

                              {/* Organization & Email */}
                              <TableCell className="py-3 pl-4 pr-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center font-bold text-xs text-blue-600 shrink-0">
                                    {user.company_name?.[0]?.toUpperCase() || 'U'}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-xs sm:text-sm text-foreground truncate" title={user.company_name || 'Individual Profile'}>
                                      {user.company_name || 'Individual Profile'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate" title={user.email}>
                                      {user.email}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Contact & Joined */}
                              <TableCell className="py-3 px-3 w-[145px]">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1 text-foreground text-xs font-semibold truncate">
                                    <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                                    <span className="truncate">{user.mobile || 'No mobile'}</span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground pl-4 truncate">
                                    {safelyToLocaleDate(user.created_at)}
                                  </p>
                                </div>
                              </TableCell>

                              {/* User Type Selector */}
                              <TableCell className="py-3 px-2 w-[120px]">
                                <Select
                                  value={user.user_type || 'normal'}
                                  onValueChange={(val) => handleUpdateUserType(user.user_id, val as UserType)}
                                >
                                  <SelectTrigger
                                    className={`h-8 px-2 rounded-lg border text-xs font-semibold w-full max-w-[115px] flex items-center justify-between transition-all ${
                                      user.user_type === 'automobile'
                                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-700 dark:text-amber-300'
                                        : user.user_type === 'food_kitchen'
                                        ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 text-purple-700 dark:text-purple-300'
                                        : 'bg-muted/40 border-border text-foreground'
                                    }`}
                                    title="Click to switch business category"
                                  >
                                    <span className="flex items-center gap-1.5 truncate">
                                      <span>{user.user_type === 'automobile' ? '🚗' : user.user_type === 'food_kitchen' ? '🍛' : '📋'}</span>
                                      <span className="truncate">{user.user_type === 'automobile' ? 'Auto' : user.user_type === 'food_kitchen' ? 'Kitchen' : 'Normal'}</span>
                                    </span>
                                  </SelectTrigger>
                                  <SelectContent align="start" className="rounded-xl">
                                    <SelectItem value="normal">
                                      <span className="flex items-center gap-2">📋 <span>Normal</span></span>
                                    </SelectItem>
                                    <SelectItem value="automobile">
                                      <span className="flex items-center gap-2">🚗 <span>Automobile</span></span>
                                    </SelectItem>
                                    <SelectItem value="food_kitchen">
                                      <span className="flex items-center gap-2">🍛 <span>Food / Cloud Kitchen</span></span>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>

                              {/* Plan & Status */}
                              <TableCell className="py-3 px-3 w-[160px]">
                                <div className="flex flex-col gap-1 w-fit">
                                  {(() => {
                                    const sub = getSubscriptionStatus(user.subscription_expires_at, user.plan_type, user.is_paid, user.created_at);
                                    return (
                                      <Badge className={`rounded-full shadow-none text-[10px] font-bold px-2 py-0.5 whitespace-nowrap w-fit ${sub.color}`}>
                                        {sub.status}
                                      </Badge>
                                    );
                                  })()}
                                  {user.is_blocked ? (
                                    <Badge variant="outline" className="rounded-full text-[10px] font-bold px-2 py-0 bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 w-fit">
                                      Blocked
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="rounded-full text-[10px] font-bold px-2 py-0 bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 w-fit">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>

                              {/* Actions */}
                              <TableCell className="text-right pr-4 pl-1 py-3 w-[125px]">
                                <div className="flex items-center justify-end gap-1.5 w-full ml-auto">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 shrink-0"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setUserDetailsOpen(true);
                                    }}
                                    title="User Details & Activity Analysis"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 shrink-0"
                                    title="Extend Access Plan"
                                    onClick={() => {
                                      setExtendUserId(user.user_id);
                                      setExtendUserEmail(user.email);
                                    }}
                                  >
                                    <Clock className="w-4 h-4" />
                                  </Button>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                                        title="Account Operations"
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52 rounded-xl z-50">
                                      <DropdownMenuItem
                                        onClick={() => handleToggleWhatsappProvider(user.user_id, user.whatsapp_provider || 'meta')}
                                        className="cursor-pointer text-xs flex items-center justify-between"
                                      >
                                        <span className="flex items-center gap-2">
                                          <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>WhatsApp Mode</span>
                                        </span>
                                        <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0">
                                          {user.whatsapp_provider === 'personal' ? 'wa.me' : 'API'}
                                        </Badge>
                                      </DropdownMenuItem>

                                      <DropdownMenuItem
                                        onClick={() => {
                                          setResetPasswordId(user.user_id);
                                          setResetPasswordEmail(user.email);
                                          setNewPassword("");
                                        }}
                                        className="cursor-pointer text-xs flex items-center gap-2"
                                      >
                                        <Key className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Reset Password</span>
                                      </DropdownMenuItem>

                                      <DropdownMenuItem
                                        onClick={() => setUserToToggleBlock(user)}
                                        className="cursor-pointer text-xs flex items-center gap-2"
                                      >
                                        {user.is_blocked ? (
                                          <>
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Unblock Account</span>
                                          </>
                                        ) : (
                                          <>
                                            <Shield className="w-3.5 h-3.5 text-rose-600" />
                                            <span>Block Account</span>
                                          </>
                                        )}
                                      </DropdownMenuItem>

                                      <DropdownMenuSeparator />

                                      <DropdownMenuItem
                                        onClick={() => {
                                          setUserToDelete(user);
                                          setDeleteConfirmText("");
                                          setUserDeleteCheckbox1(false);
                                          setUserDeleteCheckbox2(false);
                                        }}
                                        className="cursor-pointer text-xs flex items-center gap-2 text-rose-600 focus:text-rose-600 font-semibold"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Purge Account</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Show {userRangeStart}-{userRangeEnd} of {totalUsersCount} users
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Rows</span>
                      <Select value={String(usersPageSize)} onValueChange={(value) => setUsersPageSize(Number(value))}>
                        <SelectTrigger className="h-9 w-[86px] rounded-xl border-slate-200 font-bold dark:border-slate-700">
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
          </TabsContent>


          <TabsContent value="system" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-md bg-white dark:bg-slate-800/50 backdrop-blur-md dark:bg-slate-800/50 h-fit">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center">
                      <History className="w-4 h-4 mr-2" />
                      Platform Audit Logs
                    </CardTitle>
                    <CardDescription>Real-time security events tracking</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {auditLogs.length > 0 ? (
                        auditLogs.map((log) => (
                          <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <div className={`p-2 rounded-lg ${log.action.includes('Blocked') ? 'bg-rose-100' : 'bg-blue-100'}`}>
                              <Shield className={`w-4 h-4 ${log.action.includes('Blocked') ? 'text-rose-600' : 'text-blue-600'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <p className="text-sm font-bold">{log.action}</p>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{log.time}</span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400">Target: {log.target}</p>
                              <p className="text-[10px] text-slate-400 mt-1 italic">Initiated by: {log.admin}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No recent platform activity recorded</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-800">
                  <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-lg font-bold flex items-center">
                      <Settings className="w-4 h-4 mr-2 text-primary" />
                      Platform Guards
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold">Maintenance Mode</p>
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
                        <p className="text-sm font-bold">Public Signups</p>
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

                <Card className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden relative border border-slate-100 dark:border-slate-800">
                  <CardHeader className="bg-blue-600/5 dark:bg-blue-600/10 border-b border-blue-50 dark:border-blue-900/20">
                    <CardTitle className="text-lg font-bold flex items-center text-blue-600 dark:text-blue-400">
                      <Megaphone className="w-4 h-4 mr-2" />
                      Platform Broadcast
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10 pt-6">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">Send a notice to all logged-in users instantly.</p>
                    <Input
                      placeholder="Enter notice text..."
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 h-10 mb-3 focus-visible:ring-blue-600 focus-visible:ring-1"
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                    />
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold"
                      onClick={handlePublishBroadcast}
                      disabled={isPublishingBroadcast}
                    >
                      {isPublishingBroadcast ? 'Publishing...' : 'Publish Announcement'}
                    </Button>
                  </CardContent>
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                    <Megaphone className="w-24 h-24" />
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="deletion-requests" className="space-y-6 outline-none">
            {/* Header Card */}
            <Card className="border shadow-sm bg-white dark:bg-slate-800">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-950 dark:text-slate-100">
                        <span>Account Deletion & Data Wipeout Requests</span>
                        {pendingDeletionCount > 0 && (
                          <Badge variant="destructive" className="font-bold text-[10px]">
                            {pendingDeletionCount} Pending
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Review, approve permanent data erasure, or decline business account deletion requests
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchDeletionRequests()}
                    disabled={deletionRequestsLoading}
                    className="h-9 gap-1.5 font-bold text-xs"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", deletionRequestsLoading && "animate-spin")} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Search & Status Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by email, company name, or reason..."
                      value={deletionSearch}
                      onChange={(e) => setDeletionSearch(e.target.value)}
                      className="pl-9 h-10 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {(['all', 'pending', 'approved', 'rejected', 'cancelled'] as const).map((status) => {
                      const count = status === 'all' 
                        ? deletionRequests.length 
                        : deletionRequests.filter(r => r.status === status).length;
                      return (
                        <Button
                          key={status}
                          type="button"
                          variant={deletionStatusFilter === status ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDeletionStatusFilter(status)}
                          className={cn(
                            "h-8 text-xs font-bold capitalize transition-all",
                            deletionStatusFilter === status && status === 'pending' && "bg-amber-600 hover:bg-amber-700 text-white",
                            deletionStatusFilter === status && status === 'approved' && "bg-emerald-600 hover:bg-emerald-700 text-white",
                            deletionStatusFilter === status && status === 'rejected' && "bg-rose-600 hover:bg-rose-700 text-white"
                          )}
                        >
                          {status} ({count})
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Requests Table */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80">
                      <TableRow>
                        <TableHead className="text-xs font-bold uppercase tracking-wider py-3.5">User / Business</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider py-3.5">Reason & Feedback</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider py-3.5">Requested Date</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider py-3.5">Status</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider py-3.5 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDeletionRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ShieldCheck className="w-8 h-8 text-slate-400" />
                              <p className="text-sm font-semibold">No deletion requests found</p>
                              <p className="text-xs text-slate-400">
                                {deletionSearch ? "No requests match your search criteria." : "There are currently no deletion requests in this category."}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDeletionRequests.map((req) => (
                          <TableRow key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                            <TableCell className="py-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-slate-900 dark:text-white">{req.user_email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                  <span>{req.company_name || 'Individual Profile'}</span>
                                  <span>•</span>
                                  <span className="font-mono font-semibold text-primary">#{generateAccountId(req.user_id)}</span>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="py-3 max-w-xs">
                              <div className="space-y-1">
                                <div className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                  {req.reason}
                                </div>
                                {req.feedback && (
                                  <p className="text-xs text-slate-500 italic line-clamp-2">
                                    "{req.feedback}"
                                  </p>
                                )}
                                {req.admin_notes && (
                                  <div className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded border border-rose-200 dark:border-rose-900/50">
                                    <strong>Admin Note:</strong> {req.admin_notes}
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="py-3">
                              <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                                <p className="font-medium">{safelyToLocaleDate(req.created_at)}</p>
                                <p className="text-[10px] text-slate-400">{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </TableCell>

                            <TableCell className="py-3">
                              {req.status === 'pending' && (
                                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold text-[10px] uppercase">
                                  Pending Review
                                </Badge>
                              )}
                              {req.status === 'approved' && (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold text-[10px] uppercase">
                                  Purged / Deleted
                                </Badge>
                              )}
                              {req.status === 'rejected' && (
                                <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold text-[10px] uppercase">
                                  Declined
                                </Badge>
                              )}
                              {req.status === 'cancelled' && (
                                <Badge variant="outline" className="text-slate-500 font-bold text-[10px] uppercase">
                                  User Cancelled
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="py-3 text-right">
                              {req.status === 'pending' ? (
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setRequestToReject(req);
                                      setRejectionNotes('');
                                    }}
                                    className="h-8 text-xs font-bold border-slate-300 dark:border-slate-700"
                                  >
                                    Decline
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setRequestToApprove(req);
                                      setApproveConfirmText('');
                                    }}
                                    className="h-8 text-xs font-bold gap-1 shadow-sm"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Purge Account
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 italic">
                                  {req.processed_at ? `Resolved on ${safelyToLocaleDate(req.processed_at)}` : 'Closed'}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
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
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">7-Digit Account ID</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-black text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                        #{generateAccountId(selectedUser.user_id)}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(generateAccountId(selectedUser.user_id)); toast({ title: "Copied", description: "Account ID copied to clipboard" }); }}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">System UUID</p>
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
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Business / User Type</p>
                    <Select
                      value={selectedUserSetting?.user_type || selectedUser.user_type || 'normal'}
                      onValueChange={(val) => handleUpdateUserType(selectedUser.user_id, val as UserType)}
                    >
                      <SelectTrigger className="h-9 px-3 rounded-xl border text-xs font-bold w-full max-w-[220px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="start" className="rounded-xl">
                        <SelectItem value="normal">📋 Normal Business</SelectItem>
                        <SelectItem value="automobile">🚗 Automobile / Downpayment</SelectItem>
                        <SelectItem value="food_kitchen">🍛 Food / Cloud Kitchen</SelectItem>
                      </SelectContent>
                    </Select>
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
                      {selectedUser.subscription_expires_at ? 'Paid Plan' : `Free Plan (${selectedUser.plan_type ? (selectedUser.plan_type.charAt(0).toUpperCase() + selectedUser.plan_type.slice(1)) : 'Monthly'})`}
                      <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                    </p>
                    <p className="text-xs text-slate-400 font-medium italic">
                      {selectedUser.subscription_expires_at
                        ? `Valid through ${safelyToLocaleDate(selectedUser.subscription_expires_at)}`
                        : "No active plan detected (grant access from Extend Plan)"}
                    </p>
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-4 h-4 text-primary animate-spin-slow" />
                      <p className="text-xs font-bold text-slate-300">Countdown to Inactivation:</p>
                    </div>
                    <p className="text-xl font-black text-primary font-mono tabular-nums leading-none">
                      {getSubscriptionCountdown(selectedUser.subscription_expires_at)}
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

      {/* Block / Unblock User Confirmation Dialog */}
      <AlertDialog open={!!userToToggleBlock} onOpenChange={(open) => !open && setUserToToggleBlock(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-2xl flex items-center gap-2">
              {userToToggleBlock?.is_blocked ? (
                <>
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                  <span>Unblock User Account?</span>
                </>
              ) : (
                <>
                  <Shield className="w-6 h-6 text-rose-600" />
                  <span>Block User Account?</span>
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400 pt-2">
              {userToToggleBlock?.is_blocked
                ? `Restoring dashboard access for ${userToToggleBlock.company_name || userToToggleBlock.email}. They will be able to log in immediately.`
                : `Temporarily suspending access for ${userToToggleBlock?.company_name || userToToggleBlock?.email}. They will be logged out and cannot sign in until unblocked.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToToggleBlock) {
                  toggleBlockUser(userToToggleBlock.user_id);
                  setUserToToggleBlock(null);
                }
              }}
              className={cn("rounded-xl font-bold", userToToggleBlock?.is_blocked ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white')}
            >
              {userToToggleBlock?.is_blocked ? 'Confirm Unblock' : 'Restrict Access'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Deletion Modal */}
      <Dialog open={!!requestToApprove} onOpenChange={(open) => !open && setRequestToApprove(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-border bg-card shadow-2xl">
          <div className="bg-rose-50 dark:bg-rose-950/40 p-5 border-b border-rose-200 dark:border-rose-900/50 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-rose-950 dark:text-rose-100">
                Confirm Permanent Account Purge
              </DialogTitle>
              <DialogDescription className="text-xs text-rose-800/80 dark:text-rose-300/80 mt-1">
                This operation will irreversibly wipe out the user and cascade across all databases.
              </DialogDescription>
            </div>
          </div>

          {requestToApprove && (
            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-1.5">
                <p><strong>User Email:</strong> {requestToApprove.user_email}</p>
                <p><strong>Business Name:</strong> {requestToApprove.company_name || 'Individual Profile'}</p>
                <p><strong>Account ID:</strong> #{generateAccountId(requestToApprove.user_id)}</p>
                <p><strong>Reason:</strong> {requestToApprove.reason}</p>
                {requestToApprove.feedback && (
                  <p><strong>Feedback:</strong> {requestToApprove.feedback}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-purge-confirm" className="text-xs font-semibold text-foreground">
                  Type <span className="font-black text-rose-600">DELETE</span> to authorize permanent purge:
                </Label>
                <Input
                  id="admin-purge-confirm"
                  value={approveConfirmText}
                  onChange={(e) => setApproveConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="h-10 text-xs font-mono font-bold uppercase tracking-wider text-center"
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRequestToApprove(null)}
                  disabled={isProcessingAction}
                  className="h-10 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isProcessingAction || approveConfirmText.trim().toUpperCase() !== 'DELETE'}
                  onClick={handleApproveDeletion}
                  className="h-10 text-xs font-bold uppercase tracking-wider gap-2 shadow-sm"
                >
                  {isProcessingAction ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Purging Data...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Approve & Delete User
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Decline Deletion Modal */}
      <Dialog open={!!requestToReject} onOpenChange={(open) => !open && setRequestToReject(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-border bg-card shadow-2xl">
          <div className="bg-slate-50 dark:bg-slate-900 p-5 border-b border-border flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                Decline Account Deletion Request
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Provide an explanation for the user on why this deletion request cannot be executed at this time.
              </DialogDescription>
            </div>
          </div>

          {requestToReject && (
            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
                <p><strong>User:</strong> {requestToReject.user_email}</p>
                <p><strong>Reason:</strong> {requestToReject.reason}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-rejection-notes" className="text-xs font-semibold text-foreground">
                  Reason for Declining (Sent to User) *
                </Label>
                <Textarea
                  id="admin-rejection-notes"
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="e.g. Please clear open invoices first, or contact support regarding license verification..."
                  className="min-h-[85px] text-xs resize-y"
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRequestToReject(null)}
                  disabled={isProcessingAction}
                  className="h-10 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={isProcessingAction || !rejectionNotes.trim()}
                  onClick={handleRejectDeletion}
                  className="h-10 text-xs font-bold uppercase tracking-wider gap-2 shadow-sm"
                >
                  {isProcessingAction ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Decline & Notify User"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

};

export default AdminDashboard;
