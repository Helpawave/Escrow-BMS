-- ============================================================
-- SQL MIGRATION: Expenses Schema Fix, Backfill & RLS Audit
-- ============================================================

-- 1. Safely add missing columns to expenses table
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS expense_date DATE,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS is_billable BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS client_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- 2. Historical Data Backfill Strategy (Item 7)
-- Preserve original transaction dates for pre-existing rows using created_at
UPDATE public.expenses
SET expense_date = COALESCE(created_at::date, CURRENT_DATE)
WHERE expense_date IS NULL;

-- Set DEFAULT for new records
ALTER TABLE public.expenses
  ALTER COLUMN expense_date SET DEFAULT CURRENT_DATE;

-- 3. RLS Security Policy Audit with WITH CHECK (Item 5)
DO $$
BEGIN
  -- transfer_entries
  DROP POLICY IF EXISTS "Users manage own transfer_entries" ON public.transfer_entries;
  CREATE POLICY "Users manage own transfer_entries" 
    ON public.transfer_entries 
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

  -- transfer_custom_right_entries
  DROP POLICY IF EXISTS "Users manage own transfer_custom_right_entries" ON public.transfer_custom_right_entries;
  CREATE POLICY "Users manage own transfer_custom_right_entries" 
    ON public.transfer_custom_right_entries 
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

  -- transfer_sheet_status
  DROP POLICY IF EXISTS "Users manage own transfer_sheet_status" ON public.transfer_sheet_status;
  CREATE POLICY "Users manage own transfer_sheet_status" 
    ON public.transfer_sheet_status 
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);
END $$;

-- 4. Verification query
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'expenses' AND table_schema = 'public'
ORDER BY ordinal_position;
