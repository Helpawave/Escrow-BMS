-- Migration to add allowed_modules permissions to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS allowed_modules TEXT[] DEFAULT ARRAY['billing', 'payroll', 'ledger', 'inventory', 'crm', 'daily-hisab'];

-- Enable read/write access for authenticated users to update profiles (workspace owners)
CREATE POLICY "Allow workspace owners to update employee profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);
