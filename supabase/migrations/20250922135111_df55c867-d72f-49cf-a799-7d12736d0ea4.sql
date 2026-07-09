-- Update services table to include the 5 core modules
DELETE FROM services;

INSERT INTO services (name, description, is_active) VALUES
('Invoice', 'Invoice management and generation', true),
('Inventory', 'Inventory tracking and management', true),
('Ledger', 'Financial ledger and accounting', true),
('CRM', 'Customer relationship management', true),
('DailyCalc', 'Daily calculations and reporting', true);

-- Update subscription plans to be specific
UPDATE subscriptions SET plan_type = 'basic' WHERE plan_type IS NULL OR plan_type = 'basic';

-- Create user module access table for admin overrides
CREATE TABLE public.user_module_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  overridden_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_id)
);

-- Enable RLS on user_module_access
ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;

-- Create policies for user_module_access
CREATE POLICY "Admins can manage user module access" 
ON public.user_module_access 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own module access" 
ON public.user_module_access 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_user_module_access_updated_at
BEFORE UPDATE ON public.user_module_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get user accessible modules based on plan + overrides
CREATE OR REPLACE FUNCTION public.get_user_accessible_modules(_user_id uuid)
RETURNS TABLE(
  service_id uuid,
  service_name text,
  service_description text,
  is_accessible boolean
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_subscription AS (
    SELECT plan_type
    FROM subscriptions 
    WHERE user_id = _user_id 
    AND status = 'active'
    LIMIT 1
  ),
  plan_modules AS (
    SELECT s.id as service_id, s.name as service_name, s.description as service_description,
           CASE 
             WHEN (SELECT plan_type FROM user_subscription) = 'basic' 
               THEN s.name IN ('Invoice', 'Inventory')
             WHEN (SELECT plan_type FROM user_subscription) = 'standard' 
               THEN s.name IN ('Invoice', 'Inventory', 'Ledger')
             WHEN (SELECT plan_type FROM user_subscription) = 'premium' 
               THEN true
             ELSE false
           END as plan_allows
    FROM services s
    WHERE s.is_active = true
  ),
  user_overrides AS (
    SELECT service_id, is_enabled
    FROM user_module_access
    WHERE user_id = _user_id
  )
  SELECT 
    pm.service_id,
    pm.service_name,
    pm.service_description,
    CASE 
      WHEN uo.service_id IS NOT NULL THEN uo.is_enabled
      ELSE pm.plan_allows
    END as is_accessible
  FROM plan_modules pm
  LEFT JOIN user_overrides uo ON pm.service_id = uo.service_id;
$$;