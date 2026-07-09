import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const ADMIN_REMEMBER_ME_KEY = 'escrow_admin_remember_me';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const { login } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem(ADMIN_REMEMBER_ME_KEY);
    if (saved) {
      setUsername(saved);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingSeconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
      toast({
        title: "Account Locked",
        description: `Too many failed attempts. Try again in ${remainingSeconds} seconds.`,
        variant: "destructive",
      });
      return;
    }

    const success = await login(username, password);
    if (success) {
      if (rememberMe) {
        localStorage.setItem(ADMIN_REMEMBER_ME_KEY, username);
      } else {
        localStorage.removeItem(ADMIN_REMEMBER_ME_KEY);
      }
      setFailedAttempts(0);
      setLockoutUntil(null);
      toast({
        title: "Success",
        description: "Admin login successful",
      });
      navigate('/admin/dashboard');
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= 5) {
        // Exponential backoff: base 30s * (attempts - 4)
        const blockDuration = 30000 * Math.pow(2, newAttempts - 5);
        setLockoutUntil(Date.now() + blockDuration);
        toast({
          title: "Account Locked",
          description: `Too many failed attempts. Locked out for ${blockDuration / 1000} seconds.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: `Invalid credentials. ${5 - newAttempts} attempts remaining.`,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border shadow-sm z-10">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-background rounded-2xl border border-border">
              <img 
                src="/assets/images/e9085822-5bea-4642-b19e-dcfcde6248f7.png" 
                alt="ESCROWBILL Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground tracking-tight">Admin Access</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">Secure gateway for platform administrators</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">Email Address</Label>
              <Input
                id="username"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="admin@escrowbill.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-background"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" id="password_label" className="text-sm font-medium">Security Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
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

            <Button
              type="submit"
              className="w-full h-11 font-semibold transition-all mt-2"
              disabled={!!(lockoutUntil && Date.now() < lockoutUntil)}
            >
              {lockoutUntil && Date.now() < lockoutUntil
                ? `Locked (${Math.ceil((lockoutUntil - Date.now()) / 1000)}s)`
                : "Authorize Access"}
            </Button>
          </form>
        </CardContent>
        <div className="px-6 pb-8 pt-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-muted-foreground/60">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <p className="text-[10px] uppercase tracking-wider font-semibold">
              Encrypted Session Active
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;
