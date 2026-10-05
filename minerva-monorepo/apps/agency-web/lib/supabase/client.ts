"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client — anon/publishable key only. RLS applies to every query.
 * NEVER import this from a Server Component; use the server or admin client.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase public env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createBrowserClient(url, anonKey);
}
