import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Utensils, Clock, CheckCircle2, Calendar, User, Phone, Receipt, Printer } from 'lucide-react';
import { KitchenOrder } from '@/services/kitchenService';

interface OrderDetailsModalProps {
  order: KitchenOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelOrder?: (orderId: string) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  open,
  onOpenChange,
  onCancelOrder
}) => {
  if (!order) return null;

  const createdTime = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const createdDate = new Date(order.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
  const completedTime = order.completedAt
    ? new Date(order.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;
  const cancelledTime = order.cancelledAt
    ? new Date(order.cancelledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg rounded-2xl p-6 bg-background">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-amber-500">#{order.tokenNumber}</span>
              <Badge variant="outline" className="font-bold text-xs">
                {order.tableName || 'Dine-In'}
              </Badge>
              <Badge
                className={
                  order.status === 'completed'
                    ? 'bg-emerald-600 text-white font-bold'
                    : order.status === 'cancelled'
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-amber-600 text-white font-bold'
                }
              >
                {order.status === 'completed' ? 'Completed' : order.status === 'cancelled' ? 'Cancelled' : 'Cooking'}
              </Badge>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{order.orderNumber}</span>
          </div>
          <DialogTitle className="text-base font-bold mt-1">Order Summary & KOT Details</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Complete details and preparation timeline for this order.
          </DialogDescription>
        </DialogHeader>

        {/* Customer & Time Info */}
        <div className="grid grid-cols-2 gap-3 py-3 text-xs bg-muted/40 p-3 rounded-xl border border-border/60">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              <span>Customer:</span>
            </div>
            <p className="font-bold text-foreground truncate">{order.customerName || 'Walk-in Guest'}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>Ordered At:</span>
            </div>
            <p className="font-bold text-foreground">{createdTime} ({createdDate})</p>
          </div>
          {order.customerMobile && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="w-3.5 h-3.5" />
                <span>Mobile:</span>
              </div>
              <p className="font-mono font-semibold text-foreground">{order.customerMobile}</p>
            </div>
          )}
          {completedTime && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready At:</span>
              </div>
              <p className="font-bold text-emerald-600 dark:text-emerald-400">{completedTime}</p>
            </div>
          )}
          {cancelledTime && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Cancelled At:</span>
              </div>
              <p className="font-bold text-rose-600 dark:text-rose-400">{cancelledTime}</p>
            </div>
          )}
        </div>

        {/* Special Instructions / Notes */}
        {order.notes && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1">
            <span className="font-bold text-amber-700 dark:text-amber-400 block">📝 Special Kitchen Instructions:</span>
            <p className="text-foreground font-semibold break-words leading-tight">{order.notes}</p>
          </div>
        )}

        {/* Itemized Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ordered Items</h4>
          <div className="divide-y border rounded-xl overflow-hidden bg-card text-xs">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center shrink-0">
                    {item.quantity}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    {item.notes && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">Note: {item.notes}</p>
                    )}
                  </div>
                </div>
                {item.rate && (
                  <div className="text-right font-mono">
                    <p className="font-bold">₹{(item.amount || item.rate * item.quantity).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">@₹{item.rate}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Total & Payment */}
        <div className="flex items-center justify-between p-3.5 bg-muted/60 rounded-xl border font-semibold text-sm">
          <div>
            <span className="text-xs text-muted-foreground">Total Bill</span>
            <div className="text-base font-black text-foreground">₹{order.totalAmount.toFixed(2)}</div>
          </div>
          {order.paymentMode && (
            <Badge variant="outline" className="font-bold text-xs bg-background">
              Payment: {order.paymentMode}
            </Badge>
          )}
        </div>

        <DialogFooter className="flex flex-row justify-between items-center gap-2 pt-3 border-t mt-2">
          {order.status !== 'cancelled' && onCancelOrder ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onCancelOrder(order.id);
                onOpenChange(false);
              }}
              className="rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
            >
              Cancel Order
            </Button>
          ) : (
            <div />
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold ml-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

