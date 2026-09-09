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
  Landmark
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
  invoice_template: string;
  hide_company_details: boolean;
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
    invoice_template: 'corporate',
    hide_company_details: false
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

  const [bankOptions, setBankOptions] = useState<string[]>([]);
  const { user, signOut, isTrialActive, trialDaysRemaining, isStaff, companyProfile, staffRole, staffPermissions, effectiveUserId, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { setCurrencySymbol } = useCurrency();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [personalName, setPersonalName] = useState('');
  const [personalPhone, setPersonalPhone] = useState('');
  const [personalSaving, setPersonalSaving] = useState(false);

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
      upi_qr_url: profile.upi_qr_url
    }
  }), [profile, user, settings.default_currency]);

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

      setProfile({ ...profile, logo_url: data.publicUrl });

      toast({
        title: "Success",
        description: "Logo uploaded successfully."
      });

      // Invalidate queries to update Dashboard
      void queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
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
      const { error: saveError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          signature_url: signatureUrl
        }, { onConflict: 'user_id' });

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
      if (!targetUserId) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

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

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user?.id,
          ...profileToSave,
          mobile: profile.phone || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      await refreshProfile();

      toast({
        title: "Success",
        description: profile.settings_locked
          ? "Business settings saved and locked successfully. Unlock to make further changes."
          : "Business settings saved successfully."
      });

      // Invalidate queries to update Dashboard and other components immediately
      void queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
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

  const handleToggleLock = () => {
    if (isStaff) return;
    setProfile({ ...profile, settings_locked: !profile.settings_locked });
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
          invoice_template: sData.invoice_template || 'corporate',
          hide_company_details: sData.hide_company_details ?? false
        });
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
    { showToast = true } = {}
  ): Promise<boolean> => {
    const payload = overrideSettings || settings;
    setSettingsSaving(true);
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
        const currencyValue = payload.default_currency.trim();
        const symbolMap: Record<string, string> = {
          'INR': '₹',
          'USD': '$',
          'EUR': '€',
          'GBP': '£',
          'DOLLAR': '$',
          'RUPEE': '₹',
          'EURO': '€',
          'POUND': '£'
        };
        const mappedSymbol = symbolMap[currencyValue.toUpperCase()] || currencyValue;
        setCurrencySymbol(mappedSymbol);
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
      setSettingsSaving(false);
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
          <div className="w-full overflow-x-auto no-scrollbar flex">
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
        </div>
        <div className="w-full max-w-7xl mx-auto space-y-6 transition-all duration-300">
          <TabsContent value="membership" className="m-0 space-y-6">
            {/* 1. TOP MEMBERSHIP STATUS HERO */}
            <Card className="rounded-xl border border-border shadow-sm bg-card overflow-hidden" id="membership">
              <div className="p-4 md:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md shrink-0">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black tracking-tight text-foreground">Membership & Subscription</h3>
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-black uppercase tracking-wider px-2 py-0.5",
                        profile.subscription_expires_at 
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          : isTrialActive 
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                            : "bg-muted text-muted-foreground"
                      )}>
                        {profile.subscription_expires_at ? 'PRO ACCOUNT' : isTrialActive ? '7-DAY TRIAL' : 'FREE TIER'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      {isStaff
                        ? 'Staff account operating under authorized organization license'
                        : profile.subscription_expires_at
                          ? `Valid until ${safelyToLocaleDate(profile.subscription_expires_at)} • ${countdownText}`
                          : isTrialActive
                            ? `${trialDaysRemaining} days remaining in your unrestricted Pro trial`
                            : 'Upgrade to remove limits and unlock all 10 invoice templates'}
                    </p>
                  </div>
                </div>

                {/* Status indicator / Expiry badge */}
                {!isStaff && profile.subscription_expires_at && (
                  <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3.5 py-1.5 rounded-lg text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-wider leading-none">Subscription Active</p>
                      <p className="text-[11px] font-bold mt-0.5">{countdownText}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Staff inheritance banner */}
              {isStaff && (
                <div className="m-4 md:m-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3.5 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                  <ShieldCheck className="w-6 h-6 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-bold text-sm">Enterprise Multi-Seat License</p>
                    <p className="text-xs opacity-90 mt-0.5">
                      Your staff seat inherits unlimited Pro invoicing, automated e-way billing, and custom templates from <strong>{companyProfile?.company_name || profile.company_name || 'Your Company'}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Trial active notice banner */}
              {!isStaff && isTrialActive && (
                <div className="m-4 md:m-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/10 border border-amber-300 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-950 dark:text-amber-200">You are enjoying full Pro features during your 7-Day Trial</p>
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        {trialDaysRemaining} days remaining. Lock in your introductory pricing now to prevent any workflow interruption.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      const el = document.getElementById('pricing-cards');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="shrink-0 h-8 font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white uppercase tracking-wider"
                  >
                    View Upgrade Plans
                  </Button>
                </div>
              )}

              {/* 2A. ACTIVE PRO SUBSCRIBER DASHBOARD (When subscription is already active) */}
              {isProActive && (
                <div className="p-4 md:p-8 space-y-6">
                  {/* Subscription Spec Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border border-border bg-card space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Plan</span>
                        <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] font-bold uppercase py-0.5">
                          Active Pro
                        </Badge>
                      </div>
                      <p className="text-xl font-black text-foreground">Pro Unlimited</p>
                      <p className="text-[11px] text-muted-foreground">All features & templates unlocked</p>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-card space-y-1.5 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Valid Until</span>
                      <p className="text-xl font-black text-foreground">{safelyToLocaleDate(profile.subscription_expires_at)}</p>
                      <p className="text-[11px] text-emerald-600 font-semibold">{countdownText}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-card space-y-1.5 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Billing Status</span>
                      <p className="text-xl font-black text-foreground">In Good Standing</p>
                      <p className="text-[11px] text-muted-foreground">Verified via Razorpay Gateway</p>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-card space-y-1.5 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">GST Invoicing</span>
                      <p className="text-xl font-black text-foreground">100% ITC Claimed</p>
                      <p className="text-[11px] text-muted-foreground">Tax invoice generated</p>
                    </div>
                  </div>

                  {/* Active Privileges & Entitlements Grid */}
                  <div className="p-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-primary/5 to-transparent space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Active Privileges & Features</h4>
                        <p className="text-xs text-muted-foreground">Included and operational in your current Pro subscription</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs">
                      {[
                        { title: 'Unlimited GST Invoices', desc: 'No limits on bill generation' },
                        { title: 'All 10 Invoice Templates', desc: 'Tally 46, Corporate, UPI, Export, POS' },
                        { title: 'Dynamic UPI QR Codes', desc: '0% fee instant scan settlements' },
                        { title: '1-Click WhatsApp Invoicing', desc: 'Direct PDF dispatch to clients' },
                        { title: 'Staff & Roles Delegation', desc: 'Custom permission control' },
                        { title: 'Financial Ledger Export', desc: '1-click offline Excel reports' },
                        { title: 'Data Sovereignty', desc: '256-bit encrypted secure cloud' },
                        { title: 'VIP Priority Support', desc: 'Dedicated customer assistance' }
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

                  {/* Advance Extension / Early Renewal Box */}
                  <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-foreground">Extend or Renew Early</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Your active plan has <strong className="text-foreground">{countdownText}</strong> remaining. Any renewal adds time seamlessly to your existing expiry date.
                        </p>
                      </div>
                      <Button
                        variant={showExtendOptions ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setShowExtendOptions(!showExtendOptions)}
                        className="h-9 px-4 font-bold text-xs uppercase tracking-wider shrink-0 gap-1.5"
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5", showExtendOptions && "rotate-180 transition-transform")} />
                        {showExtendOptions ? "Hide Renewal Options" : "Extend Validity / Add More Time"}
                      </Button>
                    </div>

                    {showExtendOptions && (
                      <div className="pt-4 border-t border-border space-y-4 animate-in fade-in-50 duration-200">
                        <p className="text-xs font-semibold text-muted-foreground text-center">
                          Choose an extension term to append to your active subscription:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {/* MONTHLY EXTENSION */}
                          <div
                            onClick={() => setSelectedPlan('monthly')}
                            className={cn(
                              "rounded-2xl border p-5 flex flex-col justify-between transition-all cursor-pointer bg-card hover:shadow-md",
                              selectedPlan === 'monthly' ? "border-primary ring-2 ring-primary/20 bg-primary/[0.02]" : "border-border"
                            )}
                          >
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">+30 Days Extension</span>
                                <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", selectedPlan === 'monthly' ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground")}>
                                  {selectedPlan === 'monthly' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                              </div>
                              <div>
                                <span className="text-2xl font-black text-foreground">₹349</span>
                                <span className="text-xs text-muted-foreground font-semibold"> / 1 month</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Adds 30 additional days to your current expiry date.</p>
                            </div>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPlan('monthly');
                                handleUpgrade();
                              }}
                              disabled={settingsSaving}
                              variant={selectedPlan === 'monthly' ? "default" : "outline"}
                              className="w-full mt-4 h-10 font-bold text-xs uppercase tracking-wider"
                            >
                              {settingsSaving && selectedPlan === 'monthly' ? 'Preparing Checkout...' : 'Extend 1 Month (₹349)'}
                            </Button>
                          </div>

                          {/* YEARLY EXTENSION */}
                          <div
                            onClick={() => setSelectedPlan('yearly')}
                            className={cn(
                              "rounded-2xl border p-5 flex flex-col justify-between transition-all cursor-pointer bg-card hover:shadow-md relative",
                              selectedPlan === 'yearly' ? "border-primary ring-2 ring-primary/30 bg-primary/[0.03]" : "border-border"
                            )}
                          >
                            <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase tracking-wider py-0.5 px-2.5 rounded-full shadow-xs flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              2 Months Free (Save 17%)
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">+365 Days Extension</span>
                                <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", selectedPlan === 'yearly' ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground")}>
                                  {selectedPlan === 'yearly' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                              </div>
                              <div>
                                <span className="text-2xl font-black text-foreground">₹3,499</span>
                                <span className="text-xs text-muted-foreground font-semibold"> / 1 year</span>
                                <span className="ml-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">₹291/mo</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Adds 365 additional days to your current expiry date.</p>
                            </div>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPlan('yearly');
                                handleUpgrade();
                              }}
                              disabled={settingsSaving}
                              className="w-full mt-4 h-10 font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                              {settingsSaving && selectedPlan === 'yearly' ? 'Preparing Checkout...' : 'Extend 1 Year (₹3,499) • Save 17%'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2B. NON-ACTIVE / TRIAL SUBSCRIBER PRICING TIERS (When not subscribed) */}
              {!isStaff && !isProActive && (
                <div className="p-4 md:p-8 space-y-6" id="pricing-cards">
                  <div className="text-center max-w-xl mx-auto space-y-1">
                    <h4 className="text-lg font-black tracking-tight text-foreground uppercase">Choose Your Growth Plan</h4>
                    <p className="text-xs text-muted-foreground">
                      Simple, transparent pricing. GST tax invoice provided automatically for 100% Input Tax Credit.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    {/* MONTHLY PLAN CARD */}
                    <div
                      onClick={() => setSelectedPlan('monthly')}
                      className={cn(
                        "relative rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 cursor-pointer bg-card hover:shadow-lg",
                        selectedPlan === 'monthly'
                          ? "border-primary ring-2 ring-primary/20 shadow-md bg-primary/[0.02]"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Flexible Billing</span>
                            <h5 className="text-xl font-black text-foreground mt-0.5">Monthly Plan</h5>
                          </div>
                          <div className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                            selectedPlan === 'monthly' ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                          )}>
                            {selectedPlan === 'monthly' && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="pt-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-foreground">₹349</span>
                            <span className="text-xs text-muted-foreground font-semibold">/ month</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Billed monthly. Pause, renew or cancel anytime with one click.
                          </p>
                        </div>

                        <div className="pt-2 border-t border-border/60 space-y-2.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">What's Included:</p>
                          {[
                            'Unlimited GST Invoices & Bills',
                            'All 10 GST & Export Invoice Templates',
                            'Dynamic UPI QR Codes on Bills (PhonePe, GPay)',
                            '1-Click WhatsApp & Email Invoicing',
                            'Automated Overdue Payment Reminders',
                            'Staff Accounts & Custom Permissions',
                            'Instant Excel Financial Reports & Exports'
                          ].map((feat, i) => (
                            <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
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
                          {settingsSaving && selectedPlan === 'monthly' ? 'Preparing Checkout...' : 'Upgrade Monthly (₹349)'}
                        </Button>
                      </div>
                    </div>

                    {/* YEARLY PLAN CARD (FEATURED) */}
                    <div
                      onClick={() => setSelectedPlan('yearly')}
                      className={cn(
                        "relative rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 cursor-pointer bg-card hover:shadow-xl",
                        selectedPlan === 'yearly'
                          ? "border-primary ring-2 ring-primary/40 shadow-xl bg-gradient-to-b from-primary/[0.04] to-card"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {/* Popular ribbon */}
                      <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9.5px] font-black uppercase tracking-wider py-1 px-3 rounded-full shadow-md flex items-center gap-1.5 z-10">
                        <Sparkles className="w-3 h-3 fill-current" />
                        Best Value • Save 17% (2 Months Free)
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Annual Commitment</span>
                            <h5 className="text-xl font-black text-foreground mt-0.5">Yearly Plan</h5>
                          </div>
                          <div className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                            selectedPlan === 'yearly' ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                          )}>
                            {selectedPlan === 'yearly' && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="pt-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-foreground">₹3,499</span>
                            <span className="text-xs text-muted-foreground font-semibold">/ year</span>
                            <span className="ml-2 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              ₹291/mo effective
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Billed annually. Includes 365 days of full unlimited access & VIP support.
                          </p>
                        </div>

                        <div className="pt-2 border-t border-border/60 space-y-2.5">
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
                            <div key={i} className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-200 font-medium">
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
                          {settingsSaving && selectedPlan === 'yearly' ? 'Preparing Checkout...' : 'Upgrade Yearly (₹3,499) • Save 17%'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. VALUE HIGHLIGHTS 4-PILLAR GRID */}
              <div className="p-4 md:p-8 border-t border-border bg-muted/10 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground text-center">
                  Why Leading Businesses Choose Escrow Bill Pro
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
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

              {/* 4. TRUST, ITC & GUARANTEE RIBBON */}
              <div className="p-4 md:p-6 border-t border-border bg-background flex flex-wrap items-center justify-around gap-4 text-center">
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

              {/* 5. MEMBERSHIP FAQ */}
              <div className="p-4 md:p-8 border-t border-border bg-muted/15 space-y-4">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Frequently Asked Questions</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                    <p className="font-bold text-xs text-foreground">Will I get a GST tax invoice for this payment?</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Yes! Immediately upon payment, an official GST tax invoice with your company name and GSTIN is automatically generated so you can claim full Input Tax Credit (ITC).
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                    <p className="font-bold text-xs text-foreground">Can I upgrade from Monthly to Yearly later?</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Absolutely. You can switch to the Yearly plan anytime. Any remaining days on your current active monthly cycle will be adjusted proportionally.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                    <p className="font-bold text-xs text-foreground">What happens when my subscription period ends?</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Your existing invoices, clients, products, and receipts remain 100% safe and accessible. You can renew at any time without losing any historical data.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                    <p className="font-bold text-xs text-foreground">Which payment methods are supported?</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      We support all major payment modes including UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, MasterCard, RuPay), and 50+ NetBanking banks.
                    </p>
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
                          className="h-9 rounded-md font-bold text-xs"
                        >
                          {profile.settings_locked ? <Lock className="w-3.5 h-3.5 mr-1.5" /> : <Shield className="w-3.5 h-3.5 mr-1.5" />}
                          {profile.settings_locked ? 'Unlock' : 'Lock Info'}
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
                            <Input
                              id="gstin"
                              value={profile.gstin || ''}
                              onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                              placeholder="22AAAAA0000A1Z5"
                              disabled={profile.settings_locked}
                              className={cn("bg-background uppercase h-10 font-mono tracking-wider", profile.settings_locked && "bg-muted")}
                            />
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
                              onClick={() => setProfile({ ...profile, logo_url: '' })}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all"
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

                    {/* UPI QR Code */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                          <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                          UPI Payment QR
                        </Label>
                        <span className="text-[10px] text-emerald-600 font-semibold">Instant Scan</span>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/20 border border-dashed border-emerald-500/30 text-center space-y-2.5">
                        {profile.upi_qr_url ? (
                          <div className="relative group mx-auto w-20 h-20">
                            <img src={profile.upi_qr_url} alt="UPI QR" className="w-full h-full object-contain bg-white rounded-lg shadow-xs border p-1" />
                            {!isStaff && (
                              <button
                                onClick={() => {
                                  setProfile({ ...profile, upi_qr_url: '' });
                                }}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-600">
                            <QrCode className="w-6 h-6" />
                          </div>
                        )}
                        <label className="block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file || !user) return;
                              if (file.size > 2 * 1024 * 1024) {
                                toast({ variant: 'destructive', title: 'Error', description: 'File size must be less than 2MB.' });
                                return;
                              }
                              try {
                                const fileExt = file.name.split('.').pop();
                                const fileName = `${user.id}/upi_qr.${fileExt}`;
                                const { error: uploadError } = await supabase.storage
                                  .from('company-assets')
                                  .upload(fileName, file, { upsert: true });
                                if (uploadError) throw uploadError;
                                const { data } = supabase.storage.from('company-assets').getPublicUrl(fileName);
                                const qrUrl = data.publicUrl;
                                setProfile({ ...profile, upi_qr_url: qrUrl });
                                await supabase.from('profiles').upsert({ user_id: user.id, upi_qr_url: qrUrl }, { onConflict: 'user_id' });
                                toast({ title: 'UPI QR Uploaded', description: 'Your UPI QR code has been saved.' });
                                void queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
                              } catch (err) {
                                toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload UPI QR code.' });
                              }
                            }}
                            disabled={profile.settings_locked || isStaff}
                            className="block w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-emerald-600 file:text-white hover:file:opacity-90 cursor-pointer"
                          />
                        </label>
                        <p className="text-[10px] text-muted-foreground">Used on Modern UPI template</p>
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
            {/* Header Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-5 rounded-xl border border-border bg-card shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-xs">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">Preferences & Security</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    System defaults, automated alert triggers, authentication credentials, and data sovereignty
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleSettingsSave()}
                disabled={settingsSaving}
                size="sm"
                className="h-9 px-4 rounded-md font-bold text-xs uppercase tracking-wider gap-1.5 shadow-sm self-start sm:self-auto"
              >
                <Save className="w-4 h-4" />
                {settingsSaving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN (6 COLS): SYSTEM DEFAULTS & NOTIFICATIONS */}
              <div className="lg:col-span-6 space-y-6">
                {/* 1. Regional & Display Defaults */}
                <Card className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
                  <div className="p-4 border-b flex items-center gap-2.5 bg-muted/10">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">System & Regional Defaults</h4>
                      <p className="text-[11px] text-muted-foreground">Default billing currency, credit terms, and interface appearance</p>
                    </div>
                  </div>
                  <div className="p-4 md:p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="defaultCurrency" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Default Currency
                        </Label>
                        <Select
                          value={settings.default_currency}
                          onValueChange={(value) => {
                            const next = { ...settings, default_currency: value };
                            setSettings(next);
                            void handleSettingsSave(next, { showToast: false });
                          }}
                        >
                          <SelectTrigger id="defaultCurrency" className="h-10 rounded-md bg-background border-border/70 font-medium text-xs">
                            <SelectValue placeholder="Select Currency" />
                          </SelectTrigger>
                          <SelectContent className="rounded-md border-border/50">
                            <SelectItem value="INR">INR (₹) - Indian Rupee</SelectItem>
                            <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                            <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="defaultTerms" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Payment Terms
                        </Label>
                        <Input
                          id="defaultTerms"
                          value={settings.default_payment_terms}
                          onChange={(e) => setSettings({ ...settings, default_payment_terms: e.target.value })}
                          placeholder="e.g. Net 30, Due on Receipt"
                          className="h-10 rounded-md bg-background border-border/70 font-medium text-xs"
                        />
                      </div>
                    </div>

                    {/* Theme Mode Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-bold text-foreground">Theme Mode</h5>
                        <p className="text-[11px] text-muted-foreground">Toggle between Light and Dark interface appearance</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="h-9 px-4 rounded-md font-bold text-xs uppercase tracking-wider gap-2 border-border/70"
                      >
                        {theme === 'dark' ? (
                          <>
                            <Moon className="w-4 h-4 text-indigo-400" />
                            Dark Mode
                          </>
                        ) : (
                          <>
                            <Sun className="w-4 h-4 text-amber-500" />
                            Light Mode
                          </>
                        )}
                      </Button>
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
              </div>
            </div>
          </TabsContent>

          {/* DEDICATED INVOICE TEMPLATES TAB */}
          <TabsContent value="templates" className="m-0 space-y-5 outline-none">
            {/* Header Studio Card */}
            <Card className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-transparent">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-foreground tracking-tight">Invoice Templates</h3>
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
                      Choose from 10 GST compliant formats designed for Indian businesses, agencies, retail, and international trade.
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

              {/* Template Cards Grid */}
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
                          {profile.logo_url ? "✓ Logo" : "⚠️ No logo"} • {profile.signature_url ? "✓ Signature" : "⚠️ No signature"} • {profile.upi_qr_url ? "✓ UPI QR" : "⚠️ No QR"}
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
                   'Template Preview'}
                </DialogTitle>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Full Document Preview • Rendered with Sample Data & Company Details
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" onClick={() => setPreviewTemplate(null)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100/50 dark:bg-slate-950/50 flex justify-center">
            <div className="w-full max-w-[820px]">
              <ResponsiveInvoiceWrapper maxWidth={previewTemplate === 'thermal' ? 380 : 800}>
                <div className="shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 rounded-sm mb-6">
                  {previewTemplate && (
                    <InvoiceTemplate
                      template={previewTemplate}
                      invoice={previewTemplate === 'export' ? { ...sampleInvoiceData.invoice, currency: 'USD', tax_amount: 0, total_amount: 12000 } : sampleInvoiceData.invoice}
                      client={previewTemplate === 'export' ? { ...sampleInvoiceData.client, country: 'United States' } : sampleInvoiceData.client}
                      items={sampleInvoiceData.items}
                      company={sampleInvoiceData.company}
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
    </div>
  );
};

export default SettingsPage;

