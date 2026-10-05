/**
 * Stub router (plan §5 Phase 0 step 0.6).
 *
 * Purpose: let Phase 2 build and test engine-side SSE handling, usage accumulation and every
 * 402 path from day one, instead of blocking on Phase 2B. It is deliberately NOT a mock of the
 * business logic — it replays fixed bytes so tests are deterministic, and it scripts the denial
 * matrix so the engine's error handling can be exercised without a database.
 *
 * Delete once Phase 2B.4 gates green.
 */

import { CATALOG, DEFAULT_MODEL, FREE_MODELS, modelsForTier, resolveModel } from './catalog.js';

export type StubScenario =
  | 'ok'
  | 'billing_required'
  | 'upgrade_required'
  | 'credits_exhausted'
  | 'quota_exceeded'
  | 'unknown_model';

export const STUB_SCENARIOS: readonly StubScenario[] = [
  'ok',
  'billing_required',
  'upgrade_required',
  'credits_exhausted',
  'quota_exceeded',
  'unknown_model',
];

/** Fixed usage so ledger maths is reproducible in tests. */
export const STUB_USAGE = { promptTokens: 12_000, completionTokens: 3_000 };

export function stubScenario(): StubScenario {
  const raw = (process.env.MINERVA_ROUTER_STUB_SCENARIO ?? 'ok').trim() as StubScenario;
  return (STUB_SCENARIOS as readonly string[]).includes(raw) ? raw : 'ok';
}

function chunk(model: string, content: string | null, finish: boolean, includeUsage: boolean): string {
  const body: Record<string, unknown> = {
    id: 'chatcmpl-stub',
    object: 'chat.completion.chunk',
    created: 1_770_000_000,
    model,
    choices: [{ index: 0, delta: content === null ? {} : { content }, finish_reason: finish ? 'stop' : null }],
  };
  if (includeUsage) body.usage = { ...STUB_USAGE, total_tokens: STUB_USAGE.promptTokens + STUB_USAGE.completionTokens };
  return `data: ${JSON.stringify(body)}\n\n`;
}

/** OpenAI-compatible SSE stream: N content chunks, a final usage chunk, then `[DONE]`. */
export function stubChatStream(model: string, chunks = 3): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const push = (s: string) => controller.enqueue(encoder.encode(s));
      const tick = () => {
        if (i < chunks) {
          push(chunk(model, `stub-${i} `, false, false));
          i += 1;
          setTimeout(tick, 1);
          return;
        }
        // Usage rides the final chunk so the engine sees one deterministic total.
        push(chunk(model, null, true, true));
        push('data: [DONE]\n\n');
        controller.close();
      };
      tick();
    },
  });
}

export function stubChatJson(model: string): unknown {
  return {
    id: 'chatcmpl-stub',
    object: 'chat.completion',
    created: 1_770_000_000,
    model,
    choices: [{ index: 0, message: { role: 'assistant', content: 'stub response' }, finish_reason: 'stop' }],
    usage: { ...STUB_USAGE, total_tokens: STUB_USAGE.promptTokens + STUB_USAGE.completionTokens },
  };
}

export function stubModels(isPaid: boolean): unknown {
  const created = 1_770_000_000;
  return {
    object: 'list',
    data: modelsForTier(isPaid).map((e) => ({ id: e.wireId, object: 'model', created, owned_by: 'minerva' })),
  };
}

/** 768-dim, preserving the pgvector `<=>` contract and the `match_talent` dim guard. */
export function stubEmbeddings(text: string | string[], dims = 768): unknown {
  const inputs = Array.isArray(text) ? text : [text];
  const vector = (seed: number) =>
    Array.from({ length: dims }, (_, i) => Math.sin(seed + i) * 0.5 + 0.5);
  return {
    object: 'list',
    model: 'text-embedding-004',
    data: inputs.map((t, i) => ({ object: 'embedding', index: i, embedding: vector(t.length + i) })),
    usage: { prompt_tokens: inputs.join(' ').length, total_tokens: inputs.join(' ').length },
  };
}

export function stubCredits(): unknown {
  return {
    balance: 42.5,
    included: 49,
    used: 6.5,
    currency: 'USD',
    reset_at: '2026-10-01T00:00:00Z',
    stub: true,
  };
}

/** Denial bodies, kept in lockstep with `gates.ts` so engine tests assert one shape. */
export function stubDenial(scenario: Exclude<StubScenario, 'ok'>): { status: number; body: unknown } {
  switch (scenario) {
    case 'billing_required':
      return { status: 402, body: { error: { code: 'billing_required', message: 'Subscription is past_due.' } } };
    case 'upgrade_required':
      return {
        status: 402,
        body: {
          error: {
            code: 'upgrade_required',
            message: 'The free plan is limited to free models.',
            allowed_models: [...FREE_MODELS],
          },
        },
      };
    case 'credits_exhausted':
      return { status: 402, body: { error: { code: 'credits_exhausted', message: 'Inference credits exhausted.' } } };
    case 'quota_exceeded':
      return { status: 402, body: { error: { code: 'quota_exceeded', message: 'Monthly quota reached.' } } };
    case 'unknown_model':
      return { status: 400, body: { error: { code: 'unknown_model', message: 'Model is not in the Minerva catalog.' } } };
  }
}

/** Resolve a request model to its wire ID, falling back to the catalog default. */
export function stubResolveModel(requested: unknown): string {
  const id = typeof requested === 'string' ? requested : '';
  const resolved = resolveModel(id);
  if (resolved) return resolved.wireId;
  const fallback = CATALOG.find((e) => e.upstreamId === DEFAULT_MODEL);
  return fallback ? fallback.wireId : 'minerva/unknown';
}
