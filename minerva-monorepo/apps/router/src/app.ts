/**
 * Minerva Router — OpenAI-compatible credits gateway (the Hono app).
 *
 * Platform-agnostic by design: it takes a request and returns a response, nothing more.
 * - Long-lived Node boots it via `./index.js` (`serve()` + `PORT`).
 * - Vercel serves it via `api/[[...route]].js` (`hono/vercel` adapter).
 *
 * Import this module directly in tests and serverless entries. Importing it must never bind
 * a port or start a server — that lives in `./index.js` only.
 *
 * The ONLY component that holds upstream inference credentials. The engine authenticates with a
 * per-agency `qkt_sec_*` key; the router authenticates the tenant, gates, relays, meters and
 * debits.
 *
 * Two modes:
 *   - stub (`MINERVA_ROUTER_STUB=1`): canned bytes + scriptable 402 matrix. No DB, no upstream.
 *   - live: resolveTenant -> evaluateGates -> upstream -> debitInference.
 *
 * Failure posture (plan §3.4.2 / rev.4 C5), stated once here rather than scattered:
 *   - auth failure          -> 401/403. We cannot attribute spend, so we do not serve.
 *   - billing past_due      -> 402 `billing_required`.
 *   - model not on the tier -> 402 `upgrade_required`.
 *   - balance <= 0          -> 402 `credits_exhausted`.
 *   - balance UNREADABLE    -> serve. A false 402 is an outage for every tenant at once.
 *   - metering failure      -> serve. Nightly ledger↔upstream recon catches the drift.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { DEFAULT_FREE_MODEL, FREE_MODELS, modelsForTier, resolveModel, type CatalogEntry } from './catalog.js';
import { evaluateGates } from './gates.js';
import { chatCostUsd, embeddingCostUsd } from './pricing.js';
import { debitInference, ledgerHealth, readCreditSummary } from './ledger.js';
import { resolveTenant, type RouterTenant } from './tenant.js';
import { chatOnce, chatStream, upstreamConfigured, type ChatUsage } from './upstream.js';
import { embed, embeddingsConfigured } from './embeddings.js';
import { afterWork } from './after.js';
import {
  stubChatJson,
  stubChatStream,
  stubCredits,
  stubDenial,
  stubEmbeddings,
  stubModels,
  stubResolveModel,
  stubScenario,
  type StubScenario,
} from './stub.js';

const STUB = process.env.MINERVA_ROUTER_STUB === '1';

export const app = new Hono();

// CORS — the router is called from browsers (portal console, key-test buttons) as well as
// from native clients (Hermes desktop, which ignores CORS). Only the portal origin may call
// it from a browser; everything else gets no `Access-Control-Allow-Origin` and the browser
// blocks the read. Native clients are unaffected either way.
//
// Configure with `MINERVA_CORS_ORIGINS` (comma-separated, e.g.
// `https://portal.abbble.co.za,https://studio.abbble.co.za`). Defaults cover production and
// local dev. Read per request (not at module load) so tests can set the env.
const DEFAULT_CORS_ORIGINS = [
  'https://portal.abbble.co.za',
  'http://localhost:3000',
  'http://localhost:3001',
];

function allowedCorsOrigins(): Set<string> {
  const raw = process.env.MINERVA_CORS_ORIGINS;
  if (raw === undefined || raw.trim() === '') return new Set(DEFAULT_CORS_ORIGINS);
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().replace(/\/+$/, ''))
      .filter(Boolean)
  );
}

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return null;
      const allowed = allowedCorsOrigins();
      return allowed.has(origin.replace(/\/+$/, '')) ? origin : null;
    },
    allowHeaders: ['Authorization', 'Content-Type', 'x-minerva-request-id'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    exposeHeaders: ['x-minerva-model', 'x-minerva-request-id'],
    maxAge: 600,
    credentials: false,
  })
);

app.get('/health', async (c) => {
  if (STUB) {
    return c.json({ status: 'ok', mode: 'stub', upstreamConfigured: false });
  }
  // Deep health: proves the ledger is writable, not merely that the process is alive. A router
  // that reports healthy while unable to debit would silently give away inference.
  const ledger = await ledgerHealth();
  const upstream = upstreamConfigured();
  const ok = ledger.ok && upstream;
  return c.json(
    {
      status: ok ? 'ok' : 'degraded',
      mode: 'live',
      ledger: ledger.ok ? 'ok' : `error: ${ledger.error ?? 'unknown'}`,
      upstream: upstream ? 'configured' : 'missing OPENROUTER_API_KEY',
      embeddings: embeddingsConfigured() ? 'configured' : 'missing OPENROUTER_API_KEY',
    },
    ok ? 200 : 503
  );
});

app.get('/v1/models', async (c) => {
  if (STUB) {
    const isPaid = (c.req.header('authorization') ?? '').includes('paid');
    return c.json(stubModels(isPaid));
  }

  const tenant = await resolveTenant(c.req.header('authorization'));
  if (!tenant.ok) return c.json({ error: { code: tenant.code, message: tenant.message } }, tenant.status);

  // Tier filtering is the security boundary: a free key must never see a priced model, because
  // `minerva model` reads this list.
  const isPaid = tenant.tenant.plan !== 'free';
  return c.json({
    object: 'list',
    data: modelsForTier(isPaid).map((e) => ({ id: e.wireId, object: 'model', created: 0, owned_by: 'minerva' })),
  });
});

app.get('/v1/credits', async (c) => {
  if (STUB) return c.json(stubCredits());

  const tenant = await resolveTenant(c.req.header('authorization'));
  if (!tenant.ok) return c.json({ error: { code: tenant.code, message: tenant.message } }, tenant.status);

  const summary = await readCreditSummary(tenant.tenant.agencyId);
  if (!summary) {
    // Unknown is not zero. Reporting "0" here would make a healthy tenant think they are out.
    return c.json({ error: { code: 'unavailable', message: 'credit summary is temporarily unavailable' } }, 503);
  }
  return c.json({
    balance: summary.balance,
    used: summary.usedThisMonth,
    currency: 'USD',
    reset_at: summary.resetAt,
    plan: tenant.tenant.plan,
  });
});

app.post('/v1/embeddings', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { input?: unknown };
  const raw = body.input;
  const texts = Array.isArray(raw)
    ? raw.filter((t): t is string => typeof t === 'string')
    : typeof raw === 'string'
      ? [raw]
      : [];

  if (STUB) return c.json(stubEmbeddings(texts));

  if (texts.length === 0) {
    return c.json({ error: { code: 'invalid_input', message: 'input must be a string or string[]' } }, 400);
  }

  const tenant = await resolveTenant(c.req.header('authorization'));
  if (!tenant.ok) return c.json({ error: { code: tenant.code, message: tenant.message } }, tenant.status);

  // Embeddings are not tiered (one model, negligible cost) but they DO consume credits.
  const denied = evaluateGates(gateInput(tenant.tenant, null), FREE_MODELS);
  if (denied) return c.json({ error: { code: denied.code, message: denied.message } }, denied.status);

  try {
    const { vectors, promptTokens } = await embed(texts);
    const cost = embeddingCostUsd(promptTokens);
    // Not awaited: the caller needs their vectors, and a failed debit is a reconciliation
    // problem rather than a request failure. `afterWork` registers the debit with the
    // platform's after-response hook where one exists (Vercel `waitUntil`).
    afterWork(
      debitInference({
        agencyId: tenant.tenant.agencyId,
        costUsd: cost,
        model: 'text-embedding-004',
        promptTokens,
        completionTokens: 0,
        requestId: requestIdFor(c.req.header('x-minerva-request-id'), tenant.tenant.agencyId, 'embed'),
      }),
      'embeddings debit'
    );

    return c.json({
      object: 'list',
      model: 'text-embedding-004',
      data: vectors.map((embedding, index) => ({ object: 'embedding', index, embedding })),
      usage: { prompt_tokens: promptTokens, total_tokens: promptTokens },
    });
  } catch (err) {
    return c.json(
      { error: { code: 'upstream_error', message: err instanceof Error ? err.message : 'embeddings failed' } },
      502
    );
  }
});

app.post('/v1/chat/completions', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    model?: unknown;
    stream?: boolean;
    messages?: unknown;
  };

  const scenario = stubScenario();
  if (STUB && scenario !== 'ok') {
    const denial = stubDenial(scenario as Exclude<StubScenario, 'ok'>);
    return c.json(denial.body, denial.status as 400 | 402);
  }

  const requested = typeof body.model === 'string' ? body.model.trim() : '';

  // An OMITTED model defaults to the free meta-router, which picks a live free model per request.
  // Callers do not have to name a model to get a working one, and the default can never cost
  // anything — a caller who wants a specific (possibly paid) model names it explicitly.
  //
  // A model that IS named but unknown still fails loudly below: that is a caller bug, and
  // silently substituting a different model would make the response unattributable.
  const entry = requested ? resolveModel(requested) : resolveModel(DEFAULT_FREE_MODEL);

  if (STUB) {
    const wireId = entry?.wireId ?? stubResolveModel(requested);
    if (body.stream) {
      return c.body(stubChatStream(wireId), 200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
        'x-minerva-model': wireId,
      });
    }
    return c.json(stubChatJson(wireId));
  }

  if (!entry) {
    return c.json(
      {
        error: {
          code: 'unknown_model',
          message:
            `"${requested}" is not in the Minerva catalog. ` +
            'Omit the model field to use the free router, or use a listed id.',
        },
      },
      400
    );
  }

  const tenant = await resolveTenant(c.req.header('authorization'));
  if (!tenant.ok) return c.json({ error: { code: tenant.code, message: tenant.message } }, tenant.status);

  const denied = evaluateGates(gateInput(tenant.tenant, entry), FREE_MODELS);
  if (denied) {
    return c.json(
      { error: { code: denied.code, message: denied.message, allowed_models: denied.allowedModels } },
      denied.status
    );
  }

  const requestId = requestIdFor(
    c.req.header('x-minerva-request-id'),
    tenant.tenant.agencyId,
    entry.wireId
  );

  const settle = (usage: ChatUsage | null) => {
    if (!usage) {
      // Unknown usage is not zero usage — log so reconciliation can investigate.
      console.error(
        `usage missing for ${entry.wireId} (agency=${tenant.tenant.agencyId}, req=${requestId})`
      );
      return;
    }
    afterWork(
      debitInference({
        agencyId: tenant.tenant.agencyId,
        costUsd: chatCostUsd(entry, {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
        }),
        model: entry.wireId,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        requestId,
      }),
      'chat debit'
    );
  };

  const forward = { ...body, model: entry.upstreamId } as Record<string, unknown>;

  if (body.stream) {
    const res = await chatStream(entry.upstreamId, forward, settle);
    if (!res.ok || !res.body) {
      // Propagate the upstream status instead of flattening every failure to 502.
      //
      // Rate limiting is owned by the upstream APIs, not by this router (owner decision
      // 2026-09-30) — so the router's job is to report their signal faithfully. A 429 means
      // "back off and retry"; answering 502 says "the gateway is broken", which invites the
      // caller to retry immediately and makes the free tier look dead when it is merely busy.
      // Observed live: a pinned free model returned 429 while the meta-router served fine.
      const rateLimited = res.status === 429;
      return c.json(
        {
          error: {
            code: rateLimited ? 'rate_limited' : 'upstream_error',
            message: rateLimited
              ? 'Upstream rate limit reached. Retry shortly, or omit the model to use the free router.'
              : `Upstream returned ${res.status}`,
          },
        },
        rateLimited ? 429 : 502
      );
    }
    const headers = new Headers(res.headers);
    headers.set('x-minerva-model', entry.wireId);
    headers.set('x-minerva-request-id', requestId);
    return new Response(res.body, { status: 200, headers });
  }

  const { status, payload, usage } = await chatOnce(entry.upstreamId, forward);
  settle(usage);
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json',
      'x-minerva-model': entry.wireId,
      'x-minerva-request-id': requestId,
    },
  });
});

/** Build the gate input from a resolved tenant. `model` is null for embeddings. */
function gateInput(tenant: RouterTenant, model: CatalogEntry | null) {
  return {
    billingState: tenant.billingState,
    plan: tenant.plan,
    balanceUsd: tenant.balanceUsd,
    quota: tenant.quota,
    model,
  };
}

/**
 * Idempotency key. Prefer the engine's header — it knows the logical turn and can retry safely.
 * The fallback is unique per call, so an unkeyed retry would debit twice; that is the documented
 * trade-off for a caller that declines to identify its request.
 */
function requestIdFor(header: string | undefined, agencyId: string, discriminator: string | number): string {
  const provided = header?.trim();
  if (provided) return provided.slice(0, 200);
  return `auto:${agencyId}:${discriminator}:${Date.now().toString(36)}`;
}
