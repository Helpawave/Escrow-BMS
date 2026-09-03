-- ==============================================================================
-- ESCROW BMS: COMPLETE ACCOUNT LEDGER DATABASE MASTER SYNC
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.parties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  party_name TEXT NOT NULL,
  sr_no TEXT DEFAULT '',
  status TEXT DEFAULT 'take',
  commission_rate NUMERIC DEFAULT 0,
  commission_type TEXT DEFAULT 'without',
  monday_final BOOLEAN DEFAULT FALSE,
  system_type TEXT DEFAULT 'normal',
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.parties
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS party_name TEXT,
  ADD COLUMN IF NOT EXISTS sr_no TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'take',
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'without',
  ADD COLUMN IF NOT EXISTS monday_final BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS system_type TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
  linked_transaction_id UUID,
  transaction_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  remarks TEXT DEFAULT '',
  tns_type TEXT DEFAULT 'CR',
  type TEXT DEFAULT 'CR',
  credit NUMERIC NOT NULL DEFAULT 0,
  debit NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  is_checked BOOLEAN DEFAULT FALSE,
  is_finalized BOOLEAN DEFAULT FALSE,
  is_modified BOOLEAN DEFAULT FALSE,
  is_settlement BOOLEAN DEFAULT FALSE,
  settlement_id UUID,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS linked_transaction_id UUID,
  ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS remarks TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tns_type TEXT DEFAULT 'CR',
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'CR',
  ADD COLUMN IF NOT EXISTS credit NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS debit NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_checked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_modified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_settlement BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS settlement_id UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'date') THEN
    ALTER TABLE public.transactions ALTER COLUMN date DROP NOT NULL;
    ALTER TABLE public.transactions ALTER COLUMN date SET DEFAULT timezone('utc'::text, now());
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'amount') THEN
    ALTER TABLE public.transactions ALTER COLUMN amount DROP NOT NULL;
    ALTER TABLE public.transactions ALTER COLUMN amount SET DEFAULT 0;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'type') THEN
    ALTER TABLE public.transactions ALTER COLUMN type DROP NOT NULL;
    ALTER TABLE public.transactions ALTER COLUMN type SET DEFAULT 'CR';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.transfer_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  final_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.transfer_custom_right_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  party_name TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.transfer_sheet_status (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  is_saved BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_custom_right_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_sheet_status ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "parties_all_policy" ON public.parties;
  DROP POLICY IF EXISTS "transactions_all_policy" ON public.transactions;
  DROP POLICY IF EXISTS "transfer_entries_all_policy" ON public.transfer_entries;
  DROP POLICY IF EXISTS "transfer_custom_right_entries_all_policy" ON public.transfer_custom_right_entries;
  DROP POLICY IF EXISTS "transfer_sheet_status_all_policy" ON public.transfer_sheet_status;
END $$;

CREATE POLICY "parties_all_policy" ON public.parties FOR ALL TO authenticated 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_all_policy" ON public.transactions FOR ALL TO authenticated 
USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.parties WHERE parties.id = transactions.party_id AND parties.user_id = auth.uid())
)
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.parties WHERE parties.id = transactions.party_id AND parties.user_id = auth.uid())
);

CREATE POLICY "transfer_entries_all_policy" ON public.transfer_entries FOR ALL TO authenticated 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transfer_custom_right_entries_all_policy" ON public.transfer_custom_right_entries FOR ALL TO authenticated 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transfer_sheet_status_all_policy" ON public.transfer_sheet_status FOR ALL TO authenticated 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.execute_monday_final(
  p_party_id UUID, 
  p_user_id UUID, 
  p_closing_balance NUMERIC, 
  p_remarks TEXT
)
RETURNS VOID AS $$
DECLARE
  v_settlement_id UUID;
  v_tns_type TEXT;
  v_credit NUMERIC;
  v_debit NUMERIC;
BEGIN
  v_tns_type := CASE WHEN p_closing_balance >= 0 THEN 'CR' ELSE 'DR' END;
  v_credit := CASE WHEN p_closing_balance >= 0 THEN p_closing_balance ELSE 0 END;
  v_debit := CASE WHEN p_closing_balance < 0 THEN abs(p_closing_balance) else 0 end;

  INSERT INTO public.transactions (
    id, party_id, remarks, tns_type, type, credit, debit, amount, balance, 
    is_settlement, is_finalized, user_id, date, transaction_date, created_at
  )
  VALUES (
    gen_random_uuid(), p_party_id, COALESCE(p_remarks, 'MONDAY FINAL SETTLEMENT'), 
    v_tns_type, v_tns_type, v_credit, v_debit, abs(p_closing_balance), p_closing_balance, 
    true, false, p_user_id, NOW(), NOW(), NOW()
  )
  RETURNING id INTO v_settlement_id;

  UPDATE public.transactions
  SET is_finalized = true, settlement_id = v_settlement_id
  WHERE party_id = p_party_id 
    AND id != v_settlement_id 
    AND (is_finalized = false OR is_finalized IS NULL);

  UPDATE public.parties
  SET monday_final = true
  WHERE id = p_party_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.post_ledger_transaction(
  p_user_id UUID,
  p_party_id UUID,
  p_linked_party_id UUID,
  p_amount NUMERIC,
  p_tns_type TEXT,
  p_remarks TEXT,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chain_id UUID := gen_random_uuid();
  v_second_type TEXT;
  v_credit_a NUMERIC := 0;
  v_debit_a NUMERIC := 0;
  v_credit_b NUMERIC := 0;
  v_debit_b NUMERIC := 0;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be greater than zero');
  END IF;

  v_second_type := CASE WHEN p_tns_type = 'CR' THEN 'DR' ELSE 'CR' END;
  
  IF p_tns_type = 'CR' THEN
    v_credit_a := p_amount;
    v_debit_b := p_amount;
  ELSE
    v_debit_a := p_amount;
    v_credit_b := p_amount;
  END IF;

  INSERT INTO public.transactions (
    id, user_id, party_id, linked_transaction_id, remarks, tns_type, type, credit, debit, amount, date, transaction_date, created_at
  ) VALUES (
    v_chain_id, p_user_id, p_party_id, v_chain_id, COALESCE(p_remarks, ''), p_tns_type, p_tns_type, v_credit_a, v_debit_a, p_amount, NOW(), NOW(), NOW()
  );

  INSERT INTO public.transactions (
    id, user_id, party_id, linked_transaction_id, remarks, tns_type, type, credit, debit, amount, date, transaction_date, created_at
  ) VALUES (
    gen_random_uuid(), p_user_id, p_linked_party_id, v_chain_id, COALESCE(p_remarks, ''), v_second_type, v_second_type, v_credit_b, v_debit_b, p_amount, NOW(), NOW(), NOW()
  );

  UPDATE public.parties 
  SET balance = COALESCE(balance, 0) + v_credit_a - v_debit_a
  WHERE id = p_party_id;

  UPDATE public.parties 
  SET balance = COALESCE(balance, 0) + v_credit_b - v_debit_b
  WHERE id = p_linked_party_id;

  RETURN jsonb_build_object('success', true, 'chain_id', v_chain_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

NOTIFY pgrst, 'reload schema';
