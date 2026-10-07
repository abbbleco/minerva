/**
 * Live model catalog from OpenRouter, cached with a pinned fallback.
 *
 * OpenRouter models rotate frequently (new releases, retirements, price
 * changes), so a pinned list goes stale: the picker hides models upstream
 * serves, and the ledger bills prices upstream no longer charges. This module
 * fetches OpenRouter's public `/models` list, maps each entry to the router's
 * wire shape, and caches it for `MINERVA_MODELS_TTL_SECONDS` (default 1h).
 *
 * Failure posture, same as the rest of this service:
 * - fetch fails / times out / returns no usable rows -> `null`. Callers serve
 *   the pinned `catalog.ts` list instead. A stale upstream snapshot never
 *   becomes an outage.
 * - stale cache is served immediately while a background refresh runs, so at
 *   most one request per TTL pays the upstream round-trip (cold start).
 * - entries without finite non-negative prices are dropped: a model the
 *   router cannot price is a model it cannot meter, so it is not served.
 * - `free` is derived from live prices (both legs zero), which is exactly
 *   how the tier gate already treats the pinned list.
 */

import { toWireId, type CatalogEntry } from './catalog.js';
import { upstreamKeys } from './upstream-keys.js';

const DEFAULT_OPENROUTER_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_TTL_SECONDS = 3600;
const FETCH_TIMEOUT_MS = 15_000;

function openRouterModelsUrl(): string {
  const base = (process.env.OPENROUTER_URL ?? DEFAULT_OPENROUTER_URL).replace(/\/+$/, '');
  return `${base}/models`;
}

function ttlMs(): number {
  const raw = Number(process.env.MINERVA_MODELS_TTL_SECONDS ?? DEFAULT_TTL_SECONDS);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_TTL_SECONDS * 1000;
  return Math.max(60, Math.floor(raw)) * 1000;
}

function toEntry(raw: unknown): CatalogEntry | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const rec = raw as Record<string, unknown>;
  const upstreamId = typeof rec.id === 'string' ? rec.id.trim() : '';
  if (!upstreamId) return null;
  const pricing = (rec.pricing ?? {}) as Record<string, unknown>;
  // Upstream prices are per-token USD strings; the ledger works per-1M.
  const prompt = Number(pricing.prompt ?? NaN) * 1_000_000;
  const completion = Number(pricing.completion ?? NaN) * 1_000_000;
  if (!Number.isFinite(prompt) || !Number.isFinite(completion) || prompt < 0 || completion < 0) {
    return null;
  }
  const contextLength = Number((rec as Record<string, unknown>).context_length ?? 0);
  const name = typeof rec.name === 'string' && rec.name.trim() ? rec.name.trim() : upstreamId;
  return {
    upstreamId,
    wireId: toWireId(upstreamId),
    displayName: name,
    promptPer1M: prompt,
    completionPer1M: completion,
    free: prompt === 0 && completion === 0,
    contextWindow:
      Number.isFinite(contextLength) && contextLength > 0 ? Math.floor(contextLength) : 0,
  };
}

type Cache = { at: number; entries: CatalogEntry[] };

let cache: Cache | null = null;
let inflight: Promise<CatalogEntry[] | null> | null = null;

/** Test seam: drop the cache (and any in-flight fetch) between cases. */
export function _resetLiveModelsCacheForTests(): void {
  cache = null;
  inflight = null;
}

async function fetchLive(): Promise<CatalogEntry[] | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    // The endpoint is public; a bearer avoids rate limits when configured.
    // Key material never reaches logs or errors.
    const keys = upstreamKeys();
    if (keys.length > 0) headers.authorization = `Bearer ${keys[0] as string}`;
    const res = await fetch(openRouterModelsUrl(), { headers, signal: ctrl.signal });
    if (!res.ok) return null;
    const body = (await res.json().catch(() => null)) as { data?: unknown } | null;
    if (!body || !Array.isArray(body.data)) return null;
    const seen = new Set<string>();
    const out: CatalogEntry[] = [];
    for (const raw of body.data) {
      const entry = toEntry(raw);
      if (!entry || seen.has(entry.wireId)) continue;
      seen.add(entry.wireId);
      out.push(entry);
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function refresh(): Promise<CatalogEntry[] | null> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const entries = await fetchLive();
      if (entries) cache = { at: Date.now(), entries };
      return entries;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/**
 * Fresh live entries, or `null` when OpenRouter could not be reached (caller
 * serves the pinned catalog). A stale cache is served immediately while a
 * background refresh runs, so rotation is picked up without blocking chat.
 */
export async function liveCatalog(): Promise<CatalogEntry[] | null> {
  if (cache && Date.now() - cache.at < ttlMs()) return cache.entries;
  if (cache) {
    void refresh().catch(() => undefined);
    return cache.entries;
  }
  return refresh();
}

/** Live entries visible to a key of this tier, or `null` when unreachable. */
export async function liveModelsForTier(isPaid: boolean): Promise<CatalogEntry[] | null> {
  const entries = await liveCatalog();
  if (!entries) return null;
  return entries.filter((e) => isPaid || e.free);
}

/** Wire IDs of live free models, or `null` when unreachable (caller keeps pinned). */
export async function liveFreeWireIds(): Promise<readonly string[] | null> {
  const free = await liveModelsForTier(false);
  if (!free) return null;
  return free.map((e) => e.wireId);
}

/**
 * Resolve a requested model against the live list (wire, upstream, or
 * flattened-bare spelling, mirroring `catalog.resolveModel`), or `null`
 * when unreachable or unknown. Callers fall back to the pinned catalog.
 */
export async function resolveLiveModel(id: string | null | undefined): Promise<CatalogEntry | null> {
  if (!id) return null;
  const entries = await liveCatalog();
  if (!entries) return null;
  const raw = id.trim();
  if (!raw) return null;
  const direct = entries.find((e) => e.wireId === raw || e.upstreamId === raw);
  if (direct) return direct;
  const stripped = raw.startsWith('minerva/')
    ? raw.slice('minerva/'.length)
    : raw.startsWith('qontxt/')
      ? raw.slice('qontxt/'.length)
      : raw;
  return (
    entries.find((e) => e.wireId === `minerva/${stripped}` || e.upstreamId === stripped) ?? null
  );
}
