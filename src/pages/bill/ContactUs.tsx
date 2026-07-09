import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ContactUs = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We will get back to you soon.",
      });
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
              Get in <span className="text-primary">Touch</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions about our plans or need technical assistance? Our team is 
              here to help you with anything you need.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="p-4 md:p-8 border-border shadow-lg">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-primary" />
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
                  <Input id="subject" placeholder="General Inquiry" required className="bg-muted/30 border-none focus-visible:ring-1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</Label>
                  <Textarea id="message" placeholder="How can we help you today?" required className="min-h-[150px] bg-muted/30 border-none focus-visible:ring-1 resize-none" />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full py-6 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">
                  {isSubmitting ? "Sending..." : "Send Message"}
                  <Send className="ml-2 w-4 h-4" />
                </Button>
              </form>
            </Card>

            {/* Contact Info */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                
                <div className="flex gap-4 p-4 md:p-6 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/10 transition-all hover:bg-muted/50 group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    <Mail className="w-6 h-6 text-primary group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Email Us</h4>
                    <p className="text-muted-foreground text-sm font-medium">support@escrowbms.com</p>
                    <p className="text-muted-foreground text-xs font-medium">response within 24 hours</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 md:p-6 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/10 transition-all hover:bg-muted/50 group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    <Phone className="w-6 h-6 text-primary group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Call Us</h4>
                    <p className="text-muted-foreground text-sm font-medium">+91 (800) 123-4567</p>
                    <p className="text-muted-foreground text-xs font-medium">Mon-Fri from 9am to 6pm</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 md:p-6 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/10 transition-all hover:bg-muted/50 group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    <MapPin className="w-6 h-6 text-primary group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Registered Address</h4>
                    <p className="text-muted-foreground text-sm font-medium">ASH-TECH SOLUTIONS</p>
                    <p className="text-muted-foreground text-xs font-medium leading-relaxed mt-1">
                      New Delhi, Delhi 110001, India
                    </p>
                  </div>
                </div>
              </div>

              <Card className="p-4 md:p-6 bg-primary/5 border-primary/10 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">Response Time</h4>
                  <p className="text-muted-foreground text-xs">Our team typically responds within 4 working hours.</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactUs;
