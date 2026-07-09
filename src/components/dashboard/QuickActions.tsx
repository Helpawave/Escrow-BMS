import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scan, Plus, FileSpreadsheet, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const actions = [
  {
    title: "Scan Product",
    description: "Scan barcode to add or update inventory",
    icon: Scan,
    href: "/scan",
    variant: "primary" as const,
    bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
    hoverColor: "hover:from-blue-600 hover:to-blue-700",
  },
  {
    title: "Add Product",
    description: "Manually add new product to inventory",
    icon: Plus,
    href: "/products/add",
    variant: "primary" as const,
    bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
    hoverColor: "hover:from-blue-600 hover:to-blue-700",
  },
  {
    title: "Import CSV",
    description: "Bulk import products from spreadsheet",
    icon: FileSpreadsheet,
    href: "/import",
    variant: "primary" as const,
    bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
    hoverColor: "hover:from-blue-600 hover:to-blue-700",
  },
  {
    title: "Generate Report",
    description: "Create inventory and movement reports",
    icon: BarChart3,
    href: "/reports",
    variant: "success" as const,
    bgColor: "bg-gradient-to-br from-green-500 to-green-600",
    hoverColor: "hover:from-green-600 hover:to-green-700",
  },
];

export const QuickActions = () => {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action) => (
            <Link key={action.title} to={action.href} className="group">
              <div
                className={`
                  w-full h-32 p-4 rounded-xl text-white 
                  ${action.bgColor} ${action.hoverColor}
                  transform transition-all duration-300 
                  hover:scale-105 hover:shadow-lg
                  flex flex-col justify-between
                  cursor-pointer
                `}
              >
                <div className="flex items-center gap-3 mb-3">
                  <action.icon className="w-6 h-6 flex-shrink-0" />
                  <h3 className="font-semibold text-lg truncate">{action.title}</h3>
                </div>
                <p className="text-sm text-white/90 leading-relaxed line-clamp-2">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
