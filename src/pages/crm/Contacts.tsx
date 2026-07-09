import React, { useState } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { Search } from 'lucide-react';

interface ContactsProps {
  globalSearch?: string;
  setGlobalSearch?: (val: string) => void;
}

export const Contacts: React.FC<ContactsProps> = ({ globalSearch, setGlobalSearch }) => {
  const { contacts } = useCrm();
  const [localSearch, setLocalSearch] = useState('');
  const search = globalSearch !== undefined ? globalSearch : localSearch;
  const setSearch = setGlobalSearch !== undefined ? setGlobalSearch : setLocalSearch;

  const filteredContacts = contacts.filter(contact => {
    return (contact.name || '').toLowerCase().includes(search.toLowerCase()) ||
           (contact.company || '').toLowerCase().includes(search.toLowerCase()) ||
           (contact.email || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* View Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-slate-800 dark:text-slate-100">
          Customer Directory
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Active clients with successfully won deals
        </p>
      </div>

      {/* Search Toolbar */}
      <div className="glass-panel rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="relative min-w-[240px] flex-grow md:flex-grow-0">
          <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 text-sm text-slate-800 dark:text-slate-100 outline-none transition-all"
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Contact Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Email</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Phone</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Company</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Closed Value</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">Last Contacted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No active contacts found. Convert leads to status "Won" to populate directory.
                  </td>
                </tr>
              ) : (
                filteredContacts.map(c => {
                  const initials = c.name ? c.name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9.5 h-9.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center flex-shrink-0">
                            {initials}
                          </div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-slate-600 dark:text-slate-400 text-sm">{c.email}</td>
                      <td className="px-6 py-4.5 text-slate-600 dark:text-slate-400 text-sm">{c.phone}</td>
                      <td className="px-6 py-4.5 text-slate-700 dark:text-slate-300 font-medium">{c.company}</td>
                      <td className="px-6 py-4.5 text-emerald-600 dark:text-emerald-400 font-bold">₹{c.value.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4.5 text-slate-500 dark:text-slate-400 text-sm">{c.createdDate}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
