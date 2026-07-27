import { Shield, Eye, Lock, ArrowLeft, Users, CheckCircle, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Shield,
      title: "1. Transparency & Commitment",
      content: "At Escrow BMS, we believe in radical transparency. This policy outlines our commitment to protecting your enterprise data using industry-leading security protocols. By using our multi-tenant SaaS platform, you agree to the collection and protection of information in accordance with this policy."
    },
    {
      icon: Eye,
      title: "2. Data We Aggregate",
      content: "We collect business identity information required for seamless invoicing, ledgers, payroll, inventory, and CRM (GSTIN, Company Profile, Employee Records, Client & Vendor lists). Bank payment gateways handle payment transactions directly via bank-grade APIs."
    },
    {
      icon: Lock,
      title: "3. Enterprise-Grade Security",
      content: "Security is built into our core architecture. We enforce Row Level Security (RLS) isolation for each tenant, ensuring that your financial and payroll records are strictly partitioned and accessible only to authorized users of your company."
    },
    {
      icon: Users,
      title: "4. Internal Data Handling",
      content: "Access to user data is strictly restricted on a 'need-to-know' basis for system maintenance and customer support. We do not sell, rent, or trade your data with external marketing brokers."
    },
    {
      icon: Scale,
      title: "5. Compliance & Legal Standards",
      content: "We comply with Indian data protection regulations, GST/E-Invoicing mandates, and international data standards. Information is shared only when required by applicable law or formal judicial requests."
    },
    {
      icon: CheckCircle,
      title: "6. Data Ownership & Portability",
      content: "You own 100% of your business data. At any time, you can export your ledgers, invoices, payroll sheets, or inventory catalogs to XLSX/PDF format or request complete account purging."
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
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-sm font-semibold mt-1">
              Data Protection & RLS Isolation Standards
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <div key={index} className="p-6 rounded-2xl border bg-card shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <section.icon className="h-5 w-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm">{section.content}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
