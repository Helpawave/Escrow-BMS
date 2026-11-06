import BrandLogo from '@/components/BrandLogo';
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  Sun, 
  Moon, 
  Menu, 
  X, 
  FileText, 
  Receipt, 
  BookOpen, 
  Package, 
  Users, 
  Wallet, 
  Building2, 
  ShoppingBag, 
  Scissors, 
  HeartPulse, 
  Factory,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from "lucide-react";

export const PublicNavbar = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);

  const featuresRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile drawer on route change or resize
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (featuresRef.current && !featuresRef.current.contains(e.target as Node)) {
        setFeaturesOpen(false);
      }
      if (solutionsRef.current && !solutionsRef.current.contains(e.target as Node)) {
        setSolutionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavClick = (hash: string) => {
    setMobileMenuOpen(false);
    setFeaturesOpen(false);
    setSolutionsOpen(false);
    if (location.pathname === "/") {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    navigate(`/${hash}`);
  };

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 w-full ${
        scrolled 
          ? "bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-sm border-b border-slate-200/80 dark:border-slate-800/80 py-2.5 sm:py-3" 
          : "bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 py-3 sm:py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <BrandLogo size="lg" asLink to="/" />

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-700 dark:text-slate-300">
          
          {/* Features Dropdown */}
          <div 
            ref={featuresRef}
            className="relative"
            onMouseEnter={() => setFeaturesOpen(true)}
            onMouseLeave={() => setFeaturesOpen(false)}
          >
            <button 
              onClick={() => setFeaturesOpen(!featuresOpen)}
              className="flex items-center gap-1 py-2 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              <span>Features</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${featuresOpen ? 'rotate-180' : ''}`} />
            </button>

            {featuresOpen && (
              <div className="absolute top-full -left-4 w-72 pt-2 z-50">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 grid gap-1.5 animate-in fade-in-50 zoom-in-95 duration-150">
                  <button 
                    onClick={() => handleNavClick("#features")}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">GST Invoicing</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Tax bills, quotations &amp; challans</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleNavClick("#features")}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">E-Way Bill &amp; E-Invoice</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Direct NIC portal 1-click filing</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleNavClick("#features")}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Party Ledgers &amp; Khata</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Running balances &amp; auto-posting</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleNavClick("#features")}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Inventory &amp; Stock</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Batch, barcode &amp; low stock alerts</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Solutions Dropdown */}
          <div 
            ref={solutionsRef}
            className="relative"
            onMouseEnter={() => setSolutionsOpen(true)}
            onMouseLeave={() => setSolutionsOpen(false)}
          >
            <button 
              onClick={() => setSolutionsOpen(!solutionsOpen)}
              className="flex items-center gap-1 py-2 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              <span>Solutions</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${solutionsOpen ? 'rotate-180' : ''}`} />
            </button>

            {solutionsOpen && (
              <div className="absolute top-full -left-12 w-80 pt-2 z-50">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 grid gap-1.5 animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    By Industry
                  </div>
                  
                  <button 
                    onClick={() => handleNavClick("#industries")}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Wholesale &amp; Distribution</span>
                  </button>

                  <button 
                    onClick={() => handleNavClick("#industries")}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Retail &amp; Supermarkets</span>
                  </button>

                  <button 
                    onClick={() => handleNavClick("#industries")}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <Factory className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Manufacturing &amp; Mills</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <Link to="/pricing" className="hover:text-slate-950 dark:hover:text-white transition-colors">
            Pricing
          </Link>

          <button 
            onClick={() => handleNavClick("#faq")}
            className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            FAQ
          </button>
        </nav>

        {/* Right Action Items */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            title="Toggle Light / Dark mode"
            className="p-2 text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />}
          </button>

          {/* Sign In Link - Desktop & Tablet only */}
          {user ? (
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-slate-950 dark:hover:text-white transition-colors px-2 py-1"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/auth"
              className="hidden sm:inline-flex text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-slate-950 dark:hover:text-white transition-colors px-2 py-1"
            >
              Sign In
            </Link>
          )}

          {/* Get Started Pill Button - Desktop & Tablet */}
          <button
            onClick={handleGetStarted}
            className="hidden md:inline-flex bg-[#1a73e8] hover:bg-[#1557b0] active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-md shadow-blue-500/25 transition-all duration-200 cursor-pointer"
          >
            Get Started
          </button>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ── MOBILE MENU DRAWER ── */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 top-[57px] sm:top-[65px] bg-black/50 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu Drawer */}
          <div className="lg:hidden fixed top-[57px] sm:top-[65px] left-0 right-0 z-50 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-5 py-5 space-y-4 shadow-2xl max-h-[calc(100vh-65px)] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-1 text-sm font-bold text-slate-800 dark:text-slate-200">
              <button 
                onClick={() => handleNavClick("#features")} 
                className="text-left px-3.5 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center justify-between"
              >
                <span>Features &amp; GST Invoicing</span>
                <span className="text-slate-400 text-xs">→</span>
              </button>
              
              <button 
                onClick={() => handleNavClick("#services")} 
                className="text-left px-3.5 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center justify-between"
              >
                <span>All ERP Modules &amp; Ledgers</span>
                <span className="text-slate-400 text-xs">→</span>
              </button>
              
              <Link 
                to="/pricing" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-left px-3.5 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center justify-between"
              >
                <span>Pricing Plans</span>
                <span className="text-slate-400 text-xs">→</span>
              </Link>
              
              <button 
                onClick={() => handleNavClick("#faq")} 
                className="text-left px-3.5 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center justify-between"
              >
                <span>Help Center &amp; FAQ</span>
                <span className="text-slate-400 text-xs">→</span>
              </button>
              
              <Link 
                to="/about" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-left px-3.5 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center justify-between"
              >
                <span>About Escrow BMS</span>
                <span className="text-slate-400 text-xs">→</span>
              </Link>
            </nav>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
              <Link 
                to={user ? "/dashboard" : "/auth"} 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 font-bold text-sm text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl active:scale-[0.99] transition-all"
              >
                {user ? "Open Dashboard" : "Sign In to Account"}
              </Link>
              <button
                onClick={() => { setMobileMenuOpen(false); handleGetStarted(); }}
                className="w-full py-3 font-bold text-sm bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl shadow-md shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start 14-Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default PublicNavbar;
