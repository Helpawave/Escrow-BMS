-- Add admin management functions and triggers

-- Function to handle admin password reset
CREATE OR REPLACE FUNCTION admin_reset_user_password(target_user_id UUID, admin_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if admin has super_admin role
  IF NOT has_role(admin_user_id, 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- Log the admin action
  INSERT INTO admin_actions (admin_id, action_type, target_user_id, details)
  VALUES (admin_user_id, 'password_reset', target_user_id, 'Admin initiated password reset');
  
  RETURN true;
END;
$$;

-- Create admin actions table for audit trail
CREATE TABLE public.admin_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_user_id UUID,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_actions
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Policy for super admins to view all admin actions
CREATE POLICY "Super admins can view all admin actions"
ON public.admin_actions
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Policy for super admins to insert admin actions
CREATE POLICY "Super admins can insert admin actions"
ON public.admin_actions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Add subscription management columns if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'stripe_subscription_id') THEN
    ALTER TABLE public.subscriptions ADD COLUMN stripe_subscription_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'plan_type') THEN
    ALTER TABLE public.subscriptions ADD COLUMN plan_type TEXT DEFAULT 'basic';
  END IF;
END
$$;

-- Function to extend user subscription
CREATE OR REPLACE FUNCTION admin_extend_subscription(
  target_user_id UUID, 
  admin_user_id UUID,
  extend_months INTEGER DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if admin has super_admin role
  IF NOT has_role(admin_user_id, 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- Update or create subscription
  INSERT INTO public.subscriptions (user_id, status, start_date, end_date, plan_type)
  VALUES (
    target_user_id, 
    'active'::subscription_status,
    COALESCE((SELECT end_date FROM subscriptions WHERE user_id = target_user_id AND status = 'active' ORDER BY end_date DESC LIMIT 1), now()),
    COALESCE((SELECT end_date FROM subscriptions WHERE user_id = target_user_id AND status = 'active' ORDER BY end_date DESC LIMIT 1), now()) + (extend_months || ' months')::interval,
    'premium'
  )
  ON CONFLICT (user_id) WHERE status = 'active'
  DO UPDATE SET 
    end_date = subscriptions.end_date + (extend_months || ' months')::interval,
    updated_at = now();
  
  -- Log the admin action
  INSERT INTO admin_actions (admin_id, action_type, target_user_id, details)
  VALUES (admin_user_id, 'subscription_extended', target_user_id, 'Extended subscription by ' || extend_months || ' months');
  
  RETURN true;
END;
$$;