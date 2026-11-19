import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BrandLogo from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menu,
  Shield,
  ShieldCheck,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';

interface AdminHeaderProps {
  onOpenMobileMenu: () => void;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onOpenMobileMenu,
  onSelectTab,
  onLogout,
}) => {
  return (
    <header className="bg-background border-b border-border px-4 md:px-6 py-2.5 md:py-3 shrink-0 z-40 backdrop-blur-md bg-background/95">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenMobileMenu}
            aria-label="Toggle navigation menu"
            className="lg:hidden flex items-center gap-1.5 font-bold text-xs h-9 px-2.5 border-border"
          >
            <Menu className="h-4 w-4" />
            <span>Menu</span>
          </Button>
          <BrandLogo size="md" asLink to="/admin/dashboard" />
          <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1.5 bg-primary/10 text-primary border-primary/20 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            <Shield className="w-3 h-3 text-primary" />
            Admin Console
          </Badge>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Admin Profile Menu" className="h-9 w-9 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border z-50">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    Super Administrator
                  </p>
                  <p className="text-xs text-muted-foreground">admin@escrowbill.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSelectTab('overview')} className="cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard Overview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSelectTab('users')} className="cursor-pointer">
                <Users className="mr-2 h-4 w-4" />
                Users & Businesses
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSelectTab('system')} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                System Security
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-rose-600 focus:text-rose-600 font-semibold cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Logout Admin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

