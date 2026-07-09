import React from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { IndianRupee, UserPlus, Briefcase, TrendingUp, ArrowUpRight, CheckCircle2, Calendar, Trash2, User, Shield } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface DashboardProps {
  onNavigate: (view: string) => void;
  globalSearch?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, globalSearch = '' }) => {
  const { leads, tasks, activities, theme, clearActivities, userPermissions } = useCrm();
  const canViewLeads = userPermissions ? userPermissions.viewLeads : true;

  // Compute stats
  const wonLeads = leads.filter(l => l.status === 'won');
  const lostLeads = leads.filter(l => l.status === 'lost');
  const activeLeads = leads.filter(l => l.status !== 'won' && l.status !== 'lost');

  const totalRevenue = wonLeads.reduce((sum, l) => sum + l.value, 0);
  const activeLeadsCount = activeLeads.length;
  const dealsClosedCount = wonLeads.length;

  const totalClosed = dealsClosedCount + lostLeads.length;
  const conversionRate = totalClosed > 0 ? ((dealsClosedCount / totalClosed) * 100).toFixed(1) : '0.0';

  // Chart setup: Revenue
  const months = ['Mar', 'Apr', 'May', 'Jun'];
  const revenueData = [0, 0, 0, 0];
  leads.forEach(l => {
    if (l.status === 'won' && l.createdDate) {
      const dateObj = new Date(l.createdDate);
      if (!isNaN(dateObj.getTime())) {
        const month = dateObj.getMonth();
        if (month === 2) revenueData[0] += l.value; // Mar
        if (month === 3) revenueData[1] += l.value; // Apr
        if (month === 4) revenueData[2] += l.value; // May
        if (month === 5) revenueData[3] += l.value; // Jun
      }
    }
  });

  const isDark = theme === 'dark';
  const textColor = isDark ? '#9ca3af' : '#64748b';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0';

  const lineChartData = {
    labels: months,
    datasets: [{
      label: 'Revenue Closed',
      data: revenueData,
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.05)',
      fill: true,
      tension: 0.4,
      borderWidth: 2.5,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#2563eb'
    }]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: textColor } },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          callback: (value: any) => '₹' + (value >= 100000 ? (value / 100000).toFixed(1) + 'L' : value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value)
        }
      }
    }
  };

  // Chart Setup: Lead Stages
  const stageCounts = { new: 0, contacted: 0, qualified: 0, proposal: 0 };
  leads.forEach(l => {
    if (l.status === 'new') stageCounts.new++;
    if (l.status === 'contacted') stageCounts.contacted++;
    if (l.status === 'qualified') stageCounts.qualified++;
    if (l.status === 'proposal') stageCounts.proposal++;
  });

  const doughnutData = {
    labels: ['New', 'Contacted', 'Qualified', 'Proposal'],
    datasets: [{
      data: [stageCounts.new, stageCounts.contacted, stageCounts.qualified, stageCounts.proposal],
      backgroundColor: [
        '#2563eb', // Blue-600
        '#475569', // Slate-600
        '#94a3b8', // Slate-400
        '#60a5fa'  // Blue-400
      ],
      borderWidth: isDark ? 2 : 1,
      borderColor: isDark ? '#111827' : '#ffffff'
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { boxWidth: 12, padding: 12, color: textColor }
      }
    },
    cutout: '70%'
  };

  // High priority tasks
  const activeTasks = tasks.filter(t => t.status !== 'done');
  const filteredTasks = activeTasks.filter(t => {
    if (!globalSearch) return true;
    return t.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
           (t.desc || '').toLowerCase().includes(globalSearch.toLowerCase());
  });
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  filteredTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  const displayTasks = filteredTasks.slice(0, 4);

  const filteredActivities = activities.filter(act => {
    if (!globalSearch) return true;
    return act.text.toLowerCase().includes(globalSearch.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-extrabold font-heading text-slate-800 dark:text-slate-100 ${!canViewLeads ? 'blur-xs select-none' : ''}`}>
              {canViewLeads ? `₹${totalRevenue.toLocaleString('en-IN')}` : '₹9,99,99,999'}
            </span>
            {canViewLeads ? (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +12.5%
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-400">Locked</span>
            )}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Active Leads</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-extrabold font-heading text-slate-800 dark:text-slate-100 ${!canViewLeads ? 'blur-xs select-none' : ''}`}>
              {canViewLeads ? activeLeadsCount : '99'}
            </span>
            {canViewLeads ? (
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +8.2%
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-400">Locked</span>
            )}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Deals Closed</span>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-extrabold font-heading text-slate-800 dark:text-slate-100 ${!canViewLeads ? 'blur-xs select-none' : ''}`}>
              {canViewLeads ? dealsClosedCount : '99'}
            </span>
            {canViewLeads ? (
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +15.3%
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-400">Locked</span>
            )}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Conversion Rate</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-extrabold font-heading text-slate-800 dark:text-slate-100 ${!canViewLeads ? 'blur-xs select-none' : ''}`}>
              {canViewLeads ? `${conversionRate}%` : '99.9%'}
            </span>
            {canViewLeads ? (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +2.4%
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-400">Locked</span>
            )}
          </div>
        </div>
      </div>

      {/* Charts row */}
      {canViewLeads ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl p-6 lg:col-span-2 flex flex-col h-[380px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Revenue Performance</h3>
              <span className="text-xs text-slate-400">Monthly sales totals</span>
            </div>
            <div className="relative flex-grow h-[280px]">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 flex flex-col h-[380px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Lead Stages</h3>
              <span className="text-xs text-slate-400">Distribution stage</span>
            </div>
            <div className="relative flex-grow h-[280px]">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[200px] space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="font-bold text-slate-850 dark:text-slate-100 text-base">Sales Charts Restricted</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-normal">
              You do not have permission to view leads and revenue performance reports. Contact your administrator to adjust access.
            </p>
          </div>
        </div>
      )}

      {/* Subgrid: Activity & Priority Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Recent Activity</h3>
            <button
              onClick={clearActivities}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Clear Feed"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          </div>
          <div className="space-y-4 overflow-y-auto max-h-[250px] pr-2 flex-grow">
            {filteredActivities.length === 0 ? (
              <div className="text-center text-slate-400 py-12 text-sm">
                No matching activity logs.
              </div>
            ) : (
              filteredActivities.slice(0, 5).map(act => {
                const getIcon = () => {
                  switch (act.type) {
                    case 'deal': return <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />;
                    case 'task': return <Calendar className="w-4.5 h-4.5 text-amber-500" />;
                    case 'lead': return <User className="w-4.5 h-4.5 text-indigo-500" />;
                  }
                };
                const getBgClass = () => {
                  switch (act.type) {
                    case 'deal': return 'bg-emerald-500/10 dark:bg-emerald-500/20';
                    case 'task': return 'bg-amber-500/10 dark:bg-amber-500/20';
                    case 'lead': return 'bg-indigo-500/10 dark:bg-indigo-500/20';
                  }
                };

                return (
                  <div key={act.id} className="flex gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 last:border-none last:pb-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getBgClass()}`}>
                      {getIcon()}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-slate-700 dark:text-slate-200 leading-normal">{act.text}</span>
                      <span className="text-xs text-slate-400">{act.time}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Priority Tasks */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Priority Tasks</h3>
            <span className="text-xs font-semibold text-slate-400">Action Required</span>
          </div>
          <div className="space-y-4 overflow-y-auto max-h-[250px] pr-2 flex-grow">
            {displayTasks.length === 0 ? (
              <div className="text-center text-slate-400 py-12 text-sm">
                No active tasks. Good job!
              </div>
            ) : (
              displayTasks.map(task => {
                const linkedLead = leads.find(l => l.id === task.leadId);
                const refName = linkedLead ? `@ ${linkedLead.company}` : 'General';
                
                const getPriorityClass = () => {
                  switch (task.priority) {
                    case 'high': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
                    case 'medium': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
                    case 'low': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
                  }
                };

                return (
                  <div
                    key={task.id}
                    onClick={() => onNavigate('tasks')}
                    className="flex gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 last:border-none last:pb-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg p-1.5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex flex-col gap-0.5 flex-grow">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-normal">{task.title}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-extrabold ${getPriorityClass()}`}>
                          {task.priority}
                        </span>
                        <span>&bull;</span>
                        <span>Due {task.dueDate}</span>
                        <span>&bull;</span>
                        <span className="font-medium text-slate-500 dark:text-slate-300">{refName}</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
