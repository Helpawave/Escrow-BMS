-- Add admin access policy for profiles table
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin access policy for company_profiles table
CREATE POLICY "Admins can view all company profiles"
ON public.company_profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));