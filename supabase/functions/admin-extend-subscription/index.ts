import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { targetUserId, extendMonths = 1, planType = 'premium' } = await req.json();

    if (!targetUserId) {
      throw new Error("Target user ID is required");
    }

    console.log(`Admin ${user.id} extending subscription for user ${targetUserId} by ${extendMonths} months`);

    // Use the database function to extend subscription
    const { data: result, error: functionError } = await supabaseService
      .rpc('admin_extend_subscription', {
        target_user_id: targetUserId,
        admin_user_id: user.id,
        extend_months: extendMonths
      });

    if (functionError) {
      throw functionError;
    }

    console.log(`Subscription extended successfully for user ${targetUserId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Subscription extended by ${extendMonths} months`,
        result 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Error in admin-extend-subscription function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});