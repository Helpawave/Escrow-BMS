import { FileText, CheckCircle } from "lucide-react";
import Footer from "@/components/Footer";
import PublicNavbar from "@/components/PublicNavbar";
import { WhatsAppChatWidget } from "@/components/WhatsAppChatWidget";

const TermsAndConditions = () => {
  const terms = [
    {
      title: "1. Acceptance of Terms",
      content: "By registering for or using Escrow BMS SaaS services, you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a business, you represent that you have authority to bind that entity."
    },
    {
      title: "2. License & Service Scope",
      content: "Escrow BMS grants your company a non-exclusive, non-transferable subscription right to access and use our integrated Billing, Ledger, Payroll, Inventory, Cashbook, and CRM modules."
    },
    {
      title: "3. Account Security & Multi-Tenancy",
      content: "You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your company account. Each account is partitioned via Supabase Row Level Security (RLS)."
    },
    {
      title: "4. Subscription & Billing",
      content: "Subscription fees are billed in advance on a monthly or annual basis depending on your plan. Services continue automatically until canceled in accordance with our cancellation policies."
    },
    {
      title: "5. Compliance & Financial Records",
      content: "You remain responsible for ensuring the accuracy of your GST numbers, HSN codes, employee tax calculations, and invoice values generated using the platform."
    },
    {
      title: "6. Limitation of Liability",
      content: "In no event shall Escrow BMS be liable for indirect, incidental, or consequential damages arising out of your use or inability to use the platform services."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between overflow-x-hidden">
      <div>
        <PublicNavbar />

        <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-14 max-w-4xl">
          <div className="flex items-center gap-4 sm:gap-5 mb-8 sm:mb-12">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
              <FileText className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                Terms &amp; Conditions
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">
                Master Subscription &amp; Service Usage Terms
              </p>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {terms.map((term, index) => (
              <div key={index} className="p-4 sm:p-6 rounded-2xl border bg-card/90 backdrop-blur-sm shadow-sm space-y-2.5 sm:space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">{term.title}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm pl-0 sm:pl-11">{term.content}</p>
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

export default TermsAndConditions;
