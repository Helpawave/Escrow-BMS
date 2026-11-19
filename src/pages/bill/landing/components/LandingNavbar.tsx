import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, CreditCard, FileText, Menu, X, Zap } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface LandingNavbarProps {
  isScrolled: boolean;
  user: User | null;
  onSelectSolution: (tab: "retail" | "textile" | "automobile" | "cafe") => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  isScrolled,
  user,
  onSelectSolution,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-350 ${
        isScrolled ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm py-2" : "bg-transparent py-3"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center space-x-2 shrink-0">
          <picture className="inline-flex items-center shrink-0">
            <source srcSet="/assets/images/logo-128.webp" type="image/webp" />
            <img
              src="/assets/images/logo-128.png"
              alt=""
              aria-hidden="true"
              width={40}
              height={40}
              className="w-10 h-10 object-contain hover:rotate-12 transition-transform duration-300"
            />
          </picture>
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            ESCROW<span className="text-emerald-700 dark:text-emerald-400">BILL</span>
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <nav className="flex items-center space-x-8" aria-label="Main Navigation">
            {/* Features Menu with Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setActiveDropdown("features")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button 
                type="button"
                aria-expanded={activeDropdown === "features"}
                onClick={() => setActiveDropdown(activeDropdown === "features" ? null : "features")}
                className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors py-2 flex items-center gap-1"
              >
                Features
                <span className="text-[10px] text-slate-600 dark:text-slate-400">▼</span>
              </button>
              
              <AnimatePresence>
                {activeDropdown === "features" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-1 w-[480px] bg-background border border-border shadow-2xl rounded-2xl p-6 grid grid-cols-2 gap-4"
                  >
                    <a href="#features" className="flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-900 p-2 rounded-xl transition-all cursor-pointer">
                      <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-foreground">GST Invoicing</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Compliant templates & HSN tracking</p>
                      </div>
                    </a>
                    <a href="#reminders" className="flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-900 p-2 rounded-xl transition-all cursor-pointer">
                      <Zap className="w-5 h-5 text-yellow-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-foreground">Auto Reminders</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">SMS, WhatsApp & email notifications</p>
                      </div>
                    </a>
                    <a href="#payments" className="flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-900 p-2 rounded-xl transition-all cursor-pointer">
                      <CreditCard className="w-5 h-5 text-green-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-foreground">Secure Payments</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Automated reconciliation via UPI</p>
                      </div>
                    </a>
                    <a href="#analytics" className="flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-900 p-2 rounded-xl transition-all cursor-pointer">
                      <BarChart3 className="w-5 h-5 text-purple-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-foreground">Reports & Ledgers</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Tax calculations & CA-ready reports</p>
                      </div>
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Solutions Menu with Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setActiveDropdown("solutions")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button 
                type="button"
                aria-expanded={activeDropdown === "solutions"}
                onClick={() => setActiveDropdown(activeDropdown === "solutions" ? null : "solutions")}
                className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors py-2 flex items-center gap-1"
              >
                Solutions
                <span className="text-[10px] text-slate-600 dark:text-slate-400">▼</span>
              </button>
              
              <AnimatePresence>
                {activeDropdown === "solutions" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-1 w-[440px] bg-background border border-border shadow-2xl rounded-2xl p-4 grid grid-cols-2 gap-2.5 z-50"
                  >
                    <button 
                      onClick={() => {
                        onSelectSolution("retail");
                        setActiveDropdown(null);
                      }}
                      className="text-left w-full block hover:bg-slate-100 dark:hover:bg-slate-800/80 p-2.5 rounded-xl transition-all cursor-pointer bg-transparent border border-transparent hover:border-border focus:outline-none"
                    >
                      <p className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <span>🏪</span> Retail & Shops
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Quick barcode billing & checkout</p>
                    </button>
                    <button 
                      onClick={() => {
                        onSelectSolution("textile");
                        setActiveDropdown(null);
                      }}
                      className="text-left w-full block hover:bg-slate-100 dark:hover:bg-slate-800/80 p-2.5 rounded-xl transition-all cursor-pointer bg-transparent border border-transparent hover:border-border focus:outline-none"
                    >
                      <p className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <span>🧵</span> Textile Industry
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Fabric mills, sarees & wholesale khata</p>
                    </button>
                    <button 
                      onClick={() => {
                        onSelectSolution("automobile");
                        setActiveDropdown(null);
                      }}
                      className="text-left w-full block hover:bg-slate-100 dark:hover:bg-slate-800/80 p-2.5 rounded-xl transition-all cursor-pointer bg-transparent border border-transparent hover:border-border focus:outline-none"
                    >
                      <p className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <span>🚗</span> Automobile Industry
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Dealerships, downpayments & garage job-cards</p>
                    </button>
                    <button 
                      onClick={() => {
                        onSelectSolution("cafe");
                        setActiveDropdown(null);
                      }}
                      className="text-left w-full block hover:bg-slate-100 dark:hover:bg-slate-800/80 p-2.5 rounded-xl transition-all cursor-pointer bg-transparent border border-transparent hover:border-border focus:outline-none"
                    >
                      <p className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <span>☕</span> Cafe POS & Restaurant
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Live KDS tickets & 3-inch thermal POS</p>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/pricing" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors relative group">
              Pricing
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </Link>
            <a href="#faq" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors relative group">
              FAQ
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </a>
          </nav>
          <div className="flex items-center space-x-4 border-l border-border pl-8">
            <ThemeToggle />
            {user ? (
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-full px-8 h-11 font-bold" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="font-bold" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 rounded-full px-8 h-11 font-black" asChild>
                  <Link to="/auth?view=signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/99 backdrop-blur-3xl border-b border-border shadow-2xl overflow-hidden"
          >
            <nav className="flex flex-col p-4 md:p-6 space-y-4" aria-label="Mobile Navigation">
              <a href="#solutions" className="text-lg font-bold hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>User Types & Industries</a>
              <a href="#features" className="text-lg font-bold hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <Link to="/pricing" className="text-lg font-bold hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link to="/about" className="text-lg font-bold hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
              <Link to="/contact" className="text-lg font-bold hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Contact Support</Link>
              <a href="#faq" className="text-lg font-bold hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
              <div className="pt-4 border-t border-border flex flex-col space-y-4">
                {user ? (
                  <Button className="w-full h-12 rounded-xl bg-primary shadow-lg shadow-primary/20 font-bold" asChild>
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>Go to Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Link to="/auth?view=login" className="text-center font-bold py-2 hover:bg-muted rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                    <Button className="w-full h-12 rounded-xl font-black bg-primary shadow-lg shadow-primary/20" asChild>
                      <Link to="/auth?view=signup" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
