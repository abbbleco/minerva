/**
 * Upstream fan-out: OpenRouter for chat, the Gemini API for embeddings.
 *
 * This module is the ONLY place in the system that touches an upstream inference credential
 * (plan decision 8). Nothing here is exposed to the engine or the browser.
 *
 * The SSE handling is the subtle part. We must know the token usage of a stream, but usage only
 * arrives in the final chunk — and the customer may close the tab long before then. So the
 * stream is instrumented rather than passed through: bytes flow to the client untouched, while a
 * parallel reader keeps draining upstream to completion so the debit can be computed even after
 * the client has gone (plan rev.4 C5).
 */

const DEFAULT_OPENROUTER_URL = "https://openrouter.ai/api/v1";

// Read env lazily, never at module scope — a module-scope `const` freezes the value at import
// time, which breaks when env is injected afterwards (dotenv, container secrets, tests).
// Upstream credentials come from the key pool (`./upstream-keys.js`): `OPENROUTER_API_KEYS`
// (comma-separated) wins, the singular `OPENROUTER_API_KEY` is the one-key pool.
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

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
}

export function upstreamConfigured(): boolean {
  return upstreamKeys().length > 0;
}

function upstreamHeaders(key: string): Record<string, string> {
  const headers: Record<string, string> = {
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
  };
  // Optional OpenRouter attribution headers — harmless when unset.
  const referer = process.env.OPENROUTER_SITE_URL;
  const title = process.env.OPENROUTER_APP_NAME;
  if (referer) headers["HTTP-Referer"] = referer;
  if (title) headers["X-Title"] = title;
  return headers;
}

/** Pull `usage` out of an OpenAI-compatible payload, tolerating both shapes. */
function usageFrom(payload: unknown): ChatUsage | null {
  if (typeof payload !== "object" || payload === null) return null;
  const usage = (payload as { usage?: unknown }).usage;
  if (typeof usage !== "object" || usage === null) return null;
  const u = usage as { prompt_tokens?: unknown; completion_tokens?: unknown };
  const promptTokens = Number(u.prompt_tokens ?? 0);
  const completionTokens = Number(u.completion_tokens ?? 0);
  if (!Number.isFinite(promptTokens) && !Number.isFinite(completionTokens)) return null;
  return {
    promptTokens: Number.isFinite(promptTokens) ? promptTokens : 0,
    completionTokens: Number.isFinite(completionTokens) ? completionTokens : 0,
  };
}

/**
 * Non-streaming chat. Returns the parsed body and the usage it reported.
 *
 * Round-robins the key pool with same-request failover: a 429/broke/dead key
 * parks for its cooldown and the identical body is retried on the next key
 * (each key at most once). Terminal statuses (400/404/…) return as-is —
 * retrying them cannot help. With no keys configured the single legacy
 * attempt goes out unauthenticated, exactly as before.
 */
export async function chatOnce(
  upstreamId: string,
  body: Record<string, unknown>
): Promise<{ status: number; payload: unknown; usage: ChatUsage | null }> {
  const keys = upstreamKeys();
  const url = `${openRouterUrl()}/chat/completions`;
  const requestBody = JSON.stringify({ ...body, model: upstreamId, stream: false });
  if (keys.length === 0) {
    const res = await fetch(url, {
      method: "POST",
      headers: upstreamHeaders(""),
      body: requestBody,
    });
    const payload = (await res.json().catch(() => ({}))) as unknown;
    return { status: res.status, payload, usage: usageFrom(payload) };
  }
  const pool = sharedKeyPool();
  const tried = new Set<number>();
  let last: { status: number; payload: unknown; usage: ChatUsage | null } | null = null;
  while (tried.size < keys.length) {
    const index = pool.pick(keys.length);
    if (tried.has(index)) break;
    tried.add(index);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: upstreamHeaders(keys[index] as string),
        body: requestBody,
      });
    } catch {
      pool.report(index, cooldownMsFor("transport"));
      continue;
    }
    const payload = (await res.json().catch(() => ({}))) as unknown;
    const result = { status: res.status, payload, usage: usageFrom(payload) };
    if (failoverClass(res.status) === "terminal" || tried.size >= keys.length) {
      pool.report(index, null);
      return result;
    }
    pool.report(index, cooldownMsFor(res.status));
    console.warn(
      `[router] upstream ${keyLabel(index, keys.length)} HTTP ${res.status} — failing over`
    );
    last = result;
  }
  // Every key failed over: surface the last upstream answer, never a
  // synthesized error — callers already map status codes. (If every attempt
  // died in transport with no HTTP answer at all, there is nothing to relay,
  // so that alone falls back to a 502.)
  return last ?? { status: 502, payload: {}, usage: null };
}

/**
 * Streaming chat, instrumented for usage.
 *
 * `onUsage` fires exactly once, on whichever comes first:
 *   - the upstream stream ends normally, or
 *   - the client disconnects (then a background drain finishes reading upstream so the full
 *     usage is still available).
 *
 * A `stream_options.include_usage` flag is added so OpenRouter emits a final usage chunk; if the
 * provider ignores it we fall back to whatever partial usage we saw, which is why the caller
 * treats a `null` usage as "unknown" rather than "free".
 */
export function chatStream(
  upstreamId: string,
  body: Record<string, unknown>,
  onUsage: (usage: ChatUsage | null) => void
): Promise<Response> {
  const keys = upstreamKeys();
  const url = `${openRouterUrl()}/chat/completions`;
  const requestBody = JSON.stringify({
    ...body,
    model: upstreamId,
    stream: true,
    stream_options: { include_usage: true },
  });
  const headersFor = (index: number) => upstreamHeaders(keys[index] as string);
  const run = async (): Promise<Response> => {
    // No keys: one legacy attempt, exactly as before (callers map the 401).
    if (keys.length === 0) {
      const res = await fetch(url, {
        method: "POST",
        headers: upstreamHeaders(""),
        body: requestBody,
      });
      return instrumentStream(res, onUsage);
    }
    const pool = sharedKeyPool();
    const tried = new Set<number>();
    while (tried.size < keys.length) {
      const index = pool.pick(keys.length);
      if (tried.has(index)) break;
      tried.add(index);
      let res: Response;
      try {
        res = await fetch(url, { method: "POST", headers: headersFor(index), body: requestBody });
      } catch {
        pool.report(index, cooldownMsFor("transport"));
        continue;
      }
      if (failoverClass(res.status) === "terminal" || tried.size >= keys.length) {
        pool.report(index, null);
        return instrumentStream(res, onUsage);
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
    }
    // Unreachable in practice (loop exits only via return), kept for the type
    // checker: every key failed over means the last branch above returned.
    throw new Error("upstream key pool exhausted without a response");
  };
  return run();
}

/** Instrument an upstream SSE response for usage (extracted unchanged from
 *  the pre-pool implementation so streaming behavior is identical). */
function instrumentStream(
  res: Response,
  onUsage: (usage: ChatUsage | null) => void
): Response {
  if (!res.ok || !res.body) return res;

    const upstream = res.body;
    const decoder = new TextDecoder();
    let buffer = "";
    let usage: ChatUsage | null = null;
    let settled = false;

    const settle = () => {
      if (settled) return;
      settled = true;
      onUsage(usage);
    };

    const scan = (text: string) => {
      buffer += text;
      const lines = buffer.split("\n");
      // Keep the last partial line for the next chunk.
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const found = usageFrom(JSON.parse(data));
          if (found) usage = found;
        } catch {
          // Partial or non-JSON line — ignore; usage arrives whole or not at all.
        }
      }
    };

    const reader = upstream.getReader();

    /** Drain the rest of upstream without emitting, so a late usage chunk is still seen. */
    const drainInBackground = async () => {
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) scan(decoder.decode(value, { stream: true }));
        }
      } catch {
        // Upstream died mid-stream; bill what we saw.
      } finally {
        settle();
      }
    };

    const instrumented = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            settle();
            controller.close();
            return;
          }
          if (value) {
            scan(decoder.decode(value, { stream: true }));
            controller.enqueue(value);
          }
        } catch (err) {
          settle();
          controller.error(err);
        }
      },
      cancel() {
        // The customer went away. Their tokens were still consumed, so keep reading upstream
        // to learn the final usage, then debit. Do NOT settle() here with a partial value.
        void drainInBackground();
      },
    });

    return new Response(instrumented, {
      status: res.status,
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      },
    });
}
