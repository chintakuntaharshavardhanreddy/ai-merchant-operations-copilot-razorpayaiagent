import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Database Client Wrapper (Architecture Foundation for Phase 2)
 *
 * Connects to PostgreSQL and pgvector for structured payment logs,
 * audit trails, and document embeddings.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Lazily instantiates Supabase client when credentials are provided.
 */
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // In Phase 1 shell mode, warn cleanly if not yet set
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
