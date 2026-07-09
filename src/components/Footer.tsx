import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-border mt-auto bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center space-x-3 group">
            <div className="p-1.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <img 
                src="/assets/images/e9085822-5bea-4642-b19e-dcfcde6248f7.png" 
                alt="ESCROWBILL Logo" 
                className="w-8 h-8 object-contain"
                loading="lazy"
              />
            </div>
            <span className="text-xl font-black text-foreground tracking-tighter">ESCROWBILL</span>
          </div>
          
          <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4" aria-label="Footer Navigation">
            <Link 
              to="/" 
              className="text-muted-foreground hover:text-primary font-bold text-sm transition-colors"
              title="Return to home page"
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className="text-muted-foreground hover:text-primary font-bold text-sm transition-colors"
              title="Learn about Escrow Bill"
            >
              About Us
            </Link>
            <Link 
              to="/contact" 
              className="text-muted-foreground hover:text-primary font-bold text-sm transition-colors"
              title="Get support and contact information"
            >
              Support & Contact
            </Link>
            <Link 
              to="/terms" 
              className="text-muted-foreground hover:text-primary font-bold text-sm transition-colors"
              title="Read our terms of service and privacy policies"
            >
              Terms & Conditions
            </Link>
            <Link 
              to="/privacy-policy" 
              className="text-muted-foreground hover:text-primary font-bold text-sm transition-colors"
              title="Read our privacy policy"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/refund-policy" 
              className="text-muted-foreground hover:text-primary font-bold text-sm transition-colors"
              title="Read our cancellation and refund policy"
            >
              Refund Policy
            </Link>
            <Link 
              to="/pricing" 
              className="text-muted-foreground hover:text-primary font-bold text-sm transition-colors"
              title="View our simple, transparent pricing plans"
            >
              Pricing
            </Link>
          </nav>
        </div>
        
        <div className="mt-10 pt-8 border-t border-border/60 text-center">
          <p className="text-muted-foreground text-sm font-medium tracking-tight">
            &copy; {new Date().getFullYear()} ESCROWBILL. 
            A product of <span className="text-foreground font-bold">Escrow BMS</span>. 
            Managed by <a 
              href="https://ash-techsolutions.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:underline font-bold"
              title="Visit ASH-TECH SOLUTIONS website"
            >
              ASH-TECH SOLUTIONS
            </a>. 
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
