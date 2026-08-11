-- ============================================================================
-- ESCROW BMS — TRANSACTION-SAFE & IDEMPOTENT FINANCIAL & STOCK RPCS
-- Migration File: 20260807_financial_rpcs.sql
-- Status: LOCAL DEVELOPMENT UNAPPLIED
-- ============================================================================

-- 0. Add idempotency_key column and unique index to transactions table
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_user_idempotency 
ON public.transactions (user_id, idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 1. SINGLE PRODUCT STOCK MUTATION RPC (Internal Helper & Single Item Use)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_invoice_stock_mutation(
  p_user_id UUID,
  p_product_id UUID,
  p_quantity NUMERIC,
  p_movement_type TEXT,
  p_reference_type TEXT DEFAULT 'INVOICE',
  p_reference_id TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_movement_id UUID;
  v_before_qty NUMERIC;
  v_after_qty NUMERIC;
  v_effective_delta NUMERIC;
  v_movement_id UUID;
  v_abs_qty NUMERIC;
BEGIN
  -- Verify ownership & multi-tenant isolation
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: User ID mismatch';
  END IF;

  -- Durable Idempotency Check: Return existing movement if key already processed
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    SELECT id INTO v_existing_movement_id
    FROM public.stock_movements
    WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key
    LIMIT 1;

    IF v_existing_movement_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'idempotent_replay', true,
        'product_id', p_product_id,
        'movement_id', v_existing_movement_id
      );
    END IF;
  END IF;

  v_abs_qty := abs(p_quantity);

  -- Explicit direction & sign semantics per movement type
  CASE upper(p_movement_type)
    WHEN 'SALE', 'PURCHASE_CANCEL', 'OUT' THEN
      v_effective_delta := -v_abs_qty;
    WHEN 'PURCHASE', 'SALE_CANCEL', 'IN' THEN
      v_effective_delta := v_abs_qty;
    WHEN 'ADJUSTMENT' THEN
      v_effective_delta := p_quantity;
    ELSE
      RAISE EXCEPTION 'Invalid movement_type: %', p_movement_type;
  END CASE;

  -- Lock product row for update
  SELECT current_stock INTO v_before_qty
  FROM public.products
  WHERE id = p_product_id AND user_id = p_user_id
  FOR UPDATE;

  IF v_before_qty IS NULL THEN
    -- Fallback for pre-migration rows: parse opening_stock if current_stock is null
    SELECT COALESCE(NULLIF(regexp_replace(opening_stock, '[^0-9.]', '', 'g'), '')::numeric, 0)
    INTO v_before_qty
    FROM public.products
    WHERE id = p_product_id AND user_id = p_user_id;

    IF v_before_qty IS NULL THEN
      RAISE EXCEPTION 'Product % not found or access denied', p_product_id;
    END IF;
  END IF;

  v_after_qty := v_before_qty + v_effective_delta;

  -- Update canonical current_stock on products (preserve opening_stock as historical baseline)
  UPDATE public.products
  SET current_stock = v_after_qty
  WHERE id = p_product_id AND user_id = p_user_id;

  -- Log immutable stock movement record
  INSERT INTO public.stock_movements (
    user_id, product_id, movement_type, quantity,
    before_quantity, after_quantity, reference_type,
    reference_id, reason, idempotency_key, created_by
  ) VALUES (
    p_user_id, p_product_id, upper(p_movement_type), v_effective_delta,
    v_before_qty, v_after_qty, p_reference_type,
    p_reference_id, p_reason, p_idempotency_key, p_user_id
  )
  RETURNING id INTO v_movement_id;

  RETURN jsonb_build_object(
    'success', true,
    'idempotent_replay', false,
    'product_id', p_product_id,
    'movement_type', upper(p_movement_type),
    'effective_delta', v_effective_delta,
    'before_quantity', v_before_qty,
    'after_quantity', v_after_qty,
    'movement_id', v_movement_id
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. INVOICE-LEVEL ATOMIC BATCH STOCK MUTATION RPC
-- All products inside an invoice are updated atomically in ONE PostgreSQL transaction.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_invoice_stock_batch_mutation(
  p_user_id UUID,
  p_items JSONB,
  p_movement_type TEXT,
  p_reference_type TEXT DEFAULT 'INVOICE',
  p_reference_id TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_operation_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item JSONB;
  v_product_id UUID;
  v_quantity NUMERIC;
  v_item_key TEXT;
  v_existing_count INT;
  v_results JSONB := '[]'::jsonb;
  v_single_result JSONB;
BEGIN
  -- Verify ownership
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: User ID mismatch';
  END IF;

  -- Batch Idempotency Check: if operation_id is passed, check if movements for this operation already logged
  IF p_operation_id IS NOT NULL AND p_operation_id <> '' THEN
    SELECT COUNT(*) INTO v_existing_count
    FROM public.stock_movements
    WHERE user_id = p_user_id AND idempotency_key LIKE (p_operation_id || ':%');

    IF v_existing_count > 0 THEN
      RETURN jsonb_build_object(
        'success', true,
        'idempotent_replay', true,
        'operation_id', p_operation_id,
        'processed_items_count', v_existing_count
      );
    END IF;
  END IF;

  -- Process each item atomically inside the single PostgreSQL transaction block
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;

    IF v_product_id IS NOT NULL AND v_quantity IS NOT NULL AND v_quantity <> 0 THEN
      v_item_key := CASE 
        WHEN p_operation_id IS NOT NULL AND p_operation_id <> '' THEN p_operation_id || ':' || v_product_id || ':' || upper(p_movement_type)
        ELSE NULL
      END;

      v_single_result := public.process_invoice_stock_mutation(
        p_user_id,
        v_product_id,
        v_quantity,
        p_movement_type,
        p_reference_type,
        p_reference_id,
        p_reason,
        v_item_key
      );

      v_results := v_results || v_single_result;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'idempotent_replay', false,
    'operation_id', p_operation_id,
    'results', v_results
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. TRANSACTION-SAFE & IDEMPOTENT LEDGER POSTING RPC (2-Way and 3-Way Atomic)
-- ----------------------------------------------------------------------------
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
  v_existing_id UUID;
  v_credit NUMERIC := 0;
  v_debit NUMERIC := 0;
  v_opp_credit NUMERIC := 0;
  v_opp_debit NUMERIC := 0;
  v_primary_id UUID;
  v_opposite_id UUID;
  v_party_name TEXT;
  v_linked_party_name TEXT;
  v_party_balance NUMERIC := 0;
  v_opp_balance NUMERIC := 0;
BEGIN
  -- Verify multi-tenant access
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: User ID mismatch';
  END IF;

  -- Durable Idempotency Check: return existing transaction if key was already processed
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    SELECT id INTO v_existing_id
    FROM public.transactions
    WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'idempotent_replay', true,
        'primary_id', v_existing_id
      );
    END IF;
  END IF;

  -- Fetch primary party name
  SELECT party_name INTO v_party_name
  FROM public.parties
  WHERE id = p_party_id AND user_id = p_user_id;

  IF v_party_name IS NULL THEN
    RAISE EXCEPTION 'Primary party not found';
  END IF;

  -- Set CR/DR values
  IF upper(p_tns_type) = 'CR' THEN
    v_credit := abs(p_amount);
    v_opp_debit := abs(p_amount);
  ELSE
    v_debit := abs(p_amount);
    v_opp_credit := abs(p_amount);
  END IF;

  -- Fetch linked party name if provided
  IF p_linked_party_id IS NOT NULL THEN
    SELECT party_name INTO v_linked_party_name
    FROM public.parties
    WHERE id = p_linked_party_id AND user_id = p_user_id;
  END IF;

  -- Calculate running balance for primary party
  SELECT COALESCE(SUM(credit - debit), 0) INTO v_party_balance
  FROM public.transactions
  WHERE party_id = p_party_id AND user_id = p_user_id;

  v_party_balance := v_party_balance + (v_credit - v_debit);

  -- Insert Primary Transaction Row with Idempotency Key
  INSERT INTO public.transactions (
    user_id, party_id, remarks, tns_type, credit, debit,
    balance, partner_party_name, transaction_date, idempotency_key
  ) VALUES (
    p_user_id, p_party_id, p_remarks, upper(p_tns_type), v_credit, v_debit,
    v_party_balance, v_linked_party_name, now(), p_idempotency_key
  )
  RETURNING id INTO v_primary_id;

  -- Insert Opposite Entry if linked party exists inside the SAME atomic transaction
  IF p_linked_party_id IS NOT NULL THEN
    SELECT COALESCE(SUM(credit - debit), 0) INTO v_opp_balance
    FROM public.transactions
    WHERE party_id = p_linked_party_id AND user_id = p_user_id;

    v_opp_balance := v_opp_balance + (v_opp_credit - v_opp_debit);

    INSERT INTO public.transactions (
      user_id, party_id, remarks, tns_type, credit, debit,
      balance, partner_party_name, linked_transaction_id, transaction_date
    ) VALUES (
      p_user_id, p_linked_party_id, p_remarks,
      CASE WHEN upper(p_tns_type) = 'CR' THEN 'DR' ELSE 'CR' END,
      v_opp_credit, v_opp_debit, v_opp_balance, v_party_name, v_primary_id, now()
    )
    RETURNING id INTO v_opposite_id;

    -- Link back primary to opposite
    UPDATE public.transactions
    SET linked_transaction_id = v_opposite_id
    WHERE id = v_primary_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'idempotent_replay', false,
    'primary_id', v_primary_id,
    'opposite_id', v_opposite_id,
    'primary_balance', v_party_balance
  );
END;
$$;
