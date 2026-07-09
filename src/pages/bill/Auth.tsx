import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

const REMEMBER_ME_EMAIL_KEY = 'escrow_remember_me_email';

const SLIDES = [
  { animation: "billing" },
  { animation: "invoicing" },
  { animation: "security" }
];

const STATIC_DETAILS = {
  title: "Professional Invoicing Made Simple.",
  description: "Generate professional GST invoices, manage inventory, and track payments in one place. Get paid 3x faster today.",
  features: [
    { title: "Smart Invoicing", desc: "Create professional invoices in seconds. Auto-save, templates, and currency support included." },
    { title: "Auto-Reminders", desc: "Set it and forget it. Automated email, SMS, and WhatsApp reminders." },
    { title: "Instant Payments", desc: "Accept UPI, Credit Cards, PayPal, and more directly from the invoice." },
    { title: "Financial Insights", desc: "Real-time dashboard to track revenue, outstanding payments, and taxes." }
  ]
};

const AnimatedBackground = ({ type }: { type: string }) => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950" style={{ perspective: "1200px" }}>
      {/* Shared moving gradient with type-specific colors */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 45, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className={cn(
          "absolute inset-0 transition-colors duration-1000",
          type === 'billing' ? "bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.2),transparent_60%)]" :
          type === 'invoicing' ? "bg-[radial-gradient(circle_at_70%_30%,rgba(139,92,246,0.2),transparent_60%)]" :
          "bg-[radial-gradient(circle_at_50%_70%,rgba(16,185,129,0.2),transparent_60%)]"
        )}
      />

      {type === 'billing' && (
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated Mesh Grid */}
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] [background-size:60px_60px] translate-z-[-100px]" />
          
          {/* Central 3D Rotating Ring */}
          <motion.div
            animate={{ 
              rotate: 360,
              rotateX: [60, 45, 60],
              z: [-50, 50, -50]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -right-20 top-1/2 -translate-y-1/2 w-[700px] h-[700px] border-[1.5px] border-blue-500/20 rounded-full"
            style={{ transformStyle: "preserve-3d" }}
          />
          
          {/* Pulsing Core Glow */}
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-10 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px]"
          />

          {/* Floating 3D Cards */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                y: 0, 
                opacity: 0, 
                x: (5 + i * 10) + "%",
                rotateX: -25,
                rotateY: 15,
                z: -150
              }}
              animate={{ 
                y: -600, 
                opacity: [0, 0.8, 0],
                rotateX: [ -30, 0, 30 ],
                rotateY: [ 10, -20, 10 ],
                z: [ -200, 150, -200 ],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{ 
                duration: 6 + Math.random() * 4, 
                repeat: Infinity, 
                delay: i * 0.5,
                ease: "linear"
              }}
              className="absolute w-24 h-32 bg-gradient-to-br from-blue-400/10 to-blue-600/5 rounded-xl border border-blue-400/30 backdrop-blur-xl shadow-[0_40px_80px_rgba(59,130,246,0.25)] flex flex-col p-4 gap-2"
              style={{ left: `${5 + i * 10}%`, top: '100%', transformStyle: "preserve-3d" }}
            >
              <div className="w-10 h-1.5 bg-blue-400/30 rounded-full" />
              <div className="w-16 h-1 bg-blue-400/10 rounded-full" />
              <div className="w-12 h-1 bg-blue-400/10 rounded-full" />
              <div className="mt-auto w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/20" />
            </motion.div>
          ))}
        </div>
      )}

      {type === 'invoicing' && (
        <div className="absolute inset-0">
          <motion.div
            animate={{ 
              rotate: 360,
              rotateX: [60, 45, 60],
              z: [-100, 50, -100]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -right-20 -top-20 w-[600px] h-[600px] border-2 border-purple-500/20 rounded-full"
            style={{ transformStyle: "preserve-3d" }}
          />
          <motion.div
            animate={{ 
              rotate: -360,
              rotateY: [45, 30, 45],
              z: [50, 150, 50]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -right-40 -top-40 w-[800px] h-[800px] border border-purple-400/10 rounded-full"
            style={{ transformStyle: "preserve-3d" }}
          />
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                x: [0, 150, 0],
                opacity: [0.2, 0.6, 0.2],
                scaleX: [1, 1.5, 1]
              }}
              transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay: i * 0.4 }}
              className="absolute h-[2px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent"
              style={{ left: '-10%', top: `${10 + i * 6}%`, width: '120%' }}
            />
          ))}
        </div>
      )}

      {type === 'security' && (
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 opacity-10"
            style={{ 
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }} 
          />
          <motion.div
            animate={{ 
              rotateY: [0, 360],
              rotateX: [30, -30, 30],
              scale: [0.95, 1.05, 0.95]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border-[3px] border-emerald-500/30 rounded-full flex items-center justify-center shadow-[0_0_100px_rgba(16,185,129,0.2)]"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="w-80 h-80 border-2 border-emerald-400/20 rounded-full animate-pulse" />
            <motion.div 
              animate={{ z: [0, 100, 0], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute w-40 h-40 bg-emerald-500/30 rounded-full blur-3xl" 
            />
          </motion.div>
          
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-emerald-500/10" />
          {[...Array(25)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [0, 1.5, 0],
                opacity: [0, 0.8, 0],
                z: [-50, 50, -50]
              }}
              transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: i * 0.2 }}
              className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)]"
              style={{ 
                left: `${10 + Math.random() * 80}%`, 
                top: `${10 + Math.random() * 80}%`,
                transformStyle: "preserve-3d"
              }}
            />
          ))}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

const AuthPage = () => {
  type AuthView = 'login' | 'signup' | 'forgot-password' | 'update-password';
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const { signIn, signInWithGoogle, signUp, signOut, resetPassword, updatePassword, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPublicSignupEnabled, setIsPublicSignupEnabled] = useState(true);

  useEffect(() => {
    const fetchSignupSetting = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'public_signups')
        .maybeSingle();
      
      const setting = data as unknown as { value: string | boolean } | null;
      if (setting) {
        setIsPublicSignupEnabled(setting.value === 'true' || setting.value === true);
      }
    };
    fetchSignupSetting();

    // Check for remembered email
    const savedEmail = localStorage.getItem(REMEMBER_ME_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
    }

    // Handle view/plan from URL
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as AuthView | null;
    const planParam = params.get('plan');
    
    if (viewParam === 'signup' || (planParam && !user)) {
      setView('signup');
    } else if (viewParam === 'login') {
      setView('login');
    }

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'reset-password') {
      setView('update-password');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setView('update-password');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isResetFlow = params.get('mode') === 'reset-password' || view === 'update-password';

    if (user && !isResetFlow) {
      const plan = params.get('plan');
      if (plan) {
        navigate(`/settings?plan=${plan}`);
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate, view]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === 'login') {
        const { error } = await signIn(email.trim(), password.trim());
        if (error) {
          let msg = error.message;
          if (msg === 'Invalid login credentials') msg = "Invalid email or password. Please check your credentials.";
          if (msg.includes('Email not confirmed')) msg = "Your email is not confirmed. Please check your inbox for the verification link.";
          
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: (
              <div className="space-y-1">
                <p className="font-medium">{msg}</p>
                <p className="text-[10px] opacity-70">Error Code: AUTH_LOGIN_FAIL</p>
              </div>
            ),
          });
        } else {
          if (rememberMe) {
            localStorage.setItem(REMEMBER_ME_EMAIL_KEY, email.trim());
          } else {
            localStorage.removeItem(REMEMBER_ME_EMAIL_KEY);
          }
          toast({ title: "Welcome back!", description: "Successfully logged in." });
        }
      } else if (view === 'signup') {
        if (!companyName.trim()) {
          toast({ variant: "destructive", title: "Error", description: "Company Name is mandatory." });
          setLoading(false);
          return;
        }
        if (!/^\d{10}$/.test(mobile.trim())) {
          toast({ variant: "destructive", title: "Error", description: "Please enter a valid 10-digit mobile number." });
          setLoading(false);
          return;
        }
        const { error } = await signUp(email.trim(), password.trim(), companyName.trim(), mobile.trim());
        if (error) {
          toast({ 
            variant: "destructive", 
            title: "Sign Up Failed", 
            description: (
              <div className="space-y-1">
                <p className="font-medium">{error.message}</p>
                <p className="text-[10px] opacity-70 italic">Make sure you haven't already registered with this email.</p>
              </div>
            )
          });
        } else {
          if (rememberMe) {
            localStorage.setItem(REMEMBER_ME_EMAIL_KEY, email.trim());
          } else {
            localStorage.removeItem(REMEMBER_ME_EMAIL_KEY);
          }
          toast({ title: "Account created!", description: "Please check your email to verify your account before logging in." });
        }
      } else if (view === 'forgot-password') {
        const { error } = await resetPassword(email.trim());
        if (error) {
          toast({ variant: "destructive", title: "Reset Failed", description: error.message });
        } else {
          toast({ title: "Reset link sent!", description: "Check your email for instructions." });
        }
      } else if (view === 'update-password') {
        const { error } = await updatePassword(password.trim());
        if (error) {
          toast({ variant: "destructive", title: "Update Failed", description: error.message });
        } else {
          toast({ title: "Password updated!", description: "You can now sign in with your new password." });
          setView('login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          variant: "destructive",
          title: "Google Sign In Failed",
          description: error.message,
        });
      }
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Visual Side (Desktop Slider) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-950">
        <AnimatePresence>
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, rotateY: 45, scale: 1.1, z: -100 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1, z: 0 }}
            exit={{ opacity: 0, rotateY: -45, scale: 0.9, z: -100 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
            style={{ transformStyle: "preserve-3d" }}
          >
            <AnimatedBackground type={SLIDES[currentSlide].animation} />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 w-full h-full flex flex-col items-center lg:items-start justify-start p-16 pt-24 lg:pt-40">
          <div className="max-w-lg space-y-8">
            <div className="space-y-4">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-extrabold text-white leading-tight tracking-tight drop-shadow-lg"
              >
                {STATIC_DETAILS.title}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-slate-300 font-medium"
              >
                {STATIC_DETAILS.description}
              </motion.p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {STATIC_DETAILS.features.map((feature, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + (i * 0.1) }}
                  className="flex items-start gap-3 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 group hover:bg-white/10 transition-colors"
                >
                  <div className="bg-blue-500/20 p-2 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-100">{feature.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Slide Indicators */}
          <div className="absolute bottom-12 left-16 flex gap-3">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 transition-all duration-300 rounded-full ${
                  currentSlide === i ? 'w-12 bg-blue-500' : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
        </div>
      </div>
    </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-background relative">
        <div className="absolute top-0 right-0 w-full h-full lg:hidden bg-gradient-to-br from-primary/5 via-transparent to-transparent -z-10" />

        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center justify-center space-x-3 mb-2"
            >
              <div className="p-3 rounded-2xl bg-background border border-border">
                <img
                  src="/assets/images/e9085822-5bea-4642-b19e-dcfcde6248f7.png"
                  alt="ESCROWBILL Logo"
                  className="w-12 h-12 object-contain"
                />
              </div>
              <h1 className="text-3xl font-black text-foreground tracking-tighter">ESCROWBILL</h1>
            </motion.div>
            <p className="text-muted-foreground text-sm font-medium">
              {view === 'login' && 'Welcome back! Please enter your details.'}
              {view === 'signup' && 'Join us and start your journey today.'}
              {view === 'forgot-password' && 'Don\'t worry, we\'ll help you get back in.'}
              {view === 'update-password' && 'Enter your new secure password.'}
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4 md:p-6 sm:p-10 bg-white dark:bg-slate-950 border-border shadow-md">

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-foreground">
                    {view === 'login' && 'Sign In'}
                    {view === 'signup' && 'Create Account'}
                    {view === 'forgot-password' && 'Reset Password'}
                    {view === 'update-password' && 'Update Password'}
                  </h2>
                </div>

                {view === 'signup' && !isPublicSignupEnabled && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 text-sm font-bold text-center">
                    New registrations are currently restricted by administrator.
                  </div>
                )}

                {view === 'signup' && isPublicSignupEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="company"
                          type="text"
                          placeholder="Your Company Name"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="pl-10 h-11"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <Input
                        id="mobile"
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        required
                        className="h-11"
                        pattern="[0-9]{10}"
                        minLength={10}
                        maxLength={10}
                      />
                    </div>
                  </>
                )}

                {(view === 'login' || view === 'signup' || view === 'forgot-password') && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                      autoComplete="username"
                    />
                  </div>
                )}

                {(view === 'login' || view === 'signup' || view === 'update-password') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">
                        {view === 'update-password' ? 'New Password' : 'Password'}
                      </Label>
                      {view === 'login' && (
                        <Button
                          variant="link"
                          className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                          onClick={() => setView('forgot-password')}
                          type="button"
                        >
                          Forgot password?
                        </Button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={view === 'update-password' ? "Enter new password" : "Enter your password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 pr-10"
                        minLength={8}
                        autoComplete={view === 'update-password' ? "new-password" : "current-password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors group/eye"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 transition-transform group-hover/eye:scale-110" />
                        ) : (
                          <Eye className="h-5 w-5 transition-transform group-hover/eye:scale-110" />
                        )}
                      </button>
                    </div>

                    {password && (view === 'signup' || view === 'update-password') && (
                      <div className="mt-2 space-y-1">
                        <div className="flex gap-1 h-1">
                          <div className={`flex-1 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div className={`flex-1 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-muted'}`} />
                          <div className={`flex-1 rounded-full ${/[0-9]/.test(password) ? 'bg-green-500' : 'bg-muted'}`} />
                          <div className={`flex-1 rounded-full ${/[!@#$%^&*]/.test(password) ? 'bg-green-500' : 'bg-muted'}`} />
                        </div>
                        <p className="text-[10px] text-muted-foreground flex justify-between">
                          <span>Strength: {password.length >= 8 ? (/[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password) ? 'Strong' : 'Medium') : 'Weak'}</span>
                          <span>Min 8 characters</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {(view === 'login' || view === 'signup') && (
                  <div className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="text-sm font-medium leading-none cursor-pointer select-none"
                    >
                      Remember me
                    </Label>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11"
                  variant="default"
                  disabled={loading}
                >
                  {loading ? 'Please wait...' : (
                    view === 'login' ? 'Sign In' :
                      view === 'signup' ? 'Create Account' :
                        view === 'forgot-password' ? 'Send Reset Link' :
                          'Update Password'
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                {view === 'login' && (
                  <>
                    <div className="relative mb-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 flex items-center justify-center gap-3 mb-6"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                      Continue with Google
                    </Button>
                  </>
                )}

                {view !== 'update-password' && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {view === 'login' ? "Don't have an account?" :
                        view === 'signup' ? 'Already have an account?' :
                          'Remember your password?'}
                    </p>
                    <Button
                      variant={isPublicSignupEnabled ? "outline" : "ghost"}
                      onClick={() => {
                        if (isPublicSignupEnabled || view !== 'login') {
                          setView(view === 'login' ? 'signup' : 'login');
                          setPassword('');
                        }
                      }}
                      className="w-full h-11 rounded-lg border-primary/20 hover:bg-primary/5"
                      disabled={view === 'login' && !isPublicSignupEnabled}
                    >
                      {view === 'login' ? (isPublicSignupEnabled ? 'Create an account' : 'Signups Disabled') : 'Sign in to account'}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            <p className="mt-8 text-xs text-muted-foreground text-center">
              By continuing, you agree to our <span className="text-foreground hover:underline cursor-pointer">Terms of Service</span> and <span className="text-foreground hover:underline cursor-pointer">Privacy Policy</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
