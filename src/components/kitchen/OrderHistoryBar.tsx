import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, History, Clock, CheckCircle2 } from 'lucide-react';
import { KitchenOrder } from '@/services/kitchenService';

interface OrderHistoryBarProps {
  completedOrders: KitchenOrder[];
  onViewDetails: (order: KitchenOrder) => void;
}

export const OrderHistoryBar: React.FC<OrderHistoryBarProps> = ({
  completedOrders,
  onViewDetails
}) => {
  return (
    <div className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-2xl p-4 shadow-2xl">
      {/* Bar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200">
            Order History & Completed Queue
          </h3>
          <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px] font-bold px-2 py-0.5">
            {completedOrders.length} Done
          </Badge>
        </div>
        <span className="text-[11px] text-zinc-500 hidden sm:inline">
          Tap <Eye className="w-3 h-3 inline mx-0.5 text-zinc-400" /> to view full item breakdown
        </span>
      </div>

      {/* Horizontal Orders Strip */}
      {completedOrders.length === 0 ? (
        <div className="py-4 text-center text-xs text-zinc-500 italic">
          No completed orders yet. Active orders will appear here once marked complete.
        </div>
      ) : (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {completedOrders.map((order) => {
            const completedTime = order.completedAt
              ? new Date(order.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <div
                key={order.id}
                className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/90 rounded-xl px-3.5 py-2.5 shrink-0 transition-colors"
              >
                {/* Token Badge */}
                <span className="text-base font-black text-amber-400 min-w-[32px]">
                  #{order.tokenNumber}
                </span>

                {/* Table & Order info */}
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-100">{order.tableName || 'Dine-In'}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">({order.orderNumber})</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                    <span>{itemCount} items • ₹{order.totalAmount}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-emerald-400">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {completedTime}
                    </span>
                  </div>
                </div>

                {/* Eye Button for Modal Details */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewDetails(order)}
                  title="View full order details"
                  className="h-8 w-8 rounded-lg bg-zinc-800/80 hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 transition-colors shrink-0 ml-1"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

