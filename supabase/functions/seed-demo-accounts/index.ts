import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DemoAccount {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const demoAccounts: DemoAccount[] = [
      {
        email: 'escrow.bms@gmail.com',
        password: 'Escrow12345',
        firstName: 'Escrow',
        lastName: 'Admin',
        role: 'admin'
      },
      {
        email: 'superadmin@demo.com',
        password: 'Super@123',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'admin'
      },
      {
        email: 'user@demo.com',
        password: 'User@123',
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
      }
    ];

    const results = [];

    for (const account of demoAccounts) {
      try {
        // Check if user already exists by email
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const userExists = existingUser.users?.some(user => user.email === account.email);
        
        if (userExists) {
          console.log(`User ${account.email} already exists, skipping creation`);
          results.push({ email: account.email, status: 'exists', message: 'User already exists' });
          continue;
        }

        // Create the user using admin.createUser
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: {
            first_name: account.firstName,
            last_name: account.lastName,
          }
        });

        if (userError || !userData.user) {
          console.error(`Error creating user ${account.email}:`, userError);
          results.push({ email: account.email, status: 'error', message: userError?.message || 'Failed to create user' });
          continue;
        }

        const userId = userData.user.id;
        console.log(`Created user ${account.email} with ID: ${userId}`);

        // Update profile (profile creation is handled by trigger)
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: account.firstName,
            last_name: account.lastName,
            display_name: `${account.firstName} ${account.lastName}`,
            approval_status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by: userId
          })
          .eq('user_id', userId);

        if (profileError) {
          console.error(`Error updating profile for ${account.email}:`, profileError);
          results.push({ email: account.email, status: 'error', message: `Profile update failed: ${profileError.message}` });
          continue;
        }
        console.log(`Updated profile for ${account.email}`);

        // Assign role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: account.role,
          });

        if (roleError) {
          console.error(`Error assigning role for ${account.email}:`, roleError);
          results.push({ email: account.email, status: 'error', message: `Role assignment failed: ${roleError.message}` });
          continue;
        }
        console.log(`Assigned role ${account.role} to ${account.email}`);

        // Create active subscription for all users
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1); // 1 year from now

        const { error: subError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            plan_type: account.role === 'admin' ? 'premium' : 'basic',
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
          })
          .eq('user_id', userId);

        if (subError) {
          console.error(`Error updating subscription for ${account.email}:`, subError);
          results.push({ email: account.email, status: 'error', message: `Subscription update failed: ${subError.message}` });
          continue;
        }
        console.log(`Updated subscription for ${account.email}`);

        results.push({ 
          email: account.email, 
          status: 'created', 
          message: 'Account created successfully',
          role: account.role 
        });

      } catch (error) {
        console.error(`Unexpected error for ${account.email}:`, error);
        results.push({ 
          email: account.email, 
          status: 'error', 
          message: 'Unexpected error occurred' 
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Demo accounts seeding completed',
        results 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Seeding error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});