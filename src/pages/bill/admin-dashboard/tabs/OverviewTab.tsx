import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  PieChart as PieChartIcon,
  Database,
  Cpu
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { OverviewGrowthPoint, OverviewPlanPoint } from '../types';

interface OverviewTabProps {
  growthData: OverviewGrowthPoint[];
  planData: OverviewPlanPoint[];
  colors: string[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  growthData,
  planData,
  colors,
}) => {
  return (
    <TabsContent value="overview" className="space-y-6 outline-none">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border shadow-sm overflow-hidden bg-white dark:bg-slate-800">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg font-bold flex items-center">
              <Activity className="w-4 h-4 mr-2 text-blue-500" />
              User Growth
            </CardTitle>
            <CardDescription className="text-xs">Platform adoption over the last 14 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px] sm:h-[300px] w-full pt-0 p-2 sm:p-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={3} fillOpacity={0.1} fill="#3B82F6" />
                <Area type="monotone" dataKey="pro" stroke="#10B981" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border shadow-sm overflow-hidden bg-white dark:bg-slate-800">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg font-bold flex items-center">
              <PieChartIcon className="w-4 h-4 mr-2 text-emerald-500" />
              Subscription Mix
            </CardTitle>
            <CardDescription className="text-xs">Distribution of Free vs Pro users</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px] sm:h-[300px] w-full pt-0 flex flex-col items-center p-2 sm:p-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart role="region" aria-label="Subscription Mix Chart">
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  role="presentation"
                >
                  {planData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                      role="img"
                      aria-label={`${entry.name} users: ${entry.value}`}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-3">
              {planData.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colors[i] }} />
                  <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">{p.name}: {p.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        {[
          { label: 'API Latency', value: '45ms', status: 'Optimal', icon: <Activity className="w-5 h-5 text-blue-500" /> },
          { label: 'DB Connections', value: '12/100', status: 'Healthy', icon: <Database className="w-5 h-5 text-emerald-500" /> },
          { label: 'CPU Usage', value: '8%', status: 'Normal', icon: <Cpu className="w-5 h-5 text-amber-500" /> },
        ].map((comp, i) => (
          <Card key={i} className="border-none shadow-sm bg-white dark:bg-slate-800/50">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl shrink-0">
                  {comp.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{comp.label}</p>
                  <p className="text-base sm:text-lg font-bold truncate">{comp.value}</p>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">{comp.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TabsContent>
  );
};

