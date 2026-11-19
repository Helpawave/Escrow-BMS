import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Award,
  Sparkles,
  RefreshCw,
  Check,
  Zap,
  Receipt,
  Headphones,
  MessageSquare,
  FileText,
  QrCode,
  Users,
  CreditCard,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePricing } from "@/hooks/usePricing";
import { USER_TYPE_LABELS, UserType } from "@/types/admin";

export interface MembershipProfile {
  company_name?: string | null;
  phone?: string | null;
  gstin?: string | null;
  subscription_expires_at?: string | null;
  plan_type?: string | null;
  email?: string | null;
  [key: string]: any;
}

export interface MembershipTabProps {
  isStaff: boolean;
  profile: MembershipProfile;
  companyProfile?: MembershipProfile | null;
  user: any;
  effectiveUserId?: string | null;
  isTrialActive: boolean;
  isProActive: boolean;
  trialDaysRemaining: number;
  countdownText: string;
  safelyToLocaleDate: (dateStr?: string | null) => string;
  now: Date;
  selectedPlan: 'monthly' | 'yearly';
  setSelectedPlan: (plan: 'monthly' | 'yearly') => void;
  handleUpgrade: (planOverride?: 'monthly' | 'yearly') => Promise<void>;
  settingsSaving: boolean;
}

export const MembershipTab: React.FC<MembershipTabProps> = ({
  isStaff,
  profile,
  companyProfile,
  user,
  effectiveUserId,
  isTrialActive,
  isProActive,
  trialDaysRemaining,
  countdownText,
  safelyToLocaleDate,
  now,
  selectedPlan,
  setSelectedPlan,
  handleUpgrade,
  settingsSaving,
}) => {
  const {
    effectiveMonthly,
    effectiveYearly,
    userCustomMonthly,
    userCustomYearly,
    resolvedUserType,
    isCustomPricing
  } = usePricing();

  const yearlySavings = Math.max(0, effectiveMonthly * 12 - effectiveYearly);
  const yearlySavingsPct = effectiveMonthly > 0 ? Math.round((yearlySavings / (effectiveMonthly * 12)) * 100) : 0;

  const isCustomMonthly = userCustomMonthly !== null && userCustomMonthly !== undefined;
  const isCustomYearly = userCustomYearly !== null && userCustomYearly !== undefined;

  return (
    <div className="space-y-6">
      {/* 1. TOP MEMBERSHIP STATUS HERO */}
      <Card className="rounded-2xl border border-border shadow-md bg-card overflow-hidden" id="membership">
        <div className="p-5 md:p-8 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-gradient-to-r from-primary/10 via-emerald-500/10 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-black tracking-tight text-foreground">Membership & Subscription</h2>
                <Badge variant="outline" className={cn(
                  "text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs",
                  isStaff
                    ? "bg-blue-500/15 text-blue-600 border-blue-500/30"
                    : isProActive
                      ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                      : isTrialActive
                        ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                        : "bg-muted text-muted-foreground border-border"
                )}>
                  {isStaff
                    ? 'ENTERPRISE SEAT'
                    : isProActive
                      ? 'PRO UNLIMITED'
                      : isTrialActive
                        ? '7-DAY TRIAL'
                        : 'FREE TIER'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                {isStaff
                  ? 'Staff seat operating under authorized enterprise company license'
                  : isProActive
                    ? `Active & Verified • Valid until ${safelyToLocaleDate(profile.subscription_expires_at)} (${countdownText})`
                    : isTrialActive
                      ? `${trialDaysRemaining} days remaining in your unrestricted Pro trial`
                      : 'Upgrade to remove limits and unlock all 10 invoice templates and automated billing'}
              </p>
            </div>
          </div>

          {/* Status indicator / Expiry badge */}
          {!isStaff && isProActive && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl text-emerald-700 dark:text-emerald-300 shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-wider leading-none">Subscription Active</p>
                <p className="text-xs font-bold mt-0.5">{countdownText}</p>
              </div>
            </div>
          )}
        </div>

        {/* Staff inheritance banner */}
        {isStaff && (
          <div className="m-4 md:m-8 p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-4 text-blue-900 dark:text-blue-200 text-xs font-medium">
            <ShieldCheck className="w-7 h-7 shrink-0 text-blue-600" />
            <div>
              <p className="font-bold text-sm">Enterprise Multi-Seat License</p>
              <p className="text-xs opacity-90 mt-0.5 leading-relaxed">
                Your staff seat inherits unlimited Pro invoicing, automated e-way billing, and custom templates from <strong>{companyProfile?.company_name || profile.company_name || 'Your Company'}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Trial active notice banner */}
        {!isStaff && isTrialActive && (
          <div className="m-4 md:m-8 p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/10 border border-amber-300 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-950 dark:text-amber-200">You are enjoying full Pro features during your 7-Day Trial</p>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  {trialDaysRemaining} days remaining. Lock in your introductory pricing below to prevent any workflow interruption.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => {
                const el = document.getElementById('pricing-plans-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="shrink-0 h-9 font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white uppercase tracking-wider shadow-sm"
            >
              View Upgrade Plans
            </Button>
          </div>
        )}

        {/* 2. COMPREHENSIVE MEMBERSHIP & LICENSE DETAILS */}
        <div className="p-4 md:p-8 space-y-6">
          {/* 4-Stat Metric Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5 shadow-2xs hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Plan</span>
                <Badge className={cn(
                  "text-[10px] font-bold uppercase py-0.5",
                  isProActive ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" : "bg-muted text-muted-foreground"
                )}>
                  {isProActive ? 'Active Pro' : isTrialActive ? 'Trial' : 'Free'}
                </Badge>
              </div>
              <p className="text-xl font-black text-foreground">Pro Unlimited</p>
              <p className="text-[11px] text-muted-foreground">All features & 10 templates unlocked</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5 shadow-2xs hover:border-primary/40 transition-colors">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Valid Until</span>
              <p className="text-xl font-black text-foreground">
                {profile.subscription_expires_at ? safelyToLocaleDate(profile.subscription_expires_at) : (isTrialActive ? `${trialDaysRemaining} Days left` : 'Expired')}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold">{countdownText || 'Requires Activation'}</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5 shadow-2xs hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tax Invoicing</span>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded">SAC 998313</span>
              </div>
              <p className="text-xl font-black text-foreground">100% ITC Eligible</p>
              <p className="text-[11px] text-muted-foreground">Full Input Tax Credit claimable</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5 shadow-2xs hover:border-primary/40 transition-colors">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Team Access</span>
              <p className="text-xl font-black text-foreground">Multi-Seat Team</p>
              <p className="text-[11px] text-muted-foreground">Unlimited staff & custom roles</p>
            </div>
          </div>

          {/* Detailed License Information Card */}
          <div className="p-5 md:p-6 rounded-2xl border border-border bg-muted/10 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-primary" />
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">License & Account Specifications</h4>
              </div>
              <span className="text-[11px] font-mono font-bold bg-background border border-border px-2.5 py-1 rounded-md text-muted-foreground">
                License ID: EB-PRO-{(effectiveUserId || user?.id || '00000000').slice(0, 8).toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Business Category:</span>
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span>{USER_TYPE_LABELS[resolvedUserType]?.icon}</span>
                    <span>{USER_TYPE_LABELS[resolvedUserType]?.label} ({USER_TYPE_LABELS[resolvedUserType]?.badge})</span>
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Licensed Entity / Company:</span>
                  <span className="font-bold text-foreground">{companyProfile?.company_name || profile.company_name || 'Personal Business Account'}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Registered Admin Email:</span>
                  <span className="font-bold text-foreground">{user?.email || '—'}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Registered Phone:</span>
                  <span className="font-bold text-foreground">{profile.phone || user?.user_metadata?.mobile || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Registered GSTIN:</span>
                  <span className="font-bold text-primary uppercase">{profile.gstin || 'Unregistered / Consumer'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Subscription Type:</span>
                  <span className="font-bold text-foreground">
                    {isProActive
                      ? (profile.subscription_expires_at && (new Date(profile.subscription_expires_at).getTime() - now.getTime() > 100 * 864e5) ? 'Annual Pro (Yearly)' : 'Monthly Pro')
                      : isTrialActive ? '7-Day Full Pro Trial' : 'Free Starter Tier'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Expiry / Renewal Date:</span>
                  <span className="font-bold text-emerald-600">
                    {profile.subscription_expires_at ? safelyToLocaleDate(profile.subscription_expires_at) : (isTrialActive ? `${trialDaysRemaining} days remaining` : 'Expired')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Service Classification:</span>
                  <span className="font-bold text-foreground">SAC 998313 (Software ERP Services)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Payment Verification:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Razorpay Verified Gateway
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Privileges & Entitlements Grid */}
          <div className="p-5 md:p-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-primary/5 to-transparent space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Active Features & Entitlements</h4>
                <p className="text-xs text-muted-foreground">Full operational capabilities included in your current subscription</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs">
              {[
                { title: 'Unlimited GST Invoices', desc: 'No limits on bill generation' },
                { title: 'All 10 Invoice Templates', desc: 'Tally 46, Corporate, UPI, Export, POS' },
                { title: 'Dynamic UPI QR Codes', desc: '0% fee instant scan settlements' },
                { title: '1-Click WhatsApp Invoicing', desc: 'Direct PDF dispatch to clients' },
                { title: 'E-Way Bill & E-Invoice', desc: 'Pre-formatted compliant exports' },
                { title: 'Staff & Roles Delegation', desc: 'Custom permission controls' },
                { title: 'Financial Ledger Export', desc: '1-click offline Excel reports' },
                { title: 'Bank-Grade 256-Bit Cloud', desc: 'Encrypted daily auto-backups' }
              ].map((feat, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-card border border-border/70 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-foreground text-xs">{feat.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. EXTEND OR RENEW SUBSCRIPTION SECTION */}
          <div className="p-6 md:p-8 rounded-2xl border-2 border-primary/30 bg-gradient-to-b from-primary/[0.03] to-card space-y-6 shadow-sm" id="pricing-plans-section">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
                    {isProActive ? "VALIDITY EXTENSION" : "UPGRADE PLANS"}
                  </Badge>
                  <h3 className="text-xl font-black text-foreground">
                    {isProActive ? "Extend Validity / Add More Time" : "Choose Your Subscription Plan"}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isProActive
                    ? `Your plan is currently active with ${countdownText} remaining. Any extension seamlessly adds time (30 or 365 days) directly to your existing expiry date!`
                    : "Simple, transparent pricing. GST tax invoice provided automatically for 100% Input Tax Credit."}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Zero Days Lost • Seamless Stacking</span>
              </div>
            </div>

            {/* Active Category Pricing Notice */}
            <div className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{USER_TYPE_LABELS[resolvedUserType]?.icon || '🏢'}</span>
                <div>
                  <p className="text-xs font-black text-foreground">
                    Active Plan Category: {USER_TYPE_LABELS[resolvedUserType]?.badge || 'Business Tier'}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Rates are dynamically applied for your {USER_TYPE_LABELS[resolvedUserType]?.label} business operations.
                  </p>
                </div>
              </div>
              {isCustomPricing ? (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold uppercase tracking-wider shrink-0">
                  Custom Deal
                </Badge>
              ) : (
                <Badge variant="outline" className="text-primary border-primary/30 text-[10px] font-bold uppercase tracking-wider shrink-0">
                  {USER_TYPE_LABELS[resolvedUserType]?.label} Tier
                </Badge>
              )}
            </div>

            {/* Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* MONTHLY PLAN CARD */}
              <div
                onClick={() => setSelectedPlan('monthly')}
                className={cn(
                  "relative rounded-2xl border-2 p-6 flex flex-col justify-between transition-all duration-200 cursor-pointer bg-card hover:shadow-lg",
                  selectedPlan === 'monthly'
                    ? "border-primary ring-2 ring-primary/20 shadow-md bg-primary/[0.02]"
                    : "border-border hover:border-primary/40"
                )}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {isProActive ? "+30 Days Extension" : "Flexible Monthly"}
                      </span>
                      <h4 className="text-2xl font-black text-foreground mt-0.5">Monthly Plan</h4>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      selectedPlan === 'monthly' ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                    )}>
                      {selectedPlan === 'monthly' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-3xl font-black text-foreground">₹{effectiveMonthly.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-muted-foreground font-semibold">/ month</span>
                      {isCustomMonthly && (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                          Custom Rate
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isProActive
                        ? "Adds 30 full days directly to your current expiry date."
                        : "Billed monthly. Pause, renew or cancel anytime with one click."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/60 space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Plan Features:</p>
                    {[
                      'Unlimited GST Invoices & Bills',
                      'All 10 GST & Export Invoice Templates',
                      'Dynamic UPI QR Codes on Bills (PhonePe, GPay)',
                      '1-Click WhatsApp & Email Invoicing',
                      'Automated Overdue Payment Reminders',
                      'Staff Accounts & Custom Permissions',
                      'Instant Excel Financial Reports & Exports'
                    ].map((feat, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs text-foreground/90">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlan('monthly');
                      handleUpgrade('monthly');
                    }}
                    disabled={settingsSaving}
                    variant={selectedPlan === 'monthly' ? "default" : "outline"}
                    className="w-full h-11 font-bold text-xs uppercase tracking-wider gap-2 shadow-sm"
                  >
                    <Zap className="w-4 h-4" />
                    {settingsSaving && selectedPlan === 'monthly'
                      ? 'Preparing Checkout...'
                      : isProActive
                        ? `Extend 1 Month (+30 Days) • ₹${effectiveMonthly.toLocaleString('en-IN')}`
                        : `Upgrade Monthly (₹${effectiveMonthly.toLocaleString('en-IN')})`}
                  </Button>
                </div>
              </div>

              {/* YEARLY PLAN CARD */}
              <div
                onClick={() => setSelectedPlan('yearly')}
                className={cn(
                  "relative rounded-2xl border-2 p-6 flex flex-col justify-between transition-all duration-200 cursor-pointer bg-card hover:shadow-xl",
                  selectedPlan === 'yearly'
                    ? "border-primary ring-2 ring-primary/40 shadow-xl bg-gradient-to-b from-primary/[0.04] to-card"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider py-1 px-3.5 rounded-full shadow-md flex items-center gap-1.5 z-10">
                  <Sparkles className="w-3 h-3 fill-current" />
                  Best Value • Save {yearlySavingsPct}%
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        {isProActive ? "+365 Days Extension" : "Annual Commitment"}
                      </span>
                      <h4 className="text-2xl font-black text-foreground mt-0.5">Yearly Plan</h4>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      selectedPlan === 'yearly' ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                    )}>
                      {selectedPlan === 'yearly' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-3xl font-black text-foreground">₹{effectiveYearly.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-muted-foreground font-semibold">/ year</span>
                      {isCustomYearly && (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                          Custom Rate
                        </Badge>
                      )}
                      <span className="ml-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        ₹{Math.round(effectiveYearly / 12).toLocaleString('en-IN')}/mo effective
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isProActive
                        ? "Adds 365 full days directly to your current expiry date with 2 months free."
                        : "Billed annually. Includes 365 days of full unlimited access & VIP priority support."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/60 space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Everything in Monthly, plus:</p>
                    {[
                      'All Monthly Features Included',
                      `Save ₹${yearlySavings.toLocaleString('en-IN')} annually`,
                      'Priority 24/7 Dedicated WhatsApp Support',
                      'Unlimited Staff & Multi-seat Team Logins',
                      'Free GST & Regulatory Tax Updates for 1 Year',
                      'Complimentary Custom Branding / Header Setup',
                      'Dedicated Account Onboarding Assistance'
                    ].map((feat, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs text-foreground/90 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlan('yearly');
                      handleUpgrade('yearly');
                    }}
                    disabled={settingsSaving}
                    className="w-full h-11 font-bold text-xs uppercase tracking-wider gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    {settingsSaving && selectedPlan === 'yearly'
                      ? 'Preparing Checkout...'
                      : isProActive
                        ? `Extend 1 Year (+365 Days) • ₹${effectiveYearly.toLocaleString('en-IN')}`
                        : `Upgrade Yearly (₹${effectiveYearly.toLocaleString('en-IN')}) • Save ${yearlySavingsPct}%`}
                  </Button>
                </div>
              </div>
            </div>

            {/* Stacking Guarantee Callout */}
            <div className="p-3.5 rounded-xl bg-background border border-border/80 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span>
                  {isProActive ? (
                    <>
                      Selecting <strong>{selectedPlan === 'yearly' ? '1 Year (+365 Days)' : '1 Month (+30 Days)'}</strong> will extend your active expiry date without losing remaining time.
                    </>
                  ) : (
                    <>Your membership activates instantly upon payment confirmation.</>
                  )}
                </span>
              </div>
              <span className="font-semibold text-foreground">Instant Razorpay Gateway Activation</span>
            </div>
          </div>

          {/* 4. GST TAX INVOICE & VIP SUPPORT ASSISTANCE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
              <div className="flex items-center gap-2.5 text-primary">
                <Receipt className="w-5 h-5" />
                <h4 className="font-bold text-sm text-foreground">Official GST Tax Invoice</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every membership payment generates an authorized digital GST Tax Invoice under SAC Code <strong>998313</strong>. Your registered GSTIN and company address will be automatically populated so you can claim 100% Input Tax Credit (ITC).
              </p>
              <div className="pt-1 flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>100% Tax Deductible Business Expense</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-600">
                <Headphones className="w-5 h-5" />
                <h4 className="font-bold text-sm text-foreground">Dedicated VIP Customer Helpline</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Need custom invoices, multi-branch setups, or billing queries? Our dedicated account managers are available directly on WhatsApp and phone for immediate assistance.
              </p>
              <div className="pt-1 flex items-center gap-3">
                <a
                  href="https://wa.me/919328028207?text=Hello%2C%20I%20have%20a%20query%20about%20my%20EscrowBill%20subscription."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat on WhatsApp</span>
                </a>
                <span className="text-xs text-muted-foreground font-medium">Phone: +91 93280 28207</span>
              </div>
            </div>
          </div>

          {/* 5. VALUE HIGHLIGHTS 4-PILLAR GRID */}
          <div className="pt-4 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground text-center">
              Why Leading Businesses Choose Escrow Bill Pro
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <p className="font-bold text-sm text-foreground">10 Invoice Templates</p>
                <p className="text-xs text-muted-foreground">
                  Switch between Tally Rule 46, Corporate, Export LUT, Retail POS & Creative formats instantly.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <p className="font-bold text-sm text-foreground">Instant UPI Payments</p>
                <p className="text-xs text-muted-foreground">
                  Dynamic scannable UPI QR codes on every invoice for 3x faster settlements via PhonePe & GPay.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <p className="font-bold text-sm text-foreground">Staff & Roles</p>
                <p className="text-xs text-muted-foreground">
                  Add accountants, sales reps, and billing operators with granular permission controls.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <p className="font-bold text-sm text-foreground">Data Sovereignty</p>
                <p className="text-xs text-muted-foreground">
                  Bank-grade 256-bit encryption with complete 1-click Excel financial ledger export.
                </p>
              </div>
            </div>
          </div>

          {/* 6. TRUST, ITC & GUARANTEE RIBBON */}
          <div className="p-4 md:p-6 border rounded-2xl bg-muted/20 flex flex-wrap items-center justify-around gap-4 text-center">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Razorpay Verified Gateway</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Receipt className="w-4 h-4 text-primary" />
              <span>100% GST ITC Tax Invoice Provided</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>UPI • Cards • NetBanking • EMI</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>7-Day Money-Back Guarantee</span>
            </div>
          </div>

          {/* 7. MEMBERSHIP FAQ */}
          <div className="p-5 md:p-8 border rounded-2xl bg-card space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Frequently Asked Questions</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/10 space-y-1">
                <p className="font-bold text-xs text-foreground">Will I get a GST tax invoice for this payment?</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Yes! Immediately upon payment, an official GST tax invoice with your company name, address, and GSTIN is automatically generated under SAC 998313 so you can claim full Input Tax Credit (ITC).
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/10 space-y-1">
                <p className="font-bold text-xs text-foreground">Does early renewal overwrite my existing days?</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  No! All extensions stack seamlessly. If you have 30 days left and renew for 1 year, your new validity will be 395 days. You will never lose any active days.
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/10 space-y-1">
                <p className="font-bold text-xs text-foreground">What happens when my subscription period ends?</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your existing invoices, clients, products, and records remain 100% safe and intact. You can renew at any time without losing any historical data.
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/10 space-y-1">
                <p className="font-bold text-xs text-foreground">Which payment methods are supported?</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  We support all major payment modes including UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, MasterCard, RuPay), and 50+ NetBanking banks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
