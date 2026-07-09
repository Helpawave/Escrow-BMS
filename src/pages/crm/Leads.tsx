import React, { useState } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import type { Lead } from '@/contexts/CrmContext';
import { Plus, Search, Edit3, Trash2 } from 'lucide-react';
import { LeadModal } from '@/components/LeadModal';

interface LeadsProps {
  globalSearch?: string;
  setGlobalSearch?: (val: string) => void;
}

export const Leads: React.FC<LeadsProps> = ({ globalSearch, setGlobalSearch }) => {
  const { leads, deleteLead } = useCrm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  // Filter States
  const [localSearch, setLocalSearch] = useState('');
  const search = globalSearch !== undefined ? globalSearch : localSearch;
  const setSearch = setGlobalSearch !== undefined ? setGlobalSearch : setLocalSearch;
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortField, setSortField] = useState('date');

  const openAddModal = () => {
    setSelectedLeadId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (id: string) => {
    setSelectedLeadId(id);
    setIsModalOpen(true);
  };

  // Filter & Sort Logic
  const filteredLeads = leads
    .filter(lead => {
      const matchesSearch = (lead.name || '').toLowerCase().includes(search.toLowerCase()) ||
                            (lead.company || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      if (sortField === 'date') {
        return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
      }
      if (sortField === 'value') {
        return b.value - a.value;
      }
      if (sortField === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  const getStatusBadge = (status: Lead['status']) => {
    switch (status) {
      case 'new': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700';
      case 'contacted': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900';
      case 'qualified': return 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-900';
      case 'proposal': return 'bg-amber-100 text-amber-850 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900';
      case 'won': return 'bg-emerald-100 text-emerald-850 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900';
      case 'lost': return 'bg-rose-100 text-rose-850 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900';
    }
  };

  const getPriorityBadge = (priority: Lead['priority']) => {
    switch (priority) {
      case 'high': return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300';
      case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
      case 'low': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-slate-800 dark:text-slate-100">
            Sales Leads
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track, filter, and progress your sales opportunities
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Add New Lead
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-grow md:flex-grow-0">
            <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search leads by name or company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 text-sm text-slate-800 dark:text-slate-100 outline-none transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:border-blue-500 text-sm font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:border-blue-500 text-sm font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <select
            value={sortField}
            onChange={e => setSortField(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:border-blue-500 text-sm font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="date">Sort by Date Added</option>
            <option value="value">Sort by Deal Value</option>
            <option value="name">Sort by Lead Name</option>
          </select>
        </div>
      </div>

      {/* Leads Directory Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Lead Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Company</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Deal Value</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Priority</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Date Added</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 text-center w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No leads found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map(lead => {
                  const initials = lead.name ? lead.name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9.5 h-9.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{lead.name}</div>
                            <div className="text-xs text-slate-400">{lead.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-slate-700 dark:text-slate-300 font-medium">{lead.company}</td>
                      <td className="px-6 py-4.5 text-slate-900 dark:text-slate-100 font-bold">₹{lead.value.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${getStatusBadge(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase ${getPriorityBadge(lead.priority)}`}>
                          {lead.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-slate-500 dark:text-slate-400 text-sm">{lead.createdDate}</td>
                      <td className="px-6 py-4.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(lead.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-500/10 dark:hover:text-blue-400 transition-all cursor-pointer"
                            title="Edit Lead"
                          >
                            <Edit3 className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => {
                              setLeadToDelete(lead);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 dark:hover:text-rose-400 transition-all cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog container */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leadId={selectedLeadId}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && leadToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xl bg-white/95 dark:bg-[#111827]/95 p-6 w-full max-w-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Confirm Deletion
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure you want to delete lead <strong className="text-slate-700 dark:text-slate-350 font-semibold">"{leadToDelete.name}"</strong>? This action will permanently purge the client's pipeline history.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setLeadToDelete(null);
                }}
                className="flex-1 py-2 px-4 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (leadToDelete) {
                    await deleteLead(leadToDelete.id);
                  }
                  setIsDeleteModalOpen(false);
                  setLeadToDelete(null);
                }}
                className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
