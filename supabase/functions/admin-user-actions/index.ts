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

    const { action, targetUserId, actionData } = await req.json();

    // Verify admin role
    const { data: hasRole } = await supabaseService
      .rpc('has_role', {
        _user_id: user.id,
        _role: 'super_admin'
      });

    if (!hasRole) {
      throw new Error("Insufficient permissions");
    }

    console.log(`Admin ${user.id} performing action: ${action} on user ${targetUserId}`);

    let result;

    switch (action) {
      case 'disable_user':
        // Update user to disabled status
        const { error: disableError } = await supabaseService.auth.admin.updateUserById(
          targetUserId,
          { user_metadata: { disabled: true } }
        );
        if (disableError) throw disableError;
        
        // Log action
        await supabaseService
          .from('admin_actions')
          .insert({
            admin_id: user.id,
            action_type: 'user_disabled',
            target_user_id: targetUserId,
            details: 'User account disabled by admin'
          });
        
        result = { message: "User disabled successfully" };
        break;

      case 'enable_user':
        // Update user to enabled status
        const { error: enableError } = await supabaseService.auth.admin.updateUserById(
          targetUserId,
          { user_metadata: { disabled: false } }
        );
        if (enableError) throw enableError;
        
        // Log action
        await supabaseService
          .from('admin_actions')
          .insert({
            admin_id: user.id,
            action_type: 'user_enabled',
            target_user_id: targetUserId,
            details: 'User account enabled by admin'
          });
        
        result = { message: "User enabled successfully" };
        break;

      case 'delete_user':
        // Delete user account
        const { error: deleteError } = await supabaseService.auth.admin.deleteUser(
          targetUserId
        );
        if (deleteError) throw deleteError;
        
        // Log action
        await supabaseService
          .from('admin_actions')
          .insert({
            admin_id: user.id,
            action_type: 'user_deleted',
            target_user_id: targetUserId,
            details: 'User account permanently deleted by admin'
          });
        
        result = { message: "User deleted successfully" };
        break;

      case 'update_role':
        const { role, operation } = actionData;
        
        if (operation === 'add') {
          const { error: roleError } = await supabaseService
            .from('user_roles')
            .insert({
              user_id: targetUserId,
              role: role
            });
          
          if (roleError && roleError.code !== '23505') { // Ignore duplicate key error
            throw roleError;
          }
          
          await supabaseService
            .from('admin_actions')
            .insert({
              admin_id: user.id,
              action_type: 'role_added',
              target_user_id: targetUserId,
              details: `Added role: ${role}`
            });
          
          result = { message: `Role ${role} added successfully` };
        } else if (operation === 'remove') {
          const { error: roleError } = await supabaseService
            .from('user_roles')
            .delete()
            .eq('user_id', targetUserId)
            .eq('role', role);
          
          if (roleError) throw roleError;
          
          await supabaseService
            .from('admin_actions')
            .insert({
              admin_id: user.id,
              action_type: 'role_removed',
              target_user_id: targetUserId,
              details: `Removed role: ${role}`
            });
          
          result = { message: `Role ${role} removed successfully` };
        }
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        ...result
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Error in admin-user-actions function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});