import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { createStaffAccount } from "@/utils/staffAuth";
import BrandLogo from "@/components/BrandLogo";
import Auth3DShowcase from "@/components/auth/Auth3DShowcase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountryPhoneInput } from "@/components/ui/CountryPhoneInput";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Building2,
  Phone,
  Mail,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Send,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "login" | "signup" | "forgot" | "sent" | "update-password";

interface AuthProps {
  defaultTab?: Tab;
}

const REMEMBER_ME_KEY = "escrow_remember_me_email";
const WHATSAPP_SUPPORT_PHONE = "919328028207";

const PLAN_DETAILS: Record<string, { name: string; price: string }> = {
  free: { name: "14-Day Free Trial", price: "₹0" },
  starter: { name: "Starter Plan", price: "₹999/mo" },
  growth: { name: "Growth Plan", price: "₹2,499/mo" },
  enterprise: { name: "Enterprise Plan", price: "₹4,999/mo" }
};

export default function Auth({ defaultTab }: AuthProps) {
  const { user, signIn, signUp, signInWithGoogle, resetPassword, updatePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState<Tab>(defaultTab || "login");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form inputs
  const [form, setForm] = useState({
    companyName: "",
    mobile: "",
    email: "",
    password: ""
  });

  // Password Reset / Update inputs
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const queryParams = new URLSearchParams(location.search);
  const planParam = queryParams.get("plan") || "";
  const modeParam = queryParams.get("mode") || "";

  // 1. Detect Password Recovery flow (URL query, hash, pathname or auth state change)
  useEffect(() => {
    const isRecoveryMode =
      defaultTab === "update-password" ||
      modeParam === "reset-password" ||
      location.pathname === "/reset-password" ||
      location.hash.includes("type=recovery");

    if (isRecoveryMode) {
      setTab("update-password");
      setError("");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setTab("update-password");
        setError("");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [defaultTab, modeParam, location]);

  // 2. Set initial email from rememberMe
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(REMEMBER_ME_KEY);
      if (savedEmail) {
        setForm((prev) => ({ ...prev, email: savedEmail }));
      }
    } catch { }
  }, []);

  // 3. Auto-switch to signup if mode=signup or a plan is chosen
  useEffect(() => {
    if (tab === "update-password" || tab === "sent") return;
    if (planParam || modeParam === "signup") {
      setTab("signup");
    }
  }, [planParam, modeParam]);

  // 4. Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // Password strength checker
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[!@#$%^&*]/.test(pwd)) score++;
    return score;
  };

  // ── 1. SIGN IN ACTION ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let { error: signInErr } = await signIn(form.email.trim(), form.password);

      // Self-healing check for newly added staff members whose Auth records were pending
      if (signInErr) {
        const cleanEmail = form.email.trim().toLowerCase();
        let staffRecord: any = null;

        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('escrow_company_staff_backup') || key.startsWith('escrow_employees_backup'))) {
              const stored = JSON.parse(localStorage.getItem(key) || '[]');
              const match = stored.find((s: any) => s.email?.toLowerCase() === cleanEmail);
              if (match) {
                staffRecord = match;
                break;
              }
            }
          }
        } catch { }

        if (staffRecord) {
          try {
            await createStaffAccount({
              email: cleanEmail,
              password: form.password,
              fullName: staffRecord.name || 'Staff Member',
              phone: staffRecord.phone || '',
              role: staffRecord.role || 'Staff',
              modules: staffRecord.allowed_modules || ['billing', 'ledger', 'inventory', 'hisab'],
              ownerId: staffRecord.company_owner_id || staffRecord.user_id,
              companyId: staffRecord.company_id || 'COMPANY',
              companyName: 'Escrow BMS'
            });

            // Re-attempt sign in with the freshly activated credentials
            const retryRes = await signIn(form.email.trim(), form.password);
            signInErr = retryRes.error;
          } catch (healErr) {
            console.warn('Auto-heal staff auth attempt:', healErr);
          }
        }
      }

      if (signInErr) {
        setError("Invalid email or password. Please verify credentials.");
        toast.error("Sign in failed", {
          description: signInErr.message || "Invalid credentials."
        });
      } else {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, form.email.trim());
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
        }
        toast.success("Welcome back!");

        // Determine destination based on staff role & module permissions
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const userMeta = session?.user?.user_metadata || {};
          const isStaff = userMeta.is_staff || !!userMeta.parent_user_id;
          const staffRole = userMeta.staff_role || userMeta.role;
          const allowedModules: string[] = userMeta.allowed_modules || userMeta.permissions || [];

          if (isStaff && staffRole !== 'Admin' && staffRole !== 'Manager') {
            const modulePriority = ['crm', 'billing', 'ledger', 'inventory', 'hisab', 'payroll'];
            const targetMod = modulePriority.find(m => allowedModules.includes(m)) || allowedModules[0];
            if (targetMod === 'crm') {
              navigate("/crm");
              return;
            } else if (targetMod === 'billing') {
              navigate("/billing");
              return;
            } else if (targetMod === 'ledger') {
              navigate("/ledger");
              return;
            } else if (targetMod === 'inventory') {
              navigate("/inventory");
              return;
            } else if (targetMod === 'hisab') {
              navigate("/calculation");
              return;
            } else if (targetMod === 'payroll') {
              navigate("/payroll");
              return;
            } else {
              navigate("/my-profile");
              return;
            }
          }
        } catch (e) {
          console.warn('Auth post-login route resolution fallback:', e);
        }

        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  // ── 2. CREATE ACCOUNT ACTION ──
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) {
      setError("Please enter your company or business name.");
      return;
    }
    if (!form.email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    const targetPlan = planParam || "free";

    try {
      const { error: signUpErr } = await signUp(
        form.email.trim(),
        form.password,
        form.companyName.trim(),
        form.companyName.trim()
      );

      if (signUpErr) {
        setError(signUpErr.message || "Registration failed. Please try again.");
        toast.error("Registration failed", { description: signUpErr.message });
        setLoading(false);
        return;
      }

      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, form.email.trim());
      }

      // Automatically sign in after registration
      const { error: loginErr } = await signIn(form.email.trim(), form.password);
      if (!loginErr) {
        const { data: userSession } = await supabase.auth.getSession();
        if (userSession?.session?.user) {
          try {
            await supabase
              .from("profiles")
              .update({
                plan_type: targetPlan,
                company_name: form.companyName.trim(),
                phone: form.mobile.trim() || undefined
              } as any)
              .eq("id", userSession.session.user.id);
          } catch (err) {
            console.warn("Could not sync profile attributes:", err);
          }
        }
        toast.success("Account created successfully!");
        navigate("/dashboard");
      } else {
        setTab("login");
        toast.success("Account created! Please sign in.");
      }
    } catch (err: any) {
      setError(err?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── 3. GOOGLE SIGN IN ──
  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      const { error: googleErr } = await signInWithGoogle();
      if (googleErr) {
        setError(googleErr.message || "Google sign-in could not be completed.");
        toast.error("Google Sign-In failed", { description: googleErr.message });
      }
    } catch (err: any) {
      setError(err?.message || "Google sign-in error.");
    } finally {
      setLoading(false);
    }
  };

  // ── 4. FORGOT PASSWORD (SEND RESET EMAIL) ──
  const handleForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 7-second timeout race to guarantee fast feedback and prevent hanging
      const resetPromise = resetPassword(form.email.trim());
      const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out. Please try again.")), 7000)
      );

      const result = await Promise.race([resetPromise, timeoutPromise]) as { error: Error | null };

      if (result.error) {
        setError(result.error.message || "Could not send reset link. Please verify email.");
        toast.error("Reset Failed", { description: result.error.message });
      } else {
        toast.success("Password reset link sent to your email!");
        setTab("sent");
        setResendCooldown(30);
      }
    } catch (err: any) {
      setError(err?.message || "Error sending password reset link. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── 5. SET NEW PASSWORD ACTION ──
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: updateErr } = await updatePassword(newPassword.trim());
      if (updateErr) {
        setError(updateErr.message || "Could not update password. Please request a new reset link.");
        toast.error("Update Failed", { description: updateErr.message });
      } else {
        toast.success("Password updated successfully! Welcome to your dashboard.");
        setTimeout(() => {
          navigate("/dashboard");
        }, 600);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const signupStrength = getPasswordStrength(form.password);
  const resetStrength = getPasswordStrength(newPassword);

  return (
    <>
      <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-500 selection:text-white">

        {/* ── LEFT PANEL: 3D ISOMETRIC INTERACTIVE SERVICE SHOWCASE ── */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-[54%] relative shrink-0">
          <Auth3DShowcase
            currentSlide={currentSlide}
            onSelectSlide={(idx) => setCurrentSlide(idx)}
          />
        </div>

        {/* ── RIGHT PANEL: AUTHENTICATION FORM SIDE ── */}
        <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 lg:p-10 xl:p-14 overflow-y-auto min-h-screen">

          {/* Top Bar: Back to Home & Active User Indicator */}
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>Back to Home</span>
              </Link>
              {user && (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Go to Dashboard →
                </button>
              )}
            </div>
            {user && (
              <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
                <div className="text-slate-600 dark:text-slate-300">
                  <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">Signed in as</span>
                  <span className="font-bold text-slate-800 dark:text-white">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-sm transition-all"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.reload();
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg font-bold text-[11px] transition-all"
                  >
                    Switch
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Content Center Container */}
          <div className="w-full max-w-md mx-auto my-auto py-4">

            {/* Header: Logo & Greeting Subtitle */}
            <div className="text-center mb-6 space-y-2">
              <div className="flex justify-center">
                <BrandLogo size="lg" asLink to="/" className="justify-center" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {tab === "login" && "Welcome back! Please enter your details."}
                {tab === "signup" && "Join us and start your journey today."}
                {tab === "forgot" && "Reset your account password in seconds."}
                {tab === "sent" && "Check your inbox for the reset link."}
                {tab === "update-password" && "Enter your new secure password below."}
              </p>
            </div>

            {/* Plan Badge if coming from Pricing page */}
            {planParam && PLAN_DETAILS[planParam] && tab === "signup" && (
              <div className="mb-4 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Subscribing to {PLAN_DETAILS[planParam].name}</span>
                </div>
                <span className="font-black text-indigo-700 dark:text-indigo-400 font-mono">
                  {PLAN_DETAILS[planParam].price}
                </span>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* The Main Authentication Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">

              {/* Card Title */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {tab === "login" && "Sign In"}
                  {tab === "signup" && "Create Account"}
                  {tab === "forgot" && "Forgot Password"}
                  {tab === "sent" && "Reset Link Sent"}
                  {tab === "update-password" && "Set New Password"}
                </h2>
              </div>

              {/* ── 1. SIGN IN FORM ── */}
              {tab === "login" && (
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Email
                    </Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={handleChange}
                      className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 font-medium"
                      autoComplete="username"
                    />
                  </div>

                  {/* Password with Eye Toggle */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={() => { setTab("forgot"); setError(""); }}
                        className="text-xs font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={handleChange}
                        className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 pr-10 font-medium"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center space-x-2 pt-1">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(!!checked)}
                      className="data-[state=checked]:bg-[#1a73e8] data-[state=checked]:border-[#1a73e8]"
                    />
                    <label
                      htmlFor="remember"
                      className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer select-none"
                    >
                      Remember me
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-[#1a73e8] hover:bg-[#1557b0] active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                  </button>
                </form>
              )}

              {/* ── 2. CREATE ACCOUNT FORM ── */}
              {tab === "signup" && (
                <form onSubmit={handleSignup} className="space-y-3.5">
                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="companyName" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Company Name
                    </Label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="companyName"
                        name="companyName"
                        required
                        placeholder="Your Company Name"
                        value={form.companyName}
                        onChange={handleChange}
                        className="h-11 pl-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 font-medium"
                      />
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-1.5">
                    <Label htmlFor="mobile" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Mobile Number
                    </Label>
                    <CountryPhoneInput
                      id="mobile"
                      name="mobile"
                      value={form.mobile}
                      onChange={(val) => setForm({ ...form, mobile: val })}
                      placeholder="Enter mobile number"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={handleChange}
                      className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 font-medium"
                      autoComplete="username"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Create strong password"
                        value={form.password}
                        onChange={handleChange}
                        className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 pr-10 font-medium"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Bars */}
                    {form.password && (
                      <div className="space-y-1 pt-1">
                        <div className="grid grid-cols-4 gap-1">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-1 rounded-full transition-all ${signupStrength >= step
                                ? signupStrength <= 2
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                                : "bg-slate-200 dark:bg-slate-700"
                                }`}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          {signupStrength <= 2 ? "Password should be stronger" : "Strong password"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-[#1a73e8] hover:bg-[#1557b0] active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                  </button>
                </form>
              )}

              {/* ── 3. FORGOT PASSWORD FORM ── */}
              {tab === "forgot" && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-900 dark:text-blue-300 leading-relaxed font-medium">
                    Enter your registered email address and we'll instantly send you a secure link to reset your password.
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Registered Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="forgot-email"
                        name="email"
                        type="email"
                        required
                        placeholder="your@email.com"
                        value={form.email}
                        onChange={handleChange}
                        className="h-11 pl-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 font-medium"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-[#1a73e8] hover:bg-[#1557b0] active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Reset Link...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Reset Link Instantly</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => { setTab("login"); setError(""); }}
                      className="font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
                    >
                      ← Back to Sign In
                    </button>
                    <a
                      href={`https://wa.me/${WHATSAPP_SUPPORT_PHONE}?text=${encodeURIComponent("Hello Escrow BMS Support, I need help resetting my password.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Help</span>
                    </a>
                  </div>
                </form>
              )}

              {/* ── 4. RESET LINK SENT CONFIRMATION ── */}
              {tab === "sent" && (
                <div className="space-y-5 text-center py-2 animate-in fade-in duration-200">
                  <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Email Sent!</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                      We have sent password reset instructions to:
                    </p>
                    <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 py-1.5 px-3 rounded-lg max-w-xs mx-auto break-all">
                      {form.email}
                    </p>
                    <p className="text-[11px] text-slate-500 pt-1">
                      Click the link in the email to set your new password. (Check your Spam/Junk folder if not in Inbox).
                    </p>
                  </div>

                  <div className="pt-2 space-y-2.5">
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || loading}
                      onClick={() => handleForgotPassword()}
                      className="w-full h-10 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                      <span>
                        {resendCooldown > 0 ? `Resend Link in ${resendCooldown}s` : "Resend Email"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setTab("login"); setError(""); }}
                      className="w-full text-center text-xs font-bold text-blue-600 hover:underline py-1 cursor-pointer"
                    >
                      ← Back to Sign In
                    </button>
                  </div>

                  {/* Immediate WhatsApp backup option */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                    Did not receive email?{" "}
                    <a
                      href={`https://wa.me/${WHATSAPP_SUPPORT_PHONE}?text=${encodeURIComponent(`Hello Escrow BMS Support, I tried resetting password for email: ${form.email}. Please assist.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    >
                      Connect on WhatsApp
                    </a>
                  </div>
                </div>
              )}

              {/* ── 5. SET NEW PASSWORD (RECOVERY FORM) ── */}
              {tab === "update-password" && (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-300 font-medium">
                    Verified! Please enter your new password to restore account access.
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        required
                        placeholder="Enter new password (min. 6 characters)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 pr-10 font-medium"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Strength indicator */}
                    {newPassword && (
                      <div className="space-y-1 pt-1">
                        <div className="grid grid-cols-4 gap-1">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-1 rounded-full transition-all ${resetStrength >= step
                                ? resetStrength <= 2
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                                : "bg-slate-200 dark:bg-slate-700"
                                }`}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          {resetStrength <= 2 ? "Moderate" : "Strong password"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 pr-10 font-medium"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Update Password &amp; Sign In</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setTab("login"); setError(""); }}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                    >
                      ← Return to Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* ── OR CONTINUE WITH DIVIDER (FOR LOGIN & SIGNUP ONLY) ── */}
              {(tab === "login" || tab === "signup") && (
                <div className="mt-6">
                  <div className="relative mb-5">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                      <span className="bg-white dark:bg-slate-900 px-3 text-slate-400">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  {/* Google OAuth Button */}
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={loading}
                    className="w-full h-11 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>{tab === "login" ? "Continue with Google" : "Sign up with Google"}</span>
                  </button>

                  {/* Switcher Toggle (Create Account / Sign In) */}
                  <div className="mt-6 text-center space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {tab === "login" ? "Don't have an account?" : "Already have an account?"}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTab(tab === "login" ? "signup" : "login");
                        setError("");
                      }}
                      className="w-full h-11 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all shadow-sm active:scale-[0.99] cursor-pointer"
                    >
                      {tab === "login" ? "Create an account" : "Sign in to account"}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Bottom Legal Disclaimer */}
          <div className="text-center pt-6 pb-2 text-[11px] text-slate-400 dark:text-slate-500">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="text-slate-700 dark:text-slate-300 font-semibold hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy-policy" className="text-slate-700 dark:text-slate-300 font-semibold hover:underline">
              Privacy Policy
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
