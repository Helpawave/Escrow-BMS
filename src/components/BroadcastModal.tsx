import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Correcting Dialog import
import {
  Dialog as ShadcnDialog,
  DialogContent as ShadcnDialogContent,
  DialogHeader as ShadcnDialogHeader,
  DialogTitle as ShadcnDialogTitle,
  DialogFooter as ShadcnDialogFooter,
} from "@/components/ui/dialog";

const BroadcastModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [broadcast, setBroadcast] = useState<{ id: string; message: string; timestamp: string } | null>(null);
  const { user } = useAuth();

  interface SystemSettingPayload {
    key: string;
    value: { id: string; message: string; timestamp: string };
    updated_at: string;
  }

  // Helper to get a stable ID (use provided ID or hash of message)
  const getBroadcastId = (b: { id?: string; message: string }) => {
    if (b.id) return b.id;
    // Simple hash for legacy messages without ID
    let hash = 0;
    for (let i = 0; i < b.message.length; i++) {
      const char = b.message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `hash-${hash}`;
  };

  const fetchBroadcast = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'platform_broadcast')
        .maybeSingle();

      if (error) throw error;
      if (data && (data as any).value) { // eslint-disable-line @typescript-eslint/no-explicit-any
        const broadcastData = (data as any).value as { id: string; message: string; timestamp: string }; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (broadcastData.message) {
          const broadcastId = getBroadcastId(broadcastData);
          const userCreatedAt = user?.created_at ? new Date(user.created_at) : null;
          const broadcastTime = broadcastData.timestamp ? new Date(broadcastData.timestamp) : null;
          
          // Check if broadcast is older than user registration
          const isOlderThanSignup = userCreatedAt && broadcastTime && (broadcastTime < userCreatedAt);

          if (!isOlderThanSignup) {
            const dismissedLocal = JSON.parse(localStorage.getItem('dismissed_broadcasts') || '[]');
            const dismissedUser = user?.user_metadata?.dismissed_broadcasts || [];
            
            if (!dismissedLocal.includes(broadcastId) && !dismissedUser.includes(broadcastId)) {
              setBroadcast(broadcastData);
              setIsOpen(true);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching broadcast:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchBroadcast();

    // Subscribe to realtime updates for live notifications
    const channel = supabase
      .channel('system_broadcasts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings',
          filter: 'key=eq.platform_broadcast'
        },
        (payload) => {
          const newData = payload.new as SystemSettingPayload;
          if (newData && newData.value) {
            const broadcastData = newData.value;
            const broadcastId = getBroadcastId(broadcastData);
            const userCreatedAt = user?.created_at ? new Date(user.created_at) : null;
            const broadcastTime = broadcastData.timestamp ? new Date(broadcastData.timestamp) : null;
            
            // Check if broadcast is older than user registration
            const isOlderThanSignup = userCreatedAt && broadcastTime && (broadcastTime < userCreatedAt);

            if (!isOlderThanSignup) {
              const dismissedLocal = JSON.parse(localStorage.getItem('dismissed_broadcasts') || '[]');
              const dismissedUser = user?.user_metadata?.dismissed_broadcasts || [];
              
              // Show only if not dismissed locally or globally
              if (!dismissedLocal.includes(broadcastId) && !dismissedUser.includes(broadcastId)) {
                setBroadcast(broadcastData);
                setIsOpen(true);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBroadcast, user]);

  const handleDismiss = async () => {
    if (broadcast) {
      const broadcastId = getBroadcastId(broadcast);
      
      // Update local storage for backward compatibility and anonymous users
      const dismissedIds = JSON.parse(localStorage.getItem('dismissed_broadcasts') || '[]');
      if (!dismissedIds.includes(broadcastId)) {
        dismissedIds.push(broadcastId);
        localStorage.setItem('dismissed_broadcasts', JSON.stringify(dismissedIds));
      }

      // Update Supabase user metadata for account-wide persistence
      if (user) {
        const dismissedUser = user.user_metadata?.dismissed_broadcasts || [];
        if (!dismissedUser.includes(broadcastId)) {
          await supabase.auth.updateUser({
            data: { 
              dismissed_broadcasts: [...dismissedUser, broadcastId] 
            }
          });
        }
      }
    }
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      handleDismiss();
    }
  };

  if (!broadcast) return null;

  return (
    <ShadcnDialog open={isOpen} onOpenChange={handleOpenChange}>
      <ShadcnDialogContent className="sm:max-w-md rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-900">
        <div className="bg-blue-600 p-4 md:p-6 text-white relative">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <ShadcnDialogTitle className="text-xl font-black tracking-tight text-white">
              Important notice
            </ShadcnDialogTitle>
          </div>
          <p className="text-[10px] text-blue-100 mt-2 font-bold uppercase tracking-widest opacity-80">
            Platform-wide Announcement
          </p>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Megaphone className="w-24 h-24" />
          </div>
        </div>
        
        <div className="p-4 md:p-8">
          <p className="text-slate-800 dark:text-slate-300 font-medium leading-relaxed">
            {broadcast.message}
          </p>
          
          <div className="mt-8 flex justify-end">
            <Button 
              onClick={handleDismiss}
              className="rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white px-8"
            >
              Got it
            </Button>
          </div>
        </div>
      </ShadcnDialogContent>
    </ShadcnDialog>
  );
};

export default BroadcastModal;
