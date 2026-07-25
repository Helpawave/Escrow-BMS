import { pages } from '@/lib/pageImports';

const prefetched = new Set<string>();

const pathToImportKeys: Record<string, (keyof typeof pages)[]> = {
  '/dashboard': ['Dashboard'],
  '/payroll': ['PayrollIndex', 'PayrollEmployees', 'PayrollSalary'],
  '/ledger': ['LedgerDashboard', 'LedgerView', 'LedgerTransfer'],
  '/billing': ['BillDashboard', 'Invoices', 'Products', 'Clients'],
  '/calculation': ['HisabDashboard', 'HisabHistory'],
  '/inventory': ['InventoryDashboard', 'InventoryProducts'],
  '/crm': ['CrmRoot'],
  '/invoices': ['Invoices'],
  '/create-invoice': ['CreateInvoice'],
  '/purchase-invoices': ['PurchaseInvoices'],
  '/clients': ['Clients'],
  '/vendors': ['Vendors'],
  '/products': ['Products'],
  '/payments': ['Payments'],
  '/expenses': ['Expenses'],
  '/einvoice': ['EInvoice'],
  '/e-invoice': ['EInvoice'],
  '/reports': ['Reports'],
  '/settings': ['Settings'],
  '/pricing': ['Pricing'],
  '/workspace-admin': ['ClientAdmin'],
  '/admin': ['SuperAdmin'],
};

export function preloadPage(path: string) {
  if (!path || path === '#' || path.startsWith('javascript:')) return;

  const cleanPath = path.toLowerCase().split('?')[0].split('#')[0];
  if (prefetched.has(cleanPath)) return;
  prefetched.add(cleanPath);

  // Always prefetch modules container
  pages.Modules().catch(() => {});

  // Match path prefix
  const keys = pathToImportKeys[cleanPath] || Object.entries(pathToImportKeys).find(([k]) => cleanPath.startsWith(k))?.[1];

  if (keys) {
    keys.forEach((key) => {
      pages[key]?.().catch(() => {});
    });
  }
}
