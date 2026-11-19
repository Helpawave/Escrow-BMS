import React, { useEffect, useState, useMemo, useRef } from 'react';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  UtensilsCrossed,
  ChefHat,
  Volume2,
  VolumeX,
  RefreshCw,
  Clock,
  Sparkles,
  Coffee,
  Receipt,
  Bell,
  Check,
  ChevronDown,
  Play
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { kitchenService, KitchenOrder, subscribeKitchenSync } from '@/services/kitchenService';
import { ActiveOrderCard } from '@/components/kitchen/ActiveOrderCard';
import { OrderHistoryList } from '@/components/kitchen/OrderHistoryList';
import { OrderDetailsModal } from '@/components/kitchen/OrderDetailsModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type KitchenSoundTone = 'bell' | 'ding' | 'melody' | 'digital';

export const KITCHEN_SOUND_OPTIONS = [
  {
    id: 'bell' as const,
    name: 'Service Bell',
    desc: 'Classic 3-tone service bell (Ding Dong)',
    emoji: '🔔',
  },
  {
    id: 'ding' as const,
    name: 'Order Ding',
    desc: 'Crisp high-pitch counter bell',
    emoji: '🛎️',
  },
  {
    id: 'melody' as const,
    name: 'Melody Chime',
    desc: 'Upbeat 4-note ascending melody',
    emoji: '🎵',
  },
  {
    id: 'digital' as const,
    name: 'Digital POS Beep',
    desc: 'Modern electronic counter pulses',
    emoji: '⚡',
  },
] as const;

// Global Web Audio synthesizer with user gesture unlock
let globalAudioCtx: AudioContext | null = null;

function getOrCreateAudioContext(): AudioContext | null {
  try {
    if (!globalAudioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) globalAudioCtx = new AudioCtx();
    }
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().catch(() => {});
    }
    return globalAudioCtx;
  } catch {
    return null;
  }
}

if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    getOrCreateAudioContext();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
}

const playKitchenSound = (
  tone: KitchenSoundTone = 'bell',
  type: 'new_order' | 'ping' = 'new_order'
) => {
  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;

    const play = () => {
      const now = ctx.currentTime;
      if (type === 'ping') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
        return;
      }

      if (tone === 'ding') {
        // Crisp High Order Bell (counter service bell)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1046.5, now);
        gain1.gain.setValueAtTime(0.4, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2093, now);
        gain2.gain.setValueAtTime(0.18, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.75);
        osc2.start(now);
        osc2.stop(now + 0.45);
        return;
      }

      if (tone === 'melody') {
        // Cheerful 4-note ascending melody (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + idx * 0.11;
          const stopTime = startTime + 0.35;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.3, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, stopTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(stopTime);
        });
        return;
      }

      if (tone === 'digital') {
        // Modern POS dual pulse (880Hz -> 1174Hz)
        const pulses = [880, 1174.66];
        pulses.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + idx * 0.13;
          const stopTime = startTime + 0.12;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.32, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, stopTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(stopTime);
        });
        return;
      }

      // Default: 'bell' - Crisp 3-tone service bell chime: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz)
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.14;
        const stopTime = startTime + 0.4;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.35, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, stopTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(stopTime);
      });
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(play).catch(() => {});
    } else {
      play();
    }
  } catch (e) {
    console.warn("Audio chime failed:", e);
  }
};

export default function Kitchen() {
  const { toast } = useToast();
  const { user, effectiveUserId, companyOwnerId } = useAuth();
  const targetUserId = companyOwnerId || effectiveUserId || user?.id || '';

  const [orders, setOrders] = useState<KitchenOrder[]>(() => kitchenService.getOrders());
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);

  const [soundTone, setSoundTone] = useState<KitchenSoundTone>(() => {
    return (localStorage.getItem('escrow_kitchen_sound_tone') as KitchenSoundTone) || 'bell';
  });
  const soundToneRef = useRef(soundTone);
  useEffect(() => {
    soundToneRef.current = soundTone;
  }, [soundTone]);

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('escrow_kitchen_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const prevActiveCountRef = useRef(orders.filter(o => o.status === 'active').length);

  // Initial load from live DB
  useEffect(() => {
    if (targetUserId) {
      kitchenService.fetchOrdersFromDB(targetUserId).then(fresh => {
        if (fresh && fresh.length > 0) {
          setOrders(fresh);
          prevActiveCountRef.current = fresh.filter(o => o.status === 'active').length;
        }
      });
    }
  }, [targetUserId]);

  // Realtime Supabase Subscription: Sync orders instantly across staff and owner screens
  useEffect(() => {
    const unsubscribe = subscribeKitchenSync((payload: any) => {
      if (payload.action === 'new_order' && payload.order) {
        setOrders(prev => {
          const exists = prev.some(o => o.id === payload.order.id || o.orderNumber === payload.order.orderNumber);
          if (exists) return prev;
          return [payload.order, ...prev];
        });
        // Play sound ONLY when a new order arrives!
        if (soundEnabledRef.current) {
          playKitchenSound(soundToneRef.current, 'new_order');
        }
      } else if (payload.status === 'completed' || payload.status === 'cancelled' || payload.deleted) {
        const targetInvId = payload.invoiceId;
        const targetOrdId = payload.orderId;
        setOrders(prev => {
          if (payload.deleted || payload.status === 'cancelled') {
            return prev.filter(o => o.id !== targetOrdId && o.invoiceId !== targetInvId && o.orderNumber !== payload.orderNumber);
          }
          return prev.map(o => {
            if (o.id === targetOrdId || o.invoiceId === targetInvId || o.orderNumber === payload.orderNumber) {
              return { ...o, status: payload.status, completedAt: payload.status === 'completed' ? new Date().toISOString() : o.completedAt };
            }
            return o;
          });
        });
      }

      // Background sync with live DB
      if (targetUserId) {
        kitchenService.fetchOrdersFromDB(targetUserId).then(fresh => {
          if (fresh) {
            setOrders(fresh);
            prevActiveCountRef.current = fresh.filter(o => o.status === 'active').length;
          }
        });
      }
    });

    // Also listen to direct Supabase postgres changes on invoices table for fallback
    const pgChannel = supabase
      .channel(`kitchen_pg_realtime_${targetUserId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices'
        },
        (payload: any) => {
          if (targetUserId) {
            kitchenService.fetchOrdersFromDB(targetUserId).then(fresh => {
              if (fresh) {
                setOrders(fresh);
                const currentActiveCount = fresh.filter(o => o.status === 'active').length;
                if (payload.eventType === 'INSERT' && soundEnabledRef.current && currentActiveCount > prevActiveCountRef.current) {
                  playKitchenSound(soundToneRef.current, 'new_order');
                }
                prevActiveCountRef.current = currentActiveCount;
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      unsubscribe();
      try { supabase.removeChannel(pgChannel); } catch {}
    };
  }, [targetUserId, soundEnabled]);

  // Sync state when storage or events update & trigger sound for new orders
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<KitchenOrder[]>;
      const freshOrders = customEvent.detail ? customEvent.detail : kitchenService.getOrders();
      setOrders(freshOrders);

      // Check if new active order arrived
      const currentActiveCount = freshOrders.filter(o => o.status === 'active').length;
      if (soundEnabledRef.current && currentActiveCount > prevActiveCountRef.current) {
        playKitchenSound(soundToneRef.current, 'new_order');
      }
      prevActiveCountRef.current = currentActiveCount;
    };

    window.addEventListener('kitchen_orders_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('kitchen_orders_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const activeOrders = useMemo(() => {
    return orders.filter(o => o.status === 'active');
  }, [orders]);

  const completedOrders = useMemo(() => {
    return orders.filter(o => o.status === 'completed');
  }, [orders]);

  // Complete Order Handler
  const handleCompleteOrder = async (orderId: string) => {
    const completed = await kitchenService.completeOrder(orderId);
    if (completed) {
      toast({
        title: "Order Completed! ✓",
        description: `Token #${completed.tokenNumber} (${completed.tableName}) moved to Order History.`
      });
    }
  };

  // Cancel Order Handler (Inside Modal only)
  const handleCancelOrder = async (orderId: string) => {
    const cancelled = await kitchenService.cancelOrder(orderId);
    if (cancelled) {
      setSelectedOrder(cancelled);
      toast({
        title: "Order Cancelled & Invoice Deleted",
        description: `Token #${cancelled.tokenNumber} (${cancelled.tableName}) has been cancelled and deleted from sales invoices.`,
        variant: "destructive"
      });
    }
  };

  // Delete Order Handler
  const handleDeleteOrder = async (orderId: string) => {
    const success = await kitchenService.deleteOrder(orderId);
    if (success) {
      toast({
        title: "Order Ticket Deleted",
        description: "The order and invoice have been permanently deleted from sales invoices and kitchen history."
      });
    }
  };

  const handleSelectTone = (toneId: KitchenSoundTone) => {
    setSoundTone(toneId);
    localStorage.setItem('escrow_kitchen_sound_tone', toneId);
    if (!soundEnabled) {
      setSoundEnabled(true);
      localStorage.setItem('escrow_kitchen_sound_enabled', 'true');
    }
    // Play test preview immediately
    playKitchenSound(toneId, 'new_order');
    const selected = KITCHEN_SOUND_OPTIONS.find(s => s.id === toneId);
    toast({
      title: `${selected?.emoji || '🔔'} Alert Sound: ${selected?.name || 'Selected'}`,
      description: "Sound alert saved. This sound will play when new orders arrive."
    });
  };

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    localStorage.setItem('escrow_kitchen_sound_enabled', String(nextState));
    if (nextState) {
      playKitchenSound(soundTone, 'new_order');
      const currentToneName = KITCHEN_SOUND_OPTIONS.find(s => s.id === soundTone)?.name || 'Service Bell';
      toast({
        title: "Kitchen Audio Alerts On 🔔",
        description: `Playing ${currentToneName} for new incoming orders.`
      });
    } else {
      toast({
        title: "Kitchen Audio Alerts Muted 🔕",
        description: "Sound alerts are now paused."
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 flex flex-col space-y-6 animate-in fade-in duration-500">
      <SEO
        title="KITCHEN DISPLAY (KDS) | ESCROWBILL"
        description="Live kitchen display system for orders, preparation queue, and order completion."
      />

      {/* TOP HEADER: Clean website styling with Cafe KDS badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-xs">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground uppercase">
                KITCHEN DISPLAY
              </h1>
              <Badge variant="outline" className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 font-black text-[11px] px-2.5 py-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5 inline-block" />
                KDS Live
              </Badge>
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-0.5 flex items-center gap-2">
              <span>Live Kitchen Order Tickets (KOT)</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {activeOrders.length} {activeOrders.length === 1 ? 'Order' : 'Orders'} in Prep
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls - Sound Settings with multi-sound selection */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-9 text-xs font-semibold gap-1.5 border-border hover:bg-muted transition-all active:scale-95 shadow-xs"
                title="Kitchen Order Sound Settings"
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Sound On: {KITCHEN_SOUND_OPTIONS.find(s => s.id === soundTone)?.name || 'Bell'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5 opacity-70" />
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Muted</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5 opacity-70" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-2 rounded-2xl shadow-xl border-border bg-popover text-popover-foreground z-50">
              <div className="flex items-center justify-between px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-foreground">Order Alert Sound</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSound}
                  className={`h-7 px-2.5 text-[11px] font-bold rounded-lg ${
                    soundEnabled
                      ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                      : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                  }`}
                >
                  {soundEnabled ? 'Mute' : 'Enable'}
                </Button>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-2 pt-1 pb-1">
                Select Alert Tone
              </DropdownMenuLabel>

              <div className="space-y-1">
                {KITCHEN_SOUND_OPTIONS.map((option) => {
                  const isSelected = soundTone === option.id && soundEnabled;
                  return (
                    <DropdownMenuItem
                      key={option.id}
                      onClick={() => handleSelectTone(option.id)}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 font-bold'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0">{option.emoji}</span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold truncate">{option.name}</span>
                          <span className="text-[10px] text-muted-foreground font-normal truncate">
                            {option.desc}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {isSelected && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            playKitchenSound(option.id, 'new_order');
                          }}
                          className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                          title="Preview Sound"
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </span>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </div>

              {!soundEnabled && (
                <div className="mt-2 p-2 rounded-xl bg-muted/60 text-[11px] text-muted-foreground text-center">
                  Sound is currently muted. Click any tone or <strong>Enable</strong> above to turn sound back on.
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* TOP / ACTIVE SECTION: Active Live Order Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Active Orders in Preparation ({activeOrders.length})
            </h2>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Orders disappear and move to history when marked "Complete"
          </span>
        </div>

        {activeOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-card border border-dashed border-border rounded-3xl p-8 text-center space-y-3 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
              <ChefHat className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">All Caught Up! No Active Orders</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              New orders created from POS Sales Invoices will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {activeOrders.map((order) => (
              <ActiveOrderCard
                key={order.id}
                order={order}
                onComplete={handleCompleteOrder}
                onViewDetails={(ord) => setSelectedOrder(ord)}
              />
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM SECTION: Order History List with Filters & Pagination */}
      <div className="w-full pt-2">
        <OrderHistoryList
          completedOrders={completedOrders}
          onViewDetails={(ord) => setSelectedOrder(ord)}
          onDeleteOrder={handleDeleteOrder}
        />
      </div>

      {/* Order Details Modal triggered by Eye button (👁) */}
      <OrderDetailsModal
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
        onCancelOrder={handleCancelOrder}
      />
    </div>
  );
}
