import React from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export const Analytics: React.FC = () => {
  const { leads, theme } = useCrm();

  const wonLeads = leads.filter(l => l.status === 'won');
  const lostLeads = leads.filter(l => l.status === 'lost');

  const wonCount = wonLeads.length;
  const lostCount = lostLeads.length;
  const totalClosed = wonCount + lostCount;
  const winRatio = totalClosed > 0 ? ((wonCount / totalClosed) * 100).toFixed(1) : '0.0';

  const totalValue = leads.reduce((sum, l) => sum + l.value, 0);
  const avgDealValue = leads.length > 0 ? Math.round(totalValue / leads.length) : 0;

  // Chart setup
  const isDark = theme === 'dark';
  const textColor = isDark ? '#9ca3af' : '#64748b';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0';

  // Pie chart (Won vs Lost)
  const pieData = {
    labels: ['Deals Won', 'Deals Lost'],
    datasets: [{
      data: [wonCount, lostCount],
      backgroundColor: ['rgba(16, 185, 129, 0.85)', 'rgba(239, 68, 68, 0.85)'],
      borderWidth: isDark ? 2 : 1,
      borderColor: isDark ? '#111827' : '#ffffff'
    }]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { boxWidth: 12, padding: 16, color: textColor }
      }
    }
  };

  // Bar chart (Pipeline value by stage)
  const pipelineVal = { new: 0, contacted: 0, qualified: 0, proposal: 0 };
  leads.forEach(l => {
    if (l.status === 'new') pipelineVal.new += l.value;
    if (l.status === 'contacted') pipelineVal.contacted += l.value;
    if (l.status === 'qualified') pipelineVal.qualified += l.value;
    if (l.status === 'proposal') pipelineVal.proposal += l.value;
  });

  const barData = {
    labels: ['New', 'Contacted', 'Qualified', 'Proposal'],
    datasets: [{
      label: 'Pipeline Value (₹)',
      data: [pipelineVal.new, pipelineVal.contacted, pipelineVal.qualified, pipelineVal.proposal],
      backgroundColor: '#2563eb',
      borderRadius: 6,
      maxBarThickness: 40
    }]
  };

  const barOptions = {
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

  const getWinRatioBadge = () => {
    const ratio = parseFloat(winRatio);
    if (ratio >= 35) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">Excellent</span>;
    } else if (ratio >= 20) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200">On Track</span>;
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200">Needs Focus</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* View Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-slate-800 dark:text-slate-100">
          Analytics & Reports
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Perform sales metrics diagnostic analysis and check lead conversions
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6 flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Lead Conversion Ratios</h3>
            <span className="text-xs text-slate-400">Deals Won vs Lost</span>
          </div>
          <div className="relative flex-grow h-[280px]">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Active Pipeline values</h3>
            <span className="text-xs text-slate-400">Value aggregated (₹)</span>
          </div>
          <div className="relative flex-grow h-[280px]">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Statistics breakdown */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Lead Conversion Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Metric Category</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Target Value</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Current Performance</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                <td className="px-6 py-4.5 font-semibold text-slate-800 dark:text-slate-200">Avg Lead Cycle Time</td>
                <td className="px-6 py-4.5 text-slate-500 dark:text-slate-400">14 Days</td>
                <td className="px-6 py-4.5 font-bold text-slate-800 dark:text-slate-200">11.4 Days</td>
                <td className="px-6 py-4.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-250">Optimal</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                <td className="px-6 py-4.5 font-semibold text-slate-800 dark:text-slate-200">Win Ratio</td>
                <td className="px-6 py-4.5 text-slate-500 dark:text-slate-400">30.0%</td>
                <td className="px-6 py-4.5 font-bold text-slate-800 dark:text-slate-200">{winRatio}%</td>
                <td className="px-6 py-4.5">{getWinRatioBadge()}</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                <td className="px-6 py-4.5 font-semibold text-slate-800 dark:text-slate-200">Avg Deal Value</td>
                <td className="px-6 py-4.5 text-slate-500 dark:text-slate-400">₹5,00,000</td>
                <td className="px-6 py-4.5 font-bold text-slate-800 dark:text-slate-200">₹{avgDealValue.toLocaleString('en-IN')}</td>
                <td className="px-6 py-4.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">Stable</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
