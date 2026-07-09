import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Lock,
  Mail,
  FileText,
  CheckCircle2,
  Check,
  Download,
  ShieldCheck,
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
  CreditCard as PaymentIcon
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { safelyToLocaleDate } from "@/utils/dateUtils";
import { InvoiceTemplate } from "@/components/InvoiceTemplate";
import { ResponsiveInvoiceWrapper } from "@/components/ResponsiveInvoiceWrapper";

interface Profile {
  company_name: string;
  business_address: string;
  gstin: string;
  phone: string;
  mobile?: string;
  website: string;
  logo_url: string;
  signature_url: string;
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
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState<Profile>({
    company_name: '',
    business_address: '',
    gstin: '',
    phone: '',
    website: '',
    logo_url: '',
    signature_url: '',
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
      setActiveSection(tab);
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

  const countdownText = getCountdownText(profile.subscription_expires_at || null);
  const [bankSearchOpen, setBankSearchOpen] = useState(false);
  const [bankSelection, setBankSelection] = useState<string>('');
  const [previewTemplate, setPreviewTemplate] = useState<'professional' | 'elegant' | 'minimal' | 'modern' | 'corporate' | null>(null);

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
  const { user, signOut, isTrialActive, trialDaysRemaining } = useAuth();
  const { theme, setTheme } = useTheme();
  const { setCurrencySymbol } = useCurrency();
  const { toast } = useToast();
  const queryClient = useQueryClient();



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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
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
  }, [user, toast]);

  const handleProfileSave = async () => {
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
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user?.id,
          ...profile,
          mobile: profile.phone
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Success",
        description: profile.settings_locked
          ? "Profile settings saved and locked successfully. Unlock to make further changes."
          : "Profile settings saved successfully."
      });

      // Invalidate queries to update Dashboard and other components immediately
      void queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save profile settings."
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleToggleLock = () => {
    setProfile({ ...profile, settings_locked: !profile.settings_locked });
  };

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
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
  }, [user]);

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

      <Tabs defaultValue="profile" className="w-full" value={activeSection} onValueChange={setActiveSection}>
        <div className="bg-background border-b -mx-4 px-4 py-2 mb-6 sticky top-0 z-10 shadow-sm">
          <div className="w-full overflow-x-auto no-scrollbar flex">
            <TabsList className="inline-flex min-w-max h-auto p-1 bg-muted rounded-md gap-1 mx-auto md:mx-0">
              <TabsTrigger value="profile" className="flex items-center justify-center gap-2 py-2 px-4 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                <User className="w-4 h-4 shrink-0" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="membership" className="flex items-center justify-center gap-2 py-2 px-4 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Membership</span>
              </TabsTrigger>
              <TabsTrigger value="business" className="flex items-center justify-center gap-2 py-2 px-4 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Business</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center justify-center gap-2 py-2 px-4 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                <Bell className="w-4 h-4 shrink-0" />
                <span>Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center justify-center gap-2 py-2 px-4 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                <Shield className="w-4 h-4 shrink-0" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center justify-center gap-2 py-2 px-4 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                <Palette className="w-4 h-4 shrink-0" />
                <span>Appearance</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="space-y-6 max-w-4xl mx-auto">
          <TabsContent value="profile" className="m-0 space-y-6">

            {/* Profile Section */}
            <Card className="rounded-md border border-border shadow-sm bg-card" id="profile">
              <div className="p-4 md:p-8 border-b flex items-center gap-3 bg-muted/10">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Profile Information</h3>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Manage your personal account details</p>
                </div>
              </div>

              <div className="p-4 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1">Email Address</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed manually
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user_id" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1">User ID</Label>
                    <Input
                      id="user_id"
                      value={user?.id || ''}
                      disabled
                      className="bg-muted/50"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="membership" className="m-0 space-y-6">
            <Card className="rounded-md border border-border shadow-sm bg-card" id="membership">
              <div className="p-4 md:p-8 border-b flex items-center gap-3 bg-muted/10">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Membership & Billing</h3>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Manage your subscription and plans</p>
                </div>
              </div>

              <div className="p-4 md:p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1">Current Protocol</Label>
                      <div className="mt-1 p-4 rounded-lg bg-muted/30 border border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            profile.subscription_expires_at ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                          )}>
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">
                              {profile.subscription_expires_at ? 'Pro Account' : 'Free Tier'}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                              {isTrialActive ? 'Trial Period' : (profile.subscription_expires_at ? 'Active Subscription' : 'Limited Access')}
                            </p>
                          </div>
                        </div>
                        {isTrialActive && (
                          <div className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-700 border border-amber-200 uppercase">
                            Trial: {trialDaysRemaining}d left
                          </div>
                        )}
                      </div>
                    </div>

                    {profile.subscription_expires_at && (
                      <div className="p-4 rounded-lg border border-border bg-muted/10 space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs font-medium">Valid until: {safelyToLocaleDate(profile.subscription_expires_at)}</span>
                        </div>
                        {countdownText && (
                          <p className="text-[10px] font-bold text-primary uppercase tracking-widest pl-6">
                            Ends in: {countdownText}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1">Change / Extend Plan</Label>
                    <div className="p-4 rounded-lg border border-border bg-background space-y-4">
                      <div className="flex bg-muted/50 p-1 rounded-md w-full">
                        <button
                          onClick={() => setSelectedPlan('monthly')}
                          className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-md transition-all",
                            selectedPlan === 'monthly' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Monthly (Rs 349)
                        </button>
                        <button
                          onClick={() => setSelectedPlan('yearly')}
                          className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-md transition-all",
                            selectedPlan === 'yearly' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Yearly (Rs 3,499)
                        </button>
                      </div>
                      <Button
                        onClick={handleUpgrade}
                        disabled={settingsSaving}
                        className="w-full h-11 font-bold rounded-md"
                      >
                        {profile.subscription_expires_at ? (settingsSaving ? 'Processing...' : 'Extend Subscription') : (settingsSaving ? 'Processing...' : 'Activate Pro Plan')}
                      </Button>
                      <p className="text-[10px] text-center text-muted-foreground font-medium">
                        Instant activation after successful payment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="business" className="m-0 space-y-6">
            {/* Business Information */}
            <Card className="rounded-md border border-border shadow-sm bg-card" id="business">
              <div className="p-4 md:p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Business Identity</h3>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Company info for invoices & e-way bills</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleToggleLock}
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-md"
                  >
                    {profile.settings_locked ? <Lock className="w-3.5 h-3.5 mr-2" /> : <Shield className="w-3.5 h-3.5 mr-2" />}
                    {profile.settings_locked ? 'Unlock' : 'Lock Info'}
                  </Button>
                  <Button
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    size="sm"
                    className="h-9 rounded-md"
                  >
                    {profileSaving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </div>
              </div>

              <div className="p-4 md:p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1">Company Name</Label>
                    <Input
                      id="company_name"
                      value={profile.company_name || ''}
                      onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                      placeholder="Your Company Name"
                      disabled={profile.settings_locked}
                      className={cn("bg-background", profile.settings_locked && "bg-muted")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstin" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1">GSTIN</Label>
                    <Input
                      id="gstin"
                      value={profile.gstin || ''}
                      onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                      placeholder="22AAAAA0000A1Z5"
                      disabled={profile.settings_locked}
                      className={cn("bg-background uppercase", profile.settings_locked && "bg-muted")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                      disabled={profile.settings_locked}
                      className={cn("bg-background", profile.settings_locked && "bg-muted")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1">Website</Label>
                    <Input
                      id="website"
                      value={profile.website || ''}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="https://yourcompany.com"
                      disabled={profile.settings_locked}
                      className={`h-12 rounded-md border-border/50 font-medium ${profile.settings_locked ? "bg-muted opacity-60" : "bg-muted/30 focus:bg-background"}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_address" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1">Business Address</Label>
                  <Textarea
                    id="business_address"
                    value={profile.business_address || ''}
                    onChange={(e) => setProfile({ ...profile, business_address: e.target.value })}
                    placeholder="Complete business address"
                    className={`rounded-md border-border/50 font-medium min-h-[100px] ${profile.settings_locked ? "bg-muted opacity-60" : "bg-muted/30 focus:bg-background"}`}
                    disabled={profile.settings_locked}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1">City</Label>
                    <Input
                      id="city"
                      value={profile.city || ''}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      disabled={profile.settings_locked}
                      className={`h-12 rounded-md border-border/50 font-bold ${profile.settings_locked ? "bg-muted opacity-60" : "bg-muted/30 focus:bg-background"}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1">State</Label>
                    <Input
                      id="state"
                      value={profile.state || ''}
                      onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                      disabled={profile.settings_locked}
                      className={`h-12 rounded-md border-border/50 font-medium ${profile.settings_locked ? "bg-muted opacity-60" : "bg-muted/30 focus:bg-background"}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1">Pincode</Label>
                    <Input
                      id="pincode"
                      value={profile.pincode || ''}
                      onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                      disabled={profile.settings_locked}
                      className={`h-12 rounded-md border-border/50 font-medium ${profile.settings_locked ? "bg-muted opacity-60" : "bg-muted/30 focus:bg-background"}`}
                    />
                  </div>
                </div>
                <div className="pt-4 space-y-4">
                  <h4 className="text-sm font-semibold">Bank Account Details</h4>

                  <div className="bg-muted/20 p-4 md:p-6 rounded-md border border-border grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="bank_name" className="text-sm font-medium">Bank Name</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 w-full justify-between rounded-md bg-background border-border/50 font-medium px-4"
                        onClick={() => setBankSearchOpen(true)}
                        disabled={profile.settings_locked}
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
                                  className="rounded-lg py-3 cursor-pointer"
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
                                className="rounded-lg py-3 cursor-pointer font-bold text-indigo-600"
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
                          disabled={profile.settings_locked}
                          className="h-12 rounded-md bg-background border-border/50 font-medium mt-2"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_holder_name" className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Account Holder Name</Label>
                      <Input
                        id="account_holder_name"
                        value={profile.account_holder_name || ''}
                        onChange={(e) => setProfile({ ...profile, account_holder_name: e.target.value })}
                        placeholder="Owner's Name on Account"
                        disabled={profile.settings_locked}
                        className="h-12 rounded-md bg-background border-border/50 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_number" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1">Account Number</Label>
                      <Input
                        id="account_number"
                        inputMode="numeric"
                        value={profile.account_number || ''}
                        onChange={(e) => setProfile({ ...profile, account_number: e.target.value.replace(/\D/g, '') })}
                        disabled={profile.settings_locked}
                        className="h-12 rounded-md bg-background border-border/50 font-bold tracking-widest"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ifsc_code" className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">IFSC Code</Label>
                      <Input
                        id="ifsc_code"
                        value={profile.ifsc_code || ''}
                        onChange={(e) => setProfile({ ...profile, ifsc_code: e.target.value.toUpperCase() })}
                        disabled={profile.settings_locked}
                        className="h-12 rounded-md bg-background border-border/50 font-bold tracking-widest uppercase"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="account_type" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1">Account Type</Label>
                      <Select
                        value={profile.account_type || ''}
                        onValueChange={(value) => setProfile({ ...profile, account_type: value })}
                        disabled={profile.settings_locked}
                      >
                        <SelectTrigger id="account_type" className="h-12 rounded-md bg-background border-border/50 font-medium">
                          <SelectValue placeholder="Current / Savings / Other" />
                        </SelectTrigger>
                        <SelectContent className="rounded-md border-border/50">
                          <SelectItem value="savings" className="rounded-lg py-2.5">Savings Account</SelectItem>
                          <SelectItem value="current" className="rounded-lg py-2.5">Current Account</SelectItem>
                          <SelectItem value="overdraft" className="rounded-lg py-2.5">Overdraft Account</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Company Branding</Label>
                    <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-border text-center space-y-4">
                      {profile.logo_url ? (
                        <div className="relative group mx-auto w-32 h-32">
                          <img src={profile.logo_url} alt="Logo" className="w-full h-full object-contain bg-white rounded-md shadow-sm border" />
                          <button
                            onClick={() => setProfile({ ...profile, logo_url: '' })}
                            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                          >
                            <Download className="w-4 h-4 rotate-180" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-md bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900">
                          <Building2 className="w-8 h-8 text-indigo-400" />
                        </div>
                      )}
                      <label className="block">
                        <span className="sr-only">Choose Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={profile.settings_locked || logoUploading}
                          className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:uppercase file:tracking-widest file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-all cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1">Authorized Signature</Label>
                    <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-border/60 text-center space-y-4">
                      {profile.signature_url ? (
                        <div className="relative group mx-auto w-40 h-24">
                          <img src={profile.signature_url} alt="Sign" className="w-full h-full object-contain bg-white rounded-md shadow-sm border" />
                          <button
                            onClick={() => setProfile({ ...profile, signature_url: '' })}
                            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                          >
                            <Download className="w-4 h-4 rotate-180" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-16 rounded-md bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900">
                          <Palette className="w-8 h-8 text-indigo-400" />
                        </div>
                      )}
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureUpload}
                          disabled={profile.settings_locked}
                          className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:uppercase file:tracking-widest file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-all cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Privacy Control */}
                <div className="flex items-center justify-between p-5 rounded-lg bg-amber-50/30 dark:bg-amber-950/5 border border-amber-100 dark:border-amber-900/30 group transition-all">
                  <div className="space-y-0.5">
                    <Label className="font-bold text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2">
                      Minimal Company Display
                    </Label>
                    <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 font-semibold uppercase tracking-widest">Hide full address/contact on invoices</p>
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
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="m-0 space-y-6 outline-none">
            <Card className="rounded-md border border-border shadow-sm bg-card" id="notifications">
              <div className="p-4 md:p-8 border-b flex items-center gap-3 bg-muted/10">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Notifications</h3>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Configure your alert preferences</p>
                </div>
              </div>

              <div className="p-4 md:p-8 space-y-4">
                {[
                  {
                    id: 'email_notifications',
                    title: 'System Activity',
                    desc: 'Account updates & system logs',
                    icon: <Mail className="w-4 h-4" />
                  },
                  {
                    id: 'invoice_reminders',
                    title: 'Invoice Lifecycle',
                    desc: 'Auto-reminders for overdue bills',
                    icon: <FileText className="w-4 h-4" />
                  },
                  {
                    id: 'payment_alerts',
                    title: 'Revenue Alerts',
                    desc: 'Native alerts for payment success',
                    icon: <CheckCircle2 className="w-4 h-4" />
                  }
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-md border border-border bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="text-muted-foreground">{item.icon}</div>
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">{item.title}</Label>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
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
          </TabsContent>

          <TabsContent value="security" className="m-0 space-y-6 outline-none">
            <Card className="rounded-md border border-border shadow-sm bg-card" id="security">
              <div className="p-4 md:p-8 border-b flex items-center gap-3 bg-muted/10">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Security</h3>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Protect your account and data</p>
                </div>
              </div>

              <div className="p-4 md:p-6 md:p-8 space-y-8">
                {/* User Authentication */}
                <div className="flex items-center justify-between p-4 rounded-md border border-border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">User Authentication</Label>
                      <p className="text-xs text-muted-foreground">Update your account access credentials</p>
                    </div>
                  </div>
                  <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 rounded-md font-bold text-[10px] uppercase tracking-widest px-4 border-slate-300 dark:border-slate-600">
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-md border border-border bg-card">
                      <div className="bg-primary/5 p-4 md:p-8 text-foreground border-b border-border/50">
                        <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 mb-4 shadow-sm">
                          <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <DialogTitle className="text-2xl font-bold uppercase tracking-tight">Access Control</DialogTitle>
                        <DialogDescription className="text-muted-foreground text-[10px] font-semibold uppercase tracking-widest mt-1">
                          Protect your account with a high-entropy password
                        </DialogDescription>
                      </div>
                      <form onSubmit={handlePasswordChange} className="p-4 md:p-8 space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Current Password</Label>
                          <Input
                            id="current-password"
                            type="password"
                            autoComplete="current-password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className="h-12 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary/20 transition-all font-medium shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                            className="h-12 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary/20 transition-all font-medium shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm New Password</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            className="h-12 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary/20 transition-all font-medium shadow-sm"
                          />
                        </div>
                        <DialogFooter className="pt-4">
                          <Button type="submit" disabled={passwordChanging} className="w-full h-12 rounded-md bg-primary hover:opacity-90 text-primary-foreground font-semibold uppercase tracking-widest transition-all">
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

                {/* Data Sovereignty */}
                <div className="flex items-center justify-between p-4 rounded-md border border-border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">
                      <Download className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Data Sovereignty</Label>
                      <p className="text-xs text-muted-foreground">Export all records for offline auditing</p>
                    </div>
                  </div>
                  <Button onClick={handleExportData} variant="outline" size="sm" className="h-9 rounded-md font-bold text-[10px] uppercase tracking-widest px-4 border-slate-300 dark:border-slate-600">
                    Export Excel
                  </Button>
                </div>

                {/* Session Persistence */}
                <div className="flex items-center justify-between p-4 rounded-md border border-border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Session Persistence</Label>
                      <p className="text-xs text-muted-foreground">Auto-save draft progress locally</p>
                    </div>
                  </div>
                  <div className="flex bg-background p-1 rounded-md border border-border">
                    <button
                      onClick={() => {
                        const next = { ...settings, auto_save_enabled: false };
                        setSettings(next);
                        void handleSettingsSave(next, { showToast: false });
                      }}
                      className={cn(
                        "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                        !settings.auto_save_enabled ? "bg-muted text-foreground shadow-sm border border-slate-200" : "text-muted-foreground hover:bg-muted"
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
                        "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                        settings.auto_save_enabled ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      On
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="m-0 space-y-6 outline-none">
            {/* Templates & Appearance */}
            <Card className="rounded-md border border-border shadow-sm bg-card" id="appearance">
              <div className="p-4 md:p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Appearance</h3>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Customize your visual experience</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleSettingsSave()}
                  disabled={settingsSaving}
                  size="sm"
                  className="h-9 rounded-md"
                >
                  {settingsSaving ? 'Saving...' : 'Save Appearance'}
                </Button>
              </div>

              <div className="p-4 md:p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultCurrency" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1">Default Currency</Label>
                    <Select
                      value={settings.default_currency}
                      onValueChange={(value) => {
                        const next = { ...settings, default_currency: value };
                        setSettings(next);
                        void handleSettingsSave(next, { showToast: false });
                      }}
                    >
                      <SelectTrigger id="defaultCurrency" className="h-12 rounded-md bg-background border-border/50 font-medium">
                        <SelectValue placeholder="Select Currency" />
                      </SelectTrigger>
                      <SelectContent className="rounded-md border-border/50">
                        <SelectItem value="INR" className="rounded-lg py-2.5">INR (₹) - Indian Rupee</SelectItem>
                        <SelectItem value="USD" className="rounded-lg py-2.5">USD ($) - US Dollar</SelectItem>
                        <SelectItem value="EUR" className="rounded-lg py-2.5">EUR (€) - Euro</SelectItem>
                        <SelectItem value="GBP" className="rounded-lg py-2.5">GBP (£) - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultPaymentTerms" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1">Payment Terms (Days)</Label>
                    <Input
                      id="defaultPaymentTerms"
                      value={settings.default_payment_terms}
                      onChange={(e) => setSettings({ ...settings, default_payment_terms: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Theme Mode</h4>
                    <p className="text-xs text-muted-foreground">Toggle light or dark interface</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="h-10 px-6 rounded-md"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Moon className="w-4 h-4 mr-2" />
                        Dark Mode
                      </>
                    ) : (
                      <>
                        <Sun className="w-4 h-4 mr-2" />
                        Light Mode
                      </>
                    )}
                  </Button>
                </div>

                {/* Invoice Template Selection */}
                <div className="pt-4 space-y-4">
                  <h4 className="text-sm font-semibold">Invoice Templates</h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {[
                      {
                        id: 'professional',
                        name: 'Professional',
                        color: 'bg-blue-600',
                      },
                      {
                        id: 'elegant',
                        name: 'Elegant',
                        color: 'bg-purple-600',
                      },
                      {
                        id: 'minimal',
                        name: 'Minimal',
                        color: 'bg-slate-600',
                      },
                      {
                        id: 'modern',
                        name: 'Modern',
                        color: 'bg-emerald-600',
                      },
                      {
                        id: 'corporate',
                        name: 'Corporate',
                        color: 'bg-orange-600',
                      }
                    ].map((template) => (
                      <div
                        key={template.id}
                        className={cn(
                          "group relative cursor-pointer overflow-hidden rounded-md border transition-all",
                          settings.invoice_template === template.id ? "border-primary shadow-sm" : "border-border bg-muted/50 hover:border-primary/50"
                        )}
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        <div className={cn("h-20 flex items-center justify-center bg-muted", template.color, "bg-opacity-10 group-hover:bg-opacity-20")}>
                          <FileText className={cn("w-6 h-6", template.color.replace('bg-', 'text-'))} />
                        </div>
                        <div className="p-3 bg-card border-t">
                          <p className="text-xs font-medium text-foreground truncate">{template.name}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-full mt-2 px-0 text-[10px] font-medium text-muted-foreground hover:text-primary"
                            onClick={(e) => { e.stopPropagation(); setPreviewTemplate(template.id as 'professional' | 'elegant' | 'minimal' | 'modern' | 'corporate'); }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                        </div>
                        {settings.invoice_template === template.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Template Preview Modal */}
            <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
              <DialogContent className="sm:max-w-[95vw] w-full max-h-[96vh] overflow-y-auto p-0 rounded-xl border border-border bg-white dark:bg-slate-950 shadow-2xl flex flex-col">
                <div className="sticky top-0 z-50 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 md:p-6 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">Template Preview</DialogTitle>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        {previewTemplate ? previewTemplate.charAt(0).toUpperCase() + previewTemplate.slice(1) : ''} Style
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" onClick={() => setPreviewTemplate(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex-1 bg-slate-100/30 dark:bg-slate-950/30 p-4 sm:p-6 flex justify-center overflow-y-auto">
                  <ResponsiveInvoiceWrapper>
                    <div className="bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 rounded-sm overflow-hidden mb-10 h-fit">
                      {previewTemplate && (
                        <InvoiceTemplate
                          template={previewTemplate}
                        invoice={{
                          invoice_number: 'INV-2024-001',
                          issue_date: new Date().toISOString(),
                          due_date: new Date(Date.now() + 15 * 864e5).toISOString(),
                          status: 'sent',
                          subtotal: 12500,
                          tax_amount: 2250,
                          discount_amount: 500,
                          total_amount: 14250,
                          currency: settings.default_currency || 'INR',
                          notes: 'Thank you for your business! We appreciate your partnership and look forward to working with you again.',
                          terms: '1. Please pay within 15 days of invoice date.\n2. Late payments may be subject to a 2% interest fee.\n3. Digital copy is valid for all tax purposes.'
                        }}
                        client={{
                          name: 'Acme Corporation Pvt Ltd',
                          email: 'billing@acmecorp.com',
                          phone: '+91 98765 43210',
                          address: 'Plot No. 42, Tech Park, Phase II, Whitefield',
                          city: 'Bengaluru',
                          state: 'Karnataka',
                          postal_code: '560066',
                          country: 'India',
                          gstin: '29ABCDE1234F1Z5'
                        }}
                        items={[
                          { description: 'Enterprise Cloud Infrastructure Strategy & Implementation', quantity: 1, rate: 8000, amount: 8000, tax_rate: 18 },
                          { description: 'Annual Security Audit, Compliance Review & SSL Certification', quantity: 1, rate: 4500, amount: 4500, tax_rate: 18 }
                        ]}
                        company={{
                          company_name: profile.company_name || 'YOUR BUSINESS NAME',
                          email: user?.email || 'accounts@yourcompany.com',
                          phone: profile.phone || '+91 99999 00000',
                          business_address: profile.business_address || '123, Growth Hub, Phase II',
                          city: profile.city || 'Gurugram',
                          state: profile.state || 'Haryana',
                          pincode: profile.pincode || '122001',
                          gstin: profile.gstin || '06AAAAA0000A1Z5',
                          bank_name: 'HDFC BANK LTD',
                          account_number: '50100123456789',
                          ifsc_code: 'HDFC0000123',
                          account_holder_name: profile.company_name || 'AUTHORIZED SIGNATORY',
                          account_type: 'Current Account',
                          logo_url: profile.logo_url,
                          signature_url: profile.signature_url
                        }}
                      />
                    )}
                  </div>
                </ResponsiveInvoiceWrapper>
              </div>

                <div className="p-4 md:p-6 border-t bg-background flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => setPreviewTemplate(null)}>
                    Dismiss
                  </Button>
                  <Button className="flex-1 h-12 rounded-xl bg-primary hover:opacity-90 font-bold uppercase tracking-widest text-[10px] shadow-sm" onClick={() => { handleTemplateSelect(previewTemplate!); setPreviewTemplate(null); }}>
                    Adopt This Style
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </div>
      </Tabs>

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

