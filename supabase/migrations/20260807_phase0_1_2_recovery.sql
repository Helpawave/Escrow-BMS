-- ====================================================================
-- ESCROW BMS — PHASE 0, 1 & 2 FOUNDATION RECOVERY MIGRATION
-- Migration: 20260807_phase0_1_2_recovery.sql
-- Status: NON-DESTRUCTIVE PRE-MIGRATION AUDITED
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. ONE-TIME SUPERADMIN ROLE MIGRATION (Anti-Lockout, Safe Cast)
-- Grant super_admin role in user_roles for existing admin accounts
-- --------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
      INSERT INTO public.user_roles (user_id, role)
      SELECT id, 'super_admin'::public.app_role
      FROM auth.users
      WHERE LOWER(email) IN ('admin_bms@escrowbms.com', 'admin@escrowbms.com', '5213aadarsh@gmail.com')
      ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
      INSERT INTO public.user_roles (user_id, role)
      SELECT id, 'super_admin'
      FROM auth.users
      WHERE LOWER(email) IN ('admin_bms@escrowbms.com', 'admin@escrowbms.com', '5213aadarsh@gmail.com')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;

-- --------------------------------------------------------------------
-- 2. MONDAY FINAL STORED RPC PROCEDURE (execute_monday_final)
-- Preserves verified business logic with tenant security isolation
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.execute_monday_final(
  p_party_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_closing_balance NUMERIC DEFAULT 0,
  p_remarks TEXT DEFAULT 'MONDAY FINAL SETTLEMENT'
)
RETURNS VOID AS $$
DECLARE
  v_effective_user_id UUID;
  v_settlement_id UUID;
  v_tns_type TEXT;
  v_credit NUMERIC;
  v_debit NUMERIC;
BEGIN
  v_effective_user_id := COALESCE(auth.uid(), p_user_id);

  -- Multi-tenant isolation check: verify target party belongs to user
  IF v_effective_user_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.parties
      WHERE id = p_party_id AND (user_id = v_effective_user_id OR user_id IS NULL)
    ) THEN
      RAISE EXCEPTION 'Unauthorized: Target party does not belong to user.';
    END IF;
  END IF;

  -- Enable transaction-local lock bypass for archival operations
  PERFORM set_config('app.bypass_monday_final_lock', 'true', true);

  -- Calculate Credit/Debit based on closing balance
  v_tns_type := CASE WHEN p_closing_balance >= 0 THEN 'CR' ELSE 'DR' END;
  v_credit := CASE WHEN p_closing_balance >= 0 THEN p_closing_balance ELSE 0 END;
  v_debit := CASE WHEN p_closing_balance < 0 THEN ABS(p_closing_balance) ELSE 0 END;

  -- 1. Insert single Settlement Record
  INSERT INTO public.transactions (
    id, party_id, remarks, tns_type, credit, debit, balance, is_settlement, is_finalized, user_id, transaction_date
  )
  VALUES (
    gen_random_uuid(), p_party_id, p_remarks, v_tns_type, v_credit, v_debit, p_closing_balance, true, false, v_effective_user_id, NOW()
  )
  RETURNING id INTO v_settlement_id;

  -- 2. Archive active records for target party
  UPDATE public.transactions
  SET is_finalized = true, settlement_id = v_settlement_id
  WHERE party_id = p_party_id
    AND id != v_settlement_id
    AND (is_finalized = false OR is_finalized IS NULL);

  -- 3. Update party status
  UPDATE public.parties
  SET monday_final = true
  WHERE id = p_party_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------------------------------
-- 3. FINALIZED TRANSACTION PROTECTION TRIGGER (check_transaction_lock)
-- Database-level protection for finalized ledger transactions
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_transaction_lock()
RETURNS TRIGGER AS $$
BEGIN
  -- If transaction-local session bypass is active (inside execute_monday_final), allow
  IF current_setting('app.bypass_monday_final_lock', true) = 'true' THEN
    IF (TG_OP = 'DELETE') THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  IF (TG_OP = 'UPDATE') THEN
    -- Unconditionally allow toggling ONLY the is_checked column (reconciliation checklist)
    IF (OLD.is_checked IS DISTINCT FROM NEW.is_checked AND
        OLD.id = NEW.id AND
        OLD.user_id IS NOT DISTINCT FROM NEW.user_id AND
        OLD.party_id = NEW.party_id AND
        OLD.transaction_date = NEW.transaction_date AND
        OLD.remarks IS NOT DISTINCT FROM NEW.remarks AND
        OLD.tns_type = NEW.tns_type AND
        OLD.credit = NEW.credit AND
        OLD.debit = NEW.debit AND
        OLD.balance = NEW.balance AND
        OLD.is_settlement IS NOT DISTINCT FROM NEW.is_settlement AND
        OLD.is_finalized IS NOT DISTINCT FROM NEW.is_finalized) THEN
      RETURN NEW;
    END IF;

    -- Prevent updating settlement records
    IF (OLD.is_settlement = true) THEN
      RAISE EXCEPTION 'Monday Final settlement records cannot be modified once created.';
    END IF;

    -- Allow unlocking finalized transactions if explicitly un-finalizing
    IF (OLD.is_finalized = true AND NEW.is_finalized = false) THEN
      RETURN NEW;
    END IF;
    
    -- Prevent editing financial details of finalized records
    IF (OLD.is_finalized = true) THEN
      RAISE EXCEPTION 'Cannot modify a finalized transaction.';
    END IF;

    RETURN NEW;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    IF (OLD.is_settlement = true) THEN
      RAISE EXCEPTION 'Monday Final settlement records cannot be deleted once created.';
    END IF;

    IF (OLD.is_finalized = true) THEN
      RAISE EXCEPTION 'Cannot delete a finalized transaction.';
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_transaction_lock ON public.transactions;
CREATE TRIGGER enforce_transaction_lock
  BEFORE UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_transaction_lock();

-- --------------------------------------------------------------------
-- 4. RLS SECURITY POLICIES & AUDIT PATCHES
-- --------------------------------------------------------------------
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- user_settings policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own user settings' AND tablename = 'user_settings') THEN
    CREATE POLICY "Users manage own user settings" ON public.user_settings
      FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- user_roles policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users view own roles' AND tablename = 'user_roles') THEN
    CREATE POLICY "Users view own roles" ON public.user_roles
      FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- invoice_items child RLS policy
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_items' AND table_schema = 'public') THEN
    ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own invoice_items via parent' AND tablename = 'invoice_items') THEN
      CREATE POLICY "Users manage own invoice_items via parent" ON public.invoice_items
        FOR ALL TO authenticated
        USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()))
        WITH CHECK (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
    END IF;
  END IF;

  -- purchase_invoice_items child RLS policy (Supporting invoice_id or purchase_invoice_id column names)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_invoice_items' AND table_schema = 'public') THEN
    ALTER TABLE public.purchase_invoice_items ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own purchase_invoice_items via parent' AND tablename = 'purchase_invoice_items') THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_invoice_items' AND column_name = 'invoice_id') THEN
        CREATE POLICY "Users manage own purchase_invoice_items via parent" ON public.purchase_invoice_items
          FOR ALL TO authenticated
          USING (EXISTS (SELECT 1 FROM public.purchase_invoices WHERE purchase_invoices.id = purchase_invoice_items.invoice_id AND purchase_invoices.user_id = auth.uid()))
          WITH CHECK (EXISTS (SELECT 1 FROM public.purchase_invoices WHERE purchase_invoices.id = purchase_invoice_items.invoice_id AND purchase_invoices.user_id = auth.uid()));
      ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_invoice_items' AND column_name = 'purchase_invoice_id') THEN
        CREATE POLICY "Users manage own purchase_invoice_items via parent" ON public.purchase_invoice_items
          FOR ALL TO authenticated
          USING (EXISTS (SELECT 1 FROM public.purchase_invoices WHERE purchase_invoices.id = purchase_invoice_items.purchase_invoice_id AND purchase_invoices.user_id = auth.uid()))
          WITH CHECK (EXISTS (SELECT 1 FROM public.purchase_invoices WHERE purchase_invoices.id = purchase_invoice_items.purchase_invoice_id AND purchase_invoices.user_id = auth.uid()));
      END IF;
    END IF;
  END IF;
END $$;
