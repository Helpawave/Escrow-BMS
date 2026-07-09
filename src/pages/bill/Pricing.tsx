import React, { useState } from "react";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Copy, Sparkles, CreditCard, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  period: string;
  savings?: string;
}

const PLANS: Record<string, Plan> = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Pro',
    description: 'Billed monthly. Full access.',
    price: '349',
    period: 'month'
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly Pro',
    description: 'Billed annually. Best value.',
    price: '3,499',
    period: 'year',
    savings: 'Save Rs 689/year'
  }
};

const Pricing = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <SEO
        title="Pricing Plans"
        description="Affordable, transparent pricing plans for ESCROWBILL. Start your 30-day free trial today and streamline your business invoicing and escrow payments."
        keywords="escrowbill pricing, invoicing software cost india, gst billing plans"
      />

      {/* Basic Nav */}
      <header className="border-b border-border bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/assets/images/e9085822-5bea-4642-b19e-dcfcde6248f7.png" 
                alt="ESCROWBILL Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold text-foreground">ESCROWBILL</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate('/auth')}>Sign In</Button>
              <Button onClick={() => navigate('/auth?view=signup')}>Get Started</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10 px-4 md:py-16 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto font-medium">
              Start your 30-day free trial today. Then, upgrade to Pro for unlimited invoice generation and business growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {Object.values(PLANS).map((plan) => (
              <div 
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id as 'monthly' | 'yearly')}
                className={cn(
                  "group relative cursor-pointer transition-all duration-300 transform",
                  selectedPlan === plan.id 
                    ? "scale-[1.02] -translate-y-1" 
                    : "hover:scale-[1.01]"
                )}
              >
                <Card className={cn(
                  "h-full border-2 overflow-hidden rounded-[32px] transition-all",
                  selectedPlan === plan.id 
                    ? "border-primary shadow-2xl shadow-primary/10 ring-4 ring-primary/5" 
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                )}>
                  {plan.savings && (
                    <div className="absolute top-6 right-6 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/20 z-10">
                      {plan.savings}
                    </div>
                  )}
                  
                  <CardHeader className="p-4 md:p-8 pb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                      selectedPlan === plan.id ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    )}>
                      {plan.id === 'yearly' ? <Sparkles className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                    </div>
                    <CardTitle className="text-2xl font-black">{plan.name}</CardTitle>
                    <CardDescription className="text-slate-500 font-medium">{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="p-4 md:p-8 pt-0">
                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-4xl font-black tracking-tighter">&#8377;{plan.price}</span>
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">/ {plan.period}</span>
                    </div>

                    <div className="space-y-4 mb-8">
                      {[
                        "Unlimited GST Invoices",
                        "Inventory & Product Management",
                        "Dedicated Client Portal",
                        "Financial Reports & Analytics",
                        "HSN/SAC Code Support",
                        "Priority Customer Care"
                      ].map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className={cn(
                            "mt-0.5 rounded-full p-0.5 shrink-0",
                            selectedPlan === plan.id 
                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" 
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600"
                          )}>
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{feature}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        selectedPlan === plan.id 
                          ? "border-primary bg-primary text-primary-foreground" 
                          : "border-slate-300 dark:border-slate-700"
                      )}>
                        {selectedPlan === plan.id && <Check className="w-3 h-3" />}
                      </div>
                      <span className={cn(
                        "text-sm font-bold",
                        selectedPlan === plan.id ? "text-slate-900 dark:text-white" : "text-slate-400"
                      )}>
                        {selectedPlan === plan.id ? "Selected" : "Select this option"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-12">
             <Button onClick={() => navigate('/auth?view=signup')} className="h-14 px-8 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transform hover:-translate-y-1 transition-all">
                Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
             </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
