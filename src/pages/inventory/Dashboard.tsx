import { useMemo } from "react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { InventoryChart } from "@/components/dashboard/InventoryChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useProducts } from "@/contexts/ProductsContext";

const recentMovements = [
  { item: "iPad Air", type: "OUT", quantity: 5, time: "2 hours ago" },
  { item: "AirPods Pro", type: "IN", quantity: 25, time: "4 hours ago" },
  { item: "iPhone 15", type: "OUT", quantity: 12, time: "6 hours ago" },
  { item: "MacBook Air", type: "IN", quantity: 8, time: "1 day ago" },
];

export const Dashboard = () => {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const { products, movements } = useProducts();

  // Calculate real-time stats from products
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const stockValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const lowStockCount = products.filter(p => p.quantity < 10).length;
    const lowStockItems = products
      .filter(p => p.quantity < 10)
      .map(p => ({
        name: p.name,
        sku: p.sku,
        quantity: p.quantity,
        threshold: 10
      }));

    return {
      totalProducts,
      stockValue,
      lowStockCount,
      lowStockItems
    };
  }, [products]);

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";

    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Dashboard{profile?.company_name ? ` - ${profile.company_name}` : ''}
        </h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's an overview of your inventory.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Total Products"
          value={stats.totalProducts.toString()}
          icon={Package}
          description="Active SKUs"
        />
        <StatsCard
          title="Stock Value"
          value={`$${stats.stockValue.toLocaleString()}`}
          icon={DollarSign}
          description="Current inventory worth"
        />
        <StatsCard
          title="Low Stock Alerts"
          value={stats.lowStockCount.toString()}
          icon={AlertTriangle}
          description="Items below threshold"
          className="border-warning/20"
        />
        <StatsCard
          title="Monthly Growth"
          value="+15.3%"
          icon={TrendingUp}
          description="Compared to last month"
          trend={{ value: 15.3, isPositive: true }}
        />
      </div>

      {/* Charts and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <InventoryChart />
        <QuickActions />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Low Stock Alerts */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <span>Low Stock Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.lowStockItems.length > 0 ? (
                stats.lowStockItems.map((item) => (
                  <div key={item.sku} className="flex items-center justify-between p-3 bg-warning/5 rounded-lg border border-warning/20">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-warning">
                        {item.quantity} / {item.threshold}
                      </p>
                      <p className="text-xs text-muted-foreground">in stock</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No low stock items</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Movements */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Recent Stock Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {movements.length > 0 ? (
                movements.slice(0, 5).map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant={movement.type === "IN" ? "default" : "secondary"}
                        className={movement.type === "IN" ? "bg-success text-success-foreground" : ""}
                      >
                        {movement.type}
                      </Badge>
                      <div>
                        <p className="font-medium text-foreground">{movement.item}</p>
                        <p className="text-sm text-muted-foreground">{getTimeAgo(movement.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        {movement.type === "IN" ? "+" : "-"}{movement.quantity}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No recent movements</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};