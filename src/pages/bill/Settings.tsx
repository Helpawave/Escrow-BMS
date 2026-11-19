import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// dynamic import used for xlsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  User,
  Building2,
  Car,
  Bell,
  Shield,
  Palette,
  SlidersHorizontal,
  Lock,
  Mail,
  FileText,
  CheckCircle2,
  Check,
  Download,
  ShieldCheck,
  ShieldAlert,
  Save,
  Settings as SettingsIcon,
  Plus,
  CreditCard,
  Clock,
  Crown,
  Trash2,
  Copy,
  History,
  Info,
  ExternalLink,
  Sun,
  Moon,
  Eye,
  X,
  CreditCard as PaymentIcon,
  Zap,
  RefreshCw,
  QrCode,
  Printer,
  Globe,
  Receipt,
  Sparkles,
  Layers,
  Users,
  HelpCircle,
  MapPin,
  Landmark,
  Phone,
  MessageSquare,
  Headphones,
  Award,
  ShoppingBag,
  PackageCheck,
  Loader2,
  AlertTriangle,
  Cloud,
  CloudDownload,
  FileSpreadsheet,
  FileCode,
  HardDrive,
  ArrowRightLeft
} from "lucide-react";

import { supabase, serviceSupabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { generateAccountId } from "@/utils/accountId";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { InvoiceTemplate } from "@/components/InvoiceTemplate";
import { ResponsiveInvoiceWrapper } from "@/components/ResponsiveInvoiceWrapper";
import { InvoiceTemplateId } from "@/types/invoice";
import { PurchaseBillTemplate, PurchaseTemplateId } from "@/components/PurchaseBillTemplate";
import { AutoTemplateId } from "@/components/AutoInvoiceTemplate";
import { verifyGSTIN } from "@/utils/gstService";
import { AccountDeletionRequest } from "@/types/admin";
import { useUserType } from "@/hooks/useUserType";
import { BusinessTypeRequest, UserType, USER_TYPE_LABELS } from "@/types/admin";


interface Profile {
  email?: string | null;
  company_name: string;
  business_address: string;
  gstin: string;
  phone: string;
  mobile?: string;
  website: string;
  logo_url: string;
  signature_url: string;
  upi_qr_url: string;
  upi_id: string;
  settings_locked: boolean;
  state: string;
  city: string;
  pincode: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  account_type: string;
  subscription_expires_at?: string | null;
  plan_type?: string | null;
  custom_price?: number | null;
}

interface UserSettings {
  email_notifications: boolean;
  invoice_reminders: boolean;
  payment_alerts: boolean;
  auto_save_enabled: boolean;
  dark_mode: boolean;
  default_currency: string;
  default_payment_terms: string;
  default_terms: string;
  invoice_template: string;
  hide_company_details: boolean;
  whatsapp_provider?: 'meta' | 'personal';
}

import { RazorpayResponse, RazorpayOptions } from "@/types/razorpay";
import "@/types/razorpay";
import { usePricing } from "@/hooks/usePricing";
import { MembershipTab } from "./settings/tabs/MembershipTab";
import { BusinessIdentityTab } from "./settings/tabs/BusinessIdentityTab";
import { SystemPreferencesTab } from "./settings/tabs/SystemPreferencesTab";
import { InvoiceTemplatesTab } from "./settings/tabs/InvoiceTemplatesTab";
import { CloudBackupTab } from "./settings/tabs/CloudBackupTab";

const CUSTOM_BANK_VALUE = "__custom_bank__";
const FALLBACK_BANKS = [
  "AU Small Finance Bank",
  "Airtel Payments Bank",
  "Axis Bank",
  "Bandhan Bank",
  "Bank of America",
  "Bank of Baroda",
  "Bank of India",
  "Bank of Maharashtra",
  "Barclays Bank",
  "CSB Bank",
  "Canara Bank",
  "Central Bank of India",
  "Citi Bank",
  "City Union Bank",
  "Cosmos Bank",
  "DBS Bank India",
  "DCS Bank",
  "Deutsche Bank",
  "Dhanlaxmi Bank",
  "Equitas Small Finance Bank",
  "Federal Bank",
  "HDFC Bank",
  "HSBC Bank",
  "ICICI Bank",
  "IDBI Bank",
  "IDFC FIRST Bank",
  "Indian Bank",
  "Indian Overseas Bank",
  "IndusInd Bank",
  "JPMorgan Chase Bank",
  "Jammu & Kashmir Bank",
  "Jio Payments Bank",
  "Karnataka Bank",
  "Karur Vysya Bank",
  "Kotak Mahindra Bank",
  "Nainital Bank",
  "Paytm Payments Bank",
  "Punjab & Sind Bank",
  "Punjab National Bank",
  "RBL Bank",
  "Saraswat Bank",
  "Shamrao Vithal Bank",
  "South Indian Bank",
  "Standard Chartered Bank",
  "State Bank of India",
  "SVC Bank",
  "TJSB Bank",
  "Tamilnad Mercantile Bank",
  "UCO Bank",
  "Ujjivan Small Finance Bank",
  "Union Bank of India",
  "Yes Bank"
];

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      setTimeout(() => resolve(!!(window as any).Razorpay), 1500);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const hasSettingsBusinessTypeTable = false;

const SettingsPage = () => {
  const { user, profile: authProfile, signOut, isTrialActive, trialDaysRemaining, isStaff, companyProfile, staffRole, staffPermissions, effectiveUserId, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('business');
  const [profile, setProfile] = useState<Profile>({
    company_name: '',
    business_address: '',
    gstin: '',
    phone: '',
    website: '',
    logo_url: '',
    signature_url: '',
    upi_qr_url: '',
    upi_id: '',
    settings_locked: false,
    state: '',
    city: '',
    pincode: '',
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    account_type: '',
    subscription_expires_at: null
  });

  // GST Verification states
  const [gstVerifying, setGstVerifying] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);
  const [verifiedGstName, setVerifiedGstName] = useState<string | null>(null);
  const [gstVerificationData, setGstVerificationData] = useState<{
    legalName?: string;
    tradeName?: string;
    status?: string;
    state?: string;
    entityType?: string;
  } | null>(null);

  const handleVerifyGST = async () => {
    if (!profile.gstin || profile.gstin.trim().length !== 15) {
      toast({
        variant: "destructive",
        title: "Invalid GSTIN",
        description: "Please enter a valid 15-character GSTIN number."
      });
      return;
    }

    setGstVerifying(true);
    try {
      const result = await verifyGSTIN(profile.gstin);
      if (result.valid) {
        setGstVerified(true);
        // Show GST portal's official legal name in the verified panel (standard industry practice)
        const legalName = result.legalName || result.tradeName || result.name || "Verified Taxpayer";
        setVerifiedGstName(legalName);
        setGstVerificationData({
          legalName: result.legalName,
          tradeName: result.tradeName,
          status: result.status,
          state: result.state,
          entityType: result.entityType,
        });

        // Auto-fill address/state/pincode if empty, but do NOT overwrite company_name
        setProfile(prev => ({
          ...prev,
          ...(result.state ? { state: result.state } : {}),
          ...(result.pincode ? { pincode: result.pincode } : {}),
          ...(result.address && (!prev.business_address || prev.business_address.trim() === '') ? { business_address: result.address } : {})
        }));

        // Auto-save verified GSTIN to DB so it persists on refresh without manual Save
        if (user?.id) {
          const targetUserId = (isStaff && effectiveUserId) ? effectiveUserId : user.id;
          try {
            const { error: updErr } = await supabase
              .from('profiles')
              .update({
                gstin: profile.gstin.trim().toUpperCase(),
                updated_at: new Date().toISOString()
              })
              .eq('user_id', targetUserId);
            if (updErr) {
              await supabase
                .from('profiles')
                .insert({
                  user_id: targetUserId,
                  gstin: profile.gstin.trim().toUpperCase(),
                  updated_at: new Date().toISOString()
                });
            }
          } catch (saveErr) {
            console.warn('GSTIN auto-save failed (non-critical):', saveErr);
          }
        }

        toast({
          title: "GSTIN Verified & Saved",
          description: `${legalName} — ${result.status || 'Active'}`,
        });
      } else {
        setGstVerified(false);
        setVerifiedGstName(null);
        toast({
          variant: "destructive",
          title: "GST Verification Failed",
          description: result.error || "The entered GSTIN could not be verified on the government portal."
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Verification Error",
        description: "Unable to reach GST portal. Please try again."
      });
    } finally {
      setGstVerifying(false);
    }
  };

  // Plan selection state
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan === 'monthly' || plan === 'yearly') {
      setSelectedPlan(plan as 'monthly' | 'yearly');
    }

    const tab = searchParams.get('tab');
    if (tab) {
      if (['notifications', 'security', 'appearance', 'preferences'].includes(tab)) {
        setActiveSection('preferences');
      } else {
        setActiveSection(tab === 'profile' ? 'business' : tab);
      }
    }
  }, [searchParams]);

  // Dynamic Platform & User-Specific Pricing States (initialized safely from cache or universal defaults)
  const [platformMonthlyPrice, setPlatformMonthlyPrice] = useState<number>(() => {
    const cached = localStorage.getItem('escrow_platform_monthly');
    return cached && !isNaN(Number(cached)) && Number(cached) > 0 ? Number(cached) : 449;
  });
  const [platformYearlyPrice, setPlatformYearlyPrice] = useState<number>(() => {
    const cached = localStorage.getItem('escrow_platform_yearly');
    return cached && !isNaN(Number(cached)) && Number(cached) > 0 ? Number(cached) : 4499;
  });
  const [userCustomPrice, setUserCustomPrice] = useState<number | null>(null);
  const [userCustomMonthlyPrice, setUserCustomMonthlyPrice] = useState<number | null>(() => {
    const uid = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
    const email = (user?.email || authProfile?.email || '').toLowerCase().trim();
    const c1 = uid ? localStorage.getItem(`escrow_user_custom_monthly_${uid}`) : null;
    const c2 = email ? localStorage.getItem(`escrow_user_custom_monthly_${email}`) : null;
    const val = c1 || c2;
    return val && !isNaN(Number(val)) && Number(val) >= 0 ? Number(val) : null;
  });
  const [userCustomYearlyPrice, setUserCustomYearlyPrice] = useState<number | null>(() => {
    const uid = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
    const email = (user?.email || authProfile?.email || '').toLowerCase().trim();
    const c1 = uid ? localStorage.getItem(`escrow_user_custom_yearly_${uid}`) : null;
    const c2 = email ? localStorage.getItem(`escrow_user_custom_yearly_${email}`) : null;
    const val = c1 || c2;
    return val && !isNaN(Number(val)) && Number(val) >= 0 ? Number(val) : null;
  });

  // Dynamic pricing synchronized with usePricing hook (User-Type / Industry rates prioritized)
  const {
    effectiveMonthly: pricingEffectiveMonthly,
    effectiveYearly: pricingEffectiveYearly,
    isCustomPricing: pricingIsCustom
  } = usePricing();

  const effectiveMonthlyPrice = pricingEffectiveMonthly;
  const effectiveYearlyPrice = pricingEffectiveYearly;

  const isCustomMonthly = pricingIsCustom;
  const isCustomYearly = pricingIsCustom;

  const PLANS = useMemo(() => ({
    monthly: {
      amount: Math.round(effectiveMonthlyPrice * 100), // in paise for Razorpay
      price: effectiveMonthlyPrice,
      name: 'Monthly Plan',
      description: 'Pro features for 1 month'
    },
    yearly: {
      amount: Math.round(effectiveYearlyPrice * 100), // in paise for Razorpay
      price: effectiveYearlyPrice,
      name: 'Yearly Plan',
      description: 'Pro features for 1 year'
    }
  }), [effectiveMonthlyPrice, effectiveYearlyPrice]);

  const [settings, setSettings] = useState<UserSettings>({
    email_notifications: true,
    invoice_reminders: true,
    payment_alerts: true,
    auto_save_enabled: true,
    dark_mode: false,
    default_currency: 'INR',
    default_payment_terms: 'Net 30',
    default_terms: '',
    invoice_template: 'corporate',
    hide_company_details: false,
    whatsapp_provider: 'personal'
  });

  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getCountdownText = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 3650) return "Lifetime Access";
    if (days > 30) return `${days} Days left`;
    if (days > 0) return `${days} Days and ${hours}h left`;
    return `${hours}h ${minutes}m remaining`;
  };

  const [showExtendOptions, setShowExtendOptions] = useState(false);
  const [bankSearchOpen, setBankSearchOpen] = useState(false);
  const [bankSelection, setBankSelection] = useState<string>('');
  const [previewTemplate, setPreviewTemplate] = useState<InvoiceTemplateId | null>(null);

  // Password Change State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [isConfirmTemplateModalOpen, setIsConfirmTemplateModalOpen] = useState(false);
  const [confirmTemplateCheck, setConfirmTemplateCheck] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<UserSettings['invoice_template'] | null>(null);

  // WhatsApp Provider Double Verification State
  const [isWhatsAppConfirmOpen, setIsWhatsAppConfirmOpen] = useState(false);
  const [pendingWhatsAppProvider, setPendingWhatsAppProvider] = useState<'meta' | 'personal' | null>(null);
  const [confirmWhatsAppCheck, setConfirmWhatsAppCheck] = useState(false);
  const [whatsAppSaving, setWhatsAppSaving] = useState(false);

  const handleInitiateWhatsAppChange = (targetProvider: 'meta' | 'personal') => {
    if (targetProvider === (settings.whatsapp_provider ?? 'personal')) return;
    setPendingWhatsAppProvider(targetProvider);
    setConfirmWhatsAppCheck(false);
    setIsWhatsAppConfirmOpen(true);
  };

  const handleConfirmWhatsAppChange = async () => {
    if (!pendingWhatsAppProvider || !confirmWhatsAppCheck) return;
    setWhatsAppSaving(true);
    try {
      const next = { ...settings, whatsapp_provider: pendingWhatsAppProvider };
      setSettings(next);
      await handleSettingsSave(next, { showToast: true });
      setIsWhatsAppConfirmOpen(false);
    } finally {
      setWhatsAppSaving(false);
    }
  };

  const [bankOptions, setBankOptions] = useState<string[]>([]);

  // Failsafe safety timer: ensure Settings loader NEVER stays stuck
  useEffect(() => {
    const safety = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(safety);
  }, []);

  // Prefill profile immediately from AuthContext cache so the page loads instantly with 0ms lag
  useEffect(() => {
    const activeProf = (isStaff && companyProfile) ? companyProfile : authProfile;
    if (activeProf) {
      setProfile(prev => ({
        ...prev,
        company_name: activeProf.company_name || prev.company_name,
        business_address: activeProf.business_address || prev.business_address,
        gstin: activeProf.gstin || prev.gstin,
        phone: activeProf.phone || activeProf.mobile || prev.phone,
        website: activeProf.website || prev.website,
        logo_url: activeProf.logo_url || prev.logo_url,
        signature_url: activeProf.signature_url || prev.signature_url,
        upi_qr_url: (activeProf as any).upi_qr_url || prev.upi_qr_url,
        upi_id: (activeProf as any).upi_id || prev.upi_id,
        settings_locked: (activeProf as any).settings_locked ?? prev.settings_locked,
        state: activeProf.state || prev.state,
        city: activeProf.city || prev.city,
        pincode: activeProf.pincode || prev.pincode,
        bank_name: activeProf.bank_name || prev.bank_name,
        account_holder_name: activeProf.account_holder_name || prev.account_holder_name,
        account_number: activeProf.account_number || prev.account_number,
        ifsc_code: activeProf.ifsc_code || prev.ifsc_code,
        account_type: activeProf.account_type || prev.account_type,
        subscription_expires_at: activeProf.subscription_expires_at || prev.subscription_expires_at,
      }));
      setLoading(false);
    }
  }, [authProfile, companyProfile, isStaff]);
  const { theme, setTheme } = useTheme();
  const { setCurrencySymbol, setCurrencyCode, inrPerUnit, refreshRates } = useCurrency();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [personalName, setPersonalName] = useState('');
  const [personalPhone, setPersonalPhone] = useState('');
  const [personalSaving, setPersonalSaving] = useState(false);

  // Account Deletion Request states
  const [deletionRequest, setDeletionRequest] = useState<AccountDeletionRequest | null>(null);
  const [loadingDeletionRequest, setLoadingDeletionRequest] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTypeRequestModalOpen, setIsTypeRequestModalOpen] = useState(false);
  const [pendingTypeRequest, setPendingTypeRequest] = useState<BusinessTypeRequest | null>(null);
  const [requestedType, setRequestedType] = useState<UserType>('automobile');
  const [typeRequestReason, setTypeRequestReason] = useState('');
  const [isSubmittingTypeRequest, setIsSubmittingTypeRequest] = useState(false);
  const [cancellingTypeRequest, setCancellingTypeRequest] = useState(false);

  const fetchPendingTypeRequest = useCallback(async () => {
    if (!hasSettingsBusinessTypeTable || !user?.id) return;
    try {
      const { data, error } = await supabase
        .from('business_type_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .maybeSingle();
      if (error) {
        // Table does not exist in public schema, ignore silently
        return;
      }
      if (data) {
        setPendingTypeRequest(data as unknown as BusinessTypeRequest);
      } else {
        setPendingTypeRequest(null);
      }
    } catch {
      // Table does not exist
    }
  }, [user?.id]);

  useEffect(() => {
    if (!hasSettingsBusinessTypeTable || !user?.id) return;
    fetchPendingTypeRequest();

    const channel = supabase
      .channel(`business_type_req_user_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_type_requests',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchPendingTypeRequest();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchPendingTypeRequest]);

  const handleCancelTypeRequest = async () => {
    if (!pendingTypeRequest?.id) return;
    try {
      setCancellingTypeRequest(true);
      const { error } = await supabase
        .from('business_type_requests')
        .update({ status: 'cancelled' })
        .eq('id', pendingTypeRequest.id);
      if (error) throw error;
      toast({
        title: "Request Cancelled",
        description: "Your business type change request has been cancelled."
      });
      setPendingTypeRequest(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: err.message || "Failed to cancel request."
      });
    } finally {
      setCancellingTypeRequest(false);
    }
  };

  const handleSubmitTypeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    try {
      setIsSubmittingTypeRequest(true);
      const { error } = await supabase.from('business_type_requests').insert({
        user_id: user.id,
        user_email: user.email || '',
        company_name: profile.company_name || 'My Business',
        current_type: userType || 'normal',
        requested_type: requestedType,
        reason: typeRequestReason.trim() || null,
        status: 'pending'
      });
      if (error) throw error;
      toast({
        title: "Request Dispatched",
        description: "Your business type change request has been submitted to the admin for review."
      });
      setIsTypeRequestModalOpen(false);
      setTypeRequestReason('');
      fetchPendingTypeRequest();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: err.message || "Failed to submit request."
      });
    } finally {
      setIsSubmittingTypeRequest(false);
    }
  };
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteFeedback, setDeleteFeedback] = useState('');
  const [deleteConfirmWord, setDeleteConfirmWord] = useState('');
  const [deleteAcknowledgeExport, setDeleteAcknowledgeExport] = useState(false);
  const [submittingDeletionRequest, setSubmittingDeletionRequest] = useState(false);
  const [cancellingDeletionRequest, setCancellingDeletionRequest] = useState(false);

  const fetchDeletionRequest = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoadingDeletionRequest(true);
      const { data, error } = await (supabase as any)
        .from('account_deletion_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setDeletionRequest(data as unknown as AccountDeletionRequest);
      } else {
        setDeletionRequest(null);
      }
    } catch (err) {
      console.error('Error fetching deletion request:', err);
    } finally {
      setLoadingDeletionRequest(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchDeletionRequest();
    }
  }, [user?.id, fetchDeletionRequest]);

  const handleSubmitDeletionRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user?.id) return;

    if (isStaff) {
      toast({
        variant: "destructive",
        title: "Action Prohibited",
        description: "Staff members cannot request account deletion. Only account owners can perform this action."
      });
      return;
    }

    if (!deleteReason) {
      toast({
        variant: "destructive",
        title: "Reason Required",
        description: "Please select a reason for your account deletion request."
      });
      return;
    }

    if (deleteConfirmWord.trim().toUpperCase() !== 'DELETE') {
      toast({
        variant: "destructive",
        title: "Confirmation Required",
        description: "Please type DELETE to confirm your request."
      });
      return;
    }

    if (!deleteAcknowledgeExport) {
      toast({
        variant: "destructive",
        title: "Acknowledgement Required",
        description: "Please confirm that you understand your business records will be permanently erased."
      });
      return;
    }

    setSubmittingDeletionRequest(true);
    try {
      const { data, error } = await (supabase as any)
        .from('account_deletion_requests')
        .insert({
          user_id: user.id,
          user_email: user.email || '',
          company_name: profile.company_name || null,
          reason: deleteReason,
          feedback: deleteFeedback.trim() || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setDeletionRequest(data as unknown as AccountDeletionRequest);
      setIsDeleteModalOpen(false);
      setDeleteReason('');
      setDeleteFeedback('');
      setDeleteConfirmWord('');
      setDeleteAcknowledgeExport(false);

      toast({
        title: "Account Deletion Requested",
        description: "Your request has been submitted. Platform administrators have been notified."
      });
    } catch (err: any) {
      console.error("Error submitting account deletion request:", err);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: err.message || "Failed to submit deletion request. Please try again."
      });
    } finally {
      setSubmittingDeletionRequest(false);
    }
  };

  const handleCancelDeletionRequest = async () => {
    if (!deletionRequest?.id) return;
    setCancellingDeletionRequest(true);
    try {
      const { error } = await (supabase as any)
        .from('account_deletion_requests')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', deletionRequest.id);


      if (error) throw error;

      setDeletionRequest(prev => prev ? { ...prev, status: 'cancelled' } : null);
      toast({
        title: "Request Cancelled",
        description: "Your account deletion request has been safely cancelled."
      });
    } catch (err: any) {
      console.error("Error cancelling deletion request:", err);
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: err.message || "Failed to cancel deletion request."
      });
    } finally {
      setCancellingDeletionRequest(false);
    }
  };

  const countdownText = getCountdownText(profile.subscription_expires_at || null);
  const isProActive = Boolean(!isStaff && profile.subscription_expires_at && new Date(profile.subscription_expires_at) > now);


  const sampleInvoiceData = useMemo(() => ({
    invoice: {
      invoice_number: 'INV-2026-001',
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 15 * 864e5).toISOString(),
      status: 'sent',
      subtotal: 12500,
      tax_amount: 2250,
      discount_amount: 500,
      total_amount: 14250,
      currency: settings.default_currency || 'INR',
      notes: 'Thank you for your business! We appreciate your partnership and trust.',
      terms: '1. Please pay within 15 days of invoice date.\n2. Digital tax invoice generated via EscrowBill.'
    },
    client: {
      name: 'Acme Corporation Pvt Ltd',
      email: 'billing@acmecorp.com',
      phone: '+91 98765 43210',
      address: 'Plot No. 42, Tech Park, Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka',
      postal_code: '560066',
      country: 'India',
      gstin: '29ABCDE1234F1Z5'
    },
    items: [
      { description: 'Cloud Infrastructure Strategy & Setup', quantity: 1, rate: 8000, amount: 8000, tax_rate: 18, hsn_code: '998313' },
      { description: 'Security Audit, Compliance & SSL Cert', quantity: 1, rate: 4500, amount: 4500, tax_rate: 18, hsn_code: '998315' }
    ],
    company: {
      company_name: profile.company_name || 'YOUR BUSINESS NAME',
      email: user?.email || 'accounts@yourcompany.com',
      phone: profile.phone || '+91 99999 00000',
      business_address: profile.business_address || '123, Growth Hub, Phase II',
      city: profile.city || 'Gurugram',
      state: profile.state || 'Haryana',
      pincode: profile.pincode || '122001',
      gstin: profile.gstin || '06AAAAA0000A1Z5',
      bank_name: profile.bank_name || 'HDFC BANK LTD',
      account_number: profile.account_number || '50100123456789',
      ifsc_code: profile.ifsc_code || 'HDFC0000123',
      account_holder_name: profile.account_holder_name || profile.company_name || 'AUTHORIZED SIGNATORY',
      account_type: profile.account_type || 'Current Account',
      logo_url: profile.logo_url,
      signature_url: profile.signature_url,
      upi_qr_url: profile.upi_qr_url,
      upi_id: profile.upi_id,
    }
  }), [profile, user, settings.default_currency]);

  const { isAutomobile, userType } = useUserType();

  // Invoice Template Category Division: 'sales' vs 'purchase' vs 'automobile' (downpayment)
  const [templateCategory, setTemplateCategory] = useState<'sales' | 'purchase' | 'automobile'>('sales');

  useEffect(() => {
    if (!isAutomobile && templateCategory === 'automobile') {
      setTemplateCategory('sales');
    }
  }, [isAutomobile, templateCategory]);

  const [purchaseBillTemplate, setPurchaseBillTemplate] = useState<PurchaseTemplateId>(() => {
    return (localStorage.getItem('purchase_bill_template') as PurchaseTemplateId) || 'classic-blue';
  });
  const [previewPurchaseTemplate, setPreviewPurchaseTemplate] = useState<PurchaseTemplateId | null>(null);

  const [downpaymentTemplate, setDownpaymentTemplate] = useState<AutoTemplateId>(() => {
    return (localStorage.getItem('downpayment_template') as AutoTemplateId) || 'auto_classic';
  });

  const samplePurchaseData = useMemo(() => ({
    invoice: {
      invoice_number: 'PB-2026-089',
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30 * 864e5).toISOString(),
      status: 'pending',
      subtotal: 24500,
      tax_amount: 4410,
      discount_amount: 1000,
      total_amount: 27910,
      currency: settings.default_currency || 'INR',
      notes: '1. Inward inventory verified by store keeper.\n2. 100% ITC claimable under GST Section 16.',
      terms: 'Net 30 days payment by RTGS / Bank Cheque.'
    },
    vendor: {
      name: 'Apex Industrial Supplies Pvt Ltd',
      email: 'sales@apexsupplies.com',
      phone: '+91 98230 11223',
      address: 'Phase 3, Industrial Area, Sector 58',
      city: 'Noida',
      state: 'Uttar Pradesh',
      postal_code: '201301',
      country: 'India',
      gstin: '09AAACA1234E1Z1'
    },
    items: [
      { description: 'High Precision CNC Milling Components', quantity: 25, rate: 800, amount: 20000, tax_rate: 18, hsn_code: '846693' },
      { description: 'Industrial Grade Fasteners & Fixtures', quantity: 15, rate: 300, amount: 4500, tax_rate: 18, hsn_code: '731815' }
    ],
    company: {
      company_name: profile.company_name || 'YOUR BUSINESS NAME',
      email: user?.email || 'procurement@yourcompany.com',
      phone: profile.phone || '+91 99999 00000',
      business_address: profile.business_address || '123, Growth Hub, Phase II',
      city: profile.city || 'Gurugram',
      state: profile.state || 'Haryana',
      pincode: profile.pincode || '122001',
      gstin: profile.gstin || '06AAAAA0000A1Z5',
      logo_url: profile.logo_url,
      signature_url: profile.signature_url
    }
  }), [profile, user, settings.default_currency]);

  const sampleAutoData = useMemo(() => ({
    invoice: {
      invoice_number: 'DP-2026-0042',
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 15 * 864e5).toISOString(),
      status: 'paid',
      subtotal: 50000,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 50000,
      currency: settings.default_currency || 'INR',
      notes: '[META:{"is_downpayment":true,"vehicle":{"model":"Mahindra XUV700 AX7 Luxury Pack (Diesel AT)","vehicleNo":"DL-08-TC-2026","regNo":"DL-08-TC-2026","totalKm":"5000","serviceType":"1st Free Service","freeServiceNo":"1","totalFreeServices":3,"nextServiceKm":"7500","nextServiceDate":"15/11/2026","chassisNo":"MA1TN2WK0N1298412","color":"Midnight Black Metallic","financer":"HDFC Bank Auto Loan / Hypothecation","deliveryDate":"15-Nov-2026"}}]\nVehicle Booking Token & Advance Downpayment Receipt. Balance amount payable prior to vehicle registration and delivery.',
      terms: '1. Booking token is non-refundable upon vehicle allotment confirmation.\n2. Vehicle delivery subject to registration approval from Regional Transport Office (RTO).\n3. Dealership token voucher powered by EscrowBill.',
      vehicle_details: {
        model: 'Mahindra XUV700 AX7 Luxury Pack (Diesel AT)',
        vehicleNo: 'DL-08-TC-2026',
        regNo: 'DL-08-TC-2026',
        totalKm: '5000',
        serviceType: '1st Free Service',
        freeServiceNo: '1',
        totalFreeServices: 3,
        nextServiceKm: '7500',
        nextServiceDate: '15/11/2026',
        chassisNo: 'MA1TN2WK0N1298412',
        color: 'Midnight Black Metallic',
        financer: 'HDFC Bank Auto Loan / Hypothecation',
        deliveryDate: '15-Nov-2026'
      }
    },
    client: {
      name: 'Vikramaditya Verma',
      email: 'vikram.verma@example.com',
      phone: '+91 98112 34567',
      address: 'Flat 502, Prestige Tower, Golf Course Road',
      city: 'Gurugram',
      state: 'Haryana',
      postal_code: '122002',
      country: 'India',
      gstin: ''
    },
    items: [
      {
        description: 'Vehicle Booking Advance / Token Downpayment - Mahindra XUV700 AX7 (Diesel AT)',
        quantity: 1,
        rate: 50000,
        amount: 50000,
        tax_rate: 0,
        hsn_code: '8703'
      }
    ],
    company: {
      company_name: profile.company_name || 'ROYAL AUTO MOTORS PVT LTD',
      email: user?.email || 'dealership@royalmotors.com',
      phone: profile.phone || '+91 98100 00000',
      business_address: profile.business_address || 'Plot 18, Auto Hub, Sector 29',
      city: profile.city || 'Gurugram',
      state: profile.state || 'Haryana',
      pincode: profile.pincode || '122001',
      gstin: profile.gstin || '06AAAAA0000A1Z5',
      bank_name: profile.bank_name || 'HDFC BANK LTD',
      account_number: profile.account_number || '50200089213490',
      ifsc_code: profile.ifsc_code || 'HDFC0001248',
      account_holder_name: profile.account_holder_name || profile.company_name || 'ROYAL AUTO MOTORS PVT LTD',
      account_type: profile.account_type || 'Current Account',
      logo_url: profile.logo_url,
      signature_url: profile.signature_url,
      upi_qr_url: profile.upi_qr_url,
      upi_id: profile.upi_id
    }
  }), [profile, user, settings.default_currency]);

  const handlePurchaseTemplateSelect = async (tplId: PurchaseTemplateId) => {
    localStorage.setItem('purchase_bill_template', tplId);
    setPurchaseBillTemplate(tplId);

    // Save to system_settings in Supabase for cross-device/session persistence
    try {
      const targetUid = effectiveUserId || user?.id;
      if (targetUid) {
        const { error: saveErr } = await (supabase as any).from('system_settings').upsert({
          key: `purchase_bill_template_${targetUid}`,
          value: JSON.stringify(tplId),
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

        if (saveErr && serviceSupabase) {
          await (serviceSupabase as any).from('system_settings').upsert({
            key: `purchase_bill_template_${targetUid}`,
            value: JSON.stringify(tplId),
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
        }
      }
    } catch (err) {
      console.warn('Failed to persist purchase_bill_template to system_settings:', err);
    }

    toast({
      title: "Purchase Bill Template Updated",
      description: `Default layout set to ${tplId === 'classic-blue' ? 'Classic Blue' : tplId === 'commercial-erp' ? 'Commercial ERP' : tplId.toUpperCase()}.`
    });
  };

  const handleDownpaymentTemplateSelect = async (tplId: AutoTemplateId) => {
    localStorage.setItem('downpayment_template', tplId);
    setDownpaymentTemplate(tplId);

    // Save to system_settings in Supabase for cross-device/session persistence
    try {
      const targetUid = effectiveUserId || user?.id;
      if (targetUid) {
        const { error: saveErr } = await (supabase as any).from('system_settings').upsert({
          key: `downpayment_template_${targetUid}`,
          value: JSON.stringify(tplId),
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

        if (saveErr && serviceSupabase) {
          await (serviceSupabase as any).from('system_settings').upsert({
            key: `downpayment_template_${targetUid}`,
            value: JSON.stringify(tplId),
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
        }
      }
    } catch (err) {
      console.warn('Failed to persist downpayment_template to system_settings:', err);
    }

    toast({
      title: "Downpayment Template Updated",
      description: `Automobile layout set to ${tplId === 'auto_dealership' ? 'Dealership Slip' :
        tplId === 'auto_modern' ? 'Modern Drive Voucher' :
          tplId === 'auto_classic' ? 'Corporate RTO Form' :
            tplId === 'auto_executive' ? 'Executive Luxury Allotment' :
              'Compact Token Counter Slip'
        }.`
    });
  };

  useEffect(() => {
    if (user) {
      setPersonalName(user.user_metadata?.full_name || user.user_metadata?.name || '');
      setPersonalPhone(user.user_metadata?.mobile || profile.phone || '');
    }
  }, [user, profile.phone]);

  const handleSavePersonalProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user?.id) return;

    if (!personalName.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Name cannot be empty."
      });
      return;
    }

    let cleanPersonalPhone = personalPhone.trim();
    if (cleanPersonalPhone) {
      cleanPersonalPhone = cleanPersonalPhone.replace(/\D/g, '').slice(-10);
      if (!/^[6-9]\d{9}$/.test(cleanPersonalPhone)) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Personal Mobile must be a valid 10-digit number starting with 6, 7, 8, or 9."
        });
        return;
      }
    }

    setPersonalSaving(true);
    try {
      // 1. Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: personalName.trim(),
          name: personalName.trim(),
          mobile: cleanPersonalPhone || null
        }
      });
      if (authError) throw authError;

      // 2. Update profiles table
      const clientToUse = serviceSupabase || supabase;
      await clientToUse
        .from('profiles')
        .update({
          phone: cleanPersonalPhone || null,
          mobile: cleanPersonalPhone || null
        })
        .eq('user_id', user.id);

      // 3. If staff, sync to company_staff table & localStorage
      if (isStaff || user.email) {
        try {
          const staffUpdatePayload = {
            name: personalName.trim(),
            phone: cleanPersonalPhone || null,
            updated_at: new Date().toISOString()
          };

          // 1. First update by explicit user_id
          const { data: updatedById, error: errById } = await (clientToUse as any)
            .from('company_staff')
            .update(staffUpdatePayload)
            .eq('user_id', user.id)
            .select('id');

          // 2. If no row matched by user_id, fallback to exact email match (case-insensitive with escaped wildcards)
          if (!errById && (!updatedById || updatedById.length === 0) && user.email) {
            const escapedEmail = user.email.trim().replace(/[_%]/g, '\\$&');
            await (clientToUse as any)
              .from('company_staff')
              .update(staffUpdatePayload)
              .ilike('email', escapedEmail);
          }
        } catch (e) {
          console.warn('Could not sync to company_staff:', e);
        }

        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('escrow_company_staff_backup')) {
              const raw = localStorage.getItem(key);
              if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) {
                  let updated = false;
                  const nextList = list.map((s: any) => {
                    if (s.email?.toLowerCase() === user.email?.toLowerCase() || s.user_id === user.id) {
                      updated = true;
                      return { ...s, name: personalName.trim(), phone: cleanPersonalPhone };
                    }
                    return s;
                  });
                  if (updated) {
                    localStorage.setItem(key, JSON.stringify(nextList));
                  }
                }
              }
            }
          }
        } catch (e) {
          // Continue
        }
      }

      await refreshProfile();
      toast({
        title: "Profile Updated",
        description: "Your name and contact info have been saved successfully."
      });
    } catch (err: any) {
      console.error("Error updating personal profile:", err);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message || "Failed to update profile details."
      });
    } finally {
      setPersonalSaving(false);
    }
  };



  const handleUpgrade = async (planOverride?: 'monthly' | 'yearly') => {
    const targetPlan = planOverride || selectedPlan;
    if (planOverride && planOverride !== selectedPlan) {
      setSelectedPlan(planOverride);
    }

    const res = await loadRazorpay();
    if (!res) {
      toast({
        title: "Error",
        description: "Razorpay SDK failed to load. Please check your internet connection.",
        variant: "destructive"
      });
      return;
    }

    setSettingsSaving(true);
    try {
      const planDetails = PLANS[targetPlan];
      const clientToUse = serviceSupabase || supabase;
      const { data: order, error } = await clientToUse.functions.invoke('create-razorpay-order', {
        body: { amount: planDetails.amount, currency: 'INR' }
      });

      if (error || !order || !order.id) throw error || new Error(order?.error || 'Failed to create order');

      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
        throw new Error('Razorpay Key missing from environment variable');
      }

      const cleanPhone = (profile.phone || profile.mobile || '').replace(/\D/g, '').slice(-10);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Escrow Bill",
        description: planDetails.description,
        image: "/assets/images/e9085822-5bea-4642-b19e-dcfcde6248f7.png",
        order_id: order.id,
        handler: async function (response: RazorpayResponse) {
          try {
            const { data: verifyData, error: verifyError } = await clientToUse.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                user_id: user?.id,
                plan_type: targetPlan
              }
            });

            if (verifyError) {
              const now = new Date();
              const newExp = new Date(now);
              if (targetPlan === 'yearly') {
                newExp.setFullYear(now.getFullYear() + 1);
              } else {
                newExp.setMonth(now.getMonth() + 1);
              }
              await (clientToUse as any).from('profiles').update({
                subscription_expires_at: newExp.toISOString(),
                plan_type: targetPlan,
                is_paid: true,
                updated_at: new Date().toISOString()
              }).eq('user_id', user?.id);
            }

            toast({
              title: "Subscription Active!",
              description: `Your ${targetPlan} plan is now active until ${safelyToLocaleDate(verifyData?.expires_at || new Date().toISOString())}.`,
              duration: 5000,
            });

            // Refresh profile to show new status
            fetchProfile();

          } catch (error) {
            console.error('Verification notice:', error);
            fetchProfile();
          } finally {
            setSettingsSaving(false);
          }
        },
        prefill: {
          name: profile.company_name || user?.email || '',
          email: user?.email || '',
          contact: cleanPhone.length === 10 ? cleanPhone : undefined
        },
        modal: {
          ondismiss: function () {
            setSettingsSaving(false);
          }
        },
        theme: {
          color: "#0F172A"
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on('payment.failed', function (resp: any) {
        console.warn("Payment failed:", resp);
        setSettingsSaving(false);
        toast({
          title: "Payment Cancelled or Failed",
          description: resp?.error?.description || "Payment was not completed.",
          variant: "destructive"
        });
      });
      paymentObject.open();

    } catch (err) {
      console.error('Payment Error:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong initiating payment.",
        variant: "destructive"
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "File size must be less than 2MB."
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload an image file (PNG, JPG, etc)."
      });
      return;
    }

    setLogoUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);

      const publicLogoUrl = `${data.publicUrl}?t=${Date.now()}`;
      setProfile({ ...profile, logo_url: publicLogoUrl });

      try {
        localStorage.setItem('escrow_company_logo_url', publicLogoUrl);
      } catch { }

      // Auto-save logo URL to database table immediately
      const targetUserId = (isStaff && effectiveUserId) ? effectiveUserId : user.id;
      let { error: saveError } = await supabase
        .from('profiles')
        .update({
          logo_url: publicLogoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', targetUserId);

      if (saveError) {
        const { error: insErr } = await supabase
          .from('profiles')
          .insert({
            user_id: targetUserId,
            logo_url: publicLogoUrl,
            updated_at: new Date().toISOString()
          });
        saveError = insErr;
      }

      if (saveError) {
        console.error('Error auto-saving logo to database:', saveError);
      }

      await refreshProfile(true);

      toast({
        title: "Success",
        description: "Logo uploaded and saved successfully."
      });

      // Invalidate queries to update Dashboard
      void queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      if (targetUserId) {
        void queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload logo."
      });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    setProfile({ ...profile, logo_url: '' });
    try {
      localStorage.removeItem('escrow_company_logo_url');
      const targetUserId = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
      if (targetUserId) {
        await supabase
          .from('profiles')
          .update({ logo_url: null, updated_at: new Date().toISOString() })
          .eq('user_id', targetUserId);
        await refreshProfile(true);
        void queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
        void queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
      }
      toast({
        title: "Logo Removed",
        description: "Company logo has been removed."
      });
    } catch (err) {
      console.error('Error removing logo:', err);
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "File size must be less than 2MB."
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload an image file (PNG, JPG, etc)."
      });
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/signature.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);

      const signatureUrl = data.publicUrl;
      setProfile({ ...profile, signature_url: signatureUrl });

      // Auto-save signature URL to database
      let { error: saveError } = await supabase
        .from('profiles')
        .update({
          signature_url: signatureUrl
        })
        .eq('user_id', user.id);

      if (saveError) {
        const { error: insErr } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            signature_url: signatureUrl
          });
        saveError = insErr;
      }

      if (saveError) {
        console.error('Error saving signature to database:', saveError);
      }

      toast({
        title: "Success",
        description: "Authorized signature uploaded and saved successfully."
      });

      // Invalidate queries to update Dashboard
      void queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    } catch (error) {
      console.error('Error uploading signature:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload signature."
      });
    }
  };



  // Handle hash navigation to scroll to specific section
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      // Wait for page to render, then scroll to element
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const targetUserId = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      const client = serviceSupabase || supabase;
      const profQuery = (client as any)
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();
      const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 2500)
      );

      const { data, error } = await Promise.race([profQuery, timeoutPromise]);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const pData = data as Partial<Profile>;
        setProfile({
          company_name: pData.company_name || '',
          business_address: pData.business_address || '',
          gstin: pData.gstin || '',
          phone: pData.phone || pData.mobile || '',
          website: pData.website || '',
          logo_url: pData.logo_url || '',
          signature_url: pData.signature_url || '',
          upi_qr_url: (pData as any).upi_qr_url || '',
          upi_id: (pData as any).upi_id || '',
          settings_locked: pData.settings_locked || false,
          state: pData.state || '',
          city: pData.city || '',
          pincode: pData.pincode || '',
          bank_name: pData.bank_name || '',
          account_holder_name: pData.account_holder_name || '',
          account_number: pData.account_number || '',
          ifsc_code: pData.ifsc_code || '',
          account_type: pData.account_type || '',
          subscription_expires_at: pData.subscription_expires_at || null,
          plan_type: (pData as any).plan_type || null,
          custom_price: (pData as any).custom_price !== undefined ? (pData as any).custom_price : null
        });

        if ((pData as any).custom_price !== undefined && (pData as any).custom_price !== null) {
          const cPrice = Number((pData as any).custom_price);
          if (!isNaN(cPrice) && cPrice >= 0) {
            setUserCustomPrice(cPrice);
          }
        }

        setGstVerified(false);
        setVerifiedGstName(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile settings."
      });
    } finally {
      setLoading(false);
    }
  }, [user, isStaff, effectiveUserId, toast]);

  const handleProfileSave = async () => {
    // If staff account, save personal details to auth metadata
    if (isStaff) {
      let cleanStaffPhone = personalPhone.trim();
      if (cleanStaffPhone) {
        cleanStaffPhone = cleanStaffPhone.replace(/\D/g, '').slice(-10);
        if (!/^[6-9]\d{9}$/.test(cleanStaffPhone)) {
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9."
          });
          return;
        }
      }

      setProfileSaving(true);
      try {
        if (user?.id) {
          const { error: authError } = await supabase.auth.updateUser({
            data: {
              full_name: personalName.trim(),
              name: personalName.trim(),
              mobile: cleanStaffPhone || null
            }
          });
          if (authError) throw authError;

          // Sync to company_staff table & profiles table
          const clientToUse = serviceSupabase || supabase;
          try {
            const staffUpdatePayload = {
              name: personalName.trim(),
              phone: cleanStaffPhone || null,
              updated_at: new Date().toISOString()
            };

            const { data: updatedById, error: errById } = await (clientToUse as any)
              .from('company_staff')
              .update(staffUpdatePayload)
              .eq('user_id', user.id)
              .select('id');

            if (!errById && (!updatedById || updatedById.length === 0) && user.email) {
              const escapedEmail = user.email.trim().replace(/[_%]/g, '\\$&');
              await (clientToUse as any)
                .from('company_staff')
                .update(staffUpdatePayload)
                .ilike('email', escapedEmail);
            }
          } catch (e) {
            console.warn('Could not update company_staff:', e);
          }

          try {
            await clientToUse
              .from('profiles')
              .update({
                phone: cleanStaffPhone || null,
                mobile: cleanStaffPhone || null
              })
              .eq('user_id', user.id);
          } catch (e) {
            console.warn('Could not update profiles:', e);
          }

          void refreshProfile(true).catch(e => console.warn('Background refreshProfile notice:', e));
          toast({
            title: "Success",
            description: "Your staff profile has been updated."
          });
        }
      } catch (error: any) {
        console.error('Error saving staff profile:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error?.message || "Failed to update staff profile."
        });
      } finally {
        setProfileSaving(false);
      }
      return;
    }

    // Business phone validation if provided
    if (profile.phone && profile.phone.trim()) {
      const cleanPhone = profile.phone.replace(/\D/g, '').slice(-10);
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Business Phone must be a valid 10-digit mobile number starting with 6, 7, 8, or 9."
        });
        return;
      }
    }

    // Native HTML5 validation doesn't work well outside a form submit, so we validate manually here.
    if (profile.account_number && profile.account_number.length < 9) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Account number must be at least 9 digits long.",
      });
      return;
    }

    if (profile.ifsc_code && profile.ifsc_code.length !== 11) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "IFSC Code must be exactly 11 characters long.",
      });
      return;
    }

    const targetUid = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
    if (!targetUid) {
      toast({
        variant: "destructive",
        title: "Session Expired",
        description: "Please refresh the page or log in again to save your profile."
      });
      return;
    }

    setProfileSaving(true);
    const safetyTimer = setTimeout(() => {
      setProfileSaving(false);
    }, 6000);

    try {
      const {
        company_name,
        business_address,
        gstin,
        phone,
        website,
        logo_url,
        signature_url,
        upi_qr_url,
        upi_id,
        settings_locked,
        state,
        city,
        pincode,
        bank_name,
        account_holder_name,
        account_number,
        ifsc_code,
        account_type,
        plan_type
      } = profile as any;

      const profilePayload = {
        user_id: targetUid,
        company_name: (company_name && company_name.trim()) || null,
        business_address: (business_address && business_address.trim()) || null,
        gstin: (gstin && gstin.trim()) || null,
        phone: phone || null,
        mobile: phone || profile.mobile || null,
        website: website || null,
        logo_url: logo_url || null,
        signature_url: signature_url || null,
        upi_qr_url: upi_qr_url || null,
        upi_id: upi_id || null,
        settings_locked: !!settings_locked,
        state: state || null,
        city: city || null,
        pincode: pincode || null,
        bank_name: bank_name || null,
        account_holder_name: account_holder_name || null,
        account_number: account_number || null,
        ifsc_code: ifsc_code || null,
        account_type: account_type || null,
        plan_type: plan_type || 'monthly',
        updated_at: new Date().toISOString()
      };

      const clientToUse = serviceSupabase || supabase;
      const updatePromise = (clientToUse as any)
        .from('profiles')
        .update(profilePayload)
        .eq('user_id', targetUid);

      const timeoutPromise = new Promise<{ error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Profile update timed out. Please check your internet connection.')), 5000)
      );

      let { error } = await Promise.race([updatePromise, timeoutPromise]);

      if (error) {
        const insertPromise = (clientToUse as any)
          .from('profiles')
          .insert(profilePayload);
        const { error: insErr } = await Promise.race([insertPromise, timeoutPromise]);
        error = insErr;
      }

      if (error) throw error;

      // Instantly apply saved changes to local state, converting nulls back to empty strings for inputs
      setProfile(prev => ({
        ...prev,
        ...profilePayload,
        company_name: profilePayload.company_name ?? '',
        business_address: profilePayload.business_address ?? '',
        gstin: profilePayload.gstin ?? '',
        phone: profilePayload.phone ?? '',
        mobile: profilePayload.mobile ?? '',
        website: profilePayload.website ?? '',
        logo_url: profilePayload.logo_url ?? '',
        signature_url: profilePayload.signature_url ?? '',
        upi_qr_url: profilePayload.upi_qr_url ?? '',
        upi_id: profilePayload.upi_id ?? '',
        state: profilePayload.state ?? '',
        city: profilePayload.city ?? '',
        pincode: profilePayload.pincode ?? '',
        bank_name: profilePayload.bank_name ?? '',
        account_holder_name: profilePayload.account_holder_name ?? '',
        account_number: profilePayload.account_number ?? '',
        ifsc_code: profilePayload.ifsc_code ?? '',
        account_type: profilePayload.account_type ?? '',
      }));

      // Non-blocking sync to auth metadata
      if (user?.id && !isStaff) {
        supabase.auth.updateUser({
          data: {
            company_name: (company_name && company_name.trim()) || null,
            mobile: phone || profile.mobile || null
          }
        }).catch(() => {});
      }

      // Non-blocking refresh of profile in background
      void refreshProfile(true).catch(e => console.warn('Background refreshProfile notice:', e));

      if (profile.settings_locked) {
        toast({
          title: "Profile Saved & Locked 🔒",
          description: "Business settings saved and securely locked against accidental changes."
        });
      } else {
        toast({
          title: "Profile Saved Successfully ✓",
          description: "Your business identity, bank details, and UPI settings have been updated.",
          duration: 4000
        });
      }

      // Invalidate queries to update Dashboard and other components immediately
      void queryClient.invalidateQueries({ queryKey: ['profile', targetUid] });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      const detailedMessage = error?.message || error?.details || error?.hint || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      toast({
        variant: "destructive",
        title: "Error Saving Profile",
        description: detailedMessage || "Failed to save settings."
      });
    } finally {
      clearTimeout(safetyTimer);
      setProfileSaving(false);
    }
  };

  const handleToggleLock = async () => {
    if (isStaff) return;
    const targetUid = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
    if (!targetUid) return;

    const newLockState = !profile.settings_locked;
    setProfile(prev => ({ ...prev, settings_locked: newLockState }));

    try {
      const clientToUse = serviceSupabase || supabase;
      const { error } = await (clientToUse as any)
        .from('profiles')
        .update({
          settings_locked: newLockState,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', targetUid);

      if (error) throw error;

      toast({
        title: newLockState ? "Profile Locked 🔒" : "Profile Unlocked 🔓",
        description: newLockState
          ? "Your business settings are now securely locked against accidental changes."
          : "Your business settings are unlocked. You can now edit your details."
      });

      void queryClient.invalidateQueries({ queryKey: ['profile', targetUid] });
    } catch (err: any) {
      console.error('Error toggling lock in database:', err);
    }
  };

  const fetchSettings = useCallback(async () => {
    try {
      const targetUserId = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
      if (!targetUserId) return;

      const client = serviceSupabase || supabase;
      const settingsQuery = (client as any)
        .from('user_settings')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();
      const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Settings fetch timeout')), 2500)
      );

      const { data, error } = await Promise.race([settingsQuery, timeoutPromise]);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const sData = data as Partial<UserSettings>;
        setSettings({
          email_notifications: sData.email_notifications ?? true,
          invoice_reminders: sData.invoice_reminders ?? true,
          payment_alerts: sData.payment_alerts ?? true,
          auto_save_enabled: sData.auto_save_enabled ?? true,
          dark_mode: sData.dark_mode ?? false,
          default_currency: sData.default_currency || 'INR',
          default_payment_terms: sData.default_payment_terms || 'Net 30',
          default_terms: (sData as any).default_terms || '',
          invoice_template: (sData.invoice_template && !sData.invoice_template.startsWith('auto_')) ? sData.invoice_template : 'corporate',
          hide_company_details: sData.hide_company_details ?? false,
          whatsapp_provider: (sData as any).whatsapp_provider || 'personal'
        });
      }

      // Fetch persisted downpayment_template and purchase_bill_template from system_settings or localStorage
      // Also fetch dynamic platform pricing and user's custom rate override (runs whether user_settings exists or not)
      try {
        const clientToUse = serviceSupabase || supabase;
        const targetUid = effectiveUserId || user?.id;
        const cleanEmail = (user?.email || profile?.email || '').toLowerCase().trim();

        const keysToFetch = [
          `downpayment_template_${targetUid}`,
          `purchase_bill_template_${targetUid}`,
          'pricing_monthly',
          'pricing_yearly',
          `user_plan_price_${targetUid}`,
          `user_payment_record_${targetUid}`
        ];
        if (cleanEmail) {
          keysToFetch.push(`user_plan_price_${cleanEmail}`);
          keysToFetch.push(`user_payment_record_${cleanEmail}`);
        }

        const { data: pricingAndTemplateData } = await (clientToUse as any)
          .from('system_settings')
          .select('key, value')
          .in('key', keysToFetch);

        if (pricingAndTemplateData && Array.isArray(pricingAndTemplateData)) {
          pricingAndTemplateData.forEach((item: any) => {
            let val = item.value;
            try { val = typeof val === 'string' ? JSON.parse(val) : val; } catch { }

            if (item.key === `downpayment_template_${targetUid}` && val) {
              setDownpaymentTemplate(val as AutoTemplateId);
              localStorage.setItem('downpayment_template', val);
            } else if (item.key === `purchase_bill_template_${targetUid}` && val) {
              setPurchaseBillTemplate(val as PurchaseTemplateId);
              localStorage.setItem('purchase_bill_template', val);
            } else if (item.key === 'pricing_monthly') {
              const num = Number(val);
              if (!isNaN(num) && num > 0) {
                setPlatformMonthlyPrice(num);
                localStorage.setItem('escrow_platform_monthly', String(num));
              }
            } else if (item.key === 'pricing_yearly') {
              const num = Number(val);
              if (!isNaN(num) && num > 0) {
                setPlatformYearlyPrice(num);
                localStorage.setItem('escrow_platform_yearly', String(num));
              }
            } else if (
              item.key === `user_plan_price_${targetUid}` ||
              item.key === `user_payment_record_${targetUid}` ||
              (cleanEmail && (item.key === `user_plan_price_${cleanEmail}` || item.key === `user_payment_record_${cleanEmail}`))
            ) {
              if (typeof val === 'object' && val !== null) {
                if (val.monthly !== undefined && !isNaN(Number(val.monthly)) && Number(val.monthly) >= 0) {
                  const m = Number(val.monthly);
                  setUserCustomMonthlyPrice(m);
                  if (targetUid) localStorage.setItem(`escrow_user_custom_monthly_${targetUid}`, String(m));
                  if (cleanEmail) localStorage.setItem(`escrow_user_custom_monthly_${cleanEmail}`, String(m));
                }
                if (val.yearly !== undefined && !isNaN(Number(val.yearly)) && Number(val.yearly) >= 0) {
                  const y = Number(val.yearly);
                  setUserCustomYearlyPrice(y);
                  if (targetUid) localStorage.setItem(`escrow_user_custom_yearly_${targetUid}`, String(y));
                  if (cleanEmail) localStorage.setItem(`escrow_user_custom_yearly_${cleanEmail}`, String(y));
                }
                if (val.amount !== undefined && !isNaN(Number(val.amount)) && Number(val.amount) >= 0) {
                  setUserCustomPrice(Number(val.amount));
                }
              } else {
                const num = Number(val);
                if (!isNaN(num) && num >= 0) setUserCustomPrice(num);
              }
            }
          });
        }

        const localTpl = (localStorage.getItem('downpayment_template') as AutoTemplateId) || 'auto_classic';
        if (!localStorage.getItem('downpayment_template')) setDownpaymentTemplate(localTpl);
        const localPurchTpl = (localStorage.getItem('purchase_bill_template') as PurchaseTemplateId) || 'classic-blue';
        if (!localStorage.getItem('purchase_bill_template')) setPurchaseBillTemplate(localPurchTpl);
      } catch {
        const localTpl = (localStorage.getItem('downpayment_template') as AutoTemplateId) || 'auto_classic';
        setDownpaymentTemplate(localTpl);
        const localPurchTpl = (localStorage.getItem('purchase_bill_template') as PurchaseTemplateId) || 'classic-blue';
        setPurchaseBillTemplate(localPurchTpl);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, [user, isStaff, effectiveUserId]);

  // Realtime synchronization for Platform Default Pricing & Admin User Plan Changes
  useEffect(() => {
    const targetUid = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
    if (!targetUid) return;

    const handlePlatformUpdate = (e: any) => {
      const { monthly, yearly } = e.detail || {};
      if (monthly) {
        const m = Number(monthly);
        if (!isNaN(m) && m > 0) {
          setPlatformMonthlyPrice(m);
          localStorage.setItem('escrow_platform_monthly', String(m));
        }
      }
      if (yearly) {
        const y = Number(yearly);
        if (!isNaN(y) && y > 0) {
          setPlatformYearlyPrice(y);
          localStorage.setItem('escrow_platform_yearly', String(y));
        }
      }
    };

    const handlePlanUpdate = (e: any) => {
      const data = e.detail;
      const myEmail = (user?.email || profile?.email || '').toLowerCase().trim();
      const matchesUser = data && (data.userId === targetUid || (myEmail && data.email && myEmail === String(data.email).toLowerCase().trim()));
      if (matchesUser) {
        if (data.customMonthlyPrice !== undefined) {
          const num = Number(data.customMonthlyPrice);
          if (!isNaN(num) && num >= 0) {
            setUserCustomMonthlyPrice(num);
            if (targetUid) localStorage.setItem(`escrow_user_custom_monthly_${targetUid}`, String(num));
            if (myEmail) localStorage.setItem(`escrow_user_custom_monthly_${myEmail}`, String(num));
          }
        }
        if (data.customYearlyPrice !== undefined) {
          const num = Number(data.customYearlyPrice);
          if (!isNaN(num) && num >= 0) {
            setUserCustomYearlyPrice(num);
            if (targetUid) localStorage.setItem(`escrow_user_custom_yearly_${targetUid}`, String(num));
            if (myEmail) localStorage.setItem(`escrow_user_custom_yearly_${myEmail}`, String(num));
          }
        }
        if (data.customPrice !== undefined) {
          const num = Number(data.customPrice);
          if (!isNaN(num) && num >= 0) setUserCustomPrice(num);
        }
        if (data.planType) {
          setProfile(prev => ({
            ...prev,
            plan_type: data.planType,
            subscription_expires_at: data.expiresAt || prev.subscription_expires_at,
            custom_price: data.customPrice !== undefined ? Number(data.customPrice) : prev.custom_price
          }));
        }
        void fetchProfile();
      }
    };

    window.addEventListener('escrow_platform_pricing_updated', handlePlatformUpdate);
    window.addEventListener('escrow_plan_updated', handlePlanUpdate);

    return () => {
      window.removeEventListener('escrow_platform_pricing_updated', handlePlatformUpdate);
      window.removeEventListener('escrow_plan_updated', handlePlanUpdate);
    };
  }, [user?.id, isStaff, effectiveUserId, fetchProfile]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSettings();
    }
  }, [user, fetchProfile, fetchSettings]);


  const handleSettingsSave = async (
    overrideSettings?: UserSettings,
    { showToast = true, isManual = false }: { showToast?: boolean; isManual?: boolean } = {}
  ): Promise<boolean> => {
    const rawPayload = overrideSettings || settings;
    // Strip custom properties that don't belong to the user_settings table
    const { downpayment_template: _dpTpl, ...payload } = (rawPayload as any);
    const targetUid = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
    if (!targetUid) return false;

    let safetyTimer: any = null;
    if (isManual) {
      setSettingsSaving(true);
      safetyTimer = setTimeout(() => {
        setSettingsSaving(false);
      }, 5000);
    }
    try {
      const clientToUse = serviceSupabase || supabase;
      const { error } = await (clientToUse as any)
        .from('user_settings')
        .upsert({
          user_id: targetUid,
          ...payload
        }, { onConflict: 'user_id' });

      if (error) throw error;

      // Sync global currency context immediately
      if (payload.default_currency) {
        setCurrencyCode(payload.default_currency);
      }

      if (showToast) {
        toast({
          title: "Success",
          description: "Application settings saved successfully."
        });
      }
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save application settings."
      });
      return false;
    } finally {
      if (safetyTimer) clearTimeout(safetyTimer);
      if (isManual) {
        setSettingsSaving(false);
      }
    }
  };

  useEffect(() => {
    const fetchBankList = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('banks-fetch', {
          headers: { "Content-Type": "application/json" },
        });
        if (error) {
          console.warn('Failed to fetch bank list from Supabase:', error);
          setBankOptions(FALLBACK_BANKS);
          return;
        }
        const banks = (data as { banks?: string[] } | null)?.banks;
        if (banks && banks.length > 0) {
          setBankOptions(banks);
        } else {
          setBankOptions(FALLBACK_BANKS);
        }
      } catch (error) {
        console.warn('Failed to fetch bank list, falling back to defaults.', error);
        setBankOptions(FALLBACK_BANKS);
      }
    };

    fetchBankList();
  }, []);

  useEffect(() => {
    if (!profile.bank_name) {
      setBankSelection(CUSTOM_BANK_VALUE);
      return;
    }
    setBankSelection(
      bankOptions.includes(profile.bank_name)
        ? profile.bank_name
        : CUSTOM_BANK_VALUE
    );
  }, [profile.bank_name, bankOptions]);

  const handleTemplateSelect = (templateId: UserSettings['invoice_template']) => {
    if (settings.invoice_template === templateId) return;
    setPendingTemplateId(templateId);
    setConfirmTemplateCheck(false);
    setIsConfirmTemplateModalOpen(true);
  };

  const confirmTemplateChange = async () => {
    if (!pendingTemplateId) return;
    const nextSettings = { ...settings, invoice_template: pendingTemplateId };
    setSettings(nextSettings);
    const success = await handleSettingsSave(nextSettings, { showToast: false });
    if (success) {
      toast({
        title: "Template Updated",
        description: "Selected template has been applied. You can see it in the preview."
      });
    }
    setIsConfirmTemplateModalOpen(false);
    setPendingTemplateId(null);
  };

  const handleBankSelection = (value: string) => {
    if (value === CUSTOM_BANK_VALUE) {
      setBankSelection(CUSTOM_BANK_VALUE);
      setProfile((prev) => ({ ...prev, bank_name: '' }));
    } else {
      setBankSelection(value);
      setProfile((prev) => ({ ...prev, bank_name: value }));
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New passwords do not match."
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 8 characters long."
      });
      return;
    }

    setPasswordChanging(true);
    try {
      // Step 1: Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Incorrect current password.");
      }

      // Step 2: Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Your password has been updated successfully."
      });

      // Reset state and close modal
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password."
      });
    } finally {
      setPasswordChanging(false);
    }
  };

  const handleExportData = async () => {
    try {
      // Export all user data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id);

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user?.id);

      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user?.id);

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user?.id);

      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user?.id);

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user?.id);

      // Create a new workbook
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // Add each data set as a sheet if it exists
      if (profileData && profileData.length > 0) {
        const profileSheet = XLSX.utils.json_to_sheet(profileData);
        XLSX.utils.book_append_sheet(wb, profileSheet, "Profile");
      }

      if (invoicesData && invoicesData.length > 0) {
        const invoicesSheet = XLSX.utils.json_to_sheet(invoicesData);
        XLSX.utils.book_append_sheet(wb, invoicesSheet, "Invoices");
      }

      if (clientsData && clientsData.length > 0) {
        const clientsSheet = XLSX.utils.json_to_sheet(clientsData);
        XLSX.utils.book_append_sheet(wb, clientsSheet, "Clients");
      }

      if (productsData && productsData.length > 0) {
        const productsSheet = XLSX.utils.json_to_sheet(productsData);
        XLSX.utils.book_append_sheet(wb, productsSheet, "Products");
      }

      if (expensesData && expensesData.length > 0) {
        const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
        XLSX.utils.book_append_sheet(wb, expensesSheet, "Expenses");
      }

      if (paymentsData && paymentsData.length > 0) {
        const paymentsSheet = XLSX.utils.json_to_sheet(paymentsData);
        XLSX.utils.book_append_sheet(wb, paymentsSheet, "Payments");
      }

      // Generate Excel file and trigger download
      XLSX.writeFile(wb, `escrowbill-data-${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "Export Complete",
        description: "Your data has been exported as an Excel file successfully."
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export your data."
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">Profile & Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Manage your account profile and application preferences</p>
      </div>

      <Tabs defaultValue="business" className="w-full" value={activeSection} onValueChange={setActiveSection}>
        <div className="bg-background border-b -mx-4 px-4 py-2 mb-6 sticky top-0 z-10 shadow-sm">
          <div className="relative w-full">
            <div className="w-full overflow-x-auto no-scrollbar flex scroll-smooth">
              <TabsList className={cn(
                "inline-flex min-w-max md:w-full md:grid h-auto p-1.5 bg-muted/80 backdrop-blur-md rounded-xl gap-1.5 shadow-xs",
                !isStaff ? "md:grid-cols-5" : "md:grid-cols-4"
              )}>
                <TabsTrigger value="business" className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>{isStaff ? 'Staff Profile' : 'Business Identity'}</span>
                </TabsTrigger>
                <TabsTrigger value="membership" className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span>Membership</span>
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Invoice Templates</span>
                </TabsTrigger>
                <TabsTrigger value="preferences" className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                  <SlidersHorizontal className="w-4 h-4 shrink-0" />
                  <span>Preferences & Security</span>
                </TabsTrigger>
                {!isStaff && (
                  <TabsTrigger value="backup" className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                    <Cloud className="w-4 h-4 shrink-0 text-primary" />
                    <span>Backup & Vault</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
            {/* Subtle right fade edge on mobile to indicate scrollability */}
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
          </div>
        </div>
        <div className="w-full max-w-7xl mx-auto space-y-6 transition-all duration-300">
          <TabsContent value="membership" className="m-0 space-y-6">
            <MembershipTab
              isStaff={isStaff}
              profile={profile}
              companyProfile={companyProfile}
              user={user}
              effectiveUserId={effectiveUserId}
              isTrialActive={isTrialActive}
              isProActive={isProActive}
              trialDaysRemaining={trialDaysRemaining}
              countdownText={countdownText}
              safelyToLocaleDate={safelyToLocaleDate}
              now={now}
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              handleUpgrade={handleUpgrade}
              settingsSaving={settingsSaving}
            />
          </TabsContent>

          <TabsContent value="business" className="m-0 space-y-6">
            <BusinessIdentityTab
              isStaff={isStaff}
              profile={profile}
              setProfile={setProfile}
              companyProfile={companyProfile}
              staffRole={staffRole}
              user={user}
              handleToggleLock={handleToggleLock}
              handleProfileSave={handleProfileSave}
              profileSaving={profileSaving}
              gstVerified={gstVerified}
              setGstVerified={setGstVerified}
              verifiedGstName={verifiedGstName}
              setVerifiedGstName={setVerifiedGstName}
              gstVerificationData={gstVerificationData}
              setGstVerificationData={setGstVerificationData}
              gstVerifying={gstVerifying}
              handleVerifyGST={handleVerifyGST}
              personalName={personalName}
              setPersonalName={setPersonalName}
              personalPhone={personalPhone}
              setPersonalPhone={setPersonalPhone}
              bankSelection={bankSelection}
              handleBankSelection={handleBankSelection}
              bankSearchOpen={bankSearchOpen}
              setBankSearchOpen={setBankSearchOpen}
              bankOptions={bankOptions}
              CUSTOM_BANK_VALUE={CUSTOM_BANK_VALUE}
              handleRemoveLogo={handleRemoveLogo}
              handleLogoUpload={handleLogoUpload}
              handleSignatureUpload={handleSignatureUpload}
              logoUploading={logoUploading}
              settings={settings}
              setSettings={setSettings}
              handleSettingsSave={handleSettingsSave}
              toast={toast}
            />
          </TabsContent>

          {/* PREFERENCES & SECURITY TAB */}
          <TabsContent value="preferences" className="m-0 space-y-6 outline-none">
            <SystemPreferencesTab
              settings={settings}
              setSettings={setSettings}
              handleInitiateWhatsAppChange={handleInitiateWhatsAppChange}
              handleSettingsSave={handleSettingsSave}
              settingsSaving={settingsSaving}
              inrPerUnit={inrPerUnit}
              setCurrencyCode={setCurrencyCode}
              refreshRates={refreshRates}
              isPasswordModalOpen={isPasswordModalOpen}
              setIsPasswordModalOpen={setIsPasswordModalOpen}
              handlePasswordChange={handlePasswordChange}
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              passwordChanging={passwordChanging}
              handleExportData={handleExportData}
              deletionRequest={deletionRequest}
              safelyToLocaleDate={safelyToLocaleDate}
              cancellingDeletionRequest={cancellingDeletionRequest}
              handleCancelDeletionRequest={handleCancelDeletionRequest}
              setIsDeleteModalOpen={setIsDeleteModalOpen}
              isStaff={isStaff}
              loadingDeletionRequest={loadingDeletionRequest}
              toast={toast}
            />
          </TabsContent>

          {/* DEDICATED INVOICE TEMPLATES TAB (SEPARATED SALES & PURCHASE) */}
          <TabsContent value="templates" className="m-0 space-y-5 outline-none">
            <InvoiceTemplatesTab
              isAutomobile={isAutomobile}
              templateCategory={templateCategory}
              setTemplateCategory={setTemplateCategory}
              settings={settings}
              setSettings={setSettings}
              handleSettingsSave={handleSettingsSave}
              setPreviewTemplate={setPreviewTemplate}
              handleTemplateSelect={handleTemplateSelect}
              profile={profile}
              setActiveSection={setActiveSection}
              purchaseBillTemplate={purchaseBillTemplate}
              handlePurchaseTemplateSelect={handlePurchaseTemplateSelect}
              setPreviewPurchaseTemplate={setPreviewPurchaseTemplate}
              downpaymentTemplate={downpaymentTemplate}
              handleDownpaymentTemplateSelect={handleDownpaymentTemplateSelect}
              sampleInvoiceData={sampleInvoiceData}
              samplePurchaseData={samplePurchaseData}
              sampleAutoData={sampleAutoData}
            />
          </TabsContent>

{/* 5. BACKUP & DATA VAULT TAB (COMPANY OWNERS ONLY) */}
          {!isStaff && (
            <TabsContent value="backup" className="m-0 space-y-6 outline-none">
              <CloudBackupTab
                user={user}
                isStaff={isStaff}
                effectiveUserId={effectiveUserId}
                profile={profile}
                serviceSupabase={serviceSupabase}
                toast={toast}
              />
            </TabsContent>
          )}
        </div>
      </Tabs>

      {/* Template Full Live Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent hideClose className="sm:max-w-4xl w-full max-h-[92vh] p-0 rounded-xl border border-border bg-white dark:bg-slate-950 shadow-2xl flex flex-col overflow-hidden">
          <div className="shrink-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 md:p-5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">
                  {previewTemplate === 'classic' ? 'Classic GST' :
                    previewTemplate === 'corporate' ? 'Corporate' :
                      previewTemplate === 'creative' ? 'Creative Studio' :
                        previewTemplate === 'retail' ? 'Retail Superstore' :
                          previewTemplate === 'professional' ? 'Professional' :
                            previewTemplate === 'modern' ? 'Modern UPI' :
                              previewTemplate === 'elegant' ? 'Elegant' :
                                previewTemplate === 'thermal' ? 'Thermal POS' :
                                  previewTemplate === 'export' ? 'Global Export' :
                                    previewTemplate === 'minimal' ? 'Minimal' :
                                      previewTemplate === 'auto_dealership' ? 'Dealership Booking Slip' :
                                        previewTemplate === 'auto_modern' ? 'Modern Drive Voucher' :
                                          previewTemplate === 'auto_classic' ? 'Classic RTO Vehicle Form' :
                                            previewTemplate === 'auto_executive' ? 'Executive Luxury Allotment' :
                                              previewTemplate === 'auto_compact' ? 'Compact Token Counter Slip' :
                                                'Template Preview'}
                </DialogTitle>
                <DialogDescription className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Full Document Preview • Rendered with Sample Data & Company Details
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none active:ring-0 ring-0 hover:bg-muted/50" onClick={() => setPreviewTemplate(null)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100/50 dark:bg-slate-950/50 flex justify-center">
            <div className="w-full max-w-[820px]">
              <ResponsiveInvoiceWrapper maxWidth={previewTemplate === 'thermal' ? 380 : previewTemplate === 'auto_compact' ? 440 : 800}>
                <div className="shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 rounded-sm mb-6">
                  {previewTemplate && (
                    <InvoiceTemplate
                      template={previewTemplate}
                      invoice={
                        previewTemplate.startsWith('auto_') ? sampleAutoData.invoice :
                          previewTemplate === 'export' ? { ...sampleInvoiceData.invoice, currency: 'USD', tax_amount: 0, total_amount: 12000 } :
                            sampleInvoiceData.invoice
                      }
                      client={
                        previewTemplate.startsWith('auto_') ? sampleAutoData.client :
                          previewTemplate === 'export' ? { ...sampleInvoiceData.client, country: 'United States' } :
                            sampleInvoiceData.client
                      }
                      items={
                        previewTemplate.startsWith('auto_') ? sampleAutoData.items :
                          sampleInvoiceData.items
                      }
                      company={
                        previewTemplate.startsWith('auto_') ? sampleAutoData.company :
                          sampleInvoiceData.company
                      }
                    />
                  )}
                </div>
              </ResponsiveInvoiceWrapper>
            </div>
          </div>

          <div className="shrink-0 p-4 md:p-5 border-t bg-background flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1 h-11 rounded-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => setPreviewTemplate(null)}>
              Dismiss
            </Button>
            <Button
              className="flex-1 h-11 rounded-xl bg-primary hover:opacity-90 font-bold uppercase tracking-widest text-[10px] shadow-sm"
              onClick={() => {
                if (previewTemplate) {
                  if (previewTemplate.startsWith('auto_')) {
                    handleDownpaymentTemplateSelect(previewTemplate as any);
                  } else {
                    handleTemplateSelect(previewTemplate);
                  }
                }
                setPreviewTemplate(null);
              }}
            >
              Adopt This Style
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Purchase Bill Full Live Preview Modal */}
      <Dialog open={!!previewPurchaseTemplate} onOpenChange={(open) => !open && setPreviewPurchaseTemplate(null)}>
        <DialogContent hideClose className="sm:max-w-4xl w-full max-h-[92vh] p-0 rounded-xl border border-border bg-white dark:bg-slate-950 shadow-2xl flex flex-col overflow-hidden">
          <div className="shrink-0 bg-indigo-50/50 dark:bg-slate-900 border-b border-indigo-200/50 dark:border-slate-800 p-4 md:p-5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">
                  {previewPurchaseTemplate === 'classic-blue' ? 'Classic Blue (Vertex42 Style)' :
                    previewPurchaseTemplate === 'commercial-erp' ? 'Commercial ERP Purchase Invoice' :
                      previewPurchaseTemplate === 'tax-itc' ? 'GST ITC Audit Voucher' :
                        previewPurchaseTemplate === 'grn' ? 'Goods Receipt Note (GRN)' :
                          'Standard Procurement Voucher'}
                </DialogTitle>
                <DialogDescription className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Inward Procurement Preview • Rendered with Sample Supplier & Stock Details
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none active:ring-0 ring-0 hover:bg-muted/50" onClick={() => setPreviewPurchaseTemplate(null)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 sm:p-6 bg-slate-100/50 dark:bg-slate-950/50 flex justify-center">
            <div className="w-full flex justify-center">
              <ResponsiveInvoiceWrapper maxWidth={800}>
                <div className="shadow-2xl ring-1 ring-slate-900/10 rounded-sm bg-white dark:bg-slate-900 overflow-hidden pointer-events-none">
                  {previewPurchaseTemplate && (
                    <PurchaseBillTemplate
                      template={previewPurchaseTemplate}
                      invoice={samplePurchaseData.invoice}
                      vendor={samplePurchaseData.vendor}
                      items={samplePurchaseData.items}
                      company={samplePurchaseData.company}
                    />
                  )}
                </div>
              </ResponsiveInvoiceWrapper>
            </div>
          </div>

          <div className="shrink-0 p-4 md:p-5 border-t bg-background flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1 h-11 rounded-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => setPreviewPurchaseTemplate(null)}>
              Dismiss
            </Button>
            <Button className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-[10px] shadow-sm" onClick={() => { handlePurchaseTemplateSelect(previewPurchaseTemplate!); setPreviewPurchaseTemplate(null); }}>
              Adopt As Default Purchase Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmTemplateModalOpen} onOpenChange={setIsConfirmTemplateModalOpen}>
        <AlertDialogContent className="rounded-2xl border-border/50">
          <AlertDialogHeader>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 border border-amber-200">
              <Palette className="w-6 h-6 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold uppercase tracking-tight">Confirm Template Change</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium">
              You are switching your invoice style to <span className="font-bold text-foreground">"{pendingTemplateId}"</span>.
              This will update the visual layout for all future invoices and previews.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex items-center space-x-2 py-4 px-1">
            <Checkbox
              id="confirm-template"
              checked={confirmTemplateCheck}
              onCheckedChange={(checked) => setConfirmTemplateCheck(!!checked)}
            />
            <Label
              htmlFor="confirm-template"
              className="text-xs font-semibold text-muted-foreground cursor-pointer select-none"
            >
              I want to apply this new template to my business
            </Label>
          </div>

          <AlertDialogFooter className="mt-4 gap-3">
            <AlertDialogCancel
              className="rounded-xl border-2 font-bold uppercase tracking-widest text-[10px]"
              onClick={() => setConfirmTemplateCheck(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmTemplateChange}
              disabled={!confirmTemplateCheck}
              className={cn(
                "rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-sm px-6 transition-all",
                confirmTemplateCheck ? "bg-primary hover:opacity-90" : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
              )}
            >
              Update Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* WhatsApp Method Double Verification Dialog */}
      <AlertDialog open={isWhatsAppConfirmOpen} onOpenChange={setIsWhatsAppConfirmOpen}>
        <AlertDialogContent className="rounded-2xl border-border/50 max-w-md">
          <AlertDialogHeader>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-2 border border-emerald-500/20 text-emerald-600">
              <MessageSquare className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
              Verify WhatsApp Method Change
              <Badge variant="outline" className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30">
                Double Verification
              </Badge>
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-muted-foreground font-medium text-xs leading-relaxed space-y-3 pt-1">
                <p>
                  You are switching the billing WhatsApp dispatch method from{" "}
                  <span className="font-bold text-foreground">
                    {(settings.whatsapp_provider ?? 'personal') === 'personal' ? 'Personal WhatsApp' : 'ESCROW API'}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {pendingWhatsAppProvider === 'personal' ? 'Personal WhatsApp (App/Web)' : 'ESCROW API (Automated)'}
                  </span>.
                </p>
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-[11px] text-muted-foreground">
                  {pendingWhatsAppProvider === 'personal' ? (
                    <>
                      <strong className="text-foreground block mb-1">📱 Personal WhatsApp:</strong>
                      When sharing invoices, your personal WhatsApp or WhatsApp Web will open with a pre-formatted message and invoice link ready to send to your client.
                    </>
                  ) : (
                    <>
                      <strong className="text-foreground block mb-1">⚡ ESCROW API (Automated):</strong>
                      Invoices, PDF downloads, and payment links will be dispatched automatically to your client's WhatsApp directly from ESCROW's verified server gateway.
                    </>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex items-start space-x-2 py-3 px-1">
            <Checkbox
              id="confirm-whatsapp"
              checked={confirmWhatsAppCheck}
              onCheckedChange={(checked) => setConfirmWhatsAppCheck(!!checked)}
              className="mt-0.5"
            />
            <Label
              htmlFor="confirm-whatsapp"
              className="text-xs font-semibold text-foreground cursor-pointer select-none leading-tight"
            >
              I confirm that I want to switch the billing WhatsApp dispatch method
            </Label>
          </div>

          <AlertDialogFooter className="mt-2 gap-2 sm:gap-3">
            <AlertDialogCancel
              className="rounded-xl border-2 font-bold uppercase tracking-widest text-[10px]"
              onClick={() => {
                setConfirmWhatsAppCheck(false);
                setPendingWhatsAppProvider(null);
              }}
              disabled={whatsAppSaving}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmWhatsAppChange();
              }}
              disabled={!confirmWhatsAppCheck || whatsAppSaving}
              className={cn(
                "rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-sm px-6 transition-all gap-1.5",
                confirmWhatsAppCheck && !whatsAppSaving
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
              )}
            >
              {whatsAppSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm & Switch"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



      {/* Account Deletion Request Dialog Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="bg-rose-50 dark:bg-rose-950/40 p-5 md:p-6 border-b border-rose-200 dark:border-rose-900/50 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-rose-950 dark:text-rose-100">
                Request Account Deletion & Data Wipeout
              </DialogTitle>
              <DialogDescription className="text-xs text-rose-800/80 dark:text-rose-300/80 mt-1">
                Please review this action carefully. A notification will be dispatched to platform administrators to review and process your request.
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleSubmitDeletionRequest} className="p-5 md:p-6 space-y-4">
            {/* Warning bullet points */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 text-xs space-y-2">
              <p className="font-bold text-foreground">Before you proceed, please understand:</p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[11px]">
                <li>All sales invoices, purchase bills, and payment records will be permanently removed.</li>
                <li>Your client list, vendor records, and inventory catalog will be purged.</li>
                <li>Active subscriptions will be terminated immediately upon approval without automatic pro-rata refund.</li>
                <li>We recommend downloading an <strong>Excel Ledger Backup</strong> first from the Data Sovereignty section above.</li>
              </ul>
            </div>

            {/* Reason Select */}
            <div className="space-y-1.5">
              <Label htmlFor="delete-reason" className="text-xs font-semibold text-foreground">
                Primary Reason for Deletion *
              </Label>
              <Select value={deleteReason} onValueChange={setDeleteReason}>
                <SelectTrigger id="delete-reason" className="h-10 text-xs font-medium">
                  <SelectValue placeholder="Select primary reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Business operations closed / shutting down">Business operations closed / shutting down</SelectItem>
                  <SelectItem value="Migrating to alternative accounting platform">Migrating to alternative accounting platform</SelectItem>
                  <SelectItem value="Platform is difficult to use / too complex">Platform is difficult to use / too complex</SelectItem>
                  <SelectItem value="Missing required business features">Missing required business features</SelectItem>
                  <SelectItem value="Privacy and data protection concerns">Privacy and data protection concerns</SelectItem>
                  <SelectItem value="Cost / pricing considerations">Cost / pricing considerations</SelectItem>
                  <SelectItem value="Temporary business suspension">Temporary business suspension</SelectItem>
                  <SelectItem value="Other reason">Other reason</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Feedback Textarea */}
            <div className="space-y-1.5">
              <Label htmlFor="delete-feedback" className="text-xs font-semibold text-foreground">
                Additional Comments / Feedback (Optional)
              </Label>
              <Textarea
                id="delete-feedback"
                value={deleteFeedback}
                onChange={(e) => setDeleteFeedback(e.target.value)}
                placeholder="Help us understand how we could have served your business better..."
                className="min-h-[75px] text-xs resize-y"
              />
            </div>

            {/* Checkbox Acknowledgment */}
            <div className="flex items-start space-x-2 pt-1">
              <Checkbox
                id="ack-export"
                checked={deleteAcknowledgeExport}
                onCheckedChange={(checked) => setDeleteAcknowledgeExport(!!checked)}
                className="mt-0.5"
              />
              <Label htmlFor="ack-export" className="text-xs text-muted-foreground font-medium cursor-pointer leading-relaxed">
                I understand that account deletion is irreversible and all my invoices, client ledgers, and catalog records will be wiped out.
              </Label>
            </div>

            {/* Typing Confirmation */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <Label htmlFor="confirm-delete-word" className="text-xs font-semibold text-foreground">
                Type <span className="font-black text-rose-600 dark:text-rose-400">DELETE</span> to confirm *
              </Label>
              <Input
                id="confirm-delete-word"
                value={deleteConfirmWord}
                onChange={(e) => setDeleteConfirmWord(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                className="h-10 text-xs font-mono font-bold uppercase tracking-wider"
              />
            </div>

            <DialogFooter className="pt-3 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                className="h-10 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={submittingDeletionRequest || !deleteReason || !deleteAcknowledgeExport || deleteConfirmWord.trim().toUpperCase() !== 'DELETE'}
                className="h-10 text-xs font-bold uppercase tracking-wider gap-2 shadow-sm"
              >
                {submittingDeletionRequest ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Submit Deletion Request</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Business Type Change Request Dialog Modal */}
      <Dialog open={isTypeRequestModalOpen} onOpenChange={setIsTypeRequestModalOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="bg-primary/5 p-5 md:p-6 border-b border-border/80 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Request Business Category Switch
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Selected category will unlock relevant industry features (e.g. Downpayment invoices for Automobile).
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleSubmitTypeRequest} className="p-5 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">Select New Business Category</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setRequestedType('normal')}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                    requestedType === 'normal'
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs"
                      : "border-border/70 hover:border-border text-muted-foreground bg-muted/20"
                  )}
                >
                  <span className="text-xl mb-1">🛍️</span>
                  <span className="text-xs font-bold leading-tight">Retail</span>
                  <span className="text-[9px] text-muted-foreground mt-0.5">Shop / Trading</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRequestedType('automobile')}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                    requestedType === 'automobile'
                      ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold shadow-xs"
                      : "border-border/70 hover:border-border text-muted-foreground bg-muted/20"
                  )}
                >
                  <span className="text-xl mb-1">🚗</span>
                  <span className="text-xs font-bold leading-tight">Automobile</span>
                  <span className="text-[9px] text-muted-foreground mt-0.5">Dealers / Garage</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRequestedType('food_kitchen')}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                    requestedType === 'food_kitchen'
                      ? "border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-400 font-bold shadow-xs"
                      : "border-border/70 hover:border-border text-muted-foreground bg-muted/20"
                  )}
                >
                  <span className="text-xl mb-1">🍛</span>
                  <span className="text-xs font-bold leading-tight">Food / Kitchen</span>
                  <span className="text-[9px] text-muted-foreground mt-0.5">Restaurant / Cloud</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRequestedType('cafe')}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                    requestedType === 'cafe'
                      ? "border-amber-600 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold shadow-xs"
                      : "border-border/70 hover:border-border text-muted-foreground bg-muted/20"
                  )}
                >
                  <span className="text-xl mb-1">☕</span>
                  <span className="text-xs font-bold leading-tight">Cafe</span>
                  <span className="text-[9px] text-muted-foreground mt-0.5">Coffee / POS</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="type-reason" className="text-xs font-semibold text-foreground">
                Reason / Note for Admin (Optional)
              </Label>
              <Textarea
                id="type-reason"
                value={typeRequestReason}
                onChange={(e) => setTypeRequestReason(e.target.value)}
                placeholder="e.g. Registered with wrong category by mistake, we run an automobile workshop/dealership..."
                className="min-h-[70px] text-xs resize-y"
              />
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsTypeRequestModalOpen(false)}
                disabled={isSubmittingTypeRequest}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingTypeRequest || requestedType === userType}
                className="text-xs font-bold gap-1.5"
              >
                {isSubmittingTypeRequest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

};

export default SettingsPage;

