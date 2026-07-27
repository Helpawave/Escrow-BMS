import { FileText, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const TermsAndConditions = () => {
  const navigate = useNavigate();

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
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Terms & Conditions
            </h1>
            <p className="text-muted-foreground text-sm font-semibold mt-1">
              Master Subscription & Service Usage Terms
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {terms.map((term, index) => (
            <div key={index} className="p-6 rounded-2xl border bg-card shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-foreground">{term.title}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm">{term.content}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default TermsAndConditions;
