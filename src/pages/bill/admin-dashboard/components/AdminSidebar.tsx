import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BrandLogo from '@/components/BrandLogo';
import { cn } from '@/lib/utils';
import { X, LogOut } from 'lucide-react';

export interface AdminNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number | null;
  badgeColor?: string;
}

interface AdminSidebarProps {
  navItems: AdminNavItem[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  navItems,
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onLogout,
}) => {
  return (
    <>
      {/* Mobile Navigation Drawer */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out",
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={cn(
            "w-[280px] h-full bg-background border-r border-border shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col justify-between",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b flex items-center justify-between bg-muted/30 shrink-0">
            <div className="flex items-center gap-2">
              <BrandLogo size="md" />
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">Admin</Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close navigation menu" className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4 space-y-1 overflow-hidden">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all text-sm font-semibold",
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    activeTab === item.id ? "bg-white/20 text-white" : item.badgeColor
                  )}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-border bg-muted/20 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Sidebar matching main website Navigation style */}
      <aside className="hidden lg:flex w-64 bg-background border-r border-border flex-col justify-between shrink-0 h-full overflow-hidden select-none">
        {/* Desktop Navigation Items */}
        <div className="p-3">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                  activeTab === item.id
                    ? "bg-secondary text-primary font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-4 h-4", activeTab === item.id ? "text-primary" : "text-muted-foreground")} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", item.badgeColor)}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Desktop Sidebar Footer - Fixed at the very bottom/last */}
        <div className="p-4 border-t border-border bg-muted/10 shrink-0 mt-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
};

