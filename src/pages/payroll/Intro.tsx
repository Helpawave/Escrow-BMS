import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  Clock,
  FileText,
  ArrowRight,
  BarChart3,
  CreditCard,
  Zap,
  Lock,
  CheckCircle2,
  Globe,
  Handshake,
  LayoutDashboard,
  DollarSign,
  ClipboardList,
  Bell,
  Shield,
  Crown,
  Settings,
  Briefcase,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, type ComponentType, type ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Intro = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  useEffect(() => {
    // If user is already logged in, redirect them to their dashboard
    if (user) {
      if (role === "super_admin") {
        navigate("/platform");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, role, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
              <img src="/public/icon.png" alt="icon" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">Escoroll</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>Login</Button>
            <Button onClick={() => navigate("/register")} className="shadow-lg shadow-primary/20">Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-8 pb-12 md:pt-12 md:pb-14 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 animate-fade-in border border-primary/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Next-Gen Escrow-Based Payroll Management</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-4 animate-slide-up leading-[1.1]">
              Payroll That Builds <br />
              <span className="text-primary italic">Trust & Security</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-muted-foreground mb-8 animate-slide-up delay-100 leading-relaxed">
              Eliminate payroll uncertainty. Escoroll secures your funds in escrow, automates distribution, and guarantees on-time payments for your entire team.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-200">
              <Button size="lg" className="h-14 px-10 text-lg gap-2 shadow-xl shadow-primary/25 rounded-full" onClick={() => navigate("/register")}>
                Start Your Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-full backdrop-blur-sm" onClick={() => navigate("/login")}>
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Hero Feature Bar */}
          <div className="mt-12 md:mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 py-6 px-5 md:px-6 border rounded-3xl bg-card/50 backdrop-blur-sm animate-fade-in delay-300">
            <div className="text-center">
              <p className="text-3xl font-bold">100%</p>
              <p className="text-sm text-muted-foreground">On-time Payments</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">Bank-Level</p>
              <p className="text-sm text-muted-foreground">Encryption</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">Automated</p>
              <p className="text-sm text-muted-foreground">Tax Compliance</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-sm text-muted-foreground">Security Audit</p>
            </div>
          </div>
        </div>

        {/* Decorative Background Elements */}
        {/* <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-[120px] mix-blend-multiply transition-all duration-700 hover:bg-primary/30" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-[120px] mix-blend-multiply" />
        </div> */}
      </section>

      {/* The Escrow Advantage (How it works) */}
      <section className="py-14 md:py-16 relative bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-14">
            <h2 className="text-4xl font-bold tracking-tight mb-4">The Escrow Advantage</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our unique escrow model ensures that employees are paid fairly and on-time, while giving employers full control and transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            <StepCard
              number="01"
              title="Fund the Escrow"
              description="Deposit your total payroll amount into a secure, protected escrow account before the pay period ends."
              icon={CreditCard}
            />
            <StepCard
              number="02"
              title="Verify Attendance"
              description="Our automated system verifies clock-ins and performance metrics to calculate exact payouts."
              icon={Clock}
            />
            <StepCard
              number="03"
              title="Instant Release"
              description="Once verified, funds are instantly released to employees' bank accounts without any delays."
              icon={Zap}
            />
          </div>
        </div>
      </section>

      {/* Maps to app navigation: Core / Records / System + Platform */}
      <section className="py-14 md:py-16 border-y border-border/80 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-14">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Inside your Escoroll workspace</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              After you sign in, the product is organized the same way as the sidebar in the app—core HR workflows, payroll records, and system tools in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <WorkspaceGroup label="Core" description="Day-to-day people and pay operations">
              <WorkspaceItem
                icon={LayoutDashboard}
                title="Dashboard"
                description="Headcount, payroll this month, pending leaves, and tax alerts—with recent payroll runs and activity at a glance."
              />
              <WorkspaceItem
                icon={Users}
                title="Employees"
                description="Search and manage your directory, departments, compensation, and roles from employee through admin."
              />
              <WorkspaceItem
                icon={DollarSign}
                title="Payroll"
                description="Create runs by period, move through validation and calculation, lock a run, and mark it paid with full gross, deductions, and net totals."
              />
              <WorkspaceItem
                icon={Clock}
                title="Attendance"
                description="Daily attendance grid with check-in/out, hours, overtime, and status—plus tools for teams that clock in from the app."
              />
              <WorkspaceItem
                icon={ClipboardList}
                title="Leave"
                description="Submit and review requests by type, approve or reject, and keep balances aligned with payroll."
              />
            </WorkspaceGroup>

            <WorkspaceGroup label="Records" description="Payslips, analytics, and accountability">
              <WorkspaceItem
                icon={FileText}
                title="Payslips"
                description="View earnings and line items—basic, HRA, allowances, PF, tax, ESI—preview slips, download, and email batches."
              />
              <WorkspaceItem
                icon={BarChart3}
                title="Reports & analytics"
                description="Financial and compliance-oriented views: annual payroll cost, average CTC, department cost breakdown, and exports."
              />
              <WorkspaceItem
                icon={Shield}
                title="Audit log"
                description="Searchable history of payroll locks, onboarding, exports, leave decisions, salary changes, and settings updates—with user and timestamp."
              />
            </WorkspaceGroup>

            <WorkspaceGroup label="System" description="Alerts and company controls">
              <WorkspaceItem
                icon={Bell}
                title="Notifications"
                description="Payroll events, leave approvals, attendance anomalies, tax deadlines, audit alerts, and system messages—filter read and unread."
              />
              <WorkspaceItem
                icon={Settings}
                title="Settings"
                description="Company legal profile (registration, PAN, GST), appearance, notification preferences, team management, and roles & permissions."
              />
            </WorkspaceGroup>
          </div>

          <div className="mt-8 rounded-2xl border border-primary/25 bg-primary/5 p-6 md:p-8 flex flex-col sm:flex-row gap-4 sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight mb-2">Platform overview (operators)</h3>
              <p className="text-muted-foreground leading-relaxed">
                Escoroll platform administrators get a dedicated <span className="text-foreground font-medium">Platform</span> area to provision companies, assign plans, activate users, and support tenants—separate from a single company&apos;s HR workspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Payroll lifecycle — matches Payroll run statuses in the app */}
      <section className="py-10 md:py-12 bg-background border-b border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">
            Payroll run lifecycle in the app
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {(["Draft", "Validating", "Calculated", "Locked", "Paid"] as const).map((stage, i, arr) => (
              <div key={stage} className="flex items-center gap-2 md:gap-3">
                <span className="rounded-full border bg-card px-3 py-1.5 text-sm font-medium shadow-sm">{stage}</span>
                {i < arr.length - 1 && (
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground hidden sm:block" aria-hidden />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6 max-w-xl mx-auto">
            Each run advances from draft through validation and calculation, then locks for compliance before you process payment—mirroring the actions on the Payroll page.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-14 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-14">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Powerful Features for Modern Teams</h2>
            <p className="text-lg text-muted-foreground">Scale your organization with tools built for speed and compliance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Users}
              title="Global Employee Directory"
              description="Manage multi-country teams with centralized profiles, document storage, and custom roles."
            />
            <FeatureCard
              icon={Handshake}
              title="Escrow Security"
              description="Industry-first escrow protection that safeguards payroll funds and guarantees payment schedules."
            />
            <FeatureCard
              icon={Clock}
              title="Smart Attendance"
              description="Geo-fenced clocking, automated time-sheets, and shift management in one intuitive interface."
            />
            <FeatureCard
              icon={FileText}
              title="Dynamic Payslips"
              description="Interactive, multi-currency payslips with detailed tax breakdowns and instant mobile access."
            />
            <FeatureCard
              icon={BarChart3}
              title="Advanced Analytics"
              description="Real-time insights into labor costs, headcount trends, and budget forecasting."
            />
            <FeatureCard
              icon={Globe}
              title="Multi-Regime Compliance"
              description="Automatic updates for regional labor laws and tax regulations across different jurisdictions."
            />
          </div>
        </div>
      </section>

      {/* Role-based access — aligns with app roles */}
      <section className="py-14 md:py-16 bg-muted/30 border-y border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-14">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Built for every role</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The same app adapts to administrators, HR, managers, and employees—matching how access is enforced after login.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <RoleCard
              icon={Shield}
              title="Admin"
              description="Full company control: employees, payroll progression, settings, exports, and visibility across audit and reports."
            />
            <RoleCard
              icon={Users}
              title="HR Manager"
              description="Run payroll operations, approve leave, manage onboarding, and keep payslips and attendance aligned with policy."
            />
            <RoleCard
              icon={Briefcase}
              title="Manager"
              description="Team-focused access: review leave for direct reports, track attendance, and stay informed without full org-wide admin tools."
            />
            <RoleCard
              icon={User}
              title="Employee"
              description="Self-service attendance and leave, notifications that matter to you, and payslips when payroll is finalized."
            />
          </div>
        </div>
      </section>

      {/* Enterprise Security Section */}
      <section className="py-14 md:py-16 bg-primary text-primary-foreground overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-8">Enterprise-Grade Security</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <SecurityStat icon={Lock} title="AES-256 Encryption" description="Data encrypted at rest and in transit." />
                <SecurityStat icon={ShieldCheck} title="ISO 27001 Certified" description="Compliant with global security standards." />
                <SecurityStat icon={CheckCircle2} title="Daily Backups" description="100% data durability and redundancy." />
                <SecurityStat icon={Users} title="Audit Logging" description="Track every action within your organization." />
              </div>
            </div>
            <div className="bg-background/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
              <h3 className="text-2xl font-bold mb-6">Security Compliance</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-accent mt-0.5" />
                  <div>
                    <h4 className="font-bold">SOC2 Type II Compliant</h4>
                    <p className="text-sm text-white/70">Verified operational security and data privacy excellence.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-accent mt-0.5" />
                  <div>
                    <h4 className="font-bold">GDPR & CCPA Ready</h4>
                    <p className="text-sm text-white/70">Full control over your data and individual privacy rights.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-accent mt-0.5" />
                  <div>
                    <h4 className="font-bold">Secure Escrow Accounts</h4>
                    <p className="text-sm text-white/70">Funds held in regulated financial institutions.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-14 md:py-16 bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">Everything you need to know about Escoroll.</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg font-bold">What is escrow-based payroll?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Escrow-based payroll involves placing salary funds into a secure, neutral account managed by a third party. This ensures that funds are available and guaranteed for release once the agreed-upon work conditions (like attendance) are met, protecting both the employer and the employee.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg font-bold">How does it ensure on-time payments?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                By requiring payroll to be funded upfront into the escrow, we remove the risk of last-minute cash flow issues. The automated release system then triggers payments exactly on the scheduled date, regardless of administrative delays.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg font-bold">Is my data secure?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Absolutely. We use bank-level AES-256 encryption, multi-factor authentication, and are SOC2 Type II compliant. Your data is backed up daily and stored across multiple secure geographic regions.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg font-bold">Can it handle international teams?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Yes, Escoroll is built for the global workforce. We support multi-currency payouts and stay updated with labor and tax compliance laws in over 120 countries.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-bold mb-5">Ready to Transform Your Payroll?</h2>
          <p className="text-xl text-muted-foreground mb-9 max-w-2xl mx-auto">
            Join thousands of modern organizations that trust Escoroll to protect their most valuable asset: their people.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-16 px-12 text-xl rounded-full" onClick={() => navigate("/register")}>
              Get Started for Free
            </Button>
            <Button size="lg" variant="ghost" className="h-16 px-12 text-xl rounded-full" onClick={() => navigate("/contact")}>
              Contact Sales
            </Button>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-5">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary rounded-full blur-[150px]" />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t bg-card/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 mb-10">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
                  <img src="/public/icon.png" alt="icon" />
                </div>
                <span className="font-bold text-xl">Escoroll</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Secure escrow-based payroll management for the modern global workforce.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Platform</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2026 Escoroll Technologies Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground">Twitter</a>
              <a href="#" className="hover:text-foreground">LinkedIn</a>
              <a href="#" className="hover:text-foreground">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="p-8 rounded-2xl border bg-card hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 group relative overflow-hidden">
    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors" />
    <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
      <Icon className="w-7 h-7" />
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

const StepCard = ({ number, title, description, icon: Icon }: { number: string, title: string, description: string, icon: any }) => (
  <div className="relative group">
    <div className="mb-6 flex items-center gap-4">
      <span className="text-5xl font-black text-primary/10 group-hover:text-primary/20 transition-colors">{number}</span>
      <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <h3 className="text-2xl font-bold mb-4">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

const SecurityStat = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="flex gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
    <Icon className="w-8 h-8 text-accent shrink-0" />
    <div>
      <h4 className="font-bold">{title}</h4>
      <p className="text-sm text-white/60">{description}</p>
    </div>
  </div>
);

const WorkspaceGroup = ({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: ReactNode;
}) => (
  <div className="rounded-2xl border bg-card p-6 shadow-sm">
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="text-sm text-muted-foreground mb-6">{description}</p>
    <ul className="space-y-5">{children}</ul>
  </div>
);

const WorkspaceItem = ({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) => (
  <li className="flex gap-3">
    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <h3 className="font-semibold text-sm leading-tight mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </li>
);

const RoleCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) => (
  <div className="rounded-2xl border bg-card p-6 shadow-sm transition-colors hover:border-primary/30">
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="font-bold mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

export default Intro;
