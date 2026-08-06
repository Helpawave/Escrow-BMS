import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { syncUserAcrossAllModules, updateUserAcrossAllModules } from '@/utils/erpPosting';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Building2,
  Mail,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Loader2,
  UserPlus,
  X,
  Phone,
  FileText,
  MapPin,
  Edit3,
  Trash2,
  Save,
  Eye,
  CreditCard,
  Globe,
  Receipt
} from 'lucide-react';

interface SystemUser {
  id: string;
  full_name: string;
  email: string;
  company_name: string;
  role: string;
  created_at: string;
  phone?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  ledger_status?: string;
}

export default function UsersPage() {
  const { profile, user } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India'
  });

  // View Client Dossier Modal State
  const [viewingUser, setViewingUser] = useState<SystemUser | null>(null);

  const fetchUsers = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [profilesRes, clientsRes, partiesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).order('created_at', { ascending: false }),
        supabase.from('clients').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('parties').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      const userMap = new Map<string, SystemUser>();

      // 1. From Profiles
      (profilesRes.data || [])
        .filter((p: any) => p.email && !['user@company.com', 'owner@company.com'].includes(p.email))
        .forEach((p: any) => {
          const key = p.email.toLowerCase();
          userMap.set(key, {
            id: p.id,
            full_name: p.full_name || p.email?.split('@')[0] || 'Registered User',
            email: p.email,
            company_name: p.company_name || 'Registered Account',
            role: p.role || 'user',
            created_at: p.created_at ? p.created_at.substring(0, 10) : new Date().toISOString().substring(0, 10)
          });
        });

      // 2. From Clients (Escrow Billing)
      (clientsRes.data || []).forEach((c: any) => {
        const nameOrEmail = (c.email || c.name || `client-${c.id}`).toLowerCase();
        if (!userMap.has(nameOrEmail)) {
          userMap.set(nameOrEmail, {
            id: c.id,
            full_name: c.name || 'Billing Client',
            email: c.email || `${c.name?.toLowerCase().replace(/\s+/g, '')}@client.co`,
            company_name: c.company_name || c.name || 'Escrow Billing Client',
            role: 'client_party',
            phone: c.phone || '',
            gstin: c.gstin || '',
            address: c.address || '',
            city: c.city || '',
            state: c.state || '',
            postal_code: c.postal_code || '',
            country: c.country || 'India',
            created_at: c.created_at ? c.created_at.substring(0, 10) : new Date().toISOString().substring(0, 10)
          });
        }
      });

      // 3. From Parties (Ledgers)
      (partiesRes.data || []).forEach((party: any) => {
        const nameKey = (party.party_name || `party-${party.id}`).toLowerCase();
        if (!Array.from(userMap.values()).some(u => u.full_name.toLowerCase() === nameKey)) {
          userMap.set(nameKey, {
            id: party.id,
            full_name: party.party_name || 'Ledger Party',
            email: `${party.party_name?.toLowerCase().replace(/\s+/g, '')}@ledger.co`,
            company_name: 'Ledger Party Account',
            role: 'ledger_party',
            ledger_status: party.status === 'take' ? 'Receivable (Take)' : 'Payable (Give)',
            created_at: party.created_at ? party.created_at.substring(0, 10) : new Date().toISOString().substring(0, 10)
          });
        }
      });

      // 4. From Local Storage Universal Cache
      try {
        const saved = localStorage.getItem('synced_universal_users_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.forEach((u: any) => {
            const key = (u.email || u.full_name).toLowerCase();
            if (!userMap.has(key)) {
              userMap.set(key, u);
            }
          });
        }
      } catch (lsErr) {}

      setUsers(Array.from(userMap.values()));
    } catch (e) {
      console.warn('Error fetching users directory:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Please enter User / Client Name');
      return;
    }

    setSubmitting(true);
    try {
      await syncUserAcrossAllModules({
        name: form.name,
        email: form.email,
        phone: form.phone,
        companyName: form.companyName,
        gstin: form.gstin,
        address: form.address,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country
      });

      toast.success(`User ${form.name} created & synchronized across Escrow Billing, Account Ledger & CRM!`);
      
      setForm({ name: '', email: '', phone: '', companyName: '', gstin: '', address: '', city: '', state: '', postalCode: '', country: 'India' });
      setShowAddModal(false);
      await fetchUsers();
    } catch (err: any) {
      toast.error('Failed to create user', { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (u: SystemUser) => {
    setEditingUser(u);
    setEditForm({
      full_name: u.full_name || '',
      email: u.email || '',
      phone: u.phone || '',
      company_name: u.company_name || '',
      gstin: u.gstin || '',
      address: u.address || '',
      city: u.city || '',
      state: u.state || '',
      postal_code: u.postal_code || '',
      country: u.country || 'India'
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editForm.full_name.trim()) return;

    setEditSubmitting(true);
    try {
      await updateUserAcrossAllModules({
        id: editingUser.id,
        name: editForm.full_name,
        email: editForm.email,
        phone: editForm.phone,
        companyName: editForm.company_name,
        gstin: editForm.gstin,
        address: editForm.address,
        city: editForm.city,
        state: editForm.state,
        postalCode: editForm.postal_code,
        country: editForm.country
      });

      toast.success(`User "${editForm.full_name.trim()}" updated across all modules!`);
      setShowEditModal(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      toast.error('Failed to update user', { description: err.message });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteUser = async (u: SystemUser) => {
    if (!window.confirm(`Are you sure you want to remove user "${u.full_name}"?`)) return;

    try {
      const isUUID = (str?: string) => !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

      // Delete from clients table
      try {
        if (isUUID(u.id)) {
          await supabase.from('clients').delete().eq('id', u.id);
        } else if (u.email) {
          await supabase.from('clients').delete().eq('email', u.email);
        } else {
          await supabase.from('clients').delete().ilike('name', u.full_name);
        }
      } catch (cErr) {}

      // Delete from parties table
      try {
        if (isUUID(u.id)) {
          await supabase.from('parties').delete().eq('id', u.id);
        } else {
          await supabase.from('parties').delete().ilike('party_name', u.full_name);
        }
      } catch (pErr) {}

      // Remove from local cache
      try {
        const saved = localStorage.getItem('synced_universal_users_v1');
        if (saved) {
          let list = JSON.parse(saved);
          list = list.filter((item: any) => item.id !== u.id && item.email !== u.email && item.full_name !== u.full_name);
          localStorage.setItem('synced_universal_users_v1', JSON.stringify(list));
        }
      } catch (lsErr) {}

      toast.success(`User "${u.full_name}" removed from directory`);
      await fetchUsers();
    } catch (err: any) {
      toast.error('Failed to delete user', { description: err.message });
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (u.phone && u.phone.includes(search)) ||
    (u.gstin && u.gstin.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Banner - Blue / Cyan Styling */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="px-3 py-1 bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                Universal Accounts Directory
              </span>
              <h1 className="text-2xl font-black text-white mt-1">Platform Users & Clients Directory</h1>
              <p className="text-xs text-blue-100 mt-0.5">
                Full client details (Phone, Address, GSTIN, State, City & Ledger) synced across Escrow Billing, Ledgers, CRM and User Directory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>+ Add User / Client</span>
            </button>

            <button
              onClick={fetchUsers}
              className="px-3 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Refresh Directory Data"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Registered Accounts</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{users.length}</p>
            <p className="text-[11px] text-blue-600 font-semibold mt-1">Universal Synced Profiles</p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Companies</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {new Set(users.map(u => u.company_name)).size}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Verified Organizations</p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Editable & Synced</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">100% Active</p>
            <p className="text-[11px] text-slate-400 mt-1">Billing • Ledger • CRM Sync</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search registered user by name, email, phone, GSTIN or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Users Card Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span>Loading registered users from Supabase...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Registered Users Found</h3>
            <p className="text-xs text-slate-400">Click "+ Add User / Client" above to create and sync a new account across all modules.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.full_name}</h3>
                        <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400 inline" /> {user.email}
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold rounded-lg text-[10px] uppercase flex-shrink-0">
                      {user.role}
                    </span>
                  </div>

                  {/* Detailed Client Properties */}
                  <div className="space-y-1.5 pt-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="font-semibold truncate">{user.company_name}</span>
                    </div>

                    {user.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>{user.phone}</span>
                      </div>
                    )}

                    {user.gstin && (
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                        <Receipt className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>GSTIN: {user.gstin}</span>
                      </div>
                    )}

                    {(user.address || user.city || user.state) && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span className="truncate">
                          {[user.address, user.city, user.state].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Synced
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewingUser(user)}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1"
                      title="View full dossier"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>

                    <button
                      onClick={() => openEditModal(user)}
                      className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-bold rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1"
                      title="Edit user details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="p-1 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg transition-all cursor-pointer"
                      title="Delete user"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Client Dossier Modal */}
        {viewingUser && (
          <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                    {viewingUser.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{viewingUser.full_name}</h3>
                    <p className="text-xs text-slate-400">{viewingUser.company_name}</p>
                  </div>
                </div>

                <button
                  onClick={() => setViewingUser(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Account Type / Role</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 capitalize mt-0.5">{viewingUser.role}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Joined Date</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{viewingUser.created_at}</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <span className="text-slate-400 font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-500" /> Email Address
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{viewingUser.email || 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <span className="text-slate-400 font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-500" /> Phone Number
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{viewingUser.phone || 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <span className="text-slate-400 font-medium flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-indigo-500" /> GSTIN Number
                    </span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{viewingUser.gstin || 'Not Provided'}</span>
                  </div>

                  <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                    <span className="text-slate-400 font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-500" /> Billing / Business Address
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 pt-0.5">
                      {[viewingUser.address, viewingUser.city, viewingUser.state, viewingUser.postal_code, viewingUser.country].filter(Boolean).join(', ') || 'No address specified'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      const targetUser = viewingUser;
                      setViewingUser(null);
                      openEditModal(targetUser);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile Details</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Universal User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-xl">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Universal User / Client</h3>
                    <p className="text-[11px] text-slate-500">Auto-syncs all details to Escrow Billing, Ledgers, CRM & Users Directory</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name / Party Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="rahul@company.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      placeholder="Sharma Traders Ltd"
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      GSTIN Number
                    </label>
                    <input
                      type="text"
                      placeholder="07AAAAA0000A1Z5"
                      value={form.gstin}
                      onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    placeholder="Plot 42, Commercial Complex"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="New Delhi"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      placeholder="Delhi"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      placeholder="110001"
                      value={form.postalCode}
                      onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-[11px] text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-blue-600" />
                  <span>Auto-syncs all detailed fields to Escrow Billing, Account Ledger & CRM Leads!</span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    <span>Create & Sync Everywhere</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Universal User Modal */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-xl">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit User / Client Party</h3>
                    <p className="text-[11px] text-slate-500">Updates profile details across Escrow Billing, Ledger & CRM</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name / Party Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      value={editForm.company_name}
                      onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      GSTIN Number
                    </label>
                    <input
                      type="text"
                      value={editForm.gstin}
                      onChange={(e) => setEditForm({ ...editForm, gstin: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      value={editForm.postal_code}
                      onChange={(e) => setEditForm({ ...editForm, postal_code: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {editSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
  );
}

