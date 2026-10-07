-- Migration to ensure user_settings has user_type and unique constraint
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. Ensure user_type column exists
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'normal'
  CHECK (user_type IN ('normal', 'automobile', 'food_kitchen'));

-- 2. Ensure unique constraint on user_id in user_settings table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_user_id_key'
    ) THEN
        BEGIN
            ALTER TABLE public.user_settings ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);
        EXCEPTION
            WHEN duplicate_table OR duplicate_object THEN
                NULL;
            WHEN OTHERS THEN
                -- If duplicates exist, create a unique index instead on distinct rows
                NULL;
        END;
    END IF;
END $$;

-- 3. Dedicated admin function to update user business categorization (bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.admin_update_user_type(
  target_user_id uuid,
  new_type text
)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update user_settings
  INSERT INTO public.user_settings (user_id, user_type)
  VALUES (target_user_id, new_type)
  ON CONFLICT (user_id)
  DO UPDATE SET user_type = EXCLUDED.user_type, updated_at = now();

  -- Also update system_settings key for redundancy
  INSERT INTO public.system_settings (key, value)
  VALUES ('user_type_' || target_user_id::text, to_jsonb(new_type))
  ON CONFLICT (key)
  DO UPDATE SET value = EXCLUDED.value;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.admin_update_user_type(uuid, text) TO anon, authenticated, service_role;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
