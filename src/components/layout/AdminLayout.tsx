import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Users, Shield, LogOut, BarChart3, Settings, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { adminUser, adminLogout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
    toast({
      title: "Admin logged out",
      description: "You have been logged out of the admin panel"
    });
  };

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center animate-fade-in">
          <div className="mb-6">
            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              You need admin privileges to access this area.
            </p>
          </div>
          <Link to="/admin/login">
            <Button>
              <Shield className="w-4 h-4 mr-2" />
              Admin Login
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-8">
              <Link to="/admin/dashboard" className="flex items-center gap-2">
                <img src="/logo.png" alt="Escrow Daily Hisab" className="w-6 h-6 sm:w-8 sm:h-8" />
                <span className="text-base sm:text-xl font-bold">Admin Panel</span>
              </Link>

              <div className="hidden md:flex space-x-1">
                <Link to="/admin/dashboard">
                  <Button 
                    variant={isActive('/admin/dashboard') ? 'default' : 'ghost'}
                    className="transition-all duration-200"
                    size="sm"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/admin/users">
                  <Button 
                    variant={isActive('/admin/users') ? 'default' : 'ghost'}
                    className="transition-all duration-200"
                    size="sm"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    User Management
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-4">
              {/* Mobile Menu */}
              <div className="block md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="px-2">
                      <Menu className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/admin/dashboard" className="cursor-pointer">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/users" className="cursor-pointer">
                        <Users className="mr-2 h-4 w-4" />
                        User Management
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="destructive" className="text-xs">Admin</Badge>
                        <span className="text-xs text-muted-foreground">{adminUser.name}</span>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="hidden md:flex items-center space-x-2">
                <Badge variant="destructive" className="bg-gradient-to-r from-orange-500 to-red-600">
                  Admin
                </Badge>
                <Badge variant="outline">{adminUser.name}</Badge>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm" className="px-2 sm:px-3 min-w-0">
                <LogOut className="w-4 h-4" />
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
};
