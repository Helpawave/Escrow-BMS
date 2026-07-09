import { Header } from "@/components/Header";
import { Navigation } from "@/components/Navigation";
import { ScrollToTop } from "@/components/ScrollToTop";
import BroadcastModal from "@/components/BroadcastModal";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { SubscriptionModal } from "./SubscriptionModal";
import { MobileNumberRequiredModal } from "./MobileNumberRequiredModal";

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { isSubscribed, loading } = useAuth();
  
  const showSubscriptionModal = isSubscribed === false && !loading;



  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <ScrollToTop />
      <BroadcastModal />
      <MobileNumberRequiredModal />
      {showSubscriptionModal && (
        <SubscriptionModal />
      )}
      
      <div className={cn(
        "flex flex-1 relative overflow-hidden",
        showSubscriptionModal && "blur-[1px] pointer-events-none grayscale-[0.2]"
      )}>
        {/* Mobile Navigation Sidebar */}
        <div 
          className={cn(
            "lg:hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out",
            isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className={cn(
              "w-[280px] h-full bg-background border-r border-border shadow-2xl transition-transform duration-300 ease-in-out transform",
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                  <img 
                    src="/assets/images/e9085822-5bea-4642-b19e-dcfcde6248f7.png" 
                    alt="Logo" 
                    className="w-6 h-6 object-contain"
                  />
                  <span className="font-bold text-lg tracking-tight">ESCROWBILL</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Navigation onItemClick={() => setIsMobileMenuOpen(false)} className="w-full border-r-0" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:block shrink-0">
          <Navigation className="h-full sticky top-0" />
        </div>
        
        <main className="flex-1 min-w-0 flex flex-col relative">
          {/* Mobile top bar with menu trigger */}
          <div className="lg:hidden flex items-center justify-between p-3 bg-background border-b sticky top-0 z-40">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest h-9 px-3 border-2 border-primary/20 text-primary"
            >
              <Menu className="h-4 w-4" />
              Menu
            </Button>
            <div className="flex items-center gap-2" />
          </div>

          <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
