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
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { pages } from "@/lib/pageImports";
import { prefetchPage } from "@/utils/prefetch";
import { useState, useEffect } from "react";

interface NavigationProps {
  className?: string;
  onItemClick?: () => void;
}

const navigationItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", importKey: "Dashboard" },
  { 
    icon: FileText, 
    label: "Invoices", 
    subItems: [
      { label: "Sales Invoices", path: "/invoices", importKey: "Invoices" },
      { label: "Purchase Bills", path: "/purchase-invoices", importKey: "PurchaseInvoices" }
    ]
  },
  { 
    icon: Users, 
    label: "Clients", 
    subItems: [
      { label: "Manage Clients", path: "/clients", importKey: "Clients" },
      { label: "Manage Vendors", path: "/vendors", importKey: "Vendors" }
    ]
  },
  { icon: Receipt, label: "Products", path: "/products", importKey: "Products" },
  { icon: CreditCard, label: "Payments", path: "/payments", importKey: "Payments" },
  { icon: Receipt, label: "Expenses", path: "/expenses", importKey: "Expenses" },
  { icon: FileText, label: "E-Invoice", path: "/einvoice", importKey: "EInvoice" },
  { icon: BarChart3, label: "Reports", path: "/reports", importKey: "Reports" },
  { icon: User, label: "Profile", path: "/settings", importKey: "Settings" },
];

export function Navigation({ className, onItemClick }: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    navigationItems.forEach(item => {
      if (item.subItems?.some(si => si.path === location.pathname)) {
        setExpandedItems(prev => ({ ...prev, [item.label]: true }));
      }
    });
  }, [location.pathname]);

  const toggleExpand = (label: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const handleCreateInvoice = () => {
    navigate('/create-invoice');
    onItemClick?.();
  };

  const handlePrefetch = (key: string) => {
    const importFn = pages[key as keyof typeof pages];
    if (importFn) {
      prefetchPage(importFn);
    }
  };

  return (
    <aside className={cn("w-64 bg-background border-r border-border", className)}>
      <div className="p-4 md:p-6">
        <Button 
          className="w-full" 
          onClick={handleCreateInvoice}
          onMouseEnter={() => handlePrefetch("CreateInvoice")}
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </Button>
      </div>
      
      <nav className="px-4 pb-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedItems[item.label];
            const isActive = location.pathname === item.path || (hasSubItems && item.subItems?.some(si => si.path === location.pathname));

            return (
              <li key={item.label} className="space-y-1">
                {hasSubItems ? (
                  <>
                    <button
                      onClick={() => toggleExpand(item.label)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md transition-all text-sm font-medium",
                        isActive 
                          ? "text-primary bg-primary/5" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4" />
                        {item.label}
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
                    onClick={() => onItemClick?.()}
                    onMouseEnter={() => handlePrefetch(item.importKey)}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
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
