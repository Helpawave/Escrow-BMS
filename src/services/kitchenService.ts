import { supabase, serviceSupabase } from '@/integrations/supabase/client';

export interface KitchenOrderItem {
  id?: string;
  name: string;
  quantity: number;
  notes?: string;
  rate?: number;
  amount?: number;
}

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  tokenNumber: string;
  tableName: string;
  customerName?: string;
  customerMobile?: string;
  createdAt: string; // ISO string
  completedAt?: string;
  cancelledAt?: string;
  status: 'active' | 'completed' | 'cancelled';
  items: KitchenOrderItem[];
  totalAmount: number;
  paymentMode?: string;
  notes?: string;
  invoiceId?: string;
}

const STORAGE_KEY = 'escrow_cafe_kitchen_orders';
const KITCHEN_CHANNEL_NAME = 'escrow_kitchen_realtime';

export interface KitchenSyncPayload {
  action?: 'new_order' | 'completed' | 'cancelled' | 'updated';
  order?: KitchenOrder;
  orderId?: string;
  invoiceId?: string;
  orderNumber?: string;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  userId?: string;
  deleted?: boolean;
}

// Singleton Realtime Channel to prevent channel re-subscription leaks and ensure 100% broadcast delivery
let sharedKitchenChannel: any = null;
const kitchenListeners = new Set<(payload: KitchenSyncPayload) => void>();

export const getKitchenChannel = () => {
  if (!sharedKitchenChannel) {
    sharedKitchenChannel = supabase
      .channel(KITCHEN_CHANNEL_NAME)
      .on('broadcast', { event: 'kitchen_order_updated' }, (res: any) => {
        if (res?.payload) {
          kitchenListeners.forEach(listener => {
            try { listener(res.payload); } catch (e) { console.warn('Kitchen listener callback error:', e); }
          });
        }
      })
      .subscribe();
  }
  return sharedKitchenChannel;
};

export const broadcastKitchenSync = (payload: KitchenSyncPayload) => {
  try {
    const ch = getKitchenChannel();
    ch.send({
      type: 'broadcast',
      event: 'kitchen_order_updated',
      payload
    });
  } catch (err) {
    console.warn('Realtime kitchen broadcast notice:', err);
  }
};

export const subscribeKitchenSync = (callback: (payload: KitchenSyncPayload) => void) => {
  kitchenListeners.add(callback);
  getKitchenChannel(); // Ensure channel is active and subscribed

  return () => {
    kitchenListeners.delete(callback);
  };
};

export const kitchenService = {
  getOrders(): KitchenOrder[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return [];
  },

  getNextTokenNumber(): string {
    const orders = this.getOrders();
    const todayStr = new Date().toISOString().split('T')[0];
    const activeTokens = new Set(
      orders
        .filter(o => o.status === 'active')
        .map(o => o.tokenNumber)
    );

    const lastTokenKey = `escrow_kot_last_token_${todayStr}`;
    const lastNum = parseInt(localStorage.getItem(lastTokenKey) || '0', 10);

    let candidate = lastNum + 1;
    while (activeTokens.has(String(candidate).padStart(2, '0')) && candidate < 99) {
      candidate++;
    }
    if (candidate > 99) {
      candidate = 1;
      while (activeTokens.has(String(candidate).padStart(2, '0')) && candidate < 99) {
        candidate++;
      }
    }

    localStorage.setItem(lastTokenKey, String(candidate));
    return String(candidate).padStart(2, '0');
  },

  saveOrders(orders: KitchenOrder[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
      window.dispatchEvent(new CustomEvent('kitchen_orders_updated', { detail: orders }));
    } catch (e) {
      console.warn('Error saving kitchen orders:', e);
    }
  },

  addOrder(order: Omit<KitchenOrder, 'id' | 'status' | 'createdAt'>): KitchenOrder {
    const orders = this.getOrders();
    const token = order.tokenNumber || this.getNextTokenNumber();
    const newOrder: KitchenOrder = {
      ...order,
      tokenNumber: token,
      id: order.invoiceId ? `kot-${order.invoiceId}` : `kot-${Date.now()}`,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    // Replace if invoice exists, otherwise prepend
    const filtered = orders.filter(o => o.orderNumber !== newOrder.orderNumber);
    const updated = [newOrder, ...filtered];
    this.saveOrders(updated);
    return newOrder;
  },

  async completeOrder(orderId: string): Promise<KitchenOrder | null> {
    const orders = this.getOrders();
    let updatedOrder: KitchenOrder | null = null;
    const nextOrders = orders.map(ord => {
      if (ord.id === orderId) {
        updatedOrder = {
          ...ord,
          status: 'completed' as const,
          completedAt: new Date().toISOString()
        };
        return updatedOrder;
      }
      return ord;
    });
    this.saveOrders(nextOrders);

    // Sync to Supabase Database
    try {
      if (updatedOrder) {
        const client = serviceSupabase || supabase;
        const targetOrder = updatedOrder as KitchenOrder;
        const invId = targetOrder.invoiceId || (targetOrder.id.startsWith('kot-') ? targetOrder.id.replace('kot-', '') : null);
        
        let invRow: any = null;
        if (invId) {
          const { data } = await (client as any)
            .from('invoices')
            .select('id, notes, invoice_number, user_id')
            .eq('id', invId)
            .maybeSingle();
          invRow = data;
        }

        if (!invRow && targetOrder.orderNumber) {
          const { data } = await (client as any)
            .from('invoices')
            .select('id, notes, invoice_number, user_id')
            .eq('invoice_number', targetOrder.orderNumber)
            .limit(1);
          if (Array.isArray(data) && data.length > 0) {
            invRow = data[0];
          }
        }

        if (invRow) {
          const rawNotes = invRow.notes || '';
          const cleaned = rawNotes.replace(/\[KDS:[^\]]+\]\s*/g, '').trim();
          const newNotes = cleaned ? `${cleaned} [KDS:complete]` : `[KDS:complete]`;
          await (client as any)
            .from('invoices')
            .update({ notes: newNotes })
            .eq('id', invRow.id);

          broadcastKitchenSync({
            orderId: targetOrder.id,
            invoiceId: invRow.id,
            orderNumber: invRow.invoice_number,
            status: 'completed',
            notes: newNotes,
            userId: invRow.user_id
          });
        }
      }
    } catch (dbErr) {
      console.warn('Could not sync complete status to DB:', dbErr);
    }

    return updatedOrder;
  },

  async cancelOrder(orderId: string): Promise<KitchenOrder | null> {
    const orders = this.getOrders();
    let updatedOrder: KitchenOrder | null = null;
    const nextOrders = orders.map(ord => {
      if (ord.id === orderId) {
        updatedOrder = {
          ...ord,
          status: 'cancelled' as const,
          cancelledAt: new Date().toISOString()
        };
        return updatedOrder;
      }
      return ord;
    });
    this.saveOrders(nextOrders);

    // Sync to Supabase Database: Mark invoice cancelled and update notes
    try {
      if (updatedOrder) {
        const client = serviceSupabase || supabase;
        const targetOrder = updatedOrder as KitchenOrder;
        const invId = targetOrder.invoiceId || (targetOrder.id.startsWith('kot-') ? targetOrder.id.replace('kot-', '') : null);
        
        let invRow: any = null;
        if (invId) {
          const { data } = await (client as any)
            .from('invoices')
            .select('id, notes, invoice_number, user_id')
            .eq('id', invId)
            .maybeSingle();
          invRow = data;
        }

        if (!invRow && targetOrder.orderNumber) {
          const { data } = await (client as any)
            .from('invoices')
            .select('id, notes, invoice_number, user_id')
            .eq('invoice_number', targetOrder.orderNumber)
            .limit(1);
          if (Array.isArray(data) && data.length > 0) {
            invRow = data[0];
          }
        }

        if (invRow) {
          // Permanently delete invoice, invoice_items, and any payments from Database
          try {
            await (client as any).from('payments').delete().eq('invoice_id', invRow.id);
            await (client as any).from('invoice_items').delete().eq('invoice_id', invRow.id);
            await (client as any).from('invoices').delete().eq('id', invRow.id);
          } catch (deleteErr) {
            console.error('Error deleting cancelled invoice from database:', deleteErr);
          }

          broadcastKitchenSync({
            orderId: targetOrder.id,
            invoiceId: invRow.id,
            orderNumber: invRow.invoice_number,
            status: 'cancelled',
            deleted: true,
            userId: invRow.user_id
          });
        }
      }
    } catch (dbErr) {
      console.warn('Could not sync cancelled status to DB:', dbErr);
    }

    return updatedOrder;
  },

  getOrderByInvoice(orderNumber: string): KitchenOrder | undefined {
    const orders = this.getOrders();
    return orders.find(o => o.orderNumber === orderNumber);
  },

  async deleteOrder(orderId: string): Promise<boolean> {
    const orders = this.getOrders();
    const targetOrder = orders.find(ord => ord.id === orderId);
    const filtered = orders.filter(ord => ord.id !== orderId);
    if (filtered.length !== orders.length) {
      this.saveOrders(filtered);

      // Also permanently delete the invoice from Supabase database if it exists
      if (targetOrder) {
        try {
          const client = serviceSupabase || supabase;
          const invId = targetOrder.invoiceId || (targetOrder.id.startsWith('kot-') ? targetOrder.id.replace('kot-', '') : null);
          let invRow: any = null;
          if (invId) {
            const { data } = await (client as any)
              .from('invoices')
              .select('id, user_id, invoice_number')
              .eq('id', invId)
              .maybeSingle();
            invRow = data;
          }
          if (!invRow && targetOrder.orderNumber) {
            const { data } = await (client as any)
              .from('invoices')
              .select('id, user_id, invoice_number')
              .eq('invoice_number', targetOrder.orderNumber)
              .limit(1);
            if (Array.isArray(data) && data.length > 0) {
              invRow = data[0];
            }
          }

          if (invRow) {
            await (client as any).from('payments').delete().eq('invoice_id', invRow.id);
            await (client as any).from('invoice_items').delete().eq('invoice_id', invRow.id);
            await (client as any).from('invoices').delete().eq('id', invRow.id);

            broadcastKitchenSync({
              orderId: targetOrder.id,
              invoiceId: invRow.id,
              orderNumber: invRow.invoice_number,
              status: 'cancelled',
              deleted: true,
              userId: invRow.user_id
            });
          }
        } catch (dbErr) {
          console.warn('Error deleting invoice on kitchen deleteOrder:', dbErr);
        }
      }

      return true;
    }
    return false;
  },

  clearCompletedOrders(): void {
    const orders = this.getOrders();
    const activeOnly = orders.filter(ord => ord.status === 'active');
    this.saveOrders(activeOnly);
  },

  /**
   * Fetch live orders from Supabase invoices table so Incognito,
   * staff devices and owner computers are in 100% sync.
   */
  async fetchOrdersFromDB(targetUserId: string): Promise<KitchenOrder[]> {
    if (!targetUserId) return this.getOrders();
    try {
      const client = serviceSupabase || supabase;
      const { data: invRows, error } = await (client as any)
        .from('invoices')
        .select(`
          id,
          invoice_number,
          status,
          notes,
          total_amount,
          created_at,
          payment_terms,
          clients(name, phone),
          invoice_items(product_id, description, quantity, rate, amount, products(name))
        `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(60);

      if (error || !invRows) {
        return this.getOrders();
      }

      const dbOrders: KitchenOrder[] = invRows.map((inv: any, idx: number) => {
        const rawNotes = inv.notes || '';
        
        // Extract Table Name
        const tableMatch = rawNotes.match(/\[Order:\s*([^\]]+)\]/i);
        const tableName = tableMatch ? tableMatch[1].trim() : 'Dine-In';

        // Extract Token Number directly from invoice sequence number so Kitchen Token and Invoice match 100%
        const numDigits = (inv.invoice_number || '').replace(/\D/g, '');
        const derivedToken = numDigits ? String(parseInt(numDigits, 10)).padStart(2, '0') : '';
        const tokenMatch = rawNotes.match(/\[Token:\s*([^\]]+)\]/i);
        const tokenNumber = derivedToken || (tokenMatch ? tokenMatch[1].trim() : String(idx + 1).padStart(2, '0'));

        // Determine KDS status
        let status: 'active' | 'completed' | 'cancelled' = 'active';
        if (rawNotes.includes('[KDS:complete]')) {
          status = 'completed';
        } else if (rawNotes.includes('[KDS:cancelled]') || inv.status === 'cancelled') {
          status = 'cancelled';
        }

        // Clean user special instructions
        const cleanNotes = rawNotes
          .replace(/\[Order:\s*[^\]]+\]/gi, '')
          .replace(/\[Token:\s*[^\]]+\]/gi, '')
          .replace(/\[KDS:\s*[^\]]+\]/gi, '')
          .trim();

        // Map items
        const items: KitchenOrderItem[] = (inv.invoice_items || []).map((it: any) => ({
          name: it.products?.name || it.description || 'Dish',
          quantity: Number(it.quantity) || 1,
          rate: Number(it.rate) || 0,
          amount: Number(it.amount) || (Number(it.rate) || 0) * (Number(it.quantity) || 1)
        }));

        return {
          id: `kot-${inv.id}`,
          invoiceId: inv.id,
          orderNumber: inv.invoice_number,
          tokenNumber,
          tableName,
          customerName: inv.clients?.name || 'Walk-in Guest',
          customerMobile: inv.clients?.phone || undefined,
          createdAt: inv.created_at,
          status,
          items,
          totalAmount: Number(inv.total_amount) || 0,
          paymentMode: inv.status === 'paid' ? 'Paid' : 'Pending',
          notes: cleanNotes || undefined
        };
      });

      this.saveOrders(dbOrders);
      return dbOrders;
    } catch (err) {
      console.warn('Error fetching orders from DB:', err);
      return this.getOrders();
    }
  }
};
