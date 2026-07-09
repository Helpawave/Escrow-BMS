import { useState } from "react";
import { Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function MobileNumberRequiredModal() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [mobile, setMobile] = useState("");
  const [saving, setSaving] = useState(false);

  const isOpen = !!user && !profile?.mobile?.trim();

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    if (!/^\d{10}$/.test(mobile)) {
      toast({
        variant: "destructive",
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number.",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          mobile,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast({
        title: "Mobile number saved",
        description: "Your account profile has been updated.",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save mobile number.";
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => undefined}>
      <DialogContent
        className="sm:max-w-md rounded-2xl [&>button]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <Phone className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-2xl font-black">Mobile Number Required</DialogTitle>
          <DialogDescription className="text-center">
            Please add your mobile number to continue using EscrowBill.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="required-mobile">Mobile Number *</Label>
            <Input
              id="required-mobile"
              type="tel"
              inputMode="numeric"
              placeholder="10-digit mobile number"
              value={mobile}
              onChange={(event) => setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))}
              pattern="[0-9]{10}"
              minLength={10}
              maxLength={10}
              required
              className="h-12 text-base font-bold"
              autoFocus
            />
          </div>

          <Button type="submit" className="h-12 w-full font-bold" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save & Continue"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
