// Unified database access layer (IMPLEMENTATION_PLAN.md §7, §8).
// Both apps use exactly one client factory each; the service key NEVER reaches the browser.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface MinervaEnv {
  url: string;
  // Explicitly `| undefined` rather than optional (`anonKey?: string`). `env()` always returns
  // all three keys, so under `exactOptionalPropertyTypes` an optional property cannot be
  // assigned a `string | undefined` value. This is the honest type.
  anonKey: string | undefined;
  serviceRoleKey: string | undefined;
}

function env(): MinervaEnv {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "Supabase URL missing. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in .env.local (see AGENTS.md §8)."
    );
  }
  return {
    url,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

/** Server-only client (service role: migrations, pipelines, RPCs). SSR/route handlers only. */
export function createServerClient(): SupabaseClient {
  const { url, serviceRoleKey } = env();
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY missing — server-only client requires it.");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-minerva-context": "server" } },
  });
}

/** Browser-safe anon client (client portal, dashboard SSR reads with user session). */
export function createAnonClient(): SupabaseClient {
  const { url, anonKey } = env();
  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY missing.");
  }
  return createClient(url, anonKey, {
    global: { headers: { "x-minerva-context": "anon" } },
  });
}

export { env };