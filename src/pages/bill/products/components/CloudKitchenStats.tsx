import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";

interface CloudKitchenStatsProps {
  totalSoldQuantity: number;
}

export const CloudKitchenStats: React.FC<CloudKitchenStatsProps> = ({
  totalSoldQuantity,
}) => {
  return (
    <Card className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-xl flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">
          <ShoppingBag className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Quantity Sold</p>
          <p className="text-xl font-black text-foreground">
            {totalSoldQuantity.toLocaleString('en-IN')}{' '}
            <span className="text-xs font-bold text-emerald-600">Plates / Units</span>
          </p>
        </div>
      </div>
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-bold">
        Cloud Kitchen Active
      </Badge>
    </Card>
  );
};
