import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

// Providers
import { FinanceProvider } from '@/contexts/FinanceContext';
import { ProductsProvider } from '@/contexts/ProductsContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { CrmProvider } from '@/contexts/CrmContext';

function ModuleLoader() {
  return (
    <div className="w-full h-1 bg-indigo-500/10 overflow-hidden relative">
      <div className="w-1/3 h-full bg-indigo-600 animate-pulse rounded-full" />
    </div>
  );
}

// 1. Payroll Pages (Lazy Loaded)
const PayrollIndex = React.lazy(() => import('../payroll/Index'));
const PayrollEmployees = React.lazy(() => import('../payroll/Employees'));
const PayrollSalary = React.lazy(() => import('../payroll/Payroll'));
const PayrollAttendance = React.lazy(() => import('../payroll/Attendance'));
const PayrollLeave = React.lazy(() => import('../payroll/Leave'));
const PayrollPayslips = React.lazy(() => import('../payroll/Payslips'));
const PayrollReports = React.lazy(() => import('../payroll/Reports'));

export function PayrollModule() {
  return (
    <Suspense fallback={<ModuleLoader />}>
      <Routes>
        <Route path="/" element={<PayrollIndex />} />
        <Route path="/employees" element={<PayrollEmployees />} />
        <Route path="/payroll" element={<PayrollSalary />} />
        <Route path="/attendance" element={<PayrollAttendance />} />
        <Route path="/leave" element={<PayrollLeave />} />
        <Route path="/payslips" element={<PayrollPayslips />} />
        <Route path="/reports" element={<PayrollReports />} />
        <Route path="/settings" element={<Navigate to="/settings" replace />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </Suspense>
  );
}

// 2. Ledger Pages (Lazy Loaded)
const LedgerDashboard = React.lazy(() => import('../ledger/Dashboard'));
const LedgerView = React.lazy(() => import('../ledger/LedgerView'));
const LedgerTransfer = React.lazy(() => import('../ledger/TransferEntry'));
const LedgerCreateParty = React.lazy(() => import('../ledger/CreateParty'));
const LedgerBalanceSheet = React.lazy(() => import('../ledger/BalanceSheet'));
const LedgerProfitLoss = React.lazy(() => import('../ledger/ProfitLossReport'));
const LedgerPartyReport = React.lazy(() => import('../ledger/PartyReport'));
const LedgerTransactionReport = React.lazy(() => import('../ledger/TransactionReport'));
const LedgerProfile = React.lazy(() => import('../ledger/UserProfile'));
const LedgerAdminLogin = React.lazy(() => import('../ledger/AdminLogin'));
const LedgerAdminDashboard = React.lazy(() => import('../ledger/AdminDashboard'));

export function LedgerModule() {
  return (
    <AppLayout>
      <Suspense fallback={<ModuleLoader />}>
        <Routes>
          <Route path="/" element={<LedgerDashboard />} />
          <Route path="/ledger" element={<LedgerView />} />
          <Route path="/transfer" element={<LedgerTransfer />} />
          <Route path="/create/party" element={<LedgerCreateParty />} />
          <Route path="/profile" element={<Navigate to="/settings?tab=profile" replace />} />
          <Route path="/configure/company" element={<Navigate to="/settings?tab=business" replace />} />
          <Route path="/reports/balance-sheet" element={<LedgerBalanceSheet />} />
          <Route path="/reports/profit-loss" element={<LedgerProfitLoss />} />
          <Route path="/reports/parties" element={<LedgerPartyReport />} />
          <Route path="/reports/transactions" element={<LedgerTransactionReport />} />
          <Route path="/admin" element={<LedgerAdminLogin />} />
          <Route path="/admin/dashboard" element={<LedgerAdminDashboard />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

// 3. Billing Pages (Lazy Loaded)
const BillDashboard = React.lazy(() => import('../bill/Dashboard'));
const BillInvoices = React.lazy(() => import('../bill/Invoices'));
const BillCreateInvoice = React.lazy(() => import('../bill/CreateInvoice'));
const BillClients = React.lazy(() => import('../bill/Clients'));
const BillVendors = React.lazy(() => import('../bill/Vendors'));
const BillPurchaseInvoices = React.lazy(() => import('../bill/PurchaseInvoices'));
const BillProducts = React.lazy(() => import('../bill/Products'));
const BillPayments = React.lazy(() => import('../bill/Payments'));
const BillExpenses = React.lazy(() => import('../bill/Expenses'));
const BillReports = React.lazy(() => import('../bill/Reports'));
const BillEInvoice = React.lazy(() => import('../bill/EInvoice'));
const BillAdminLogin = React.lazy(() => import('../bill/AdminLogin'));
const BillAdminDashboard = React.lazy(() => import('../bill/AdminDashboard'));
const BillBusinessSetup = React.lazy(() => import('../bill/BusinessSetup'));

export function BillingModule() {
  return (
    <AppLayout>
      <Suspense fallback={<ModuleLoader />}>
        <Routes>
          <Route path="/" element={<BillDashboard />} />
          <Route path="/invoices" element={<BillInvoices />} />
          <Route path="/invoices/:invoiceId/edit" element={<BillCreateInvoice />} />
          <Route path="/create-invoice" element={<BillCreateInvoice />} />
          <Route path="/clients" element={<BillClients />} />
          <Route path="/vendors" element={<BillVendors />} />
          <Route path="/purchase-invoices" element={<BillPurchaseInvoices />} />
          <Route path="/products" element={<BillProducts />} />
          <Route path="/payments" element={<BillPayments />} />
          <Route path="/expenses" element={<BillExpenses />} />
          <Route path="/reports" element={<BillReports />} />
          <Route path="/e-invoice" element={<BillEInvoice />} />
          <Route path="/settings" element={<Navigate to="/settings" replace />} />
          <Route path="/admin" element={<BillAdminLogin />} />
          <Route path="/admin/dashboard" element={<BillAdminDashboard />} />
          <Route path="/setup-business" element={<BillBusinessSetup />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

// 4. Hisab Pages (Lazy Loaded)
const HisabDashboard = React.lazy(() => import('../daily-hisab/user/Dashboard').then(m => ({ default: m.Dashboard })));
const HisabHistory = React.lazy(() => import('../daily-hisab/user/History').then(m => ({ default: m.History })));
const HisabAdminLogin = React.lazy(() => import('../daily-hisab/admin/AdminLogin').then(m => ({ default: m.AdminLogin })));
const HisabAdminDashboard = React.lazy(() => import('../daily-hisab/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

export function HisabModule() {
  return (
    <FinanceProvider>
      <AppLayout>
        <Suspense fallback={<ModuleLoader />}>
          <Routes>
            <Route path="/" element={<HisabDashboard />} />
            <Route path="/history" element={<HisabHistory />} />
            <Route path="/admin" element={<HisabAdminLogin />} />
            <Route path="/admin/dashboard" element={<HisabAdminDashboard />} />
            <Route path="*" element={<Navigate to="" replace />} />
          </Routes>
        </Suspense>
      </AppLayout>
    </FinanceProvider>
  );
}

// 5. Inventory Pages (Lazy Loaded)
const InventoryDashboard = React.lazy(() => import('../inventory/Dashboard').then(m => ({ default: m.Dashboard })));
const InventoryProducts = React.lazy(() => import('../inventory/Products').then(m => ({ default: m.Products })));
const InventoryDetails = React.lazy(() => import('../inventory/ProductDetails').then(m => ({ default: m.ProductDetails })));
const InventoryEdit = React.lazy(() => import('../inventory/EditProduct').then(m => ({ default: m.EditProduct })));
const InventoryScan = React.lazy(() => import('../inventory/ScanPage').then(m => ({ default: m.ScanPage })));
const InventoryHistory = React.lazy(() => import('../inventory/HistoryPage').then(m => ({ default: m.HistoryPage })));
const InventoryReports = React.lazy(() => import('../inventory/Reports').then(m => ({ default: m.Reports })));
const InventoryUsers = React.lazy(() => import('../inventory/Users').then(m => ({ default: m.Users })));

export function InventoryModule() {
  return (
    <NotificationProvider>
      <ProductsProvider>
        <AppLayout>
          <Suspense fallback={<ModuleLoader />}>
            <Routes>
              <Route path="/" element={<InventoryDashboard />} />
              <Route path="/products" element={<InventoryProducts />} />
              <Route path="/product/:id" element={<InventoryDetails />} />
              <Route path="/product/edit/:id" element={<InventoryEdit />} />
              <Route path="/scan" element={<InventoryScan />} />
              <Route path="/history" element={<InventoryHistory />} />
              <Route path="/reports" element={<InventoryReports />} />
              <Route path="/settings" element={<Navigate to="/settings" replace />} />
              <Route path="/users" element={<InventoryUsers />} />
              <Route path="*" element={<Navigate to="" replace />} />
            </Routes>
          </Suspense>
        </AppLayout>
      </ProductsProvider>
    </NotificationProvider>
  );
}

// 6. CRM Page (Lazy Loaded)
const CrmRoot = React.lazy(() => import('../crm/CrmRoot'));

export function CrmModule() {
  return (
    <CrmProvider>
      <Suspense fallback={<ModuleLoader />}>
        <CrmRoot />
      </Suspense>
    </CrmProvider>
  );
}
