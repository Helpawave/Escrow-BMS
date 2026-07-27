import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-lg">
                E
              </div>
              <span className="text-xl font-extrabold tracking-tight text-foreground">ESCROW BMS</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <section className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-6">
              Our Mission is to <span className="text-indigo-600">Simplify Enterprise Operations</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Escrow BMS is a comprehensive Business Management System designed to help growing enterprises 
              streamline billing, account ledgers, payroll compliance, inventory tracking, and CRM in one secure SaaS platform.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card className="p-6 md:p-8 border-indigo-500/10 bg-indigo-500/5">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                To become the most trusted multi-tenant business management operating system for enterprises, 
                empowering businesses to focus on growth while automated systems handle compliance, payroll, and invoicing.
              </p>
            </Card>

            <Card className="p-6 md:p-8 border-emerald-500/10 bg-emerald-500/5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Commitment</h3>
              <p className="text-muted-foreground leading-relaxed">
                We are committed to delivering a seamless, bank-grade secure, and intuitive platform that 
                empowers modern teams with real-time financial insights, compliance tools, and automated workflows.
              </p>
            </Card>
          </div>

          <section className="space-y-12 mb-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Why ESCROW BMS?</h2>
              <p className="text-muted-foreground">Built by engineers and financial experts for modern enterprises</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "GST & E-Invoice Ready", desc: "Always up-to-date with GST rules, E-invoicing, and E-way bill standards." },
                { title: "Bank-Level Security", desc: "Your enterprise data is encrypted and protected by multi-tenant RLS isolation." },
                { title: "All-in-One Integration", desc: "Billing, Ledger, Payroll, Inventory, Cashbook, and CRM seamlessly connected." },
                { title: "Automated ERP Posting", desc: "Invoices and salary disbursements automatically post to party ledgers and expense logs." },
                { title: "Fast Supabase Engine", desc: "Sub-second initial paint with in-memory React Query caching." },
                { title: "Analytics & Reports", desc: "Deep real-time financial reporting including Balance Sheets, P&L, and Tax Variances." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors">
                  <CheckCircle className="w-6 h-6 text-indigo-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="text-center bg-card border rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold mb-2">Ready to transform your business operations?</h3>
            <p className="text-muted-foreground mb-6">Get started with Escrow BMS today.</p>
            <Button size="lg" className="gap-2 font-bold" onClick={() => navigate('/auth')}>
              Get Started Now <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutUs;
