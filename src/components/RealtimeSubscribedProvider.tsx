import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const RealtimeSubscribedProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    // Table names to watch for live updates
    const tables = [
      'profiles',
      'user_settings',
      'invoices',
      'invoice_items',
      'clients',
      'expenses',
      'products',
      'inventory_logs'
    ];

    const channel = supabase.channel('global-database-changes');

    // Attach listeners for each table
    tables.forEach(table => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log(`Realtime update received for ${table}:`, payload);
          
          // Invalidate the specific table query
          void queryClient.invalidateQueries({ queryKey: [table] });
          
          // Also invalidate dashboard stats since they depend on multiple tables
          if (['invoices', 'clients', 'expenses'].includes(table)) {
            void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
          }
        }
      );
    });

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return <>{children}</>;
};
