import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
              Get in <span className="text-indigo-600">Touch</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions about Escrow BMS, multi-tenant setup, or enterprise plans? Our dedicated support team is here to assist you 24/7.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="p-6 md:p-8 border-border shadow-lg">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-indigo-600" />
                Send us a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                    <Input id="name" placeholder="John Doe" required className="bg-muted/30 border-none focus-visible:ring-1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                    <Input id="email" type="email" placeholder="john@company.com" required className="bg-muted/30 border-none focus-visible:ring-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject</Label>
                  <Input id="subject" placeholder="Enterprise Integration / Support" required className="bg-muted/30 border-none focus-visible:ring-1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</Label>
                  <Textarea id="message" placeholder="How can we help your business today?" required className="min-h-[140px] bg-muted/30 border-none focus-visible:ring-1 resize-none" />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full py-6 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                  {isSubmitting ? "Sending..." : "Send Message"}
                  <Send className="ml-2 w-4 h-4" />
                </Button>
              </form>
            </Card>

            {/* Contact Info */}
            <div className="space-y-8">
              <Card className="p-6 border-border flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1">Email Support</h3>
                  <p className="text-muted-foreground text-sm mb-2">Reach out directly to our customer care team.</p>
                  <a href="mailto:support@escrowbms.com" className="font-mono font-bold text-indigo-600 hover:underline">support@escrowbms.com</a>
                </div>
              </Card>

              <Card className="p-6 border-border flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1">Helpline Phone</h3>
                  <p className="text-muted-foreground text-sm mb-2">Mon-Sat from 9am to 7pm IST.</p>
                  <a href="tel:+9118001234567" className="font-mono font-bold text-emerald-600 hover:underline">+91 1800-123-4567</a>
                </div>
              </Card>

              <Card className="p-6 border-border flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1">Corporate HQ</h3>
                  <p className="text-muted-foreground text-sm">
                    Escrow Tech Park, Plot 42, Financial District,<br />
                    BKC, Mumbai, Maharashtra 400051, India
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactUs;
