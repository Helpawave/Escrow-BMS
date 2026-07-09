-- ====================================================================
-- RUN THIS IN SUPABASE SQL EDITOR TO UPDATE DATABASE TABLES & COLUMNS
-- ====================================================================

-- 1. Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_notifications boolean DEFAULT true,
  invoice_reminders boolean DEFAULT true,
  payment_alerts boolean DEFAULT true,
  auto_save_enabled boolean DEFAULT true,
  dark_mode boolean DEFAULT false,
  default_currency text DEFAULT 'INR',
  default_payment_terms text DEFAULT 'Net 30',
  invoice_template text DEFAULT 'corporate',
  hide_company_details boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists and create new one
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
CREATE POLICY "Users can manage their own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

-- 2. Alter parties table to rename "name" to "party_name" (or create it if missing)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'parties' 
      AND column_name = 'name'
  ) THEN
    ALTER TABLE public.parties RENAME COLUMN name TO party_name;
  END IF;
END $$;
