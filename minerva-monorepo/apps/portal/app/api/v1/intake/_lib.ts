/**
 * Website-form intake upstream logic (Phase 5).
 *
 * The agency-web contact form posts here through its proxy. This module holds
 * every decision (validation, site-key auth, per-key throttle, store, drain
 * reads, ack writes); the route files only translate HTTP. All functions take
 * the Supabase admin client as a parameter so tests inject a fake — there is
 * no environment branching in this file.
 *
 * Privacy: submissions hold PII (email, brief). Nothing here logs content —
 * failures log shapes (counts, key prefixes) only. The table is RLS-locked
 * (migration 041); every query below runs service-role.
 */

export const INTAKE_WINDOW_MS = 60 * 60 * 1000;
export const INTAKE_MAX_PER_WINDOW = 5;
export const INTAKE_QUEUE_LIMIT = 25;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Optional phone: digits, spaces and + - . ( ) only. Lenient on purpose —
// mirrors the agency-web client check; strictness lives in E.164, not here.
const PHONE_RE = /^[+\d][\d\s\-.()]{5,30}$/;

export interface IntakeFields {
  brief: string;
  client_email: string;
  client_phone?: string;
  organization_name: string;
  source: string;
  media_url?: string;
}

export interface SiteKey {
  agency_id: string;
  key_hash: string;
}

export interface QueuedSubmission extends IntakeFields {
  id: string;
  created_at: string;
}

/** Minimal Supabase surface this module uses (the fake in tests implements it). */
export interface IntakeAdmin {
  from(table: string): IntakeQuery;
}

export interface IntakeQuery {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): IntakeQuery;
  insert(row: Record<string, unknown>): IntakeQuery;
  update(row: Record<string, unknown>): IntakeQuery;
  eq(column: string, value: unknown): IntakeQuery;
  gte(column: string, value: unknown): IntakeQuery;
  order(column: string, options?: { ascending?: boolean }): IntakeQuery;
  limit(n: number): IntakeQuery;
  single(): Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
  maybeSingle(): Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown[] | null; count?: number | null; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
}

export function parseIntakeBody(body: unknown):
  | { ok: true; fields: IntakeFields; honeypot: boolean }
  | { ok: false; fields: Record<string, string>; honeypot: false } {
  const input = (body ?? {}) as Record<string, unknown>;
  // Honeypot first, before any validation error could teach a bot the shape
  // (same accept-and-discard contract as contact-sales).
  if (typeof input.companyWebsite === "string" && input.companyWebsite.trim() !== "") {
    return {
      ok: true,
      fields: { brief: "", client_email: "", organization_name: "", source: "web_form" },
      honeypot: true,
    };
  }
  const errors: Record<string, string> = {};
  const brief = typeof input.brief === "string" ? input.brief.trim() : "";
  const client_email = typeof input.client_email === "string" ? input.client_email.trim() : "";
  const client_phone = typeof input.client_phone === "string" ? input.client_phone.trim() : "";
  const organization_name = typeof input.organization_name === "string" ? input.organization_name.trim() : "";
  const source = typeof input.source === "string" && input.source.trim() ? input.source.trim() : "web_form";
  const media_url = typeof input.media_url === "string" ? input.media_url.trim() : "";

  if (!brief) errors.brief = "brief is required";
  else if (brief.length > 5000) errors.brief = "brief is too long (max 5000 characters)";
  if (!EMAIL_RE.test(client_email) || client_email.length > 254) errors.client_email = "a valid email is required";
  if (client_phone && !PHONE_RE.test(client_phone)) errors.client_phone = "phone number looks invalid";
  if (!organization_name) errors.organization_name = "organization name is required";
  else if (organization_name.length > 120) errors.organization_name = "organization name is too long (max 120 characters)";
  if (source.length > 40) errors.source = "source is too long (max 40 characters)";
  if (media_url && (!media_url.startsWith("https://") || media_url.length > 2048)) {
    errors.media_url = "media_url must be an https URL (max 2048 characters)";
  }
  if (Object.keys(errors).length > 0) return { ok: false, fields: errors, honeypot: false };
  return {
    ok: true,
    fields: {
      brief,
      client_email,
      ...(client_phone ? { client_phone } : {}),
      organization_name,
      source,
      ...(media_url ? { media_url } : {}),
    },
    honeypot: false,
  };
}

export async function authenticateSiteKey(admin: IntakeAdmin, keyHash: string): Promise<SiteKey | null> {
  if (!keyHash) return null;
  const { data, error } = await admin
    .from("agency_api_keys")
    .select("agency_id,key_hash,status,purpose,expires_at")
    .eq("key_hash", keyHash)
    .maybeSingle();
  if (error || !data) return null;
  if (data["status"] !== "active" || data["purpose"] !== "server") return null;
  const expires = data["expires_at"];
  if (typeof expires === "string" && expires && new Date(expires).getTime() <= Date.now()) return null;
  if (typeof data["agency_id"] !== "string" || typeof data["key_hash"] !== "string") return null;
  return { agency_id: data["agency_id"] as string, key_hash: data["key_hash"] as string };
}

export async function checkIntakeThrottle(
  admin: IntakeAdmin, keyHash: string, now: number = Date.now(),
): Promise<{ ok: true } | { ok: false; retryAfterSeconds: number }> {
  const since = new Date(now - INTAKE_WINDOW_MS).toISOString();
  const { count, error } = await admin
    .from("portal_intake_submissions")
    .select("id", { count: "exact", head: true })
    .eq("key_hash", keyHash)
    .gte("created_at", since);
  if (error) throw new Error(error.message);
  if ((count ?? 0) >= INTAKE_MAX_PER_WINDOW) {
    return { ok: false, retryAfterSeconds: INTAKE_WINDOW_MS / 1000 };
  }
  return { ok: true };
}

export async function storeSubmission(
  admin: IntakeAdmin, fields: IntakeFields, key: SiteKey,
): Promise<{ id: string }> {
  const { data, error } = await admin
    .from("portal_intake_submissions")
    .insert({
      key_hash: key.key_hash,
      agency_id: key.agency_id,
      brief: fields.brief,
      client_email: fields.client_email,
      client_phone: fields.client_phone ?? null,
      organization_name: fields.organization_name,
      source: fields.source,
      media_url: fields.media_url ?? null,
      status: "queued",
    })
    .select("id")
    .single();
  if (error || !data?.["id"]) throw new Error(error?.message ?? "submission store failed");
  return { id: String(data["id"]) };
}

export async function listQueued(
  admin: IntakeAdmin, keyHash: string, limit: number = INTAKE_QUEUE_LIMIT,
): Promise<QueuedSubmission[]> {
  const { data, error } = await admin
    .from("portal_intake_submissions")
    .select("id,brief,client_email,client_phone,organization_name,source,media_url,created_at")
    .eq("key_hash", keyHash)
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 100)));
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown[]).filter((row): row is Record<string, unknown> => !!row && typeof row === "object").map((row) => ({
    id: String(row["id"] ?? ""),
    brief: String(row["brief"] ?? ""),
    client_email: String(row["client_email"] ?? ""),
    ...(typeof row["client_phone"] === "string" && row["client_phone"] ? { client_phone: row["client_phone"] } : {}),
    organization_name: String(row["organization_name"] ?? ""),
    source: String(row["source"] ?? "web_form"),
    ...(typeof row["media_url"] === "string" && row["media_url"] ? { media_url: row["media_url"] } : {}),
    created_at: String(row["created_at"] ?? ""),
  }));
}

export async function ackSubmission(
  admin: IntakeAdmin, id: string, keyHash: string,
  status: "done" | "failed", errorDetail?: string,
): Promise<boolean> {
  if (status !== "done" && status !== "failed") return false;
  const { data, error } = await admin
    .from("portal_intake_submissions")
    .update({ status, error: errorDetail ?? null, processed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("key_hash", keyHash)
    .select("id");
  if (error) throw new Error(error.message);
  return Array.isArray(data) && data.length > 0;
}

/** Route-only helpers (env + header parsing stay out of the tested core). */

export function serviceClient(): { from(table: string): IntakeQuery } {
  // Typed loosely: the production Supabase client structurally satisfies
  // IntakeAdmin (select/insert/update/eq/gte/order/limit/single/maybeSingle
  // + thenable). Imported lazily so unit tests never load the SDK.
  // Typed loosely: the production Supabase client duck-types IntakeAdmin at
  // runtime (select/insert/update/eq/gte/order/limit/single/maybeSingle +
  // thenable), but its generic builder types don't unify statically.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) throw new Error("Supabase service env missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  const client = createClient(url, service, { auth: { persistSession: false } });
  return client as unknown as { from(table: string): IntakeQuery };
}

export async function requireSiteKey(admin: IntakeAdmin, request: Request): Promise<SiteKey | null> {
  const token = request.headers.get("x-minerva-api-key")?.trim();
  if (!token) return null;
  const { hashApiKey } = await import("@minerva/billing") as typeof import("@minerva/billing");
  return authenticateSiteKey(admin, hashApiKey(token));
}

function json(body: unknown, status = 200, headers?: Record<string, string>) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NextResponse } = require("next/server") as typeof import("next/server");
  return NextResponse.json(body, { status, headers });
}

/**
 * POST /api/v1/intake handler (route file only resolves the service client).
 *
 * The agency-web proxy forwards the contact form here with the site's API
 * key. Validates, authenticates, throttles per key, stores, and returns the
 * tracking id immediately — drafting happens asynchronously on the Minerva
 * backend drain, never in this response (sub-second budget). Same abuse
 * contract as contact-sales: honeypot accept-and-discards with an
 * unpersisted id so bots cannot distinguish it from delivery.
 */
export async function handleIntakePost(admin: IntakeAdmin, request: Request): Promise<Response> {
  const bad = (message: string, status = 400, fields?: Record<string, string>) =>
    json(fields ? { error: message, fields } : { error: message }, status);

  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    return bad("invalid JSON body");
  }

  const { randomUUID } = await import("node:crypto");
  const key = await requireSiteKey(admin, request);
  if (!key) return bad("invalid or missing site key", 401);

  const parsed = parseIntakeBody(body);
  if (parsed.honeypot) {
    return json({ ok: true, id: randomUUID() }, 201);
  }
  if (!parsed.ok) {
    return bad("invalid submission", 400, parsed.fields);
  }

  try {
    const throttle = await checkIntakeThrottle(admin, key.key_hash);
    if (!throttle.ok) {
      return json(
        { error: "too many submissions — please try again later" },
        429,
        { "retry-after": String(throttle.retryAfterSeconds) },
      );
    }
    const { id } = await storeSubmission(admin, parsed.fields, key);
    return json({ ok: true, id }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
}

/**
 * GET /api/v1/intake/queued handler — drain read for the Minerva backend
 * worker. A key only ever sees its own rows (every query scoped by key_hash).
 */
export async function handleQueuedGet(admin: IntakeAdmin, request: Request): Promise<Response> {
  const key = await requireSiteKey(admin, request);
  if (!key) return json({ error: "invalid or missing site key" }, 401);

  const limit = new URL(request.url).searchParams.get("limit");
  const parsedLimit = limit === null ? INTAKE_QUEUE_LIMIT : Number(limit);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    return json({ error: "limit must be a positive integer" }, 400);
  }

  try {
    const submissions = await listQueued(admin, key.key_hash, parsedLimit);
    return json({ submissions });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
}

/**
 * POST /api/v1/intake/[id]/ack handler — drain write. Marks a submission
 * done/failed after ingestion; unknown-or-foreign ids 404 identically.
 */
export async function handleAckPost(admin: IntakeAdmin, request: Request, id: string): Promise<Response> {
  let payload: { status?: unknown; error?: unknown };
  try {
    payload = (await request.json()) as { status?: unknown; error?: unknown };
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }
  if (payload.status !== "done" && payload.status !== "failed") {
    return json({ error: "status must be done or failed" }, 400);
  }

  const key = await requireSiteKey(admin, request);
  if (!key) return json({ error: "invalid or missing site key" }, 401);

  try {
    const detail = typeof payload.error === "string" ? payload.error.slice(0, 500) : undefined;
    const updated = await ackSubmission(admin, id, key.key_hash, payload.status, detail);
    if (!updated) return json({ error: "submission not found" }, 404);
    return json({ ok: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
}
