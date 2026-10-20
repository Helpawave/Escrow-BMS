-- ==============================================================================
-- ESCROW BMS: COMPLETE SCHEMA MIGRATION & FIX FOR 400 / 404 CONSOLE ERRORS
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ahdcjmydbsxoibvplmuz/sql/new
-- ==============================================================================

-- 1. FIX USER_SETTINGS TABLE
-- Ensure table exists
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure UNIQUE constraint on user_id so upsert works seamlessly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_user_id_key'
  ) THEN
    BEGIN
      ALTER TABLE public.user_settings ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);
    EXCEPTION
      WHEN duplicate_table OR duplicate_object THEN NULL;
      WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- Add all required missing columns to user_settings
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS default_terms TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS hide_company_details BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS default_payment_terms TEXT DEFAULT 'Net 30',
  ADD COLUMN IF NOT EXISTS invoice_template TEXT DEFAULT 'corporate',
  ADD COLUMN IF NOT EXISTS downpayment_template TEXT DEFAULT 'corporate',
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS whatsapp_provider TEXT DEFAULT 'meta',
  ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS invoice_reminders BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS payment_alerts BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_save_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT false;

-- Enable RLS for user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
CREATE POLICY "Users can manage their own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Public/anon read user settings" ON public.user_settings;
CREATE POLICY "Public/anon read user settings" ON public.user_settings
  FOR SELECT USING (true);


-- 2. CREATE SYSTEM_SETTINGS TABLE (Fixes 404 error)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select system_settings" ON public.system_settings;
CREATE POLICY "Allow select system_settings" ON public.system_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated manage system_settings" ON public.system_settings;
CREATE POLICY "Allow authenticated manage system_settings" ON public.system_settings
  FOR ALL USING (true);


-- 3. FIX CLIENTS TABLE (Fixes 400 error on client creation/sync)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS hide_contact_details BOOLEAN DEFAULT false;


-- 4. HELPER FUNCTION: admin_update_user_type
CREATE OR REPLACE FUNCTION public.admin_update_user_type(
  target_user_id uuid,
  new_type text
)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, user_type)
  VALUES (target_user_id, new_type)
  ON CONFLICT (user_id)
  DO UPDATE SET user_type = EXCLUDED.user_type, updated_at = now();

  INSERT INTO public.system_settings (key, value)
  VALUES ('user_type_' || target_user_id::text, to_jsonb(new_type))
  ON CONFLICT (key)
  DO UPDATE SET value = EXCLUDED.value;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.admin_update_user_type(uuid, text) TO anon, authenticated, service_role;


-- 5. RELOAD POSTGREST SCHEMA CACHE (Immediate effect)
NOTIFY pgrst, 'reload schema';
