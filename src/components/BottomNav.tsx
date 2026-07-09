import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    FileText,
    Users,
    CreditCard,
    Settings,
    Plus,
    Menu,
    Home,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Navigation } from "./Navigation";
import { useState } from "react";
import { preloadPage } from "@/lib/preloader";

const bottomNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: FileText, label: "Invoices", path: "/invoices" },
    { icon: Plus, label: "New", path: "/create-invoice", isAction: true },
    { icon: Users, label: "Clients", path: "/clients" },
    { icon: Menu, label: "Menu", path: "#menu", isMenu: true },
];

export function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);

    return (
        <nav className="lg:hidden fixed bottom-6 left-0 right-0 z-50 px-4 pb-safe pointer-events-none">
            <div className="max-w-md mx-auto bg-background/80 dark:bg-slate-900/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-black/20 flex items-center justify-around h-16 px-2 pointer-events-auto">
                {bottomNavItems.map((item) => {
                    const isActive = location.pathname === item.path;

                    if (item.isMenu) {
                        return (
                            <Sheet key="mobile-menu" open={open} onOpenChange={setOpen}>
                                <SheetTrigger asChild>
                                    <button
                                        className={cn(
                                            "flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-90"
                                        )}
                                    >
                                        <item.icon className="w-5 h-5 mb-0.5" />
                                        <span>{item.label}</span>
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="left" className="p-0 w-[300px] border-r border-border/50 bg-background/95 backdrop-blur-3xl">
                                    <div className="flex flex-col h-full">
                                        <div className="p-4 md:p-8 bg-gradient-to-br from-primary/10 via-transparent to-indigo-500/5 border-b border-border/50">
                                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 shadow-inner">
                                                <Home className="w-8 h-8 text-primary" />
                                            </div>
                                            <SheetHeader className="text-left p-0">
                                                <SheetTitle className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600 dark:from-primary dark:to-indigo-400">
                                                    Escrow Bill
                                                </SheetTitle>
                                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Premium Edition</p>
                                            </SheetHeader>
                                        </div>
                                        <div className="flex-1 overflow-y-auto py-4">
                                            <Navigation className="w-full border-none bg-transparent" onItemClick={() => setOpen(false)} />
                                        </div>
                                        <div className="p-4 md:p-6 border-t border-border/50 bg-muted/20">
                                            <p className="text-[10px] text-center text-muted-foreground font-medium">v1.0.0 • Premium Edition</p>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        );
                    }

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            onMouseEnter={() => preloadPage(item.path)}
                            onTouchStart={() => preloadPage(item.path)}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[10px] transition-all duration-200 active:scale-95",
                                item.isAction
                                    ? "relative z-10"
                                    : isActive
                                        ? "text-primary scale-110"
                                        : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {item.isAction ? (
                                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/30 -mt-8 border-4 border-background transition-transform hover:scale-110 active:rotate-45">
                                    <item.icon className="w-6 h-6 text-white" />
                                </div>
                            ) : (
                                <>
                                    <item.icon className={cn("w-5 h-5 mb-0.5 transition-transform", isActive && "text-primary")} />
                                    <span className={cn("font-medium", isActive && "text-primary font-bold")}>
                                        {item.label}
                                    </span>
                                </>
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
