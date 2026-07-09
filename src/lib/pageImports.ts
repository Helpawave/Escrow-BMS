/** Lazy page imports for navigation prefetching */
export const pages = {
  Dashboard: () => import('@/pages/bill/Dashboard'),
  Invoices: () => import('@/pages/bill/Invoices'),
  PurchaseInvoices: () => import('@/pages/bill/PurchaseInvoices'),
  Clients: () => import('@/pages/bill/Clients'),
  Vendors: () => import('@/pages/bill/Vendors'),
  Products: () => import('@/pages/bill/Products'),
  Payments: () => import('@/pages/bill/Payments'),
  Expenses: () => import('@/pages/bill/Expenses'),
  EInvoice: () => import('@/pages/bill/EInvoice'),
  Reports: () => import('@/pages/bill/Reports'),
  Settings: () => import('@/pages/Settings'),
  CreateInvoice: () => import('@/pages/bill/CreateInvoice'),
} as const;
