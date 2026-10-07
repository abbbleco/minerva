/**
 * Minerva Router pinned model catalog — the offline fallback, not the live list.
 *
 * `/v1/models` and chat resolution serve OpenRouter's live list via
 * `live-models.ts` (cached, tier-filtered); this pinned snapshot is served
 * only when the live fetch fails, and the stub router uses it so tests stay
 * deterministic. Ledger rows record the cost computed at request time, so a
 * price rotation never rewrites history.
 *
 * Prices are USD per 1M tokens, snapshotted from `GET https://openrouter.ai/api/v1/models`
 * on 2026-09-29. Refresh the snapshot when the fallback looks stale — the live
 * path bills live prices, so this file only matters offline.
 */

export type CatalogEntry = {
  /** Upstream OpenRouter ID — what the router sends outbound. */
  upstreamId: string;
  /** Wire ID the engine and `config.yaml:model.default` use: `minerva/<upstream with / -> ->`. */
  wireId: string;
  displayName: string;
  /** USD per 1M input tokens. */
  promptPer1M: number;
  /** USD per 1M output tokens. */
  completionPer1M: number;
  /** Reachable on the free tier. */
  free: boolean;
  contextWindow: number;
};

/** Plan §9 — wire ID is `minerva/` + upstream ID with slashes flattened to dashes. */
export function toWireId(upstreamId: string): string {
  return `minerva/${upstreamId.replace(/\//g, '-')}`;
}

/**
 * Reverse of {@link toWireId}, resolved through the catalog rather than by string surgery:
 * dashes are ambiguous once flattened (`google/gemini-3.1-flash` -> `google-gemini-3.1-flash`
 * could un-flatten to several shapes), so lookup is the only correct inverse.
 */
export function toUpstreamId(id: string): string | null {
  return resolveModel(id)?.upstreamId ?? null;
}

function entry(
  upstreamId: string,
  displayName: string,
  promptPer1M: number,
  completionPer1M: number,
  free: boolean,
  contextWindow: number,
): CatalogEntry {
  return { upstreamId, wireId: toWireId(upstreamId), displayName, promptPer1M, completionPer1M, free, contextWindow };
}

/**
 * Pinned catalog. Additions require: a re-snapshot of the price, an update to
 * `QONTXT_V2_COST_MODEL.md`, and a contract test asserting the `/v1/models` filter.
 */
export const CATALOG: readonly CatalogEntry[] = [
  // ── Paid ────────────────────────────────────────────────────────────────
  entry('anthropic/claude-opus-4.6', 'Claude Opus 4.6', 5.0, 25.0, false, 200_000),
  entry('anthropic/claude-sonnet-4.6', 'Claude Sonnet 4.6', 3.0, 15.0, false, 200_000),
  entry('anthropic/claude-haiku-4.5', 'Claude Haiku 4.5', 1.0, 5.0, false, 200_000),
  entry('google/gemini-3.1-pro-preview', 'Gemini 3.1 Pro', 2.0, 12.0, false, 1_048_576),
  entry('google/gemini-3.1-flash-lite', 'Gemini 3.1 Flash Lite', 0.25, 1.5, false, 1_048_576),

  // ── Free tier (upstream price 0) ────────────────────────────────────────
  //
  // `openrouter/free` is OpenRouter's own meta-router ("Free Models Router", price $0). It picks
  // a live free model per request, which is the point: pinning a single `:free` model makes the
  // free tier hostage to that one model's shared pool. Verified 2026-09-30 — a pinned call to
  // `qwen/qwen3.8-27b:free` returned 429 "temporarily rate-limited upstream" while
  // `openrouter/free` served the same request from `liquid/lfm-2.5-2.6b:free` at cost 0.
  // Prefer it as the default free model; keep the pinned ids for callers that need a specific one.
  entry('openrouter/free', 'Free Models Router (auto)', 0, 0, true, 128_000),
  entry('google/gemma-4-31b-it:free', 'Gemma 4 31B (free)', 0, 0, true, 262_144),
  entry('nvidia/nemotron-3-ultra-550b-a55b:free', 'Nemotron 3 Ultra (free)', 0, 0, true, 1_000_000),
  entry('qwen/qwen3.8-27b:free', 'Qwen3.8 27B (free)', 0, 0, true, 262_144),
  entry('liquid/lfm-2.5-2.6b:free', 'LFM 2.5 2.6B (free)', 0, 0, true, 65_536),
  entry('thinkingmachines/inkling-small:free', 'Inkling Small (free)', 0, 0, true, 1_048_576),
];

/**
 * Default model for the free tier.
 *
 * The meta-router rather than a pinned model — see the note in CATALOG.
 */
export const DEFAULT_FREE_MODEL = 'minerva/openrouter-free';

/** Plan §9 / decision 4 — generation default. */
export const DEFAULT_MODEL = 'anthropic/claude-opus-4.6';

/** Separate review pass in `qontxt-scoping`; cheaper than the generation default. */
export const REVIEW_MODEL = 'google/gemini-3.1-pro-preview';

/** Free-tier keys are restricted to these wire IDs. */
export const FREE_MODELS: readonly string[] = CATALOG.filter((e) => e.free).map((e) => e.wireId);

const BY_WIRE = new Map(CATALOG.map((e) => [e.wireId, e]));
const BY_UPSTREAM = new Map(CATALOG.map((e) => [e.upstreamId, e]));

/**
 * Resolve either spelling. Accepts `minerva/...`, the LEGACY `qontxt/...` prefix
 * (stored configs and rows predate the rebrand), a bare upstream ID, or a bare
 * wire slug. Returns null for unknown models — callers must 400 rather than
 * silently relaying upstream.
 */
export function resolveModel(id: string | null | undefined): CatalogEntry | null {
  if (!id) return null;
  const raw = id.trim();
  if (!raw) return null;
  const direct = BY_WIRE.get(raw) ?? BY_UPSTREAM.get(raw);
  if (direct) return direct;
  const stripped = raw.startsWith('minerva/')
    ? raw.slice('minerva/'.length)
    : raw.startsWith('qontxt/') // LEGACY prefix
      ? raw.slice('qontxt/'.length)
      : raw;
  return BY_WIRE.get(`minerva/${stripped}`) ?? BY_UPSTREAM.get(stripped) ?? null;
}

/** Models visible to a key of this tier. Free keys see only `free: true` entries. */
export function modelsForTier(isPaid: boolean): CatalogEntry[] {
  return CATALOG.filter((e) => isPaid || e.free);
}
