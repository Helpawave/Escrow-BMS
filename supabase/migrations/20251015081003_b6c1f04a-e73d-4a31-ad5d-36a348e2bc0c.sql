-- Update subscription model to 15-day trial period
-- After 15 days, users need to purchase a subscription

-- First, add a trial_end_date column to subscriptions table if needed
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS trial_end_date timestamp with time zone;

-- Update the handle_new_user function to create 14-day trial subscriptions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles table with admin role by default
  INSERT INTO public.profiles (user_id, first_name, last_name, display_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'first_name'),
    'admin'
  );
  
  -- Insert default user role as admin (owner of their workspace)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  -- Create 14-day trial subscription
  INSERT INTO public.subscriptions (user_id, status, plan_type, start_date, end_date, trial_end_date)
  VALUES (
    NEW.id, 
    'active', 
    'free',
    NOW(),
    NOW() + INTERVAL '14 days',  -- Trial ends in 14 days
    NOW() + INTERVAL '14 days'   -- Mark as trial period
  );
  
  RETURN NEW;
END;
$function$;