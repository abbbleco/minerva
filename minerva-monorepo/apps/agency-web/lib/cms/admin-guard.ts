import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Shared privilege gate for Server Actions AND API routes.
 * Proxy/layout guards are UX only — this is the security boundary.
 */
export class AuthError extends Error {}

export interface AdminSession {
  userId: string;
  email: string;
}

export async function requireAdmin(): Promise<AdminSession> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    throw new AuthError("Not signed in");
  }

  const { data: profile, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("email, is_admin")
    .eq("id", user.id)
    .single();

  if (error || !profile?.is_admin) {
    throw new AuthError("Admin privileges required");
  }

  return { userId: user.id, email: profile.email };
}

/** Uniform result shape so client callers never need try/catch plumbing. */
export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function toErrorResult(err: unknown): { ok: false; error: string } {
  if (err instanceof AuthError) {
    return { ok: false, error: err.message };
  }
  const message = err instanceof Error ? err.message : "Unexpected error";
  return { ok: false, error: message };
}
