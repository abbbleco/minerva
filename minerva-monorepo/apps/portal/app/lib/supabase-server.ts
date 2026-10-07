import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** SSR Supabase client bound to the request session. Anon key only — never service_role. */
export async function getSupabaseServer() {
  const jar = await cookies();
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Supabase env missing (SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          // Server components cannot set cookies; middleware handles refresh.
        }
      },
    },
  });
}

export function routerBaseUrl(): string {
  const raw =
    process.env.MINERVA_ROUTER_URL ??
    process.env.NEXT_PUBLIC_MINERVA_ROUTER_URL ??
    "https://minrouter.abbbleco.workers.dev";
  return raw.trim().replace(/\/+$/, "");
}

export function dashboardUrl(): string {
  return (process.env.NEXT_PUBLIC_HERMES_DASHBOARD_URL ?? "http://127.0.0.1:9119").trim().replace(/\/+$/, "");
}
