# ABBBLE Portal (Minerva)

User-facing portal at `https://portal.abbble.co.za` — the ABBBLE Portal look from
`images/minerva/` (dark navy, NOT the emerald `DESIGN.md` system), backed by the
same Supabase project + `@minerva/billing` numbers as `apps/web` and `apps/router`.

## Routes

| Route | Design source | Notes |
|---|---|---|
| `/` | `overview.png` | Everything to Power Minerva Agent + Why + Getting Started + Included + Subscription |
| `/models` | `models.png` | Active Promos + Free Models + All Models (live `GET /v1/models`, catalog fallback) |
| `/plans` | `pricing.png` | FREE $0 / PLUS $20 / SUPER $100 / ULTRA $200 |
| `/login`, `/signup` | `signup.png` | Supabase email OTP + Google/Microsoft/GitHub OAuth |
| `/download` | `sidepanel_download_minerva.png` | Install Minerva sidepanel |
| `/minerva` (`/hermes` redirects) | console/hermes port | Minerva dashboard connection: router address, desktop key mint, config snippet, curl test, 401/402 map, dashboard link |
| `/api-docs`, `/help`, `/terms`, `/privacy` | sidebar RESOURCES | Minimal real content so no sidebar link 404s |

Placeholder art in `public/placeholders/` is copied from
`images/minerva/placeholder_images/` (`images.jpg`, `img_7895.jpg`, `Minerva.jpg`).

## Minerva dashboard connection

Minerva dashboard = `minerva dashboard` (local web UI, port 9119). The portal:

1. Shows the router address (`MINERVA_ROUTER_URL`, default `https://minrouter.abbbleco.workers.dev/v1`).
2. Mints a per-machine desktop key (`POST /api/portal/keys`, purpose `server`, `qkt_sec_*` Bearer).
3. Prints the Minerva provider snippet (`base_url` + `api_key`) + `curl /v1/models` test.
4. Maps errors → portal action (401 mint fresh key, 402 billing/upgrade/credits, 429 retry, 502 retry).
5. Links out to the dashboard (`NEXT_PUBLIC_HERMES_DASHBOARD_URL`, default `http://127.0.0.1:9119`)
   with the token handoff explained — the portal never proxies the dashboard.

## Env

See `.env.example`. Same Supabase project as web/router. Upstream inference creds
(`OPENROUTER_API_KEY`) live in `apps/router` ONLY — never here.

```bash
pnpm --filter @minerva/portal dev      # :3002
pnpm --filter @minerva/portal typecheck
pnpm --filter @minerva/portal build
```

## Paystack plans (subscriptions)

Tiers bill in ZAR through Paystack (`PAYSTACK_SECRET_KEY`, test vs live by key
prefix). Dashboard plan codes must price-match `@minerva/billing` — checkout
refuses on drift. Provision (idempotent, reuses matches) per environment:

```bash
export PAYSTACK_SECRET_KEY=sk_test_...
pnpm --filter @minerva/portal paystack:plans -- --dry-run   # preview
pnpm --filter @minerva/portal paystack:plans                 # create test plans
export PAYSTACK_SECRET_KEY=sk_live_...
pnpm --filter @minerva/portal paystack:plans -- --live       # create live plans
```

Copy the printed `PAYSTACK_PLAN_*` codes into the deploy env, register
`<portal>/api/billing/paystack/webhook` as the webhook URL, and apply
migration `044_paystack_billing.sql`.
