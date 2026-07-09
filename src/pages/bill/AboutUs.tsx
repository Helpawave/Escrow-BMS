import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { ArrowRight, CheckCircle, Shield, Zap, Target, BookOpen, Users, Globe } from "lucide-react";
import { SEO } from "@/components/SEO";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="About Us" 
        description="Learn about ESCROWBILL's mission to simplify invoicing and secure business payments for modern Indian enterprises. ISO Certified & GST Ready."
        keywords="about escrowbill, invoicing mission, secure billing solutions india"
      />
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.location.href = '/'}>
              <img 
                src="/assets/images/e9085822-5bea-4642-b19e-dcfcde6248f7.png" 
                alt="ESCROWBILL Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold text-foreground">ESCROWBILL</span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="outline" asChild>
                <a href="/auth">Sign In</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <section className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-6">
              Our Mission is to <span className="text-primary">Simplify Invoicing</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Escrow Bill is a leading provider of professional invoice management solutions, 
              designed to help businesses of all sizes streamline their billing, track payments, 
              and maintain GST compliance with ease.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card className="p-4 md:p-8 border-primary/10 bg-primary/5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                To become the most trusted financial management partner for growing enterprises, 
                enabling them to focus on what they do best while we handle the complexities of 
                billing and compliance.
              </p>
            </Card>

            <Card className="p-4 md:p-8 border-success/10 bg-success/5">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Commitment</h3>
              <p className="text-muted-foreground leading-relaxed">
                We are committed to delivering a seamless, secure, and intuitive platform that 
                empowers our users with real-time financial insights and professional branding tools.
              </p>
            </Card>
          </div>

          <section className="space-y-12 mb-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Why ESCROWBILL?</h2>
              <p className="text-muted-foreground">Built by professionals, for professionals</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "GST Compliant", desc: "Always up-to-date with the latest GST rules and E-invoicing standards." },
                { title: "Bank-Level Security", desc: "Your financial data is encrypted and protected by enterprise-grade security." },
                { title: "Global Ready", desc: "Support for multiple currencies and international payment gateways." },
                { title: "Fast Support", desc: "Dedicated team of experts ready to help you with any queries." },
                { title: "Easy Migration", desc: "Import your existing client and product data in minutes." },
                { title: "Analytics Driven", desc: "Gain deep insights into your business performance with powerful reports." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors">
                  <CheckCircle className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <h4 className="font-bold text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer className="bg-primary rounded-3xl p-6 md:p-12 text-center text-primary-foreground">
            <h2 className="text-3xl font-bold mb-6 italic">Ready to transform your business?</h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses that trust ESCROWBILL for their daily invoicing needs.
            </p>
            <Button size="lg" variant="secondary" className="px-8 py-6 rounded-xl text-lg font-bold shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all" asChild>
              <a href="/auth?view=signup">
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
          </footer>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;
