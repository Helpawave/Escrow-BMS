import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

// Providers
import { FinanceProvider } from '@/contexts/FinanceContext';
import { ProductsProvider } from '@/contexts/ProductsContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { CrmProvider } from '@/contexts/CrmContext';

// 1. Payroll Pages
import PayrollIndex from '../payroll/Index';
import PayrollEmployees from '../payroll/Employees';
import PayrollSalary from '../payroll/Payroll';
import PayrollAttendance from '../payroll/Attendance';
import PayrollLeave from '../payroll/Leave';
import PayrollPayslips from '../payroll/Payslips';
import PayrollReports from '../payroll/Reports';

export function PayrollModule() {
  return (
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
  );
}

// 2. Ledger Pages
import LedgerDashboard from '../ledger/Dashboard';
import LedgerView from '../ledger/LedgerView';
import LedgerTransfer from '../ledger/TransferEntry';
import LedgerCreateParty from '../ledger/CreateParty';
import LedgerBalanceSheet from '../ledger/BalanceSheet';
import LedgerProfitLoss from '../ledger/ProfitLossReport';
import LedgerPartyReport from '../ledger/PartyReport';
import LedgerTransactionReport from '../ledger/TransactionReport';
import LedgerProfile from '../ledger/UserProfile';
import LedgerAdminLogin from '../ledger/AdminLogin';
import LedgerAdminDashboard from '../ledger/AdminDashboard';

export function LedgerModule() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<LedgerDashboard />} />
        <Route path="/ledger" element={<LedgerView />} />
        <Route path="/transfer" element={<LedgerTransfer />} />
        <Route path="/create/party" element={<LedgerCreateParty />} />
        <Route path="/profile" element={<LedgerProfile />} />
        <Route path="/configure/company" element={<Navigate to="/settings" replace />} />
        <Route path="/reports/balance-sheet" element={<LedgerBalanceSheet />} />
        <Route path="/reports/profit-loss" element={<LedgerProfitLoss />} />
        <Route path="/reports/parties" element={<LedgerPartyReport />} />
        <Route path="/reports/transactions" element={<LedgerTransactionReport />} />
        <Route path="/admin" element={<LedgerAdminLogin />} />
        <Route path="/admin/dashboard" element={<LedgerAdminDashboard />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </AppLayout>
  );
}

// 3. Billing Pages
import BillDashboard from '../bill/Dashboard';
import BillInvoices from '../bill/Invoices';
import BillCreateInvoice from '../bill/CreateInvoice';
import BillClients from '../bill/Clients';
import BillVendors from '../bill/Vendors';
import BillPurchaseInvoices from '../bill/PurchaseInvoices';
import BillProducts from '../bill/Products';
import BillPayments from '../bill/Payments';
import BillExpenses from '../bill/Expenses';
import BillReports from '../bill/Reports';
import BillEInvoice from '../bill/EInvoice';
import BillAdminLogin from '../bill/AdminLogin';
import BillAdminDashboard from '../bill/AdminDashboard';
import BillBusinessSetup from '../bill/BusinessSetup';

export function BillingModule() {
  return (
    <AppLayout>
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
    </AppLayout>
  );
}

// 4. Hisab Pages
import { Dashboard as HisabDashboard } from '../daily-hisab/user/Dashboard';
import { History as HisabHistory } from '../daily-hisab/user/History';
import { AdminLogin as HisabAdminLogin } from '../daily-hisab/admin/AdminLogin';
import { AdminDashboard as HisabAdminDashboard } from '../daily-hisab/admin/AdminDashboard';

export function HisabModule() {
  return (
    <FinanceProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<HisabDashboard />} />
          <Route path="/history" element={<HisabHistory />} />
          <Route path="/admin" element={<HisabAdminLogin />} />
          <Route path="/admin/dashboard" element={<HisabAdminDashboard />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      </AppLayout>
    </FinanceProvider>
  );
}

// 5. Inventory Pages
import { Dashboard as InventoryDashboard } from '../inventory/Dashboard';
import { Products as InventoryProducts } from '../inventory/Products';
import { ProductDetails as InventoryDetails } from '../inventory/ProductDetails';
import { EditProduct as InventoryEdit } from '../inventory/EditProduct';
import { ScanPage as InventoryScan } from '../inventory/ScanPage';
import { HistoryPage as InventoryHistory } from '../inventory/HistoryPage';
import { Reports as InventoryReports } from '../inventory/Reports';
import { Users as InventoryUsers } from '../inventory/Users';

export function InventoryModule() {
  return (
    <NotificationProvider>
      <ProductsProvider>
        <AppLayout>
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
        </AppLayout>
      </ProductsProvider>
    </NotificationProvider>
  );
}

// 6. CRM Page
import CrmRoot from '../crm/CrmRoot';

export function CrmModule() {
  return (
    <CrmProvider>
      <CrmRoot />
    </CrmProvider>
  );
}
