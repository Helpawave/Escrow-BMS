import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import PublicNavbar from "@/components/PublicNavbar";
import { WhatsAppChatWidget } from "@/components/WhatsAppChatWidget";

const ContactUs = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Message Sent! Thank you for contacting Escrow BMS support. We will get back to you shortly.");
      (e.target as HTMLFormElement).reset();
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <PublicNavbar />

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-14 flex-1">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-3 sm:mb-4">
              Get in <span className="text-blue-600">Touch</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions about Escrow BMS, multi-tenant setup, or enterprise plans? Our dedicated support team is here to assist you 24/7.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            {/* Contact Form */}
            <Card className="p-5 sm:p-8 border-border rounded-3xl shadow-sm">
              <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Send us a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                    <Input id="name" placeholder="John Doe" required className="h-11 rounded-xl bg-muted/40 border border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                    <Input id="email" type="email" placeholder="john@company.com" required className="h-11 rounded-xl bg-muted/40 border border-border" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject</Label>
                  <Input id="subject" placeholder="Enterprise Integration / Support" required className="h-11 rounded-xl bg-muted/40 border border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</Label>
                  <Textarea id="message" placeholder="How can we help your business today?" required className="min-h-[130px] rounded-xl bg-muted/40 border border-border resize-none" />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-md shadow-blue-500/20 transition-all active:scale-95">
                  {isSubmitting ? "Sending..." : "Send Message"}
                  <Send className="ml-2 w-4 h-4" />
                </Button>
              </form>
            </Card>

            {/* Contact Info */}
            <div className="space-y-4 sm:space-y-6">
              <Card className="p-5 sm:p-6 border-border rounded-3xl flex items-start gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-foreground mb-1">Email Support</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm mb-2">Reach out directly to our customer care team.</p>
                  <a href="mailto:support@escrowbms.com" className="font-mono font-bold text-blue-600 hover:underline text-xs sm:text-sm">support@escrowbms.com</a>
                  <div className="mt-1">
                    <a href="mailto:contact@ash-techsolutions.com" className="text-[11px] font-mono text-muted-foreground hover:underline">contact@ash-techsolutions.com (Legal)</a>
                  </div>
                </div>
              </Card>

              <Card className="p-5 sm:p-6 border-border rounded-3xl flex items-start gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-foreground mb-1">Helpline Phone</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm mb-2">Office Support &amp; Onboarding Demo.</p>
                  <a href="tel:+919328028207" className="font-mono font-bold text-emerald-600 hover:underline text-xs sm:text-sm">+91 93280 28207</a>
                </div>
              </Card>

              <Card className="p-5 sm:p-6 border-border rounded-3xl flex items-start gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-foreground mb-1">Office Locations</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    <strong>Gujarat:</strong> Ring Road, Surat, Gujarat, 395002<br />
                    <strong>Delhi:</strong> Connaught Place, New Delhi, 110001
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppChatWidget />
    </div>
  );
};

export default ContactUs;
