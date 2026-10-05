# CORE_EDITS — hermes-agent files changed this session

Tracker for every in-tree edit made while building the ABBBLE portal, merging
portal/dashboard pricing, and dual-naming the CLI (`hermes` ↔ `minerva`).
New files marked `(new)`. Generated output (`.next/`, `node_modules/`) excluded.

## 1. Portal app — `minerva-monorepo/apps/portal/` (new app, `@minerva/portal`)

Scaffold:
- `package.json`, `tsconfig.json`, `next.config.ts` (`/hermes` → `/minerva` redirect), `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore`, `.env.example`, `Dockerfile`, `README.md`, `proxy.ts` (Supabase session refresh)

Shell / theme (dark-navy Nous look, NOT `DESIGN.md` emerald):
- `app/layout.tsx` (root layout, mobile nav, metadata)
- `app/globals.css` (theme tokens, Rules Compressed `@font-face`, `nous-*` classes)
- `app/components/sidebar.tsx` (collapsible: full panel ↔ icon rail)
- `app/components/topbar.tsx`, `footer.tsx`, `auth-card.tsx` (Supabase email OTP + OAuth)
- `app/components/desktop-rail.tsx` (new — collapsed Install panel rail, `// DOWNLOAD` arrow folds back)
- `app/lib/supabase-browser.ts`, `app/lib/supabase-server.ts` (anon-key SSR client, router/dashboard URLs)
- `public/fonts/RulesCompressed-Regular.woff2`, `RulesCompressed-Medium.woff2` (copied from `web/public/fonts/`)
- `public/placeholders/{images,img_7895,Minerva}.jpg` (copied from `images/minerva/placeholder_images/`)

Pages (ABBBLE/Minerva rebrand applied):
- `app/page.tsx` (overview: hero, Why, subscription tiers)
- `app/components/getting-started.tsx` (new — API/TUI/GUI columns, placeholder shots, outline CTAs)
- `app/components/models-table.tsx` (new — scrollable live catalog box)
- `app/models/page.tsx`, `app/models/models-client.tsx` (promos, free chips, paginated table)
- `app/plans/page.tsx` (FREE/PLUS/SUPER/ULTRA, figures derived from `@minerva/billing`)
- `app/lib/plans.ts` (display tiers; price/credits/rollover derived from package)
- `app/login/page.tsx`, `app/signup/page.tsx`
- `app/download/page.tsx` (expanded Install panel; header `→` folds back to `/`)
- `app/minerva/page.tsx`, `app/minerva/minerva-connect.tsx` (renamed from `app/hermes/`; router address, desktop key mint, config snippet, error map, dashboard link-out)
- `app/api-docs/page.tsx`, `app/help/page.tsx`, `app/terms/page.tsx`, `app/privacy/page.tsx`
- `app/api/health/route.ts`, `app/api/portal/session/route.ts`, `app/api/portal/keys/route.ts`, `app/api/portal/models/route.ts` (OpenRouter public list → router → pinned fallback)

## 2. Pricing merge — portal tiers canonical, `pro` retired

- `minerva-monorepo/packages/billing/src/plans.ts` — `PlanId = free|plus|super|ultra|agency`; USD portal tiers ($20/$100/$200 → $22/$110/$220 via 1.1x bonus; rollover 10/50/100); legacy `agency` ZAR preserved; `pro` removed; new `rolloverCapForPlan()`, `portalBonusMultiplier()`, `PaidPlan.currency`
- `minerva-monorepo/packages/database/migrations/034_portal_tiers.sql` (new — `pro`→`plus`, CHECK enums, registry rows)
- `minerva-monorepo/apps/router/src/gates.ts` — `Plan` union extended (logic unchanged)
- `minerva-monorepo/apps/router/tests/billing-tiers.test.ts` (new — 7 tier tests)
- `minerva-monorepo/apps/router/tests/gates.test.ts` — base fixture plan `pro`→`plus`
- `hermes_cli/web_routers/billing.py` — `_PAID_PLANS = (plus,super,ultra,agency)`
- `tests/hermes_cli/test_billing_summary.py` — portal-tier cases (super active, plus past_due)

## 3. CLI dual naming — `minerva` ↔ `hermes` (both families work)

- `pyproject.toml [project.scripts]` — added `minerva`, `minerva-agent`, `minerva-acp`
- `minerva` (new) — root wrapper mirroring `hermes`
- `hermes_cli/_parser.py` — `CLI_NAMES`, `CLI_ENTRY_BASENAMES`, `invocation_prog()`; top parser `prog=` follows argv[0]
- `hermes_cli/_launchers.py` — `ENTRY_POINTS` 6-pack; `WINDOWS_BIN_LAUNCHERS` +minerva pair; venv-bound needles, owned-launcher paths, ACP sibling-forwarder, POSIX links, `minerva-agent` convenience, `__main__`/publish count checks vs `WINDOWS_BIN_LAUNCHERS`
- `hermes_cli/_install_repair.py` — `_WINDOWS_BIN_LAUNCHERS` +minerva pair
- `hermes_cli/gateway.py`, `hermes_cli/venv_sync.py` — launcher publish count checks vs `WINDOWS_BIN_LAUNCHERS`
- `hermes_cli/update_cmd_windows.py` — holder entry matcher + exe-name guard + serve-relaunch lookup accept minerva
- `gateway/status.py` — gateway command-line matcher accepts minerva entry
- `hermes_cli/relaunch.py` — `resolve_hermes_bin()` prefers same-family binary, cross-falls-back
- `acp_adapter/entry.py` — `prog=` follows alias; setup re-entry keeps sibling family
- `agent/legacy_cli.py` — `prog=` follows alias
- `tests/hermes_cli/test_cli_binary_aliases.py` (new), gateway matcher + holder classifier params extended

## 4. Spawn switch — services + desktop backend spawn `minerva`

- `hermes_cli/_launchers.py` — `installation_command()` emits `.hermes/bin/minerva` (systemd ExecStart, launchd plist, timestamp wrapper all follow; old `hermes` units still match legacy markers)
- `apps/desktop/electron/updater-process.ts` — `resolveInstallationLauncher` + `userBinLaunchers` prefer minerva, hermes fallback
- `apps/desktop/electron/backend-ownership.ts` — `backendCommandMatches` accepts minerva
- `apps/desktop/electron/windows-hermes-path.ts` — venv-shim basename accepts minerva
- `apps/desktop/electron/venv-holder-select.ts` — `minerva.exe` counts as external holder
- Desktop tests: minerva rows in `backend-ownership` + `venv-holder-select` + `windows-hermes-path`; new `resolveInstallationLauncher` preference test in `updater-process.test.ts`
- Python tests: `installation_command` minerva assertion in `test_cli_binary_aliases.py`; launcher-publication suites repointed at `WINDOWS_BIN_LAUNCHERS`
- Unit names (`hermes-gateway.service`, `ai.hermes.gateway`) deliberately unchanged — only the spawned binary switched

## 6. ABBBLE Portal auth + pricing (portal is the authority)

Portal (`minerva-monorepo/apps/portal/`):
- `packages/database/migrations/035_portal_device_codes.sql` (new — single-use device sessions, service-role-only)
- `app/api/portal/device/start|poll|approve/route.ts` (new — code mint, one-time key handoff, Supabase-authed approval)
- `app/device/page.tsx`, `app/device/device-approve.tsx` (new — approve a device code while signed in)
- `app/api/portal/plans/route.ts` (new — public tiers catalog, CORS-open GET for the desktop)

Backend (`hermes_cli/`, `tests/`):
- `hermes_cli/auth.py` — `get_abbble_auth_status()` (MINERVA_ROUTER_KEY presence)
- `hermes_cli/web_server_oauth.py` — `abbble` catalog entry (first), `_abbble_portal_base_url()`, `_abbble_poller` (persists minted key, cancel-safe)
- `hermes_cli/web_routers/oauth.py` — `_start_abbble_device_code`, `_DEVICE_CODE_STARTERS` entry, `_PROVIDER_STATUS` card, `abbble` disconnect branch (removes router key)
- `tests/hermes_cli/test_web_oauth_abbble.py` (new — 10 tests: catalog/start/poll-approved/denied/consumed/status/disconnect/404)

Desktop (`apps/desktop/`):
- `src/components/onboarding/index.tsx` (+ test) — FEATURED_ID `nous`→`abbble`
- `src/app/settings/constants.ts` — NOUS_ group → MINERVA_ group (ABBBLE Portal, portal.abbble.co.za)
- `src/app/settings/billing/abbble-plans-section.tsx` (+ test) — live portal tiers in billing settings; mounted in `index.tsx`
- `src/app/settings/billing/use-billing-state.ts` (+ fallback test) — fallbacks → portal.abbble.co.za
- Relinked: gateway-settings agents → `/minerva`, boot-failure → portal root, diagnostics help → `/help`
- i18n `portalPlans` block: `en.ts`, `fr.ts`, `de.ts`, `es.ts`, `types.ts` (others fall back to English)
- Untouched by design: Nous billing RPC flows, Nous free-tier transfer flow, installer/docs URLs, remote-host candidates, `hermes-bots` persisted IDs

## 5. Desktop dev fix — undeclared test deps (pre-existing, blocked `pnpm dev`)

- `apps/desktop/package.json` — added missing devDependencies the electron tests already imported (`app-builder-lib@27.0.0-alpha.6`, `ws@8.22.0`, `@types/ws@^8.5.13`); `tsc --build tsconfig.electron.json` (the `dev:electron` gate) failed without them on a clean install
