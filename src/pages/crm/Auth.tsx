import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCrm } from '@/contexts/CrmContext';
import {
  Mail,
  Lock,
  User,
  Briefcase,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export const Auth: React.FC = () => {
  const { login, signup } = useAuth();
  const { triggerToast } = useCrm();

  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<string>('Sales Agent');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Auto-fill demo credentials helper
  const handleUseDemo = () => {
    setEmail('john@example.com');
    setPassword('password123');
    setIsLogin(true);
    setError('');
  };

  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    // Input Validations
    if (!cleanEmail || !cleanPassword) {
      setError('Please fill in all credentials fields.');
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (cleanPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!isLogin && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const success = await login(cleanEmail, cleanPassword);
        if (success) {
          triggerToast('Welcome back, ' + cleanEmail + '!', 'success');
        } else {
          setError('Invalid email address or password.');
          triggerToast('Authentication failed.', 'error');
        }
      } else {
        const success = await signup(name.trim(), cleanEmail, cleanPassword, role);
        if (success) {
          triggerToast('Account registered successfully!', 'success');
        } else {
          setError('An account with this email address already exists.');
          triggerToast('Registration failed.', 'error');
        }
      }
    } catch (err) {
      setError('An error occurred during authentication.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b0f19] relative overflow-hidden transition-colors duration-300">
      {/* Decorative Gradient Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-[460px] p-6 z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-lg shadow-slate-200/60 dark:shadow-slate-900/60 mb-3 overflow-hidden border border-slate-100 dark:border-slate-700">
            <img src="/logo.png" alt="Escrow CRM" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-3xl font-black font-heading text-slate-800 dark:text-white tracking-tight">
            Escrow CRM
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Enterprise Client & Relationship Management Portal
          </p>
        </div>

        {/* Auth Glass Card */}
        <div className="glass-panel border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xl overflow-hidden bg-white/70 dark:bg-[#111827]/70 backdrop-blur-xl">
          {/* Tabs header */}
          <div className="flex border-b border-slate-200 dark:border-slate-800/60 p-2 bg-slate-100/50 dark:bg-slate-950/20">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-3 text-center text-sm font-semibold rounded-2xl transition-all cursor-pointer ${
                isLogin
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm border border-slate-200/30 dark:border-slate-700/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-3 text-center text-sm font-semibold rounded-2xl transition-all cursor-pointer ${
                !isLogin
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm border border-slate-200/30 dark:border-slate-700/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Register Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs rounded-xl animate-fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="leading-normal">{error}</span>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10.5 pr-4 py-3 border border-slate-250 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10.5 pr-4 py-3 border border-slate-250 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    onClick={() => triggerToast('Mock password reset triggered.', 'info')}
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10.5 pr-11 py-3 border border-slate-250 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer rounded-lg"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                  CRM Access Role
                </label>
                <div className="relative">
                  <Briefcase className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-10.5 pr-4 py-3 border border-slate-250 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-all font-medium appearance-none cursor-pointer"
                  >
                    <option value="Sales Agent">Sales Agent</option>
                    <option value="Sales Director">Sales Director</option>
                    <option value="CRM Manager">CRM Manager</option>
                    <option value="Data Analyst">Data Analyst</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In to Dashboard' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Footer */}
          {isLogin && (
            <div className="border-t border-slate-200 dark:border-slate-800/60 p-5 bg-slate-50/50 dark:bg-slate-950/10 text-center space-y-2">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Want to skip registration and test immediately?
              </span>
              <button
                type="button"
                onClick={handleUseDemo}
                className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-750 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                Use Demo Credentials
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Auth;
