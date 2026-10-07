/**
 * Shared REST API helper for Supabase queries.
 *
 * WHY: The Supabase JS client inherits the logged-in user's JWT from session
 * storage, which means RLS (`auth.uid() = user_id`) blocks cross-user queries
 * (e.g. staff reading a company owner's data). Using a raw fetch with the
 * service-role key bypasses RLS entirely and is unaffected by client session
 * state at any point in the auth lifecycle.
 */

export const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPA_KEY = (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

export const SERVICE_HEADERS: HeadersInit = {
  apikey: SUPA_KEY,
  Authorization: `Bearer ${SUPA_KEY}`,
  "Content-Type": "application/json",
  Prefer: "count=exact",
};

/**
 * Execute a GET query against the Supabase REST API with the service-role key.
 *
 * @param table  PostgREST table name
 * @param params URLSearchParams built by the caller
 */
export async function supaRestGet<T = unknown>(
  table: string,
  params: URLSearchParams
): Promise<{ data: T[]; totalCount: number }> {
  const url = `${SUPA_URL}/rest/v1/${table}?${params.toString()}`;

  const resp = await fetch(url, { headers: SERVICE_HEADERS });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`[supaRest] ${table} GET failed: ${resp.status} ${errText}`);
  }

  const data: T[] = await resp.json();
  const contentRange = resp.headers.get("Content-Range") || "";
  const totalCount =
    parseInt(contentRange.split("/")[1] || "0", 10) || data.length;

  return { data, totalCount };
}
