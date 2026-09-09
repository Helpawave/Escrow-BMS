import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Plus,
  Receipt,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { pages } from "@/lib/pageImports";
import { prefetchPage } from "@/utils/prefetch";
import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface NavigationProps {
  className?: string;
  onItemClick?: () => void;
}

interface NavSubItem {
  label: string;
  path: string;
  importKey: string;
  permissionKey?: string;
}

interface NavItem {
  icon: any;
  label: string;
  path?: string;
  importKey?: string;
  permissionKey?: string;
  subItems?: NavSubItem[];
}

const allNavigationItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", importKey: "Dashboard", permissionKey: "dashboard" },
  {
    icon: FileText,
    label: "Invoices",
    path: "/invoices",
    permissionKey: "invoices",
    subItems: [
      { label: "Sales Invoices", path: "/invoices", importKey: "Invoices", permissionKey: "invoices" },
      { label: "Purchase Bills", path: "/purchase-invoices", importKey: "PurchaseInvoices", permissionKey: "purchase-invoices" }
    ]
  },
  {
    icon: Users,
    label: "Clients",
    path: "/clients",
    permissionKey: "clients",
    subItems: [
      { label: "Manage Clients", path: "/clients", importKey: "Clients", permissionKey: "clients" },
      { label: "Manage Vendors", path: "/vendors", importKey: "Vendors", permissionKey: "vendors" }
    ]
  },
  { icon: Receipt, label: "Products", path: "/products", importKey: "Products", permissionKey: "products" },
  {
    icon: CreditCard,
    label: "Payments",
    path: "/payments",
    permissionKey: "payments",
    subItems: [
      { label: "Sales Payments", path: "/payments", importKey: "Payments", permissionKey: "payments" },
      { label: "Purchase Payments", path: "/purchase-payments", importKey: "Payments", permissionKey: "payments" }
    ]
  },
  { icon: Receipt, label: "Expenses", path: "/expenses", importKey: "Expenses", permissionKey: "expenses" },
  { icon: FileText, label: "E-Invoice", path: "/einvoice", importKey: "EInvoice", permissionKey: "einvoice" },
  { icon: BarChart3, label: "Reports", path: "/reports", importKey: "Reports", permissionKey: "reports" },
  { icon: ShieldCheck, label: "Roles & Permissions", path: "/roles-permissions", importKey: "RolesPermissions", permissionKey: "roles-permissions" },
  { icon: User, label: "Profile", path: "/settings", importKey: "Settings", permissionKey: "settings" },
];

export function Navigation({ className, onItemClick }: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isStaff, hasPermission } = useAuth();
  
  const [openAccordion, setOpenAccordion] = useState<string | null>(() => {
    const initialMatch = allNavigationItems.find(item =>
      item.subItems?.some(si => si.path === window.location.pathname || (si.path !== '/' && window.location.pathname.startsWith(si.path)))
    );
    return initialMatch ? initialMatch.label : null;
  });

  const prevPathRef = useRef(location.pathname);

  // Filter navigation items dynamically based on role & permissions
  const visibleNavigationItems = useMemo(() => {
    if (!isStaff) {
      return allNavigationItems;
    }

    // For Staff users:
    // 1. Dashboard and Reports are strictly forbidden
    // 2. Roles & Permissions is strictly forbidden
    // 3. Only permitted tabs will be shown
    // 4. Profile / Settings is always visible
    return allNavigationItems
      .filter(item => {
        if (item.permissionKey === 'dashboard' || item.permissionKey === 'reports' || item.permissionKey === 'roles-permissions') {
          return false;
        }
        if (item.permissionKey === 'settings') {
          return true;
        }

        if (item.subItems && item.subItems.length > 0) {
          const permittedSubItems = item.subItems.filter(si => !si.permissionKey || hasPermission(si.permissionKey));
          return permittedSubItems.length > 0;
        }

        return !item.permissionKey || hasPermission(item.permissionKey);
      })
      .map(item => {
        if (item.subItems && item.subItems.length > 0) {
          const filteredSub = item.subItems.filter(si => !si.permissionKey || hasPermission(si.permissionKey));
          return {
            ...item,
            subItems: filteredSub
          };
        }
        return item;
      });
  }, [isStaff, hasPermission]);

  // Sync with route transitions: auto-expand parent if navigating into subItems, auto-collapse if navigating out
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;

      const matchingParent = visibleNavigationItems.find(item =>
        item.subItems?.some(si => si.path === location.pathname || (si.path !== '/' && location.pathname.startsWith(si.path)))
      );

      if (matchingParent) {
        setOpenAccordion(matchingParent.label);
      } else {
        setOpenAccordion(null);
      }
    }
  }, [location.pathname, visibleNavigationItems]);

  const handleParentClick = (item: NavItem) => {
    const primaryPath = item.path || (item.subItems && item.subItems[0]?.path);
    
    // If navigating from another route, navigate to primary page and open accordion
    if (primaryPath && location.pathname !== primaryPath) {
      navigate(primaryPath);
      setOpenAccordion(item.label);
      onItemClick?.();
    } else {
      // If already on that page, clicking directly toggles (collapses/expands)
      setOpenAccordion(prev => (prev === item.label ? null : item.label));
    }
  };

  const handleCreateInvoice = () => {
    navigate('/create-invoice');
    onItemClick?.();
  };

  const handlePrefetch = (key?: string) => {
    if (!key) return;
    const importFn = pages[key as keyof typeof pages];
    if (importFn) {
      prefetchPage(importFn);
    }
  };

  const canCreateInvoice = !isStaff || hasPermission('invoices');

  return (
    <aside className={cn("w-64 bg-background border-r border-border", className)}>
      {canCreateInvoice && (
        <div className="p-4 md:p-6">
          <Button
            className="w-full shadow-sm font-semibold"
            onClick={handleCreateInvoice}
            onMouseEnter={() => handlePrefetch("CreateInvoice")}
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </div>
      )}

      <nav className={cn("px-4 pb-4", !canCreateInvoice && "pt-4")}>
        <ul className="space-y-1">
          {visibleNavigationItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = openAccordion === item.label;
            const isCurrentRouteInSubItems = hasSubItems && item.subItems?.some(si => si.path === location.pathname || (si.path !== '/' && location.pathname.startsWith(si.path)));
            const isCurrentRouteDirect = location.pathname === item.path || (item.path && item.path !== '/' && location.pathname.startsWith(item.path));
            const isActive = isCurrentRouteDirect || isCurrentRouteInSubItems;

            return (
              <li key={item.label} className="space-y-1">
                {hasSubItems ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleParentClick(item)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md transition-all text-sm font-medium",
                        isActive
                          ? "text-primary bg-primary/5 font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      onMouseEnter={() => handlePrefetch(item.subItems?.[0]?.importKey)}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {isExpanded && (
                      <ul className="ml-7 space-y-1 mt-1 border-l border-border/50 pl-2">
                        {item.subItems?.map((subItem) => {
                          const isSubActive = location.pathname === subItem.path;
                          return (
                            <li key={subItem.label}>
                              <Link
                                to={subItem.path}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-1.5 rounded-md transition-all text-xs font-medium",
                                  isSubActive
                                    ? "bg-secondary text-primary font-semibold"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                                onClick={() => onItemClick?.()}
                                onMouseEnter={() => handlePrefetch(subItem.importKey)}
                              >
                                {subItem.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : item.path ? (
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm font-medium",
                      isActive
                        ? "bg-secondary text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    onClick={() => {
                      setOpenAccordion(null);
                      onItemClick?.();
                    }}
                    onMouseEnter={() => handlePrefetch(item.importKey)}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
