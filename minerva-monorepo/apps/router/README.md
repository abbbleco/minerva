# Minerva Router

OpenAI-compatible credits gateway. The **only** component that holds upstream inference
credentials (`OPENROUTER_API_KEY`). Hermes Desktop and the portal authenticate with a
per-agency `qkt_sec_*` key; the router resolves the tenant, gates on subscription +
credits, relays to OpenRouter, meters usage, and debits the ledger.

Production: `https://minrouter.abbble.co.za` · Portal: `https://portal.abbble.co.za`
(Desktop key minting lives at `/console/hermes`.)

## Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/health` | none | `200 ok` / `503 degraded`; checks ledger writability + upstream config |
| `GET` | `/v1/models` | Bearer | Tier-filtered: free keys see free models only — this is the security boundary `minerva model` reads |
| `POST` | `/v1/chat/completions` | Bearer | OpenAI shape; `model` omitted → free meta-router (`minerva/openrouter-free`, cost $0); unknown `model` → `400 unknown_model` |
| `POST` | `/v1/embeddings` | Bearer | Untiered single model, still consumes credits |
| `GET` | `/v1/credits` | Bearer | `{ balance, used, currency: "USD", reset_at, plan }`; `503` when the summary is unreadable (unknown ≠ zero) |

Streaming: standard SSE. The router requests `include_usage` so the final chunk carries
token counts for debit; a client disconnect still bills (stream drained in background).
Responses carry `x-minerva-model` (resolved wire ID) and `x-minerva-request-id`.
Send `x-minerva-request-id` to make retries idempotent — without it, an unkeyed retry
debits twice.

## Hermes Desktop setup

1. Portal → Console → **Hermes**: mint a desktop key (server purpose, e.g. `hermes-desktop`).
   Shown once — store it in the OS keychain, never in a repo.
2. Hermes provider config:
   ```yaml
   base_url: https://minrouter.abbble.co.za/v1
   api_key: <qkt_sec_-key-from-portal>
   # omit model for the free router, or: minerva/openrouter-free
   # paid plans: any id listed by GET /v1/models with your key
   ```
3. Test: `curl -s https://minrouter.abbble.co.za/v1/models -H "Authorization: Bearer <key>"`.
   One key per machine; revoke a lost key under Console → API keys and that machine stops
   authenticating immediately.

Model IDs are `minerva/<upstream-with-/-as-->`, e.g. `minerva/anthropic-claude-opus-4.6`.
The legacy `qontxt/` prefix, bare upstream IDs, and bare slugs are also accepted
(`src/catalog.ts#resolveModel`). Paid catalog + prices are pinned in `src/catalog.ts`
(prices are USD/1M tokens, snapshotted 2026-09-29 — re-snapshot + cost-model review on
change); free tier is the `:free` entries plus the `openrouter/free` meta-router.

## Errors → portal action

| Status | `code` | Meaning | Send the user to |
|---|---|---|---|
| `401` | `unauthorized` / `invalid_key` / `key_inactive` / `key_expired` | cannot attribute spend → not served | Console → Hermes (mint fresh key) |
| `403` | `suspended` | agency suspended | support |
| `402` | `billing_required` | subscription `past_due`/`expired` | Console → Billing |
| `402` | `upgrade_required` | free key hit a paid model (`allowed_models` in body) | omit `model`, or Console → Billing to upgrade |
| `402` | `credits_exhausted` | paid-model balance ≤ 0 (free models never trip this) | top-up / monthly grant, see Console → Usage |
| `429` | `rate_limited` | upstream busy, propagated faithfully — back off, don't treat as outage | retry, or omit `model` for the meta-router |
| `502` | `upstream_error` | upstream failed | retry later |

Failure posture (deliberate): auth failure is fail-**closed** (401, we can't attribute
spend); unreadable balance/quota and metering failure are fail-**open** (serve — a false
402 is an outage for every tenant at once, a missed debit is a finance ticket caught by
nightly ledger↔upstream recon). See `src/gates.ts`, `src/tenant.ts`.

## Deploy env

Same Supabase project as the portal, same `@minerva/billing` values on both hosts or
grants ≠ gates.

| Var | Required | Notes |
|---|---|---|
| `PORT` | – | default `8090` |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | live | tenant resolution + ledger (service key, never browser) |
| `OPENROUTER_API_KEY` | live | upstream inference — **router only**, never the portal |
| `OPENROUTER_SITE_URL` / `OPENROUTER_APP_NAME` | – | upstream attribution headers |
| `MINERVA_EMBEDDING_MODEL` | – | embeddings model override |
| `MINERVA_ROUTER_STUB` | – | `1` = canned bytes + scriptable 402s, no DB/upstream. Must be `0`/unset in prod |
| `MINERVA_CORS_ORIGINS` | – | comma-separated browser origins, default `https://portal.abbble.co.za,localhost:3000,localhost:3001`. Native clients ignore CORS |
| `BILLING_CURRENCY` / `BILLING_*` / `MINERVA_FREE_*` | – | must match portal or the two sides disagree on price |

```bash
docker build -f apps/router/Dockerfile -t minerva-router .  # context MUST be the monorepo root (workspace:* deps)
pnpm --filter @minerva/router test    # contract suite: catalog, gates, pricing, CORS, upstream, vercel entry
```

## Vercel deploy

The Hono app is platform-agnostic (`src/app.ts`). Long-lived hosts boot it via
`src/index.ts` (`@hono/node-server` + `PORT`); Vercel serves it via the catch-all
`api/[[...route]].ts` (`hono/vercel` adapter, `maxDuration = 60`). No build step is
needed — the function bundles TypeScript sources, including the `@minerva/*` workspace
packages, at deploy time. After-response ledger debits go through `src/after.ts`, which
uses Vercel's `waitUntil` when registered and keeps fire-and-forget otherwise, so
Docker/Node behaviour is unchanged.

1. Vercel project → Root Directory `apps/router`. Enable **Include source files outside
   of the Root Directory** (needed for the `workspace:*` packages above the root).
2. Set env vars from the table above (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `OPENROUTER_API_KEY`, plus the `BILLING_*` / `MINERVA_FREE_*` values matching the
   portal). `PORT` is ignored; `MINERVA_ROUTER_STUB` must be unset/`0` in prod.
3. Deploy. `/health`, `/v1/models`, `/v1/credits`, `/v1/chat/completions`,
   `/v1/embeddings` are all served by the one function.

Limits (why Docker stays the primary prod target): Hobby functions cap at 10s, so long
SSE streams need Pro + Fluid (`maxDuration = 60` is configured in code and
`vercel.json`); a client disconnect mid-stream can still lose the background usage drain
that a long-lived process would finish, in which case nightly ledger↔upstream recon
catches the drift instead.

CORS is allowlist-only (`hono/cors`, no credentials); `/api/internal/*` on the portal
stays loopback + shared-secret (`apps/web/lib/internal-auth.ts`) — portal and router
coordinate through the DB, not HTTP.
