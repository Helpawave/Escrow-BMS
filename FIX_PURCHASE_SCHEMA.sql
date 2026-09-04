-- ============================================================================
-- Escrow BMS — Purchase Invoice Schema & Items Table Migration
-- Run this in your Supabase Project SQL Editor to eliminate 404 / 400 errors
-- ============================================================================

-- 1. Ensure purchase_invoices has all standard columns
ALTER TABLE public.purchase_invoices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.purchase_invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE public.purchase_invoices ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0;
ALTER TABLE public.purchase_invoices ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE public.purchase_invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- 2. Create purchase_invoice_items table for line-item storage (TEXT id/foreign keys to match existing tables)
CREATE TABLE IF NOT EXISTS public.purchase_invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT REFERENCES public.purchase_invoices(id) ON DELETE CASCADE,
  product_id TEXT,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  rate NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_invoice ON public.purchase_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_product ON public.purchase_invoice_items(product_id);

-- 4. Enable Row Level Security (RLS) on purchase_invoice_items
ALTER TABLE public.purchase_invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own purchase_invoice_items" ON public.purchase_invoice_items;

CREATE POLICY "Users manage own purchase_invoice_items"
ON public.purchase_invoice_items
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.purchase_invoices
    WHERE purchase_invoices.id = purchase_invoice_items.invoice_id
    AND purchase_invoices.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.purchase_invoices
    WHERE purchase_invoices.id = purchase_invoice_items.invoice_id
    AND purchase_invoices.user_id = auth.uid()
  )
);
