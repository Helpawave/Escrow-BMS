import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, DollarSign, Loader2, KeyRound } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const { user, login, resetPassword, isLoading, isInitialized } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for error messages in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    console.log('[LOGIN_PAGE] Checking URL for error parameter:', error);
    console.log('[LOGIN_PAGE] Full URL:', window.location.href);
    
    if (error === 'account_deleted') {
      console.log('[LOGIN_PAGE] Showing account deleted toast');
      toast({
        title: "Account Deleted",
        description: "Your account has been deleted by an administrator. Please contact support if you believe this is an error.",
        variant: "destructive"
      });
      
      // Clear the error parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('[LOGIN_PAGE] Error parameter cleared from URL');
    } else if (error === 'registration_failed') {
      console.log('[LOGIN_PAGE] Showing registration failed toast');
      toast({
        title: "Registration Failed",
        description: "Failed to create your account. Please try again or contact support.",
        variant: "destructive"
      });
      
      // Clear the error parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('[LOGIN_PAGE] Registration error parameter cleared from URL');
    }
  }, [toast]);

  // Redirect authenticated users - Wait for AuthContext to initialize
  useEffect(() => {
    if (isInitialized && user && user.is_allowed) {
      console.log('[LOGIN_PAGE]: User authenticated and approved, redirecting to dashboard')
      navigate('/dashboard')
    } else if (isInitialized && user && !user.is_allowed) {
      console.log('[LOGIN_PAGE]: User authenticated but not approved, redirecting to dashboard for approval screen')
      navigate('/dashboard')
    }
  }, [user, isInitialized, navigate]);

  // This useEffect is redundant - removed to prevent duplicate navigation

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    const result = await resetPassword(forgotPasswordEmail);
    if (!result.error) {
      toast({
        title: "Password Reset",
        description: "A temporary password has been set. Please contact admin for the new password.",
      });
      setIsForgotPasswordOpen(false);
      setForgotPasswordEmail('');
    } else {
      toast({
        title: "Reset Failed",
        description: "Email not found in our system",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await login(email, password);
    if (!result.error) {
      toast({
        title: "Login successful!",
        description: "Welcome back to FinTrack"
      });
      
      navigate('/dashboard'); 
    } else {
      toast({
        title: "Login failed",
        description: result.error?.message || "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.log('[LOGIN]: Starting Google authentication process');
      console.log('[LOGIN]: Current URL:', window.location.href);
      console.log('[LOGIN]: User Agent:', navigator.userAgent);
      console.log('[LOGIN]: Timestamp:', new Date().toISOString());
      
      const { AuthRepository } = await import('@/lib/repository');
      
      // Add a small delay to ensure everything is loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('[LOGIN]: About to call signInWithGoogle');
      const { data, error } = await AuthRepository.signInWithGoogle();
      
      if (error) {
        console.error('Google auth error:', error);
        toast({
          title: "Authentication Error",
          description: error.message || "Failed to authenticate with Google. Please ensure your URL is configured in Google OAuth settings.",
          variant: "destructive"
        });
        return;
      }

      // Google auth will redirect automatically, no need to handle success here
      toast({
        title: "Redirecting...",
        description: "Authenticating with Google"
      });
    } catch (error) {
      console.error('Google auth error:', error);
      toast({
        title: "Configuration Error", 
        description: "Google authentication is not properly configured. Please check your Supabase settings.",
        variant: "destructive"
      });
    }
  };
  // Don't show welcome back message - let the useEffect handle navigation
  // This prevents the loop where user exists in localStorage but AuthContext hasn't loaded yet

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="Escrow Daily Hisab" className="w-16 h-16 mx-auto mb-4 hover:opacity-80 transition-all duration-200 cursor-pointer" />
          </Link>
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your FinTrack account</p>
        </div>

        <Card className="shadow-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={(e)=>handleSubmit(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <div className="text-right">
                  <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                    <DialogTrigger asChild>
                      <Button variant="link" className="text-xs p-0 h-auto">
                        Forgot password?
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <KeyRound className="w-5 h-5" />
                          Reset Password
                        </DialogTitle>
                        <DialogDescription>
                          Enter your email address and we'll reset your password
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="forgotEmail">Email Address</Label>
                          <Input
                            id="forgotEmail"
                            type="email"
                            value={forgotPasswordEmail}
                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                            placeholder="Enter your email"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsForgotPasswordOpen(false);
                            setForgotPasswordEmail('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleForgotPassword} disabled={!forgotPasswordEmail}>
                          <KeyRound className="w-4 h-4 mr-2" />
                          Reset Password
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>


            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </p>
              
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                <p className="font-medium mb-1">New User?</p>
                <p>Create an account to get started. Admin approval required for access.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
