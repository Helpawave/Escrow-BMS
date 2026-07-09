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

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      throw new Error("Target user ID is required");
    }

    console.log(`Admin ${user.id} requesting password reset for user ${targetUserId}`);

    // Check admin permissions and log action using the database function
    const { data: result, error: functionError } = await supabaseService
      .rpc('admin_reset_user_password', {
        target_user_id: targetUserId,
        admin_user_id: user.id
      });

    if (functionError) {
      throw functionError;
    }

    // Use service role to reset the user's password
    const { error: resetError } = await supabaseService.auth.admin.generateLink({
      type: 'recovery',
      email: '',
      options: {
        redirectTo: `${req.headers.get("origin")}/auth`
      }
    });

    // Get user email for password reset
    const { data: userData, error: userError } = await supabaseService.auth.admin.getUserById(targetUserId);
    
    if (userError || !userData.user?.email) {
      throw new Error("Could not retrieve user email");
    }

    // Generate password reset link
    const { data: linkData, error: linkError } = await supabaseService.auth.admin.generateLink({
      type: 'recovery',
      email: userData.user.email,
      options: {
        redirectTo: `${req.headers.get("origin")}/auth`
      }
    });

    if (linkError) {
      throw linkError;
    }

    console.log(`Password reset initiated successfully for user ${targetUserId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password reset initiated successfully",
        resetLink: linkData.properties?.action_link // Return the reset link for admin use
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Error in admin-reset-password function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});