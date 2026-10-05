import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

function requireServiceEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase service env vars: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return { url, key };
}

/**
 * service_role client — bypasses RLS. SERVER-ONLY ("server-only" guard makes
 * any accidental client import a build error). Lazy so builds without the
 * secret env never crash on import.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!cached) {
    const { url, key } = requireServiceEnv();
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
