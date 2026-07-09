import React, { useState, useEffect } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import type { Task } from '@/contexts/CrmContext';
import { X } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: string | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, taskId }) => {
  const { tasks, leads, addTask, updateTask } = useCrm();

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState<Task['status']>('todo');
  const [priority, setPriority] = useState<Task['priority']>('low');
  const [leadId, setLeadId] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          setTitle(task.title);
          setDesc(task.desc);
          setStatus(task.status);
          setPriority(task.priority);
          setLeadId(task.leadId);
          setDueDate(task.dueDate);
        }
      } else {
        // Clear for creation
        setTitle('');
        setDesc('');
        setStatus('todo');
        setPriority('low');
        setLeadId('');
        
        // Default date (today + 3 days)
        const date = new Date();
        date.setDate(date.getDate() + 3);
        setDueDate(date.toISOString().split('T')[0]);
      }
    }
  }, [isOpen, taskId, tasks]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskData = {
      title,
      desc,
      status,
      priority,
      leadId,
      dueDate
    };

    if (taskId) {
      updateTask(taskId, taskData);
    } else {
      addTask(taskData);
    }
    onClose();
  };

  // Filter leads that are active (non-won, non-lost) to associate with tasks, or the currently selected lead
  const activeLeads = leads.filter(l => l.status !== 'won' && l.status !== 'lost' || l.id === leadId);

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {taskId ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Task Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-100 transition-all outline-none"
                placeholder="e.g. Schedule call with CEO"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                required
                rows={3}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-100 transition-all outline-none resize-none"
                placeholder="e.g. Discuss integration requirements and timeline details..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Kanban Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as Task['status'])}
                  required
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-100 transition-all outline-none"
                >
                  <option value="todo">To Do</option>
                  <option value="progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="done">Completed</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as Task['priority'])}
                  required
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-100 transition-all outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Linked Lead / Deal</label>
                <select
                  value={leadId}
                  onChange={e => setLeadId(e.target.value)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-100 transition-all outline-none"
                >
                  <option value="">General Task (None)</option>
                  {activeLeads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} ({lead.company})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  required
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-100 transition-all outline-none"
                />
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
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
