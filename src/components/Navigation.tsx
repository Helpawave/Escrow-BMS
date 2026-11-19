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
  UtensilsCrossed,
  Coffee,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { pages } from "@/lib/pageImports";
import { prefetchPage } from "@/utils/prefetch";
import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/hooks/useUserType";

interface NavigationProps {
  className?: string;
  onItemClick?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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

export function Navigation({ className, onItemClick, isCollapsed = false, onToggleCollapse }: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isStaff, hasPermission, staffPermissions } = useAuth();
  const { isAutomobile, isCafe } = useUserType();
  const { profile, companyProfile } = useAuth();
  
  const isEffectiveCafe = isCafe || (isStaff && staffPermissions?.includes('kitchen'));
  
  const [openAccordion, setOpenAccordion] = useState<string | null>(() => {
    const initialMatch = allNavigationItems.find(item =>
      item.subItems?.some(si => si.path === window.location.pathname || (si.path !== '/' && window.location.pathname.startsWith(si.path)))
    );
    return initialMatch ? initialMatch.label : null;
  });

  const prevPathRef = useRef(location.pathname);

  // Filter navigation items dynamically based on role & permissions
  const visibleNavigationItems = useMemo(() => {
    let baseItems: NavItem[] = allNavigationItems;

    // Apply industry customization first so permission keys match industry specific modules
    if (isAutomobile) {
      baseItems = baseItems.map(item => {
        if (item.label === 'Invoices' && item.subItems) {
          const updatedSubItems = item.subItems.map(si => {
            if (si.path === '/invoices') {
              return { ...si, label: "Sales & Services" };
            }
            return si;
          });
          const hasDownpayment = updatedSubItems.some(si => si.path.includes('downpayment'));
          return {
            ...item,
            subItems: hasDownpayment ? updatedSubItems : [
              ...updatedSubItems,
              { label: "Downpayment Invoices", path: "/downpayment-invoices", importKey: "DownpaymentInvoices", permissionKey: "downpayment-invoices" }
            ]
          };
        }
        if (item.label === 'Payments' && item.subItems) {
          const updatedSubItems = item.subItems.map(si => {
            if (si.path === '/payments') {
              return { ...si, label: "Sales & Services Payments" };
            }
            return si;
          });
          const hasDp = updatedSubItems.some(si => si.path.includes('downpayment'));
          return {
            ...item,
            subItems: hasDp ? updatedSubItems : [
              ...updatedSubItems,
              { label: "Downpayment Receipts", path: "/payments?type=downpayment", importKey: "Payments", permissionKey: "payments" }
            ]
          };
        }
        return item;
      });
    }

    if (isEffectiveCafe) {
      baseItems = baseItems.map(item => {
        if (item.path === '/einvoice') {
          return {
            icon: UtensilsCrossed,
            label: "Kitchen",
            path: "/kitchen",
            importKey: "Kitchen",
            permissionKey: "kitchen"
          };
        }
        if (item.label === 'Invoices') {
          return {
            ...item,
            label: "Orders & Bills",
            subItems: [
              { label: "Cafe POS Counter", path: "/create-invoice", importKey: "CreateInvoice", permissionKey: "invoices" },
              { label: "Order & Bill History", path: "/invoices", importKey: "Invoices", permissionKey: "invoices" },
              { label: "Purchase Bills", path: "/purchase-invoices", importKey: "PurchaseInvoices", permissionKey: "purchase-invoices" }
            ]
          };
        }
        return item;
      });
    }

    // Now filter items for staff according to granted permissions
    if (isStaff) {
      // For Staff users:
      // 1. Dashboard and Reports are strictly forbidden
      // 2. Roles & Permissions is strictly forbidden
      // 3. Only permitted tabs will be shown
      // 4. Profile / Settings is always visible
      baseItems = baseItems
        .filter(item => {
          if (item.permissionKey === 'dashboard' || item.permissionKey === 'reports' || item.permissionKey === 'roles-permissions') {
            return false;
          }
          if (item.permissionKey === 'settings') {
            return true;
          }
          if (item.permissionKey === 'kitchen') {
            return staffPermissions?.includes('kitchen') || staffPermissions?.includes('einvoice') || hasPermission('kitchen');
          }

          const isPermittedSub = (si: any) => {
            if (!si.permissionKey) return true;
            if (si.permissionKey === 'downpayment-invoices') {
              return hasPermission('downpayment-invoices') || hasPermission('invoices');
            }
            return hasPermission(si.permissionKey);
          };

          if (item.subItems && item.subItems.length > 0) {
            const permittedSubItems = item.subItems.filter(isPermittedSub);
            return permittedSubItems.length > 0;
          }

          return !item.permissionKey || hasPermission(item.permissionKey);
        })
        .map(item => {
          const isPermittedSub = (si: any) => {
            if (!si.permissionKey) return true;
            if (si.permissionKey === 'downpayment-invoices') {
              return hasPermission('downpayment-invoices') || hasPermission('invoices');
            }
            return hasPermission(si.permissionKey);
          };

          if (item.subItems && item.subItems.length > 0) {
            const filteredSub = item.subItems.filter(isPermittedSub);
            return {
              ...item,
              subItems: filteredSub
            };
          }
          return item;
        });
    }

    return baseItems;
  }, [isStaff, hasPermission, staffPermissions, isAutomobile, isCafe, isEffectiveCafe]);

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
    <aside
      className={cn(
        "bg-background border-r border-border transition-all duration-300 ease-in-out flex flex-col shrink-0 select-none",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Top Header with Collapse/Expand Toggle */}
      {onToggleCollapse && (
        <div className={cn("flex items-center px-3 pt-3 pb-1 border-b border-border/40", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed && (
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground/80 pl-1">
              Menu
            </span>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={isCollapsed ? "Expand sidebar" : "Minimize sidebar for fullscreen view"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* POS / Create Invoice CTA Button */}
      {canCreateInvoice && (
        <div className={cn(isCollapsed ? "py-3 px-2 flex justify-center" : "p-4 md:p-6")}>
          {isCollapsed ? (
            <button
              type="button"
              onClick={handleCreateInvoice}
              onMouseEnter={() => handlePrefetch("CreateInvoice")}
              title={isCafe ? "Cafe POS Counter" : "Create Invoice"}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer",
                isCafe
                  ? "bg-gradient-to-br from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-amber-600/20"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {isCafe ? <Coffee className="w-5 h-5 text-amber-200" /> : <Plus className="w-5 h-5" />}
            </button>
          ) : (
            <Button
              className={cn(
                "w-full shadow-sm font-semibold gap-2",
                isCafe && "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black shadow-amber-600/20"
              )}
              onClick={handleCreateInvoice}
              onMouseEnter={() => handlePrefetch("CreateInvoice")}
            >
              {isCafe ? (
                <>
                  <Coffee className="w-4 h-4 text-amber-200" />
                  <span>Cafe POS Counter</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Invoice</span>
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Navigation Items List */}
      <nav className={cn(isCollapsed ? "px-1.5 pb-4 flex-1" : "px-4 pb-4 flex-1", !canCreateInvoice && "pt-4")}>
        <ul className={cn("space-y-1.5", isCollapsed && "space-y-2")}>
          {visibleNavigationItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = openAccordion === item.label;
            const isCurrentRouteInSubItems = hasSubItems && item.subItems?.some(si => si.path === location.pathname || (si.path !== '/' && location.pathname.startsWith(si.path)));
            const isCurrentRouteDirect = location.pathname === item.path || (item.path && item.path !== '/' && location.pathname.startsWith(item.path));
            const isActive = isCurrentRouteDirect || isCurrentRouteInSubItems;

            if (isCollapsed) {
              const targetPath = item.path || item.subItems?.[0]?.path;
              return (
                <li key={item.label} className="flex justify-center">
                  {targetPath ? (
                    <button
                      type="button"
                      onClick={() => {
                        navigate(targetPath);
                        onItemClick?.();
                      }}
                      title={item.label}
                      onMouseEnter={() => handlePrefetch(item.importKey || item.subItems?.[0]?.importKey)}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group",
                        isActive
                          ? (isCafe ? "bg-amber-600 text-white shadow-sm" : "bg-primary text-primary-foreground shadow-sm")
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="sr-only">{item.label}</span>
                    </button>
                  ) : null}
                </li>
              );
            }

            return (
              <li key={item.label} className="space-y-1">
                {hasSubItems ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleParentClick(item)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md transition-all text-sm font-medium cursor-pointer",
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
                          const isSubActive = subItem.path.includes('?')
                            ? (location.pathname + location.search) === subItem.path
                            : (location.pathname === subItem.path && !location.search.includes('type='));
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
