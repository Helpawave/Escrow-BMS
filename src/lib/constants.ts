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

export type ModuleKey = 'payroll' | 'ledger' | 'billing' | 'hisab' | 'inventory' | 'crm' | 'members';

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
    route: '/billing/invoices',
    color: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    badge: 'Popular',
  },
  {
    key: 'inventory',
    name: 'Inventory',
    description: 'Product catalog, stock tracking, barcode scanning & reports',
    icon: Package,
    route: '/inventory/products',
    color: 'from-rose-500 to-pink-600',
    iconBg: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
  },
  {
    key: 'crm',
    name: 'CRM',
    description: 'Lead pipeline, contacts, task board, analytics & team management',
    icon: KanbanSquare,
    route: '/crm/tasks',
    color: 'from-indigo-500 to-blue-700',
    iconBg: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
  },
  {
    key: 'hisab',
    name: 'Daily Calculation',
    description: 'Simple daily income & expense tracking with history',
    icon: Calculator,
    route: '/calculation/history',
    color: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
  },
  {
    key: 'payroll',
    name: 'Payroll',
    description: 'Employee salary, attendance, leave & payslip management',
    icon: Users,
    route: '/payroll/employees',
    color: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400',
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
    { labelKey: 'Salary Structure', route: '/payroll/payroll', icon: DollarSign },
    { labelKey: 'Attendance Log', route: '/payroll/attendance', icon: Clock },
    { labelKey: 'Leave Requests', route: '/payroll/leave', icon: Calendar },
    { labelKey: 'Payslips', route: '/payroll/payslips', icon: FileText },
  ],
  ledger: [
    { labelKey: 'Account Ledger', route: '/ledger', icon: Users },
    { labelKey: 'Balance Sheet', route: '/ledger/reports/balance-sheet', icon: FileText },
    { labelKey: 'Party Report', route: '/ledger/reports/parties', icon: ClipboardList },
  ],
  billing: [
    { labelKey: 'Create Invoice', route: '/billing/create-invoice', icon: FilePlus },
    { labelKey: 'Ledger Billing', route: '/billing/create-invoice?type=ledger', icon: BookOpen },
    { labelKey: 'Sales Invoices', route: '/billing/invoices', icon: Receipt },
    { labelKey: 'Purchase Invoices', route: '/billing/purchase-invoices', icon: ShoppingBag },
    { labelKey: 'Payments', route: '/billing/payments', icon: CreditCard },
    { labelKey: 'Expenses', route: '/billing/expenses', icon: Wallet },
    { labelKey: 'E-Invoices', route: '/billing/e-invoice', icon: Zap },
  ],
  hisab: [
    { labelKey: 'Daily Calculation Log', route: '/calculation/history', icon: History },
  ],
  inventory: [
    { labelKey: 'Stock Products', route: '/inventory/products', icon: Package },
    { labelKey: 'Scan Barcode', route: '/inventory/scan', icon: QrCode },
    { labelKey: 'Stock History', route: '/inventory/history', icon: History },
  ],
  crm: [
    { labelKey: 'Task Board', route: '/crm/tasks', icon: KanbanSquare },
    { labelKey: 'Leads', route: '/crm/leads', icon: Users },
    { labelKey: 'Contacts', route: '/crm/contacts', icon: Contact },
  ],
  members: [
    { labelKey: 'Clients & Parties', route: '/billing/clients', icon: Users },
    { labelKey: 'Vendors', route: '/billing/vendors', icon: Truck },
    { labelKey: 'Employees', route: '/payroll/employees', icon: UserCog },
  ],
};
