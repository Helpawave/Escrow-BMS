import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const TestNotification = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const createTestNotification = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Test Notification',
          message: 'This is a test notification to verify the notification system is working properly.',
          type: 'info'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test notification created successfully!"
      });

      // Refresh the page to see the notification
      window.location.reload();
    } catch (error) {
      console.error('Error creating test notification:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create test notification."
      });
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-2">Test Notifications</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Create a test notification to verify the notification system is working.
      </p>
      <Button onClick={createTestNotification} size="sm">
        Create Test Notification
      </Button>
    </Card>
  );
};
