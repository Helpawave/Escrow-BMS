import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import PublicNavbar from "@/components/PublicNavbar";
import { WhatsAppChatWidget } from "@/components/WhatsAppChatWidget";

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <PublicNavbar />

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-14 flex-1">
        <div className="max-w-4xl mx-auto">
          <section className="text-center mb-12 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4 sm:mb-6">
              Our Mission is to <span className="text-blue-600">Simplify Enterprise Operations</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Escrow BMS is a comprehensive Business Management System designed to help growing enterprises 
              streamline billing, account ledgers, payroll compliance, inventory tracking, and CRM in one secure SaaS platform.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
            <Card className="p-6 md:p-8 border-indigo-500/15 bg-indigo-500/5 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">Our Vision</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                To become the most trusted multi-tenant business management operating system for enterprises, 
                empowering businesses to focus on growth while automated systems handle compliance, payroll, and invoicing.
              </p>
            </Card>

            <Card className="p-6 md:p-8 border-emerald-500/15 bg-emerald-500/5 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">Our Commitment</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                We are committed to delivering a seamless, bank-grade secure, and intuitive platform that 
                empowers modern teams with real-time financial insights, compliance tools, and automated workflows.
              </p>
            </Card>
          </div>

          <section className="space-y-8 sm:space-y-12 mb-12 sm:mb-16">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-black mb-2">Why ESCROW BMS?</h2>
              <p className="text-muted-foreground text-xs sm:text-sm">Built by engineers and financial experts for modern enterprises</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                { title: "GST & E-Invoice Ready", desc: "Always up-to-date with GST rules, E-invoicing, and E-way bill standards." },
                { title: "Bank-Level Security", desc: "Your enterprise data is encrypted and protected by multi-tenant RLS isolation." },
                { title: "All-in-One Integration", desc: "Billing, Ledger, Payroll, Inventory, Cashbook, and CRM seamlessly connected." },
                { title: "Automated ERP Posting", desc: "Invoices and salary disbursements automatically post to party ledgers and expense logs." },
                { title: "Fast Supabase Engine", desc: "Sub-second initial paint with in-memory React Query caching." },
                { title: "Analytics & Reports", desc: "Deep real-time financial reporting including Balance Sheets, P&L, and Tax Variances." }
              ].map((item, i) => (
                <div key={i} className="flex gap-3.5 p-4 rounded-2xl bg-card border border-border/80 shadow-2xs">
                  <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="text-center bg-card border rounded-3xl p-6 sm:p-10 shadow-sm">
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Ready to transform your business operations?</h3>
            <p className="text-muted-foreground text-xs sm:text-sm mb-6">Get started with Escrow BMS today.</p>
            <Button size="lg" className="w-full sm:w-auto gap-2 font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full" onClick={() => navigate('/auth')}>
              Get Started Now <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppChatWidget />
    </div>
  );
};

export default AboutUs;
