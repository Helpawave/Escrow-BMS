import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ShieldCheck, Check, Sparkles, LogOut, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { RazorpayResponse, RazorpayOptions } from "@/types/razorpay";
import { Profile } from "@/contexts/AuthContextObject";

interface Plan {
  id: string;
  amount: number;
  name: string;
  description: string;
  price: string;
  period: string;
  savings?: string;
}

const PLANS: Record<string, Plan> = {
  monthly: {
    id: 'monthly',
    amount: 34900,
    name: 'Monthly Pro',
    description: 'Flexible monthly access.',
    price: '349',
    period: 'month'
  },
  yearly: {
    id: 'yearly',
    amount: 349900,
    name: 'Yearly Pro',
    description: 'One year of Pro access.',
    price: '3,499',
    period: 'year',
    savings: 'Save Rs 689/year'
  }
};

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};



export const SubscriptionModal = () => {
  const { user, signOut, isSubscribed } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setProfile(data as unknown as Profile);
    };
    fetchProfile();
  }, [user]);

  if (isSubscribed !== false) return null;



  const handleUpgrade = async () => {
    const res = await loadRazorpay();
    if (!res) {
      toast({
        title: "Connection Error",
        description: "Razorpay SDK failed to load.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const planDetails = PLANS[selectedPlan];
      const { data: order, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: { amount: planDetails.amount, currency: 'INR' }
      });

      if (error || !order) throw error || new Error('Failed to create order');

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
            const { error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
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
              title: "Payment Successful!",
              description: "Refreshing access...",
            });

            setTimeout(() => {
              window.location.reload();
            }, 2000);

          } catch (error) {
            toast({
              title: "Verification Failed",
              description: "Contact support if amount was debited.",
              variant: "destructive"
            });
          }
        },
        prefill: {
          name: profile?.company_name || user?.email,
          email: user?.email,
          contact: profile?.phone
        },
        theme: {
          color: "#3B82F6"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      toast({
        title: "Order Failed",
        description: "Could not initiate payment.",
        variant: "destructive"
      });
    } finally {
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.values(PLANS).map((plan) => (
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
                onClick={handleUpgrade}
                disabled={loading}
                className="h-14 w-full rounded-2xl bg-primary text-lg font-black text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                {loading ? "Processing..." : `Pay ${selectedPlan === 'monthly' ? 'Rs 349' : 'Rs 3,499'} Securely`}
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
