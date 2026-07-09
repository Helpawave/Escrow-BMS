import { pages } from '@/lib/pageImports';

const pathToImportKey: Record<string, keyof typeof pages> = {
  '/dashboard': 'Dashboard',
  '/invoices': 'Invoices',
  '/purchase-invoices': 'PurchaseInvoices',
  '/clients': 'Clients',
  '/vendors': 'Vendors',
  '/products': 'Products',
  '/payments': 'Payments',
  '/expenses': 'Expenses',
  '/einvoice': 'EInvoice',
  '/e-invoice': 'EInvoice',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/create-invoice': 'CreateInvoice',
};

export function preloadPage(path: string) {
  const importKey = pathToImportKey[path];
  if (!importKey) return;

  pages[importKey]().catch(() => {
    // Ignore prefetch errors; navigation will retry
  });
}
