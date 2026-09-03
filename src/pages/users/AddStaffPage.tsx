import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES, type ModuleKey } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { generateAccountId, generateStaffCode } from '@/utils/accountId';
import {
  UserPlus,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  Copy,
  Share2,
  CheckCircle2,
  Sparkles,
  Building2,
  Lock,
  Mail,
  Phone,
  User,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ESCROW_BMS_MODULES, ROLE_PRESETS, type StaffMember } from '@/pages/users/MembersPage';

const getStaffBackupKey = (ownerId: string) => `escrow_company_staff_backup_${ownerId}`;

export default function AddStaffPage() {
  const { user, profile, companyId: activeCompanyId } = useAuth();
  const navigate = useNavigate();

  const ownerId = profile?.parent_user_id || user?.id || '';
  const displayCompanyId = activeCompanyId || generateAccountId(ownerId);

  const [addMode, setAddMode] = useState<'create' | 'link'>('create');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Accountant');
  const [selectedModules, setSelectedModules] = useState<ModuleKey[]>(ROLE_PRESETS['Accountant'].modules);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Dialog / Credentials States
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    staffId: string;
    companyId: string;
    email: string;
    password?: string;
    role: string;
    modules: ModuleKey[];
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%';
    let generated = '';
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setShowPassword(true);
  };

  const handleRolePresetChange = (roleKey: string) => {
    setSelectedRole(roleKey);
    if (ROLE_PRESETS[roleKey] && roleKey !== 'Custom') {
      setSelectedModules(ROLE_PRESETS[roleKey].modules);
    }
  };

  const handleToggleModule = (moduleId: ModuleKey) => {
    setSelectedModules(prev => {
      const next = prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId];
      const matchedPreset = Object.keys(ROLE_PRESETS).find(key => {
        if (key === 'Custom') return false;
        const presetModules = ROLE_PRESETS[key].modules;
        return presetModules.length === next.length && presetModules.every(m => next.includes(m));
      });
      setSelectedRole(matchedPreset || 'Custom');
      return next;
    });
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(`${fieldName} copied to clipboard!`);
  };

  const shareCredentialsWhatsApp = () => {
    if (!createdCredentials) return;
    const company = profile?.company_name || 'Escrow BMS';
    const isGoogle = addMode === 'link' || createdCredentials.password === '(Google Sign-In / Existing)';
    const modulesText = createdCredentials.modules.map(m => `• ${m.toUpperCase()}`).join('\n');

    let message = '';
    if (isGoogle) {
      message = `*${company} - Staff Login Access*\n\n` +
        `Your staff account is ready on Escrow BMS!\n\n` +
        `🏢 *Company ID:* \`${createdCredentials.companyId}\`\n` +
        `🆔 *Staff ID:* \`${createdCredentials.staffId}\`\n` +
        `👤 *Name:* ${createdCredentials.name}\n` +
        `📧 *Email:* ${createdCredentials.email}\n` +
        `💼 *Role:* ${createdCredentials.role}\n\n` +
        `🔐 *Module Access:*\n${modulesText}\n\n` +
        `👉 *Login Instructions:* Open Escrow BMS and sign in using Google Sign-In with this email address. Your permissions and company data are pre-configured!`;
    } else {
      message = `*${company} - Staff Login Access*\n\n` +
        `Your staff account has been configured on Escrow BMS:\n\n` +
        `🏢 *Company ID:* \`${createdCredentials.companyId}\`\n` +
        `🆔 *Staff ID:* \`${createdCredentials.staffId}\`\n` +
        `👤 *Name:* ${createdCredentials.name}\n` +
        `📧 *Email:* ${createdCredentials.email}\n` +
        `🔑 *Password:* \`${createdCredentials.password || '[As Configured]'}\`\n` +
        `💼 *Role:* ${createdCredentials.role}\n\n` +
        `🔐 *Module Access:*\n${modulesText}\n\n` +
        `👉 *Login Instructions:* Sign in using your email and password.`;
    }

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerId) {
      toast.error("User workspace not authenticated.");
      return;
    }

    if (!fullName.trim() || !email.trim()) {
      toast.error("Full name and email are required.");
      return;
    }

    if (addMode === 'create' && (!password || password.length < 6)) {
      toast.error("Please enter a password with at least 6 characters (or generate one).");
      return;
    }

    setIsSubmitting(true);
    try {
      // Load current staff list to generate next staff code
      let currentStaff: StaffMember[] = [];
      try {
        const saved = localStorage.getItem(getStaffBackupKey(ownerId));
        if (saved) currentStaff = JSON.parse(saved);
      } catch {}

      const generatedCode = generateStaffCode(currentStaff.length + 1);
      const newStaffId = crypto.randomUUID();

      const newMember: StaffMember = {
        id: newStaffId,
        staff_id: generatedCode,
        company_owner_id: ownerId,
        company_id: displayCompanyId,
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || '',
        role: selectedRole,
        allowed_modules: selectedModules,
        status: 'active',
        temp_password: addMode === 'create' ? password : '(Google Sign-In / Existing)',
        created_at: new Date().toISOString()
      };

      // 1. Try to save to Supabase employees table
      try {
        await supabase.from('employees').insert([{
          id: newStaffId,
          user_id: ownerId,
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          role: selectedRole,
          permissions: selectedModules,
          status: 'active'
        }]);
      } catch (dbErr) {
        console.warn('Could not insert to employees in DB (using local storage):', dbErr);
      }

      // 2. Update local state & backup
      const updatedList = [newMember, ...currentStaff.filter(s => s.id !== newStaffId)];
      localStorage.setItem(getStaffBackupKey(ownerId), JSON.stringify(updatedList));

      // 3. Show credentials modal
      setCreatedCredentials({
        name: newMember.name,
        staffId: newMember.staff_id,
        companyId: displayCompanyId,
        email: newMember.email,
        password: newMember.temp_password,
        role: newMember.role,
        modules: newMember.allowed_modules
      });

      setShowCredentialsModal(true);
      toast.success(`Staff member "${newMember.name}" created successfully!`);
    } catch (err: any) {
      console.error('Error adding staff member:', err);
      toast.error(err?.message || 'Failed to create staff member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/members')}
            className="h-10 px-3.5 rounded-xl font-bold border-2 hover:bg-muted/50 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to Staff Directory</span>
          </Button>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-indigo-600" />
              <span>Add Staff Member</span>
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              Create login credentials and configure modular BMS permissions
            </p>
          </div>
        </div>

        {/* Company ID Pill */}
        <div className="bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl px-4 py-2 flex items-center gap-3 self-start sm:self-auto">
          <div>
            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 block tracking-wider">
              Company ID
            </span>
            <span className="font-mono text-base font-black text-indigo-950 dark:text-indigo-200">
              {displayCompanyId}
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(displayCompanyId, 'Company ID')}
            className="h-8 px-2.5 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 cursor-pointer"
          >
            {copiedField === 'Company ID' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Main Form Card */}
      <Card className="rounded-3xl border-2 border-border/80 bg-card shadow-xl overflow-hidden">
        <CardHeader className="p-6 md:p-8 bg-muted/10 border-b border-border/50">
          <Tabs value={addMode} onValueChange={(v) => setAddMode(v as 'create' | 'link')} className="w-full">
            <TabsList className="grid grid-cols-2 h-12 p-1.5 bg-muted/50 rounded-2xl max-w-md">
              <TabsTrigger value="create" className="font-black text-xs rounded-xl cursor-pointer">
                Create New Account
              </TabsTrigger>
              <TabsTrigger value="link" className="font-black text-xs rounded-xl cursor-pointer">
                Link Existing / Google Account
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 md:p-8 space-y-8">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <User className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">1. Staff Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Full Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="h-12 rounded-xl font-medium text-sm"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Email Address <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. staff@company.com"
                    className="h-12 rounded-xl font-medium text-sm"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Mobile Number (Optional)
                  </Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="h-12 rounded-xl font-medium text-sm"
                  />
                </div>
              </div>

              {addMode === 'create' && (
                <div className="space-y-1.5 pt-2 max-w-md">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Temporary Password <span className="text-rose-500">*</span>
                    </Label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-xs font-black text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Password</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="h-12 pr-11 rounded-xl font-medium text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Role Presets Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">2. Select Role Preset</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.keys(ROLE_PRESETS).map((key) => {
                  const isSelected = selectedRole === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleRolePresetChange(key)}
                      className={cn(
                        "p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer",
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 shadow-md ring-2 ring-indigo-600/20"
                          : "border-border/70 hover:border-border text-muted-foreground bg-card"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-black text-foreground">{key}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <p className="text-xs opacity-75 font-medium leading-relaxed">
                        {ROLE_PRESETS[key].description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Module Permissions Checklist */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                    3. Escrow BMS Module Access
                  </h3>
                </div>
                <Badge variant="secondary" className="font-bold text-xs">
                  {selectedModules.length} Modules Granted
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ESCROW_BMS_MODULES.map((mod) => {
                  const isChecked = selectedModules.includes(mod.id);
                  return (
                    <div
                      key={mod.id}
                      onClick={() => handleToggleModule(mod.id)}
                      className={cn(
                        "p-4 rounded-2xl border-2 flex items-start justify-between gap-3 cursor-pointer transition-all",
                        isChecked
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 ring-1 ring-blue-600/20"
                          : "border-border/60 hover:border-border text-muted-foreground bg-card"
                      )}
                    >
                      <div>
                        <p className="text-xs font-black text-foreground">{mod.label}</p>
                        <p className="text-[11px] opacity-75 mt-0.5 leading-snug">{mod.description}</p>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center border transition-all mt-0.5 shrink-0",
                        isChecked ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-700"
                      )}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 md:p-8 bg-muted/10 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/members')}
              className="w-full sm:w-auto h-12 px-6 font-bold rounded-2xl border-2 cursor-pointer"
            >
              Cancel & Return
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto h-12 px-8 font-black rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 cursor-pointer flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>{isSubmitting ? 'Creating Staff Account...' : 'Create Staff Member'}</span>
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* ── Generated Credentials & 1-Click WhatsApp Share Modal ───── */}
      <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-background">
          <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border-b border-border/50">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <DialogTitle className="text-xl font-black text-foreground">Staff Login Credentials</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Account created successfully. Share or copy login credentials:
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3 font-medium text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Company ID</span>
                <span className="font-mono font-black text-sm text-foreground">{createdCredentials?.companyId}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Staff ID / Code</span>
                <span className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">{createdCredentials?.staffId}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Email Address</span>
                <span className="font-bold text-foreground">{createdCredentials?.email}</span>
              </div>

              {createdCredentials?.password && createdCredentials.password !== '(Google Sign-In / Existing)' && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Temporary Password</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-foreground bg-white dark:bg-slate-800 px-2 py-0.5 rounded border">
                      {createdCredentials.password}
                    </span>
                    <button
                      onClick={() => copyToClipboard(createdCredentials.password || '', 'Password')}
                      className="text-slate-400 hover:text-foreground cursor-pointer"
                      title="Copy Password"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Assigned Role</span>
                <span className="font-bold text-foreground">{createdCredentials?.role}</span>
              </div>
            </div>

            {/* Share actions */}
            <div className="space-y-2.5">
              <Button
                onClick={shareCredentialsWhatsApp}
                className="w-full h-12 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const text = `Company ID: ${createdCredentials?.companyId}\nStaff ID: ${createdCredentials?.staffId}\nEmail: ${createdCredentials?.email}\nPassword: ${createdCredentials?.password || '[As Configured]'}`;
                  copyToClipboard(text, 'All Credentials');
                }}
                className="w-full h-11 rounded-2xl font-bold text-xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 mr-2" />
                <span>Copy All Credentials</span>
              </Button>
            </div>
          </div>

          <DialogFooter className="p-4 bg-muted/5 border-t border-border/50 flex flex-row gap-3">
            <Button
              onClick={() => {
                setShowCredentialsModal(false);
                navigate('/members');
              }}
              className="w-full h-11 font-black rounded-xl bg-primary text-primary-foreground cursor-pointer"
            >
              Go to Staff Directory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
