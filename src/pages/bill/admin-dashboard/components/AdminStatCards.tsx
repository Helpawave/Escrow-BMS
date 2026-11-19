import React from 'react';
import { Card } from '@/components/ui/card';
import { Users, CheckCircle, FileText } from 'lucide-react';

interface AdminStatCardsProps {
  totalBusinesses: number;
  activeBusinessesCount: number;
  blockedBusinessesCount: number;
  totalInvoicesCount: number;
  totalClientsCount: number;
}

export const AdminStatCards: React.FC<AdminStatCardsProps> = ({
  totalBusinesses,
  activeBusinessesCount,
  blockedBusinessesCount,
  totalInvoicesCount,
  totalClientsCount,
}) => {
  const stats = [
    {
      label: 'Total Businesses',
      value: totalBusinesses,
      subtext: `${totalBusinesses} Registered Businesses`,
      icon: <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />,
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Active Businesses',
      value: activeBusinessesCount,
      subtext: `${activeBusinessesCount} Active • ${blockedBusinessesCount} Blocked`,
      icon: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />,
      bgColor: 'bg-emerald-500/10'
    },
    {
      label: 'Total Invoices',
      value: totalInvoicesCount,
      subtext: 'Across all businesses',
      icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />,
      bgColor: 'bg-indigo-500/10'
    },
    {
      label: 'Total Clients',
      value: totalClientsCount,
      subtext: 'Registered customers',
      icon: <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />,
      bgColor: 'bg-amber-500/10'
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="relative overflow-hidden border shadow-sm transition-all bg-card">
          <div className="p-3 sm:p-5">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <div className={`p-1.5 sm:p-2 rounded-xl shrink-0 flex items-center justify-center ${stat.bgColor}`}>
                {stat.icon}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{stat.label}</p>
              <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 text-foreground break-words leading-tight py-0.5 truncate">
                {stat.value.toLocaleString('en-IN')}
              </p>
              {stat.subtext && (
                <p className="text-[10px] sm:text-[11px] text-muted-foreground/80 mt-0.5 font-medium truncate">
                  {stat.subtext}
                </p>
              )}
            </div>
          </div>
          <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-5 pointer-events-none">
            {stat.icon}
          </div>
        </Card>
      ))}
    </div>
  );
};

