/**
 * Embeddings upstream — 768 dimensions, via OpenRouter.
 *
 * **OpenRouter is the only backend.** `GEMINI_API_KEY` was removed (owner decision 2026-09-30):
 * the router already holds `OPENROUTER_API_KEY` for chat, and OpenRouter serves embeddings even
 * though its `/models` catalog does not list them (verified 2026-09-30: 464 models in the catalog,
 * zero with "embed" in the id/name, yet `POST /v1/embeddings` accepts them).
 *
 * Model: `google/gemini-embedding-2`.
 *   Google's deprecation table (ai.google.dev/gemini-api/docs/deprecations):
 *     text-embedding-004    shut down 2026-01-14   (dead)
 *     gemini-embedding-001  shuts down 2028-05-14
 *     gemini-embedding-2    no shutdown announced  <- current, and the named replacement
 *   `text-embedding-004` is why there is no "legacy" path any more: it no longer exists, so
 *   neither does the vector space it produced. See the migration note below.
 *
 * ⚠️ EXISTING VECTORS MUST BE RE-EMBEDDED
 * ----------------------------------------
 * Every vector currently in the database was produced by `text-embedding-004`, which was shut
 * down on 2026-01-14. Those rows are therefore **stranded in a space no live model can produce**:
 *
 *     talents.embedding        11 rows (all populated)
 *     user_stories.embedding   25 rows
 *
 * `gemini-embedding-2` emits 768 floats too, but different floats. Comparing a new query against
 * a stored old vector returns *noise, not an error* — pgvector stores and compares them happily,
 * and `match_talent` will rank confidently and wrongly. Re-embed those 36 rows before trusting
 * similarity search. `embeddingSpaceId()` exists so the mismatch is detectable rather than silent.
 *
 * 768 is not negotiable: the schema is `vector(768)` with an HNSW index and `match_talent`
 * guards the dimension.
 */

import { createHash } from "node:crypto";

const DEFAULT_OPENROUTER_URL = "https://openrouter.ai/api/v1";

/** Current Google embedding model, served through OpenRouter. */
const DEFAULT_EMBEDDING_MODEL = "google/gemini-embedding-2";

/** Sent on every request; see the note in `embed()`. */
const USER_AGENT = process.env.MINERVA_HTTP_USER_AGENT ?? "Minerva-Router/1.0";

// Read env lazily, never at module scope. A module-scope `const` freezes the value at import
// time, which breaks when env is injected afterwards (dotenv, container secrets, tests).
// Credentials ride the shared key pool (`./upstream-keys.js`); this module only
// shapes the embeddings request around whichever key it is handed.
import {
  cooldownMsFor,
  failoverClass,
  keyLabel,
  sharedKeyPool,
  upstreamKeys,
} from "./upstream-keys.js";
function openRouterUrl(): string {
  return process.env.OPENROUTER_URL ?? DEFAULT_OPENROUTER_URL;
}

/** The pgvector dimension this system is built on. Do not change without a migration. */
export const EMBEDDING_DIMS = 768;

export function embeddingModelId(): string {
  return process.env.MINERVA_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL;
}

export function embeddingsConfigured(): boolean {
  return upstreamKeys().length > 0;
}

export interface EmbeddingResult {
  vectors: number[][];
  /** Approximate: OpenRouter does not report embedding token counts. */
  promptTokens: number;
  model: string;
}

/**
 * Rough token estimate. Embedding cost is negligible, but the ledger needs *a* number and a
 * silent 0 would hide the spend entirely.
 */
function estimateTokens(texts: string[]): number {
  return texts.reduce((sum, t) => sum + Math.max(1, Math.ceil(t.length / 4)), 0);
}

export async function embed(texts: string[]): Promise<EmbeddingResult> {
  if (texts.length === 0) return { vectors: [], promptTokens: 0, model: embeddingModelId() };

  const keys = upstreamKeys();
  if (keys.length === 0) throw new Error("OPENROUTER_API_KEY not configured — cannot embed");
  const model = embeddingModelId();
  const url = `${openRouterUrl()}/embeddings`;
  // `dimensions` is the OpenAI-compatible knob; OpenRouter maps it onto Matryoshka-capable
  // models. A model that ignores it returns its native width, which the assertion below
  // catches rather than storing a mismatched vector.
  const requestBody = JSON.stringify({ model, input: texts, dimensions: EMBEDDING_DIMS });

  const pool = sharedKeyPool();
  const tried = new Set<number>();
  let lastError = "";
  while (tried.size < keys.length) {
    const index = pool.pick(keys.length);
    if (tried.has(index)) break;
    tried.add(index);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          authorization: `Bearer ${keys[index] as string}`,
          "content-type": "application/json",
          // Paystack-style Cloudflare bot rules are not in play here, but an explicit UA keeps the
          // client's identity deterministic rather than dependent on undici's default.
          "user-agent": USER_AGENT,
        },
        body: requestBody,
      });
    } catch {
      pool.report(index, cooldownMsFor("transport"));
      lastError = "transport failure";
      continue;
    }
    if (failoverClass(res.status) === "terminal" || tried.size >= keys.length) {
      pool.report(index, null);
      return parseEmbeddingResult(res, texts, model);
    }
    pool.report(index, cooldownMsFor(res.status));
    console.warn(
      `[router] upstream ${keyLabel(index, keys.length)} HTTP ${res.status} — failing over`
    );
    try {
      await res.arrayBuffer();
    } catch {
      // Body already gone; the socket releases either way.
    }
    lastError = `HTTP ${res.status}`;
  }
  throw new Error(`embeddings upstream unavailable after ${tried.size} key(s): ${lastError}`);
}

async function parseEmbeddingResult(
  res: Response, texts: string[], model: string
): Promise<EmbeddingResult> {
  if (!res.ok) {
    throw new Error(
      `embeddings upstream HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`
    );
  }

  const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
  const vectors = (json.data ?? []).map((d) => d.embedding ?? []);

  if (vectors.length !== texts.length) {
    throw new Error(`embeddings upstream returned ${vectors.length} vectors for ${texts.length} inputs`);
  }
  for (const [i, v] of vectors.entries()) {
    if (v.length !== EMBEDDING_DIMS) {
      throw new Error(
        `embedding[${i}] from ${model} has ${v.length} dimensions, expected ${EMBEDDING_DIMS}. ` +
          "A different width would corrupt similarity search rather than fail loudly — refusing it."
      );
    }
  }

  return { vectors, promptTokens: estimateTokens(texts), model };
}

/**
 * Stable identity of the vector space in use.
 *
 * Record this alongside embeddings so a later model change is *detectable*. Two rows with
 * different space ids must never be compared — that comparison is the silent-corruption case
 * described at the top of this file.
 */
export function embeddingSpaceId(): string {
  return createHash("sha256")
    .update(`${embeddingModelId()}:${EMBEDDING_DIMS}`)
    .digest("hex")
    .slice(0, 16);
}
