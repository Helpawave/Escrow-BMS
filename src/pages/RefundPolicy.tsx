import { RotateCcw, CheckCircle } from "lucide-react";
import Footer from "@/components/Footer";
import PublicNavbar from "@/components/PublicNavbar";
import { WhatsAppChatWidget } from "@/components/WhatsAppChatWidget";

const RefundPolicy = () => {
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
    <div className="min-h-screen bg-background flex flex-col justify-between overflow-x-hidden">
      <div>
        <PublicNavbar />

        <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-14 max-w-4xl">
          <div className="flex items-center gap-4 sm:gap-5 mb-8 sm:mb-12">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
              <RotateCcw className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                Cancellation &amp; Refund Policy
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">
                Transparent &amp; Fair Refund Guidelines
              </p>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {policies.map((item, index) => (
              <div key={index} className="p-4 sm:p-6 rounded-2xl border bg-card/90 backdrop-blur-sm shadow-sm space-y-2.5 sm:space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">{item.title}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm pl-0 sm:pl-11">{item.content}</p>
              </div>
            ))}
          </div>
        </main>
      </div>

      <Footer />
      <WhatsAppChatWidget />
    </div>
  );
};

export default RefundPolicy;
