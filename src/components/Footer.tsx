import BrandLogo from '@/components/BrandLogo';
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Headphones } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-[#0B0F17] text-slate-400 text-xs py-10 sm:py-14 border-t border-slate-800/80 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid: Mobile single-column, tablet 2-column, desktop 12-column */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Column 1: Brand Info & Contact (Span 5 on large screens, full width on tablet) */}
          <div className="sm:col-span-2 lg:col-span-5 space-y-4">
            <BrandLogo size="lg" asLink to="/" textClassName="text-white" />

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Smart cloud billing, GST invoicing &amp; inventory management software built for Indian MSMEs and growing businesses.
            </p>

            {/* Badges / Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10">
                GST Ready
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold text-slate-300 border border-slate-700/60 bg-slate-800/40">
                Cloud Invoicing
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold text-slate-300 border border-slate-700/60 bg-slate-800/40">
                100% Encrypted
              </span>
            </div>

            {/* Company Info Header */}
            <div className="pt-2 sm:pt-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-white mb-3">
                ESCROW BMS
              </h4>

              <div className="space-y-2.5 text-xs text-slate-400">
                {/* Address */}
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <div>Ring Road, Surat, Gujarat, 395002</div>
                    <div>Connaught Place, New Delhi, 110001</div>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a 
                    href="tel:+919328028207" 
                    className="hover:text-emerald-400 transition-colors"
                  >
                    +91 93280 28207 (Office)
                  </a>
                </div>

                {/* Email 1 */}
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <a 
                    href="mailto:support@escrowbms.com" 
                    className="hover:text-white transition-colors"
                  >
                    support@escrowbms.com
                  </a>
                </div>

                {/* Email 2 */}
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <a 
                    href="mailto:contact@ash-techsolutions.com" 
                    className="hover:text-white transition-colors"
                  >
                    contact@ash-techsolutions.com (Legal)
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: FEATURES (Span 2) */}
          <div className="sm:col-span-1 lg:col-span-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4">
              FEATURES
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li><Link to="/#features" className="hover:text-white transition-colors">All Features</Link></li>
              <li><Link to="/billing/invoices" className="hover:text-white transition-colors">Sales Invoices</Link></li>
              <li><Link to="/billing/invoices" className="hover:text-white transition-colors">GST Tax Billing</Link></li>
              <li><Link to="/billing/e-invoice" className="hover:text-white transition-colors">E-Invoice &amp; E-Way Bill</Link></li>
              <li><Link to="/billing/purchases" className="hover:text-white transition-colors">Purchase Invoices</Link></li>
              <li><Link to="/inventory/products" className="hover:text-white transition-colors">Products &amp; Inventory</Link></li>
              <li><Link to="/daily-hisab" className="hover:text-white transition-colors">Payments &amp; Cashbook</Link></li>
              <li><Link to="/ledger/expenses" className="hover:text-white transition-colors">Expense Tracking</Link></li>
              <li><Link to="/billing/reports" className="hover:text-white transition-colors">GSTR Reports</Link></li>
            </ul>
          </div>

          {/* Column 3: COMPANY (Span 2) */}
          <div className="sm:col-span-1 lg:col-span-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4">
              COMPANY
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li><Link to="/about" className="hover:text-white transition-colors">About Escrow BMS</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Why Escrow BMS</Link></li>
              <li><Link to="/#reviews" className="hover:text-white transition-colors">Client Reviews</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">CA Partners</Link></li>
              <li><Link to="/users/staff" className="hover:text-white transition-colors">Staff &amp; Roles</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
              <li>
                <Link to="/pricing" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                  Pricing Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: RESOURCES & TOOLS + Need Help Card (Span 3) */}
          <div className="sm:col-span-2 lg:col-span-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4">
              RESOURCES &amp; TOOLS
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li><Link to="/tools/gst-calculator" className="hover:text-white transition-colors">Free GST Calculator</Link></li>
              <li><Link to="/inventory/products" className="hover:text-white transition-colors">HSN / SAC Code Finder</Link></li>
              <li><Link to="/billing/invoices" className="hover:text-white transition-colors">Thermal &amp; A4 Formats</Link></li>
              <li><Link to="/#whatsapp" className="hover:text-white transition-colors">WhatsApp Bill Sharing</Link></li>
              <li><Link to="/#faq" className="hover:text-white transition-colors">Help Center &amp; FAQs</Link></li>
            </ul>

            {/* Need Help or Demo? Card */}
            <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Headphones className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Need Help or Demo?</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Have questions about GST billing or onboarding? Our team is here to assist.
              </p>
              <a
                href="tel:+919328028207"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 mt-2.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>Call +91 93280 28207</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Stacked neatly on mobile */}
        <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="space-y-1 text-center sm:text-left">
            <div>&copy; {new Date().getFullYear()} Escrow BMS. All rights reserved.</div>
            <div className="text-[11px] text-slate-500">
              Escrow BMS is a registered product of Escrow BMS, Managed by{" "}
              <a
                href="https://ash-techsolutions.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white font-medium transition-colors"
              >
                ASH-TECH SOLUTIONS
              </a>.
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs text-slate-400">
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <span className="text-slate-700">|</span>
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
            <span className="text-slate-700">|</span>
            <Link to="/refund-policy" className="hover:text-white transition-colors">Refunds</Link>
            <span className="text-slate-700">|</span>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <span className="text-slate-700">|</span>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
