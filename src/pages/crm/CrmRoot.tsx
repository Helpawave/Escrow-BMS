import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { Leads } from './Leads';
import { Contacts } from './Contacts';
import { Tasks } from './Tasks';
import { Analytics } from './Analytics';
import { Settings } from './Settings';
import { Team } from './Team';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  LayoutDashboard,
  Users,
  Contact,
  KanbanSquare,
  BarChart3,
  Settings as SettingsIcon,
  Search,
  UserCog,
} from 'lucide-react';

export default function CrmRoot() {
  const { userPermissions, userRole, activities } = useCrm();
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract view from path e.g. /crm/tasks -> 'tasks'
  const segments = location.pathname.split('/').filter(Boolean);
  const currentView = segments[1] || 'tasks';
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Clear search query when switching views
  useEffect(() => {
    setGlobalSearch('');
  }, [currentView]);

  const handleViewChange = (view: string) => {
    if (view === 'tasks') {
      navigate('/crm/tasks');
    } else {
      navigate(`/crm/${view}`);
    }
  };

  const menuItems = [
    { name: 'Task Board', icon: <KanbanSquare className="w-4 h-4" />, view: 'tasks' },
    { name: 'Leads', icon: <Users className="w-4 h-4" />, view: 'leads' },
    { name: 'Contacts', icon: <Contact className="w-4 h-4" />, view: 'contacts' },
    { name: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, view: 'dashboard' },
    { name: 'Analytics', icon: <BarChart3 className="w-4 h-4" />, view: 'analytics' },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.view === 'leads' || item.view === 'contacts') {
      return userPermissions?.viewLeads ?? true;
    }
    if (item.view === 'tasks') {
      return userPermissions?.viewTasks ?? true;
    }
    if (item.view === 'analytics') {
      return userPermissions?.viewAnalytics ?? true;
    }
    return true;
  });

  const renderView = () => {
    switch (currentView) {
      case 'tasks':
        return <Tasks globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} />;
      case 'leads':
        return <Leads globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} />;
      case 'contacts':
        return <Contacts globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} />;
      case 'dashboard':
        return <Dashboard onNavigate={(v) => handleViewChange(v)} globalSearch={globalSearch} />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Tasks globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} />;
    }
  };

  const getSearchPlaceholder = () => {
    switch (currentView) {
      case 'dashboard': return 'Search metrics & tasks...';
      case 'leads': return 'Search leads...';
      case 'contacts': return 'Search contacts...';
      case 'tasks': return 'Search task board...';
      default: return 'Search CRM...';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Horizontal Navigation Tab Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 gap-4">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            {filteredMenuItems.map((item) => (
              <button
                key={item.view}
                onClick={() => handleViewChange(item.view)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                  currentView === item.view
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200'
                }`}
              >
                {item.icon}
                {item.name}
              </button>
            ))}
          </div>

          {/* Contextual Search */}
          {['dashboard', 'leads', 'contacts', 'tasks'].includes(currentView) && (
            <div className="relative w-full sm:w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-brand-500 transition-all shadow-sm"
              />
            </div>
          )}
        </div>

        {/* View Content */}
        <div className="min-h-[60vh]">{renderView()}</div>
      </div>
    </AppLayout>
  );
}
