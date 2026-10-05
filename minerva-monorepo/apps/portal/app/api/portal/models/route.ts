import { NextResponse } from "next/server";
import { routerBaseUrl } from "@/app/lib/supabase-server";

export const dynamic = "force-dynamic";

const OPENROUTER_MODELS_URL =
  process.env.OPENROUTER_MODELS_URL ?? "https://openrouter.ai/api/v1/models";

const FALLBACK = [
  { id: "minerva/openrouter-free", name: "Free Models Router (auto)", inPer1M: 0, outPer1M: 0, free: true, context: 128000 },
  { id: "minerva/qwen-qwen3.8-27b:free", name: "Qwen3.8 27B (free)", inPer1M: 0, outPer1M: 0, free: true, context: 262144 },
  { id: "minerva/liquid-lfm-2.5-2.6b:free", name: "LFM 2.5 2.6B (free)", inPer1M: 0, outPer1M: 0, free: true, context: 65536 },
  { id: "minerva/anthropic-claude-opus-4.6", name: "Claude Opus 4.6", inPer1M: 5, outPer1M: 25, free: false, context: 200000 },
  { id: "minerva/anthropic-claude-sonnet-4.6", name: "Claude Sonnet 4.6", inPer1M: 3, outPer1M: 15, free: false, context: 200000 },
  { id: "minerva/google-gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", inPer1M: 2, outPer1M: 12, free: false, context: 1048576 },
  { id: "minerva/google-gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", inPer1M: 0.25, outPer1M: 1.5, free: false, context: 1048576 },
];

interface OpenRouterEntry {
  id: string;
  name?: string;
  pricing?: { prompt?: number | string; completion?: number | string };
  context_length?: number;
}

function toRow(m: OpenRouterEntry, prefix: string) {
  const prompt = Number(m.pricing?.prompt ?? NaN);
  const completion = Number(m.pricing?.completion ?? NaN);
  const inPer1M = Number.isFinite(prompt) ? prompt * 1_000_000 : null;
  const outPer1M = Number.isFinite(completion) ? completion * 1_000_000 : null;
  return {
    id: `${prefix}${m.id}`,
    name: m.name ?? m.id,
    inPer1M,
    outPer1M,
    free: inPer1M === 0 && outPer1M === 0,
    context: m.context_length ?? null,
    promoPct: null,
  };
}

/**
 * Full model list for the portal. Sources, in order:
 *  1. OpenRouter's public model list (no key needed — the /models endpoint is
 *     unauthenticated). Upstream inference creds still live in apps/router ONLY;
 *     this route only READS the public catalog, it never calls inference.
 *  2. The Minerva router with the server key, when configured (tier-filtered view).
 *  3. The pinned catalog fallback, so the UI never blanks.
 * Per-key tier filtering still happens in Minerva via `GET /v1/models` with its own key.
 */
export async function GET() {
  try {
    const res = await fetch(OPENROUTER_MODELS_URL, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const json = (await res.json()) as { data?: OpenRouterEntry[] };
      const models = (json.data ?? [])
        .filter((m) => typeof m?.id === "string" && m.id.length > 0)
        .map((m) => toRow(m, ""));
      if (models.length > 0) return NextResponse.json({ models, live: true, source: "openrouter" });
    }
  } catch {
    // Fall through to the router, then the pinned catalog.
  }

  const serverKey = process.env.MINERVA_ROUTER_KEY;
  if (serverKey) {
    try {
      const res = await fetch(`${routerBaseUrl()}/v1/models`, {
        headers: { Authorization: `Bearer ${serverKey}` },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const json = (await res.json()) as { data?: OpenRouterEntry[] };
        const models = (json.data ?? [])
          .filter((m) => typeof m?.id === "string" && m.id.length > 0)
          .map((m) => toRow(m, ""));
        if (models.length > 0) return NextResponse.json({ models, live: true, source: "router" });
      }
    } catch {
      // Fall through to the pinned catalog.
    }
  }
  return NextResponse.json({ models: FALLBACK, live: false, source: "catalog" });
}
