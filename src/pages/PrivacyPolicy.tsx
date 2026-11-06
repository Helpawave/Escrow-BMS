import { Shield, Eye, Lock, Users, CheckCircle, Scale } from "lucide-react";
import Footer from "@/components/Footer";
import PublicNavbar from "@/components/PublicNavbar";
import { WhatsAppChatWidget } from "@/components/WhatsAppChatWidget";

const PrivacyPolicy = () => {
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
    <div className="min-h-screen bg-background flex flex-col justify-between overflow-x-hidden">
      <div>
        <PublicNavbar />

        <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-14 max-w-4xl">
          <div className="flex items-center gap-4 sm:gap-5 mb-8 sm:mb-12">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
              <Shield className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                Privacy Policy
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">
                Data Protection &amp; RLS Isolation Standards
              </p>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {sections.map((section, index) => (
              <div key={index} className="p-4 sm:p-6 rounded-2xl border bg-card/90 backdrop-blur-sm shadow-sm space-y-2.5 sm:space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <section.icon className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">{section.title}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm pl-0 sm:pl-11">{section.content}</p>
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

export default PrivacyPolicy;
