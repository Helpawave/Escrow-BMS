import { RotateCcw, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const RefundPolicy = () => {
  const navigate = useNavigate();

  const policies = [
    {
      title: "1. 7-Day Money-Back Guarantee",
      content: "We offer a 7-day hassle-free money-back guarantee for all new subscription plans. If Escrow BMS does not meet your expectations, you can request a full refund within 7 days of initial subscription."
    },
    {
      title: "2. Subscription Cancellations",
      content: "You may cancel your recurring subscription at any time from your Organization Settings page. Upon cancellation, your account will remain active through the end of your current billing period."
    },
    {
      title: "3. Refund Processing Time",
      content: "Approved refund requests are processed within 5-7 business days and credited back to the original payment method (Credit Card, Debit Card, UPI, or Netbanking)."
    },
    {
      title: "4. Non-Refundable Add-ons",
      content: "Custom domain setups, dedicated database migrations, or enterprise SLA support add-ons that have already been fulfilled are non-refundable."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" /> Back to Platform
          </Button>
          <span className="font-extrabold tracking-tight text-lg text-foreground">ESCROW BMS</span>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="flex items-center gap-5 mb-12">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
            <RotateCcw className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Cancellation & Refund Policy
            </h1>
            <p className="text-muted-foreground text-sm font-semibold mt-1">
              Transparent & Fair Refund Guidelines
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {policies.map((item, index) => (
            <div key={index} className="p-6 rounded-2xl border bg-card shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-foreground">{item.title}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm">{item.content}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default RefundPolicy;
