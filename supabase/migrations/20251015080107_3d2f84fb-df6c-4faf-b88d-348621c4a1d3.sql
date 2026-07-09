-- Remove approval workflow from profiles table
-- This is a subscription-based product, users should be able to login immediately

-- Drop the approval-related columns from profiles table
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS approval_status,
  DROP COLUMN IF EXISTS approved_at,
  DROP COLUMN IF EXISTS approved_by,
  DROP COLUMN IF EXISTS rejection_reason;

-- Update the handle_new_user trigger to create active subscriptions by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (user_id, first_name, last_name, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'first_name')
  );
  
  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create active subscription with start date (subscription-based product)
  INSERT INTO public.subscriptions (user_id, status, plan_type, start_date, end_date)
  VALUES (
    NEW.id, 
    'active', 
    'basic',
    NOW(),
    NOW() + INTERVAL '1 year'
  );
  
  RETURN NEW;
END;
$function$;