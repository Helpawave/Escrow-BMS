import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ShieldCheck, Check, Sparkles, LogOut, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase, serviceSupabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { RazorpayResponse, RazorpayOptions } from "@/types/razorpay";
import { Profile } from "@/contexts/AuthContextObject";
import { usePricing } from "@/hooks/usePricing";
import { UserType, USER_TYPE_LABELS } from "@/types/admin";

interface Plan {
  id: string;
  amount: number;
  name: string;
  description: string;
  price: string;
  period: string;
  savings?: string;
}

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

export const SubscriptionModal = () => {
  const { user, profile: authProfile, signOut, isSubscribed, isStaff } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(authProfile || null);

  // Dynamic rates (universal & custom) managed by centralized hook
  const { effectiveMonthly, effectiveYearly, annualSavings, resolvedUserType, isCustomPricing } = usePricing();

  // Sync authProfile to local profile state
  useEffect(() => {
    if (authProfile) {
      setProfile(authProfile);
    }
  }, [authProfile]);

  const plans: Record<string, Plan> = useMemo(() => ({
    monthly: {
      id: 'monthly',
      amount: Math.round(effectiveMonthly * 100),
      name: 'Monthly Pro',
      description: 'Flexible monthly access.',
      price: effectiveMonthly.toLocaleString('en-IN'),
      period: 'month'
    },
    yearly: {
      id: 'yearly',
      amount: Math.round(effectiveYearly * 100),
      name: 'Yearly Pro',
      description: 'One year of Pro access.',
      price: effectiveYearly.toLocaleString('en-IN'),
      period: 'year',
      savings: annualSavings > 0 ? `Save ₹${annualSavings.toLocaleString('en-IN')}/year` : undefined
    }
  }), [effectiveMonthly, effectiveYearly, annualSavings]);

  // Staff members are covered by their company's subscription — never show this modal to them
  if (isStaff) return null;
  if (isSubscribed !== false) return null;

  const handleUpgrade = async (planOverride?: 'monthly' | 'yearly') => {
    const targetPlan = planOverride || selectedPlan;
    if (planOverride && planOverride !== selectedPlan) {
      setSelectedPlan(planOverride);
    }

    const res = await loadRazorpay();
    if (!res || !(window as any).Razorpay) {
      toast({
        title: "Connection Error",
        description: "Razorpay SDK failed to load. Please check your internet connection.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const planDetails = plans[targetPlan];
      const clientToUse = serviceSupabase || supabase;
      const { data: order, error } = await clientToUse.functions.invoke('create-razorpay-order', {
        body: { amount: planDetails.amount, currency: 'INR' }
      });

      if (error || !order || !order.id) {
        throw error || new Error(order?.error || 'Failed to create order');
      }

      const cleanPhone = (profile?.phone || profile?.mobile || '').replace(/\D/g, '').slice(-10);

      const options: RazorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        amount: order.amount,
        currency: order.currency,
        name: "Escrow Bill",
        description: planDetails.description,
        image: "/assets/images/e9085822-5bea-4642-b19e-dcfcde6248f7.png",
        order_id: order.id,
        handler: async function (response: RazorpayResponse) {
          try {
            const { error: verifyError } = await clientToUse.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                user_id: user?.id,
                plan_type: targetPlan
              }
            });

            if (verifyError) {
              console.warn("verify-razorpay-payment notice, applying database update directly:", verifyError);
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
              title: "Payment Successful!",
              description: "Plan active! Refreshing session...",
            });

            setTimeout(() => {
              window.location.reload();
            }, 1500);

          } catch (error) {
            console.error("Payment handler notice:", error);
            toast({
              title: "Payment Received",
              description: "Refreshing account access...",
            });
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: profile?.company_name || user?.email || '',
          email: user?.email || '',
          contact: cleanPhone.length === 10 ? cleanPhone : undefined
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        },
        theme: {
          color: "#3B82F6"
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on('payment.failed', function (resp: any) {
        console.warn("Payment failed or cancelled:", resp);
        setLoading(false);
        toast({
          title: "Payment Cancelled or Failed",
          description: resp?.error?.description || "Payment was not completed.",
          variant: "destructive"
        });
      });
      paymentObject.open();

    } catch (err: any) {
      console.error("Order initiation error:", err);
      toast({
        title: "Order Failed",
        description: err?.message || "Could not initiate payment. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 py-6 backdrop-blur-sm sm:items-center"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      </div>

      <div
        className="relative w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300"
        onClick={(event) => event.stopPropagation()}
      >
        <Card className="max-h-[calc(100vh-3rem)] overflow-y-auto rounded-3xl border-2 bg-background shadow-2xl">


          <CardHeader className="relative overflow-hidden border-b bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-5 py-5 text-center text-white md:px-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.38),transparent_38%)]" />
            <div className="relative mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-blue-200 ring-1 ring-white/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <CardTitle className="relative text-2xl font-black tracking-tight md:text-3xl">
              {profile?.subscription_expires_at ? "Subscription Required" : "Unlock Full Access"}
            </CardTitle>
            <CardDescription className="relative mx-auto max-w-lg text-sm font-medium text-slate-200">
              {profile?.subscription_expires_at
                ? "Your trial has ended. Please choose a plan to continue."
                : "Choose a plan to get started and unlock all premium features."}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 md:p-6">
            {/* Category / User Type Badge */}
            <div className="mb-4 flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{USER_TYPE_LABELS[resolvedUserType]?.icon || '🏢'}</span>
                <div>
                  <p className="text-xs font-black text-foreground">
                    {USER_TYPE_LABELS[resolvedUserType]?.badge || 'Business Tier'}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {USER_TYPE_LABELS[resolvedUserType]?.description || 'Rates optimized for your industry'}
                  </p>
                </div>
              </div>
              {isCustomPricing ? (
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0">
                  Custom Deal
                </span>
              ) : (
                <span className="rounded-full bg-primary/20 text-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0">
                  {USER_TYPE_LABELS[resolvedUserType]?.label || 'Category'} Tier
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.values(plans).map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id as 'monthly' | 'yearly')}
                  className={cn(
                    "relative cursor-pointer overflow-hidden rounded-2xl border-2 p-4 transition-all duration-200 md:p-5",
                    selectedPlan === plan.id
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-2 ring-primary/10"
                      : "border-border bg-card hover:border-primary/40 hover:shadow-md"
                  )}
                >
                  {selectedPlan === plan.id && (
                    <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-4 w-4" />
                    </div>
                  )}

                  <div className="mb-4 flex items-start justify-between gap-3 pr-8">
                    <div>
                      <span className="text-lg font-black">{plan.name}</span>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">{plan.description}</p>
                    </div>
                    {plan.id === 'yearly' && (
                      <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-tight text-white dark:bg-white dark:text-slate-950">
                        Best Value
                      </span>
                    )}
                  </div>

                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-black tracking-tight md:text-4xl">&#8377;{plan.price}</span>
                    <span className="pb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">/{plan.period}</span>
                  </div>

                  {plan.savings && (
                    <p className="mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-primary">
                      {plan.savings}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="my-5 rounded-2xl border bg-muted/20 p-4">
              <div className="grid gap-2 text-sm font-semibold text-muted-foreground sm:grid-cols-3">
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Unlimited access</span>
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Secure checkout</span>
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Instant activation</span>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => handleUpgrade(selectedPlan)}
                disabled={loading}
                className="h-14 w-full rounded-2xl bg-primary text-lg font-black text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                {loading ? "Processing..." : `Pay ₹${(selectedPlan === 'monthly' ? effectiveMonthly : effectiveYearly).toLocaleString('en-IN')} Securely`}
              </Button>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout Session
                </button>
                <div className="flex items-center gap-1.5 text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Secure Checkout</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
