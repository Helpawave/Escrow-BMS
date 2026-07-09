import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { LogIn, Loader2, Check, Eye, EyeOff } from "lucide-react";

const highlights = [
  {
    title: "Escrow-protected payroll",
    description: "Fund payroll in advance, lock runs, and release payments with full visibility.",
  },
  {
    title: "Attendance & leave",
    description: "Track check-ins, hours, and approvals in one workflow tied to pay.",
  },
  {
    title: "Payslips & compliance",
    description: "PF, tax, and ESI line items with exports and audit-ready history.",
  },
  {
    title: "Reports & insights",
    description: "Department costs, payroll trends, and compliance snapshots at a glance.",
  },
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error("Login failed", { description: error.message });
    } else {
      toast.success("Welcome back!");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Mobile: short brand strip (full panel is lg+) */}
      <div
        className="lg:hidden shrink-0 px-6 py-8 text-center text-white"
        style={{ backgroundColor: "#0a0b14" }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-2">Escoroll</p>
        <p className="text-lg font-bold tracking-tight">Escrow payroll made simple.</p>
        <p className="mt-2 text-sm text-white/60 max-w-md mx-auto">
          Secure runs, attendance, and payslips in one workspace.
        </p>
      </div>

      {/* Left: promotional panel */}
      <aside
        className="relative hidden lg:flex lg:w-1/2 flex-col justify-center px-10 xl:px-16 py-14 overflow-hidden text-white"
        style={{ backgroundColor: "#0a0b14" }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-[#3b2f6b]/35 blur-[100px]" />
          <div className="absolute top-1/3 -right-20 h-[380px] w-[380px] rounded-full bg-[#1e3a5f]/40 blur-[90px]" />
          <div className="absolute bottom-0 left-1/4 h-[280px] w-[500px] rounded-[100%] border border-white/[0.06] opacity-60" />
          <div className="absolute bottom-24 -left-16 h-[200px] w-[400px] rounded-[100%] border border-indigo-400/10" />
        </div>

        <div className="relative z-10 max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-4">
            Escoroll
          </p>
          <h1 className="text-4xl xl:text-[2.75rem] font-bold tracking-tight leading-[1.15] mb-5">
            Escrow payroll made simple.
          </h1>
          <p className="text-base text-white/65 leading-relaxed mb-10">
            Run payroll with funds held securely in escrow, align attendance and leave with payouts,
            and give your team clarity—from draft runs to paid.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-sm transition-colors hover:bg-white/[0.06]"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(221.2,83.2%,53.3%)] shadow-lg shadow-blue-500/20">
                  <Check className="h-4 w-4 text-white stroke-[3]" aria-hidden />
                </div>
                <h2 className="text-sm font-semibold text-white mb-1.5 leading-snug">{item.title}</h2>
                <p className="text-xs text-white/55 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Right: sign in */}
      <main className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:w-1/2 lg:px-12 xl:px-20">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-primary">
              <img src="/public/icon.png" alt="" className="h-7 w-7 object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight">ESCOROLL</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-1">Sign in</h2>
          <p className="text-sm text-muted-foreground mb-8">Use your work email and password.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => toast.info("Contact your admin to reset your password.")}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
              />
              <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                Remember me
              </label>
            </div>

            <Button type="submit" className="w-full h-11 gap-2 font-semibold" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Sign In
            </Button>

            <p className="text-center text-sm text-muted-foreground pt-2">
              New company?{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => navigate("/register")}
              >
                Register here
              </button>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
