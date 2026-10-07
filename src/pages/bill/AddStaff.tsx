import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase, serviceSupabase } from "@/integrations/supabase/client";
import { generateAccountId } from '@/utils/accountId';
import { formatStaffCredentialsWhatsAppMessage, openWhatsAppChat } from '@/utils/whatsappTemplates';
import { 
  UserPlus, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Check, 
  Copy, 
  Share2, 
  CheckCircle2, 
  ShieldCheck, 
  RefreshCw,
  Mail,
  Lock,
  User,
  Phone,
  Sparkles,
  Shield
} from "lucide-react";
import { AVAILABLE_PERMISSIONS, ROLE_PRESETS, StaffMember } from './RolesPermissions';



const LOCAL_STORAGE_STAFF_KEY = 'escrow_company_staff_backup';

export default function AddStaff() {
  const { user, profile, isStaff } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [addMode, setAddMode] = useState<'create' | 'link'>('create');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Accountant');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(ROLE_PRESETS['Accountant'].permissions);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success dialog
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password?: string;
    role: string;
    loginUrl: string;
    phone?: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%';
    let generated = '';
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
  };

  const handleRolePresetChange = (roleKey: string) => {
    setSelectedRole(roleKey);
    if (ROLE_PRESETS[roleKey] && roleKey !== 'Custom') {
      setSelectedPermissions(ROLE_PRESETS[roleKey].permissions);
    }
  };

  const handleTogglePermission = (permId: string) => {
    setSelectedPermissions(prev => {
      const next = prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId];
      const matchedPreset = Object.keys(ROLE_PRESETS).find(key => {
        if (key === 'Custom') return false;
        const presetPerms = ROLE_PRESETS[key].permissions;
        return presetPerms.length === next.length && presetPerms.every(p => next.includes(p));
      });
      setSelectedRole(matchedPreset || 'Custom');
      return next;
    });
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copied",
      description: `${fieldName} copied to clipboard.`
    });
  };

  const shareCredentialsWhatsApp = () => {
    if (!createdCredentials) return;
    const company = profile?.company_name || 'Escrow Bill';
    const isGoogle = addMode === 'link' || createdCredentials.password === '(Google Sign-In / Existing)';
    
    const message = formatStaffCredentialsWhatsAppMessage({
      companyName: company,
      portalUrl: createdCredentials.loginUrl,
      email: createdCredentials.email,
      password: createdCredentials.password,
      role: createdCredentials.role,
      isGoogle: isGoogle
    });
    
    openWhatsAppChat(createdCredentials.phone || phone, message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!fullName.trim() || !email.trim()) {
      toast({
        title: "Validation Error",
        description: "Full name and email are required.",
        variant: "destructive"
      });
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      toast({
        title: "Mobile Number Required",
        description: "Please enter a valid 10-digit mobile number.",
        variant: "destructive"
      });
      return;
    }

    if (addMode === 'create' && (!password || password.length < 8)) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      let newUserId: string | null = null;

      if (addMode === 'create') {
        try {
          const { data: authUser, error: authErr } = await (serviceSupabase as any).auth.admin.createUser({
            email: cleanEmail,
            password: password,
            email_confirm: true,
            user_metadata: {
              full_name: fullName.trim(),
              mobile: phone.trim(),
              company_id: user.id,
              company_name: profile?.company_name || 'Escrow Company',
              is_staff: true,
              staff_role: selectedRole,
              initial_password: password,
              temp_password: password
            }
          });

          if (authErr) {
            // If user already exists in Auth, fetch their ID and update their metadata/password
            const { data: listData } = await (serviceSupabase as any).auth.admin.listUsers();
            const existingUser = listData?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail);
            if (existingUser) {
              newUserId = existingUser.id;
              await (serviceSupabase as any).auth.admin.updateUserById(newUserId, {
                password: password,
                email_confirm: true,
                user_metadata: {
                  ...(existingUser.user_metadata || {}),
                  full_name: fullName.trim(),
                  mobile: phone.trim(),
                  company_id: user.id,
                  company_name: profile?.company_name || 'Escrow Company',
                  is_staff: true,
                  staff_role: selectedRole,
                  initial_password: password,
                  temp_password: password
                }
              });
            }
          } else if (authUser?.user) {
            newUserId = authUser.user.id;
          }
        } catch (authError: any) {
          console.warn("User creation fallback:", authError);
        }
      }

      const newStaffRecord: StaffMember = {
        id: crypto.randomUUID(),
        company_owner_id: user.id,
        user_id: newUserId,
        name: fullName.trim(),
        email: cleanEmail,
        phone: phone.trim() || null,
        role: selectedRole,
        permissions: selectedPermissions,
        status: 'active',
        created_at: new Date().toISOString(),
        temp_password: addMode === 'create' ? password : undefined
      };

      try {
        const { data: existingStaff } = await (serviceSupabase as any)
          .from('company_staff')
          .select('id')
          .eq('company_owner_id', user.id)
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (existingStaff?.id) {
          await (serviceSupabase as any)
            .from('company_staff')
            .update({
              user_id: newUserId || undefined,
              name: fullName.trim(),
              phone: phone.trim() || null,
              role: selectedRole,
              permissions: selectedPermissions,
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingStaff.id);
        } else {
          await (serviceSupabase as any)
            .from('company_staff')
            .insert([{
              company_owner_id: user.id,
              user_id: newUserId,
              name: fullName.trim(),
              email: cleanEmail,
              phone: phone.trim() || null,
              role: selectedRole,
              permissions: selectedPermissions,
              status: 'active'
            }]);
        }
      } catch (err) {
        console.warn("Staff upsert error:", err);
      }

      if (newUserId) {
        try {
          await (serviceSupabase as any)
            .from('profiles')
            .upsert({
              user_id: newUserId,
              company_name: profile?.company_name || 'Escrow Company',
              business_address: profile?.business_address || null,
              gstin: profile?.gstin || null,
              state: profile?.state || null,
              city: profile?.city || null,
              pincode: profile?.pincode || null,
              logo_url: profile?.logo_url || null,
              signature_url: profile?.signature_url || null,
              bank_name: profile?.bank_name || null,
              account_number: profile?.account_number || null,
              ifsc_code: profile?.ifsc_code || null,
              account_holder_name: profile?.account_holder_name || null,
              account_type: profile?.account_type || null,
              phone: phone.trim() || null,
              mobile: phone.trim() || null,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        } catch (profileErr) {
          console.warn("Profile update warning:", profileErr);
        }
      }

      const cached = localStorage.getItem(`${LOCAL_STORAGE_STAFF_KEY}_${user.id}`);
      let currentList: StaffMember[] = cached ? JSON.parse(cached) : [];
      currentList = [newStaffRecord, ...currentList.filter(s => s.email.toLowerCase() !== cleanEmail)];
      localStorage.setItem(`${LOCAL_STORAGE_STAFF_KEY}_${user.id}`, JSON.stringify(currentList));

      const loginUrl = `${window.location.origin}/auth`;
      setCreatedCredentials({
        name: fullName.trim(),
        email: cleanEmail,
        password: addMode === 'create' ? password : '(Pre-existing account)',
        role: selectedRole,
        loginUrl: loginUrl,
        phone: phone.trim()
      });
      setIsSuccessModalOpen(true);

      toast({
        title: "Staff Added",
        description: `${fullName.trim()} was enrolled successfully.`,
      });
    } catch (err: any) {
      console.error("Error creating staff:", err);
      toast({
        title: "Failed to Add Staff",
        description: err.message || "An error occurred while setting up staff member.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishAndNavigate = () => {
    setIsSuccessModalOpen(false);
    navigate('/roles-permissions');
  };

  if (isStaff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Staff and permission management is reserved for company administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/roles-permissions')} 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Staff Directory
          </button>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Add Staff Member</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure account credentials and module authorizations for your team member.
          </p>
        </div>
      </div>

      {/* Main Form */}
      <Card className="border border-border/70 shadow-sm bg-card">
        <CardHeader className="p-5 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">Account & Access Details</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Choose whether to create new login credentials or link an existing user.
              </CardDescription>
            </div>

            <Tabs value={addMode} onValueChange={(v) => setAddMode(v as 'create' | 'link')} className="w-auto">
              <TabsList className="h-9">
                <TabsTrigger value="create" className="text-xs px-3 font-semibold">
                  New Password
                </TabsTrigger>
                <TabsTrigger value="link" className="text-xs px-3 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Google Login / Existing
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            {/* Identity Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">General Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Full Name *</Label>
                  <Input 
                    placeholder="e.g. Rahul Sharma" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Email Address (Login ID) *</Label>
                  <Input 
                    type="email"
                    placeholder="staff@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="h-5 flex items-center justify-between">
                    <Label className="text-xs font-semibold">Mobile Number *</Label>
                    <span className="text-[10px] text-muted-foreground">10 Digits</span>
                  </div>
                  <Input 
                    type="tel"
                    placeholder="e.g. 9876543210" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    maxLength={10}
                    className="h-10 text-sm"
                  />
                </div>

                {addMode === 'create' ? (
                  <div className="space-y-1.5">
                    <div className="h-5 flex items-center justify-between">
                      <Label className="text-xs font-semibold">Password *</Label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[11px] text-primary hover:underline font-semibold"
                      >
                        Auto-generate
                      </button>
                    </div>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimum 8 characters (e.g. Staff@1234)" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className="h-10 text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="h-5 flex items-center justify-between">
                      <Label className="text-xs font-semibold text-muted-foreground">Sign-In Method</Label>
                    </div>
                    <div className="h-10 px-3 rounded-md border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">Staff will sign in via <strong>Continue with Google</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Role & Permissions */}
            <div className="space-y-4 pt-4 border-t border-border/60">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Role Assignment
                </Label>
                <Select value={selectedRole} onValueChange={handleRolePresetChange}>
                  <SelectTrigger className="h-10 text-sm font-medium">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Accountant">Accountant (Invoices, Purchase Bills, Payments, Expenses, E-Invoice)</SelectItem>
                    <SelectItem value="Sales Executive">Sales Executive (Invoices, Clients, Products)</SelectItem>
                    <SelectItem value="Inventory Manager">Inventory Manager (Purchase Bills, Vendors, Products)</SelectItem>
                    <SelectItem value="Billing Operator">Billing Operator (Invoices, Clients, Payments)</SelectItem>
                    <SelectItem value="Custom">Custom Permissions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Module Access Matrix
                  </Label>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded">
                    {selectedPermissions.length} / {AVAILABLE_PERMISSIONS.length} Modules Allowed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    return (
                      <div 
                        key={perm.id}
                        onClick={() => handleTogglePermission(perm.id)}
                        className={`flex items-start gap-3 p-3.5 rounded-lg border text-left cursor-pointer transition-colors ${
                          isChecked 
                            ? 'border-primary/50 bg-primary/5 dark:bg-primary/10' 
                            : 'border-border/60 hover:bg-muted/40'
                        }`}
                      >
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(perm.id)}
                          className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-none text-foreground">{perm.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{perm.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-5 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/roles-permissions')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="h-10 px-6 font-semibold shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" /> Save Staff Member
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Success Dialog */}
      <Dialog open={isSuccessModalOpen} onOpenChange={handleFinishAndNavigate}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-center">
              Staff Account Ready
            </DialogTitle>
            <DialogDescription className="text-xs text-center">
              Credentials configured for <strong className="text-foreground">{createdCredentials?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {createdCredentials && (
            <div className="space-y-3 my-2 text-xs">
              <div className="bg-muted/40 p-3.5 rounded-lg space-y-2 border border-border/70">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Portal URL:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] truncate max-w-[180px]">{createdCredentials.loginUrl}</span>
                    <button onClick={() => copyToClipboard(createdCredentials.loginUrl, 'Portal URL')}>
                      {copiedField === 'Portal URL' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Account ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      #{generateAccountId(createdCredentials.email)}
                    </span>
                    <button onClick={() => copyToClipboard(generateAccountId(createdCredentials.email), 'Account ID')}>
                      {copiedField === 'Account ID' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-semibold">{createdCredentials.email}</span>
                    <button onClick={() => copyToClipboard(createdCredentials.email, 'Email')}>
                      {copiedField === 'Email' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                {createdCredentials.password && createdCredentials.password !== '(Google Sign-In / Existing)' ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Password:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {createdCredentials.password}
                      </span>
                      <button onClick={() => copyToClipboard(createdCredentials.password || '', 'Password')}>
                        {copiedField === 'Password' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sign-In Method:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px]">
                      <Sparkles className="w-3 h-3 text-amber-500" /> Continue with Google
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = `Portal: ${createdCredentials.loginUrl}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password || ''}\nRole: ${createdCredentials.role}`;
                    copyToClipboard(text, 'All Details');
                  }}
                  className="text-xs"
                >
                  <Copy className="w-3 h-3 mr-1.5" /> Copy Details
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={shareCredentialsWhatsApp}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Share2 className="w-3 h-3 mr-1.5" /> WhatsApp
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button size="sm" className="w-full" onClick={handleFinishAndNavigate}>
              Done & Return to List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
