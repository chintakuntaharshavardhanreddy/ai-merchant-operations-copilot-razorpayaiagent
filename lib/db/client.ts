import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Database Client Factory
 * 
 * Provides:
 * 1. getSupabaseClient() - Standard client using NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 *    Safe for public reads and invoking authorized SECURITY DEFINER RPCs.
 * 
 * 2. getServerSupabaseClient() - Server-only privileged client.
 *    If SUPABASE_SERVICE_ROLE_KEY is present in process.env (Node.js runtime only),
 *    uses it to bypass RLS for server-orchestrated operations.
 *    If not present, falls back seamlessly to getSupabaseClient() which invokes
 *    SECURITY DEFINER RPC functions for atomic state transitions.
 * 
 * Never exposes service-role keys to client bundles (no NEXT_PUBLIC_ prefix).
 */

let supabaseInstance: SupabaseClient | null = null;
let supabaseServerAdminInstance: SupabaseClient | null = null;

function sanitizeUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

/**
 * Returns true if server-side privileged service_role credentials are configured.
 */
export function isServerPrivileged(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn("[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(sanitizeUrl(url), key);
  }

  return supabaseInstance;
}

export function getServerSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Non-public server-side service role key (only present in Node.js server environments)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceRoleKey) {
    if (!supabaseServerAdminInstance) {
      supabaseServerAdminInstance = createClient(sanitizeUrl(url), serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
    return supabaseServerAdminInstance;
  }

  // Graceful fallback to anon client (relies on PostgreSQL SECURITY DEFINER RPCs for state transitions)
  return getSupabaseClient();
}
