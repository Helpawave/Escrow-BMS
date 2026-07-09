import React, { useState, useEffect } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import type { Lead } from '@/contexts/CrmContext';
import { X } from 'lucide-react';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId?: string | null;
}

export const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, leadId }) => {
  const { leads, addLead, updateLead } = useCrm();

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [value, setValue] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<Lead['status']>('new');
  const [priority, setPriority] = useState<Lead['priority']>('low');

  useEffect(() => {
    if (isOpen) {
      if (leadId) {
        const lead = leads.find(l => l.id === leadId);
        if (lead) {
          setName(lead.name);
          setCompany(lead.company);
          setValue(lead.value.toString());
          setEmail(lead.email);
          setPhone(lead.phone);
          setStatus(lead.status);
          setPriority(lead.priority);
        }
      } else {
        // Reset to empty for creation
        setName('');
        setCompany('');
        setValue('');
        setEmail('');
        setPhone('');
        setStatus('new');
        setPriority('low');
      }
    }
  }, [isOpen, leadId, leads]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const leadData = {
      name,
      company,
      value: parseFloat(value) || 0,
      email,
      phone,
      status,
      priority
    };

    if (leadId) {
      updateLead(leadId, leadData);
    } else {
      addLead(leadData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {leadId ? 'Edit Lead Details' : 'Add New Lead'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-100 transition-all outline-none"
                placeholder="e.g. Alice Smith"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  required
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-100 transition-all outline-none"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Deal Value (₹)</label>
                <input
                  type="number"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  required
                  min="0"
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-100 transition-all outline-none"
                  placeholder="e.g. 15000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-100 transition-all outline-none"
                  placeholder="e.g. alice@acme.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-100 transition-all outline-none"
                  placeholder="e.g. +1 (555) 019-2834"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as Lead['status'])}
                  required
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-100 transition-all outline-none"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as Lead['priority'])}
                  required
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-100 transition-all outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all"
            >
              Save Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
