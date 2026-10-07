# Minerva Welcome API

Free-tier inference entrypoint at `https://welcome-api.abbbleco.workers.dev/v1`.

A thin policy gate in front of the Minerva router — **not** a second inference
engine. It authenticates guest credentials, enforces "free models only", then
relays to the router **with the caller's own `Authorization` header intact**,
so metering, ledger and attribution land on the caller's agency exactly as if
they had called the router directly. This service holds no upstream credentials
and writes no ledger rows; it only decides whether a request may pass.

## Why a separate service

The Python client's welcome-host fallback (`DEFAULT_NOUS_WELCOME_URL`) needs a
stable origin whose *only* promise is "free tier here". The router's promise is
broader (full catalog, tier gating, billing states). A dedicated origin keeps
the fallback's contract narrow and its failure modes obvious.

## Endpoints

| Route | |
|---|---|
| `GET /health` | liveness + free-model count + upstream router URL |
| `GET /v1/models` | free catalog only, OpenAI list shape (ids, no prices — the price here is always zero) |
| `POST /v1/chat/completions` | gated + relayed, streaming and non-streaming |

## Policy

- **Credential:** Bearer `qkt_sec_*` whose key is active, unexpired, and whose
  agency has no paid subscription. Paid-plan keys are **rejected** (`403
  not_free_tier`) — serving a paying caller free models would be a silent
  downgrade of what they paid for; paid callers belong on the router directly.
- **Model:** requested id must be in `MINERVA_FREE_MODELS` (wire id or upstream
  id — either spelling the router would honour). Anything else is `402
  upgrade_required` with the allowed list, the same code the router returns, so
  clients need no second error path. An omitted model defaults to the router's
  free meta-router and needs no gate decision.
- **Free set:** `MINERVA_FREE_MODELS`, comma-separated wire ids — the same
  variable and format `@minerva/billing` uses. One list, read in two places.

## Deploy

Long-lived (`tsx src/index.ts`, Docker) or serverless (`api/[[...route]].ts` on
Vercel, mirroring the router). Needs `SUPABASE_URL` +
`SUPABASE_SERVICE_ROLE_KEY` (key verification reads tables anon cannot) and
`MINERVA_ROUTER_URL` (default `https://minrouter.abbbleco.workers.dev`).

```bash
MINERVA_FREE_MODELS="minerva/qwen-qwen3.8-27b:free" PORT=8091 \
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  pnpm --filter @minerva/welcome-api dev
```

## Cloudflare Workers deploy

Same app, third target (`src/worker.ts` + `wrangler.toml`; Docker and Vercel
entries untouched) — the same port the router already runs on. Simpler than
the router's: no ledger drain to bridge, so the worker entry is a one-line
re-export of the Hono app; `nodejs_compat` covers `process.env` and
`node:crypto`, and `supabase-js` is fetch-based. The Vercel catch-all stays as
fallback.

```bash
npm i -g wrangler
wrangler login
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
pnpm --filter @minerva/welcome-api run deploy   # `run` is load-bearing: bare `pnpm deploy` is pnpm's own built-in, not the script
```

No `MINERVA_ROUTER_URL` secret needed: the default is already the live router
(`https://minrouter.abbbleco.workers.dev`). Set it only to override.

Verify `/health` then `/v1/models` on the workers.dev URL first
(`welcome-api.abbbleco.workers.dev`); attach `welcome-api.abbbleco.workers.dev`
as a Custom Domain only after that — it is what the Python client's
`DEFAULT_NOUS_WELCOME_URL` points at.
