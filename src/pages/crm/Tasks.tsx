import React, { useState } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import type { Task } from '@/contexts/CrmContext';
import { Plus, Clock, Edit2, Trash2 } from 'lucide-react';
import { TaskModal } from '@/components/TaskModal';

interface TasksProps {
  globalSearch?: string;
  setGlobalSearch?: (val: string) => void;
}

export const Tasks: React.FC<TasksProps> = ({ globalSearch = '' }) => {
  const { tasks, leads, updateTask, deleteTask } = useCrm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const openAddModal = () => {
    setSelectedTaskId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (id: string) => {
    setSelectedTaskId(id);
    setIsModalOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      updateTask(taskId, { status: newStatus });
    }
  };

  // Group columns
  const columns: { title: string; status: Task['status']; color: string }[] = [
    { title: 'To Do', status: 'todo', color: 'bg-cyan-500' },
    { title: 'In Progress', status: 'progress', color: 'bg-violet-500' },
    { title: 'In Review', status: 'review', color: 'bg-amber-500' },
    { title: 'Completed', status: 'done', color: 'bg-emerald-500' }
  ];

  return (
    <div className="space-y-6 flex flex-col h-full animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-slate-800 dark:text-slate-100">
            Task Board
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your deals follow-up action items on a Kanban Board
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Add New Task
        </button>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start flex-grow min-h-[500px]">
        {columns.map(col => {
          const colTasks = tasks
            .filter(t => t.status === col.status)
            .filter(t => {
              if (!globalSearch) return true;
              return (t.title || '').toLowerCase().includes(globalSearch.toLowerCase()) ||
                     (t.desc || '').toLowerCase().includes(globalSearch.toLowerCase());
            });
          
          return (
            <KanbanColumn
              key={col.status}
              title={col.title}
              status={col.status}
              color={col.color}
              tasks={colTasks}
              leads={leads}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onEdit={openEditModal}
              onDelete={deleteTask}
            />
          );
        })}
      </div>

      {/* Modal Dialog container */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskId={selectedTaskId}
      />
    </div>
  );
};

// Kanban Column Child Component to handle local dragover state
interface ColumnProps {
  title: string;
  status: Task['status'];
  color: string;
  tasks: Task[];
  leads: any[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, status: Task['status']) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const KanbanColumn: React.FC<ColumnProps> = ({
  title,
  status,
  color,
  tasks,
  leads,
  onDragStart,
  onDrop,
  onEdit,
  onDelete
}) => {
  const { updateTask } = useCrm();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleLocalDrop = (e: React.DragEvent) => {
    setIsDragOver(false);
    onDrop(e, status);
  };

  const getPriorityClass = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300';
      case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
      case 'low': return 'bg-slate-100 text-slate-800 dark:bg-slate-850 dark:text-slate-350';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleLocalDrop}
      className={`flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[620px] shadow-md transition-all duration-200 ${
        isDragOver ? 'border-blue-500 ring-4 ring-blue-500/10 bg-blue-50/10 dark:bg-blue-500/5' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-5 py-4.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="p-4 space-y-3.5 overflow-y-auto min-h-[150px] flex-grow">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 text-xs text-center font-medium">
            Empty Column
          </div>
        ) : (
          tasks.map(task => {
            const linkedLead = leads.find(l => l.id === task.leadId);
            return (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => onDragStart(e, task.id)}
                className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4.5 space-y-3 hover:border-blue-500 dark:hover:border-blue-500 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-snug">
                    {task.title}
                  </h4>
                  <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide flex-shrink-0 ${getPriorityClass(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {task.desc}
                </p>

                {linkedLead && (
                  <span className="inline-block text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/5 dark:bg-blue-500/10 px-2 py-0.5 rounded">
                    {linkedLead.company}
                  </span>
                )}

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/50 pt-3 mt-1 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1 flex-grow overflow-hidden" title={`Due: ${task.dueDate}`}>
                    <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <select
                      value={task.status}
                      onChange={(e) => updateTask(task.id, { status: e.target.value as Task['status'] })}
                      className="text-[10px] bg-slate-100 dark:bg-slate-800 border-none rounded px-1 py-0.5 font-bold text-slate-500 dark:text-slate-405 outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors w-full max-w-[85px] truncate"
                    >
                      <option value="todo">To Do</option>
                      <option value="progress">In Progress</option>
                      <option value="review">In Review</option>
                      <option value="done">Completed</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEdit(task.id)}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Edit Task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete task: "${task.title}"?`)) onDelete(task.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
