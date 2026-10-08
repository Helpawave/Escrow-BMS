import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as XLSX from 'xlsx';
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
  AlertTriangle
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
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


interface Profile {
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
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const SettingsPage = () => {
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
            await supabase
              .from('profiles')
              .upsert({
                user_id: targetUserId,
                gstin: profile.gstin.trim().toUpperCase(),
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' });
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

  const PLANS = {
    monthly: {
      amount: 34900, // Rs 349 in paise
      name: 'Monthly Plan',
      description: 'Pro features for 1 month'
    },
    yearly: {
      amount: 349900, // Rs 3,499 in paise
      name: 'Yearly Plan',
      description: 'Pro features for 1 year'
    }
  };

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
    whatsapp_provider: 'meta'
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
    if (targetProvider === (settings.whatsapp_provider ?? 'meta')) return;
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
  const { user, signOut, isTrialActive, trialDaysRemaining, isStaff, companyProfile, staffRole, staffPermissions, effectiveUserId, refreshProfile } = useAuth();
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

  const { isAutomobile } = useUserType();

  // Invoice Template Category Division: 'sales' vs 'purchase' vs 'automobile'
  const [templateCategory, setTemplateCategory] = useState<'sales' | 'purchase' | 'automobile'>('sales');

  useEffect(() => {
    if (isAutomobile) {
      setTemplateCategory('automobile');
    }
  }, [isAutomobile]);

  const [purchaseBillTemplate, setPurchaseBillTemplate] = useState<PurchaseTemplateId>(() => {
    return (localStorage.getItem('purchase_bill_template') as PurchaseTemplateId) || 'classic-blue';
  });
  const [previewPurchaseTemplate, setPreviewPurchaseTemplate] = useState<PurchaseTemplateId | null>(null);

  const [downpaymentTemplate, setDownpaymentTemplate] = useState<AutoTemplateId>(() => {
    return (localStorage.getItem('downpayment_template') as AutoTemplateId) || 'auto_dealership';
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
      notes: '[META:{"is_downpayment":true,"vehicle":{"model":"Mahindra XUV700 AX7 Luxury Pack (Diesel AT)","chassisNo":"MA1TN2WK0N1298412","engineNo":"MHWK8273615","color":"Midnight Black Metallic","regNo":"DL-08-TC-2026","financer":"HDFC Bank Auto Loan / Hypothecation","deliveryDate":"15-Nov-2026"}}]\nVehicle Booking Token & Advance Downpayment Receipt. Balance amount payable prior to vehicle registration and delivery.',
      terms: '1. Booking token is non-refundable upon vehicle allotment confirmation.\n2. Vehicle delivery subject to registration approval from Regional Transport Office (RTO).\n3. Dealership token voucher powered by EscrowBill.',
      vehicle_details: {
        model: 'Mahindra XUV700 AX7 Luxury Pack (Diesel AT)',
        chassisNo: 'MA1TN2WK0N1298412',
        engineNo: 'MHWK8273615',
        color: 'Midnight Black Metallic',
        regNo: 'DL-08-TC-2026',
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

  const handlePurchaseTemplateSelect = (tplId: PurchaseTemplateId) => {
    localStorage.setItem('purchase_bill_template', tplId);
    setPurchaseBillTemplate(tplId);
    toast({
      title: "Purchase Bill Template Updated",
      description: `Default layout set to ${tplId === 'classic-blue' ? 'Classic Blue' : tplId === 'commercial-erp' ? 'Commercial ERP' : tplId.toUpperCase()}.`
    });
  };

  const handleDownpaymentTemplateSelect = async (tplId: AutoTemplateId) => {
    localStorage.setItem('downpayment_template', tplId);
    setDownpaymentTemplate(tplId);
    const nextSettings = { ...settings, downpayment_template: tplId } as any;
    setSettings(nextSettings);
    await handleSettingsSave(nextSettings, { showToast: false });
    toast({
      title: "Downpayment Template Updated",
      description: `Automobile layout set to ${
        tplId === 'auto_dealership' ? 'Dealership Slip' :
        tplId === 'auto_modern' ? 'Modern Drive Voucher' :
        tplId === 'auto_classic' ? 'Classic RTO Form' :
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

    if (isStaff) {
      toast({
        variant: "destructive",
        title: "Action Prohibited",
        description: "Staff account profile details are locked and managed exclusively by your organization administrator."
      });
      return;
    }
    
    if (!personalName.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Name cannot be empty."
      });
      return;
    }

    setPersonalSaving(true);
    try {
      // 1. Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: personalName.trim(),
          name: personalName.trim(),
          mobile: personalPhone.trim()
        }
      });
      if (authError) throw authError;

      // 2. Update profiles table
      await supabase
        .from('profiles')
        .update({
          phone: personalPhone.trim() || null,
          mobile: personalPhone.trim() || null
        })
        .eq('user_id', user.id);

      // 3. If staff, sync to company_staff table & localStorage
      if (isStaff || user.email) {
        try {
          await (supabase as any)
            .from('company_staff')
            .update({
              name: personalName.trim(),
              phone: personalPhone.trim() || null,
              updated_at: new Date().toISOString()
            })
            .or(`user_id.eq.${user.id},email.ilike.${user.email}`);
        } catch (e) {
          // Continue
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
                      return { ...s, name: personalName.trim(), phone: personalPhone.trim() };
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



  const handleUpgrade = async () => {
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
      const planDetails = PLANS[selectedPlan];
      const { data: order, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: { amount: planDetails.amount, currency: 'INR' }
      });

      if (error || !order) throw error || new Error('Failed to create order');

      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
        throw new Error('Razorpay Key missing from environment variable');
      }

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
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                user_id: user?.id,
                plan_type: selectedPlan
              }
            });

            if (verifyError) throw verifyError;

            toast({
              title: "Subscription Active!",
              description: `Your ${selectedPlan} plan is now active until ${safelyToLocaleDate(verifyData.expires_at)}.`,
              duration: 5000,
            });

            // Refresh profile to show new status
            fetchProfile();

          } catch (error) {
            console.error('Verification Error:', error);
            toast({
              title: "Payment Verification Failed",
              description: "Payment successful but verification failed. Please contact support.",
              variant: "destructive"
            });
          }
        },
        prefill: {
          name: profile.company_name || user?.email,
          email: user?.email,
          contact: profile.phone
        },
        theme: {
          color: "#0F172A"
        }
      };

      const paymentObject = new window.Razorpay(options);
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
      } catch {}

      // Auto-save logo URL to database table immediately
      const targetUserId = (isStaff && effectiveUserId) ? effectiveUserId : user.id;
      await supabase
        .from('profiles')
        .update({
          logo_url: publicLogoUrl,
          updated_at: new Date().toISOString()
        })
        .or(`user_id.eq.${targetUserId},id.eq.${targetUserId}`);

      const { error: saveError } = await supabase
        .from('profiles')
        .upsert({
          id: targetUserId,
          user_id: targetUserId,
          logo_url: publicLogoUrl,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

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
          .or(`user_id.eq.${targetUserId},id.eq.${targetUserId}`);
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

      const publicSignatureUrl = `${data.publicUrl}?t=${Date.now()}`;
      setProfile({ ...profile, signature_url: publicSignatureUrl });

      try {
        localStorage.setItem('escrow_company_signature_url', publicSignatureUrl);
      } catch {}

      // Auto-save signature URL to database table immediately
      const targetUserId = (isStaff && effectiveUserId) ? effectiveUserId : user.id;
      await supabase
        .from('profiles')
        .update({
          signature_url: publicSignatureUrl,
          updated_at: new Date().toISOString()
        })
        .or(`user_id.eq.${targetUserId},id.eq.${targetUserId}`);

      const { error: saveError } = await supabase
        .from('profiles')
        .upsert({
          id: targetUserId,
          user_id: targetUserId,
          signature_url: publicSignatureUrl,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (saveError) {
        console.error('Error saving signature to database:', saveError);
      }

      await refreshProfile(true);

      toast({
        title: "Success",
        description: "Authorized signature uploaded and saved successfully."
      });

      // Invalidate queries to update Dashboard
      void queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      if (targetUserId) {
        void queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
      }
    } catch (error) {
      console.error('Error uploading signature:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload signature."
      });
    }
  };

  const handleRemoveSignature = async () => {
    setProfile({ ...profile, signature_url: '' });
    try {
      localStorage.removeItem('escrow_company_signature_url');
      const targetUserId = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
      if (targetUserId) {
        await supabase
          .from('profiles')
          .update({ signature_url: null, updated_at: new Date().toISOString() })
          .or(`user_id.eq.${targetUserId},id.eq.${targetUserId}`);
        await refreshProfile(true);
        void queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
        void queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
      }
      toast({
        title: "Signature Removed",
        description: "Authorized signature has been removed."
      });
    } catch (err) {
      console.error('Error removing signature:', err);
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
      if (!targetUserId) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`user_id.eq.${targetUserId},id.eq.${targetUserId}`)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const pData = data as Partial<Profile>;
        if (pData.logo_url) {
          try { localStorage.setItem('escrow_company_logo_url', pData.logo_url); } catch {}
        }
        if (pData.signature_url) {
          try { localStorage.setItem('escrow_company_signature_url', pData.signature_url); } catch {}
        }
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
          subscription_expires_at: pData.subscription_expires_at || null
        });

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
      setProfileSaving(true);
      try {
        if (user?.id) {
          const { error: authError } = await supabase.auth.updateUser({
            data: {
              full_name: personalName.trim(),
              name: personalName.trim(),
              mobile: personalPhone.trim()
            }
          });
          if (authError) throw authError;
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

    setProfileSaving(true);
    try {
      // Exclude subscription_expires_at from manual profile update to prevent constraint issues
      const { subscription_expires_at, ...profileToSave } = profile;
      const targetUserId = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;

      if (profile.logo_url) {
        try { localStorage.setItem('escrow_company_logo_url', profile.logo_url); } catch {}
      }
      if (profile.signature_url) {
        try { localStorage.setItem('escrow_company_signature_url', profile.signature_url); } catch {}
      }

      await supabase
        .from('profiles')
        .update({
          ...profileToSave,
          mobile: profile.phone || null,
          updated_at: new Date().toISOString()
        })
        .or(`user_id.eq.${targetUserId},id.eq.${targetUserId}`);

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: targetUserId,
          user_id: targetUserId,
          ...profileToSave,
          mobile: profile.phone || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;

      await refreshProfile();

      if (profile.settings_locked) {
        toast({
          title: "Profile Saved & Locked 🔒",
          description: "Business settings saved and securely locked against accidental changes."
        });
      } else {
        toast({
          title: "Profile Saved! ⚠️ Action Recommended",
          description: "Business settings saved successfully. Please click 'Lock Info' to secure your company & GST details from accidental edits.",
          duration: 6000
        });
      }

      // Invalidate queries to update Dashboard and other components immediately
      void queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      if (targetUserId) {
        void queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to save settings."
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleToggleLock = async () => {
    if (isStaff) return;
    const newLockState = !profile.settings_locked;
    setProfile(prev => ({ ...prev, settings_locked: newLockState }));

    try {
      const targetUserId = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
      const { error } = await supabase
        .from('profiles')
        .update({ 
          settings_locked: newLockState,
          updated_at: new Date().toISOString()
        })
        .or(`user_id.eq.${targetUserId},id.eq.${targetUserId}`);

      if (error) throw error;

      toast({
        title: newLockState ? "Profile Locked 🔒" : "Profile Unlocked 🔓",
        description: newLockState 
          ? "Your business settings are now securely locked against accidental changes." 
          : "Your business settings are unlocked. You can now edit your details."
      });

      void queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    } catch (err: any) {
      console.error('Error toggling lock in database:', err);
    }
  };

  const fetchSettings = useCallback(async () => {
    try {
      const targetUserId = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
      if (!targetUserId) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

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
          invoice_template: sData.invoice_template || 'corporate',
          hide_company_details: sData.hide_company_details ?? false,
          whatsapp_provider: (sData as any).whatsapp_provider || 'meta'
        });

        if ((sData as any)?.downpayment_template) {
          setDownpaymentTemplate((sData as any).downpayment_template);
          localStorage.setItem('downpayment_template', (sData as any).downpayment_template);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, [user, isStaff, effectiveUserId]);

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
    const payload = overrideSettings || settings;
    if (isManual) {
      setSettingsSaving(true);
    }
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
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
              <TabsList className="inline-flex min-w-max md:w-full md:grid md:grid-cols-4 h-auto p-1.5 bg-muted/80 backdrop-blur-md rounded-xl gap-1.5 shadow-xs">
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
              </TabsList>
            </div>
            {/* Subtle right fade edge on mobile to indicate scrollability */}
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
          </div>
        </div>
        <div className="w-full max-w-7xl mx-auto space-y-6 transition-all duration-300">
          <TabsContent value="membership" className="m-0 space-y-6">
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
                          : profile.subscription_expires_at 
                            ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                            : isTrialActive 
                              ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                              : "bg-muted text-muted-foreground border-border"
                      )}>
                        {isStaff 
                          ? 'ENTERPRISE SEAT' 
                          : profile.subscription_expires_at 
                            ? 'PRO UNLIMITED' 
                            : isTrialActive 
                              ? '7-DAY TRIAL' 
                              : 'FREE TIER'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      {isStaff
                        ? 'Staff seat operating under authorized enterprise company license'
                        : profile.subscription_expires_at
                          ? `Active & Verified • Valid until ${safelyToLocaleDate(profile.subscription_expires_at)} (${countdownText})`
                          : isTrialActive
                            ? `${trialDaysRemaining} days remaining in your unrestricted Pro trial`
                            : 'Upgrade to remove limits and unlock all 10 invoice templates and automated billing'}
                    </p>
                  </div>
                </div>

                {/* Status indicator / Expiry badge */}
                {!isStaff && profile.subscription_expires_at && (
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

              {/* 2. COMPREHENSIVE MEMBERSHIP & LICENSE DETAILS (Details Pure Do) */}
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

                {/* 3. EXTEND OR RENEW SUBSCRIPTION SECTION (PERMANENTLY VISIBLE, NOT EXPANDABLE) */}
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

                  {/* Plan Cards Grid (Always Open / Non-Expandable) */}
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
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-foreground">₹349</span>
                            <span className="text-xs text-muted-foreground font-semibold">/ month</span>
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
                            handleUpgrade();
                          }}
                          disabled={settingsSaving}
                          variant={selectedPlan === 'monthly' ? "default" : "outline"}
                          className="w-full h-11 font-bold text-xs uppercase tracking-wider gap-2 shadow-sm"
                        >
                          <Zap className="w-4 h-4" />
                          {settingsSaving && selectedPlan === 'monthly'
                            ? 'Preparing Checkout...'
                            : isProActive ? 'Extend 1 Month (+30 Days) • ₹349' : 'Upgrade Monthly (₹349)'}
                        </Button>
                      </div>
                    </div>

                    {/* YEARLY PLAN CARD (FEATURED / BEST VALUE) */}
                    <div
                      onClick={() => setSelectedPlan('yearly')}
                      className={cn(
                        "relative rounded-2xl border-2 p-6 flex flex-col justify-between transition-all duration-200 cursor-pointer bg-card hover:shadow-xl",
                        selectedPlan === 'yearly'
                          ? "border-primary ring-2 ring-primary/40 shadow-xl bg-gradient-to-b from-primary/[0.04] to-card"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {/* Popular ribbon */}
                      <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider py-1 px-3.5 rounded-full shadow-md flex items-center gap-1.5 z-10">
                        <Sparkles className="w-3 h-3 fill-current" />
                        Best Value • 2 Months Free (Save 17%)
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
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-foreground">₹3,499</span>
                            <span className="text-xs text-muted-foreground font-semibold">/ year</span>
                            <span className="ml-2 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              ₹291/mo effective
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
                            '2 Months Free (Save ₹689 annually)',
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
                            handleUpgrade();
                          }}
                          disabled={settingsSaving}
                          className="w-full h-11 font-bold text-xs uppercase tracking-wider gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <Zap className="w-4 h-4 fill-current" />
                          {settingsSaving && selectedPlan === 'yearly'
                            ? 'Preparing Checkout...'
                            : isProActive ? 'Extend 1 Year (+365 Days) • Save 17%' : 'Upgrade Yearly (₹3,499) • Save 17%'}
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
          </TabsContent>

          <TabsContent value="business" className="m-0 space-y-6">
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
                            !profile.settings_locked
                              ? "border-amber-500/70 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100/70 hover:border-amber-600 shadow-sm"
                              : "border-border text-muted-foreground hover:text-foreground"
                          )}
                          title={profile.settings_locked ? "Click to unlock fields" : "Action recommended: Click to lock and protect company info"}
                        >
                          {profile.settings_locked ? (
                            <>
                              <Lock className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                              Unlock
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-amber-500 shrink-0" />
                              Lock Info
                              <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white shadow-sm ring-2 ring-background animate-pulse">
                                !
                              </span>
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
                              onClick={() => {
                                navigator.clipboard.writeText(generateAccountId(user?.id));
                                toast({ title: "Copied", description: "Account ID copied to clipboard." });
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

                            {/* GST Verification Result Card - Standard industry UX */}
                            {gstVerified && verifiedGstName && (
                              <div className="mt-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                {/* Header */}
                                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/60 border-b border-emerald-200 dark:border-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Verified — GST Portal Record</span>
                                  <span className={`ml-auto text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    (gstVerificationData?.status || '').toLowerCase() === 'active'
                                      ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200'
                                      : 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                                  }`}>{gstVerificationData?.status || 'Active'}</span>
                                </div>
                                {/* Details */}
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
                              value={profile.phone}
                              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                              placeholder="+91 98765 43210"
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
                                value={personalPhone}
                                onChange={(e) => setPersonalPhone(e.target.value)}
                                placeholder="e.g. 9876543210"
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
                                  onClick={() => {
                                    navigator.clipboard.writeText(generateAccountId(user?.id));
                                    toast({ title: "Copied", description: "Account ID copied to clipboard." });
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
                      <div className="space-y-1.5 sm:col-span-2 pt-3 border-t border-border/60">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="upi_id" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <QrCode className="w-4 h-4 text-emerald-600" />
                            UPI ID / VPA
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                              Auto-generates QR on Invoices
                            </span>
                          </Label>
                        </div>
                        <Input
                          id="upi_id"
                          value={profile.upi_id || ''}
                          onChange={(e) => setProfile({ ...profile, upi_id: e.target.value.trim() })}
                          placeholder="e.g. 9876543210@paytm or yourbusiness@okaxis"
                          disabled={profile.settings_locked || isStaff}
                          className="h-10 bg-background font-medium border-emerald-300/80 focus:ring-emerald-500 rounded-lg text-sm"
                        />
                        <p className="text-xs text-muted-foreground flex items-start gap-1.5 mt-1">
                          <span className="text-emerald-600 font-bold shrink-0">ℹ️ Note:</span>
                          <span>Enter your UPI ID here — invoices will automatically generate a dynamic, scannable QR code using this UPI ID for instant client payments. No photo or image upload is needed.</span>
                        </p>
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
                            <button
                              onClick={handleRemoveLogo}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all"
                              title="Remove company logo"
                            >
                              <X className="w-3 h-3" />
                            </button>
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
                                onClick={handleRemoveSignature}
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
          </TabsContent>

          {/* PREFERENCES & SECURITY TAB */}
          <TabsContent value="preferences" className="m-0 space-y-6 outline-none">
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
                                  description: `Updated rate: 1 ${settings.default_currency} = ₹${inrPerUnit.toFixed(2)}`
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
          </TabsContent>

          {/* DEDICATED INVOICE TEMPLATES TAB (SEPARATED SALES & PURCHASE) */}
          <TabsContent value="templates" className="m-0 space-y-5 outline-none">
            {/* Top Category Division / Segmented Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 bg-muted/40 rounded-2xl border border-border">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-background rounded-xl border border-border/70 shadow-xs">
                <button
                  type="button"
                  onClick={() => setTemplateCategory('sales')}
                  className={cn(
                    "flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all",
                    templateCategory === 'sales'
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileText className="w-4 h-4" />
                  <span>Sales Invoice Templates</span>
                  <Badge variant={templateCategory === 'sales' ? "outline" : "secondary"} className="ml-1 text-[10px] py-0 px-1.5 font-mono">
                    10
                  </Badge>
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateCategory('purchase')}
                  className={cn(
                    "flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all",
                    templateCategory === 'purchase'
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Purchase Bill Templates</span>
                  <Badge variant={templateCategory === 'purchase' ? "outline" : "secondary"} className="ml-1 text-[10px] py-0 px-1.5 font-mono">
                    5
                  </Badge>
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateCategory('automobile')}
                  className={cn(
                    "flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all",
                    templateCategory === 'automobile'
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Car className="w-4 h-4" />
                  <span>Automobile / Downpayment</span>
                  <Badge variant={templateCategory === 'automobile' ? "outline" : "secondary"} className="ml-1 text-[10px] py-0 px-1.5 font-mono">
                    5
                  </Badge>
                </button>
              </div>

              <div className="text-xs text-muted-foreground px-2 font-medium">
                {templateCategory === 'sales'
                  ? 'Outward Customer Invoices & Cash Memos'
                  : templateCategory === 'purchase'
                  ? 'Inward Supplier Bills & Physical Stock Vouchers'
                  : 'Vehicle Booking Tokens, Advance Downpayments & RTO Delivery Receipts'}
              </div>
            </div>

            {/* SECTION 1: SALES INVOICE TEMPLATES */}
            {templateCategory === 'sales' && (
              <Card className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-transparent">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground tracking-tight">Sales Invoice Templates</h3>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active: {
                            settings.invoice_template === 'modern' ? 'Modern UPI' :
                            settings.invoice_template === 'corporate' ? 'Corporate' :
                            settings.invoice_template === 'professional' ? 'Professional' :
                            settings.invoice_template === 'elegant' ? 'Elegant' :
                            settings.invoice_template === 'classic' ? 'Classic GST' :
                            settings.invoice_template === 'creative' ? 'Creative Studio' :
                            settings.invoice_template === 'retail' ? 'Retail Superstore' :
                            settings.invoice_template === 'thermal' ? 'Thermal POS' :
                            settings.invoice_template === 'export' ? 'Global Export' :
                            settings.invoice_template === 'minimal' ? 'Minimal' :
                            'Corporate'
                          }
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Choose from 10 GST compliant formats designed for Indian customer sales, agencies, retail, and international trade.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewTemplate((settings.invoice_template as InvoiceTemplateId) || 'corporate')}
                      className="h-8 gap-1.5 font-bold text-xs uppercase tracking-wider border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview Active
                    </Button>
                  </div>
                </div>

                {/* Sales Template Cards Grid */}
                <div className="p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {[
                      {
                        id: 'classic' as const,
                        name: 'Classic GST',
                        formatTag: 'Rule 46 Grid',
                        description: 'Ruled boxed layout with detailed HSN/SAC summary tax table.',
                      },
                      {
                        id: 'corporate' as const,
                        name: 'Corporate',
                        formatTag: 'Navy Ribbon',
                        description: 'Formal layout with dark navy ribbon, serif typography, and dual sign boxes.',
                      },
                      {
                        id: 'creative' as const,
                        name: 'Creative Studio',
                        formatTag: 'Agency & Tech',
                        description: 'Violet accent studio layout with deliverable milestones, project notes, and UPI.',
                      },
                      {
                        id: 'retail' as const,
                        name: 'Retail Superstore',
                        formatTag: 'Cash Memo & POS',
                        description: 'Emerald retail layout with Savings callout, return policy, and itemized GST.',
                      },
                      {
                        id: 'professional' as const,
                        name: 'Professional',
                        formatTag: 'Gradient Header',
                        description: 'Clean business invoice with gradient banner, accent borders, and bank card.',
                      },
                      {
                        id: 'modern' as const,
                        name: 'Modern UPI',
                        formatTag: 'Scan & Pay QR',
                        description: 'Contemporary invoice with dynamic UPI QR code for fast mobile payments.',
                      },
                      {
                        id: 'elegant' as const,
                        name: 'Elegant',
                        formatTag: 'Tax Split Grid',
                        description: 'Refined layout with Sold By vs Billing columns and itemized tax breakdown.',
                      },
                      {
                        id: 'export' as const,
                        name: 'Global Export',
                        formatTag: 'International LUT',
                        description: 'Cross-border invoice under LUT with Port details, USD currency, and SWIFT box.',
                      },
                      {
                        id: 'minimal' as const,
                        name: 'Minimal',
                        formatTag: 'Clean Editorial',
                        description: 'Distraction-free typographic layout with generous whitespace and fine dividers.',
                      },
                      {
                        id: 'thermal' as const,
                        name: 'Thermal POS',
                        formatTag: '58mm / 80mm',
                        description: 'Compact monospace receipt designed for POS thermal roll printers with barcode.',
                      }
                    ].map((tpl) => {
                      const isActive = settings.invoice_template === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          className={cn(
                            "group relative rounded-xl border p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer bg-card",
                            isActive
                              ? "border-primary bg-primary/[0.02] ring-2 ring-primary/25 shadow-md"
                              : "border-border hover:border-primary/40"
                          )}
                          onClick={() => handleTemplateSelect(tpl.id)}
                        >
                          {/* Active Indicator Badge */}
                          {isActive && (
                            <div className="absolute -top-2.5 -right-2 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-wider py-0.5 px-2.5 rounded-full shadow-sm flex items-center gap-1 z-10">
                              <Check className="w-3 h-3 stroke-[3]" />
                              Active
                            </div>
                          )}

                          <div className="space-y-3">
                            {/* Live Miniature Preview */}
                            <div 
                              className="h-52 w-full rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 overflow-hidden relative flex justify-center items-start pt-2 px-2 shadow-inner select-none group-hover:border-primary/50 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewTemplate(tpl.id);
                              }}
                            >
                              <div
                                className="origin-top transition-transform duration-300 pointer-events-none"
                                style={{
                                  width: tpl.id === 'thermal' ? '340px' : '794px',
                                  transform: tpl.id === 'thermal' ? 'scale(0.56)' : 'scale(0.26)',
                                  transformOrigin: 'top center',
                                }}
                              >
                                <div className="bg-white text-slate-900 shadow-md border border-slate-300 rounded-sm pointer-events-none overflow-hidden">
                                  <InvoiceTemplate
                                    template={tpl.id}
                                    invoice={tpl.id === 'export' ? { ...sampleInvoiceData.invoice, currency: 'USD', tax_amount: 0, total_amount: 12000 } : sampleInvoiceData.invoice}
                                    client={tpl.id === 'export' ? { ...sampleInvoiceData.client, country: 'United States' } : sampleInvoiceData.client}
                                    items={sampleInvoiceData.items}
                                    company={sampleInvoiceData.company}
                                  />
                                </div>
                              </div>
                              <div className="absolute inset-x-0 bottom-0 py-2 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-bold text-white flex items-center gap-1 drop-shadow">
                                  <Eye className="w-3 h-3 text-white" /> Click to preview full size
                                </span>
                              </div>
                            </div>

                            {/* Info */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1.5">
                                <h4 className="font-bold text-sm text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">{tpl.name}</h4>
                                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60 shrink-0">
                                  {tpl.formatTag}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {tpl.description}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="pt-3 mt-3 border-t border-border flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 text-xs font-semibold gap-1.5 rounded-lg border-border hover:bg-muted"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewTemplate(tpl.id);
                              }}
                            >
                              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                              Preview
                            </Button>
                            <Button
                              variant={isActive ? "secondary" : "default"}
                              size="sm"
                              disabled={isActive}
                              className={cn(
                                "flex-1 h-8 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                                isActive
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default opacity-100"
                                  : "shadow-sm hover:opacity-95"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTemplateSelect(tpl.id);
                              }}
                            >
                              {isActive ? (
                                <span className="flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Active
                                </span>
                              ) : "Apply"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Print Stationary & Letterhead Preferences Card */}
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <div className="flex items-center gap-2">
                      <Printer className="w-4 h-4 text-primary" />
                      <h4 className="text-sm font-bold text-foreground">Print & Business Defaults</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Letterhead Toggle */}
                      <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-start gap-3">
                        <Checkbox
                          id="hideCompanyDetails"
                          checked={settings.hide_company_details}
                          onCheckedChange={(checked) => {
                            const next = { ...settings, hide_company_details: !!checked };
                            setSettings(next);
                            void handleSettingsSave(next, { showToast: true });
                          }}
                          className="mt-0.5"
                        />
                        <div>
                          <Label htmlFor="hideCompanyDetails" className="text-xs font-bold text-foreground cursor-pointer">
                            Pre-printed Letterhead Mode
                          </Label>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                            Hides company header on PDFs. Use when printing on letterhead stationary.
                          </p>
                        </div>
                      </div>

                      {/* Branding Assets Readiness */}
                      <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between gap-3">
                        <div>
                          <h5 className="text-xs font-bold text-foreground">Branding Assets</h5>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {profile.logo_url ? "✓ Logo" : "⚠️ No logo"} • {profile.signature_url ? "✓ Signature" : "⚠️ No signature"} • {profile.upi_id ? "✓ UPI QR (Active)" : "⚠️ No UPI ID"}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveSection('business')}
                          className="shrink-0 h-7 text-[11px] font-bold"
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* SECTION 2: PURCHASE BILL TEMPLATES (DEDICATED PROCUREMENT & INWARD VOUCHERS) */}
            {templateCategory === 'purchase' && (
              <Card className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground tracking-tight">Purchase Bill Templates</h3>
                        <Badge variant="outline" className="bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border-indigo-600/30 text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active: {
                            purchaseBillTemplate === 'classic-blue' ? 'Classic Blue (Image 1)' :
                            purchaseBillTemplate === 'commercial-erp' ? 'Commercial ERP (Image 2)' :
                            purchaseBillTemplate === 'tax-itc' ? 'GST ITC Voucher' :
                            purchaseBillTemplate === 'grn' ? 'GRN Note' :
                            'Standard Procurement'
                          }
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Professional inward procurement layouts tailored for vendor bills, stock receipt verification, and GST Input Tax Credit (ITC) audits.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewPurchaseTemplate(purchaseBillTemplate)}
                      className="h-8 gap-1.5 font-bold text-xs uppercase tracking-wider border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview Active
                    </Button>
                  </div>
                </div>

                {/* Purchase Template Cards Grid */}
                <div className="p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[
                      {
                        id: 'classic-blue' as const,
                        name: 'Classic Blue',
                        formatTag: 'Vertex42 Style • Ref Image 1',
                        description: 'Clean corporate procurement bill with solid blue BILL TO / SHIP TO banners, P.O. logistics strip, ruled item table, and comments box.',
                      },
                      {
                        id: 'commercial-erp' as const,
                        name: 'Commercial ERP Invoice',
                        formatTag: 'Enterprise ERP • Ref Image 2',
                        description: 'Commercial purchase layout with prominent dark header banner, yellow supplier info box, full lined grid, bank details, and stock verification box.',
                      },
                      {
                        id: 'tax-itc' as const,
                        name: 'GST ITC Audit Voucher',
                        formatTag: 'Section 16 CGST • CA Audit',
                        description: 'Auditor-grade voucher with CGST, SGST, IGST tax credit split, supplier GSTIN verification, and legal ITC claim certification.',
                      },
                      {
                        id: 'grn' as const,
                        name: 'Goods Receipt Note (GRN)',
                        formatTag: 'Warehouse Stock Inward',
                        description: 'Physical inventory inward stock entry voucher with billed qty vs received qty inspection and store keeper signatures.',
                      },
                      {
                        id: 'standard' as const,
                        name: 'Standard Procurement',
                        formatTag: 'Voucher Format',
                        description: 'Clean modern inward procurement voucher with dual party cards, HSN breakdown, and stock approved verification.',
                      }
                    ].map((tpl) => {
                      const isActive = purchaseBillTemplate === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          className={cn(
                            "group relative rounded-xl border p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer bg-card",
                            isActive
                              ? "border-indigo-600 bg-indigo-50/10 dark:bg-indigo-950/20 ring-2 ring-indigo-500/25 shadow-md"
                              : "border-border hover:border-indigo-500/40"
                          )}
                          onClick={() => handlePurchaseTemplateSelect(tpl.id)}
                        >
                          {/* Active Indicator Badge */}
                          {isActive && (
                            <div className="absolute -top-2.5 -right-2 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider py-0.5 px-2.5 rounded-full shadow-sm flex items-center gap-1 z-10">
                              <Check className="w-3 h-3 stroke-[3]" />
                              Active Default
                            </div>
                          )}

                          <div className="space-y-3">
                            {/* Live Miniature Preview of Purchase Template */}
                            <div 
                              className="h-56 w-full rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 overflow-hidden relative flex justify-center items-start pt-2 px-2 shadow-inner select-none group-hover:border-indigo-500/50 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewPurchaseTemplate(tpl.id);
                              }}
                            >
                              <div
                                className="origin-top transition-transform duration-300 pointer-events-none"
                                style={{
                                  width: '794px',
                                  transform: 'scale(0.26)',
                                  transformOrigin: 'top center',
                                }}
                              >
                                <div className="bg-white text-slate-900 shadow-md border border-slate-300 rounded-sm pointer-events-none overflow-hidden">
                                  <PurchaseBillTemplate
                                    template={tpl.id}
                                    invoice={samplePurchaseData.invoice}
                                    vendor={samplePurchaseData.vendor}
                                    items={samplePurchaseData.items}
                                    company={samplePurchaseData.company}
                                  />
                                </div>
                              </div>
                              <div className="absolute inset-x-0 bottom-0 py-2 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-bold text-white flex items-center gap-1 drop-shadow">
                                  <Eye className="w-3 h-3 text-white" /> Click to preview full size
                                </span>
                              </div>
                            </div>

                            {/* Info */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1.5">
                                <h4 className="font-bold text-sm text-foreground tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{tpl.name}</h4>
                                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                                  {tpl.formatTag}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {tpl.description}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="pt-3 mt-3 border-t border-border flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 text-xs font-semibold gap-1.5 rounded-lg border-border hover:bg-muted"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewPurchaseTemplate(tpl.id);
                              }}
                            >
                              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                              Preview
                            </Button>
                            <Button
                              variant={isActive ? "secondary" : "default"}
                              size="sm"
                              disabled={isActive}
                              className={cn(
                                "flex-1 h-8 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                                isActive
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default opacity-100"
                                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePurchaseTemplateSelect(tpl.id);
                              }}
                            >
                              {isActive ? (
                                <span className="flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Active
                                </span>
                              ) : "Apply"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Stock Integration & ITC Guarantee Banner */}
                  <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 flex items-start gap-3">
                      <PackageCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-foreground">Automatic Inward Stock Linking</h5>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          Items created in purchase bills automatically update your inventory stock count and are fully tracked in stock adjustment history.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-foreground">100% Tax Credit (ITC) Compliance</h5>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          All purchase bill formats strictly separate vendor GSTIN, CGST, SGST, and IGST to ensure seamless monthly GSTR-2B reconciliation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* SECTION 3: AUTOMOBILE & DOWNPAYMENT TEMPLATES */}
            {templateCategory === 'automobile' && (
              <Card className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground tracking-tight">Automobile & Downpayment Templates</h3>
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Active: {
                            downpaymentTemplate === 'auto_dealership' ? 'Dealership Slip' :
                            downpaymentTemplate === 'auto_modern' ? 'Modern Drive Voucher' :
                            downpaymentTemplate === 'auto_classic' ? 'Classic RTO Form' :
                            downpaymentTemplate === 'auto_executive' ? 'Executive Luxury Allotment' :
                            downpaymentTemplate === 'auto_compact' ? 'Compact Token Counter Slip' :
                            'Dealership Slip'
                          }
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        5 dedicated vehicle templates featuring Model, Chassis/VIN, Engine No, Color, Booking No, and Financer Hypothecation.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewTemplate(downpaymentTemplate as InvoiceTemplateId)}
                      className="h-8 gap-1.5 font-bold text-xs uppercase tracking-wider border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview Active
                    </Button>
                  </div>
                </div>

                {/* Automobile Template Cards Grid */}
                <div className="p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                    {[
                      {
                        id: 'auto_dealership' as const,
                        name: 'Dealership Slip',
                        formatTag: 'Showroom Official',
                        description: 'Red & Slate dual-tone dealership header with vehicle specs box, Form 21 compliance, and dual sign.',
                      },
                      {
                        id: 'auto_modern' as const,
                        name: 'Modern Drive',
                        formatTag: 'Digital VIN Card',
                        description: 'Dark-gradient hero voucher with vehicle badge card, financial allotment breakdown, and UPI QR.',
                      },
                      {
                        id: 'auto_classic' as const,
                        name: 'Classic RTO Order',
                        formatTag: 'Vehicle Particulars',
                        description: 'Traditional automotive grid with boxed vehicle particulars table, booking terms, and cashier seal.',
                      },
                      {
                        id: 'auto_executive' as const,
                        name: 'Executive Luxury',
                        formatTag: 'Luxury Navy/Gold',
                        description: 'Premium dealership certificate with vehicle allocation table, loan hypothecation details, and manager sign.',
                      },
                      {
                        id: 'auto_compact' as const,
                        name: 'Compact Counter',
                        formatTag: 'Quick Token Slip',
                        description: 'Monospace quick counter slip designed for 2W & 4W instant booking token and advance advance deposits.',
                      }
                    ].map((tpl) => {
                      const isActive = downpaymentTemplate === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          className={cn(
                            "group relative rounded-xl border p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer bg-card",
                            isActive
                              ? "border-amber-600 bg-amber-500/[0.02] ring-2 ring-amber-500/25 shadow-md"
                              : "border-border hover:border-amber-500/40"
                          )}
                          onClick={() => handleDownpaymentTemplateSelect(tpl.id)}
                        >
                          {isActive && (
                            <div className="absolute -top-2.5 -right-2 bg-amber-600 text-white text-[9px] font-black uppercase tracking-wider py-0.5 px-2.5 rounded-full shadow-sm flex items-center gap-1 z-10">
                              <Check className="w-3 h-3 stroke-[3]" />
                              Active
                            </div>
                          )}

                          <div className="space-y-3">
                            <div 
                              className="h-52 w-full rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 overflow-hidden relative flex justify-center items-start pt-2 px-2 shadow-inner select-none group-hover:border-amber-500/50 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewTemplate(tpl.id);
                              }}
                            >
                              <div
                                className="origin-top transition-transform duration-300 pointer-events-none"
                                style={{
                                  width: tpl.id === 'auto_compact' ? '440px' : '794px',
                                  transform: tpl.id === 'auto_compact' ? 'scale(0.48)' : 'scale(0.26)',
                                  transformOrigin: 'top center',
                                }}
                              >
                                <div className="bg-white text-slate-900 shadow-md border border-slate-300 rounded-sm pointer-events-none overflow-hidden">
                                  <InvoiceTemplate
                                    template={tpl.id}
                                    invoice={sampleAutoData.invoice}
                                    client={sampleAutoData.client}
                                    items={sampleAutoData.items}
                                    company={sampleAutoData.company}
                                  />
                                </div>
                              </div>
                              <div className="absolute inset-x-0 bottom-0 py-2 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-bold text-white flex items-center gap-1 drop-shadow">
                                  <Eye className="w-3 h-3 text-white" /> Click to preview full size
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1.5">
                                <h4 className="font-bold text-sm text-foreground tracking-tight leading-none group-hover:text-amber-600 transition-colors">{tpl.name}</h4>
                                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60 shrink-0">
                                  {tpl.formatTag}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {tpl.description}
                              </p>
                            </div>
                          </div>

                          <div className="pt-3 mt-3 border-t border-border flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 text-xs font-semibold gap-1.5 rounded-lg border-border hover:bg-muted"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewTemplate(tpl.id);
                              }}
                            >
                              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                              Preview
                            </Button>
                            <Button
                              variant={isActive ? "secondary" : "default"}
                              size="sm"
                              disabled={isActive}
                              className={cn(
                                "flex-1 h-8 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                                isActive
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default opacity-100"
                                  : "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownpaymentTemplateSelect(tpl.id);
                              }}
                            >
                              {isActive ? (
                                <span className="flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Active
                                </span>
                              ) : "Apply"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Automobile Compliance Banner */}
                  <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 flex items-start gap-3">
                      <Car className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-foreground">Complete Vehicle Specifications Capture</h5>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          Captures Vehicle Model, Chassis/VIN, Engine No, Color, Booking No, and Financer Hypothecation directly on the invoice receipt.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-foreground">RTO / Dealership Booking Compliance</h5>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          Fully formatted for vehicle dealership booking advance receipts, Form 21 sale certificates, and bank hypothecation clearance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
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
            <Button className="flex-1 h-11 rounded-xl bg-primary hover:opacity-90 font-bold uppercase tracking-widest text-[10px] shadow-sm" onClick={() => { handleTemplateSelect(previewTemplate!); setPreviewTemplate(null); }}>
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

          <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100/50 dark:bg-slate-950/50 flex justify-center">
            <div className="w-full max-w-[820px]">
              <div className="shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 rounded-sm mb-6 overflow-hidden">
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
            <div className="text-muted-foreground font-medium text-xs leading-relaxed space-y-3 pt-1">
              <p>
                You are switching the billing WhatsApp dispatch method from{" "}
                <span className="font-bold text-foreground">
                  {settings.whatsapp_provider === 'personal' ? 'Personal WhatsApp' : 'ESCROW API'}
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
    </div>
  );

};

export default SettingsPage;

