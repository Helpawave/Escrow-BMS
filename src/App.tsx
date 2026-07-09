import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthGuard, PublicOnlyGuard } from '@/components/guards/AuthGuard';
import { ModuleGuard } from '@/components/guards/ModuleGuard';
import { Toaster } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Lock, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

// Pages
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Pricing from '@/pages/Pricing';
import Settings from '@/pages/Settings';
import Landing from '@/pages/Landing';
import SuperadminDashboard from '@/pages/bill/AdminDashboard';
import ClientAdminDashboard from '@/pages/ClientAdminDashboard';

// Modules
import {
  PayrollModule,
  LedgerModule,
  BillingModule,
  HisabModule,
  InventoryModule,
  CrmModule,
} from '@/pages/modules';

// Dynamic Redirect helper components
function DynamicProductsRedirect() {
  const lastApp = localStorage.getItem('last_active_app') || 'billing';
  const target = lastApp === 'inventory' ? '/inventory/products' : '/billing/products';
  return <Navigate to={target} replace />;
}

function DynamicSettingsRedirect() {
  return <Navigate to="/settings" replace />;
}

function DynamicReportsRedirect() {
  const lastApp = localStorage.getItem('last_active_app') || 'billing';
  if (lastApp === 'payroll') return <Navigate to="/payroll/reports" replace />;
  if (lastApp === 'ledger') return <Navigate to="/ledger/reports/transactions" replace />;
  if (lastApp === 'inventory') return <Navigate to="/inventory/reports" replace />;
  return <Navigate to="/billing/reports" replace />;
}

function DynamicHistoryRedirect() {
  const lastApp = localStorage.getItem('last_active_app') || 'hisab';
  const target = lastApp === 'inventory' ? '/inventory/history' : '/calculation/history';
  return <Navigate to={target} replace />;
}

function SuperadminLogin() {
  const { user, isSuperAdmin, loading, signIn, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInLoading(true);
    setError('');
    try {
      const { error: signInErr } = await signIn(email, password);
      if (signInErr) {
        setError(signInErr.message || 'Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSignInLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (user && isSuperAdmin) {
    return <SuperadminDashboard />;
  }

  if (user && !isSuperAdmin && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 animate-fade-in">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6 text-center">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-955/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center justify-center mx-auto text-red-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 font-heading">Access Denied</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your account does not have Platform Superadmin privileges. Please log in with a superadmin account.
          </p>
          <button
            onClick={() => signOut()}
            className="w-full h-11 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-lg active:scale-[0.98] transition-all"
          >
            Sign Out & Try Again
          </button>
          <a href="/" className="block text-xs font-bold text-slate-500 hover:text-slate-700 pt-2 border-t border-slate-100 dark:border-slate-800">
            Back to Home Page
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 animate-fade-in">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-955/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto text-indigo-500">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 font-heading">Platform Superadmin</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Access the main company platform management dashboard.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-550/10 text-red-600 dark:text-red-400 text-xs font-semibold p-3.5 rounded-xl border border-red-100 dark:border-red-955/20">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Superadmin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-50 text-xs font-bold rounded-xl focus:outline-none"
              placeholder="superadmin@escrowbms.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-50 text-xs font-bold rounded-xl focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={signInLoading}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {signInLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign In as Superadmin
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-850">
          <a href="/" className="text-xs font-bold text-slate-500 hover:text-slate-700">
            Back to Home Page
          </a>
        </div>
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <CurrencyProvider>
              <AdminProvider>
                <AdminAuthProvider>
                  <LanguageProvider>
                    <SubscriptionProvider>
                      <Routes>
                        {/* Public Landing Page */}
                        <Route path="/" element={<Landing />} />

                        {/* Auth */}
                        <Route
                          path="/auth"
                          element={
                            <PublicOnlyGuard>
                              <Auth />
                            </PublicOnlyGuard>
                          }
                        />

                        {/* Protected Core Routes */}
                        <Route
                          path="/dashboard"
                          element={
                            <AuthGuard>
                              <Dashboard />
                            </AuthGuard>
                          }
                        />

                        <Route
                          path="/pricing"
                          element={
                            <AuthGuard>
                              <Pricing />
                            </AuthGuard>
                          }
                        />

                        <Route
                          path="/settings"
                          element={
                            <AuthGuard>
                              <Settings />
                            </AuthGuard>
                          }
                        />

                        {/* Protected Module Routes */}
                        <Route
                          path="/payroll/*"
                          element={
                            <ModuleGuard moduleKey="payroll">
                              <PayrollModule />
                            </ModuleGuard>
                          }
                        />

                        <Route
                          path="/ledger/*"
                          element={
                            <ModuleGuard moduleKey="ledger">
                              <LedgerModule />
                            </ModuleGuard>
                          }
                        />

                        <Route
                          path="/billing/*"
                          element={
                            <ModuleGuard moduleKey="billing">
                              <BillingModule />
                            </ModuleGuard>
                          }
                        />

                        <Route
                          path="/calculation/*"
                          element={
                            <ModuleGuard moduleKey="hisab">
                              <HisabModule />
                            </ModuleGuard>
                          }
                        />

                        <Route
                          path="/inventory/*"
                          element={
                            <ModuleGuard moduleKey="inventory">
                              <InventoryModule />
                            </ModuleGuard>
                          }
                        />

                        <Route
                          path="/crm/*"
                          element={
                            <ModuleGuard moduleKey="crm">
                              <CrmModule />
                            </ModuleGuard>
                          }
                        />

                        {/* Platform Owner Dashboard */}
                        <Route
                          path="/workspace-admin"
                          element={
                            <AuthGuard>
                              <ClientAdminDashboard />
                            </AuthGuard>
                          }
                        />

                        {/* Dynamic Redirects for conflicting absolute paths in modules */}
                        <Route path="/products" element={<DynamicProductsRedirect />} />
                        <Route path="/settings" element={<DynamicSettingsRedirect />} />
                        <Route path="/reports" element={<DynamicReportsRedirect />} />
                        <Route path="/history" element={<DynamicHistoryRedirect />} />
                        <Route path="/admin" element={<SuperadminLogin />} />
                        <Route path="/admin/dashboard" element={<SuperadminLogin />} />

                        {/* Static Redirects to prevent broken links from absolute routing in sub-modules */}
                        <Route path="/invoices" element={<Navigate to="/billing/invoices" replace />} />
                        <Route path="/invoices/:invoiceId/edit" element={<Navigate to="/billing/invoices/:invoiceId/edit" replace />} />
                        <Route path="/create-invoice" element={<Navigate to="/billing/create-invoice" replace />} />
                        <Route path="/clients" element={<Navigate to="/billing/clients" replace />} />
                        <Route path="/vendors" element={<Navigate to="/billing/vendors" replace />} />
                        <Route path="/purchase-invoices" element={<Navigate to="/billing/purchase-invoices" replace />} />
                        <Route path="/expenses" element={<Navigate to="/billing/expenses" replace />} />
                        <Route path="/payments" element={<Navigate to="/billing/payments" replace />} />
                        <Route path="/e-invoice" element={<Navigate to="/billing/e-invoice" replace />} />

                        <Route path="/employees" element={<Navigate to="/payroll/employees" replace />} />
                        <Route path="/payroll" element={<Navigate to="/payroll/payroll" replace />} />
                        <Route path="/attendance" element={<Navigate to="/payroll/attendance" replace />} />
                        <Route path="/leave" element={<Navigate to="/payroll/leave" replace />} />
                        <Route path="/payslips" element={<Navigate to="/payroll/payslips" replace />} />

                        <Route path="/ledger" element={<Navigate to="/ledger/ledger" replace />} />
                        <Route path="/transfer" element={<Navigate to="/ledger/transfer" replace />} />
                        <Route path="/create/party" element={<Navigate to="/ledger/create/party" replace />} />
                        <Route path="/profile" element={<Navigate to="/ledger/profile" replace />} />
                        <Route path="/configure/company" element={<Navigate to="/ledger/configure/company" replace />} />
                        <Route path="/reports/balance-sheet" element={<Navigate to="/ledger/reports/balance-sheet" replace />} />
                        <Route path="/reports/profit-loss" element={<Navigate to="/ledger/reports/profit-loss" replace />} />
                        <Route path="/reports/parties" element={<Navigate to="/ledger/reports/parties" replace />} />
                        <Route path="/reports/transactions" element={<Navigate to="/ledger/reports/transactions" replace />} />

                        <Route path="/scan" element={<Navigate to="/inventory/scan" replace />} />
                        <Route path="/users" element={<Navigate to="/inventory/users" replace />} />

                        <Route path="/leads" element={<Navigate to="/crm/leads" replace />} />
                        <Route path="/contacts" element={<Navigate to="/crm/contacts" replace />} />
                        <Route path="/tasks" element={<Navigate to="/crm/tasks" replace />} />
                        <Route path="/analytics" element={<Navigate to="/crm/analytics" replace />} />
                        <Route path="/team" element={<Navigate to="/crm/team" replace />} />

                        <Route path="/hisab" element={<Navigate to="/calculation" replace />} />
                        <Route path="/hisab/*" element={<Navigate to="/calculation" replace />} />

                        {/* Catch-all */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                      <Toaster position="top-right" richColors />
                    </SubscriptionProvider>
                  </LanguageProvider>
                </AdminAuthProvider>
              </AdminProvider>
            </CurrencyProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
