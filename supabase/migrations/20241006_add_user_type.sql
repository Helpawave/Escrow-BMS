-- Add user_type column to user_settings table
-- Supports: normal (default), automobile, food_kitchen

ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'normal'
  CHECK (user_type IN ('normal', 'automobile', 'food_kitchen'));

-- Update existing Geeta Cloud Kitchen user to food_kitchen automatically
UPDATE public.user_settings
SET user_type = 'food_kitchen'
WHERE user_id = 'dddbc465-7743-42c6-88f0-039a4332711d';

COMMENT ON COLUMN public.user_settings.user_type IS 
  'User business type: normal (default), automobile, food_kitchen. Controls UI features and invoice types.';

-- ─────────────────────────────────────────────────────────────────────────────
-- Update admin_get_all_users to also return whatsapp_provider and user_type
-- This is the paginated version with p_limit / p_offset / p_search support
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_get_all_users(
  p_limit  int  DEFAULT 10,
  p_offset int  DEFAULT 0,
  p_search text DEFAULT ''
)
RETURNS json
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(t), '[]'::json)
    FROM (
      SELECT
        p.user_id,
        COALESCE(p.company_name, 'N/A') AS company_name,
        COALESCE(au.email, 'No Email')  AS email,
        p.mobile,
        p.created_at,
        GREATEST(
          COALESCE(p.last_activity_at,  'epoch'::timestamptz),
          COALESCE(au.last_sign_in_at,  'epoch'::timestamptz),
          COALESCE(MAX(COALESCE(i.created_at, i.updated_at, i.issue_date::timestamptz)), 'epoch'::timestamptz)
        ) AS last_sign_in_at,
        p.subscription_expires_at,
        p.plan_type,
        p.is_blocked,
        p.is_paid,
        us.whatsapp_provider,
        us.user_type,
        COUNT(DISTINCT i.id)  AS invoice_count,
        COUNT(DISTINCT c.id)  AS client_count,
        MAX(COALESCE(i.created_at, i.updated_at, i.issue_date::timestamptz)) AS last_invoice_created_at,
        count(*) OVER ()      AS total_count
      FROM profiles p
      LEFT JOIN auth.users      au ON au.id       = p.user_id
      LEFT JOIN user_settings   us ON us.user_id  = p.user_id
      LEFT JOIN invoices         i ON i.user_id   = p.user_id
      LEFT JOIN clients          c ON c.user_id   = p.user_id
      WHERE
        p_search = ''
        OR p.company_name ILIKE '%' || p_search || '%'
        OR au.email       ILIKE '%' || p_search || '%'
        OR p.mobile       ILIKE '%' || p_search || '%'
      GROUP BY
        p.user_id, p.company_name, au.email, p.mobile,
        p.created_at, p.last_activity_at, au.last_sign_in_at,
        p.subscription_expires_at, p.plan_type,
        p.is_blocked, p.is_paid,
        us.whatsapp_provider, us.user_type
      ORDER BY p.created_at DESC
      LIMIT  p_limit
      OFFSET p_offset
    ) t
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.admin_get_all_users(int, int, text)
  TO anon, authenticated, service_role;
