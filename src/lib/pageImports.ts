/** Comprehensive Lazy page imports for navigation prefetching across all BMS modules */
export const pages = {
  // Core App & Modules
  Modules: () => import('@/pages/modules'),
  Dashboard: () => import('@/pages/Dashboard'),
  Settings: () => import('@/pages/Settings'),
  Pricing: () => import('@/pages/Pricing'),
  ClientAdmin: () => import('@/pages/ClientAdminDashboard'),
  SuperAdmin: () => import('@/pages/bill/AdminDashboard'),
  
  // Billing Module Pages
  BillDashboard: () => import('@/pages/bill/Dashboard'),
  Invoices: () => import('@/pages/bill/Invoices'),
  PurchaseInvoices: () => import('@/pages/bill/PurchaseInvoices'),
  Clients: () => import('@/pages/bill/Clients'),
  Vendors: () => import('@/pages/bill/Vendors'),
  Products: () => import('@/pages/bill/Products'),
  Payments: () => import('@/pages/bill/Payments'),
  Expenses: () => import('@/pages/bill/Expenses'),
  EInvoice: () => import('@/pages/bill/EInvoice'),
  Reports: () => import('@/pages/bill/Reports'),
  CreateInvoice: () => import('@/pages/bill/CreateInvoice'),
  BusinessSetup: () => import('@/pages/bill/BusinessSetup'),

  // Payroll Module Pages
  PayrollIndex: () => import('@/pages/payroll/Index'),
  PayrollEmployees: () => import('@/pages/payroll/Employees'),
  PayrollSalary: () => import('@/pages/payroll/Payroll'),
  PayrollAttendance: () => import('@/pages/payroll/Attendance'),
  PayrollLeave: () => import('@/pages/payroll/Leave'),
  PayrollPayslips: () => import('@/pages/payroll/Payslips'),
  PayrollReports: () => import('@/pages/payroll/Reports'),

  // Ledger Module Pages
  LedgerDashboard: () => import('@/pages/ledger/Dashboard'),
  LedgerView: () => import('@/pages/ledger/LedgerView'),
  LedgerTransfer: () => import('@/pages/ledger/TransferEntry'),
  LedgerCreateParty: () => import('@/pages/ledger/CreateParty'),
  LedgerBalanceSheet: () => import('@/pages/ledger/BalanceSheet'),
  LedgerProfitLoss: () => import('@/pages/ledger/ProfitLossReport'),
  LedgerPartyReport: () => import('@/pages/ledger/PartyReport'),
  LedgerTransactionReport: () => import('@/pages/ledger/TransactionReport'),
  LedgerProfile: () => import('@/pages/ledger/UserProfile'),

  // Inventory Module Pages
  InventoryDashboard: () => import('@/pages/inventory/Dashboard'),
  InventoryProducts: () => import('@/pages/inventory/Products'),
  InventoryDetails: () => import('@/pages/inventory/ProductDetails'),
  InventoryEdit: () => import('@/pages/inventory/EditProduct'),
  InventoryScan: () => import('@/pages/inventory/ScanPage'),
  InventoryHistory: () => import('@/pages/inventory/HistoryPage'),
  InventoryReports: () => import('@/pages/inventory/Reports'),
  InventoryUsers: () => import('@/pages/inventory/Users'),

  // Daily Hisab Module Pages
  HisabDashboard: () => import('@/pages/daily-hisab/user/Dashboard'),
  HisabHistory: () => import('@/pages/daily-hisab/user/History'),
  HisabAdminDashboard: () => import('@/pages/daily-hisab/admin/AdminDashboard'),

  // CRM Module Pages
  CrmRoot: () => import('@/pages/crm/CrmRoot'),
} as const;
