import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * Free-tier policy for the welcome API.
 *
 * Two gates, both fail-closed:
 *
 *   1. Credential: the Bearer token must be an active, unexpired router key
 *      (`qkt_sec_*`) whose agency is on the free plan. Paid-plan keys are
 *      rejected here — not out of stinginess, but because serving a paying
 *      caller free models would be a silent downgrade of what they paid for.
 *      Paid callers belong on the router directly.
 *
 *   2. Model: the requested model must be in the free set, matched by wire id
 *      (`minerva/...`) or upstream id. Anything else is a 402, the same code
 *      the router itself returns for a tier violation, so clients need no
 *      second error path.
 *
 * The free set comes from MINERVA_FREE_MODELS (comma-separated wire ids), the
 * same variable and format the billing package uses — one list, read in two
 * places, never two lists to drift.
 */

export interface GuestContext {
  agencyId: string;
  keyId: string;
}

function serviceClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) throw new Error("Supabase service env missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  return createClient(url, service, { auth: { persistSession: false } });
}

export function freeModels(): Set<string> {
  const raw = process.env.MINERVA_FREE_MODELS ?? "";
  const configured = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  // Same default as the billing package: the service is usable with zero
  // configuration, and the default is the cheapest stable free model.
  const list = configured.length > 0 ? configured : ["minerva/qwen-qwen3.8-27b:free"];
  return new Set(list);
}

/**
 * Normalize a requested model id to the wire forms worth checking. The router
 * accepts `minerva/...`, legacy prefixes, bare upstream ids and bare slugs;
 * this gate accepts a model when ANY of its spellings is in the free set, so
 * a caller is never rejected over an alias the router itself would honour.
 */
export function candidateForms(requested: string): string[] {
  const raw = requested.trim();
  if (!raw) return [];
  const forms = new Set<string>([raw]);
  const withoutPrefix = raw.startsWith("minerva/")
    ? raw.slice("minerva/".length)
    : raw.startsWith("qontxt/")
      ? raw.slice("qontxt/".length)
      : raw;
  forms.add(`minerva/${withoutPrefix}`);
  forms.add(withoutPrefix);
  // Upstream ids use slashes; wire ids flatten them to dashes. Both spellings
  // resolve to the same model, so both are checked.
  forms.add(`minerva/${withoutPrefix.replace(/\//g, "-")}`);
  return [...forms];
}

export function isFreeModel(requested: string, free: Set<string> = freeModels()): boolean {
  return candidateForms(requested).some((form) => free.has(form));
}

export type KeyVerdict =
  | { ok: true; context: GuestContext }
  | { ok: false; status: 401 | 403; code: string; message: string };

/**
 * Verify a guest credential. Returns the agency context for policy checks, or
 * a typed refusal. Only free-plan agencies pass: this endpoint exists for the
 * free tier, and a paid key presented here is a caller bug (or a downgrade
 * attack on the caller's own bill), not something to silently serve.
 */
export async function verifyGuestKey(authorization: string | undefined): Promise<KeyVerdict> {
  const match = /^Bearer[ ]+(.+)$/i.exec((authorization ?? "").trim());
  const token = match?.[1]?.trim() ?? "";
  if (!token) {
    return { ok: false, status: 401, code: "unauthorized", message: "missing bearer token" };
  }
  if (!token.startsWith("qkt_")) {
    return { ok: false, status: 401, code: "invalid_key", message: "welcome-api accepts router keys (qkt_sec_*)" };
  }

  let admin;
  try {
    admin = serviceClient();
  } catch (err) {
    return {
      ok: false,
      status: 401,
      code: "not_configured",
      message: err instanceof Error ? err.message : "database not configured",
    };
  }

  const digest = createHash("sha256").update(token, "utf8").digest("hex");
  const { data: key, error: keyError } = await admin
    .from("agency_api_keys")
    .select("id, agency_id, status, expires_at")
    .eq("key_hash", digest)
    .maybeSingle();
  if (keyError) {
    return { ok: false, status: 401, code: "lookup_failed", message: keyError.message };
  }
  const row = key as { id: string; agency_id: string; status: string; expires_at: string | null } | null;
  if (!row) return { ok: false, status: 401, code: "invalid_key", message: "invalid api key" };
  if (row.status !== "active") {
    return { ok: false, status: 401, code: "key_inactive", message: "api key is not active" };
  }
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, status: 401, code: "key_expired", message: "api key expired" };
  }

  const { data: agency } = await admin
    .from("agencies")
    .select("id, plan, status")
    .eq("id", row.agency_id)
    .maybeSingle();
  const agencyRow = agency as { id: string; plan: string; status: string } | null;
  if (!agencyRow) return { ok: false, status: 401, code: "agency_missing", message: "agency not found" };
  if (agencyRow.status === "suspended") {
    return { ok: false, status: 403, code: "suspended", message: "agency is suspended" };
  }

  // Free plan only. Paid agencies have a router endpoint that serves their
  // whole catalog; letting them through here would serve free models against
  // a paid bill — a silent downgrade either way it resolves.
  const { data: subs } = await admin
    .from("agency_subscriptions")
    .select("plan, status, current_period_end")
    .eq("agency_id", agencyRow.id)
    .order("updated_at", { ascending: false })
    .limit(5);
  const now = Date.now();
  const activePaid = ((subs ?? []) as Array<{ plan: string; status: string; current_period_end: string | null }>).find(
    (s) =>
      s.status === "active" &&
      ["plus", "super", "ultra", "agency"].includes(s.plan) &&
      (!s.current_period_end || new Date(s.current_period_end).getTime() > now)
  );
  if (activePaid) {
    return {
      ok: false,
      status: 403,
      code: "not_free_tier",
      message: `agency is on the ${activePaid.plan} plan; use the Minerva router directly`,
    };
  }

  return { ok: true, context: { agencyId: agencyRow.id, keyId: row.id } };
}
