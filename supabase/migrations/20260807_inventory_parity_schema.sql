-- ============================================================================
-- ESCROW BMS — INVENTORY PARITY SCHEMA & STOCK MOVEMENT AUDIT LEDGER
-- Migration File: 20260807_inventory_parity_schema.sql
-- Status: LOCAL DEVELOPMENT UNAPPLIED
-- ============================================================================

-- 1. Add location and returnable_item to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS returnable_item BOOLEAN DEFAULT FALSE;

-- 2. Add current_stock initially nullable for explicit backfill
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS current_stock NUMERIC;

-- 3. Perform one-time explicit backfill from authoritative opening_stock
UPDATE public.products 
SET current_stock = COALESCE(NULLIF(regexp_replace(opening_stock, '[^0-9.]', '', 'g'), '')::numeric, 0)
WHERE current_stock IS NULL;

-- 4. Apply DEFAULT and NOT NULL constraints post-backfill
ALTER TABLE public.products ALTER COLUMN current_stock SET DEFAULT 0;
ALTER TABLE public.products ALTER COLUMN current_stock SET NOT NULL;

-- 5. Create immutable stock_movements audit ledger table
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT', 'SALE', 'PURCHASE', 'SALE_CANCEL', 'PURCHASE_CANCEL')),
  quantity NUMERIC NOT NULL,
  before_quantity NUMERIC NOT NULL,
  after_quantity NUMERIC NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('INVOICE', 'PURCHASE_INVOICE', 'MANUAL', 'INITIAL')),
  reference_id TEXT,
  reason TEXT,
  idempotency_key TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance & durable idempotency
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user ON public.stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ref ON public.stock_movements(reference_type, reference_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_movements_user_idempotency 
ON public.stock_movements(user_id, idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- Enable RLS & Enforce Immutability (SELECT only; zero UPDATE/DELETE policies)
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users view own stock movements" ON public.stock_movements;

CREATE POLICY "Users view own stock movements" 
ON public.stock_movements FOR SELECT 
USING (auth.uid() = user_id);
