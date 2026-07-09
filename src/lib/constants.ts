import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Calculator,
  Package,
  DollarSign,
  Clock,
  Calendar,
  TrendingUp,
  Settings,
  ArrowLeftRight,
  PlusCircle,
  ClipboardList,
  History,
  Sliders,
  User,
  Receipt,
  FilePlus,
  ShoppingBag,
  Truck,
  CreditCard,
  Wallet,
  Zap,
  QrCode,
  UserCog,
  Contact,
  KanbanSquare,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

export type ModuleKey = 'payroll' | 'ledger' | 'billing' | 'hisab' | 'inventory' | 'crm';

export interface ModuleDefinition {
  key: ModuleKey;
  name: string;
  description: string;
  icon: LucideIcon;
  route: string;
  color: string;         // Tailwind gradient classes
  iconBg: string;        // icon background
  badge?: string;        // optional badge text e.g. "Popular"
}

export const MODULES: ModuleDefinition[] = [
  {
    key: 'payroll',
    name: 'Payroll',
    description: 'Employee salary, attendance, leave & payslip management',
    icon: Users,
    route: '/payroll',
    color: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400',
  },
  {
    key: 'ledger',
    name: 'Account Ledger',
    description: 'Party ledger, debit/credit entries, balance sheet & P&L reports',
    icon: BookOpen,
    route: '/ledger',
    color: 'from-blue-500 to-cyan-600',
    iconBg: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
    badge: 'Popular',
  },
  {
    key: 'billing',
    name: 'Billing & Invoice',
    description: 'GST invoices, e-invoicing, purchase bills, expenses & payments',
    icon: FileText,
    route: '/billing',
    color: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    badge: 'Popular',
  },
  {
    key: 'hisab',
    name: 'Daily Calculation',
    description: 'Simple daily income & expense tracking with history',
    icon: Calculator,
    route: '/calculation',
    color: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
  },
  {
    key: 'inventory',
    name: 'Inventory',
    description: 'Product catalog, stock tracking, barcode scanning & reports',
    icon: Package,
    route: '/inventory',
    color: 'from-rose-500 to-pink-600',
    iconBg: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
  },
  {
    key: 'crm',
    name: 'CRM',
    description: 'Lead pipeline, contacts, task board, analytics & team management',
    icon: LayoutDashboard,
    route: '/crm',
    color: 'from-indigo-500 to-blue-700',
    iconBg: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
  },
];

export const MODULE_MAP = Object.fromEntries(
  MODULES.map((m) => [m.key, m])
) as Record<ModuleKey, ModuleDefinition>;

export interface MenuItemDefinition {
  labelKey: string;
  route: string;
  icon: LucideIcon;
}

export const MODULE_MENUS: Record<ModuleKey, MenuItemDefinition[]> = {
  payroll: [
    { labelKey: 'dashboard', route: '/payroll', icon: LayoutDashboard },
    { labelKey: 'employees', route: '/payroll/employees', icon: Users },
    { labelKey: 'payrollSalary', route: '/payroll/payroll', icon: DollarSign },
    { labelKey: 'attendance', route: '/payroll/attendance', icon: Clock },
    { labelKey: 'leave', route: '/payroll/leave', icon: Calendar },
    { labelKey: 'payslips', route: '/payroll/payslips', icon: FileText },
    { labelKey: 'reports', route: '/payroll/reports', icon: TrendingUp },
    { labelKey: 'settings', route: '/settings?tab=team', icon: Settings },
  ],
  ledger: [
    { labelKey: 'dashboard', route: '/ledger', icon: LayoutDashboard },
    { labelKey: 'ledgerParty', route: '/ledger/ledger', icon: Users },
    { labelKey: 'transferEntry', route: '/ledger/transfer', icon: ArrowLeftRight },
    { labelKey: 'createParty', route: '/ledger/create/party', icon: PlusCircle },
    { labelKey: 'balanceSheet', route: '/ledger/reports/balance-sheet', icon: FileText },
    { labelKey: 'profitLoss', route: '/ledger/reports/profit-loss', icon: TrendingUp },
    { labelKey: 'partiesReport', route: '/ledger/reports/parties', icon: ClipboardList },
    { labelKey: 'transactionsReport', route: '/ledger/reports/transactions', icon: History },
    { labelKey: 'companySettings', route: '/settings?tab=business', icon: Sliders },
    { labelKey: 'profile', route: '/ledger/profile', icon: User },
  ],
  billing: [
    { labelKey: 'dashboard', route: '/billing', icon: LayoutDashboard },
    { labelKey: 'salesInvoices', route: '/billing/invoices', icon: Receipt },
    { labelKey: 'createInvoice', route: '/billing/create-invoice', icon: FilePlus },
    { labelKey: 'purchaseInvoices', route: '/billing/purchase-invoices', icon: ShoppingBag },
    { labelKey: 'clients', route: '/billing/clients', icon: Users },
    { labelKey: 'vendors', route: '/billing/vendors', icon: Truck },
    { labelKey: 'payments', route: '/billing/payments', icon: CreditCard },
    { labelKey: 'expenses', route: '/billing/expenses', icon: Wallet },
    { labelKey: 'products', route: '/billing/products', icon: Package },
    { labelKey: 'eInvoice', route: '/billing/e-invoice', icon: Zap },
    { labelKey: 'reports', route: '/billing/reports', icon: TrendingUp },
    { labelKey: 'settings', route: '/settings?tab=business', icon: Settings },
  ],
  hisab: [
    { labelKey: 'dashboard', route: '/calculation', icon: LayoutDashboard },
    { labelKey: 'hisabHistory', route: '/calculation/history', icon: History },
  ],
  inventory: [
    { labelKey: 'dashboard', route: '/inventory', icon: LayoutDashboard },
    { labelKey: 'productsStock', route: '/inventory/products', icon: Package },
    { labelKey: 'scanBarcode', route: '/inventory/scan', icon: QrCode },
    { labelKey: 'stockHistory', route: '/inventory/history', icon: History },
    { labelKey: 'reports', route: '/inventory/reports', icon: TrendingUp },
    { labelKey: 'usersStaff', route: '/inventory/users', icon: Users },
    { labelKey: 'settings', route: '/settings', icon: Settings },
  ],
  crm: [
    { labelKey: 'dashboard', route: '/crm', icon: LayoutDashboard },
    { labelKey: 'leads', route: '/crm/leads', icon: Users },
    { labelKey: 'contacts', route: '/crm/contacts', icon: Contact },
    { labelKey: 'taskBoard', route: '/crm/tasks', icon: KanbanSquare },
    { labelKey: 'analytics', route: '/crm/analytics', icon: BarChart3 },
    { labelKey: 'teamMembers', route: '/crm/team', icon: UserCog },
    { labelKey: 'settings', route: '/settings', icon: Settings },
  ],
};
