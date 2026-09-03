-- ==============================================================================
-- ESCROW BMS: ACCOUNT LEDGER COMPLETE DATABASE FIX (V2 - Amount & Direct Parity)
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'amount'
  ) THEN
    ALTER TABLE public.transactions ALTER COLUMN amount DROP NOT NULL;
    ALTER TABLE public.transactions ALTER COLUMN amount SET DEFAULT 0;
  ELSE
    ALTER TABLE public.transactions ADD COLUMN amount NUMERIC DEFAULT 0;
  END IF;
END $$;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS linked_transaction_id UUID,
  ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS remarks TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tns_type TEXT DEFAULT 'CR',
  ADD COLUMN IF NOT EXISTS credit NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS debit NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_checked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_modified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_settlement BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS settlement_id UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.parties
  ADD COLUMN IF NOT EXISTS sr_no TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'without',
  ADD COLUMN IF NOT EXISTS monday_final BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS system_type TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'take',
  ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
  DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
  DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
  DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
  DROP POLICY IF EXISTS "transactions_all_policy" ON public.transactions;
  DROP POLICY IF EXISTS "parties_all_policy" ON public.parties;
END $$;

CREATE POLICY "transactions_all_policy" 
ON public.transactions FOR ALL 
TO authenticated 
USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.parties WHERE parties.id = transactions.party_id AND parties.user_id = auth.uid())
)
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.parties WHERE parties.id = transactions.party_id AND parties.user_id = auth.uid())
);

CREATE POLICY "parties_all_policy" 
ON public.parties FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

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
    id, user_id, party_id, linked_transaction_id, remarks, tns_type, credit, debit, amount, created_at
  ) VALUES (
    v_chain_id, p_user_id, p_party_id, v_chain_id, COALESCE(p_remarks, ''), p_tns_type, v_credit_a, v_debit_a, p_amount, NOW()
  );

  INSERT INTO public.transactions (
    id, user_id, party_id, linked_transaction_id, remarks, tns_type, credit, debit, amount, created_at
  ) VALUES (
    gen_random_uuid(), p_user_id, p_linked_party_id, v_chain_id, COALESCE(p_remarks, ''), v_second_type, v_credit_b, v_debit_b, p_amount, NOW()
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
