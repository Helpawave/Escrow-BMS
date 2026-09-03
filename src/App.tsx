import React, { Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UserSettingsProvider } from '@/contexts/UserSettingsContext';
import { AuthGuard, PublicOnlyGuard } from '@/components/guards/AuthGuard';
import { ModuleGuard } from '@/components/guards/ModuleGuard';
import { Toaster } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock, ShieldAlert } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

// Lazy-loaded core pages
const Auth = React.lazy(() => import('@/pages/Auth'));
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Landing = React.lazy(() => import('@/pages/Landing'));
import { CommandPalette } from '@/components/CommandPalette';

// Lazy-loaded secondary pages & sub-modules
const Pricing = React.lazy(() => import('@/pages/Pricing'));
const Settings = React.lazy(() => import('@/pages/Settings'));
const AboutUs = React.lazy(() => import('@/pages/AboutUs'));
const ContactUs = React.lazy(() => import('@/pages/ContactUs'));
const PrivacyPolicy = React.lazy(() => import('@/pages/PrivacyPolicy'));
const TermsAndConditions = React.lazy(() => import('@/pages/TermsAndConditions'));
const RefundPolicy = React.lazy(() => import('@/pages/RefundPolicy'));
const SuperadminDashboard = React.lazy(() => import('@/pages/bill/AdminDashboard'));
const ClientAdminDashboard = React.lazy(() => import('@/pages/ClientAdminDashboard'));

const PayrollModule = React.lazy(() => import('@/pages/modules').then(m => ({ default: m.PayrollModule })));
const LedgerModule = React.lazy(() => import('@/pages/modules').then(m => ({ default: m.LedgerModule })));
const BillingModule = React.lazy(() => import('@/pages/modules').then(m => ({ default: m.BillingModule })));
const HisabModule = React.lazy(() => import('@/pages/modules').then(m => ({ default: m.HisabModule })));
const InventoryModule = React.lazy(() => import('@/pages/modules').then(m => ({ default: m.InventoryModule })));
const CrmModule = React.lazy(() => import('@/pages/modules').then(m => ({ default: m.CrmModule })));
const UsersPage = React.lazy(() => import('@/pages/users/UsersPage'));
const MembersPage = React.lazy(() => import('@/pages/users/MembersPage'));
const AddStaffPage = React.lazy(() => import('@/pages/users/AddStaffPage'));
const MyProfilePage = React.lazy(() => import('@/pages/MyProfilePage'));
const ReportsPage = React.lazy(() => import('@/pages/ReportsPage'));

function PageFallback() {
  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-indigo-600 animate-pulse z-[9999]" />
  );
}

// Dynamic Redirect helper components
function DynamicProductsRedirect() {
  const lastApp = localStorage.getItem('last_active_app') || 'billing';
  const target = lastApp === 'inventory' ? '/inventory/products' : '/billing/products';
  return <Navigate to={target} replace />;
}

function DynamicCreateInvoiceRedirect() {
  const location = useLocation();
  return <Navigate to={`/billing/create-invoice${location.search}`} replace />;
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
        // Fallback: Attempt sign up if account doesn't exist yet
        const { error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: 'Platform Superadmin' }
          }
        });
        if (signUpErr) {
          setError(signInErr.message || 'Invalid credentials. Please verify your password.');
        }
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
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 font-heading">Switch to Platform Superadmin</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            You are currently signed in with a company account (<strong>{user.email}</strong>). The Platform Superadmin panel is reserved exclusively for the platform owner.
          </p>
          <button
            onClick={async () => {
              await signOut();
            }}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            Log Out & Sign In as Superadmin
          </button>
          <a href="/dashboard" className="block text-xs font-bold text-slate-500 hover:text-slate-700 pt-2 border-t border-slate-100 dark:border-slate-800">
            ← Return to Company Dashboard
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
              autoComplete="username"
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
              autoComplete="current-password"
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
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes in-memory cache across tab switches
      gcTime: 1000 * 60 * 30, // 30 minutes garbage collection time
      refetchOnWindowFocus: false, // Prevent background refetch loaders on window focus
      refetchOnReconnect: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <UserSettingsProvider>
            <ThemeProvider>
              <CurrencyProvider>
              <AdminProvider>
                <AdminAuthProvider>
                  <LanguageProvider>
                    <SubscriptionProvider>
                      <Suspense fallback={<PageFallback />}>
                        <Routes>
                          {/* Public Landing Page & Company/Legal Pages */}
                          <Route path="/" element={<Landing />} />
                          <Route path="/pricing" element={<Pricing />} />
                          <Route path="/about" element={<AboutUs />} />
                          <Route path="/contact" element={<ContactUs />} />
                          <Route path="/privacy" element={<PrivacyPolicy />} />
                          <Route path="/terms" element={<TermsAndConditions />} />
                          <Route path="/refund" element={<RefundPolicy />} />

                          {/* Auth */}
                          <Route
                            path="/auth"
                            element={
                              <PublicOnlyGuard>
                                <Auth />
                              </PublicOnlyGuard>
                            }
                          />

                          {/* Protected Core Routes wrapped in single persistent AppLayout */}
                          <Route
                            element={
                              <AuthGuard>
                                <AppLayout />
                              </AuthGuard>
                            }
                          >
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/users" element={<UsersPage />} />
                            <Route path="/members" element={<MembersPage />} />
                            <Route path="/members/add-staff" element={<AddStaffPage />} />
                            <Route path="/reports" element={<ReportsPage />} />
                            <Route path="/teams" element={<MembersPage />} />
                            <Route path="/teams/add-staff" element={<AddStaffPage />} />
                            <Route path="/my-profile" element={<MyProfilePage />} />

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
                            <Route path="/workspace-admin" element={<ClientAdminDashboard />} />
                          </Route>

                          <Route
                            path="/clients"
                            element={<Navigate to="/billing/clients" replace />}
                          />

                          <Route
                            path="/vendors"
                            element={<Navigate to="/billing/vendors" replace />}
                          />

                          <Route
                            path="/employees"
                            element={<Navigate to="/payroll/employees" replace />}
                          />
                          <Route path="/reports" element={<DynamicReportsRedirect />} />
                          <Route path="/history" element={<DynamicHistoryRedirect />} />
                          <Route path="/admin" element={<SuperadminLogin />} />
                          <Route path="/admin/dashboard" element={<SuperadminLogin />} />
                          <Route path="/superadmin" element={<Navigate to="/admin" replace />} />

                          {/* Static Redirects to prevent broken links from absolute routing in sub-modules */}
                          <Route path="/invoices" element={<Navigate to="/billing/invoices" replace />} />
                          <Route path="/invoices/:invoiceId/edit" element={<Navigate to="/billing/invoices/:invoiceId/edit" replace />} />
                          <Route path="/create-invoice" element={<DynamicCreateInvoiceRedirect />} />
                          <Route path="/quotations" element={<Navigate to="/billing/quotations" replace />} />
                          <Route path="/ledger-bills" element={<Navigate to="/billing/ledger-bills" replace />} />
                          <Route path="/clients" element={<Navigate to="/billing/clients" replace />} />
                          <Route path="/vendors" element={<Navigate to="/billing/vendors" replace />} />
                          <Route path="/purchase-invoices" element={<Navigate to="/billing/purchase-invoices" replace />} />
                          <Route path="/expenses" element={<Navigate to="/billing/expenses" replace />} />
                          <Route path="/payments" element={<Navigate to="/billing/payments" replace />} />
                          <Route path="/e-invoice" element={<Navigate to="/billing/e-invoice" replace />} />

                          <Route path="/products" element={<Navigate to="/inventory/products" replace />} />
                          <Route path="/products/new" element={<Navigate to="/inventory/products/new" replace />} />
                          <Route path="/add-product" element={<Navigate to="/inventory/products/new" replace />} />
                          <Route path="/inventory/add-product" element={<Navigate to="/inventory/products/new" replace />} />

                          <Route path="/employees" element={<Navigate to="/payroll/employees" replace />} />
                          <Route path="/salary" element={<Navigate to="/payroll/payroll" replace />} />
                          <Route path="/attendance" element={<Navigate to="/payroll/attendance" replace />} />
                          <Route path="/leave" element={<Navigate to="/payroll/leave" replace />} />
                          <Route path="/payslips" element={<Navigate to="/payroll/payslips" replace />} />

                          <Route path="/transfer" element={<Navigate to="/ledger/transfer" replace />} />
                          <Route path="/create/party" element={<Navigate to="/billing/clients" replace />} />
                          <Route path="/profile" element={<Navigate to="/settings?tab=profile" replace />} />
                          <Route path="/configure/company" element={<Navigate to="/settings?tab=business" replace />} />
                          <Route path="/reports/balance-sheet" element={<Navigate to="/ledger/reports/balance-sheet" replace />} />
                          <Route path="/reports/profit-loss" element={<Navigate to="/ledger/reports/profit-loss" replace />} />
                          <Route path="/reports/parties" element={<Navigate to="/ledger/reports/parties" replace />} />
                          <Route path="/reports/transactions" element={<Navigate to="/ledger/reports/transactions" replace />} />

                          <Route path="/scan" element={<Navigate to="/inventory/scan" replace />} />

                          <Route path="/leads" element={<Navigate to="/crm/leads" replace />} />
                          <Route path="/contacts" element={<Navigate to="/crm/contacts" replace />} />
                          <Route path="/tasks" element={<Navigate to="/crm/tasks" replace />} />
                          <Route path="/analytics" element={<Navigate to="/crm/analytics" replace />} />
                          <Route path="/team" element={<Navigate to="/crm/team" replace />} />

                          <Route path="/hisab" element={<Navigate to="/calculation" replace />} />
                          <Route path="/hisab/*" element={<Navigate to="/calculation" replace />} />

                          {/* Login redirect - some modules still use /login, redirect to /auth */}
                          <Route path="/login" element={<Navigate to="/auth" replace />} />
                          <Route path="/register" element={<Navigate to="/auth" replace />} />

                          {/* Catch-all */}
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </Suspense>
                      <Toaster position="top-right" richColors />
                      <CommandPalette />
                    </SubscriptionProvider>
                  </LanguageProvider>
                </AdminAuthProvider>
              </AdminProvider>
            </CurrencyProvider>
          </ThemeProvider>
        </UserSettingsProvider>
      </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
