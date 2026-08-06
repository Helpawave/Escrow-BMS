import React, { useState } from 'react';
import { PageTransition } from '@/components/PageTransition';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Receipt,
  BookOpen,
  Users,
  Package,
  CheckSquare,
  History,
  FileSpreadsheet
} from 'lucide-react';

// Lazy Loaded Comprehensive Module Reports
const BillReportsPage = React.lazy(() => import('@/pages/bill/Reports'));
const LedgerPartyReportPage = React.lazy(() => import('@/pages/ledger/PartyReport'));
const PayrollReportsPage = React.lazy(() => import('@/pages/payroll/Reports'));
const InventoryReportsPage = React.lazy(() => import('@/pages/inventory/Reports').then(m => ({ default: m.Reports })));
const CrmAnalyticsPage = React.lazy(() => import('@/pages/crm/Analytics').then(m => ({ default: m.Analytics })));
const HisabHistoryPage = React.lazy(() => import('@/pages/daily-hisab/user/History').then(m => ({ default: m.History })));

export default function ReportsPage() {
  const { hasModule } = useSubscription();

  const showBilling = hasModule('billing');
  const showLedger = hasModule('ledger');
  const showPayroll = hasModule('payroll');
  const showCRM = hasModule('crm');
  const showInventory = hasModule('inventory');
  const showHisab = hasModule('hisab');

  // Determine initial active tab based on active modules
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (showBilling) return 'billing';
    if (showLedger) return 'ledger';
    if (showPayroll) return 'payroll';
    if (showInventory) return 'inventory';
    if (showCRM) return 'crm';
    if (showHisab) return 'hisab';
    return 'billing';
  });

  const reportTabs = [
    ...(showBilling ? [{ key: 'billing', label: 'Billing & Invoices', icon: Receipt, desc: 'Sales, GST, e-Way & Profit Statements' }] : []),
    ...(showLedger ? [{ key: 'ledger', label: 'Account Ledger', icon: BookOpen, desc: 'Party Ledgers, Balance Sheet & Cash Statement' }] : []),
    ...(showPayroll ? [{ key: 'payroll', label: 'Payroll & HR', icon: Users, desc: 'Salary Summaries, Payslips & Attendance' }] : []),
    ...(showInventory ? [{ key: 'inventory', label: 'Stock & Inventory', icon: Package, desc: 'Stock Valuation, Low Stock & Movement' }] : []),
    ...(showCRM ? [{ key: 'crm', label: 'CRM & Pipeline', icon: CheckSquare, desc: 'Lead Conversions & Team Performance' }] : []),
    ...(showHisab ? [{ key: 'hisab', label: 'Daily Hisab', icon: History, desc: 'Daily Income/Expense Calculations' }] : []),
  ];

  return (
    <PageTransition className="space-y-6 pb-16">

      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-heading flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-[#5644E6]" />
            <span>Business Reports Hub</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Consolidated financial statements, tax reports & module analytics
          </p>
        </div>
      </div>

      {/* Tab Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {reportTabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex flex-col items-start text-left p-3.5 rounded-2xl border transition-all cursor-pointer group',
                active
                  ? 'bg-[#5644E6] text-white border-[#5644E6] shadow-md shadow-[#5644E6]/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              )}
            >
              <div className={cn('p-2 rounded-xl mb-2 transition-colors', active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white')}>
                <tab.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold block truncate w-full">{tab.label}</span>
              <span className={cn('text-[10px] block mt-0.5 line-clamp-1', active ? 'text-white/80' : 'text-slate-400')}>
                {tab.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Body Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 min-h-[500px]">
        {activeTab === 'billing' && showBilling && (
          <React.Suspense fallback={<div className="p-12 text-center text-xs font-bold text-slate-400">Loading Billing Reports Suite...</div>}>
            <BillReportsPage />
          </React.Suspense>
        )}

        {activeTab === 'ledger' && showLedger && (
          <React.Suspense fallback={<div className="p-12 text-center text-xs font-bold text-slate-400">Loading Party Ledger Reports...</div>}>
            <LedgerPartyReportPage />
          </React.Suspense>
        )}

        {activeTab === 'payroll' && showPayroll && (
          <React.Suspense fallback={<div className="p-12 text-center text-xs font-bold text-slate-400">Loading HR & Payroll Reports...</div>}>
            <PayrollReportsPage />
          </React.Suspense>
        )}

        {activeTab === 'inventory' && showInventory && (
          <React.Suspense fallback={<div className="p-12 text-center text-xs font-bold text-slate-400">Loading Stock Reports Suite...</div>}>
            <InventoryReportsPage />
          </React.Suspense>
        )}

        {activeTab === 'crm' && showCRM && (
          <React.Suspense fallback={<div className="p-12 text-center text-xs font-bold text-slate-400">Loading CRM Analytics Suite...</div>}>
            <CrmAnalyticsPage />
          </React.Suspense>
        )}

        {activeTab === 'hisab' && showHisab && (
          <React.Suspense fallback={<div className="p-12 text-center text-xs font-bold text-slate-400">Loading Daily Hisab History...</div>}>
            <HisabHistoryPage />
          </React.Suspense>
        )}
      </div>
    </PageTransition>
  );
}
