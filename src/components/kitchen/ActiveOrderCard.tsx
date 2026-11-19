import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, Utensils, AlertCircle } from 'lucide-react';
import { KitchenOrder } from '@/services/kitchenService';

interface ActiveOrderCardProps {
  order: KitchenOrder;
  onComplete: (orderId: string) => void;
  onViewDetails?: (order: KitchenOrder) => void;
}

export const ActiveOrderCard: React.FC<ActiveOrderCardProps> = ({
  order,
  onComplete,
  onViewDetails
}) => {
  // Elapsed time counter
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    const created = new Date(order.createdAt).getTime();
    return Math.max(0, Math.floor((Date.now() - created) / 1000));
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const created = new Date(order.createdAt).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - created) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [order.createdAt]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  // Urgency color coding: > 15 mins red/danger, > 8 mins warning amber, normal green
  const isUrgent = minutes >= 15;
  const isWarning = minutes >= 8 && minutes < 15;

  return (
    <Card className="flex flex-col justify-between bg-card text-card-foreground border border-border shadow-md rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:border-amber-500/40 min-h-[380px]">
      {/* Card Header */}
      <div className="p-4 bg-muted/40 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400">
              #{order.tokenNumber}
            </span>
            <Badge variant="outline" className="bg-background text-foreground border-border/80 font-bold text-xs px-2.5 py-0.5 shadow-2xs">
              {order.tableName || 'Dine-In'}
            </Badge>
          </div>

          {/* Elapsed Timer */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
              isUrgent
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/40 animate-pulse'
                : isWarning
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{timeFormatted}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 font-medium">
          <span className="truncate max-w-[150px]">
            {order.customerName ? `${order.customerName}` : 'Walk-in Guest'}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/80">{order.orderNumber}</span>
        </div>
      </div>

      {/* Special Kitchen Notes (if provided by cashier/customer) */}
      {order.notes && (
        <div className="mx-3.5 mt-2.5 p-2 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs flex items-start gap-1.5 text-amber-950 dark:text-amber-100">
          <span className="font-black text-amber-700 dark:text-amber-400 shrink-0">📝 Note:</span>
          <span className="font-semibold break-words leading-tight">{order.notes}</span>
        </div>
      )}

      {/* Items List */}
      <div className="flex-1 p-4 space-y-2.5 overflow-y-auto max-h-[220px]">
        {order.items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between gap-2 pb-2.5 border-b border-border/40 last:border-none last:pb-0"
          >
            <div className="flex items-start gap-2.5">
              <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 font-black text-xs border border-amber-500/30">
                {item.quantity}x
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground leading-snug">
                  {item.name}
                </p>
                {item.notes && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium italic flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{item.notes}</span>
                  </p>
                )}
              </div>
            </div>

            {item.amount && (
              <span className="text-xs font-mono font-medium text-muted-foreground shrink-0">
                ₹{item.amount}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Card Action Footer: Order Complete & Details Button */}
      <div className="p-3.5 bg-muted/20 border-t border-border flex items-center gap-2 mt-auto">
        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(order)}
            className="h-10 px-3 rounded-xl border-border hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
            title="View full KOT ticket"
          >
            <Utensils className="w-4 h-4" />
          </Button>
        )}

        <Button
          onClick={() => onComplete(order.id)}
          className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider gap-2 shadow-sm transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Order Complete</span>
        </Button>
      </div>
    </Card>
  );
};
