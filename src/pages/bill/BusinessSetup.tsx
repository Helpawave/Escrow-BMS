import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Store, Phone, MapPin, BadgeCheck, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useTaxConfig } from "@/contexts/TaxContext";
import { TAX_COUNTRIES, getCountryTaxConfig } from "@/data/taxCountries";
import { CountryPhoneInput } from "@/components/ui/CountryPhoneInput";

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Delhi", "Puducherry", "Other"
];

const BusinessSetup = () => {
  const { user, loading: authLoading, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const {
    businessCountry,
    countryCode,
    taxSystem,
    taxName,
    taxIdLabel,
    taxIdPlaceholder,
    standardTaxRate,
    currencySymbol,
    updateBusinessCountry
  } = useTaxConfig();

  const [selectedCountry, setSelectedCountry] = useState<string>(countryCode || 'IN');

  const [formData, setFormData] = useState({
    company_name: '',
    phone: '',
    business_address: '',
    state: '',
    city: '',
    pincode: '',
    gstin: ''
  });

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        company_name: profile.company_name || prev.company_name,
        phone: profile.phone || profile.mobile || prev.phone
      }));
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.company_name || !formData.phone || !formData.business_address) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill in all mandatory fields (Company Name, Phone, and Address)."
      });
      return;
    }

    setLoading(true);
    try {
      const client = supabase as any;
      try {
        await client
          .from('profiles')
          .update({
            company_name: formData.company_name,
            phone: formData.phone,
            business_address: formData.business_address,
            country: getCountryTaxConfig(selectedCountry).countryName,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      } catch (profErr) {
        console.warn('Profile basic update note:', profErr);
      }

      await refreshProfile();
      
      await updateBusinessCountry(selectedCountry);
      toast({
        title: "Setup Complete!",
        description: "Your business profile has been created. Redirecting to your dashboard...",
      });

      // Shorter delay for better UX
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save business details.";
      console.error('Error saving profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-white border border-border shadow-md">
              <img
                src="/assets/images/e9085822-5bea-4642-b19e-dcfcde6248f7.png"
                alt="ESCROWBILL Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Escrow <span className="text-blue-600">Bill</span>
            </span>
          </div>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden">
          <div className="h-2 bg-blue-600 w-full" />
          <CardHeader className="space-y-1 pb-8 text-center pt-10">
            <CardTitle className="text-3xl font-bold tracking-tight">Complete Your Profile</CardTitle>
            <CardDescription className="text-slate-500 text-lg">
              Set up your business details to start generating professional invoices.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Compulsory Country & Tax Selection */}
                <div className="md:col-span-2 p-4 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-blue-50/40 to-slate-50 dark:from-indigo-950/20 dark:via-blue-950/10 dark:to-slate-900/30 border-2 border-indigo-100 dark:border-indigo-900/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getCountryTaxConfig(selectedCountry).flag}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <Label className="font-bold text-sm text-foreground">
                            Business Country & Legal Tax System *
                          </Label>
                          <span className="bg-indigo-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                            {getCountryTaxConfig(selectedCountry).taxSystem} • {getCountryTaxConfig(selectedCountry).standardTaxRate}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Currency: <strong className="text-foreground">{getCountryTaxConfig(selectedCountry).currencyCode} ({getCountryTaxConfig(selectedCountry).currencySymbol})</strong> • Tax ID: <strong className="text-foreground">{getCountryTaxConfig(selectedCountry).taxIdLabel}</strong>
                        </p>
                      </div>
                    </div>
                    <Select
                      value={selectedCountry}
                      onValueChange={(val) => {
                        setSelectedCountry(val);
                        updateBusinessCountry(val);
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-64 h-11 rounded-xl bg-background border-indigo-200 font-bold text-xs">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {TAX_COUNTRIES.map((c) => (
                          <SelectItem key={c.countryCode} value={c.countryCode} className="text-xs font-medium">
                            <span className="mr-2 text-base">{c.flag}</span>
                            {c.countryName} ({c.taxSystem})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-sm font-semibold flex items-center gap-2">
                    <Store className="w-4 h-4 text-blue-500" />
                    Company Name *
                  </Label>
                  <Input
                    id="company_name"
                    placeholder="e.g. Acme Solutions Pvt Ltd"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="h-11 border-slate-200 focus:ring-blue-500 rounded-xl transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-500" />
                    Professional Phone *
                  </Label>
                  <Input
                    id="phone"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-11 border-slate-200 focus:ring-blue-500 rounded-xl transition-all"
                    required
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Business Address *
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Full business address for invoicing..."
                    value={formData.business_address}
                    onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                    className="min-h-[100px] border-slate-200 focus:ring-blue-500 rounded-xl transition-all resize-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-semibold">State</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(val) => setFormData({ ...formData, state: val })}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-semibold">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="h-11 border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode" className="text-sm font-semibold">PIN Code</Label>
                    <Input
                      id="pincode"
                      placeholder="123456"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="h-11 border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="gstin" className="text-sm font-semibold flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-blue-500" />
                    {taxIdLabel} (Optional)
                  </Label>
                  <Input
                    id="gstin"
                    placeholder={taxIdPlaceholder}
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="h-11 border-slate-200 rounded-xl transition-all font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-200 group transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  ) : (
                    <>
                      Save & Continue 
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => signOut()}
                  className="w-full h-12 text-sm font-bold text-rose-600 border-rose-200 hover:bg-rose-50/50 hover:text-rose-700 hover:border-rose-300 rounded-2xl transition-all"
                >
                  Cancel & Sign Out
                </Button>
              </div>

              <p className="text-center text-xs text-slate-400 font-medium">
                * You can update these details later in settings.
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default BusinessSetup;
