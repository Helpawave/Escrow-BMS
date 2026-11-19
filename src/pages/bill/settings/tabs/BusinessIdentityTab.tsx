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
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Building2,
  Lock,
  ShieldAlert,
  Copy,
  CheckCircle2,
  Loader2,
  User,
  MapPin,
  Landmark,
  Settings as SettingsIcon,
  QrCode,
  Palette,
  X,
  ShieldCheck,
  Sparkles,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateAccountId } from "@/utils/accountId";
import QRCode from "react-qr-code";
import { isValidUpiId, normalizeUpiId } from "@/utils/upi";

export interface BusinessProfile {
  company_name?: string;
  business_address?: string;
  gstin?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  logo_url?: string;
  signature_url?: string;
  upi_qr_url?: string;
  upi_id?: string;
  settings_locked?: boolean;
  state?: string;
  city?: string;
  pincode?: string;
  bank_name?: string;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_type?: string;
  [key: string]: any;
}

export interface BusinessUserSettings {
  hide_company_details: boolean;
  [key: string]: any;
}

export interface BusinessIdentityTabProps {
  isStaff: boolean;
  profile: BusinessProfile;
  setProfile: React.Dispatch<React.SetStateAction<any>>;
  companyProfile?: BusinessProfile | null;
  staffRole?: string;
  user: any;
  handleToggleLock: () => void;
  handleProfileSave: () => Promise<void>;
  profileSaving: boolean;
  gstVerified: boolean;
  setGstVerified: (v: boolean) => void;
  verifiedGstName: string | null;
  setVerifiedGstName: (v: string | null) => void;
  gstVerificationData: any;
  setGstVerificationData: (v: any) => void;
  gstVerifying: boolean;
  handleVerifyGST: () => Promise<void>;
  personalName: string;
  setPersonalName: (v: string) => void;
  personalPhone: string;
  setPersonalPhone: (v: string) => void;
  bankSelection: string;
  handleBankSelection: (v: string) => void;
  bankSearchOpen: boolean;
  setBankSearchOpen: (v: boolean) => void;
  bankOptions: string[];
  CUSTOM_BANK_VALUE: string;
  handleRemoveLogo: () => Promise<void>;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleSignatureUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  logoUploading: boolean;
  settings: BusinessUserSettings;
  setSettings: (s: any) => void;
  handleSettingsSave: (newSettings?: any, opts?: { showToast?: boolean; isManual?: boolean }) => Promise<any>;
  toast: any;
}

export const BusinessIdentityTab: React.FC<BusinessIdentityTabProps> = ({
  isStaff,
  profile,
  setProfile,
  companyProfile,
  staffRole,
  user,
  handleToggleLock,
  handleProfileSave,
  profileSaving,
  gstVerified,
  setGstVerified,
  verifiedGstName,
  setVerifiedGstName,
  gstVerificationData,
  setGstVerificationData,
  gstVerifying,
  handleVerifyGST,
  personalName,
  setPersonalName,
  personalPhone,
  setPersonalPhone,
  bankSelection,
  handleBankSelection,
  bankSearchOpen,
  setBankSearchOpen,
  bankOptions,
  CUSTOM_BANK_VALUE,
  handleRemoveLogo,
  handleLogoUpload,
  handleSignatureUpload,
  logoUploading,
  settings,
  setSettings,
  handleSettingsSave,
  toast,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* PRIMARY BUSINESS RECORDS (LEFT: 8 COLS) */}
      <div className="lg:col-span-8 space-y-6">
        {/* 1. Company Identity & Registration */}
        <Card className="rounded-xl border border-border shadow-sm bg-card overflow-hidden" id="business">
          <div className="p-4 md:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-foreground">{isStaff ? 'Staff Profile & Organization' : 'Business Identity'}</h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {isStaff ? 'Personal staff profile and organization records' : 'Company profile used on invoices, receipts & GST returns'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isStaff && (
                <Button
                  onClick={handleToggleLock}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "relative h-9 rounded-md font-bold text-xs transition-all",
                    profile.settings_locked
                      ? "border-amber-500/70 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                  title={profile.settings_locked ? "Click to unlock profile for editing" : "Lock profile to prevent accidental changes"}
                >
                  {profile.settings_locked ? (
                    <>
                      <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-600 dark:text-amber-400" />
                      Unlock Profile
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                      Lock Fields
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={handleProfileSave}
                disabled={profileSaving}
                size="sm"
                className="h-9 rounded-md font-bold text-xs shadow-sm"
              >
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-6">
            {/* OWNER VIEW */}
            {!isStaff && (
              <>
                {/* Profile Locked Banner */}
                {profile.settings_locked && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <span className="font-bold">Profile is Currently Locked:</span>{" "}
                        <span>All fields are protected against accidental modifications. Click Unlock to edit your details or UPI ID.</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleToggleLock}
                      className="h-7 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 shadow-xs"
                    >
                      <Lock className="w-3 h-3 mr-1.5" />
                      Unlock Now
                    </Button>
                  </div>
                )}

                {/* Admin Info Banner */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">Company Administrator</span>
                        <Badge variant="outline" className="text-[10px] font-semibold py-0">Owner</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Login: <span className="font-medium text-foreground">{user?.email}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-background border border-border px-3 py-1 rounded-lg shrink-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Account ID:</span>
                    <span className="font-mono font-bold tracking-widest text-primary text-xs">{generateAccountId(user?.id)}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(generateAccountId(user?.id));
                          toast({ title: "Copied", description: "Account ID copied to clipboard." });
                        } catch {}
                      }}
                      className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
                      title="Copy Account ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Company Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="company_name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company Legal Name</Label>
                    <Input
                      id="company_name"
                      value={profile.company_name || ''}
                      onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                      placeholder="e.g. Acme Corporation Pvt Ltd"
                      disabled={profile.settings_locked}
                      className={cn("bg-background h-10", profile.settings_locked && "bg-muted")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gstin" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">GSTIN Number</Label>
                    <div className="relative flex items-center">
                      <Input
                        id="gstin"
                        value={profile.gstin || ''}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
                          setProfile({ ...profile, gstin: val });
                          if (gstVerified) {
                            setGstVerified(false);
                            setVerifiedGstName(null);
                            setGstVerificationData(null);
                          }
                        }}
                        placeholder="22AAAAA0000A1Z5"
                        disabled={profile.settings_locked}
                        className={cn(
                          "bg-background uppercase h-10 font-mono tracking-wider pr-28",
                          profile.settings_locked && "bg-muted",
                          gstVerified && "border-emerald-500/80 focus-visible:ring-emerald-500"
                        )}
                      />

                      {/* Verify button OR Green Tick */}
                      <div className="absolute right-2 flex items-center gap-1.5">
                        {gstVerifying ? (
                          <div className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                            <span>Checking...</span>
                          </div>
                        ) : gstVerified ? (
                          <div className="flex items-center pr-1 animate-in zoom-in-75 duration-200" title="GSTIN Verified">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleVerifyGST}
                            disabled={!profile.gstin || profile.gstin.trim().length !== 15 || profile.settings_locked}
                            className="h-7 text-xs px-2.5 font-bold text-primary border-primary/30 hover:bg-primary/10 transition-all cursor-pointer"
                          >
                            Verify
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* GST Verification Result Card */}
                    {gstVerified && verifiedGstName && (
                      <div className="mt-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/60 border-b border-emerald-200 dark:border-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Verified — GST Portal Record</span>
                          <span className={`ml-auto text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${(gstVerificationData?.status || '').toLowerCase() === 'active'
                            ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200'
                            : 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                            }`}>{gstVerificationData?.status || 'Active'}</span>
                        </div>
                        <div className="px-3 py-2.5 space-y-1.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Legal Name</span>
                            <span className="text-xs font-bold text-foreground">{gstVerificationData?.legalName || verifiedGstName}</span>
                          </div>
                          {gstVerificationData?.tradeName && gstVerificationData.tradeName !== gstVerificationData.legalName && (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Trade Name</span>
                              <span className="text-xs font-medium text-foreground">{gstVerificationData.tradeName}</span>
                            </div>
                          )}
                          <div className="flex gap-4">
                            {gstVerificationData?.entityType && (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Type</span>
                                <span className="text-xs font-medium text-foreground">{gstVerificationData.entityType}</span>
                              </div>
                            )}
                            {gstVerificationData?.state && (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">State</span>
                                <span className="text-xs font-medium text-foreground">{gstVerificationData.state}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="10-digit mobile number"
                      pattern="[6-9][0-9]{9}"
                      minLength={10}
                      maxLength={10}
                      disabled={profile.settings_locked}
                      className={cn("bg-background h-10", profile.settings_locked && "bg-muted")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="website" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Official Website</Label>
                    <Input
                      id="website"
                      value={profile.website || ''}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="https://yourcompany.com"
                      disabled={profile.settings_locked}
                      className={cn("bg-background h-10 font-medium", profile.settings_locked && "bg-muted")}
                    />
                  </div>
                </div>
              </>
            )}

            {/* STAFF VIEW */}
            {isStaff && (
              <>
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-foreground">{companyProfile?.company_name || profile.company_name || 'Organization Workspace'}</h4>
                        <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-wider">Staff Account</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Assigned Role: <strong className="text-primary">{staffRole || 'Staff Member'}</strong> • Company records are managed by administrator
                      </p>
                    </div>
                  </div>
                </div>

                {/* Staff Personal Profile */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Staff Personal Profile</h4>
                      <p className="text-[11px] text-muted-foreground">Your individual login identity & contact</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="personal_name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name *</Label>
                      <Input
                        id="personal_name"
                        value={personalName}
                        onChange={(e) => setPersonalName(e.target.value)}
                        placeholder="Your Full Name"
                        required
                        className="bg-background h-10 font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="personal_email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Login Email Address</Label>
                      <Input
                        id="personal_email"
                        value={user?.email || ''}
                        disabled
                        className="bg-muted/50 h-10 font-medium text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="personal_phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Personal Mobile Number</Label>
                      <Input
                        id="personal_phone"
                        type="tel"
                        inputMode="numeric"
                        value={personalPhone}
                        onChange={(e) => setPersonalPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit mobile number"
                        pattern="[6-9][0-9]{9}"
                        minLength={10}
                        maxLength={10}
                        className="bg-background h-10 font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="account_id" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Staff Account ID</Label>
                      <div className="relative flex items-center">
                        <Input
                          id="account_id"
                          value={generateAccountId(user?.id)}
                          disabled
                          className="bg-muted/50 h-10 font-mono font-bold tracking-widest text-primary text-sm pr-10 cursor-not-allowed"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(generateAccountId(user?.id));
                              toast({ title: "Copied", description: "Account ID copied to clipboard." });
                            } catch {}
                          }}
                          className="absolute right-3 text-muted-foreground hover:text-foreground p-1"
                          title="Copy Account ID"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Read-only Organization Info */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Organization Business Identity</h4>
                      <p className="text-[11px] text-muted-foreground">Managed by company administrator (Read-only)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company Name</Label>
                      <Input value={companyProfile?.company_name || profile.company_name || ''} disabled className="bg-muted h-10 cursor-not-allowed" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">GSTIN</Label>
                      <Input value={companyProfile?.gstin || profile.gstin || ''} disabled className="bg-muted h-10 cursor-not-allowed uppercase" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company Phone</Label>
                      <Input value={companyProfile?.phone || profile.phone || ''} disabled className="bg-muted h-10 cursor-not-allowed" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Website</Label>
                      <Input value={companyProfile?.website || profile.website || ''} disabled className="bg-muted h-10 cursor-not-allowed" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* 2. Registered Business Address Card */}
        <Card className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
          <div className="p-4 md:p-5 border-b flex items-center gap-3 bg-muted/10">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-tight text-foreground">Registered Business Address</h4>
              <p className="text-xs text-muted-foreground">Official premises printed on tax invoices, delivery challans, and e-Way bills</p>
            </div>
          </div>
          <div className="p-4 md:p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="business_address" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Street Address / Premises</Label>
              <Textarea
                id="business_address"
                value={profile.business_address || ''}
                onChange={(e) => setProfile({ ...profile, business_address: e.target.value })}
                placeholder="Plot/Flat No., Building Name, Street, Landmark"
                className={cn("min-h-[85px] bg-background font-medium", (profile.settings_locked || isStaff) && "bg-muted opacity-60")}
                disabled={profile.settings_locked || isStaff}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</Label>
                <Input
                  id="city"
                  value={profile.city || ''}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  disabled={profile.settings_locked || isStaff}
                  placeholder="e.g. Mumbai"
                  className={cn("h-10 bg-background font-medium", (profile.settings_locked || isStaff) && "bg-muted opacity-60")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">State</Label>
                <Input
                  id="state"
                  value={profile.state || ''}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  disabled={profile.settings_locked || isStaff}
                  placeholder="e.g. Maharashtra"
                  className={cn("h-10 bg-background font-medium", (profile.settings_locked || isStaff) && "bg-muted opacity-60")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pincode" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">PIN Code</Label>
                <Input
                  id="pincode"
                  value={profile.pincode || ''}
                  onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                  disabled={profile.settings_locked || isStaff}
                  placeholder="e.g. 400001"
                  className={cn("h-10 bg-background font-medium", (profile.settings_locked || isStaff) && "bg-muted opacity-60")}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 3. Settlement Bank Account Details */}
        <Card className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
          <div className="p-4 md:p-5 border-b flex items-center gap-3 bg-muted/10">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-tight text-foreground">Settlement Bank Account</h4>
              <p className="text-xs text-muted-foreground">Direct NEFT/RTGS/IMPS wire transfer details shown on client bills & receipts</p>
            </div>
          </div>
          <div className="p-4 md:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bank_name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bank Name</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full justify-between rounded-md bg-background border-border/70 font-medium px-3 text-xs"
                  onClick={() => setBankSearchOpen(true)}
                  disabled={profile.settings_locked || isStaff}
                >
                  <span className="truncate">
                    {bankSelection === CUSTOM_BANK_VALUE
                      ? profile.bank_name || "Select bank"
                      : bankSelection}
                  </span>
                  <SettingsIcon className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
                </Button>
                <CommandDialog open={bankSearchOpen} onOpenChange={setBankSearchOpen}>
                  <div className="p-2">
                    <CommandInput placeholder="Search over 50+ Indian banks..." className="border-none focus:ring-0" />
                    <CommandEmpty className="py-6 text-center text-sm">No bank matches found.</CommandEmpty>
                    <CommandList className="max-h-[300px]">
                      <CommandGroup heading="Verified Financial Institutions">
                        {bankOptions.map((bank) => (
                          <CommandItem
                            key={bank}
                            value={bank}
                            onSelect={(value) => {
                              handleBankSelection(value);
                              setBankSearchOpen(false);
                            }}
                            className="rounded-lg py-2.5 cursor-pointer text-xs"
                          >
                            {bank}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="Manual Entry">
                        <CommandItem
                          value="custom"
                          onSelect={() => {
                            handleBankSelection(CUSTOM_BANK_VALUE);
                            setBankSearchOpen(false);
                          }}
                          className="rounded-lg py-2.5 cursor-pointer font-bold text-primary text-xs"
                        >
                          Specified Bank Not Listed
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </div>
                </CommandDialog>
                {bankSelection === CUSTOM_BANK_VALUE && (
                  <Input
                    value={profile.bank_name || ''}
                    onChange={(e) => setProfile({ ...profile, bank_name: e.target.value })}
                    placeholder="Please enter your bank's full name"
                    disabled={profile.settings_locked || isStaff}
                    className="h-10 rounded-md bg-background border-border/70 font-medium mt-2 text-xs"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="account_type" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Type</Label>
                <Select
                  value={profile.account_type || ''}
                  onValueChange={(value) => setProfile({ ...profile, account_type: value })}
                  disabled={profile.settings_locked || isStaff}
                >
                  <SelectTrigger id="account_type" className="h-10 rounded-md bg-background border-border/70 text-xs font-medium">
                    <SelectValue placeholder="Current / Savings / Other" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">Savings Account</SelectItem>
                    <SelectItem value="current">Current Account</SelectItem>
                    <SelectItem value="overdraft">Overdraft Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="account_holder_name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Holder Name</Label>
                <Input
                  id="account_holder_name"
                  value={profile.account_holder_name || ''}
                  onChange={(e) => setProfile({ ...profile, account_holder_name: e.target.value })}
                  placeholder="Name on account"
                  disabled={profile.settings_locked || isStaff}
                  className="h-10 bg-background font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ifsc_code" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">IFSC Code</Label>
                <Input
                  id="ifsc_code"
                  value={profile.ifsc_code || ''}
                  onChange={(e) => setProfile({ ...profile, ifsc_code: e.target.value.toUpperCase() })}
                  disabled={profile.settings_locked || isStaff}
                  placeholder="e.g. HDFC0001234"
                  className="h-10 bg-background font-mono font-bold uppercase tracking-wider"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="account_number" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bank Account Number</Label>
                <Input
                  id="account_number"
                  inputMode="numeric"
                  value={profile.account_number || ''}
                  onChange={(e) => setProfile({ ...profile, account_number: e.target.value.replace(/\D/g, '') })}
                  disabled={profile.settings_locked || isStaff}
                  placeholder="e.g. 50100234567890"
                  className="h-10 bg-background font-mono font-bold tracking-widest"
                />
              </div>

              {/* UPI ID (VPA) */}
              <div className="space-y-3 sm:col-span-2 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <Label htmlFor="upi_id" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    UPI ID / VPA
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                      Auto-generates Scannable QR on Invoices
                    </span>
                  </Label>
                </div>

                <div className="space-y-2">
                  <Input
                    id="upi_id"
                    value={profile.upi_id || ''}
                    onChange={(e) => setProfile({ ...profile, upi_id: e.target.value.trim() })}
                    placeholder="e.g. 9876543210@paytm or ashte84694633@barodampay"
                    disabled={profile.settings_locked || isStaff}
                    className="h-10 bg-background font-medium border-emerald-300/80 focus:ring-emerald-500 rounded-lg text-sm"
                  />

                  {/* 1-Tap Handle Chips for Fast Setup */}
                  {!(profile.settings_locked || isStaff) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-muted-foreground font-semibold mr-1">Quick Add Handle:</span>
                      {['@paytm', '@ybl', '@okaxis', '@okhdfcbank', '@barodampay', '@sbi', '@icici'].map((handle) => (
                        <button
                          key={handle}
                          type="button"
                          onClick={() => {
                            const cur = (profile.upi_id || '').trim();
                            const base = cur.includes('@')
                              ? cur.split('@')[0]
                              : (cur || profile.phone || profile.mobile || '').replace(/[^0-9a-zA-Z._-]/g, '');
                            if (base) {
                              setProfile({ ...profile, upi_id: `${base}${handle}` });
                            } else {
                              setProfile({ ...profile, upi_id: handle });
                            }
                          }}
                          className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-muted hover:bg-emerald-100 hover:text-emerald-800 border border-border text-foreground transition-all"
                        >
                          {handle}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Real-time Live Scannable Preview */}
                {(() => {
                  const cleanUpi = (profile.upi_id || '').trim();
                  if (!cleanUpi) {
                    return (
                      <p className="text-xs text-muted-foreground flex items-start gap-1.5 mt-1">
                        <span className="text-emerald-600 font-bold shrink-0">ℹ️ Note:</span>
                        <span>Enter your UPI ID (or phone number + bank handle) here — invoices will automatically generate a dynamic, scannable QR code using this UPI ID for instant client payments. No photo or image upload is needed.</span>
                      </p>
                    );
                  }

                  const hasHandle = cleanUpi.includes('@');
                  const isTenDigitNumber = /^\d{10}$/.test(cleanUpi);

                  if (isTenDigitNumber && !hasHandle) {
                    return (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Missing Bank Handle (@handle):</span>
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                            Please select your UPI handle above (e.g. <span className="font-mono font-bold">@okaxis</span>, <span className="font-mono font-bold">@ybl</span>, <span className="font-mono font-bold">@paytm</span>) to attach it to your mobile number.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  if (!isValidUpiId(cleanUpi)) {
                    return (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Invalid UPI ID format:</span>
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                            UPI IDs must follow the format <span className="font-mono font-bold">username@bank</span> or <span className="font-mono font-bold">mobilenumber@bank</span>.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  const sanitizedPa = normalizeUpiId(cleanUpi) || cleanUpi;

                  return (
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-center gap-4">
                      <div className="p-2 bg-white rounded-lg border-2 border-emerald-600 shadow-sm shrink-0">
                        <QRCode
                          value={`upi://pay?pa=${encodeURIComponent(sanitizedPa)}&pn=${encodeURIComponent(profile.account_holder_name || profile.company_name || 'Business')}&cu=INR`}
                          size={84}
                        />
                      </div>
                      <div className="space-y-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Live Scannable QR Verified</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Linked VPA: <span className="font-mono font-bold text-foreground">{sanitizedPa}</span>
                        </p>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                          📱 Scan this QR with PhonePe / GPay right now on your screen to test and confirm payee name!
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* BRANDING, ASSETS & INVOICING CONTROLS (RIGHT: 4 COLS - STICKY) */}
      <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
        {/* 4. Branding & Print Assets Card */}
        <Card className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
          <div className="p-4 border-b flex items-center gap-2.5 bg-muted/10">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-tight text-foreground">Branding & Print Assets</h4>
              <p className="text-[11px] text-muted-foreground">Rendered on invoices, receipts & thermal slips</p>
            </div>
          </div>

          <div className="p-4 space-y-5">
            {/* Company Logo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">Company Logo</Label>
                <span className="text-[10px] text-muted-foreground">PNG/JPG (Max 2MB)</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/20 border border-dashed border-border text-center space-y-2.5">
                {profile.logo_url ? (
                  <div className="relative group mx-auto w-24 h-20">
                    <img src={profile.logo_url} alt="Logo" className="w-full h-full object-contain bg-white rounded-lg shadow-xs border p-1" />
                    {!isStaff && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Remove company logo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto text-primary">
                    <Building2 className="w-6 h-6" />
                  </div>
                )}
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={profile.settings_locked || isStaff || logoUploading}
                    className="block w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Authorized Signature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">Authorized Signature</Label>
                <span className="text-[10px] text-muted-foreground">Sign stamp</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/20 border border-dashed border-border text-center space-y-2.5">
                {profile.signature_url ? (
                  <div className="relative group mx-auto w-28 h-16">
                    <img src={profile.signature_url} alt="Sign" className="w-full h-full object-contain bg-white rounded-lg shadow-xs border p-1" />
                    {!isStaff && (
                      <button
                        onClick={() => setProfile({ ...profile, signature_url: '' })}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mx-auto text-indigo-600">
                    <Palette className="w-6 h-6" />
                  </div>
                )}
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    disabled={profile.settings_locked || isStaff || logoUploading}
                    className="block w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* 5. Invoice Display Privacy */}
        <Card className="rounded-xl border border-border shadow-sm bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Minimal Company Display
              </Label>
              <p className="text-[10px] text-muted-foreground">Hide full address/contact on invoices</p>
            </div>
            <Checkbox
              checked={settings.hide_company_details}
              onCheckedChange={(checked) => {
                const next = { ...settings, hide_company_details: !!checked };
                setSettings(next);
                void handleSettingsSave(next, { showToast: false });
              }}
            />
          </div>
        </Card>

        {/* 6. Profile Setup Completeness Overview */}
        <Card className="rounded-xl border border-border shadow-sm bg-muted/20 p-4 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Setup Completeness</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Company & GSTIN</span>
              {profile.company_name && profile.gstin ? (
                <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]"><Check className="w-3 h-3" /> Ready</span>
              ) : (
                <span className="text-amber-500 font-medium text-[11px]">Incomplete</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Registered Address</span>
              {profile.business_address && profile.city ? (
                <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]"><Check className="w-3 h-3" /> Ready</span>
              ) : (
                <span className="text-amber-500 font-medium text-[11px]">Incomplete</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Settlement Bank</span>
              {profile.bank_name && profile.account_number ? (
                <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]"><Check className="w-3 h-3" /> Ready</span>
              ) : (
                <span className="text-amber-500 font-medium text-[11px]">Incomplete</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Logo & Sign Stamp</span>
              {profile.logo_url || profile.signature_url ? (
                <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]"><Check className="w-3 h-3" /> Ready</span>
              ) : (
                <span className="text-muted-foreground font-medium text-[11px]">Optional</span>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
