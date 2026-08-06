-- ============================================================
-- CRITICAL FIX: Add missing columns to parties table
-- Fixes: column parties.sr_no does not exist (PostgreSQL 42703)
-- Affects: Ledger, Balance Sheet, Transfer Entry, Party Report
-- ============================================================

ALTER TABLE public.parties
  ADD COLUMN IF NOT EXISTS sr_no TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'without',
  ADD COLUMN IF NOT EXISTS monday_final BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS system_type TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'take';

-- ============================================================
-- Fix products table: missing columns
-- Fixes: column products.purchase_price does not exist (42703)
-- Affects: billing/reports, inventory/products profit calc
-- ============================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS purchase_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hsn_code TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS sku TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS opening_stock NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_id UUID;


-- Transfer tables for Transfer Entry feature
CREATE TABLE IF NOT EXISTS public.transfer_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL,
  amount NUMERIC DEFAULT 0,
  final_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transfer_custom_right_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transfer_sheet_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on transfer tables
ALTER TABLE public.transfer_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_custom_right_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_sheet_status ENABLE ROW LEVEL SECURITY;

-- RLS policies for transfer tables (create only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own transfer_entries' AND tablename = 'transfer_entries') THEN
    CREATE POLICY "Users manage own transfer_entries" ON public.transfer_entries FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own transfer_custom_right_entries' AND tablename = 'transfer_custom_right_entries') THEN
    CREATE POLICY "Users manage own transfer_custom_right_entries" ON public.transfer_custom_right_entries FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own transfer_sheet_status' AND tablename = 'transfer_sheet_status') THEN
    CREATE POLICY "Users manage own transfer_sheet_status" ON public.transfer_sheet_status FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
