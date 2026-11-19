import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Zap,
  Phone,
  Check,
  Palette,
  Loader2,
  Save,
  Sparkles,
  RefreshCw,
  Bell,
  Mail,
  FileText,
  CheckCircle2,
  Shield,
  Lock,
  ShieldCheck,
  Download,
  Trash2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountDeletionRequest } from "@/types/admin";

export interface PreferencesSettings {
  default_currency: string;
  default_payment_terms: string;
  default_terms: string;
  email_notifications: boolean;
  invoice_reminders: boolean;
  payment_alerts: boolean;
  auto_save_enabled: boolean;
  whatsapp_provider?: 'meta' | 'personal';
  [key: string]: any;
}

export interface SystemPreferencesTabProps {
  settings: PreferencesSettings;
  setSettings: React.Dispatch<React.SetStateAction<any>>;
  handleInitiateWhatsAppChange: (provider: 'meta' | 'personal') => void;
  handleSettingsSave: (overrideSettings?: any, opts?: { showToast?: boolean; isManual?: boolean }) => Promise<any>;
  settingsSaving: boolean;
  inrPerUnit: number;
  setCurrencyCode: (code: string) => void;
  refreshRates: () => Promise<void>;
  isPasswordModalOpen: boolean;
  setIsPasswordModalOpen: (v: boolean) => void;
  handlePasswordChange: (e: React.FormEvent) => Promise<void>;
  currentPassword: string;
  setCurrentPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  passwordChanging: boolean;
  handleExportData: () => Promise<void>;
  deletionRequest?: AccountDeletionRequest | null;
  safelyToLocaleDate: (dateStr?: string | null) => string;
  cancellingDeletionRequest: boolean;
  handleCancelDeletionRequest: () => Promise<void>;
  setIsDeleteModalOpen: (v: boolean) => void;
  isStaff: boolean;
  loadingDeletionRequest: boolean;
  toast: any;
}

export const SystemPreferencesTab: React.FC<SystemPreferencesTabProps> = ({
  settings,
  setSettings,
  handleInitiateWhatsAppChange,
  handleSettingsSave,
  settingsSaving,
  inrPerUnit,
  setCurrencyCode,
  refreshRates,
  isPasswordModalOpen,
  setIsPasswordModalOpen,
  handlePasswordChange,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordChanging,
  handleExportData,
  deletionRequest,
  safelyToLocaleDate,
  cancellingDeletionRequest,
  handleCancelDeletionRequest,
  setIsDeleteModalOpen,
  isStaff,
  loadingDeletionRequest,
  toast,
}) => {
  return (
    <div className="space-y-6">
      {/* WhatsApp Billing Dispatch Option (ESCROW API vs Personal WhatsApp) */}
      <Card className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Billing WhatsApp Method</h4>
              <p className="text-[11px] text-muted-foreground">Select which WhatsApp channel to use when sharing invoices & payment links with clients</p>
            </div>
          </div>
          <Badge variant="outline" className={cn(
            "text-[10px] font-bold px-2.5 py-0.5 rounded-full self-start sm:self-auto",
            settings.whatsapp_provider === 'personal'
              ? "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30"
              : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
          )}>
            {settings.whatsapp_provider === 'personal' ? 'Personal WhatsApp Selected' : 'ESCROW API Selected'}
          </Badge>
        </div>

        <div className="p-4 md:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option 1: ESCROW API */}
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleInitiateWhatsAppChange('meta');
                }
              }}
              onClick={() => handleInitiateWhatsAppChange('meta')}
              className={cn(
                "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3",
                (settings.whatsapp_provider ?? 'meta') === 'meta'
                  ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm ring-1 ring-emerald-500/30"
                  : "border-border/70 hover:border-emerald-500/50 hover:bg-muted/30"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    (settings.whatsapp_provider ?? 'meta') === 'meta'
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-muted text-muted-foreground"
                  )}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-foreground">ESCROW API</span>
                      <Badge className="text-[9px] font-extrabold uppercase px-1.5 py-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 border">
                        Automated
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                      Official verified business gateway
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all",
                  (settings.whatsapp_provider ?? 'meta') === 'meta'
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-muted-foreground/30 bg-background"
                )}>
                  {(settings.whatsapp_provider ?? 'meta') === 'meta' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sends automated WhatsApp messages with professional invoice template, downloadable PDF links, and payment status updates directly from ESCROW server.
              </p>
            </div>

            {/* Option 2: Personal WhatsApp */}
            <div
              onClick={() => handleInitiateWhatsAppChange('personal')}
              className={cn(
                "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3",
                settings.whatsapp_provider === 'personal'
                  ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm ring-1 ring-emerald-500/30"
                  : "border-border/70 hover:border-emerald-500/50 hover:bg-muted/30"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    settings.whatsapp_provider === 'personal'
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-muted text-muted-foreground"
                  )}>
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-foreground">Personal WhatsApp</span>
                      <Badge variant="outline" className="text-[9px] font-extrabold uppercase px-1.5 py-0 text-blue-600 border-blue-500/30 bg-blue-500/10">
                        App / Web
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                      Opens your own WhatsApp directly
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all",
                  settings.whatsapp_provider === 'personal'
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-muted-foreground/30 bg-background"
                )}>
                  {settings.whatsapp_provider === 'personal' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Opens WhatsApp Web or your phone's WhatsApp app with the client's chat and a pre-typed professional billing message containing invoice details and link.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (6 COLS): SYSTEM DEFAULTS & NOTIFICATIONS */}
        <div className="lg:col-span-6 space-y-6">
          {/* 1. Regional & Display Defaults */}
          <Card className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between gap-2.5 bg-muted/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">System & Regional Defaults</h4>
                  <p className="text-[11px] text-muted-foreground">Default billing currency, credit terms, and invoice preferences</p>
                </div>
              </div>
              <Button
                onClick={() => handleSettingsSave(undefined, { showToast: true, isManual: true })}
                disabled={settingsSaving}
                size="sm"
                className="h-8 px-3.5 rounded-md font-bold text-xs uppercase tracking-wider gap-1.5 shadow-sm inline-flex items-center justify-center"
              >
                {settingsSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </>
                )}
              </Button>
            </div>
            <div className="p-4 md:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="defaultCurrency" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Default Currency
                    </Label>
                    {settings.default_currency && settings.default_currency !== 'INR' && inrPerUnit > 1 && (
                      <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        1 {settings.default_currency} ≈ ₹{inrPerUnit.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                  <Select
                    value={settings.default_currency}
                    onValueChange={(value) => {
                      const next = { ...settings, default_currency: value };
                      setSettings(next);
                      setCurrencyCode(value);
                      void handleSettingsSave(next, { showToast: false });
                    }}
                  >
                    <SelectTrigger id="defaultCurrency" className="h-10 rounded-md bg-background border-border/70 font-medium text-xs">
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border-border/50">
                      <SelectItem value="INR">INR (₹) - Indian Rupee (Base Currency)</SelectItem>
                      <SelectItem value="USD">USD ($) - US Dollar (Live Forex)</SelectItem>
                      <SelectItem value="EUR">EUR (€) - Euro (Live Forex)</SelectItem>
                      <SelectItem value="GBP">GBP (£) - British Pound (Live Forex)</SelectItem>
                    </SelectContent>
                  </Select>
                  {settings.default_currency && settings.default_currency !== 'INR' ? (
                    <div className="flex items-center justify-between pt-0.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        Catalog & reports convert at 1 {settings.default_currency} = ₹{inrPerUnit.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          await refreshRates();
                          toast({
                            title: "Live Forex Synced",
                            description: `Exchange rates for ${settings.default_currency} refreshed.`
                          });
                        }}
                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        Refresh
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Standard Indian accounting currency (all domestic GST returns & records).
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="defaultTerms" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Payment Terms
                  </Label>
                  <Input
                    id="defaultTerms"
                    value={settings.default_payment_terms}
                    onChange={(e) => setSettings({ ...settings, default_payment_terms: e.target.value })}
                    onBlur={() => void handleSettingsSave(settings, { showToast: false })}
                    placeholder="e.g. Net 30, Due on Receipt"
                    className="h-10 rounded-md bg-background border-border/70 font-medium text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Number of days (e.g. 30, 15, 7) will automatically determine the due date for new invoices.
                  </p>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="defaultTermsAndConditions" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Default Terms & Conditions
                  </Label>
                  <Textarea
                    id="defaultTermsAndConditions"
                    value={settings.default_terms}
                    onChange={(e) => setSettings({ ...settings, default_terms: e.target.value })}
                    onBlur={() => void handleSettingsSave(settings, { showToast: false })}
                    placeholder="e.g. 1. Goods once sold will not be taken back.&#10;2. Interest @ 18% p.a. will be charged on overdue payments."
                    className="min-h-[85px] text-xs rounded-md bg-background border-border/70 resize-y"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Auto-filled on every new invoice. Leave blank to use default template terms.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* 2. Notification & Alert Channels */}
          <Card className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
            <div className="p-4 border-b flex items-center gap-2.5 bg-muted/10">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Notification & Alert Channels</h4>
                <p className="text-[11px] text-muted-foreground">Automated activity logs, invoice reminders, and payment triggers</p>
              </div>
            </div>
            <div className="p-4 md:p-6 space-y-3">
              {[
                {
                  id: 'email_notifications',
                  title: 'System Activity',
                  desc: 'Account updates & critical system logs',
                  icon: <Mail className="w-4 h-4" />
                },
                {
                  id: 'invoice_reminders',
                  title: 'Invoice Lifecycle',
                  desc: 'Auto-reminders for overdue client bills',
                  icon: <FileText className="w-4 h-4" />
                },
                {
                  id: 'payment_alerts',
                  title: 'Revenue Alerts',
                  desc: 'Instant alerts for successful settlements',
                  icon: <CheckCircle2 className="w-4 h-4" />
                }
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">{item.icon}</div>
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold text-foreground">{item.title}</Label>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={settings[item.id as keyof typeof settings] as boolean}
                    onCheckedChange={(checked) => {
                      const next = { ...settings, [item.id]: !!checked };
                      setSettings(next);
                      void handleSettingsSave(next, { showToast: false });
                    }}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN (6 COLS): SECURITY & DATA SOVEREIGNTY */}
        <div className="lg:col-span-6 space-y-6">
          {/* 3. Security & Authentication */}
          <Card className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
            <div className="p-4 border-b flex items-center gap-2.5 bg-muted/10">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Security & Access Control</h4>
                <p className="text-[11px] text-muted-foreground">Manage login credentials and session persistence</p>
              </div>
            </div>
            <div className="p-4 md:p-6 space-y-3">
              {/* Change Password */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground">User Authentication</Label>
                    <p className="text-[11px] text-muted-foreground">Update account login password</p>
                  </div>
                </div>
                <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 rounded-md font-bold text-[10px] uppercase tracking-wider px-3 border-border/70">
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-xl border border-border bg-card">
                    <div className="bg-primary/5 p-4 md:p-8 text-foreground border-b border-border/50">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 mb-4 shadow-xs">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                      </div>
                      <DialogTitle className="text-xl font-bold uppercase tracking-tight">Access Control</DialogTitle>
                      <DialogDescription className="text-muted-foreground text-[11px] font-medium mt-1">
                        Protect your account with a secure, high-entropy password
                      </DialogDescription>
                    </div>
                    <form onSubmit={handlePasswordChange} className="p-4 md:p-8 space-y-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          autoComplete="current-password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          className="h-10 rounded-md bg-background border border-input text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          autoComplete="new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={8}
                          className="h-10 rounded-md bg-background border border-input text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={8}
                          className="h-10 rounded-md bg-background border border-input text-xs"
                        />
                      </div>
                      <DialogFooter className="pt-2">
                        <Button type="submit" disabled={passwordChanging} className="w-full h-10 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-xs shadow-xs">
                          {passwordChanging ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Update Password
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Session Persistence */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground">Session Persistence</Label>
                    <p className="text-[11px] text-muted-foreground">Auto-save draft progress locally</p>
                  </div>
                </div>
                <div className="flex bg-background p-1 rounded-lg border border-border">
                  <button
                    onClick={() => {
                      const next = { ...settings, auto_save_enabled: false };
                      setSettings(next);
                      void handleSettingsSave(next, { showToast: false });
                    }}
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                      !settings.auto_save_enabled ? "bg-muted text-foreground shadow-xs border border-border/60" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    Off
                  </button>
                  <button
                    onClick={() => {
                      const next = { ...settings, auto_save_enabled: true };
                      setSettings(next);
                      void handleSettingsSave(next, { showToast: false });
                    }}
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                      settings.auto_save_enabled ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    On
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* 4. Data Sovereignty & Offline Ledgers */}
          <Card className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
            <div className="p-4 border-b flex items-center gap-2.5 bg-muted/10">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Data Sovereignty & Ledger Backups</h4>
                <p className="text-[11px] text-muted-foreground">Export financial data anytime for CA compliance and offline audits</p>
              </div>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Download your entire accounting ledger including all invoices, line items, customer records, and payment receipts in standardized Microsoft Excel (.xlsx) format.
              </p>
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Bank-grade 256-bit encrypted data export</span>
                </div>
                <Button
                  onClick={handleExportData}
                  variant="default"
                  size="sm"
                  className="h-9 rounded-md font-bold text-xs uppercase tracking-wider gap-2 shrink-0 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Excel
                </Button>
              </div>
            </div>
          </Card>

          {/* 5. Danger Zone: Account Deletion Request */}
          <Card className="rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-sm bg-card overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between gap-2.5 bg-rose-50/50 dark:bg-rose-950/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-950 dark:text-rose-100 flex items-center gap-2">
                    Danger Zone: Account Deletion
                  </h4>
                  <p className="text-[11px] text-muted-foreground">Request permanent account deletion and data wipeout</p>
                </div>
              </div>
              {deletionRequest?.status === 'pending' && (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold">
                  Pending Review
                </Badge>
              )}
            </div>

            <div className="p-4 md:p-6 space-y-4">
              {/* If request is pending */}
              {deletionRequest?.status === 'pending' ? (
                <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/20 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-bold text-xs text-amber-900 dark:text-amber-200">
                        Deletion Request Under Administrator Review
                      </h5>
                      <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                        You submitted an account deletion request on <strong>{safelyToLocaleDate(deletionRequest.created_at)}</strong>. An administrator has been alerted and will process the request.
                      </p>
                      <div className="mt-2 text-[11px] text-amber-900/80 dark:text-amber-300/80 space-y-0.5 pt-1 border-t border-amber-200 dark:border-amber-900/50">
                        <p><strong>Reason:</strong> {deletionRequest.reason}</p>
                        {deletionRequest.feedback && (
                          <p><strong>Feedback:</strong> {deletionRequest.feedback}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={cancellingDeletionRequest}
                      onClick={handleCancelDeletionRequest}
                      className="h-8 text-xs font-semibold border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                    >
                      {cancellingDeletionRequest ? 'Cancelling...' : 'Cancel Deletion Request'}
                    </Button>
                  </div>
                </div>
              ) : deletionRequest?.status === 'rejected' ? (
                <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-bold text-xs text-rose-900 dark:text-rose-200">
                        Previous Deletion Request Was Declined
                      </h5>
                      <p className="text-[11px] text-rose-800/90 dark:text-rose-300/90 leading-relaxed">
                        Your request submitted on {safelyToLocaleDate(deletionRequest.created_at)} was reviewed and declined by administrator.
                      </p>
                      {deletionRequest.admin_notes && (
                        <div className="mt-2 p-2 rounded-lg bg-background/80 border border-border text-[11px] text-foreground">
                          <span className="font-bold">Admin Note:</span> {deletionRequest.admin_notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="pt-1 flex justify-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={isStaff}
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="h-8 text-xs font-bold"
                    >
                      Submit New Request
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Requesting account deletion initiates a permanent wipeout protocol. Once approved by our administration team, all your company invoices, customer directories, inventory records, and login access will be irreversibly erased.
                  </p>

                  <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-200 dark:border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Action irreversible once approved by platform admin</span>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={isStaff || loadingDeletionRequest}
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="h-9 font-bold text-xs uppercase tracking-wider shrink-0 shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Request Account Deletion
                    </Button>
                  </div>
                  {isStaff && (
                    <p className="text-[11px] text-muted-foreground italic">
                      * Staff accounts cannot request organization deletion. Only company owners can manage account lifecycle.
                    </p>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

