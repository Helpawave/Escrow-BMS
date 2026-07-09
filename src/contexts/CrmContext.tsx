/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

// ── TypeScript Interfaces ──────────────────────────────────────
export interface Lead {
  id: string;
  name: string;
  company: string;
  value: number;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  priority: 'low' | 'medium' | 'high';
  createdDate: string;
}

export interface Task {
  id: string;
  title: string;
  desc: string;
  status: 'todo' | 'progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  leadId: string;
  dueDate: string;
}

export interface ActivityLog {
  id: string;
  text: string;
  time: string;
  type: 'lead' | 'task' | 'deal';
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  value: number;
  createdDate: string;
}

export interface ToastInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface UserPermissions {
  viewLeads: boolean;
  manageLeads: boolean;
  viewTasks: boolean;
  manageTasks: boolean;
  viewAnalytics: boolean;
  manageSettings: boolean;
}

export interface TeamMember {
  id: string;
  ownerId: string;
  email: string;
  name: string;
  role: string;
  permissions: UserPermissions;
}

interface CrmContextType {
  leads: Lead[];
  contacts: Contact[];
  tasks: Task[];
  activities: ActivityLog[];
  teamMembers: TeamMember[];
  workspaceOwnerId: string;
  userRole: string;
  userPermissions: UserPermissions;
  theme: 'light' | 'dark';
  toast: ToastInfo | null;
  addLead: (lead: Omit<Lead, 'id' | 'createdDate'>) => Promise<void>;
  updateLead: (id: string, lead: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addTeamMember: (member: Omit<TeamMember, 'id' | 'ownerId'>) => Promise<void>;
  deleteTeamMember: (id: string) => Promise<void>;
  resetDatabase: () => Promise<void>;
  clearActivities: () => Promise<void>;
  toggleTheme: () => void;
  triggerToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  logActivity: (text: string, type?: 'lead' | 'task' | 'deal') => Promise<void>;
}

const defaultPermissions: UserPermissions = {
  viewLeads: true, manageLeads: true, viewTasks: true,
  manageTasks: true, viewAnalytics: true, manageSettings: true,
};

const CrmContext = createContext<CrmContextType | undefined>(undefined);

// ── Helper to map DB row → Lead ──────────────────────────────
function rowToLead(row: any): Lead {
  return {
    id: row.id,
    name: row.name,
    company: row.company || '',
    value: Number(row.value || 0),
    email: row.email || '',
    phone: row.phone || '',
    status: row.status || 'new',
    priority: row.priority || 'medium',
    createdDate: row.created_date || row.created_at?.split('T')[0] || '',
  };
}

function rowToTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    desc: row.desc_text || '',
    status: row.status || 'todo',
    priority: row.priority || 'medium',
    leadId: row.lead_id || '',
    dueDate: row.due_date || '',
  };
}

function rowToActivity(row: any): ActivityLog {
  return {
    id: row.id,
    text: row.text,
    time: new Date(row.created_at).toLocaleString(),
    type: row.type || 'lead',
  };
}

function rowToTeamMember(row: any): TeamMember {
  return {
    id: row.id,
    ownerId: row.owner_id,
    email: row.email,
    name: row.name,
    role: row.role,
    permissions: row.permissions || defaultPermissions,
  };
}

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [workspaceOwnerId, setWorkspaceOwnerId] = useState<string>('');
  const [userRole] = useState<string>('owner');
  const [userPermissions] = useState<UserPermissions>(defaultPermissions);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [toast, setToast] = useState<ToastInfo | null>(null);

  const triggerToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  // Load theme from localStorage (UI preference only)
  useEffect(() => {
    const storedTheme = localStorage.getItem('apex_react_theme') as 'light' | 'dark';
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.setAttribute('data-theme', storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    }
  }, []);

  // Load CRM data from Supabase when user changes
  useEffect(() => {
    if (!user) {
      setLeads([]); setTasks([]); setActivities([]); setTeamMembers([]); setWorkspaceOwnerId('');
      return;
    }
    setWorkspaceOwnerId(user.id);
    loadAllData(user.id);
  }, [user]);

  const loadAllData = async (uid: string) => {
    const [leadsRes, tasksRes, actsRes, teamRes] = await Promise.all([
      supabase.from('leads').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('activities').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(20),
      supabase.from('team').select('*').eq('owner_id', uid),
    ]);

    setLeads((leadsRes.data || []).map(rowToLead));
    setTasks((tasksRes.data || []).map(rowToTask));
    setActivities((actsRes.data || []).map(rowToActivity));
    setTeamMembers((teamRes.data || []).map(rowToTeamMember));
  };

  // Contacts derived from won leads
  const contacts: Contact[] = React.useMemo(() => {
    const unique: Record<string, Contact> = {};
    leads.filter((l) => l.status === 'won').forEach((l) => {
      const key = (l.email || '').trim().toLowerCase() || l.id;
      if (!unique[key]) {
        unique[key] = { id: l.id, name: l.name, email: l.email, phone: l.phone, company: l.company, value: l.value, createdDate: l.createdDate };
      } else {
        unique[key].value += l.value;
      }
    });
    return Object.values(unique);
  }, [leads]);

  const logActivity = useCallback(async (text: string, type: 'lead' | 'task' | 'deal' = 'lead') => {
    if (!user) return;
    const { data } = await supabase
      .from('activities')
      .insert({ id: `act-${Date.now()}`, user_id: user.id, text, time: 'Just now', type })
      .select()
      .single();
    if (data) {
      setActivities((prev) => [rowToActivity(data), ...prev].slice(0, 20));
    }
  }, [user]);

  // ── Lead CRUD ──────────────────────────────────────────────
  const addLead = async (data: Omit<Lead, 'id' | 'createdDate'>) => {
    if (!user) return;
    const { data: row, error } = await supabase
      .from('leads')
      .insert({ ...data, id: `lead-${Date.now()}`, user_id: user.id, created_date: new Date().toISOString().split('T')[0] })
      .select().single();
    if (error) { triggerToast('Error creating lead.', 'error'); return; }
    setLeads((prev) => [rowToLead(row), ...prev]);
    await logActivity(`Created Lead: ${data.name} (${data.company})`, 'lead');
    triggerToast('Lead created successfully.', 'success');
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    if (!user) return;
    const dbUpdates: any = { ...updates };
    if (updates.createdDate) { dbUpdates.created_date = updates.createdDate; delete dbUpdates.createdDate; }
    const { data: row, error } = await supabase
      .from('leads').update(dbUpdates).eq('id', id).eq('user_id', user.id).select().single();
    if (error) { triggerToast('Error updating lead.', 'error'); return; }
    setLeads((prev) => prev.map((l) => l.id === id ? rowToLead(row) : l));
    triggerToast('Lead updated.', 'success');
  };

  const deleteLead = async (id: string) => {
    if (!user) return;
    const target = leads.find((l) => l.id === id);
    await supabase.from('leads').delete().eq('id', id).eq('user_id', user.id);
    setLeads((prev) => prev.filter((l) => l.id !== id));
    if (target) await logActivity(`Deleted Lead: ${target.name}`, 'lead');
    triggerToast('Lead deleted.', 'info');
  };

  // ── Task CRUD ──────────────────────────────────────────────
  const addTask = async (data: Omit<Task, 'id'>) => {
    if (!user) return;
    const { data: row, error } = await supabase
      .from('tasks')
      .insert({ ...data, id: `task-${Date.now()}`, user_id: user.id, desc_text: data.desc, lead_id: data.leadId, due_date: data.dueDate })
      .select().single();
    if (error) { triggerToast('Error creating task.', 'error'); return; }
    setTasks((prev) => [rowToTask(row), ...prev]);
    await logActivity(`Created Task: "${data.title}"`, 'task');
    triggerToast('Task created successfully.', 'success');
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) return;
    const dbUpdates: any = { ...updates };
    if (updates.desc !== undefined) { dbUpdates.desc_text = updates.desc; delete dbUpdates.desc; }
    if (updates.leadId !== undefined) { dbUpdates.lead_id = updates.leadId; delete dbUpdates.leadId; }
    if (updates.dueDate !== undefined) { dbUpdates.due_date = updates.dueDate; delete dbUpdates.dueDate; }
    const { data: row, error } = await supabase
      .from('tasks').update(dbUpdates).eq('id', id).eq('user_id', user.id).select().single();
    if (error) { triggerToast('Error updating task.', 'error'); return; }
    setTasks((prev) => prev.map((t) => t.id === id ? rowToTask(row) : t));
    triggerToast('Task updated.', 'success');
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    const target = tasks.find((t) => t.id === id);
    await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (target) await logActivity(`Deleted Task: "${target.title}"`, 'task');
    triggerToast('Task deleted.', 'info');
  };

  // ── Team CRUD ──────────────────────────────────────────────
  const addTeamMember = async (data: Omit<TeamMember, 'id' | 'ownerId'>) => {
    if (!user) return;
    const { data: row, error } = await supabase
      .from('team')
      .insert({ ...data, id: `member-${Date.now()}`, owner_id: user.id })
      .select().single();
    if (error) { triggerToast('Error adding team member.', 'error'); return; }
    setTeamMembers((prev) => [...prev, rowToTeamMember(row)]);
    triggerToast('Team member added.', 'success');
  };

  const deleteTeamMember = async (id: string) => {
    if (!user) return;
    await supabase.from('team').delete().eq('id', id).eq('owner_id', user.id);
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    triggerToast('Team member removed.', 'info');
  };

  const resetDatabase = async () => {
    if (!user) return;
    await Promise.all([
      supabase.from('leads').delete().eq('user_id', user.id),
      supabase.from('tasks').delete().eq('user_id', user.id),
      supabase.from('activities').delete().eq('user_id', user.id),
    ]);
    setLeads([]); setTasks([]); setActivities([]);
    triggerToast('Database reset.', 'success');
  };

  const clearActivities = async () => {
    if (!user) return;
    await supabase.from('activities').delete().eq('user_id', user.id);
    setActivities([]);
    triggerToast('Activity feed cleared.', 'info');
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('apex_react_theme', next);
    document.documentElement.setAttribute('data-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    triggerToast(`Switched to ${next === 'light' ? 'Light' : 'Dark'} mode`, 'info');
  };

  return (
    <CrmContext.Provider value={{
      leads, contacts, tasks, activities, teamMembers, workspaceOwnerId, userRole, userPermissions, theme, toast,
      addLead, updateLead, deleteLead,
      addTask, updateTask, deleteTask,
      addTeamMember, deleteTeamMember,
      resetDatabase, clearActivities, toggleTheme, triggerToast, logActivity,
    }}>
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (!context) throw new Error('useCrm must be used inside a CrmProvider');
  return context;
};

export type { CrmContextType };
