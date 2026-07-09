import React, { useEffect, useState } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useCrm();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!toast || !visible) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />;
      case 'info':
        return <Info className="w-5 h-5 text-indigo-500 flex-shrink-0" />;
    }
  };

  const getBorder = () => {
    switch (toast.type) {
      case 'success':
        return 'border-l-emerald-500';
      case 'error':
        return 'border-l-rose-500';
      case 'info':
        return 'border-l-indigo-500';
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[2000] flex items-center gap-3 px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 ${getBorder()} rounded-xl shadow-2xl animate-slide-in min-w-[280px] max-w-[400px]`}>
      {getIcon()}
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        {toast.message}
      </span>
    </div>
  );
};
